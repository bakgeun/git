/**
 * 개선된 교육 관리 페이지 스크립트
 * - 신청기간 필드 추가
 * - 자동 교육명 생성
 * - 강사 드롭다운 연동
 * - 통합 관리 (탭 제거)
 */

// 🔧 의존성 체크 함수 추가
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
        console.log('📝 HTML에서 다음 스크립트들이 먼저 로드되어야 합니다:');
        missing.forEach(m => {
            console.log(`   <script src="{basePath}assets/js/utils/${m.path}"></script>`);
        });
        return false;
    }
    
    console.log('✅ 관리자 페이지 모든 필수 유틸리티 로드 확인됨');
    return true;
}

// 교육 관리 객체
window.courseManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    instructors: [], // 강사 목록
    courses: [], // 과정 목록

    /**
     * 초기화 함수
     */
    init: async function () {
        // 초기화 플래그 설정
        this.initialized = false;

        try {
            console.log('🚀 교육 관리자 초기화 시작');

            // 🔧 의존성 체크 먼저 실행
            if (!checkAdminDependencies()) {
                console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
                this.showDependencyError();
                return false;
            }

            // Firebase 초기화 대기
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                console.log('⏳ Firebase 초기화 대기 중...');

                // Firebase 초기화를 최대 10초간 대기
                let attempts = 0;
                const maxAttempts = 50; // 10초 (200ms * 50)

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

            // 강사 목록 로드
            console.log('👥 강사 목록 로드 시작');
            await this.loadInstructors();
            console.log('✅ 강사 목록 로드 완료');

            // 폼 제출 이벤트 리스너 설정
            const courseForm = document.getElementById('course-form');
            if (courseForm) {
                courseForm.addEventListener('submit', this.handleCourseSubmission.bind(this));
                console.log('✅ 폼 제출 이벤트 리스너 설정 완료');
            } else {
                console.warn('⚠️ course-form 요소를 찾을 수 없음');
            }

            // 검색 필터 이벤트 리스너
            console.log('🔍 검색 필터 초기화');
            this.initSearchFilters();

            // 자격증 변경 시 자동 교육명 미리보기
            console.log('👁️ 자동 미리보기 초기화');
            this.initAutoPreview();

            // 교육 과정 목록 로드 (재시도 로직 포함)
            console.log('📋 교육 과정 목록 로드 시작');
            await this.loadCoursesWithRetry();

            // 초기화 완료 플래그 설정
            this.initialized = true;
            console.log('✅ 교육 관리자 초기화 완료');
            return true;

        } catch (error) {
            console.error('❌ 교육 관리자 초기화 오류:', error);

            // 초기화 실패 시 테스트 데이터로라도 표시
            try {
                console.log('🔄 초기화 실패, 테스트 데이터로 폴백');
                const testCourses = this.getTestCourseData();
                this.courses = testCourses;
                this.updateCourseTable(testCourses);
                console.log('✅ 테스트 데이터 폴백 완료');
            } catch (fallbackError) {
                console.error('❌ 폴백 데이터 로드도 실패:', fallbackError);

                // 최종 실패 시 오류 메시지 표시
                const tbody = document.querySelector('#course-table tbody');
                if (tbody) {
                    tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center py-4 text-red-500">
                            초기화에 실패했습니다. 페이지를 새로고침해주세요.
                        </td>
                    </tr>
                `;
                }
            }

            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('초기화 중 오류가 발생했습니다.', 'error');
            }

            this.initialized = false;
            return false;
        }
    },

    // 🔧 의존성 오류 표시 함수 추가
    showDependencyError: function() {
        const tbody = document.querySelector('#course-table tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-red-500">
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
     * 재시도 로직이 포함된 교육 과정 로드 함수
     */
    loadCoursesWithRetry: async function (maxRetries = 3) {
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📋 교육 과정 로드 시도 ${attempt}/${maxRetries}`);
                await this.loadCourses();
                console.log('✅ 교육 과정 로드 성공');
                return; // 성공하면 함수 종료
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ 교육 과정 로드 시도 ${attempt} 실패:`, error);

                if (attempt < maxRetries) {
                    const delay = attempt * 1000; // 1초, 2초, 3초 간격으로 재시도
                    console.log(`⏳ ${delay}ms 후 재시도...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // 모든 재시도 실패 시
        console.error(`❌ ${maxRetries}번 시도 후 교육 과정 로드 실패:`, lastError);

        // 테스트 데이터로 폴백
        console.log('🔄 테스트 데이터로 폴백');
        try {
            const testCourses = this.getTestCourseData();
            this.courses = testCourses;
            this.updateCourseTable(testCourses);

            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('서버 연결에 문제가 있어 테스트 데이터를 표시합니다.', 'warning');
            }

            console.log('✅ 테스트 데이터 폴백 완료');
        } catch (fallbackError) {
            console.error('❌ 테스트 데이터 폴백도 실패:', fallbackError);

            // 최종 실패 시 오류 메시지 표시
            const tbody = document.querySelector('#course-table tbody');
            if (tbody) {
                tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-red-500">
                        데이터 로드에 실패했습니다. 페이지를 새로고침해주세요.
                        <br>
                        <button onclick="window.location.reload()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            새로고침
                        </button>
                    </td>
                </tr>
            `;
            }
        }
    },

    /**
     * 강사 목록 로드
     */
    loadInstructors: async function () {
        try {
            console.log('강사 목록 로드 시작');

            // Firebase에서 강사 데이터 로드
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

            // 강사 드롭다운 업데이트
            this.updateInstructorDropdown();

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

        // 기본 옵션
        let optionsHtml = '<option value="">강사를 선택하세요</option>';

        // 강사 옵션 추가
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
        const certificateTypeFilter = document.getElementById('filter-certificate-type');
        const statusFilter = document.getElementById('filter-status');

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.search();
                }
            });
        }

        // 필터 변경 시 자동 검색
        [certificateTypeFilter, statusFilter].forEach(filter => {
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

        // 미리보기 표시 (자동 생성 정보 영역에 추가)
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
     * 교육 과정 목록 로드
     */
    loadCourses: async function () {
        try {
            // 마지막 로드 시간 기록
            this.lastLoadTime = Date.now();

            console.log('📋 교육 과정 로드 시작');

            // 로딩 표시
            const tbody = document.querySelector('#course-table tbody');
            if (tbody) {
                tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-gray-500">
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

            let courses = [];

            // Firebase 연동 확인
            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                console.log('🔥 Firebase에서 교육 과정 로드 시작');

                try {
                    // 검색 조건 수집
                    const searchOptions = this.buildSearchOptions();
                    const result = await window.dbService.getDocuments('courses', searchOptions);

                    if (result.success) {
                        courses = result.data;
                        console.log('✅ Firebase에서 로드된 교육 과정 수:', courses.length);

                        // 클라이언트에서 정렬 처리
                        courses.sort((a, b) => {
                            const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
                            const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);
                            return dateB.getTime() - dateA.getTime(); // 최신순
                        });
                    } else {
                        console.error('❌ Firebase 데이터 로드 실패:', result.error);
                        throw new Error(result.error.message || 'Firebase 데이터 로드 실패');
                    }
                } catch (firebaseError) {
                    console.error('❌ Firebase 쿼리 실행 오류:', firebaseError);
                    throw firebaseError;
                }
            } else {
                console.log('⚠️ Firebase 미연동, 테스트 데이터 사용');
                courses = this.getTestCourseData();
            }

            // 현재 로드된 과정 저장
            this.courses = courses;

            // 테이블 업데이트
            this.updateCourseTable(courses);

            console.log('✅ 교육 과정 목록 로드 완료');

        } catch (error) {
            console.error('❌ 교육 과정 목록 로드 오류:', error);

            // Firebase 인덱스 오류인 경우 테스트 데이터로 폴백
            if (error.message && error.message.includes('index')) {
                console.log('🔧 Firebase 인덱스 오류 감지, 테스트 데이터로 폴백');

                try {
                    const testCourses = this.getTestCourseData();
                    this.courses = testCourses;
                    this.updateCourseTable(testCourses);

                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('Firebase 인덱스 설정 중입니다. 임시로 테스트 데이터를 표시합니다.', 'warning');
                    }
                    return;
                } catch (fallbackError) {
                    console.error('❌ 테스트 데이터 폴백 실패:', fallbackError);
                }
            }

            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('교육 과정 목록을 불러오는데 실패했습니다.', 'error');
            }

            // 오류 메시지 표시
            const tbody = document.querySelector('#course-table tbody');
            if (tbody) {
                tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-red-500">
                        데이터를 불러오는 중 오류가 발생했습니다.
                        <br>
                        <button onclick="courseManager.loadCourses()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            다시 시도
                        </button>
                    </td>
                </tr>
            `;
            }

            // 오류를 다시 던져서 상위에서 처리할 수 있도록 함
            throw error;
        }
    },

    /**
     * 검색 옵션 구성
     */
    buildSearchOptions: function () {
        const options = {
            where: []
        };

        // 자격증 타입 필터
        const certificateType = document.getElementById('filter-certificate-type')?.value;
        if (certificateType) {
            options.where.push({ field: 'certificateType', operator: '==', value: certificateType });
        }

        // 상태 필터
        const status = document.getElementById('filter-status')?.value;
        if (status) {
            options.where.push({ field: 'status', operator: '==', value: status });
        }

        // 검색어는 클라이언트에서 필터링 (Firebase 제한사항)

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
     * 교육 과정 테이블 업데이트
     */
    updateCourseTable: function (courses) {
        const tbody = document.querySelector('#course-table tbody');

        if (!courses || courses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-gray-500">
                        데이터가 없습니다.
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
                    <td colspan="9" class="text-center py-4 text-gray-500">
                        검색 결과가 없습니다.
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

                // 🔧 전역 유틸리티 사용으로 변경
                const formatDate = (date) => {
                    return window.formatters.formatDate(date, 'YYYY-MM-DD');
                };

                // 🔧 전역 유틸리티 사용으로 변경
                const formatCurrency = (value) => {
                    return window.formatters.formatCurrency(value);
                };

                const getStatusBadge = (status) => {
                    const badges = {
                        'active': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">모집중</span>',
                        'closed': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">마감</span>',
                        'completed': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">종료</span>',
                        'preparing': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">준비중</span>'
                    };
                    return badges[status] || status;
                };

                // 기수 생성
                const coursePeriod = this.generateCoursePeriod(startDate);

                html += `
                    <tr>
                        <td>${this.getCertificateName(course.certificateType)}</td>
                        <td>${coursePeriod}</td>
                        <td>${course.instructor || '-'}</td>
                        <td>${formatDate(startDate)} ~ ${formatDate(endDate)}</td>
                        <td>${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}</td>
                        <td>${formatCurrency(course.price)}</td>
                        <td>${course.enrolledCount || 0}/${course.capacity}명</td>
                        <td>${getStatusBadge(course.status)}</td>
                        <td>
                            <div class="flex space-x-2">
                                <button onclick="courseManager.viewCourse('${course.id}')" class="text-blue-600 hover:text-blue-800">
                                    상세
                                </button>
                                <button onclick="courseManager.editCourse('${course.id}')" class="text-indigo-600 hover:text-indigo-800">
                                    수정
                                </button>
                                <button onclick="courseManager.deleteCourse('${course.id}')" class="text-red-600 hover:text-red-800">
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
     * 테스트용 과정 데이터
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
                price: 350000,
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
                price: 420000,
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
                price: 480000,
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
     * 교육 과정 제출 처리 (추가/수정 통합)
     */
    handleCourseSubmission: async function (event) {
        event.preventDefault();

        try {
            const form = event.target;
            const courseId = form.getAttribute('data-course-id');
            const isEditMode = !!courseId;

            // 폼 데이터 수집
            const formData = this.collectFormData(form);
            if (!formData) return;

            // 과정 데이터 생성
            const courseData = this.buildCourseData(formData);

            console.log('교육 과정 저장 시도:', isEditMode ? '수정' : '추가', courseData);

            // Firebase 저장
            if (window.dhcFirebase && window.dhcFirebase.db) {
                if (isEditMode) {
                    // 수정 모드
                    console.log('교육 과정 수정:', courseId);
                    courseData.updatedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();

                    await window.dhcFirebase.db.collection('courses').doc(courseId).update(courseData);
                    console.log('교육 과정 수정 완료');

                    if (window.adminAuth?.showNotification) {
                        window.adminAuth.showNotification('교육 과정이 성공적으로 수정되었습니다.', 'success');
                    }
                } else {
                    // 추가 모드
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

            // 성공 알림 표시 후 목록 새로고침
            console.log('교육 과정 저장 성공, 목록 새로고침 시작');

            // 약간의 지연 후 목록 새로고침 (Firebase 동기화 시간 고려)
            setTimeout(async () => {
                try {
                    console.log('목록 새로고침 실행');
                    await this.loadCourses();
                    console.log('목록 새로고침 완료');
                } catch (refreshError) {
                    console.error('목록 새로고침 오류:', refreshError);

                    // 새로고침 실패 시 사용자에게 안내
                    if (window.adminAuth?.showNotification) {
                        window.adminAuth.showNotification('목록을 새로고침하는데 문제가 발생했습니다. 페이지를 새로고침해주세요.', 'warning');
                    }
                }
            }, 500); // 500ms 지연

        } catch (error) {
            console.error('교육 과정 처리 오류:', error);

            // 상세한 오류 정보 로깅
            if (error.code) {
                console.error('Firebase 오류 코드:', error.code);
                console.error('Firebase 오류 메시지:', error.message);
            }

            // 사용자에게 오류 알림
            if (window.adminAuth?.showNotification) {
                let errorMessage = '교육 과정 처리 중 오류가 발생했습니다.';

                // Firebase 권한 오류인 경우
                if (error.code === 'permission-denied') {
                    errorMessage = '데이터베이스 접근 권한이 없습니다. 관리자에게 문의해주세요.';
                } else if (error.code === 'unavailable') {
                    errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
                }

                window.adminAuth.showNotification(errorMessage, 'error');
            }
        }
    },

    /**
     * 폼 데이터 수집 및 검증
     */
    collectFormData: function (form) {
        const certificateType = form.querySelector('#course-certificate-type').value;
        const instructorId = form.querySelector('#course-instructor').value;
        const startDate = new Date(form.querySelector('#course-start-date').value);
        const endDate = new Date(form.querySelector('#course-end-date').value);
        const applyStartDate = new Date(form.querySelector('#course-apply-start-date').value);
        const applyEndDate = new Date(form.querySelector('#course-apply-end-date').value);
        const price = parseInt(form.querySelector('#course-price').value);
        const capacity = parseInt(form.querySelector('#course-capacity').value);
        const status = form.querySelector('#course-status').value;
        const method = form.querySelector('#course-method').value;
        const location = form.querySelector('#course-location').value;

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
            price,
            capacity,
            status,
            method,
            location
        };
    },

    /**
     * 과정 데이터 구성
     */
    buildCourseData: function (formData) {
        // 자동 생성 데이터
        const title = this.generateCourseTitle(formData.certificateType, formData.startDate);
        const description = this.generateCourseDescription(formData.certificateType);

        const courseData = {
            title: title,
            certificateType: formData.certificateType,
            instructor: formData.instructorName,
            instructorId: formData.instructorId,
            description: description,
            price: formData.price,
            capacity: formData.capacity,
            method: formData.method || '온라인 + 오프라인 병행',
            location: formData.location || '서울 강남구 센터',
            status: formData.status
        };

        // Firebase 타임스탬프로 변환
        if (window.dhcFirebase && window.dhcFirebase.firebase) {
            courseData.startDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(formData.startDate);
            courseData.endDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(formData.endDate);
            courseData.applyStartDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(formData.applyStartDate);
            courseData.applyEndDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(formData.applyEndDate);
        } else {
            // 테스트 환경
            courseData.startDate = formData.startDate;
            courseData.endDate = formData.endDate;
            courseData.applyStartDate = formData.applyStartDate;
            courseData.applyEndDate = formData.applyEndDate;
        }

        return courseData;
    },

    /**
     * 교육 과정 상세 보기
     */
    viewCourse: async function (courseId) {
        try {
            let course = this.courses.find(c => c.id === courseId);

            if (!course && window.dhcFirebase && window.dhcFirebase.db) {
                // Firebase에서 다시 조회
                const doc = await window.dhcFirebase.db.collection('courses').doc(courseId).get();
                if (doc.exists) {
                    course = { id: doc.id, ...doc.data() };
                }
            }

            if (!course) {
                window.adminAuth?.showNotification('해당 교육 과정을 찾을 수 없습니다.', 'error');
                return;
            }

            // 상세 정보 표시 (간단한 알림창으로)
            const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
            const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);
            const applyStartDate = course.applyStartDate?.toDate ? course.applyStartDate.toDate() : new Date(course.applyStartDate);
            const applyEndDate = course.applyEndDate?.toDate ? course.applyEndDate.toDate() : new Date(course.applyEndDate);

            // 🔧 전역 유틸리티 사용으로 변경
            const formatDate = (date) => {
                return window.formatters.formatDate(date, 'YYYY.MM.DD');
            };

            // 🔧 전역 유틸리티 사용으로 변경
            const formatCurrency = (price) => {
                return window.formatters.formatCurrency(price);
            };

            alert(`
                ========== 교육 과정 상세 정보 ==========
                
                교육명: ${course.title}
                자격증: ${this.getCertificateName(course.certificateType)}
                강사: ${course.instructor}
                
                교육 기간: ${formatDate(startDate)} ~ ${formatDate(endDate)}
                신청 기간: ${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}
                
                수강료: ${formatCurrency(course.price)}
                정원: ${course.capacity}명
                현재 신청자: ${course.enrolledCount || 0}명
                
                교육 방식: ${course.method || '-'}
                교육 장소: ${course.location || '-'}
                상태: ${course.status}
                
                설명: ${course.description || '내용 없음'}
            `);

        } catch (error) {
            console.error('교육 과정 상세 보기 오류:', error);
            window.adminAuth?.showNotification('교육 과정 정보를 불러오는데 실패했습니다.', 'error');
        }
    },

    /**
     * 교육 과정 수정
     */
    editCourse: async function (courseId) {
        try {
            let course = this.courses.find(c => c.id === courseId);

            if (!course && window.dhcFirebase && window.dhcFirebase.db) {
                // Firebase에서 다시 조회
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
                form.querySelector('#course-certificate-type').value = course.certificateType || '';
                form.querySelector('#course-instructor').value = course.instructorId || '';
                form.querySelector('#course-price').value = course.price || '';
                form.querySelector('#course-capacity').value = course.capacity || '';
                form.querySelector('#course-status').value = course.status || 'preparing';
                form.querySelector('#course-method').value = course.method || '온라인 + 오프라인 병행';
                form.querySelector('#course-location').value = course.location || '서울 강남구 센터';

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

                // 수정 모드임을 표시 (폼에 courseId 데이터 속성 추가)
                form.setAttribute('data-course-id', courseId);

                // 미리보기 업데이트
                this.updateAutoPreview();

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
     * 교육 과정 삭제 처리
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
    },

    /**
     * 날짜 포맷팅
     */
    formatDate: function (date) {
        if (!date) return '-';
        const d = date instanceof Date ? date : new Date(date?.seconds * 1000 || 0);
        return window.formatters.formatDate(d, 'YYYY-MM-DD');
    },

    /**
     * 금액 포맷팅
     */
    formatCurrency: function (value) {
        return window.formatters.formatCurrency(value);
    }
};

// 페이지 로드 완료 후 실행 - 최종 해결 버전
document.addEventListener('DOMContentLoaded', function () {
    console.log('🌐 교육 관리 페이지 DOMContentLoaded');

    // 전역 스코프에 courseManager 객체 추가
    window.courseManager = courseManager;
});

// 페이지 완전 로드 후 초기화
window.addEventListener('load', function () {
    console.log('🌐 교육 관리 페이지 load 이벤트');

    // adminUtils 강제 초기화 (토글 기능 활성화)
    setTimeout(() => {
        if (window.adminUtils && window.adminUtils.initAdminPage) {
            console.log('🔧 adminUtils 강제 초기화 시작');
            window.adminUtils.initAdminPage();
            console.log('✅ adminUtils 강제 초기화 완료');
        }

        // courseManager 초기화
        if (window.courseManager && window.courseManager.init) {
            console.log('🚀 courseManager 초기화 시작');
            window.courseManager.init().then(() => {
                console.log('✅ courseManager 초기화 완료');
            }).catch(error => {
                console.error('❌ courseManager 초기화 오류:', error);
            });
        }

    }, 2000); // 2초 지연으로 모든 스크립트 로딩 완료 후 실행
});

// 디버깅용 전역 함수들 (개발 모드)
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.FORCE_DEBUG === true) {

    window.debugCourseManager = {
        // 강사 목록 확인
        showInstructors: function () {
            console.log('현재 강사 목록:', window.courseManager.instructors);
        },

        // 과정 목록 확인
        showCourses: function () {
            console.log('현재 과정 목록:', window.courseManager.courses);
        },

        // 강제 초기화
        forceInit: function () {
            console.log('🔧 courseManager 강제 초기화');
            window.courseManager.init();
        },

        // 강제 데이터 로드
        forceLoad: function () {
            console.log('🔧 강제 데이터 로드');
            window.courseManager.loadCourses();
        },

        // adminUtils 강제 초기화
        forceAdminInit: function () {
            console.log('🔧 adminUtils 강제 초기화');
            window.adminUtils.initAdminPage();
        },

        // 🔧 의존성 테스트 함수 추가
        testDependencies: function () {
            console.log('🔧 관리자 페이지 유틸리티 의존성 테스트...');
            const result = checkAdminDependencies();
            if (result) {
                console.log('✅ 모든 유틸리티 정상 로드됨');
                
                // 기능 테스트
                try {
                    const testDate = new Date();
                    console.log('📅 formatters.formatDate 테스트:', window.formatters.formatDate(testDate, 'YYYY-MM-DD'));
                    console.log('💰 formatters.formatCurrency 테스트:', window.formatters.formatCurrency(350000));
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

        // 테스트 데이터로 폼 채우기
        fillTestData: function () {
            const form = document.getElementById('course-form');
            if (!form) {
                console.log('폼이 열려있지 않습니다. 먼저 "교육 과정 추가" 버튼을 클릭하세요.');
                return;
            }

            // 테스트 데이터 입력
            form.querySelector('#course-certificate-type').value = 'health-exercise';
            form.querySelector('#course-price').value = '350000';
            form.querySelector('#course-capacity').value = '30';

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

            console.log('✅ 테스트 데이터 입력 완료');
        },

        // 도움말
        help: function () {
            console.log('🎯 개선된 교육 관리 디버깅 도구');
            console.log('');
            console.log('🔧 의존성 관리:');
            console.log('- testDependencies() : 유틸리티 의존성 확인');
            console.log('');
            console.log('📊 데이터 확인:');
            console.log('- showInstructors() : 강사 목록 확인');
            console.log('- showCourses() : 과정 목록 확인');
            console.log('');
            console.log('🧪 테스트:');
            console.log('- fillTestData() : 테스트 데이터로 폼 채우기');
            console.log('');
            console.log('💡 사용법:');
            console.log('1. testDependencies() : 먼저 의존성 확인');
            console.log('2. 교육 과정 추가 버튼 클릭');
            console.log('3. fillTestData() : 테스트 데이터 입력');
            console.log('4. 저장 버튼 클릭');
        }
    };

    console.log('🎯 개선된 교육 관리 디버깅 도구 활성화됨');
    console.log('💡 도움말: window.debugCourseManager.help()');
}

// 디버깅용 전역 함수들 (개발 모드)
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.FORCE_DEBUG === true) {

    window.debugCourseManager = {
        // 강사 목록 확인
        showInstructors: function () {
            console.log('현재 강사 목록:', window.courseManager.instructors);
        },

        // 과정 목록 확인
        showCourses: function () {
            console.log('현재 과정 목록:', window.courseManager.courses);
        },

        // 강제 초기화
        forceInit: function () {
            console.log('🔧 courseManager 강제 초기화');
            window.courseManager.init();
        },

        // 강제 데이터 로드
        forceLoad: function () {
            console.log('🔧 강제 데이터 로드');
            window.courseManager.loadCourses();
        },

        // 테스트 데이터로 폼 채우기
        fillTestData: function () {
            const form = document.getElementById('course-form');
            if (!form) {
                console.log('폼이 열려있지 않습니다. 먼저 "교육 과정 추가" 버튼을 클릭하세요.');
                return;
            }

            // 테스트 데이터 입력
            form.querySelector('#course-certificate-type').value = 'health-exercise';
            form.querySelector('#course-price').value = '350000';
            form.querySelector('#course-capacity').value = '30';

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

            console.log('✅ 테스트 데이터 입력 완료');
        },

        // 도움말
        help: function () {
            console.log('🎯 개선된 교육 관리 디버깅 도구');
            console.log('');
            console.log('📊 데이터 확인:');
            console.log('- showInstructors() : 강사 목록 확인');
            console.log('- showCourses() : 과정 목록 확인');
            console.log('');
            console.log('🔧 강제 실행:');
            console.log('- forceInit() : courseManager 강제 초기화');
            console.log('- forceLoad() : 강제 데이터 로드');
            console.log('');
            console.log('🧪 테스트:');
            console.log('- fillTestData() : 테스트 데이터로 폼 채우기');
            console.log('');
            console.log('💡 사용법:');
            console.log('1. 교육 과정 추가 버튼 클릭');
            console.log('2. fillTestData() 실행');
            console.log('3. 저장 버튼 클릭');
        }
    };

    console.log('🎯 개선된 교육 관리 디버깅 도구 활성화됨');
    console.log('💡 도움말: window.debugCourseManager.help()');
}

// 디버깅용 전역 함수들 (개발 모드)
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.FORCE_DEBUG === true) {

    window.debugCourseManager = {
        // 강사 목록 확인
        showInstructors: function () {
            console.log('현재 강사 목록:', window.courseManager.instructors);
        },

        // 과정 목록 확인
        showCourses: function () {
            console.log('현재 과정 목록:', window.courseManager.courses);
        },

        // 테스트 데이터로 폼 채우기
        fillTestData: function () {
            const form = document.getElementById('course-form');
            if (!form) {
                console.log('폼이 열려있지 않습니다. 먼저 "교육 과정 추가" 버튼을 클릭하세요.');
                return;
            }

            // 테스트 데이터 입력
            form.querySelector('#course-certificate-type').value = 'health-exercise';
            form.querySelector('#course-price').value = '350000';
            form.querySelector('#course-capacity').value = '30';

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

            console.log('✅ 테스트 데이터 입력 완료');
        },

        // 도움말
        help: function () {
            console.log('🎯 개선된 교육 관리 디버깅 도구');
            console.log('');
            console.log('📊 데이터 확인:');
            console.log('- showInstructors() : 강사 목록 확인');
            console.log('- showCourses() : 과정 목록 확인');
            console.log('');
            console.log('🧪 테스트:');
            console.log('- fillTestData() : 테스트 데이터로 폼 채우기');
            console.log('');
            console.log('💡 사용법:');
            console.log('1. 교육 과정 추가 버튼 클릭');
            console.log('2. fillTestData() 실행');
            console.log('3. 저장 버튼 클릭');
        }
    };

    console.log('🎯 개선된 교육 관리 디버깅 도구 활성화됨');
    console.log('💡 도움말: window.debugCourseManager.help()');
}