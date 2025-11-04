/**
 * 회원가입 페이지 스크립트 (주소/생년월일 필드 추가)
 * 회원가입 기능, 실시간 검증, 모달 z-index 관리, 주소 검색 포함
 */

(function () {
    console.log('🚀 signup.js 초기화 시작 (주소/생년월일 추가)');

    // DOM 요소 참조
    let signupForm, emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput;
    let birthdateInput, genderInputs, postalCodeInput, addressBasicInput, addressDetailInput, addressFullInput;
    let termsAllCheckbox, termsServiceCheckbox, termsPrivacyCheckbox, termsMarketingCheckbox;
    let signupButton, googleSignupButton, addressSearchBtn, notification, notificationMessage;
    let modalButtons, modalCloseButtons, modals;

    // 검증 상태 관리
    let validationStates = {
        email: false,
        password: false,
        'password-confirm': false,
        name: false,
        phone: false,
        birthdate: false,
        gender: false
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
        
        // 🆕 새로 추가된 필드들
        birthdateInput = document.getElementById('birthdate');
        genderInputs = document.querySelectorAll('input[name="gender"]');
        postalCodeInput = document.getElementById('postal-code');
        addressBasicInput = document.getElementById('address-basic');
        addressDetailInput = document.getElementById('address-detail');
        addressFullInput = document.getElementById('address-full');
        addressSearchBtn = document.getElementById('address-search-btn');
        
        termsAllCheckbox = document.getElementById('terms-all');
        termsServiceCheckbox = document.getElementById('terms-service');
        termsPrivacyCheckbox = document.getElementById('terms-privacy');
        termsMarketingCheckbox = document.getElementById('terms-marketing');
        signupButton = document.getElementById('signup-btn');
        googleSignupButton = document.getElementById('google-signup-btn');
        notification = document.getElementById('notification');
        notificationMessage = document.getElementById('notification-message');

        modalButtons = document.querySelectorAll('[data-modal]');
        modalCloseButtons = document.querySelectorAll('[data-dismiss="modal"]');
        modals = document.querySelectorAll('.modal');

        console.log('📋 DOM 요소 찾기 완료 (주소/생년월일 필드 포함)');
    }

    // 이미 로그인된 사용자 확인
    function checkAuthState() {
        if (window.dhcFirebase && window.dhcFirebase.auth) {
            const currentUser = window.dhcFirebase.getCurrentUser();
            if (currentUser) {
                console.log('👤 이미 로그인된 사용자, 리다이렉션');
                window.location.href = window.adjustPath('index.html');
            }
        }
    }

    // 알림 메시지 표시
    function showNotification(message, type = 'error') {
        console.log('📢 알림 표시:', message, type);

        if (!notification || !notificationMessage) {
            console.warn('⚠️ 알림 요소를 찾을 수 없습니다');
            alert(message);
            return;
        }

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

        notificationMessage.textContent = message;
        notification.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function hideNotification() {
        if (notification) {
            notification.classList.add('hidden');
        }
    }

    // ===================================
    // 🆕 주소 검색 시스템
    // ===================================

    /**
     * 주소 검색 시스템 초기화
     */
    function initAddressSearch() {
        console.log('🏠 주소 검색 시스템 초기화');

        if (!addressSearchBtn) {
            console.warn('⚠️ 주소 검색 버튼을 찾을 수 없습니다.');
            return;
        }

        // 주소 검색 버튼 클릭 이벤트
        addressSearchBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openAddressSearch();
        });

        // 상세 주소 입력 시 전체 주소 업데이트
        if (addressDetailInput) {
            addressDetailInput.addEventListener('input', updateFullAddress);
        }

        console.log('✅ 주소 검색 시스템 초기화 완료');
    }

    /**
     * Daum 우편번호 API 열기
     */
    function openAddressSearch() {
        console.log('🔍 Daum 우편번호 검색 실행');

        // Daum API 로드 확인
        if (typeof daum === 'undefined' || !daum.Postcode) {
            showNotification('주소 검색 서비스를 준비 중입니다. 잠시 후 다시 시도해주세요.', 'error');
            console.error('❌ Daum Postcode API가 로드되지 않았습니다.');
            return;
        }

        try {
            new daum.Postcode({
                oncomplete: function (data) {
                    console.log('✅ 주소 선택 완료:', data);

                    // 우편번호와 기본 주소 입력
                    if (postalCodeInput) postalCodeInput.value = data.zonecode;
                    if (addressBasicInput) addressBasicInput.value = data.address;

                    // 상세 주소 입력 필드로 포커스 이동
                    if (addressDetailInput) {
                        addressDetailInput.focus();
                    }

                    // 전체 주소 업데이트
                    updateFullAddress();

                    // 성공 메시지 표시
                    showNotification('주소가 입력되었습니다. 상세 주소를 입력해주세요.', 'success');
                }
            }).open();

        } catch (error) {
            console.error('❌ 주소 검색 실행 오류:', error);
            showNotification('주소 검색을 실행할 수 없습니다.', 'error');
        }
    }

    /**
     * 전체 주소 업데이트
     */
    function updateFullAddress() {
        const postalCode = postalCodeInput?.value || '';
        const basicAddress = addressBasicInput?.value || '';
        const detailAddress = addressDetailInput?.value || '';

        // 전체 주소 조합
        let fullAddress = '';
        if (postalCode && basicAddress) {
            fullAddress = `(${postalCode}) ${basicAddress}`;
            if (detailAddress) {
                fullAddress += ` ${detailAddress}`;
            }
        }

        // hidden 필드에 전체 주소 저장
        if (addressFullInput) {
            addressFullInput.value = fullAddress;
        }

        console.log('🔄 전체 주소 업데이트:', fullAddress);
    }

    // ===================================
    // 실시간 검증 로직
    // ===================================

    function setFieldState(fieldId, state, message) {
        const field = document.getElementById(fieldId);
        const icon = document.getElementById(`${fieldId}-validation-icon`);
        const messageElement = document.getElementById(`${fieldId}-validation-message`);

        if (!field || !icon || !messageElement) return;

        field.classList.remove('success', 'error', 'loading');
        icon.classList.remove('success', 'error', 'loading');
        messageElement.classList.remove('success', 'error', 'info');

        field.classList.add(state);
        icon.classList.add(state);

        if (state === 'success') {
            messageElement.classList.add('success');
        } else if (state === 'error') {
            messageElement.classList.add('error');
        } else {
            messageElement.classList.add('info');
        }

        messageElement.textContent = message;
        validationStates[fieldId] = (state === 'success');
        updateSubmitButton();
    }

    function updateSubmitButton() {
        console.log('🔄 제출 버튼 상태 업데이트 중...');

        if (!signupButton) {
            console.warn('⚠️ 회원가입 버튼을 찾을 수 없습니다');
            return;
        }

        const allFieldsValid = Object.values(validationStates).every(state => state);
        console.log('📋 필드 검증 상태:', validationStates, '모든 필드 유효:', allFieldsValid);

        const termsValid = termsServiceCheckbox && termsPrivacyCheckbox &&
            termsServiceCheckbox.checked && termsPrivacyCheckbox.checked;
        console.log('📄 약관 동의 상태:', {
            serviceChecked: termsServiceCheckbox ? termsServiceCheckbox.checked : false,
            privacyChecked: termsPrivacyCheckbox ? termsPrivacyCheckbox.checked : false,
            termsValid: termsValid
        });

        const canSubmit = allFieldsValid && termsValid;
        console.log('✅ 제출 가능 여부:', canSubmit);

        signupButton.disabled = !canSubmit;

        if (canSubmit) {
            signupButton.classList.remove('opacity-50', 'cursor-not-allowed');
            signupButton.classList.add('hover:bg-blue-700');
            console.log('🟢 회원가입 버튼 활성화됨');
        } else {
            signupButton.classList.add('opacity-50', 'cursor-not-allowed');
            signupButton.classList.remove('hover:bg-blue-700');
            console.log('🔴 회원가입 버튼 비활성화됨');
        }
    }

    async function checkEmailDuplication(email) {
        if (!email || !window.validators.isValidEmail(email)) {
            return false;
        }

        try {
            if (window.dhcFirebase && window.dhcFirebase.auth) {
                const methods = await window.dhcFirebase.auth.fetchSignInMethodsForEmail(email);
                return methods.length === 0;
            }

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

        setFieldState('email', 'loading', '이메일 중복 확인 중...');

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
        }, 800);
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];

        if (password.length >= 8) score += 1;
        else feedback.push('최소 8자 이상');

        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('소문자 포함');

        if (/[A-Z]/.test(password)) score += 0.5;

        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('숫자 포함');

        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

        if (!/(.)\1{2,}/.test(password)) score += 0.5;

        let strength = 'weak';
        if (score >= 4) strength = 'strong';
        else if (score >= 3) strength = 'good';
        else if (score >= 2) strength = 'fair';

        return { score, strength, feedback };
    }

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

        const { strength, feedback } = calculatePasswordStrength(password);

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

        updatePasswordRequirements(password);

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

        if (passwordConfirmInput.value) {
            validatePasswordConfirmRealtime();
        }
    }

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

    function validateNameRealtime() {
        const name = nameInput.value.trim();

        if (!name) {
            setFieldState('name', 'error', '이름을 입력해주세요.');
            return;
        }

        if (!/^[가-힣]{2,10}$/.test(name)) {
            setFieldState('name', 'error', '한글 이름을 2-10자로 입력해주세요.');
            return;
        }

        setFieldState('name', 'success', '올바른 이름입니다.');
    }

    function formatPhoneNumber(value) {
        const numbers = value.replace(/[^0-9]/g, '');

        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
    }

    function validatePhoneRealtime() {
        const phone = phoneInput.value.trim();

        if (!phone) {
            setFieldState('phone', 'error', '휴대폰 번호를 입력해주세요.');
            return;
        }

        const phoneRegex = /^01[0-9]-[0-9]{4}-[0-9]{4}$/;
        if (!phoneRegex.test(phone)) {
            setFieldState('phone', 'error', '올바른 휴대폰 번호 형식이 아닙니다.');
            return;
        }

        setFieldState('phone', 'success', '올바른 휴대폰 번호입니다.');
    }

    // 🆕 생년월일 실시간 검증
    function validateBirthdateRealtime() {
        const birthdate = birthdateInput?.value;

        if (!birthdate) {
            validationStates.birthdate = false;
            updateSubmitButton();
            return;
        }

        // 날짜 유효성 검사
        const today = new Date();
        const selectedDate = new Date(birthdate);
        const age = today.getFullYear() - selectedDate.getFullYear();

        if (selectedDate > today) {
            validationStates.birthdate = false;
            updateSubmitButton();
            return;
        }

        if (age > 120) {
            validationStates.birthdate = false;
            updateSubmitButton();
            return;
        }

        validationStates.birthdate = true;
        updateSubmitButton();
        console.log('✅ 생년월일 검증 성공');
    }

    // 🆕 성별 실시간 검증
    function validateGenderRealtime() {
        if (!genderInputs || genderInputs.length === 0) {
            validationStates.gender = false;
            updateSubmitButton();
            return;
        }

        const selectedGender = Array.from(genderInputs).find(input => input.checked);
        
        if (selectedGender) {
            validationStates.gender = true;
            console.log('✅ 성별 검증 성공');
        } else {
            validationStates.gender = false;
        }
        
        updateSubmitButton();
    }

    function setupRealtimeValidation() {
        console.log('🔍 실시간 검증 이벤트 리스너 설정');

        if (emailInput) {
            emailInput.addEventListener('input', validateEmailRealtime);
            emailInput.addEventListener('blur', validateEmailRealtime);
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', validatePasswordRealtime);
            passwordInput.addEventListener('blur', validatePasswordRealtime);
        }

        if (passwordConfirmInput) {
            passwordConfirmInput.addEventListener('input', validatePasswordConfirmRealtime);
            passwordConfirmInput.addEventListener('blur', validatePasswordConfirmRealtime);
        }

        if (nameInput) {
            nameInput.addEventListener('input', validateNameRealtime);
            nameInput.addEventListener('blur', validateNameRealtime);
        }

        if (phoneInput) {
            phoneInput.addEventListener('input', function (e) {
                const formatted = formatPhoneNumber(e.target.value);
                e.target.value = formatted;
                validatePhoneRealtime();
            });
            phoneInput.addEventListener('blur', validatePhoneRealtime);

        // 🆕 생년월일 필드 이벤트
        if (birthdateInput) {
            birthdateInput.addEventListener('change', validateBirthdateRealtime);
            birthdateInput.addEventListener('blur', validateBirthdateRealtime);
        }

        // 🆕 성별 필드 이벤트
        if (genderInputs && genderInputs.length > 0) {
            genderInputs.forEach(input => {
                input.addEventListener('change', validateGenderRealtime);
            });
        }
        }

        [termsServiceCheckbox, termsPrivacyCheckbox].forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', updateSubmitButton);
            }
        });

        console.log('✅ 실시간 검증 이벤트 리스너 설정 완료');
    }

    function initializeFormValidation() {
        console.log('🔧 폼 검증 초기화');

        Object.keys(validationStates).forEach(field => {
            validationStates[field] = false;
        });

        if (signupButton) {
            signupButton.disabled = true;
            signupButton.classList.add('opacity-50', 'cursor-not-allowed');
            signupButton.classList.remove('hover:bg-blue-700');
        }

        const strengthContainer = document.getElementById('password-strength');
        if (strengthContainer) {
            strengthContainer.style.display = 'none';
        }

        updateSubmitButton();

        console.log('✅ 폼 검증 초기화 완료');
    }

    function setLoading(isLoading) {
        console.log('⏳ 로딩 상태 변경:', isLoading);

        if (!signupButton) {
            console.warn('⚠️ 회원가입 버튼을 찾을 수 없습니다');
            return;
        }

        if (isLoading) {
            signupButton.disabled = true;
            signupButton.classList.add('opacity-70', 'cursor-not-allowed');
            signupButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
            `;

            if (googleSignupButton) {
                googleSignupButton.disabled = true;
                googleSignupButton.classList.add('opacity-70', 'cursor-not-allowed');
            }

            [emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput].forEach(input => {
                if (input) input.disabled = true;
            });

            if (signupForm) {
                signupForm.classList.add('form-submitting');
            }

        } else {
            signupButton.disabled = false;
            signupButton.classList.remove('opacity-70', 'cursor-not-allowed');
            signupButton.textContent = '회원가입';

            updateSubmitButton();

            if (googleSignupButton) {
                googleSignupButton.disabled = false;
                googleSignupButton.classList.remove('opacity-70', 'cursor-not-allowed');
            }

            [emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput].forEach(input => {
                if (input) input.disabled = false;
            });

            if (signupForm) {
                signupForm.classList.remove('form-submitting');
            }
        }
    }

    function validateForm() {
        console.log('🔍 폼 유효성 검사 시작');

        const allFieldsValid = Object.values(validationStates).every(state => state);

        if (!allFieldsValid) {
            Object.keys(validationStates).forEach(fieldId => {
                if (!validationStates[fieldId]) {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.focus();
                        switch (fieldId) {
                            case 'email':
                                validateEmailRealtime();
                                break;
                            case 'password':
                                validatePasswordRealtime();
                                break;
                            case 'password-confirm':
                                validatePasswordConfirmRealtime();
                                break;
                            case 'name':
                                validateNameRealtime();
                                break;
                            case 'phone':
                                validatePhoneRealtime();
                                break;
                            case 'birthdate':
                                validateBirthdateRealtime();
                                if (!validationStates.birthdate) {
                                    showNotification('생년월일을 입력해주세요.');
                                }
                                break;
                            case 'gender':
                                validateGenderRealtime();
                                if (!validationStates.gender) {
                                    showNotification('성별을 선택해주세요.');
                                }
                                break;
                        }
                    }
                    return false;
                }
            });
            return false;
        }

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

    // ===================================
    // 이메일/비밀번호 회원가입 처리
    // ===================================

    async function handleEmailPasswordSignup(event) {
        console.log('📝 이메일/비밀번호 회원가입 시작');

        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        hideNotification();
        setLoading(true);

        try {
            if (!window.authService) {
                showNotification('인증 서비스가 초기화되지 않았습니다. 새로고침 후 다시 시도해주세요.');
                setLoading(false);
                return;
            }

            // 🆕 사용자 정보 수집 (주소, 생년월일, 성별 포함)
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const phoneValue = phoneInput.value;
            const phoneNumberClean = phoneValue.replace(/[^0-9]/g, '');

            // 성별 값 가져오기
            let genderValue = '';
            if (genderInputs && genderInputs.length > 0) {
                const selectedGender = Array.from(genderInputs).find(input => input.checked);
                genderValue = selectedGender ? selectedGender.value : '';
            }

            const userData = {
                displayName: nameInput.value.trim(),
                phoneNumber: phoneNumberClean,
                
                // 🆕 추가된 필드들
                birthdate: birthdateInput?.value || '',
                gender: genderValue,
                postalCode: postalCodeInput?.value || '',
                addressBasic: addressBasicInput?.value || '',
                addressDetail: addressDetailInput?.value || '',
                address: addressFullInput?.value || '', // 전체 주소 (호환성)
                
                marketingConsent: termsMarketingCheckbox.checked,
                termsAgreedAt: new Date(),
                registrationMethod: 'email',
                userAgent: navigator.userAgent,
                registrationIP: null
            };

            console.log('📄 회원가입 요청:', { email, userData });

            const result = await window.authService.signUp(email, password, userData);

            if (result.success) {
                console.log('✅ 회원가입 성공');

                showNotification('회원가입이 완료되었습니다! 환영합니다. 🎉', 'success');

                signupForm.reset();
                initializeFormValidation();

                setTimeout(() => {
                    window.location.href = window.adjustPath('pages/auth/login.html');
                }, 2000);
            } else {
                console.error('❌ 회원가입 실패:', result.error);

                let errorMessage = '회원가입에 실패했습니다. 다시 시도해주세요.';

                if (result.error) {
                    switch (result.error.code) {
                        case 'auth/email-already-in-use':
                            errorMessage = '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.';
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

    // Google 회원가입 처리 (기존과 동일)
    async function handleGoogleSignup() {
        console.log('🔵 Google 회원가입 시작');
        hideNotification();
        showModal('google-terms-modal');
    }

    async function proceedWithGoogleSignup() {
        console.log('🔵 Google 로그인 진행');
        setLoading(true);

        try {
            if (!window.authService) {
                showNotification('인증 서비스가 초기화되지 않았습니다. 새로고침 후 다시 시도해주세요.');
                setLoading(false);
                return;
            }

            console.log('📄 Google 로그인 요청');

            const result = await window.authService.signInWithGoogle();

            if (result.success) {
                console.log('✅ Google 회원가입 성공');

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

                hideModal(document.getElementById('google-terms-modal'));

                showNotification('Google 계정으로 회원가입이 완료되었습니다. 메인 페이지로 이동합니다.', 'success');

                setTimeout(() => {
                    window.location.href = window.adjustPath('index.html');
                }, 2000);
            } else {
                console.error('❌ Google 회원가입 실패:', result.error);

                let errorMessage = 'Google 계정 연동에 실패했습니다. 다시 시도해주세요.';

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

    function handleTermsAllChange() {
        console.log('📄 전체 약관 동의 변경:', termsAllCheckbox.checked);

        const isChecked = termsAllCheckbox.checked;

        if (termsServiceCheckbox) termsServiceCheckbox.checked = isChecked;
        if (termsPrivacyCheckbox) termsPrivacyCheckbox.checked = isChecked;
        if (termsMarketingCheckbox) termsMarketingCheckbox.checked = isChecked;

        updateSubmitButton();

        console.log('📄 개별 약관 상태 업데이트 완료');
    }

    function updateTermsAllCheckbox() {
        if (!termsAllCheckbox || !termsServiceCheckbox || !termsPrivacyCheckbox || !termsMarketingCheckbox) {
            return;
        }

        const allChecked = termsServiceCheckbox.checked &&
            termsPrivacyCheckbox.checked &&
            termsMarketingCheckbox.checked;

        termsAllCheckbox.checked = allChecked;

        updateSubmitButton();

        console.log('📄 전체 약관 상태 업데이트:', allChecked);
    }

    // ===================================
    // 모달 관리 로직
    // ===================================

    function showModal(modalId) {
        console.log('🔗 모달 표시:', modalId);

        const modal = document.getElementById(modalId);
        if (modal) {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');

            if (openModals.length > 0) {
                modal.classList.add('modal-stacked');

                if (document.getElementById('google-terms-modal') &&
                    !document.getElementById('google-terms-modal').classList.contains('hidden')) {
                    modal.classList.add('modal-stacked-high');
                }
            }

            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';

            document.body.style.overflow = 'hidden';

            modal.setAttribute('tabindex', '-1');
            modal.focus();

            console.log('✅ 모달 표시 완료:', modalId);
        } else {
            console.error('❌ 모달을 찾을 수 없습니다:', modalId);
        }
    }

    function hideModal(modalElement) {
        console.log('❌ 모달 숨기기');

        if (modalElement) {
            modalElement.classList.add('hidden');
            modalElement.classList.remove('modal-stacked', 'modal-stacked-high');

            modalElement.style.visibility = 'hidden';
            modalElement.style.opacity = '0';

            const remainingModals = document.querySelectorAll('.modal:not(.hidden)');

            if (remainingModals.length === 0) {
                document.body.style.overflow = '';
            } else {
                const lastModal = remainingModals[remainingModals.length - 1];
                lastModal.focus();
            }

            console.log('✅ 모달 숨기기 완료');
        }
    }

    function initializeModalLayers() {
        const allModals = document.querySelectorAll('.modal');
        allModals.forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('modal-stacked', 'modal-stacked-high');
        });

        document.body.style.overflow = '';

        console.log('✅ 모달 계층 초기화 완료');
    }

    // 이벤트 리스너 등록
    function setupEventListeners() {
        console.log('🎯 이벤트 리스너 등록 시작');

        if (signupForm) {
            signupForm.addEventListener('submit', handleEmailPasswordSignup);
            console.log('✅ 폼 제출 이벤트 등록');
        }

        if (googleSignupButton) {
            googleSignupButton.addEventListener('click', handleGoogleSignup);
            console.log('✅ Google 회원가입 버튼 이벤트 등록');
        }

        const googleTermsAgreeBtn = document.getElementById('google-terms-agree-btn');
        if (googleTermsAgreeBtn) {
            googleTermsAgreeBtn.addEventListener('click', proceedWithGoogleSignup);
            console.log('✅ Google 약관 동의 버튼 이벤트 등록');
        }

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

        if (termsAllCheckbox) {
            termsAllCheckbox.addEventListener('change', handleTermsAllChange);
            console.log('✅ 전체 약관 동의 이벤트 등록');
        }

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

        modalButtons.forEach((button, index) => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const modalId = button.getAttribute('data-modal');
                console.log('🔗 모달 버튼 클릭:', modalId);

                const googleTermsModal = document.getElementById('google-terms-modal');
                if (googleTermsModal && !googleTermsModal.classList.contains('hidden')) {
                    console.log('🔵 Google 약관 모달에서 상세 약관 모달 열기');
                }

                showModal(modalId);
            });
            console.log(`✅ 모달 버튼 ${index + 1} 이벤트 등록 (개선됨)`);
        });

        modalCloseButtons.forEach((button, index) => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const modal = button.closest('.modal');
                hideModal(modal);
            });
            console.log(`✅ 모달 닫기 버튼 ${index + 1} 이벤트 등록 (개선됨)`);
        });

        modals.forEach((modal, index) => {
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
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

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal:not(.hidden)');
                if (openModals.length > 0) {
                    const topModal = openModals[openModals.length - 1];
                    hideModal(topModal);
                }
            }
        });
        console.log('✅ ESC 키 이벤트 등록 (개선됨)');

        const inputFields = [emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput];
        inputFields.forEach((input, index) => {
            if (input) {
                input.addEventListener('input', hideNotification);
                console.log(`✅ 입력 필드 ${index + 1} 이벤트 등록`);
            }
        });

        console.log('🎯 모든 이벤트 리스너 등록 완료');
    }

    // 문서 로드 시 초기화
    function init() {
        console.log('🚀 signup.js 초기화 함수 실행 (주소/생년월일 추가)');

        findDOMElements();
        initializeModalLayers();
        checkAuthState();
        initializeFormValidation();
        setupRealtimeValidation();
        
        // 🆕 주소 검색 시스템 초기화
        initAddressSearch();
        
        setupEventListeners();

        if (notification) {
            notification.classList.add('hidden');
        }

        console.log('✅ signup.js 초기화 완료 (주소/생년월일 기능 포함)');
    }

    if (document.readyState === 'loading') {
        console.log('📄 DOM 로딩 중, DOMContentLoaded 이벤트 대기');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('📄 DOM 이미 로드됨, 즉시 초기화');
        init();
    }

    console.log('📋 회원가입 페이지에서는 즉시 리다이렉션하지 않음');

    window.addEventListener('error', function (e) {
        console.error('🚨 전역 에러 발생:', e.error);
        if (e.error && e.error.message && e.error.message.includes('Firebase')) {
            showNotification('Firebase 연결에 문제가 있습니다. 새로고침 후 다시 시도해주세요.');
        }
    });

    window.addEventListener('online', function () {
        console.log('🌐 네트워크 연결 복원');
        hideNotification();
    });

    window.addEventListener('offline', function () {
        console.log('🔵 네트워크 연결 끊김');
        showNotification('인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.');
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            console.log('👁️ 페이지가 숨겨짐');
        } else {
            console.log('👁️ 페이지가 다시 보임');
            checkAuthState();
        }
    });

    console.log('🎉 signup.js 로드 완료 - 모든 기능 준비됨 (주소/생년월일 포함)');
})();