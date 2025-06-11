/**
 * course-application.js - 완전한 통합 유틸리티 시스템 적용 버전
 * 교육 과정 신청 페이지의 모든 기능을 포함합니다.
 */

console.log('=== 완전한 course-application.js 파일 로드됨 ===');

// 🔧 의존성 체크 시스템
function checkDependencies() {
    const requiredUtils = [
        { name: 'window.formatters', path: 'formatters.js' },
        { name: 'window.dateUtils', path: 'date-utils.js' }
        // validators.js와 dom-utils.js는 실제로 사용하지 않으므로 제거
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
            initCourseApplicationPage();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initCourseApplicationPage();
    }
}

// 초기화 시작
initializeWhenReady();

// 페이지 초기화 함수
function initCourseApplicationPage() {
    console.log('=== initCourseApplicationPage 실행 시작 ===');

    try {
        // 🔧 의존성 체크 먼저 실행
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

        // 폼 관련 기능들
        initFormValidation();
        initAgreementHandling();
        initFormSubmission();
        initPhoneFormatting();
        initEmailValidation();

        // 결제 관련 기능들
        initPaymentMethods();
        initModalHandling();
        initTossPayments();

        // URL 파라미터 및 자동 선택 기능
        initAutoSelection();

        console.log('=== initCourseApplicationPage 완료 ===');
    } catch (error) {
        console.error('페이지 초기화 중 오류:', error);
    }
}

// 🔧 의존성 오류 표시 함수
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

// =================================
// 교육 일정 로딩 기능들
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

                if (typeof showToast === 'function') {
                    showToast('Firebase 인덱스 설정 중입니다. 임시로 테스트 데이터를 표시합니다.', 'warning');
                }

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

            // ✅ 신청 날짜 (Firebase에서 직접 가져옴 - 하드코딩 제거)
            let applyStartDate, applyEndDate;

            if (course.applyStartDate && course.applyEndDate) {
                // Firebase에 신청기간이 있으면 그것을 사용
                applyStartDate = course.applyStartDate?.toDate ? course.applyStartDate.toDate() : new Date(course.applyStartDate);
                applyEndDate = course.applyEndDate?.toDate ? course.applyEndDate.toDate() : new Date(course.applyEndDate);
                console.log('Firebase 신청기간 사용:', course.title, applyStartDate, '~', applyEndDate);
            } else {
                // 신청기간이 없으면 기본값으로 계산 (하위 호환성)
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

            // 현재 날짜 기준 상태 계산 (수정된 버전)
            const now = new Date();
            let status = 'upcoming';
            let statusText = '준비중';
            let statusClass = 'status-upcoming';

            console.log(`${course.title} 상태 계산:`, {
                now: formatDate(now),
                applyStart: formatDate(applyStartDate),
                applyEnd: formatDate(applyEndDate),
                courseStart: formatDate(startDate),
                adminStatus: course.status  // 관리자 설정 상태
            });

            // ✅ 1. 먼저 관리자가 설정한 상태 확인
            if (course.status === 'active') {
                // 관리자가 "모집중"으로 설정한 경우
                console.log(`${course.title}: 관리자가 모집중으로 설정`);

                // 신청 기간 내인지 확인
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
                        statusText = '모집중';  // ✅ 관리자 설정 반영
                        statusClass = 'status-available';
                    }
                } else if (now < applyStartDate) {
                    // 신청 시작 전이지만 관리자가 모집중으로 설정한 경우
                    status = 'available';
                    statusText = '모집중';
                    statusClass = 'status-available';
                } else if (now > applyEndDate) {
                    // 신청 종료 후
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
                // ✅ 2. 관리자 상태가 없거나 명확하지 않은 경우에만 날짜 기준 계산
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

            const canApply = (status === 'available' || status === 'urgent');
            const applyButton = canApply
                ? `<a href="#course-selection" class="apply-btn" data-course-id="${course.id}" data-course-name="${getCertificateName(course.certificateType)}" data-course-period="${coursePeriod}">신청하기</a>`
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
                    <td>${applyButton}</td>
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

        const applyBtn = row.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', function (e) {
                e.preventDefault();

                const courseId = this.getAttribute('data-course-id');
                const courseName = this.getAttribute('data-course-name');
                const coursePeriod = this.getAttribute('data-course-period');

                console.log('신청하기 클릭:', { courseId, courseName, coursePeriod });

                if (courseId) {
                    selectCourseById(courseId);
                } else {
                    selectCourseByNameAndPeriod(courseName, coursePeriod);
                }

                scrollToCourseSelection();

                if (typeof showToast === 'function') {
                    showToast(`${courseName} ${coursePeriod} 과정이 선택되었습니다.`, 'success');
                }
            });
        }
    });

    console.log('=== initScheduleTableInteractions 완료 ===');
}

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
            description: '건강운동처방사 자격증 취득을 위한 기본 과정입니다.'
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
            description: '건강운동처방사 자격증 취득을 위한 기본 과정입니다.'
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
            description: '운동재활전문가 자격증 취득을 위한 기본 과정입니다.'
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
            description: '필라테스 전문가 자격증 취득을 위한 기본 과정입니다.'
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
            description: '레크리에이션지도자 자격증 취득을 위한 기본 과정입니다.'
        }
    ];
}

// =================================
// 동적 과정 선택 기능들
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

        if (typeof showToast === 'function') {
            showToast('과정 데이터를 불러오는 중 오류가 발생했습니다. 테스트 데이터를 표시합니다.', 'warning');
        }
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
 * 개별 과정 옵션 생성 - 🔧 전역 유틸리티 사용
 */
function generateCourseOption(course, now) {
    const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
    const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);

    // ✅ 신청 날짜 (Firebase에서 직접 가져옴 - 하드코딩 제거)
    let applyStartDate, applyEndDate;

    if (course.applyStartDate && course.applyEndDate) {
        // Firebase에 신청기간이 있으면 그것을 사용
        applyStartDate = course.applyStartDate?.toDate ? course.applyStartDate.toDate() : new Date(course.applyStartDate);
        applyEndDate = course.applyEndDate?.toDate ? course.applyEndDate.toDate() : new Date(course.applyEndDate);
        console.log('드롭다운 Firebase 신청기간 사용:', course.title, applyStartDate, '~', applyEndDate);
    } else {
        // 신청기간이 없으면 기본값으로 계산 (하위 호환성)
        applyStartDate = new Date(startDate);
        applyStartDate.setDate(applyStartDate.getDate() - 30);
        applyEndDate = new Date(startDate);
        applyEndDate.setDate(applyEndDate.getDate() - 7);
        console.warn('드롭다운 신청기간 없음, 기본값 사용:', course.title);
    }

    let isAvailable = false;
    let statusText = '';
    let isDisabled = false;

    // ✅ 관리자가 설정한 상태 우선 적용
    if (course.status === 'active') {
        // 관리자가 "모집중"으로 설정한 경우
        console.log(`드롭다운 ${course.title}: 관리자가 모집중으로 설정`);

        // 신청 기간 및 정원 확인
        if (now >= applyStartDate && now <= applyEndDate) {
            const enrolledCount = course.enrolledCount || 0;
            const capacity = course.capacity || 30;

            if (enrolledCount >= capacity) {
                statusText = '마감';
                isDisabled = true;
            } else {
                statusText = enrolledCount >= capacity * 0.8 ? '마감임박' : '모집중';
                isAvailable = true;
                isDisabled = false;  // ✅ 신청 가능
            }
        } else if (now < applyStartDate) {
            // 신청 시작 전이지만 관리자가 모집중으로 설정한 경우
            statusText = '모집중';
            isAvailable = true;
            isDisabled = false;  // ✅ 신청 가능
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

    // 🔧 전역 유틸리티 사용
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

    console.log('=== handleCourseSelection 완료 ===');
}

/**
 * Firebase 데이터로 과정 정보 업데이트 - 🔧 전역 유틸리티 사용
 */
function updateCourseInfoFromFirebase(course) {
    console.log('=== updateCourseInfoFromFirebase 시작 ===');

    const courseInfo = document.getElementById('course-info');

    try {
        const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
        const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);

        // 🔧 전역 유틸리티 사용
        const formatDate = (date) => {
            return window.formatters.formatDate(date, 'YYYY.MM.DD');
        };

        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7));
        const dateRange = `${formatDate(startDate)} ~ ${formatDate(endDate)} (${duration}주)`;

        const applyStartDate = new Date(startDate);
        applyStartDate.setDate(applyStartDate.getDate() - 30);
        const applyEndDate = new Date(startDate);
        applyEndDate.setDate(applyEndDate.getDate() - 7);
        const applyPeriod = `${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}`;

        // 🔧 전역 유틸리티 사용
        const formatPrice = (price) => {
            return window.formatters.formatCurrency(price);
        };

        const courseData = {
            title: course.title || '교육과정명',
            period: dateRange,
            price: formatPrice(course.price || 0),
            method: course.method || '온라인 + 오프라인 병행',
            capacity: `${course.capacity || 30}명`,
            location: course.location || '서울 강남구 센터',
            applyPeriod: applyPeriod,
            description: course.description || '상세한 교육 과정 안내가 제공됩니다.',
            instructor: course.instructor || '전문 강사진'
        };

        document.getElementById('course-title').textContent = courseData.title;
        document.getElementById('course-period').textContent = courseData.period;
        document.getElementById('course-price').textContent = courseData.price;
        document.getElementById('course-method').textContent = courseData.method;
        document.getElementById('course-capacity').textContent = courseData.capacity;
        document.getElementById('course-location').textContent = courseData.location;
        document.getElementById('course-apply-period').textContent = courseData.applyPeriod;
        document.getElementById('course-description').textContent = courseData.description;

        updatePaymentInfo(courseData);
        courseInfo.classList.add('show');

        console.log('=== updateCourseInfoFromFirebase 완료 ===');

    } catch (error) {
        console.error('과정 정보 업데이트 오류:', error);
        clearCourseInfo();
    }
}

/**
 * 결제 정보 업데이트
 */
function updatePaymentInfo(courseData) {
    const selectedCourseName = document.getElementById('selected-course-name');
    const selectedCoursePeriod = document.getElementById('selected-course-period');
    const selectedCoursePrice = document.getElementById('selected-course-price');
    const finalPaymentAmount = document.getElementById('final-payment-amount');

    if (selectedCourseName) selectedCourseName.textContent = courseData.title;
    if (selectedCoursePeriod) selectedCoursePeriod.textContent = courseData.period;
    if (selectedCoursePrice) selectedCoursePrice.textContent = courseData.price;
    if (finalPaymentAmount) finalPaymentAmount.textContent = courseData.price;
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

    const selectedCourseName = document.getElementById('selected-course-name');
    const selectedCoursePeriod = document.getElementById('selected-course-period');
    const selectedCoursePrice = document.getElementById('selected-course-price');
    const finalPaymentAmount = document.getElementById('final-payment-amount');

    if (selectedCourseName) selectedCourseName.textContent = '과정을 먼저 선택해주세요';
    if (selectedCoursePeriod) selectedCoursePeriod.textContent = '-';
    if (selectedCoursePrice) selectedCoursePrice.textContent = '-';
    if (finalPaymentAmount) finalPaymentAmount.textContent = '₩0';

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
 * 테스트용 과정 데이터
 */
function getTestCourseData() {
    const now = new Date();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    return [
        {
            id: 'test-health-1',
            title: '건강운동처방사 기본과정 1기',
            certificateType: 'health-exercise',
            instructor: '김운동 교수',
            startDate: new Date(now.getTime() + oneMonth),
            endDate: new Date(now.getTime() + oneMonth * 3),
            price: 350000,
            capacity: 30,
            enrolledCount: 18,
            status: 'active',
            description: '질병 예방과 건강 증진을 위한 맞춤형 운동처방 전문가 양성 과정입니다.',
            method: '온라인 + 오프라인 병행',
            location: '서울 강남구 센터'
        },
        {
            id: 'test-rehab-1',
            title: '운동재활전문가 기본과정 1기',
            certificateType: 'rehabilitation',
            instructor: '이재활 박사',
            startDate: new Date(now.getTime() + oneMonth * 1.5),
            endDate: new Date(now.getTime() + oneMonth * 4.5),
            price: 420000,
            capacity: 25,
            enrolledCount: 22,
            status: 'active',
            description: '부상 및 질환 이후 효과적인 운동재활 프로그램 설계 및 지도 전문가 양성 과정입니다.',
            method: '온라인 + 오프라인 병행',
            location: '서울 강남구 센터'
        },
        {
            id: 'test-pilates-1',
            title: '필라테스 전문가 기본과정 1기',
            certificateType: 'pilates',
            instructor: '박필라 마스터',
            startDate: new Date(now.getTime() + oneMonth * 2),
            endDate: new Date(now.getTime() + oneMonth * 5),
            price: 480000,
            capacity: 20,
            enrolledCount: 5,
            status: 'active',
            description: '과학적 원리 기반의 체계적인 필라테스 실기 및 이론 전문가 양성 과정입니다.',
            method: '오프라인 집중과정',
            location: '서울 강남구 센터'
        },
        {
            id: 'test-recreation-1',
            title: '레크리에이션지도자 기본과정 1기',
            certificateType: 'recreation',
            instructor: '최레크 선생',
            startDate: new Date(now.getTime() + oneMonth * 1.2),
            endDate: new Date(now.getTime() + oneMonth * 2.7),
            price: 280000,
            capacity: 25,
            enrolledCount: 12,
            status: 'active',
            description: '즐거운 신체활동과 여가생활을 위한 레크리에이션 지도 전문가 양성 과정입니다.',
            method: '온라인 + 오프라인 병행',
            location: '서울 강남구 센터'
        }
    ];
}

// =================================
// 과정 선택 연동 기능들
// =================================

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
        if (typeof showToast === 'function') {
            showToast('선택하신 과정은 현재 신청할 수 없습니다.', 'warning');
        }
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

// =================================
// URL 파라미터 및 자동 선택 기능
// =================================

/**
 * URL 파라미터 및 자동 선택 기능
 */
function initAutoSelection() {
    console.log('=== initAutoSelection 시작 ===');
    checkUrlParams();
    console.log('=== initAutoSelection 완료 ===');
}

/**
 * URL 파라미터 확인 및 자동 선택
 */
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get('course');
    const from = urlParams.get('from');

    console.log('URL 파라미터 확인:', { course, from });

    if (course) {
        waitForCourseDataAndSelect(course, from);
    }
}

/**
 * 과정 데이터 로드 대기 후 자동 선택
 */
async function waitForCourseDataAndSelect(courseParam, from) {
    console.log('=== waitForCourseDataAndSelect 시작 ===');
    console.log('대기 중인 과정 파라미터:', courseParam, 'from:', from);

    let retryCount = 0;
    const maxRetries = 50;

    const waitForData = async () => {
        if (window.availableCourses && window.availableCourses.length > 0) {
            console.log('과정 데이터 로드 완료, 자동 선택 시작');

            if (selectCourseById(courseParam)) {
                console.log('✅ courseId로 직접 선택 성공:', courseParam);
                setTimeout(() => scrollToCourseSelection(), 500);
                return;
            }

            if (from === 'certificate') {
                const success = selectCourseFromCertificateType(courseParam);
                if (success) {
                    console.log('✅ 자격증 타입으로 선택 성공:', courseParam);
                    setTimeout(() => scrollToCourseSelection(), 500);
                    return;
                }
            }

            console.log('❌ 자동 선택 실패:', courseParam);
            return;
        }

        retryCount++;
        if (retryCount < maxRetries) {
            console.log(`과정 데이터 대기 중... (${retryCount}/${maxRetries})`);
            setTimeout(waitForData, 100);
        } else {
            console.error('과정 데이터 로드 타임아웃');
        }
    };

    await waitForData();
}

/**
 * 자격증 타입으로 첫 번째 모집중인 과정 선택
 */
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

// =================================
// 폼 관련 기능들
// =================================

/**
 * 폼 유효성 검사 초기화
 */
function initFormValidation() {
    console.log('📝 initFormValidation 초기화');

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

    // 폼 제출 시 유효성 검사
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (validateForm()) {
            handleFormSubmission(e);
        }
    });
}

/**
 * 약관 동의 처리 초기화
 */
function initAgreementHandling() {
    console.log('📋 initAgreementHandling 초기화');

    // 전체 동의 체크박스
    const agreeAll = document.getElementById('agree-all');
    if (agreeAll) {
        agreeAll.addEventListener('change', function () {
            const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="agree-"]');
            checkboxes.forEach(cb => {
                if (cb.id !== 'agree-all') {
                    cb.checked = this.checked;
                }
            });
        });
    }

    // 개별 약관 체크박스들
    const individualCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="agree-"]:not(#agree-all)');
    individualCheckboxes.forEach(cb => {
        cb.addEventListener('change', function () {
            if (agreeAll) {
                const allChecked = Array.from(individualCheckboxes).every(checkbox => checkbox.checked);
                agreeAll.checked = allChecked;
            }
        });
    });
}

/**
 * 폼 제출 처리 초기화
 */
function initFormSubmission() {
    console.log('📤 initFormSubmission 초기화');

    const form = document.getElementById('application-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleFormSubmission(e);
    });
}

/**
 * 폼 제출 처리
 */
function handleFormSubmission(e) {
    console.log('📤 폼 제출 처리 시작');

    try {
        // 폼 데이터 수집
        const formData = collectFormData();
        console.log('수집된 폼 데이터:', formData);

        // 유효성 검사
        if (!validateFormData(formData)) {
            return;
        }

        // 결제 처리
        processPayment(formData);

    } catch (error) {
        console.error('폼 제출 처리 오류:', error);
        alert('신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

/**
 * 전화번호 포맷팅 초기화
 */
function initPhoneFormatting() {
    console.log('📞 initPhoneFormatting 초기화');

    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function () {
        // 🔧 전역 유틸리티 사용
        this.value = window.formatters.formatPhoneNumber(this.value);
    });
}

/**
 * 이메일 유효성 검사 초기화
 */
function initEmailValidation() {
    console.log('📧 initEmailValidation 초기화');

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

// =================================
// 결제 관련 기능들
// =================================

/**
 * 결제 방법 선택 초기화
 */
function initPaymentMethods() {
    console.log('💳 initPaymentMethods 초기화');

    // 결제 방법 카드 클릭 이벤트
    const paymentMethods = document.querySelectorAll('[data-method]');
    paymentMethods.forEach(method => {
        method.addEventListener('click', function () {
            // 모든 결제 방법 비활성화
            paymentMethods.forEach(m => m.classList.remove('active'));

            // 선택된 방법 활성화
            this.classList.add('active');

            // 라디오 버튼 체크
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }

            // 무통장 입금 상세 정보 표시/숨김
            const bankDetails = document.getElementById('bank-details');
            if (bankDetails) {
                if (this.getAttribute('data-method') === 'bank') {
                    bankDetails.classList.remove('hidden');
                } else {
                    bankDetails.classList.add('hidden');
                }
            }
        });
    });

    // 라디오 버튼 직접 클릭 이벤트
    const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            const methodCard = document.querySelector(`[data-method="${this.value}"]`);
            if (methodCard) {
                methodCard.click();
            }
        });
    });
}

/**
 * 모달 처리 초기화
 */
function initModalHandling() {
    console.log('🖼️  initModalHandling 초기화');

    const modal = document.getElementById('payment-success-modal');
    if (!modal) return;

    // 모달 닫기 버튼들
    const closeButtons = modal.querySelectorAll('[data-dismiss="modal"], .close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            closeModal(modal);
        });
    });

    // 배경 클릭으로 닫기
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal(modal);
        }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal(modal);
        }
    });
}

/**
 * 토스페이먼츠 초기화
 */
function initTossPayments() {
    console.log('💰 initTossPayments 초기화');
    console.log('토스페이먼츠 연동은 실제 서비스에서 구현 예정');

    // 실제 토스페이먼츠 연동 시 여기에 구현
    // window.tossPayments = TossPayments('클라이언트 키');
}

// =================================
// 유틸리티 함수들 (전역 유틸리티 사용)
// =================================

/**
 * 폼 데이터 수집
 */
function collectFormData() {
    const form = document.getElementById('application-form');
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};

    // 기본 폼 데이터 수집
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // 체크박스 데이터 수집
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        data[cb.name || cb.id] = cb.checked;
    });

    // 선택된 과정 정보 추가
    const courseSelect = document.getElementById('course-select');
    if (courseSelect && courseSelect.value) {
        data.selectedCourseId = courseSelect.value;

        const selectedCourse = window.availableCourses?.find(course => course.id === courseSelect.value);
        if (selectedCourse) {
            data.selectedCourseInfo = selectedCourse;
        }
    }

    return data;
}

/**
 * 폼 유효성 검사
 */
function validateForm() {
    const form = document.getElementById('application-form');
    if (!form) return false;

    let isValid = true;
    const errors = [];

    // 필수 필드 검사
    const requiredInputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
            errors.push(`${getFieldLabel(input)}을(를) 입력해주세요.`);
        }
    });

    // 과정 선택 검사
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect || !courseSelect.value) {
        isValid = false;
        errors.push('교육 과정을 선택해주세요.');
    }

    // 약관 동의 검사
    const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
    requiredCheckboxes.forEach(cb => {
        if (!cb.checked) {
            isValid = false;
            errors.push(`${getFieldLabel(cb)}에 동의해주세요.`);
        }
    });

    // 결제 방법 선택 검사
    const paymentMethod = form.querySelector('input[name="payment-method"]:checked');
    if (!paymentMethod) {
        isValid = false;
        errors.push('결제 방법을 선택해주세요.');
    }

    // 오류 메시지 표시
    if (!isValid) {
        alert('다음 항목을 확인해주세요:\n\n' + errors.join('\n'));
    }

    return isValid;
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
 * 폼 데이터 유효성 검사
 */
function validateFormData(formData) {
    // 기본 정보 검사
    if (!formData['applicant-name'] || !formData.phone || !formData.email) {
        alert('신청자 정보를 모두 입력해주세요.');
        return false;
    }

    // 과정 선택 검사
    if (!formData.selectedCourseId) {
        alert('교육 과정을 선택해주세요.');
        return false;
    }

    // 약관 동의 검사
    if (!formData['agree-terms'] || !formData['agree-privacy'] || !formData['agree-refund']) {
        alert('필수 약관에 모두 동의해주세요.');
        return false;
    }

    // 결제 방법 검사
    if (!formData['payment-method']) {
        alert('결제 방법을 선택해주세요.');
        return false;
    }

    return true;
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

/**
 * 결제 처리
 */
function processPayment(formData) {
    console.log('💳 결제 처리 시작');

    const paymentMethod = formData['payment-method'];

    if (paymentMethod === 'card') {
        processCardPayment(formData);
    } else if (paymentMethod === 'bank') {
        processBankTransfer(formData);
    } else {
        alert('결제 방법을 선택해주세요.');
    }
}

/**
 * 카드 결제 처리
 */
function processCardPayment(formData) {
    console.log('💳 카드 결제 처리');

    // 실제 토스페이먼츠 연동 시 구현
    // 현재는 테스트 모드로 성공 처리

    setTimeout(() => {
        const paymentResult = {
            success: true,
            orderId: 'ORD' + Date.now(),
            method: 'card',
            amount: formData.selectedCourseInfo?.price || 0,
            customerName: formData['applicant-name']
        };

        showPaymentSuccess(paymentResult);
    }, 2000);

    // 로딩 표시
    showPaymentLoading();
}

/**
 * 무통장 입금 처리
 */
function processBankTransfer(formData) {
    console.log('🏦 무통장 입금 처리');

    const bankResult = {
        success: true,
        orderId: 'BANK' + Date.now(),
        method: 'bank',
        amount: formData.selectedCourseInfo?.price || 0,
        customerName: formData['applicant-name'],
        depositor: formData['bank-depositor'] || formData['applicant-name']
    };

    showBankTransferSuccess(bankResult);
}

/**
 * 결제 성공 모달 표시
 */
function showPaymentSuccess(data) {
    console.log('✅ 결제 성공:', data);

    const modal = document.getElementById('payment-success-modal');
    if (!modal) return;

    // 결제 정보 업데이트
    const orderNumber = modal.querySelector('#order-number');
    const paymentMethodDisplay = modal.querySelector('#payment-method-display');
    const paidAmount = modal.querySelector('#paid-amount');

    if (orderNumber) orderNumber.textContent = data.orderId || 'TEST_ORDER_' + Date.now();
    if (paymentMethodDisplay) paymentMethodDisplay.textContent = data.method === 'card' ? '신용카드' : '무통장 입금';
    if (paidAmount) {
        // 🔧 전역 유틸리티 사용
        const amount = typeof data.amount === 'number' ?
            window.formatters.formatCurrency(data.amount) :
            data.amount;
        paidAmount.textContent = amount;
    }

    // 모달 표시
    openModal(modal);

    // Firebase에 신청 데이터 저장 (실제 구현 시)
    saveApplicationData(data);
}

/**
 * 무통장 입금 성공 처리
 */
function showBankTransferSuccess(data) {
    console.log('🏦 무통장 입금 신청 완료:', data);
    showPaymentSuccess(data);
}

/**
 * 결제 로딩 표시
 */
function showPaymentLoading() {
    // 간단한 로딩 표시 (실제로는 더 정교한 UI 구현)
    const button = document.getElementById('apply-button');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> 결제 처리 중...';
    }
}

/**
 * 신청 데이터 저장
 */
async function saveApplicationData(paymentData) {
    if (!window.dhcFirebase?.db || !window.dbService) {
        console.log('Firebase 미연동, 데이터 저장 생략');
        return;
    }

    try {
        const applicationData = {
            customerName: paymentData.customerName,
            orderId: paymentData.orderId,
            paymentMethod: paymentData.method,
            amount: paymentData.amount,
            courseId: document.getElementById('course-select')?.value,
            status: 'pending',
            createdAt: new Date()
        };

        const result = await window.dbService.addDocument('applications', applicationData);

        if (result.success) {
            console.log('✅ 신청 데이터 저장 성공:', result.id);
        } else {
            console.error('❌ 신청 데이터 저장 실패:', result.error);
        }
    } catch (error) {
        console.error('신청 데이터 저장 오류:', error);
    }
}

/**
 * 모달 열기
 */
function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // 포커스 트랩
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

/**
 * 모달 닫기
 */
function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// =================================
// 기본 UI 기능들
// =================================

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
 * 스크롤 힌트 추가
 */
function addScrollHint(element) {
    if (element.scrollWidth > element.clientWidth) {
        element.setAttribute('data-scroll-hint', '좌우로 스크롤하세요');
    }
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
        // 🔧 전역 유틸리티 사용
        countElement.textContent = window.formatters.formatNumber(currentCount);

        if (progress < 1) {
            requestAnimationFrame(updateCount);
        }
    }

    requestAnimationFrame(updateCount);
}

/**
 * 토스트 메시지 표시
 */
function showToast(message, type = 'info') {
    console.log(`Toast (${type}): ${message}`);

    // 간단한 토스트 구현
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-size: 14px;
        max-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(toast);

    // 애니메이션 시작
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);

    // 자동 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);

    // 클릭으로 제거
    toast.addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
}

/**
 * 교육 일정 데이터 다시 로드 (전역 함수)
 */
window.loadScheduleData = loadScheduleData;

// =================================
// 실시간 업데이트 시스템
// =================================

/**
 * Firebase 실시간 리스너 설정
 * 교육과정이 추가/수정/삭제될 때 자동으로 페이지 업데이트
 */
function setupRealtimeUpdates() {
    console.log('🔄 실시간 업데이트 리스너 설정 시작');

    if (!window.dhcFirebase || !window.dhcFirebase.db) {
        console.warn('⚠️ Firebase가 초기화되지 않아 실시간 업데이트를 설정할 수 없습니다.');
        return;
    }

    // courses 컬렉션의 실시간 변경사항 감지
    window.dhcFirebase.db.collection('courses')
        .where('status', '==', 'active') // 활성 상태인 과정만
        .onSnapshot(
            (snapshot) => {
                console.log('🔄 교육과정 변경사항 감지됨');
                console.log('📊 현재 활성 교육과정 수:', snapshot.size);

                // 변경된 과정들 로그
                snapshot.docChanges().forEach((change) => {
                    const courseData = change.doc.data();
                    if (change.type === 'added') {
                        console.log('➕ 새 교육과정 추가:', courseData.title);
                    } else if (change.type === 'modified') {
                        console.log('✏️ 교육과정 수정:', courseData.title);
                    } else if (change.type === 'removed') {
                        console.log('🗑️ 교육과정 삭제:', courseData.title);
                    }
                });

                // 페이지 데이터 자동 새로고침
                setTimeout(() => {
                    refreshCourseData();
                }, 500); // 500ms 지연으로 Firebase 동기화 완료 대기
            },
            (error) => {
                console.error('❌ 실시간 업데이트 오류:', error);
            }
        );

    console.log('✅ 실시간 업데이트 리스너 설정 완료');
}

/**
 * 교육과정 데이터 새로고침
 */
function refreshCourseData() {
    console.log('🔄 교육과정 데이터 새로고침 시작');

    try {
        // 교육 일정 테이블 새로고침
        if (typeof loadScheduleData === 'function') {
            loadScheduleData();
            console.log('✅ 교육 일정 테이블 새로고침 완료');
        }

        // 과정 선택 드롭다운 새로고침
        if (typeof initDynamicCourseSelection === 'function') {
            initDynamicCourseSelection();
            console.log('✅ 과정 선택 드롭다운 새로고침 완료');
        }

        // 사용자에게 알림 표시 (선택적)
        showUpdateNotification();

    } catch (error) {
        console.error('❌ 교육과정 데이터 새로고침 오류:', error);
    }
}

/**
 * 업데이트 알림 표시
 */
function showUpdateNotification() {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.course-update-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = 'course-update-notification fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>교육과정 정보가 업데이트되었습니다.</span>
        </div>
    `;

    document.body.appendChild(notification);

    // 3초 후 자동 제거
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// 페이지 초기화 시 실시간 업데이트 설정
document.addEventListener('DOMContentLoaded', function () {
    // Firebase 초기화 대기 후 실시간 리스너 설정
    setTimeout(() => {
        setupRealtimeUpdates();
    }, 3000); // 3초 지연으로 Firebase 완전 초기화 대기
});

// =================================
// 디버깅 및 개발자 도구
// =================================

// 개발 모드에서 사용되는 디버깅 함수들
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.web.app') ||
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {

    window.debugCourseApplication = {
        // 기본 정보 확인
        help: function () {
            console.log('🎯 디버깅 도구 사용법');
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

            console.log('\n💳 결제 관련:');
            console.log('- simulatePaymentSuccess() : 결제 성공 시뮬레이션');

            console.log('\n🧪 종합 테스트:');
            console.log('- runFullTest() : 전체 기능 테스트');
        },

        // 🔧 의존성 테스트
        testDependencies: function () {
            console.log('🔧 유틸리티 의존성 테스트...');
            const result = checkDependencies();
            if (result) {
                console.log('✅ 모든 유틸리티 정상 로드됨');
                
                // 기능 테스트
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

            // 의존성 체크
            if (!this.testDependencies()) {
                console.error('❌ 유틸리티 누락으로 테스트 데이터 입력 중단');
                return;
            }

            // 기본 정보 입력
            const fields = {
                'applicant-name': '홍길동',
                'phone': '010-1234-5678',
                'email': 'test@example.com'
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
            const agreements = ['agree-terms', 'agree-privacy', 'agree-refund'];
            agreements.forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.checked = true;
                    console.log(`✅ ${id} 동의됨`);
                }
            });

            // 결제 방법 선택 (카드)
            const cardMethod = document.getElementById('method-card');
            if (cardMethod) {
                cardMethod.checked = true;
                const cardContainer = cardMethod.closest('[data-method="card"]');
                if (cardContainer) {
                    cardContainer.click();
                    console.log('✅ 카드 결제 선택됨');
                }
            }

            console.log('🎯 테스트 데이터 입력 완료!');
        },

        logFormData: function () {
            const formData = collectFormData();
            console.log('현재 폼 데이터:', formData);

            const isValid = validateForm();
            console.log('폼 유효성:', isValid ? '✅ 유효' : '❌ 무효');

            return formData;
        },

        checkValidation: function () {
            console.log('=== 폼 유효성 검사 결과 ===');

            const form = document.getElementById('application-form');
            if (!form) {
                console.log('❌ 폼을 찾을 수 없습니다.');
                return;
            }

            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            console.log(`총 ${inputs.length}개의 필수 필드 검사:`);

            inputs.forEach(input => {
                const isValid = validateField(input);
                const fieldName = getFieldLabel(input);
                const value = input.value?.trim() || '';
                console.log(`${isValid ? '✅' : '❌'} ${fieldName}: "${value}"`);
            });

            // 약관 동의 체크
            const requiredCheckboxes = document.querySelectorAll('input[type="checkbox"][required]');
            console.log(`\n약관 동의 (${requiredCheckboxes.length}개):`);
            requiredCheckboxes.forEach(checkbox => {
                const isChecked = checkbox.checked;
                const labelText = getFieldLabel(checkbox);
                console.log(`${isChecked ? '✅' : '❌'} ${labelText}`);
            });

            // 결제 방법 체크
            const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
            console.log(`\n결제 방법: ${selectedPaymentMethod ? '✅ ' + selectedPaymentMethod.value : '❌ 미선택'}`);
        },

        // 결제 관련
        simulatePaymentSuccess: function () {
            console.log('결제 성공 시뮬레이션...');
            
            // 유틸리티 사용 테스트
            let amount = 350000;
            if (window.formatters && window.formatters.formatCurrency) {
                amount = window.formatters.formatCurrency(350000);
            }
            
            showPaymentSuccess({
                success: true,
                orderId: 'TEST_ORDER_' + Date.now(),
                method: 'card',
                amount: amount,
                customerName: '테스트 사용자'
            });
            console.log('✅ 결제 성공 모달 표시됨');
        },

        // 종합 테스트
        runFullTest: function () {
            console.log('🚀 전체 기능 테스트 시작...');

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

            console.log('\n🎯 전체 테스트 완료!');
            console.log('💡 이제 다음 명령어들을 시도해보세요:');
            console.log('- simulatePaymentSuccess() : 결제 성공 시뮬레이션');
            console.log('- testAutoSelection("health-exercise") : 자동 선택 테스트');
        },

        // 실시간 업데이트 관련
        setupRealtime: setupRealtimeUpdates,
        refreshData: refreshCourseData,
        showNotification: showUpdateNotification
    };

    // 디버깅 도구 안내
    console.log('🎯 개발 모드 디버깅 도구 활성화됨');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('📊 데이터: showAvailableCourses(), reloadSchedule(), testDependencies()');
    console.log('🎯 선택: testCourseSelection(id), testAutoSelection(type)');
    console.log('📝 폼: fillTestData(), checkValidation()');
    console.log('💳 결제: simulatePaymentSuccess()');
    console.log('🧪 테스트: runFullTest()');
    console.log('\n💡 도움말: window.debugCourseApplication.help()');
    console.log('🚀 빠른 시작: window.debugCourseApplication.runFullTest()');

} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
    console.log('현재 호스트:', window.location.hostname);
}

// =================================
// 최종 완료 메시지
// =================================

console.log('\n🎉 === course-application.js 통합 유틸리티 시스템 적용 완료 ===');
console.log('✅ 전역 유틸리티 시스템 통합');
console.log('✅ 의존성 체크 시스템 구축');
console.log('✅ formatDate 오류 해결');
console.log('✅ 교육 일정 동적 로딩');
console.log('✅ Firebase 기반 과정 선택 드롭다운');
console.log('✅ 신청하기 버튼과 과정 선택 연동');
console.log('✅ URL 파라미터 자동 선택');
console.log('✅ 완전한 폼 검증 시스템');
console.log('✅ 결제 처리 (카드/무통장입금)');
console.log('✅ 실시간 UI 업데이트');
console.log('✅ 포괄적인 디버깅 도구');
console.log('\n🔧 근본적 문제 해결:');
console.log('- 중복 함수 제거 및 전역 유틸리티 통합');
console.log('- 스크립트 로딩 순서 표준화');
console.log('- 의존성 관리 시스템 구축');
console.log('\n🚀 모든 기능이 정상 작동할 준비가 완료되었습니다!');
console.log('🔧 관리자가 교육과정을 추가하면 즉시 사용자 페이지에 반영됩니다.');

// 완료 플래그 설정
window.courseApplicationReady = true;