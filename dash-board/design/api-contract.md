# API 설계

인증 API는 현재 구현 기준이고 대시보드·데이터 소스 API는 신규 설계다. JSON 요청·응답을 사용하며 날짜는 YYYY-MM-DD, 시각은 시간대가 포함된 ISO 8601을 사용한다.

## 1. 인증

| Method | Path | 동작 |
|---|---|---|
| GET | /login | SSO 시작 |
| GET | /sso/callback | 토큰 교환·사용자 등록·세션 발급 |
| POST | /logout | 서버 세션 삭제·SSO 로그아웃 |
| GET | /api/auth/me | id, sabun, displayName, roles; 미인증 401 |

대시보드 구현 시 로그인 기본 복귀를 /dashboards로 변경한다. 현재는 /api/auth/me다. 현재 로그아웃의 X-Requested-With 헤더 검사에 더해 신규 상태 변경 API에는 보안 문서의 동일 출처·CSRF 처리를 적용한다.

## 2. 이용자 API

| Method | Path | 요청·응답 요약 |
|---|---|---|
| GET | /api/dashboards | q, page, page_size → 공개 목록·total |
| GET | /api/dashboards/{id} | 공개 설정·published_revision |
| GET | /api/dashboards/{id}/filter-options | revision, filter_id, q, cursor, 선택적 manufacturer → 선택지·다음 cursor |
| POST | /api/dashboards/{id}/query | 공개 번호·필터·표 조건·선택적 widget_ids → 계산 결과 |

목록 기본 page_size=20, 최대 100. 미공개·중지·삭제된 ID는 404로 처리한다. 공개 대상 정책은 서비스 설계를 따른다.

모델 선택지는 `filter_id=model`일 때 `manufacturer` 쿼리 파라미터를 반복해 선택한 제조사에 속한 모델만 받을 수 있다. 제조사를 지정하지 않으면 전체 모델을 반환한다. 제조사·모델 필터의 `전체` 선택은 빈 배열 `[]`로 조회한다.

데이터 요청 예시:

```json
{
  "published_revision": 2,
  "filters": {"as_of_date": "2026-09-10", "manufacturer": ["제조사A"]},
  "tables": {"w_table": {"page": 1, "page_size": 20}}
}
```

`as_of_date`는 종료일 스냅샷이다. 이용자 화면의 시작일은 실제 조회 가능 날짜 목록으로 검사하고 화면 상태에서만 사용한다. 현재 응답에 포함된 `inventory_history`에서 선택 기간의 날짜만 보여 주므로 요청에는 종료일만 전달하고 API 요청 계약은 바꾸지 않는다. 시작일과 종료일이 다르면 화면에서 같은 분류 조건의 시작일·종료일 수량 차이를 계산한다. 재고 카드·차트·표는 언제나 종료일 스냅샷을 사용한다. 서로 다른 날짜의 수량을 합산하지 않는다.

tables는 표 위젯이 있을 때만 보낸다. `widget_ids`를 생략하면 모든 위젯을 반환한다. 표 페이지·정렬을 바꿀 때는 `"widget_ids": ["w_table"]`처럼 해당 표 ID만 보내고, 응답의 해당 위젯만 교체한다. 빈 목록이나 설정에 없는 위젯 ID, 잘못된 필터·표 조건은 422다. 설정에 없는 임의 필드, 소스 ID나 수식을 받지 않는다.

응답 예시:

```json
{
  "published_revision": 2,
  "meta": {
    "as_of_date": "2026-09-10",
    "row_count": 120,
    "snapshot_row_count": 120,
    "source_updated_at": null,
    "fetched_at": "2026-09-10T09:00:00+09:00",
    "comparison_date": "2026-09-09",
    "comparison_count": 118,
    "comparison_delta": 2,
    "inventory_history": [
      {"as_of_date": "2026-09-08", "row_count": 0},
      {"as_of_date": "2026-09-09", "row_count": 118},
      {"as_of_date": "2026-09-10", "row_count": 120}
    ],
    "aging": {"source_field": "outPassovrDay", "count_30_to_89": 35, "count_90_plus": 10, "zero_count": 3, "unavailable_count": 0},
    "manufacturer_count": 1,
    "model_count": 2,
    "top_manufacturer": {"label": "제조사A", "count": 120, "share": 1.0},
    "top_model": {"label": "모델A", "count": 80, "share": 0.667},
    "unclassified_count": {"manufacturer": 0, "model": 0},
    "warnings": []
  },
  "widgets": [
    {"id": "w_total", "type": "metric", "value": 120, "unit": "대"},
    {"id": "w_maker", "type": "bar", "dimension_id": "manufacturer", "items": [{"label": "제조사A", "value": 120, "share": 1.0}], "total_value": 120, "included_value": 120, "remaining_value": 0, "remaining_share": 0.0, "category_count": 1, "remaining_categories": 0, "coverage": 1.0}
  ]
}
```

`row_count`는 종료일의 필터 적용 행 수이고 `snapshot_row_count`는 종료일 원본 전체 행 수다. `inventory_history`는 각 실제 제공 스냅샷에 같은 제조사·모델 조건을 적용한 수량이다. `aging`은 종료일의 동일한 필터 적용 행에서 `outPassovrDay` 값이 30~89일 또는 90일 이상인 수를 서로 겹치지 않는 구간으로 반환한다. 두 구간의 합이 30일 이상 건수다. 0 및 판정 불가 값은 별도 집계한다. 이 응답 필드는 기존 요청·대시보드 설정을 바꾸지 않는 추가 메타데이터다. `comparison_*`는 기존 단일 기준일 소비자를 위한 직전 스냅샷 비교값이다. 막대 차트의 item share와 coverage는 필터 적용 종료일 행을 분모로 계산한다. `remaining_value`와 `remaining_categories`는 제한 밖 항목을 설명하며, 표시 합계와 나머지 합계는 `row_count`와 일치한다. 표는 columns·rows·total·total_value·page·page_size를 반환하며 total_value도 같은 종료일 `row_count`를 나타낸다. 분모가 0이면 share와 coverage는 null이다.

선택지는 게시된 필터만 제공한다. ‘최근 조회 가능일’은 서버에서 해석하고 응답의 실제 기준일에 반영한다. 원천 갱신 시각 미제공은 null로 유지한다.

## 3. 관리자 API

모든 경로에 ROLE_SYSTEM 검사를 적용한다.

| Method | Path | 동작 |
|---|---|---|
| GET | /api/admin/dashboards | 제목·상태별 관리 목록 |
| POST | /api/admin/dashboards | title, description, source_id, 선택적 template_id로 생성 → 201 |
| GET | /api/admin/dashboards/{id} | 초안·상태·edit_version·published_revision |
| PUT | /api/admin/dashboards/{id}/draft | config, expected_edit_version → 저장 |
| POST | /api/admin/dashboards/{id}/preview | config, filters, tables → 저장 없이 조회 |
| POST | /api/admin/dashboards/{id}/publish | expected_edit_version, expected_published_revision → 공개 |
| POST | /api/admin/dashboards/{id}/unpublish | expected_published_revision → 공개 중지 |
| DELETE | /api/admin/dashboards/{id} | 기대 초안·공개 버전 query → 삭제, 204 |
| GET | /api/admin/data-sources | 사용 가능한 소스 목록 |
| GET | /api/admin/data-sources/{id} | 필드·지표·필터·지원 조회 방식·등록 템플릿 |
| GET | /api/admin/data-sources/{id}/filter-options | filter_id, q, cursor → 필터 후보값 |

서버 설정으로 등록한 소스만 노출한다. URL 등록·수정 API는 제공하지 않는다. 생성·편집 시 소스 상태와 허용 공개 대상을 검사한다. filter-options도 사용자·소스 권한과 결과 크기를 검사한다.

재고 소스의 `template_id=inventory_overview`를 선택하면 서버가 전체 재고 카드, 제조사별·모델별 막대 차트, 제조사·모델별 표와 기준일·제조사·모델 필터를 가진 초안을 만든다. `template_id`를 생략하면 빈 초안을 만든다. 임의 템플릿 ID는 422다.

미리보기는 임의 원천 접근을 허용하는 API가 아니다. 전달된 설정을 공개 시와 동일하게 검증한 후 등록 소스만 조회하며, 입력·결과를 영구 저장하지 않는다.

공개 시 클라이언트의 ‘미리보기 성공’ 플래그를 신뢰하지 않는다. 서버가 저장된 초안과 기본조건을 검사한다. 공개 중에 초안이 바뀌면 409로 실패하고 기존 공개본을 유지한다.

## 4. 오류와 동시 요청

신규 API 오류 형식:

```json
{
  "error": {
    "code": "CONFIG_INVALID",
    "message": "위젯 설정을 확인해 주세요.",
    "fields": [{"path": "widgets.0.metric_id", "message": "사용할 수 없는 지표입니다."}]
  }
}
```

| HTTP | 용도 |
|---|---|
| 401 | 미인증·세션 만료 |
| 403 | 관리자 권한 없음·소스 사용 불가 |
| 404 | 대시보드 없음·비공개 |
| 409 | 초안/공개 번호 충돌, 공개 상태에서 삭제 |
| 422 | 설정·필터·범위·요청 제한 위반 |
| 502 | 원천 데이터 구조 불일치·불완전 응답 |
| 503 | 원천 연결 실패·timeout |

기존 /api/auth/me의 401은 현재 code/message 형식을 유지한다. React 공통 클라이언트는 현재 인증 오류와 신규 error 형식을 모두 처리한다.

저장·공개 버튼은 처리 중 중복 클릭을 막고 성공 응답의 버전을 보관한다. 응답 유실 시 무조건 재전송하지 않고 상세 상태를 읽어 저장·공개 반영 여부를 먼저 확인한다.
