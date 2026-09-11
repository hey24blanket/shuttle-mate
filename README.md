# 셔틀메이트 v1

Next.js + TypeScript 기반의 운전자 / 학부모 / 운영자 셔틀 관리 앱.

## 실행

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

## 동작 모드

- 홈에서 역할별 체험: 가상 원생 4명과 망원동 샘플 노선. 같은 브라우저의 탭 사이에만 동기화됩니다. 실제 GPS, 외부 알림, 실제 기관 DB에 접근하지 않습니다.
- 기관 로그인: Firebase Auth 이메일/비밀번호 인증 후 서버가 등록 역할·조직·보호자 관계·배정 운전자를 검증합니다. 데이터는 4초 간격으로 갱신하며 저장은 RTDB transaction과 revision 비교로 충돌을 감지합니다. 다른 기기 사용은 이 모드가 필요합니다.

## 구현 범위

- 날짜별 운행 스냅샷, 기본 노선과 운행 상태 분리
- 출발 / 도착 / 개별 탑승·미탑승 / 출발 / 최종 하차 / 종료
- 미처리 학생·대기 요청이 있으면 출발 또는 종료 차단
- 결석 / 직접 이동 / 지연 / 지정 탑승지 변경 / 정상 탑승 복귀 요청
- 요청 승인·반려, 오늘 운행에만 적용
- 운영자 노선 순서·시간·차량·운전자 편집, 원생 배정, 날짜별 운행 생성
- 운행 이벤트·승하차 시간, CSV 다운로드
- 실제 모드의 전면 실행 GPS 공유 / 화면 켜짐 유지 요청 / 60초 지난 위치 숨김 / 종료 시 위치 삭제
- 반응형 화면, 홈 화면 설치용 manifest, 모션 감소 대응

## 기관 연결 설정

1. `.env.example`의 4개 값을 Vercel Preview에 등록합니다. 서비스 계정 JSON은 서버 전용이며 저장소에 커밋하지 않습니다.
2. Firebase Authentication에서 Email/Password를 활성화하고 초대할 계정을 생성합니다. 로그인 허용 도메인에 배포 도메인을 추가합니다.
3. 기존 `shuttle_v2`와 별개로 다음 자료를 Firebase 관리 콘솔에서 구성합니다.

```text
shuttle_v3/members/{firebaseAuthUid}
  role: admin | driver | parent
  orgId: 기관 식별자 (영문/숫자/_/-)
  displayName: 표시 이름
  studentIds: [내 아이 ID] (보호자만)

shuttle_v3/organizations/{orgId}/state
  version: 1
  revision: 0
  route: { name, driverId, driverName, vehicle, stops: [...], students: [...] }
  trips: {}
  selectedTripId: ""
```

정차지 타입 `{id, name, time: '14:00', order: 0, lat?, lng?}`. 원생 타입 `{id, name, crew, stopId}`. 마지막 정차지는 최종 목적지입니다. 운전자 ID는 Firebase Auth UID와 일치해야 합니다. 등록 후 운영자 화면에서 날짜를 선택해 운행을 생성합니다. 현재 1개 기관당 1개 노선 / 날짜별 1회 픽업 운행을 지원합니다.

4. `database.rules.json`은 **v3 경로의 정책 예시**입니다. 기존 DB 전체에 덮어쓰지 말고 기존 규칙을 점검한 뒤 해당 경로에 통합합니다. RTDB 상위 경로에 public read/write가 있으면 하위 false 규칙으로 상위 허용을 취소할 수 없으므로 상위 규칙도 함께 수정해야 합니다. 브라우저의 v3 직접 접근은 차단하고 모든 읽기·쓰기는 서버 API를 통합니다.
5. 기관 계정 3개와 실제 휴대폰 2대로 보호자 데이터 격리, 운전자 배정, 승하차, 연결 중단, GPS를 검증한 다음 Production에 반영합니다.

## 아직 외부 연결 / 현장 확인이 필요한 부분

- 기관 Auth·서비스 계정·회원 등록 설정과 실제 데이터 이관
- FCM/OS 푸시: 현재는 화면 내 갱신과 운행 소식만 제공
- 실제 지도 임베드·장소 검색·도로 ETA: 현재 지도 영역은 명시된 노선 안내 그림이며 지도 링크만 제공. 정확한 분 단위 ETA를 생성하지 않습니다.
- 실제 주행, iOS/Android 화면 꺼짐·백그라운드 GPS 검증
- 여러 차량/노선, 왕복 운행, 자동 날짜별 생성, 회원 초대 UI

체험 화면은 실제 업무용 권한 보장을 시연하는 보안 경계가 아닙니다. 실제 보안 경계는 서버에서 검증하는 Firebase 토큰과 회원 매핑입니다. 기존 `index.html`은 이전 커밋에 보존되어 있으며 새 Next.js 배포에서 제공하지 않습니다. 기존 노출 지도 REST 키의 폐기/제한은 공급자 콘솔에서 별도로 확인해야 합니다.
