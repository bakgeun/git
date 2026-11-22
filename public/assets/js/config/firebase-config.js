/**
 * Firebase 설정 파일 (보안 강화 버전)
 * 이 파일은 Firebase SDK를 초기화하고 환경을 설정합니다.
 */

// Firebase 설정 정보 (실제 프로젝트 정보로 수정)
const firebaseConfig = {
  apiKey: "AIzaSyCnQBH5MxaFhraVPCk7awHOLO8j5C6Lw0A",
  authDomain: "digital-healthcare-cente-2204b.firebaseapp.com",
  projectId: "digital-healthcare-cente-2204b",
  storageBucket: "digital-healthcare-cente-2204b.firebasestorage.app",
  messagingSenderId: "60835775420",
  appId: "1:60835775420:web:7ae13d485fa19fd2f221b9",
  measurementId: "G-HXQ9SMCCFE"
};

// 🔧 Firebase 초기화 전 체크
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase SDK가 로드되지 않았습니다. HTML에서 Firebase SDK 스크립트가 먼저 로드되어야 합니다.');
} else {
  console.log('✅ Firebase SDK 로드 확인됨');
}

// Firebase 초기화
try {
  // 이미 초기화되었는지 확인
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase 초기화 성공");
  } else {
    console.log("✅ Firebase 이미 초기화됨");
  }
} catch (error) {
  console.error("❌ Firebase 초기화 오류:", error);
}

// Firebase App Check 초기화 (reCAPTCHA v3)
if (typeof firebase.appCheck === 'function') {
  try {
    const appCheck = firebase.appCheck();
    appCheck.activate(
      new firebase.appCheck.ReCaptchaV3Provider('6Lea8vIsAAAAABZuyFIqDP-xylfgE75bDBxQklbC'),
      true
    );
    console.log("✅ Firebase App Check 초기화 성공");
  } catch (e) {
    console.error('❌ App Check 초기화 오류:', e);
  }
}

// Analytics 초기화 (Analytics 사용 시)
if (firebase.analytics && typeof firebase.analytics === 'function') {
  try {
    firebase.analytics();
    console.log("✅ Firebase Analytics 초기화 성공");
  } catch (error) {
    console.error("❌ Firebase Analytics 초기화 오류:", error);
  }
}

// dhcFirebase 전역 객체 생성 (기존 프로젝트에서 사용하는 방식)
window.dhcFirebase = {
  auth: firebase.auth(),
  db: firebase.firestore(),
  storage: firebase.storage(),
  firebase: firebase,
  
  // 인증 상태 변경 감지
  onAuthStateChanged: function(callback) {
    return firebase.auth().onAuthStateChanged(callback);
  },
  
  // 현재 로그인한 사용자 정보
  getCurrentUser: function() {
    return firebase.auth().currentUser;
  },
  
  // 🔧 수정: Firebase 연결 상태 확인 함수
  isConnected: function() {
    try {
      return firebase.apps.length > 0 && 
             typeof this.auth !== 'undefined' && 
             typeof this.db !== 'undefined';
    } catch (error) {
      console.error('Firebase 연결 상태 확인 오류:', error);
      return false;
    }
  }
};

console.log("✅ Firebase dhcFirebase 객체 생성 완료");

// 🔧 Firebase 연결 테스트 (보안 강화: 민감한 정보 제거)
try {
  if (window.dhcFirebase.isConnected()) {
    console.log("✅ Firebase 서비스 연결됨");
    // 🔒 민감한 정보 로그 제거: 서비스별 상세 정보는 출력하지 않음
  } else {
    console.warn("⚠️ Firebase 서비스 연결에 문제가 있을 수 있습니다.");
  }
} catch (error) {
  console.error("❌ Firebase 연결 테스트 오류:", error);
}

// 로컬 테스트 모드 플래그
// 실제 Firebase를 사용할 때는 이 플래그를 false로 설정
window.LOCAL_TEST_MODE = false;

// Firebase Authentication 상태 모니터링 (보안 강화: 민감한 정보 제거)
window.dhcFirebase.onAuthStateChanged(function(user) {
  if (user) {
    // 🔒 민감한 정보 로그 제거: 사용자 세부 정보는 출력하지 않음
    console.log("🔐 Firebase 인증: 로그인됨");
  } else {
    console.log("🔐 Firebase 인증: 로그아웃됨");
  }
});

// 🔧 Firestore 네트워크 연결 확인 (오류만 출력)
window.dhcFirebase.db.enableNetwork().then(() => {
  console.log("✅ Firestore 네트워크 활성화됨");
}).catch((error) => {
  console.warn("⚠️ Firestore 네트워크 연결 오류:", error);
});