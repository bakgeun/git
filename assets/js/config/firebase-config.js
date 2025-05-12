/**
 * Firebase 설정 파일
 * 이 파일은 Firebase SDK를 초기화하고 환경을 설정합니다.
 * 현재는 개발 목적으로 모의 구현을 사용합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    console.log("Firebase 모의 설정 초기화");
    
    // Firebase 모의 초기화
    try {
        // Firebase가 불러와졌는지 확인
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp({});
            
            // Firebase 서비스를 window 객체에 추가
            window.dhcFirebase = {
                auth: firebase.auth ? firebase.auth() : {},
                db: firebase.firestore ? firebase.firestore() : {},
                storage: firebase.storage ? firebase.storage() : {},
                firebase: firebase,
                
                // 사용자 인증 상태 감지
                onAuthStateChanged: function(callback) {
                    if (firebase.auth) {
                        firebase.auth().onAuthStateChanged(callback);
                    } else {
                        callback(null);
                    }
                },
                
                // 현재 로그인한 사용자 정보 가져오기
                getCurrentUser: function() {
                    return firebase.auth ? firebase.auth().currentUser : null;
                }
            };
            
            console.log("Firebase 모의 설정 완료");
        } else {
            console.error("Firebase 라이브러리가 로드되지 않았습니다");
        }
    } catch (error) {
        console.error("Firebase 초기화 오류:", error);
    }
})();