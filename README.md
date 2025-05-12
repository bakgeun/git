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
│   │   │   ├── api-service.js    # 기타 API 호출 서비스 ✓
│   │   │   └── local-auth-override.js # 로컬 테스트용 인증 오버라이드 ✓
│   │   │
│   │   ├── utils/            # 유틸리티 함수
│   │   │   ├── validators.js # 유효성 검사 유틸리티 ✓
│   │   │   ├── formatters.js # 데이터 포맷팅 유틸리티 ✓
│   │   │   ├── date-utils.js # 날짜 관련 유틸리티 ✓
│   │   │   ├── dom-utils.js  # DOM 조작 유틸리티 ✓
│   │   │   ├── admin-auth.js # 관리자 권한 확인 미들웨어 ✓
│   │   │   └── script-loader.js # 스크립트 로더 유틸리티 ✓
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
- 총 109개 파일 개발 완료
- HTML: 39개 파일
- CSS: 26개 파일  
- JavaScript: 44개 파일

#### 주요 모듈별 개발 현황
1. **인증 모듈 (Auth)** ✓
2. **자격증 모듈 (Certificate)** ✓
3. **교육 모듈 (Education)** ✓
4. **게시판 모듈 (Board)** ✓
5. **마이페이지 모듈 (Mypage)** ✓
6. **기관 소개 모듈 (About)** ✓
7. **관리자 모듈 (Admin)** ✓
8. **공통 컴포넌트 및 서비스** ✓

## 로컬 테스트 및 개발 방법

### 로컬 테스트 환경

로컬 개발 및 테스트를 위해 `local-auth-override.js`와 `script-loader.js` 파일을 추가하여 Firebase 연동 전에도 모든 기능을 테스트할 수 있도록 구성했습니다.

#### 테스트 계정
- **관리자 계정**
  - 이메일: admin@test.com
  - 비밀번호: admin123
- **일반 사용자 계정**
  - 이메일: student@test.com
  - 비밀번호: student123

#### 스크립트 로딩 방식
모든 페이지는 일관된 스크립트 로딩 방식을 채택하여, 페이지 깊이에 관계없이 동일한 코드로 스크립트를 로드합니다:

```html
<!-- 스크립트 로더 - head 태그 안에 추가 -->
<script src="../../assets/js/utils/script-loader.js"></script>

<!-- 페이지 하단에 추가 -->
<script id="firebase-sdk-template" type="text/template">
    <!-- Firebase SDK - CDN 방식 -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"><\/script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"><\/script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"><\/script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js"><\/script>

    <!-- 프로젝트 Firebase 설정 및 서비스 -->
    <script src="{basePath}assets/js/config/firebase-config.js"><\/script>
    <script src="{basePath}assets/js/services/auth-service.js"><\/script>

    <!-- 로컬 테스트용 인증 오버라이드 (개발 완료 후 제거) -->
    <script src="{basePath}assets/js/services/local-auth-override.js"><\/script>

    <!-- 필요한 서비스 모듈 -->
    <script src="{basePath}assets/js/services/db-service.js"><\/script>
    <script src="{basePath}assets/js/services/storage-service.js"><\/script>
</script>
```

#### 네비게이션 링크 처리
모든 페이지의 네비게이션 링크는 다음과 같은 방식으로 구현되어 페이지 깊이에 관계없이 올바른 경로로 이동합니다:

```html
<a href="javascript:window.location.href=window.adjustPath('pages/admin/dashboard.html')">대시보드</a>
```

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

### 실제 환경 전환 방법

Firebase 연동이 완료되면 다음과 같이 실제 환경으로 전환할 수 있습니다:

1. `local-auth-override.js` 파일에서 LOCAL_TEST_MODE 변수를 false로 설정:
```javascript
const LOCAL_TEST_MODE = false;
```

2. 또는 모든 HTML 파일에서 로컬 인증 오버라이드 스크립트 로드 부분을 제거:
```html
<!-- 이 줄 제거 -->
<script src="{basePath}assets/js/services/local-auth-override.js"><\/script>
```

## 사용된 외부 리소스

- [Firebase](https://firebase.google.com/) - 백엔드 서비스
- [Tailwind CSS](https://tailwindcss.com/) - UI 스타일링
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

### 2025-05-13
- 스크립트 로더 유틸리티 추가
  - 페이지 깊이에 관계없는 일관된 스크립트 로딩 구현
  - 네비게이션 링크 경로 자동 조정 기능 추가
- 로컬 테스트용 인증 오버라이드 추가
  - Firebase 연동 전 테스트 계정으로 기능 테스트 가능
  - 개발 완료 후 쉽게 제거 가능한 구조로 구현

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