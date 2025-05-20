/**
 * 회원가입 페이지 스크립트
 * 회원가입 기능 및 폼 유효성 검사를 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // DOM 요소 참조
    const signupForm = document.getElementById('signup-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password-confirm');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const termsAllCheckbox = document.getElementById('terms-all');
    const termsServiceCheckbox = document.getElementById('terms-service');
    const termsPrivacyCheckbox = document.getElementById('terms-privacy');
    const termsMarketingCheckbox = document.getElementById('terms-marketing');
    const signupButton = document.getElementById('signup-btn');
    const googleSignupButton = document.getElementById('google-signup-btn');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const modalButtons = document.querySelectorAll('[data-modal]');
    const modalCloseButtons = document.querySelectorAll('[data-dismiss="modal"]');
    
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
        
        // 페이지 상단으로 스크롤 (알림이 보이도록)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // 알림 메시지 숨기기
    function hideNotification() {
        if (notification) {
            notification.classList.add('hidden');
        }
    }
    
    // 로딩 상태 설정
    function setLoading(isLoading) {
        if (!signupButton) {
            return;
        }
        
        if (isLoading) {
            // 버튼 비활성화 및 로딩 상태 표시
            signupButton.disabled = true;
            signupButton.classList.add('opacity-70', 'cursor-not-allowed');
            signupButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                회원가입 중...
            `;
            
            // Google 회원가입 버튼 비활성화
            if (googleSignupButton) {
                googleSignupButton.disabled = true;
                googleSignupButton.classList.add('opacity-70', 'cursor-not-allowed');
            }
        } else {
            // 버튼 활성화 및 원래 상태로 복원
            signupButton.disabled = false;
            signupButton.classList.remove('opacity-70', 'cursor-not-allowed');
            signupButton.textContent = '회원가입';
            
            // Google 회원가입 버튼 활성화
            if (googleSignupButton) {
                googleSignupButton.disabled = false;
                googleSignupButton.classList.remove('opacity-70', 'cursor-not-allowed');
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
        
        const passwordValidation = window.validators.validatePassword(passwordInput.value);
        if (!passwordValidation.isValid) {
            showNotification(passwordValidation.errors[0]);
            passwordInput.focus();
            return false;
        }
        
        // 비밀번호 확인 검사
        if (passwordInput.value !== passwordConfirmInput.value) {
            showNotification('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            passwordConfirmInput.focus();
            return false;
        }
        
        // 이름 유효성 검사
        if (!nameInput.value.trim()) {
            showNotification('이름을 입력해주세요.');
            nameInput.focus();
            return false;
        }
        
        // 휴대폰 번호 유효성 검사
        if (!phoneInput.value.trim()) {
            showNotification('휴대폰 번호를 입력해주세요.');
            phoneInput.focus();
            return false;
        }
        
        // 휴대폰 번호 형식 검사 (선택적)
        const cleanedPhone = phoneInput.value.replace(/[^0-9]/g, '');
        if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
            showNotification('유효한 휴대폰 번호를 입력해주세요.');
            phoneInput.focus();
            return false;
        }
        
        // 필수 약관 동의 검사
        if (!termsServiceCheckbox.checked) {
            showNotification('서비스 이용약관에 동의해주세요.');
            termsServiceCheckbox.focus();
            return false;
        }
        
        if (!termsPrivacyCheckbox.checked) {
            showNotification('개인정보 수집 및 이용에 동의해주세요.');
            termsPrivacyCheckbox.focus();
            return false;
        }
        
        // 모든 검사 통과
        return true;
    }
    
    // 이메일/비밀번호 회원가입 처리
    async function handleEmailPasswordSignup(event) {
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
                showNotification('인증 서비스가 초기화되지 않았습니다. 새로고침 후 다시 시도해주세요.');
                setLoading(false);
                return;
            }
            
            // 사용자 정보 수집
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const userData = {
                displayName: nameInput.value.trim(),
                phoneNumber: phoneInput.value.trim().replace(/[^0-9]/g, ''),
                marketingConsent: termsMarketingCheckbox.checked,
                termsAgreedAt: new Date()
            };
            
            // 회원가입 시도
            const result = await window.authService.signUp(email, password, userData);
            
            if (result.success) {
                // 회원가입 성공 알림
                showNotification('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.', 'success');
                
                // 리다이렉션 전 짧은 지연 (알림 메시지를 볼 수 있도록)
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                // 회원가입 실패 처리
                let errorMessage = '회원가입에 실패했습니다. 다시 시도해주세요.';
                
                // 구체적인 오류 메시지 표시 (있는 경우)
                if (result.error) {
                    if (result.error.code === 'auth/email-already-in-use') {
                        errorMessage = '이미 사용 중인 이메일입니다.';
                    } else if (result.error.code === 'auth/invalid-email') {
                        errorMessage = '유효하지 않은 이메일 형식입니다.';
                    } else if (result.error.code === 'auth/weak-password') {
                        errorMessage = '보안에 취약한 비밀번호입니다. 더 강력한 비밀번호를 사용해주세요.';
                    }
                }
                
                showNotification(errorMessage);
                setLoading(false);
            }
        } catch (error) {
            console.error('회원가입 처리 중 오류 발생:', error);
            showNotification('회원가입 처리 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
            setLoading(false);
        }
    }
    
    // Google 회원가입 처리
    async function handleGoogleSignup() {
        // 알림 메시지 숨기기
        hideNotification();
        
        // 필수 약관 동의 확인
        if (!termsServiceCheckbox.checked) {
            showNotification('서비스 이용약관에 동의해주세요.');
            termsServiceCheckbox.focus();
            return;
        }
        
        if (!termsPrivacyCheckbox.checked) {
            showNotification('개인정보 수집 및 이용에 동의해주세요.');
            termsPrivacyCheckbox.focus();
            return;
        }
        
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
                // 마케팅 동의 정보 저장
                if (window.dhcFirebase && window.dhcFirebase.db) {
                    try {
                        await window.dhcFirebase.db.collection('users').doc(result.user.uid).update({
                            marketingConsent: termsMarketingCheckbox.checked,
                            termsAgreedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (updateError) {
                        console.error('사용자 정보 업데이트 오류:', updateError);
                    }
                }
                
                // 회원가입 성공 알림
                showNotification('Google 계정으로 회원가입이 완료되었습니다. 메인 페이지로 이동합니다.', 'success');
                
                // 리다이렉션 전 짧은 지연 (알림 메시지를 볼 수 있도록)
                setTimeout(() => {
                    window.location.href = '../../index.html';
                }, 2000);
            } else {
                // 회원가입 실패 처리
                let errorMessage = 'Google 계정 연동에 실패했습니다. 다시 시도해주세요.';
                
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
            console.error('Google 계정 연동 중 오류 발생:', error);
            showNotification('Google 계정 연동 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
            setLoading(false);
        }
    }
    
    // 약관 전체 동의 처리
    function handleTermsAllChange() {
        const isChecked = termsAllCheckbox.checked;
        
        // 모든 약관 체크박스 상태 변경
        if (termsServiceCheckbox) termsServiceCheckbox.checked = isChecked;
        if (termsPrivacyCheckbox) termsPrivacyCheckbox.checked = isChecked;
        if (termsMarketingCheckbox) termsMarketingCheckbox.checked = isChecked;
    }
    
    // 개별 약관 변경 시 전체 동의 체크박스 상태 업데이트
    function updateTermsAllCheckbox() {
        if (!termsAllCheckbox || !termsServiceCheckbox || !termsPrivacyCheckbox || !termsMarketingCheckbox) {
            return;
        }
        
        // 모든 약관이 체크되었는지 확인
        const allChecked = termsServiceCheckbox.checked && 
                          termsPrivacyCheckbox.checked && 
                          termsMarketingCheckbox.checked;
        
        // 전체 동의 체크박스 상태 업데이트
        termsAllCheckbox.checked = allChecked;
    }
    
    // 모달 표시
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    // 모달 숨기기
    function hideModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('hidden');
        }
    }
    
    // 이벤트 리스너 등록
    function setupEventListeners() {
        // 폼 제출 이벤트 리스너
        if (signupForm) {
            signupForm.addEventListener('submit', handleEmailPasswordSignup);
        }
        
        // Google 회원가입 버튼 클릭 이벤트 리스너
        if (googleSignupButton) {
            googleSignupButton.addEventListener('click', handleGoogleSignup);
        }
        
        // 약관 전체 동의 체크박스 이벤트 리스너
        if (termsAllCheckbox) {
            termsAllCheckbox.addEventListener('change', handleTermsAllChange);
        }
        
        // 개별 약관 체크박스 이벤트 리스너
        if (termsServiceCheckbox) {
            termsServiceCheckbox.addEventListener('change', updateTermsAllCheckbox);
        }
        
        if (termsPrivacyCheckbox) {
            termsPrivacyCheckbox.addEventListener('change', updateTermsAllCheckbox);
        }
        
        if (termsMarketingCheckbox) {
            termsMarketingCheckbox.addEventListener('change', updateTermsAllCheckbox);
        }
        
        // 모달 열기 버튼 이벤트 리스너
        modalButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modalId = button.getAttribute('data-modal');
                showModal(modalId);
            });
        });
        
        // 모달 닫기 버튼 이벤트 리스너
        modalCloseButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = button.closest('.modal');
                hideModal(modal);
            });
        });
        
        // 모달 외부 클릭 시 닫기
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    hideModal(modal);
                }
            });
        });
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                const visibleModal = document.querySelector('.modal:not(.hidden)');
                hideModal(visibleModal);
            }
        });
        
        // 입력 필드에 키 입력 시 알림 숨기기
        const inputFields = [emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput];
        inputFields.forEach(input => {
            if (input) {
                input.addEventListener('input', hideNotification);
            }
        });
    }
    
    // 문서 로드 시 초기화
    function init() {
        // 이미 로그인된 사용자 확인
        checkAuthState();
        
        // 이벤트 리스너 설정
        setupEventListeners();
    }
    
    // 페이지 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', init);
    
    // Firebase 인증 상태 변경 리스너
    if (window.dhcFirebase) {
        window.dhcFirebase.onAuthStateChanged(function(user) {
            if (user) {
                // 이미 로그인된 사용자는 홈페이지 또는 마이페이지로 리디렉션
                window.location.href = '../../index.html';
            }
        });
    }
})();