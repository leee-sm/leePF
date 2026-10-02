# AX Distribution Dashboard PoC

관리자가 재고 대시보드를 만들고 편집·미리보기·공개할 수 있으며, 활성 SSO 사용자는 공개된 화면에서 시작일·종료일·제조사·모델을 선택해 조회할 수 있습니다. 첫 데이터 소스는 `data/`에 있는 2026-09-08·09·10 재고 JSON 스냅샷입니다.

## 구현 범위

- 재고 수량 카드, 제조사별 막대 차트, 모델별 상위 10개 차트, 제조사·모델별 집계 표
- 시작일·종료일·제조사·모델 필터와 서버 계산 결과
- 종료일 재고 요약과 시작일 대비 수량 차이
- 선택 기간의 실제 스냅샷 재고 추이, 제조사 집중도 요약, 현재 조회 결과 CSV 내보내기
- 종료일의 `outPassovrDay` 값으로 나눈 30~89일·90일 이상 장기 재고 가로 막대 요약
- 관리자 대시보드 생성, 위젯·필터 편집, 초안 저장, 미리보기, 공개·공개 중지, 삭제
- 초안·공개본 분리, 편집 버전 충돌 검사, 서버 측 관리자·이용자 권한 검사
- FastAPI의 KTIS SSO callback·OTT 교환·서버 세션과 localhost 전용 개발 로그인
- React 화면, FastAPI API, PostgreSQL 메타데이터 DB, Nginx 프록시를 제공하는 Docker Compose

재고 수량은 해당 날짜 `response.inventories`의 행 수입니다. 중복 내용 행도 각각 셉니다. 기본 조회 범위는 실제 조회 가능한 가장 이른 날짜부터 가장 늦은 날짜까지이며, 시작일·종료일과 제조사·모델 조건은 조회를 눌렀을 때 적용됩니다. 추이 그래프는 범위 내 제공된 스냅샷만 날짜별 점으로 보여주고, 재고 카드·분류별 차트·표·장기 재고 요약은 종료일 스냅샷만 표시합니다. 서로 다른 날짜의 수량은 합산하지 않습니다. 장기 재고는 원본 `outPassovrDay` 출고 경과일 후보 필드에서 30~89일과 90일 이상으로 나눠 집계하며, 구간은 서로 겹치지 않습니다. 0일의 업무 의미는 미확정이라 별도로 표시합니다. 2026-09-08의 정상 0건은 조회 실패와 구분하며, 가격 0은 미등록으로 둡니다. 가격 지표와 실제 업무 API 연결은 포함하지 않습니다.

## 개발 PC에서 실행

Docker와 Docker Compose가 설치된 PC에서 저장소 루트에서 실행합니다.

```bash
cp .env.example .env
```

`.env`를 로컬 시연용으로 설정합니다.

```dotenv
APP_ENV=development
HOST_BIND_ADDRESS=127.0.0.1
SSO_ENABLED=false
DEV_AUTO_LOGIN=true
DEV_AUTO_LOGIN_SABUN=2210013
DEV_AUTO_LOGIN_USER_SABUN=2210014
SSO_BOOTSTRAP_ADMIN_SABUN=2210013
```

서비스를 빌드하고 시작합니다.

```bash
docker compose --env-file .env -f docker/compose.yaml up --build -d
```

If a TLS-inspecting proxy blocks package downloads during the image build, set `BUILD_CA_CERT_FILE` in `.env` to a PEM bundle containing that proxy's trusted CA certificates. The Docker build mounts it temporarily and does not copy it into the image.

브라우저에서 `http://localhost:8080`으로 접속한 뒤 **개발 관리자 로그인**을 선택합니다. 관리 메뉴에서 재고 템플릿을 생성하고 편집·미리보기·공개합니다. 로그아웃 후 **개발 이용자 로그인**으로 조회·필터를 확인합니다. 기준일을 2026-09-08로 바꾸면 카드에 `0대`와 빈 차트·표가 표시됩니다. 다시 관리자로 로그인해 공개 중지를 누르면 이용자 목록과 직접 URL에서 모두 접근할 수 없습니다.

재고 시연 대시보드는 첫 로그인 후 목록을 열 때 자동 공개됩니다. 기존 DB에는 앱 시작 시 준비하고, 새 DB에는 첫 인증 조회에서 한 번 생성합니다. 고정 식별자로 중복 삽입을 막으며, 이후 관리자가 편집한 초안은 시작 때 덮어쓰지 않습니다.

DB는 Compose의 PostgreSQL named volume에 보존됩니다. 재고 JSON은 이미지에 포함되어 읽기 전용으로 제공됩니다. 로그 확인과 종료 명령:

```bash
docker compose --env-file .env -f docker/compose.yaml logs -f backend proxy
docker compose --env-file .env -f docker/compose.yaml down
```

`down -v`는 대시보드·사용자 DB 데이터를 지우므로 초기화가 필요할 때만 사용합니다.

## 사내 서버에서 실행

서버 주소에 맞춘 `.env`를 만들고 개발용 로그인은 끕니다. 예시는 외부 HTTPS 프록시가 TLS를 종료하고 내부 Nginx에 HTTP로 전달하는 구성입니다.

```dotenv
APP_ENV=production
ALLOWED_HOSTS=dashboard.company.example
PUBLIC_BASE_URL=https://dashboard.company.example
HOST_BIND_ADDRESS=0.0.0.0
HTTP_PORT=8080
SSO_ENABLED=true
DEV_AUTO_LOGIN=false
SESSION_COOKIE_SECURE=true
SSO_URI=https://<사내-SSO-허브>
SSO_EXCHANGE_BASE_URI=https://<OTT-교환-API-호스트>
SSO_BOOTSTRAP_ADMIN_SABUN=<관리자-사번>
```

배포 전 PostgreSQL 비밀번호를 충분히 강한 값으로 바꾸고 `SSO_CALLBACK_PATH`와 SSO return URL 등록값을 맞춥니다. callback URL은 `PUBLIC_BASE_URL`과 경로를 사용합니다(기본 `/sso/callback`). 외부 호스트명은 `ALLOWED_HOSTS`에 넣습니다. HTTPS 종료 프록시는 `Host`, `X-Forwarded-Proto`, `X-Forwarded-For`를 내부 Nginx로 전달하도록 설정합니다. 사내 방화벽/VPN에서 서비스 포트를 허용하고 PostgreSQL 포트는 외부로 열지 않습니다. `HOST_BIND_ADDRESS=0.0.0.0`은 접근을 허용할 네트워크를 정한 뒤에만 사용합니다.

```bash
docker compose --env-file .env -f docker/compose.yaml up --build -d
```

사내 실제 KTIS SSO 주소, OTT 응답 규격, callback 등록, 네트워크와 TLS 설정이 제공되지 않아 이 저장소에서는 실제 SSO 로그인 성공을 검증하지 못했습니다. 환경 설정이 준비되면 로그인·세션 만료·로그아웃을 확인해야 합니다. 그 전에는 개발 PC에서 localhost 전용 계정으로 화면 흐름을 시연할 수 있습니다.

## 로컬 코드 개발

백엔드와 프론트엔드를 별도로 실행할 수 있습니다. Python 3.12와 `uv`, Node.js 22가 필요합니다.

```bash
cd backend
uv sync
cp .env.example .env
# .env에 APP_ENV=development, SSO_ENABLED=false, DEV_AUTO_LOGIN=true 설정
uv run uvicorn app.main:app --reload --no-access-log --port 8080
```

다른 터미널에서:

```bash
cd frontend
npm ci
npm run dev
```

Vite는 API·로그인 경로를 FastAPI `localhost:8080`으로 전달합니다. 브라우저에서는 `http://localhost:5173`으로 접속합니다. 개발 로그인을 사용하면 관리자·이용자 버튼이 표시됩니다.

Docker Compose로 프론트 개발 서버를 실행하면 Node.js를 호스트에 설치하지 않아도 되고, 프론트 소스 저장 시 브라우저가 자동으로 갱신됩니다. 백엔드와 DB를 함께 시작하고 개발용 Vite 서버를 추가합니다.

```bash
docker compose --env-file .env -f docker/compose.yaml --profile dev up -d frontend-dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다. Vite는 `/api`, 로그인·로그아웃, 개발 로그인, SSO callback 요청을 Compose의 백엔드 서비스로 전달합니다. 개발 서버를 종료하려면 `docker compose --env-file .env -f docker/compose.yaml stop frontend-dev`를 실행합니다. 배포 형태를 확인할 때는 기존 `http://localhost:8080` 서비스를 사용합니다.

`frontend/package.json` 또는 `frontend/package-lock.json`을 바꾸면 `docker compose --env-file .env -f docker/compose.yaml --profile dev build frontend-dev`로 개발 이미지 의존성을 갱신한 뒤 다시 시작합니다.

## 브라우저 UI 테스트

개발용 `.env`와 Docker Compose 서비스가 준비된 상태에서 저장소 루트에서 실행합니다. Playwright와 Chromium이 포함된 컨테이너에서 관리자·이용자 권한, 실제 스냅샷 날짜 범위와 분류 조건, CSV의 현재 필터와 전체 표 행, 위젯 추가 드로어의 키보드 동작, 브라우저 뒤로·앞으로가기와 화면 복원, 직접 진입 안전 동작, 데스크톱·태블릿·모바일 레이아웃을 확인합니다. `frontend/tests/e2e/` 전체를 실행합니다.

```bash
docker compose --env-file .env -f docker/compose.yaml --profile test build e2e
docker compose --env-file .env -f docker/compose.yaml --profile test run --rm e2e
```

테스트는 `frontend/tests/e2e/`에 둡니다. 결과는 `frontend/test-results/`에 저장됩니다.

## 검증

```bash
cd backend
uv run python -m unittest discover -s tests -v
cd ../frontend
npm ci
npm run build
cd ..
docker compose --env-file .env -f docker/compose.yaml config
```

테스트는 관리자 생성→편집 저장→미리보기→공개 흐름, 초기 대시보드의 중복 방지·편집 보존, 필터 결과에서 카드·차트·표 합계 일치, 2026-09-08 정상 0건, 원본 주요 집계값, 비관리자 권한 거부, 공개 중지 후 직접 접근 차단과 초안 삭제를 확인합니다.

## 문서

- [제품·서비스 설계](design/product-design-blueprint.md)
- [화면·편집기](design/dashboard-ui-design.md)
- [대시보드 데이터 모델](design/dashboard-data-model.md)
- [API 계약](design/api-contract.md)
- [재고 데이터 계약](design/inventory-dataset-contract-draft.md)
- [보안·운영 기준](design/security-operations.md)
- [FastAPI 백엔드 실행 안내](backend/README.md)
