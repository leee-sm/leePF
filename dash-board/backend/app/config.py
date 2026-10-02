from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "AX Distribution PoC"
    app_environment: str = "development"
    allowed_hosts: str = "localhost,127.0.0.1,::1"
    public_base_url: str | None = None
    database_url: str = f"sqlite:///{PROJECT_ROOT / 'backend' / 'poc.db'}"

    sso_enabled: bool = True
    sso_uri: str = "http://localhost:9000"
    sso_exchange_base_uri: str | None = None
    sso_login_url: str = "/slogin"
    sso_exchange_url: str = "/api/ott/exchange"
    sso_logout_url: str = "/slogout"
    sso_token_param: str = "ssoToken"
    sso_return_param: str = "returnUrl"
    sso_callback_path: str = "/sso/callback"
    web_base_path: str = ""

    session_cookie_name: str = "ax_session"
    login_target_cookie_name: str = "ax_login_target"
    session_cookie_secure: bool = False
    session_ttl_seconds: int = 8 * 60 * 60

    dev_auto_login: bool = False
    dev_auto_login_sabun: str = "2210013"
    dev_auto_login_user_sabun: str = "2210014"
    sso_bootstrap_admin_sabun: str | None = None

    @property
    def exchange_base_uri(self) -> str:
        return self.sso_exchange_base_uri or self.sso_uri

    @property
    def normalized_base_path(self) -> str:
        value = self.web_base_path.strip()
        if not value or value == "/":
            return ""
        value = value.strip("/")
        return f"/{value}"

    @property
    def trusted_hosts(self) -> list[str]:
        return [host.strip() for host in self.allowed_hosts.split(",") if host.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
