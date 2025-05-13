/**
 * 인증 관련 공통 JavaScript
 * 로그인, 회원가입, 계정찾기 등에서 공통으로 사용되는 기능
 */

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // 페이지별 초기화
        const currentPage = this.getCurrentPage();
        
        switch(currentPage) {
            case 'login':
                this.initLogin();
                break;
            case 'signup':
                this.initSignup();
                break;
            case 'find-account':
                this.initFindAccount();
                break;
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('login.html')) return 'login';
        if (path.includes('signup.html')) return 'signup';
        if (path.includes('find-account.html')) return 'find-account';
        return null;
    }

    /**
     * 로그인 페이지 초기화
     */
    initLogin() {
        const loginForm = document.getElementById('login-form');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('login-button');
        const errorMessage = document.getElementById('error-message');

        if (!loginForm) return;

        // 폼 제출 이벤트
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // 유효성 검사
            if (!email || !password) {
                this.showError('이메일과 비밀번호를 모두 입력해주세요.');
                return;
            }

            // 로그인 시도
            this.showLoading(loginButton, '로그인 중...');
            
            try {
                // HeaderManager의 login 메서드 사용
                if (window.headerManager) {
                    const result = window.headerManager.login(email, password);
                    
                    if (result.success) {
                        this.showSuccess('로그인 성공! 홈페이지로 이동합니다.');
                        setTimeout(() => {
                            window.location.href = window.adjustPath('index.html');
                        }, 1000);
                    } else {
                        this.showError(result.error);
                    }
                } else {
                    this.showError('시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                }
            } catch (error) {
                console.error('로그인 오류:', error);
                this.showError('로그인 중 오류가 발생했습니다.');
            } finally {
                this.hideLoading(loginButton);
            }
        });

        // 엔터 키 처리
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    /**
     * 회원가입 페이지 초기화
     */
    initSignup() {
        const signupForm = document.getElementById('signup-form');
        if (!signupForm) return;

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 회원가입 로직 구현
            const formData = new FormData(signupForm);
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirm-password');
            const name = formData.get('name');

            // 기본 유효성 검사
            if (!this.validateSignupForm(email, password, confirmPassword, name)) {
                return;
            }

            // 회원가입 처리
            this.processSignup({
                email,
                password,
                name
            });
        });
    }

    /**
     * 계정찾기 페이지 초기화
     */
    initFindAccount() {
        const findForm = document.getElementById('find-account-form');
        if (!findForm) return;

        findForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('find-email').value.trim();
            
            if (!email) {
                this.showError('이메일을 입력해주세요.');
                return;
            }

            // 계정찾기 처리
            this.processFindAccount(email);
        });
    }

    /**
     * 회원가입 유효성 검사
     */
    validateSignupForm(email, password, confirmPassword, name) {
        if (!email || !password || !confirmPassword || !name) {
            this.showError('모든 필드를 입력해주세요.');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showError('올바른 이메일 형식을 입력해주세요.');
            return false;
        }

        if (password.length < 6) {
            this.showError('비밀번호는 최소 6자 이상이어야 합니다.');
            return false;
        }

        if (password !== confirmPassword) {
            this.showError('비밀번호가 일치하지 않습니다.');
            return false;
        }

        return true;
    }

    /**
     * 이메일 유효성 검사
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 회원가입 처리
     */
    async processSignup(userData) {
        const signupButton = document.getElementById('signup-button');
        
        this.showLoading(signupButton, '가입 중...');
        
        try {
            // 실제 가입 로직은 Firebase나 백엔드 서버와 연동
            // 현재는 테스트용으로 간단히 처리
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
            
            setTimeout(() => {
                window.location.href = window.adjustPath('pages/auth/login.html');
            }, 1500);
        } catch (error) {
            console.error('회원가입 오류:', error);
            this.showError('회원가입 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading(signupButton);
        }
    }

    /**
     * 계정찾기 처리
     */
    async processFindAccount(email) {
        const findButton = document.getElementById('find-button');
        
        this.showLoading(findButton, '찾는 중...');
        
        try {
            // 실제 계정찾기 로직은 백엔드 서버와 연동
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showSuccess('입력하신 이메일로 계정 정보를 발송했습니다.');
        } catch (error) {
            console.error('계정찾기 오류:', error);
            this.showError('계정 찾기 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading(findButton);
        }
    }

    /**
     * 로딩 상태 표시
     */
    showLoading(button, text = '처리 중...') {
        if (!button) return;
        
        button.disabled = true;
        button.originalText = button.textContent;
        button.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${text}
        `;
    }

    /**
     * 로딩 상태 해제
     */
    hideLoading(button) {
        if (!button) return;
        
        button.disabled = false;
        button.textContent = button.originalText || '확인';
    }

    /**
     * 에러 메시지 표시
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * 메시지 표시
     */
    showMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
            type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
            type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
            'bg-blue-100 text-blue-700 border border-blue-200'
        }`;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        // 자동 제거
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// 페이지 로드 시 AuthManager 초기화
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});