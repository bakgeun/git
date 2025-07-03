/**
 * cert-application.js - 통합 플로우 버전 (Phase 2-B)
 * 자격증 신청 페이지 - 4단계 통합 플로우의 두 번째 단계
 * 이전 단계 데이터 연동 + 교재 선택으로 이동
 */

console.log('=== cert-application.js 통합 플로우 버전 로드됨 ===');

// 🔧 NEW: 플로우 데이터 저장용 전역 변수
let flowData = {
    step1: null, // course-application 데이터
    step2: null, // cert-application 데이터 (현재 단계)
    step3: null, // material-selection 데이터
    step4: null  // payment-integration 데이터
};

// 전역 변수 - 업로드된 사진 정보 저장
let uploadedPhotoData = null;

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== cert-application.js 초기화 준비, 현재 상태:', document.readyState);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initCertApplicationFlowPage();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initCertApplicationFlowPage();
    }
}

// 초기화 시작
initializeWhenReady();

// 🔧 NEW: 통합 플로우 페이지 초기화 함수
function initCertApplicationFlowPage() {
    console.log('=== initCertApplicationFlowPage 실행 시작 (통합 플로우 버전) ===');
    
    try {
        // 🔧 NEW: 플로우 진행 상황 표시 업데이트
        updateFlowProgress(2);
        
        // 🔧 NEW: 이전 단계 데이터 로드 및 자동 기입 (가장 먼저 실행)
        loadPreviousStepData();
        
        // URL 파라미터 처리
        handleUrlParameters();
        
        // 🔧 MODIFIED: 간소화된 가격 표시 (결제 기능 제거)
        initSimpleCertificateInfo();
        
        // 사진 업로드 기능 초기화
        initPhotoUpload();
        
        // 폼 유효성 검사 초기화 (영문명 검증 포함)
        initFormValidationWithEnglishName();
        
        // 🔧 NEW: 통합 플로우 폼 제출 처리 (결제 대신 다음 단계 이동)
        initFlowFormSubmission();
        
        // 자격증 조회 폼 처리
        initVerifyForm();
        
        // 전화번호 자동 포맷팅 + 영문명 실시간 검증
        initPhoneFormatting();
        initEnglishNameValidation();
        
        // 날짜 제한 설정
        setDateLimits();
        
        // 🔧 REMOVED: 결제 관련 기능들 제거
        // initPaymentMethods();
        // initTossPayments();
        
        // 모달 처리는 유지 (알림용)
        initModalHandling();
        
        console.log('=== initCertApplicationFlowPage 완료 (통합 플로우 버전) ===');
    } catch (error) {
        console.error('페이지 초기화 중 오류:', error);
        showErrorMessage('페이지 초기화 중 오류가 발생했습니다.');
    }
}

// =================================
// 🔧 NEW: 통합 플로우 관련 기능들
// =================================

/**
 * 플로우 진행 상황 표시 업데이트
 */
function updateFlowProgress(currentStep) {
    console.log('📊 플로우 진행 상황 업데이트:', currentStep);
    
    // HTML에 플로우 진행 상황이 있는 경우 업데이트
    const steps = document.querySelectorAll('.step');
    
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        
        if (stepNumber < currentStep) {
            step.classList.remove('pending', 'active');
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.remove('pending', 'completed');
            step.classList.add('active');
        } else {
            step.classList.remove('active', 'completed');
            step.classList.add('pending');
        }
    });
}

/**
 * 🔧 NEW: 이전 단계 데이터 로드 및 자동 기입
 */
function loadPreviousStepData() {
    console.log('📥 이전 단계 데이터 로드 시작');
    
    try {
        // 1. URL 파라미터에서 데이터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const fromStep = urlParams.get('from');
        const autoFill = urlParams.get('autoFill');
        
        console.log('URL 파라미터:', { fromStep, autoFill });
        
        // 2. 로컬 스토리지에서 플로우 데이터 로드
        const savedFlowData = getFlowData();
        console.log('저장된 플로우 데이터:', savedFlowData);
        
        // 🔧 FIX: 즉시 이전 단계 정보 표시 업데이트
        setTimeout(() => {
            updatePreviousStepDisplay();
        }, 100);
        
        // 3. 1단계 데이터가 있으면 자동 기입
        const step1Data = savedFlowData.step1 || savedFlowData['course-application'];
        
        if (step1Data && autoFill === 'true') {
            console.log('1단계 데이터 자동 기입 시작:', step1Data);
            autoFillFromStep1Data(step1Data);
            
            // 🔧 FIX: 자동 기입 후 다시 이전 단계 정보 업데이트
            setTimeout(() => {
                updatePreviousStepDisplay();
            }, 500);
            
            // 성공 메시지 표시
            setTimeout(() => {
                showSuccessMessage('이전 단계에서 입력한 정보가 자동으로 기입되었습니다.');
            }, 1000);
        } else {
            console.log('자동 기입할 데이터가 없거나 비활성화됨');
            
            // 일반 회원정보 자동기입 시도
            setTimeout(() => {
                autoFillMemberInfo();
                
                // 🔧 FIX: 회원정보 기입 후에도 이전 단계 정보 업데이트
                setTimeout(() => {
                    updatePreviousStepDisplay();
                }, 300);
            }, 1000);
        }
        
        // 4. 전역 변수에 저장
        flowData = savedFlowData;
        
    } catch (error) {
        console.error('이전 단계 데이터 로드 오류:', error);
        
        // 🔧 FIX: 오류 발생해도 이전 단계 정보 업데이트 시도
        setTimeout(() => {
            updatePreviousStepDisplay();
        }, 500);
        
        // 오류 발생해도 일반 회원정보 자동기입은 시도
        setTimeout(() => {
            autoFillMemberInfo();
        }, 1000);
    }
}

/**
 * 🔧 NEW: 1단계 데이터로 자동 기입
 */
function autoFillFromStep1Data(step1Data) {
    console.log('📝 1단계 데이터로 폼 자동 기입');
    
    // 기본 정보 매핑
    const fieldMappings = {
        'name': step1Data['applicant-name'] || step1Data.name,
        'phone': step1Data.phone,
        'email': step1Data.email,
        'birth': step1Data['birth-date'] || step1Data.birthDate,
        'address': step1Data.address
    };
    
    // 자격증 타입 매핑 (course-application에서 선택한 과정 기반)
    if (step1Data.selectedCourseInfo) {
        const certTypeMapping = {
            'health-exercise': 'health',
            'rehabilitation': 'rehab',
            'pilates': 'pilates',
            'recreation': 'recreation'
        };
        
        const certType = certTypeMapping[step1Data.selectedCourseInfo.certificateType];
        if (certType) {
            const certTypeSelect = document.getElementById('cert-type');
            if (certTypeSelect) {
                certTypeSelect.value = certType;
                
                // change 이벤트 발생시켜 선택된 자격증 이름 업데이트
                const changeEvent = new Event('change', { bubbles: true });
                certTypeSelect.dispatchEvent(changeEvent);
                
                console.log('✅ 자격증 타입 자동 선택:', certType);
            }
        }
    }
    
    // 기본 필드 자동 기입
    let filledCount = 0;
    Object.keys(fieldMappings).forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input && fieldMappings[fieldId]) {
            input.value = fieldMappings[fieldId];
            filledCount++;
            console.log(`✅ ${fieldId} 자동 기입:`, fieldMappings[fieldId]);
        }
    });
    
    // 영문명 자동 생성 시도 (한글명이 있는 경우)
    const nameInput = document.getElementById('name');
    const nameEnglishInput = document.getElementById('name-english');
    
    if (nameInput && nameInput.value && nameEnglishInput && !nameEnglishInput.value) {
        // 간단한 영문명 제안 (실제로는 사용자가 직접 입력해야 함)
        const suggestedEnglish = generateEnglishNameSuggestion(nameInput.value);
        if (suggestedEnglish) {
            nameEnglishInput.placeholder = `예: ${suggestedEnglish}`;
            console.log('💡 영문명 제안:', suggestedEnglish);
        }
    }
    
    console.log(`✅ 총 ${filledCount}개 필드 자동 기입 완료`);
    
    // 🔧 FIX: 자동 기입 완료 후 이전 단계 정보 표시 업데이트
    setTimeout(() => {
        updatePreviousStepDisplay();
    }, 200);
}

/**
 * 🔧 NEW: 영문명 제안 생성 (단순한 예시)
 */
function generateEnglishNameSuggestion(koreanName) {
    // 일반적인 한글 성씨 → 영문 매핑
    const surnameMapping = {
        '김': 'Kim',
        '이': 'Lee',
        '박': 'Park',
        '최': 'Choi',
        '정': 'Jung',
        '강': 'Kang',
        '조': 'Cho',
        '윤': 'Yoon',
        '장': 'Jang',
        '임': 'Lim',
        '한': 'Han',
        '오': 'Oh',
        '서': 'Seo',
        '신': 'Shin',
        '권': 'Kwon',
        '황': 'Hwang',
        '안': 'Ahn',
        '송': 'Song',
        '류': 'Ryu',
        '전': 'Jeon',
        '홍': 'Hong',
        '고': 'Ko',
        '문': 'Moon',
        '양': 'Yang',
        '손': 'Son',
        '배': 'Bae',
        '백': 'Baek',
        '허': 'Heo',
        '유': 'Yu',
        '남': 'Nam',
        '심': 'Sim',
        '노': 'Noh',
        '정': 'Jeong',
        '하': 'Ha',
        '곽': 'Kwak',
        '성': 'Sung',
        '차': 'Cha',
        '주': 'Joo',
        '우': 'Woo',
        '구': 'Koo',
        '신': 'Shin',
        '원': 'Won',
        '민': 'Min',
        '예': 'Ye',
        '소': 'So'
    };
    
    if (koreanName.length >= 2) {
        const surname = koreanName.charAt(0);
        const englishSurname = surnameMapping[surname];
        
        if (englishSurname) {
            // 예시: 김철수 → Kim Chul Soo (실제로는 더 정교한 변환 필요)
            return `${englishSurname} [이름]`;
        }
    }
    
    return null;
}

/**
 * 🔧 NEW: 통합 플로우 폼 제출 처리 (결제 대신 다음 단계 이동)
 */
function initFlowFormSubmission() {
    console.log('📋 통합 플로우 폼 제출 처리 초기화');
    
    const form = document.getElementById('certificate-form');
    const submitButton = document.getElementById('apply-button');

    if (!form || !submitButton) {
        console.log('폼 또는 제출 버튼을 찾을 수 없습니다.');
        return;
    }
    
    // 🔧 NEW: 버튼 텍스트를 "다음 단계"로 변경
    updateSubmitButtonForFlow(submitButton);

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('📤 다음 단계로 이동 처리 시작');

        try {
            // 폼 검증 (영문명 + 사진 포함)
            if (!validateFormWithEnglishName()) {
                console.log('폼 검증 실패');
                return;
            }
            
            // 사진 업로드 검증
            if (!validatePhotoUpload()) {
                console.log('사진 업로드 검증 실패');
                return;
            }

            console.log('폼 검증 성공, 다음 단계 진행');
            
            // 버튼 상태 변경
            updateSubmitButtonState(submitButton, 'processing');

            // 🔧 NEW: 2단계 데이터 수집
            const step2Data = collectStep2FormData();
            console.log('수집된 2단계 데이터:', step2Data);

            // 🔧 NEW: 사진 업로드 처리
            if (uploadedPhotoData && uploadedPhotoData.file) {
                console.log('사진 업로드 시작...');
                const photoUploadResult = await uploadPhotoToStorage(uploadedPhotoData.file, step2Data.applicationId);
                
                if (photoUploadResult.success) {
                    step2Data.photoUrl = photoUploadResult.url;
                    step2Data.photoPath = photoUploadResult.path;
                    step2Data.hasPhoto = true;
                    console.log('사진 업로드 완료:', photoUploadResult.url);
                } else {
                    console.warn('사진 업로드 실패:', photoUploadResult.error);
                    // 사진 업로드 실패해도 계속 진행 (필수가 아닌 경우)
                }
            }

            // 플로우 데이터 저장
            saveFlowStepData('step2', step2Data);

            // 다음 단계로 이동
            proceedToMaterialSelection(step2Data);
            
        } catch (error) {
            console.error('다음 단계 진행 처리 오류:', error);
            showErrorMessage('다음 단계로 진행하는 중 오류가 발생했습니다.');
            updateSubmitButtonState(submitButton, 'error');
        }
    });

    console.log('📋 통합 플로우 폼 제출 처리 초기화 완료');
}

/**
 * 🔧 NEW: 제출 버튼을 플로우용으로 업데이트
 */
function updateSubmitButtonForFlow(button) {
    const buttonIcon = button.querySelector('.button-icon');
    const buttonText = button.querySelector('.button-text');
    
    if (buttonIcon) buttonIcon.textContent = '➡️';
    if (buttonText) buttonText.textContent = '다음 단계: 교재 선택';
    
    // 클래스 업데이트
    button.classList.remove('payment-button');
    button.classList.add('next-step-button');
}

/**
 * 🔧 NEW: 2단계 폼 데이터 수집
 */
function collectStep2FormData() {
    const form = document.getElementById('certificate-form');
    const formData = new FormData(form);
    const data = {
        step: 2,
        stepName: 'cert-application',
        timestamp: new Date().toISOString(),
        applicationId: 'CERT_APP_' + Date.now()
    };

    // 기본 폼 데이터 수집
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // 체크박스 데이터 수집
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        data[cb.name || cb.id] = cb.checked;
    });
    
    // 영문명 처리
    data.nameKorean = data.name || '';
    data.nameEnglish = data['name-english'] || '';
    
    // 사진 정보 (업로드는 별도 처리)
    data.hasPhoto = uploadedPhotoData !== null;
    
    // 자격증 타입 정보 추가
    const certType = data['cert-type'];
    if (certType) {
        const certNames = {
            'health': '건강운동처방사',
            'rehab': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        data.certificateName = certNames[certType] || certType;
    }

    return data;
}

/**
 * 🔧 NEW: 교재 선택 단계로 이동
 */
function proceedToMaterialSelection(step2Data) {
    console.log('🚀 교재 선택 단계로 이동');

    try {
        // 로딩 표시
        showLoadingMessage('교재 선택 단계로 이동 중...');

        // URL 파라미터 구성
        const params = new URLSearchParams({
            from: 'cert-application',
            step: '2',
            certType: step2Data['cert-type'] || '',
            autoFill: 'true',
            applicationId: step2Data.applicationId
        });

        const targetUrl = window.adjustPath(`pages/education/material-selection.html?${params.toString()}`);

        console.log('📍 이동할 URL:', targetUrl);

        // 성공 메시지 표시
        showSuccessMessage('자격증 신청 정보가 저장되었습니다. 교재 선택 페이지로 이동합니다.');

        // 페이지 이동 (약간의 지연으로 사용자 경험 개선)
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 1500);

    } catch (error) {
        console.error('❌ 교재 선택 단계 이동 오류:', error);
        showErrorMessage('교재 선택 단계로 이동하는 중 오류가 발생했습니다.');
    }
}

/**
 * 🔧 NEW: 플로우 단계 데이터 저장
 */
function saveFlowStepData(stepName, data) {
    console.log(`💾 ${stepName} 단계 데이터 저장`);

    try {
        // 로컬 스토리지에 저장
        const flowData = getFlowData();
        flowData[stepName] = {
            ...data,
            savedAt: new Date().toISOString()
        };

        localStorage.setItem('dhc_flow_data', JSON.stringify(flowData));

        // Firebase에도 저장 (로그인 상태인 경우)
        saveToFirebaseIfLoggedIn(stepName, data);

        console.log('✅ 단계 데이터 저장 완료');

    } catch (error) {
        console.error('❌ 단계 데이터 저장 오류:', error);
    }
}

/**
 * Firebase에 사용자별 진행 상황 저장
 */
async function saveToFirebaseIfLoggedIn(stepName, data) {
    if (!window.dhcFirebase?.auth?.currentUser || !window.dbService) {
        console.log('Firebase 미연동 또는 비로그인 상태');
        return;
    }

    try {
        const userId = window.dhcFirebase.auth.currentUser.uid;
        const docId = `flow_${userId}`;

        const existingResult = await window.dbService.getDocument('flow_progress', docId);

        const progressData = existingResult.success ? existingResult.data : {};
        progressData[stepName] = {
            ...data,
            savedAt: new Date(),
            userId: userId
        };

        let result;
        if (existingResult.success) {
            result = await window.dbService.updateDocument('flow_progress', docId, progressData);
        } else {
            result = await window.dbService.addDocument('flow_progress', progressData, docId);
        }

        if (result.success) {
            console.log('✅ Firebase에 진행 상황 저장 완료');
        } else {
            console.error('❌ Firebase 저장 실패:', result.error);
        }

    } catch (error) {
        console.error('❌ Firebase 저장 오류:', error);
    }
}

// =================================
// 🔧 MODIFIED: 기존 함수들 수정 (결제 기능 제거)
// =================================

/**
 * 🔧 MODIFIED: 간소화된 자격증 정보 표시 (결제 기능 제거)
 */
function initSimpleCertificateInfo() {
    console.log('=== initSimpleCertificateInfo 시작 (결제 기능 제거) ===');
    
    const certTypeSelect = document.getElementById('cert-type');
    const selectedCertName = document.getElementById('selected-cert-name');
    
    if (!certTypeSelect) {
        console.warn('자격증 타입 선택 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 자격증 종류 변경 시 정보 업데이트
    certTypeSelect.addEventListener('change', function() {
        const certNames = {
            'health': '건강운동처방사',
            'rehab': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        
        const selectedName = certNames[this.value] || '자격증을 먼저 선택해주세요';
        if (selectedCertName) {
            selectedCertName.textContent = selectedName;
        }
        
        // 🔧 NEW: 선택된 자격증 정보를 플로우 데이터에 추가
        if (this.value && certNames[this.value]) {
            const currentStep2Data = {
                certificateType: this.value,
                certificateName: certNames[this.value],
                selectedAt: new Date().toISOString()
            };
            
            // 임시로 저장 (폼 제출 시 전체 데이터와 함께 저장됨)
            flowData.step2_partial = currentStep2Data;
        }
        
        console.log('자격증 선택됨:', selectedName);
    });
    
    console.log('=== initSimpleCertificateInfo 완료 (결제 기능 제거) ===');
}

/**
 * 🔧 MODIFIED: 제출 버튼 상태 업데이트 (플로우용)
 */
function updateSubmitButtonState(button, state) {
    const buttonIcon = button.querySelector('.button-icon');
    const buttonText = button.querySelector('.button-text');
    
    switch (state) {
        case 'processing':
            button.disabled = true;
            if (buttonIcon) buttonIcon.textContent = '⏳';
            if (buttonText) buttonText.textContent = '다음 단계 준비 중...';
            break;
            
        case 'error':
            button.disabled = false;
            if (buttonIcon) buttonIcon.textContent = '❌';
            if (buttonText) buttonText.textContent = '다시 시도';
            setTimeout(() => updateSubmitButtonState(button, 'normal'), 3000);
            break;
            
        case 'normal':
        default:
            button.disabled = false;
            if (buttonIcon) buttonIcon.textContent = '➡️';
            if (buttonText) buttonText.textContent = '다음 단계: 교재 선택';
            break;
    }
}

// =================================
// 기존 함수들 유지 (사진 업로드, 유효성 검사 등)
// =================================

// URL 파라미터 처리 함수 (기존 유지)
function handleUrlParameters() {
    console.log('=== URL 파라미터 처리 시작 ===');
    
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
                    optionValue = 'health';
                    certName = '건강운동처방사';
                    break;
                case 'rehab':
                case 'rehabilitation':
                    optionValue = 'rehab';
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
                showNotification(`${certName} 자격증이 자동으로 선택되었습니다.`);
            }, 500);
            
        } else {
            console.error('cert-type 셀렉트 박스를 찾을 수 없습니다');
        }
    } else {
        console.log('cert 파라미터가 없습니다. 기본 상태로 진행합니다.');
    }
    
    console.log('=== URL 파라미터 처리 완료 ===');
}

// 🔧 NEW: 영문명 실시간 검증 초기화
function initEnglishNameValidation() {
    console.log('=== initEnglishNameValidation 시작 ===');
    
    const englishNameInput = document.getElementById('name-english');
    
    if (!englishNameInput) {
        console.warn('영문명 입력 필드를 찾을 수 없습니다.');
        return;
    }
    
            // 실시간 검증 및 포맷팅
    englishNameInput.addEventListener('input', function() {
        let value = this.value;
        
        // 영문, 공백, 점(.)만 허용하고 나머지 문자 제거
        value = value.replace(/[^a-zA-Z\s.]/g, '');
        
        // 연속된 공백을 하나로 변경
        value = value.replace(/\s+/g, ' ');
        
        // 앞뒤 공백 제거 (입력 중에는 뒤쪽 공백만)
        value = value.replace(/^\s+/, '');
        
        this.value = value;
        
        // 실시간 검증
        if (value.length > 0) {
            validateEnglishName(value, this);
        } else {
            clearFieldError(this);
        }
    });
    
    // 포커스 아웃 시 최종 검증
    englishNameInput.addEventListener('blur', function() {
        const value = this.value.trim();
        this.value = value; // 앞뒤 공백 완전 제거
        
        if (value.length > 0) {
            validateEnglishName(value, this);
        }
    });
    
    console.log('=== initEnglishNameValidation 완료 ===');
}

/**
 * 영문명 검증 함수
 */
function validateEnglishName(name, inputElement) {
    // 최소 길이 검사 (2자 이상)
    if (name.length < 2) {
        showFieldError(inputElement, '영문명은 최소 2자 이상 입력해주세요.');
        return false;
    }
    
    // 최대 길이 검사 (50자 이하)
    if (name.length > 50) {
        showFieldError(inputElement, '영문명은 50자 이하로 입력해주세요.');
        return false;
    }
    
    // 영문, 공백, 점만 허용
    const englishNameRegex = /^[a-zA-Z\s.]+$/;
    if (!englishNameRegex.test(name)) {
        showFieldError(inputElement, '영문명은 영문자, 공백, 점(.)만 입력 가능합니다.');
        return false;
    }
    
    // 최소한 하나의 문자 포함
    const hasLetter = /[a-zA-Z]/.test(name);
    if (!hasLetter) {
        showFieldError(inputElement, '영문명에는 최소 하나의 영문자가 포함되어야 합니다.');
        return false;
    }
    
    // 연속된 공백 검사
    const hasConsecutiveSpaces = /\s{2,}/.test(name);
    if (hasConsecutiveSpaces) {
        showFieldError(inputElement, '연속된 공백은 사용할 수 없습니다.');
        return false;
    }
    
    // 시작이나 끝이 공백인지 검사
    if (name.startsWith(' ') || name.endsWith(' ')) {
        showFieldError(inputElement, '영문명의 앞뒤에 공백을 사용할 수 없습니다.');
        return false;
    }
    
    // 일반적인 영문명 패턴 검사 (성+이름 구조 권장)
    const nameParts = name.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length < 2) {
        showFieldError(inputElement, '성과 이름을 모두 입력해주세요 (예: Hong Gil Dong).');
        return false;
    }
    
    // 각 부분이 최소 1자 이상인지 검사
    for (let part of nameParts) {
        if (part.length < 1) {
            showFieldError(inputElement, '성과 이름은 각각 최소 1자 이상이어야 합니다.');
            return false;
        }
    }
    
    clearFieldError(inputElement);
    return true;
}

// 🔧 NEW: 사진 업로드 기능 초기화
function initPhotoUpload() {
    console.log('=== initPhotoUpload 시작 ===');
    
    const photoInput = document.getElementById('photo');
    const photoDropZone = document.querySelector('[data-input="photo"]');
    
    if (!photoInput || !photoDropZone) {
        console.warn('사진 업로드 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 드래그 이벤트 처리
    photoDropZone.addEventListener('dragover', handleDragOver);
    photoDropZone.addEventListener('dragleave', handleDragLeave);
    photoDropZone.addEventListener('drop', handlePhotoDrop);
    
    // 클릭으로 파일 선택
    photoDropZone.addEventListener('click', function() {
        photoInput.click();
    });
    
    // 파일 입력 변경 이벤트
    photoInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handlePhotoSelection(this.files[0]);
        }
    });
    
    console.log('=== initPhotoUpload 완료 ===');
}

// 드래그 오버 처리
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

// 드래그 리브 처리
function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

// 파일 드롭 처리
function handlePhotoDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handlePhotoSelection(files[0]);
    }
}

/**
 * 사진 선택 및 검증 처리
 */
function handlePhotoSelection(file) {
    console.log('선택된 파일:', file);
    
    // 파일 유효성 검사
    const validationResult = validatePhotoFile(file);
    if (!validationResult.isValid) {
        showPhotoError(validationResult.message);
        return;
    }
    
    // 미리보기 표시
    showPhotoPreview(file);
    
    // 파일을 전역 변수에 임시 저장 (실제 업로드는 폼 제출 시)
    uploadedPhotoData = {
        file: file,
        isUploaded: false,
        url: null
    };
    
    console.log('사진 선택 완료, 임시 저장됨');
}

/**
 * 사진 파일 유효성 검사
 */
function validatePhotoFile(file) {
    // 파일 타입 검사
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            message: 'JPG, JPEG, PNG 형식의 이미지 파일만 업로드 가능합니다.'
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
    
    // 최소 크기 검사 (너무 작은 이미지 방지)
    const minSize = 10 * 1024; // 10KB
    if (file.size < minSize) {
        return {
            isValid: false,
            message: '파일이 너무 작습니다. 10KB 이상의 파일을 선택해주세요.'
        };
    }
    
    return { isValid: true };
}

/**
 * 사진 미리보기 표시
 */
function showPhotoPreview(file) {
    const dropZone = document.querySelector('[data-input="photo"]');
    const content = dropZone.querySelector('.file-drop-content');
    
    // FileReader로 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onload = function(e) {
        content.innerHTML = `
            <div class="photo-preview">
                <img src="${e.target.result}" alt="증명사진 미리보기" class="preview-image">
                <div class="photo-info">
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${formatFileSize(file.size)}</p>
                    <p class="success-message">✅ 업로드 준비 완료</p>
                </div>
                <button type="button" class="remove-photo-btn" onclick="removePhoto()">
                    ❌ 제거
                </button>
            </div>
        `;
        
        dropZone.classList.add('file-uploaded');
        clearPhotoError();
    };
    reader.readAsDataURL(file);
}

/**
 * 사진 제거
 */
function removePhoto() {
    const dropZone = document.querySelector('[data-input="photo"]');
    const content = dropZone.querySelector('.file-drop-content');
    const photoInput = document.getElementById('photo');
    
    // UI 원래대로 복원
    content.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p>파일을 끌어다 놓거나 클릭하여 업로드</p>
        <p class="file-info">JPG, PNG (최대 5MB)<br>3.5cm x 4.5cm, 흰 배경</p>
    `;
    
    dropZone.classList.remove('file-uploaded');
    photoInput.value = '';
    uploadedPhotoData = null;
    
    console.log('사진 제거됨');
}

/**
 * 사진 오류 표시
 */
function showPhotoError(message) {
    const dropZone = document.querySelector('[data-input="photo"]');
    
    // 기존 오류 제거
    clearPhotoError();
    
    // 오류 메시지 추가
    const errorDiv = document.createElement('div');
    errorDiv.className = 'photo-error text-red-500 text-sm mt-2';
    errorDiv.textContent = message;
    
    dropZone.parentNode.appendChild(errorDiv);
    dropZone.classList.add('error');
    
    // 3초 후 자동 제거
    setTimeout(clearPhotoError, 3000);
}

/**
 * 사진 오류 제거
 */
function clearPhotoError() {
    const dropZone = document.querySelector('[data-input="photo"]');
    const errorDiv = dropZone.parentNode.querySelector('.photo-error');
    
    if (errorDiv) {
        errorDiv.remove();
    }
    
    dropZone.classList.remove('error');
}

/**
 * 실제 사진 업로드 (Firebase Storage)
 */
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
        
        // 파일 경로 생성 (certificates/photos/신청ID/파일명)
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

/**
 * 사진 업로드 검증
 */
function validatePhotoUpload() {
    const photoInput = document.getElementById('photo');
    
    // 필수 파일 확인
    if (photoInput.hasAttribute('required')) {
        if (!uploadedPhotoData || !uploadedPhotoData.file) {
            showPhotoError('증명사진을 업로드해주세요.');
            return false;
        }
        
        // 다시 한번 파일 유효성 검사
        const validationResult = validatePhotoFile(uploadedPhotoData.file);
        if (!validationResult.isValid) {
            showPhotoError(validationResult.message);
            return false;
        }
    }
    
    return true;
}

// =================================
// 기존 함수들 유지 (폼 검증, 유틸리티 등)
// =================================

/**
 * 폼 유효성 검사 초기화 (영문명 검증 포함)
 */
function initFormValidationWithEnglishName() {
    console.log('=== initFormValidationWithEnglishName 시작 ===');
    const form = document.getElementById('certificate-form');
    if (!form) {
        console.log('certificate-form을 찾을 수 없습니다.');
        return;
    }
    
    const inputs = form.querySelectorAll('input, select, textarea');
    console.log('폼 입력 요소 개수:', inputs.length);

    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateFieldWithEnglishName(this);
        });

        input.addEventListener('input', function () {
            clearFieldError(this);
        });
    });
    
    console.log('=== initFormValidationWithEnglishName 완료 ===');
}

/**
 * 폼 유효성 검사 (영문명 포함)
 */
function validateFormWithEnglishName() {
    console.log('=== validateFormWithEnglishName 시작 ===');
    let isValid = true;

    // 필수 입력 필드 확인
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    console.log('필수 필드 개수:', requiredFields.length);
    
    requiredFields.forEach(field => {
        if (!validateFieldWithEnglishName(field)) {
            isValid = false;
        }
    });

    // 🔧 REMOVED: 결제 방법 선택 확인 제거 (더 이상 필요없음)

    // 첫 번째 에러로 스크롤
    if (!isValid) {
        const firstError = document.querySelector('.field-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    console.log('폼 검증 결과 (영문명 포함):', isValid);
    return isValid;
}

/**
 * 개별 필드 유효성 검사 (영문명 포함)
 */
function validateFieldWithEnglishName(field) {
    if (!field) return false;
    
    const value = field.value.trim();

    // 필수 필드 확인
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, '필수 입력 항목입니다.');
        return false;
    }

    // 한글 이름 검증
    if (field.id === 'name') {
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
            return validateEnglishName(value, field);
        }
    }

    // 전화번호 검증
    if (field.type === 'tel') {
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

// 필드 에러 표시/제거
function showFieldError(field, message) {
    if (!field) return;
    
    clearFieldError(field);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-red-500 text-sm mt-1';
    errorDiv.textContent = message;

    field.classList.add('error');
    
    // 파일 입력 필드의 경우 부모 컨테이너에 에러 표시
    if (field.type === 'file') {
        const dropZone = field.closest('.file-drop-zone');
        if (dropZone) {
            dropZone.parentNode.appendChild(errorDiv);
        }
    } else {
        field.parentNode.appendChild(errorDiv);
    }
}

function clearFieldError(field) {
    if (!field) return;
    
    field.classList.remove('error');
    
    // 일반 필드 에러 제거
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // 파일 입력 필드 에러 제거
    if (field.type === 'file') {
        const dropZone = field.closest('.file-drop-zone');
        if (dropZone) {
            const error = dropZone.parentNode.querySelector('.field-error');
            if (error) {
                error.remove();
            }
        }
    }
}

// 자격증 조회 폼 처리
function initVerifyForm() {
    console.log('=== initVerifyForm 시작 ===');
    const verifyForm = document.getElementById('verify-form');
    
    if (!verifyForm) {
        console.log('verify-form을 찾을 수 없습니다.');
        return;
    }
    
    verifyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const certNumber = document.getElementById('cert-number').value;
        const certDate = document.getElementById('cert-date').value;
        
        if (certNumber && certDate) {
            // 실제 구현 시에는 서버로 데이터 전송 후 결과 처리
            alert('입력하신 정보로 자격증 확인 중입니다.');
            
            // 로딩 상태 표시
            const button = verifyForm.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = '조회 중...';
            
            // 가상의 조회 결과 (실제 구현 시 서버 응답 처리)
            setTimeout(() => {
                button.disabled = false;
                button.textContent = '조회하기';
                
                // 예시 결과 표시
                showVerificationResult({
                    number: certNumber,
                    date: certDate,
                    holder: '홍길동',
                    holderEnglish: 'Hong Gil Dong',
                    type: '건강운동처방사',
                    status: '유효'
                });
            }, 2000);
        }
    });
    
    console.log('=== initVerifyForm 완료 ===');
}

/**
 * 자격증 조회 결과 표시 (영문명 포함)
 */
function showVerificationResult(result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'verification-result mt-6 p-4 bg-green-50 border border-green-200 rounded-md';
    resultDiv.innerHTML = `
        <h3 class="text-lg font-bold text-green-800 mb-2">조회 결과</h3>
        <div class="space-y-1">
            <p><span class="font-medium">자격증 번호:</span> ${result.number}</p>
            <p><span class="font-medium">소지자 (한글):</span> ${result.holder}</p>
            <p><span class="font-medium">소지자 (영문):</span> ${result.holderEnglish}</p>
            <p><span class="font-medium">자격증 종류:</span> ${result.type}</p>
            <p><span class="font-medium">발급일:</span> ${result.date}</p>
            <p><span class="font-medium">상태:</span> <span class="text-green-600 font-bold">${result.status}</span></p>
        </div>
    `;
    
    // 기존 결과 제거
    const existingResult = document.querySelector('.verification-result');
    if (existingResult) {
        existingResult.remove();
    }
    
    // 새 결과 추가
    document.getElementById('verify-form').after(resultDiv);
}

// 전화번호 자동 포맷팅
function initPhoneFormatting() {
    console.log('=== initPhoneFormatting 시작 ===');
    const phoneInput = document.getElementById('phone');
    
    if (!phoneInput) {
        console.log('phone 입력 필드를 찾을 수 없습니다.');
        return;
    }

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
    
    console.log('=== initPhoneFormatting 완료 ===');
}

// 날짜 제한 설정
function setDateLimits() {
    console.log('=== setDateLimits 시작 ===');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 교육 수료일과 시험 합격일은 오늘 이전만 선택 가능
    const completionDate = document.getElementById('course-completion');
    const examDate = document.getElementById('exam-pass');
    
    if (completionDate) {
        completionDate.max = todayStr;
    }
    
    if (examDate) {
        examDate.max = todayStr;
    }
    
    // 생년월일은 18세 이상만 선택 가능
    const birthInput = document.getElementById('birth');
    if (birthInput) {
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
        
        birthInput.max = maxDate.toISOString().split('T')[0];
        birthInput.min = minDate.toISOString().split('T')[0];
    }
    
    console.log('=== setDateLimits 완료 ===');
}

// 모달 처리 초기화
function initModalHandling() {
    console.log('=== initModalHandling 시작 ===');
    
    const modalCloses = document.querySelectorAll('[data-dismiss="modal"]');
    
    // 모달 닫기 버튼
    modalCloses.forEach(close => {
        close.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // 모달 배경 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal:not(.hidden)');
            if (openModal) {
                openModal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        }
    });
    
    console.log('=== initModalHandling 완료 ===');
}

// =================================
// 유틸리티 함수들
// =================================

/**
 * 회원 정보 자동 기입
 */
function autoFillMemberInfo() {
    console.log('👤 회원 정보 자동 기입 시도');

    // Firebase 인증 상태 확인
    if (!window.dhcFirebase?.auth?.currentUser) {
        console.log('비로그인 상태, 자동 기입 건너뛰기');
        return;
    }

    const user = window.dhcFirebase.auth.currentUser;
    console.log('로그인된 사용자:', user.email);

    try {
        // 기본 정보 자동 기입
        const emailInput = document.getElementById('email');
        if (emailInput && !emailInput.value) {
            emailInput.value = user.email;
            console.log('✅ 이메일 자동 기입:', user.email);
        }

        const nameInput = document.getElementById('name');
        if (nameInput && !nameInput.value && user.displayName) {
            nameInput.value = user.displayName;
            console.log('✅ 이름 자동 기입:', user.displayName);
        }

        // Firestore에서 사용자 상세 정보 가져오기
        loadUserDetailInfo(user.uid);

    } catch (error) {
        console.error('회원 정보 자동 기입 오류:', error);
    }
}

/**
 * Firestore에서 사용자 상세 정보 로드
 */
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

            // 상세 정보 자동 기입
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

/**
 * 🔧 NEW: 이전 단계 정보 표시 업데이트
 */
function updatePreviousStepDisplay() {
    console.log('📋 이전 단계 정보 표시 업데이트');
    
    try {
        // 저장된 플로우 데이터 가져오기
        const savedFlowData = getFlowData();
        const step1Data = savedFlowData.step1 || savedFlowData['course-application'];
        
        // DOM 요소들 가져오기
        const prevCourseNameEl = document.getElementById('prev-course-name');
        const prevApplicantNameEl = document.getElementById('prev-applicant-name');
        const prevPhoneEl = document.getElementById('prev-phone');
        const prevEmailEl = document.getElementById('prev-email');
        
        if (step1Data && step1Data.selectedCourseInfo) {
            // 교육과정명 업데이트
            if (prevCourseNameEl) {
                const courseName = step1Data.selectedCourseInfo.title || '선택된 교육과정';
                prevCourseNameEl.textContent = courseName;
                prevCourseNameEl.classList.remove('loading');
                console.log('✅ 교육과정명 업데이트:', courseName);
            }
            
            // 신청자명 업데이트
            if (prevApplicantNameEl) {
                const applicantName = step1Data['applicant-name'] || step1Data.name || '신청자';
                prevApplicantNameEl.textContent = applicantName;
                prevApplicantNameEl.classList.remove('loading');
                console.log('✅ 신청자명 업데이트:', applicantName);
            }
            
            // 연락처 업데이트
            if (prevPhoneEl) {
                const phone = step1Data.phone || '연락처 없음';
                prevPhoneEl.textContent = phone;
                prevPhoneEl.classList.remove('loading');
                console.log('✅ 연락처 업데이트:', phone);
            }
            
            // 이메일 업데이트
            if (prevEmailEl) {
                const email = step1Data.email || '이메일 없음';
                prevEmailEl.textContent = email;
                prevEmailEl.classList.remove('loading');
                console.log('✅ 이메일 업데이트:', email);
            }
            
            console.log('✅ 이전 단계 정보 표시 업데이트 완료');
            
        } else {
            console.log('⚠️ 1단계 데이터가 없어 기본값으로 표시');
            
            // 데이터가 없는 경우 기본값 표시
            if (prevCourseNameEl) {
                prevCourseNameEl.textContent = '교육과정 정보 없음';
                prevCourseNameEl.classList.add('text-gray-500');
            }
            if (prevApplicantNameEl) {
                prevApplicantNameEl.textContent = '신청자 정보 없음';
                prevApplicantNameEl.classList.add('text-gray-500');
            }
            if (prevPhoneEl) {
                prevPhoneEl.textContent = '연락처 정보 없음';
                prevPhoneEl.classList.add('text-gray-500');
            }
            if (prevEmailEl) {
                prevEmailEl.textContent = '이메일 정보 없음';
                prevEmailEl.classList.add('text-gray-500');
            }
        }
        
    } catch (error) {
        console.error('❌ 이전 단계 정보 표시 업데이트 오류:', error);
        
        // 오류 시 에러 메시지 표시
        const elements = [
            document.getElementById('prev-course-name'),
            document.getElementById('prev-applicant-name'),
            document.getElementById('prev-phone'),
            document.getElementById('prev-email')
        ];
        
        elements.forEach(el => {
            if (el) {
                el.textContent = '정보 로드 실패';
                el.classList.add('text-red-500');
            }
        });
    }
}

/**
 * 사용자 데이터로 폼 채우기
 */
function fillUserData(userData) {
    console.log('📝 사용자 데이터로 폼 채우기:', userData);

    const fieldMappings = {
        'name': userData.name || userData.displayName || userData.firstName,
        'phone': userData.phone || userData.phoneNumber,
        'birth': userData.birthDate || userData.dateOfBirth,
        'address': userData.address || userData.streetAddress
    };

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
    }
}

/**
 * 플로우 데이터 가져오기
 */
function getFlowData() {
    try {
        const data = localStorage.getItem('dhc_flow_data');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('플로우 데이터 로드 오류:', error);
        return {};
    }
}

/**
 * 파일 크기 포맷팅
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 알림 표시 함수
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// =================================
// 메시지 및 알림 시스템
// =================================

/**
 * 성공 메시지 표시
 */
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

/**
 * 경고 메시지 표시
 */
function showWarningMessage(message) {
    showMessage(message, 'warning');
}

/**
 * 오류 메시지 표시
 */
function showErrorMessage(message) {
    showMessage(message, 'error');
}

/**
 * 로딩 메시지 표시
 */
function showLoadingMessage(message) {
    showMessage(message, 'loading');
}

/**
 * 토스트 메시지 표시
 */
function showMessage(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        loading: 'bg-blue-500',
        info: 'bg-gray-500'
    };

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        loading: '⏳',
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

    // 자동 제거 (로딩 메시지는 수동으로만 제거)
    if (type !== 'loading') {
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
    }

    return toast;
}

// =================================
// 스타일 추가 (사진 업로드 관련)
// =================================

const photoUploadStyle = document.createElement('style');
photoUploadStyle.textContent = `
    /* 사진 미리보기 스타일 */
    .photo-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        text-align: center;
    }
    
    .preview-image {
        width: 120px;
        height: 160px;
        object-fit: cover;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 1rem;
    }
    
    .photo-info .file-name {
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.25rem;
    }
    
    .photo-info .file-size {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }
    
    .photo-info .success-message {
        font-size: 0.875rem;
        color: #059669;
        font-weight: 600;
    }
    
    .remove-photo-btn {
        background: none;
        border: none;
        color: #dc2626;
        cursor: pointer;
        font-size: 0.875rem;
        padding: 0.5rem;
        border-radius: 4px;
        transition: background-color 0.2s;
        margin-top: 0.5rem;
    }
    
    .remove-photo-btn:hover {
        background-color: rgba(220, 38, 38, 0.1);
    }
    
    /* 사진 업로드 오류 스타일 */
    .photo-error {
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        padding: 0.75rem;
        margin-top: 0.5rem;
    }
    
    .file-drop-zone.error {
        border-color: #dc2626 !important;
        background-color: rgba(220, 38, 38, 0.05) !important;
    }
    
    /* 업로드 완료 상태 */
    .file-uploaded {
        border-color: #10b981 !important;
        background-color: rgba(16, 185, 129, 0.05) !important;
    }
    
    /* 영문명 입력 필드 스타일 */
    #name-english {
        font-family: 'Arial', sans-serif;
    }
    
    #name-english:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    /* 다음 단계 버튼 스타일 */
    .next-step-button {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border: none;
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-size: 1.125rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 280px;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        margin: 0 auto;
    }
    
    .next-step-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
    }
    
    .next-step-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }
`;
document.head.appendChild(photoUploadStyle);

// =================================
// 디버깅 및 개발자 도구 (통합 플로우 버전)
// =================================

if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('.web.app') || 
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {
    
    window.debugCertApplicationFlow = {
        // 기본 정보 확인
        help: function() {
            console.log('🎯 통합 플로우 디버깅 도구 사용법 (2단계: 자격증 신청)');
            console.log('\n📊 데이터 관련:');
            console.log('- checkFlowData() : 현재 플로우 데이터 확인');
            console.log('- loadStep1Data() : 1단계 데이터 강제 로드');
            console.log('- clearFlowData() : 플로우 데이터 삭제');

            console.log('\n📝 폼 관련:');
            console.log('- fillTestData() : 테스트 데이터 자동 입력');
            console.log('- checkValidation() : 유효성 검사 결과');
            console.log('- testEnglishName() : 영문명 검증 테스트');

            console.log('\n📸 사진 관련:');
            console.log('- simulatePhoto() : 사진 업로드 시뮬레이션');
            console.log('- checkPhoto() : 업로드된 사진 확인');
            console.log('- clearPhoto() : 사진 제거');

            console.log('\n🚀 플로우 관련:');
            console.log('- simulateNextStep() : 다음 단계 시뮬레이션');
            console.log('- testFullFlow() : 전체 플로우 테스트');
        },

        // 플로우 데이터 확인
        checkFlowData: function() {
            const data = getFlowData();
            console.log('현재 플로우 데이터:', data);
            
            if (data.step1) {
                console.log('1단계 데이터:', data.step1);
                
                // 🔧 NEW: 이전 단계 정보 표시도 함께 업데이트
                updatePreviousStepDisplay();
            } else {
                console.log('❌ 1단계 데이터 없음');
            }
            
            if (data.step2) {
                console.log('2단계 데이터:', data.step2);
            } else {
                console.log('⏳ 2단계 데이터 없음 (현재 단계)');
            }
            
            return data;
        },

        // 1단계 데이터 강제 로드
        loadStep1Data: function() {
            console.log('📥 1단계 데이터 강제 로드 시뮬레이션');
            
            const mockStep1Data = {
                'applicant-name': '홍길동',
                'phone': '010-1234-5678',
                'email': 'test@example.com',
                'birth-date': '1990-01-01',
                'address': '서울시 강남구 테헤란로 123',
                'selectedCourseId': 'test-health-1',
                'selectedCourseInfo': {
                    id: 'test-health-1',
                    title: '건강운동처방사 기본과정 1기',
                    certificateType: 'health-exercise'
                }
            };
            
            autoFillFromStep1Data(mockStep1Data);
            
            // 🔧 NEW: 이전 단계 정보 표시도 업데이트
            updatePreviousStepDisplay();
            
            console.log('✅ 1단계 데이터 로드 완료');
        },

        // 플로우 데이터 삭제
        clearFlowData: function() {
            localStorage.removeItem('dhc_flow_data');
            console.log('✅ 플로우 데이터 삭제 완료');
        },

        // 테스트 데이터 입력
        fillTestData: function() {
            console.log('📝 테스트 데이터 입력 시작');
            
            const fields = {
                'cert-type': 'health',
                'name': '홍길동',
                'name-english': 'Hong Gil Dong',
                'birth': '1990-01-01',
                'phone': '010-1234-5678',
                'email': 'test@example.com',
                'address': '서울시 강남구 테헤란로 123',
                'course-completion': '2024-12-15',
                'exam-pass': '2025-01-15'
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

            // 필수 약관 동의
            const agreements = ['agree-terms', 'agree-refund'];
            agreements.forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.checked = true;
                    console.log(`✅ ${id} 동의됨`);
                }
            });

            console.log('🎯 테스트 데이터 입력 완료!');
        },

        // 유효성 검사 확인
        checkValidation: function() {
            console.log('🔍 폼 유효성 검사 결과:');
            
            const form = document.getElementById('certificate-form');
            if (!form) {
                console.log('❌ 폼을 찾을 수 없습니다.');
                return;
            }

            // 필수 필드 체크
            const requiredFields = [
                { id: 'cert-type', label: '자격증 종류' },
                { id: 'name', label: '한글 이름' },
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
            console.log(`\n사진 업로드: ${uploadedPhotoData ? '✅' : '❌'}`);
            if (uploadedPhotoData) {
                console.log(`  파일명: ${uploadedPhotoData.file.name}`);
                console.log(`  크기: ${formatFileSize(uploadedPhotoData.file.size)}`);
            }

            // 약관 동의 체크
            const agreements = ['agree-terms', 'agree-refund'];
            console.log(`\n약관 동의:`);
            agreements.forEach(id => {
                const checkbox = document.getElementById(id);
                console.log(`${checkbox && checkbox.checked ? '✅' : '❌'} ${id}`);
            });
        },

        // 영문명 검증 테스트
        testEnglishName: function() {
            const englishNameInput = document.getElementById('name-english');
            if (!englishNameInput) {
                console.log('❌ 영문명 입력 필드를 찾을 수 없습니다.');
                return;
            }
            
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
                const result = validateEnglishName(testCase.value, englishNameInput);
                const status = result === testCase.expected ? '✅' : '❌';
                console.log(`${index + 1}. ${status} "${testCase.value}" - ${testCase.description}`);
            });
            
            // 입력 필드 초기화
            englishNameInput.value = '';
            clearFieldError(englishNameInput);
        },

        // 사진 업로드 시뮬레이션
        simulatePhoto: function() {
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
            
            canvas.toBlob(function(blob) {
                const file = new File([blob], 'test-photo.jpg', { type: 'image/jpeg' });
                handlePhotoSelection(file);
                console.log('✅ 가상 사진 업로드 시뮬레이션 완료');
            }, 'image/jpeg');
        },

        // 업로드된 사진 확인
        checkPhoto: function() {
            console.log('📸 업로드된 사진 확인:');
            if (uploadedPhotoData) {
                console.log('파일명:', uploadedPhotoData.file.name);
                console.log('크기:', formatFileSize(uploadedPhotoData.file.size));
                console.log('타입:', uploadedPhotoData.file.type);
                console.log('업로드 상태:', uploadedPhotoData.isUploaded ? '완료' : '대기중');
            } else {
                console.log('❌ 업로드된 사진이 없습니다.');
            }
        },

        // 사진 제거
        clearPhoto: function() {
            if (typeof removePhoto === 'function') {
                removePhoto();
                console.log('✅ 사진 제거 완료');
            } else {
                console.log('❌ 사진 제거 함수를 찾을 수 없습니다.');
            }
        },

        // 다음 단계 시뮬레이션
        simulateNextStep: function() {
            console.log('🚀 다음 단계 시뮬레이션');
            
            // 테스트 데이터 입력
            this.fillTestData();
            
            // 사진 업로드 시뮬레이션
            setTimeout(() => {
                this.simulatePhoto();
                
                // 잠시 후 다음 단계 진행
                setTimeout(() => {
                    const submitButton = document.getElementById('apply-button');
                    if (submitButton) {
                        console.log('📤 다음 단계 버튼 클릭 시뮬레이션');
                        submitButton.click();
                    }
                }, 1000);
            }, 500);
        },

        // 전체 플로우 테스트
        testFullFlow: function() {
            console.log('🧪 전체 플로우 테스트 시작');
            
            // 1단계: 플로우 데이터 확인
            console.log('\n1️⃣ 플로우 데이터 확인');
            this.checkFlowData();
            
            // 2단계: 1단계 데이터 로드
            console.log('\n2️⃣ 1단계 데이터 로드');
            this.loadStep1Data();
            
            // 3단계: 추가 데이터 입력
            console.log('\n3️⃣ 추가 데이터 입력');
            setTimeout(() => {
                this.fillTestData();
                
                // 4단계: 사진 업로드
                console.log('\n4️⃣ 사진 업로드');
                setTimeout(() => {
                    this.simulatePhoto();
                    
                    // 5단계: 유효성 검사
                    console.log('\n5️⃣ 유효성 검사');
                    setTimeout(() => {
                        this.checkValidation();
                        
                        console.log('\n🎯 모든 준비 완료! "다음 단계: 교재 선택" 버튼을 눌러 테스트하세요.');
                    }, 500);
                }, 1000);
            }, 500);
        }
    };
    
    console.log('🔧 cert-application.js 통합 플로우 디버깅 도구 활성화됨');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🎯 주요 디버깅 함수들:');
    console.log('📊 데이터: checkFlowData(), loadStep1Data(), clearFlowData()');
    console.log('📝 폼: fillTestData(), checkValidation(), testEnglishName()');
    console.log('📸 사진: simulatePhoto(), checkPhoto(), clearPhoto()');
    console.log('🚀 플로우: simulateNextStep(), testFullFlow()');
    console.log('\n💡 도움말: window.debugCertApplicationFlow.help()');
    console.log('🧪 빠른 시작: window.debugCertApplicationFlow.testFullFlow()');

} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
}

// =================================
// 최종 완료 메시지
// =================================

console.log('\n🎉 === cert-application.js 통합 플로우 버전 완료 ===');
console.log('✅ 이전 단계 데이터 연동 완료');
console.log('✅ 결제 기능 제거, 다음 단계 이동으로 변경');
console.log('✅ 영문명 + 사진 업로드 기능 유지');
console.log('✅ 교재 선택 단계로 이동하는 플로우 구현');
console.log('✅ 회원 정보 자동 기입 기능');
console.log('✅ Firebase 연동 진행 상황 저장');
console.log('✅ 포괄적인 유효성 검사');
console.log('✅ 향상된 사용자 경험 (로딩, 메시지 등)');
console.log('✅ 통합 플로우 디버깅 도구');
console.log('\n🔧 Phase 2-B-1 완료: 자격증 신청 → 교재 선택 플로우');
console.log('🚀 다음은 material-selection.html 및 payment-integration.html 생성');

// 완료 플래그 설정
window.certApplicationFlowReady = true;

// =================================
// 🔧 추가: 페이지 로드 완료 후 자동 실행
// =================================

// 페이지 완전 로드 후 이전 단계 정보 업데이트 보장
setTimeout(() => {
    console.log('🔄 페이지 로드 완료 후 이전 단계 정보 자동 업데이트 시도');
    if (typeof updatePreviousStepDisplay === 'function') {
        updatePreviousStepDisplay();
    }
}, 2000);