# LifeRun Guide

Nuxt 3 기반의 Running / Baby 공개 서비스입니다. 주소 검색과 외부 공공 API 호출은 Nitro Server API에서 처리하며 API 키를 브라우저에 노출하지 않습니다.

## 구성

- `pages/`: `/running`, `/baby` SSR 페이지
- `components/`: 주소 검색, 공통 헤더/푸터, 상태 UI
- `server/api/`: 통일된 API 응답 형식
- `server/services/`: 날씨·주소·마라톤·혜택·어린이집·페이스 서비스
- `prisma/schema.prisma`: `run_pace`, `marathon_event`, `baby_checklist`, `baby_benefit`

## 로컬 실행

```bash
cp .env.local.example .env
npm install
npx prisma generate
npm run dev
```

PostgreSQL은 루트 `docker-compose.yml`의 `running-postgres` 또는 `running/docker-compose.yml`의 `postgres`를 사용합니다.

## 환경변수

`DATABASE_URL`, `PUBLIC_DATA_SERVICE_KEY`, `KAKAO_REST_API_KEY`, `KAKAO_JAVASCRIPT_KEY`, `APP_BASE_URL`을 설정합니다. `PUBLIC_DATA_SERVICE_KEY` 하나로 기상청과 공공데이터포털 대기질 API를 호출합니다. 실제 `.env`는 커밋하지 않습니다.

Kakao Developers에서 Local API를 활성화합니다. 주소 검색은 `address.json`, 병원은 `HP8`, 어린이집 후보는 `PS3`를 사용합니다.

## Prisma·검증

```bash
npx prisma migrate dev --name init
npm test
npm run build
npm run start
```

운영에서는 Nginx가 Nuxt 앞에서 reverse proxy를 담당하고 PostgreSQL 포트는 외부에 공개하지 않습니다. 상태 확인은 `GET /api/health`입니다.

## 데이터 한계

공식 API가 제공하지 않는 데이터는 임의로 만들지 않습니다. 마라톤은 출처가 등록된 DB 행만 표시하고, 공공데이터포털 대기질 측정소 매칭·공식 어린이집 상세 매칭·정책 적재가 필요한 항목은 provider를 추가해 연결할 수 있도록 분리했습니다.
