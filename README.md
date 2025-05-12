# 디지털헬스케어센터 웹사이트

## 프로젝트 소개

디지털헬스케어센터 웹사이트는 운동과학 기반 전문직업인력 양성을 위한 교육 및 자격 인증 관리 플랫폼입니다. 이 웹사이트는 기관 소개, 자격증 정보 제공, 온라인 강의, 자격증 신청 및 결제 기능, 수험자 일정 및 시험 결과 관리 등 디지털헬스케어센터의 활동을 종합적으로 지원합니다.

### 주요 기능

- **기관 소개**: 센터 소개, 비전 및 전략, 조직도, 강사 소개
- **자격증 소개**: 건강운동처방사, 운동재활전문가, 필라테스 전문가, 레크리에이션지도자 자격증 정보
- **교육 과정**: 교육 과정 안내, 신청, 결제
- **게시판**: 공지사항, 칼럼, 강의자료, 동영상 강의
- **인증 시스템**: 회원가입, 로그인, 계정 관리
- **마이페이지**: 개인정보 관리, 수강 내역, 자격증 관리, 결제 내역
- **관리자 기능**: 회원 관리, 교육 관리, 자격증 관리, 게시판 관리, 결제 관리

## 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript
- **백엔드**: Firebase (Authentication, Firestore, Storage, Hosting, Functions)
- **UI 프레임워크**: Tailwind CSS
- **외부 라이브러리**: 
  - Firebase SDK
  - 결제 모듈 (PG사 연동)
  - PDF 생성 라이브러리 (자격증 발급용)

## 디렉토리 구조

```
digital-healthcare-center/
├── index.html                # 메인 페이지
├── pages/                    # 서브 페이지들
│   ├── about/                # 기관 소개 관련 페이지들
│   │   ├── overview.html     # 개요 ✓
│   │   ├── vision.html       # 목표 및 전략 ✓
│   │   ├── business.html     # 사업 내용 ✓
│   │   ├── organization.html # 조직도 ✓
│   │   └── instructors.html  # 강사 소개 ✓
│   │
│   ├── certificate/          # 자격증 관련 페이지들
│   │   ├── health-exercise.html  # 건강운동처방사 ✓
│   │   ├── rehabilitation.html   # 운동재활전문가 ✓
│   │   ├── pilates.html          # 필라테스 전문가 ✓
│   │   └── recreation.html       # 레크리에이션지도자 ✓
│   │
│   ├── education/            # 교육 과정 관련 페이지들
│   │   ├── course-info.html      # 교육 과정 안내 ✓
│   │   ├── course-application.html # 교육 신청 ✓
│   │   ├── cert-application.html # 자격증 신청 ✓
│   │   ├── payment.html          # 결제 페이지 ✓
│   │   ├── exam-info.html        # 시험 안내 ✓
│   │   ├── cert-issuance.html    # 자격증 발급 ✓
│   │   └── cert-renewal.html     # 자격증 갱신 ✓
│   │
│   ├── board/                # 게시판 관련 페이지들
│   │   ├── notice/           # 공지사항
│   │   │   ├── index.html    # 목록 ✓
│   │   │   └── view.html     # 상세보기 ✓
│   │   ├── column/           # 칼럼
│   │   │   ├── index.html    # 목록 ✓
│   │   │   └── view.html     # 상세보기 ✓
│   │   ├── materials/        # 강의자료
│   │   │   ├── index.html    # 목록 ✓
│   │   │   └── view.html     # 상세보기 ✓
│   │   └── videos/           # 동영상 강의
│   │       ├── index.html    # 목록 ✓
│   │       └── view.html     # 상세보기 ✓
│   │
│   ├── auth/                 # 인증 관련 페이지들
│   │   ├── login.html        # 로그인 ✓
│   │   ├── signup.html       # 회원가입 ✓
│   │   └── find-account.html # 계정찾기 ✓
│   │
│   ├── mypage/               # 마이페이지 관련 페이지들
│   │   ├── personal-info.html  # 개인정보 관리 ✓
│   │   ├── course-history.html # 수강 내역 ✓
│   │   ├── cert-management.html # 자격증 관리 ✓
│   │   └── payment-history.html # 결제 내역 ✓
│   │
│   └── admin/                # 관리자 페이지들
│       ├── dashboard.html    # 대시보드 ✓
│       ├── user-management.html # 회원 관리 ✓
│       ├── course-management.html # 교육 관리 ✓
│       ├── cert-management.html # 자격증 관리 ✓
│       ├── board-management.html # 게시판 관리 ✓
│       └── payment-management.html # 결제 관리 ✓
│
├── assets/                   # 정적 자원
│   ├── css/                  # CSS 파일들
│   │   ├── main.css          # 모든 CSS 파일을 import하는 메인 파일 ✓
│   │   ├── base/             # 기본 스타일
│   │   │   ├── reset.css     # CSS 리셋 또는 normalize ✓
│   │   │   ├── typography.css # 타이포그래피 스타일 ✓
│   │   │   ├── colors.css    # 색상 변수 정의 ✓
│   │   │   └── variables.css # 기타 CSS 변수 정의 ✓
│   │   │
│   │   ├── layout/           # 레이아웃 스타일
│   │   │   ├── grid.css      # 그리드 시스템 ✓
│   │   │   ├── header.css    # 헤더 스타일 ✓
│   │   │   ├── footer.css    # 푸터 스타일 ✓
│   │   │   ├── sidebar.css   # 사이드바 스타일 ✓
│   │   │   └── container.css # 컨테이너 스타일 ✓
│   │   │
│   │   ├── components/       # 컴포넌트 스타일
│   │   │   ├── buttons.css   # 버튼 스타일 ✓
│   │   │   ├── forms.css     # 폼 요소 스타일 ✓
│   │   │   ├── cards.css     # 카드 컴포넌트 스타일 ✓
│   │   │   ├── tables.css    # 테이블 스타일 ✓
│   │   │   ├── alerts.css    # 알림 메시지 스타일 ✓
│   │   │   ├── badges.css    # 뱃지 스타일 ✓
│   │   │   ├── modal.css     # 모달 스타일 ✓
│   │   │   ├── navigation.css # 네비게이션 스타일 ✓
│   │   │   └── pagination.css # 페이지네이션 스타일 ✓
│   │   │
│   │   ├── pages/            # 페이지별 스타일
│   │   │   ├── home.css      # 홈페이지 특정 스타일 ✓
│   │   │   ├── certificate.css # 자격증 페이지 스타일 ✓
│   │   │   ├── education.css # 교육 페이지 스타일 ✓
│   │   │   ├── board.css     # 게시판 페이지 스타일 ✓
│   │   │   ├── auth.css      # 인증 페이지 스타일 ✓
│   │   │   ├── mypage.css    # 마이페이지 스타일 ✓
│   │   │   └── admin.css     # 관리자 페이지 스타일 ✓
│   │   │
│   │   └── utilities/        # 유틸리티 스타일
│   │       ├── spacing.css   # 여백 유틸리티 클래스 ✓
│   │       ├── flex.css      # 플렉스 유틸리티 클래스 ✓
│   │       ├── display.css   # 디스플레이 유틸리티 클래스 ✓
│   │       └── text.css      # 텍스트 유틸리티 클래스 ✓
│   │
│   ├── js/                   # JavaScript 파일들
│   │   ├── main.js           # 메인 JavaScript 파일 ✓
│   │   │
│   │   ├── config/           # 설정 파일
│   │   │   └── firebase-config.js # Firebase 설정 ✓
│   │   │
│   │   ├── services/         # 서비스 모듈
│   │   │   ├── auth-service.js   # 인증 관련 서비스 ✓
│   │   │   ├── db-service.js     # 데이터베이스 관련 서비스 ✓
│   │   │   ├── storage-service.js # 스토리지 관련 서비스 ✓
│   │   │   └── api-service.js    # 기타 API 호출 서비스 ✓
│   │   │
│   │   ├── utils/            # 유틸리티 함수
│   │   │   ├── validators.js # 유효성 검사 유틸리티 ✓
│   │   │   ├── formatters.js # 데이터 포맷팅 유틸리티 ✓
│   │   │   ├── date-utils.js # 날짜 관련 유틸리티 ✓
│   │   │   ├── dom-utils.js  # DOM 조작 유틸리티 ✓
│   │   │   └── admin-auth.js # 관리자 권한 확인 미들웨어 ✓
│   │   │
│   │   ├── components/       # 컴포넌트 스크립트
│   │   │   ├── header.js     # 헤더 관련 기능 ✓
│   │   │   ├── footer.js     # 푸터 관련 기능 ✓
│   │   │   ├── modal.js      # 모달 관련 기능 ✓
│   │   │   ├── forms.js      # 폼 관련 기능 ✓
│   │   │   └── pagination.js # 페이지네이션 기능 ✓
│   │   │
│   │   └── pages/            # 페이지별 스크립트
│   │       ├── home.js       # 홈페이지 스크립트 ✓
│   │       ├── certificate.js # 자격증 페이지 공통 기능 ✓
│   │       ├── education.js  # 교육 페이지 스크립트 ✓
│   │       ├── board.js      # 게시판 페이지 스크립트 ✓
│   │       ├── auth.js       # 인증 페이지 공통 기능 ✓
│   │       ├── auth/         # 인증 관련 개별 페이지 스크립트
│   │       │   ├── login.js  # 로그인 페이지 스크립트 ✓
│   │       │   ├── signup.js # 회원가입 페이지 스크립트 ✓
│   │       │   └── find-account.js # 계정찾기 페이지 스크립트 ✓
│   │       ├── certificate/  # 자격증 관련 개별 페이지 스크립트
│   │       │   ├── health-exercise.js  # 건강운동처방사 페이지 스크립트 ✓
│   │       │   ├── rehabilitation.js   # 운동재활전문가 페이지 스크립트 ✓
│   │       │   ├── pilates.js         # 필라테스 전문가 페이지 스크립트 ✓
│   │       │   └── recreation.js      # 레크리에이션지도자 페이지 스크립트 ✓
│   │       ├── mypage.js     # 마이페이지 스크립트 ✓
│   │       ├── admin.js      # 관리자 페이지 공통 기능 ✓
│   │       └── admin/        # 관리자 관련 개별 페이지 스크립트
│   │           ├── dashboard.js    # 대시보드 스크립트 ✓
│   │           ├── user-management.js # 회원 관리 스크립트 ✓
│   │           ├── course-management.js # 교육 관리 스크립트 ✓
│   │           ├── cert-management.js # 자격증 관리 스크립트 ✓
│   │           ├── board-management.js # 게시판 관리 스크립트 ✓
│   │           └── payment-management.js # 결제 관리 스크립트 ✓
│   │
│   ├── images/               # 이미지 파일들
│   │   ├── logo/             # 로고 이미지
│   │   ├── banners/          # 배너 이미지
│   │   ├── instructors/      # 강사 이미지
│   │   └── certificates/     # 자격증 관련 이미지
│   │
│   ├── fonts/                # 폰트 파일들
│   └── videos/               # 동영상 파일들
│
├── lib/                      # 외부 라이브러리
│   ├── tailwind/             # Tailwind CSS
│   └── firebase/             # Firebase SDK
│
├── favicon.ico               # 파비콘
├── manifest.json             # PWA 설정 파일
└── robots.txt                # 검색엔진 접근 제어
```

✓ 표시는 이미 개발 완료된 파일들을 나타냅니다.

## 개발 현황

### 완료된 모듈 - 100% 완료

#### 모든 HTML, CSS, JavaScript 파일 개발 완료
- 총 107개 파일 개발 완료
- HTML: 39개 파일
- CSS: 26개 파일  
- JavaScript: 42개 파일

#### 주요 모듈별 개발 현황
1. **인증 모듈 (Auth)** ✓
2. **자격증 모듈 (Certificate)** ✓
3. **교육 모듈 (Education)** ✓
4. **게시판 모듈 (Board)** ✓
5. **마이페이지 모듈 (Mypage)** ✓
6. **기관 소개 모듈 (About)** ✓
7. **관리자 모듈 (Admin)** ✓
8. **공통 컴포넌트 및 서비스** ✓

#### 인증 모듈 (Auth) ✓
- **HTML 페이지**
  - `pages/auth/login.html` - 로그인 페이지
  - `pages/auth/signup.html` - 회원가입 페이지
  - `pages/auth/find-account.html` - 계정찾기 페이지
- **JavaScript 파일**
  - `assets/js/pages/auth.js` - 인증 페이지 공통 기능
  - `assets/js/pages/auth/login.js` - 로그인 기능
  - `assets/js/pages/auth/signup.js` - 회원가입 기능
  - `assets/js/pages/auth/find-account.js` - 계정찾기 기능
- **CSS 파일**
  - `assets/css/pages/auth.css` - 인증 페이지 스타일

#### 자격증 모듈 (Certificate) ✓
- **HTML 페이지**
  - `pages/certificate/health-exercise.html` - 건강운동처방사
  - `pages/certificate/rehabilitation.html` - 운동재활전문가
  - `pages/certificate/pilates.html` - 필라테스 전문가
  - `pages/certificate/recreation.html` - 레크리에이션지도자
- **JavaScript 파일**
  - `assets/js/pages/certificate.js` - 자격증 페이지 공통 기능
  - `assets/js/pages/certificate/health-exercise.js` - 건강운동처방사 페이지 기능
  - `assets/js/pages/certificate/rehabilitation.js` - 운동재활전문가 페이지 기능
  - `assets/js/pages/certificate/pilates.js` - 필라테스 전문가 페이지 기능
  - `assets/js/pages/certificate/recreation.js` - 레크리에이션지도자 페이지 기능
- **CSS 파일**
  - `assets/css/pages/certificate.css` - 자격증 페이지 스타일

#### 게시판 모듈 (Board) ✓
- **HTML 페이지**
  - `pages/board/notice/index.html` - 공지사항 목록
  - `pages/board/notice/view.html` - 공지사항 상세보기
  - `pages/board/column/index.html` - 칼럼 목록
  - `pages/board/column/view.html` - 칼럼 상세보기
  - `pages/board/materials/index.html` - 강의자료 목록
  - `pages/board/materials/view.html` - 강의자료 상세보기
  - `pages/board/videos/index.html` - 동영상 강의 목록
  - `pages/board/videos/view.html` - 동영상 강의 상세보기
- **JavaScript 파일**
  - `assets/js/pages/board.js` - 게시판 공통 기능 (모든 게시판 타입 지원)
- **CSS 파일**
  - `assets/css/pages/board.css` - 게시판 공통 스타일

#### 관리자 모듈 (Admin) ✓
- **HTML 페이지**
  - `pages/admin/dashboard.html` - 관리자 대시보드
  - `pages/admin/user-management.html` - 회원 관리
  - `pages/admin/course-management.html` - 교육 관리
  - `pages/admin/cert-management.html` - 자격증 관리
  - `pages/admin/board-management.html` - 게시판 관리
  - `pages/admin/payment-management.html` - 결제 관리
- **JavaScript 파일**
  - `assets/js/utils/admin-auth.js` - 관리자 권한 확인 미들웨어
  - `assets/js/pages/admin.js` - 관리자 페이지 공통 기능
  - `assets/js/pages/admin/dashboard.js` - 대시보드 기능
  - `assets/js/pages/admin/user-management.js` - 회원 관리 기능
  - `assets/js/pages/admin/course-management.js` - 교육 관리 기능
  - `assets/js/pages/admin/cert-management.js` - 자격증 관리 기능
  - `assets/js/pages/admin/board-management.js` - 게시판 관리 기능
  - `assets/js/pages/admin/payment-management.js` - 결제 관리 기능
- **CSS 파일**
  - `assets/css/pages/admin.css` - 관리자 페이지 스타일

#### 공통 모듈 ✓
- **서비스 모듈**
  - `assets/js/services/auth-service.js` - Firebase 인증 서비스
  - `assets/js/services/db-service.js` - Firestore 데이터베이스 서비스
  - `assets/js/services/storage-service.js` - Firebase Storage 서비스
- **유틸리티 모듈**
  - `assets/js/utils/validators.js` - 입력값 유효성 검사
  - `assets/js/utils/formatters.js` - 데이터 포맷팅
  - `assets/js/utils/date-utils.js` - 날짜 처리
  - `assets/js/utils/dom-utils.js` - DOM 조작
- **컴포넌트 모듈**
  - `assets/js/components/header.js` - 헤더 기능
- **기타**
  - `assets/js/main.js` - 메인 JavaScript
  - `assets/js/config/firebase-config.js` - Firebase 설정
  - `assets/css/main.css` - 메인 CSS
  - `assets/js/pages/home.js` - 홈페이지 스크립트

## CSS 및 JavaScript 모듈화

### CSS 모듈화

프로젝트는 다음과 같은 CSS 모듈 구조를 따릅니다:

- **base/**: 기본 스타일, 리셋, 타이포그래피, 변수 정의
- **layout/**: 레이아웃 구조 관련 스타일 (헤더, 푸터, 그리드 등)
- **components/**: 재사용 가능한 UI 컴포넌트 스타일
- **pages/**: 페이지별 특정 스타일
- **utilities/**: 유틸리티 클래스

모든 CSS 파일은 `main.css`에서 임포트되어 단일 스타일시트로 제공됩니다.

### JavaScript 모듈화

JavaScript 코드는 다음과 같은 모듈 패턴으로 구성됩니다:

- **config/**: 설정 파일 (Firebase 등)
- **services/**: 외부 서비스 연동 모듈 (인증, 데이터베이스, 스토리지 등)
- **utils/**: 유틸리티 함수 (유효성 검사, 포맷팅, 날짜 처리, DOM 조작 등)
- **components/**: UI 컴포넌트 관련 기능
- **pages/**: 페이지별 스크립트
  - 일반 페이지 스크립트
  - 하위 폴더를 통한 관련 페이지 그룹화 (auth/, certificate/, admin/ 등)

각 모듈은 즉시 실행 함수 표현식(IIFE)을 사용하여 캡슐화하고 전역 네임스페이스 오염을 방지합니다.

## 관리자 기능

관리자 모듈은 다음과 같은 기능을 제공합니다:

### 대시보드
- 전체 통계 표시 (회원수, 교육과정, 자격증, 수익)
- 최근 가입 회원 및 교육 신청 현황
- 시스템 상태 모니터링
- 실시간 데이터 업데이트

### 회원 관리
- 회원 목록 조회/검색/필터링
- 회원 추가/수정/삭제
- 회원 유형 관리 (수강생/강사/관리자)
- 회원 상태 관리 (활성/비활성/정지)

### 교육 관리
- 교육 과정 목록 조회/검색/필터링
- 교육 과정 추가/수정/삭제
- 수강생 목록 확인
- 교육 과정 상태 관리

### 자격증 관리
- 자격증 목록 조회/검색/필터링
- 자격증 발급/수정/취소
- 자격증 번호 자동 생성
- 만료일 자동 체크
- PDF 다운로드 기능

### 게시판 관리
- 다중 게시판 통합 관리
- 게시글 추가/수정/삭제
- 게시판별 특화 기능
  - 공지사항: 중요 공지 표시
  - 칼럼: 저자 및 카테고리 관리
  - 강의자료: 파일 첨부
  - 동영상: 동영상 URL 관리

### 결제 관리
- 결제 내역 조회/검색/필터링
- 결제 통계 및 현황
- 환불 처리
- 결제 취소
- 실시간 결제 알림

## 개발 및 실행 방법

### 개발 환경 설정

1. 저장소 클론:
```bash
git clone https://github.com/your-username/digital-healthcare-center.git
cd digital-healthcare-center
```

2. 웹 서버 실행:
- 로컬 개발 시 VS Code의 Live Server 등의 확장 프로그램 활용
- 또는 간단한 HTTP 서버 실행:
```bash
# Node.js가 설치된 경우
npx http-server
```

### Firebase 설정

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. 웹 앱 등록 및 SDK 설정 정보 확인
3. 다음 서비스 활성화:
   - Authentication (이메일/비밀번호, Google 로그인)
   - Firestore Database
   - Storage
   - Hosting (배포 시)
   - Functions (필요한 경우)
4. Firebase 설정 정보를 `assets/js/config/firebase-config.js` 파일에 입력

### 배포 방법

#### Firebase Hosting 활용 (권장)

1. Firebase CLI 설치:
```bash
npm install -g firebase-tools
```

2. Firebase CLI 로그인:
```bash
firebase login
```

3. 프로젝트 초기화:
```bash
firebase init
```
- Hosting 옵션 선택
- 공개 디렉토리로 프로젝트 루트 지정

4. 배포:
```bash
firebase deploy
```

#### 일반 웹 호스팅 활용

1. 모든 파일을 웹 호스팅 서버에 업로드
2. 필요한 경우 `.htaccess` 파일 등을 통해 URL 리다이렉션 설정

## 사용된 외부 리소스

- [Tailwind CSS](https://tailwindcss.com/) - UI 스타일링
- [Firebase](https://firebase.google.com/) - 백엔드 서비스
- [Google Fonts - Noto Sans KR](https://fonts.google.com/specimen/Noto+Sans+KR) - 웹 폰트
- [Heroicons](https://heroicons.com/) - 아이콘

## 기여 방법

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/새기능`)
3. 변경사항 커밋 (`git commit -m '새 기능 추가'`)
4. 브랜치 푸시 (`git push origin feature/새기능`)
5. Pull Request 제출

## 라이센스

이 프로젝트는 [MIT 라이센스](LICENSE)에 따라 라이센스가 부여됩니다.

## 문의 및 연락처

- **디지털헬스케어센터**: [info@digitalhealthcare.org](mailto:info@digitalhealthcare.org)
- **개발자**: [개발자 이메일](mailto:bakgeun82@gmail.com)

## 변경 이력

### 2025-05-12
- 관리자 모듈 완성
  - 관리자 대시보드 구현
  - 회원 관리 기능 구현
  - 교육 과정 관리 기능 구현
  - 자격증 관리 기능 구현
  - 게시판 통합 관리 기능 구현
  - 결제 관리 기능 구현
- 관리자 공통 기능 개발
  - 권한 확인 미들웨어
  - 데이터 테이블 컴포넌트
  - 페이지네이션
  - 모달 다이얼로그
  - 검색/필터링 기능
  - 폼 유효성 검사

### 2025-05-11
- 자격증 모듈 개발 진행
  - 공통 기능 및 스타일 개발 완료
  - 건강운동처방사, 운동재활전문가 페이지 구현
  - 필라테스 전문가, 레크리에이션지도자 페이지 구현
  - 자격증 페이지 전용 스크립트 개발
- 홈페이지 및 헤더 컴포넌트 개발
- 게시판 모듈 개발 완료
  - 공지사항 게시판 (목록, 상세보기)
  - 칼럼 게시판 (목록, 상세보기)
  - 강의자료 게시판 (목록, 상세보기)
  - 동영상 강의 게시판 (목록, 상세보기)
  - 게시판 공통 JavaScript 및 CSS 개발
  - 게시판 타입별 권한 관리 시스템 구현

### 2025-05-10
- 프로젝트 초기 설정
- 인증 모듈 개발 완료
  - 로그인, 회원가입, 계정찾기 페이지 구현
  - 인증 관련 공통 기능 모듈화
- 서비스 모듈 개발
  - Firebase 인증, 데이터베이스, 스토리지 서비스 구현
- 유틸리티 모듈 개발
  - 유효성 검사, 포맷팅, 날짜 처리, DOM 조작 유틸리티 구현

## 데이터베이스 구조

### Firestore 컬렉션 구조

#### users (사용자 정보)
```
{
  uid: string,
  email: string,
  displayName: string,
  phoneNumber: string,
  address: string,
  birthdate: timestamp,
  gender: string,
  userType: string, // 'student', 'instructor', 'admin'
  status: string, // 'active', 'inactive', 'suspended'
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLogin: timestamp
}
```

#### courses (교육 과정)
```
{
  id: string,
  title: string,
  certificateType: string, // 'health-exercise', 'rehabilitation', 'pilates', 'recreation'
  startDate: timestamp,
  endDate: timestamp,
  price: number,
  capacity: number,
  enrolledCount: number,
  instructor: string,
  location: string,
  status: string, // 'preparing', 'active', 'closed', 'completed'
  description: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### certificates (자격증)
```
{
  id: string,
  certificateNumber: string,
  certificateType: string,
  courseId: string,
  userId: string,
  holderName: string,
  issueDate: timestamp,
  expiryDate: timestamp,
  status: string, // 'active', 'expired', 'revoked'
  remarks: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### enrollments (수강 신청)
```
{
  id: string,
  userId: string,
  courseId: string,
  status: string, // 'enrolled', 'completed', 'cancelled'
  enrolledAt: timestamp,
  completedAt: timestamp,
  cancelledAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### payments (결제)
```
{
  id: string,
  paymentId: string,
  userId: string,
  courseId: string,
  amount: number,
  paymentMethod: string, // 'card', 'transfer', 'vbank'
  status: string, // 'pending', 'completed', 'failed', 'cancelled', 'refund_requested', 'refunded'
  pgResponse: object,
  refundInfo: object,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### board_* (게시판 - notice, column, materials, videos)
```
{
  id: string,
  title: string,
  content: string,
  authorId: string,
  viewCount: number,
  status: string, // 'published', 'draft', 'hidden'
  boardType: string,
  // 게시판별 추가 필드
  isImportant: boolean, // notice
  author: string, // column
  category: string, // column, materials
  attachments: array, // materials
  videoUrl: string, // videos
  duration: string, // videos
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 보안 고려사항

### 인증 및 권한
- Firebase Authentication을 통한 사용자 인증
- Firestore Security Rules를 통한 데이터 접근 제어
- 관리자 권한 미들웨어를 통한 관리자 페이지 보호

### 데이터 보호
- 클라이언트 사이드 유효성 검사
- 서버 사이드 유효성 검사 (Firebase Rules)
- 민감한 정보의 암호화 저장

### XSS 및 CSRF 방지
- 사용자 입력 데이터의 이스케이핑
- Firebase의 보안 토큰 사용

## 성능 최적화

### 코드 최적화
- JavaScript 모듈화를 통한 코드 분리
- 필요한 스크립트만 페이지별로 로드
- 비동기 처리를 통한 UI 블로킹 방지

### 데이터베이스 최적화
- 페이지네이션을 통한 대용량 데이터 처리
- 인덱스 활용한 빠른 검색
- 실시간 리스너는 필요한 경우에만 사용

### 이미지 최적화
- 적절한 이미지 포맷 사용
- 이미지 압축
- 레이지 로딩 적용

## 접근성 고려사항

- 시맨틱 HTML 사용
- ARIA 레이블 활용
- 키보드 네비게이션 지원
- 충분한 색상 대비
- 반응형 디자인

## 향후 개발 계획

### 단기 계획
1. 교육 모듈 개발
   - 교육 과정 안내
   - 교육 신청/결제
   - 시험 안내
   
2. 마이페이지 모듈 개발
   - 개인정보 관리
   - 수강 내역
   - 자격증 관리
   - 결제 내역

3. 기관 소개 모듈 개발
   - 센터 소개
   - 비전 및 전략
   - 조직도
   - 강사 소개

### 장기 계획
1. Progressive Web App (PWA) 구현
2. 다국어 지원
3. 모바일 앱 개발
4. 실시간 채팅 상담 기능
5. 온라인 시험 시스템 구현
6. 학습 관리 시스템(LMS) 통합

## 주요 기능 사용 예시

### 관리자 로그인
1. 관리자 계정으로 로그인
2. 헤더의 드롭다운 메뉴에서 '관리자 페이지' 선택
3. 관리자 대시보드로 이동

### 자격증 발급
1. 관리자 페이지 > 자격증 관리 접속
2. '자격증 발급' 버튼 클릭
3. 교육 과정 및 수료자 선택
4. 발급일/만료일 설정
5. 자격증 발급 완료

### 게시글 작성
1. 관리자 페이지 > 게시판 관리 접속
2. 게시판 유형 선택 (공지사항/칼럼/강의자료/동영상)
3. '게시글 추가' 버튼 클릭
4. 내용 작성 및 저장

### 결제 환불 처리
1. 관리자 페이지 > 결제 관리 접속
2. 환불 요청된 결제 검색
3. '환불' 버튼 클릭
4. 환불 금액 및 사유 입력
5. 환불 처리 완료

## 트러블슈팅

### Firebase 연결 오류
- Firebase 설정 파일 확인
- 네트워크 연결 상태 확인
- Firebase 프로젝트 활성화 상태 확인

### 페이지 로딩 오류
- JavaScript 콘솔 에러 확인
- 파일 경로 확인
- Firebase SDK 로딩 순서 확인

### 권한 오류
- 사용자 로그인 상태 확인
- Firestore Security Rules 확인
- 관리자 권한 확인

## 참고 문서

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Google Web Fundamentals](https://developers.google.com/web/fundamentals)