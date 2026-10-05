# leePF 자동 품질관리

## 구조

`running`의 기존 Nuxt/Prisma 테스트를 기준으로 GitLab Runner가 npm 의존성 설치, Prisma schema 검증, ESLint, Nuxt typecheck, unit test, disposable PostgreSQL integration test, Nuxt production build, dependency audit를 수행합니다. `RUN_E2E=true`이면 Playwright E2E도 실행합니다.

각 단계의 로그는 `artifacts/logs/`, 결과는 `reports/ci-summary.{md,json}`와 실패 분류 보고서로 남습니다.

자동 수정은 최대 `MAX_AUTO_FIX_ATTEMPTS=2`회이며, 전체 품질 게이트를 다시 통과한 경우에만 `auto-fix/*` branch에 push하고 GitLab MR을 생성합니다. MR은 자동 merge하지 않습니다. push/API 권한이 없으면 branch 생성과 검증까지만 수행합니다.

## 로컬 실행

```bash
cd running
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

통합 테스트는 운영 DB가 아닌 임시 PostgreSQL만 사용합니다.

```bash
docker compose -f docker-compose.ci.yml up -d running-postgres-ci
$env:DATABASE_URL_TEST = 'postgresql://liferun_test:liferun_test_password@localhost:5432/liferun_test'
cd running
npm run test:integration
```

Playwright 브라우저 설치 후 E2E를 실행합니다: `npx playwright install chromium && npm run test:e2e`. 이미 실행 중인 앱을 사용할 때는 `PLAYWRIGHT_BASE_URL`을 지정합니다. 외부 API는 기본 E2E에서 호출하지 않습니다.

## CI 변수와 안전정책

- `DATABASE_URL_TEST`: disposable GitLab PostgreSQL 연결 문자열
- `AUTO_FIX_ENABLED`: 기본 `false`; 안전한 branch에서만 명시적으로 `true`
- `CI_PUSH_TOKEN`, `GITLAB_API_TOKEN`: masked/protected 변수이며 로그에 출력하지 않음
- Kakao/공공데이터 키는 mock 또는 별도 optional contract job에서만 사용

CI는 production DB migration, production container restart, deployment, main/production 직접 commit을 하지 않습니다. Prisma migration의 `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, bulk delete는 `AUTO_FIX_SKIPPED`로 사람 검토를 요구합니다.

## Docker와 health

`running/Dockerfile`은 non-root `nuxt` 사용자로 실행됩니다. 운영 compose의 PostgreSQL은 외부 port를 publish하지 않습니다. `GET /api/health`는 application process와 Prisma DB 연결을 함께 확인하고, 외부 공공 API 장애는 health 판정에 포함하지 않습니다.

## 장애 대응

`reports/failure-report.md`의 분류와 `artifacts/logs/<step>.log`를 먼저 확인합니다. 인증/인가, 개인정보, secret, destructive migration, major dependency upgrade, business requirement 변경은 자동 수정하지 말고 사람이 MR을 작성합니다.
