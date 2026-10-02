# 대시보드 데이터 모델

## 1. 저장 범위

기존 users, user_roles, user_sessions를 유지한다. 추가 저장 대상은 대시보드 초안과 마지막 공개 설정이다. 원천 업무 행과 미리보기 결과는 영구 저장하지 않는다.

데이터 소스·필드·지표 정의는 초기에는 서버 설정으로 관리한다. 관리자 연결 관리 화면과 별도 데이터셋 관리 테이블은 만들지 않는다.

## 2. dashboards 테이블

| 항목 | 의미 |
|---|---|
| id | 대시보드 식별자(UUID) |
| draft_config | 편집 중 설정 JSON |
| published_config | 마지막 공개 설정 JSON, 최초 공개 전 null |
| visibility | draft / published / unpublished |
| edit_version | 초안 변경 때 증가하는 정수 |
| published_revision | 공개·공개 중지 시 증가하는 정수, 최초 0 |
| published_from_edit_version | 마지막 공개에 사용한 초안 버전 |
| created_by, updated_by, published_by | 사용자 ID, 마지막 공개자 nullable |
| created_at, updated_at, published_at | 생성·수정·공개 시각, 공개 시각 nullable |

제목·설명·소스 ID는 설정 JSON 안에 둔다. 이용자 목록은 published_config, 관리 목록은 draft_config를 사용한다. 초기 소규모 목록은 앱에서 제목 검색하며 DB별 JSON 검색 최적화는 필요 시 추가한다.

SQLite와 PostgreSQL에서 공통 JSON 타입을 사용한다. 위젯별 테이블은 만들지 않는다. JSON도 Pydantic 스키마와 서비스 규칙으로 검증한다.

## 3. 설정 형식 예시

다음은 재고 템플릿 설정의 일부 예시다. 소스·지표 ID는 서버 등록값과 맞춘다. 전체 템플릿에는 모델별 상위 10개 막대 차트, 제조사·모델별 집계 표, 모델 필터도 포함한다.

```json
{
  "schema_version": 1,
  "title": "재고 현황",
  "description": "기준일별 재고 확인",
  "source_id": "inventory",
  "filters": [
    {"id": "as_of_date", "label": "기준일", "default": {"mode": "latest"}},
    {"id": "manufacturer", "label": "제조사", "default": []}
  ],
  "widgets": [
    {
      "id": "w_total",
      "type": "metric",
      "title": "총 재고",
      "metric_id": "inventory_count",
      "width": 3,
      "decimals": 0
    },
    {
      "id": "w_maker",
      "type": "bar",
      "title": "제조사별 재고",
      "metric_id": "inventory_count",
      "dimension_id": "manufacturer",
      "width": 6,
      "sort": "value_desc",
      "limit": 10
    }
  ]
}
```

배열 순서가 표시 순서다. 허용 width는 3·4·6·12이며 행의 남은 폭이 부족하면 다음 행으로 넘긴다.

필터 정의의 유형·필수 여부·옵션은 소스 메타데이터에 따르고 관리자는 표시명·순서·허용 기본값을 정한다. 표는 dimension_ids, metric_ids, sort, page_size를 사용한다. 선 차트 설정은 후속 범위다.

설정에는 API 주소·비밀·SQL·실행 코드·차트 라이브러리의 임의 옵션을 저장하지 않는다.

## 4. 저장·공개 원자성

- 생성: 등록 템플릿을 선택하면 해당 설정을 복사한 draft_config, 선택하지 않으면 빈 위젯 배열의 draft_config를 저장한다. visibility=draft, edit_version=1.
- 저장: expected_edit_version과 현재 값이 같을 때 초안만 갱신하고 edit_version을 증가시킨다. 공개본은 그대로 둔다.
- 공개: 기대 초안·공개 버전을 확인하고 저장된 초안을 검증·조회한다. 최종 갱신 시 같은 버전인지 다시 확인한 뒤 공개 설정 복사·공개 번호 증가·상태 변경을 한 트랜잭션으로 수행한다.
- 공개 중지: 기대 공개 번호를 확인하고 visibility=unpublished, published_revision을 증가시킨다. 마지막 공개 설정은 유지한다.
- 삭제: 공개 상태가 아니고 기대 버전이 일치할 때 행을 삭제한다.

외부 조회 동안 DB 잠금을 길게 유지하지 않는다. 조회 후 조건부 UPDATE가 실패하면 409를 반환한다. 검증·조회 실패는 기존 공개본을 변경하지 않는다.

published_from_edit_version과 edit_version이 다르면 ‘미공개 변경 있음’이다. published_revision은 과거 이력 보관용이 아니라 조회 일관성과 동시 작업 충돌 검사용이다.

## 5. 조회 일관성

이용자는 공개 정의와 published_revision을 먼저 읽고 데이터 요청에 해당 번호를 보낸다. 서버 번호가 달라졌으면 409로 최신 정의 재조회를 요구한다.

원천 조회 후에도 공개 상태·공개 번호·사용자 접근을 재확인한다. 그 사이 공개 중지·삭제되었으면 데이터를 반환하지 않는다. 이미 이용자 브라우저에 전달된 결과까지 회수하는 기능은 제공하지 않는다.

## 6. 검증 규칙

제목 필수, 등록 소스, 고유 위젯 ID, 허용 위젯 유형·폭, 소스에 존재하는 필드·지표, 호환되는 필터, 최대 위젯·필터 수를 검사한다.

초안은 위젯 0개가 가능하지만 존재하는 위젯은 필수 설정을 갖춰야 저장된다. 편집 중 불완전 입력은 브라우저 상태로 유지한다. 공개는 위젯 1개 이상과 정상 기본조건 조회를 요구하며, 정상 0건은 공개 실패로 보지 않는다.
