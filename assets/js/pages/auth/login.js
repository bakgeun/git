/**
 * 로그인 페이지 전용 JavaScript
 */

class LoginPageManager {
    constructor() {
        this.init();
    }

    init() {
        // Firebase 로드 대기
        this.waitForFirebase().then(() => {
            // 페이지 로드 시 인증 상태 확인
            this.checkAuthState();
            
            // 로그인 폼 이벤트 리스너 등록
            this.initializeLoginForm();
            
            // Google 로그인 버튼 이벤트 리스너
            this.initializeGoogleLogin();
            
            // 테스트 계정 버튼 추가 (개발 중에만)
            if (window.LOCAL_TEST_MODE) {
                this.addTestAccountButtons();
            }
        });
    }

    /**
     * Firebase 로드 대기
     */
    async waitForFirebase() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.dhcFirebase && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.dhcFirebase) {
            console.error('Firebase 초기화 시간 초과');
            this.showNotification('서비스 초기화 중 오류가 발생했습니다.', 'error');
        } else {
            console.log('Firebase 초기화 완료');
        }
    }

    /**
     * 인증 상태 확인
     */
    checkAuthState() {
        if (!window.dhcFirebase) return;
        
        // Firebase 인증 상태 확인
        window.dhcFirebase.onAuthStateChanged((user) => {
            if (user) {
                console.log('이미 로그인된 사용자:', user.email);
                // 이미 로그인된 경우 홈페이지로 리다이렉트
                this.showNotification('이미 로그인되어 있습니다. 홈페이지로 이동합니다.', 'success');
                setTimeout(() => {
                    window.location.href = window.adjustPath('index.html');
                }, 1500);
            }
        });
    }

    /**
     * 로그인 폼 초기화
     */
    initializeLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const rememberMeInput = document.getElementById('remember-me');
            
            if (!emailInput || !passwordInput) {
                this.showNotification('입력 필드를 찾을 수 없습니다.', 'error');
                return;
            }
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const rememberMe = rememberMeInput ? rememberMeInput.checked : false;
            
            // 입력값 검증
            if (!email) {
                this.showNotification('이메일을 입력해주세요.', 'warning');
                emailInput.focus();
                return;
            }
            
            // 이메일 형식 검증
            if (!this.validateEmail(email)) {
                this.showNotification('올바른 이메일 주소를 입력해주세요.', 'warning');
                emailInput.focus();
                return;
            }
            
            if (!password) {
                this.showNotification('비밀번호를 입력해주세요.', 'warning');
                passwordInput.focus();
                return;
            }
            
            // 로그인 시도
            try {
                console.log('로그인 시도:', email);
                this.setLoading(true);
                
                // Firebase 인증
                const result = await window.dhcFirebase.auth.signInWithEmailAndPassword(email, password);
                console.log('로그인 성공:', result.user);
                
                // 로그인 상태 유지 설정
                if (rememberMe) {
                    await window.dhcFirebase.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                } else {
                    await window.dhcFirebase.auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
                }
                
                this.showNotification('로그인 성공! 페이지를 이동합니다.', 'success');
                
                // 관리자 계정인지 확인
                const isAdmin = this.checkAdminAccess(email);
                
                // 리다이렉트 URL 확인
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect');
                
                setTimeout(() => {
                    if (redirectUrl) {
                        window.location.href = decodeURIComponent(redirectUrl);
                    } else if (isAdmin) {
                        window.location.href = window.adjustPath('pages/admin/dashboard.html');
                    } else {
                        window.location.href = window.adjustPath('index.html');
                    }
                }, 1500);
                
            } catch (error) {
                console.error('로그인 오류:', error);
                this.setLoading(false);
                
                // 에러 메시지 처리
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
                    case 'auth/network-request-failed':
                        errorMessage = '네트워크 연결을 확인해주세요.';
                        break;
                    default:
                        errorMessage = error.message;
                }
                
                this.showNotification(errorMessage, 'error');
            }
        });
    }

    /**
     * Google 로그인 초기화
     */
    initializeGoogleLogin() {
        const googleLoginBtn = document.getElementById('google-login-btn');
        if (!googleLoginBtn) return;

        googleLoginBtn.addEventListener('click', async () => {
            try {
                console.log('Google 로그인 시도');
                this.setLoading(true);
                
                // Google 인증 프로바이더 생성
                const provider = new firebase.auth.GoogleAuthProvider();
                
                // Google 로그인 시도
                const result = await window.dhcFirebase.auth.signInWithPopup(provider);
                console.log('Google 로그인 성공:', result.user);
                
                this.showNotification('Google 로그인 성공! 페이지를 이동합니다.', 'success');
                
                // 관리자 계정인지 확인
                const isAdmin = this.checkAdminAccess(result.user.email);
                
                setTimeout(() => {
                    if (isAdmin) {
                        window.location.href = window.adjustPath('pages/admin/dashboard.html');
                    } else {
                        window.location.href = window.adjustPath('index.html');
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Google 로그인 오류:', error);
                this.setLoading(false);
                
                let errorMessage = 'Google 로그인 중 오류가 발생했습니다.';
                
                if (error.code === 'auth/popup-closed-by-user') {
                    errorMessage = '로그인이 취소되었습니다.';
                } else if (error.code === 'auth/popup-blocked') {
                    errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.';
                }
                
                this.showNotification(errorMessage, 'error');
            }
        });
    }

    /**
     * 이메일 형식 검증
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 관리자 계정 확인
     */
    checkAdminAccess(email) {
        const adminEmails = [
            'admin@test.com',
            'gostepexercise@gmail.com'
        ];
        return adminEmails.includes(email);
    }

    /**
     * 로딩 상태 설정
     */
    setLoading(isLoading) {
        const loginBtn = document.getElementById('login-btn');
        const googleBtn = document.getElementById('google-login-btn');
        
        if (isLoading) {
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<div class="inline-flex items-center"><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>로그인 중...</div>';
            }
            if (googleBtn) {
                googleBtn.disabled = true;
            }
        } else {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '로그인';
            }
            if (googleBtn) {
                googleBtn.disabled = false;
            }
        }
    }

    /**
     * 알림 메시지 표시
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notification-message');
        
        if (!notification || !notificationMessage) return;
        
        // 알림 타입별 스타일 클래스
        const typeClasses = {
            'success': 'bg-green-100 border-green-500 text-green-700',
            'error': 'bg-red-100 border-red-500 text-red-700',
            'warning': 'bg-yellow-100 border-yellow-500 text-yellow-700',
            'info': 'bg-blue-100 border-blue-500 text-blue-700'
        };
        
        // 현재 클래스 제거
        notification.className = 'mb-6';
        
        // 새 클래스 추가
        notification.className += ' ' + typeClasses[type];
        
        // 메시지 설정
        notificationMessage.textContent = message;
        
        // 알림 표시
        notification.classList.remove('hidden');
        
        // 5초 후 자동으로 숨김
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }

    /**
     * 테스트 계정 버튼 추가 (개발 중에만)
     */
    addTestAccountButtons() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        // 테스트 계정 섹션 생성
        const testAccountSection = document.createElement('div');
        testAccountSection.className = 'mt-6 p-4 bg-gray-50 rounded-lg border border-orange-200';
        testAccountSection.innerHTML = `
            <p class="text-sm text-orange-600 mb-3">
                <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                개발 모드 - 테스트 계정 (실제 Firebase 사용)
            </p>
            <div class="space-y-2">
                <button type="button" id="admin-test-login" 
                        class="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition text-sm">
                    실제 관리자 계정으로 로그인 (gostepexercise@gmail.com)
                </button>
                <button type="button" id="test-new-account" 
                        class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition text-sm">
                    새 계정 생성 테스트
                </button>
            </div>
        `;

        // 로그인 폼 뒤에 삽입
        loginForm.parentNode.insertBefore(testAccountSection, loginForm.nextSibling);

        // 테스트 계정 버튼 이벤트 리스너
        document.getElementById('admin-test-login').addEventListener('click', () => {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (emailInput && passwordInput) {
                emailInput.value = 'gostepexercise@gmail.com';
                passwordInput.value = '';  // 실제 비밀번호는 입력해야 함
                
                // 포커스를 비밀번호 입력란으로 이동
                passwordInput.focus();
                
                this.showNotification('관리자 이메일을 입력했습니다. 비밀번호를 입력해주세요.', 'info');
            }
        });

        document.getElementById('test-new-account').addEventListener('click', () => {
            this.showNotification('회원가입 페이지로 이동합니다.', 'info');
            setTimeout(() => {
                window.location.href = window.adjustPath('pages/auth/signup.html');
            }, 1000);
        });
    }
}

// 페이지 로드 시 LoginPageManager 초기화
document.addEventListener('DOMContentLoaded', () => {
    new LoginPageManager();
});