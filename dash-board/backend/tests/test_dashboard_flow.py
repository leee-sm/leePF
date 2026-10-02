from __future__ import annotations

import asyncio
import unittest
from collections import Counter
from datetime import datetime, timezone
from unittest.mock import patch

import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings
from app.dashboard.errors import ApiProblem
from app.dashboard.inventory import _aging_summary, filter_options, inventory_template, load_rows, query_widgets
from app.dashboard.seed import INITIAL_INVENTORY_DASHBOARD_ID, ensure_initial_inventory_dashboard
from app.dashboard.schemas import DashboardConfig
from app.db import Base, get_db
from app.main import app
from app.models import Dashboard, User


class InProcessClient:
    """Synchronous wrapper for HTTPX's ASGI transport (without TestClient's portal)."""

    def __init__(self) -> None:
        self.cookies: dict[str, str] = {}

    def request(self, method: str, path: str, **kwargs):
        async def send():
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="http://localhost",
                follow_redirects=False,
                cookies=self.cookies,
            ) as client:
                return await client.request(method, path, **kwargs)

        response = asyncio.run(send())
        self.cookies.update(dict(response.cookies))
        return response

    def get(self, path: str, **kwargs):
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs):
        return self.request("POST", path, **kwargs)

    def put(self, path: str, **kwargs):
        return self.request("PUT", path, **kwargs)

    def delete(self, path: str, **kwargs):
        return self.request("DELETE", path, **kwargs)


class DashboardFlowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        self.testing_session = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, expire_on_commit=False)
        Base.metadata.create_all(self.engine)
        self.engine_patch = patch("app.main.engine", self.engine)
        self.engine_patch.start()

        async def override_db():
            db = self.testing_session()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_db
        self.settings = get_settings()
        self.settings_patches = [
            patch.object(self.settings, "app_environment", "development"),
            patch.object(self.settings, "sso_enabled", False),
            patch.object(self.settings, "dev_auto_login", True),
            patch.object(self.settings, "dev_auto_login_sabun", "2210013"),
            patch.object(self.settings, "dev_auto_login_user_sabun", "2210014"),
            patch.object(self.settings, "sso_bootstrap_admin_sabun", "2210013"),
        ]
        for setting_patch in self.settings_patches:
            setting_patch.start()
        self.client = InProcessClient()

    def tearDown(self) -> None:
        app.dependency_overrides.clear()
        for setting_patch in reversed(self.settings_patches):
            setting_patch.stop()
        self.engine_patch.stop()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    @staticmethod
    def write_headers() -> dict[str, str]:
        return {"Origin": "http://localhost", "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/json"}

    def login(self, role: str) -> None:
        response = self.client.get(f"/dev/login?role={role}")
        self.assertEqual(response.status_code, 303)

    def test_admin_to_user_flow_and_unpublish_blocks_access(self) -> None:
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        self.login("admin")
        self.assertEqual(self.client.get("/api/auth/me").json()["roles"], ["ROLE_SYSTEM", "ROLE_USER"])

        created = self.client.post(
            "/api/admin/dashboards",
            headers=self.write_headers(),
            json={"title": "재고 PoC 검증", "description": "시연 흐름", "source_id": "inventory", "template_id": "inventory_overview"},
        )
        self.assertEqual(created.status_code, 201, created.text)
        dashboard = created.json()
        dashboard_id = dashboard["id"]
        self.assertEqual(len(dashboard["draft_config"]["widgets"]), 4)
        first_listing = self.client.get("/api/dashboards").json()
        self.assertEqual([item["id"] for item in first_listing["items"]], [INITIAL_INVENTORY_DASHBOARD_ID])
        self.assertEqual(self.client.get(f"/api/dashboards/{dashboard_id}").status_code, 404)

        detail = self.client.get(f"/api/admin/dashboards/{dashboard_id}").json()
        config = detail["draft_config"]
        config["widgets"][0]["title"] = "총 재고 행 수"
        saved = self.client.put(
            f"/api/admin/dashboards/{dashboard_id}/draft",
            headers=self.write_headers(),
            json={"config": config, "expected_edit_version": 1},
        )
        self.assertEqual(saved.status_code, 200, saved.text)
        self.assertEqual(saved.json()["edit_version"], 2)
        self.assertEqual(saved.json()["draft_config"]["widgets"][0]["title"], "총 재고 행 수")

        stale = self.client.put(
            f"/api/admin/dashboards/{dashboard_id}/draft",
            headers=self.write_headers(),
            json={"config": config, "expected_edit_version": 1},
        )
        self.assertEqual(stale.status_code, 409)

        preview = self.client.post(
            f"/api/admin/dashboards/{dashboard_id}/preview",
            headers=self.write_headers(),
            json={"config": config, "filters": {}, "tables": {}},
        )
        self.assertEqual(preview.status_code, 200, preview.text)
        self.assertEqual(preview.json()["widgets"][0]["value"], 10_759)

        published = self.client.post(
            f"/api/admin/dashboards/{dashboard_id}/publish",
            headers=self.write_headers(),
            json={"expected_edit_version": 2, "expected_published_revision": 0},
        )
        self.assertEqual(published.status_code, 200, published.text)
        self.assertEqual(published.json()["visibility"], "published")
        self.assertEqual(published.json()["published_revision"], 1)

        changed_draft = dict(config)
        changed_draft["title"] = "공개 전용 변경 초안"
        saved_again = self.client.put(
            f"/api/admin/dashboards/{dashboard_id}/draft",
            headers=self.write_headers(),
            json={"config": changed_draft, "expected_edit_version": 2},
        )
        self.assertEqual(saved_again.status_code, 200, saved_again.text)
        self.assertTrue(saved_again.json()["has_unpublished_changes"])
        self.assertEqual(saved_again.json()["draft_config"]["title"], "공개 전용 변경 초안")
        self.assertEqual(saved_again.json()["published_from_edit_version"], 2)
        csrf = self.client.post(
            f"/api/admin/dashboards/{dashboard_id}/preview",
            headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"},
            json={"config": config, "filters": {}, "tables": {}},
        )
        self.assertEqual(csrf.status_code, 403)

        self.login("user")
        self.assertNotIn("ROLE_SYSTEM", self.client.get("/api/auth/me").json()["roles"])
        self.assertEqual(self.client.get("/api/admin/dashboards").status_code, 403)
        listing = self.client.get("/api/dashboards")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual({item["id"] for item in listing.json()["items"]}, {dashboard_id, INITIAL_INVENTORY_DASHBOARD_ID})
        public = self.client.get(f"/api/dashboards/{dashboard_id}").json()
        self.assertEqual(public["config"]["title"], "재고 PoC 검증")
        self.assertEqual(public["config"]["widgets"][0]["title"], "총 재고 행 수")
        options = self.client.get(f"/api/dashboards/{dashboard_id}/filter-options?revision=1&filter_id=manufacturer")
        self.assertEqual(options.status_code, 200, options.text)
        self.assertGreater(len(options.json()["options"]), 0)

        zero = self.client.post(
            f"/api/dashboards/{dashboard_id}/query",
            headers=self.write_headers(),
            json={"published_revision": 1, "filters": {"as_of_date": "2026-09-08"}, "tables": {"w_table": {"page": 1, "page_size": 20}}},
        )
        self.assertEqual(zero.status_code, 200, zero.text)
        self.assertEqual(zero.json()["meta"]["row_count"], 0)
        self.assertEqual(zero.json()["widgets"][0]["value"], 0)
        self.assertEqual(zero.json()["widgets"][1]["items"], [])
        self.assertEqual(zero.json()["widgets"][3]["total"], 0)

        source_row = load_rows("2026-09-10")[0]
        selected = self.client.post(
            f"/api/dashboards/{dashboard_id}/query",
            headers=self.write_headers(),
            json={
                "published_revision": 1,
                "filters": {"as_of_date": "2026-09-10", "manufacturer": [source_row["mnfct"]], "model": [source_row["repDvcId"]]},
                "tables": {},
            },
        )
        self.assertEqual(selected.status_code, 200, selected.text)
        expected_count = sum(1 for row in load_rows("2026-09-10") if row["mnfct"] == source_row["mnfct"] and row["repDvcId"] == source_row["repDvcId"])
        self.assertEqual(selected.json()["widgets"][0]["value"], expected_count)
        self.assertEqual(selected.json()["meta"]["row_count"], expected_count)
        for chart in (widget for widget in selected.json()["widgets"] if widget["type"] == "bar"):
            chart_count = sum(item["value"] for item in chart["items"]) + chart["remaining_value"]
            self.assertEqual(chart_count, expected_count)
            self.assertAlmostEqual(sum(item["share"] for item in chart["items"] if item["share"] is not None), chart["coverage"])
        selected_table = next(widget for widget in selected.json()["widgets"] if widget["type"] == "table")
        self.assertEqual(selected_table["total_value"], expected_count)

        self.login("admin")
        stopped = self.client.post(
            f"/api/admin/dashboards/{dashboard_id}/unpublish",
            headers=self.write_headers(),
            json={"expected_published_revision": 1},
        )
        self.assertEqual(stopped.status_code, 200, stopped.text)
        self.assertEqual(stopped.json()["visibility"], "unpublished")
        self.assertEqual(stopped.json()["published_revision"], 2)
        remaining = self.client.get("/api/dashboards").json()["items"]
        self.assertEqual([item["id"] for item in remaining], [INITIAL_INVENTORY_DASHBOARD_ID])
        self.assertEqual(self.client.get(f"/api/dashboards/{dashboard_id}").status_code, 404)
        self.assertEqual(
            self.client.post(
                f"/api/dashboards/{dashboard_id}/query",
                headers=self.write_headers(),
                json={"published_revision": 1, "filters": {}, "tables": {}},
            ).status_code,
            404,
        )

        deleted = self.client.delete(
            f"/api/admin/dashboards/{dashboard_id}?expected_edit_version=3&expected_published_revision=2",
            headers=self.write_headers(),
            json={},
        )
        self.assertEqual(deleted.status_code, 204, deleted.text)
        self.assertEqual(self.client.get(f"/api/admin/dashboards/{dashboard_id}").status_code, 404)


class InventoryAggregationTests(unittest.TestCase):
    def test_aging_filter_applies_to_all_query_results(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        for bucket, lower, upper in (("0_to_29", 0, 30), ("30_to_59", 30, 60), ("60_to_89", 60, 90), ("90_plus", 90, float("inf"))):
            with self.subTest(bucket=bucket):
                widgets, meta = query_widgets(config, {"aging_bucket": bucket, "manufacturer": ["삼성전자(주)"]})
                expected = [row for row in load_rows(meta["as_of_date"]) if row["mnfct"] == "삼성전자(주)" and lower <= row["outPassovrDay"] < upper]
                self.assertEqual(meta["row_count"], len(expected))
                self.assertEqual(widgets[0]["value"], len(expected))
                self.assertEqual(widgets[-1]["total_value"], len(expected))
                self.assertEqual(sum(item["value"] for item in meta["holders"]), len(expected))
                self.assertEqual(meta["pricing"]["total_amount"], sum(row["outUnitPric"] for row in expected if row["outUnitPric"] > 0))
                for point in meta["inventory_history"]:
                    self.assertEqual(point["row_count"], sum(row["mnfct"] == "삼성전자(주)" and lower <= row["outPassovrDay"] < upper for row in load_rows(point["as_of_date"])))

    def test_invalid_aging_filters_are_rejected(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        for bucket in ("unknown", ["90_plus"], 90, True):
            with self.subTest(bucket=bucket), self.assertRaises(ApiProblem):
                query_widgets(config, {"aging_bucket": bucket})

    def test_price_summary_excludes_unregistered_and_invalid_prices(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        for prices, total, priced in (([100, 100, 200, 0, -1, None, "300", True], 400, 3), ([0, None], None, 0), ([], 0, 0)):
            with self.subTest(prices=prices), patch("app.dashboard.inventory.load_rows", return_value=[{"outUnitPric": value} for value in prices]):
                _, meta = query_widgets(config, {})
                self.assertEqual(meta["pricing"], {"total_amount": total, "priced_count": priced, "unpriced_count": len(prices) - priced})

    def test_aging_buckets_cover_boundaries_and_invalid_values(self) -> None:
        days = [0, 29, 30, 59, 60, 89, 90, 200, -1, None, "30", True]
        aging = _aging_summary([{"outPassovrDay": value} for value in days])
        self.assertEqual([aging[key] for key in ("count_0_to_29", "count_30_to_59", "count_60_to_89", "count_90_plus")], [2, 2, 2, 2])
        self.assertEqual(aging["unavailable_count"], 4)

    def test_holder_counts_follow_filters_and_include_missing_names(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        for filters in ({}, {"manufacturer": ["삼성전자(주)"]}, {"as_of_date": "2026-09-08"}):
            with self.subTest(filters=filters):
                _, meta = query_widgets(config, filters)
                rows = load_rows(meta["as_of_date"])
                if filters.get("manufacturer"):
                    rows = [row for row in rows if row["mnfct"] in filters["manufacturer"]]
                expected = Counter(str(row.get("cpLetr") or "미분류").strip() or "미분류" for row in rows)
                self.assertEqual({item["label"]: item["value"] for item in meta["holders"]}, dict(expected))
                self.assertEqual(sum(item["value"] for item in meta["holders"]), meta["row_count"])
        with patch("app.dashboard.inventory.load_rows", return_value=[{"cpLetr": None}, {"cpLetr": " "}, {"cpLetr": "보유처"}]):
            _, meta = query_widgets(config, {})
        self.assertEqual({item["label"]: item["value"] for item in meta["holders"]}, {"미분류": 2, "보유처": 1})

    def test_unfiltered_query_reads_each_snapshot_once(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        with patch("app.dashboard.inventory.load_rows", wraps=load_rows) as reads:
            widgets, meta = query_widgets(config, {"as_of_date": "2026-09-10", "manufacturer": [], "model": []})
        self.assertEqual(Counter(call.args[0] for call in reads.call_args_list), Counter({"2026-09-08": 1, "2026-09-09": 1, "2026-09-10": 1}))
        self.assertEqual(meta["row_count"], 10_759)
        self.assertEqual(widgets[0]["value"], meta["row_count"])

    def test_unknown_classification_filters_are_still_rejected(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        for dimension in ("manufacturer", "model"):
            with self.subTest(dimension=dimension), self.assertRaises(ApiProblem):
                query_widgets(config, {"as_of_date": "2026-09-10", dimension: ["존재하지 않는 분류"]})

    def test_model_options_follow_selected_manufacturer(self) -> None:
        all_models = {option["value"] for option in filter_options("model")["options"]}
        samsung_models = {option["value"] for option in filter_options("model", manufacturers=["삼성전자(주)"])["options"]}
        expected = {row["repDvcId"] for row in load_rows("2026-09-09") + load_rows("2026-09-10") if row["mnfct"] == "삼성전자(주)"}
        self.assertEqual(samsung_models, expected)
        self.assertLess(len(samsung_models), len(all_models))

    def test_sample_snapshot_row_counts(self) -> None:
        self.assertEqual(len(load_rows("2026-09-08")), 0)
        self.assertEqual(len(load_rows("2026-09-09")), 10_236)
        self.assertEqual(len(load_rows("2026-09-10")), 10_759)

    def test_duplicate_rows_count_and_zero_price_rows_remain_in_total(self) -> None:
        row = {"upldDt": "20260910", "mnfct": "제조사", "repDvcId": "모델", "outUnitPric": 0}
        with patch("app.dashboard.inventory.load_rows", return_value=[row, dict(row)]):
            config = DashboardConfig.model_validate(inventory_template())
            widgets, meta = query_widgets(config, {})
        self.assertEqual(meta["row_count"], 2)
        self.assertEqual(widgets[0]["value"], 2)
        self.assertEqual(widgets[1]["items"][0]["label"], "제조사")
        self.assertEqual(widgets[1]["items"][0]["value"], 2)
        self.assertEqual(widgets[1]["items"][0]["share"], 1)
        self.assertEqual(widgets[2]["items"][0]["label"], "모델")
        self.assertEqual(widgets[2]["items"][0]["value"], 2)
        self.assertEqual(widgets[2]["items"][0]["share"], 1)
        self.assertEqual(widgets[2]["remaining_value"], 0)
        self.assertEqual(widgets[3]["total_value"], 2)

    def test_required_source_aggregates_and_top_ten_coverage(self) -> None:
        rows = load_rows("2026-09-10")
        manufacturers = Counter(row["mnfct"] for row in rows)
        models = Counter(row["repDvcId"] for row in rows)
        self.assertEqual(len(rows), 10_759)
        self.assertEqual(manufacturers["삼성전자(주)"], 9_314)
        self.assertEqual(models["SM-A175NK"], 1_178)

        config = DashboardConfig.model_validate(inventory_template())
        widgets, meta = query_widgets(config, {})
        self.assertEqual(meta["row_count"], 10_759)
        self.assertEqual(meta["snapshot_row_count"], 10_759)
        self.assertEqual(widgets[0]["value"], 10_759)
        manufacturer_chart, model_chart = widgets[1], widgets[2]
        self.assertEqual(manufacturer_chart["category_count"], 9)
        self.assertEqual(sum(item["value"] for item in manufacturer_chart["items"]) + manufacturer_chart["remaining_value"], 10_759)
        self.assertAlmostEqual(sum(item["share"] for item in manufacturer_chart["items"]), 1)
        self.assertEqual(len(model_chart["items"]), 10)
        self.assertEqual(model_chart["items"][0]["label"], "SM-A175NK")
        self.assertEqual(model_chart["items"][0]["value"], 1_178)
        self.assertEqual(model_chart["category_count"], 71)
        self.assertEqual(model_chart["remaining_categories"], 61)
        self.assertEqual(sum(item["value"] for item in model_chart["items"]) + model_chart["remaining_value"], 10_759)
        self.assertAlmostEqual(sum(item["share"] for item in model_chart["items"]) + model_chart["remaining_share"], 1)
        self.assertEqual(widgets[3]["total_value"], 10_759)

    def test_sample_blank_and_zero_values(self) -> None:
        for as_of_date, expected_zeroes in (("2026-09-09", 4_096), ("2026-09-10", 4_666)):
            rows = load_rows(as_of_date)
            fields = set().union(*(row.keys() for row in rows))
            blanks = sum(
                1
                for row in rows
                for field in fields
                if row.get(field) is None or isinstance(row.get(field), str) and not row[field].strip()
            )
            self.assertEqual(blanks, 0)
            self.assertEqual(sum(row["outUnitPric"] == 0 for row in rows), expected_zeroes)
            self.assertEqual(sum(row["outPassovrDay"] == 0 for row in rows), expected_zeroes)

    def test_filter_result_uses_one_row_set_for_metric_charts_and_table(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        widgets, meta = query_widgets(config, {
            "as_of_date": "2026-09-10",
            "manufacturer": ["삼성전자(주)"],
            "model": ["SM-A175NK"],
        })
        self.assertEqual(meta["row_count"], 1_178)
        self.assertEqual(widgets[0]["value"], meta["row_count"])
        for chart in (widget for widget in widgets if widget["type"] == "bar"):
            self.assertEqual(sum(item["value"] for item in chart["items"]) + chart["remaining_value"], meta["row_count"])
        table = next(widget for widget in widgets if widget["type"] == "table")
        self.assertEqual(table["total_value"], meta["row_count"])

    def test_table_query_returns_only_requested_widget(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        table_id = next(widget.id for widget in config.widgets if widget.type == "table")
        widgets, meta = query_widgets(config, {"as_of_date": "2026-09-10"}, {table_id: {"page": 1, "sort": "label_asc"}}, [table_id])
        self.assertEqual([widget["id"] for widget in widgets], [table_id])
        self.assertEqual(widgets[0]["sort"], "label_asc")
        self.assertEqual(meta["row_count"], 10_759)

    def test_filter_zero_is_distinct_from_empty_snapshot(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        widgets, meta = query_widgets(config, {
            "as_of_date": "2026-09-10",
            "manufacturer": ["삼성전자(주)"],
            "model": ["Z2339K"],
        })
        self.assertEqual(meta["snapshot_row_count"], 10_759)
        self.assertEqual(meta["row_count"], 0)
        self.assertEqual(widgets[0]["value"], 0)

    def test_empty_snapshot_is_a_normal_zero_row_result(self) -> None:
        config = DashboardConfig.model_validate(inventory_template())
        widgets, meta = query_widgets(config, {"as_of_date": "2026-09-08"})
        self.assertEqual(meta["snapshot_row_count"], 0)
        self.assertEqual(meta["row_count"], 0)
        self.assertEqual(widgets[0]["value"], 0)
        self.assertEqual(widgets[1]["total_value"], 0)
        self.assertEqual(widgets[2]["total_value"], 0)
        self.assertEqual(widgets[3]["total_value"], 0)


class InitialDashboardSeedTests(unittest.TestCase):
    def test_startup_seeds_for_an_existing_user(self) -> None:
        engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(engine)
        sessions = sessionmaker(bind=engine, expire_on_commit=False)
        try:
            with sessions() as db:
                now = datetime.now(timezone.utc)
                db.add(User(sabun="existing-user", display_name="Existing User", is_active=True, created_at=now, last_login_at=now))
                db.commit()

            async def start_and_stop_app():
                async with app.router.lifespan_context(app):
                    pass

            with patch("app.main.engine", engine):
                asyncio.run(start_and_stop_app())
            with sessions() as db:
                row = db.get(Dashboard, INITIAL_INVENTORY_DASHBOARD_ID)
                self.assertIsNotNone(row)
                self.assertEqual(row.visibility, "published")
                self.assertEqual(row.published_revision, 1)
        finally:
            Base.metadata.drop_all(engine)
            engine.dispose()

    def test_seed_is_idempotent_and_preserves_admin_edits(self) -> None:
        engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(engine)
        sessions = sessionmaker(bind=engine, expire_on_commit=False)
        try:
            with sessions() as db:
                now = datetime.now(timezone.utc)
                user = User(
                    sabun="seed-owner", display_name="Seed Owner", is_active=True,
                    created_at=now,
                    last_login_at=now,
                )
                db.add(user)
                db.commit()
                self.assertTrue(ensure_initial_inventory_dashboard(db, user.id))
                row = db.get(Dashboard, INITIAL_INVENTORY_DASHBOARD_ID)
                edited = dict(row.draft_config)
                edited["title"] = "관리자 편집 설정"
                row.draft_config = edited
                db.commit()
                self.assertFalse(ensure_initial_inventory_dashboard(db, user.id))
                db.refresh(row)
                self.assertEqual(row.draft_config["title"], "관리자 편집 설정")
                self.assertEqual(row.published_config["title"], "재고 현황")
        finally:
            Base.metadata.drop_all(engine)
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
