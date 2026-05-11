# 디지털헬스케어센터 웹사이트

## 프로젝트 소개

디지털헬스케어센터 웹사이트는 운동과학 기반 전문직업인력 양성을 위한 교육 및 자격 인증 관리 플랫폼입니다. 기관 소개, 자격증 정보 제공, 온라인 강의, 자격증 신청 및 결제 기능, 수험자 일정 및 시험 결과 관리 등 디지털헬스케어센터의 활동을 종합적으로 지원합니다.

### 주요 기능

- **기관 소개**: 센터 소개, 비전 및 전략, 조직도, 강사 소개
- **자문위원**: 총재 1명, 자문위원 150명 (분야별 필터, 이름/소속 검색, 페이지네이션)
- **학술·연구**: 국내·국제 학회 및 연구소 소개, 홈페이지 바로가기 링크
- **자격증 소개**: 건강운동처방사, 운동재활전문가, 필라테스 전문가, 레크리에이션지도자 자격증 정보
- **교육 과정**: 교육 과정 안내, 신청, 결제 (통합)
- **게시판**: 공지사항, 칼럼, 강의자료, 동영상 강의
- **인증 시스템**: 회원가입, 로그인, 계정 관리
- **마이페이지**: 개인정보 관리, 수강 내역, 자격증 관리 (발급/갱신 통합), 결제 내역
- **관리자 기능**: 회원 관리, 교육 관리, 자격증 관리, 게시판 관리, 결제 관리

## 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript
- **백엔드**: Firebase (Authentication, Firestore, Storage, Hosting, Functions v1)
- **UI 프레임워크**: Tailwind CSS
- **결제**: 토스페이먼츠 v2 SDK
- **외부 라이브러리**:
  - Firebase SDK v9 compat (CDN)
  - Daum 우편번호 API
  - PDF 생성 라이브러리 (자격증 발급용)

## 디렉토리 구조

```
digital-healthcare-center/
├── index.html                # 메인 페이지
├── pages/                    # 서브 페이지들
│   ├── about.html           # 기관 소개 페이지 ✓
│   ├── advisor.html         # 자문위원 페이지 ✓ (총재 1명 + 자문위원 150명, 검색/필터/페이지네이션)
│   │
│   ├── research/             # 학술·연구 관련 페이지들
│   │   ├── domestic.html    # 국내 학술·연구 (학회 2개 + 연구소 2개) ✓
│   │   └── international.html # 국제 학술·연구 (학회 1개 + 연구소 1개) ✓
│   │
│   ├── certificate/          # 자격증 관련 페이지들
│   │   ├── health-exercise.html  # 건강운동처방사 ✓
│   │   ├── rehabilitation.html   # 운동재활전문가 ✓
│   │   ├── pilates.html          # 필라테스 전문가 ✓
│   │   └── recreation.html       # 레크리에이션지도자 ✓
│   │
│   ├── education/            # 교육 과정 관련 페이지들
│   │   ├── course-application.html # 교육 신청 + 결제 통합 ✓
│   │   ├── cert-application.html # 자격증 신청 ✓
│   │   └── instructors.html  # 강사 소개 ✓
│   │
│   ├── board/                # 게시판 관련 페이지들
│   │   ├── notice/           # 공지사항
│   │   ├── column/           # 칼럼
│   │   ├── materials/        # 강의자료
│   │   └── videos/           # 동영상 강의
│   │
│   ├── auth/                 # 인증 관련 페이지들
│   │   ├── login.html        # 로그인 ✓
│   │   ├── signup.html       # 회원가입 ✓
│   │   └── find-account.html # 계정찾기 ✓
│   │
│   ├── mypage/               # 마이페이지 관련 페이지들
│   │   ├── personal-info.html  # 개인정보 관리 ✓
│   │   ├── course-history.html # 수강 내역 ✓
│   │   ├── cert-management.html # 자격증 관리 (발급+갱신 통합) ✓✨
│   │   └── payment-history.html # 결제 내역 ✓
│   │
│   ├── payment/
│   │   ├── fail.html
│   │   └── success.html
│   │
│   └── admin/                # 관리자 페이지들
│       ├── dashboard.html    # 대시보드 ✓
│       ├── user-management.html # 회원 관리 ✓
│       ├── course-management.html # 교육 관리 ✓
│       ├── cert-management.html # 자격증 관리 ✓
│       ├── board-management.html # 게시판 관리 ✓
│       └── payment-management.html # 결제 관리 ✓
│
├── assets/
│   ├── css/                  # CSS 파일들
│   └── js/
│       ├── config/
│       │   └── firebase-config.js
│       ├── services/
│       │   ├── auth-service.js
│       │   ├── db-service.js
│       │   ├── storage-service.js
│       │   ├── api-service.js
│       │   ├── payment-service.js
│       │   └── local-auth-override.js
│       ├── utils/
│       │   ├── script-loader.js  # 전역 에러 핸들러 포함
│       │   ├── admin-auth.js
│       │   └── ...
│       ├── components/
│       └── pages/
│
├── functions/
│   └── index.js              # Cloud Functions (결제, 헬스체크, 자동 백업)
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── storage.rules
```

## 관리자 계정 설정

관리자 권한은 Firestore `users` 컬렉션의 `userType` 필드로 관리합니다. 소스 코드에 관리자 이메일을 하드코딩하지 않습니다.

### 관리자 계정 등록 방법

1. Firebase Console → Authentication에서 계정 생성
2. Firebase Console → Firestore → `users` 컬렉션에서 해당 UID 문서의 `userType` 필드를 `'admin'`으로 설정

```js
// Firestore users/{uid} 문서 구조
{
  email: "admin@example.com",
  userType: "admin",   // "student" | "admin"
  status: "active",
  ...
}
```

### 관리자 기능

- **대시보드**: 시스템 전반적인 통계 및 현황
- **회원 관리**: 사용자 계정 관리 및 권한 설정
- **교육 관리**: 교육 과정 생성, 수정, 삭제
- **자격증 관리**: 자격증 발급, 갱신, 관리
- **게시판 관리**: 공지사항, 칼럼, 강의자료, 동영상 관리
- **결제 관리**: 결제 내역 조회, 환불 처리

## 로컬 개발 및 배포

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/labcome/digital-healthcare-center.git
cd digital-healthcare-center

# Firebase CLI 설치
npm install -g firebase-tools
firebase login

# 로컬 에뮬레이터 실행 (Functions 테스트 시)
cd functions && npm install
firebase emulators:start --only functions
```

### 스크립트 로딩 방식

모든 페이지는 `script-loader.js`를 가장 먼저 로드합니다.

```html
<!-- head 태그 안 -->
<script src="../../assets/js/utils/script-loader.js"></script>

<!-- 페이지 하단 -->
<script id="firebase-sdk-template" type="text/template">
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"><\/script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"><\/script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"><\/script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js"><\/script>
    <script src="{basePath}assets/js/config/firebase-config.js"><\/script>
    <script src="{basePath}assets/js/services/auth-service.js"><\/script>
    <script src="{basePath}assets/js/services/db-service.js"><\/script>
    <script src="{basePath}assets/js/services/storage-service.js"><\/script>
</script>
```

### 배포

```bash
# 전체 배포 (Hosting + Functions + Rules)
firebase deploy

# Functions만 배포
firebase deploy --only functions

# Hosting만 배포
firebase deploy --only hosting
```

### Hosting 롤백

Firebase Hosting은 배포 버전 이력을 보관합니다.

```bash
# 배포 이력 확인
firebase hosting:releases:list

# 롤백: Firebase Console → Hosting → 이전 버전 → [Rollback] 클릭
```

### Cloud Functions 롤백

Functions에는 자동 롤백 기능이 없습니다. git으로 이전 커밋을 체크아웃 후 재배포합니다.

```bash
git checkout <이전-커밋-해시> -- functions/index.js
firebase deploy --only functions
git checkout HEAD -- functions/index.js
```

## Cloud Functions

`functions/index.js`에 다음 함수들이 정의되어 있습니다.

| 함수 | 경로 | 설명 |
|---|---|---|
| `confirmPayment` | `POST /api/confirmPayment` | 토스페이먼츠 결제 승인 (멱등성 검사 포함) |
| `cancelPayment` | `POST /api/cancelPayment` | 결제 취소 (관리자 전용) |
| `deleteAuthUser` | `POST /api/deleteAuthUser` | Firebase Auth 계정 삭제 (관리자 전용) |
| `tossWebhook` | `POST /api/tossWebhook` | 토스 웹훅 수신 및 역검증 |
| `healthCheck` | `GET /api/health` | 서비스 상태 확인 |
| `scheduledBackup` | 매일 03:00 KST | Firestore 자동 백업 |

### 환경 변수 설정

```bash
# 토스페이먼츠 시크릿 키 등록 (배포 전 필수)
firebase functions:secrets:set TOSS_SECRET_KEY
# 입력 프롬프트에 live_sk_... 값 입력
```

로컬 테스트 시 `functions/.env` 파일 생성:

```
TOSS_SECRET_KEY=test_sk_...
```

### 감사 로그

결제 관련 모든 이벤트는 Firestore `_payment_logs` 컬렉션에 자동 기록됩니다.

| action | 발생 시점 |
|---|---|
| `confirm_success` | 결제 승인 성공 |
| `confirm_failed` | 결제 승인 실패 (Toss 오류) |
| `confirm_error` | 결제 승인 중 서버 오류 |
| `cancel_success` | 결제 취소 성공 |
| `cancel_failed` | 결제 취소 실패 |
| `webhook_processed` | 웹훅 처리 완료 |

## 운영 및 모니터링

### 헬스체크

`GET https://dhcenter.co.kr/api/health` 로 서비스 상태를 확인할 수 있습니다.

```json
{
  "status": "ok",
  "checks": {
    "firestore": "ok",
    "tossSecretKey": "configured"
  },
  "responseTimeMs": 142,
  "timestamp": "2026-05-11T18:00:00.000Z"
}
```

외부 업타임 모니터(UptimeRobot 무료 플랜 등)에서 이 URL을 5분 간격으로 호출하면 장애 발생 시 이메일/SMS 알림을 받을 수 있습니다.

### 배포 후 체크리스트

배포 직후 아래 항목을 순서대로 확인합니다.

```
□ 메인 페이지 로드 확인 (dhcenter.co.kr)
□ 로그인 → 내 정보 페이지 진입
□ 교육 과정 목록 로드 확인
□ GET /api/health → 200 OK, "status": "ok" 확인
□ Firebase Console → Functions → 에러 0건 확인
□ Firebase Console → Firestore → 최근 _health/ping 문서 갱신 확인
```

### 클라이언트 에러 로그 확인

프로덕션에서 JS 런타임 에러와 미처리 Promise 오류는 `localStorage`에 자동 저장됩니다.  
문제가 의심될 때 DevTools 콘솔에서 다음 명령어로 확인합니다.

```js
window.getErrorLog()
// 최근 50건의 에러 배열 반환
// [ { type, detail, url, ts }, ... ]
```

### Cloud Logging 확인

Cloud Functions의 구조화된 로그는 Google Cloud Console에서 확인합니다.

1. [Google Cloud Console](https://console.cloud.google.com) → Logging → Log Explorer
2. 필터: `resource.type="cloud_function"` + `severity>=ERROR`
3. 또는 Firebase CLI로 빠른 확인:

```bash
firebase functions:log --only confirmPayment
```

## Firestore 자동 백업

매일 오전 3시(KST) `scheduledBackup` 함수가 실행되어 주요 컬렉션을 Cloud Storage로 내보냅니다.

백업 대상 컬렉션: `users`, `payments`, `enrollments`, `certificates`, `applications`, `pending_applications`, `_payment_logs`

### 최초 설정 (1회만 실행)

Cloud Storage 버킷 생성과 서비스 계정 권한 부여가 필요합니다.  
`gcloud` CLI가 없으면 먼저 [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)를 설치하고 `gcloud auth login`을 실행합니다.

```bash
# 1. 백업용 버킷 생성 (서울 리전)
gcloud storage buckets create gs://digital-healthcare-cente-2204b-backups \
  --location=asia-northeast3

# 2. 서비스 계정에 Firestore 내보내기 권한 부여
gcloud projects add-iam-policy-binding digital-healthcare-cente-2204b \
  --member="serviceAccount:digital-healthcare-cente-2204b@appspot.gserviceaccount.com" \
  --role="roles/datastore.importExportAdmin"

# 3. 서비스 계정에 스토리지 쓰기 권한 부여
gcloud storage buckets add-iam-policy-binding gs://digital-healthcare-cente-2204b-backups \
  --member="serviceAccount:digital-healthcare-cente-2204b@appspot.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### 배포

```bash
firebase deploy --only functions
```

Firebase Console → Functions 목록에 `scheduledBackup`이 표시되면 완료입니다.

### 즉시 테스트

배포 후 정상 동작 여부를 확인하려면:

1. [Firebase Console](https://console.firebase.google.com) → Functions → `scheduledBackup` → 상세 → **지금 실행**
2. [Cloud Storage Console](https://console.cloud.google.com/storage) → `digital-healthcare-cente-2204b-backups` 버킷에 날짜 폴더 생성 확인

### 백업 파일 구조

```
gs://digital-healthcare-cente-2204b-backups/
  └── 2026-05-11/
        └── all_namespaces/
              └── kinds/
                    ├── users/
                    ├── payments/
                    ├── enrollments/
                    └── ...
```

### 복구 방법

특정 날짜 백업으로 복구할 때는 아래 명령어를 사용합니다.  
`--collection-ids`를 지정하면 특정 컬렉션만 선택적으로 복구할 수 있습니다.

```bash
# 전체 복구 (기존 데이터 덮어씀 — 신중하게 사용)
gcloud firestore import gs://digital-healthcare-cente-2204b-backups/2026-05-11

# 특정 컬렉션만 복구
gcloud firestore import gs://digital-healthcare-cente-2204b-backups/2026-05-11 \
  --collection-ids=payments,enrollments
```

> **주의**: 복구는 기존 데이터를 덮어씁니다. 가능하면 별도 프로젝트에서 먼저 테스트하세요.

## 보안

### 적용된 보안 조치

- **관리자 권한**: 소스 코드의 하드코딩 이메일 제거 → Firestore `userType` 필드 기반으로 통일
- **콘솔 로그**: 프로덕션에서 `console.log` 비활성화, 개인정보(이메일·전화번호·주소·UID) 로깅 전면 제거
- **에러 메시지**: 사용자 노출 오류 메시지에서 내부 Firebase 오류 코드·스택 제거
- **결제 키**: `paymentKey`를 URL, 콘솔 로그에서 제거
- **원자적 쓰기**: `payments` + `enrollments` 동시 생성을 Firestore `batch()`로 처리
- **자격증 번호**: 카운터 증가 + 자격증 업데이트를 단일 `runTransaction()`으로 처리

### 프로덕션 디버깅

프로덕션 환경에서 콘솔 로그가 필요한 경우 관리자 계정으로 로그인 후 DevTools 콘솔에서 실행합니다.

```js
// 관리자 계정으로 로그인된 상태에서 실행
await enableAdminDebug()
// → Firestore userType 검증 후 디버그 모드 활성화, 페이지 자동 새로고침
```

## 사용된 외부 리소스

- [Firebase](https://firebase.google.com/) - 백엔드 서비스
- [토스페이먼츠](https://docs.tosspayments.com/) - 결제 연동 (v2 SDK)
- [Tailwind CSS](https://tailwindcss.com/) - UI 스타일링
- [Google Fonts - Noto Sans KR](https://fonts.google.com/specimen/Noto+Sans+KR) - 웹 폰트
- [Daum 우편번호 API](https://postcode.map.daum.net/guide) - 주소 검색

## 변경 이력

### 2026-05-11 — 보안 강화 및 운영 안정성 개선

#### 보안 수정

- **관리자 이메일 하드코딩 제거**: `admin.js`, `board.js`, `dashboard.js`, `script-loader.js`, `signup.js`, `header.js` 등 전체 파일에서 하드코딩된 관리자 이메일 제거 → Firestore `userType === 'admin'` 체크로 통일
- **개인정보 콘솔 로그 제거**: `auth-service.js`, `admin-auth.js`, `personal-info.js`, `cert-management-enhanced.js`, `login.js`, `signup.js`, `course-application.js`, `cert-application.js`, 관리자 3개 페이지 등 11개 파일에서 이메일·전화번호·주소·UID 로깅 제거
- **내부 에러 메시지 노출 제거**: `board-management.js`, `personal-info.js`, `signup.js`, `success.js` 등에서 Firebase 오류 코드/스택을 사용자 화면에 그대로 출력하던 코드 수정
- **결제 키 노출 제거**: `success.js`에서 `paymentKey`를 URL 파라미터, 콘솔 로그에 출력하던 코드 제거

#### 데이터 정합성 수정 (부분 쓰기 방지)

- **`success.js`**: `payments` + `enrollments` 두 컬렉션 생성을 별도 호출 → 단일 `db.batch()` 커밋으로 원자화
- **`cert-management.js` (admin)**: 자격증 번호 카운터 증가 + 자격증 상태 업데이트를 단일 `runTransaction()`으로 원자화, 승인/거절에 `_processingIds` 중복 처리 방지 추가
- **`cert-management-enhanced.js`**: 갱신 신청 모달 중복 열기 방지, 스토리지 고아 파일 업로드 즉시 추적 후 오류 시 개별 삭제
- **`payment-management.js` (admin)**: 결제 취소 전 Firestore 실시간 상태 재조회로 캐시 기반 오류 방지

#### 런타임 버그 수정

- **`functions/index.js:277`**: `deleteAuthUser`의 관리자 권한 검사 필드 `role` → `userType` 수정 (회원 삭제 기능 항상 403이던 버그)
- **`login.js:186`**: `new firebase.auth.GoogleAuthProvider()` → `new window.dhcFirebase.firebase.auth.GoogleAuthProvider()` (전역 참조 일관성)
- **`course-application.js`**: `buildTossPaymentData`에서 `applicationData.orderId` 기록 추가
- **`success.js:160`**: Firestore 폴백 검색 키 `applicationId` → `orderId` 수정 (localStorage 없는 환경에서 결제 후 수강 등록 실패하던 버그)

#### 배포 전 최종 점검 수정

- **보안 헤더 추가** (`firebase.json`): `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` 5개 HTTP 응답 헤더를 모든 경로에 적용
- **테스트 데이터 제거** (`user-management.js`): 실제 이메일 주소와 가짜 UID가 하드코딩된 `syncMissingUsers()` 내 `knownUsers` 배열 제거 — 배포 시 Firestore에 유효하지 않은 사용자 문서가 생성될 수 있었음

#### 운영 가시성 추가

- **`functions/index.js`**: `console.*` → `logger.*` 전환 (Google Cloud Logging 심각도 분류 적용)
- **`functions/index.js`**: `writePaymentLog()` 추가 — 결제 이벤트를 `_payment_logs` 컬렉션에 감사 로그로 기록
- **`functions/index.js`**: `confirmPayment`에 멱등성 검사 추가 — 동일 `orderId` 중복 승인 요청 방지
- **`functions/index.js`**: `healthCheck` 함수 추가 (`GET /api/health`)
- **`functions/index.js`**: `scheduledBackup` 함수 추가 — 매일 03:00 KST 7개 컬렉션 Cloud Storage 자동 백업
- **`firebase.json`**: `/api/health` 라우팅 추가
- **`script-loader.js`**: `window.onerror` + `unhandledrejection` 전역 에러 핸들러 추가 — 클라이언트 오류를 `localStorage['dhc_error_log']`에 누적 저장, `window.getErrorLog()` 확인 함수 제공

---

### 2026-02-19 — 자문위원 및 학술·연구 메뉴 추가

- 헤더 네비게이션에 `자문위원`, `학술·연구` 메뉴 추가
- 자문위원 페이지 신규 개발 (총재 + 자문위원 150명, 검색/필터/페이지네이션)
- 학술·연구 국내/국제 페이지 신규 개발
- 수정 파일: `index.html`, `assets/js/components/header.js`

### 2026-01-26 — 교육 과정 관리 개선

- 신청자 관리 마스터-디테일 패턴 구현
- 정원/신청자 표시 순서 수정, 기수 입력 필드 추가
- Firebase 복합 쿼리 최적화

### 2025-05-28 — 주요 구조 개선

- 교육 신청 + 결제, 자격증 신청 + 결제 각각 원스톱 통합
- 중복 파일 정리 (`payment.html`, `cert-issuance.html`, `cert-renewal.html` 삭제)
- `cert-management-enhanced.js`로 자격증 발급/갱신 통합

### 2025-05-13 — 관리자 시스템 완성

- 관리자 권한 미들웨어, 대시보드 통계, 자격증 발급 관리, 결제 관리 기능 구현
- 스크립트 로더 유틸리티 개선

### 2025-05-10~12 — 초기 개발

- 프로젝트 초기 설정
- 인증, 자격증, 교육, 게시판, 마이페이지, 관리자 모듈 전체 개발 완료
- Firebase 인증/DB/스토리지 서비스 모듈 구현
