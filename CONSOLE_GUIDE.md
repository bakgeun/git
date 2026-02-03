# 🔒 Console 관리 시스템 사용 가이드

## 📋 개요

프로덕션 환경에서 console.log를 자동으로 숨기고, 관리자만 디버깅할 수 있는 보안 강화 시스템입니다.

---

## 🎯 주요 기능

### ✅ 보안 기능
- **민감정보 자동 마스킹**: API 키, 이메일, 전화번호, 카드번호 등 자동 필터링
- **관리자 인증**: Firebase 관리자 계정으로만 디버그 모드 활성화 가능
- **이중 보안**: localStorage + sessionStorage 조합으로 보안 강화

### ✅ 디버깅 기능
- **프로덕션 디버깅**: 배포 후에도 관리자는 로그 확인 가능
- **자동 마스킹**: 디버그 모드에서도 민감정보는 `***[MASKED]***`로 표시
- **쉬운 전환**: 개발/프로덕션 모드를 한 줄로 전환

---

## 📁 수정된 파일

### 1. `/assets/js/utils/script-loader.js`
- Console 관리 시스템 추가
- 민감정보 자동 마스킹 기능
- 관리자 디버그 활성화 함수

### 2. `/assets/js/config/firebase-config.js`
- 민감한 로그 제거 (API 키, 사용자 정보 등)
- 보안 강화된 로그 메시지

---

## 🚀 적용 방법

### Step 1: 파일 교체

**1) script-loader.js 교체**
```
기존 파일: /assets/js/utils/script-loader.js
새 파일: 첨부된 script-loader.js로 교체
```

**2) firebase-config.js 교체**
```
기존 파일: /assets/js/config/firebase-config.js
새 파일: 첨부된 firebase-config.js로 교체
```

### Step 2: 환경 설정

**개발 중** (현재 상태 유지)
```javascript
// script-loader.js 파일의 5번째 줄
const IS_PRODUCTION = false; // 개발 모드
```

**프로덕션 배포 시**
```javascript
// script-loader.js 파일의 5번째 줄
const IS_PRODUCTION = true; // 프로덕션 모드
```

### Step 3: Firebase에 배포

```bash
# Firebase에 배포
firebase deploy
```

---

## 💻 사용 방법

### 📝 개발 환경

```javascript
IS_PRODUCTION = false
```

- ✅ 모든 console.log 정상 출력
- ✅ 디버깅 완전 가능
- 콘솔에 표시: "🔧 개발 모드: console.log가 활성화되어 있습니다."

---

### 🚀 프로덕션 환경

```javascript
IS_PRODUCTION = true
```

**기본 동작:**
- 🔒 모든 console.log/warn/info/debug 숨김
- ✅ console.error만 표시 (민감정보는 자동 마스킹)
- 일반 사용자는 로그를 볼 수 없음

**콘솔에 표시:**
```
🔒 프로덕션 모드: console.log가 비활성화되었습니다.
💡 관리자 디버깅: enableAdminDebug() 함수를 사용하세요.
```

---

### 🔧 관리자 디버깅 방법

프로덕션에서 오류가 발생했을 때:

#### **방법 1: Firebase 관리자 인증** ⭐ (추천)

```javascript
// 1. 관리자 계정으로 로그인
//    이메일: gostepexercise@gmail.com

// 2. F12 개발자 도구 열기

// 3. 콘솔에서 입력:
enableAdminDebug()

// 4. 자동으로 페이지 새로고침

// 5. 디버그 로그 확인 가능 (민감정보는 자동 마스킹됨)
```

**결과:**
```
✅ 관리자 인증 성공! 페이지를 새로고침하세요.
(자동 새로고침)

🔧 관리자 디버그 모드 활성화됨 (민감정보 자동 마스킹)
```

#### **방법 2: 비밀키 사용** (백업용)

```javascript
// 콘솔에서 입력:
enableDebugWithKey('DHC2025_SECURE_DEBUG_Z29zdGVwZXhl')

// 자동으로 페이지 새로고침
```

**비밀키 확인 방법:**
```javascript
// script-loader.js 파일에서 확인:
const ADMIN_DEBUG_KEY = 'DHC2025_SECURE_DEBUG_' + btoa('gostepexercise@gmail.com').substring(0, 10);
```

#### **디버그 모드 끄기**

```javascript
disableDebug()
```

---

## 🛡️ 보안 특징

### 1. **민감정보 자동 마스킹**

프로덕션에서 디버그 모드 활성화 시에도 민감정보는 자동으로 마스킹됩니다:

**원본 로그:**
```javascript
console.log('사용자 정보:', {
  email: 'user@example.com',
  phone: '010-1234-5678',
  apiKey: 'AIzaSyCnQBH5MxaFhraVPCk7awHOLO8j5C6Lw0A',
  card: '1234-5678-9012-3456'
});
```

**디버그 모드에서 출력:**
```javascript
사용자 정보: {
  email: '***[MASKED]***',
  phone: '***[MASKED]***',
  apiKey: '***[MASKED]***',
  card: '***[MASKED]***'
}
```

### 2. **자동 마스킹 패턴**

다음 정보는 자동으로 마스킹됩니다:
- ✅ API 키
- ✅ 비밀번호
- ✅ 토큰
- ✅ 이메일 주소
- ✅ 전화번호 (010-1234-5678)
- ✅ 주민등록번호
- ✅ 카드번호 (1234-5678-9012-3456)

### 3. **다중 보안 레이어**

1. **Firebase 인증** - 관리자 계정 확인
2. **localStorage + sessionStorage** - 둘 다 있어야 작동
3. **자동 민감정보 필터링** - 추가 보안

---

## 🧪 테스트 방법

### 1. 개발 환경 테스트

```javascript
// script-loader.js
const IS_PRODUCTION = false;

// 콘솔에서:
console.log('테스트'); // ✅ 정상 출력
```

### 2. 프로덕션 환경 테스트

```javascript
// script-loader.js
const IS_PRODUCTION = true;

// 페이지 새로고침 후 콘솔에서:
console.log('테스트'); // ❌ 아무것도 출력되지 않음
```

### 3. 디버그 모드 테스트

```javascript
// 1. 관리자 계정 로그인
// 2. 콘솔에서:
enableAdminDebug()

// 3. 페이지 새로고침 후:
console.log('테스트'); // ✅ 출력됨

console.log({ email: 'test@test.com' }); 
// ✅ 출력: { email: '***[MASKED]***' }
```

---

## 📊 배포 체크리스트

### 배포 전 확인사항

- [ ] `script-loader.js`에서 `IS_PRODUCTION = true` 설정
- [ ] `firebase-config.js` 파일 교체 완료
- [ ] 로컬에서 프로덕션 모드 테스트 완료
- [ ] console.log가 숨겨지는지 확인
- [ ] console.error는 표시되는지 확인

### 배포 후 확인사항

- [ ] 관리자 계정으로 로그인
- [ ] `enableAdminDebug()` 함수 작동 확인
- [ ] 민감정보 마스킹 확인
- [ ] 디버그 모드 활성화/비활성화 테스트

---

## 🆘 문제 해결

### Q1: 디버그 모드가 활성화되지 않습니다

**해결방법:**
```javascript
// 현재 상태 확인
__checkDebugStatus()

// localStorage 확인
localStorage.getItem('dhc_debug_mode')

// sessionStorage 확인
sessionStorage.getItem('dhc_debug_key')

// 초기화 후 다시 시도
disableDebug()
enableAdminDebug()
```

### Q2: 일반 사용자가 디버그 모드를 활성화할 수 있나요?

**답변:**
아니요, 다음 조건을 모두 만족해야 합니다:
1. Firebase에 `gostepexercise@gmail.com`로 로그인
2. `enableAdminDebug()` 함수 호출
3. localStorage와 sessionStorage에 플래그 설정

일반 사용자는 1번 조건을 만족할 수 없습니다.

### Q3: 비밀키가 코드에 노출되는데 안전한가요?

**답변:**
방법 1 (Firebase 인증)을 사용하는 것을 권장합니다. 
비밀키 방법은 긴급 상황용 백업입니다.

---

## 💡 권장사항

### 1. 코드에서 민감한 정보 로그 제거

**나쁜 예:**
```javascript
console.log('Firebase Config:', firebaseConfig);
console.log('API Key:', apiKey);
console.log('사용자 정보:', userInfo);
```

**좋은 예:**
```javascript
console.log('Firebase 초기화 완료');
console.log('사용자 로그인 성공');
```

### 2. 오류는 console.error 사용

```javascript
// console.error는 프로덕션에서도 표시됨
try {
  // 코드
} catch (error) {
  console.error('오류 발생:', error);
}
```

### 3. 개발 중에는 IS_PRODUCTION = false 유지

배포 직전에만 true로 변경하세요.

---

## 📞 지원

문제가 발생하면:
1. `__checkDebugStatus()` 함수로 상태 확인
2. localStorage/sessionStorage 초기화 후 재시도
3. Firebase 콘솔에서 관리자 권한 확인

---

## 🔄 버전 정보

- **버전**: 1.0.0
- **최종 수정일**: 2026-02-02
- **작성자**: 디지털헬스케어센터 개발팀
