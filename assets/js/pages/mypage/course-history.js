/**
 * course-history.js - URL 파라미터 연동 개선 버전
 * 수강 내역 페이지 기능 + 결제 완료 후 하이라이트
 */

(function () {
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

    // 🆕 URL 파라미터에서 가져온 최근 신청 정보
    let recentApplicationData = null;

    /**
     * 페이지 초기화
     */
    async function initializePage() {
        try {
            console.log('🚀 수강내역 페이지 초기화 시작');

            // 🆕 URL 파라미터 처리 (최우선) - 인증 확인 전에 실행
            handleURLParameters();

            // 인증 상태 확인
            if (!window.mypageHelpers?.checkAuthState()) {
                console.log('⚠️ 인증 확인 실패, 하지만 URL 파라미터 처리는 진행');
                // 인증이 실패해도 URL 파라미터 처리는 계속 진행
            }

            // 이벤트 리스너 설정
            setupEventListeners();

            // 수강 내역 로드
            await loadCourseHistory();

        } catch (error) {
            console.error('❌ 페이지 초기화 오류:', error);
            if (window.mypageHelpers?.showNotification) {
                window.mypageHelpers.showNotification('페이지 초기화 중 오류가 발생했습니다.', 'error');
            } else {
                console.log('알림: 페이지 초기화 중 오류가 발생했습니다.');
            }
        }
    }

    /**
     * 🆕 URL 파라미터 처리
     */
    function handleURLParameters() {
        console.log('📋 URL 파라미터 처리 시작');

        const urlParams = new URLSearchParams(window.location.search);
        const from = urlParams.get('from');

        console.log('🔍 URL 파라미터:', Object.fromEntries(urlParams));

        if (from === 'course-application') {
            // URL에서 최근 신청 정보 추출
            recentApplicationData = {
                applicationId: urlParams.get('applicationId'),
                courseName: urlParams.get('courseName'),
                status: urlParams.get('status'),
                timestamp: urlParams.get('timestamp'),
                type: urlParams.get('type')
            };

            console.log('✅ 최근 신청 데이터 감지:', recentApplicationData);

            // 로컬 스토리지에서도 확인
            const localData = getLocalStorageApplicationData(recentApplicationData.applicationId);
            if (localData) {
                console.log('📦 로컬 스토리지 데이터 발견:', localData);
                // 로컬 데이터와 URL 데이터 병합
                recentApplicationData = { ...localData, ...recentApplicationData };
            }

            // 페이지 상단에 하이라이트 카드 표시
            showRecentApplicationHighlight();

            // URL 정리 (뒤로가기 시 파라미터 유지 방지)
            if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }

    /**
     * 🆕 로컬 스토리지에서 최근 신청 데이터 조회
     */
    function getLocalStorageApplicationData(applicationId) {
        try {
            const recentApplications = JSON.parse(localStorage.getItem('dhc_recent_applications') || '[]');
            return recentApplications.find(app => app.applicationId === applicationId);
        } catch (error) {
            console.warn('⚠️ 로컬 스토리지 조회 오류:', error);
            return null;
        }
    }

    /**
     * 🆕 최근 신청 하이라이트 카드 표시
     */
    function showRecentApplicationHighlight() {
        if (!recentApplicationData) return;

        console.log('🎨 최근 신청 하이라이트 카드 생성');

        // 기존 하이라이트 카드 제거
        const existingCard = document.getElementById('recent-application-highlight');
        if (existingCard) {
            existingCard.remove();
        }

        // 하이라이트 카드 생성
        const highlightCard = createRecentApplicationCard(recentApplicationData);

        // 🔧 올바른 DOM 구조 파악
        const courseList = document.getElementById('course-list');
        if (!courseList) {
            console.error('❌ course-list 요소를 찾을 수 없습니다');
            return;
        }

        // course-list가 포함된 content-card
        const courseListCard = courseList.closest('.content-card');
        if (!courseListCard) {
            console.error('❌ course-list를 포함한 content-card를 찾을 수 없습니다');
            return;
        }

        // course-list card의 부모 (mypage-content)
        const mypageContent = courseListCard.parentElement;
        if (!mypageContent) {
            console.error('❌ mypage-content를 찾을 수 없습니다');
            return;
        }

        // 🔧 course-list card 앞에 하이라이트 카드 삽입
        mypageContent.insertBefore(highlightCard, courseListCard);

        console.log('✅ 하이라이트 카드 삽입 완료');

        // 애니메이션 효과
        setTimeout(() => {
            highlightCard.classList.add('animate-in');
        }, 100);

        // 성공 메시지 표시
        if (window.mypageHelpers?.showNotification) {
            window.mypageHelpers.showNotification('방금 신청하신 교육과정이 확인되었습니다! 🎉', 'success');
        } else {
            console.log('🎉 방금 신청하신 교육과정이 확인되었습니다!');
        }
    }

    /**
     * 🆕 최근 신청 하이라이트 카드 생성
     */
    function createRecentApplicationCard(data) {
        const card = document.createElement('div');
        card.id = 'recent-application-highlight';
        card.className = 'recent-application-card content-card';

        const courseName = data.courseName || '교육과정';
        const applicationId = data.applicationId || 'N/A';
        const totalAmount = data.totalAmount ? `${data.totalAmount.toLocaleString()}원` : '결제 완료';
        const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString('ko-KR') : '방금 전';

        card.innerHTML = `
            <div class="success-badge">
                <span class="badge-icon">✅</span>
                <span class="badge-text">방금 신청 완료</span>
            </div>
            
            <div class="card-content">
                <div class="course-info-section">
                    <h3 class="course-title">${courseName}</h3>
                    <div class="course-details">
                        <div class="detail-item">
                            <span class="detail-label">결제 금액:</span>
                            <span class="detail-value highlight-amount">${totalAmount}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">신청번호:</span>
                            <span class="detail-value">${applicationId}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">신청 시간:</span>
                            <span class="detail-value">${timestamp}</span>
                        </div>
                    </div>
                </div>
                
                <div class="next-steps-section">
                    <h4 class="steps-title">다음 단계</h4>
                    <ul class="steps-list">
                        <li class="step-item">
                            <span class="step-icon">📧</span>
                            <span class="step-text">신청 확인 이메일 발송</span>
                        </li>
                        <li class="step-item">
                            <span class="step-icon">📱</span>
                            <span class="step-text">교육 시작 전 안내 문자</span>
                        </li>
                        <li class="step-item">
                            <span class="step-icon">🎓</span>
                            <span class="step-text">교육 수료 후 자격증 발급</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="card-actions">
                <button class="btn btn-outline btn-sm" onclick="dismissRecentHighlight()">
                    <span>확인</span>
                </button>
                <button class="btn btn-primary btn-sm" onclick="window.location.href=window.adjustPath('pages/mypage/payment-history.html')">
                    <span>결제 내역 보기</span>
                </button>
            </div>
        `;

        return card;
    }

    /**
     * 🆕 최근 신청 하이라이트 카드 닫기
     */
    window.dismissRecentHighlight = function () {
        const card = document.getElementById('recent-application-highlight');
        if (card) {
            card.classList.add('animate-out');
            setTimeout(() => {
                if (card.parentElement) {
                    card.parentElement.removeChild(card);
                }
            }, 300);
        }
    };

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
     * 수강 내역 로드 (개선된 버전)
     */
    async function loadCourseHistory() {
        try {
            console.log('📚 수강 내역 로드 시작');

            // 로딩 상태 표시
            showLoadingState(true);

            // 🔧 사용자 확인 (null 체크 추가)
            const user = window.authService?.getCurrentUser();
            console.log('👤 현재 사용자:', user);

            let courseData = [];

            // 1. Firebase에서 수강 내역 조회 (사용자가 있는 경우에만)
            if (window.dbService && user && user.uid) {
                console.log('🔥 Firebase에서 수강 내역 조회 시작');
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
                    courseData = result.data;
                    console.log('✅ Firebase 수강 내역:', courseData.length, '개');
                }
            } else {
                console.log('⚠️ 사용자 정보 없음 - Firebase 조회 건너뛰기');
            }

            // 🆕 최근 신청 데이터를 임시 수강 내역으로 추가
            if (recentApplicationData && recentApplicationData.status === 'payment_completed') {
                const recentCourseItem = createRecentCourseItem(recentApplicationData);
                courseData.unshift(recentCourseItem); // 맨 앞에 추가
                console.log('✨ 최근 신청 데이터를 수강 내역에 추가');
            }

            // 3. 로컬 스토리지의 최근 신청들도 확인
            const localApplications = getRecentLocalApplications();
            localApplications.forEach(app => {
                // 중복 체크
                const exists = courseData.some(course => course.applicationId === app.applicationId);
                if (!exists) {
                    const courseItem = createRecentCourseItem(app);
                    courseData.push(courseItem);
                }
            });

            allCourses = courseData;
            applyFiltersAndRender();

        } catch (error) {
            console.error('❌ 수강 내역 로드 오류:', error);
            if (window.mypageHelpers?.showNotification) {
                window.mypageHelpers.showNotification('수강 내역을 불러오는데 실패했습니다.', 'error');
            }
            showEmptyState();
        } finally {
            showLoadingState(false);
        }
    }

    /**
     * 🆕 최근 신청 데이터를 수강 내역 아이템으로 변환
     */
    function createRecentCourseItem(applicationData) {
        return {
            id: applicationData.applicationId || `temp_${Date.now()}`,
            applicationId: applicationData.applicationId,
            courseName: applicationData.courseName || '교육과정',
            certType: applicationData.type === 'course_enrollment' ? 'health-exercise' : 'unknown',
            status: applicationData.status === 'payment_completed' ? 'enrolled' : 'pending',
            progress: 0,
            enrolledAt: { seconds: new Date(applicationData.timestamp || Date.now()).getTime() / 1000 },
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후 시작 예정
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60일 후 종료 예정
            isRecentApplication: true, // 🎯 최근 신청 표시용
            recentApplicationData: applicationData
        };
    }

    /**
     * 🆕 로컬 스토리지에서 최근 신청들 조회
     */
    function getRecentLocalApplications() {
        try {
            const recentApplications = JSON.parse(localStorage.getItem('dhc_recent_applications') || '[]');
            // 24시간 이내의 신청만 반환
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return recentApplications.filter(app => {
                const appTime = new Date(app.timestamp).getTime();
                return appTime > oneDayAgo;
            });
        } catch (error) {
            console.warn('⚠️ 로컬 스토리지 최근 신청 조회 오류:', error);
            return [];
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
                filteredCourses.sort((a, b) => {
                    // 🆕 최근 신청은 항상 맨 위에
                    if (a.isRecentApplication && !b.isRecentApplication) return -1;
                    if (!a.isRecentApplication && b.isRecentApplication) return 1;

                    const timeA = a.enrolledAt?.seconds || 0;
                    const timeB = b.enrolledAt?.seconds || 0;
                    return timeB - timeA;
                });
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
     * 과정 목록 렌더링 (개선된 버전)
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
     * 과정 아이템 생성 (개선된 버전)
     * @param {object} course - 과정 데이터
     * @returns {string} - HTML 문자열
     */
    function createCourseItem(course) {
        const statusClass = getStatusClass(course.status);
        const statusText = getStatusText(course.status);
        const progress = course.progress || 0;
        const certTypeText = getCertTypeText(course.certType);

        // 🆕 최근 신청인지 확인
        const isRecent = course.isRecentApplication;
        const recentClass = isRecent ? 'recent-application-item' : '';
        const recentBadge = isRecent ? '<span class="recent-badge">방금 신청</span>' : '';

        return `
            <div class="course-item ${recentClass}">
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
                    <div class="course-title-row">
                        <h3 class="course-title">${course.courseName}</h3>
                        ${recentBadge}
                    </div>
                    <div class="course-meta">
                        <span class="text-gray-600">${certTypeText}</span>
                        <span class="text-gray-400">•</span>
                        <span class="text-gray-600">수강기간: ${window.formatters.formatDate(course.startDate)} ~ ${window.formatters.formatDate(course.endDate)}</span>
                        ${isRecent ? '<span class="text-gray-400">•</span><span class="text-green-600 font-medium">결제 완료</span>' : ''}
                    </div>
                    <div class="course-progress">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="text-sm text-gray-600 mt-1">
                        ${isRecent ? '곧 교육이 시작됩니다' : `진도율: ${progress}%`}
                    </div>
                </div>
                <div class="course-actions">
                    <span class="course-status ${statusClass}">${statusText}</span>
                    ${getActionButton(course)}
                </div>
            </div>
        `;
    }

    /**
     * 🆕 과정별 액션 버튼 생성
     */
    function getActionButton(course) {
        if (course.isRecentApplication) {
            return `
                <button onclick="window.location.href=window.adjustPath('pages/mypage/payment-history.html')" class="btn btn-primary btn-sm">
                    결제 내역 보기
                </button>
            `;
        }

        switch (course.status) {
            case 'in-progress':
                return `
                    <button onclick="window.location.href='../education/course-view.html?id=${course.id}'" class="btn btn-primary btn-sm">
                        수강하기
                    </button>
                `;
            case 'completed':
                return `
                    <button onclick="downloadCertificate('${course.id}')" class="btn btn-secondary btn-sm">
                        수료증 다운로드
                    </button>
                `;
            case 'enrolled':
                return `
                    <button class="btn btn-outline btn-sm">
                        교육 대기중
                    </button>
                `;
            default:
                return `
                    <button onclick="window.location.href='../education/course-view.html?id=${course.id}'" class="btn btn-secondary btn-sm">
                        시작하기
                    </button>
                `;
        }
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
            case 'enrolled':
                return 'status-enrolled';
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
            case 'enrolled':
                return '등록완료';
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

        window.mypageHelpers.setupPagination(pagination, currentPage, totalPages, function (page) {
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
    window.downloadCertificate = async function (courseId) {
        try {
            window.mypageHelpers.showNotification('수료증 다운로드 기능은 준비 중입니다.', 'info');

            // 실제 구현 시 PDF 생성 및 다운로드 로직 추가
            // const result = await generateCertificatePDF(courseId);
            // if (result.success) {
            //     downloadFile(result.pdfUrl, `certificate_${courseId}.pdf`);
            // }
        } catch (error) {
            console.error('❌ 수료증 다운로드 오류:', error);
            window.mypageHelpers.showNotification('수료증 다운로드 중 오류가 발생했습니다.', 'error');
        }
    };

    document.addEventListener('DOMContentLoaded', initializePage);

    if (document.readyState !== 'loading') {
        initializePage();
    }

    // 🆕 전역 함수로 노출 (디버깅용)
    window.courseHistoryDebug = {
        initializePage,
        handleURLParameters,
        showRecentApplicationHighlight,
        recentApplicationData: () => recentApplicationData,
        testHighlight: function () {
            console.log('🧪 하이라이트 테스트 시작');

            // 테스트 데이터 설정
            recentApplicationData = {
                applicationId: 'TEST_' + Date.now(),
                courseName: '테스트 교육과정',
                status: 'payment_completed',
                timestamp: new Date().toISOString(),
                type: 'course_enrollment'
            };

            console.log('📋 테스트 데이터:', recentApplicationData);

            // 🔧 상세한 DOM 구조 확인
            const courseList = document.getElementById('course-list');
            const courseListCard = courseList?.closest('.content-card');
            const mypageContent = courseListCard?.parentElement;

            console.log('🔍 상세 DOM 확인:', {
                courseList: !!courseList,
                courseListCard: !!courseListCard,
                courseListCardClass: courseListCard?.className,
                mypageContent: !!mypageContent,
                mypageContentClass: mypageContent?.className,
                mypageContentChildren: mypageContent?.children.length
            });

            if (!courseList || !courseListCard || !mypageContent) {
                console.error('❌ 필요한 DOM 요소를 찾을 수 없습니다');
                return '❌ DOM 요소 없음';
            }

            // 하이라이트 카드 표시
            try {
                showRecentApplicationHighlight();
                return '✅ 테스트 하이라이트 카드 표시됨';
            } catch (error) {
                console.error('❌ 하이라이트 카드 표시 실패:', error);
                return '❌ 표시 실패: ' + error.message;
            }
        },

        // 🆕 간단한 테스트 (DOM 삽입 없이)
        simpleTest: function () {
            console.log('🧪 간단한 테스트 (카드 생성만)');

            // 테스트 데이터 설정
            const testData = {
                applicationId: 'SIMPLE_TEST',
                courseName: '간단 테스트 과정',
                status: 'payment_completed',
                timestamp: new Date().toISOString(),
                type: 'course_enrollment'
            };

            // 카드 HTML 생성 테스트
            const cardElement = createRecentApplicationCard(testData);
            console.log('✅ 카드 HTML 생성 성공:', cardElement);

            // 페이지 맨 아래에 추가
            document.body.appendChild(cardElement);

            // 애니메이션 적용
            setTimeout(() => {
                cardElement.classList.add('animate-in');
            }, 100);

            return '✅ 간단한 테스트 완료 (페이지 하단 확인)';
        }
    };

    console.log('✅ course-history.js 개선 완료 (URL 파라미터 연동 추가)');

    // 🧪 디버깅 정보 출력
    console.log('📊 course-history.js 로드 상태:', {
        timestamp: new Date().toISOString(),
        readyState: document.readyState,
        hasURL: !!window.location.search,
        hasScript: !!document.getElementById('course-list')
    });
})();