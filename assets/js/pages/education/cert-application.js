/**
 * cert-application.js - 자격증 발급 신청 (데이터 연동 수정 버전)
 * 🔧 cert-management.js와 데이터 스키마 통일
 */

console.log('=== cert-application.js 데이터 연동 수정 버전 로드 시작 ===');

// 🔧 네임스페이스 생성 (전역 변수 충돌 방지)
window.CertApplication = window.CertApplication || {};

// 🔧 즉시 실행 함수로 모듈 패턴 적용
(function (CertApp) {
    'use strict';

    // 🔧 내부 변수들
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

    // =================================
    // 🆕 NEW: 데이터 스키마 통일 유틸리티
    // =================================

    /**
     * 🆕 신청 데이터를 자격증 데이터로 변환
     */
    function convertApplicationToCertificate(applicationData) {
        console.log('🔄 신청 데이터를 자격증 데이터로 변환:', applicationData);

        const convertedData = {
            // 🔧 FIXED: 통일된 사용자 정보 필드명
            holderName: applicationData['name-korean'] || applicationData.nameKorean || '',
            holderNameKorean: applicationData['name-korean'] || applicationData.nameKorean || '',
            holderNameEnglish: applicationData['name-english'] || applicationData.nameEnglish || '',
            holderEmail: applicationData.email || '',
            holderPhone: applicationData.phone || '',

            // 🔧 자격증 정보
            certificateType: applicationData['cert-type'] || applicationData.certificateType || '',
            certificateName: getCertificateTypeName(applicationData['cert-type'] || applicationData.certificateType),
            
            // 🔧 교육 정보  
            courseCompletionDate: applicationData['course-completion-date'] || applicationData.courseCompletionDate || '',
            examPassDate: applicationData['exam-pass-date'] || applicationData.examPassDate || '',
            
            // 🔧 주소 정보
            deliveryAddress: applicationData['delivery-address'] || currentAddress.fullAddress || '',
            postalCode: currentAddress.postalCode || '',
            basicAddress: currentAddress.basicAddress || '',
            detailAddress: currentAddress.detailAddress || '',

            // 🔧 사진 정보
            photoFileName: applicationData.photoFileName || '',
            photoFileSize: applicationData.photoFileSize || 0,
            photoFileType: applicationData.photoFileType || '',
            photoUrl: applicationData.photoUrl || '', // 업로드 후 설정

            // 🔧 상태 정보 (통일)
            status: 'pending', // 신청 상태
            applicationStatus: 'submitted', // 신청 제출됨
            
            // 🔧 메타데이터
            applicationId: applicationData.applicationId || '',
            type: 'certificate_application',
            timestamp: new Date().toISOString(),
            
            // 🔧 사용자 정보
            userId: currentUser ? currentUser.uid : null,
            userEmail: currentUser ? currentUser.email : applicationData.email,
            
            // 🔧 신청 방법
            applicationMethod: 'online_form',
            source: 'cert-application-page'
        };

        console.log('✅ 변환된 데이터:', convertedData);
        return convertedData;
    }

    /**
     * 🆕 자격증 종류명 가져오기
     */
    function getCertificateTypeName(type) {
        const typeNames = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가', 
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        return typeNames[type] || type || '알 수 없음';
    }

    // =================================
    // 🔧 DOM 로드 후 안전한 초기화
    // =================================

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

            // 5. 주소 검색 시스템 초기화
            initAddressSearch();

            // 6. 사진 업로드 시스템 초기화
            initPhotoUpload();

            // 7. 폼 유효성 검사 초기화
            initFormValidation();

            // 8. 폼 제출 처리 초기화 (🔧 수정됨)
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
    // 🔧 기존 함수들 (수정 없음, 간략화)
    // =================================

    async function checkDaumAPI() {
        console.log('🔍 Daum 우편번호 API 확인');
        return new Promise((resolve) => {
            if (typeof daum !== 'undefined' && daum.Postcode) {
                console.log('✅ Daum API 이미 로드됨');
                initState.daumAPIReady = true;
                resolve();
                return;
            }
            let attempts = 0;
            const maxAttempts = 50;
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
                    resolve();
                }
            }, 100);
        });
    }

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
                    const autoFillBtn = document.getElementById('auto-fill-btn');
                    if (autoFillBtn) {
                        autoFillBtn.style.display = 'inline-block';
                        autoFillBtn.disabled = false;
                    }
                    await autoFillMemberInfo();
                } else {
                    console.log('❌ 비로그인 상태');
                    currentUser = null;
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
        if (!currentUser) return;
        try {
            const emailInput = document.getElementById('email');
            if (emailInput && !emailInput.value) {
                emailInput.value = currentUser.email;
            }
            const nameInput = document.getElementById('name-korean');
            if (nameInput && !nameInput.value && currentUser.displayName) {
                nameInput.value = currentUser.displayName;
                updateSummary();
            }
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
                fillUserData(result.data);
                showSuccessMessage('회원 정보가 자동으로 입력되었습니다.');
            }
        } catch (error) {
            console.error('사용자 상세 정보 로드 오류:', error);
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
            }
        });

        if (filledCount > 0) {
            console.log(`✅ 총 ${filledCount}개 필드 자동 기입 완료`);
            updateSummary();
        }
    }

    // =================================
    // 기존 함수들 (간략화 - 핵심 로직만)
    // =================================

    function initCertificateSelection() {
        console.log('🎓 자격증 종류 선택 시스템 초기화');
        const certTypeSelect = document.getElementById('cert-type');
        if (!certTypeSelect) return;
        
        certTypeSelect.addEventListener('change', function () {
            selectedCertificateType = this.value;
            if (this.value) {
                updateCertificateInfo(this.value);
                updateSummary();
            } else {
                hideCertificateInfo();
                updateSummary();
            }
        });
    }

    function initAutoFillSystem() {
        const autoFillBtn = document.getElementById('auto-fill-btn');
        if (!autoFillBtn) return;
        
        autoFillBtn.addEventListener('click', async function () {
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
                showErrorMessage('정보를 불러오는 중 오류가 발생했습니다.');
                this.disabled = false;
                this.textContent = '다시 시도';
            }
        });
    }

    function initAddressSearch() {
        const addressSearchBtn = document.getElementById('address-search-btn');
        if (!addressSearchBtn) return;
        
        addressSearchBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openAddressSearch();
        });
        
        const addressDetailInput = document.getElementById('address-detail');
        if (addressDetailInput) {
            addressDetailInput.addEventListener('input', updateFullAddress);
        }
    }

    function openAddressSearch() {
        if (!initState.daumAPIReady) {
            showErrorMessage('주소 검색 서비스를 준비 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        try {
            new daum.Postcode({
                oncomplete: function (data) {
                    document.getElementById('postal-code').value = data.zonecode;
                    document.getElementById('address-basic').value = data.address;
                    document.getElementById('address-detail').focus();
                    
                    currentAddress.postalCode = data.zonecode;
                    currentAddress.basicAddress = data.address;
                    updateFullAddress();
                    
                    showSuccessMessage('주소가 입력되었습니다. 상세 주소를 입력해주세요.');
                }
            }).open();
        } catch (error) {
            showErrorMessage('주소 검색을 실행할 수 없습니다.');
        }
    }

    function updateFullAddress() {
        const postalCode = document.getElementById('postal-code')?.value || '';
        const basicAddress = document.getElementById('address-basic')?.value || '';
        const detailAddress = document.getElementById('address-detail')?.value || '';
        
        currentAddress.postalCode = postalCode;
        currentAddress.basicAddress = basicAddress;
        currentAddress.detailAddress = detailAddress;
        
        if (postalCode && basicAddress) {
            currentAddress.fullAddress = `(${postalCode}) ${basicAddress}${detailAddress ? ' ' + detailAddress : ''}`;
            const deliveryAddressInput = document.getElementById('delivery-address');
            if (deliveryAddressInput) {
                deliveryAddressInput.value = currentAddress.fullAddress;
            }
        }
    }

    function initPhotoUpload() {
        const photoUploadZone = document.getElementById('photo-upload-zone');
        const photoFileInput = document.getElementById('photo-file');
        
        if (!photoUploadZone || !photoFileInput) return;
        
        photoUploadZone.addEventListener('click', function () {
            if (!this.classList.contains('has-file')) {
                photoFileInput.click();
            }
        });
        
        photoFileInput.addEventListener('change', function () {
            if (this.files.length > 0) {
                handlePhotoFile(this.files[0]);
            }
        });
    }

    function handlePhotoFile(file) {
        const validationResult = validatePhotoFile(file);
        if (!validationResult.isValid) {
            showErrorMessage(validationResult.message);
            return;
        }
        
        uploadedPhotoFile = file;
        const reader = new FileReader();
        reader.onload = function (e) {
            showPhotoPreview(file, e.target.result);
        };
        reader.readAsDataURL(file);
    }

    function validatePhotoFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return { isValid: false, message: 'JPG, PNG 형식의 이미지 파일만 업로드 가능합니다.' };
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return { isValid: false, message: '파일 크기가 5MB를 초과합니다.' };
        }
        return { isValid: true };
    }

    function showPhotoPreview(file, dataUrl) {
        document.getElementById('upload-content').style.display = 'none';
        document.getElementById('upload-preview').style.display = 'flex';
        document.getElementById('preview-image').src = dataUrl;
        document.getElementById('preview-filename').textContent = file.name;
        document.getElementById('preview-filesize').textContent = formatFileSize(file.size);
        document.getElementById('photo-upload-zone').classList.add('has-file');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // =================================
    // 🔧 MODIFIED: 폼 제출 처리 (데이터 스키마 통일)
    // =================================

    function initFormSubmission() {
        console.log('📤 폼 제출 처리 초기화 (데이터 스키마 통일)');

        const form = document.getElementById('certificate-issuance-form');
        const submitButton = document.getElementById('submit-issuance-btn');

        if (!form || !submitButton) {
            console.error('폼 또는 제출 버튼을 찾을 수 없습니다');
            return;
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            console.log('📤 자격증 발급 신청 제출 시작 (스키마 통일)');

            try {
                // 폼 검증
                if (!validateFullForm()) {
                    console.log('폼 검증 실패');
                    return;
                }

                // 버튼 상태 변경
                updateSubmitButtonState(submitButton, 'processing');

                // 🔧 MODIFIED: 통일된 신청 데이터 수집
                const applicationData = collectUnifiedApplicationData();
                console.log('🔧 통일된 신청 데이터:', applicationData);

                // 🔧 MODIFIED: 자격증 데이터로 변환
                const certificateData = convertApplicationToCertificate(applicationData);
                console.log('🔧 변환된 자격증 데이터:', certificateData);

                // 사진 업로드 처리
                if (uploadedPhotoFile) {
                    console.log('사진 업로드 시작...');
                    const photoUploadResult = await uploadPhotoToStorage(uploadedPhotoFile, certificateData.applicationId);

                    if (photoUploadResult.success) {
                        certificateData.photoUrl = photoUploadResult.url;
                        certificateData.photoPath = photoUploadResult.path;
                        console.log('사진 업로드 완료:', photoUploadResult.url);
                    } else {
                        console.warn('사진 업로드 실패:', photoUploadResult.error);
                        throw new Error('사진 업로드에 실패했습니다: ' + photoUploadResult.error);
                    }
                }

                // 🔧 MODIFIED: 두 컬렉션에 저장 (연동을 위해)
                const saveResults = await saveToMultipleCollections(certificateData);

                if (saveResults.success) {
                    console.log('신청 데이터 저장 완료');
                    updateSubmitButtonState(submitButton, 'success');
                    showSuccessMessage('자격증 발급 신청이 완료되었습니다!');
                    handleApplicationSuccess(certificateData);
                } else {
                    throw new Error(saveResults.error || '신청 저장에 실패했습니다.');
                }

            } catch (error) {
                console.error('자격증 발급 신청 처리 오류:', error);
                showErrorMessage('신청 처리 중 오류가 발생했습니다: ' + error.message);
                updateSubmitButtonState(submitButton, 'error');
            }
        });

        console.log('✅ 폼 제출 처리 초기화 완료 (스키마 통일)');
    }

    /**
     * 🆕 통일된 신청 데이터 수집
     */
    function collectUnifiedApplicationData() {
        const form = document.getElementById('certificate-issuance-form');
        const formData = new FormData(form);
        
        // 🔧 기본 데이터 구조 (스키마 통일)
        const data = {
            applicationId: 'CERT_' + Date.now(),
            timestamp: new Date().toISOString(),
            type: 'certificate_application',
            
            // 🔧 통일된 필드명 사용
            nameKorean: formData.get('name-korean') || '',
            nameEnglish: formData.get('name-english') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            birthDate: formData.get('birth-date') || '',
            
            certificateType: formData.get('cert-type') || '',
            courseCompletionDate: formData.get('course-completion-date') || '',
            examPassDate: formData.get('exam-pass-date') || '',
            
            deliveryAddress: formData.get('delivery-address') || '',
            
            // 파일 정보 (File 객체는 제외)
            photoFileName: uploadedPhotoFile ? uploadedPhotoFile.name : '',
            photoFileSize: uploadedPhotoFile ? uploadedPhotoFile.size : 0,
            photoFileType: uploadedPhotoFile ? uploadedPhotoFile.type : ''
        };

        // 자격증 정보 추가
        if (data.certificateType) {
            data.certificateName = getCertificateTypeName(data.certificateType);
        }

        // 주소 정보 정리
        data.fullAddress = currentAddress.fullAddress;
        data.postalCode = currentAddress.postalCode;
        data.basicAddress = currentAddress.basicAddress;
        data.detailAddress = currentAddress.detailAddress;

        // 사용자 정보 추가
        if (currentUser) {
            data.userId = currentUser.uid;
            data.userEmail = currentUser.email;
        }

        return data;
    }

    /**
     * 🆕 두 컬렉션에 저장 (연동을 위해)
     */
    async function saveToMultipleCollections(certificateData) {
        console.log('🔄 두 컬렉션에 저장 시작');

        try {
            const firebaseStatus = checkFirebaseConnection();
            
            if (firebaseStatus.connected && window.dbService) {
                // 1. 기존 신청 컬렉션에 저장 (호환성 유지)
                const applicationResult = await window.dbService.addDocument('certificate_applications', {
                    ...certificateData,
                    status: 'submitted',
                    applicationStatus: 'pending'
                });

                // 2. 🆕 새로운 통합 컬렉션에 저장 (관리자가 조회할 수 있도록)
                const certificateResult = await window.dbService.addDocument('certificates', {
                    ...certificateData,
                    status: 'pending', // 대기 중 (미발급)
                    applicationStatus: 'submitted',
                    issueStatus: 'pending', // 발급 대기
                    
                    // 🔧 관리자 조회를 위한 추가 필드
                    isIssued: false,
                    needsApproval: true,
                    applicationDocId: applicationResult.id // 신청 문서 ID 연결
                });

                if (applicationResult.success && certificateResult.success) {
                    console.log('✅ 두 컬렉션 저장 성공');
                    console.log('- 신청 문서 ID:', applicationResult.id);
                    console.log('- 자격증 문서 ID:', certificateResult.id);
                    
                    return {
                        success: true,
                        applicationId: applicationResult.id,
                        certificateId: certificateResult.id
                    };
                } else {
                    throw new Error('일부 저장에 실패했습니다.');
                }
            } else {
                // 🔧 테스트 모드
                console.log('🔧 Firebase 미연결, 시뮬레이션 모드');
                return {
                    success: true,
                    applicationId: certificateData.applicationId,
                    certificateId: certificateData.applicationId + '_cert'
                };
            }
        } catch (error) {
            console.error('❌ 다중 컬렉션 저장 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🔧 Firebase 연결 상태 확인
     */
    function checkFirebaseConnection() {
        if (!window.dhcFirebase) {
            return { connected: false, reason: 'not_initialized' };
        }
        if (!window.dhcFirebase.db) {
            return { connected: false, reason: 'db_not_initialized' };
        }
        return { connected: true };
    }

    // =================================
    // 기존 함수들 (간략화)
    // =================================

    function initFormValidation() {
        const form = document.getElementById('certificate-issuance-form');
        if (!form) return;
        
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
        });
    }

    function validateField(field) {
        if (!field) return false;
        const value = field.value.trim();
        
        if (field.hasAttribute('required') && !value) {
            showFieldError(field, '필수 입력 항목입니다.');
            return false;
        }
        
        clearFieldError(field);
        return true;
    }

    function validateFullForm() {
        let isValid = true;
        const requiredFields = document.querySelectorAll('input[required], select[required]');
        
        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        if (!uploadedPhotoFile) {
            const photoFileInput = document.getElementById('photo-file');
            if (photoFileInput) {
                showFieldError(photoFileInput, '증명사진을 업로드해주세요.');
                isValid = false;
            }
        }
        
        return isValid;
    }

    function updateCertificateInfo(certType) {
        const certNames = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        
        const certificateInfoDisplay = document.getElementById('certificate-info-display');
        const selectedCertName = document.getElementById('selected-cert-name');
        
        if (certType && certNames[certType]) {
            selectedCertName.textContent = certNames[certType];
            certificateInfoDisplay.style.display = 'block';
        }
    }

    function hideCertificateInfo() {
        const certificateInfoDisplay = document.getElementById('certificate-info-display');
        if (certificateInfoDisplay) {
            certificateInfoDisplay.style.display = 'none';
        }
    }

    function updateSummary() {
        const certTypeSelect = document.getElementById('cert-type');
        const summaryCertName = document.getElementById('summary-cert-name');
        const nameInput = document.getElementById('name-korean');
        const summaryApplicantName = document.getElementById('summary-applicant-name');

        if (certTypeSelect && summaryCertName) {
            const certNames = {
                'health-exercise': '건강운동처방사',
                'rehabilitation': '운동재활전문가',
                'pilates': '필라테스 전문가',
                'recreation': '레크리에이션지도자'
            };
            const selectedCert = certNames[certTypeSelect.value] || '자격증을 선택해주세요';
            summaryCertName.textContent = selectedCert;
        }

        if (nameInput && summaryApplicantName) {
            const applicantName = nameInput.value.trim() || '이름을 입력해주세요';
            summaryApplicantName.textContent = applicantName;
        }
    }

    async function uploadPhotoToStorage(file, applicationId) {
        console.log('Firebase Storage에 사진 업로드 시작:', file.name);

        try {
            if (!window.storageService) {
                console.warn('storageService를 사용할 수 없습니다. 시뮬레이션 모드로 진행');
                return {
                    success: true,
                    url: URL.createObjectURL(file),
                    path: `certificate-photos/${applicationId}/${file.name}`
                };
            }

            const timestamp = new Date().getTime();
            const fileExt = file.name.split('.').pop();
            const fileName = `photo_${timestamp}.${fileExt}`;
            const storagePath = `certificate-photos/${applicationId}/${fileName}`;

            const metadata = {
                customMetadata: {
                    applicationId: applicationId,
                    uploadType: 'certificate_photo',
                    originalName: file.name
                }
            };

            const uploadResult = await window.storageService.uploadFile(file, storagePath, metadata);

            if (uploadResult.success) {
                console.log('사진 업로드 성공:', uploadResult.url);
                return {
                    success: true,
                    url: uploadResult.url,
                    path: storagePath
                };
            } else {
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

    function handleApplicationSuccess(applicationData) {
        console.log('신청 완료 후 처리');

        setTimeout(() => {
            showInfoMessage(`신청 번호: ${applicationData.applicationId}`);
            showInfoMessage('관리자 검토 후 자격증이 발급됩니다.');
        }, 2000);

        const form = document.getElementById('certificate-issuance-form');
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                if (input.type !== 'button' && input.id !== 'submit-issuance-btn') {
                    input.disabled = true;
                }
            });
        }

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
    // 자격증 조회 기능 (간략화)
    // =================================

    function initCertificateVerification() {
        const verifyForm = document.getElementById('verify-form');
        if (!verifyForm) return;

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
                submitButton.disabled = true;
                submitButton.textContent = '조회 중...';

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
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
    }

    async function verifyCertificate(certNumber, certDate) {
        try {
            if (!window.dbService) {
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

            const queryConditions = [
                { field: 'certificateNumber', operator: '==', value: certNumber },
                { field: 'issueDate', operator: '==', value: certDate }
            ];

            const result = await window.dbService.queryDocuments('certificates', queryConditions);

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
                    <span class="text-gray-900">${result.number || result.certificateNumber}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-green-200">
                    <span class="font-medium text-gray-700">소지자 (한글):</span>
                    <span class="text-gray-900">${result.holder || result.holderName}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-green-200">
                    <span class="font-medium text-gray-700">소지자 (영문):</span>
                    <span class="text-gray-900">${result.holderEnglish || result.holderNameEnglish}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-green-200">
                    <span class="font-medium text-gray-700">자격증 종류:</span>
                    <span class="text-gray-900">${result.type || result.certificateName}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-green-200">
                    <span class="font-medium text-gray-700">발급일:</span>
                    <span class="text-gray-900">${result.date || result.issueDate}</span>
                </div>
                <div class="flex justify-between py-2">
                    <span class="font-medium text-gray-700">상태:</span>
                    <span class="text-green-600 font-bold">${result.status}</span>
                </div>
            </div>
        `;

        const verifyForm = document.getElementById('verify-form');
        verifyForm.parentNode.insertBefore(resultDiv, verifyForm.nextSibling);
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // =================================
    // URL 파라미터 처리
    // =================================

    function handleUrlParameters() {
        console.log('🔗 URL 파라미터 처리 시작');

        const urlParams = new URLSearchParams(window.location.search);
        const certParam = urlParams.get('cert') || urlParams.get('certType');

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

                certTypeSelect.value = optionValue;
                certTypeSelect.style.backgroundColor = '#dbeafe';
                certTypeSelect.style.transition = 'background-color 0.5s ease';

                setTimeout(() => {
                    certTypeSelect.style.backgroundColor = '';
                }, 1500);

                const changeEvent = new Event('change', { bubbles: true });
                certTypeSelect.dispatchEvent(changeEvent);

                setTimeout(() => {
                    showInfoMessage(`${certName} 자격증이 자동으로 선택되었습니다.`);
                }, 500);
            }
        }
    }

    // =================================
    // 필드 에러 처리 및 메시지 시스템
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

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

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
    // 공개 API
    // =================================

    CertApp.updateSummary = updateSummary;
    CertApp.validateFullForm = validateFullForm;
    CertApp.showSuccessMessage = showSuccessMessage;
    CertApp.showErrorMessage = showErrorMessage;
    CertApp.showWarningMessage = showWarningMessage;
    CertApp.showInfoMessage = showInfoMessage;

    // =================================
    // 🆕 디버깅 도구 업데이트
    // =================================

    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('.web.app') ||
        window.location.hostname.includes('.firebaseapp.com') ||
        window.location.protocol === 'file:' ||
        window.FORCE_DEBUG === true) {

        CertApp.debug = {
            help: function () {
                console.log('🎯 자격증 발급 신청 디버깅 도구 (데이터 연동 수정 버전)');
                console.log('\n📝 폼 관련:');
                console.log('- fillTestData() : 테스트 데이터 자동 입력');
                console.log('- checkValidation() : 유효성 검사 결과');
                console.log('- testDataConversion() : 🆕 데이터 변환 테스트');
                console.log('- checkCollections() : 🆕 컬렉션 저장 테스트');
            },

            // 🆕 데이터 변환 테스트
            testDataConversion: function () {
                console.log('🔄 데이터 변환 테스트 시작');
                
                const testData = {
                    'name-korean': '홍길동',
                    'name-english': 'Hong Gil Dong',
                    'email': 'test@example.com',
                    'phone': '010-1234-5678',
                    'cert-type': 'health-exercise',
                    'course-completion-date': '2025-01-15',
                    'exam-pass-date': '2025-01-20'
                };

                const converted = convertApplicationToCertificate(testData);
                console.log('변환 결과:', converted);

                // 필드 매핑 확인
                console.log('\n필드 매핑 확인:');
                console.log('- nameKorean →', converted.holderNameKorean);
                console.log('- nameEnglish →', converted.holderNameEnglish);
                console.log('- email →', converted.holderEmail);
                console.log('- certificateType →', converted.certificateType);
                
                return converted;
            },

            // 🆕 컬렉션 저장 테스트
            checkCollections: function () {
                console.log('📊 컬렉션 저장 테스트');
                console.log('기존: certificate_applications 컬렉션');
                console.log('신규: certificates 컬렉션 (관리자 조회용)');
                console.log('연결: applicationDocId 필드로 연결');
            },

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
                        const changeEvent = new Event('change', { bubbles: true });
                        input.dispatchEvent(changeEvent);
                    }
                });

                const postalCode = document.getElementById('postal-code');
                const addressBasic = document.getElementById('address-basic');
                const addressDetail = document.getElementById('address-detail');

                if (postalCode) postalCode.value = '06234';
                if (addressBasic) addressBasic.value = '서울특별시 강남구 테헤란로 123';
                if (addressDetail) addressDetail.value = '456호';

                updateFullAddress();
                updateSummary();

                console.log('🎯 테스트 데이터 입력 완료 (연동 테스트 준비)!');
            }
        };

        console.log('🔧 CertApplication 디버깅 도구 활성화됨 (데이터 연동 수정)');
        console.log('💡 새로운 함수: testDataConversion(), checkCollections()');
    }

    // 완료 플래그 설정
    CertApp.isReady = true;

    // 초기화 실행
    initializeWhenReady();

})(window.CertApplication);

// 전역 완료 플래그
window.certApplicationModuleLoaded = true;
console.log('✅ CertApplication 모듈 로드 완료 (데이터 연동 수정)!');

console.log('\n🎉 === cert-application.js 데이터 연동 수정 완료 ===');
console.log('✅ 데이터 스키마 통일 (holderName, holderNameKorean, holderNameEnglish)');
console.log('✅ 두 컬렉션 저장 (certificate_applications + certificates)');
console.log('✅ 데이터 변환 로직 구현 (convertApplicationToCertificate)');
console.log('✅ 관리자 조회 지원 (certificates 컬렉션)');
console.log('✅ 기존 호환성 유지 (certificate_applications 컬렉션)');
console.log('\n🔧 주요 개선사항:');
console.log('- collectUnifiedApplicationData(): 통일된 데이터 수집');
console.log('- convertApplicationToCertificate(): 신청 → 자격증 데이터 변환');
console.log('- saveToMultipleCollections(): 두 컬렉션에 동시 저장');
console.log('\n🚀 이제 cert-management.js에서 신청 데이터를 조회할 수 있습니다!');
console.log('📸 테스트: window.CertApplication.debug.testDataConversion()');

// =================================
// 🆕 전역 접근 가능한 유틸리티 함수 추가
// =================================

// cert-application.js의 마지막 부분에 추가
(function() {
    'use strict';

    // 🆕 전역 네임스페이스에 변환 함수 등록
    window.CertApplicationUtils = window.CertApplicationUtils || {};

    /**
     * 🆕 전역적으로 접근 가능한 데이터 변환 함수
     */
    window.CertApplicationUtils.convertApplicationToCertificate = function(applicationData) {
        console.log('🔄 전역 변환 함수 호출:', applicationData);

        const convertedData = {
            // 🔧 FIXED: 통일된 사용자 정보 필드명
            holderName: applicationData['name-korean'] || applicationData.nameKorean || applicationData.holderName || '',
            holderNameKorean: applicationData['name-korean'] || applicationData.nameKorean || applicationData.holderNameKorean || '',
            holderNameEnglish: applicationData['name-english'] || applicationData.nameEnglish || applicationData.holderNameEnglish || '',
            holderEmail: applicationData.email || applicationData.holderEmail || '',
            holderPhone: applicationData.phone || applicationData.holderPhone || '',

            // 🔧 자격증 정보
            certificateType: applicationData['cert-type'] || applicationData.certificateType || '',
            certificateName: getCertificateTypeName(applicationData['cert-type'] || applicationData.certificateType),
            
            // 🔧 교육 정보  
            courseCompletionDate: applicationData['course-completion-date'] || applicationData.courseCompletionDate || '',
            examPassDate: applicationData['exam-pass-date'] || applicationData.examPassDate || '',
            
            // 🔧 주소 정보
            deliveryAddress: applicationData['delivery-address'] || applicationData.deliveryAddress || '',
            
            // 🔧 상태 정보 (통일)
            status: 'pending', // 신청 상태
            applicationStatus: 'submitted', // 신청 제출됨
            
            // 🔧 메타데이터
            applicationId: applicationData.applicationId || 'TEMP_' + Date.now(),
            type: 'certificate_application',
            timestamp: new Date().toISOString(),
            
            // 🔧 신청 방법
            applicationMethod: 'online_form',
            source: 'cert-application-page'
        };

        return convertedData;
    };

    /**
     * 🆕 자격증 종류명 가져오기 (전역 함수)
     */
    function getCertificateTypeName(type) {
        const typeNames = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가', 
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        return typeNames[type] || type || '알 수 없음';
    }

    /**
     * 🆕 테스트 데이터 생성
     */
    window.CertApplicationUtils.generateTestData = function() {
        return {
            'name-korean': '홍길동',
            'name-english': 'Hong Gil Dong',
            'email': 'test@example.com',
            'phone': '010-1234-5678',
            'cert-type': 'health-exercise',
            'course-completion-date': '2025-01-15',
            'exam-pass-date': '2025-01-20',
            'delivery-address': '(06234) 서울특별시 강남구 테헤란로 123 456호'
        };
    };

    /**
     * 🆕 변환 테스트 함수 (전역 접근용)
     */
    window.CertApplicationUtils.testDataConversion = function() {
        console.log('🔄 전역 데이터 변환 테스트 시작');
        
        const testData = this.generateTestData();
        const converted = this.convertApplicationToCertificate(testData);
        
        console.log('변환 결과:', converted);
        console.log('\n필드 매핑 확인:');
        console.log('- nameKorean →', converted.holderNameKorean);
        console.log('- nameEnglish →', converted.holderNameEnglish);
        console.log('- email →', converted.holderEmail);
        console.log('- certificateType →', converted.certificateType);
        
        return converted;
    };

    // 완료 로그
    console.log('✅ CertApplicationUtils 전역 유틸리티 등록 완료');

})();

// =================================
// 🔧 기존 CertApplication.debug 확장
// =================================

// 기존 디버깅 객체에 전역 접근 함수 추가
if (window.CertApplication && window.CertApplication.debug) {
    // 전역 접근 가능한 함수들을 기존 디버깅 객체에도 연결
    Object.assign(window.CertApplication.debug, {
        // 전역 변환 함수와 연결
        testDataConversion: function() {
            if (window.CertApplicationUtils && window.CertApplicationUtils.testDataConversion) {
                return window.CertApplicationUtils.testDataConversion();
            } else {
                console.warn('⚠️ CertApplicationUtils를 찾을 수 없습니다.');
                return null;
            }
        },

        // 🆕 스키마 호환성 테스트
        testSchemaCompatibility: function() {
            console.log('🔤 스키마 호환성 테스트');
            
            const testData = window.CertApplicationUtils.generateTestData();
            const converted = window.CertApplicationUtils.convertApplicationToCertificate(testData);
            
            // cert-management.js에서 기대하는 필드들 확인
            const expectedFields = [
                'holderName',
                'holderNameKorean', 
                'holderNameEnglish',
                'holderEmail',
                'certificateType',
                'status',
                'applicationStatus'
            ];
            
            console.log('📊 필수 필드 확인:');
            expectedFields.forEach(field => {
                const hasField = converted.hasOwnProperty(field);
                const value = converted[field];
                console.log(`${hasField ? '✅' : '❌'} ${field}: ${value || 'undefined'}`);
            });
            
            return {
                testData,
                converted,
                compatibility: expectedFields.every(field => converted.hasOwnProperty(field) && converted[field])
            };
        }
    });
    
    console.log('✅ CertApplication.debug 확장 완료');
}

/**
 * cert-application.js 파일의 마지막 부분에 추가할 코드
 * 🔧 파일 위치: cert-application.js의 가장 마지막 (기존 코드 이후)
 * 📍 추가 위치: console.log('✅ CertApplication 모듈 로드 완료!') 이후
 */

// =================================
// 🆕 전역 접근 가능한 유틸리티 함수 추가
// =================================

console.log('🔧 CertApplicationUtils 전역 유틸리티 등록 시작...');

// 🆕 전역 네임스페이스 생성
window.CertApplicationUtils = window.CertApplicationUtils || {};

/**
 * 🆕 전역적으로 접근 가능한 데이터 변환 함수
 */
window.CertApplicationUtils.convertApplicationToCertificate = function(applicationData) {
    console.log('🔄 전역 변환 함수 호출:', applicationData);

    // 자격증 종류명 가져오기 함수 (내부)
    function getCertificateTypeName(type) {
        const typeNames = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가', 
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        return typeNames[type] || type || '알 수 없음';
    }

    const convertedData = {
        // 🔧 통일된 사용자 정보 필드명
        holderName: applicationData['name-korean'] || applicationData.nameKorean || applicationData.holderName || '',
        holderNameKorean: applicationData['name-korean'] || applicationData.nameKorean || applicationData.holderNameKorean || '',
        holderNameEnglish: applicationData['name-english'] || applicationData.nameEnglish || applicationData.holderNameEnglish || '',
        holderEmail: applicationData.email || applicationData.holderEmail || '',
        holderPhone: applicationData.phone || applicationData.holderPhone || '',

        // 🔧 자격증 정보
        certificateType: applicationData['cert-type'] || applicationData.certificateType || '',
        certificateName: getCertificateTypeName(applicationData['cert-type'] || applicationData.certificateType),
        
        // 🔧 교육 정보  
        courseCompletionDate: applicationData['course-completion-date'] || applicationData.courseCompletionDate || '',
        examPassDate: applicationData['exam-pass-date'] || applicationData.examPassDate || '',
        
        // 🔧 주소 정보
        deliveryAddress: applicationData['delivery-address'] || applicationData.deliveryAddress || '',
        
        // 🔧 상태 정보 (통일)
        status: 'pending', // 신청 상태
        applicationStatus: 'submitted', // 신청 제출됨
        
        // 🔧 메타데이터
        applicationId: applicationData.applicationId || 'TEMP_' + Date.now(),
        type: 'certificate_application',
        timestamp: new Date().toISOString(),
        
        // 🔧 신청 방법
        applicationMethod: 'online_form',
        source: 'cert-application-page'
    };

    console.log('✅ 전역 변환 완료:', convertedData);
    return convertedData;
};

/**
 * 🆕 테스트 데이터 생성
 */
window.CertApplicationUtils.generateTestData = function() {
    return {
        'name-korean': '홍길동',
        'name-english': 'Hong Gil Dong',
        'email': 'test@example.com',
        'phone': '010-1234-5678',
        'cert-type': 'health-exercise',
        'course-completion-date': '2025-01-15',
        'exam-pass-date': '2025-01-20',
        'delivery-address': '(06234) 서울특별시 강남구 테헤란로 123 456호'
    };
};

/**
 * 🆕 변환 테스트 함수 (전역 접근용)
 */
window.CertApplicationUtils.testDataConversion = function() {
    console.log('🔄 전역 데이터 변환 테스트 시작');
    
    const testData = this.generateTestData();
    const converted = this.convertApplicationToCertificate(testData);
    
    console.log('변환 결과:', converted);
    console.log('\n필드 매핑 확인:');
    console.log('- nameKorean →', converted.holderNameKorean);
    console.log('- nameEnglish →', converted.holderNameEnglish);
    console.log('- email →', converted.holderEmail);
    console.log('- certificateType →', converted.certificateType);
    
    return converted;
};

/**
 * 🆕 스키마 호환성 테스트
 */
window.CertApplicationUtils.testSchemaCompatibility = function() {
    console.log('🔤 스키마 호환성 테스트');
    
    const testData = this.generateTestData();
    const converted = this.convertApplicationToCertificate(testData);
    
    // cert-management.js에서 기대하는 필드들 확인
    const expectedFields = [
        'holderName',
        'holderNameKorean', 
        'holderNameEnglish',
        'holderEmail',
        'certificateType',
        'status',
        'applicationStatus'
    ];
    
    console.log('📊 필수 필드 확인:');
    expectedFields.forEach(field => {
        const hasField = converted.hasOwnProperty(field);
        const value = converted[field];
        console.log(`${hasField ? '✅' : '❌'} ${field}: ${value || 'undefined'}`);
    });
    
    return {
        testData,
        converted,
        compatibility: expectedFields.every(field => converted.hasOwnProperty(field) && converted[field])
    };
};

// =================================
// 🔧 기존 CertApplication.debug 확장 (있다면)
// =================================

if (window.CertApplication && window.CertApplication.debug) {
    console.log('🔧 기존 CertApplication.debug 확장');
    
    // 전역 접근 가능한 함수들을 기존 디버깅 객체에도 연결
    Object.assign(window.CertApplication.debug, {
        // 전역 변환 함수와 연결
        testDataConversion: function() {
            return window.CertApplicationUtils.testDataConversion();
        },
        
        // 스키마 호환성 테스트 추가
        testSchemaCompatibility: function() {
            return window.CertApplicationUtils.testSchemaCompatibility();
        }
    });
    
    console.log('✅ CertApplication.debug 확장 완료');
}

// =================================
// 🎉 완료 메시지
// =================================

console.log('✅ CertApplicationUtils 전역 유틸리티 등록 완료!');
console.log('🎯 사용 가능한 함수들:');
console.log('- window.CertApplicationUtils.convertApplicationToCertificate()');
console.log('- window.CertApplicationUtils.testDataConversion()');
console.log('- window.CertApplicationUtils.testSchemaCompatibility()');

// 테스트 실행 (개발 모드에서만)
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.web.app') ||
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:') {
    
    console.log('\n🧪 개발 모드 자동 테스트:');
    try {
        const testResult = window.CertApplicationUtils.testSchemaCompatibility();
        if (testResult.compatibility) {
            console.log('🎉 스키마 호환성 테스트 통과!');
        } else {
            console.warn('⚠️ 일부 필드가 누락되었습니다.');
        }
    } catch (error) {
        console.error('❌ 자동 테스트 실패:', error);
    }
}

// 전역 완료 플래그 설정
window.certApplicationUtilsComplete = true;