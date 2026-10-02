# Baby Benefits 2026

2026년 기준 대한민국 임신·출산 공통 정보와 주요 혜택을 정리한 정적 홈페이지입니다.

## Docker로 실행

```bash
docker compose up --build
```

브라우저에서 `http://localhost:8080`으로 접속합니다.

## 구성

- `src/index.html`: 페이지 마크업
- `src/styles.css`: 반응형 스타일
- `src/app.js`: 간단 지원금 계산
- `Dockerfile`: nginx 기반 정적 파일 서빙
- `docker-compose.yml`: 로컬 실행 구성

## 기준

전국 공통 제도를 중심으로 작성했습니다. 지자체별 출산축하금, 산후조리비, 교통비,
난임·고위험 임산부 지원은 주소지와 신청일에 따라 달라질 수 있습니다.
