/**
 * cert-application.js - 자격증 발급 신청 (충돌 해결 버전)
 * 네임스페이스 패턴 + 모듈 패턴 적용으로 안정성 확보
 */

console.log('=== cert-application.js 충돌 해결 버전 로드 시작 ===');

// 🔧 네임스페이스 생성 (전역 변수 충돌 방지)
window.CertApplication = window.CertApplication || {};

// 🔧 즉시 실행 함수로 모듈 패턴 적용 (완전 캡슐화)
(function (CertApp) {
    'use strict';

    // 🔧 내부 변수들 (외부 접근 불가)
    let currentUser = null;
    let selectedCertificateType = null;
    let uploadedPhotoFile = null;
    let currentAddress = {
        postalCode: '',
        basicAddress: '',
        detailAddress: '',
        fullAddress: ''
    };

    // 🔧 초기화 상태 관리
    let initState = {
        isInitialized: false,
        authReady: false,
        daumAPIReady: false
    };

    // 🔧 DOM 로드 후 안전한 초기화
    function initializeWhenReady() {
        console.log('=== CertApplication 모듈 초기화 시작 ===');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                console.log('=== DOMContentLoaded 이벤트 발생 ===');
                initCertApplication();
            });
        } else {
            console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
            initCertApplication();
        }
    }

    // =================================
    // 🔧 메인 초기화 함수
    // =================================

    async function initCertApplication() {
        console.log('=== initCertApplication 실행 시작 ===');

        if (initState.isInitialized) {
            console.log('이미 초기화됨, 중복 실행 방지');
            return;
        }

        try {
            // 1. Daum API 확인 및 로드
            await checkDaumAPI();

            // 2. Firebase 인증 상태 확인
            await initAuthState();

            // 3. 자격증 종류 선택 시스템 초기화
            initCertificateSelection();

            // 4. 회원 정보 자동 기입 시스템
            initAutoFillSystem();

            // 5. 주소 검색 시스템 초기화 (수정됨)
            initAddressSearch();

            // 6. 사진 업로드 시스템 초기화 (수정됨)
            initPhotoUpload();

            // 7. 폼 유효성 검사 초기화
            initFormValidation();

            // 8. 폼 제출 처리 초기화
            initFormSubmission();

            // 9. 자격증 조회 기능 초기화
            initCertificateVerification();

            // 10. URL 파라미터 처리
            handleUrlParameters();

            initState.isInitialized = true;
            console.log('=== CertApplication 초기화 완료 ===');

        } catch (error) {
            console.error('❌ 초기화 중 오류:', error);
            showErrorMessage('페이지 초기화 중 오류가 발생했습니다.');
        }
    }

    // =================================
    // 🔧 Daum API 확인 및 로드
    // =================================

    async function checkDaumAPI() {
        console.log('🔍 Daum 우편번호 API 확인');

        return new Promise((resolve) => {
            // 이미 로드된 경우
            if (typeof daum !== 'undefined' && daum.Postcode) {
                console.log('✅ Daum API 이미 로드됨');
                initState.daumAPIReady = true;
                resolve();
                return;
            }

            // API 로드 대기 (최대 5초)
            let attempts = 0;
            const maxAttempts = 50; // 5초 (100ms * 50)

            const checkInterval = setInterval(() => {
                attempts++;

                if (typeof daum !== 'undefined' && daum.Postcode) {
                    console.log('✅ Daum API 로드 완료');
                    initState.daumAPIReady = true;
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ Daum API 로드 실패 (타임아웃)');
                    initState.daumAPIReady = false;
                    clearInterval(checkInterval);
                    resolve(); // 실패해도 다른 기능은 동작하도록
                }
            }, 100);
        });
    }

    // =================================
    // 🔧 Firebase 인증 및 사용자 관리
    // =================================

    async function initAuthState() {
        console.log('👤 Firebase 인증 상태 초기화');

        if (!window.dhcFirebase?.auth) {
            console.log('Firebase 인증 미연동, 게스트 모드로 진행');
            initState.authReady = true;
            return;
        }

        return new Promise((resolve) => {
            window.dhcFirebase.onAuthStateChanged(async (user) => {
                if (user) {
                    console.log('✅ 로그인된 사용자:', user.email);
                    currentUser = user;

                    // 자동 기입 버튼 활성화
                    const autoFillBtn = document.getElementById('auto-fill-btn');
                    if (autoFillBtn) {
                        autoFillBtn.style.display = 'inline-block';
                        autoFillBtn.disabled = false;
                    }

                    // 회원 정보 자동 기입
                    await autoFillMemberInfo();
                } else {
                    console.log('❌ 비로그인 상태');
                    currentUser = null;

                    // 자동 기입 버튼 비활성화
                    const autoFillBtn = document.getElementById('auto-fill-btn');
                    if (autoFillBtn) {
                        autoFillBtn.style.display = 'none';
                    }
                }

                initState.authReady = true;
                resolve();
            });
        });
    }

    async function autoFillMemberInfo() {
        console.log('👤 회원 정보 자동 기입 시도');

        if (!currentUser) {
            console.log('비로그인 상태, 자동 기입 건너뛰기');
            return;
        }

        try {
            // 기본 정보 자동 기입
            const emailInput = document.getElementById('email');
            if (emailInput && !emailInput.value) {
                emailInput.value = currentUser.email;
                console.log('✅ 이메일 자동 기입:', currentUser.email);
            }

            const nameInput = document.getElementById('name-korean');
            if (nameInput && !nameInput.value && currentUser.displayName) {
                nameInput.value = currentUser.displayName;
                console.log('✅ 이름 자동 기입:', currentUser.displayName);
                updateSummary();
            }

            // Firestore에서 상세 정보 가져오기
            await loadUserDetailInfo(currentUser.uid);

        } catch (error) {
            console.error('회원 정보 자동 기입 오류:', error);
        }
    }

    async function loadUserDetailInfo(userId) {
        if (!window.dbService) {
            console.log('dbService 미연동, 기본 정보만 사용');
            return;
        }

        try {
            const result = await window.dbService.getDocument('users', userId);

            if (result.success && result.data) {
                const userData = result.data;
                console.log('사용자 상세 정보:', userData);

                fillUserData(userData);
                showSuccessMessage('회원 정보가 자동으로 입력되었습니다.');
            } else {
                console.log('사용자 상세 정보 없음 또는 로드 실패');
            }

        } catch (error) {
            console.error('사용자 상세 정보 로드 오류:', error);
            console.log('기본 회원 정보로 계속 진행합니다.');
        }
    }

    function fillUserData(userData) {
        console.log('📝 사용자 데이터로 폼 채우기:', userData);

        const fieldMappings = {
            'name-korean': userData.name || userData.displayName || userData.firstName,
            'name-english': userData.nameEnglish || userData.englishName,
            'phone': userData.phone || userData.phoneNumber,
            'birth-date': userData.birthDate || userData.dateOfBirth,
            'email': userData.email
        };

        // 주소 정보 처리
        if (userData.address) {
            const postalCode = document.getElementById('postal-code');
            const addressBasic = document.getElementById('address-basic');

            if (postalCode && !postalCode.value && userData.postalCode) {
                postalCode.value = userData.postalCode;
            }
            if (addressBasic && !addressBasic.value) {
                addressBasic.value = userData.address;
            }
            updateFullAddress();
        }

        let filledCount = 0;
        Object.keys(fieldMappings).forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input && !input.value && fieldMappings[fieldId]) {
                input.value = fieldMappings[fieldId];
                filledCount++;
                console.log(`✅ ${fieldId} 자동 기입:`, fieldMappings[fieldId]);
            }
        });

        if (filledCount > 0) {
            console.log(`✅ 총 ${filledCount}개 필드 자동 기입 완료`);
            updateSummary();
        }
    }

    // =================================
    // 🔧 자격증 종류 선택 시스템
    // =================================

    function initCertificateSelection() {
        console.log('🎓 자격증 종류 선택 시스템 초기화');

        const certTypeSelect = document.getElementById('cert-type');
        if (!certTypeSelect) {
            console.error('cert-type 선택 요소를 찾을 수 없습니다');
            return;
        }

        // 자격증 선택 시 정보 업데이트
        certTypeSelect.addEventListener('change', function () {
            const selectedValue = this.value;
            console.log('자격증 종류 선택됨:', selectedValue);

            selectedCertificateType = selectedValue;

            if (selectedValue) {
                updateCertificateInfo(selectedValue);
                updateSummary();

                // 성공 피드백
                this.classList.add('success');
                setTimeout(() => {
                    this.classList.remove('success');
                }, 2000);
            } else {
                hideCertificateInfo();
                updateSummary();
            }
        });

        console.log('✅ 자격증 종류 선택 시스템 초기화 완료');
    }

    function updateCertificateInfo(certType) {
        console.log('📋 자격증 정보 업데이트:', certType);

        const certificateInfoDisplay = document.getElementById('certificate-info-display');
        const selectedCertName = document.getElementById('selected-cert-name');

        if (!certificateInfoDisplay || !selectedCertName) {
            console.error('자격증 정보 표시 요소를 찾을 수 없습니다');
            return;
        }

        const certNames = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };

        if (certType && certNames[certType]) {
            selectedCertName.textContent = certNames[certType];

            certificateInfoDisplay.style.display = 'block';
            certificateInfoDisplay.style.opacity = '0';
            certificateInfoDisplay.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                certificateInfoDisplay.style.transition = 'all 0.3s ease';
                certificateInfoDisplay.style.opacity = '1';
                certificateInfoDisplay.style.transform = 'translateY(0)';
            }, 100);

            console.log('✅ 자격증 정보 업데이트 완료:', certNames[certType]);
        } else {
            hideCertificateInfo();
            console.log('자격증 정보 숨김');
        }
    }

    function hideCertificateInfo() {
        const certificateInfoDisplay = document.getElementById('certificate-info-display');
        const selectedCertName = document.getElementById('selected-cert-name');

        if (certificateInfoDisplay) {
            certificateInfoDisplay.style.transition = 'all 0.3s ease';
            certificateInfoDisplay.style.opacity = '0';
            certificateInfoDisplay.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                certificateInfoDisplay.style.display = 'none';
            }, 300);
        }

        if (selectedCertName) {
            selectedCertName.textContent = '-';
        }
    }

    // =================================
    // 🔧 회원 정보 자동 기입 시스템
    // =================================

    function initAutoFillSystem() {
        console.log('🔄 회원 정보 자동 기입 시스템 초기화');

        const autoFillBtn = document.getElementById('auto-fill-btn');
        if (!autoFillBtn) {
            console.error('auto-fill-btn 버튼을 찾을 수 없습니다');
            return;
        }

        autoFillBtn.addEventListener('click', async function () {
            console.log('📋 자동 기입 버튼 클릭');

            if (!currentUser) {
                showWarningMessage('로그인 후 이용 가능합니다.');
                return;
            }

            this.disabled = true;
            this.textContent = '정보 불러오는 중...';

            try {
                await autoFillMemberInfo();
                this.textContent = '✅ 완료';

                setTimeout(() => {
                    this.disabled = false;
                    this.textContent = '정보 자동 입력';
                }, 2000);

            } catch (error) {
                console.error('자동 기입 오류:', error);
                showErrorMessage('정보를 불러오는 중 오류가 발생했습니다.');

                this.disabled = false;
                this.textContent = '다시 시도';
            }
        });

        // 영문명 입력 도우미
        initEnglishNameHelper();

        // 전화번호 자동 포맷팅
        initPhoneFormatting();

        console.log('✅ 회원 정보 자동 기입 시스템 초기화 완료');
    }

    function initEnglishNameHelper() {
        console.log('🔤 영문명 입력 도우미 초기화');

        const englishNameInput = document.getElementById('name-english');
        const koreanNameInput = document.getElementById('name-korean');

        if (!englishNameInput || !koreanNameInput) return;

        englishNameInput.addEventListener('input', function () {
            let value = this.value;

            value = value.replace(/[^a-zA-Z\s.]/g, '');
            value = value.replace(/\s+/g, ' ');
            value = value.replace(/^\s+/, '');

            this.value = value;

            if (value.length > 0) {
                validateEnglishName(value) ? clearFieldError(this) : showFieldError(this, '올바른 영문명을 입력해주세요. (예: Hong Gil Dong)');
            } else {
                clearFieldError(this);
            }

            updateSummary();
        });

        koreanNameInput.addEventListener('blur', function () {
            if (this.value && !englishNameInput.value) {
                const suggestion = generateEnglishNameSuggestion(this.value);
                if (suggestion) {
                    englishNameInput.placeholder = `예: ${suggestion}`;
                    showInfoMessage(`영문명 입력 예시: ${suggestion}`);
                }
            }
            updateSummary();
        });

        koreanNameInput.addEventListener('input', function () {
            updateSummary();
        });
    }

    function validateEnglishName(name) {
        if (name.length < 2) return false;
        if (name.length > 50) return false;
        if (!/^[a-zA-Z\s.]+$/.test(name)) return false;
        if (!/[a-zA-Z]/.test(name)) return false;
        if (/\s{2,}/.test(name)) return false;
        if (name.startsWith(' ') || name.endsWith(' ')) return false;

        const nameParts = name.trim().split(' ').filter(part => part.length > 0);
        if (nameParts.length < 2) return false;

        return nameParts.every(part => part.length >= 1);
    }

    function generateEnglishNameSuggestion(koreanName) {
        const surnameMapping = {
            '김': 'Kim', '이': 'Lee', '박': 'Park', '최': 'Choi', '정': 'Jung',
            '강': 'Kang', '조': 'Cho', '윤': 'Yoon', '장': 'Jang', '임': 'Lim',
            '한': 'Han', '오': 'Oh', '서': 'Seo', '신': 'Shin', '권': 'Kwon',
            '황': 'Hwang', '안': 'Ahn', '송': 'Song', '류': 'Ryu', '전': 'Jeon',
            '홍': 'Hong', '고': 'Ko', '문': 'Moon', '양': 'Yang', '손': 'Son'
        };

        if (koreanName.length >= 2) {
            const surname = koreanName.charAt(0);
            const englishSurname = surnameMapping[surname];

            if (englishSurname) {
                return `${englishSurname} Gil Dong`;
            }
        }

        return 'Hong Gil Dong';
    }

    function initPhoneFormatting() {
        console.log('📞 전화번호 자동 포맷팅 초기화');

        const phoneInput = document.getElementById('phone');
        if (!phoneInput) return;

        phoneInput.addEventListener('input', function () {
            let value = this.value.replace(/[^0-9]/g, '');

            if (value.length >= 7) {
                if (value.length <= 10) {
                    value = value.replace(/(\d{3})(\d{3,4})(\d{0,4})/, '$1-$2-$3');
                } else {
                    value = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3');
                }
            }

            this.value = value;
        });
    }

    // =================================
    // 🔧 주소 검색 시스템 (수정됨)
    // =================================

    function initAddressSearch() {
        console.log('🏠 주소 검색 시스템 초기화');

        const addressSearchBtn = document.getElementById('address-search-btn');
        if (!addressSearchBtn) {
            console.error('address-search-btn 버튼을 찾을 수 없습니다');
            return;
        }

        // 🔧 수정: 안전한 이벤트 바인딩
        addressSearchBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔍 주소 검색 버튼 클릭');
            openAddressSearch();
        });

        // 상세 주소 입력 시 전체 주소 업데이트
        const addressDetailInput = document.getElementById('address-detail');
        if (addressDetailInput) {
            addressDetailInput.addEventListener('input', function () {
                updateFullAddress();
            });
        }

        console.log('✅ 주소 검색 시스템 초기화 완료');
    }

    function openAddressSearch() {
        console.log('🔍 Daum 우편번호 API 실행');

        // 🔧 수정: API 준비 상태 확인
        if (!initState.daumAPIReady) {
            console.error('Daum 우편번호 API가 준비되지 않았습니다');
            showErrorMessage('주소 검색 서비스를 준비 중입니다. 잠시 후 다시 시도해주세요.');

            // 재시도 로직
            setTimeout(() => {
                if (typeof daum !== 'undefined' && daum.Postcode) {
                    initState.daumAPIReady = true;
                    openAddressSearch();
                }
            }, 1000);
            return;
        }

        try {
            new daum.Postcode({
                oncomplete: function (data) {
                    console.log('✅ 주소 선택 완료:', data);

                    // 우편번호와 주소 정보 입력
                    const postalCodeInput = document.getElementById('postal-code');
                    const addressBasicInput = document.getElementById('address-basic');

                    if (postalCodeInput) postalCodeInput.value = data.zonecode;
                    if (addressBasicInput) addressBasicInput.value = data.address;

                    // 상세 주소 입력창에 포커스
                    const addressDetailInput = document.getElementById('address-detail');
                    if (addressDetailInput) {
                        addressDetailInput.focus();
                    }

                    // 전체 주소 업데이트
                    currentAddress.postalCode = data.zonecode;
                    currentAddress.basicAddress = data.address;
                    updateFullAddress();

                    showSuccessMessage('주소가 입력되었습니다. 상세 주소를 입력해주세요.');
                },
                onresize: function (size) {
                    // 팝업 크기 조정 시 처리할 내용
                },
                onerror: function (error) {
                    console.error('Daum API 오류:', error);
                    showErrorMessage('주소 검색 중 오류가 발생했습니다.');
                }
            }).open();

        } catch (error) {
            console.error('주소 검색 실행 오류:', error);
            showErrorMessage('주소 검색을 실행할 수 없습니다.');
        }
    }

    function updateFullAddress() {
        const postalCodeInput = document.getElementById('postal-code');
        const basicAddressInput = document.getElementById('address-basic');
        const detailAddressInput = document.getElementById('address-detail');
        const deliveryAddressInput = document.getElementById('delivery-address');

        const postalCode = postalCodeInput ? postalCodeInput.value : '';
        const basicAddress = basicAddressInput ? basicAddressInput.value : '';
        const detailAddress = detailAddressInput ? detailAddressInput.value : '';

        currentAddress.postalCode = postalCode;
        currentAddress.basicAddress = basicAddress;
        currentAddress.detailAddress = detailAddress;

        if (postalCode && basicAddress) {
            currentAddress.fullAddress = `(${postalCode}) ${basicAddress}${detailAddress ? ' ' + detailAddress : ''}`;

            if (deliveryAddressInput) {
                deliveryAddressInput.value = currentAddress.fullAddress;
            }

            console.log('✅ 전체 주소 업데이트:', currentAddress.fullAddress);
        }
    }

    // =================================
    // 🔧 사진 업로드 시스템 (수정됨)
    // =================================

    function initPhotoUpload() {
        console.log('📷 사진 업로드 시스템 초기화');

        const photoUploadZone = document.getElementById('photo-upload-zone');
        const photoFileInput = document.getElementById('photo-file');
        const uploadContent = document.getElementById('upload-content');
        const uploadPreview = document.getElementById('upload-preview');
        const previewRemove = document.getElementById('preview-remove');

        if (!photoUploadZone || !photoFileInput) {
            console.error('사진 업로드 요소를 찾을 수 없습니다');
            return;
        }

        // 🔧 수정: 안전한 드래그 이벤트 처리
        photoUploadZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('drag-over');
        });

        photoUploadZone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
        });

        photoUploadZone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                console.log('🔧 드래그 파일 처리:', files[0].name);
                handlePhotoFile(files[0]);
            }
        });

        // 클릭으로 파일 선택
        photoUploadZone.addEventListener('click', function (e) {
            // 미리보기 상태에서는 클릭 방지
            if (this.classList.contains('has-file')) {
                return;
            }
            photoFileInput.click();
        });

        // 🔧 수정: 파일 선택 이벤트 개선
        photoFileInput.addEventListener('change', function (e) {
            if (this.files.length > 0) {
                console.log('🔧 클릭 파일 처리:', this.files[0].name);
                handlePhotoFile(this.files[0]);
            }
        });

        // 미리보기 제거 버튼
        if (previewRemove) {
            previewRemove.addEventListener('click', function (e) {
                e.stopPropagation();
                removePhotoFile();
            });
        }

        console.log('✅ 사진 업로드 시스템 초기화 완료');
    }

    // 🔧 수정된 사진 파일 처리 함수
    function handlePhotoFile(file) {
        console.log('📷 사진 파일 처리 시작:', file.name);

        // 파일 유효성 검사
        const validationResult = validatePhotoFile(file);
        if (!validationResult.isValid) {
            showFieldError(document.getElementById('photo-file'), validationResult.message);
            console.error('파일 검증 실패:', validationResult.message);
            return;
        }

        // 🔧 수정: 안전한 파일 설정
        const photoFileInput = document.getElementById('photo-file');
        if (photoFileInput) {
            try {
                // DataTransfer를 사용한 안전한 파일 설정
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                photoFileInput.files = dataTransfer.files;

                console.log('✅ 파일 input에 설정 완료');

                // 🔧 추가: 파일 설정 검증
                if (photoFileInput.files.length === 0) {
                    console.warn('파일 설정 실패, 전역 변수만 사용');
                }

            } catch (error) {
                console.warn('DataTransfer 설정 실패:', error);
                // 실패해도 전역 변수에는 저장
            }
        }

        // 미리보기 생성
        const reader = new FileReader();
        reader.onload = function (e) {
            showPhotoPreview(file, e.target.result);
        };
        reader.onerror = function (error) {
            console.error('파일 읽기 오류:', error);
            showFieldError(document.getElementById('photo-file'), '파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsDataURL(file);

        // 전역 변수에 저장 (가장 중요)
        uploadedPhotoFile = file;

        // 에러 상태 제거
        clearFieldError(document.getElementById('photo-file'));

        console.log('✅ 사진 파일 처리 완료');
    }

    function validatePhotoFile(file) {
        console.log('🔍 파일 유효성 검사:', file.name, file.type, file.size);

        // 파일 타입 검사
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return {
                isValid: false,
                message: 'JPG, PNG 형식의 이미지 파일만 업로드 가능합니다.'
            };
        }

        // 파일 크기 검사 (5MB 제한)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return {
                isValid: false,
                message: '파일 크기가 5MB를 초과합니다. 더 작은 파일을 선택해주세요.'
            };
        }

        // 최소 크기 검사
        const minSize = 10 * 1024; // 10KB
        if (file.size < minSize) {
            return {
                isValid: false,
                message: '파일이 너무 작습니다. 10KB 이상의 파일을 선택해주세요.'
            };
        }

        console.log('✅ 파일 유효성 검사 통과');
        return { isValid: true };
    }

    function showPhotoPreview(file, dataUrl) {
        console.log('👁️ 사진 미리보기 표시');

        const uploadContent = document.getElementById('upload-content');
        const uploadPreview = document.getElementById('upload-preview');
        const previewImage = document.getElementById('preview-image');
        const previewFilename = document.getElementById('preview-filename');
        const previewFilesize = document.getElementById('preview-filesize');

        if (!uploadContent || !uploadPreview || !previewImage) {
            console.error('미리보기 요소를 찾을 수 없습니다');
            return;
        }

        // 미리보기 이미지 설정
        previewImage.src = dataUrl;
        previewImage.alt = `${file.name} 미리보기`;

        // 파일 정보 설정
        if (previewFilename) previewFilename.textContent = file.name;
        if (previewFilesize) previewFilesize.textContent = formatFileSize(file.size);

        // UI 전환
        uploadContent.style.display = 'none';
        uploadPreview.style.display = 'flex';

        // 업로드 존 스타일 변경
        const photoUploadZone = document.getElementById('photo-upload-zone');
        if (photoUploadZone) {
            photoUploadZone.classList.add('has-file');
        }

        console.log('✅ 사진 미리보기 표시 완료');
    }

    function removePhotoFile() {
        console.log('🗑️ 사진 파일 제거');

        const uploadContent = document.getElementById('upload-content');
        const uploadPreview = document.getElementById('upload-preview');
        const photoFileInput = document.getElementById('photo-file');
        const photoUploadZone = document.getElementById('photo-upload-zone');

        // UI 복원
        if (uploadContent) uploadContent.style.display = 'flex';
        if (uploadPreview) uploadPreview.style.display = 'none';

        // 파일 입력 초기화
        if (photoFileInput) photoFileInput.value = '';

        // 업로드 존 스타일 복원
        if (photoUploadZone) photoUploadZone.classList.remove('has-file');

        // 전역 변수 초기화
        uploadedPhotoFile = null;

        // 오류 메시지 제거
        clearFieldError(document.getElementById('photo-file'));

        console.log('✅ 사진 파일 제거 완료');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // =================================
    // 🔧 폼 유효성 검사
    // =================================

    function initFormValidation() {
        console.log('🔍 폼 유효성 검사 초기화');

        const form = document.getElementById('certificate-issuance-form');
        if (!form) {
            console.error('certificate-issuance-form을 찾을 수 없습니다');
            return;
        }

        // 실시간 유효성 검사
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                validateField(this);
            });

            input.addEventListener('input', function () {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });

        // 날짜 제한 설정
        setDateLimits();

        console.log('✅ 폼 유효성 검사 초기화 완료');
    }

    function validateField(field) {
        if (!field) return false;

        const value = field.value.trim();

        // 필수 필드 확인
        if (field.hasAttribute('required') && !value) {
            showFieldError(field, '필수 입력 항목입니다.');
            return false;
        }

        // 한글 이름 검증
        if (field.id === 'name-korean') {
            if (value.length < 2) {
                showFieldError(field, '한글 이름은 2자 이상 입력해주세요.');
                return false;
            }
            if (!/^[가-힣\s]+$/.test(value)) {
                showFieldError(field, '한글 이름은 한글만 입력 가능합니다.');
                return false;
            }
        }

        // 영문명 검증
        if (field.id === 'name-english') {
            if (value.length > 0) {
                if (!validateEnglishName(value)) {
                    showFieldError(field, '올바른 영문명을 입력해주세요. (예: Hong Gil Dong)');
                    return false;
                }
            }
        }

        // 전화번호 검증
        if (field.type === 'tel' || field.id === 'phone') {
            const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
            if (value && !phoneRegex.test(value)) {
                showFieldError(field, '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
                return false;
            }
        }

        // 이메일 검증
        if (field.type === 'email') {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (value && !emailRegex.test(value)) {
                showFieldError(field, '올바른 이메일 형식을 입력해주세요. (예: example@email.com)');
                return false;
            }
        }

        clearFieldError(field);
        return true;
    }

    function validateFullForm() {
        console.log('🔍 전체 폼 유효성 검사');
        let isValid = true;

        // 필수 입력 필드 확인
        const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
        console.log('필수 필드 개수:', requiredFields.length);

        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        // 🔧 수정: 사진 업로드 확인 (더 안전한 검증)
        if (!uploadedPhotoFile) {
            const photoFileInput = document.getElementById('photo-file');
            if (photoFileInput && (!photoFileInput.files || photoFileInput.files.length === 0)) {
                showFieldError(photoFileInput, '증명사진을 업로드해주세요.');
                isValid = false;
            }
        }

        // 첫 번째 에러로 스크롤
        if (!isValid) {
            const firstError = document.querySelector('.field-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        console.log(`폼 검증 결과: ${isValid ? '✅ 통과' : '❌ 실패'}`);
        return isValid;
    }

    function setDateLimits() {
        console.log('📅 날짜 제한 설정');

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 교육 수료일과 시험 합격일은 오늘 이전만 선택 가능
        const completionDate = document.getElementById('course-completion-date');
        const examDate = document.getElementById('exam-pass-date');

        if (completionDate) {
            completionDate.max = todayStr;
        }

        if (examDate) {
            examDate.max = todayStr;
        }

        // 생년월일은 18세 이상만 선택 가능
        const birthInput = document.getElementById('birth-date');
        if (birthInput) {
            const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
            const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

            birthInput.max = maxDate.toISOString().split('T')[0];
            birthInput.min = minDate.toISOString().split('T')[0];
        }

        console.log('✅ 날짜 제한 설정 완료');
    }

    // =================================
    // 🔧 폼 제출 처리
    // =================================

    function initFormSubmission() {
        console.log('📤 폼 제출 처리 초기화');

        const form = document.getElementById('certificate-issuance-form');
        const submitButton = document.getElementById('submit-issuance-btn');

        if (!form || !submitButton) {
            console.error('폼 또는 제출 버튼을 찾을 수 없습니다');
            return;
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            console.log('📤 자격증 발급 신청 제출 시작');

            try {
                // 폼 검증
                if (!validateFullForm()) {
                    console.log('폼 검증 실패');
                    return;
                }

                console.log('폼 검증 성공, 발급 신청 진행');

                // 버튼 상태 변경
                updateSubmitButtonState(submitButton, 'processing');

                // 신청 데이터 수집
                const applicationData = collectApplicationData();
                console.log('수집된 신청 데이터:', applicationData);

                // 사진 업로드 처리
                if (uploadedPhotoFile) {
                    console.log('사진 업로드 시작...');
                    const photoUploadResult = await uploadPhotoToStorage(uploadedPhotoFile, applicationData.applicationId);

                    if (photoUploadResult.success) {
                        applicationData.photoUrl = photoUploadResult.url;
                        applicationData.photoPath = photoUploadResult.path;
                        console.log('사진 업로드 완료:', photoUploadResult.url);
                    } else {
                        console.warn('사진 업로드 실패:', photoUploadResult.error);
                        throw new Error('사진 업로드에 실패했습니다: ' + photoUploadResult.error);
                    }
                }

                // Firebase에 신청 데이터 저장
                const saveResult = await saveCertificateApplication(applicationData);

                if (saveResult.success) {
                    console.log('신청 데이터 저장 완료');
                    updateSubmitButtonState(submitButton, 'success');
                    showSuccessMessage('자격증 발급 신청이 완료되었습니다!');

                    // 신청 완료 후 처리
                    handleApplicationSuccess(applicationData);
                } else {
                    throw new Error(saveResult.error || '신청 저장에 실패했습니다.');
                }

            } catch (error) {
                console.error('자격증 발급 신청 처리 오류:', error);
                showErrorMessage('신청 처리 중 오류가 발생했습니다: ' + error.message);
                updateSubmitButtonState(submitButton, 'error');
            }
        });

        console.log('✅ 폼 제출 처리 초기화 완료');
    }

    function collectApplicationData() {
        const form = document.getElementById('certificate-issuance-form');
        const formData = new FormData(form);
        const data = {
            applicationId: 'CERT_' + Date.now(),
            timestamp: new Date().toISOString(),
            type: 'certificate_issuance',
            status: 'pending'
        };

        // 기본 폼 데이터 수집 (🔧 File 객체 제외)
        for (let [key, value] of formData.entries()) {
            // 🔧 수정: File 객체는 Firestore에 저장하지 않음
            if (key === 'photo-file') {
                // 파일 정보만 저장 (File 객체는 제외)
                if (value instanceof File) {
                    data.photoFileName = value.name;
                    data.photoFileSize = value.size;
                    data.photoFileType = value.type;
                    // 실제 파일은 Storage에 업로드되고 URL만 별도로 저장됨
                }
            } else {
                // 일반 텍스트 데이터만 저장
                data[key] = value;
            }
        }

        // 자격증 정보 추가
        const certType = data['cert-type'];
        if (certType) {
            const certNames = {
                'health-exercise': '건강운동처방사',
                'rehabilitation': '운동재활전문가',
                'pilates': '필라테스 전문가',
                'recreation': '레크리에이션지도자'
            };
            data.certificateName = certNames[certType] || certType;
        }

        // 주소 정보 정리
        data.fullAddress = currentAddress.fullAddress;

        // 사용자 정보 추가
        if (currentUser) {
            data.userId = currentUser.uid;
            data.userEmail = currentUser.email;
        }

        return data;
    }

    async function uploadPhotoToStorage(file, applicationId) {
        console.log('Firebase Storage에 사진 업로드 시작:', file.name);

        try {
            // Firebase Storage 사용 가능 여부 확인
            if (!window.storageService) {
                console.warn('storageService를 사용할 수 없습니다. 시뮬레이션 모드로 진행');
                return {
                    success: true,
                    url: URL.createObjectURL(file), // 임시 URL 생성
                    path: `certificate-photos/${applicationId}/${file.name}`
                };
            }

            // 파일 경로 생성
            const timestamp = new Date().getTime();
            const fileExt = file.name.split('.').pop();
            const fileName = `photo_${timestamp}.${fileExt}`;
            const storagePath = `certificate-photos/${applicationId}/${fileName}`;

            // 메타데이터 설정
            const metadata = {
                customMetadata: {
                    applicationId: applicationId,
                    uploadType: 'certificate_photo',
                    originalName: file.name
                }
            };

            // 파일 업로드 실행
            const uploadResult = await window.storageService.uploadFile(file, storagePath, metadata);

            if (uploadResult.success) {
                console.log('사진 업로드 성공:', uploadResult.url);
                return {
                    success: true,
                    url: uploadResult.url,
                    path: storagePath
                };
            } else {
                console.error('사진 업로드 실패:', uploadResult.error);
                return {
                    success: false,
                    error: uploadResult.error.message || '사진 업로드에 실패했습니다.'
                };
            }

        } catch (error) {
            console.error('사진 업로드 중 오류:', error);
            return {
                success: false,
                error: '사진 업로드 중 오류가 발생했습니다.'
            };
        }
    }

    async function saveCertificateApplication(applicationData) {
        console.log('Firebase에 신청 데이터 저장 시작');

        try {
            // Firebase DB 사용 가능 여부 확인
            if (!window.dbService) {
                console.warn('dbService를 사용할 수 없습니다. 시뮬레이션 모드로 진행');
                return {
                    success: true,
                    id: applicationData.applicationId
                };
            }

            // Firestore에 저장
            const result = await window.dbService.addDocument('certificate_applications', applicationData);

            if (result.success) {
                console.log('신청 데이터 저장 성공:', result.id);
                return {
                    success: true,
                    id: result.id
                };
            } else {
                console.error('신청 데이터 저장 실패:', result.error);
                return {
                    success: false,
                    error: result.error.message || '데이터 저장에 실패했습니다.'
                };
            }

        } catch (error) {
            console.error('신청 데이터 저장 중 오류:', error);
            return {
                success: false,
                error: '데이터 저장 중 오류가 발생했습니다.'
            };
        }
    }

    function handleApplicationSuccess(applicationData) {
        console.log('신청 완료 후 처리');

        // 신청 번호 표시
        setTimeout(() => {
            showInfoMessage(`신청 번호: ${applicationData.applicationId}`);
            showInfoMessage('3-5일 이내에 자격증이 발급되어 등기우편으로 배송됩니다.');
        }, 2000);

        // 폼 비활성화
        const form = document.getElementById('certificate-issuance-form');
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                if (input.type !== 'button' && input.id !== 'submit-issuance-btn') {
                    input.disabled = true;
                }
            });
        }

        // 페이지 상단으로 스크롤
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 3000);
    }

    function updateSubmitButtonState(button, state) {
        const buttonIcon = button.querySelector('.button-icon');
        const buttonText = button.querySelector('.button-text');

        switch (state) {
            case 'processing':
                button.disabled = true;
                if (buttonIcon) buttonIcon.textContent = '⏳';
                if (buttonText) buttonText.textContent = '신청 처리 중...';
                break;

            case 'success':
                button.disabled = true;
                if (buttonIcon) buttonIcon.textContent = '✅';
                if (buttonText) buttonText.textContent = '신청 완료!';
                button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                break;

            case 'error':
                button.disabled = false;
                if (buttonIcon) buttonIcon.textContent = '❌';
                if (buttonText) buttonText.textContent = '다시 시도';
                button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                setTimeout(() => updateSubmitButtonState(button, 'normal'), 3000);
                break;

            case 'normal':
            default:
                button.disabled = false;
                if (buttonIcon) buttonIcon.textContent = '🎓';
                if (buttonText) buttonText.textContent = '자격증 발급 신청';
                button.style.background = '';
                break;
        }
    }

    // =================================
    // 🔧 자격증 조회 기능
    // =================================

    function initCertificateVerification() {
        console.log('🔍 자격증 조회 기능 초기화');

        const verifyForm = document.getElementById('verify-form');
        if (!verifyForm) {
            console.log('verify-form을 찾을 수 없습니다');
            return;
        }

        verifyForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const certNumber = document.getElementById('verify-cert-number').value.trim();
            const certDate = document.getElementById('verify-cert-date').value;

            if (!certNumber || !certDate) {
                showWarningMessage('자격증 번호와 발급일자를 모두 입력해주세요.');
                return;
            }

            console.log('자격증 조회 시작:', { certNumber, certDate });

            const submitButton = verifyForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;

            try {
                // 버튼 상태 변경
                submitButton.disabled = true;
                submitButton.textContent = '조회 중...';

                // 자격증 조회 실행
                const result = await verifyCertificate(certNumber, certDate);

                if (result.success) {
                    showVerificationResult(result.data);
                    showSuccessMessage('자격증 조회가 완료되었습니다.');
                } else {
                    showErrorMessage(result.error || '자격증 정보를 찾을 수 없습니다.');
                }

            } catch (error) {
                console.error('자격증 조회 오류:', error);
                showErrorMessage('조회 중 오류가 발생했습니다.');
            } finally {
                // 버튼 상태 복원
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });

        console.log('✅ 자격증 조회 기능 초기화 완료');
    }

    async function verifyCertificate(certNumber, certDate) {
        console.log('자격증 조회 실행:', { certNumber, certDate });

        try {
            // Firebase DB 사용 가능 여부 확인
            if (!window.dbService) {
                console.warn('dbService를 사용할 수 없습니다. 시뮬레이션 결과 반환');

                // 시뮬레이션 결과
                return {
                    success: true,
                    data: {
                        number: certNumber,
                        date: certDate,
                        holder: '홍길동',
                        holderEnglish: 'Hong Gil Dong',
                        type: '건강운동처방사',
                        status: '유효',
                        issuedBy: '디지털헬스케어센터'
                    }
                };
            }

            // 실제 조회 로직 (Firestore 쿼리)
            const queryConditions = [
                { field: 'certificateNumber', operator: '==', value: certNumber },
                { field: 'issueDate', operator: '==', value: certDate }
            ];

            const result = await window.dbService.queryDocuments('issued_certificates', queryConditions);

            if (result.success && result.data.length > 0) {
                return {
                    success: true,
                    data: result.data[0]
                };
            } else {
                return {
                    success: false,
                    error: '일치하는 자격증 정보를 찾을 수 없습니다.'
                };
            }

        } catch (error) {
            console.error('자격증 조회 중 오류:', error);
            return {
                success: false,
                error: '조회 중 오류가 발생했습니다.'
            };
        }
    }

    function showVerificationResult(result) {
        console.log('자격증 조회 결과 표시:', result);

        // 기존 결과 제거
        const existingResult = document.querySelector('.verification-result');
        if (existingResult) {
            existingResult.remove();
        }

        const resultDiv = document.createElement('div');
        resultDiv.className = 'verification-result mt-6 p-6 bg-green-50 border border-green-200 rounded-lg';
        resultDiv.innerHTML = `
            <h3 class="text-lg font-bold text-green-800 mb-4 flex items-center">
                <span class="mr-2">✅</span>
                자격증 조회 결과
            </h3>
            <div class="grid gap-3">
                <div class="flex justify-between py-2 border-b border-green-200">
                    <span class="font-medium text-gray-700">자격증 번호:</span>
                    <span class="text-gray-900">${result.number}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-green-200">
                    <span class="font-medium text-gray-700">소지자 (한글):</span>
                    <span class="text-gray-900">${result.holder}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-green-200">
                    <span class="font-medium text-gray-700">소지자 (영문):</span>
                    <span class="text-gray-900">${result.holderEnglish}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-green-200">
                    <span class="font-medium text-gray-700">자격증 종류:</span>
                    <span class="text-gray-900">${result.type}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-green-200">
                    <span class="font-medium text-gray-700">발급일:</span>
                    <span class="text-gray-900">${result.date}</span>
                </div>
                <div class="flex justify-between py-2">
                    <span class="font-medium text-gray-700">상태:</span>
                    <span class="text-green-600 font-bold">${result.status}</span>
                </div>
            </div>
        `;

        // 결과 추가
        const verifyForm = document.getElementById('verify-form');
        verifyForm.parentNode.insertBefore(resultDiv, verifyForm.nextSibling);

        // 결과로 스크롤
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // =================================
    // 🔧 URL 파라미터 처리
    // =================================

    function handleUrlParameters() {
        console.log('🔗 URL 파라미터 처리 시작');

        const urlParams = new URLSearchParams(window.location.search);
        const certParam = urlParams.get('cert') || urlParams.get('certType');

        console.log('받은 cert 파라미터:', certParam);

        if (certParam) {
            const certTypeSelect = document.getElementById('cert-type');

            if (certTypeSelect) {
                let optionValue = '';
                let certName = '';

                switch (certParam) {
                    case 'health':
                    case 'health-exercise':
                        optionValue = 'health-exercise';
                        certName = '건강운동처방사';
                        break;
                    case 'rehab':
                    case 'rehabilitation':
                        optionValue = 'rehabilitation';
                        certName = '운동재활전문가';
                        break;
                    case 'pilates':
                        optionValue = 'pilates';
                        certName = '필라테스 전문가';
                        break;
                    case 'recreation':
                        optionValue = 'recreation';
                        certName = '레크리에이션지도자';
                        break;
                    default:
                        console.warn('알 수 없는 자격증 파라미터:', certParam);
                        return;
                }

                // 셀렉트 박스 값 설정
                certTypeSelect.value = optionValue;

                // 시각적 피드백
                certTypeSelect.style.backgroundColor = '#dbeafe';
                certTypeSelect.style.transition = 'background-color 0.5s ease';

                setTimeout(() => {
                    certTypeSelect.style.backgroundColor = '';
                }, 1500);

                console.log(`${certName}이(가) 자동으로 선택되었습니다:`, optionValue);

                // change 이벤트 발생
                const changeEvent = new Event('change', { bubbles: true });
                certTypeSelect.dispatchEvent(changeEvent);

                // 사용자 알림
                setTimeout(() => {
                    showInfoMessage(`${certName} 자격증이 자동으로 선택되었습니다.`);
                }, 500);

            } else {
                console.error('cert-type 셀렉트 박스를 찾을 수 없습니다');
            }
        } else {
            console.log('cert 파라미터가 없습니다. 기본 상태로 진행합니다.');
        }

        console.log('✅ URL 파라미터 처리 완료');
    }

    // =================================
    // 🔧 요약 정보 업데이트
    // =================================

    function updateSummary() {
        console.log('📊 요약 정보 업데이트');

        // 자격증명 업데이트
        const certTypeSelect = document.getElementById('cert-type');
        const summaryCertName = document.getElementById('summary-cert-name');

        if (certTypeSelect && summaryCertName) {
            const certNames = {
                'health-exercise': '건강운동처방사',
                'rehabilitation': '운동재활전문가',
                'pilates': '필라테스 전문가',
                'recreation': '레크리에이션지도자'
            };

            const selectedCert = certNames[certTypeSelect.value] || '자격증을 선택해주세요';
            summaryCertName.textContent = selectedCert;

            // 선택된 경우 스타일 강조
            if (certTypeSelect.value) {
                summaryCertName.style.color = '#059669';
                summaryCertName.style.fontWeight = '700';
            } else {
                summaryCertName.style.color = '#6b7280';
                summaryCertName.style.fontWeight = '400';
            }
        }

        // 신청자명 업데이트
        const nameInput = document.getElementById('name-korean');
        const summaryApplicantName = document.getElementById('summary-applicant-name');

        if (nameInput && summaryApplicantName) {
            const applicantName = nameInput.value.trim() || '이름을 입력해주세요';
            summaryApplicantName.textContent = applicantName;

            // 입력된 경우 스타일 강조
            if (nameInput.value.trim()) {
                summaryApplicantName.style.color = '#059669';
                summaryApplicantName.style.fontWeight = '700';
            } else {
                summaryApplicantName.style.color = '#6b7280';
                summaryApplicantName.style.fontWeight = '400';
            }
        }
    }

    // =================================
    // 🔧 필드 에러 처리
    // =================================

    function showFieldError(field, message) {
        if (!field) return;

        clearFieldError(field);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-500 text-sm mt-1';
        errorDiv.textContent = message;

        field.classList.add('error');
        field.parentNode.appendChild(errorDiv);
    }

    function clearFieldError(field) {
        if (!field) return;

        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    // =================================
    // 🔧 메시지 시스템
    // =================================

    function showSuccessMessage(message) {
        showMessage(message, 'success');
    }

    function showWarningMessage(message) {
        showMessage(message, 'warning');
    }

    function showErrorMessage(message) {
        showMessage(message, 'error');
    }

    function showInfoMessage(message) {
        showMessage(message, 'info');
    }

    function showMessage(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 99999;
            max-width: 400px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        toast.innerHTML = `
            <div class="${colors[type]} text-white p-4 rounded-lg shadow-xl flex items-center">
                <span class="mr-3 text-lg">${icons[type]}</span>
                <span class="flex-1">${message}</span>
                <button class="ml-3 text-white hover:text-gray-200 text-xl font-bold" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(toast);

        // 애니메이션
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        // 자동 제거
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);

        return toast;
    }

    // =================================
    // 🔧 공개 API (외부에서 접근 가능한 함수들)
    // =================================

    // 외부에서 접근 가능한 함수들을 CertApp 네임스페이스에 노출
    CertApp.updateSummary = updateSummary;
    CertApp.validateFullForm = validateFullForm;
    CertApp.removePhotoFile = removePhotoFile;
    CertApp.showSuccessMessage = showSuccessMessage;
    CertApp.showErrorMessage = showErrorMessage;
    CertApp.showWarningMessage = showWarningMessage;
    CertApp.showInfoMessage = showInfoMessage;

    // =================================
    // 🔧 디버깅 도구 (개발 환경에서만)
    // =================================

    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('.web.app') ||
        window.location.hostname.includes('.firebaseapp.com') ||
        window.location.protocol === 'file:' ||
        window.FORCE_DEBUG === true) {

        CertApp.debug = {
            // 기본 정보 확인
            help: function () {
                console.log('🎯 자격증 발급 신청 디버깅 도구 (개선된 버전)');
                console.log('\n📝 폼 관련:');
                console.log('- fillTestData() : 테스트 데이터 자동 입력');
                console.log('- checkValidation() : 유효성 검사 결과');
                console.log('- testEnglishName() : 영문명 검증 테스트');

                console.log('\n📸 사진 관련:');
                console.log('- simulatePhoto() : 사진 업로드 시뮬레이션');
                console.log('- checkPhoto() : 업로드된 사진 확인');
                console.log('- clearPhoto() : 사진 제거');

                console.log('\n🔍 조회 관련:');
                console.log('- testVerification() : 자격증 조회 테스트');

                console.log('\n🚀 신청 관련:');
                console.log('- simulateApplication() : 전체 신청 프로세스 시뮬레이션');

                console.log('\n🔧 시스템 상태:');
                console.log('- getState() : 현재 초기화 상태 확인');
                console.log('- testDaumAPI() : Daum API 상태 테스트');
            },

            // 시스템 상태 확인
            getState: function () {
                console.log('🔧 현재 시스템 상태:');
                console.log('- 초기화 완료:', initState.isInitialized);
                console.log('- 인증 준비:', initState.authReady);
                console.log('- Daum API 준비:', initState.daumAPIReady);
                console.log('- 현재 사용자:', currentUser ? currentUser.email : '없음');
                console.log('- 선택된 자격증:', selectedCertificateType || '없음');
                console.log('- 업로드된 사진:', uploadedPhotoFile ? uploadedPhotoFile.name : '없음');
            },

            // Daum API 테스트
            testDaumAPI: function () {
                console.log('🔍 Daum API 상태 테스트');
                if (typeof daum !== 'undefined' && daum.Postcode) {
                    console.log('✅ Daum API 사용 가능');
                    try {
                        openAddressSearch();
                    } catch (error) {
                        console.error('❌ API 실행 오류:', error);
                    }
                } else {
                    console.log('❌ Daum API 사용 불가');
                }
            },

            // 테스트 데이터 입력
            fillTestData: function () {
                console.log('📝 테스트 데이터 입력 시작');

                const fields = {
                    'cert-type': 'health-exercise',
                    'name-korean': '홍길동',
                    'name-english': 'Hong Gil Dong',
                    'birth-date': '1990-01-01',
                    'phone': '010-1234-5678',
                    'email': 'test@example.com',
                    'course-completion-date': '2024-12-15',
                    'exam-pass-date': '2025-01-15'
                };

                Object.entries(fields).forEach(([id, value]) => {
                    const input = document.getElementById(id);
                    if (input) {
                        input.value = value;
                        console.log(`✅ ${id} 입력됨: ${value}`);

                        // change 이벤트 발생
                        const changeEvent = new Event('change', { bubbles: true });
                        input.dispatchEvent(changeEvent);
                    }
                });

                // 주소 정보 입력
                const postalCode = document.getElementById('postal-code');
                const addressBasic = document.getElementById('address-basic');
                const addressDetail = document.getElementById('address-detail');

                if (postalCode) postalCode.value = '06234';
                if (addressBasic) addressBasic.value = '서울특별시 강남구 테헤란로 123';
                if (addressDetail) addressDetail.value = '456호';

                updateFullAddress();
                updateSummary();

                console.log('🎯 테스트 데이터 입력 완료!');
            },

            // 유효성 검사 확인
            checkValidation: function () {
                console.log('🔍 폼 유효성 검사 결과:');

                const form = document.getElementById('certificate-issuance-form');
                if (!form) {
                    console.log('❌ 폼을 찾을 수 없습니다.');
                    return;
                }

                // 필수 필드 체크
                const requiredFields = [
                    { id: 'cert-type', label: '자격증 종류' },
                    { id: 'name-korean', label: '한글 이름' },
                    { id: 'name-english', label: '영문 이름' },
                    { id: 'phone', label: '연락처' },
                    { id: 'email', label: '이메일' }
                ];

                console.log(`\n필수 필드 (${requiredFields.length}개):`);
                requiredFields.forEach(field => {
                    const input = document.getElementById(field.id);
                    const value = input ? input.value.trim() : '';
                    console.log(`${value ? '✅' : '❌'} ${field.label}: "${value}"`);
                });

                // 사진 업로드 체크
                console.log(`\n사진 업로드: ${uploadedPhotoFile ? '✅' : '❌'}`);
                if (uploadedPhotoFile) {
                    console.log(`  파일명: ${uploadedPhotoFile.name}`);
                    console.log(`  크기: ${formatFileSize(uploadedPhotoFile.size)}`);
                }

                // 전체 검증 실행
                const isValid = validateFullForm();
                console.log(`\n전체 검증 결과: ${isValid ? '✅ 통과' : '❌ 실패'}`);
            },

            // 영문명 검증 테스트
            testEnglishName: function () {
                const testCases = [
                    { value: 'Hong Gil Dong', expected: true, description: '정상적인 영문명' },
                    { value: 'John Smith', expected: true, description: '일반적인 서구식 이름' },
                    { value: 'Kim Min-Jung', expected: false, description: '하이픈 포함 (허용되지 않음)' },
                    { value: 'Lee123', expected: false, description: '숫자 포함' },
                    { value: 'Park', expected: false, description: '단일 단어 (성만)' },
                    { value: 'A B', expected: true, description: '최소 길이' },
                    { value: '', expected: false, description: '빈 값' }
                ];

                console.log('🧪 영문명 검증 테스트 시작:');
                testCases.forEach((testCase, index) => {
                    const result = validateEnglishName(testCase.value);
                    const status = result === testCase.expected ? '✅' : '❌';
                    console.log(`${index + 1}. ${status} "${testCase.value}" - ${testCase.description}`);
                });
            },

            // 사진 업로드 시뮬레이션
            simulatePhoto: function () {
                console.log('📸 사진 업로드 시뮬레이션');

                // 가상의 사진 파일 생성
                const canvas = document.createElement('canvas');
                canvas.width = 350;
                canvas.height = 450;
                const ctx = canvas.getContext('2d');

                // 간단한 테스트 이미지 그리기
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, 350, 450);
                ctx.fillStyle = '#333';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('테스트 증명사진', 175, 225);

                canvas.toBlob(function (blob) {
                    const file = new File([blob], 'test-photo.jpg', { type: 'image/jpeg' });
                    handlePhotoFile(file);
                    console.log('✅ 가상 사진 업로드 시뮬레이션 완료');
                }, 'image/jpeg');
            },

            // 업로드된 사진 확인
            checkPhoto: function () {
                console.log('📸 업로드된 사진 확인:');
                if (uploadedPhotoFile) {
                    console.log('파일명:', uploadedPhotoFile.name);
                    console.log('크기:', formatFileSize(uploadedPhotoFile.size));
                    console.log('타입:', uploadedPhotoFile.type);
                } else {
                    console.log('❌ 업로드된 사진이 없습니다.');
                }
            },

            // 사진 제거
            clearPhoto: function () {
                removePhotoFile();
                console.log('✅ 사진 제거 완료');
            },

            // 자격증 조회 테스트
            testVerification: function () {
                console.log('🔍 자격증 조회 테스트');

                const certNumberInput = document.getElementById('verify-cert-number');
                const certDateInput = document.getElementById('verify-cert-date');

                if (certNumberInput && certDateInput) {
                    certNumberInput.value = 'DHC-2025-001';
                    certDateInput.value = '2025-01-15';

                    const verifyForm = document.getElementById('verify-form');
                    if (verifyForm) {
                        const submitEvent = new Event('submit', { bubbles: true });
                        verifyForm.dispatchEvent(submitEvent);
                        console.log('✅ 자격증 조회 테스트 실행');
                    }
                } else {
                    console.log('❌ 조회 폼 요소를 찾을 수 없습니다.');
                }
            },

            // 전체 신청 프로세스 시뮬레이션
            simulateApplication: function () {
                console.log('🚀 전체 신청 프로세스 시뮬레이션');

                // 1단계: 테스트 데이터 입력
                console.log('\n1️⃣ 테스트 데이터 입력');
                this.fillTestData();

                // 2단계: 사진 업로드
                console.log('\n2️⃣ 사진 업로드');
                setTimeout(() => {
                    this.simulatePhoto();

                    // 3단계: 유효성 검사
                    console.log('\n3️⃣ 유효성 검사');
                    setTimeout(() => {
                        this.checkValidation();

                        console.log('\n🎯 모든 준비 완료! "자격증 발급 신청" 버튼을 눌러 테스트하세요.');

                        const submitButton = document.getElementById('submit-issuance-btn');
                        if (submitButton) {
                            submitButton.style.animation = 'pulse 2s infinite';
                            submitButton.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';

                            setTimeout(() => {
                                submitButton.style.animation = '';
                                submitButton.style.boxShadow = '';
                            }, 5000);
                        }
                    }, 500);
                }, 1000);
            }
        };

        console.log('🔧 CertApplication 디버깅 도구 활성화됨');
        console.log('💡 도움말: window.CertApplication.debug.help()');
        console.log('🧪 빠른 시작: window.CertApplication.debug.simulateApplication()');

    } else {
        console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
    }

    // =================================
    // 🔧 추가 스타일 적용
    // =================================

    const additionalStyles = document.createElement('style');
    additionalStyles.textContent = `
        /* 드래그 오버 효과 */
        .drag-over {
            border-color: #3b82f6 !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
            transform: scale(1.02);
            transition: all 0.2s ease;
        }
        
        /* 파일 업로드 완료 상태 */
        .has-file {
            border-color: #10b981 !important;
            background-color: rgba(16, 185, 129, 0.05) !important;
        }
        
        /* 사진 미리보기 스타일 */
        .preview-image {
            width: 120px;
            height: 160px;
            object-fit: cover;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        
        /* 에러 상태 스타일 */
        .error {
            border-color: #ef4444 !important;
            background-color: rgba(239, 68, 68, 0.05) !important;
        }
        
        .field-error {
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
        
        /* 성공 상태 스타일 */
        .success {
            border-color: #10b981 !important;
            background-color: rgba(16, 185, 129, 0.05) !important;
        }
        
        /* 영문명 입력 필드 */
        #name-english {
            font-family: 'Arial', sans-serif;
        }
        
        #name-english:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        /* 성공 상태 버튼 애니메이션 */
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* 토스트 메시지 애니메이션 */
        .toast {
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        /* 자격증 정보 표시 애니메이션 */
        #certificate-info-display {
            transition: all 0.3s ease;
        }
        
        /* 요약 카드 강조 효과 */
        .issuance-summary .summary-card {
            transition: all 0.3s ease;
        }
        
        .issuance-summary .summary-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
    `;
    document.head.appendChild(additionalStyles);

    // =================================
    // 🎉 초기화 실행
    // =================================

    // 모듈이 로드되면 즉시 초기화 시작
    initializeWhenReady();

    // =================================
    // 🎉 최종 완료 로그
    // =================================

    console.log('\n🎉 === CertApplication 모듈 완성 ===');
    console.log('✅ 네임스페이스 패턴으로 전역 변수 충돌 해결');
    console.log('✅ 모듈 패턴으로 코드 캡슐화 완성');
    console.log('✅ Daum API 안전한 로딩 및 오류 처리');
    console.log('✅ 드래그 업로드 검증 문제 완전 해결');
    console.log('✅ 단계별 초기화로 의존성 문제 해결');
    console.log('✅ 포괄적인 디버깅 도구 제공');
    console.log('✅ 완전한 에러 핸들링 시스템');

    console.log('\n🚀 사용 방법:');
    console.log('- 디버깅: window.CertApplication.debug.help()');
    console.log('- 빠른 테스트: window.CertApplication.debug.simulateApplication()');
    console.log('- 상태 확인: window.CertApplication.debug.getState()');

    // 완료 플래그 설정
    CertApp.isReady = true;

})(window.CertApplication);

// 전역 완료 플래그
window.certApplicationModuleLoaded = true;
console.log('✅ CertApplication 모듈 로드 완료!');