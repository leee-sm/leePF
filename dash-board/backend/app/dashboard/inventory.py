from __future__ import annotations

import json
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from app.dashboard.errors import ApiProblem
from app.dashboard.schemas import (
    BarWidget,
    DashboardConfig,
    FilterConfig,
    MetricWidget,
    TableWidget,
)
from app.config import PROJECT_ROOT


DATE_FILES = {
    "2026-09-08": "inventory_20260908.json",
    "2026-09-09": "inventory_20260909.json",
    "2026-09-10": "inventory_20260910.json",
}
MAX_SAMPLE_ROWS = 50_000
MAX_SELECTIONS = 50
AGING_BUCKETS = {"0_to_29": (0, 30), "30_to_59": (30, 60), "60_to_89": (60, 90), "90_plus": (90, None)}
DIMENSIONS = {
    "manufacturer": {"label": "제조사", "field": "mnfct"},
    "model": {"label": "모델", "field": "repDvcId"},
}
METRICS = {"inventory_count": {"label": "재고 수량", "unit": "대"}}


def inventory_template(title: str = "재고 현황", description: str = "기준일별 재고 확인") -> dict[str, Any]:
    return {
        "schema_version": 1,
        "title": title,
        "description": description,
        "source_id": "inventory",
        "filters": [
            {"id": "as_of_date", "label": "기준일", "default": {"mode": "latest"}, "required": True},
            {"id": "manufacturer", "label": "제조사", "default": [], "required": False},
            {"id": "model", "label": "모델", "default": [], "required": False},
        ],
        "widgets": [
            {"id": "w_total", "type": "metric", "title": "전체 재고 수량", "metric_id": "inventory_count", "width": 3, "decimals": 0},
            {"id": "w_manufacturer", "type": "bar", "title": "제조사별 재고", "metric_id": "inventory_count", "dimension_id": "manufacturer", "width": 6, "sort": "value_desc", "limit": 10},
            {"id": "w_model", "type": "bar", "title": "모델별 상위 10개", "metric_id": "inventory_count", "dimension_id": "model", "width": 6, "sort": "value_desc", "limit": 10},
            {"id": "w_table", "type": "table", "title": "제조사·모델별 재고", "dimension_ids": ["manufacturer", "model"], "metric_ids": ["inventory_count"], "width": 12, "sort": "value_desc", "page_size": 20},
        ],
    }


def validate_config(config: DashboardConfig, *, require_widgets: bool = False) -> None:
    errors: list[dict[str, str]] = []
    if require_widgets and not config.widgets:
        errors.append({"path": "widgets", "message": "공개하려면 위젯을 하나 이상 추가해 주세요."})

    filter_ids = [item.id for item in config.filters]
    if len(filter_ids) != len(set(filter_ids)):
        errors.append({"path": "filters", "message": "필터 ID가 중복되었습니다."})
    date_filter = next((item for item in config.filters if item.id == "as_of_date"), None)
    if date_filter is None or not date_filter.required:
        errors.append({"path": "filters", "message": "기준일 필터는 필수이며 제거할 수 없습니다."})
    elif not _valid_date_default(date_filter.default):
        errors.append({"path": "filters.as_of_date.default", "message": "기준일 기본값을 확인해 주세요."})

    for filter_config in config.filters:
        if filter_config.id in {"manufacturer", "model"}:
            if filter_config.required:
                errors.append({"path": f"filters.{filter_config.id}.required", "message": "제조사와 모델 필터는 선택 조건입니다."})
            if not isinstance(filter_config.default, list) or len(filter_config.default) > MAX_SELECTIONS or not all(isinstance(v, str) for v in filter_config.default):
                errors.append({"path": f"filters.{filter_config.id}.default", "message": "선택값 기본 조건 형식이 올바르지 않습니다."})

    widget_ids = [item.id for item in config.widgets]
    if len(widget_ids) != len(set(widget_ids)):
        errors.append({"path": "widgets", "message": "위젯 ID가 중복되었습니다."})
    for index, widget in enumerate(config.widgets):
        prefix = f"widgets.{index}"
        if isinstance(widget, MetricWidget):
            if widget.metric_id not in METRICS:
                errors.append({"path": f"{prefix}.metric_id", "message": "사용할 수 없는 지표입니다."})
        elif isinstance(widget, BarWidget):
            if widget.metric_id not in METRICS:
                errors.append({"path": f"{prefix}.metric_id", "message": "사용할 수 없는 지표입니다."})
        elif isinstance(widget, TableWidget):
            if len(widget.dimension_ids) != len(set(widget.dimension_ids)):
                errors.append({"path": f"{prefix}.dimension_ids", "message": "표 분류 항목이 중복되었습니다."})
            if len(widget.metric_ids) != len(set(widget.metric_ids)) or any(metric not in METRICS for metric in widget.metric_ids):
                errors.append({"path": f"{prefix}.metric_ids", "message": "표 지표를 확인해 주세요."})

    if errors:
        raise ApiProblem(422, "CONFIG_INVALID", "대시보드 설정을 확인해 주세요.", errors)


def _valid_date_default(value: Any) -> bool:
    if value == {"mode": "latest"}:
        return True
    if isinstance(value, dict) and value.get("mode") == "date" and set(value) == {"mode", "value"}:
        return value["value"] in DATE_FILES
    return False


def validate_filters(config: DashboardConfig, filters: dict[str, Any]) -> dict[str, Any]:
    configured = {item.id: item for item in config.filters}
    allowed = set(configured) | {"aging_bucket"}
    if set(filters) - allowed:
        raise ApiProblem(422, "FILTER_INVALID", "설정에 없는 필터가 포함되었습니다.")

    bucket = filters.get("aging_bucket", "")
    if not isinstance(bucket, str) or (bucket and bucket not in AGING_BUCKETS):
        raise ApiProblem(422, "FILTER_INVALID", "재고 기간 구간을 확인해 주세요.")
    result: dict[str, Any] = {"aging_bucket": bucket}
    for filter_id, filter_config in configured.items():
        value = filters.get(filter_id, filter_config.default)
        if filter_id == "as_of_date":
            if value == {"mode": "latest"} or value == "latest":
                result[filter_id] = max(DATE_FILES)
            elif isinstance(value, str) and value in DATE_FILES:
                result[filter_id] = value
            else:
                raise ApiProblem(422, "FILTER_INVALID", "조회 가능한 기준일을 선택해 주세요.", [{"path": "filters.as_of_date", "message": "조회 가능한 날짜가 아닙니다."}])
        else:
            if value is None:
                value = []
            if not isinstance(value, list) or len(value) > MAX_SELECTIONS or not all(isinstance(v, str) for v in value):
                raise ApiProblem(422, "FILTER_INVALID", "필터 선택값 형식이 올바르지 않습니다.")
            result[filter_id] = list(dict.fromkeys(value))
    return result


def load_rows(as_of_date: str) -> list[dict[str, Any]]:
    filename = DATE_FILES.get(as_of_date)
    if filename is None:
        raise ApiProblem(422, "FILTER_INVALID", "조회 가능한 기준일을 선택해 주세요.")
    path = PROJECT_ROOT / "data" / filename
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        rows = payload["response"]["inventories"]
    except (OSError, ValueError, KeyError, TypeError) as exc:
        raise ApiProblem(502, "SOURCE_INVALID", "재고 샘플 파일을 읽을 수 없습니다.") from exc
    if not isinstance(rows, list) or len(rows) > MAX_SAMPLE_ROWS or not all(isinstance(row, dict) for row in rows):
        raise ApiProblem(502, "SOURCE_INVALID", "재고 샘플 구조 또는 행 수가 올바르지 않습니다.")
    if payload.get("status") not in (200, "200"):
        raise ApiProblem(502, "SOURCE_INVALID", "재고 샘플 조회 상태가 정상 응답이 아닙니다.")
    return rows


def load_all_rows() -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for as_of_date in DATE_FILES:
        result.extend(load_rows(as_of_date))
    return result


def source_metadata() -> dict[str, Any]:
    return {
        "id": "inventory",
        "name": "재고 샘플",
        "description": "날짜별 재고 JSON 스냅샷",
        "active": True,
        "visibility": "all_active_sso_users",
        "available_dates": list(DATE_FILES),
        "default_date": max(DATE_FILES),
        "fields": [
            {"id": "manufacturer", "label": "제조사", "type": "string", "filterable": True, "dimension": True},
            {"id": "model", "label": "모델", "type": "string", "filterable": True, "dimension": True},
        ],
        "metrics": [{"id": "inventory_count", **METRICS["inventory_count"]}],
        "filters": [
            {"id": "as_of_date", "label": "기준일", "type": "date", "required": True},
            {"id": "manufacturer", "label": "제조사", "type": "multi_select", "required": False},
            {"id": "model", "label": "모델", "type": "multi_select", "required": False},
        ],
    }


def filter_options(filter_id: str, q: str = "", cursor: str = "", limit: int = 100, manufacturers: list[str] | None = None) -> dict[str, Any]:
    if filter_id == "as_of_date":
        values = list(DATE_FILES)
    elif filter_id in DIMENSIONS:
        field = DIMENSIONS[filter_id]["field"]
        if manufacturers and filter_id != "model":
            raise ApiProblem(422, "FILTER_INVALID", "제조사 조건은 모델 선택지에만 사용할 수 있습니다.")
        rows = load_all_rows()
        if manufacturers:
            selected_manufacturers = set(manufacturers)
            rows = [row for row in rows if _dimension_value(row.get(DIMENSIONS["manufacturer"]["field"])) in selected_manufacturers]
        values = sorted({_dimension_value(row.get(field)) for row in rows})
        values = [value for value in values if value != "미분류"] + (["미분류"] if "미분류" in values else [])
    else:
        raise ApiProblem(422, "FILTER_INVALID", "사용할 수 없는 필터입니다.")
    if q:
        query = q.casefold()
        values = [value for value in values if query in value.casefold()]
    try:
        offset = int(cursor) if cursor else 0
    except ValueError as exc:
        raise ApiProblem(422, "FILTER_INVALID", "선택지 cursor가 올바르지 않습니다.") from exc
    if offset < 0 or offset > 100_000 or limit < 1 or limit > 500:
        raise ApiProblem(422, "FILTER_INVALID", "선택지 범위를 확인해 주세요.")
    page = values[offset : offset + limit]
    next_cursor = str(offset + limit) if offset + limit < len(values) else None
    return {"options": [{"value": value, "label": "미등록" if value == "미분류" else value} for value in page], "next_cursor": next_cursor}


def query_widgets(
    config: DashboardConfig,
    filters: dict[str, Any],
    tables: dict[str, dict[str, Any]] | None = None,
    widget_ids: list[str] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    validate_config(config)
    resolved = validate_filters(config, filters)
    as_of_date = resolved["as_of_date"]
    rows = load_rows(as_of_date)
    allowed_values = {
        filter_id: {option["value"] for option in filter_options(filter_id, limit=500)["options"]}
        for filter_id in ("manufacturer", "model")
        if resolved.get(filter_id)
    }
    for filter_id, values in resolved.items():
        if filter_id in allowed_values and set(values) - allowed_values[filter_id]:
            raise ApiProblem(422, "FILTER_INVALID", "샘플 데이터에 없는 필터 선택값입니다.")

    filtered_rows = [row for row in rows if _matches(row, resolved)]
    dates = sorted(DATE_FILES)
    inventory_history = [
        {
            "as_of_date": snapshot_date,
            "row_count": sum(_matches(row, resolved) for row in (rows if snapshot_date == as_of_date else load_rows(snapshot_date))),
        }
        for snapshot_date in dates
    ]
    date_index = dates.index(as_of_date)
    comparison_date = dates[date_index - 1] if date_index else None
    comparison_count = inventory_history[date_index - 1]["row_count"] if comparison_date is not None else None
    manufacturer_counts = Counter(_dimension_value(row.get("mnfct")) for row in filtered_rows)
    model_counts = Counter(_dimension_value(row.get("repDvcId")) for row in filtered_rows)
    holder_counts = Counter(_dimension_value(row.get("cpLetr")) for row in filtered_rows)
    aging = _aging_summary(filtered_rows)
    widgets: list[dict[str, Any]] = []
    tables = tables or {}
    configured_ids = {widget.id for widget in config.widgets}
    if set(tables) - configured_ids:
        raise ApiProblem(422, "TABLE_INVALID", "설정에 없는 표 조건이 포함되었습니다.")

    requested_ids = set(widget_ids) if widget_ids is not None else None
    if requested_ids is not None and (not requested_ids or requested_ids - configured_ids):
        raise ApiProblem(422, "WIDGET_INVALID", "조회할 위젯을 확인해 주세요.")

    for widget in config.widgets:
        if requested_ids is not None and widget.id not in requested_ids:
            continue
        if isinstance(widget, MetricWidget):
            widgets.append({"id": widget.id, "type": "metric", "title": widget.title or METRICS[widget.metric_id]["label"], "width": widget.width, "value": len(filtered_rows), "unit": METRICS[widget.metric_id]["unit"], "decimals": widget.decimals})
        elif isinstance(widget, BarWidget):
            counts = manufacturer_counts if widget.dimension_id == "manufacturer" else model_counts
            items = [{"label": label, "value": count} for label, count in counts.items()]
            items = _sort_items(items, widget.sort)[: widget.limit]
            total_value = len(filtered_rows)
            included_value = sum(item["value"] for item in items)
            for item in items:
                item["share"] = item["value"] / total_value if total_value else None
            widgets.append({
                "id": widget.id,
                "type": "bar",
                "title": widget.title or DIMENSIONS[widget.dimension_id]["label"],
                "width": widget.width,
                "dimension_id": widget.dimension_id,
                "items": items,
                "total_value": total_value,
                "included_value": included_value,
                "remaining_value": total_value - included_value,
                "remaining_share": (total_value - included_value) / total_value if total_value else None,
                "category_count": len(counts),
                "remaining_categories": len(counts) - len(items),
                "coverage": included_value / total_value if total_value else None,
            })
        elif isinstance(widget, TableWidget):
            grouped = _group_counts(filtered_rows, widget.dimension_ids)
            table_request = tables.get(widget.id, {})
            page_size = table_request.get("page_size", widget.page_size)
            page = table_request.get("page", 1)
            sort = table_request.get("sort", widget.sort)
            if set(table_request) - {"page", "page_size", "sort"}:
                raise ApiProblem(422, "TABLE_INVALID", "표 조건에 지원하지 않는 항목이 있습니다.")
            if page_size not in (20, 50, 100) or not isinstance(page, int) or page < 1 or page > 100_000 or sort not in ("value_desc", "value_asc", "label_asc"):
                raise ApiProblem(422, "TABLE_INVALID", "표 페이지 또는 정렬 조건을 확인해 주세요.")
            if page_size > widget.page_size:
                raise ApiProblem(422, "TABLE_INVALID", "표 페이지 크기는 게시 설정을 넘을 수 없습니다.")
            sorted_rows = _sort_rows(grouped, sort, widget.dimension_ids)
            total = len(sorted_rows)
            start = (page - 1) * page_size
            widgets.append({
                "id": widget.id,
                "type": "table",
                "title": widget.title or "집계 표",
                "width": widget.width,
                "columns": [{"id": dimension, "label": DIMENSIONS[dimension]["label"]} for dimension in widget.dimension_ids] + [{"id": "inventory_count", "label": "재고 수량", "unit": "대"}],
                "rows": sorted_rows[start : start + page_size],
                "total": total,
                "total_value": sum(item["inventory_count"] for item in sorted_rows),
                "page": page,
                "page_size": page_size,
                "sort": sort,
            })

    meta = {
        "as_of_date": as_of_date,
        "source_updated_at": None,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "row_count": len(filtered_rows),
        "snapshot_row_count": len(rows),
        "comparison_date": comparison_date,
        "comparison_count": comparison_count,
        "comparison_delta": len(filtered_rows) - comparison_count if comparison_count is not None else None,
        "inventory_history": inventory_history,
        "aging": aging,
        "pricing": _price_summary(filtered_rows),
        "holders": [
            {"label": label, "value": count, "share": count / len(filtered_rows)}
            for label, count in sorted(holder_counts.items(), key=lambda item: (-item[1], item[0].casefold()))
        ],
        "manufacturer_count": len(manufacturer_counts),
        "model_count": len(model_counts),
        "top_manufacturer": _top_category(manufacturer_counts, len(filtered_rows)),
        "top_model": _top_category(model_counts, len(filtered_rows)),
        "unclassified_count": {
            "manufacturer": manufacturer_counts["미분류"],
            "model": model_counts["미분류"],
        },
        "warnings": [],
    }
    return widgets, meta


def _top_category(counts: Counter[str], total: int) -> dict[str, Any] | None:
    if not counts:
        return None
    label, count = sorted(counts.items(), key=lambda item: (-item[1], item[0].casefold()))[0]
    return {"label": label, "count": count, "share": count / total}


def _aging_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    values = [row.get("outPassovrDay") for row in rows]
    valid_days = [value for value in values if isinstance(value, int) and not isinstance(value, bool) and value >= 0]
    return {
        "source_field": "outPassovrDay",
        "count_0_to_29": sum(value < 30 for value in valid_days),
        "count_30_to_59": sum(30 <= value < 60 for value in valid_days),
        "count_60_to_89": sum(60 <= value < 90 for value in valid_days),
        "count_30_to_89": sum(30 <= value < 90 for value in valid_days),
        "count_90_plus": sum(value >= 90 for value in valid_days),
        "zero_count": sum(value == 0 for value in valid_days),
        "unavailable_count": len(values) - len(valid_days),
    }


def _matches(row: dict[str, Any], filters: dict[str, Any]) -> bool:
    bucket = filters.get("aging_bucket")
    if bucket:
        value = row.get("outPassovrDay")
        lower, upper = AGING_BUCKETS[bucket]
        if not isinstance(value, int) or isinstance(value, bool) or value < lower or (upper is not None and value >= upper):
            return False
    for filter_id, field in (("manufacturer", "mnfct"), ("model", "repDvcId")):
        selected = filters.get(filter_id, [])
        if selected and _dimension_value(row.get(field)) not in selected:
            return False
    return True


def _price_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    prices = [row.get("outUnitPric") for row in rows]
    registered = [value for value in prices if isinstance(value, int) and not isinstance(value, bool) and value > 0]
    return {
        "total_amount": sum(registered) if registered or not rows else None,
        "priced_count": len(registered),
        "unpriced_count": len(rows) - len(registered),
    }


def _dimension_value(value: Any) -> str:
    if value is None or not str(value).strip():
        return "미분류"
    return str(value).strip()


def _group_counts(rows: list[dict[str, Any]], dimensions: list[str]) -> list[dict[str, Any]]:
    counters: Counter[tuple[str, ...]] = Counter()
    for row in rows:
        key = tuple(_dimension_value(row.get(DIMENSIONS[dimension]["field"])) for dimension in dimensions)
        counters[key] += 1
    return [
        {**{dimension: value for dimension, value in zip(dimensions, key)}, "inventory_count": count, "value": count}
        for key, count in counters.items()
    ]


def _sort_items(items: list[dict[str, Any]], sort: str) -> list[dict[str, Any]]:
    if sort == "value_asc":
        return sorted(items, key=lambda item: (item["value"], item["label"].casefold()))
    if sort == "label_asc":
        return sorted(items, key=lambda item: item["label"].casefold())
    return sorted(items, key=lambda item: (-item["value"], item["label"].casefold()))


def _sort_rows(rows: list[dict[str, Any]], sort: str, dimensions: list[str]) -> list[dict[str, Any]]:
    if sort == "value_asc":
        return sorted(rows, key=lambda item: (item["inventory_count"], tuple(str(item[key]).casefold() for key in dimensions)))
    if sort == "label_asc":
        return sorted(rows, key=lambda item: tuple(str(item[key]).casefold() for key in dimensions))
    return sorted(rows, key=lambda item: (-item["inventory_count"], tuple(str(item[key]).casefold() for key in dimensions)))
