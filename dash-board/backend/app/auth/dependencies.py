from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import User
from app.auth.sso import SsoService


async def get_sso_service() -> SsoService:
    return SsoService(get_settings())


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    sso: SsoService = Depends(get_sso_service),
) -> User | None:
    return sso.get_current_user(request, db)


async def require_current_user(
    user: User | None = Depends(get_current_user),
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    return user


async def require_system_user(
    user: User = Depends(require_current_user),
) -> User:
    if not any(role.role == "ROLE_SYSTEM" for role in user.roles):
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user


async def require_same_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    settings = get_settings()
    expected = settings.public_base_url.rstrip("/") if settings.public_base_url else f"{request.url.scheme}://{request.url.netloc}"
    if origin != expected or request.headers.get("x-requested-with") != "XMLHttpRequest":
        raise HTTPException(status_code=403, detail="요청 출처를 확인할 수 없습니다.")


async def require_same_origin_json(request: Request) -> None:
    await require_same_origin(request)
    if request.headers.get("content-type", "").split(";", maxsplit=1)[0].strip().lower() != "application/json":
        raise HTTPException(status_code=415, detail="application/json 요청만 허용됩니다.")
