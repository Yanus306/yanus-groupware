# 출퇴근 예외 처리 트러블슈팅

출퇴근 예외 처리는 총무/팀장이 매일 확인하는 운영 화면입니다. 백엔드 계약, mock 데이터, 화면 표시가 조금만 어긋나도 지각 정산과 미퇴근 처리 신뢰도가 바로 떨어지므로 아래 사례를 기준으로 점검합니다.

---

## 출근 내역 초기화가 500으로 실패

### 증상

- 대시보드에서 `출근 내역 초기화`를 누르면 서버가 500을 반환한다.
- 해당 출근 기록에 `attendance_exception`이 연결되어 있을 때 더 자주 재현된다.

### 원인

- 백엔드에서 `attendance` 삭제 전에 연결된 `attendance_exception`을 먼저 정리하지 않아 FK 제약에 걸렸다.
- 사용자가 이미 초기화했거나 기록이 없는 상태에서는 백엔드가 `ATTENDANCE_NOT_FOUND`를 반환할 수 있다.

### 해결

- 백엔드는 reset 전에 연결 예외를 cascade 삭제하거나 예외 FK를 안전하게 정리한다.
- 프론트는 `NOT_CHECKED_IN`뿐 아니라 `ATTENDANCE_NOT_FOUND`도 "초기화할 출근 기록이 없음"으로 처리한다.
- 회귀 테스트: `src/features/attendance/model/__tests__/useWorkSession.test.ts`의 `ATTENDANCE_NOT_FOUND` 케이스를 확인한다.

---

## 야간 근무 미퇴근 일괄 처리 시간이 당일로 닫힘

### 증상

- `22:00 ~ 다음날 06:00` 근무자가 미퇴근 상태일 때 일괄 자동 퇴근 후 `오늘 23:59` 또는 `오늘 06:00`처럼 잘못 표시된다.
- 예외 보드에서는 `22:00 - 다음날 06:00`으로 보이지만 실제 퇴근 시간이 다음날로 반영되지 않는다.

### 원인

- `workDate + autoCheckoutTime`만으로 퇴근 시각을 계산하면 야간 근무의 종료일을 알 수 없다.
- 프론트 mock handler도 같은 실수를 하면 로컬 QA가 실제 버그를 놓친다.

### 해결

- 백엔드는 예외 응답에 `endsNextDay`, `scheduledStartAt`, `scheduledEndAt`을 내려준다.
- 프론트는 화면 표시와 mock 일괄 처리 모두 `scheduledEndAt`을 우선 사용한다.
- `scheduledEndAt`이 없을 때만 `date + autoCheckoutTime`으로 fallback한다.
- 회귀 테스트: `src/shared/api/mock/handlers/__tests__/handlers.test.ts`의 야간 미퇴근 일괄 처리 케이스를 확인한다.

---

## 예외 보드 필터 후 다른 화면의 동일 이름 때문에 테스트가 흔들림

### 증상

- RTL 테스트에서 `이서연` 같은 이름을 검색하면 출근 현황 카드와 예외 보드 테이블이 동시에 잡힌다.
- `getByText`가 `Found multiple elements`로 실패한다.

### 원인

- 관리자 페이지는 출근 현황, 예외 처리, 정산이 한 화면에 공존한다.
- 동일 멤버명이 여러 섹션에 반복되므로 전역 쿼리가 불안정하다.

### 해결

- 예외 보드 테스트는 `출퇴근 예외 처리` heading의 `section`으로 범위를 좁힌다.
- 테이블 행 선택은 `within(row)`으로 유형과 멤버명을 함께 확인한다.

---

## 야간 근무가 지각 정산 합산에서 빠지는지 확인

### 증상

- 개인 정산 화면에서 `22:00 ~ 다음날 06:00` 근무가 단일 날짜 근무처럼 보인다.
- 관리자 전체/팀 정산의 지각 분, 지각비 합산이 야간 지각 항목을 포함하는지 확신하기 어렵다.

### 원인

- 정산 응답은 `scheduledStartTime`, `scheduledEndTime`만으로는 종료일을 표현할 수 없다.
- 화면이나 mock이 `scheduledStartAt`, `scheduledEndAt`을 무시하면 `06:00`이 당일 종료처럼 보인다.

### 해결

- 정산 항목도 예외 처리와 동일하게 `endsNextDay`, `scheduledStartAt`, `scheduledEndAt`을 유지한다.
- 개인 설정 정산, 관리자 전체/팀/개인 정산 모두 `formatScheduleRangeLabel`로 `22:00 - 다음날 06:00`을 표시한다.
- 회귀 테스트: `src/pages/settings/__tests__/Settings.test.tsx`, `src/pages/admin/__tests__/Admin.test.tsx`, `src/shared/lib/__tests__/attendanceSettlement.test.ts`에서 야간 지각 8분/800원 항목을 확인한다.

---

## 로컬 mock QA 체크리스트

- `.env.local`에 `VITE_USE_MOCK=true`를 설정한다.
- 관리자 계정으로 진입해 출근 현황의 `출퇴근 예외 처리` 보드를 확인한다.
- `22:00 - 다음날 06:00` 미퇴근 항목이 보이는지 확인한다.
- 메모 저장, 승인, 반려, 처리 완료를 각각 실행한다.
- `오늘 미퇴근자 일괄 처리` 후 실제 시간이 `22:02 - 06:00`처럼 다음날 종료 시각으로 표시되는지 확인한다.
- 지각비 정산에서 야간 지각 항목이 개인/팀/전체 합산에 포함되는지 확인한다.
