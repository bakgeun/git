/**
 * 🔧 course-management-enhanced.js
 * 통합 가격 설정 기능이 포함된 개선된 교육 관리 페이지 스크립트
 * 문법 오류 수정 완료 버전
 */

// 🔧 의존성 체크 함수
function checkAdminDependencies() {
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
        console.error('⚠️ 관리자 페이지 필수 유틸리티가 로드되지 않음:', missing.map(m => m.path));
        return false;
    }

    console.log('✅ 관리자 페이지 모든 필수 유틸리티 로드 확인됨');
    return true;
}

// 🔧 Firebase 연결 상태 확인 함수
function checkFirebaseConnection() {
    console.log('🔥 Firebase 연결 상태 확인...');

    if (!window.dhcFirebase) {
        console.warn('⚠️ Firebase가 초기화되지 않음');
        return { connected: false, reason: 'not_initialized' };
    }

    if (!window.dhcFirebase.db) {
        console.warn('⚠️ Firestore 데이터베이스가 초기화되지 않음');
        return { connected: false, reason: 'db_not_initialized' };
    }

    console.log('✅ Firebase 연결 상태 정상');
    return { connected: true };
}

// 🚀 개선된 교육 관리 객체 - 통합 가격 설정 기능 포함
window.courseManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    instructors: [],
    courses: [],
    initialized: false,

    /**
     * 🎯 초기화 함수 - async 문법 수정
     */
    init: async function () {
        this.initialized = false;

        try {
            console.log('🚀 통합 교육 관리자 초기화 시작');

            // 의존성 체크
            if (!checkAdminDependencies()) {
                console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
                this.showDependencyError();
                return false;
            }

            // Firebase 초기화 대기
            await this.waitForFirebase();

            // 강사 목록 로드
            await this.loadInstructors();

            // 🔧 NEW: 가격 계산 이벤트 리스너 설정
            this.initPricingCalculator();

            // 폼 제출 이벤트 리스너 설정
            this.setupFormEventListeners();

            // 검색 필터 초기화
            this.initSearchFilters();

            // 자동 미리보기 초기화
            this.initAutoPreview();

            // 교육 과정 목록 로드
            await this.loadCoursesWithRetry();

            this.initialized = true;
            console.log('✅ 통합 교육 관리자 초기화 완료');
            return true;

        } catch (error) {
            console.error('❌ 교육 관리자 초기화 오류:', error);
            this.handleInitializationError(error);
            return false;
        }
    },

    /**
     * 🔧 NEW: 실시간 가격 계산기 초기화
     */
    initPricingCalculator: function () {
        console.log('💰 실시간 가격 계산기 초기화');

        // 가격 입력 필드들
        const priceInputs = [
            'course-price',
            'certificate-price',
            'material-price',
            'package-discount'
        ];

        // 🔧 NEW: 체크박스 추가 (교재 필수 여부가 계산에 영향)
        const checkboxes = [
            'material-required',
            'enable-installment'
        ];

        // 가격 입력 시 실시간 계산
        priceInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                // input 이벤트로 실시간 반응
                input.addEventListener('input', () => {
                    this.updatePricePreview();
                    this.updatePackageLabel(); // 🔧 NEW: 라벨 업데이트
                });

                // change 이벤트로 확실한 반응
                input.addEventListener('change', () => {
                    this.updatePricePreview();
                    this.updatePackageLabel(); // 🔧 NEW: 라벨 업데이트
                });
            }
        });

        // 체크박스 변경 시 실시간 계산
        checkboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updatePricePreview();
                    this.updatePackageLabel(); // 🔧 NEW: 라벨 업데이트
                });
            }
        });

        // 초기 미리보기 표시
        this.updatePricePreview();
        this.updatePackageLabel(); // 🔧 NEW: 초기 라벨 설정
    },

    /**
     * 🔧 NEW: 패키지 라벨 업데이트 (교재 필수 여부에 따라)
     */
    updatePackageLabel: function () {
        const materialRequired = document.getElementById('material-required')?.checked || false;
        const packageDiscountInput = document.getElementById('package-discount');
        const packageDiscount = packageDiscountInput ? parseInt(packageDiscountInput.value) || 0 : 0;
        const packageLabelElement = document.getElementById('package-label');

        if (packageLabelElement) {
            if (packageDiscount === 0) {
                // 할인이 0%인 경우
                packageLabelElement.textContent = '총 가격:';
            } else if (materialRequired) {
                // 교재 필수 + 할인 있음
                packageLabelElement.textContent = `전체 패키지 (${packageDiscount}% 할인):`;
            } else {
                // 교재 선택 + 할인 있음
                packageLabelElement.textContent = `기본 패키지 (${packageDiscount}% 할인):`;
            }
        }
    },

    /**
     * 🔧 NEW: 실시간 가격 미리보기 업데이트
     */
    updatePricePreview: function () {
        try {
            // 입력값 수집 (기본값 수정)
            const educationPrice = parseInt(document.getElementById('course-price')?.value) || 0;
            const certificatePrice = parseInt(document.getElementById('certificate-price')?.value) || 50000;
            const materialPrice = parseInt(document.getElementById('material-price')?.value) || 30000;

            // 🔧 수정: 기본값을 0으로 변경하고 실제 입력값 사용
            const packageDiscountInput = document.getElementById('package-discount');
            const packageDiscount = packageDiscountInput ? parseInt(packageDiscountInput.value) || 0 : 0;

            // 교재 필수 여부 확인
            const materialRequired = document.getElementById('material-required')?.checked || false;

            // 🔧 수정: 명확한 할인 계산 로직
            let individualTotal, packageTotal, discountAmount;

            // 개별 총합 계산 (항상 모든 항목 포함)
            individualTotal = educationPrice + certificatePrice + materialPrice;

            if (materialRequired) {
                // 교재가 필수인 경우: 전체 금액에 할인 적용
                if (packageDiscount > 0) {
                    discountAmount = Math.floor(individualTotal * (packageDiscount / 100));
                    packageTotal = individualTotal - discountAmount;
                } else {
                    // 할인이 0%인 경우
                    discountAmount = 0;
                    packageTotal = individualTotal;
                }
            } else {
                // 교재가 선택인 경우: 기본 패키지(교육+자격증)만 할인
                const basePackage = educationPrice + certificatePrice;

                if (packageDiscount > 0) {
                    const baseDiscountAmount = Math.floor(basePackage * (packageDiscount / 100));
                    packageTotal = (basePackage - baseDiscountAmount) + materialPrice;
                    discountAmount = baseDiscountAmount; // 실제 절약 금액은 기본 패키지 할인분만
                } else {
                    // 할인이 0%인 경우
                    discountAmount = 0;
                    packageTotal = individualTotal;
                }
            }

            // 미리보기 요소들 업데이트
            this.updatePriceElement('preview-education', educationPrice);
            this.updatePriceElement('preview-certificate', certificatePrice);
            this.updatePriceElement('preview-material', materialPrice);
            this.updatePriceElement('preview-individual-total', individualTotal);
            this.updatePriceElement('preview-package-total', packageTotal);
            this.updatePriceElement('preview-savings', discountAmount);

            // 🔧 수정: 할인이 없는 경우 UI 조정
            const savingsElement = document.querySelector('.price-item.savings');
            if (savingsElement) {
                if (packageDiscount === 0 || discountAmount === 0) {
                    savingsElement.style.display = 'none';
                } else {
                    savingsElement.style.display = 'flex';
                }
            }

            // 🔧 수정: 패키지 가격 스타일 및 라벨 조정
            const packageElement = document.querySelector('.price-item.package');
            if (packageElement) {
                if (packageDiscount === 0 || discountAmount === 0) {
                    // 할인이 없으면 일반 총합 스타일
                    packageElement.classList.remove('package');
                    packageElement.classList.add('total');
                } else {
                    // 할인이 있으면 패키지 스타일
                    packageElement.classList.remove('total');
                    packageElement.classList.add('package');
                }
            }

            console.log('💰 가격 미리보기 업데이트:', {
                education: educationPrice,
                certificate: certificatePrice,
                material: materialPrice,
                materialRequired: materialRequired,
                individual: individualTotal,
                package: packageTotal,
                discount: packageDiscount + '%',
                savings: discountAmount
            });

        } catch (error) {
            console.error('❌ 가격 미리보기 업데이트 오류:', error);
        }
    },

    /**
     * 🔧 NEW: 가격 요소 업데이트 헬퍼
     */
    updatePriceElement: function (elementId, amount) {
        const element = document.getElementById(elementId);
        if (element && window.formatters) {
            element.textContent = window.formatters.formatCurrency(amount);
        }
    },

    /**
     * Firebase 초기화 대기 - async 문법 수정
     */
    waitForFirebase: async function () {
        if (!window.dhcFirebase || !window.dhcFirebase.db) {
            console.log('⏳ Firebase 초기화 대기 중...');

            let attempts = 0;
            const maxAttempts = 50; // 10초 대기

            while ((!window.dhcFirebase || !window.dhcFirebase.db) && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                console.warn('⚠️ Firebase 초기화 시간 초과, 테스트 데이터로 진행');
            } else {
                console.log('✅ Firebase 초기화 완료');
            }
        }
    },

    /**
     * 폼 이벤트 리스너 설정
     */
    setupFormEventListeners: function () {
        const courseForm = document.getElementById('course-form');
        if (courseForm) {
            courseForm.addEventListener('submit', (event) => {
                this.handleCourseSubmission(event);
            });
            console.log('✅ 폼 제출 이벤트 리스너 설정 완료');
        }
    },

    /**
     * 강사 목록 로드 - async 문법 수정
     */
    loadInstructors: async function () {
        try {
            console.log('👥 강사 목록 로드 시작');

            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                const result = await window.dbService.getDocuments('instructors', {
                    orderBy: [{ field: 'name', direction: 'asc' }]
                });

                if (result.success) {
                    this.instructors = result.data;
                    console.log('Firebase에서 로드된 강사 수:', this.instructors.length);
                } else {
                    console.warn('Firebase 강사 데이터 로드 실패, 테스트 데이터 사용');
                    this.instructors = this.getTestInstructors();
                }
            } else {
                console.log('Firebase 미연동, 테스트 강사 데이터 사용');
                this.instructors = this.getTestInstructors();
            }

            this.updateInstructorDropdown();
            console.log('✅ 강사 목록 로드 완료');

        } catch (error) {
            console.error('강사 목록 로드 오류:', error);
            this.instructors = this.getTestInstructors();
            this.updateInstructorDropdown();
        }
    },

    /**
     * 테스트용 강사 데이터
     */
    getTestInstructors: function () {
        return [
            {
                id: 'instructor-1',
                name: '김운동 교수',
                email: 'kim.exercise@dhc.kr',
                specialties: ['health-exercise'],
                qualification: '운동생리학 박사',
                experience: '15년'
            },
            {
                id: 'instructor-2',
                name: '이재활 박사',
                email: 'lee.rehab@dhc.kr',
                specialties: ['rehabilitation'],
                qualification: '물리치료학 박사',
                experience: '12년'
            },
            {
                id: 'instructor-3',
                name: '박필라 마스터',
                email: 'park.pilates@dhc.kr',
                specialties: ['pilates'],
                qualification: '필라테스 마스터 트레이너',
                experience: '10년'
            },
            {
                id: 'instructor-4',
                name: '최레크 선생',
                email: 'choi.recreation@dhc.kr',
                specialties: ['recreation'],
                qualification: '레크리에이션 전문가',
                experience: '8년'
            },
            {
                id: 'instructor-5',
                name: '정다능 교수',
                email: 'jung.multi@dhc.kr',
                specialties: ['health-exercise', 'rehabilitation', 'pilates', 'recreation'],
                qualification: '체육학 박사',
                experience: '20년'
            }
        ];
    },

    /**
     * 강사 드롭다운 업데이트
     */
    updateInstructorDropdown: function () {
        const instructorSelect = document.getElementById('course-instructor');
        if (!instructorSelect) return;

        let optionsHtml = '<option value="">강사를 선택하세요</option>';

        this.instructors.forEach(instructor => {
            const specialtiesText = instructor.specialties ?
                ` (${instructor.specialties.map(s => this.getCertificateName(s)).join(', ')})` : '';

            optionsHtml += `<option value="${instructor.id}" data-name="${instructor.name}">
                ${instructor.name}${specialtiesText}
            </option>`;
        });

        instructorSelect.innerHTML = optionsHtml;
    },

    /**
     * 검색 필터 초기화
     */
    initSearchFilters: function () {
        const searchInput = document.getElementById('search-course-name');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.search();
                }
            });
        }

        const filters = ['filter-certificate-type', 'filter-status'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.search();
                });
            }
        });
    },

    /**
     * 자동 미리보기 초기화
     */
    initAutoPreview: function () {
        const certificateSelect = document.getElementById('course-certificate-type');
        const startDateInput = document.getElementById('course-start-date');

        if (certificateSelect && startDateInput) {
            [certificateSelect, startDateInput].forEach(input => {
                input.addEventListener('change', () => {
                    this.updateAutoPreview();
                });
            });
        }
    },

    /**
     * 자동 생성 미리보기 업데이트
     */
    updateAutoPreview: function () {
        const certificateType = document.getElementById('course-certificate-type')?.value;
        const startDate = document.getElementById('course-start-date')?.value;

        if (!certificateType || !startDate) return;

        const generatedTitle = this.generateCourseTitle(certificateType, new Date(startDate));

        const autoInfo = document.querySelector('.auto-generation-info');
        if (autoInfo) {
            let previewElement = autoInfo.querySelector('.title-preview');
            if (!previewElement) {
                previewElement = document.createElement('div');
                previewElement.className = 'title-preview';
                previewElement.style.cssText = 'margin-top: 0.5rem; padding: 0.5rem; background: #f0f9ff; border-radius: 4px; font-size: 0.875rem;';
                autoInfo.appendChild(previewElement);
            }
            previewElement.innerHTML = `<strong>생성될 교육명:</strong> ${generatedTitle}`;
        }
    },

    /**
     * 교육명 자동 생성
     */
    generateCourseTitle: function (certificateType, startDate) {
        const certName = this.getCertificateName(certificateType);
        const year = startDate.getFullYear().toString().slice(-2);
        const month = startDate.getMonth() + 1;
        const period = month <= 6 ? '상반기' : '하반기';

        return `${certName} ${year}년 ${period} 과정`;
    },

    /**
     * 기수 자동 생성
     */
    generateCoursePeriod: function (startDate) {
        const year = startDate.getFullYear().toString().slice(-2);
        const month = startDate.getMonth() + 1;
        const period = month <= 6 ? '상반기' : '하반기';

        return `${year}년 ${period}`;
    },

    /**
     * 교육 과정 목록 로드 (재시도 로직) - async 문법 수정
     */
    loadCoursesWithRetry: async function (maxRetries = 3) {
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📋 교육 과정 로드 시도 ${attempt}/${maxRetries}`);
                await this.loadCourses();
                console.log('✅ 교육 과정 로드 성공');
                return;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ 교육 과정 로드 시도 ${attempt} 실패:`, error);

                if (attempt < maxRetries) {
                    const delay = attempt * 1000;
                    console.log(`⏳ ${delay}ms 후 재시도...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`❌ ${maxRetries}번 시도 후 교육 과정 로드 실패:`, lastError);
        await this.fallbackToTestData();
    },

    /**
     * 교육 과정 목록 로드 - async 문법 수정
     */
    loadCourses: async function () {
        try {
            console.log('📋 교육 과정 로드 시작');

            this.showLoadingState();

            let courses = [];

            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                console.log('🔥 Firebase에서 교육 과정 로드 시작');

                const searchOptions = this.buildSearchOptions();
                const result = await window.dbService.getDocuments('courses', searchOptions);

                if (result.success) {
                    courses = result.data;
                    console.log('✅ Firebase에서 로드된 교육 과정 수:', courses.length);

                    courses.sort((a, b) => {
                        const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
                        const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);
                        return dateB.getTime() - dateA.getTime();
                    });
                } else {
                    throw new Error(result.error.message || 'Firebase 데이터 로드 실패');
                }
            } else {
                console.log('⚠️ Firebase 미연동, 테스트 데이터 사용');
                courses = this.getTestCourseData();
            }

            this.courses = courses;
            this.updateCourseTable(courses);
            console.log('✅ 교육 과정 목록 로드 완료');

        } catch (error) {
            console.error('❌ 교육 과정 목록 로드 오류:', error);
            throw error;
        }
    },

    /**
     * 로딩 상태 표시
     */
    showLoadingState: function () {
        const tbody = document.querySelector('#course-table tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-4 text-gray-500">
                        <div class="flex items-center justify-center space-x-2">
                            <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>데이터 로딩 중...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * 테스트 데이터로 폴백 - async 문법 수정
     */
    fallbackToTestData: async function () {
        console.log('🔄 테스트 데이터로 폴백');
        try {
            const testCourses = this.getTestCourseData();
            this.courses = testCourses;
            this.updateCourseTable(testCourses);

            if (window.adminAuth?.showNotification) {
                window.adminAuth.showNotification('서버 연결에 문제가 있어 테스트 데이터를 표시합니다.', 'warning');
            }
        } catch (fallbackError) {
            console.error('❌ 테스트 데이터 폴백도 실패:', fallbackError);
            this.showErrorState();
        }
    },

    /**
     * 검색 옵션 구성
     */
    buildSearchOptions: function () {
        const options = { where: [] };

        const certificateType = document.getElementById('filter-certificate-type')?.value;
        if (certificateType) {
            options.where.push({ field: 'certificateType', operator: '==', value: certificateType });
        }

        const status = document.getElementById('filter-status')?.value;
        if (status) {
            options.where.push({ field: 'status', operator: '==', value: status });
        }

        return options;
    },

    /**
     * 검색 기능
     */
    search: function () {
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCourses();
    },

    /**
     * 검색 필터 초기화
     */
    resetFilters: function () {
        console.log('검색 필터 초기화');

        // 검색 필드 초기화
        const searchInput = document.getElementById('search-course-name');
        if (searchInput) searchInput.value = '';

        const certificateTypeFilter = document.getElementById('filter-certificate-type');
        if (certificateTypeFilter) certificateTypeFilter.value = '';

        const statusFilter = document.getElementById('filter-status');
        if (statusFilter) statusFilter.value = '';

        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCourses();

        if (window.adminAuth?.showNotification) {
            window.adminAuth.showNotification('검색 필터가 초기화되었습니다.', 'info');
        }
    },

    /**
     * 🔧 NEW: 통합 가격 설정이 포함된 교육 과정 테이블 업데이트
     */
    updateCourseTable: function (courses) {
        const tbody = document.querySelector('#course-table tbody');

        if (!courses || courses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="admin-empty-state">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253">
                            </path>
                        </svg>
                        <h3>등록된 교육 과정이 없습니다</h3>
                        <p>새로운 교육 과정을 추가해보세요.</p>
                    </td>
                </tr>
            `;
            return;
        }

        // 클라이언트 필터링 (검색어)
        const searchKeyword = document.getElementById('search-course-name')?.value;
        let filteredCourses = courses;

        if (searchKeyword) {
            filteredCourses = courses.filter(course =>
                course.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                course.instructor?.toLowerCase().includes(searchKeyword.toLowerCase())
            );
        }

        if (filteredCourses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="admin-empty-state">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z">
                            </path>
                        </svg>
                        <h3>검색 결과가 없습니다</h3>
                        <p>다른 검색어로 시도해보세요.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';

        filteredCourses.forEach(course => {
            try {
                const startDate = course.startDate instanceof Date ? course.startDate : new Date(course.startDate?.seconds * 1000 || 0);
                const endDate = course.endDate instanceof Date ? course.endDate : new Date(course.endDate?.seconds * 1000 || 0);
                const applyStartDate = course.applyStartDate instanceof Date ? course.applyStartDate : new Date(course.applyStartDate?.seconds * 1000 || 0);
                const applyEndDate = course.applyEndDate instanceof Date ? course.applyEndDate : new Date(course.applyEndDate?.seconds * 1000 || 0);

                const formatDate = (date) => window.formatters.formatDate(date, 'YYYY-MM-DD');
                const formatCurrency = (value) => window.formatters.formatCurrency(value);

                const getStatusBadge = (status) => {
                    const badges = {
                        'active': '<span class="status-badge status-active">모집중</span>',
                        'closed': '<span class="status-badge status-suspended">마감</span>',
                        'completed': '<span class="status-badge status-inactive">종료</span>',
                        'preparing': '<span class="status-badge status-available">준비중</span>'
                    };
                    return badges[status] || `<span class="status-badge status-inactive">${status}</span>`;
                };

                const coursePeriod = this.generateCoursePeriod(startDate);

                // 🔧 NEW: 통합 가격 정보 표시 (HTML 테이블 구조와 일치)
                html += `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td data-label="자격증">${this.getCertificateName(course.certificateType)}</td>
                        <td data-label="기수">${coursePeriod}</td>
                        <td data-label="강사">${course.instructor || '-'}</td>
                        <td data-label="교육기간">${formatDate(startDate)} ~ ${formatDate(endDate)}</td>
                        <td data-label="신청기간">${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}</td>
                        <td data-label="교육비">${formatCurrency(course.price || course.pricing?.education || 0)}</td>
                        <td data-label="자격증비">${formatCurrency(course.certificatePrice || course.pricing?.certificate || 50000)}</td>
                        <td data-label="교재비">${formatCurrency(course.materialPrice || course.pricing?.material || 30000)}</td>
                        <td data-label="정원/신청자">${course.enrolledCount || 0}/${course.capacity}명</td>
                        <td data-label="상태">${getStatusBadge(course.status)}</td>
                        <td data-label="작업">
                            <div class="table-actions">
                                <button onclick="courseManager.viewCourse('${course.id}')" 
                                    class="table-action-btn btn-view" title="상세 보기">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z">
                                        </path>
                                    </svg>
                                    상세
                                </button>
                                <button onclick="courseManager.editCourse('${course.id}')" 
                                    class="table-action-btn btn-edit" title="수정">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                                        </path>
                                    </svg>
                                    수정
                                </button>
                                <button onclick="courseManager.deleteCourse('${course.id}')" 
                                    class="table-action-btn btn-delete" title="삭제">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                        </path>
                                    </svg>
                                    삭제
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            } catch (error) {
                console.error('과정 렌더링 오류:', course, error);
            }
        });

        tbody.innerHTML = html;
    },

    /**
     * 🔧 NEW: 통합 가격 설정이 포함된 테스트 과정 데이터
     */
    getTestCourseData: function () {
        const now = new Date();
        const oneMonth = 30 * 24 * 60 * 60 * 1000;

        return [
            {
                id: 'test-health-1',
                title: '건강운동처방사 25년 상반기 과정',
                certificateType: 'health-exercise',
                instructor: '김운동 교수',
                startDate: new Date(now.getTime() + oneMonth),
                endDate: new Date(now.getTime() + oneMonth * 3),
                applyStartDate: new Date(now.getTime() - oneMonth * 0.5),
                applyEndDate: new Date(now.getTime() + oneMonth * 0.5),
                // 🔧 NEW: 통합 가격 정보
                price: 350000,           // 교육비
                certificatePrice: 50000, // 자격증 발급비  
                materialPrice: 30000,    // 교재비
                pricing: {
                    education: 350000,
                    certificate: 50000,
                    material: 30000,
                    materialRequired: false,
                    packageDiscount: 10,
                    enableInstallment: true
                },
                materialName: '건강운동처방사 전문교재',
                capacity: 30,
                enrolledCount: 18,
                status: 'active',
                method: '온라인 + 오프라인 병행',
                location: '서울 강남구 센터'
            },
            {
                id: 'test-rehab-1',
                title: '운동재활전문가 25년 상반기 과정',
                certificateType: 'rehabilitation',
                instructor: '이재활 박사',
                startDate: new Date(now.getTime() + oneMonth * 1.5),
                endDate: new Date(now.getTime() + oneMonth * 4.5),
                applyStartDate: new Date(now.getTime()),
                applyEndDate: new Date(now.getTime() + oneMonth),
                // 🔧 NEW: 통합 가격 정보
                price: 420000,
                certificatePrice: 55000,
                materialPrice: 35000,
                pricing: {
                    education: 420000,
                    certificate: 55000,
                    material: 35000,
                    materialRequired: true,
                    packageDiscount: 15,
                    enableInstallment: true
                },
                materialName: '운동재활전문가 실무교재',
                capacity: 25,
                enrolledCount: 22,
                status: 'active',
                method: '온라인 + 오프라인 병행',
                location: '서울 강남구 센터'
            },
            {
                id: 'test-pilates-1',
                title: '필라테스 전문가 25년 하반기 과정',
                certificateType: 'pilates',
                instructor: '박필라 마스터',
                startDate: new Date(now.getTime() + oneMonth * 3),
                endDate: new Date(now.getTime() + oneMonth * 6),
                applyStartDate: new Date(now.getTime() + oneMonth),
                applyEndDate: new Date(now.getTime() + oneMonth * 2.5),
                // 🔧 NEW: 통합 가격 정보
                price: 480000,
                certificatePrice: 60000,
                materialPrice: 40000,
                pricing: {
                    education: 480000,
                    certificate: 60000,
                    material: 40000,
                    materialRequired: false,
                    packageDiscount: 12,
                    enableInstallment: false
                },
                materialName: '필라테스 전문가 가이드북',
                capacity: 20,
                enrolledCount: 0,
                status: 'preparing',
                method: '오프라인 집중과정',
                location: '서울 강남구 센터'
            }
        ];
    },

    /**
     * 교육 과정 추가 모달 표시
     */
    showAddCourseModal: function () {
        const modal = document.getElementById('course-modal');
        if (modal) {
            // 폼 초기화
            const form = document.getElementById('course-form');
            if (form) {
                form.reset();
                form.removeAttribute('data-course-id');

                // 🔧 수정: 기본 가격 값 설정 (할인율 0%로 변경)
                document.getElementById('certificate-price').value = '50000';
                document.getElementById('material-price').value = '30000';
                document.getElementById('package-discount').value = '0'; // 🔧 0%로 변경

                // 기본값 설정
                document.getElementById('course-method').value = '온라인 + 오프라인 병행';
                document.getElementById('course-location').value = '서울 강남구 센터';
                document.getElementById('course-status').value = 'preparing';
            }

            // 모달 제목 설정
            const modalTitle = document.getElementById('course-modal-title');
            if (modalTitle) {
                modalTitle.textContent = '교육 과정 추가';
            }

            // 미리보기 초기화
            const previewElement = document.querySelector('.title-preview');
            if (previewElement) {
                previewElement.remove();
            }

            // 🔧 가격 미리보기 초기화
            this.updatePricePreview();
            this.updatePackageLabel();

            // 모달 표시
            modal.classList.remove('hidden');
        }
    },

    /**
     * 교육 과정 모달 닫기
     */
    closeCourseModal: function () {
        const modal = document.getElementById('course-modal');
        if (modal) {
            modal.classList.add('hidden');

            // 폼 리셋
            const form = document.getElementById('course-form');
            if (form) {
                form.reset();
                form.removeAttribute('data-course-id');
            }

            // 미리보기 제거
            const previewElement = document.querySelector('.title-preview');
            if (previewElement) {
                previewElement.remove();
            }
        }
    },

    /**
     * 🔧 NEW: 통합 가격 설정이 포함된 교육 과정 제출 처리 - async 문법 수정
     */
    handleCourseSubmission: async function (event) {
        event.preventDefault();

        try {
            const form = event.target;
            const courseId = form.getAttribute('data-course-id');
            const isEditMode = !!courseId;

            // 🔧 NEW: 통합 가격 정보를 포함한 폼 데이터 수집
            const formData = this.collectEnhancedFormData(form);
            if (!formData) return;

            // 🔧 NEW: 통합 가격 설정이 포함된 과정 데이터 생성
            const courseData = this.buildEnhancedCourseData(formData);

            console.log('교육 과정 저장 시도:', isEditMode ? '수정' : '추가', courseData);

            // Firebase 저장
            if (window.dhcFirebase && window.dhcFirebase.db) {
                if (isEditMode) {
                    console.log('교육 과정 수정:', courseId);
                    courseData.updatedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    await window.dhcFirebase.db.collection('courses').doc(courseId).update(courseData);
                    console.log('교육 과정 수정 완료');

                    if (window.adminAuth?.showNotification) {
                        window.adminAuth.showNotification('교육 과정이 성공적으로 수정되었습니다.', 'success');
                    }
                } else {
                    console.log('교육 과정 추가');
                    courseData.createdAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    courseData.enrolledCount = 0;

                    const docRef = await window.dhcFirebase.db.collection('courses').add(courseData);
                    console.log('교육 과정 추가 완료, 문서 ID:', docRef.id);

                    if (window.adminAuth?.showNotification) {
                        window.adminAuth.showNotification('교육 과정이 성공적으로 추가되었습니다.', 'success');
                    }
                }
            } else {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            // 모달 닫기
            this.closeCourseModal();

            // 목록 새로고침
            setTimeout(async () => {
                try {
                    await this.loadCourses();
                    console.log('목록 새로고침 완료');
                } catch (refreshError) {
                    console.error('목록 새로고침 오류:', refreshError);
                    if (window.adminAuth?.showNotification) {
                        window.adminAuth.showNotification('목록을 새로고침하는데 문제가 발생했습니다.', 'warning');
                    }
                }
            }, 500);

        } catch (error) {
            console.error('교육 과정 처리 오류:', error);
            this.handleSubmissionError(error);
        }
    },

    /**
     * 🔧 NEW: 통합 가격 정보가 포함된 폼 데이터 수집 및 검증
     */
    collectEnhancedFormData: function (form) {
        // 기본 정보
        const certificateType = form.querySelector('#course-certificate-type').value;
        const instructorId = form.querySelector('#course-instructor').value;
        const startDate = new Date(form.querySelector('#course-start-date').value);
        const endDate = new Date(form.querySelector('#course-end-date').value);
        const applyStartDate = new Date(form.querySelector('#course-apply-start-date').value);
        const applyEndDate = new Date(form.querySelector('#course-apply-end-date').value);
        const capacity = parseInt(form.querySelector('#course-capacity').value);
        const status = form.querySelector('#course-status').value;
        const method = form.querySelector('#course-method').value;
        const location = form.querySelector('#course-location').value;

        // 🔧 NEW: 통합 가격 정보
        const price = parseInt(form.querySelector('#course-price').value) || 0;
        const certificatePrice = parseInt(form.querySelector('#certificate-price').value) || 50000;
        const materialPrice = parseInt(form.querySelector('#material-price').value) || 30000;
        const materialName = form.querySelector('#material-name')?.value || '';
        const materialRequired = form.querySelector('#material-required')?.checked || false;
        const packageDiscount = parseInt(form.querySelector('#package-discount')?.value) || 10;
        const enableInstallment = form.querySelector('#enable-installment')?.checked || false;

        // 유효성 검사
        if (!certificateType || !instructorId || !startDate || !endDate || !applyStartDate || !applyEndDate) {
            window.adminAuth?.showNotification('모든 필수 항목을 입력하세요.', 'error');
            return null;
        }

        if (endDate <= startDate) {
            window.adminAuth?.showNotification('교육 종료일은 시작일보다 이후여야 합니다.', 'error');
            return null;
        }

        if (applyEndDate <= applyStartDate) {
            window.adminAuth?.showNotification('신청 종료일은 시작일보다 이후여야 합니다.', 'error');
            return null;
        }

        if (applyEndDate >= startDate) {
            window.adminAuth?.showNotification('신청 종료일은 교육 시작일보다 이전이어야 합니다.', 'error');
            return null;
        }

        // 🔧 NEW: 가격 유효성 검사
        if (price <= 0) {
            window.adminAuth?.showNotification('교육비를 올바르게 입력하세요.', 'error');
            return null;
        }

        if (certificatePrice < 0) {
            window.adminAuth?.showNotification('자격증 발급비는 0원 이상이어야 합니다.', 'error');
            return null;
        }

        if (materialPrice < 0) {
            window.adminAuth?.showNotification('교재비는 0원 이상이어야 합니다.', 'error');
            return null;
        }

        // 강사 이름 찾기
        const instructor = this.instructors.find(inst => inst.id === instructorId);
        const instructorName = instructor ? instructor.name : '';

        return {
            certificateType,
            instructorId,
            instructorName,
            startDate,
            endDate,
            applyStartDate,
            applyEndDate,
            capacity,
            status,
            method,
            location,
            // 🔧 NEW: 통합 가격 정보
            price,
            certificatePrice,
            materialPrice,
            materialName,
            materialRequired,
            packageDiscount,
            enableInstallment
        };
    },

    /**
     * 🔧 NEW: 통합 가격 설정이 포함된 과정 데이터 구성
     */
    buildEnhancedCourseData: function (formData) {
        // 자동 생성 데이터
        const title = this.generateCourseTitle(formData.certificateType, formData.startDate);
        const description = this.generateCourseDescription(formData.certificateType);

        const courseData = {
            title: title,
            certificateType: formData.certificateType,
            instructor: formData.instructorName,
            instructorId: formData.instructorId,
            description: description,
            capacity: formData.capacity,
            method: formData.method || '온라인 + 오프라인 병행',
            location: formData.location || '서울 강남구 센터',
            status: formData.status,

            // 🔧 NEW: 통합 가격 정보 (기존 구조 + 새로운 구조 모두 지원)
            price: formData.price,                    // 기존 필드 (하위 호환성)
            certificatePrice: formData.certificatePrice,
            materialPrice: formData.materialPrice,
            materialName: formData.materialName,
            materialRequired: formData.materialRequired,

            // 🔧 NEW: 통합 가격 객체 (토스페이먼츠 연동용)
            pricing: {
                education: formData.price,
                certificate: formData.certificatePrice,
                material: formData.materialPrice,
                materialRequired: formData.materialRequired,
                packageDiscount: formData.packageDiscount,
                enableInstallment: formData.enableInstallment
            }
        };

        // Firebase 타임스탬프로 변환
        if (window.dhcFirebase && window.dhcFirebase.firebase) {
            courseData.startDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(formData.startDate);
            courseData.endDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(formData.endDate);
            courseData.applyStartDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(formData.applyStartDate);
            courseData.applyEndDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(formData.applyEndDate);
        } else {
            courseData.startDate = formData.startDate;
            courseData.endDate = formData.endDate;
            courseData.applyStartDate = formData.applyStartDate;
            courseData.applyEndDate = formData.applyEndDate;
        }

        return courseData;
    },

    /**
     * 자격증별 기본 설명 생성
     */
    generateCourseDescription: function (certificateType) {
        const descriptions = {
            'health-exercise': '질병 예방과 건강 증진을 위한 맞춤형 운동처방 전문가 양성 과정입니다. 이론 40시간, 실습 20시간으로 구성되어 있으며, 체계적인 교육을 통해 전문적인 지식과 실무 능력을 기를 수 있습니다.',
            'rehabilitation': '부상 및 질환 이후 효과적인 운동재활 프로그램 설계 및 지도 전문가 양성 과정입니다. 임상 경험이 풍부한 전문가들이 실무 중심의 교육을 제공합니다.',
            'pilates': '과학적 원리 기반의 체계적인 필라테스 실기 및 이론 전문가 양성 과정입니다. 국제 인증 기준에 맞춘 커리큘럼으로 전문성을 갖춘 지도자를 양성합니다.',
            'recreation': '즐거운 신체활동과 여가생활을 위한 레크리에이션 지도 전문가 양성 과정입니다. 다양한 연령층을 대상으로 한 프로그램 기획 및 운영 능력을 기릅니다.'
        };

        return descriptions[certificateType] || '전문적인 지식과 실무 능력을 갖춘 전문가 양성 과정입니다.';
    },

    /**
     * 🔧 NEW: 통합 가격 정보가 포함된 교육 과정 상세 보기 - async 문법 수정
     */
    viewCourse: async function (courseId) {
        try {
            let course = this.courses.find(c => c.id === courseId);

            if (!course && window.dhcFirebase && window.dhcFirebase.db) {
                const doc = await window.dhcFirebase.db.collection('courses').doc(courseId).get();
                if (doc.exists) {
                    course = { id: doc.id, ...doc.data() };
                }
            }

            if (!course) {
                window.adminAuth?.showNotification('해당 교육 과정을 찾을 수 없습니다.', 'error');
                return;
            }

            // 날짜 포맷팅
            const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
            const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);
            const applyStartDate = course.applyStartDate?.toDate ? course.applyStartDate.toDate() : new Date(course.applyStartDate);
            const applyEndDate = course.applyEndDate?.toDate ? course.applyEndDate.toDate() : new Date(course.applyEndDate);

            const formatDate = (date) => window.formatters.formatDate(date, 'YYYY.MM.DD');
            const formatCurrency = (price) => window.formatters.formatCurrency(price);

            // 🔧 NEW: 통합 가격 정보 포함한 상세 정보
            const pricingInfo = course.pricing || {
                education: course.price,
                certificate: course.certificatePrice || 50000,
                material: course.materialPrice || 30000,
                packageDiscount: 10
            };

            const individualTotal = pricingInfo.education + pricingInfo.certificate + pricingInfo.material;
            const packageTotal = individualTotal - Math.floor(individualTotal * (pricingInfo.packageDiscount / 100));
            const savings = individualTotal - packageTotal;

            alert(`
========== 교육 과정 상세 정보 ==========

📚 기본 정보
교육명: ${course.title}
자격증: ${this.getCertificateName(course.certificateType)}
강사: ${course.instructor}

📅 일정 정보
교육 기간: ${formatDate(startDate)} ~ ${formatDate(endDate)}
신청 기간: ${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}

👥 수강 정보
정원: ${course.capacity}명
현재 신청자: ${course.enrolledCount || 0}명
교육 방식: ${course.method || '-'}
교육 장소: ${course.location || '-'}
상태: ${course.status}

💰 통합 가격 정보
교육비: ${formatCurrency(pricingInfo.education)}
자격증 발급비: ${formatCurrency(pricingInfo.certificate)}
교재비: ${formatCurrency(pricingInfo.material)}
교재명: ${course.materialName || '기본 교재'}
교재 필수: ${course.materialRequired ? '예' : '아니오'}

개별 총합: ${formatCurrency(individualTotal)}
패키지 가격: ${formatCurrency(packageTotal)} (${pricingInfo.packageDiscount}% 할인)
패키지 절약: ${formatCurrency(savings)}
분할 결제: ${pricingInfo.enableInstallment ? '허용' : '불허'}

📝 설명
${course.description || '내용 없음'}
            `);

        } catch (error) {
            console.error('교육 과정 상세 보기 오류:', error);
            window.adminAuth?.showNotification('교육 과정 정보를 불러오는데 실패했습니다.', 'error');
        }
    },

    /**
     * 🔧 NEW: 통합 가격 정보가 포함된 교육 과정 수정 - async 문법 수정
     */
    editCourse: async function (courseId) {
        try {
            let course = this.courses.find(c => c.id === courseId);

            if (!course && window.dhcFirebase && window.dhcFirebase.db) {
                const doc = await window.dhcFirebase.db.collection('courses').doc(courseId).get();
                if (doc.exists) {
                    course = { id: doc.id, ...doc.data() };
                }
            }

            if (!course) {
                window.adminAuth?.showNotification('교육 과정을 찾을 수 없습니다.', 'error');
                return;
            }

            // 모달 표시 및 데이터 채우기
            const modal = document.getElementById('course-modal');
            if (modal) {
                // 모달 제목 변경
                document.getElementById('course-modal-title').textContent = '교육 과정 수정';

                // 폼 데이터 채우기
                const form = document.getElementById('course-form');

                // 기본 정보
                form.querySelector('#course-certificate-type').value = course.certificateType || '';
                form.querySelector('#course-instructor').value = course.instructorId || '';
                form.querySelector('#course-capacity').value = course.capacity || '';
                form.querySelector('#course-status').value = course.status || 'preparing';
                form.querySelector('#course-method').value = course.method || '온라인 + 오프라인 병행';
                form.querySelector('#course-location').value = course.location || '서울 강남구 센터';

                // 🔧 NEW: 통합 가격 정보 채우기
                const pricing = course.pricing || {};
                form.querySelector('#course-price').value = course.price || pricing.education || '';
                form.querySelector('#certificate-price').value = course.certificatePrice || pricing.certificate || 50000;
                form.querySelector('#material-price').value = course.materialPrice || pricing.material || 30000;
                form.querySelector('#package-discount').value = pricing.packageDiscount || 10;

                // 교재 정보
                const materialNameField = form.querySelector('#material-name');
                if (materialNameField) {
                    materialNameField.value = course.materialName || '';
                }

                const materialRequiredField = form.querySelector('#material-required');
                if (materialRequiredField) {
                    materialRequiredField.checked = course.materialRequired || pricing.materialRequired || false;
                }

                const enableInstallmentField = form.querySelector('#enable-installment');
                if (enableInstallmentField) {
                    enableInstallmentField.checked = pricing.enableInstallment || false;
                }

                // 날짜 형식 처리
                const formatDateForInput = (date) => {
                    if (!date) return '';
                    const d = date instanceof Date ? date :
                        (date.toDate ? date.toDate() : new Date(date));
                    return d.toISOString().split('T')[0];
                };

                form.querySelector('#course-start-date').value = formatDateForInput(course.startDate);
                form.querySelector('#course-end-date').value = formatDateForInput(course.endDate);
                form.querySelector('#course-apply-start-date').value = formatDateForInput(course.applyStartDate);
                form.querySelector('#course-apply-end-date').value = formatDateForInput(course.applyEndDate);

                // 수정 모드임을 표시
                form.setAttribute('data-course-id', courseId);

                // 미리보기 업데이트
                this.updateAutoPreview();

                // 🔧 NEW: 가격 미리보기 업데이트
                this.updatePricePreview();

                // 모달 표시
                modal.classList.remove('hidden');
            }
        } catch (error) {
            console.error('교육 과정 수정 준비 오류:', error);
            window.adminAuth?.showNotification('교육 과정 정보를 불러오는데 실패했습니다.', 'error');
        }
    },

    /**
     * 교육 과정 삭제
     */
    deleteCourse: function (courseId) {
        if (confirm('정말로 이 교육 과정을 삭제하시겠습니까?\n\n삭제된 과정은 복구할 수 없습니다.')) {
            this.handleDeleteCourse(courseId);
        }
    },

    /**
     * 교육 과정 삭제 처리 - async 문법 수정
     */
    handleDeleteCourse: async function (courseId) {
        try {
            // Firebase 삭제
            if (window.dhcFirebase && window.dhcFirebase.db) {
                await window.dhcFirebase.db.collection('courses').doc(courseId).delete();
            }

            // 성공 메시지
            window.adminAuth?.showNotification('교육 과정이 삭제되었습니다.', 'success');

            // 목록 새로고침
            this.loadCourses();

        } catch (error) {
            console.error('교육 과정 삭제 오류:', error);
            window.adminAuth?.showNotification('교육 과정 삭제 중 오류가 발생했습니다.', 'error');
        }
    },

    /**
     * 제출 오류 처리
     */
    handleSubmissionError: function (error) {
        console.error('교육 과정 처리 오류:', error);

        if (window.adminAuth?.showNotification) {
            let errorMessage = '교육 과정 처리 중 오류가 발생했습니다.';

            if (error.code === 'permission-denied') {
                errorMessage = '데이터베이스 접근 권한이 없습니다. 관리자에게 문의해주세요.';
            } else if (error.code === 'unavailable') {
                errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
            }

            window.adminAuth.showNotification(errorMessage, 'error');
        }
    },

    /**
     * 의존성 오류 표시
     */
    showDependencyError: function () {
        const tbody = document.querySelector('#course-table tbody');
        if (tbody) {
            tbody.innerHTML = `
            <tr>
                    <td colspan="11" class="text-center py-4 text-red-500">
                        <div class="text-red-600 text-lg font-semibold mb-2">⚠️ 시스템 오류</div>
                        <p class="text-red-700 mb-4">필수 유틸리티 파일이 로드되지 않았습니다.</p>
                        <p class="text-red-600 text-sm">페이지를 새로고침하거나 관리자에게 문의하세요.</p>
                        <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                            새로고침
                        </button>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * 오류 상태 표시
     */
    showErrorState: function () {
        const tbody = document.querySelector('#course-table tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-4 text-red-500">
                        데이터 로드에 실패했습니다. 페이지를 새로고침해주세요.
                        <br>
                        <button onclick="window.location.reload()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            새로고침
                        </button>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * 초기화 오류 처리
     */
    handleInitializationError: function (error) {
        try {
            console.log('🔄 초기화 실패, 테스트 데이터로 폴백');
            const testCourses = this.getTestCourseData();
            this.courses = testCourses;
            this.updateCourseTable(testCourses);
            console.log('✅ 테스트 데이터 폴백 완료');
        } catch (fallbackError) {
            console.error('❌ 폴백 데이터 로드도 실패:', fallbackError);
            this.showErrorState();
        }

        if (window.adminAuth?.showNotification) {
            window.adminAuth.showNotification('초기화 중 오류가 발생했습니다.', 'error');
        }

        this.initialized = false;
    },

    /**
     * 자격증 이름 반환
     */
    getCertificateName: function (type) {
        const types = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        return types[type] || type;
    }
};

// 🔧 전역 함수들 노출
window.checkDependencies = checkAdminDependencies;
window.checkFirebaseConnection = checkFirebaseConnection;

// 🎯 페이지 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function () {
    console.log('🌐 통합 교육 관리 페이지 DOMContentLoaded');
    // courseManager는 이미 window에 등록됨
});

// 🎯 페이지 완전 로드 후 초기화
window.addEventListener('load', function () {
    console.log('🌐 통합 교육 관리 페이지 load 이벤트');

    // 지연 초기화로 모든 스크립트 로딩 완료 후 실행
    setTimeout(() => {
        // adminUtils 초기화
        if (window.adminUtils && window.adminUtils.initAdminPage) {
            console.log('🔧 adminUtils 초기화 시작');
            window.adminUtils.initAdminPage();
            console.log('✅ adminUtils 초기화 완료');
        }

        // courseManager 초기화
        if (window.courseManager && window.courseManager.init) {
            console.log('🚀 통합 courseManager 초기화 시작');
            window.courseManager.init().then(() => {
                console.log('✅ 통합 courseManager 초기화 완료');
            }).catch(error => {
                console.error('❌ 통합 courseManager 초기화 오류:', error);
            });
        }
    }, 2000); // 2초 지연
});

// 🎯 디버깅 도구 (개발 모드)
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.FORCE_DEBUG === true) {

    window.debugCourseManager = {
        // 🔧 NEW: 통합 가격 설정 테스트 함수들

        /**
         * 의존성 테스트
         */
        testDependencies: function () {
            console.log('🔧 통합 교육 관리 의존성 테스트...');
            const result = checkAdminDependencies();
            if (result) {
                console.log('✅ 모든 유틸리티 정상 로드됨');

                // Firebase 연결 상태도 확인
                const firebaseStatus = checkFirebaseConnection();
                console.log('Firebase 상태:', firebaseStatus);

                // 기능 테스트
                try {
                    const testDate = new Date();
                    console.log('📅 formatters.formatDate 테스트:', window.formatters.formatDate(testDate, 'YYYY-MM-DD'));
                    console.log('💰 formatters.formatCurrency 테스트:', window.formatters.formatCurrency(350000));
                } catch (error) {
                    console.error('❌ 유틸리티 함수 테스트 실패:', error);
                }

                return result && firebaseStatus.connected;
            } else {
                console.error('❌ 필수 유틸리티 누락');
                return false;
            }
        },

        /**
         * 강사 목록 확인
         */
        showInstructors: function () {
            console.log('현재 강사 목록:', window.courseManager.instructors);
        },

        /**
         * 과정 목록 확인
         */
        showCourses: function () {
            console.log('현재 과정 목록:', window.courseManager.courses);
        },

        /**
         * 🔧 NEW: 통합 가격 설정 테스트 데이터로 폼 채우기
         */
        fillTestData: function () {
            const form = document.getElementById('course-form');
            if (!form) {
                console.log('폼이 열려있지 않습니다. 먼저 "교육 과정 추가" 버튼을 클릭하세요.');
                return;
            }

            // 기본 정보 입력
            form.querySelector('#course-certificate-type').value = 'health-exercise';
            form.querySelector('#course-capacity').value = '30';

            // 🔧 NEW: 통합 가격 정보 입력
            form.querySelector('#course-price').value = '350000';          // 교육비
            form.querySelector('#certificate-price').value = '50000';      // 자격증비
            form.querySelector('#material-price').value = '30000';         // 교재비

            const materialNameField = form.querySelector('#material-name');
            if (materialNameField) {
                materialNameField.value = '건강운동처방사 전문교재';
            }

            form.querySelector('#package-discount').value = '15';          // 15% 할인

            const materialRequiredField = form.querySelector('#material-required');
            if (materialRequiredField) {
                materialRequiredField.checked = false;       // 교재 선택
            }

            const enableInstallmentField = form.querySelector('#enable-installment');
            if (enableInstallmentField) {
                enableInstallmentField.checked = true;       // 분할결제 허용
            }

            // 날짜 설정 (다음 달부터 3개월 과정)
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);

            const endDate = new Date(nextMonth);
            endDate.setMonth(endDate.getMonth() + 3);

            const applyStart = new Date();
            const applyEnd = new Date(nextMonth);
            applyEnd.setDate(applyEnd.getDate() - 7);

            form.querySelector('#course-start-date').value = nextMonth.toISOString().split('T')[0];
            form.querySelector('#course-end-date').value = endDate.toISOString().split('T')[0];
            form.querySelector('#course-apply-start-date').value = applyStart.toISOString().split('T')[0];
            form.querySelector('#course-apply-end-date').value = applyEnd.toISOString().split('T')[0];

            // 강사 선택 (첫 번째 강사)
            const instructorSelect = form.querySelector('#course-instructor');
            if (instructorSelect.options.length > 1) {
                instructorSelect.selectedIndex = 1;
            }

            // 미리보기 업데이트
            window.courseManager.updateAutoPreview();
            window.courseManager.updatePricePreview();

            console.log('✅ 통합 가격 설정 테스트 데이터 입력 완료');
            console.log('💡 가격 미리보기가 자동으로 계산되었는지 확인하세요');
        },

        /**
         * 🔧 NEW: 가격 계산기 테스트
         */
        testPricingCalculator: function () {
            console.log('💰 가격 계산기 테스트 시작...');

            if (!window.courseManager.initialized) {
                console.warn('⚠️ courseManager가 초기화되지 않음');
                return;
            }

            // 테스트 가격으로 계산
            const testPricing = {
                education: 400000,
                certificate: 60000,
                material: 35000,
                discount: 20
            };

            console.log('📊 테스트 가격 정보:', testPricing);

            const individual = testPricing.education + testPricing.certificate + testPricing.material;
            const discountAmount = Math.floor(individual * (testPricing.discount / 100));
            const packageTotal = individual - discountAmount;

            console.log(`💵 개별 총합: ${window.formatters.formatCurrency(individual)}`);
            console.log(`🎁 패키지 가격: ${window.formatters.formatCurrency(packageTotal)} (${testPricing.discount}% 할인)`);
            console.log(`💚 절약 금액: ${window.formatters.formatCurrency(discountAmount)}`);

            return {
                individual,
                package: packageTotal,
                savings: discountAmount
            };
        },

        /**
         * 강제 초기화
         */
        forceInit: function () {
            console.log('🔧 통합 courseManager 강제 초기화');
            window.courseManager.init();
        },

        /**
         * 강제 데이터 로드
         */
        forceLoad: function () {
            console.log('🔧 강제 데이터 로드');
            window.courseManager.loadCourses();
        },

        /**
         * adminUtils 강제 초기화
         */
        forceAdminInit: function () {
            console.log('🔧 adminUtils 강제 초기화');
            if (window.adminUtils && window.adminUtils.initAdminPage) {
                window.adminUtils.initAdminPage();
            }
        },

        /**
         * 도움말
         */
        help: function () {
            console.log('🎯 통합 가격 설정이 포함된 교육 관리 디버깅 도구');
            console.log('');
            console.log('🔧 의존성 관리:');
            console.log('- testDependencies() : 유틸리티 의존성 확인');
            console.log('');
            console.log('📊 데이터 확인:');
            console.log('- showInstructors() : 강사 목록 확인');
            console.log('- showCourses() : 과정 목록 확인');
            console.log('');
            console.log('🧪 테스트:');
            console.log('- fillTestData() : 통합 가격 설정 테스트 데이터로 폼 채우기');
            console.log('- testPricingCalculator() : 가격 계산기 테스트');
            console.log('');
            console.log('🔧 강제 실행:');
            console.log('- forceInit() : courseManager 강제 초기화');
            console.log('- forceLoad() : 강제 데이터 로드');
            console.log('- forceAdminInit() : adminUtils 강제 초기화');
            console.log('');
            console.log('💡 사용법:');
            console.log('1. testDependencies() : 먼저 의존성 확인');
            console.log('2. 교육 과정 추가 버튼 클릭');
            console.log('3. fillTestData() : 통합 가격 설정 테스트 데이터 입력');
            console.log('4. 가격 미리보기 확인');
            console.log('5. 저장 버튼 클릭');
            console.log('');
            console.log('🎯 새로운 기능:');
            console.log('- 실시간 가격 계산');
            console.log('- 패키지 할인 적용');
            console.log('- 교재 필수/선택 설정');
            console.log('- 분할 결제 설정');
            console.log('- 토스페이먼츠 연동 준비');
        }
    };

    console.log('🎯 통합 가격 설정이 포함된 교육 관리 디버깅 도구 활성화됨');
    console.log('💡 도움말: window.debugCourseManager.help()');
}