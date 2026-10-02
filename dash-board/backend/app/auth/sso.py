from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import Request, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import User, UserRole, UserSession


class SsoError(RuntimeError):
    pass


class SsoService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def build_login_url(self, request: Request) -> str:
        callback_url = self._external_base_url(request) + self.settings.normalized_base_path + self.settings.sso_callback_path
        query = urlencode({self.settings.sso_return_param: callback_url})
        return f"{self.settings.sso_uri.rstrip('/')}{self.settings.sso_login_url}?{query}"

    def build_logout_url(self) -> str:
        return f"{self.settings.sso_uri.rstrip('/')}{self.settings.sso_logout_url}"

    def exchange_token(self, token: str) -> str:
        if not token or not token.strip():
            raise SsoError("SSO 토큰이 없습니다.")

        timeout = httpx.Timeout(5.0, connect=3.0)
        try:
            with httpx.Client(
                base_url=self.settings.exchange_base_uri.rstrip("/"),
                timeout=timeout,
            ) as client:
                response = client.post(
                    self.settings.sso_exchange_url,
                    json={"ssoToken": token},
                )
                response.raise_for_status()
                payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise SsoError("SSO 토큰 교환에 실패했습니다.") from exc

        sabun = payload.get("sabun") if isinstance(payload, dict) else None
        if not isinstance(sabun, str) or not sabun.strip():
            raise SsoError("SSO 응답에 사번이 없습니다.")
        return sabun.strip()

    def upsert_user(self, db: Session, sabun: str) -> User:
        now = datetime.now(timezone.utc)
        user = db.scalar(select(User).where(User.sabun == sabun))
        if user is None:
            user = User(
                sabun=sabun,
                display_name=sabun,
                is_active=True,
                created_at=now,
                last_login_at=now,
            )
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role="ROLE_USER"))
        else:
            user.last_login_at = now

        if (
            self.settings.sso_bootstrap_admin_sabun
            and sabun == self.settings.sso_bootstrap_admin_sabun
            and not any(role.role == "ROLE_SYSTEM" for role in user.roles)
        ):
            db.add(UserRole(user_id=user.id, role="ROLE_SYSTEM"))

        db.commit()
        db.refresh(user)
        return user

    def create_session(self, db: Session, user: User, response: Response) -> None:
        raw_token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        db.add(
            UserSession(
                token_hash=self.hash_token(raw_token),
                user_id=user.id,
                created_at=now,
                expires_at=now + timedelta(seconds=self.settings.session_ttl_seconds),
            )
        )
        db.commit()
        response.set_cookie(
            key=self.settings.session_cookie_name,
            value=raw_token,
            max_age=self.settings.session_ttl_seconds,
            httponly=True,
            secure=self.settings.session_cookie_secure,
            samesite="lax",
            path="/",
        )

    def get_current_user(self, request: Request, db: Session) -> User | None:
        raw_token = request.cookies.get(self.settings.session_cookie_name)
        if not raw_token:
            return None

        session = db.scalar(
            select(UserSession).where(UserSession.token_hash == self.hash_token(raw_token))
        )
        if session is None:
            return None

        now = datetime.now(timezone.utc)
        expires_at = session.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= now or not session.user.is_active:
            db.delete(session)
            db.commit()
            return None
        return session.user

    def clear_session(self, request: Request, db: Session, response: Response) -> None:
        raw_token = request.cookies.get(self.settings.session_cookie_name)
        if raw_token:
            db.execute(
                delete(UserSession).where(
                    UserSession.token_hash == self.hash_token(raw_token)
                )
            )
            db.commit()
        response.delete_cookie(self.settings.session_cookie_name, path="/")

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def safe_target(self, value: str | None) -> str:
        if value and value.startswith("/") and not value.startswith("//"):
            return value
        return self.settings.normalized_base_path + "/dashboards"

    def _external_base_url(self, request: Request) -> str:
        if self.settings.public_base_url:
            return self.settings.public_base_url.rstrip("/")
        forwarded_proto = self._first_forwarded(request.headers.get("x-forwarded-proto"))
        forwarded_host = self._first_forwarded(request.headers.get("x-forwarded-host"))
        scheme = forwarded_proto or request.url.scheme
        if forwarded_host:
            return f"{scheme}://{forwarded_host}"
        return f"{scheme}://{request.url.netloc}"

    @staticmethod
    def _first_forwarded(value: str | None) -> str | None:
        if not value:
            return None
        return value.split(",", maxsplit=1)[0].strip()
