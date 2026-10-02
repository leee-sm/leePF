from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.auth.dependencies import require_current_user, require_same_origin_json, require_system_user
from app.dashboard.errors import ApiProblem
from app.dashboard.inventory import (
    DATE_FILES,
    filter_options as inventory_filter_options,
    inventory_template,
    query_widgets,
    source_metadata,
    validate_config,
)
from app.dashboard.seed import ensure_initial_inventory_dashboard
from app.dashboard.schemas import (
    CreateDashboard,
    DashboardConfig,
    PreviewRequest,
    PublishRequest,
    QueryRequest,
    SaveDraft,
    UnpublishRequest,
)
from app.db import get_db
from app.models import Dashboard, User


logger = logging.getLogger("ax_dashboard.audit")
router = APIRouter(prefix="/api", tags=["dashboards"])


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def parse_config(value: dict[str, Any]) -> DashboardConfig:
    try:
        config = DashboardConfig.model_validate(value)
    except Exception as exc:
        from pydantic import ValidationError

        if isinstance(exc, ValidationError):
            fields = [
                {"path": ".".join(str(part) for part in error["loc"]), "message": error["msg"]}
                for error in exc.errors()
            ]
            raise ApiProblem(422, "CONFIG_INVALID", "대시보드 설정을 확인해 주세요.", fields) from exc
        raise
    validate_config(config)
    return config


def dashboard_or_404(db: Session, dashboard_id: str) -> Dashboard:
    try:
        dashboard_uuid = str(uuid.UUID(dashboard_id))
    except ValueError as exc:
        raise ApiProblem(404, "NOT_FOUND", "대시보드를 찾을 수 없습니다.") from exc
    dashboard = db.get(Dashboard, dashboard_uuid)
    if dashboard is None:
        raise ApiProblem(404, "NOT_FOUND", "대시보드를 찾을 수 없습니다.")
    return dashboard


def admin_view(row: Dashboard) -> dict[str, Any]:
    return {
        "id": row.id,
        "draft_config": row.draft_config,
        "visibility": row.visibility,
        "edit_version": row.edit_version,
        "published_revision": row.published_revision,
        "published_from_edit_version": row.published_from_edit_version,
        "has_unpublished_changes": row.published_config is not None and row.published_from_edit_version != row.edit_version,
        "created_at": row.created_at.isoformat(),
        "updated_at": row.updated_at.isoformat(),
        "published_at": row.published_at.isoformat() if row.published_at else None,
    }


def conflict(message: str) -> ApiProblem:
    return ApiProblem(409, "VERSION_CONFLICT", message)


def audit(action: str, actor: User, dashboard_id: str, result: str) -> None:
    logger.info("dashboard_action actor_id=%s action=%s dashboard_id=%s result=%s", actor.id, action, dashboard_id, result)


@router.get("/dashboards")
async def public_dashboards(
    q: str = Query(default="", max_length=120),
    page: int = Query(default=1, ge=1, le=100_000),
    page_size: int = Query(default=20, ge=1, le=100),
    _user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    # Fresh PoC databases have no account at startup, so seed on the first
    # authenticated dashboard visit. The stable ID keeps this idempotent.
    ensure_initial_inventory_dashboard(db, _user.id)
    rows = list(db.scalars(select(Dashboard).where(Dashboard.visibility == "published").order_by(Dashboard.published_at.desc(), Dashboard.id)))
    if q:
        needle = q.casefold()
        rows = [row for row in rows if needle in row.published_config.get("title", "").casefold() or needle in row.published_config.get("description", "").casefold()]
    total = len(rows)
    selected = rows[(page - 1) * page_size : page * page_size]
    return {
        "items": [
            {
                "id": row.id,
                "title": row.published_config["title"],
                "description": row.published_config.get("description", ""),
                "published_at": row.published_at.isoformat() if row.published_at else None,
            }
            for row in selected
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/dashboards/{dashboard_id}")
async def public_dashboard(
    dashboard_id: str,
    _user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    row = dashboard_or_404(db, dashboard_id)
    if row.visibility != "published" or row.published_config is None:
        raise ApiProblem(404, "NOT_FOUND", "공개된 대시보드를 찾을 수 없습니다.")
    return {"id": row.id, "config": row.published_config, "published_revision": row.published_revision, "published_at": row.published_at.isoformat() if row.published_at else None}


@router.get("/dashboards/{dashboard_id}/filter-options")
async def public_filter_options(
    dashboard_id: str,
    revision: int = Query(ge=1),
    filter_id: str = Query(min_length=1, max_length=64),
    q: str = Query(default="", max_length=80),
    cursor: str = Query(default="", max_length=12),
    manufacturer: list[str] = Query(default=[]),
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    row = dashboard_or_404(db, dashboard_id)
    config = _published_config_at(row, revision)
    if filter_id not in {item["id"] for item in config["filters"]}:
        raise ApiProblem(422, "FILTER_INVALID", "설정에 없는 필터입니다.")
    user_id = user.id
    db.rollback()
    options = inventory_filter_options(filter_id, q=q, cursor=cursor, manufacturers=manufacturer)
    current = db.get(User, user_id, populate_existing=True)
    latest = db.get(Dashboard, dashboard_id, populate_existing=True)
    if current is None or not current.is_active:
        raise ApiProblem(401, "AUTH_REQUIRED", "인증이 필요합니다.")
    if latest is None or latest.visibility != "published" or latest.published_revision != revision:
        raise conflict("공개 상태가 변경되었습니다. 최신 대시보드를 다시 불러와 주세요.")
    return {"filter_id": filter_id, **options}


@router.post("/dashboards/{dashboard_id}/query", dependencies=[Depends(require_same_origin_json)])
async def public_query(
    dashboard_id: str,
    body: QueryRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    row = dashboard_or_404(db, dashboard_id)
    config_value = dict(_published_config_at(row, body.published_revision))
    user_id = user.id
    dashboard_id = row.id
    db.rollback()
    config = parse_config(config_value)
    widgets, meta = query_widgets(config, body.filters, body.tables, body.widget_ids)
    current = db.get(User, user_id, populate_existing=True)
    if current is None or not current.is_active:
        raise ApiProblem(401, "AUTH_REQUIRED", "인증이 필요합니다.")
    latest = db.get(Dashboard, dashboard_id, populate_existing=True)
    if latest is None or latest.visibility != "published" or latest.published_revision != body.published_revision:
        raise conflict("공개 상태가 변경되었습니다. 최신 대시보드를 다시 불러와 주세요.")
    return {"published_revision": body.published_revision, "meta": meta, "widgets": widgets}


@router.get("/admin/data-sources")
async def admin_sources(_user: User = Depends(require_system_user)) -> dict[str, Any]:
    source = source_metadata()
    return {"items": [{"id": source["id"], "name": source["name"], "description": source["description"], "active": source["active"]}]}


@router.get("/admin/data-sources/{source_id}")
async def admin_source_detail(source_id: str, _user: User = Depends(require_system_user)) -> dict[str, Any]:
    if source_id != "inventory":
        raise ApiProblem(404, "NOT_FOUND", "데이터 소스를 찾을 수 없습니다.")
    return source_metadata()


@router.get("/admin/data-sources/{source_id}/filter-options")
async def admin_source_filter_options(
    source_id: str,
    filter_id: str = Query(min_length=1, max_length=64),
    q: str = Query(default="", max_length=80),
    cursor: str = Query(default="", max_length=12),
    _user: User = Depends(require_system_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if source_id != "inventory":
        raise ApiProblem(404, "NOT_FOUND", "데이터 소스를 찾을 수 없습니다.")
    db.rollback()
    return {"filter_id": filter_id, **inventory_filter_options(filter_id, q=q, cursor=cursor)}


@router.get("/admin/dashboards")
async def admin_dashboards(
    q: str = Query(default="", max_length=120),
    status: str | None = Query(default=None, pattern="^(draft|published|unpublished)$"),
    _user: User = Depends(require_system_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    rows = list(db.scalars(select(Dashboard).order_by(Dashboard.updated_at.desc(), Dashboard.id)))
    if status:
        rows = [row for row in rows if row.visibility == status]
    if q:
        needle = q.casefold()
        rows = [row for row in rows if needle in row.draft_config.get("title", "").casefold()]
    return {"items": [admin_view(row) for row in rows], "total": len(rows)}


@router.post("/admin/dashboards", status_code=201, dependencies=[Depends(require_same_origin_json)])
async def create_dashboard(
    body: CreateDashboard,
    user: User = Depends(require_system_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    config = inventory_template(body.title, body.description) if body.template_id else {
        "schema_version": 1,
        "title": body.title,
        "description": body.description,
        "source_id": body.source_id,
        "filters": [{"id": "as_of_date", "label": "기준일", "default": {"mode": "latest"}, "required": True}],
        "widgets": [],
    }
    config["source_id"] = body.source_id
    parsed = parse_config(config)
    now = now_utc()
    row = Dashboard(
        id=str(uuid.uuid4()),
        draft_config=parsed.model_dump(mode="json"),
        published_config=None,
        visibility="draft",
        edit_version=1,
        published_revision=0,
        published_from_edit_version=None,
        created_by=user.id,
        updated_by=user.id,
        published_by=None,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    audit("create", user, row.id, "success")
    return admin_view(row)


@router.get("/admin/dashboards/{dashboard_id}")
async def admin_dashboard_detail(
    dashboard_id: str,
    _user: User = Depends(require_system_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    return admin_view(dashboard_or_404(db, dashboard_id))


@router.put("/admin/dashboards/{dashboard_id}/draft", dependencies=[Depends(require_same_origin_json)])
async def save_draft(
    dashboard_id: str,
    body: SaveDraft,
    user: User = Depends(require_system_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    row = dashboard_or_404(db, dashboard_id)
    parsed = body.config
    validate_config(parsed)
    now = now_utc()
    result = db.execute(
        update(Dashboard)
        .where(Dashboard.id == row.id, Dashboard.edit_version == body.expected_edit_version)
        .values(draft_config=parsed.model_dump(mode="json"), edit_version=Dashboard.edit_version + 1, updated_by=user.id, updated_at=now)
    )
    if result.rowcount != 1:
        db.rollback()
        audit("save_draft", user, row.id, "conflict")
        raise conflict("다른 변경 사항이 먼저 저장되었습니다. 최신 초안을 다시 불러와 주세요.")
    db.commit()
    row = dashboard_or_404(db, row.id)
    audit("save_draft", user, row.id, "success")
    return admin_view(row)


@router.post("/admin/dashboards/{dashboard_id}/preview", dependencies=[Depends(require_same_origin_json)])
async def preview_dashboard(
    dashboard_id: str,
    body: PreviewRequest,
    _user: User = Depends(require_system_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    dashboard_or_404(db, dashboard_id)
    db.rollback()
    validate_config(body.config)
    widgets, meta = query_widgets(body.config, body.filters, body.tables)
    return {"meta": meta, "widgets": widgets}


@router.post("/admin/dashboards/{dashboard_id}/publish", dependencies=[Depends(require_same_origin_json)])
async def publish_dashboard(
    dashboard_id: str,
    body: PublishRequest,
    user: User = Depends(require_system_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    row = dashboard_or_404(db, dashboard_id)
    if row.edit_version != body.expected_edit_version or row.published_revision != body.expected_published_revision:
        raise conflict("초안 또는 공개 상태가 바뀌었습니다. 최신 내용을 확인해 주세요.")
    config_value = dict(row.draft_config)
    actor_id = user.id
    expected_edit_version = row.edit_version
    expected_published_revision = row.published_revision
    dashboard_id = row.id
    db.rollback()
    config = parse_config(config_value)
    validate_config(config, require_widgets=True)
    # 기본 조건의 샘플 조회가 성공하는지 확인한 뒤 공개 상태를 갱신한다. 빈 목록도 정상 결과다.
    query_widgets(config, {}, {})
    now = now_utc()
    result = db.execute(
        update(Dashboard)
        .where(
            Dashboard.id == dashboard_id,
            Dashboard.edit_version == expected_edit_version,
            Dashboard.published_revision == expected_published_revision,
        )
        .values(
            published_config=config_value,
            visibility="published",
            published_revision=Dashboard.published_revision + 1,
            published_from_edit_version=expected_edit_version,
            published_by=actor_id,
            published_at=now,
            updated_at=now,
        )
    )
    if result.rowcount != 1:
        db.rollback()
        audit("publish", user, dashboard_id, "conflict")
        raise conflict("초안 또는 공개 상태가 바뀌었습니다. 다시 시도해 주세요.")
    db.commit()
    row = dashboard_or_404(db, dashboard_id)
    audit("publish", user, dashboard_id, "success")
    return admin_view(row)


@router.post("/admin/dashboards/{dashboard_id}/unpublish", dependencies=[Depends(require_same_origin_json)])
async def unpublish_dashboard(
    dashboard_id: str,
    body: UnpublishRequest,
    user: User = Depends(require_system_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    row = dashboard_or_404(db, dashboard_id)
    now = now_utc()
    result = db.execute(
        update(Dashboard)
        .where(Dashboard.id == row.id, Dashboard.visibility == "published", Dashboard.published_revision == body.expected_published_revision)
        .values(visibility="unpublished", published_revision=Dashboard.published_revision + 1, updated_at=now)
    )
    if result.rowcount != 1:
        db.rollback()
        audit("unpublish", user, row.id, "conflict")
        raise conflict("공개 상태가 이미 변경되었습니다. 최신 내용을 확인해 주세요.")
    db.commit()
    row = dashboard_or_404(db, row.id)
    audit("unpublish", user, row.id, "success")
    return admin_view(row)


@router.delete("/admin/dashboards/{dashboard_id}", status_code=204, dependencies=[Depends(require_same_origin_json)])
async def delete_dashboard(
    dashboard_id: str,
    expected_edit_version: int = Query(ge=1),
    expected_published_revision: int = Query(ge=0),
    user: User = Depends(require_system_user),
    db: Session = Depends(get_db),
) -> None:
    row = dashboard_or_404(db, dashboard_id)
    if row.visibility == "published":
        raise conflict("공개를 중지한 뒤 삭제해 주세요.")
    result = db.execute(
        delete(Dashboard)
        .where(
            Dashboard.id == row.id,
            Dashboard.visibility != "published",
            Dashboard.edit_version == expected_edit_version,
            Dashboard.published_revision == expected_published_revision,
        )
    )
    if result.rowcount != 1:
        db.rollback()
        audit("delete", user, row.id, "conflict")
        raise conflict("초안 또는 공개 상태가 바뀌었습니다. 최신 내용을 확인해 주세요.")
    db.commit()
    audit("delete", user, row.id, "success")


def _published_config_at(row: Dashboard, revision: int) -> dict[str, Any]:
    if row.visibility != "published" or row.published_config is None:
        raise ApiProblem(404, "NOT_FOUND", "공개된 대시보드를 찾을 수 없습니다.")
    if row.published_revision != revision:
        raise conflict("공개 설정이 변경되었습니다. 최신 대시보드를 다시 불러와 주세요.")
    return row.published_config
