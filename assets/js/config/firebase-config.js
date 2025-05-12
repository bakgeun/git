/**
 * Firebase 설정 파일
 * 이 파일은 Firebase SDK를 초기화하고 환경을 설정합니다.
 * 현재는 개발 목적으로 모의 구현을 사용합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    console.log("Firebase 모의 설정 초기화");
    
    // 로컬 스토리지에서 로그인 상태 확인
    let savedUser = null;
    try {
        const userJson = localStorage.getItem('mockUser');
        if (userJson) {
            savedUser = JSON.parse(userJson);
            console.log("로컬 스토리지에서 사용자 정보 복원:", savedUser);
        }
    } catch (e) {
        console.error("로컬 스토리지 접근 오류:", e);
    }
    
    // dhcFirebase 객체가 이미 존재하는지 확인
    if (window.dhcFirebase) {
        console.log("dhcFirebase 객체가 이미 존재함, 기존 객체 유지");
        
        // 로컬 스토리지에 사용자 정보가 있다면 로그인 상태 복원
        if (savedUser && window.dhcFirebase.auth) {
            console.log("로그인 상태 복원 시도");
            
            // 현재 사용자가 없는 경우에만 복원
            if (!window.dhcFirebase.auth.currentUser) {
                window.dhcFirebase.auth.currentUser = savedUser;
                
                // 인증 상태 변경 이벤트 발생
                if (typeof window.dhcFirebase.authStateChangedCallback === 'function') {
                    window.dhcFirebase.authStateChangedCallback(savedUser);
                }
                
                console.log("로그인 상태 복원 완료");
            }
        }
        
        return; // 이미 dhcFirebase 객체가 있으면 초기화 중단
    }
    
    // dhcFirebase 객체가 없는 경우 기본 객체 생성
    window.dhcFirebase = {
        auth: {
            currentUser: savedUser // 로컬 스토리지에서 복원한 사용자 정보로 초기화
        },
        db: {},
        storage: {},
        firebase: {},
        onAuthStateChanged: function(callback) {
            this.authStateChangedCallback = callback;
            if (callback) setTimeout(() => callback(savedUser), 0);
        },
        getCurrentUser: function() {
            try {
                // 로컬 스토리지에서 최신 정보 확인
                const userJson = localStorage.getItem('mockUser');
                if (userJson) {
                    return JSON.parse(userJson);
                }
            } catch (e) {
                console.error("getCurrentUser 오류:", e);
            }
            return this.auth.currentUser;
        },
        // 인증 상태 변경 콜백 저장용 속성
        authStateChangedCallback: null
    };
    
    console.log("기본 dhcFirebase 객체가 생성됨:", window.dhcFirebase);
    
    // Firebase 모의 초기화
    try {
        // Firebase가 불러와졌는지 확인
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp({});
            
            // Firebase 서비스를 기존 dhcFirebase 객체에 병합
            if (firebase.auth) window.dhcFirebase.auth = firebase.auth();
            if (firebase.firestore) window.dhcFirebase.db = firebase.firestore();
            if (firebase.storage) window.dhcFirebase.storage = firebase.storage();
            window.dhcFirebase.firebase = firebase;
            
            // 사용자 인증 상태 감지 함수 업데이트
            window.dhcFirebase.onAuthStateChanged = function(callback) {
                this.authStateChangedCallback = callback;
                if (firebase.auth) {
                    firebase.auth().onAuthStateChanged(callback);
                } else {
                    if (callback) callback(savedUser);
                }
            };
            
            // 현재 로그인한 사용자 정보 가져오기 함수 업데이트
            window.dhcFirebase.getCurrentUser = function() {
                if (firebase.auth) {
                    return firebase.auth().currentUser;
                }
                
                try {
                    // 로컬 스토리지에서 최신 정보 확인
                    const userJson = localStorage.getItem('mockUser');
                    if (userJson) {
                        return JSON.parse(userJson);
                    }
                } catch (e) {
                    console.error("getCurrentUser 오류:", e);
                }
                
                return null;
            };
            
            console.log("Firebase 모의 설정 완료");
        } else {
            console.log("Firebase 라이브러리가 로드되지 않았으므로 기본 dhcFirebase 객체 사용");
        }
    } catch (error) {
        console.error("Firebase 초기화 오류:", error);
    }
    
    // 초기화 후 로그인 상태 이벤트 발생 (Firebase가 불러와지지 않은 경우)
    if (savedUser && window.dhcFirebase.authStateChangedCallback) {
        setTimeout(() => {
            window.dhcFirebase.authStateChangedCallback(savedUser);
            console.log("Firebase 초기화 후 로그인 상태 이벤트 발생");
        }, 100);
    }
})();