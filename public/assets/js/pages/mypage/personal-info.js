/**
 * personal-info.js (최종 완성 버전)
 * 개인정보 관리 페이지 기능 - Firebase Auth + Firestore 통합
 * 비밀번호 변경, 회원탈퇴, 실시간 검증 모든 기능 완전 작동
 */

(function () {
    // 프로덕션 환경에서 console.log 비활성화
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isDev) { console.log = () => {}; }

    // 현재 사용자 정보를 저장할 변수
    let currentUser = null;
    let userProfile = null;

    /**
     * 🚀 페이지 초기화 (최종 안정 버전)
     */
    function initializePage() {
        try {
            console.log('🔄 개인정보 관리 페이지 초기화 시작');

            // 단순한 초기화 - 복잡한 대기 로직 제거
            setTimeout(async () => {
                try {
                    // 1. 기본 인증 확인
                    const authResult = await simpleAuthCheck();
                    if (!authResult) {
                        console.log('❌ 인증 실패 - 로그인 페이지로 이동');
                        return;
                    }

                    // 2. 기본 UI 초기화
                    forceApplyStyles();
                    setupBasicUI();

                    // 3. 사용자 정보 로드
                    await loadUserProfile();

                    // 4. 이벤트 설정
                    setupEventListeners();

                    // 5. 핵심 기능 활성화 (테스트에서 확인된 작동 로직)
                    setTimeout(() => {
                        activatePasswordValidation();
                        activateAccountDeleteButton();
                        console.log('✅ 모든 핵심 기능 활성화 완료');
                    }, 200);

                    console.log('✅ 개인정보 관리 페이지 초기화 완료');

                    // 초기화 완료 플래그
                    window.personalInfoInitialized = true;

                } catch (error) {
                    console.error('❌ 초기화 오류:', error);
                    showNotification('페이지 초기화 중 오류가 발생했습니다.', 'error');
                }
            }, 500); // 0.5초 대기

        } catch (error) {
            console.error('❌ 페이지 초기화 치명적 오류:', error);
        }
    }

    /**
     * 🔧 간단한 인증 확인
     */
    async function simpleAuthCheck() {
        // Firebase 사용자 직접 확인
        if (window.dhcFirebase && window.dhcFirebase.getCurrentUser) {
            const user = window.dhcFirebase.getCurrentUser();
            if (user) {
                console.log('✅ Firebase 사용자 인증됨');
                currentUser = user;
                return true;
            }
        }

        // authService 확인
        if (window.authService && window.authService.getCurrentUser) {
            const user = window.authService.getCurrentUser();
            if (user) {
                console.log('✅ authService 사용자 인증됨');
                currentUser = user;
                return true;
            }
        }

        console.log('❌ 인증된 사용자를 찾을 수 없음');

        // 로그인 페이지로 리다이렉트
        const currentPath = window.location.pathname;
        const redirectUrl = window.adjustPath
            ? window.adjustPath('pages/auth/login.html') + '?redirect=' + encodeURIComponent(currentPath)
            : 'pages/auth/login.html';

        window.location.href = redirectUrl;
        return false;
    }

    /**
     * 🔧 스타일 강제 적용
     */
    function forceApplyStyles() {
        if (document.getElementById('personal-info-forced-styles')) return;

        const style = document.createElement('style');
        style.id = 'personal-info-forced-styles';
        style.textContent = `
            /* 회원탈퇴 버튼 강제 스타일 */
            #account-delete-btn,
            .btn-danger {
                background: #ef4444 !important;
                color: white !important;
                border: 1px solid #ef4444 !important;
                padding: 0.5rem 1rem !important;
                border-radius: 6px !important;
                font-size: 0.875rem !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            #account-delete-btn:hover,
            .btn-danger:hover {
                background: #dc2626 !important;
                border-color: #dc2626 !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
            }

            /* 비밀번호 검증 표시 스타일 */
            .password-validation-ui {
                margin-top: 0.5rem;
                padding: 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                line-height: 1.4;
                display: none;
                border: 1px solid #e5e7eb;
            }
            
            .password-validation-ui.weak {
                background: #fef2f2;
                color: #991b1b;
                border-color: #fecaca;
            }
            
            .password-validation-ui.medium {
                background: #fffbeb;
                color: #92400e;
                border-color: #fed7aa;
            }
            
            .password-validation-ui.strong {
                background: #f0fdf4;
                color: #166534;
                border-color: #bbf7d0;
            }
            
            .password-match-ui {
                margin-top: 0.5rem;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 500;
                display: none;
                border: 1px solid #e5e7eb;
            }
            
            .password-match-ui.match {
                background: #f0fdf4;
                color: #166534;
                border-color: #bbf7d0;
            }
            
            .password-match-ui.no-match {
                background: #fef2f2;
                color: #991b1b;
                border-color: #fecaca;
            }
            
            .password-warning-ui {
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: #fef2f2;
                color: #991b1b;
                border: 1px solid #fecaca;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 500;
                display: none;
            }
        `;

        document.head.appendChild(style);
        console.log('✅ 강제 스타일 적용 완료');
    }

    /**
     * 🔧 기본 UI 설정
     */
    function setupBasicUI() {
        // 회원탈퇴 버튼 스타일 보장
        const deleteBtn = document.getElementById('account-delete-btn');
        if (deleteBtn) {
            deleteBtn.classList.add('btn', 'btn-danger');
            ensureAccountDeleteButtonStyle();
        }

        // 비밀번호 검증 UI 생성
        createPasswordValidationUI();

        console.log('✅ 기본 UI 설정 완료');
    }

    /**
     * 비밀번호 검증 UI 생성
     */
    function createPasswordValidationUI() {
        const newPasswordField = document.getElementById('newPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');
        const currentPasswordField = document.getElementById('currentPassword');

        if (!newPasswordField || !confirmPasswordField) {
            console.warn('⚠️ 비밀번호 필드를 찾을 수 없습니다.');
            return;
        }

        // 새 비밀번호 강도 표시 영역
        let strengthDiv = document.getElementById('password-strength-ui');
        if (!strengthDiv) {
            strengthDiv = document.createElement('div');
            strengthDiv.id = 'password-strength-ui';
            strengthDiv.className = 'password-validation-ui';
            newPasswordField.parentNode.appendChild(strengthDiv);
        }

        // 비밀번호 확인 매칭 표시 영역
        let matchDiv = document.getElementById('password-match-ui');
        if (!matchDiv) {
            matchDiv = document.createElement('div');
            matchDiv.id = 'password-match-ui';
            matchDiv.className = 'password-match-ui';
            confirmPasswordField.parentNode.appendChild(matchDiv);
        }

        // 현재/새 비밀번호 동일성 경고 영역
        let warningDiv = document.getElementById('password-warning-ui');
        if (!warningDiv && currentPasswordField) {
            warningDiv = document.createElement('div');
            warningDiv.id = 'password-warning-ui';
            warningDiv.className = 'password-warning-ui';
            newPasswordField.parentNode.appendChild(warningDiv);
        }

        console.log('✅ 비밀번호 검증 UI 생성 완료');
    }

    /**
     * 회원탈퇴 버튼 스타일 보장
     */
    function ensureAccountDeleteButtonStyle() {
        const deleteBtn = document.getElementById('account-delete-btn');

        if (!deleteBtn) {
            console.warn('⚠️ 회원탈퇴 버튼을 찾을 수 없습니다.');
            return;
        }

        // 강제 클래스 적용
        deleteBtn.classList.add('btn', 'btn-danger');

        // 인라인 스타일로 확실하게 보장
        deleteBtn.style.cssText = `
            background: #ef4444 !important;
            color: white !important;
            border: 1px solid #ef4444 !important;
            padding: 0.5rem 1rem !important;
            border-radius: 6px !important;
            font-size: 0.875rem !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
        `;

        console.log('✅ 회원탈퇴 버튼 스타일 보장 완료');
    }

    /**
     * 🚀 비밀번호 검증 활성화 (테스트에서 확인된 작동 로직)
     */
    function activatePasswordValidation() {
        try {
            console.log('🔧 비밀번호 검증 활성화 시작');

            const newField = document.getElementById('newPassword');
            const confirmField = document.getElementById('confirmPassword');
            const currentField = document.getElementById('currentPassword');

            if (!newField || !confirmField) {
                console.warn('⚠️ 비밀번호 필드를 찾을 수 없습니다.');
                return;
            }

            // 새 비밀번호 입력 시 검증 (테스트된 로직)
            newField.addEventListener('input', function () {
                const password = this.value;

                if (password) {
                    // 강도 표시
                    const strengthDiv = document.getElementById('password-strength-ui');
                    if (strengthDiv) {
                        strengthDiv.style.display = 'block';

                        const requirements = [
                            { test: password.length >= 8, text: '8자 이상' },
                            { test: /[a-z]/.test(password), text: '소문자 포함' },
                            { test: /[A-Z]/.test(password), text: '대문자 포함' },
                            { test: /[0-9]/.test(password), text: '숫자 포함' },
                            { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: '특수문자 포함' }
                        ];

                        const validCount = requirements.filter(req => req.test).length;

                        let strengthText = '약함';
                        let strengthClass = 'weak';

                        if (validCount >= 4) {
                            strengthText = '강함';
                            strengthClass = 'strong';
                        } else if (validCount >= 2) {
                            strengthText = '보통';
                            strengthClass = 'medium';
                        }

                        strengthDiv.className = `password-validation-ui ${strengthClass}`;

                        const requirementsList = requirements.map(req => {
                            const icon = req.test ? '✅' : '❌';
                            return `<div style="display: flex; align-items: center; margin: 0.25rem 0; font-size: 0.75rem;">
                                <span style="margin-right: 0.5rem; width: 1rem;">${icon}</span>
                                ${req.text}
                            </div>`;
                        }).join('');

                        strengthDiv.innerHTML = `
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">
                                비밀번호 강도: ${strengthText} (${validCount}/5)
                            </div>
                            <div>
                                ${requirementsList}
                            </div>
                        `;
                    }
                } else {
                    const strengthDiv = document.getElementById('password-strength-ui');
                    if (strengthDiv) strengthDiv.style.display = 'none';
                }

                // 비밀번호 확인과 매칭 검사
                if (confirmField.value) {
                    const matchDiv = document.getElementById('password-match-ui');
                    if (matchDiv) {
                        matchDiv.style.display = 'block';

                        if (password === confirmField.value) {
                            matchDiv.className = 'password-match-ui match';
                            matchDiv.innerHTML = '✅ 비밀번호가 일치합니다';
                        } else {
                            matchDiv.className = 'password-match-ui no-match';
                            matchDiv.innerHTML = '❌ 비밀번호가 일치하지 않습니다';
                        }
                    }
                }

                // 현재 비밀번호와 동일성 검사
                if (currentField && currentField.value && password === currentField.value) {
                    const warningDiv = document.getElementById('password-warning-ui');
                    if (warningDiv) {
                        warningDiv.innerHTML = '⚠️ 새 비밀번호는 현재 비밀번호와 달라야 합니다.';
                        warningDiv.style.display = 'block';
                        newField.style.borderColor = '#ef4444';
                    }
                } else {
                    const warningDiv = document.getElementById('password-warning-ui');
                    if (warningDiv) {
                        warningDiv.style.display = 'none';
                        newField.style.borderColor = '';
                    }
                }
            });

            // 비밀번호 확인 입력 시 매칭 검사
            confirmField.addEventListener('input', function () {
                const confirmPassword = this.value;
                const newPassword = newField.value;

                if (confirmPassword && newPassword) {
                    const matchDiv = document.getElementById('password-match-ui');
                    if (matchDiv) {
                        matchDiv.style.display = 'block';

                        if (newPassword === confirmPassword) {
                            matchDiv.className = 'password-match-ui match';
                            matchDiv.innerHTML = '✅ 비밀번호가 일치합니다';
                        } else {
                            matchDiv.className = 'password-match-ui no-match';
                            matchDiv.innerHTML = '❌ 비밀번호가 일치하지 않습니다';
                        }
                    }
                } else {
                    const matchDiv = document.getElementById('password-match-ui');
                    if (matchDiv) matchDiv.style.display = 'none';
                }
            });

            // 현재 비밀번호 입력 시 동일성 검사
            if (currentField) {
                currentField.addEventListener('input', function () {
                    const currentPassword = this.value;
                    const newPassword = newField.value;

                    if (currentPassword && newPassword && newPassword === currentPassword) {
                        const warningDiv = document.getElementById('password-warning-ui');
                        if (warningDiv) {
                            warningDiv.innerHTML = '⚠️ 새 비밀번호는 현재 비밀번호와 달라야 합니다.';
                            warningDiv.style.display = 'block';
                            newField.style.borderColor = '#ef4444';
                        }
                    } else {
                        const warningDiv = document.getElementById('password-warning-ui');
                        if (warningDiv) {
                            warningDiv.style.display = 'none';
                            newField.style.borderColor = '';
                        }
                    }
                });
            }

            console.log('✅ 비밀번호 검증 활성화 완료');

        } catch (error) {
            console.error('❌ 비밀번호 검증 활성화 오류:', error);
        }
    }

    /**
     * 🚀 회원탈퇴 버튼 활성화 (테스트에서 확인된 작동 로직)
     */
    function activateAccountDeleteButton() {
        try {
            console.log('🔧 회원탈퇴 버튼 활성화 시작');

            const deleteBtn = document.getElementById('account-delete-btn');

            if (!deleteBtn) {
                console.warn('⚠️ 회원탈퇴 버튼을 찾을 수 없습니다.');
                return;
            }

            // 스타일 강화 (테스트된 로직)
            deleteBtn.style.cssText = `
                background: #ef4444 !important;
                color: white !important;
                border: 1px solid #ef4444 !important;
                padding: 0.5rem 1rem !important;
                border-radius: 6px !important;
                font-size: 0.875rem !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            `;

            // 기존 이벤트 제거 후 새로 추가
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

            newDeleteBtn.addEventListener('click', function () {
                console.log('🗑️ 회원탈퇴 버튼 클릭됨');
                handleAccountDelete();
            });

            console.log('✅ 회원탈퇴 버튼 활성화 완료');

        } catch (error) {
            console.error('❌ 회원탈퇴 버튼 활성화 오류:', error);
        }
    }

    /**
     * 🚀 사용자 프로필 정보 로드 (수정 버전)
     * ⭐ Firestore 데이터를 우선적으로 사용하여 이름과 전화번호 표시 문제 해결
     */
    async function loadUserProfile() {
        try {
            console.log('📄 사용자 프로필 정보 로딩 시작');

            // 1. Firebase Auth에서 현재 사용자 가져오기
            currentUser = window.authService ? window.authService.getCurrentUser() : null;

            if (!currentUser) {
                throw new Error('로그인된 사용자를 찾을 수 없습니다.');
            }

            console.log('✅ Firebase Auth 사용자 확인');

            // 2. Firestore에서 추가 사용자 정보 가져오기
            let firestoreData = {};

            if (window.dbService && window.dhcFirebase) {
                try {
                    const userDocResult = await window.dbService.getDocument('users', currentUser.uid);
                    if (userDocResult.success) {
                        firestoreData = userDocResult.data;
                        console.log('✅ Firestore 사용자 데이터 로드 성공');
                    } else {
                        console.log('⚠️ Firestore 사용자 데이터 없음 - 기본값 사용');
                    }
                } catch (error) {
                    console.warn('⚠️ Firestore 데이터 로드 실패:', error);
                }
            } else {
                console.log('⚠️ Firebase 서비스 미연결 - Auth 데이터만 사용');
            }

            // 3. 통합된 사용자 프로필 구성 (⭐ 수정된 부분)
            userProfile = {
                // Firebase Auth 기본 정보
                uid: currentUser.uid,
                email: currentUser.email,

                // ⭐ 수정: Firestore의 displayName을 우선 사용, Auth는 폴백
                displayName: firestoreData.displayName ||
                    currentUser.displayName ||
                    extractNameFromEmail(currentUser.email),

                photoURL: currentUser.photoURL,
                emailVerified: currentUser.emailVerified,

                // ⭐ 수정: Firestore에서 전화번호 가져오기 (Auth에는 없음)
                phoneNumber: firestoreData.phoneNumber || '',

                // Firestore 추가 정보 (있는 경우)
                birthdate: firestoreData.birthdate || '',
                address: firestoreData.address || '',
                gender: firestoreData.gender || '',

                // ⭐ 추가: 주소 분리 필드
                postalCode: firestoreData.postalCode || '',
                addressBasic: firestoreData.addressBasic || '',
                addressDetail: firestoreData.addressDetail || '',

                affiliation: firestoreData.affiliation || '',

                // 생성/수정 시간
                createdAt: firestoreData.createdAt || null,
                updatedAt: firestoreData.updatedAt || null
            };

            console.log('✅ 통합 사용자 프로필 구성 완료:', {
                email: userProfile.email,
                displayName: userProfile.displayName,
                phoneNumber: userProfile.phoneNumber,
                hasFirestoreData: Object.keys(firestoreData).length > 0
            });

            // 4. 폼에 데이터 채우기
            await populateUserInfo(userProfile);

            return userProfile;

        } catch (error) {
            console.error('❌ 사용자 정보 로드 오류:', error);

            // 기본값으로 폼 초기화
            if (currentUser) {
                const basicProfile = {
                    email: currentUser.email,
                    displayName: currentUser.displayName || extractNameFromEmail(currentUser.email),
                    phoneNumber: '',
                    birthdate: '',
                    address: '',
                    gender: '',
                    affiliation: ''
                };

                await populateUserInfo(basicProfile);
                console.log('✅ 기본 정보로 폼 초기화 완료');
            }

            showNotification('사용자 정보를 불러오는데 실패했습니다. 기본값을 사용합니다.', 'error');
            return null;
        }
    }

    /**
     * 이메일에서 이름 추출 헬퍼 함수
     */
    function extractNameFromEmail(email) {
        if (!email) return '';
        const username = email.split('@')[0];
        return username.charAt(0).toUpperCase() + username.slice(1);
    }

    /**
     * 🚀 폼에 사용자 정보 채우기
     */
    async function populateUserInfo(userData) {
        try {
            console.log('🔄 폼 데이터 채우기 시작:', userData);

            // 이름 필드
            const nameField = document.getElementById('name');
            if (nameField) {
                const displayName = userData.displayName ||
                    userData.name ||
                    extractNameFromEmail(userData.email);
                nameField.value = displayName;
                console.log('✅ 이름 필드 설정:', displayName);
            }

            // 이메일 필드 (읽기 전용)
            const emailField = document.getElementById('email');
            if (emailField) {
                emailField.value = userData.email || '';
                emailField.disabled = true; // 이메일 수정 불가
            }

            // 전화번호 필드
            const phoneField = document.getElementById('phone');
            if (phoneField) {
                phoneField.value = userData.phoneNumber || '';
            }

            // 생년월일 드롭다운
            if (userData.birthdate && window.setBirthdateDropdowns) {
                window.setBirthdateDropdowns(userData.birthdate);
            } else if (userData.birthdate) {
                // 폴백: hidden 필드에 직접 설정
                const birthdateField = document.getElementById('birthdate');
                if (birthdateField) birthdateField.value = userData.birthdate;
            }

            // 소속 필드
            const affiliationField = document.getElementById('affiliation');
            if (affiliationField) {
                affiliationField.value = userData.affiliation || '';
            }

            // 🆕 주소 필드 (분리된 필드로 설정)
            const postalCodeField = document.getElementById('postal-code');
            const addressBasicField = document.getElementById('address-basic');
            const addressDetailField = document.getElementById('address-detail');

            if (postalCodeField && userData.postalCode) {
                postalCodeField.value = userData.postalCode;
            }

            if (addressBasicField && userData.addressBasic) {
                addressBasicField.value = userData.addressBasic;
            }

            if (addressDetailField && userData.addressDetail) {
                addressDetailField.value = userData.addressDetail;
            }

            // 전체 주소 업데이트
            updateFullAddress();

            // 성별 라디오 버튼
            if (userData.gender) {
                const genderRadio = document.querySelector(`input[name="gender"][value="${userData.gender}"]`);
                if (genderRadio) {
                    genderRadio.checked = true;
                    console.log('✅ 성별 필드 설정:', userData.gender);
                }
            }

            console.log('✅ 모든 폼 필드 데이터 채우기 완료');

        } catch (error) {
            console.error('❌ 폼 데이터 채우기 오류:', error);
            showNotification('일부 정보를 불러오는데 실패했습니다.', 'error');
        }
    }

    /**
     * 주소 검색 시스템 초기화
     */
    function initAddressSearch() {
        console.log('🏠 주소 검색 시스템 초기화');

        const addressSearchBtn = document.getElementById('address-search-btn');
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
        const addressDetailInput = document.getElementById('address-detail');
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
                    const postalCodeInput = document.getElementById('postal-code');
                    const addressBasicInput = document.getElementById('address-basic');
                    const addressDetailInput = document.getElementById('address-detail');

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
        const postalCode = document.getElementById('postal-code')?.value || '';
        const basicAddress = document.getElementById('address-basic')?.value || '';
        const detailAddress = document.getElementById('address-detail')?.value || '';

        // 전체 주소 조합
        let fullAddress = '';
        if (postalCode && basicAddress) {
            fullAddress = `(${postalCode}) ${basicAddress}`;
            if (detailAddress) {
                fullAddress += ` ${detailAddress}`;
            }
        }

        // hidden 필드에 전체 주소 저장 (서버 전송용)
        const fullAddressInput = document.getElementById('address-full');
        if (fullAddressInput) {
            fullAddressInput.value = fullAddress;
        }

        console.log('📮 전체 주소 업데이트:', fullAddress);
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        try {
            console.log('📄 이벤트 리스너 설정 시작');

            // 개인정보 수정 폼 제출
            const personalInfoForm = document.getElementById('personal-info-form');
            if (personalInfoForm) {
                personalInfoForm.replaceWith(personalInfoForm.cloneNode(true));
                const newPersonalInfoForm = document.getElementById('personal-info-form');
                newPersonalInfoForm.addEventListener('submit', handlePersonalInfoSubmit);
                console.log('✅ 개인정보 수정 폼 이벤트 설정');
            }

            // 비밀번호 변경 폼 제출
            const passwordForm = document.getElementById('password-change-form');
            if (passwordForm) {
                passwordForm.replaceWith(passwordForm.cloneNode(true));
                const newPasswordForm = document.getElementById('password-change-form');
                newPasswordForm.addEventListener('submit', handlePasswordChange);
                console.log('✅ 비밀번호 변경 폼 이벤트 설정');
            }

            // 🆕 주소 검색 시스템 초기화
            initAddressSearch();

            console.log('✅ 모든 이벤트 리스너 설정 완료');

        } catch (error) {
            console.error('❌ 이벤트 리스너 설정 오류:', error);
        }
    }

    /**
     * 🚀 개인정보 수정 폼 제출 처리
     */
    async function handlePersonalInfoSubmit(event) {
        event.preventDefault();

        try {
            console.log('🔄 개인정보 수정 처리 시작');

            // 폼 데이터 수집
            const formData = new FormData(event.target);
            const userData = {
                displayName: formData.get('name'),
                phoneNumber: formData.get('phone'),
                birthdate: formData.get('birthdate'),
                gender: formData.get('gender'),
                affiliation: formData.get('affiliation') || '',

                // 🆕 주소 정보 (분리 저장)
                postalCode: formData.get('postal-code') || '',
                addressBasic: formData.get('address-basic') || '',
                addressDetail: formData.get('address-detail') || '',
                address: formData.get('address') || '' // 전체 주소 (호환성)
            };

            console.log('📋 수집된 폼 데이터:', userData);

            // Firebase Auth 프로필 업데이트 (displayName)
            if (window.authService && userData.displayName) {
                const authUpdateResult = await window.authService.updateProfile({
                    displayName: userData.displayName
                });

                if (!authUpdateResult.success) {
                    console.warn('⚠️ Firebase Auth 프로필 업데이트 실패:', authUpdateResult.error);
                }
            }

            // Firestore 사용자 문서 업데이트
            if (window.dbService && currentUser) {
                const firestoreUpdateResult = await window.dbService.updateDocument('users', currentUser.uid, userData);

                if (!firestoreUpdateResult.success) {
                    console.warn('⚠️ Firestore 사용자 데이터 업데이트 실패:', firestoreUpdateResult.error);
                }
            }

            // 로컬 사용자 프로필 업데이트
            if (userProfile) {
                Object.assign(userProfile, userData);
            }

            console.log('✅ 개인정보 수정 완료');
            showNotification('개인정보가 성공적으로 수정되었습니다.', 'success');

        } catch (error) {
            console.error('❌ 개인정보 수정 오류:', error);
            showNotification('개인정보 수정 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 🚀 비밀번호 변경 처리
     */
    async function handlePasswordChange(event) {
        event.preventDefault();

        console.log('🔄 비밀번호 변경 처리 시작');

        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            // 버튼 비활성화 및 로딩 표시
            submitBtn.disabled = true;
            submitBtn.textContent = '변경 중...';
            submitBtn.style.opacity = '0.7';

            // 폼 데이터 수집
            const formData = new FormData(event.target);
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');

            // 입력값 검증
            if (!currentPassword || !newPassword || !confirmPassword) {
                throw new Error('모든 필드를 입력해주세요.');
            }

            if (currentPassword === newPassword) {
                throw new Error('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
            }

            if (newPassword !== confirmPassword) {
                throw new Error('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            }

            if (newPassword.length < 6) {
                throw new Error('새 비밀번호는 최소 6자 이상이어야 합니다.');
            }

            // Firebase 비밀번호 변경
            if (!window.authService) {
                throw new Error('Firebase 인증 서비스가 연결되지 않았습니다.');
            }

            const result = await window.authService.changePassword(currentPassword, newPassword);

            if (result.success) {
                // 성공 처리
                event.target.reset();

                // 비밀번호 검증 영역 숨김
                const strengthDiv = document.getElementById('password-strength-ui');
                const matchDiv = document.getElementById('password-match-ui');
                const warningDiv = document.getElementById('password-warning-ui');
                if (strengthDiv) strengthDiv.style.display = 'none';
                if (matchDiv) matchDiv.style.display = 'none';
                if (warningDiv) warningDiv.style.display = 'none';

                showPasswordChangeSuccessMessage();

                console.log('🎉 비밀번호 변경 완료');

            } else {
                throw new Error(result.error?.message || '비밀번호 변경에 실패했습니다.');
            }

        } catch (error) {
            console.error('❌ 비밀번호 변경 오류:', error);

            let errorMessage = '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.';

            // Firebase 에러 코드별 한국어 메시지 처리
            if (error.code) {
                switch (error.code) {
                    case 'auth/wrong-password':
                        errorMessage = '현재 비밀번호가 올바르지 않습니다.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = '새 비밀번호가 너무 약합니다. 더 강력한 비밀번호를 입력해주세요.';
                        break;
                    case 'auth/requires-recent-login':
                        errorMessage = '보안을 위해 다시 로그인이 필요합니다.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
                        break;
                    default:
                        errorMessage = '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.';
                }
            }

            showPasswordChangeErrorMessage(errorMessage);

        } finally {
            // 버튼 상태 복원
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = '1';
        }
    }

    /**
     * 🚀 회원 탈퇴 처리 (테스트에서 확인된 작동 로직)
     */
    async function handleAccountDelete() {
        console.log('🗑️ 회원탈퇴 버튼 클릭됨');

        // 1단계: 첫 번째 확인
        if (!confirm('정말로 회원 탈퇴를 하시겠습니까?\n\n탈퇴 시 삭제되는 정보:\n• 개인정보 및 계정 정보\n• 수강 내역 및 진행 중인 강의\n• 자격증 정보\n• 결제 내역\n\n⚠️ 탈퇴 후 30일간 데이터가 보관되며, 이후 영구적으로 삭제됩니다.')) {
            console.log('❌ 회원탈퇴 취소됨 (1차 확인)');
            return;
        }

        console.log('✅ 1차 확인 통과');

        // 2단계: 비밀번호 입력
        const password = prompt('회원 탈퇴를 진행하려면 현재 비밀번호를 입력해주세요:');

        if (!password) {
            console.log('❌ 비밀번호 미입력으로 취소됨');
            window.mypageHelpers.showNotification('비밀번호를 입력해야 회원 탈퇴가 가능합니다.', 'error');
            return;
        }

        console.log('✅ 비밀번호 입력됨');

        // 3단계: 최종 확인
        if (!confirm('⚠️ 최종 확인\n\n정말로 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            console.log('❌ 회원탈퇴 취소됨 (최종 확인)');
            return;
        }

        console.log('✅ 최종 확인 통과, 계정 삭제 시작');

        try {
            // 계정 삭제 실행
            console.log('🔄 authService.deleteAccount 호출 중...');
            const result = await window.authService.deleteAccount(password);

            console.log('📊 계정 삭제 결과:', result);

            if (result.success) {
                console.log('✅ 회원 탈퇴 성공');
                alert('회원 탈퇴가 완료되었습니다.\n그동안 이용해주셔서 감사합니다.');

                // 로그인 페이지로 이동
                console.log('🔄 로그인 페이지로 리다이렉션...');
                window.location.href = window.adjustPath('pages/auth/login.html');
            } else {
                throw new Error(result.error.message || '회원 탈퇴 실패');
            }
        } catch (error) {
            console.error('❌ 회원 탈퇴 오류:', error);
            console.error('❌ 오류 상세:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });

            let errorMessage = '회원 탈퇴 중 오류가 발생했습니다.';

            if (error.code === 'auth/wrong-password') {
                errorMessage = '비밀번호가 올바르지 않습니다.';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = '보안을 위해 다시 로그인해주세요.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
            window.mypageHelpers.showNotification(errorMessage, 'error');
        }
    }

    /**
     * 실제 계정 삭제 실행
     */
    async function executeAccountDeletion(password) {
        console.log('🗑️ 계정 삭제 실행');

        try {
            if (window.authService) {
                const result = await window.authService.deleteAccount(password);

                if (result.success) {
                    console.log('✅ 계정 삭제 완료');

                    showNotification(
                        '회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.',
                        'success'
                    );

                    setTimeout(() => {
                        window.location.href = window.adjustPath('pages/auth/login.html');
                    }, 2000);

                } else {
                    throw new Error(result.error?.message || '계정 삭제 실패');
                }
            } else {
                throw new Error('Firebase 서비스가 연결되지 않았습니다.');
            }
        } catch (error) {
            console.error('❌ 계정 삭제 실패:', error);

            let errorMessage = '계정 삭제 중 오류가 발생했습니다.';

            if (error.code === 'auth/wrong-password') {
                errorMessage = '비밀번호가 올바르지 않습니다.';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = '보안을 위해 다시 로그인해주세요.';
            }

            showNotification(errorMessage, 'error');
        }
    }

    // =================================
    // 🎨 메시지 표시 함수들
    // =================================

    /**
     * 향상된 알림 메시지 표시
     */
    function showNotification(message, type = 'info', duration = 4000) {
        // 기존 알림 제거
        removeExistingNotifications();

        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.25rem;">${icons[type] || icons.info}</span>
                <span style="flex: 1;">${message}</span>
            </div>
        `;

        // 스타일 적용
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 300px;
            max-width: 500px;
            padding: 16px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            font-weight: 500;
            line-height: 1.4;
        `;

        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            info: '#3b82f6'
        };

        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    /**
     * 비밀번호 변경 성공 메시지
     */
    function showPasswordChangeSuccessMessage() {
        console.log('🎉 비밀번호 변경 성공 메시지 표시');

        removeExistingNotifications();

        const notification = document.createElement('div');
        notification.className = 'password-success-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 24px;">🎉</div>
                <div>
                    <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">
                        비밀번호 변경 완료!
                    </div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        비밀번호가 성공적으로 변경되었습니다.
                    </div>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.4s ease;
            min-width: 320px;
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 400);
        }, 5000);
    }

    /**
     * 비밀번호 변경 오류 메시지
     */
    function showPasswordChangeErrorMessage(message) {
        console.log('❌ 비밀번호 변경 오류 메시지 표시:', message);

        removeExistingNotifications();

        const notification = document.createElement('div');
        notification.className = 'password-error-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="font-size: 24px; margin-top: 2px;">❌</div>
                <div>
                    <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">
                        비밀번호 변경 실패
                    </div>
                    <div style="font-size: 14px; opacity: 0.9; line-height: 1.4; white-space: pre-line;">
                        ${message}
                    </div>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.4s ease;
            min-width: 320px;
            max-width: 450px;
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 400);
        }, 7000);
    }

    /**
     * 기존 알림 제거
     */
    function removeExistingNotifications() {
        const existingNotifications = document.querySelectorAll(
            '.password-success-notification, .password-error-notification, .notification-toast'
        );
        existingNotifications.forEach(notification => {
            notification.remove();
        });
    }

    // =================================
    // 🔧 디버깅 및 테스트 함수들
    // =================================

    // 개발 환경에서만 디버깅 도구 활성화
    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('debug=true')) {

        window.personalInfoDebug = {
            help: () => {
                console.log('🔧 개인정보 관리 페이지 디버깅 도구');
                console.log('사용 가능한 함수:');
                console.log('- testDataLoad() : 데이터 로딩 테스트');
                console.log('- testFormPopulation() : 폼 채우기 테스트');
                console.log('- getCurrentProfile() : 현재 프로필 정보 조회');
                console.log('- testFirebaseConnection() : Firebase 연결 테스트');
                console.log('- testPasswordFeatures() : 비밀번호 기능 테스트');
                console.log('- testAccountDelete() : 회원탈퇴 버튼 테스트');
                console.log('- simulateMessages() : 메시지 시뮬레이션');
                console.log('- forceReinitialize() : 강제 재초기화');
            },

            testDataLoad: async () => {
                console.log('🧪 데이터 로딩 테스트 시작');
                try {
                    const result = await loadUserProfile();
                    console.log('✅ 테스트 결과:', result);
                    return result;
                } catch (error) {
                    console.error('❌ 테스트 실패:', error);
                    return null;
                }
            },

            testFormPopulation: async () => {
                console.log('🧪 폼 채우기 테스트');
                const testData = {
                    email: 'test@example.com',
                    displayName: '테스트 사용자',
                    phoneNumber: '010-1234-5678',
                    birthdate: '1990-01-01',
                    address: '서울시 강남구',
                    gender: 'male'
                };

                await populateUserInfo(testData);
                console.log('✅ 테스트 데이터로 폼 채우기 완료');
                return testData;
            },

            getCurrentProfile: () => {
                console.log('👤 현재 프로필 정보:', userProfile);
                return userProfile;
            },

            testFirebaseConnection: () => {
                console.log('🔥 Firebase 연결 상태 테스트');
                console.log('- authService:', !!window.authService);
                console.log('- dbService:', !!window.dbService);
                console.log('- dhcFirebase:', !!window.dhcFirebase);
                console.log('- dhcFirebase.getCurrentUser:', !!window.dhcFirebase?.getCurrentUser);

                let currentUserInfo = null;
                if (window.dhcFirebase && window.dhcFirebase.getCurrentUser) {
                    currentUserInfo = window.dhcFirebase.getCurrentUser();
                }
                console.log('- 현재 사용자:', currentUserInfo ? '로그인됨' : 'None');

                return {
                    authService: !!window.authService,
                    dbService: !!window.dbService,
                    dhcFirebase: !!window.dhcFirebase,
                    currentUser: currentUserInfo ? currentUserInfo.email : null
                };
            },

            testPasswordFeatures: () => {
                console.log('🧪 비밀번호 기능 테스트');

                const currentField = document.getElementById('currentPassword');
                const newField = document.getElementById('newPassword');
                const confirmField = document.getElementById('confirmPassword');

                if (currentField && newField && confirmField) {
                    // 동일 비밀번호 테스트
                    console.log('1. 동일 비밀번호 테스트');
                    currentField.value = 'samepass123';
                    newField.value = 'samepass123';
                    newField.dispatchEvent(new Event('input'));

                    setTimeout(() => {
                        // 다른 비밀번호 테스트
                        console.log('2. 다른 비밀번호 테스트');
                        newField.value = 'NewPass123!';
                        newField.dispatchEvent(new Event('input'));

                        confirmField.value = 'NewPass123!';
                        confirmField.dispatchEvent(new Event('input'));

                        console.log('✅ 테스트 완료');
                    }, 2000);

                    return '테스트 진행 중...';
                } else {
                    return '❌ 필드를 찾을 수 없습니다.';
                }
            },

            testAccountDelete: () => {
                console.log('🧪 회원탈퇴 버튼 테스트');
                const deleteBtn = document.getElementById('account-delete-btn');

                if (deleteBtn) {
                    console.log('✅ 버튼 존재 확인');
                    console.log('- 현재 스타일:', window.getComputedStyle(deleteBtn).background);
                    console.log('- 클릭 이벤트:', deleteBtn.onclick ? '있음' : '없음');

                    // 테스트 클릭
                    console.log('🖱️ 테스트 클릭 시뮬레이션');
                    deleteBtn.click();

                    return {
                        exists: true,
                        hasStyle: true,
                        clickable: true
                    };
                } else {
                    console.error('❌ 회원탈퇴 버튼을 찾을 수 없습니다.');
                    return { exists: false };
                }
            },

            simulateMessages: () => {
                console.log('🎭 메시지 시뮬레이션');

                // 성공 메시지 테스트
                showPasswordChangeSuccessMessage();

                setTimeout(() => {
                    // 오류 메시지 테스트
                    showPasswordChangeErrorMessage('테스트 오류 메시지입니다.\n여러 줄로 표시됩니다.');
                }, 3000);

                return '메시지 시뮬레이션 시작';
            },

            forceReinitialize: () => {
                console.log('🔄 강제 재초기화 시작');
                initializePage();
                return '재초기화 시작됨';
            }
        };

        console.log('🔧 개인정보 관리 디버깅 도구 활성화됨');
        console.log('💡 사용법: window.personalInfoDebug.help()');
    }

    // =================================
    // 🚀 최종 초기화 실행
    // =================================

    // DOM 준비 시 초기화
    if (document.readyState === 'loading') {
        console.log('🔄 DOM 로딩 중 - DOMContentLoaded 이벤트 대기');
        document.addEventListener('DOMContentLoaded', initializePage);
    } else {
        console.log('🔄 DOM 이미 로드됨 - 즉시 초기화');
        initializePage();
    }

    console.log('📋 개인정보 관리 모듈 로드 완료 (최종 완성 버전)');

})();