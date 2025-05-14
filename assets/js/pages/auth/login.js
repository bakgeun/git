console.log('login.js 로드됨');

// 무한 리디렉션 방지를 위한 플래그
let redirectInProgress = false;
let formEventAttached = false;

// 즉시 실행 함수로 바로 확인
(function() {
    console.log('즉시 인증 상태 확인 시작');
    
    // 현재 페이지가 로그인 페이지인지 확인
    if (!window.location.pathname.includes('/auth/login.html')) {
        console.log('로그인 페이지가 아니므로 인증 확인 생략');
        return;
    }
    
    // Firebase 로드와 폼 설정을 병렬로 처리
    Promise.all([
        waitForFirebase(),
        waitForForm()
    ]).then(([firebaseReady, formReady]) => {
        console.log('Firebase와 폼이 모두 준비됨');
        
        // 즉시 인증 상태 확인
        checkCurrentUser();
        
        // 로그인 폼 이벤트 리스너 등록
        if (formReady && !formEventAttached) {
            attachFormEvents();
        }
    });
})();

// Firebase 로드 대기
function waitForFirebase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        function check() {
            attempts++;
            console.log('Firebase 확인 시도:', attempts);
            
            if (window.dhcFirebase && window.dhcFirebase.getCurrentUser) {
                console.log('Firebase 준비됨');
                resolve(true);
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                console.error('Firebase 초기화 시간 초과');
                resolve(false);
            }
        }
        
        check();
    });
}

// 폼 요소 로드 대기
function waitForForm() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        function check() {
            attempts++;
            console.log('폼 요소 확인 시도:', attempts);
            
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                console.log('로그인 폼 찾음');
                resolve(true);
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                console.error('로그인 폼 로드 시간 초과');
                resolve(false);
            }
        }
        
        check();
    });
}

// 현재 사용자 확인
function checkCurrentUser() {
    if (!window.dhcFirebase) return;
    
    const currentUser = window.dhcFirebase.getCurrentUser();
    console.log('현재 사용자 확인:', currentUser);
    
    if (currentUser && currentUser.email && !redirectInProgress) {
        console.log('이미 로그인됨:', currentUser.email);
        redirectUser(currentUser.email);
    }
}

// 폼 이벤트 리스너 등록
function attachFormEvents() {
    console.log('폼 이벤트 리스너 등록 시작');
    
    const loginForm = document.getElementById('login-form');
    const googleBtn = document.getElementById('google-login-btn');
    
    if (loginForm && !formEventAttached) {
        console.log('로그인 폼에 이벤트 리스너 등록');
        loginForm.addEventListener('submit', handleLogin);
        formEventAttached = true;
    }
    
    if (googleBtn) {
        console.log('Google 로그인 버튼에 이벤트 리스너 등록');
        googleBtn.addEventListener('click', handleGoogleLogin);
    }
}

// 로그인 처리 함수
async function handleLogin(event) {
    event.preventDefault();
    console.log('로그인 폼 제출됨');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('입력값 확인:', { email: email, hasPassword: !!password });
    
    if (!email || !password) {
        console.log('이메일 또는 비밀번호가 입력되지 않음');
        showNotification('이메일과 비밀번호를 모두 입력해주세요.', 'warning');
        return;
    }
    
    console.log('로그인 시도:', email);
    
    // 로딩 상태 표시
    setLoading(true);
    
    try {
        console.log('Firebase 로그인 실행 중...');
        const result = await window.dhcFirebase.auth.signInWithEmailAndPassword(email, password);
        console.log('로그인 성공:', result.user.email);
        
        showNotification('로그인 성공! 페이지를 이동합니다.', 'success');
        
        // 로그인 성공시 즉시 리디렉션
        setTimeout(() => {
            redirectUser(result.user.email);
        }, 1000);
        
    } catch (error) {
        console.error('로그인 오류:', error);
        setLoading(false);
        
        // 오류 메시지 표시
        let errorMessage = '로그인 중 오류가 발생했습니다.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = '등록되지 않은 이메일입니다.';
                break;
            case 'auth/wrong-password':
                errorMessage = '비밀번호가 올바르지 않습니다.';
                break;
            case 'auth/invalid-email':
                errorMessage = '올바르지 않은 이메일 형식입니다.';
                break;
            case 'auth/too-many-requests':
                errorMessage = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
                break;
        }
        
        showNotification(errorMessage, 'error');
    }
}

// Google 로그인 처리
async function handleGoogleLogin() {
    try {
        console.log('Google 로그인 시도');
        setLoading(true);
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await window.dhcFirebase.auth.signInWithPopup(provider);
        console.log('Google 로그인 성공:', result.user.email);
        
        showNotification('Google 로그인 성공! 페이지를 이동합니다.', 'success');
        
        setTimeout(() => {
            redirectUser(result.user.email);
        }, 1000);
        
    } catch (error) {
        console.error('Google 로그인 오류:', error);
        setLoading(false);
        
        let errorMessage = 'Google 로그인 중 오류가 발생했습니다.';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = '로그인이 취소되었습니다.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// 리디렉션 함수
function redirectUser(email) {
    if (redirectInProgress) {
        console.log('이미 리디렉션 중, 중단');
        return;
    }
    
    redirectInProgress = true;
    console.log('리디렉션 시작:', email);
    
    const adminEmails = ['admin@test.com', 'gostepexercise@gmail.com'];
    const isAdmin = adminEmails.includes(email);
    
    console.log('관리자 여부:', isAdmin);
    
    // 알림 표시
    showNotification('페이지를 이동합니다.', 'success');
    
    // 대시보드 리디렉션 카운트 클리어 (중요!)
    localStorage.removeItem('dashboard_redirect_count');
    localStorage.removeItem('dashboard_last_access');
    
    setTimeout(() => {
        if (isAdmin) {
            console.log('관리자 대시보드로 이동 실행:', '../admin/dashboard.html');
            window.location.href = '../admin/dashboard.html';
        } else {
            console.log('홈페이지로 이동 실행:', '../../index.html');
            window.location.href = '../../index.html';
        }
    }, 1500);
}

// 로딩 상태 설정
function setLoading(isLoading) {
    const loginBtn = document.getElementById('login-btn');
    const googleBtn = document.getElementById('google-login-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    console.log('로딩 상태 설정:', isLoading);
    
    if (isLoading) {
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span>로그인 중...</span>';
        }
        if (googleBtn) {
            googleBtn.disabled = true;
        }
        if (emailInput) emailInput.disabled = true;
        if (passwordInput) passwordInput.disabled = true;
    } else {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '로그인';
        }
        if (googleBtn) {
            googleBtn.disabled = false;
        }
        if (emailInput) emailInput.disabled = false;
        if (passwordInput) passwordInput.disabled = false;
    }
}

// 알림 메시지 표시
function showNotification(message, type = 'info') {
    console.log('알림 표시:', { message, type });
    
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    if (!notification || !notificationMessage) {
        console.error('알림 요소를 찾을 수 없음');
        // 요소가 없으면 alert로 대체
        alert(message);
        return;
    }
    
    const typeClasses = {
        'info': 'bg-blue-100 border-blue-500 text-blue-700',
        'success': 'bg-green-100 border-green-500 text-green-700',
        'warning': 'bg-yellow-100 border-yellow-500 text-yellow-700',
        'error': 'bg-red-100 border-red-500 text-red-700'
    };
    
    notification.className = 'mb-6 ' + typeClasses[type];
    notificationMessage.textContent = message;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

// 페이지 로드 완료 후 재시도
window.addEventListener('load', function() {
    console.log('window load 이벤트 발생');
    
    // 아직 폼 이벤트가 등록되지 않았다면 재시도
    if (!formEventAttached) {
        console.log('폼 이벤트 재등록 시도');
        setTimeout(() => {
            attachFormEvents();
        }, 500);
    }
});