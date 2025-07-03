/**
 * course-application.js - 통합 플로우 버전
 * 교육 과정 신청 페이지 - 4단계 통합 플로우의 첫 번째 단계
 * Phase 2-B: 통합 결제 플로우 구현
 */

console.log('=== course-application.js 통합 플로우 버전 로드됨 ===');

// 🔧 의존성 체크 시스템
function checkDependencies() {
    const requiredUtils = [
        { name: 'window.formatters', path: 'formatters.js' },
        { name: 'window.dateUtils', path: 'date-utils.js' }
    ];

    const missing = [];

    requiredUtils.forEach(util => {
        if (!eval(util.name)) {
            missing.push(util);
        }
    });

    if (missing.length > 0) {
        console.error('⚠️ 필수 유틸리티가 로드되지 않음:', missing.map(m => m.path));
        console.log('📝 HTML에서 다음 스크립트들이 먼저 로드되어야 합니다:');
        missing.forEach(m => {
            console.log(`   <script src="{basePath}assets/js/utils/${m.path}"></script>`);
        });
        return false;
    }

    console.log('✅ 모든 필수 유틸리티 로드 확인됨');

    // 🔧 추가: formatters 함수들이 실제로 작동하는지 테스트
    try {
        const testDate = new Date();
        const testFormatDate = window.formatters.formatDate(testDate, 'YYYY.MM.DD');
        const testFormatCurrency = window.formatters.formatCurrency(350000);

        console.log('✅ formatters.formatDate 테스트 성공:', testFormatDate);
        console.log('✅ formatters.formatCurrency 테스트 성공:', testFormatCurrency);

        if (!testFormatDate || !testFormatCurrency) {
            throw new Error('포맷터 함수 결과가 유효하지 않습니다.');
        }

    } catch (error) {
        console.error('❌ 유틸리티 함수 테스트 실패:', error);
        return false;
    }

    return true;
}

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initCourseApplicationFlow();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initCourseApplicationFlow();
    }
}

// 초기화 시작
initializeWhenReady();

// 🔧 NEW: 통합 플로우 페이지 초기화 함수
function initCourseApplicationFlow() {
    console.log('=== initCourseApplicationFlow 실행 시작 ===');

    try {
        // 의존성 체크 먼저 실행
        if (!checkDependencies()) {
            console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
            showDependencyError();
            return;
        }

        // 기본 UI 기능들
        initScrollAnimations();
        initSmoothScroll();

        // 교육 일정 및 과정 선택 기능
        loadScheduleData();
        initDynamicCourseSelection();

        // 통합 플로우 관련 기능들
        initFlowForm();
        initFlowNavigation();
        initTemporarySave();
        initCourseSelectionSync();

        // 기본 폼 기능들
        initBasicFormValidation();
        initPhoneFormatting();
        initEmailValidation();

        // 🔧 IMPROVED: Firebase 인증 완료 후 회원정보 자동기입
        setTimeout(() => {
            autoFillMemberInfo();
        }, 2000); // 2초 후 실행

        console.log('=== initCourseApplicationFlow 완료 ===');
    } catch (error) {
        console.error('페이지 초기화 중 오류:', error);
    }
}

// =================================
// 🔧 NEW: 통합 플로우 관련 기능들
// =================================

/**
 * 플로우 폼 초기화
 */
function initFlowForm() {
    console.log('📋 통합 플로우 폼 초기화');

    const form = document.getElementById('application-form');
    if (!form) return;

    // 폼 제출 시 다음 단계로 이동
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleNextStepSubmission();
    });

    // 회원 정보 자동 기입 (로그인 상태인 경우)
    autoFillMemberInfo();
}

/**
 * 플로우 네비게이션 초기화
 */
function initFlowNavigation() {
    console.log('🔄 플로우 네비게이션 초기화');

    // 다음 단계 버튼
    const nextStepButton = document.getElementById('next-step-button');
    if (nextStepButton) {
        nextStepButton.addEventListener('click', function (e) {
            e.preventDefault();
            handleNextStepSubmission();
        });
    }

    // 임시 저장 버튼
    const saveDraftButton = document.getElementById('save-draft-button');
    if (saveDraftButton) {
        saveDraftButton.addEventListener('click', function (e) {
            e.preventDefault();
            handleTemporarySave();
        });
    }
}

/**
 * 임시 저장 기능 초기화
 */
function initTemporarySave() {
    console.log('💾 임시 저장 기능 초기화');

    // 5분마다 자동 임시 저장 (선택사항)
    setInterval(() => {
        if (isFormModified()) {
            autoSaveFormData();
        }
    }, 5 * 60 * 1000); // 5분

    // 페이지 이탈 시 자동 저장
    window.addEventListener('beforeunload', function (e) {
        if (isFormModified()) {
            autoSaveFormData();
        }
    });

    // 저장된 데이터 복원 시도
    restoreSavedData();
}

/**
 * 과정 선택과 요약 정보 동기화
 */
function initCourseSelectionSync() {
    console.log('🔗 과정 선택 동기화 초기화');

    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) return;

    courseSelect.addEventListener('change', function () {
        updateApplicationSummary();
    });
}

/**
 * 🔧 NEW: 다음 단계 제출 처리
 */
function handleNextStepSubmission() {
    console.log('📤 다음 단계 제출 처리 시작');

    try {
        // 폼 유효성 검사
        if (!validateFlowForm()) {
            return;
        }

        // 폼 데이터 수집
        const formData = collectFlowFormData();
        console.log('수집된 폼 데이터:', formData);

        // 임시 저장
        saveFlowStepData('step1', formData);

        // 다음 단계로 이동
        proceedToNextStep(formData);

    } catch (error) {
        console.error('다음 단계 제출 처리 오류:', error);
        showErrorMessage('신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

/**
 * 🔧 NEW: 임시 저장 처리
 */
function handleTemporarySave() {
    console.log('💾 임시 저장 처리');

    try {
        const formData = collectFlowFormData();

        saveFlowStepData('step1', formData);

        showSuccessMessage('신청 정보가 임시 저장되었습니다.');

        // 저장 버튼 UI 업데이트
        updateSaveButtonUI();

    } catch (error) {
        console.error('임시 저장 오류:', error);
        showErrorMessage('임시 저장 중 오류가 발생했습니다.');
    }
}

/**
 * 🔧 NEW: 플로우 폼 데이터 수집
 */
function collectFlowFormData() {
    const form = document.getElementById('application-form');
    if (!form) return {};

    const formData = new FormData(form);
    const data = {
        step: 1,
        stepName: 'course-application',
        timestamp: new Date().toISOString()
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

    // 🔧 NEW: 선택된 과정의 상세 정보 추가
    const courseSelect = document.getElementById('course-select');
    if (courseSelect && courseSelect.value && window.availableCourses) {
        const selectedCourse = window.availableCourses.find(course => course.id === courseSelect.value);
        if (selectedCourse) {
            data.selectedCourseId = courseSelect.value;
            data.selectedCourseInfo = selectedCourse;

            // 🔧 NEW: 가격 정보 포함
            data.pricingInfo = extractPricingInfo(selectedCourse);

            console.log('📊 수집된 가격 정보:', data.pricingInfo);
        }
    }

    return data;
}

/**
 * 🔧 NEW: 플로우 폼 유효성 검사
 */
function validateFlowForm() {
    console.log('🔍 플로우 폼 유효성 검사');

    let isValid = true;
    const errors = [];

    // 과정 선택 검사
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect || !courseSelect.value) {
        isValid = false;
        errors.push('교육 과정을 선택해주세요.');
        highlightFieldError(courseSelect);
    }

    // 필수 필드 검사
    const requiredFields = [
        { id: 'applicant-name', label: '이름' },
        { id: 'phone', label: '연락처' },
        { id: 'email', label: '이메일' }
    ];

    requiredFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input || !input.value.trim()) {
            isValid = false;
            errors.push(`${field.label}을(를) 입력해주세요.`);
            highlightFieldError(input);
        } else {
            clearFieldError(input);
        }
    });

    // 개인정보 동의 검사
    const privacyAgree = document.getElementById('agree-privacy');
    if (!privacyAgree || !privacyAgree.checked) {
        isValid = false;
        errors.push('개인정보 수집 및 이용에 동의해주세요.');
        highlightFieldError(privacyAgree);
    }

    // 이메일 형식 검사
    const emailInput = document.getElementById('email');
    if (emailInput && emailInput.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            isValid = false;
            errors.push('올바른 이메일 형식을 입력해주세요.');
            highlightFieldError(emailInput);
        }
    }

    // 전화번호 형식 검사
    const phoneInput = document.getElementById('phone');
    if (phoneInput && phoneInput.value.trim()) {
        const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
        if (!phoneRegex.test(phoneInput.value)) {
            isValid = false;
            errors.push('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
            highlightFieldError(phoneInput);
        }
    }

    // 오류 메시지 표시
    if (!isValid) {
        showValidationErrors(errors);
    }

    return isValid;
}

/**
 * 🔧 NEW: 다음 단계로 진행
 */
function proceedToNextStep(formData) {
    console.log('🚀 다음 단계로 진행');

    try {
        // 로딩 표시
        showLoadingMessage('다음 단계로 이동 중...');

        // URL 파라미터 구성
        const params = new URLSearchParams({
            from: 'course-application',
            step: '1',
            courseId: formData.selectedCourseId || '',
            autoFill: 'true'
        });

        // 자격증 타입 매핑
        if (formData.selectedCourseInfo) {
            const certTypeMapping = {
                'health-exercise': 'health',
                'rehabilitation': 'rehab',
                'pilates': 'pilates',
                'recreation': 'recreation'
            };

            const certType = certTypeMapping[formData.selectedCourseInfo.certificateType] ||
                formData.selectedCourseInfo.certificateType;
            params.set('certType', certType);
        }

        const targetUrl = window.adjustPath(`pages/education/cert-application.html?${params.toString()}`);

        console.log('📍 이동할 URL:', targetUrl);

        // 성공 메시지 표시
        showSuccessMessage('교육 신청 정보가 저장되었습니다. 자격증 신청 페이지로 이동합니다.');

        // 페이지 이동 (약간의 지연으로 사용자 경험 개선)
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 1500);

    } catch (error) {
        console.error('❌ 다음 단계 진행 오류:', error);
        showErrorMessage('다음 단계로 이동하는 중 오류가 발생했습니다.');
    }
}

/**
 * 🔧 NEW: 플로우 단계 데이터 저장
 */
function saveFlowStepData(stepName, data) {
    console.log(`💾 ${stepName} 단계 데이터 저장`);

    try {
        // 로컬 스토리지에 저장 (임시)
        const flowData = getFlowData();
        flowData[stepName] = {
            ...data,
            savedAt: new Date().toISOString()
        };

        localStorage.setItem('dhc_flow_data', JSON.stringify(flowData));

        // 🔧 NEW: Firebase에도 저장 (로그인 상태인 경우)
        saveToFirebaseIfLoggedIn(stepName, data);

        console.log('✅ 단계 데이터 저장 완료');

    } catch (error) {
        console.error('❌ 단계 데이터 저장 오류:', error);
    }
}

/**
 * 🔧 NEW: Firebase에 사용자별 진행 상황 저장
 */
async function saveToFirebaseIfLoggedIn(stepName, data) {
    if (!window.dhcFirebase?.auth?.currentUser || !window.dbService) {
        console.log('Firebase 미연동 또는 비로그인 상태');
        return;
    }

    try {
        const userId = window.dhcFirebase.auth.currentUser.uid;
        const docId = `flow_${userId}`;

        // 🔧 FIX: setDocument 대신 addDocument/updateDocument 사용
        const existingResult = await window.dbService.getDocument('flow_progress', docId);

        const progressData = existingResult.success ? existingResult.data : {};
        progressData[stepName] = {
            ...data,
            savedAt: new Date(),
            userId: userId
        };

        let result;
        if (existingResult.success) {
            // 기존 문서가 있으면 업데이트
            result = await window.dbService.updateDocument('flow_progress', docId, progressData);
        } else {
            // 새 문서 생성
            result = await window.dbService.addDocument('flow_progress', progressData, docId);
        }

        if (result.success) {
            console.log('✅ Firebase에 진행 상황 저장 완료');
        } else {
            console.error('❌ Firebase 저장 실패:', result.error);
        }

    } catch (error) {
        console.error('❌ Firebase 저장 오류:', error);
        // Firebase 오류는 무시하고 계속 진행 (로컬 저장은 여전히 작동)
        console.log('💾 로컬 저장으로 계속 진행합니다.');
    }
}

/**
 * 저장된 데이터 복원
 */
function restoreSavedData() {
    console.log('🔄 저장된 데이터 복원 시도');

    try {
        const flowData = getFlowData();
        const step1Data = flowData.step1 || flowData['course-application'];

        if (step1Data && isSignificantData(step1Data)) {
            console.log('💾 저장된 데이터 발견:', step1Data);

            // 🔧 FIX: 더 나은 사용자 경험을 위한 Toast 메시지로 변경
            showDataRestoreOption(step1Data);
        }

    } catch (error) {
        console.error('데이터 복원 오류:', error);
    }
}

/**
 * 🔧 NEW: 의미 있는 데이터인지 확인
 */
function isSignificantData(data) {
    // 기본 정보가 모두 입력된 경우만 복원 제안
    return data['applicant-name'] && data.phone && data.email && data.selectedCourseId;
}

function showDataRestoreOption(data) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 99999;
        max-width: 400px;
        background: white;
        border: 2px solid #3b82f6;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        padding: 0;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;

    toast.innerHTML = `
        <div class="p-4">
            <div class="flex items-center mb-3">
                <span class="text-2xl mr-3">💾</span>
                <h4 class="font-bold text-gray-800">이전 작성 내용 발견</h4>
            </div>
            <p class="text-gray-600 text-sm mb-4">
                이전에 작성하던 신청서가 있습니다.<br>
                <strong>${data['applicant-name']}</strong>님의 <strong>${data.selectedCourseInfo?.title || '과정'}</strong> 신청서입니다.
            </p>
            <div class="flex gap-2">
                <button onclick="window.restoreAndContinue()" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    복원하기
                </button>
                <button onclick="window.startFresh()" class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300">
                    새로 작성
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(toast);

    // 애니메이션
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 500);

    // 전역 함수로 등록
    window.restoreAndContinue = () => {
        restoreFormFields(data);
        showSuccessMessage('이전 작성 내용이 복원되었습니다.');
        toast.remove();
    };

    window.startFresh = () => {
        clearSavedFlowData();
        showSuccessMessage('새로운 신청서로 시작합니다.');
        toast.remove();
    };

    // 30초 후 자동 숨김
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
    }, 30000);
}

/**
 * 🔧 NEW: 저장된 플로우 데이터 삭제
 */
function clearSavedFlowData() {
    try {
        localStorage.removeItem('dhc_flow_data');
        console.log('✅ 저장된 플로우 데이터 삭제 완료');
    } catch (error) {
        console.error('저장된 데이터 삭제 오류:', error);
    }
}

/**
 * 폼 필드 복원
 */
function restoreFormFields(data) {
    console.log('📝 폼 필드 복원');

    Object.keys(data).forEach(key => {
        const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);

        if (element) {
            if (element.type === 'checkbox') {
                element.checked = data[key];
            } else if (element.type !== 'submit' && element.type !== 'button') {
                element.value = data[key];
            }
        }
    });

    // 과정 선택 복원
    if (data.selectedCourseId) {
        setTimeout(() => {
            selectCourseById(data.selectedCourseId);
        }, 1000);
    }
}

// =================================
// 교육 일정 로딩 기능들 (기존 코드 유지)
// =================================

/**
 * Firebase에서 교육 일정 데이터 로드
 */
async function loadScheduleData() {
    console.log('=== loadScheduleData 시작 ===');

    const loadingEl = document.getElementById('schedule-loading');
    const errorEl = document.getElementById('schedule-error');
    const containerEl = document.getElementById('schedule-container');
    const emptyEl = document.getElementById('schedule-empty');

    try {
        // 로딩 상태 표시
        showLoadingState();

        let courses = [];

        // Firebase 연동 확인
        if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
            console.log('Firebase 연동됨, 실제 데이터 로드 시작');

            const result = await window.dbService.getDocuments('courses');

            if (result.success) {
                courses = result.data;
                console.log('Firebase에서 로드된 교육 과정 수:', courses.length);

                // 클라이언트에서 정렬 처리
                courses.sort((a, b) => {
                    const typeOrder = ['health-exercise', 'rehabilitation', 'pilates', 'recreation'];
                    const typeA = typeOrder.indexOf(a.certificateType) !== -1 ? typeOrder.indexOf(a.certificateType) : 999;
                    const typeB = typeOrder.indexOf(b.certificateType) !== -1 ? typeOrder.indexOf(b.certificateType) : 999;

                    if (typeA !== typeB) {
                        return typeA - typeB;
                    }

                    const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
                    const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);

                    return dateA.getTime() - dateB.getTime();
                });

            } else {
                console.error('Firebase 데이터 로드 실패:', result.error);
                throw new Error(result.error.message || 'Firebase 데이터 로드 실패');
            }
        } else {
            console.log('Firebase 미연동, 테스트 데이터 사용');
            courses = getTestScheduleData();
        }

        if (courses.length === 0) {
            showEmptyState();
            return;
        }

        renderScheduleTable(courses);
        showScheduleContainer();
        initScheduleTableInteractions();

        console.log('=== loadScheduleData 완료 ===');

    } catch (error) {
        console.error('교육 일정 로드 오류:', error);

        if (error.message && error.message.includes('index')) {
            console.log('🔧 Firebase 인덱스 오류 감지, 테스트 데이터로 폴백');

            try {
                const testCourses = getTestScheduleData();
                renderScheduleTable(testCourses);
                showScheduleContainer();
                initScheduleTableInteractions();

                showWarningMessage('Firebase 인덱스 설정 중입니다. 임시로 테스트 데이터를 표시합니다.');

                return;
            } catch (fallbackError) {
                console.error('테스트 데이터 폴백 실패:', fallbackError);
            }
        }

        showErrorState();
    }
}

/**
 * 교육 일정 테이블 렌더링
 */
function renderScheduleTable(courses) {
    console.log('=== renderScheduleTable 시작, 과정 수:', courses.length);

    const tbody = document.getElementById('schedule-table-body');
    if (!tbody) {
        console.error('schedule-table-body를 찾을 수 없습니다!');
        return;
    }

    let html = '';

    courses.forEach(course => {
        try {
            // 교육 날짜 (Firebase에서 가져옴)
            const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
            const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);

            // ✅ 신청 날짜 (Firebase에서 직접 가져옴)
            let applyStartDate, applyEndDate;

            if (course.applyStartDate && course.applyEndDate) {
                applyStartDate = course.applyStartDate?.toDate ? course.applyStartDate.toDate() : new Date(course.applyStartDate);
                applyEndDate = course.applyEndDate?.toDate ? course.applyEndDate.toDate() : new Date(course.applyEndDate);
                console.log('Firebase 신청기간 사용:', course.title, applyStartDate, '~', applyEndDate);
            } else {
                applyStartDate = new Date(startDate);
                applyStartDate.setDate(applyStartDate.getDate() - 30);
                applyEndDate = new Date(startDate);
                applyEndDate.setDate(applyEndDate.getDate() - 7);
                console.warn('신청기간 없음, 기본값 사용:', course.title);
            }

            // 🔧 전역 유틸리티 사용
            const formatDate = (date) => {
                return window.formatters.formatDate(date, 'YYYY.MM.DD');
            };

            // 현재 날짜 기준 상태 계산
            const now = new Date();
            let status = 'upcoming';
            let statusText = '준비중';
            let statusClass = 'status-upcoming';

            console.log(`${course.title} 상태 계산:`, {
                now: formatDate(now),
                applyStart: formatDate(applyStartDate),
                applyEnd: formatDate(applyEndDate),
                courseStart: formatDate(startDate),
                adminStatus: course.status
            });

            // 관리자 설정 상태 우선 적용
            if (course.status === 'active') {
                console.log(`${course.title}: 관리자가 모집중으로 설정`);

                if (now >= applyStartDate && now <= applyEndDate) {
                    const enrolledCount = course.enrolledCount || 0;
                    const capacity = course.capacity || 30;

                    if (enrolledCount >= capacity) {
                        status = 'closed';
                        statusText = '마감';
                        statusClass = 'status-closed';
                    } else if (enrolledCount >= capacity * 0.8) {
                        status = 'urgent';
                        statusText = '마감임박';
                        statusClass = 'status-urgent';
                    } else {
                        status = 'available';
                        statusText = '모집중';
                        statusClass = 'status-available';
                    }
                } else if (now < applyStartDate) {
                    status = 'available';
                    statusText = '모집중';
                    statusClass = 'status-available';
                } else if (now > applyEndDate) {
                    status = 'closed';
                    statusText = '마감';
                    statusClass = 'status-closed';
                }
            } else if (course.status === 'preparing') {
                status = 'upcoming';
                statusText = '준비중';
                statusClass = 'status-upcoming';
            } else if (course.status === 'closed') {
                status = 'closed';
                statusText = '마감';
                statusClass = 'status-closed';
            } else if (course.status === 'completed') {
                status = 'completed';
                statusText = '종료';
                statusClass = 'status-completed';
            } else {
                // 관리자 상태가 없거나 명확하지 않은 경우 날짜 기준 계산
                if (now < applyStartDate) {
                    status = 'upcoming';
                    statusText = '준비중';
                    statusClass = 'status-upcoming';
                } else if (now >= applyStartDate && now <= applyEndDate) {
                    const enrolledCount = course.enrolledCount || 0;
                    const capacity = course.capacity || 30;

                    if (enrolledCount >= capacity) {
                        status = 'closed';
                        statusText = '마감';
                        statusClass = 'status-closed';
                    } else if (enrolledCount >= capacity * 0.8) {
                        status = 'urgent';
                        statusText = '마감임박';
                        statusClass = 'status-urgent';
                    } else {
                        status = 'available';
                        statusText = '모집중';
                        statusClass = 'status-available';
                    }
                } else if (now > applyEndDate && now < startDate) {
                    status = 'closed';
                    statusText = '마감';
                    statusClass = 'status-closed';
                } else {
                    status = 'completed';
                    statusText = '종료';
                    statusClass = 'status-completed';
                }
            }

            console.log(`${course.title} 최종 상태:`, statusText);

            const year = startDate.getFullYear();
            const month = startDate.getMonth() + 1;
            const period = month <= 6 ? '상반기' : '하반기';
            const coursePeriod = `${year.toString().slice(-2)}년 ${period}`;

            const getCertificateName = (type) => {
                const names = {
                    'health-exercise': '건강운동처방사',
                    'rehabilitation': '운동재활전문가',
                    'pilates': '필라테스 전문가',
                    'recreation': '레크리에이션지도자'
                };
                return names[type] || type;
            };

            // 🔧 UPDATED: "신청하기" → "선택하기"로 변경
            const canApply = (status === 'available' || status === 'urgent');
            const selectButton = canApply
                ? `<a href="#course-selection" class="select-btn" data-course-id="${course.id}" data-course-name="${getCertificateName(course.certificateType)}" data-course-period="${coursePeriod}">선택하기</a>`
                : '-';

            html += `
                <tr class="schedule-row" data-course-id="${course.id}">
                    <td class="course-name">${getCertificateName(course.certificateType)}</td>
                    <td>${coursePeriod}</td>
                    <td>${formatDate(startDate)} ~ ${formatDate(endDate)}</td>
                    <td>${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}</td>
                    <td>${course.capacity || 30}명</td>
                    <td>${course.enrolledCount || 0}명</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${selectButton}</td>
                </tr>
            `;

        } catch (error) {
            console.error('과정 렌더링 오류:', course, error);
        }
    });

    tbody.innerHTML = html;
    console.log('=== renderScheduleTable 완료 ===');
}

/**
 * 테이블 인터랙션 초기화
 */
function initScheduleTableInteractions() {
    console.log('=== initScheduleTableInteractions 시작 ===');

    const scheduleRows = document.querySelectorAll('.schedule-row');

    scheduleRows.forEach(row => {
        row.addEventListener('mouseenter', function () {
            if (window.innerWidth > 768) {
                row.style.transform = 'translateX(4px)';
                row.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                row.style.transition = 'all 0.3s ease';
            }
        });

        row.addEventListener('mouseleave', function () {
            row.style.transform = 'translateX(0)';
            row.style.boxShadow = 'none';
        });

        // 🔧 UPDATED: "신청하기" → "선택하기" 버튼 처리
        const selectBtn = row.querySelector('.select-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', function (e) {
                e.preventDefault();

                const courseId = this.getAttribute('data-course-id');
                const courseName = this.getAttribute('data-course-name');
                const coursePeriod = this.getAttribute('data-course-period');

                console.log('과정 선택 클릭:', { courseId, courseName, coursePeriod });

                if (courseId) {
                    selectCourseById(courseId);
                } else {
                    selectCourseByNameAndPeriod(courseName, coursePeriod);
                }

                scrollToCourseSelection();

                showSuccessMessage(`${courseName} ${coursePeriod} 과정이 선택되었습니다.`);
            });
        }
    });

    console.log('=== initScheduleTableInteractions 완료 ===');
}

// =================================
// 동적 과정 선택 기능들 (기존 코드 유지)
// =================================

/**
 * 동적 과정 선택 초기화
 */
async function initDynamicCourseSelection() {
    console.log('=== initDynamicCourseSelection 시작 ===');

    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다!');
        return;
    }

    try {
        courseSelect.innerHTML = '<option value="">과정 데이터 로딩 중...</option>';
        courseSelect.disabled = true;

        let courses = [];

        if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
            console.log('Firebase에서 교육 과정 옵션 로드 시작');

            const result = await window.dbService.getDocuments('courses');

            if (result.success) {
                courses = result.data;
                console.log('Firebase에서 로드된 교육 과정 수:', courses.length);
            } else {
                console.error('Firebase 교육 과정 로드 실패:', result.error);
                throw new Error('Firebase 데이터 로드 실패');
            }
        } else {
            console.log('Firebase 미연동, 테스트 과정 데이터 사용');
            courses = getTestCourseData();
        }

        await populateCourseOptions(courses);

        courseSelect.addEventListener('change', function () {
            handleCourseSelection(this.value);
        });

        courseSelect.disabled = false;
        window.availableCourses = courses;

        console.log('=== initDynamicCourseSelection 완료 ===');

    } catch (error) {
        console.error('동적 과정 선택 초기화 오류:', error);

        console.log('폴백: 테스트 과정 데이터 사용');
        const testCourses = getTestCourseData();
        await populateCourseOptions(testCourses);

        courseSelect.disabled = false;
        window.availableCourses = testCourses;

        showWarningMessage('과정 데이터를 불러오는 중 오류가 발생했습니다. 테스트 데이터를 표시합니다.');
    }
}

/**
 * 과정 데이터를 select 옵션으로 변환
 */
async function populateCourseOptions(courses) {
    console.log('=== populateCourseOptions 시작, 과정 수:', courses.length);

    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) return;

    let optionsHtml = '<option value="">과정을 선택하세요</option>';

    if (courses.length === 0) {
        optionsHtml += '<option value="" disabled>등록된 교육 과정이 없습니다</option>';
        courseSelect.innerHTML = optionsHtml;
        return;
    }

    const validCourses = courses
        .filter(course => course.certificateType && course.title)
        .sort((a, b) => {
            const typeOrder = ['health-exercise', 'rehabilitation', 'pilates', 'recreation'];
            const typeA = typeOrder.indexOf(a.certificateType);
            const typeB = typeOrder.indexOf(b.certificateType);

            if (typeA !== typeB) {
                return typeA - typeB;
            }

            const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
            const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);

            return dateA.getTime() - dateB.getTime();
        });

    const now = new Date();
    const groupedCourses = groupCoursesByType(validCourses);

    Object.keys(groupedCourses).forEach(certType => {
        const typeName = getCertificateDisplayName(certType);

        optionsHtml += `<optgroup label="${typeName}">`;

        groupedCourses[certType].forEach(course => {
            const {
                isAvailable,
                statusText,
                optionText,
                isDisabled
            } = generateCourseOption(course, now);

            optionsHtml += `<option value="${course.id}" ${isDisabled ? 'disabled' : ''} data-course-type="${certType}">
                ${optionText}
            </option>`;
        });

        optionsHtml += '</optgroup>';
    });

    courseSelect.innerHTML = optionsHtml;

    console.log('=== populateCourseOptions 완료 ===');
}

/**
 * 과정 선택 처리
 */
function handleCourseSelection(courseId) {
    console.log('=== handleCourseSelection 시작, courseId:', courseId);

    if (!courseId || !window.availableCourses) {
        clearCourseInfo();
        return;
    }

    const selectedCourse = window.availableCourses.find(course => course.id === courseId);

    if (!selectedCourse) {
        console.error('선택된 과정을 찾을 수 없습니다:', courseId);
        clearCourseInfo();
        return;
    }

    console.log('선택된 과정:', selectedCourse);
    updateCourseInfoFromFirebase(selectedCourse);
    updateApplicationSummary();

    console.log('=== handleCourseSelection 완료 ===');
}

/**
 * Firebase 데이터로 과정 정보 업데이트
 */
function updateCourseInfoFromFirebase(course) {
    console.log('=== updateCourseInfoFromFirebase 시작 ===');

    const courseInfo = document.getElementById('course-info');

    try {
        const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
        const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);

        const formatDate = (date) => {
            return window.formatters.formatDate(date, 'YYYY.MM.DD');
        };

        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7));
        const dateRange = `${formatDate(startDate)} ~ ${formatDate(endDate)} (${duration}주)`;

        // 신청 기간 처리
        let applyStartDate, applyEndDate;

        if (course.applyStartDate && course.applyEndDate) {
            applyStartDate = course.applyStartDate?.toDate ? course.applyStartDate.toDate() : new Date(course.applyStartDate);
            applyEndDate = course.applyEndDate?.toDate ? course.applyEndDate.toDate() : new Date(course.applyEndDate);
        } else {
            applyStartDate = new Date(startDate);
            applyStartDate.setDate(applyStartDate.getDate() - 30);
            applyEndDate = new Date(startDate);
            applyEndDate.setDate(applyEndDate.getDate() - 7);
        }

        const applyPeriod = `${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}`;

        // 가격 정보 처리
        const pricing = course.pricing || {};
        const educationPrice = pricing.education || course.price || 0;

        const formatPrice = (price) => {
            return window.formatters.formatCurrency(price);
        };

        const courseData = {
            title: course.title || '교육과정명',
            period: dateRange,
            price: formatPrice(educationPrice),
            method: course.method || '온라인 + 오프라인 병행',
            capacity: `${course.capacity || 30}명`,
            location: course.location || '서울 강남구 센터',
            applyPeriod: applyPeriod,
            description: course.description || '상세한 교육 과정 안내가 제공됩니다.',
            instructor: course.instructor || '전문 강사진',
            pricing: {
                education: educationPrice,
                certificate: pricing.certificate || course.certificatePrice || 50000,
                material: pricing.material || course.materialPrice || 30000,
                materialRequired: pricing.materialRequired || course.materialRequired || false,
                packageDiscount: pricing.packageDiscount || 10
            }
        };

        // 기본 과정 정보 업데이트
        document.getElementById('course-title').textContent = courseData.title;
        document.getElementById('course-period').textContent = courseData.period;
        document.getElementById('course-price').textContent = courseData.price;
        document.getElementById('course-method').textContent = courseData.method;
        document.getElementById('course-capacity').textContent = courseData.capacity;
        document.getElementById('course-location').textContent = courseData.location;
        document.getElementById('course-apply-period').textContent = courseData.applyPeriod;
        document.getElementById('course-description').textContent = courseData.description;

        courseInfo.classList.add('show');

        console.log('=== updateCourseInfoFromFirebase 완료 ===');

    } catch (error) {
        console.error('과정 정보 업데이트 오류:', error);
        clearCourseInfo();
    }
}

/**
 * 🔧 NEW: 신청 요약 정보 업데이트
 */
function updateApplicationSummary() {
    console.log('📊 신청 요약 정보 업데이트');

    const courseSelect = document.getElementById('course-select');
    const summaryCourseName = document.getElementById('summary-course-name');
    const summaryCoursePeriod = document.getElementById('summary-course-period');
    const summaryCoursePrice = document.getElementById('summary-course-price');

    if (!courseSelect || !courseSelect.value || !window.availableCourses) {
        if (summaryCourseName) summaryCourseName.textContent = '과정을 먼저 선택해주세요';
        if (summaryCoursePeriod) summaryCoursePeriod.textContent = '-';
        if (summaryCoursePrice) summaryCoursePrice.textContent = '-';
        return;
    }

    const selectedCourse = window.availableCourses.find(course => course.id === courseSelect.value);
    if (!selectedCourse) return;

    try {
        const startDate = selectedCourse.startDate?.toDate ? selectedCourse.startDate.toDate() : new Date(selectedCourse.startDate);
        const endDate = selectedCourse.endDate?.toDate ? selectedCourse.endDate.toDate() : new Date(selectedCourse.endDate);

        const formatDate = (date) => {
            return window.formatters.formatDate(date, 'YYYY.MM.DD');
        };

        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7));
        const period = `${formatDate(startDate)} ~ ${formatDate(endDate)} (${duration}주)`;

        const pricing = selectedCourse.pricing || {};
        const educationPrice = pricing.education || selectedCourse.price || 0;
        const price = window.formatters.formatCurrency(educationPrice);

        if (summaryCourseName) summaryCourseName.textContent = selectedCourse.title;
        if (summaryCoursePeriod) summaryCoursePeriod.textContent = period;
        if (summaryCoursePrice) summaryCoursePrice.textContent = price;

    } catch (error) {
        console.error('신청 요약 정보 업데이트 오류:', error);
    }
}

// =================================
// 기본 폼 기능들 (간소화)
// =================================

/**
 * 기본 폼 유효성 검사 초기화
 */
function initBasicFormValidation() {
    console.log('📝 기본 폼 유효성 검사 초기화');

    const form = document.getElementById('application-form');
    if (!form) return;

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
}

/**
 * 전화번호 포맷팅 초기화
 */
function initPhoneFormatting() {
    console.log('📞 전화번호 포맷팅 초기화');

    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function () {
        this.value = window.formatters.formatPhoneNumber(this.value);
    });
}

/**
 * 이메일 유효성 검사 초기화
 */
function initEmailValidation() {
    console.log('📧 이메일 유효성 검사 초기화');

    const emailInput = document.getElementById('email');
    if (!emailInput) return;

    emailInput.addEventListener('blur', function () {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (this.value && !emailRegex.test(this.value)) {
            this.classList.add('error');
            showFieldError(this, '올바른 이메일 형식을 입력해주세요.');
        } else {
            this.classList.remove('error');
            hideFieldError(this);
        }
    });
}

/**
 * 🔧 NEW: 회원 정보 자동 기입
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

        const nameInput = document.getElementById('applicant-name');
        if (nameInput && !nameInput.value && user.displayName) {
            nameInput.value = user.displayName;
            console.log('✅ 이름 자동 기입:', user.displayName);
        }

        // 🔧 IMPROVED: Firestore에서 사용자 상세 정보 가져오기 (오류 처리 강화)
        loadUserDetailInfo(user.uid);

    } catch (error) {
        console.error('회원 정보 자동 기입 오류:', error);
    }
}

/**
 * 🔧 NEW: Firestore에서 사용자 상세 정보 로드
 */
async function loadUserDetailInfo(userId) {
    if (!window.dbService) {
        console.log('dbService 미연동, 기본 정보만 사용');
        return;
    }

    try {
        // 🔧 FIX: getDocument 함수 호출 방식 확인
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
        // 오류가 발생해도 계속 진행
        console.log('기본 회원 정보로 계속 진행합니다.');
    }
}

/**
 * 사용자 데이터로 폼 채우기
 */
function fillUserData(userData) {
    console.log('📝 사용자 데이터로 폼 채우기:', userData);

    const fieldMappings = {
        'applicant-name': userData.name || userData.displayName || userData.firstName,
        'phone': userData.phone || userData.phoneNumber,
        'birth-date': userData.birthDate || userData.dateOfBirth,
        'address': userData.address || userData.streetAddress,
        'emergency-contact': userData.emergencyContact || userData.emergencyPhone
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

// =================================
// 유틸리티 함수들
// =================================

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
 * 폼이 수정되었는지 확인
 */
function isFormModified() {
    const form = document.getElementById('application-form');
    if (!form) return false;

    const formData = new FormData(form);
    const currentData = {};

    for (let [key, value] of formData.entries()) {
        currentData[key] = value;
    }

    const savedData = getFlowData().step1 || {};

    return JSON.stringify(currentData) !== JSON.stringify(savedData);
}

/**
 * 자동 저장
 */
function autoSaveFormData() {
    try {
        const formData = collectFlowFormData();
        saveFlowStepData('step1', formData);
        console.log('📱 자동 저장 완료');
    } catch (error) {
        console.error('자동 저장 오류:', error);
    }
}

/**
 * 임시 저장 버튼 UI 업데이트
 */
function updateSaveButtonUI() {
    const saveButton = document.getElementById('save-draft-button');
    if (!saveButton) return;

    // 저장 완료 표시
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="button-icon">✅</span><span class="button-text">저장 완료</span>';
    saveButton.disabled = true;

    // 3초 후 원래 상태로 복원
    setTimeout(() => {
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
    }, 3000);
}

/**
 * 가격 정보 추출
 */
function extractPricingInfo(course) {
    const pricing = course.pricing || {};

    return {
        education: pricing.education || course.price || 0,
        certificate: pricing.certificate || course.certificatePrice || 50000,
        material: pricing.material || course.materialPrice || 30000,
        materialRequired: pricing.materialRequired || course.materialRequired || false,
        packageDiscount: pricing.packageDiscount || 10,
        enableInstallment: pricing.enableInstallment || false
    };
}

/**
 * 개별 필드 유효성 검사
 */
function validateField(field) {
    if (!field) return false;

    let isValid = true;
    let errorMessage = '';

    // 필수 필드 검사
    if (field.required && !field.value.trim()) {
        isValid = false;
        errorMessage = `${getFieldLabel(field)}을(를) 입력해주세요.`;
    }

    // 타입별 검사
    if (field.value.trim()) {
        switch (field.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    isValid = false;
                    errorMessage = '올바른 이메일 형식을 입력해주세요.';
                }
                break;

            case 'tel':
                const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
                if (!phoneRegex.test(field.value)) {
                    isValid = false;
                    errorMessage = '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)';
                }
                break;
        }
    }

    // UI 업데이트
    if (isValid) {
        field.classList.remove('error');
        hideFieldError(field);
    } else {
        field.classList.add('error');
        showFieldError(field, errorMessage);
    }

    return isValid;
}

/**
 * 필드 라벨 가져오기
 */
function getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) {
        return label.textContent.replace('*', '').trim();
    }
    return field.placeholder || field.name || field.id || '필드';
}

/**
 * 필드 오류 강조
 */
function highlightFieldError(field) {
    if (!field) return;
    field.classList.add('error');
    field.focus();
}

/**
 * 필드 오류 제거
 */
function clearFieldError(field) {
    if (!field) return;
    field.classList.remove('error');
    hideFieldError(field);
}

/**
 * 필드 오류 메시지 표시
 */
function showFieldError(field, message) {
    hideFieldError(field);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    field.parentNode.appendChild(errorDiv);
}

/**
 * 필드 오류 메시지 숨기기
 */
function hideFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
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
 * 유효성 검사 오류 메시지 표시
 */
function showValidationErrors(errors) {
    const message = '다음 항목을 확인해주세요:\n\n' + errors.join('\n');
    alert(message);
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

    // 🔧 FIX: z-index를 더 높게 설정하고 위치 조정
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
// 기존 코드 유지 (상태 관리, 테스트 데이터 등)
// =================================

// 상태 관리 함수들
function showLoadingState() {
    const loadingEl = document.getElementById('schedule-loading');
    const errorEl = document.getElementById('schedule-error');
    const containerEl = document.getElementById('schedule-container');
    const emptyEl = document.getElementById('schedule-empty');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (containerEl) containerEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
}

function showErrorState() {
    const loadingEl = document.getElementById('schedule-loading');
    const errorEl = document.getElementById('schedule-error');
    const containerEl = document.getElementById('schedule-container');
    const emptyEl = document.getElementById('schedule-empty');

    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
    if (containerEl) containerEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
}

function showEmptyState() {
    const loadingEl = document.getElementById('schedule-loading');
    const errorEl = document.getElementById('schedule-error');
    const containerEl = document.getElementById('schedule-container');
    const emptyEl = document.getElementById('schedule-empty');

    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (containerEl) containerEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
}

function showScheduleContainer() {
    const loadingEl = document.getElementById('schedule-loading');
    const errorEl = document.getElementById('schedule-error');
    const containerEl = document.getElementById('schedule-container');
    const emptyEl = document.getElementById('schedule-empty');

    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (containerEl) containerEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
}

/**
 * course-application.js - 통합 플로우 버전 Part 2
 * 나머지 코드들 (유틸리티, 테스트 데이터, 디버깅 도구 등)
 */

/**
 * 의존성 오류 표시 함수
 */
function showDependencyError() {
    const scheduleContainer = document.getElementById('schedule-container');
    const courseSelect = document.getElementById('course-select');

    if (scheduleContainer) {
        scheduleContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div class="text-red-600 text-lg font-semibold mb-2">⚠️ 시스템 오류</div>
                <p class="text-red-700 mb-4">필수 유틸리티 파일이 로드되지 않았습니다.</p>
                <p class="text-red-600 text-sm">페이지를 새로고침하거나 관리자에게 문의하세요.</p>
            </div>
        `;
    }

    if (courseSelect) {
        courseSelect.innerHTML = '<option value="">시스템 오류 - 페이지를 새로고침하세요</option>';
        courseSelect.disabled = true;
    }
}

/**
 * 과정을 자격증 타입별로 그룹화
 */
function groupCoursesByType(courses) {
    const grouped = {};

    courses.forEach(course => {
        const type = course.certificateType;
        if (!grouped[type]) {
            grouped[type] = [];
        }
        grouped[type].push(course);
    });

    return grouped;
}

/**
 * 개별 과정 옵션 생성
 */
function generateCourseOption(course, now) {
    const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
    const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);

    // 신청 날짜 처리
    let applyStartDate, applyEndDate;

    if (course.applyStartDate && course.applyEndDate) {
        applyStartDate = course.applyStartDate?.toDate ? course.applyStartDate.toDate() : new Date(course.applyStartDate);
        applyEndDate = course.applyEndDate?.toDate ? course.applyEndDate.toDate() : new Date(course.applyEndDate);
        console.log('드롭다운 Firebase 신청기간 사용:', course.title, applyStartDate, '~', applyEndDate);
    } else {
        applyStartDate = new Date(startDate);
        applyStartDate.setDate(applyStartDate.getDate() - 30);
        applyEndDate = new Date(startDate);
        applyEndDate.setDate(applyEndDate.getDate() - 7);
        console.warn('드롭다운 신청기간 없음, 기본값 사용:', course.title);
    }

    let isAvailable = false;
    let statusText = '';
    let isDisabled = false;

    // 관리자가 설정한 상태 우선 적용
    if (course.status === 'active') {
        console.log(`드롭다운 ${course.title}: 관리자가 모집중으로 설정`);

        if (now >= applyStartDate && now <= applyEndDate) {
            const enrolledCount = course.enrolledCount || 0;
            const capacity = course.capacity || 30;

            if (enrolledCount >= capacity) {
                statusText = '마감';
                isDisabled = true;
            } else {
                statusText = enrolledCount >= capacity * 0.8 ? '마감임박' : '모집중';
                isAvailable = true;
                isDisabled = false;
            }
        } else if (now < applyStartDate) {
            statusText = '모집중';
            isAvailable = true;
            isDisabled = false;
        } else {
            statusText = '마감';
            isDisabled = true;
        }
    } else if (course.status === 'preparing') {
        statusText = '준비중';
        isDisabled = true;
    } else if (course.status === 'closed') {
        statusText = '마감';
        isDisabled = true;
    } else if (course.status === 'completed') {
        statusText = '종료';
        isDisabled = true;
    } else {
        // 관리자 상태가 없는 경우 날짜 기준 계산
        if (now < applyStartDate) {
            statusText = '준비중';
            isDisabled = true;
        } else if (now >= applyStartDate && now <= applyEndDate) {
            const enrolledCount = course.enrolledCount || 0;
            const capacity = course.capacity || 30;

            if (enrolledCount >= capacity) {
                statusText = '마감';
                isDisabled = true;
            } else {
                statusText = enrolledCount >= capacity * 0.8 ? '마감임박' : '모집중';
                isAvailable = true;
            }
        } else if (now > applyEndDate) {
            statusText = '마감';
            isDisabled = true;
        }
    }

    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    const period = month <= 6 ? '상반기' : '하반기';
    const coursePeriod = `${year.toString().slice(-2)}년 ${period}`;

    const formatDate = (date) => {
        return window.formatters.formatDate(date, 'YYYY.MM.DD');
    };

    const dateRange = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
    const optionText = `${course.title || '과정명 미정'} (${dateRange}) - ${statusText}`;

    return {
        isAvailable,
        statusText,
        optionText,
        isDisabled,
        coursePeriod,
        dateRange
    };
}

/**
 * 과정 정보 초기화
 */
function clearCourseInfo() {
    const courseInfo = document.getElementById('course-info');

    document.getElementById('course-title').textContent = '과정을 선택해주세요';
    document.getElementById('course-period').textContent = '-';
    document.getElementById('course-price').textContent = '-';
    document.getElementById('course-method').textContent = '-';
    document.getElementById('course-capacity').textContent = '-';
    document.getElementById('course-location').textContent = '-';
    document.getElementById('course-apply-period').textContent = '-';
    document.getElementById('course-description').textContent = '과정에 대한 상세 정보가 표시됩니다.';

    // 신청 요약도 초기화
    const summaryCourseName = document.getElementById('summary-course-name');
    const summaryCoursePeriod = document.getElementById('summary-course-period');
    const summaryCoursePrice = document.getElementById('summary-course-price');

    if (summaryCourseName) summaryCourseName.textContent = '과정을 먼저 선택해주세요';
    if (summaryCoursePeriod) summaryCoursePeriod.textContent = '-';
    if (summaryCoursePrice) summaryCoursePrice.textContent = '-';

    courseInfo.classList.remove('show');
}

/**
 * 자격증 타입의 표시명 반환
 */
function getCertificateDisplayName(type) {
    const names = {
        'health-exercise': '건강운동처방사',
        'rehabilitation': '운동재활전문가',
        'pilates': '필라테스 전문가',
        'recreation': '레크리에이션지도자'
    };
    return names[type] || type;
}

/**
 * 과정 ID로 드롭다운에서 선택
 */
function selectCourseById(courseId) {
    console.log('=== selectCourseById 시작, courseId:', courseId);

    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다!');
        return false;
    }

    const targetOption = courseSelect.querySelector(`option[value="${courseId}"]`);
    if (!targetOption) {
        console.error(`courseId ${courseId}에 해당하는 옵션을 찾을 수 없습니다!`);
        return false;
    }

    if (targetOption.disabled) {
        console.warn(`courseId ${courseId}는 비활성화된 옵션입니다.`);
        showWarningMessage('선택하신 과정은 현재 신청할 수 없습니다.');
        return false;
    }

    courseSelect.value = courseId;
    console.log('드롭다운에서 과정 선택됨:', courseId);

    const changeEvent = new Event('change', { bubbles: true });
    courseSelect.dispatchEvent(changeEvent);

    console.log('=== selectCourseById 완료 ===');
    return true;
}

/**
 * 과정명과 기수로 드롭다운에서 선택
 */
function selectCourseByNameAndPeriod(courseName, period) {
    console.log('=== selectCourseByNameAndPeriod 시작 ===');
    console.log('과정명:', courseName, '기수:', period);

    if (!window.availableCourses) {
        console.error('availableCourses 데이터가 없습니다!');
        return false;
    }

    const matchingCourse = window.availableCourses.find(course => {
        const certName = getCertificateDisplayName(course.certificateType);
        if (certName !== courseName) return false;

        const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
        const year = startDate.getFullYear();
        const month = startDate.getMonth() + 1;
        const coursePeriod = month <= 6 ? '상반기' : '하반기';
        const generatedPeriod = `${year.toString().slice(-2)}년 ${coursePeriod}`;

        return generatedPeriod === period;
    });

    if (matchingCourse) {
        console.log('매칭되는 과정 찾음:', matchingCourse);
        return selectCourseById(matchingCourse.id);
    } else {
        console.error('매칭되는 과정을 찾을 수 없습니다.');
        return false;
    }
}

/**
 * 과정 선택 섹션으로 스크롤
 */
function scrollToCourseSelection() {
    const courseSelectionSection = document.getElementById('course-selection');
    if (courseSelectionSection) {
        courseSelectionSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * 스크롤 애니메이션 초기화
 */
function initScrollAnimations() {
    if (window.innerWidth <= 768) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('fade-out');
                entry.target.classList.add('fade-in');

                if (entry.target.classList.contains('statistics-item')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll(
        '.education-feature-card, .course-card, .process-step, .benefit-card, .statistics-item'
    );

    if (animateElements.length > 0) {
        animateElements.forEach(el => {
            el.style.opacity = '0.3';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

/**
 * 부드러운 스크롤 기능
 */
function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');

    scrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = link.getAttribute('href');

            if (href === '#' || href === '#top') {
                return;
            }

            e.preventDefault();

            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 100;

                window.scrollTo({
                    top: Math.max(0, offsetTop),
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * 카운터 애니메이션
 */
function animateCounter(element) {
    const countElement = element.querySelector('[data-count]');
    if (!countElement) return;

    const targetCount = parseInt(countElement.getAttribute('data-count'));
    const duration = 2000;
    const startTime = performance.now();

    function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentCount = Math.floor(progress * targetCount);
        countElement.textContent = window.formatters.formatNumber(currentCount);

        if (progress < 1) {
            requestAnimationFrame(updateCount);
        }
    }

    requestAnimationFrame(updateCount);
}

/**
 * 테스트용 더미 데이터
 */
function getTestScheduleData() {
    const now = new Date();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    return [
        {
            id: 'test-health-1',
            title: '건강운동처방사 기본과정 1기',
            certificateType: 'health-exercise',
            instructor: '김운동',
            startDate: new Date(now.getTime() + oneMonth),
            endDate: new Date(now.getTime() + oneMonth * 3),
            price: 350000,
            capacity: 30,
            enrolledCount: 18,
            status: 'active',
            description: '건강운동처방사 자격증 취득을 위한 기본 과정입니다.',
            // 🔧 NEW: 통합 가격 정보 추가
            pricing: {
                education: 150000,
                certificate: 50000,
                material: 30000,
                materialRequired: false,
                packageDiscount: 10
            }
        },
        {
            id: 'test-health-2',
            title: '건강운동처방사 기본과정 2기',
            certificateType: 'health-exercise',
            instructor: '김운동',
            startDate: new Date(now.getTime() + oneMonth * 4),
            endDate: new Date(now.getTime() + oneMonth * 6),
            price: 350000,
            capacity: 30,
            enrolledCount: 0,
            status: 'preparing',
            description: '건강운동처방사 자격증 취득을 위한 기본 과정입니다.',
            pricing: {
                education: 150000,
                certificate: 50000,
                material: 30000,
                materialRequired: false,
                packageDiscount: 10
            }
        },
        {
            id: 'test-rehab-1',
            title: '운동재활전문가 기본과정 1기',
            certificateType: 'rehabilitation',
            instructor: '이재활',
            startDate: new Date(now.getTime() + oneMonth * 1.5),
            endDate: new Date(now.getTime() + oneMonth * 4.5),
            price: 420000,
            capacity: 25,
            enrolledCount: 22,
            status: 'active',
            description: '운동재활전문가 자격증 취득을 위한 기본 과정입니다.',
            pricing: {
                education: 200000,
                certificate: 55000,
                material: 35000,
                materialRequired: true,
                packageDiscount: 15
            }
        },
        {
            id: 'test-pilates-1',
            title: '필라테스 전문가 기본과정 1기',
            certificateType: 'pilates',
            instructor: '박필라',
            startDate: new Date(now.getTime() + oneMonth * 2),
            endDate: new Date(now.getTime() + oneMonth * 5),
            price: 480000,
            capacity: 20,
            enrolledCount: 5,
            status: 'active',
            description: '필라테스 전문가 자격증 취득을 위한 기본 과정입니다.',
            pricing: {
                education: 250000,
                certificate: 60000,
                material: 40000,
                materialRequired: false,
                packageDiscount: 12
            }
        },
        {
            id: 'test-recreation-1',
            title: '레크리에이션지도자 기본과정 1기',
            certificateType: 'recreation',
            instructor: '최레크',
            startDate: new Date(now.getTime() + oneMonth * 1.2),
            endDate: new Date(now.getTime() + oneMonth * 2.7),
            price: 280000,
            capacity: 25,
            enrolledCount: 12,
            status: 'active',
            description: '레크리에이션지도자 자격증 취득을 위한 기본 과정입니다.',
            pricing: {
                education: 120000,
                certificate: 45000,
                material: 25000,
                materialRequired: false,
                packageDiscount: 8
            }
        }
    ];
}

/**
 * 테스트용 과정 데이터
 */
function getTestCourseData() {
    return getTestScheduleData(); // 동일한 데이터 사용
}

/**
 * 교육 일정 데이터 다시 로드 (전역 함수)
 */
window.loadScheduleData = loadScheduleData;

// =================================
// 디버깅 및 개발자 도구 (통합 플로우 버전)
// =================================

// 개발 모드에서 사용되는 디버깅 함수들
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.web.app') ||
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {

    window.debugCourseApplicationFlow = {
        // 기본 정보 확인
        help: function () {
            console.log('🎯 통합 플로우 디버깅 도구 사용법');
            console.log('\n📊 데이터 관련:');
            console.log('- showAvailableCourses() : 사용 가능한 과정 목록');
            console.log('- reloadSchedule() : 교육 일정 다시 로드');
            console.log('- testDependencies() : 유틸리티 의존성 확인');

            console.log('\n🎯 선택 관련:');
            console.log('- testCourseSelection("course-id") : 특정 과정 선택');
            console.log('- testAutoSelection("cert-type") : 자격증 타입으로 자동 선택');

            console.log('\n📝 폼 관련:');
            console.log('- fillTestData() : 테스트 데이터 자동 입력');
            console.log('- checkValidation() : 유효성 검사 결과');
            console.log('- checkFormData() : 현재 폼 데이터 확인');

            console.log('\n🔄 플로우 관련:');
            console.log('- simulateNextStep() : 다음 단계 시뮬레이션');
            console.log('- checkSavedData() : 저장된 데이터 확인');
            console.log('- clearSavedData() : 저장된 데이터 삭제');

            console.log('\n🧪 종합 테스트:');
            console.log('- runFlowTest() : 전체 플로우 테스트');
        },

        // 🔧 의존성 테스트
        testDependencies: function () {
            console.log('🔧 유틸리티 의존성 테스트...');
            const result = checkDependencies();
            if (result) {
                console.log('✅ 모든 유틸리티 정상 로드됨');

                try {
                    const testDate = new Date();
                    console.log('📅 formatters.formatDate 테스트:', window.formatters.formatDate(testDate, 'YYYY.MM.DD'));
                    console.log('💰 formatters.formatCurrency 테스트:', window.formatters.formatCurrency(350000));
                    console.log('📞 formatters.formatPhoneNumber 테스트:', window.formatters.formatPhoneNumber('01012345678'));
                    if (window.dateUtils) {
                        console.log('🕒 dateUtils.format 테스트:', window.dateUtils.format(testDate, 'YYYY-MM-DD'));
                    }
                } catch (error) {
                    console.error('❌ 유틸리티 함수 테스트 실패:', error);
                }
            } else {
                console.error('❌ 필수 유틸리티 누락');
            }
            return result;
        },

        // 데이터 관련
        showAvailableCourses: function () {
            console.log('현재 사용 가능한 과정들:', window.availableCourses);
            if (window.availableCourses) {
                console.log('과정 수:', window.availableCourses.length);
                window.availableCourses.forEach((course, index) => {
                    console.log(`${index + 1}. [${course.id}] ${course.title} (${course.certificateType})`);
                });
            } else {
                console.log('과정 데이터가 아직 로드되지 않았습니다.');
            }
        },

        reloadSchedule: function () {
            console.log('교육 일정 다시 로드');
            loadScheduleData();
        },

        // 선택 관련
        testCourseSelection: function (courseId) {
            if (!courseId) {
                console.log('사용법: testCourseSelection("course-id")');
                this.showAvailableCourses();
                return;
            }

            console.log('과정 선택 테스트:', courseId);
            const success = selectCourseById(courseId);
            console.log(success ? '✅ 과정 선택 성공' : '❌ 과정 선택 실패');
        },

        testAutoSelection: function (certType) {
            if (!certType) {
                console.log('사용법: testAutoSelection("certificate-type")');
                console.log('사용 가능한 자격증 타입들:');
                console.log('- health-exercise (건강운동처방사)');
                console.log('- rehabilitation (운동재활전문가)');
                console.log('- pilates (필라테스 전문가)');
                console.log('- recreation (레크리에이션지도자)');
                return;
            }

            console.log('자동 선택 테스트:', certType);
            const success = selectCourseFromCertificateType(certType);
            if (success) {
                console.log('✅ 자동 선택 성공');
                scrollToCourseSelection();
            } else {
                console.log('❌ 자동 선택 실패');
            }
        },

        // 폼 관련
        fillTestData: function () {
            console.log('테스트 데이터 입력 시작...');

            if (!this.testDependencies()) {
                console.error('❌ 유틸리티 누락으로 테스트 데이터 입력 중단');
                return;
            }

            // 기본 정보 입력
            const fields = {
                'applicant-name': '홍길동',
                'phone': '010-1234-5678',
                'email': 'test@example.com',
                'birth-date': '1990-01-01',
                'address': '서울시 강남구 테헤란로 123',
                'emergency-contact': '010-9876-5432'
            };

            Object.entries(fields).forEach(([id, value]) => {
                const input = document.getElementById(id);
                if (input) {
                    input.value = value;
                    console.log(`✅ ${id} 입력됨: ${value}`);
                }
            });

            // 과정 선택
            if (window.availableCourses && window.availableCourses.length > 0) {
                const firstAvailable = window.availableCourses.find(course => {
                    const option = document.querySelector(`option[value="${course.id}"]`);
                    return option && !option.disabled;
                });

                if (firstAvailable) {
                    this.testCourseSelection(firstAvailable.id);
                }
            }

            // 약관 동의
            const agreements = ['agree-privacy'];
            agreements.forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.checked = true;
                    console.log(`✅ ${id} 동의됨`);
                }
            });

            // 마케팅 동의 (선택)
            const marketingCheckbox = document.getElementById('agree-marketing');
            if (marketingCheckbox) {
                marketingCheckbox.checked = true;
                console.log('✅ agree-marketing 동의됨');
            }

            console.log('🎯 테스트 데이터 입력 완료!');
        },

        checkFormData: function () {
            const formData = collectFlowFormData();
            console.log('현재 폼 데이터:', formData);

            const isValid = validateFlowForm();
            console.log('폼 유효성:', isValid ? '✅ 유효' : '❌ 무효');

            return formData;
        },

        checkValidation: function () {
            console.log('=== 플로우 폼 유효성 검사 결과 ===');

            const form = document.getElementById('application-form');
            if (!form) {
                console.log('❌ 폼을 찾을 수 없습니다.');
                return;
            }

            // 과정 선택 체크
            const courseSelect = document.getElementById('course-select');
            console.log(`과정 선택: ${courseSelect && courseSelect.value ? '✅ ' + courseSelect.value : '❌ 미선택'}`);

            // 필수 필드 체크
            const requiredFields = [
                { id: 'applicant-name', label: '이름' },
                { id: 'phone', label: '연락처' },
                { id: 'email', label: '이메일' }
            ];

            console.log(`\n필수 필드 (${requiredFields.length}개):`);
            requiredFields.forEach(field => {
                const input = document.getElementById(field.id);
                const value = input ? input.value.trim() : '';
                console.log(`${value ? '✅' : '❌'} ${field.label}: "${value}"`);
            });

            // 약관 동의 체크
            const privacyAgree = document.getElementById('agree-privacy');
            console.log(`\n개인정보 동의: ${privacyAgree && privacyAgree.checked ? '✅' : '❌'}`);

            const marketingAgree = document.getElementById('agree-marketing');
            console.log(`마케팅 동의: ${marketingAgree && marketingAgree.checked ? '✅' : '❌'} (선택사항)`);
        },

        // 🔧 NEW: 플로우 관련
        simulateNextStep: function () {
            console.log('🚀 다음 단계 시뮬레이션...');

            if (!this.testDependencies()) {
                console.error('❌ 의존성 테스트 실패');
                return;
            }

            // 테스트 데이터 입력
            this.fillTestData();

            // 잠시 대기 후 다음 단계 진행
            setTimeout(() => {
                console.log('📤 다음 단계 진행 시뮬레이션');
                handleNextStepSubmission();
            }, 1000);
        },

        checkSavedData: function () {
            const flowData = getFlowData();
            console.log('저장된 플로우 데이터:', flowData);

            if (flowData.step1) {
                console.log('1단계 데이터:', flowData.step1);
            } else {
                console.log('저장된 1단계 데이터가 없습니다.');
            }

            return flowData;
        },

        clearSavedData: function () {
            console.log('💾 저장된 데이터 삭제');
            localStorage.removeItem('dhc_flow_data');
            console.log('✅ 로컬 저장 데이터 삭제 완료');

            // Firebase 데이터도 삭제 (로그인 상태인 경우)
            if (window.dhcFirebase?.auth?.currentUser) {
                const userId = window.dhcFirebase.auth.currentUser.uid;
                const docId = `flow_${userId}`;

                if (window.dbService) {
                    window.dbService.deleteDocument('flow_progress', docId)
                        .then(result => {
                            if (result.success) {
                                console.log('✅ Firebase 데이터 삭제 완료');
                            } else {
                                console.error('❌ Firebase 데이터 삭제 실패:', result.error);
                            }
                        });
                }
            }
        },

        testTemporarySave: function () {
            console.log('💾 임시 저장 테스트');
            handleTemporarySave();
        },

        // 종합 테스트
        runFlowTest: function () {
            console.log('🚀 통합 플로우 전체 테스트 시작...');

            console.log('\n1️⃣ 의존성 및 유틸리티 테스트');
            const dependenciesOk = this.testDependencies();

            if (!dependenciesOk) {
                console.error('❌ 의존성 테스트 실패 - 테스트 중단');
                return;
            }

            console.log('\n2️⃣ 과정 데이터 확인');
            this.showAvailableCourses();

            console.log('\n3️⃣ 테스트 데이터 입력');
            this.fillTestData();

            console.log('\n4️⃣ 유효성 검사');
            this.checkValidation();

            console.log('\n5️⃣ 폼 데이터 확인');
            this.checkFormData();

            console.log('\n6️⃣ 임시 저장 테스트');
            this.testTemporarySave();

            console.log('\n🎯 통합 플로우 테스트 완료!');
            console.log('💡 이제 다음 명령어들을 시도해보세요:');
            console.log('- simulateNextStep() : 다음 단계 시뮬레이션');
            console.log('- checkSavedData() : 저장된 데이터 확인');
            console.log('- clearSavedData() : 저장된 데이터 삭제');
        }
    };

    // 디버깅 도구에 추가할 함수들
    if (window.debugCourseApplicationFlow) {
        // 기존 디버깅 도구에 추가
        window.debugCourseApplicationFlow.clearAllData = function () {
            console.log('🗑️ 모든 저장된 데이터 삭제');
            clearSavedFlowData();

            // Firebase 데이터도 삭제
            if (window.dhcFirebase?.auth?.currentUser && window.dbService) {
                const userId = window.dhcFirebase.auth.currentUser.uid;
                const docId = `flow_${userId}`;

                window.dbService.deleteDocument('flow_progress', docId)
                    .then(result => {
                        if (result.success) {
                            console.log('✅ Firebase 데이터 삭제 완료');
                        }
                    })
                    .catch(error => {
                        console.error('❌ Firebase 데이터 삭제 실패:', error);
                    });
            }

            // 페이지 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        };

        window.debugCourseApplicationFlow.testAutoFill = function () {
            console.log('🔄 회원정보 자동기입 테스트');
            autoFillMemberInfo();
        };
    }

    console.log('\n🔧 === course-application.js 문제 수정 완료 ===');
    console.log('✅ Firebase setDocument 오류 수정');
    console.log('✅ Toast 메시지 z-index 수정 (헤더 위로 표시)');
    console.log('✅ 데이터 복원 알림창을 Toast로 변경');
    console.log('✅ 회원정보 자동기입 오류 처리 강화');
    console.log('✅ 초기화 타이밍 조정');
    console.log('\n🚀 모든 문제가 해결되었습니다!');

    // 🔧 NEW: 자격증 타입으로 첫 번째 모집중인 과정 선택 (디버깅용)
    function selectCourseFromCertificateType(certType) {
        console.log('=== selectCourseFromCertificateType 시작:', certType);

        if (!window.availableCourses) {
            console.error('availableCourses가 없습니다!');
            return false;
        }

        const availableCourses = window.availableCourses
            .filter(course => course.certificateType === certType)
            .sort((a, b) => {
                const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
                const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);
                return dateA.getTime() - dateB.getTime();
            });

        const now = new Date();

        for (const course of availableCourses) {
            const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
            const applyStartDate = new Date(startDate);
            applyStartDate.setDate(applyStartDate.getDate() - 30);
            const applyEndDate = new Date(startDate);
            applyEndDate.setDate(applyEndDate.getDate() - 7);

            if (now >= applyStartDate && now <= applyEndDate) {
                const enrolledCount = course.enrolledCount || 0;
                const capacity = course.capacity || 30;

                if (enrolledCount < capacity) {
                    console.log('신청 가능한 과정 발견:', course);
                    return selectCourseById(course.id);
                }
            }
        }

        if (availableCourses.length > 0) {
            console.log('신청 가능한 과정 없음, 첫 번째 과정 선택:', availableCourses[0]);
            return selectCourseById(availableCourses[0].id);
        }

        console.log('해당 자격증 타입의 과정을 찾을 수 없습니다:', certType);
        return false;
    }

    // 디버깅 도구 안내
    console.log('🎯 통합 플로우 디버깅 도구 활성화됨');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('📊 데이터: showAvailableCourses(), reloadSchedule(), testDependencies()');
    console.log('🎯 선택: testCourseSelection(id), testAutoSelection(type)');
    console.log('📝 폼: fillTestData(), checkValidation(), checkFormData()');
    console.log('🔄 플로우: simulateNextStep(), checkSavedData(), clearSavedData()');
    console.log('🧪 테스트: runFlowTest()');
    console.log('\n💡 도움말: window.debugCourseApplicationFlow.help()');
    console.log('🚀 빠른 시작: window.debugCourseApplicationFlow.runFlowTest()');

} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
    console.log('현재 호스트:', window.location.hostname);
}

// =================================
// HTML 파일 스크립트 경로 수정도 필요
// =================================

// HTML 파일에서 다음과 같이 수정해주세요:
// 기존: <script src="{basePath}assets/js/pages/education/course-application-flow.js"><\/script>
// 수정: <script src="{basePath}assets/js/pages/education/course-application.js"><\/script>

// =================================
// 최종 완료 메시지
// =================================

console.log('\n🎉 === course-application.js 통합 플로우 버전 완료 ===');
console.log('✅ 결제 기능 제거 완료');
console.log('✅ 4단계 플로우 UI 구현');
console.log('✅ 다음 단계 이동 로직 구현');
console.log('✅ 임시 저장 기능 구현');
console.log('✅ 회원 정보 자동 기입 기능');
console.log('✅ Firebase 연동 진행 상황 저장');
console.log('✅ 신청 요약 정보 실시간 업데이트');
console.log('✅ 포괄적인 유효성 검사');
console.log('✅ 향상된 사용자 경험 (로딩, 메시지 등)');
console.log('✅ 통합 플로우 디버깅 도구');
console.log('\n🔧 Phase 2-B 1단계 주요 개선사항:');
console.log('- 교육신청 → 자격증신청 → 교재선택 → 통합결제 플로우');
console.log('- 각 단계별 임시 저장으로 사용자 편의성 향상');
console.log('- 회원 정보 자동 기입으로 입력 시간 단축');
console.log('- 실시간 신청 요약으로 투명한 정보 제공');
console.log('- Firebase 기반 진행 상황 저장으로 안전성 확보');
console.log('\n🚀 1단계(교육신청) 완료! 다음은 2단계(자격증신청) 수정을 진행합니다.');
console.log('🔧 HTML 스크립트 경로를 course-application.js로 수정해주세요.');

// 완료 플래그 설정
window.courseApplicationFlowReady = true;