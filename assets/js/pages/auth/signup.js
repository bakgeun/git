/**
 * 회원가입 페이지 스크립트 (완전한 버전)
 * 회원가입 기능, 실시간 검증, 모달 z-index 관리를 포함합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
    console.log('🚀 signup.js 초기화 시작 (완전한 버전)');

    // DOM 요소 참조
    let signupForm, emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput;
    let termsAllCheckbox, termsServiceCheckbox, termsPrivacyCheckbox, termsMarketingCheckbox;
    let signupButton, googleSignupButton, notification, notificationMessage;
    let modalButtons, modalCloseButtons, modals;

    // 검증 상태 관리
    let validationStates = {
        email: false,
        password: false,
        'password-confirm': false,
        name: false,
        phone: false
    };

    // 이메일 중복 검사 디바운스 타이머
    let emailCheckTimer = null;

    // DOM 요소들 찾기
    function findDOMElements() {
        signupForm = document.getElementById('signup-form');
        emailInput = document.getElementById('email');
        passwordInput = document.getElementById('password');
        passwordConfirmInput = document.getElementById('password-confirm');
        nameInput = document.getElementById('name');
        phoneInput = document.getElementById('phone');
        termsAllCheckbox = document.getElementById('terms-all');
        termsServiceCheckbox = document.getElementById('terms-service');
        termsPrivacyCheckbox = document.getElementById('terms-privacy');
        termsMarketingCheckbox = document.getElementById('terms-marketing');
        signupButton = document.getElementById('signup-btn');
        googleSignupButton = document.getElementById('google-signup-btn');
        notification = document.getElementById('notification');
        notificationMessage = document.getElementById('notification-message');

        // 모달 관련 요소들
        modalButtons = document.querySelectorAll('[data-modal]');
        modalCloseButtons = document.querySelectorAll('[data-dismiss="modal"]');
        modals = document.querySelectorAll('.modal');

        console.log('📋 DOM 요소 찾기 완료:', {
            signupForm: !!signupForm,
            termsAllCheckbox: !!termsAllCheckbox,
            modalButtons: modalButtons.length,
            googleSignupButton: !!googleSignupButton
        });
    }

    // 이미 로그인된 사용자 확인 및 리디렉션
    function checkAuthState() {
        if (window.dhcFirebase && window.dhcFirebase.auth) {
            const currentUser = window.dhcFirebase.getCurrentUser();

            if (currentUser) {
                console.log('👤 이미 로그인된 사용자, 리디렉션');
                window.location.href = window.adjustPath('index.html');
            }
        }
    }

    // 알림 메시지 표시
    function showNotification(message, type = 'error') {
        console.log('📢 알림 표시:', message, type);

        if (!notification || !notificationMessage) {
            console.warn('⚠️ 알림 요소를 찾을 수 없습니다');
            alert(message); // 폴백
            return;
        }

        // 타입에 따른 스타일 설정
        if (type === 'error') {
            notification.className = 'mb-6 block';
            notification.querySelector('div').className = 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded';
            const svgElement = notification.querySelector('svg');
            if (svgElement) svgElement.className = 'h-5 w-5 text-red-500';
        } else if (type === 'success') {
            notification.className = 'mb-6 block';
            notification.querySelector('div').className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded';
            const svgElement = notification.querySelector('svg');
            if (svgElement) svgElement.className = 'h-5 w-5 text-green-500';
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

    // ===================================
    // 실시간 검증 로직
    // ===================================

    // 필드 상태 설정 함수
    function setFieldState(fieldId, state, message) {
        const field = document.getElementById(fieldId);
        const icon = document.getElementById(`${fieldId}-validation-icon`);
        const messageElement = document.getElementById(`${fieldId}-validation-message`);

        if (!field || !icon || !messageElement) return;

        // 기존 상태 클래스 제거
        field.classList.remove('success', 'error', 'loading');
        icon.classList.remove('success', 'error', 'loading');
        messageElement.classList.remove('success', 'error', 'info');

        // 새로운 상태 적용
        field.classList.add(state);
        icon.classList.add(state);

        // 메시지 상태 설정
        if (state === 'success') {
            messageElement.classList.add('success');
        } else if (state === 'error') {
            messageElement.classList.add('error');
        } else {
            messageElement.classList.add('info');
        }

        messageElement.textContent = message;

        // 검증 상태 업데이트
        validationStates[fieldId] = (state === 'success');

        // 폼 제출 버튼 상태 업데이트
        updateSubmitButton();
    }

    // 폼 제출 버튼 상태 업데이트
    function updateSubmitButton() {
        console.log('🔄 제출 버튼 상태 업데이트 중...');

        if (!signupButton) {
            console.warn('⚠️ 회원가입 버튼을 찾을 수 없습니다');
            return;
        }

        // 모든 필드 검증 상태 확인
        const allFieldsValid = Object.values(validationStates).every(state => state);
        console.log('📋 필드 검증 상태:', validationStates, '모든 필드 유효:', allFieldsValid);

        // 필수 약관 동의 확인
        const termsValid = termsServiceCheckbox && termsPrivacyCheckbox &&
            termsServiceCheckbox.checked && termsPrivacyCheckbox.checked;
        console.log('📄 약관 동의 상태:', {
            serviceChecked: termsServiceCheckbox ? termsServiceCheckbox.checked : false,
            privacyChecked: termsPrivacyCheckbox ? termsPrivacyCheckbox.checked : false,
            termsValid: termsValid
        });

        // 전체 조건 확인
        const canSubmit = allFieldsValid && termsValid;
        console.log('✅ 제출 가능 여부:', canSubmit);

        // 버튼 상태 업데이트
        signupButton.disabled = !canSubmit;

        if (canSubmit) {
            // 활성화 상태
            signupButton.classList.remove('opacity-50', 'cursor-not-allowed');
            signupButton.classList.add('hover:bg-blue-700');
            console.log('🟢 회원가입 버튼 활성화됨');
        } else {
            // 비활성화 상태
            signupButton.classList.add('opacity-50', 'cursor-not-allowed');
            signupButton.classList.remove('hover:bg-blue-700');
            console.log('🔴 회원가입 버튼 비활성화됨');
        }

        // 디버깅용 상세 로그
        console.log('🔍 상세 상태:', {
            emailValid: validationStates.email,
            passwordValid: validationStates.password,
            passwordConfirmValid: validationStates['password-confirm'],  // 수정
            nameValid: validationStates.name,
            phoneValid: validationStates.phone,
            serviceTerms: termsServiceCheckbox ? termsServiceCheckbox.checked : false,
            privacyTerms: termsPrivacyCheckbox ? termsPrivacyCheckbox.checked : false,
            buttonDisabled: signupButton.disabled
        });
    }

    // 이메일 중복 검사
    async function checkEmailDuplication(email) {
        if (!email || !window.validators.isValidEmail(email)) {
            return false;
        }

        try {
            // Firebase에서 이메일 중복 확인
            if (window.dhcFirebase && window.dhcFirebase.auth) {
                // Firebase에서 이메일 중복 확인 (signInMethods 사용)
                const methods = await window.dhcFirebase.auth.fetchSignInMethodsForEmail(email);
                return methods.length === 0; // 빈 배열이면 사용 가능
            }

            // 로컬 테스트 모드에서는 간단한 체크
            if (window.LOCAL_TEST_MODE) {
                const testEmails = ['test@test.com', 'admin@test.com', 'gostepexercise@gmail.com'];
                return !testEmails.includes(email.toLowerCase());
            }

            return true;
        } catch (error) {
            console.error('이메일 중복 검사 오류:', error);
            return false;
        }
    }

    // 이메일 실시간 검증
    function validateEmailRealtime() {
        const email = emailInput.value.trim();

        if (!email) {
            setFieldState('email', 'error', '이메일을 입력해주세요.');
            return;
        }

        if (!window.validators.isValidEmail(email)) {
            setFieldState('email', 'error', '유효한 이메일 주소를 입력해주세요.');
            return;
        }

        // 로딩 상태 표시
        setFieldState('email', 'loading', '이메일 중복 확인 중...');

        // 디바운스 처리
        if (emailCheckTimer) {
            clearTimeout(emailCheckTimer);
        }

        emailCheckTimer = setTimeout(async () => {
            try {
                const isAvailable = await checkEmailDuplication(email);

                if (isAvailable) {
                    setFieldState('email', 'success', '사용 가능한 이메일입니다.');
                } else {
                    setFieldState('email', 'error', '이미 사용 중인 이메일입니다.');
                }
            } catch (error) {
                setFieldState('email', 'error', '이메일 확인 중 오류가 발생했습니다.');
            }
        }, 800); // 800ms 디바운스
    }

    // 비밀번호 강도 계산
    function calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];

        // 길이 검사
        if (password.length >= 8) score += 1;
        else feedback.push('최소 8자 이상');

        // 소문자 검사
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('소문자 포함');

        // 대문자 검사
        if (/[A-Z]/.test(password)) score += 0.5;

        // 숫자 검사
        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('숫자 포함');

        // 특수문자 검사
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

        // 연속된 문자 검사
        if (!/(.)\1{2,}/.test(password)) score += 0.5;

        // 강도 등급 결정
        let strength = 'weak';
        if (score >= 4) strength = 'strong';
        else if (score >= 3) strength = 'good';
        else if (score >= 2) strength = 'fair';

        return { score, strength, feedback };
    }

    // 비밀번호 요구사항 체크리스트 업데이트
    function updatePasswordRequirements(password) {
        const requirements = {
            length: password.length >= 8,
            letter: /[a-zA-Z]/.test(password),
            number: /[0-9]/.test(password)
        };

        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(`${req}-check`);
            if (element) {
                element.className = requirements[req] ? 'valid' : 'invalid';
            }
        });
    }

    // 비밀번호 실시간 검증
    function validatePasswordRealtime() {
        const password = passwordInput.value;
        const strengthContainer = document.getElementById('password-strength');
        const strengthFill = document.getElementById('password-strength-fill');
        const strengthText = document.getElementById('password-strength-text');

        if (!password) {
            setFieldState('password', 'error', '비밀번호를 입력해주세요.');
            if (strengthContainer) strengthContainer.style.display = 'none';
            return;
        }

        // 비밀번호 강도 계산
        const { strength, feedback } = calculatePasswordStrength(password);

        // 강도 표시 업데이트
        if (strengthContainer && strengthFill && strengthText) {
            strengthContainer.style.display = 'block';
            strengthFill.className = `password-strength-fill ${strength}`;
            strengthText.className = `password-strength-text ${strength}`;

            const strengthLabels = {
                weak: '약함',
                fair: '보통',
                good: '좋음',
                strong: '강함'
            };

            strengthText.textContent = `비밀번호 강도: ${strengthLabels[strength]}`;
        }

        // 요구사항 체크리스트 업데이트
        updatePasswordRequirements(password);

        // 기본 검증
        if (password.length < 8) {
            setFieldState('password', 'error', '비밀번호는 최소 8자 이상이어야 합니다.');
            return;
        }

        if (!/[a-zA-Z]/.test(password)) {
            setFieldState('password', 'error', '비밀번호에는 영문자가 포함되어야 합니다.');
            return;
        }

        if (!/[0-9]/.test(password)) {
            setFieldState('password', 'error', '비밀번호에는 숫자가 포함되어야 합니다.');
            return;
        }

        setFieldState('password', 'success', '사용 가능한 비밀번호입니다.');

        // 비밀번호 확인 필드도 재검증
        if (passwordConfirmInput.value) {
            validatePasswordConfirmRealtime();
        }
    }

    // 비밀번호 확인 실시간 검증
    function validatePasswordConfirmRealtime() {
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        if (!passwordConfirm) {
            setFieldState('password-confirm', 'error', '비밀번호 확인을 입력해주세요.');
            return;
        }

        if (password !== passwordConfirm) {
            setFieldState('password-confirm', 'error', '비밀번호가 일치하지 않습니다.');
            return;
        }

        setFieldState('password-confirm', 'success', '비밀번호가 일치합니다.');
    }

    // 이름 실시간 검증
    function validateNameRealtime() {
        const name = nameInput.value.trim();

        if (!name) {
            setFieldState('name', 'error', '이름을 입력해주세요.');
            return;
        }

        // 한글 이름 검증
        if (!/^[가-힣]{2,10}$/.test(name)) {
            setFieldState('name', 'error', '한글 이름을 2-10자로 입력해주세요.');
            return;
        }

        setFieldState('name', 'success', '올바른 이름입니다.');
    }

    // 휴대폰 번호 자동 포맷팅
    function formatPhoneNumber(value) {
        // 숫자만 추출
        const numbers = value.replace(/[^0-9]/g, '');

        // 포맷팅 적용
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
    }

    // 휴대폰 번호 실시간 검증
    function validatePhoneRealtime() {
        const phone = phoneInput.value.trim();

        if (!phone) {
            setFieldState('phone', 'error', '휴대폰 번호를 입력해주세요.');
            return;
        }

        // 휴대폰 번호 형식 검증
        const phoneRegex = /^01[0-9]-[0-9]{4}-[0-9]{4}$/;
        if (!phoneRegex.test(phone)) {
            setFieldState('phone', 'error', '올바른 휴대폰 번호 형식이 아닙니다.');
            return;
        }

        setFieldState('phone', 'success', '올바른 휴대폰 번호입니다.');
    }

    // 실시간 검증 이벤트 리스너 설정
    function setupRealtimeValidation() {
        console.log('🔍 실시간 검증 이벤트 리스너 설정');

        // 이메일 실시간 검증
        if (emailInput) {
            emailInput.addEventListener('input', validateEmailRealtime);
            emailInput.addEventListener('blur', validateEmailRealtime);
        }

        // 비밀번호 실시간 검증
        if (passwordInput) {
            passwordInput.addEventListener('input', validatePasswordRealtime);
            passwordInput.addEventListener('blur', validatePasswordRealtime);
        }

        // 비밀번호 확인 실시간 검증
        if (passwordConfirmInput) {
            passwordConfirmInput.addEventListener('input', validatePasswordConfirmRealtime);
            passwordConfirmInput.addEventListener('blur', validatePasswordConfirmRealtime);
        }

        // 이름 실시간 검증
        if (nameInput) {
            nameInput.addEventListener('input', validateNameRealtime);
            nameInput.addEventListener('blur', validateNameRealtime);
        }

        // 휴대폰 번호 자동 포맷팅 및 실시간 검증
        if (phoneInput) {
            phoneInput.addEventListener('input', function (e) {
                const formatted = formatPhoneNumber(e.target.value);
                e.target.value = formatted;
                validatePhoneRealtime();
            });
            phoneInput.addEventListener('blur', validatePhoneRealtime);
        }

        // 약관 동의 체크박스 이벤트
        [termsServiceCheckbox, termsPrivacyCheckbox].forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', updateSubmitButton);
            }
        });

        console.log('✅ 실시간 검증 이벤트 리스너 설정 완료');
    }

    // 폼 초기 상태 설정
    function initializeFormValidation() {
        console.log('🔧 폼 검증 초기화');

        // 모든 검증 상태 초기화
        Object.keys(validationStates).forEach(field => {
            validationStates[field] = false;
        });

        // 제출 버튼 초기 상태 설정
        if (signupButton) {
            signupButton.disabled = true;
            signupButton.classList.add('opacity-50', 'cursor-not-allowed');
            signupButton.classList.remove('hover:bg-blue-700');
        }

        // 비밀번호 강도 표시 숨김
        const strengthContainer = document.getElementById('password-strength');
        if (strengthContainer) {
            strengthContainer.style.display = 'none';
        }

        // 초기 버튼 상태 업데이트
        updateSubmitButton();

        console.log('✅ 폰 검증 초기화 완료');
    }

    // 로딩 상태 설정 (개선된 버전)
    function setLoading(isLoading) {
        console.log('⏳ 로딩 상태 변경:', isLoading);

        if (!signupButton) {
            console.warn('⚠️ 회원가입 버튼을 찾을 수 없습니다');
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
                처리 중...
            `;

            // Google 회원가입 버튼 비활성화
            if (googleSignupButton) {
                googleSignupButton.disabled = true;
                googleSignupButton.classList.add('opacity-70', 'cursor-not-allowed');
            }

            // 모든 입력 필드 비활성화
            [emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput].forEach(input => {
                if (input) input.disabled = true;
            });

            // 폼 제출 중 상태 표시
            if (signupForm) {
                signupForm.classList.add('form-submitting');
            }

        } else {
            // 버튼 활성화 및 원래 상태로 복원
            signupButton.disabled = false;
            signupButton.classList.remove('opacity-70', 'cursor-not-allowed');
            signupButton.textContent = '회원가입';

            // 제출 버튼 상태 재확인
            updateSubmitButton();

            // Google 회원가입 버튼 활성화
            if (googleSignupButton) {
                googleSignupButton.disabled = false;
                googleSignupButton.classList.remove('opacity-70', 'cursor-not-allowed');
            }

            // 모든 입력 필드 활성화
            [emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput].forEach(input => {
                if (input) input.disabled = false;
            });

            // 폼 제출 상태 해제
            if (signupForm) {
                signupForm.classList.remove('form-submitting');
            }
        }
    }

    // 입력값 유효성 검사 (개선된 버전)
    function validateForm() {
        console.log('🔍 폼 유효성 검사 시작');

        // 모든 필드가 실시간 검증을 통과했는지 확인
        const allFieldsValid = Object.values(validationStates).every(state => state);

        if (!allFieldsValid) {
            // 실시간 검증을 통과하지 않은 필드 찾기
            Object.keys(validationStates).forEach(fieldId => {
                if (!validationStates[fieldId]) {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.focus();
                        // 해당 필드의 실시간 검증 재실행
                        switch (fieldId) {
                            case 'email':
                                validateEmailRealtime();
                                break;
                            case 'password':
                                validatePasswordRealtime();
                                break;
                            case 'password-confirm':  // 수정: passwordConfirm → password-confirm
                                validatePasswordConfirmRealtime();
                                break;
                            case 'name':
                                validateNameRealtime();
                                break;
                            case 'phone':
                                validatePhoneRealtime();
                                break;
                        }
                    }
                    return false;
                }
            });
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

        console.log('✅ 폼 유효성 검사 통과');
        return true;
    }

    // 이메일/비밀번호 회원가입 처리 (개선된 버전)
    async function handleEmailPasswordSignup(event) {
        console.log('📝 이메일/비밀번호 회원가입 시작');

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

            // 사용자 정보 수집 (개선된 버전)
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const userData = {
                displayName: nameInput.value.trim(),
                phoneNumber: phoneInput.value.replace(/[^0-9]/g, ''), // 하이픈 제거
                marketingConsent: termsMarketingCheckbox.checked,
                termsAgreedAt: new Date(),
                // 추가 메타데이터
                registrationMethod: 'email',
                userAgent: navigator.userAgent,
                registrationIP: null // 실제 서비스에서는 서버에서 설정
            };

            console.log('🔄 회원가입 요청:', { email, userData });

            // 회원가입 시도
            const result = await window.authService.signUp(email, password, userData);

            if (result.success) {
                console.log('✅ 회원가입 성공');

                // 성공 메시지 표시
                showNotification('회원가입이 완료되었습니다! 환영합니다. 🎉', 'success');

                // 폼 초기화
                signupForm.reset();
                initializeFormValidation();

                // 리다이렉션 전 지연 (성공 메시지를 볼 수 있도록)
                setTimeout(() => {
                    window.location.href = window.adjustPath('pages/auth/login.html');
                }, 2000);
            } else {
                console.error('❌ 회원가입 실패:', result.error);

                // 회원가입 실패 처리
                let errorMessage = '회원가입에 실패했습니다. 다시 시도해주세요.';

                // 구체적인 오류 메시지 처리
                if (result.error) {
                    switch (result.error.code) {
                        case 'auth/email-already-in-use':
                            errorMessage = '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.';
                            // 이메일 필드 오류 표시
                            setFieldState('email', 'error', '이미 사용 중인 이메일입니다.');
                            emailInput.focus();
                            break;
                        case 'auth/invalid-email':
                            errorMessage = '유효하지 않은 이메일 형식입니다.';
                            setFieldState('email', 'error', '유효하지 않은 이메일 형식입니다.');
                            emailInput.focus();
                            break;
                        case 'auth/weak-password':
                            errorMessage = '보안에 취약한 비밀번호입니다. 더 강력한 비밀번호를 사용해주세요.';
                            setFieldState('password', 'error', '보안에 취약한 비밀번호입니다.');
                            passwordInput.focus();
                            break;
                        case 'auth/network-request-failed':
                            errorMessage = '네트워크 연결을 확인해주세요.';
                            break;
                        case 'auth/too-many-requests':
                            errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
                            break;
                        default:
                            errorMessage = `회원가입 오류: ${result.error.message}`;
                    }
                }

                showNotification(errorMessage);
                setLoading(false);
            }
        } catch (error) {
            console.error('❌ 회원가입 처리 중 오류 발생:', error);
            showNotification('회원가입 처리 중 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
            setLoading(false);
        }
    }

    // Google 회원가입 처리 (개선된 버전)
    async function handleGoogleSignup() {
        console.log('🔵 Google 회원가입 시작');

        // 알림 메시지 숨기기
        hideNotification();

        // Google 약관 동의 모달 표시
        showModal('google-terms-modal');
    }

    // Google 약관 동의 후 실제 Google 로그인 진행
    async function proceedWithGoogleSignup() {
        console.log('🔵 Google 로그인 진행');

        // 로딩 상태 시작
        setLoading(true);

        try {
            // authService가 있는지 확인
            if (!window.authService) {
                showNotification('인증 서비스가 초기화되지 않았습니다. 새로고침 후 다시 시도해주세요.');
                setLoading(false);
                return;
            }

            console.log('🔄 Google 로그인 요청');

            // Google 로그인 시도
            const result = await window.authService.signInWithGoogle();

            if (result.success) {
                console.log('✅ Google 회원가입 성공');

                // 마케팅 동의 정보 저장 (Google 모달에서 선택한 값)
                const googleMarketingConsent = document.getElementById('google-terms-marketing').checked;

                if (window.dhcFirebase && window.dhcFirebase.db) {
                    try {
                        await window.dhcFirebase.db.collection('users').doc(result.user.uid).update({
                            marketingConsent: googleMarketingConsent,
                            termsAgreedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                            registrationMethod: 'google'
                        });
                    } catch (updateError) {
                        console.error('사용자 정보 업데이트 오류:', updateError);
                    }
                }

                // Google 약관 모달 닫기
                hideModal(document.getElementById('google-terms-modal'));

                showNotification('Google 계정으로 회원가입이 완료되었습니다. 메인 페이지로 이동합니다.', 'success');

                // 리다이렉션 전 짧은 지연 (알림 메시지를 볼 수 있도록)
                setTimeout(() => {
                    window.location.href = window.adjustPath('index.html');
                }, 2000);
            } else {
                console.error('❌ Google 회원가입 실패:', result.error);

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
                    } else if (result.error.code === 'auth/unauthorized-domain') {
                        errorMessage = '현재 도메인에서 Google 로그인이 허용되지 않습니다. localhost로 접속해주세요.';
                    }
                }

                showNotification(errorMessage);
                setLoading(false);
            }
        } catch (error) {
            console.error('❌ Google 계정 연동 중 오류 발생:', error);
            showNotification('Google 계정 연동 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
            setLoading(false);
        }
    }

    // Google 약관 동의 상태 확인
    function updateGoogleTermsButton() {
        const serviceChecked = document.getElementById('google-terms-service');
        const privacyChecked = document.getElementById('google-terms-privacy');
        const agreeButton = document.getElementById('google-terms-agree-btn');

        if (!serviceChecked || !privacyChecked || !agreeButton) {
            console.warn('⚠️ Google 약관 요소를 찾을 수 없습니다');
            return;
        }

        const isValid = serviceChecked.checked && privacyChecked.checked;

        agreeButton.disabled = !isValid;

        if (isValid) {
            agreeButton.classList.remove('opacity-50', 'cursor-not-allowed');
            console.log('🟢 Google 약관 동의 버튼 활성화');
        } else {
            agreeButton.classList.add('opacity-50', 'cursor-not-allowed');
            console.log('🔴 Google 약관 동의 버튼 비활성화');
        }
    }

    // 약관 전체 동의 처리
    function handleTermsAllChange() {
        console.log('📄 전체 약관 동의 변경:', termsAllCheckbox.checked);

        const isChecked = termsAllCheckbox.checked;

        // 모든 약관 체크박스 상태 변경
        if (termsServiceCheckbox) termsServiceCheckbox.checked = isChecked;
        if (termsPrivacyCheckbox) termsPrivacyCheckbox.checked = isChecked;
        if (termsMarketingCheckbox) termsMarketingCheckbox.checked = isChecked;

        // 제출 버튼 상태 업데이트
        updateSubmitButton();

        console.log('📄 개별 약관 상태 업데이트 완료');
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

        // 제출 버튼 상태 업데이트
        updateSubmitButton();

        console.log('📄 전체 약관 상태 업데이트:', allChecked);
    }

    // ===================================
    // 모달 관리 로직 (z-index 개선)
    // ===================================

    // 모달 표시 함수 (개선된 버전)
    function showModal(modalId) {
        console.log('🔗 모달 표시:', modalId);

        const modal = document.getElementById(modalId);
        if (modal) {
            // 현재 열린 모달 수 확인
            const openModals = document.querySelectorAll('.modal:not(.hidden)');

            // 모달 z-index 동적 설정
            if (openModals.length > 0) {
                // 다른 모달이 이미 열려있는 경우
                modal.classList.add('modal-stacked');

                // Google 약관 모달에서 상세 약관 모달을 여는 경우
                if (document.getElementById('google-terms-modal') &&
                    !document.getElementById('google-terms-modal').classList.contains('hidden')) {
                    modal.classList.add('modal-stacked-high');
                }
            }

            modal.classList.remove('hidden');
            // CSS 애니메이션을 위한 강제 스타일 적용
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';

            // 모달이 표시될 때 스크롤 방지
            document.body.style.overflow = 'hidden';

            // 모달 포커스 관리
            modal.setAttribute('tabindex', '-1');
            modal.focus();

            console.log('✅ 모달 표시 완료:', modalId);
        } else {
            console.error('❌ 모달을 찾을 수 없습니다:', modalId);
        }
    }

    // 모달 숨기기 함수 (개선된 버전)
    function hideModal(modalElement) {
        console.log('❌ 모달 숨기기');

        if (modalElement) {
            modalElement.classList.add('hidden');
            modalElement.classList.remove('modal-stacked', 'modal-stacked-high');

            // CSS 애니메이션을 위한 스타일 초기화
            modalElement.style.visibility = 'hidden';
            modalElement.style.opacity = '0';

            // 다른 모달이 열려있는지 확인
            const remainingModals = document.querySelectorAll('.modal:not(.hidden)');

            if (remainingModals.length === 0) {
                // 모든 모달이 닫혔을 때만 스크롤 복원
                document.body.style.overflow = '';
            } else {
                // 남은 모달 중 가장 마지막 모달에 포커스
                const lastModal = remainingModals[remainingModals.length - 1];
                lastModal.focus();
            }

            console.log('✅ 모달 숨기기 완료');
        }
    }

    // 페이지 로드 시 모달 z-index 초기화
    function initializeModalLayers() {
        // 모든 모달 초기 상태 설정
        const allModals = document.querySelectorAll('.modal');
        allModals.forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('modal-stacked', 'modal-stacked-high');
        });

        // body 스크롤 상태 초기화
        document.body.style.overflow = '';

        console.log('✅ 모달 계층 초기화 완료');
    }

    // 이벤트 리스너 등록
    function setupEventListeners() {
        console.log('🎯 이벤트 리스너 등록 시작');

        // 폼 제출 이벤트 리스너
        if (signupForm) {
            signupForm.addEventListener('submit', handleEmailPasswordSignup);
            console.log('✅ 폼 제출 이벤트 등록');
        }

        // Google 회원가입 버튼 클릭 이벤트 리스너
        if (googleSignupButton) {
            googleSignupButton.addEventListener('click', handleGoogleSignup);
            console.log('✅ Google 회원가입 버튼 이벤트 등록');
        }

        // Google 약관 동의 버튼 이벤트 리스너
        const googleTermsAgreeBtn = document.getElementById('google-terms-agree-btn');
        if (googleTermsAgreeBtn) {
            googleTermsAgreeBtn.addEventListener('click', proceedWithGoogleSignup);
            console.log('✅ Google 약관 동의 버튼 이벤트 등록');
        }

        // Google 약관 체크박스 이벤트 리스너
        const googleTermsService = document.getElementById('google-terms-service');
        const googleTermsPrivacy = document.getElementById('google-terms-privacy');
        const googleTermsMarketing = document.getElementById('google-terms-marketing');

        if (googleTermsService) {
            googleTermsService.addEventListener('change', updateGoogleTermsButton);
            console.log('✅ Google 서비스 약관 이벤트 등록');
        }

        if (googleTermsPrivacy) {
            googleTermsPrivacy.addEventListener('change', updateGoogleTermsButton);
            console.log('✅ Google 개인정보 약관 이벤트 등록');
        }

        if (googleTermsMarketing) {
            googleTermsMarketing.addEventListener('change', updateGoogleTermsButton);
            console.log('✅ Google 마케팅 약관 이벤트 등록');
        }

        // 약관 전체 동의 체크박스 이벤트 리스너
        if (termsAllCheckbox) {
            termsAllCheckbox.addEventListener('change', handleTermsAllChange);
            console.log('✅ 전체 약관 동의 이벤트 등록');
        }

        // 개별 약관 체크박스 이벤트 리스너
        if (termsServiceCheckbox) {
            termsServiceCheckbox.addEventListener('change', updateTermsAllCheckbox);
            console.log('✅ 서비스 약관 이벤트 등록');
        }

        if (termsPrivacyCheckbox) {
            termsPrivacyCheckbox.addEventListener('change', updateTermsAllCheckbox);
            console.log('✅ 개인정보 약관 이벤트 등록');
        }

        if (termsMarketingCheckbox) {
            termsMarketingCheckbox.addEventListener('change', updateTermsAllCheckbox);
            console.log('✅ 마케팅 약관 이벤트 등록');
        }

        // 모달 열기 버튼 이벤트 리스너 (개선된 버전)
        modalButtons.forEach((button, index) => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation(); // 이벤트 버블링 방지

                const modalId = button.getAttribute('data-modal');
                console.log('🔗 모달 버튼 클릭:', modalId);

                // Google 약관 모달에서 상세 약관 모달을 여는 경우 특별 처리
                const googleTermsModal = document.getElementById('google-terms-modal');
                if (googleTermsModal && !googleTermsModal.classList.contains('hidden')) {
                    console.log('🔵 Google 약관 모달에서 상세 약관 모달 열기');
                }

                showModal(modalId);
            });
            console.log(`✅ 모달 버튼 ${index + 1} 이벤트 등록 (개선됨)`);
        });

        // 모달 닫기 버튼 이벤트 리스너 (개선된 버전)
        modalCloseButtons.forEach((button, index) => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation(); // 이벤트 버블링 방지

                const modal = button.closest('.modal');
                hideModal(modal);
            });
            console.log(`✅ 모달 닫기 버튼 ${index + 1} 이벤트 등록 (개선됨)`);
        });

        // 모달 외부 클릭 시 닫기 (개선된 버전)
        modals.forEach((modal, index) => {
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    // Google 약관 모달에서 상세 약관 모달이 열린 경우 Google 약관 모달 닫기 방지
                    const googleTermsModal = document.getElementById('google-terms-modal');
                    if (modal === googleTermsModal) {
                        const hasOpenDetailModal = document.querySelector('#terms-service-modal:not(.hidden), #privacy-modal:not(.hidden), #marketing-modal:not(.hidden)');
                        if (hasOpenDetailModal) {
                            console.log('🔵 상세 약관 모달이 열려있어 Google 약관 모달 닫기 방지');
                            return;
                        }
                    }

                    hideModal(modal);
                }
            });
            console.log(`✅ 모달 ${index + 1} 외부 클릭 이벤트 등록 (개선됨)`);
        });

        // ESC 키로 모달 닫기 (개선된 버전)
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                // 가장 위에 있는 모달만 닫기
                const openModals = document.querySelectorAll('.modal:not(.hidden)');
                if (openModals.length > 0) {
                    const topModal = openModals[openModals.length - 1];
                    hideModal(topModal);
                }
            }
        });
        console.log('✅ ESC 키 이벤트 등록 (개선됨)');

        // 입력 필드에 키 입력 시 알림 숨기기
        const inputFields = [emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput];
        inputFields.forEach((input, index) => {
            if (input) {
                input.addEventListener('input', hideNotification);
                console.log(`✅ 입력 필드 ${index + 1} 이벤트 등록`);
            }
        });

        console.log('🎯 모든 이벤트 리스너 등록 완료');
    }

    // 문서 로드 시 초기화 (완전한 버전)
    function init() {
        console.log('🚀 signup.js 초기화 함수 실행 (완전한 버전)');

        // DOM 요소 찾기
        findDOMElements();

        // 모달 계층 초기화
        initializeModalLayers();

        // 이미 로그인된 사용자 확인
        checkAuthState();

        // 폼 검증 초기화
        initializeFormValidation();

        // 실시간 검증 이벤트 리스너 설정
        setupRealtimeValidation();

        // 기존 이벤트 리스너 설정
        setupEventListeners();

        // 초기 상태 설정
        if (notification) {
            notification.classList.add('hidden');
        }

        console.log('✅ signup.js 초기화 완료 (실시간 검증 + 모달 z-index 수정)');
    }

    // DOM이 이미 로드된 경우 즉시 초기화, 아니면 DOMContentLoaded 대기
    if (document.readyState === 'loading') {
        console.log('📄 DOM 로딩 중, DOMContentLoaded 이벤트 대기');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('📄 DOM 이미 로드됨, 즉시 초기화');
        init();
    }

    // Firebase 인증 상태 변경 리스너
    if (window.dhcFirebase) {
        window.dhcFirebase.onAuthStateChanged(function (user) {
            if (user) {
                console.log('👤 사용자 로그인 감지, 리디렉션');
                window.location.href = window.adjustPath('index.html');
            }
        });
    }

    // 전역 에러 처리
    window.addEventListener('error', function (e) {
        console.error('🚨 전역 에러 발생:', e.error);
        if (e.error && e.error.message && e.error.message.includes('Firebase')) {
            showNotification('Firebase 연결에 문제가 있습니다. 새로고침 후 다시 시도해주세요.');
        }
    });

    // 네트워크 상태 모니터링
    window.addEventListener('online', function () {
        console.log('🌐 네트워크 연결 복원');
        hideNotification();
    });

    window.addEventListener('offline', function () {
        console.log('📵 네트워크 연결 끊김');
        showNotification('인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.');
    });

    // 개발 도구 열기 감지 (보안 강화)
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
        let devtools = {
            open: false,
            orientation: null
        };

        setInterval(function () {
            if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.log('🔍 개발자 도구 열림 감지');
                }
            } else {
                if (devtools.open) {
                    devtools.open = false;
                    console.log('🔍 개발자 도구 닫힘 감지');
                }
            }
        }, 500);
    }

    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            console.log('👁️ 페이지가 숨겨짐');
        } else {
            console.log('👁️ 페이지가 다시 보임');
            // 페이지가 다시 보일 때 인증 상태 재확인
            checkAuthState();
        }
    });

    console.log('🎉 signup.js 로드 완료 - 모든 기능 준비됨');
})();

// ✨ 완료!
// 이것이 signup.js의 완전한 코드입니다.
//
// 🔧 포함된 기능:
// ✅ 실시간 이메일 중복 검사
// ✅ 비밀번호 강도 측정 및 시각적 표시
// ✅ 모든 필드 실시간 검증
// ✅ 휴대폰 번호 자동 포맷팅
// ✅ 모달 z-index 관리
// ✅ 스마트 폼 제출 버튼
// ✅ 에러 처리 및 사용자 피드백
// ✅ 보안 강화 및 모니터링
// ✅ 네트워크 상태 감지
// ✅ 접근성 개선