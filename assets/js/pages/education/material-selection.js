/**
 * material-selection.js - 4가지 시나리오 지원 교재 선택 페이지
 * 
 * 시나리오 1: 교육신청 → 자격증신청 → 교재선택 → 통합결제
 * 시나리오 2: 교육신청 → 교재선택 → 결제
 * 시나리오 3: 자격증신청 → 결제 (교재선택 건너뛰기)
 * 시나리오 4: 교재구매만 → 결제
 */

console.log('=== material-selection.js 4가지 시나리오 지원 버전 로드됨 ===');

// 🔧 전역 변수 - 플로우 데이터 및 상태 관리
let materialFlowData = {
    scenario: null,      // 1, 2, 3, 4
    step1: null,         // course-application 데이터
    step2: null,         // cert-application 데이터  
    step3: null,         // material-selection 데이터 (현재 단계)
    availableMaterials: [], // 선택 가능한 교재 목록
    selectedMaterials: [], // 선택된 교재 목록
    pricing: {
        education: 0,
        certificate: 0,
        material: 0,
        subtotal: 0,
        discount: 0,
        total: 0
    }
};

// DOM이 로드되면 초기화
function initializeWhenReady() {
    console.log('=== material-selection.js 초기화 준비, 현재 상태:', document.readyState);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initMaterialSelectionPage();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initMaterialSelectionPage();
    }
}

// 초기화 시작
initializeWhenReady();

/**
 * 🎯 교재 선택 페이지 메인 초기화
 */
async function initMaterialSelectionPage() {
    console.log('🚀 교재 선택 페이지 초기화 시작 (4가지 시나리오 지원)');
    
    try {
        // 1. 시나리오 분석 및 이전 단계 데이터 로드
        await analyzeScenarioAndLoadData();
        
        // 2. 플로우 진행 상황 표시 업데이트
        updateFlowProgress();
        
        // 3. 페이지 제목 및 설명 업데이트
        updatePageTitle();
        
        // 4. 이전 단계 정보 표시
        displayPreviousStepInfo();
        
        // 5. 교재 목록 로드 및 표시
        await loadAndDisplayMaterials();
        
        // 6. 가격 계산 및 표시
        calculateAndDisplayPricing();
        
        // 7. 버튼 상태 설정
        setupButtons();
        
        // 8. 이벤트 리스너 설정
        setupEventListeners();
        
        console.log('✅ 교재 선택 페이지 초기화 완료');
        console.log('📊 현재 시나리오:', materialFlowData.scenario);
        
    } catch (error) {
        console.error('❌ 교재 선택 페이지 초기화 오류:', error);
        showErrorMessage('페이지 초기화 중 오류가 발생했습니다.');
    }
}

/**
 * 🔍 시나리오 분석 및 이전 단계 데이터 로드
 */
async function analyzeScenarioAndLoadData() {
    console.log('🔍 시나리오 분석 시작');
    
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const fromStep = urlParams.get('from');
    
    // 로컬 스토리지에서 플로우 데이터 로드
    const savedFlowData = getFlowData();
    materialFlowData.step1 = savedFlowData.step1 || savedFlowData['course-application'];
    materialFlowData.step2 = savedFlowData.step2 || savedFlowData['cert-application'];
    
    console.log('💾 로컬 스토리지 데이터:', {
        step1: !!materialFlowData.step1,
        step2: !!materialFlowData.step2,
        fromStep: fromStep
    });
    
    // 시나리오 결정
    if (materialFlowData.step1 && materialFlowData.step2) {
        // 시나리오 1: 전체 플로우 (교육신청 → 자격증신청 → 교재선택)
        materialFlowData.scenario = 1;
        console.log('📋 시나리오 1: 전체 플로우 (교육+자격증+교재)');
        
    } else if (materialFlowData.step1 && !materialFlowData.step2) {
        // 시나리오 2: 교육신청만 (교육신청 → 교재선택)
        materialFlowData.scenario = 2;
        console.log('📋 시나리오 2: 교육신청만 (교육+교재)');
        
    } else if (!materialFlowData.step1 && materialFlowData.step2) {
        // 시나리오 3은 여기서 처리되지 않음 (자격증신청에서 바로 결제로)
        // 하지만 혹시 모를 경우를 대비
        materialFlowData.scenario = 3;
        console.log('📋 시나리오 3: 자격증신청만 (자격증+교재) - 예외적 경우');
        
    } else {
        // 시나리오 4: 교재구매만
        materialFlowData.scenario = 4;
        console.log('📋 시나리오 4: 교재구매만');
    }
    
    // 회원 정보 로드 (로그인 상태인 경우)
    await loadMemberInfo();
}

/**
 * 🎨 플로우 진행 상황 표시 업데이트
 */
function updateFlowProgress() {
    console.log('📊 플로우 진행 상황 업데이트');
    
    const steps = document.querySelectorAll('.step');
    const connectors = document.querySelectorAll('.step-connector');
    
    // 시나리오별로 표시할 단계 결정
    switch (materialFlowData.scenario) {
        case 1: // 전체 플로우
            // 1단계, 2단계 완료, 3단계 활성, 4단계 대기
            updateStepStatus('step-1', 'completed');
            updateStepStatus('step-2', 'completed');
            updateStepStatus('step-3', 'active');
            updateStepStatus('step-4', 'pending');
            break;
            
        case 2: // 교육신청만
            // 1단계 완료, 2단계 건너뛰기, 3단계 활성, 4단계 대기
            updateStepStatus('step-1', 'completed');
            updateStepStatus('step-2', 'skipped');
            updateStepStatus('step-3', 'active');
            updateStepStatus('step-4', 'pending');
            break;
            
        case 3: // 자격증신청만 (예외적 경우)
            // 1단계 건너뛰기, 2단계 완료, 3단계 활성, 4단계 대기
            updateStepStatus('step-1', 'skipped');
            updateStepStatus('step-2', 'completed');
            updateStepStatus('step-3', 'active');
            updateStepStatus('step-4', 'pending');
            break;
            
        case 4: // 교재구매만
            // 1,2단계 건너뛰기, 3단계 활성, 4단계 대기
            updateStepStatus('step-1', 'skipped');
            updateStepStatus('step-2', 'skipped');
            updateStepStatus('step-3', 'active');
            updateStepStatus('step-4', 'pending');
            break;
    }
}

/**
 * 단계 상태 업데이트 헬퍼
 */
function updateStepStatus(stepId, status) {
    const step = document.getElementById(stepId);
    if (!step) return;
    
    // 기존 상태 클래스 제거
    step.classList.remove('completed', 'active', 'pending', 'skipped');
    
    // 새 상태 클래스 추가
    step.classList.add(status);
    
    // 건너뛴 단계는 시각적으로 표시
    if (status === 'skipped') {
        step.style.opacity = '0.3';
        const stepText = step.querySelector('.step-text');
        if (stepText) {
            stepText.style.textDecoration = 'line-through';
        }
    }
}

/**
 * 📝 페이지 제목 및 설명 업데이트
 */
function updatePageTitle() {
    const subtitle = document.getElementById('page-subtitle');
    if (!subtitle) return;
    
    switch (materialFlowData.scenario) {
        case 1:
            subtitle.textContent = '교육과정과 자격증 신청을 완료하셨습니다. 교재를 선택해주세요.';
            break;
        case 2:
            subtitle.textContent = '교육과정을 신청하셨습니다. 추가로 교재를 선택해주세요.';
            break;
        case 3:
            subtitle.textContent = '자격증을 신청하셨습니다. 교재를 선택해주세요.';
            break;
        case 4:
            subtitle.textContent = '구매하실 교재를 선택해주세요.';
            break;
    }
}

/**
 * 📋 이전 단계 정보 표시
 */
function displayPreviousStepInfo() {
    console.log('📋 이전 단계 정보 표시');
    
    const prevStepInfo = document.getElementById('previous-step-info');
    const educationInfo = document.getElementById('education-info');
    const certificateInfo = document.getElementById('certificate-info');
    
    let hasInfo = false;
    
    // 교육 신청 정보 표시 (시나리오 1, 2)
    if (materialFlowData.step1) {
        const step1Data = materialFlowData.step1;
        
        document.getElementById('prev-education-name').textContent = 
            step1Data.selectedCourseInfo?.title || '선택된 교육과정';
        document.getElementById('prev-education-applicant').textContent = 
            step1Data['applicant-name'] || step1Data.name || '신청자';
        document.getElementById('prev-education-price').textContent = 
            formatCurrency(step1Data.selectedCourseInfo?.price || 0);
            
        educationInfo.classList.remove('hidden');
        hasInfo = true;
    }
    
    // 자격증 신청 정보 표시 (시나리오 1, 3)
    if (materialFlowData.step2) {
        const step2Data = materialFlowData.step2;
        
        document.getElementById('prev-certificate-name').textContent = 
            step2Data.certificateName || getCertificateName(step2Data['cert-type']);
        document.getElementById('prev-certificate-applicant').textContent = 
            step2Data.name || '신청자';
        document.getElementById('prev-certificate-price').textContent = 
            formatCurrency(50000); // 기본 자격증 발급비
            
        certificateInfo.classList.remove('hidden');
        hasInfo = true;
    }
    
    // 이전 단계 정보가 있으면 전체 섹션 표시
    if (hasInfo) {
        prevStepInfo.classList.remove('hidden');
    }
}

/**
 * 📚 교재 목록 로드 및 표시
 */
async function loadAndDisplayMaterials() {
    console.log('📚 교재 목록 로드 시작');
    
    try {
        // 교재 정보 소스 결정
        await determineMaterialSource();
        
        // 교재 목록 가져오기
        const materials = await fetchAvailableMaterials();
        materialFlowData.availableMaterials = materials;
        
        if (materials.length === 0) {
            displayNoMaterialsNotice();
        } else {
            displayMaterialsList(materials);
            setupMaterialRequirementNotice(materials);
        }
        
    } catch (error) {
        console.error('❌ 교재 목록 로드 오류:', error);
        displayNoMaterialsNotice();
    }
}

/**
 * 🔍 교재 정보 소스 결정
 */
async function determineMaterialSource() {
    // 우선순위: step2 > step1 > URL 파라미터 > 사용자 선택
    
    if (materialFlowData.step2 && materialFlowData.step2['cert-type']) {
        materialFlowData.certificateType = materialFlowData.step2['cert-type'];
        console.log('📋 자격증 타입 (step2):', materialFlowData.certificateType);
        return;
    }
    
    if (materialFlowData.step1 && materialFlowData.step1.selectedCourseInfo) {
        materialFlowData.certificateType = materialFlowData.step1.selectedCourseInfo.certificateType;
        console.log('📋 자격증 타입 (step1):', materialFlowData.certificateType);
        return;
    }
    
    // URL 파라미터에서 확인
    const urlParams = new URLSearchParams(window.location.search);
    const certType = urlParams.get('certType');
    if (certType) {
        materialFlowData.certificateType = certType;
        console.log('📋 자격증 타입 (URL):', materialFlowData.certificateType);
        return;
    }
    
    // 기본값 또는 사용자 선택 필요
    console.log('⚠️ 자격증 타입 미확정, 전체 교재 표시');
}

/**
 * 📦 사용 가능한 교재 목록 가져오기
 */
async function fetchAvailableMaterials() {
    console.log('📦 교재 목록 가져오기');
    
    try {
        // Firebase에서 교재 정보 로드 시도
        if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
            return await fetchMaterialsFromFirebase();
        } else {
            console.log('🔄 Firebase 미연동, 테스트 데이터 사용');
            return getTestMaterialData();
        }
    } catch (error) {
        console.error('❌ 교재 데이터 로드 실패, 테스트 데이터 사용:', error);
        return getTestMaterialData();
    }
}

/**
 * 🔥 Firebase에서 교재 정보 로드
 */
async function fetchMaterialsFromFirebase() {
    console.log('🔥 Firebase에서 교재 정보 로드');
    
    // course-management에서 설정된 교재 정보 로드
    const queryOptions = {
        where: []
    };
    
    // 특정 자격증 타입이 있으면 필터링
    if (materialFlowData.certificateType) {
        queryOptions.where.push({
            field: 'certificateType',
            operator: '==',
            value: materialFlowData.certificateType
        });
    }
    
    const result = await window.dbService.getDocuments('courses', queryOptions);
    
    if (!result.success) {
        throw new Error('Firebase 교재 데이터 로드 실패');
    }
    
    // 교재 정보 추출 및 중복 제거
    const materialsMap = new Map();
    
    result.data.forEach(course => {
        if (course.materialName && course.materialPrice) {
            const key = `${course.certificateType}-${course.materialName}`;
            
            if (!materialsMap.has(key)) {
                materialsMap.set(key, {
                    id: key,
                    name: course.materialName,
                    price: course.materialPrice,
                    certificateType: course.certificateType,
                    certificateName: getCertificateName(course.certificateType),
                    required: course.materialRequired || false,
                    description: generateMaterialDescription(course.certificateType),
                    image: getMaterialImage(course.certificateType)
                });
            }
        }
    });
    
    return Array.from(materialsMap.values());
}

/**
 * 🧪 테스트 교재 데이터
 */
function getTestMaterialData() {
    const allMaterials = [
        {
            id: 'health-exercise-book',
            name: '건강운동처방사 전문교재',
            price: 35000,
            certificateType: 'health-exercise',
            certificateName: '건강운동처방사',
            required: false,
            description: '건강운동처방의 이론과 실무를 다룬 종합 교재입니다.',
            image: '/assets/images/materials/health-exercise-book.jpg'
        },
        {
            id: 'rehabilitation-book',
            name: '운동재활전문가 실무교재',
            price: 42000,
            certificateType: 'rehabilitation',
            certificateName: '운동재활전문가',
            required: true,
            description: '운동재활의 과학적 접근과 실무 사례를 담은 교재입니다.',
            image: '/assets/images/materials/rehabilitation-book.jpg'
        },
        {
            id: 'pilates-book',
            name: '필라테스 전문가 가이드북',
            price: 38000,
            certificateType: 'pilates',
            certificateName: '필라테스 전문가',
            required: false,
            description: '필라테스의 기본 원리부터 고급 기법까지 상세한 가이드북입니다.',
            image: '/assets/images/materials/pilates-book.jpg'
        },
        {
            id: 'recreation-book',
            name: '레크리에이션지도자 활동서',
            price: 28000,
            certificateType: 'recreation',
            certificateName: '레크리에이션지도자',
            required: false,
            description: '다양한 레크리에이션 활동과 프로그램 운영법을 다룬 활동서입니다.',
            image: '/assets/images/materials/recreation-book.jpg'
        }
    ];
    
    // 특정 자격증 타입이 있으면 필터링
    if (materialFlowData.certificateType) {
        return allMaterials.filter(material => 
            material.certificateType === materialFlowData.certificateType
        );
    }
    
    return allMaterials;
}

/**
 * 📋 교재 목록 표시
 */
function displayMaterialsList(materials) {
    console.log('📋 교재 목록 표시:', materials.length + '개');
    
    const materialList = document.getElementById('material-list');
    if (!materialList) return;
    
    materialList.innerHTML = '';
    
    materials.forEach(material => {
        const materialCard = createMaterialCard(material);
        materialList.appendChild(materialCard);
    });
}

/**
 * 🎨 교재 카드 생성
 */
function createMaterialCard(material) {
    const card = document.createElement('div');
    card.className = 'material-card border-2 border-gray-200 rounded-lg p-4 transition-all duration-200 hover:border-blue-300';
    card.dataset.materialId = material.id;
    
    card.innerHTML = `
        <div class="flex items-start space-x-4">
            <!-- 체크박스 -->
            <div class="flex-shrink-0 pt-1">
                <input type="checkbox" 
                    id="material-${material.id}" 
                    name="materials" 
                    value="${material.id}"
                    class="material-checkbox w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    ${material.required ? 'checked disabled' : ''}>
            </div>
            
            <!-- 교재 이미지 -->
            <div class="flex-shrink-0">
                <div class="w-16 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253">
                        </path>
                    </svg>
                </div>
            </div>
            
            <!-- 교재 정보 -->
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h4 class="text-lg font-medium text-gray-900 mb-1">
                            ${material.name}
                            ${material.required ? '<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">필수</span>' : '<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">선택</span>'}
                        </h4>
                        <p class="text-sm text-gray-600 mb-2">${material.certificateName} 전용</p>
                        <p class="text-sm text-gray-500">${material.description}</p>
                    </div>
                    <div class="flex-shrink-0 ml-4">
                        <div class="text-right">
                            <div class="text-lg font-bold text-gray-900">${formatCurrency(material.price)}</div>
                            <div class="text-xs text-gray-500">배송비 별도</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 체크박스 이벤트 리스너
    const checkbox = card.querySelector('.material-checkbox');
    checkbox.addEventListener('change', function() {
        handleMaterialSelection(material, this.checked);
        updateMaterialCardStyle(card, this.checked);
    });
    
    // 필수 교재는 자동 선택
    if (material.required) {
        handleMaterialSelection(material, true);
        updateMaterialCardStyle(card, true);
    }
    
    return card;
}

/**
 * 🎨 교재 카드 스타일 업데이트
 */
function updateMaterialCardStyle(card, selected) {
    if (selected) {
        card.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
        card.classList.remove('border-gray-200');
    } else {
        card.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
        card.classList.add('border-gray-200');
    }
}

/**
 * ✅ 교재 선택 처리
 */
function handleMaterialSelection(material, selected) {
    if (selected) {
        // 선택된 교재에 추가 (중복 방지)
        const existingIndex = materialFlowData.selectedMaterials.findIndex(m => m.id === material.id);
        if (existingIndex === -1) {
            materialFlowData.selectedMaterials.push(material);
        }
    } else {
        // 선택된 교재에서 제거
        materialFlowData.selectedMaterials = materialFlowData.selectedMaterials.filter(m => m.id !== material.id);
    }
    
    console.log('📦 선택된 교재:', materialFlowData.selectedMaterials);
    
    // 가격 재계산
    calculateAndDisplayPricing();
    
    // 버튼 상태 업데이트
    updateButtonStates();
}

/**
 * 📢 교재 필수/선택 안내 설정
 */
function setupMaterialRequirementNotice(materials) {
    const notice = document.getElementById('material-requirement-notice');
    const title = document.getElementById('requirement-title');
    const description = document.getElementById('requirement-description');
    
    if (!notice || !title || !description) return;
    
    const requiredMaterials = materials.filter(m => m.required);
    const optionalMaterials = materials.filter(m => !m.required);
    
    if (requiredMaterials.length > 0) {
        notice.classList.remove('hidden');
        notice.className = 'mb-6 p-4 rounded-lg bg-red-50 border border-red-200';
        title.textContent = '필수 교재 안내';
        description.textContent = `${requiredMaterials.length}개의 필수 교재가 자동으로 선택되었습니다. ${optionalMaterials.length > 0 ? '추가로 선택 교재를 구매하실 수 있습니다.' : ''}`;
    } else if (optionalMaterials.length > 0) {
        notice.classList.remove('hidden');
        notice.className = 'mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200';
        title.textContent = '선택 교재 안내';
        description.textContent = '모든 교재는 선택사항입니다. 필요한 교재만 선택하여 구매하실 수 있습니다.';
    }
}

/**
 * 📭 교재 없음 안내 표시
 */
function displayNoMaterialsNotice() {
    console.log('📭 교재 없음 안내 표시');
    
    const noMaterialsNotice = document.getElementById('no-materials-notice');
    if (noMaterialsNotice) {
        noMaterialsNotice.classList.remove('hidden');
    }
    
    // 교재 없이 진행 버튼 표시
    const skipMaterialBtn = document.getElementById('skip-material-btn');
    if (skipMaterialBtn) {
        skipMaterialBtn.classList.remove('hidden');
    }
}

/**
 * 💰 가격 계산 및 표시
 */
function calculateAndDisplayPricing() {
    console.log('💰 가격 계산 및 표시');
    
    let pricing = {
        education: 0,
        certificate: 0,
        material: 0,
        subtotal: 0,
        discount: 0,
        total: 0
    };
    
    // 교육비 (시나리오 1, 2)
    if (materialFlowData.step1 && materialFlowData.step1.selectedCourseInfo) {
        pricing.education = materialFlowData.step1.selectedCourseInfo.price || 0;
    }
    
    // 자격증비 (시나리오 1, 3)
    if (materialFlowData.step2) {
        pricing.certificate = 50000; // 기본 자격증 발급비
    }
    
    // 교재비
    pricing.material = materialFlowData.selectedMaterials.reduce((sum, material) => sum + material.price, 0);
    
    // 소계
    pricing.subtotal = pricing.education + pricing.certificate + pricing.material;
    
    // 할인 계산 (패키지 할인)
    const discountRate = getPackageDiscountRate();
    if (discountRate > 0 && pricing.subtotal > 0) {
        pricing.discount = Math.floor(pricing.subtotal * (discountRate / 100));
    }
    
    // 최종 금액
    pricing.total = pricing.subtotal - pricing.discount;
    
    // 전역 변수에 저장
    materialFlowData.pricing = pricing;
    
    // UI 업데이트
    updatePricingDisplay(pricing);
    
    console.log('💰 계산된 가격:', pricing);
}

/**
 * 📊 가격 표시 업데이트
 */
function updatePricingDisplay(pricing) {
    // 교육비
    const educationCostRow = document.getElementById('education-cost-row');
    const educationCost = document.getElementById('education-cost');
    if (pricing.education > 0) {
        educationCostRow.classList.remove('hidden');
        educationCost.textContent = formatCurrency(pricing.education);
    } else {
        educationCostRow.classList.add('hidden');
    }
    
    // 자격증비
    const certificateCostRow = document.getElementById('certificate-cost-row');
    const certificateCost = document.getElementById('certificate-cost');
    if (pricing.certificate > 0) {
        certificateCostRow.classList.remove('hidden');
        certificateCost.textContent = formatCurrency(pricing.certificate);
    } else {
        certificateCostRow.classList.add('hidden');
    }
    
    // 교재비
    const materialCost = document.getElementById('material-cost');
    materialCost.textContent = formatCurrency(pricing.material);
    
    // 소계
    const subtotal = document.getElementById('subtotal');
    subtotal.textContent = formatCurrency(pricing.subtotal);
    
    // 할인
    const discountRow = document.getElementById('discount-row');
    const discountSeparator = document.getElementById('discount-separator');
    const discountRate = document.getElementById('discount-rate');
    const discountAmount = document.getElementById('discount-amount');
    
    if (pricing.discount > 0) {
        discountRow.classList.remove('hidden');
        discountSeparator.classList.remove('hidden');
        discountRate.textContent = getPackageDiscountRate();
        discountAmount.textContent = formatCurrency(pricing.discount);
    } else {
        discountRow.classList.add('hidden');
        discountSeparator.classList.add('hidden');
    }
    
    // 최종 금액
    const totalAmount = document.getElementById('total-amount');
    totalAmount.textContent = formatCurrency(pricing.total);
}

/**
 * 🎯 패키지 할인율 계산
 */
function getPackageDiscountRate() {
    // 할인은 전체 플로우(시나리오 1)에서만 적용
    if (materialFlowData.scenario === 1 && materialFlowData.step1) {
        const courseInfo = materialFlowData.step1.selectedCourseInfo;
        if (courseInfo && courseInfo.pricing && courseInfo.pricing.packageDiscount) {
            return courseInfo.pricing.packageDiscount;
        }
    }
    return 0;
}

/**
 * 🔘 버튼 설정 및 상태 관리
 */
function setupButtons() {
    console.log('🔘 버튼 설정');
    
    // 이전 단계 버튼
    setupPreviousStepButton();
    
    // 교재 없이 진행 버튼
    setupSkipMaterialButton();
    
    // 다음 단계 버튼
    setupNextStepButton();
    
    // 교재만 구매 안내
    setupMaterialOnlyNotice();
}

/**
 * ⬅️ 이전 단계 버튼 설정
 */
function setupPreviousStepButton() {
    const prevStepBtn = document.getElementById('prev-step-btn');
    const prevStepText = document.getElementById('prev-step-text');
    
    if (!prevStepBtn || !prevStepText) return;
    
    switch (materialFlowData.scenario) {
        case 1:
            prevStepText.textContent = '자격증 신청으로';
            break;
        case 2:
            prevStepText.textContent = '교육 신청으로';
            break;
        case 3:
            prevStepText.textContent = '자격증 신청으로';
            break;
        case 4:
            prevStepText.textContent = '메인페이지로';
            break;
    }
}

/**
 * ⏭️ 교재 없이 진행 버튼 설정
 */
function setupSkipMaterialButton() {
    const skipMaterialBtn = document.getElementById('skip-material-btn');
    
    if (!skipMaterialBtn) return;
    
    // 시나리오 4(교재구매만)가 아닌 경우에만 표시
    if (materialFlowData.scenario !== 4 && materialFlowData.availableMaterials.length === 0) {
        skipMaterialBtn.classList.remove('hidden');
    }
}

/**
 * ➡️ 다음 단계 버튼 설정
 */
function setupNextStepButton() {
    const nextStepBtn = document.getElementById('next-step-btn');
    const nextStepText = document.getElementById('next-step-text');
    
    if (!nextStepBtn || !nextStepText) return;
    
    // 시나리오별 버튼 텍스트
    switch (materialFlowData.scenario) {
        case 1:
        case 2:
            nextStepText.textContent = '다음 단계: 통합 결제';
            break;
        case 3:
            nextStepText.textContent = '다음 단계: 결제';
            break;
        case 4:
            nextStepText.textContent = '교재 구매하기';
            break;
    }
}

/**
 * 📝 교재만 구매 안내 설정
 */
function setupMaterialOnlyNotice() {
    const materialOnlyNotice = document.getElementById('material-only-notice');
    
    if (!materialOnlyNotice) return;
    
    // 시나리오 4(교재구매만)인 경우에만 표시
    if (materialFlowData.scenario === 4) {
        materialOnlyNotice.classList.remove('hidden');
    }
}

/**
 * 🔄 버튼 상태 업데이트
 */
function updateButtonStates() {
    const nextStepBtn = document.getElementById('next-step-btn');
    
    if (!nextStepBtn) return;
    
    // 선택된 교재가 있거나, 시나리오 4가 아닌 경우 버튼 활성화
    const hasSelectedMaterials = materialFlowData.selectedMaterials.length > 0;
    const isNotMaterialOnly = materialFlowData.scenario !== 4;
    
    if (hasSelectedMaterials || isNotMaterialOnly) {
        nextStepBtn.disabled = false;
        nextStepBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        nextStepBtn.disabled = true;
        nextStepBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

/**
 * 🎧 이벤트 리스너 설정
 */
function setupEventListeners() {
    console.log('🎧 이벤트 리스너 설정');
    
    // 폼 제출 이벤트
    const materialForm = document.getElementById('material-form');
    if (materialForm) {
        materialForm.addEventListener('submit', handleFormSubmission);
    }
    
    // 이전 단계 버튼
    const prevStepBtn = document.getElementById('prev-step-btn');
    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', handlePreviousStep);
    }
    
    // 교재 없이 진행 버튼
    const skipMaterialBtn = document.getElementById('skip-material-btn');
    if (skipMaterialBtn) {
        skipMaterialBtn.addEventListener('click', handleSkipMaterial);
    }
    
    // 다음 단계 버튼
    const nextStepBtn = document.getElementById('next-step-btn');
    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', handleNextStep);
    }
}

/**
 * 📤 폼 제출 처리
 */
async function handleFormSubmission(event) {
    event.preventDefault();
    await handleNextStep();
}

/**
 * ⬅️ 이전 단계 처리
 */
function handlePreviousStep() {
    console.log('⬅️ 이전 단계로 이동');
    
    try {
        let targetUrl = '';
        
        switch (materialFlowData.scenario) {
            case 1:
                // 자격증 신청으로 돌아가기
                targetUrl = window.adjustPath('pages/education/cert-application.html?from=material-selection');
                break;
            case 2:
                // 교육 신청으로 돌아가기
                targetUrl = window.adjustPath('pages/education/course-application.html?from=material-selection');
                break;
            case 3:
                // 자격증 신청으로 돌아가기
                targetUrl = window.adjustPath('pages/education/cert-application.html?from=material-selection');
                break;
            case 4:
                // 메인페이지로
                targetUrl = window.adjustPath('index.html');
                break;
        }
        
        if (targetUrl) {
            window.location.href = targetUrl;
        }
        
    } catch (error) {
        console.error('❌ 이전 단계 이동 오류:', error);
        showErrorMessage('이전 단계로 이동하는 중 오류가 발생했습니다.');
    }
}

/**
 * ⏭️ 교재 없이 진행 처리
 */
async function handleSkipMaterial() {
    console.log('⏭️ 교재 없이 진행');
    
    try {
        // 교재 선택 없이 결제 단계로 진행
        materialFlowData.selectedMaterials = [];
        await proceedToPayment();
        
    } catch (error) {
        console.error('❌ 교재 없이 진행 오류:', error);
        showErrorMessage('결제 단계로 진행하는 중 오류가 발생했습니다.');
    }
}

/**
 * ➡️ 다음 단계 처리
 */
async function handleNextStep() {
    console.log('➡️ 다음 단계 처리');
    
    try {
        // 로딩 표시
        showLoadingModal('결제 단계 준비 중...');
        
        // 유효성 검사
        if (!validateMaterialSelection()) {
            hideLoadingModal();
            return;
        }
        
        // 3단계 데이터 수집 및 저장
        const step3Data = collectStep3Data();
        saveFlowStepData('step3', step3Data);
        
        // 결제 단계로 진행
        await proceedToPayment();
        
    } catch (error) {
        console.error('❌ 다음 단계 처리 오류:', error);
        hideLoadingModal();
        showErrorMessage('다음 단계로 진행하는 중 오류가 발생했습니다.');
    }
}

/**
 * ✅ 교재 선택 유효성 검사
 */
function validateMaterialSelection() {
    // 시나리오 4(교재구매만)인 경우 반드시 교재 선택 필요
    if (materialFlowData.scenario === 4) {
        if (materialFlowData.selectedMaterials.length === 0) {
            showWarningMessage('구매할 교재를 선택해주세요.');
            return false;
        }
    }
    
    // 필수 교재 확인
    const requiredMaterials = materialFlowData.availableMaterials.filter(m => m.required);
    const selectedRequiredMaterials = materialFlowData.selectedMaterials.filter(m => m.required);
    
    if (requiredMaterials.length !== selectedRequiredMaterials.length) {
        showErrorMessage('필수 교재를 모두 선택해주세요.');
        return false;
    }
    
    return true;
}

/**
 * 📦 3단계 데이터 수집
 */
function collectStep3Data() {
    return {
        step: 3,
        stepName: 'material-selection',
        scenario: materialFlowData.scenario,
        timestamp: new Date().toISOString(),
        selectedMaterials: materialFlowData.selectedMaterials,
        pricing: materialFlowData.pricing,
        certificateType: materialFlowData.certificateType
    };
}

/**
 * 🚀 결제 단계로 진행
 */
async function proceedToPayment() {
    console.log('🚀 결제 단계로 진행');
    
    try {
        // URL 파라미터 구성
        const params = new URLSearchParams({
            from: 'material-selection',
            scenario: materialFlowData.scenario,
            step: '3'
        });
        
        // 자격증 타입 추가 (있는 경우)
        if (materialFlowData.certificateType) {
            params.set('certType', materialFlowData.certificateType);
        }
        
        // 결제 페이지 URL (아직 생성되지 않음, 4단계에서 생성 예정)
        const targetUrl = window.adjustPath(`pages/payment/payment-integration.html?${params.toString()}`);
        
        console.log('📍 결제 페이지로 이동:', targetUrl);
        
        // 성공 메시지
        showSuccessMessage('교재 선택이 완료되었습니다. 결제 페이지로 이동합니다.');
        
        // 페이지 이동
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 1500);
        
    } catch (error) {
        console.error('❌ 결제 단계 진행 오류:', error);
        showErrorMessage('결제 단계로 진행하는 중 오류가 발생했습니다.');
    }
}

// =================================
// 유틸리티 함수들
// =================================

/**
 * 💾 플로우 단계 데이터 저장
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

/**
 * 💾 플로우 데이터 가져오기
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
 * 👤 회원 정보 로드
 */
async function loadMemberInfo() {
    console.log('👤 회원 정보 로드');
    
    try {
        if (!window.dhcFirebase?.auth?.currentUser) {
            console.log('비로그인 상태');
            updateUserInfo('로그인하지 않음', false);
            return;
        }
        
        const user = window.dhcFirebase.auth.currentUser;
        updateUserInfo(user.email, true);
        
        console.log('✅ 회원 정보 로드 완료:', user.email);
        
    } catch (error) {
        console.error('❌ 회원 정보 로드 오류:', error);
    }
}

/**
 * 👤 사용자 정보 UI 업데이트
 */
function updateUserInfo(userInfo, isLoggedIn) {
    const userInfoElement = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userInfoElement) {
        userInfoElement.textContent = userInfo;
    }
    
    if (logoutBtn) {
        if (isLoggedIn) {
            logoutBtn.classList.remove('hidden');
            logoutBtn.addEventListener('click', handleLogout);
        } else {
            logoutBtn.classList.add('hidden');
        }
    }
}

/**
 * 🚪 로그아웃 처리
 */
async function handleLogout() {
    try {
        if (window.dhcFirebase?.auth) {
            await window.dhcFirebase.auth.signOut();
        }
        
        showSuccessMessage('로그아웃되었습니다.');
        
        setTimeout(() => {
            window.location.href = window.adjustPath('index.html');
        }, 1000);
        
    } catch (error) {
        console.error('로그아웃 오류:', error);
        showErrorMessage('로그아웃 중 오류가 발생했습니다.');
    }
}

/**
 * 🏷️ 자격증 이름 반환
 */
function getCertificateName(type) {
    const types = {
        'health-exercise': '건강운동처방사',
        'health': '건강운동처방사',
        'rehabilitation': '운동재활전문가',
        'rehab': '운동재활전문가',
        'pilates': '필라테스 전문가',
        'recreation': '레크리에이션지도자'
    };
    return types[type] || type;
}

/**
 * 📝 교재 설명 생성
 */
function generateMaterialDescription(certificateType) {
    const descriptions = {
        'health-exercise': '건강운동처방의 이론과 실무를 다룬 종합 교재입니다.',
        'rehabilitation': '운동재활의 과학적 접근과 실무 사례를 담은 교재입니다.',
        'pilates': '필라테스의 기본 원리부터 고급 기법까지 상세한 가이드북입니다.',
        'recreation': '다양한 레크리에이션 활동과 프로그램 운영법을 다룬 활동서입니다.'
    };
    return descriptions[certificateType] || '전문적인 지식과 실무 능력 향상을 위한 교재입니다.';
}

/**
 * 🖼️ 교재 이미지 경로 반환
 */
function getMaterialImage(certificateType) {
    return `/assets/images/materials/${certificateType}-book.jpg`;
}

/**
 * 💰 통화 포맷팅
 */
function formatCurrency(amount) {
    if (window.formatters && window.formatters.formatCurrency) {
        return window.formatters.formatCurrency(amount);
    }
    return '₩' + amount.toLocaleString('ko-KR');
}

/**
 * 🔄 로딩 모달 표시
 */
function showLoadingModal(message = '처리 중입니다...') {
    const modal = document.getElementById('loading-modal');
    const messageElement = document.getElementById('loading-message');
    
    if (modal) {
        if (messageElement) {
            messageElement.textContent = message;
        }
        modal.classList.remove('hidden');
    }
}

/**
 * ❌ 로딩 모달 숨기기
 */
function hideLoadingModal() {
    const modal = document.getElementById('loading-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// =================================
// 메시지 및 알림 시스템
// =================================

/**
 * ✅ 성공 메시지 표시
 */
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

/**
 * ⚠️ 경고 메시지 표시
 */
function showWarningMessage(message) {
    showMessage(message, 'warning');
}

/**
 * ❌ 오류 메시지 표시
 */
function showErrorMessage(message) {
    showMessage(message, 'error');
}

/**
 * 💬 토스트 메시지 표시
 */
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
// 스타일 추가
// =================================

const materialSelectionStyles = document.createElement('style');
materialSelectionStyles.textContent = `
    /* 플로우 진행 상황 스타일 */
    .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .step-icon {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
        transition: all 0.3s ease;
    }
    
    .step-text {
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .step-connector {
        width: 2rem;
        height: 2px;
        background-color: #d1d5db;
        margin: 1rem 0;
    }
    
    /* 단계별 스타일 */
    .step.completed .step-icon {
        background-color: #10b981;
        color: white;
    }
    
    .step.completed .step-text {
        color: #10b981;
    }
    
    .step.active .step-icon {
        background-color: #3b82f6;
        color: white;
    }
    
    .step.active .step-text {
        color: #3b82f6;
        font-weight: 600;
    }
    
    .step.pending .step-icon {
        background-color: #f3f4f6;
        color: #9ca3af;
        border: 2px solid #d1d5db;
    }
    
    .step.pending .step-text {
        color: #6b7280;
    }
    
    .step.skipped {
        opacity: 0.3;
    }
    
    .step.skipped .step-icon {
        background-color: #f3f4f6;
        color: #9ca3af;
        border: 2px dashed #d1d5db;
    }
    
    /* 교재 카드 스타일 */
    .material-card {
        transition: all 0.2s ease;
    }
    
    .material-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .material-checkbox:checked + .step-icon {
        background-color: #3b82f6;
    }
    
    /* 로딩 요소 */
    .loading::after {
        content: '...';
        animation: loading 1s infinite;
    }
    
    @keyframes loading {
        0%, 33% { content: '.'; }
        34%, 66% { content: '..'; }
        67%, 100% { content: '...'; }
    }
    
    /* 반응형 스타일 */
    @media (max-width: 768px) {
        .step {
            font-size: 0.875rem;
        }
        
        .step-icon {
            width: 1.5rem;
            height: 1.5rem;
            font-size: 0.75rem;
        }
        
        .step-connector {
            width: 1rem;
        }
        
        .material-card {
            padding: 1rem;
        }
    }
`;
document.head.appendChild(materialSelectionStyles);

// =================================
// 디버깅 도구 (개발 모드)
// =================================

if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('.web.app') || 
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {
    
    window.debugMaterialSelection = {
        // 현재 상태 확인
        getState: function() {
            console.log('📊 현재 교재 선택 상태:');
            console.log('시나리오:', materialFlowData.scenario);
            console.log('플로우 데이터:', materialFlowData);
            return materialFlowData;
        },
        
        // 시나리오 강제 설정
        setScenario: function(scenario) {
            console.log(`🔧 시나리오 강제 설정: ${scenario}`);
            materialFlowData.scenario = scenario;
            updateFlowProgress();
            updatePageTitle();
            setupButtons();
        },
        
        // 테스트 데이터 추가
        addTestData: function() {
            console.log('🧪 테스트 데이터 추가');
            
            // 1단계 데이터 (교육신청)
            materialFlowData.step1 = {
                'applicant-name': '홍길동',
                'selectedCourseInfo': {
                    title: '건강운동처방사 25년 상반기 과정',
                    price: 350000,
                    certificateType: 'health-exercise',
                    pricing: {
                        packageDiscount: 15
                    }
                }
            };
            
            // 2단계 데이터 (자격증신청)
            materialFlowData.step2 = {
                'cert-type': 'health-exercise',
                'name': '홍길동',
                'certificateName': '건강운동처방사'
            };
            
            // 플로우 데이터 저장
            const flowData = {
                step1: materialFlowData.step1,
                step2: materialFlowData.step2
            };
            localStorage.setItem('dhc_flow_data', JSON.stringify(flowData));
            
            console.log('✅ 테스트 데이터 추가 완료');
            
            // 페이지 새로고침
            location.reload();
        },
        
        // 교재 선택 시뮬레이션
        selectAllMaterials: function() {
            console.log('📦 모든 교재 선택');
            
            const checkboxes = document.querySelectorAll('.material-checkbox:not(:disabled)');
            checkboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        },
        
        // 가격 계산 테스트
        testPricing: function() {
            console.log('💰 가격 계산 테스트');
            calculateAndDisplayPricing();
            console.log('계산된 가격:', materialFlowData.pricing);
        },
        
        // 결제 단계 시뮬레이션
        simulatePayment: function() {
            console.log('🚀 결제 단계 시뮬레이션');
            handleNextStep();
        },
        
        // 플로우 데이터 초기화
        clearFlowData: function() {
            console.log('🧹 플로우 데이터 초기화');
            localStorage.removeItem('dhc_flow_data');
            location.reload();
        },
        
        // 도움말
        help: function() {
            console.log('🎯 교재 선택 페이지 디버깅 도구');
            console.log('');
            console.log('📊 상태 확인:');
            console.log('- getState() : 현재 상태 확인');
            console.log('');
            console.log('🔧 시나리오 테스트:');
            console.log('- setScenario(1) : 전체 플로우');
            console.log('- setScenario(2) : 교육신청만');
            console.log('- setScenario(3) : 자격증신청만');
            console.log('- setScenario(4) : 교재구매만');
            console.log('');
            console.log('🧪 테스트:');
            console.log('- addTestData() : 테스트 데이터 추가 후 새로고침');
            console.log('- selectAllMaterials() : 모든 교재 선택');
            console.log('- testPricing() : 가격 계산 테스트');
            console.log('- simulatePayment() : 결제 단계 시뮬레이션');
            console.log('');
            console.log('🧹 유틸리티:');
            console.log('- clearFlowData() : 플로우 데이터 초기화');
        }
    };
    
    console.log('🔧 교재 선택 페이지 디버깅 도구 활성화됨');
    console.log('💡 도움말: window.debugMaterialSelection.help()');
}

// =================================
// 최종 완료 메시지
// =================================

console.log('\n🎉 === material-selection.js 4가지 시나리오 지원 버전 완료 ===');
console.log('✅ 시나리오 1: 교육신청 → 자격증신청 → 교재선택 → 통합결제');
console.log('✅ 시나리오 2: 교육신청 → 교재선택 → 결제');
console.log('✅ 시나리오 3: 자격증신청 → 교재선택 → 결제');
console.log('✅ 시나리오 4: 교재구매만 → 결제');
console.log('✅ course-management 가격 설정 연동');
console.log('✅ 실시간 가격 계산 및 할인 적용');
console.log('✅ Firebase 연동 진행 상황 저장');
console.log('✅ 4가지 시나리오별 플로우 진행 상황 표시');
console.log('✅ 교재 필수/선택 처리');
console.log('✅ 포괄적인 디버깅 도구');
console.log('\n🔧 Phase 2-B-2 완료: 교재 선택 페이지 생성');
console.log('🚀 다음은 Phase 2-B-3: 기존 페이지들 진입점 수정');

// 완료 플래그 설정
window.materialSelectionReady = true;