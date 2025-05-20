/**
 * find-account.js
 * 계정 찾기 페이지 스크립트
 * 비밀번호 재설정 이메일 발송 기능을 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // DOM 요소 참조
    const findAccountForm = document.getElementById('find-account-form');
    const emailInput = document.getElementById('email');
    const resetButton = document.getElementById('reset-password-btn');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    // 알림 메시지 표시
    function showNotification(message, type = 'info') {
        if (!notification || !notificationMessage) {
            return;
        }
        
        // 타입에 따른 스타일 설정
        const styleClasses = {
            'error': {
                container: 'bg-red-100 border-l-4 border-red-500 text-red-700',
                icon: 'text-red-500'
            },
            'success': {
                container: 'bg-green-100 border-l-4 border-green-500 text-green-700',
                icon: 'text-green-500'
            },
            'info': {
                container: 'bg-blue-100 border-l-4 border-blue-500 text-blue-700',
                icon: 'text-blue-500'
            }
        };
        
        const styles = styleClasses[type] || styleClasses.info;
        
        notification.className = 'mb-6 block';
        notification.querySelector('div').className = `${styles.container} p-4 rounded`;
        notification.querySelector('svg').className = `h-5 w-5 ${styles.icon}`;
        
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
        if (!resetButton) {
            return;
        }
        
        if (isLoading) {
            // 버튼 비활성화 및 로딩 상태 표시
            resetButton.disabled = true;
            resetButton.classList.add('opacity-70', 'cursor-not-allowed');
            resetButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                이메일 전송 중...
            `;
        } else {
            // 버튼 활성화 및 원래 상태로 복원
            resetButton.disabled = false;
            resetButton.classList.remove('opacity-70', 'cursor-not-allowed');
            resetButton.textContent = '비밀번호 재설정 링크 보내기';
        }
    }
    
    // 입력값 유효성 검사
    function validateForm() {
        // 이메일 입력 확인
        if (!emailInput.value.trim()) {
            showNotification('이메일 주소를 입력해주세요.', 'error');
            emailInput.focus();
            return false;
        }
        
        // 이메일 형식 검사
        if (!window.validators.isValidEmail(emailInput.value)) {
            showNotification('유효한 이메일 주소를 입력해주세요.', 'error');
            emailInput.focus();
            return false;
        }
        
        return true;
    }
    
    // 비밀번호 재설정 이메일 발송 처리
    async function handlePasswordReset(event) {
        // 폼 기본 제출 동작 방지
        event.preventDefault();
        
        // 유효성 검사
        if (!validateForm()) {
            return;
        }
        
        // 알림 메시지 숨기기
        hideNotification();
        
        // 로딩 상태 시작
        setLoading(true);
        
        try {
            // authService가 있는지 확인
            if (!window.authService) {
                showNotification('인증 서비스가 초기화되지 않았습니다. 새로고침 후 다시 시도해주세요.', 'error');
                setLoading(false);
                return;
            }
            
            // 비밀번호 재설정 이메일 발송 시도
            const email = emailInput.value.trim();
            const result = await window.authService.sendPasswordResetEmail(email);
            
            if (result.success) {
                // 성공 메시지 표시
                showNotification(
                    `비밀번호 재설정 링크를 ${email}로 전송했습니다. 이메일을 확인해주세요.`,
                    'success'
                );
                
                // 입력 필드 비활성화 (중복 전송 방지)
                emailInput.disabled = true;
                resetButton.textContent = '이메일 전송 완료';
                resetButton.disabled = true;
                
                // 일정 시간 후 로그인 페이지로 이동
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 5000);
            } else {
                // 실패 처리
                let errorMessage = '비밀번호 재설정 링크 전송에 실패했습니다. 다시 시도해주세요.';
                
                // 구체적인 오류 메시지 표시
                if (result.error) {
                    if (result.error.code === 'auth/user-not-found') {
                        errorMessage = '등록되지 않은 이메일 주소입니다.';
                    } else if (result.error.code === 'auth/invalid-email') {
                        errorMessage = '유효하지 않은 이메일 형식입니다.';
                    } else if (result.error.code === 'auth/too-many-requests') {
                        errorMessage = '너무 많은 요청으로 잠시 후 다시 시도해주세요.';
                    }
                }
                
                showNotification(errorMessage, 'error');
                setLoading(false);
            }
        } catch (error) {
            console.error('비밀번호 재설정 처리 중 오류 발생:', error);
            showNotification('비밀번호 재설정 처리 중 오류가 발생했습니다. 나중에 다시 시도해주세요.', 'error');
            setLoading(false);
        }
    }
    
    // URL 파라미터에서 메시지 확인
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // 오류 메시지 파라미터 확인
        const errorMessage = urlParams.get('error');
        if (errorMessage) {
            showNotification(decodeURIComponent(errorMessage), 'error');
        }
        
        // 성공 메시지 파라미터 확인
        const successMessage = urlParams.get('success');
        if (successMessage) {
            showNotification(decodeURIComponent(successMessage), 'success');
        }
        
        // 이메일 파라미터 확인 (있는 경우 미리 채우기)
        const email = urlParams.get('email');
        if (email && emailInput) {
            emailInput.value = decodeURIComponent(email);
        }
    }
    
    // 입력 필드 변경 감지
    function setupInputValidation() {
        if (!emailInput) return;
        
        // 이메일 입력 필드에 실시간 유효성 검사
        emailInput.addEventListener('input', window.authHelpers.debounce(function() {
            const email = emailInput.value.trim();
            
            if (email && !window.validators.isValidEmail(email)) {
                emailInput.classList.add('border-red-500');
                emailInput.classList.remove('border-gray-300');
            } else {
                emailInput.classList.remove('border-red-500');
                emailInput.classList.add('border-gray-300');
            }
        }, 300));
        
        // 입력 시작하면 기존 알림 숨기기
        emailInput.addEventListener('input', hideNotification);
    }
    
    // 이벤트 리스너 등록
    function setupEventListeners() {
        // 폼 제출 이벤트 리스너
        if (findAccountForm) {
            findAccountForm.addEventListener('submit', handlePasswordReset);
        }
        
        // Enter 키 처리
        if (emailInput) {
            emailInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    findAccountForm.dispatchEvent(new Event('submit'));
                }
            });
        }
    }
    
    // 로그인 상태 확인
    function checkAuthState() {
        if (window.dhcFirebase && window.dhcFirebase.auth) {
            const currentUser = window.dhcFirebase.getCurrentUser();
            
            if (currentUser) {
                // 로그인된 사용자는 홈페이지로 리디렉션
                window.location.href = '../../index.html';
            }
        }
    }
    
    // 페이지 로드 시 초기화
    function init() {
        // 로그인 상태 확인
        checkAuthState();
        
        // URL 파라미터 확인
        checkUrlParameters();
        
        // 입력 유효성 검사 설정
        setupInputValidation();
        
        // 이벤트 리스너 설정
        setupEventListeners();
    }
    
    // 페이지 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', init);
    
    // Firebase 인증 상태 변경 리스너
    if (window.dhcFirebase) {
        window.dhcFirebase.onAuthStateChanged(function(user) {
            if (user) {
                // 로그인된 사용자는 홈페이지로 리디렉션
                window.location.href = '../../index.html';
            }
        });
    }
})();