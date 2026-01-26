/**
 * 🔧 course-management-enhanced.js
 * 통합 가격 설정 기능이 포함된 개선된 교육 관리 페이지 스크립트
 * 🔧 수정: 중복 생성, 할인율 0%, 이벤트 리스너 중복 방지 완료 버전
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
    isSubmitting: false, // 🔧 NEW: 중복 제출 방지 플래그
    eventListenersSet: false, // 🔧 NEW: 이벤트 리스너 중복 등록 방지

    // 🆕 신청자 페이지네이션 변수
    applicantsCurrentPage: 1,
    applicantsPageSize: 10,
    applicantsTotalCount: 0,
    allApplicants: [], // 전체 신청자 목록 저장

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

            // 🔧 수정: 폼 제출 이벤트 리스너 설정 (중복 방지)
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
        console.log('💰 간소화된 실시간 가격 계산기 초기화');

        // 가격 입력 필드들
        const priceInputs = [
            'course-price',
            'certificate-price',
            'material-price',
            'package-discount'
        ];

        // 가격 입력 시 실시간 계산
        priceInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                // input 이벤트로 실시간 반응
                input.addEventListener('input', () => {
                    this.updatePricePreview();
                    this.updatePackageLabel();
                });

                // change 이벤트로 확실한 반응
                input.addEventListener('change', () => {
                    this.updatePricePreview();
                    this.updatePackageLabel();
                });
            }
        });

        // 초기 미리보기 표시
        this.updatePricePreview();
        this.updatePackageLabel();
    },

    /**
     * 🔧 NEW: 패키지 라벨 업데이트 (교재 필수 여부에 따라)
     */
    updatePackageLabel: function () {
        const packageDiscountInput = document.getElementById('package-discount');

        // 할인율 처리 로직
        let packageDiscount = 0;
        if (packageDiscountInput && packageDiscountInput.value !== '') {
            const discountValue = parseInt(packageDiscountInput.value);
            packageDiscount = isNaN(discountValue) ? 0 : discountValue;
        }

        const packageLabelElement = document.getElementById('package-label');

        if (packageLabelElement) {
            if (packageDiscount === 0) {
                packageLabelElement.textContent = '총 가격:';
            } else {
                packageLabelElement.textContent = `패키지 가격 (${packageDiscount}% 할인):`;
            }
        }
    },

    /**
     * 🔧 수정: 실시간 가격 미리보기 업데이트 (할인율 0% 처리 개선)
     */
    updatePricePreview: function () {
        try {
            // 입력값 수집 - 빈 값을 0으로 처리
            const educationPriceInput = document.getElementById('course-price')?.value;
            const certificatePriceInput = document.getElementById('certificate-price')?.value;
            const materialPriceInput = document.getElementById('material-price')?.value;

            const educationPrice = educationPriceInput === '' ? 0 : parseInt(educationPriceInput) || 0;
            const certificatePrice = certificatePriceInput === '' ? 0 : parseInt(certificatePriceInput) || 0;
            const materialPrice = materialPriceInput === '' ? 0 : parseInt(materialPriceInput) || 0;
            // 할인율 처리 로직 개선
            const packageDiscountInput = document.getElementById('package-discount');
            let packageDiscount = 0;

            if (packageDiscountInput && packageDiscountInput.value !== '') {
                const discountValue = parseInt(packageDiscountInput.value);
                packageDiscount = isNaN(discountValue) ? 0 : Math.max(0, Math.min(100, discountValue));
            }

            // 🔧 간소화된 할인 계산 로직
            let individualTotal, packageTotal, discountAmount;

            // 개별 총합 계산 (항상 모든 항목 포함)
            individualTotal = educationPrice + certificatePrice + materialPrice;

            // 패키지 할인 적용 (교재는 항상 선택사항으로 처리)
            if (packageDiscount > 0) {
                discountAmount = Math.floor(individualTotal * (packageDiscount / 100));
                packageTotal = individualTotal - discountAmount;
            } else {
                discountAmount = 0;
                packageTotal = individualTotal;
            }

            // 미리보기 요소들 업데이트
            this.updatePriceElement('preview-education', educationPrice);
            this.updatePriceElement('preview-certificate', certificatePrice);
            this.updatePriceElement('preview-material', materialPrice);
            this.updatePriceElement('preview-individual-total', individualTotal);
            this.updatePriceElement('preview-package-total', packageTotal);
            this.updatePriceElement('preview-savings', discountAmount);

            // 할인이 없는 경우 UI 조정
            const savingsElement = document.querySelector('.price-item.savings');
            if (savingsElement) {
                if (packageDiscount === 0 || discountAmount === 0) {
                    savingsElement.style.display = 'none';
                } else {
                    savingsElement.style.display = 'flex';
                }
            }

            // 패키지 가격 스타일 조정
            const packageElement = document.querySelector('.price-item.package');
            if (packageElement) {
                if (packageDiscount === 0 || discountAmount === 0) {
                    packageElement.classList.remove('package');
                    packageElement.classList.add('total');
                } else {
                    packageElement.classList.remove('total');
                    packageElement.classList.add('package');
                }
            }

            console.log('💰 간소화된 가격 미리보기 업데이트:', {
                education: educationPrice,
                certificate: certificatePrice,
                material: materialPrice,
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
     * 🔧 수정: 폼 이벤트 리스너 설정 (중복 등록 방지)
     */
    setupFormEventListeners: function () {
        // 🔧 NEW: 이미 설정된 경우 중복 방지
        if (this.eventListenersSet) {
            console.log('⚠️ 이벤트 리스너가 이미 설정됨, 중복 등록 방지');
            return;
        }

        const courseForm = document.getElementById('course-form');
        if (courseForm) {
            // 🔧 NEW: 기존 이벤트 리스너 제거 (혹시 있을 경우)
            const newForm = courseForm.cloneNode(true);
            courseForm.parentNode.replaceChild(newForm, courseForm);

            // 새로운 이벤트 리스너 등록
            newForm.addEventListener('submit', (event) => {
                this.handleCourseSubmission(event);
            });

            this.eventListenersSet = true;
            console.log('✅ 폼 제출 이벤트 리스너 설정 완료 (중복 방지)');
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

                const coursePeriod = course.period || this.generateCoursePeriod(startDate);

                // 🔧 NEW: 통합 가격 정보 표시 (HTML 테이블 구조와 일치)
                html += `
                    <tr class="hover:bg-gray-50 transition-colors cursor-pointer" onclick="courseManager.selectCourseForApplicants('${course.id}', '${this.getCertificateName(course.certificateType)}', '${coursePeriod}')">
                        <td data-label="자격증">${this.getCertificateName(course.certificateType)}</td>
                        <td data-label="기수">${coursePeriod}</td>
                        <td data-label="강사">${course.instructor || '-'}</td>
                        <td data-label="교육기간">${formatDate(startDate)} ~ ${formatDate(endDate)}</td>
                        <td data-label="신청기간">${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}</td>
                        <td data-label="교육비">${formatCurrency(course.price ?? course.pricing?.education ?? 0)}</td>
                        <td data-label="자격증비">${formatCurrency(course.certificatePrice ?? course.pricing?.certificate ?? 0)}</td>
                        <td data-label="교재비">${formatCurrency(course.materialPrice ?? course.pricing?.material ?? 0)}</td>
                        <td data-label="정원/신청자">${course.capacity}/${course.enrolledCount || 0}명</td>
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
     * 🆕 교육 과정 선택하여 신청자 목록 표시
     */
    selectCourseForApplicants: async function(courseId, courseName, coursePeriod) {
        console.log(`📋 과정 선택: ${courseId} - ${courseName} ${coursePeriod}`);
        
        // 선택된 과정 정보 표시
        const section = document.getElementById('applicants-section');
        const titleElement = document.getElementById('selected-course-title');
        const infoElement = document.getElementById('selected-course-info');
        
        if (section) section.style.display = 'block';
        if (titleElement) titleElement.textContent = `신청자 목록 - ${courseName}`;
        if (infoElement) infoElement.textContent = `기수: ${coursePeriod}`;
        
        // 신청자 목록 로드
        await this.loadApplicants(courseId);
        
        // 스크롤 이동
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * 🆕 신청자 목록 로드
     */
    loadApplicants: async function(courseId) {
        try {
            console.log(`🔍 신청자 목록 로드 시작: ${courseId}`);
            
            // 로딩 상태 표시
            this.showApplicantsLoading();
            
            // Firebase에서 신청자 조회
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                console.error('❌ Firebase가 초기화되지 않음');
                this.showApplicantsError('Firebase 연결 오류');
                return;
            }
            
            const snapshot = await window.dhcFirebase.db
                .collection('applications')
                .where('courseInfo.courseId', '==', courseId)
                .orderBy('timestamp', 'desc')
                .get();
            
            const applicants = [];
            snapshot.forEach(doc => {
                applicants.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`✅ 신청자 ${applicants.length}명 조회 완료`);
            
            // 🆕 실제 신청자 수와 courses의 enrolledCount 동기화
            const course = this.courses.find(c => c.id === courseId);
            if (course && course.enrolledCount !== applicants.length) {
                console.log(`🔄 신청자 수 동기화: ${course.enrolledCount || 0}명 → ${applicants.length}명`);
                try {
                    await window.dhcFirebase.db.collection('courses').doc(courseId).update({
                        enrolledCount: applicants.length,
                        updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    });
                    // 메모리의 과정 정보도 업데이트
                    course.enrolledCount = applicants.length;
                } catch (error) {
                    console.error('⚠️ enrolledCount 동기화 실패:', error);
                }
            }
            
            // 🆕 전체 신청자 목록 저장
            this.allApplicants = applicants;
            this.applicantsTotalCount = applicants.length;
            this.applicantsCurrentPage = 1; // 페이지 초기화
            
            // 신청자 수 표시
            const countElement = document.getElementById('total-applicants-count');
            if (countElement) {
                countElement.textContent = `${applicants.length}명`;
            }
            
            // 신청자 목록 렌더링
            if (applicants.length > 0) {
                this.renderApplicantsPage();
                this.updateApplicantsPagination();
            } else {
                this.showNoApplicants();
                this.hideApplicantsPagination();
            }
            
        } catch (error) {
            console.error('❌ 신청자 목록 로드 실패:', error);
            this.showApplicantsError('신청자 목록을 불러오는데 실패했습니다.');
        }
    },

    /**
     * 🆕 신청자 목록 렌더링
     */
    renderApplicantsPage: function() {
        const tbody = document.querySelector('#applicants-table tbody');
        const noApplicantsMessage = document.getElementById('no-applicants-message');
        
        if (!tbody) return;
        
        // 메시지 숨기기
        if (noApplicantsMessage) {
            noApplicantsMessage.style.display = 'none';
        }
        
        // 🆕 페이지네이션 계산
        const startIndex = (this.applicantsCurrentPage - 1) * this.applicantsPageSize;
        const endIndex = Math.min(startIndex + this.applicantsPageSize, this.applicantsTotalCount);
        const pageApplicants = this.allApplicants.slice(startIndex, endIndex);
        
        // 날짜/통화 포맷터
        const formatDate = (date) => {
            if (!date) return '-';
            const d = date instanceof Date ? date : 
                     date.toDate ? date.toDate() : 
                     new Date(date);
            return d.toLocaleDateString('ko-KR') + ' ' + d.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});
        };
        
        const formatCurrency = (amount) => {
            if (!amount && amount !== 0) return '₩0';
            return '₩' + parseInt(amount).toLocaleString('ko-KR');
        };
        
        let html = '';
        
        pageApplicants.forEach(applicant => {
            const info = applicant.applicantInfo || {};
            const timestamp = applicant.timestamp;
            const pricing = applicant.pricing || {};
            
            // 신청 상태 결정
            let status = '신청완료';
            let statusClass = 'status-active';
            
            html += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td data-label="신청일시">${formatDate(timestamp)}</td>
                    <td data-label="신청자명">${info['applicant-name'] || '-'}</td>
                    <td data-label="이메일">${info.email || '-'}</td>
                    <td data-label="전화번호">${info.phone || '-'}</td>
                    <td data-label="생년월일">${info['birth-date'] || '-'}</td>
                    <td data-label="결제금액">${formatCurrency(pricing.totalAmount)}</td>
                    <td data-label="상태">
                        <span class="status-badge ${statusClass}">${status}</span>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    },

    /**
     * 🆕 신청자가 없을 때 표시
     */
    showNoApplicants: function() {
        const tbody = document.querySelector('#applicants-table tbody');
        const noApplicantsMessage = document.getElementById('no-applicants-message');
        
        if (tbody) {
            tbody.innerHTML = '';
        }
        
        if (noApplicantsMessage) {
            noApplicantsMessage.style.display = 'block';
        }
    },

    /**
     * 🆕 로딩 상태 표시
     */
    showApplicantsLoading: function() {
        const tbody = document.querySelector('#applicants-table tbody');
        const noApplicantsMessage = document.getElementById('no-applicants-message');
        
        if (noApplicantsMessage) {
            noApplicantsMessage.style.display = 'none';
        }
        
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="admin-loading-state">
                        <div class="admin-loading-spinner"></div>
                        <span class="text-gray-600">신청자 데이터 로딩 중...</span>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * 🆕 에러 메시지 표시
     */
    showApplicantsError: function(message) {
        const tbody = document.querySelector('#applicants-table tbody');
        
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-red-600">
                        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        ${message}
                    </td>
                </tr>
            `;
        }
    },

    /**
     * 🆕 신청자 페이지네이션 업데이트
     */
    updateApplicantsPagination: function() {
        const totalPages = Math.ceil(this.applicantsTotalCount / this.applicantsPageSize);
        const paginationContainer = document.getElementById('applicants-pagination');
        const pageNumbersContainer = document.getElementById('applicants-page-numbers');
        const prevBtn = document.getElementById('applicants-prev-btn');
        const nextBtn = document.getElementById('applicants-next-btn');
        const paginationInfo = document.getElementById('applicants-pagination-info');
        
        if (!paginationContainer) return;
        
        // 페이지네이션 표시 여부
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        // 페이지 정보 업데이트
        const startIndex = (this.applicantsCurrentPage - 1) * this.applicantsPageSize + 1;
        const endIndex = Math.min(this.applicantsCurrentPage * this.applicantsPageSize, this.applicantsTotalCount);
        if (paginationInfo) {
            paginationInfo.textContent = `${startIndex}-${endIndex} / 총 ${this.applicantsTotalCount}명`;
        }
        
        // 이전/다음 버튼 상태
        if (prevBtn) {
            prevBtn.disabled = this.applicantsCurrentPage === 1;
        }
        if (nextBtn) {
            nextBtn.disabled = this.applicantsCurrentPage === totalPages;
        }
        
        // 페이지 번호 버튼 생성
        if (pageNumbersContainer) {
            let pageNumbersHtml = '';
            const maxVisiblePages = 5;
            let startPage = Math.max(1, this.applicantsCurrentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const isActive = i === this.applicantsCurrentPage;
                pageNumbersHtml += `
                    <button onclick="courseManager.goToApplicantsPage(${i})" 
                        class="admin-pagination-number ${isActive ? 'active' : ''}">
                        ${i}
                    </button>
                `;
            }
            
            pageNumbersContainer.innerHTML = pageNumbersHtml;
        }
    },

    /**
     * 🆕 페이지네이션 숨기기
     */
    hideApplicantsPagination: function() {
        const paginationContainer = document.getElementById('applicants-pagination');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    },

    /**
     * 🆕 이전 페이지로 이동
     */
    prevApplicantsPage: function() {
        if (this.applicantsCurrentPage > 1) {
            this.applicantsCurrentPage--;
            this.renderApplicantsPage();
            this.updateApplicantsPagination();
        }
    },

    /**
     * 🆕 다음 페이지로 이동
     */
    nextApplicantsPage: function() {
        const totalPages = Math.ceil(this.applicantsTotalCount / this.applicantsPageSize);
        if (this.applicantsCurrentPage < totalPages) {
            this.applicantsCurrentPage++;
            this.renderApplicantsPage();
            this.updateApplicantsPagination();
        }
    },

    /**
     * 🆕 특정 페이지로 이동
     */
    goToApplicantsPage: function(pageNumber) {
        const totalPages = Math.ceil(this.applicantsTotalCount / this.applicantsPageSize);
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            this.applicantsCurrentPage = pageNumber;
            this.renderApplicantsPage();
            this.updateApplicantsPagination();
        }
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
                title: '운동건강관리사 25년 상반기 과정',
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
                materialName: '운동건강관리사 전문교재',
                capacity: 30,
                enrolledCount: 18,
                status: 'active',
                method: '온라인 + 오프라인 병행',
                location: '서울 강남구 센터'
            },
            {
                id: 'test-rehab-1',
                title: '스포츠헬스케어지도자 25년 상반기 과정',
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
                materialName: '스포츠헬스케어지도자 실무교재',
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
                document.getElementById('certificate-price').value = '';
                document.getElementById('material-price').value = '';
                document.getElementById('package-discount').value = '0';

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
     * 🔧 수정: 통합 가격 설정이 포함된 교육 과정 제출 처리 - 중복 제출 방지 추가
     */
    handleCourseSubmission: async function (event) {
        event.preventDefault();

        // 🔧 NEW: 중복 제출 방지
        if (this.isSubmitting) {
            console.log('⚠️ 이미 제출 처리 중입니다');
            return;
        }

        this.isSubmitting = true;

        try {
            const form = event.target;
            const courseId = form.getAttribute('data-course-id');
            const isEditMode = !!courseId;

            // 🔧 NEW: 통합 가격 정보를 포함한 폼 데이터 수집
            const formData = this.collectEnhancedFormData(form);
            if (!formData) {
                this.isSubmitting = false; // 🔧 플래그 리셋
                return;
            }

            // 🔧 NEW: 통합 가격 설정이 포함된 과정 데이터 생성
            const courseData = this.buildEnhancedCourseData(formData);

            console.log('교육 과정 저장 시도:', isEditMode ? '수정' : '추가', courseData);

            // Firebase 저장
            if (window.dhcFirebase && window.dhcFirebase.db) {
                if (isEditMode) {
                    console.log('교육 과정 수정:', courseId);
                    courseData.updatedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    await window.dhcFirebase.db.collection('courses').doc(courseId).update(courseData);
                    console.log('✅ 교육 과정 수정 완료');

                    if (window.adminAuth?.showNotification) {
                        window.adminAuth.showNotification('교육 과정이 성공적으로 수정되었습니다.', 'success');
                    }
                } else {
                    console.log('교육 과정 추가');
                    courseData.createdAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    courseData.enrolledCount = 0;

                    const docRef = await window.dhcFirebase.db.collection('courses').add(courseData);
                    console.log('✅ 교육 과정 추가 완료, 문서 ID:', docRef.id);

                    if (window.adminAuth?.showNotification) {
                        window.adminAuth.showNotification('교육 과정이 성공적으로 추가되었습니다.', 'success');
                    }
                }
            } else {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            // 모달 닫기
            this.closeCourseModal();

            // 🔧 수정: 목록 새로고침 전 잠시 대기
            setTimeout(async () => {
                try {
                    await this.loadCourses();
                    console.log('✅ 목록 새로고침 완료');
                } catch (refreshError) {
                    console.error('❌ 목록 새로고침 오류:', refreshError);
                    if (window.adminAuth?.showNotification) {
                        window.adminAuth.showNotification('목록을 새로고침하는데 문제가 발생했습니다.', 'warning');
                    }
                }
            }, 500);

        } catch (error) {
            console.error('❌ 교육 과정 처리 오류:', error);
            this.handleSubmissionError(error);
        } finally {
            // 🔧 NEW: 제출 플래그 리셋 (finally 블록에서 확실히 리셋)
            this.isSubmitting = false;
        }
    },

    /**
     * 통합 가격 정보가 포함된 폼 데이터 수집 및 검증 - 0원 허용 버전
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
        const period = form.querySelector('#course-period').value.trim();
        const status = form.querySelector('#course-status').value;
        const method = form.querySelector('#course-method').value;
        const location = form.querySelector('#course-location').value;

        // 가격 정보 - 빈 값을 명시적으로 0으로 처리
        const priceInput = form.querySelector('#course-price').value;
        const certificatePriceInput = form.querySelector('#certificate-price').value;
        const materialPriceInput = form.querySelector('#material-price').value;
        const materialName = form.querySelector('#material-name')?.value || '';

        const price = priceInput === '' ? 0 : parseInt(priceInput) || 0;
        const certificatePrice = certificatePriceInput === '' ? 0 : parseInt(certificatePriceInput) || 0;
        const materialPrice = materialPriceInput === '' ? 0 : parseInt(materialPriceInput) || 0;

        // 할인율 처리 로직 - 빈 값과 0을 정확히 구분
        const packageDiscountInput = form.querySelector('#package-discount');
        let packageDiscount = 0;

        if (packageDiscountInput) {
            const discountValue = packageDiscountInput.value.trim();
            if (discountValue === '' || discountValue === null || discountValue === undefined) {
                packageDiscount = 0;
            } else {
                const parsedDiscount = parseInt(discountValue);
                packageDiscount = isNaN(parsedDiscount) ? 0 : Math.max(0, Math.min(100, parsedDiscount));
            }
        }

        // 유효성 검사
        if (!certificateType || !instructorId || !startDate || !endDate || !applyStartDate || !applyEndDate || !period) {
            window.adminAuth?.showNotification('모든 필수 항목을 입력하세요.', 'error');
            return null;
        }

        if (endDate < startDate) {
            window.adminAuth?.showNotification('교육 종료일은 시작일보다 이전일 수 없습니다.', 'error');
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

        // 가격 유효성 검사 - 0원 허용, 음수만 차단
        if (price < 0 || isNaN(price)) {
            window.adminAuth?.showNotification('교육비를 올바르게 입력하세요.', 'error');
            return null;
        }

        if (certificatePrice < 0 || isNaN(certificatePrice)) {
            window.adminAuth?.showNotification('자격증 발급비는 0원 이상이어야 합니다.', 'error');
            return null;
        }

        if (materialPrice < 0 || isNaN(materialPrice)) {
            window.adminAuth?.showNotification('교재비는 0원 이상이어야 합니다.', 'error');
            return null;
        }

        // 강사 이름 찾기
        const instructor = this.instructors.find(inst => inst.id === instructorId);
        const instructorName = instructor ? instructor.name : '';

        console.log('폼 데이터 수집 완료 - 할인율:', packageDiscount + '%');

        return {
            certificateType,
            instructorId,
            instructorName,
            startDate,
            endDate,
            applyStartDate,
            applyEndDate,
            capacity,
            period,
            status,
            method,
            location,
            // 가격 정보
            price,
            certificatePrice,
            materialPrice,
            materialName,
            materialRequired: false, // 항상 false (교재는 선택사항)
            packageDiscount,
            enableInstallment: false // 항상 false (분할결제 비활성화)
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
            period: formData.period,
            method: formData.method || '온라인 + 오프라인 병행',
            location: formData.location || '서울 강남구 센터',
            status: formData.status,

            // 🔧 간소화된 가격 정보 (기존 구조 + 새로운 구조 모두 지원)
            price: formData.price,
            certificatePrice: formData.certificatePrice,
            materialPrice: formData.materialPrice,
            materialName: formData.materialName,
            materialRequired: false, // 🔧 항상 false

            // 🔧 간소화된 가격 객체
            pricing: {
                education: formData.price,
                certificate: formData.certificatePrice,
                material: formData.materialPrice,
                materialRequired: false, // 🔧 항상 false
                packageDiscount: formData.packageDiscount,
                enableInstallment: false // 🔧 항상 false
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

        console.log('🔧 간소화된 과정 데이터 구성 완료 - 할인율:', formData.packageDiscount + '%');

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
                packageDiscount: course.pricing?.packageDiscount || 10
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
     * 🔧 수정: 통합 가격 정보가 포함된 교육 과정 수정 - async 문법 수정
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

                // 🔧 간소화된 가격 정보 채우기
                const pricing = course.pricing || {};
                form.querySelector('#course-price').value = course.price || pricing.education || '';
                form.querySelector('#certificate-price').value = course.certificatePrice || pricing.certificate || 50000;
                form.querySelector('#material-price').value = course.materialPrice || pricing.material || 30000;

                // 할인율 처리 - 0%와 undefined/null 구분
                const discountValue = pricing.packageDiscount !== undefined ? pricing.packageDiscount : 0;
                form.querySelector('#package-discount').value = discountValue;

                // 교재명 (체크박스는 제거됨)
                const materialNameField = form.querySelector('#material-name');
                if (materialNameField) {
                    materialNameField.value = course.materialName || '';
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
            'health-exercise': '운동건강관리사',
            'rehabilitation': '스포츠헬스케어지도자',
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
         * 🔧 수정: 통합 가격 설정 테스트 데이터로 폼 채우기 - 할인율 0% 테스트 포함
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

            // 🔧 수정: 통합 가격 정보 입력 - 할인율 0% 테스트
            form.querySelector('#course-price').value = '350000';          // 교육비
            form.querySelector('#certificate-price').value = '50000';      // 자격증비
            form.querySelector('#material-price').value = '30000';         // 교재비

            const materialNameField = form.querySelector('#material-name');
            if (materialNameField) {
                materialNameField.value = '운동건강관리사 전문교재';
            }

            // 🔧 수정: 할인율 0% 테스트
            form.querySelector('#package-discount').value = '0';           // 0% 할인 테스트

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

            console.log('✅ 통합 가격 설정 테스트 데이터 입력 완료 (할인율 0% 테스트)');
            console.log('💡 가격 미리보기에서 할인이 적용되지 않는지 확인하세요');
        },

        /**
         * 🔧 NEW: 할인율 0% 테스트 전용 함수
         */
        testZeroDiscount: function () {
            const form = document.getElementById('course-form');
            if (!form) {
                console.log('폼이 열려있지 않습니다. 먼저 "교육 과정 추가" 버튼을 클릭하세요.');
                return;
            }

            // 할인율을 0으로 설정
            const discountInput = form.querySelector('#package-discount');
            if (discountInput) {
                discountInput.value = '0';
                discountInput.dispatchEvent(new Event('input'));
                discountInput.dispatchEvent(new Event('change'));
            }

            // 미리보기 강제 업데이트
            window.courseManager.updatePricePreview();
            window.courseManager.updatePackageLabel();

            console.log('🔧 할인율 0% 테스트 완료');
            console.log('💡 패키지 라벨이 "총 가격:"으로 변경되고 절약 금액이 숨겨져야 합니다');
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
         * 🔧 NEW: 중복 제출 테스트
         */
        testDuplicateSubmission: function () {
            console.log('🔧 중복 제출 방지 테스트...');
            console.log('현재 제출 상태:', window.courseManager.isSubmitting);
            console.log('이벤트 리스너 설정 상태:', window.courseManager.eventListenersSet);

            if (window.courseManager.isSubmitting) {
                console.log('⚠️ 현재 제출 처리 중 - 중복 제출 방지 동작 중');
            } else {
                console.log('✅ 제출 가능 상태');
            }
        },

        /**
         * 🔧 신청자 카운팅 테스트
         */
        testEnrollmentCount: async function(courseId, count) {
            if (!courseId) {
                console.log('사용 방법: testEnrollmentCount("과정ID", 신청자수)');
                console.log('예시: testEnrollmentCount("course123", 5)');
                
                // 현재 과정 목록 표시
                if (window.courseManager.courses.length > 0) {
                    console.log('\n📋 현재 과정 목록:');
                    window.courseManager.courses.forEach(course => {
                        console.log(`- ID: ${course.id}`);
                        console.log(`  이름: ${window.courseManager.getCertificateName(course.certificateType)}`);
                        console.log(`  정원: ${course.capacity}명`);
                        console.log(`  현재 신청자: ${course.enrolledCount || 0}명\n`);
                    });
                }
                return;
            }

            try {
                console.log(`🧪 신청자 수를 ${count}명으로 설정 중...`);
                
                // Firestore 업데이트
                await window.dhcFirebase.db.collection('courses').doc(courseId).update({
                    enrolledCount: count,
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log('✅ 신청자 수 업데이트 완료');
                console.log('🔄 과정 목록 새로고침 중...');

                // 목록 새로고침
                await window.courseManager.loadCourses();
                
                console.log('✅ 테스트 완료! 교육 과정 목록을 확인하세요.');
            } catch (error) {
                console.error('❌ 테스트 실패:', error);
            }
        },

        /**
         * 🔧 신청자 1명 추가 테스트
         */
        addOneEnrollment: async function(courseId) {
            if (!courseId) {
                console.log('사용 방법: addOneEnrollment("과정ID")');
                
                // 현재 과정 목록 표시
                if (window.courseManager.courses.length > 0) {
                    console.log('\n📋 현재 과정 목록:');
                    window.courseManager.courses.forEach(course => {
                        console.log(`- ID: ${course.id}, 이름: ${window.courseManager.getCertificateName(course.certificateType)}, 신청자: ${course.enrolledCount || 0}명`);
                    });
                }
                return;
            }

            try {
                const courseDoc = await window.dhcFirebase.db.collection('courses').doc(courseId).get();
                
                if (!courseDoc.exists) {
                    console.error('❌ 해당 과정을 찾을 수 없습니다.');
                    return;
                }

                const currentCount = courseDoc.data().enrolledCount || 0;
                const newCount = currentCount + 1;

                console.log(`📊 현재 신청자: ${currentCount}명 → ${newCount}명`);

                await window.dhcFirebase.db.collection('courses').doc(courseId).update({
                    enrolledCount: window.dhcFirebase.firebase.firestore.FieldValue.increment(1),
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log('✅ 신청자 1명 추가 완료');
                await window.courseManager.loadCourses();
                
            } catch (error) {
                console.error('❌ 신청자 추가 실패:', error);
            }
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
            console.log('🎯 수정된 교육 관리 디버깅 도구 (v2.0)');
            console.log('');
            console.log('🔧 의존성 관리:');
            console.log('- testDependencies() : 유틸리티 의존성 확인');
            console.log('');
            console.log('📊 데이터 확인:');
            console.log('- showInstructors() : 강사 목록 확인');
            console.log('- showCourses() : 과정 목록 확인');
            console.log('');
            console.log('🧪 테스트:');
            console.log('- fillTestData() : 할인율 0% 포함 테스트 데이터 입력');
            console.log('- testZeroDiscount() : 할인율 0% 전용 테스트');
            console.log('- testPricingCalculator() : 가격 계산기 테스트');
            console.log('- testDuplicateSubmission() : 중복 제출 방지 테스트');
            console.log('- testEnrollmentCount(courseId, count) : 신청자 수 테스트');
            console.log('- addOneEnrollment(courseId) : 신청자 1명 추가 테스트');
            console.log('');
            console.log('🔧 강제 실행:');
            console.log('- forceInit() : courseManager 강제 초기화');
            console.log('- forceLoad() : 강제 데이터 로드');
            console.log('- forceAdminInit() : adminUtils 강제 초기화');
            console.log('');
            console.log('💡 수정된 기능:');
            console.log('✅ 중복 생성 방지: 제출 플래그 및 이벤트 리스너 중복 방지');
            console.log('✅ 할인율 0% 처리: 빈 값과 0을 정확히 구분');
            console.log('✅ 폼 데이터 검증: 할인율 범위 제한 (0-100%)');
            console.log('✅ UI 업데이트: 할인율 0%일 때 절약 금액 숨김');
            console.log('');
            console.log('🎯 테스트 시나리오:');
            console.log('1. testDependencies() : 먼저 의존성 확인');
            console.log('2. 교육 과정 추가 버튼 클릭');
            console.log('3. fillTestData() : 할인율 0% 테스트 데이터 입력');
            console.log('4. 가격 미리보기에서 절약 금액이 숨겨지는지 확인');
            console.log('5. 저장 버튼을 여러 번 클릭해서 중복 생성되지 않는지 확인');
        }
    };

    console.log('🎯 수정된 교육 관리 디버깅 도구 활성화됨 (v2.0)');
    console.log('💡 도움말: window.debugCourseManager.help()');
    console.log('🔧 주요 수정: 중복 생성 방지, 할인율 0% 처리, 이벤트 리스너 중복 방지');
}