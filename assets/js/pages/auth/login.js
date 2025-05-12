/**
 * 로그인 페이지 스크립트
 * 로그인 기능 및 폼 유효성 검사를 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
    // DOM 요소 참조 
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const loginButton = document.getElementById('login-btn');
    const googleLoginButton = document.getElementById('google-login-btn');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    // 이미 로그인된 사용자 확인 및 리디렉션
    function checkAuthState() {
        if (window.dhcFirebase && window.dhcFirebase.auth) {
            const currentUser = window.dhcFirebase.getCurrentUser();

            if (currentUser) {
                // 이미 로그인된 사용자는 홈페이지 또는 마이페이지로 리디렉션
                window.location.href = '../../index.html'; // 또는 마이페이지 URL
            }
        }
    }

    // 알림 메시지 표시
    function showNotification(message, type = 'error') {
        if (!notification || !notificationMessage) {
            return;
        }

        // 타입에 따른 스타일 설정
        if (type === 'error') {
            notification.className = 'mb-6 block';
            notification.querySelector('div').className = 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded';
            notification.querySelector('svg').className = 'h-5 w-5 text-red-500';
        } else if (type === 'success') {
            notification.className = 'mb-6 block';
            notification.querySelector('div').className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded';
            notification.querySelector('svg').className = 'h-5 w-5 text-green-500';
        }

        // 메시지 설정 및 표시
        notificationMessage.textContent = message;
        notification.classList.remove('hidden');
    }

    // 알림 메시지 숨기기
    function hideNotification() {
        if (notification) {
            notification.classList.add('hidden');
        }
    }

    // 로딩 상태 설정
    function setLoading(isLoading) {
        if (!loginButton) {
            return;
        }

        if (isLoading) {
            // 버튼 비활성화 및 로딩 상태 표시
            loginButton.disabled = true;
            loginButton.classList.add('opacity-70', 'cursor-not-allowed');
            loginButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                로그인 중...
            `;

            // Google 로그인 버튼 비활성화
            if (googleLoginButton) {
                googleLoginButton.disabled = true;
                googleLoginButton.classList.add('opacity-70', 'cursor-not-allowed');
            }
        } else {
            // 버튼 활성화 및 원래 상태로 복원
            loginButton.disabled = false;
            loginButton.classList.remove('opacity-70', 'cursor-not-allowed');
            loginButton.textContent = '로그인';

            // Google 로그인 버튼 활성화
            if (googleLoginButton) {
                googleLoginButton.disabled = false;
                googleLoginButton.classList.remove('opacity-70', 'cursor-not-allowed');
            }
        }
    }

    // 입력값 유효성 검사
    function validateForm() {
        // 이메일 유효성 검사
        if (!emailInput.value.trim()) {
            showNotification('이메일을 입력해주세요.');
            emailInput.focus();
            return false;
        }

        if (!window.validators.isValidEmail(emailInput.value)) {
            showNotification('유효한 이메일 주소를 입력해주세요.');
            emailInput.focus();
            return false;
        }

        // 비밀번호 유효성 검사
        if (!passwordInput.value) {
            showNotification('비밀번호를 입력해주세요.');
            passwordInput.focus();
            return false;
        }

        // 모든 검사 통과
        return true;
    }

    // 이메일/비밀번호 로그인 처리
    async function handleEmailPasswordLogin(event) {
        // 폼 기본 제출 동작 방지
        event.preventDefault();
        console.log('로그인 폼 제출됨');

        // 유효성 검사
        if (!validateForm()) {
            console.log('유효성 검사 실패');
            return;
        }

        console.log('유효성 검사 통과');

        // 알림 메시지 숨기기
        hideNotification();

        // 로딩 상태 시작
        setLoading(true);

        try {
            // authService가 있는지 확인
            if (!window.authService) {
                console.error('authService 객체가 존재하지 않음');
                showNotification('인증 서비스가 초기화되지 않았습니다. 새로고침 후 다시 시도해주세요.');
                setLoading(false);
                return;
            }

            console.log('authService 객체 확인됨');

            // 이메일/비밀번호 로그인 시도
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const rememberMe = rememberMeCheckbox.checked;

            console.log('로그인 시도:', email, 'remember me:', rememberMe);

            const result = await window.authService.signIn(email, password, rememberMe);
            console.log('로그인 결과:', result);

            if (result.success) {
                // 로그인 성공 알림 (선택적)
                showNotification('로그인에 성공했습니다. 메인 페이지로 이동합니다.', 'success');

                // 리다이렉션 전 짧은 지연 (알림 메시지를 볼 수 있도록)
                setTimeout(() => {
                    // 이전 페이지 URL 가져오기 (있는 경우 해당 페이지로 리디렉션)
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../../index.html';
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                // 로그인 실패 처리
                let errorMessage = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';

                // 구체적인 오류 메시지 표시 (있는 경우)
                if (result.error) {
                    if (result.error.code === 'auth/user-not-found') {
                        errorMessage = '등록되지 않은 이메일입니다.';
                    } else if (result.error.code === 'auth/wrong-password') {
                        errorMessage = '비밀번호가 올바르지 않습니다.';
                    } else if (result.error.code === 'auth/too-many-requests') {
                        errorMessage = '너무 많은 로그인 시도로 계정이 일시적으로 잠겼습니다. 나중에 다시 시도해주세요.';
                    } else if (result.error.code === 'auth/user-disabled') {
                        errorMessage = '해당 계정은 비활성화되었습니다. 관리자에게 문의하세요.';
                    }
                }

                showNotification(errorMessage);
                setLoading(false);
            }
        } catch (error) {
            console.error('로그인 처리 중 오류 발생:', error);
            showNotification('로그인 처리 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
            setLoading(false);
        }
    }

    // Google 로그인 처리
    async function handleGoogleLogin() {
        // 알림 메시지 숨기기
        hideNotification();

        // 로딩 상태 시작
        setLoading(true);

        try {
            // authService가 있는지 확인
            if (!window.authService) {
                showNotification('인증 서비스가 초기화되지 않았습니다. 새로고침 후 다시 시도해주세요.');
                setLoading(false);
                return;
            }

            // Google 로그인 시도
            const result = await window.authService.signInWithGoogle();

            if (result.success) {
                // 로그인 성공 알림 (선택적)
                showNotification('Google 계정으로 로그인했습니다.', 'success');

                // 리다이렉션 전 짧은 지연 (알림 메시지를 볼 수 있도록)
                setTimeout(() => {
                    // 이전 페이지 URL 가져오기 (있는 경우 해당 페이지로 리디렉션)
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../../index.html';
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                // 로그인 실패 처리
                let errorMessage = 'Google 로그인에 실패했습니다. 다시 시도해주세요.';

                // 구체적인 오류 메시지 표시 (있는 경우)
                if (result.error) {
                    if (result.error.code === 'auth/popup-closed-by-user') {
                        errorMessage = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
                    } else if (result.error.code === 'auth/cancelled-popup-request') {
                        errorMessage = '이미 로그인 창이 열려 있습니다.';
                    } else if (result.error.code === 'auth/popup-blocked') {
                        errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
                    }
                }

                showNotification(errorMessage);
                setLoading(false);
            }
        } catch (error) {
            console.error('Google 로그인 처리 중 오류 발생:', error);
            showNotification('Google 로그인 처리 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
            setLoading(false);
        }
    }

    // URL 파라미터에서 오류 및 알림 확인
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);

        // 오류 메시지 파라미터 확인
        const errorMessage = urlParams.get('error');
        if (errorMessage) {
            showNotification(decodeURIComponent(errorMessage));
        }

        // 알림 메시지 파라미터 확인
        const infoMessage = urlParams.get('message');
        if (infoMessage) {
            showNotification(decodeURIComponent(infoMessage), 'success');
        }

        // 이메일 파라미터 확인 (있는 경우 미리 채우기)
        const email = urlParams.get('email');
        if (email && emailInput) {
            emailInput.value = decodeURIComponent(email);
        }
    }

    // 이벤트 리스너 등록
    function setupEventListeners() {
        // 폼 제출 이벤트 리스너
        if (loginForm) {
            console.log('로그인 폼 요소 발견, 이벤트 리스너 등록');
            loginForm.addEventListener('submit', function (event) {
                console.log('로그인 폼 제출 이벤트 발생');
                handleEmailPasswordLogin(event);
            });
        } else {
            console.error('로그인 폼 요소를 찾을 수 없음');
        }

        // Google 로그인 버튼 클릭 이벤트 리스너
        if (googleLoginButton) {
            googleLoginButton.addEventListener('click', handleGoogleLogin);
        }

        // 입력 필드에 키 입력 시 알림 숨기기
        if (emailInput) {
            emailInput.addEventListener('input', hideNotification);
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', hideNotification);
        }
    }

    // 문서 로드 시 초기화
    function init() {
        console.log('로그인 페이지 초기화');
        console.log('window.dhcFirebase 객체 확인:', window.dhcFirebase);
        console.log('window.authService 객체 확인:', window.authService);

        // 이미 로그인된 사용자 확인
        checkAuthState();

        // URL 파라미터 확인
        checkUrlParameters();

        // 이벤트 리스너 설정
        setupEventListeners();
    }

    // 페이지 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', init);

    // Firebase 인증 상태 변경 리스너
    if (window.dhcFirebase) {
        window.dhcFirebase.onAuthStateChanged(function (user) {
            if (user) {
                // 이미 로그인된 사용자는 홈페이지 또는 마이페이지로 리디렉션
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../../index.html';
                window.location.href = redirectUrl;
            }
        });
    }
})();