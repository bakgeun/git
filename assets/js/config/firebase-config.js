/**
 * Firebase 설정 파일
 * 이 파일은 Firebase SDK를 초기화하고 환경을 설정합니다.
 */

// Firebase 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyCnQBH5MxaFhraVPCk7awHOLO8j5C6Lw0A", // 실제 API 키로 변경
  authDomain: "digital-healthcare-cente-2204b.firebaseapp.com",
  projectId: "digital-healthcare-cente-2204b",
  storageBucket: "digital-healthcare-cente-2204b.firebasestorage.app",
  messagingSenderId: "60835775420",
  appId: "1:60835775420:web:7ae13d485fa19fd2f221b9",
  measurementId: "G-HXQ9SMCCFE"
};

// Firebase 초기화
try {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase 초기화 성공");
} catch (error) {
  console.error("Firebase 초기화 오류:", error);
}

// Analytics 초기화 (Analytics 사용 시)
if (firebase.analytics) {
  try {
    firebase.analytics();
    console.log("Firebase Analytics 초기화 성공");
  } catch (error) {
    console.error("Firebase Analytics 초기화 오류:", error);
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
  }
};

console.log("Firebase dhcFirebase 객체 생성 완료");

// 로컬 테스트 모드 비활성화 플래그
// 실제 Firebase를 사용할 때는 이 플래그를 false로 설정
window.LOCAL_TEST_MODE = false;

// Firebase Authentication 상태 모니터링 및 디버깅
window.dhcFirebase.onAuthStateChanged(function(user) {
  if (user) {
    console.log("Firebase 인증 상태: 로그인됨", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified
    });
  } else {
    console.log("Firebase 인증 상태: 로그아웃됨");
  }
});