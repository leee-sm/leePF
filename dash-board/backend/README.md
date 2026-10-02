# FastAPI backend

FastAPI가 KTIS SSO 인증, 대시보드 초안·공개 상태, 샘플 재고 조회·집계를 담당합니다. React 정적 파일은 Docker 이미지에서 FastAPI가 제공하고, Compose의 Nginx가 요청을 전달합니다.

저장소 루트의 [실행 안내](../README.md)를 기준으로 Compose 개발·사내 서버 실행을 준비하세요. 직접 개발하려면 Python 3.12와 `uv`를 사용합니다.

```bash
cd backend
uv sync
cp .env.example .env
```

개발 PC에서는 `.env`에 `APP_ENV=development`, `SSO_ENABLED=false`, `DEV_AUTO_LOGIN=true`를 설정합니다. 개발 로그인의 `admin`과 `user` 역할은 `localhost`/`127.0.0.1` 요청에서만 발급됩니다. 공유 환경에서는 `APP_ENV=production`, `DEV_AUTO_LOGIN=false`로 실행합니다. 활성 SSO 계정 중 시스템 관리자는 `SSO_BOOTSTRAP_ADMIN_SABUN`으로 지정합니다.

```bash
uv run uvicorn app.main:app --reload --no-access-log --port 8080
```

세션 확인은 `GET /api/auth/me`, 상태 확인은 `/healthz`입니다. 공개되지 않은 대시보드는 이용자 API에서 404로 응답하고, 관리 API는 서버에서 `ROLE_SYSTEM`을 검사합니다. 상태 변경·미리보기·조회 POST 요청은 현재 출처와 `X-Requested-With: XMLHttpRequest`, JSON 본문을 확인합니다.

SQLite는 직접 실행 기본값이고, Compose는 PostgreSQL named volume을 사용합니다. 테이블은 첫 실행 때 SQLAlchemy metadata로 생성합니다. 원천 재고 행과 미리보기 결과는 메타데이터 DB에 저장하지 않습니다.
