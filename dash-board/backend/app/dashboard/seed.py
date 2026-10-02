from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dashboard.inventory import inventory_template, validate_config
from app.dashboard.schemas import DashboardConfig
from app.models import Dashboard, User


# A fixed key makes the initial dashboard a one-time insert across restarts.
INITIAL_INVENTORY_DASHBOARD_ID = "46d2770a-f4ed-4f67-a6bf-7f3d2e7a4201"


def ensure_initial_inventory_dashboard(db: Session, actor_id: int) -> bool:
    """Insert the public sample dashboard once without changing an existing row."""
    if db.get(Dashboard, INITIAL_INVENTORY_DASHBOARD_ID) is not None:
        return False

    config = DashboardConfig.model_validate(inventory_template())
    validate_config(config, require_widgets=True)
    config_value = config.model_dump(mode="json")
    now = datetime.now(timezone.utc)
    db.add(
        Dashboard(
            id=INITIAL_INVENTORY_DASHBOARD_ID,
            draft_config=config_value,
            published_config=config_value,
            visibility="published",
            edit_version=1,
            published_revision=1,
            published_from_edit_version=1,
            created_by=actor_id,
            updated_by=actor_id,
            published_by=actor_id,
            created_at=now,
            updated_at=now,
            published_at=now,
        )
    )
    try:
        db.commit()
    except IntegrityError:
        # Concurrent app workers can both observe a missing seed. The stable
        # primary key makes the losing insert an idempotent no-op.
        db.rollback()
        if db.get(Dashboard, INITIAL_INVENTORY_DASHBOARD_ID) is not None:
            return False
        raise
    return True


def seed_for_first_active_user(db: Session) -> bool:
    """Seed an existing installation at startup when a user can own the row."""
    user = db.scalar(select(User).where(User.is_active.is_(True)).order_by(User.id).limit(1))
    return ensure_initial_inventory_dashboard(db, user.id) if user is not None else False
