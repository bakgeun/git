/**
 * course-history.js
 * 수강 내역 페이지 기능
 */

(function() {
    // 현재 페이지 정보
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalPages = 1;
    let allCourses = [];
    let filteredCourses = [];

    // 필터 상태
    let filters = {
        status: '',
        certType: '',
        sort: 'recent'
    };

    /**
     * 페이지 초기화
     */
    async function initializePage() {
        try {
            // 인증 상태 확인
            if (!window.mypageHelpers.checkAuthState()) {
                return;
            }

            // 이벤트 리스너 설정
            setupEventListeners();

            // 수강 내역 로드
            await loadCourseHistory();

        } catch (error) {
            console.error('페이지 초기화 오류:', error);
            window.mypageHelpers.showNotification('페이지 초기화 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 필터 변경 이벤트
        document.getElementById('status-filter').addEventListener('change', handleFilterChange);
        document.getElementById('cert-filter').addEventListener('change', handleFilterChange);
        document.getElementById('sort-filter').addEventListener('change', handleFilterChange);
    }

    /**
     * 수강 내역 로드
     */
    async function loadCourseHistory() {
        try {
            // 로딩 상태 표시
            showLoadingState(true);

            const user = window.authService.getCurrentUser();
            
            // Firestore에서 수강 내역 조회
            const result = await window.dbService.getDocuments('enrollments', {
                where: {
                    field: 'userId',
                    operator: '==',
                    value: user.uid
                },
                orderBy: {
                    field: 'enrolledAt',
                    direction: 'desc'
                }
            });

            if (result.success) {
                allCourses = result.data;
                applyFiltersAndRender();
            } else {
                throw new Error('수강 내역 조회 실패');
            }

        } catch (error) {
            console.error('수강 내역 로드 오류:', error);
            window.mypageHelpers.showNotification('수강 내역을 불러오는데 실패했습니다.', 'error');
            showEmptyState();
        } finally {
            showLoadingState(false);
        }
    }

    /**
     * 필터 변경 처리
     */
    function handleFilterChange() {
        filters.status = document.getElementById('status-filter').value;
        filters.certType = document.getElementById('cert-filter').value;
        filters.sort = document.getElementById('sort-filter').value;
        
        currentPage = 1; // 필터 변경 시 첫 페이지로
        applyFiltersAndRender();
    }

    /**
     * 필터 적용 및 렌더링
     */
    function applyFiltersAndRender() {
        // 필터 적용
        filteredCourses = allCourses.filter(course => {
            // 상태 필터
            if (filters.status && course.status !== filters.status) {
                return false;
            }
            
            // 자격증 타입 필터
            if (filters.certType && course.certType !== filters.certType) {
                return false;
            }
            
            return true;
        });

        // 정렬 적용
        sortCourses();

        // 페이지네이션 계산
        totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

        // 렌더링
        renderCourseList();
        renderPagination();
    }

    /**
     * 과정 정렬
     */
    function sortCourses() {
        switch (filters.sort) {
            case 'recent':
                filteredCourses.sort((a, b) => b.enrolledAt.seconds - a.enrolledAt.seconds);
                break;
            case 'progress':
                filteredCourses.sort((a, b) => (b.progress || 0) - (a.progress || 0));
                break;
            case 'name':
                filteredCourses.sort((a, b) => a.courseName.localeCompare(b.courseName));
                break;
        }
    }

    /**
     * 과정 목록 렌더링
     */
    function renderCourseList() {
        const courseList = document.getElementById('course-list');
        
        if (filteredCourses.length === 0) {
            showEmptyState();
            return;
        }

        // 현재 페이지의 아이템만 표시
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const coursesToShow = filteredCourses.slice(startIndex, endIndex);

        courseList.innerHTML = coursesToShow.map(course => createCourseItem(course)).join('');
        document.getElementById('empty-state').classList.add('hidden');
    }

    /**
     * 과정 아이템 생성
     * @param {object} course - 과정 데이터
     * @returns {string} - HTML 문자열
     */
    function createCourseItem(course) {
        const statusClass = getStatusClass(course.status);
        const statusText = getStatusText(course.status);
        const progress = course.progress || 0;
        const certTypeText = getCertTypeText(course.certType);
        
        return `
            <div class="course-item">
                <div class="course-thumbnail">
                    ${course.thumbnail ? 
                        `<img src="${course.thumbnail}" alt="${course.courseName}">` :
                        `<div class="bg-gray-200 w-full h-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>`
                    }
                </div>
                <div class="course-info">
                    <h3 class="course-title">${course.courseName}</h3>
                    <div class="course-meta">
                        <span class="text-gray-600">${certTypeText}</span>
                        <span class="text-gray-400">•</span>
                        <span class="text-gray-600">수강기간: ${window.formatters.formatDate(course.startDate)} ~ ${window.formatters.formatDate(course.endDate)}</span>
                    </div>
                    <div class="course-progress">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="text-sm text-gray-600 mt-1">진도율: ${progress}%</div>
                </div>
                <div class="course-actions">
                    <span class="course-status ${statusClass}">${statusText}</span>
                    ${course.status === 'in-progress' ? 
                        `<button onclick="window.location.href='../education/course-view.html?id=${course.id}'" class="btn btn-primary btn-sm">
                            수강하기
                        </button>` :
                        course.status === 'completed' ?
                        `<button onclick="downloadCertificate('${course.id}')" class="btn btn-secondary btn-sm">
                            수료증 다운로드
                        </button>` :
                        `<button onclick="window.location.href='../education/course-view.html?id=${course.id}'" class="btn btn-secondary btn-sm">
                            시작하기
                        </button>`
                    }
                </div>
            </div>
        `;
    }

    /**
     * 상태 클래스 반환
     * @param {string} status - 과정 상태
     * @returns {string} - CSS 클래스
     */
    function getStatusClass(status) {
        switch (status) {
            case 'completed':
                return 'status-completed';
            case 'in-progress':
                return 'status-in-progress';
            case 'not-started':
            default:
                return 'status-not-started';
        }
    }

    /**
     * 상태 텍스트 반환
     * @param {string} status - 과정 상태
     * @returns {string} - 상태 텍스트
     */
    function getStatusText(status) {
        switch (status) {
            case 'completed':
                return '수강완료';
            case 'in-progress':
                return '수강중';
            case 'not-started':
            default:
                return '미시작';
        }
    }

    /**
     * 자격증 타입 텍스트 반환
     * @param {string} certType - 자격증 타입
     * @returns {string} - 자격증 텍스트
     */
    function getCertTypeText(certType) {
        switch (certType) {
            case 'health-exercise':
                return '건강운동처방사';
            case 'rehabilitation':
                return '운동재활전문가';
            case 'pilates':
                return '필라테스 전문가';
            case 'recreation':
                return '레크리에이션지도자';
            default:
                return '기타';
        }
    }

    /**
     * 페이지네이션 렌더링
     */
    function renderPagination() {
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        window.mypageHelpers.setupPagination(pagination, currentPage, totalPages, function(page) {
            currentPage = page;
            renderCourseList();
            renderPagination();
            window.scrollTo(0, 0);
        });
    }

    /**
     * 로딩 상태 표시
     * @param {boolean} show - 표시 여부
     */
    function showLoadingState(show) {
        const loadingState = document.getElementById('loading-state');
        const courseList = document.getElementById('course-list');
        const emptyState = document.getElementById('empty-state');
        
        if (show) {
            loadingState.classList.remove('hidden');
            courseList.innerHTML = '';
            emptyState.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
        }
    }

    /**
     * 빈 상태 표시
     */
    function showEmptyState() {
        const courseList = document.getElementById('course-list');
        const emptyState = document.getElementById('empty-state');
        const pagination = document.getElementById('pagination');
        
        courseList.innerHTML = '';
        emptyState.classList.remove('hidden');
        pagination.innerHTML = '';
    }

    /**
     * 수료증 다운로드
     * @param {string} courseId - 과정 ID
     */
    window.downloadCertificate = async function(courseId) {
        try {
            window.mypageHelpers.showNotification('수료증 다운로드 기능은 준비 중입니다.', 'info');
            
            // 실제 구현 시 PDF 생성 및 다운로드 로직 추가
            // const result = await generateCertificatePDF(courseId);
            // if (result.success) {
            //     downloadFile(result.pdfUrl, `certificate_${courseId}.pdf`);
            // }
        } catch (error) {
            console.error('수료증 다운로드 오류:', error);
            window.mypageHelpers.showNotification('수료증 다운로드 중 오류가 발생했습니다.', 'error');
        }
    };

    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', initializePage);
})();