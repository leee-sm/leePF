from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_same_origin
from app.auth.sso import SsoError, SsoService
from app.config import get_settings
from app.dashboard.errors import ApiProblem
from app.dashboard.router import router as dashboard_router
from app.dashboard.seed import seed_for_first_active_user
from app.db import Base, engine, get_db
from app.models import User, UserRole


settings = get_settings()
logger = logging.getLogger("ax_dashboard")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.dev_auto_login and settings.app_environment != "development":
        raise RuntimeError("DEV_AUTO_LOGIN may only be enabled in development.")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        seed_for_first_active_user(db)
    yield


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
    docs_url="/docs" if settings.app_environment == "development" else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.app_environment == "development" else None,
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts, www_redirect=False)
app.include_router(dashboard_router)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "private, no-store"
    return response


@app.exception_handler(ApiProblem)
async def api_problem_handler(_request: Request, exc: ApiProblem) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.as_dict())


@app.exception_handler(RequestValidationError)
async def request_validation_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    fields = [
        {"path": ".".join(str(part) for part in error["loc"]), "message": error["msg"]}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"error": {"code": "REQUEST_INVALID", "message": "요청 값을 확인해 주세요.", "fields": fields}})


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    code = {401: "AUTH_REQUIRED", 403: "FORBIDDEN", 404: "NOT_FOUND", 415: "REQUEST_INVALID"}.get(exc.status_code, "REQUEST_INVALID")
    message = exc.detail if isinstance(exc.detail, str) else "요청을 처리할 수 없습니다."
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": code, "message": message}})


@app.get("/healthz", include_in_schema=False)
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/runtime")
async def runtime() -> dict[str, bool]:
    return {
        "development_login_enabled": settings.app_environment == "development" and settings.dev_auto_login,
        "sso_enabled": settings.sso_enabled,
    }


@app.get("/login", include_in_schema=False)
async def login(request: Request) -> RedirectResponse:
    sso = SsoService(settings)
    if not settings.sso_enabled and settings.dev_auto_login:
        return RedirectResponse("/", status_code=303)

    target = sso.safe_target(request.query_params.get("next"))
    response = RedirectResponse(sso.build_login_url(request), status_code=302)
    response.set_cookie(
        key=settings.login_target_cookie_name,
        value=target,
        max_age=300,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )
    return response


@app.get("/dev/login", include_in_schema=False)
async def dev_login(
    request: Request,
    role: str = "user",
    db: Session = Depends(get_db),
) -> RedirectResponse:
    hostname = (request.url.hostname or "").lower()
    if (
        settings.app_environment != "development"
        or not settings.dev_auto_login
        or hostname not in {"localhost", "127.0.0.1", "::1"}
        or role not in {"admin", "user"}
    ):
        return RedirectResponse("/", status_code=303)

    sabun = settings.dev_auto_login_sabun if role == "admin" else settings.dev_auto_login_user_sabun
    if role == "admin" and settings.sso_bootstrap_admin_sabun:
        sabun = settings.sso_bootstrap_admin_sabun
    user = SsoService(settings).upsert_user(db, sabun)
    if role == "admin" and not any(item.role == "ROLE_SYSTEM" for item in user.roles):
        db.add(UserRole(user_id=user.id, role="ROLE_SYSTEM"))
        db.commit()
    if role == "user" and any(item.role == "ROLE_SYSTEM" for item in user.roles):
        db.query(UserRole).filter(UserRole.user_id == user.id, UserRole.role == "ROLE_SYSTEM").delete()
        db.commit()
    if not user.is_active:
        return RedirectResponse("/", status_code=303)
    response = RedirectResponse("/dashboards", status_code=303)
    SsoService(settings).create_session(db, user, response)
    return response


async def sso_callback(
    request: Request,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    sso = SsoService(settings)
    token = request.query_params.get(settings.sso_token_param)
    if not token:
        return RedirectResponse("/login", status_code=303)

    try:
        sabun = sso.exchange_token(token)
        user = sso.upsert_user(db, sabun)
    except SsoError:
        return RedirectResponse("/login", status_code=303)

    if not user.is_active:
        response = RedirectResponse("/login", status_code=303)
        response.delete_cookie(settings.login_target_cookie_name, path="/")
        return response

    target = sso.safe_target(request.cookies.get(settings.login_target_cookie_name))
    response = RedirectResponse(target, status_code=303)
    sso.create_session(db, user, response)
    response.delete_cookie(settings.login_target_cookie_name, path="/")
    return response


app.add_api_route(
    settings.sso_callback_path,
    sso_callback,
    methods=["GET"],
    include_in_schema=False,
)


@app.post("/logout", include_in_schema=False)
async def logout(
    request: Request,
    db: Session = Depends(get_db),
    _origin: None = Depends(require_same_origin),
) -> RedirectResponse:
    sso = SsoService(settings)
    response = RedirectResponse(
        sso.build_logout_url() if settings.sso_enabled else "/",
        status_code=303,
    )
    sso.clear_session(request, db, response)
    return response


@app.get("/api/auth/me")
async def auth_me(user: User | None = Depends(get_current_user)) -> JSONResponse:
    if user is None:
        return JSONResponse(
            status_code=401,
            content={"code": "AUTH_REQUIRED", "message": "인증이 필요합니다."},
        )
    return JSONResponse(
        {
            "id": user.id,
            "sabun": user.sabun,
            "displayName": user.display_name,
            "roles": sorted(role.role for role in user.roles),
        }
    )


frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/", include_in_schema=False)
    async def frontend_root() -> FileResponse:
        return FileResponse(frontend_dist / "index.html")

    @app.get("/{frontend_path:path}", include_in_schema=False)
    async def frontend(frontend_path: str) -> FileResponse:
        if frontend_path.startswith(("api/", "sso/")) or frontend_path in {"logout", "login", "healthz"}:
            raise HTTPException(status_code=404, detail="요청한 경로를 찾을 수 없습니다.")
        return FileResponse(frontend_dist / "index.html")
