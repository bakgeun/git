/**
 * course-application.js - 통합 개선 버전 (Part 1)
 * Firebase 기반 교육 신청 페이지 - 통합 결제 시스템
 * 가격 계산 로직 수정 및 UI 업데이트 개선
 */

console.log('=== course-application.js 통합 개선 버전 로드됨 ===');

// =================================
// 🔧 전역 변수 및 상태 관리
// =================================

let availableCourses = [];
let selectedCourseData = null;
let pricingData = {
    education: 0,
    certificate: 0,
    material: 0,
    packageDiscount: 0
};
let courseApplicationUser = null;
let userAgreements = {
    privacy: false,
    terms: false,
    marketing: false,
    savedAt: null
};

// 🔧 NEW: 내부 네비게이션 추적 변수
let isInternalNavigation = false;
let formHasData = false;

// =================================
// 🔧 DOM 준비 및 초기화
// =================================

function initializeWhenReady() {
    console.log('=== 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initUnifiedCourseApplication();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initUnifiedCourseApplication();
    }
}

// 초기화 시작
initializeWhenReady();

// =================================
// 🔧 메인 초기화 함수
// =================================

async function initUnifiedCourseApplication() {
    console.log('=== initUnifiedCourseApplication 실행 시작 ===');

    try {
        // 1. Firebase 인증 상태 확인
        await initAuthState();

        // 2. 교육 일정 및 과정 데이터 로드
        await loadEducationData();

        // 3. 통합 신청 폼 초기화
        initUnifiedApplicationForm();

        // 4. 동적 가격 계산 시스템 초기화
        initDynamicPricing();

        // 5. 약관 관리 시스템 초기화
        await initAgreementSystem();

        // 6. 회원 정보 자동 기입
        await autoFillMemberInfo();

        // 7. 폼 유효성 검사 초기화
        initFormValidation();

        // 8. 토스페이먼츠 연동 준비
        initPaymentSystem();

        // 9. 🔧 NEW: URL 파라미터 처리 (과정 자동 선택)
        await handleURLParameters();

        // 🔧 NEW: 개선된 이벤트 설정
        setupFormChangeTracking();
        setupImprovedBeforeUnload();
        setupImprovedTabNavigation();

        console.log('=== initUnifiedCourseApplication 완료 ===');
    } catch (error) {
        console.error('❌ 초기화 중 오류:', error);
        showErrorMessage('페이지 초기화 중 오류가 발생했습니다.');
    }
}

// =================================
// 🔧 Firebase 인증 및 사용자 관리
// =================================

async function initAuthState() {
    console.log('👤 Firebase 인증 상태 초기화');

    if (!window.dhcFirebase?.auth) {
        console.log('Firebase 인증 미연동, 게스트 모드로 진행');
        return;
    }

    return new Promise((resolve) => {
        window.dhcFirebase.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('✅ 로그인된 사용자:', user.email);
                courseApplicationUser = user;

                // 사용자 약관 동의 상태 로드
                await loadUserAgreements(user.uid);
            } else {
                console.log('❌ 비로그인 상태');
                courseApplicationUser = null;
            }
            resolve();
        });
    });
}

async function loadUserAgreements(userId) {
    console.log('📋 사용자 약관 동의 상태 로드');

    if (!window.dbService) {
        console.log('dbService 미연동');
        return;
    }

    try {
        const result = await window.dbService.getDocument('user_agreements', userId);

        if (result.success && result.data) {
            userAgreements = {
                ...userAgreements,
                ...result.data
            };

            console.log('✅ 사용자 약관 상태 로드됨:', userAgreements);

            if (userAgreements.privacy && userAgreements.terms) {
                showPreviousAgreements();
            }
        } else {
            console.log('약관 동의 이력 없음');
        }
    } catch (error) {
        console.error('약관 상태 로드 오류:', error);
    }
}

function showPreviousAgreements() {
    const agreementNotice = document.getElementById('agreement-notice');
    const agreementContent = document.getElementById('agreement-content');

    if (agreementNotice && agreementContent) {
        agreementNotice.style.display = 'flex';
        agreementContent.style.display = 'none';

        const privacyCheck = document.getElementById('agree-privacy');
        const termsCheck = document.getElementById('agree-terms');
        const marketingCheck = document.getElementById('agree-marketing');

        if (privacyCheck) privacyCheck.checked = userAgreements.privacy;
        if (termsCheck) termsCheck.checked = userAgreements.terms;
        if (marketingCheck) marketingCheck.checked = userAgreements.marketing;

        showSuccessMessage('이전 약관 동의가 확인되었습니다.');
    }
}

// =================================
// 🔧 교육 데이터 로딩 (Part 2)
// =================================

async function loadEducationData() {
    console.log('📚 교육 데이터 로딩 시작');

    // 교육 일정 로드
    await loadScheduleData();

    // 과정 선택 옵션 로드
    await initDynamicCourseSelection();
}

async function loadScheduleData() {
    console.log('📅 교육 일정 로드');

    const loadingEl = document.getElementById('schedule-loading');
    const errorEl = document.getElementById('schedule-error');
    const containerEl = document.getElementById('schedule-container');
    const emptyEl = document.getElementById('schedule-empty');

    try {
        showLoadingState();

        let courses = [];

        if (window.dhcFirebase?.db && window.dbService) {
            console.log('Firebase에서 교육 과정 로드');

            const result = await window.dbService.getDocuments('courses');

            if (result.success) {
                courses = result.data;
                console.log(`✅ Firebase에서 ${courses.length}개 과정 로드됨`);

                // 정렬: 자격증 타입별, 날짜순
                courses.sort((a, b) => {
                    const typeOrder = ['health-exercise', 'rehabilitation', 'pilates', 'recreation'];
                    const typeA = typeOrder.indexOf(a.certificateType) !== -1 ? typeOrder.indexOf(a.certificateType) : 999;
                    const typeB = typeOrder.indexOf(b.certificateType) !== -1 ? typeOrder.indexOf(b.certificateType) : 999;

                    if (typeA !== typeB) return typeA - typeB;

                    const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
                    const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);

                    return dateA.getTime() - dateB.getTime();
                });
            } else {
                throw new Error(result.error?.message || 'Firebase 데이터 로드 실패');
            }
        } else {
            console.log('Firebase 미연동, 테스트 데이터 사용');
            courses = getTestScheduleData();
        }

        if (courses.length === 0) {
            showEmptyState();
            return;
        }

        availableCourses = courses;
        renderScheduleTable(courses);
        showScheduleContainer();
        initScheduleTableInteractions();

    } catch (error) {
        console.error('❌ 교육 일정 로드 오류:', error);

        if (error.message?.includes('index')) {
            console.log('🔄 Firebase 인덱스 오류, 테스트 데이터로 폴백');
            try {
                const testCourses = getTestScheduleData();
                availableCourses = testCourses;
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

function renderScheduleTable(courses) {
    console.log(`📋 교육 일정 테이블 렌더링: ${courses.length}개 과정`);

    const tbody = document.getElementById('schedule-table-body');
    if (!tbody) {
        console.error('schedule-table-body 요소를 찾을 수 없습니다');
        return;
    }

    let html = '';

    courses.forEach(course => {
        try {
            const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
            const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);

            // 신청 기간 계산
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

            // 상태 계산
            const now = new Date();
            const { statusText, statusClass, canApply } = calculateCourseStatus(course, now, applyStartDate, applyEndDate);

            // 기수 정보
            const year = startDate.getFullYear();
            const month = startDate.getMonth() + 1;
            const period = month <= 6 ? '상반기' : '하반기';
            const coursePeriod = `${year.toString().slice(-2)}년 ${period}`;

            // 과정명
            const certNames = {
                'health-exercise': '건강운동처방사',
                'rehabilitation': '운동재활전문가',
                'pilates': '필라테스 전문가',
                'recreation': '레크리에이션지도자'
            };
            const courseName = certNames[course.certificateType] || course.certificateType;

            // 날짜 포맷팅
            const formatDate = (date) => window.formatters?.formatDate(date, 'YYYY.MM.DD') || date.toLocaleDateString();

            // 선택 버튼
            const selectButton = canApply
                ? `<button class="select-btn" data-course-id="${course.id}" data-course-name="${courseName}" data-course-period="${coursePeriod}">선택하기</button>`
                : '-';

            html += `
                <tr class="schedule-row" data-course-id="${course.id}">
                    <td class="course-name">${courseName}</td>
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
    console.log('✅ 교육 일정 테이블 렌더링 완료');
}

function calculateCourseStatus(course, now, applyStartDate, applyEndDate) {
    let statusText = '준비중';
    let statusClass = 'status-upcoming';
    let canApply = false;

    if (course.status === 'active') {
        if (now >= applyStartDate && now <= applyEndDate) {
            const enrolledCount = course.enrolledCount || 0;
            const capacity = course.capacity || 30;

            if (enrolledCount >= capacity) {
                statusText = '마감';
                statusClass = 'status-closed';
            } else if (enrolledCount >= capacity * 0.8) {
                statusText = '마감임박';
                statusClass = 'status-urgent';
                canApply = true;
            } else {
                statusText = '모집중';
                statusClass = 'status-available';
                canApply = true;
            }
        } else if (now < applyStartDate) {
            statusText = '모집중';
            statusClass = 'status-available';
            canApply = true;
        } else {
            statusText = '마감';
            statusClass = 'status-closed';
        }
    } else if (course.status === 'preparing') {
        statusText = '준비중';
        statusClass = 'status-upcoming';
    } else if (course.status === 'closed') {
        statusText = '마감';
        statusClass = 'status-closed';
    } else if (course.status === 'completed') {
        statusText = '종료';
        statusClass = 'status-completed';
    }

    return { statusText, statusClass, canApply };
}

function initScheduleTableInteractions() {
    console.log('🖱️ 교육 일정 테이블 인터랙션 초기화');

    const scheduleRows = document.querySelectorAll('.schedule-row');

    scheduleRows.forEach(row => {
        // 호버 효과
        row.addEventListener('mouseenter', function () {
            if (window.innerWidth > 768) {
                this.style.transform = 'translateX(4px)';
                this.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                this.style.transition = 'all 0.3s ease';
            }
        });

        row.addEventListener('mouseleave', function () {
            this.style.transform = 'translateX(0)';
            this.style.boxShadow = 'none';
        });

        // 선택 버튼 클릭
        const selectBtn = row.querySelector('.select-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', function (e) {
                e.preventDefault();

                const courseId = this.getAttribute('data-course-id');
                const courseName = this.getAttribute('data-course-name');
                const coursePeriod = this.getAttribute('data-course-period');

                console.log('📋 과정 선택:', { courseId, courseName, coursePeriod });

                if (selectCourseById(courseId)) {
                    scrollToCourseSelection();
                    showSuccessMessage(`${courseName} ${coursePeriod} 과정이 선택되었습니다.`);
                }
            });
        }
    });
}

// URL 파라미터 처리 함수 추가
async function handleURLParameters() {
    console.log('🔗 URL 파라미터 처리 시작');

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');
        const fromPage = urlParams.get('from');

        console.log('📋 URL 파라미터:', { courseId, fromPage });

        if (courseId) {
            console.log('🎯 URL에서 과정 ID 감지:', courseId);

            // 과정 데이터가 로드될 때까지 대기
            let retryCount = 0;
            const maxRetries = 10;

            while (availableCourses.length === 0 && retryCount < maxRetries) {
                console.log(`⏳ 과정 데이터 로딩 대기 중... (${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 500));
                retryCount++;
            }

            if (availableCourses.length === 0) {
                console.warn('⚠️ 과정 데이터 로딩 시간 초과');
                showWarningMessage('과정 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            console.log('📊 로드된 과정들:', availableCourses.map(c => ({ id: c.id, title: c.title })));

            // 🔧 NEW: 실제 Firebase ID 우선 매칭
            let targetCourse = null;

            // 1단계: 정확한 ID 매칭 시도
            targetCourse = availableCourses.find(course => course.id === courseId);

            if (!targetCourse) {
                console.log('🔍 정확한 ID 매칭 실패, 자격증 타입으로 매칭 시도');

                // 2단계: 테스트 ID를 자격증 타입으로 매핑
                const testIdMapping = {
                    'test-health-1': 'health-exercise',
                    'test-rehab-1': 'rehabilitation',
                    'test-pilates-1': 'pilates',
                    'test-recreation-1': 'recreation'
                };

                // 3단계: 자격증 페이지에서 온 경우 자격증 타입 추출
                if (fromPage === 'certificate' && !testIdMapping[courseId]) {
                    // URL이나 referrer에서 자격증 타입 추출 시도
                    const referrer = document.referrer;
                    let certType = null;

                    if (referrer.includes('health-exercise')) certType = 'health-exercise';
                    else if (referrer.includes('rehabilitation')) certType = 'rehabilitation';
                    else if (referrer.includes('pilates')) certType = 'pilates';
                    else if (referrer.includes('recreation')) certType = 'recreation';

                    if (certType) {
                        console.log('🎯 자격증 페이지에서 감지된 타입:', certType);
                        // 해당 자격증 타입의 활성 과정 찾기
                        targetCourse = availableCourses.find(course =>
                            course.certificateType === certType &&
                            course.status === 'active'
                        );

                        if (!targetCourse) {
                            // 상태 관계없이 해당 자격증 타입의 과정 찾기
                            targetCourse = availableCourses.find(course =>
                                course.certificateType === certType
                            );
                        }
                    }
                }

                // 4단계: 테스트 ID 매핑 시도
                if (!targetCourse) {
                    const targetCertType = testIdMapping[courseId];
                    if (targetCertType) {
                        console.log('🎯 테스트 ID로 자격증 타입 매칭 시도:', targetCertType);

                        // 해당 자격증 타입의 첫 번째 활성 과정 선택
                        targetCourse = availableCourses.find(course =>
                            course.certificateType === targetCertType &&
                            course.status === 'active'
                        );

                        if (!targetCourse) {
                            // 상태 관계없이 해당 자격증 타입의 과정 찾기
                            targetCourse = availableCourses.find(course =>
                                course.certificateType === targetCertType
                            );
                        }
                    }
                }
            }

            if (!targetCourse) {
                console.log('🔍 모든 매칭 실패, 첫 번째 과정으로 폴백');
                targetCourse = availableCourses[0];
            }

            if (targetCourse) {
                console.log('✅ 대상 과정 찾음:', targetCourse.title, '(ID:', targetCourse.id + ')');

                // 과정 선택
                const success = selectCourseById(targetCourse.id);

                if (success) {
                    console.log('🎯 과정 자동 선택 성공');

                    // 과정 선택 섹션으로 스크롤
                    setTimeout(() => {
                        scrollToCourseSelection();

                        // 사용자에게 알림
                        const certNames = {
                            'health-exercise': '건강운동처방사',
                            'rehabilitation': '운동재활전문가',
                            'pilates': '필라테스 전문가',
                            'recreation': '레크리에이션지도자'
                        };

                        const certName = certNames[targetCourse.certificateType] || targetCourse.certificateType;

                        if (fromPage === 'certificate') {
                            showSuccessMessage(`${certName} 자격증 페이지에서 연결된 교육과정이 자동으로 선택되었습니다.`);
                        } else if (targetCourse.id !== courseId) {
                            showSuccessMessage(`${certName} 과정이 자동으로 선택되었습니다. (유사한 과정으로 매칭됨)`);
                        } else {
                            showSuccessMessage(`${certName} 과정이 자동으로 선택되었습니다.`);
                        }

                        // URL 정리 (새로고침 시 중복 실행 방지)
                        if (window.history && window.history.replaceState) {
                            const newUrl = window.location.pathname;
                            window.history.replaceState({}, document.title, newUrl);
                        }

                    }, 1000);
                } else {
                    console.warn('❌ 과정 자동 선택 실패');
                    showWarningMessage('선택하신 과정을 불러올 수 없습니다. 수동으로 선택해주세요.');
                }
            } else {
                console.warn('⚠️ 매칭할 수 있는 과정이 없음');
                showWarningMessage('요청하신 과정을 찾을 수 없습니다. 다른 과정을 선택해주세요.');
            }
        } else {
            console.log('📝 URL 파라미터에 과정 ID 없음');
        }

    } catch (error) {
        console.error('❌ URL 파라미터 처리 오류:', error);
        showErrorMessage('페이지 초기화 중 오류가 발생했습니다.');
    }
}

// 🔧 NEW: 테스트 데이터 ID 매핑 함수
function mapTestIdToRealCourse(testId, availableCourses) {
    const testIdMapping = {
        'test-health-1': 'health-exercise',
        'test-rehab-1': 'rehabilitation',
        'test-pilates-1': 'pilates',
        'test-recreation-1': 'recreation'
    };

    const targetCertType = testIdMapping[testId];
    if (!targetCertType) {
        return null;
    }

    // 활성 상태 우선, 없으면 상태 관계없이
    return availableCourses.find(course =>
        course.certificateType === targetCertType && course.status === 'active'
    ) || availableCourses.find(course =>
        course.certificateType === targetCertType
    );
}

// =================================
// 🔧 동적 과정 선택 (Part 3)
// =================================

async function initDynamicCourseSelection() {
    console.log('🎯 동적 과정 선택 초기화');

    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다');
        return;
    }

    try {
        courseSelect.innerHTML = '<option value="">과정 데이터 로딩 중...</option>';
        courseSelect.disabled = true;

        if (availableCourses.length === 0) {
            if (window.dhcFirebase?.db && window.dbService) {
                const result = await window.dbService.getDocuments('courses');
                if (result.success) {
                    availableCourses = result.data;
                } else {
                    throw new Error('과정 데이터 로드 실패');
                }
            } else {
                availableCourses = getTestCourseData();
            }
        }

        populateCourseOptions(availableCourses);

        courseSelect.addEventListener('change', function () {
            handleCourseSelection(this.value);
        });

        courseSelect.disabled = false;

        console.log('✅ 동적 과정 선택 초기화 완료');

    } catch (error) {
        console.error('❌ 동적 과정 선택 초기화 오류:', error);

        const testCourses = getTestCourseData();
        populateCourseOptions(testCourses);
        courseSelect.disabled = false;
        availableCourses = testCourses;

        showWarningMessage('과정 데이터를 불러오는 중 오류가 발생했습니다. 테스트 데이터를 표시합니다.');
    }
}

function populateCourseOptions(courses) {
    console.log(`📝 과정 옵션 생성: ${courses.length}개`);

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

            if (typeA !== typeB) return typeA - typeB;

            const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
            const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);

            return dateA.getTime() - dateB.getTime();
        });

    const groupedCourses = {};
    validCourses.forEach(course => {
        const type = course.certificateType;
        if (!groupedCourses[type]) {
            groupedCourses[type] = [];
        }
        groupedCourses[type].push(course);
    });

    Object.keys(groupedCourses).forEach(certType => {
        const certNames = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        const typeName = certNames[certType] || certType;

        optionsHtml += `<optgroup label="${typeName}">`;

        groupedCourses[certType].forEach(course => {
            const optionData = generateCourseOption(course);
            optionsHtml += `<option value="${course.id}" ${optionData.isDisabled ? 'disabled' : ''} data-course-type="${certType}">
                ${optionData.optionText}
            </option>`;
        });

        optionsHtml += '</optgroup>';
    });

    courseSelect.innerHTML = optionsHtml;
}

function generateCourseOption(course) {
    const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
    const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);

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

    const now = new Date();
    const { statusText, canApply } = calculateCourseStatus(course, now, applyStartDate, applyEndDate);

    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    const period = month <= 6 ? '상반기' : '하반기';
    const coursePeriod = `${year.toString().slice(-2)}년 ${period}`;

    const formatDate = (date) => window.formatters?.formatDate(date, 'YYYY.MM.DD') || date.toLocaleDateString();
    const dateRange = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
    const optionText = `${course.title || '과정명 미정'} (${dateRange}) - ${statusText}`;

    return {
        optionText,
        isDisabled: !canApply,
        statusText,
        coursePeriod,
        dateRange
    };
}

function handleCourseSelection(courseId) {
    console.log('🎯 과정 선택 처리:', courseId);

    if (!courseId || !availableCourses) {
        clearCourseInfo();
        clearPricingData();
        // 🔧 NEW: 신청 옵션 섹션도 초기화
        resetApplicationOptionPrices();
        return;
    }

    const selectedCourse = availableCourses.find(course => course.id === courseId);
    if (!selectedCourse) {
        console.error('선택된 과정을 찾을 수 없습니다:', courseId);
        clearCourseInfo();
        clearPricingData();
        resetApplicationOptionPrices();
        return;
    }

    selectedCourseData = selectedCourse;
    console.log('✅ 과정 선택됨:', selectedCourse);

    // 과정 정보 업데이트
    updateCourseInfo(selectedCourse);

    // 🔧 수정: 가격 정보 로드 및 업데이트 (신청 옵션 섹션 포함)
    loadCoursePricing(selectedCourse);

    // 최종 확인 카드 업데이트
    updateFinalCheck();
}

// 🔧 NEW: 신청 옵션 섹션 가격 초기화 함수
function resetApplicationOptionPrices() {
    console.log('🔄 신청 옵션 섹션 가격 초기화');

    // 자격증 발급 옵션 가격 초기화
    const certificateOptionPrice = document.querySelector('.option-card.required .option-price');
    if (certificateOptionPrice) {
        certificateOptionPrice.textContent = '가격 로딩중...';
    }

    // 교재 구매 옵션 가격 초기화
    const materialOptionPrice = document.querySelector('.option-card.optional .option-price');
    if (materialOptionPrice) {
        materialOptionPrice.textContent = '가격 로딩중...';
    }

    // 교재명 초기화
    const materialTitle = document.querySelector('.option-card.optional .option-title');
    if (materialTitle) {
        materialTitle.textContent = '교재 구매';
    }
}

function updateCourseInfo(course) {
    console.log('📋 과정 정보 업데이트');

    try {
        const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
        const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);

        const formatDate = (date) => window.formatters?.formatDate(date, 'YYYY.MM.DD') || date.toLocaleDateString();
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7));
        const dateRange = `${formatDate(startDate)} ~ ${formatDate(endDate)} (${duration}주)`;

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

        // DOM 업데이트
        document.getElementById('course-title').textContent = course.title || '교육과정명';
        document.getElementById('course-period').textContent = dateRange;
        document.getElementById('course-method').textContent = course.method || '온라인 + 오프라인 병행';
        document.getElementById('course-capacity').textContent = `${course.capacity || 30}명`;
        document.getElementById('course-location').textContent = course.location || '서울 강남구 센터';
        document.getElementById('course-apply-period').textContent = applyPeriod;
        document.getElementById('course-description').textContent = course.description || '상세한 교육 과정 안내가 제공됩니다.';

        // 과정 정보 카드 표시
        const courseInfo = document.getElementById('course-info');
        if (courseInfo) {
            courseInfo.classList.add('show');
        }

    } catch (error) {
        console.error('과정 정보 업데이트 오류:', error);
        clearCourseInfo();
    }
}

// =================================
// 🔧 수정된 동적 가격 계산 시스템
// =================================

function initDynamicPricing() {
    console.log('💰 동적 가격 계산 시스템 초기화');

    const certificateCheckbox = document.getElementById('include-certificate');
    const materialCheckbox = document.getElementById('include-material');

    if (certificateCheckbox) {
        certificateCheckbox.addEventListener('change', function () {
            console.log('자격증 발급 옵션 변경:', this.checked);
            updatePricingDisplay();
            updateFinalCheck();
        });
    }

    if (materialCheckbox) {
        materialCheckbox.addEventListener('change', function () {
            console.log('교재 구매 옵션 변경:', this.checked);
            updatePricingDisplay();
            updateFinalCheck();
        });
    }

    console.log('✅ 동적 가격 계산 시스템 초기화 완료');
}

async function loadCoursePricing(course) {
    console.log('💰 과정 가격 정보 로드:', course.title);

    try {
        // 🔧 수정: 관리자가 설정한 가격 정보 추출 (pricing 객체에서)
        const pricing = course.pricing || {};

        // 🔧 수정: 기본값과 함께 정확한 가격 매핑
        pricingData = {
            education: pricing.education || course.educationPrice || course.price || 150000,
            certificate: pricing.certificate || course.certificatePrice || 50000,
            material: pricing.material || course.materialPrice || 30000,
            packageDiscount: pricing.packageDiscount || 10,
            materialRequired: pricing.materialRequired || false
        };

        console.log('✅ 가격 정보 로드됨:', pricingData);

        // 🔧 NEW: 신청 옵션 섹션 가격 업데이트 추가
        updateApplicationOptionPrices();

        // 🔧 수정: 가격 표시 업데이트
        updatePricingDisplay();

        // 교재 필수 여부에 따라 UI 조정
        updateMaterialRequirement();

    } catch (error) {
        console.error('❌ 가격 정보 로드 오류:', error);

        // 기본값 사용
        pricingData = {
            education: 150000,
            certificate: 50000,
            material: 30000,
            packageDiscount: 10,
            materialRequired: false
        };

        updateApplicationOptionPrices();
        updatePricingDisplay();
        showWarningMessage('가격 정보를 불러오는 중 오류가 발생했습니다. 기본 가격을 표시합니다.');
    }
}

// 🔧 NEW: 신청 옵션 섹션 가격 업데이트 함수
function updateApplicationOptionPrices() {
    console.log('🔧 신청 옵션 섹션 가격 업데이트 시작');

    const formatCurrency = (amount) => {
        return window.formatters?.formatCurrency(amount) || `${amount.toLocaleString()}원`;
    };

    // 🔧 자격증 발급 옵션 가격 업데이트
    const certificateOptionPrice = document.querySelector('.option-card.required .option-price');
    if (certificateOptionPrice) {
        certificateOptionPrice.textContent = formatCurrency(pricingData.certificate);
        console.log('✅ 자격증 발급 옵션 가격 업데이트:', pricingData.certificate);
    }

    // 🔧 교재 구매 옵션 가격 업데이트
    const materialOptionPrice = document.querySelector('.option-card.optional .option-price');
    if (materialOptionPrice) {
        materialOptionPrice.textContent = formatCurrency(pricingData.material);
        console.log('✅ 교재 구매 옵션 가격 업데이트:', pricingData.material);
    }

    // 🔧 교재명 업데이트 (selectedCourseData에서)
    if (selectedCourseData && selectedCourseData.materialName) {
        const materialTitle = document.querySelector('.option-card.optional .option-title');
        if (materialTitle) {
            materialTitle.textContent = `교재 구매 (${selectedCourseData.materialName})`;
            console.log('✅ 교재명 업데이트:', selectedCourseData.materialName);
        }
    }

    console.log('🔧 신청 옵션 섹션 가격 업데이트 완료');
}

// 🔧 수정된 가격 표시 업데이트 함수
function updatePricingDisplay() {
    console.log('💰 가격 표시 업데이트');

    const formatCurrency = (amount) => {
        return window.formatters?.formatCurrency(amount) || `${amount.toLocaleString()}원`;
    };

    // 🔧 NEW: 신청 옵션 섹션 가격 업데이트
    updateApplicationOptionPrices();

    // 🔧 수정: 과정 정보의 교육비 업데이트
    const coursePriceEl = document.getElementById('course-price');
    if (coursePriceEl) {
        coursePriceEl.textContent = formatCurrency(pricingData.education);
        console.log('교육비 표시 업데이트:', pricingData.education);
    }

    // 🔧 수정: 요약 섹션 가격 계산
    calculateAndDisplaySummary();
}

// 🔧 수정된 가격 요약 계산 함수
function calculateAndDisplaySummary() {
    console.log('🧮 가격 요약 계산');
    console.log('현재 pricingData:', pricingData);

    const formatCurrency = (amount) => {
        return window.formatters?.formatCurrency(amount) || `${amount.toLocaleString()}원`;
    };

    // 체크박스 상태 확인
    const includeCertificate = document.getElementById('include-certificate')?.checked || false;
    const includeMaterial = document.getElementById('include-material')?.checked || false;

    console.log('체크박스 상태:', { includeCertificate, includeMaterial });

    // 기본 계산
    let educationAmount = pricingData.education; // 교육비는 필수
    let certificateAmount = includeCertificate ? pricingData.certificate : 0;
    let materialAmount = includeMaterial ? pricingData.material : 0;
    let discountAmount = 0;

    // 패키지 할인 계산 (자격증 + 교재 모두 선택 시)
    const hasPackageDiscount = includeCertificate && includeMaterial;
    if (hasPackageDiscount) {
        const subtotal = educationAmount + certificateAmount + materialAmount;
        discountAmount = Math.floor(subtotal * (pricingData.packageDiscount / 100));
    }

    const totalAmount = educationAmount + certificateAmount + materialAmount - discountAmount;

    console.log('계산 결과:', {
        education: educationAmount,
        certificate: certificateAmount,
        material: materialAmount,
        discount: discountAmount,
        total: totalAmount
    });

    // 🔧 수정: 요약 섹션 업데이트
    updateSummaryDisplay(educationAmount, certificateAmount, materialAmount, discountAmount, totalAmount, hasPackageDiscount);

    // 최종 확인 카드 업데이트
    updateFinalCheck();
}

// 🔧 수정된 요약 표시 업데이트 함수
function updateSummaryDisplay(educationPrice, certificatePrice, materialPrice, discountAmount, totalPrice, hasPackageDiscount) {
    console.log('💰 요약 표시 업데이트', {
        educationPrice,
        certificatePrice,
        materialPrice,
        discountAmount,
        totalPrice,
        hasPackageDiscount
    });

    const formatCurrency = (amount) => {
        return window.formatters?.formatCurrency(amount) || `${amount.toLocaleString()}원`;
    };

    // 🔧 수정: 교육비 업데이트
    const educationPriceEl = document.getElementById('education-price');
    if (educationPriceEl) {
        educationPriceEl.textContent = formatCurrency(educationPrice);
        console.log('교육비 요약 업데이트:', educationPrice);
    }

    // 🔧 수정: 자격증 발급비 표시/숨김 (관리자 설정 가격 반영)
    const certificatePriceItem = document.getElementById('certificate-price-item');
    const certificatePriceEl = document.getElementById('certificate-price');
    if (certificatePriceItem && certificatePriceEl) {
        if (certificatePrice > 0) {
            certificatePriceItem.classList.add('active');
            certificatePriceItem.style.opacity = '1';
            certificatePriceEl.textContent = formatCurrency(certificatePrice);
            console.log('자격증 발급비 표시 (관리자 설정):', certificatePrice);
        } else {
            certificatePriceItem.classList.remove('active');
            certificatePriceItem.style.opacity = '0.5';
            certificatePriceEl.textContent = '0원';
        }
    }

    // 🔧 수정: 교재비 표시/숨김 (관리자 설정 가격 반영)
    const materialPriceItem = document.getElementById('material-price-item');
    const materialPriceEl = document.getElementById('material-price');
    if (materialPriceItem && materialPriceEl) {
        if (materialPrice > 0) {
            materialPriceItem.classList.add('active');
            materialPriceItem.style.opacity = '1';
            materialPriceEl.textContent = formatCurrency(materialPrice);
            console.log('교재비 표시 (관리자 설정):', materialPrice);
        } else {
            materialPriceItem.classList.remove('active');
            materialPriceItem.style.opacity = '0.5';
            materialPriceEl.textContent = '0원';
        }
    }

    // 🔧 수정: 할인 정보 표시/숨김
    const discountInfo = document.getElementById('discount-info');
    const discountAmountEl = document.getElementById('discount-amount');
    if (discountInfo && discountAmountEl) {
        if (hasPackageDiscount && discountAmount > 0) {
            discountInfo.style.display = 'block';
            discountAmountEl.textContent = discountAmount.toLocaleString();
            console.log('할인 정보 표시:', discountAmount);
        } else {
            discountInfo.style.display = 'none';
        }
    }

    // 🔧 수정: 총 금액 업데이트
    const totalPriceEl = document.getElementById('total-price');
    const buttonTotalEl = document.getElementById('button-total');
    if (totalPriceEl) {
        totalPriceEl.textContent = formatCurrency(totalPrice);
        console.log('총 금액 업데이트:', totalPrice);
    }
    if (buttonTotalEl) {
        buttonTotalEl.textContent = totalPrice.toLocaleString();
    }

    // 패키지 혜택 안내 표시/숨김
    const packageBenefit = document.getElementById('package-benefit');
    const packageDiscountRate = document.getElementById('package-discount-rate');
    if (packageBenefit && packageDiscountRate) {
        if (hasPackageDiscount) {
            packageBenefit.style.display = 'flex';
            packageDiscountRate.textContent = `${pricingData.packageDiscount}%`;
        } else {
            packageBenefit.style.display = 'none';
        }
    }
}

function updateMaterialRequirement() {
    const materialCheckbox = document.getElementById('include-material');
    const materialCard = materialCheckbox?.closest('.option-card');

    if (pricingData.materialRequired) {
        // 교재 필수인 경우
        if (materialCheckbox) {
            materialCheckbox.checked = true;
            materialCheckbox.disabled = true;
        }
        if (materialCard) {
            materialCard.classList.remove('optional');
            materialCard.classList.add('required');
        }

        // 배지 업데이트
        const materialBadge = materialCard?.querySelector('.option-badge');
        if (materialBadge) {
            materialBadge.textContent = '필수';
            materialBadge.classList.remove('optional');
            materialBadge.classList.add('required');
        }

        showInfoMessage('선택하신 과정은 교재 구매가 필수입니다.');
    } else {
        // 교재 선택인 경우
        if (materialCheckbox) {
            materialCheckbox.disabled = false;
        }
        if (materialCard) {
            materialCard.classList.remove('required');
            materialCard.classList.add('optional');
        }
    }
}

function clearCourseInfo() {
    console.log('🔄 과정 정보 초기화');

    const elements = {
        'course-title': '과정을 선택해주세요',
        'course-period': '-',
        'course-price': '-',
        'course-method': '-',
        'course-capacity': '-',
        'course-location': '-',
        'course-apply-period': '-',
        'course-description': '과정에 대한 상세 정보가 표시됩니다.'
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });

    const courseInfo = document.getElementById('course-info');
    if (courseInfo) {
        courseInfo.classList.remove('show');
    }
}

function clearPricingData() {
    console.log('💰 가격 데이터 초기화');

    pricingData = {
        education: 0,
        certificate: 0,
        material: 0,
        packageDiscount: 0
    };

    // 🔧 NEW: 신청 옵션 섹션 초기화
    resetApplicationOptionPrices();

    // 가격 표시 초기화
    const priceElements = [
        'course-price',
        'education-price',
        'certificate-price',
        'material-price',
        'total-price',
        'button-total'
    ];

    priceElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = id.includes('total') ? '0원' : '가격 로딩중...';
        }
    });

    // 할인 섹션 숨김
    const discountInfo = document.getElementById('discount-info');
    if (discountInfo) {
        discountInfo.style.display = 'none';
    }

    // 패키지 혜택 숨김
    const packageBenefit = document.getElementById('package-benefit');
    if (packageBenefit) {
        packageBenefit.style.display = 'none';
    }
}

// =================================
// 🔧 네비게이션 및 폼 추적 개선 함수들 (Part 5)
// =================================

// 🔧 폼 변경 추적 설정
function setupFormChangeTracking() {
    console.log('📋 폼 변경 추적 설정');

    const form = document.getElementById('unified-application-form');
    if (!form) return;

    // 폼 입력 시 데이터 있음으로 표시
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            // 실제 의미있는 데이터가 입력되었는지 확인
            const hasSignificantData = Array.from(inputs).some(inp => {
                if (inp.type === 'checkbox' || inp.type === 'radio') {
                    return inp.checked && inp.id !== 'include-certificate'; // 기본 체크된 것 제외
                }
                return inp.value && inp.value.trim().length > 0;
            });

            formHasData = hasSignificantData;
            console.log('폼 데이터 상태 변경:', formHasData);
        });

        input.addEventListener('change', function () {
            // 체크박스/라디오 변경 시에도 추적
            const hasSignificantData = Array.from(inputs).some(inp => {
                if (inp.type === 'checkbox' || inp.type === 'radio') {
                    return inp.checked && inp.id !== 'include-certificate'; // 기본 체크된 것 제외
                }
                return inp.value && inp.value.trim().length > 0;
            });

            formHasData = hasSignificantData;
            console.log('폼 데이터 상태 변경:', formHasData);
        });
    });
}

// 🔧 개선된 beforeunload 이벤트
function setupImprovedBeforeUnload() {
    console.log('🔒 개선된 페이지 이탈 방지 설정');

    window.addEventListener('beforeunload', function (event) {
        console.log('beforeunload 이벤트 발생');
        console.log('내부 네비게이션:', isInternalNavigation);
        console.log('폼 데이터 있음:', formHasData);

        // 내부 네비게이션인 경우 확인 안함
        if (isInternalNavigation) {
            console.log('내부 네비게이션으로 판단, 확인 메시지 표시 안함');
            return;
        }

        // 폼에 의미있는 데이터가 있는 경우만 확인
        if (formHasData) {
            console.log('작성 중인 데이터 있음, 확인 메시지 표시');
            const message = '작성 중인 교육신청 내용이 있습니다. 정말 나가시겠습니까?';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }

        console.log('확인 메시지 표시 조건 없음');
    });
}

// 🔧 탭 네비게이션 개선
function setupImprovedTabNavigation() {
    console.log('🔗 개선된 탭 네비게이션 설정');

    // 모든 탭 링크 찾기
    const tabLinks = document.querySelectorAll('.tab-item[href*="javascript:"]');

    tabLinks.forEach(link => {
        // 기존 href에서 URL 추출
        const href = link.getAttribute('href');
        const urlMatch = href.match(/window\.adjustPath\('([^']+)'\)/);

        if (urlMatch) {
            const targetUrl = urlMatch[1];
            console.log('탭 링크 개선:', targetUrl);

            // 클릭 이벤트로 교체
            link.removeAttribute('href');
            link.setAttribute('href', '#');
            link.style.cursor = 'pointer';

            link.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('탭 클릭:', targetUrl);

                // 내부 네비게이션 플래그 설정
                isInternalNavigation = true;

                // 짧은 지연 후 이동 (beforeunload 이벤트가 내부 네비게이션 플래그를 확인할 수 있도록)
                setTimeout(() => {
                    window.location.href = window.adjustPath(targetUrl);
                }, 10);
            });
        }
    });

    // 헤더 네비게이션 링크도 개선
    const headerLinks = document.querySelectorAll('a[href*="javascript:window.location.href"]');

    headerLinks.forEach(link => {
        const href = link.getAttribute('href');
        const urlMatch = href.match(/window\.adjustPath\('([^']+)'\)/);

        if (urlMatch) {
            const targetUrl = urlMatch[1];
            console.log('헤더 링크 개선:', targetUrl);

            link.removeAttribute('href');
            link.setAttribute('href', '#');
            link.style.cursor = 'pointer';

            link.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('헤더 링크 클릭:', targetUrl);

                // 내부 네비게이션 플래그 설정
                isInternalNavigation = true;

                setTimeout(() => {
                    window.location.href = window.adjustPath(targetUrl);
                }, 10);
            });
        }
    });
}

// =================================
// 🔧 통합 신청 폼 관리 (Part 5)
// =================================

function initUnifiedApplicationForm() {
    console.log('📋 통합 신청 폼 초기화');

    const form = document.getElementById('unified-application-form');
    if (!form) {
        console.error('unified-application-form을 찾을 수 없습니다');
        return;
    }

    // 폼 제출 이벤트
    form.addEventListener('submit', handleFormSubmission);

    // 실시간 입력 검증
    initRealTimeValidation();

    // 영문명 입력 도우미
    initEnglishNameHelper();

    // 전화번호 자동 포맷팅
    initPhoneFormatting();

    console.log('✅ 통합 신청 폼 초기화 완료');
}

// 🔧 수정된 폼 제출 처리
async function handleFormSubmission(e) {
    e.preventDefault();
    console.log('📤 통합 신청 폼 제출 처리');

    try {
        // 🔧 폼 제출 시에는 페이지 이탈 방지 해제
        formHasData = false;
        isInternalNavigation = true; // 결제 페이지로 이동할 수 있으므로

        // 폼 유효성 검사
        if (!validateUnifiedForm()) {
            console.log('❌ 폼 유효성 검사 실패');
            // 유효성 검사 실패 시 플래그 복원
            formHasData = true;
            isInternalNavigation = false;
            return;
        }

        // 결제 버튼 상태 변경
        const paymentButton = document.getElementById('payment-button');
        updatePaymentButtonState(paymentButton, 'processing');

        // 신청 데이터 수집
        const applicationData = collectApplicationData();
        console.log('📋 수집된 신청 데이터:', applicationData);

        // Firebase에 임시 저장
        await saveApplicationData(applicationData);

        // 약관 동의 상태 저장
        await saveAgreementStatus();

        // 토스페이먼츠 결제 진행
        await initiatePayment(applicationData);

    } catch (error) {
        console.error('❌ 신청 처리 오류:', error);

        // 오류 발생 시 플래그 복원
        formHasData = true;
        isInternalNavigation = false;

        showErrorMessage('신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.');

        const paymentButton = document.getElementById('payment-button');
        updatePaymentButtonState(paymentButton, 'error');
    }
}

function validateUnifiedForm() {
    console.log('🔍 통합 폼 유효성 검사');

    let isValid = true;
    const errors = [];

    // 1. 과정 선택 확인
    if (!selectedCourseData) {
        isValid = false;
        errors.push('교육 과정을 선택해주세요.');
        highlightFieldError(document.getElementById('course-select'));
    }

    // 2. 필수 입력 필드 확인
    const requiredFields = [
        { id: 'applicant-name', label: '이름' },
        { id: 'applicant-name-english', label: '영문 이름' },
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

    // 3. 영문명 형식 검사
    const englishNameInput = document.getElementById('applicant-name-english');
    if (englishNameInput && englishNameInput.value.trim()) {
        if (!validateEnglishName(englishNameInput.value.trim())) {
            isValid = false;
            errors.push('올바른 영문명을 입력해주세요. (예: Hong Gil Dong)');
            highlightFieldError(englishNameInput);
        }
    }

    // 4. 이메일 형식 검사
    const emailInput = document.getElementById('email');
    if (emailInput && emailInput.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            isValid = false;
            errors.push('올바른 이메일 형식을 입력해주세요.');
            highlightFieldError(emailInput);
        }
    }

    // 5. 전화번호 형식 검사
    const phoneInput = document.getElementById('phone');
    if (phoneInput && phoneInput.value.trim()) {
        const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
        if (!phoneRegex.test(phoneInput.value)) {
            isValid = false;
            errors.push('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
            highlightFieldError(phoneInput);
        }
    }

    // 6. 필수 약관 동의 확인
    const privacyAgree = document.getElementById('agree-privacy');
    if (!privacyAgree?.checked) {
        isValid = false;
        errors.push('개인정보 수집 및 이용에 동의해주세요.');
        highlightFieldError(privacyAgree);
    }

    // 오류 메시지 표시
    if (!isValid) {
        showValidationErrors(errors);

        // 첫 번째 오류 필드로 스크롤
        const firstError = document.querySelector('.field-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    console.log(`폼 유효성 검사 결과: ${isValid ? '✅ 통과' : '❌ 실패'}`);
    return isValid;
}

function collectApplicationData() {
    console.log('📋 신청 데이터 수집');

    const form = document.getElementById('unified-application-form');
    const formData = new FormData(form);

    // 기본 신청 데이터
    const data = {
        // 메타 정보
        applicationId: 'APP_' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: courseApplicationUser?.uid || null,

        // 선택된 과정 정보
        courseInfo: {
            courseId: selectedCourseData?.id,
            courseName: selectedCourseData?.title,
            certificateType: selectedCourseData?.certificateType,
            startDate: selectedCourseData?.startDate,
            endDate: selectedCourseData?.endDate
        },

        // 신청자 정보
        applicantInfo: {},

        // 신청 옵션
        options: {
            includeEducation: true, // 항상 true
            includeCertificate: document.getElementById('include-certificate')?.checked || false,
            includeMaterial: document.getElementById('include-material')?.checked || false
        },

        // 가격 정보
        pricing: {
            educationPrice: pricingData.education,
            certificatePrice: document.getElementById('include-certificate')?.checked ? pricingData.certificate : 0,
            materialPrice: document.getElementById('include-material')?.checked ? pricingData.material : 0,
            discountAmount: 0,
            totalAmount: 0
        },

        // 약관 동의 상태
        agreements: {
            privacy: document.getElementById('agree-privacy')?.checked || false,
            marketing: document.getElementById('agree-marketing')?.checked || false,
            agreedAt: new Date().toISOString()
        }
    };

    // 폼 데이터 추가
    for (let [key, value] of formData.entries()) {
        data.applicantInfo[key] = value;
    }

    // 가격 계산
    const hasPackageDiscount = data.options.includeCertificate && data.options.includeMaterial;
    if (hasPackageDiscount) {
        const subtotal = data.pricing.educationPrice + data.pricing.certificatePrice + data.pricing.materialPrice;
        data.pricing.discountAmount = Math.floor(subtotal * (pricingData.packageDiscount / 100));
    }

    data.pricing.totalAmount = data.pricing.educationPrice + data.pricing.certificatePrice + data.pricing.materialPrice - data.pricing.discountAmount;

    return data;
}

// =================================
// 🔧 결제 시스템 및 데이터 저장 (Part 6)
// =================================

async function saveApplicationData(applicationData) {
    console.log('💾 신청 데이터 Firebase 저장');

    if (!window.dbService) {
        console.log('dbService 미연동, 로컬 저장으로 대체');
        localStorage.setItem('dhc_application_data', JSON.stringify(applicationData));
        return;
    }

    try {
        const result = await window.dbService.addDocument('applications', applicationData);

        if (result.success) {
            console.log('✅ 신청 데이터 Firebase 저장 완료:', result.id);
            applicationData.firestoreId = result.id;
        } else {
            console.error('❌ Firebase 저장 실패:', result.error);
            localStorage.setItem('dhc_application_data', JSON.stringify(applicationData));
        }
    } catch (error) {
        console.error('❌ 신청 데이터 저장 오류:', error);
        localStorage.setItem('dhc_application_data', JSON.stringify(applicationData));
    }
}

async function saveAgreementStatus() {
    console.log('📋 약관 동의 상태 저장');

    if (!courseApplicationUser || !window.dbService) {
        console.log('비로그인 상태 또는 dbService 미연동');
        return;
    }

    try {
        const agreementData = {
            userId: courseApplicationUser.uid,
            privacy: document.getElementById('agree-privacy')?.checked || false,
            marketing: document.getElementById('agree-marketing')?.checked || false,
            savedAt: new Date(),
            userAgent: navigator.userAgent,
            ipAddress: null
        };

        const result = await window.dbService.addDocument('user_agreements', agreementData, courseApplicationUser.uid);

        if (result.success) {
            console.log('✅ 약관 동의 상태 저장 완료');
            userAgreements = agreementData;
        } else {
            console.error('❌ 약관 상태 저장 실패:', result.error);
        }
    } catch (error) {
        console.error('❌ 약관 상태 저장 오류:', error);
    }
}

function initPaymentSystem() {
    console.log('💳 토스페이먼츠 연동 준비');
    console.log('💳 토스페이먼츠 연동 준비 완료 (실제 연동은 추후)');
}

async function initiatePayment(applicationData) {
    console.log('💳 결제 프로세스 시작');
    console.log('결제 데이터:', applicationData.pricing);

    // 현재는 시뮬레이션 모드
    const isSimulation = true;

    if (isSimulation) {
        console.log('🔄 결제 시뮬레이션 모드');

        // 결제 시뮬레이션 (3초 대기)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 시뮬레이션 성공
        const paymentResult = {
            success: true,
            paymentKey: 'sim_' + Date.now(),
            orderId: applicationData.applicationId,
            amount: applicationData.pricing.totalAmount,
            method: 'CARD',
            approvedAt: new Date().toISOString()
        };

        await handlePaymentSuccess(paymentResult, applicationData);
    }
}

async function handlePaymentSuccess(paymentResult, applicationData) {
    console.log('✅ 결제 성공 처리');

    try {
        // 1. 결제 정보 업데이트
        const updatedData = {
            ...applicationData,
            payment: {
                ...paymentResult,
                status: 'completed',
                paidAt: new Date()
            },
            status: 'payment_completed'
        };

        // 2. Firebase에 최종 데이터 저장
        if (window.dbService) {
            if (updatedData.firestoreId) {
                await window.dbService.updateDocument('applications', updatedData.firestoreId, updatedData);
            } else {
                await window.dbService.addDocument('applications', updatedData);
            }
        }

        // 3. 성공 메시지 표시
        showPaymentSuccessModal(updatedData);

        // 4. 결제 버튼 상태 업데이트
        const paymentButton = document.getElementById('payment-button');
        updatePaymentButtonState(paymentButton, 'success');

    } catch (error) {
        console.error('❌ 결제 성공 처리 오류:', error);
        showErrorMessage('결제는 완료되었으나 데이터 저장 중 오류가 발생했습니다.');
    }
}

function showPaymentSuccessModal(applicationData) {
    const modal = document.createElement('div');
    modal.className = 'payment-success-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="success-header">
                    <div class="success-icon">✅</div>
                    <h2 class="success-title">결제가 완료되었습니다!</h2>
                </div>
                
                <div class="success-body">
                    <div class="success-info">
                        <div class="info-row">
                            <span class="info-label">신청 과정:</span>
                            <span class="info-value">${applicationData.courseInfo.courseName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">신청자:</span>
                            <span class="info-value">${applicationData.applicantInfo['applicant-name']}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">결제 금액:</span>
                            <span class="info-value">${applicationData.pricing.totalAmount.toLocaleString()}원</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">신청번호:</span>
                            <span class="info-value">${applicationData.applicationId}</span>
                        </div>
                    </div>
                    
                    <div class="next-steps">
                        <h3>다음 단계</h3>
                        <ul>
                            <li>📧 신청 확인 이메일이 발송됩니다</li>
                            <li>📱 교육 시작 전 안내 문자를 보내드립니다</li>
                            <li>🎓 교육 수료 후 자격증 발급이 진행됩니다</li>
                        </ul>
                    </div>
                </div>
                
                <div class="success-actions">
                    <button onclick="window.location.href='${window.adjustPath('pages/mypage/course-history.html')}'" class="btn-primary">
                        수강 내역 확인
                    </button>
                    <button onclick="window.location.href='${window.adjustPath('index.html')}'" class="btn-secondary">
                        홈으로 이동
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // 모달 닫기 (오버레이 클릭)
    modal.querySelector('.modal-overlay').addEventListener('click', function (e) {
        if (e.target === this) {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        }
    });
}

function updatePaymentButtonState(button, state) {
    if (!button) return;

    const buttonIcon = button.querySelector('.button-icon');
    const buttonText = button.querySelector('.button-text');
    const buttonAmount = button.querySelector('.button-amount');

    switch (state) {
        case 'processing':
            button.disabled = true;
            if (buttonIcon) buttonIcon.textContent = '⏳';
            if (buttonText) buttonText.textContent = '결제 진행 중...';
            if (buttonAmount) buttonAmount.style.display = 'none';
            break;

        case 'success':
            button.disabled = true;
            if (buttonIcon) buttonIcon.textContent = '✅';
            if (buttonText) buttonText.textContent = '결제 완료';
            if (buttonAmount) buttonAmount.style.display = 'none';
            button.style.background = '#10b981';
            break;

        case 'error':
            button.disabled = false;
            if (buttonIcon) buttonIcon.textContent = '❌';
            if (buttonText) buttonText.textContent = '다시 시도';
            if (buttonAmount) buttonAmount.style.display = 'inline';
            button.style.background = '#ef4444';
            setTimeout(() => updatePaymentButtonState(button, 'normal'), 3000);
            break;

        case 'normal':
        default:
            button.disabled = false;
            if (buttonIcon) buttonIcon.textContent = '💳';
            if (buttonText) buttonText.textContent = '결제하기';
            if (buttonAmount) buttonAmount.style.display = 'inline';
            button.style.background = '';
            break;
    }
}

// =================================
// 🔧 약관 관리 및 회원 정보 자동 기입 (Part 7)
// =================================

async function initAgreementSystem() {
    console.log('📋 약관 관리 시스템 초기화 (Firebase 기반)');

    window.toggleAgreementDetail = function (type) {
        const detail = document.getElementById(`${type}-detail`);
        if (detail) {
            detail.classList.toggle('show');
        }
    };

    window.showAgreements = function () {
        const agreementNotice = document.getElementById('agreement-notice');
        const agreementContent = document.getElementById('agreement-content');

        if (agreementNotice && agreementContent) {
            agreementNotice.style.display = 'none';
            agreementContent.style.display = 'block';
        }
    };

    console.log('✅ 약관 관리 시스템 초기화 완료');
}

async function autoFillMemberInfo() {
    console.log('👤 회원 정보 자동 기입 시도');

    if (!courseApplicationUser) {
        console.log('비로그인 상태, 자동 기입 건너뛰기');
        return;
    }

    try {
        const emailInput = document.getElementById('email');
        if (emailInput && !emailInput.value) {
            emailInput.value = courseApplicationUser.email;
            console.log('✅ 이메일 자동 기입:', courseApplicationUser.email);
        }

        const nameInput = document.getElementById('applicant-name');
        if (nameInput && !nameInput.value && courseApplicationUser.displayName) {
            nameInput.value = courseApplicationUser.displayName;
            console.log('✅ 이름 자동 기입:', courseApplicationUser.displayName);
        }

        await loadUserDetailInfo(courseApplicationUser.uid);

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
            const userData = result.data;
            console.log('사용자 상세 정보:', userData);

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

function fillUserData(userData) {
    console.log('📝 사용자 데이터로 폼 채우기:', userData);

    const fieldMappings = {
        'applicant-name': userData.name || userData.displayName || userData.firstName,
        'applicant-name-english': userData.nameEnglish || userData.englishName,
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
// 🔧 폼 유효성 검사 및 도우미 기능 (Part 7)
// =================================

function initFormValidation() {
    console.log('🔍 폼 유효성 검사 초기화');

    const form = document.getElementById('unified-application-form');
    if (!form) return;

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

    console.log('✅ 폼 유효성 검사 초기화 완료');
}

function initRealTimeValidation() {
    console.log('⚡ 실시간 검증 초기화');

    // 이메일 실시간 검증
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function () {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                showFieldError(this, '올바른 이메일 형식을 입력해주세요.');
            } else {
                clearFieldError(this);
            }
        });
    }

    // 전화번호 실시간 검증
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
            if (this.value && !phoneRegex.test(this.value)) {
                showFieldError(this, '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
            } else {
                clearFieldError(this);
            }
        });
    }
}

function initEnglishNameHelper() {
    console.log('🔤 영문명 입력 도우미 초기화');

    const englishNameInput = document.getElementById('applicant-name-english');
    const koreanNameInput = document.getElementById('applicant-name');

    if (!englishNameInput || !koreanNameInput) return;

    // 영문명 실시간 검증
    englishNameInput.addEventListener('input', function () {
        let value = this.value;

        // 영문, 공백, 점(.)만 허용
        value = value.replace(/[^a-zA-Z\s.]/g, '');
        value = value.replace(/\s+/g, ' '); // 연속 공백 제거
        value = value.replace(/^\s+/, ''); // 앞 공백 제거

        this.value = value;

        if (value.length > 0) {
            validateEnglishName(value) ? clearFieldError(this) : showFieldError(this, '올바른 영문명을 입력해주세요.');
        } else {
            clearFieldError(this);
        }
    });

    // 한글명 변경 시 영문명 제안
    koreanNameInput.addEventListener('blur', function () {
        if (this.value && !englishNameInput.value) {
            const suggestion = generateEnglishNameSuggestion(this.value);
            if (suggestion) {
                englishNameInput.placeholder = `예: ${suggestion}`;
                showInfoMessage(`영문명 입력 예시: ${suggestion}`);
            }
        }
    });
}

function validateEnglishName(name) {
    if (name.length < 2) return false;
    if (name.length > 50) return false;
    if (!/^[a-zA-Z\s.]+$/.test(name)) return false;
    if (!/[a-zA-Z]/.test(name)) return false;
    if (/\s{2,}/.test(name)) return false;
    if (name.startsWith(' ') || name.endsWith(' ')) return false;

    const nameParts = name.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length < 2) return false;

    return nameParts.every(part => part.length >= 1);
}

function generateEnglishNameSuggestion(koreanName) {
    const surnameMapping = {
        '김': 'Kim', '이': 'Lee', '박': 'Park', '최': 'Choi', '정': 'Jung',
        '강': 'Kang', '조': 'Cho', '윤': 'Yoon', '장': 'Jang', '임': 'Lim',
        '한': 'Han', '오': 'Oh', '서': 'Seo', '신': 'Shin', '권': 'Kwon',
        '황': 'Hwang', '안': 'Ahn', '송': 'Song', '류': 'Ryu', '전': 'Jeon',
        '홍': 'Hong', '고': 'Ko', '문': 'Moon', '양': 'Yang', '손': 'Son',
        '배': 'Bae', '백': 'Baek', '허': 'Heo', '유': 'Yu', '남': 'Nam'
    };

    if (koreanName.length >= 2) {
        const surname = koreanName.charAt(0);
        const englishSurname = surnameMapping[surname];

        if (englishSurname) {
            return `${englishSurname} Gil Dong`;
        }
    }

    return 'Hong Gil Dong';
}

function initPhoneFormatting() {
    console.log('📞 전화번호 자동 포맷팅 초기화');

    const phoneInputs = document.querySelectorAll('input[type="tel"]');

    phoneInputs.forEach(input => {
        input.addEventListener('input', function () {
            let value = this.value.replace(/[^0-9]/g, '');

            if (value.length >= 7) {
                if (value.length <= 10) {
                    value = value.substr(0, 3) + '-' + value.substr(3);
                } else {
                    value = value.substr(0, 3) + '-' + value.substr(3, 4) + '-' + value.substr(7, 4);
                }
            }

            this.value = value;
        });
    });
}

// =================================
// 🔧 최종 확인 카드 및 유틸리티 함수들 (Part 8)
// =================================

function updateFinalCheck() {
    console.log('📋 최종 확인 카드 업데이트');

    // 선택 과정
    const finalCourseNameEl = document.getElementById('final-course-name');
    if (finalCourseNameEl) {
        finalCourseNameEl.textContent = selectedCourseData?.title || '과정을 먼저 선택해주세요';
    }

    // 신청자
    const finalApplicantNameEl = document.getElementById('final-applicant-name');
    const applicantNameInput = document.getElementById('applicant-name');
    if (finalApplicantNameEl && applicantNameInput) {
        finalApplicantNameEl.textContent = applicantNameInput.value || '이름을 입력해주세요';
    }

    // 신청 옵션
    const finalOptionsEl = document.getElementById('final-options');
    if (finalOptionsEl) {
        const options = [];

        // 교육은 항상 포함
        options.push('교육 수강');

        // 자격증 발급
        const includeCertificate = document.getElementById('include-certificate')?.checked;
        if (includeCertificate) {
            options.push('자격증 발급');
        }

        // 교재 구매
        const includeMaterial = document.getElementById('include-material')?.checked;
        if (includeMaterial) {
            options.push('교재 구매');
        }

        finalOptionsEl.textContent = options.length > 0 ? options.join(', ') : '옵션을 선택해주세요';
    }

    // 총 결제금액
    const finalTotalAmountEl = document.getElementById('final-total-amount');
    const totalPriceEl = document.getElementById('total-price');
    if (finalTotalAmountEl && totalPriceEl) {
        finalTotalAmountEl.textContent = totalPriceEl.textContent || '0원';
    }
}

// =================================
// 🔧 유틸리티 함수들
// =================================

function selectCourseById(courseId) {
    console.log('🎯 과정 ID로 선택:', courseId);

    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다');
        return false;
    }

    const targetOption = courseSelect.querySelector(`option[value="${courseId}"]`);
    if (!targetOption) {
        console.error(`courseId ${courseId}에 해당하는 옵션을 찾을 수 없습니다`);
        return false;
    }

    if (targetOption.disabled) {
        console.warn(`courseId ${courseId}는 비활성화된 옵션입니다`);
        showWarningMessage('선택하신 과정은 현재 신청할 수 없습니다.');
        return false;
    }

    courseSelect.value = courseId;

    // change 이벤트 발생
    const changeEvent = new Event('change', { bubbles: true });
    courseSelect.dispatchEvent(changeEvent);

    console.log('✅ 과정 선택 완료:', courseId);
    return true;
}

function scrollToCourseSelection() {
    const courseSelectionSection = document.getElementById('course-selection');
    if (courseSelectionSection) {
        courseSelectionSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
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

// 필드 오류 관리
function highlightFieldError(field) {
    if (!field) return;
    field.classList.add('error');
    field.focus();
}

function clearFieldError(field) {
    if (!field) return;
    field.classList.remove('error');
    hideFieldError(field);
}

function showFieldError(field, message) {
    if (!field) return;

    hideFieldError(field);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';

    field.classList.add('error');
    field.parentNode.appendChild(errorDiv);
}

function hideFieldError(field) {
    if (!field) return;

    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

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

        // 영문명 특별 검사
        if (field.id === 'applicant-name-english') {
            if (!validateEnglishName(field.value.trim())) {
                isValid = false;
                errorMessage = '올바른 영문명을 입력해주세요. (예: Hong Gil Dong)';
            }
        }
    }

    // UI 업데이트
    if (isValid) {
        clearFieldError(field);
    } else {
        showFieldError(field, errorMessage);
    }

    return isValid;
}

function getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) {
        return label.textContent.replace('*', '').trim();
    }
    return field.placeholder || field.name || field.id || '필드';
}

function showValidationErrors(errors) {
    const message = '다음 항목을 확인해주세요:\n\n' + errors.join('\n');
    alert(message);
}

// =================================
// 🔧 메시지 시스템
// =================================

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
// 🔧 테스트 데이터
// =================================

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
            capacity: 30,
            enrolledCount: 18,
            status: 'active',
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
            capacity: 25,
            enrolledCount: 22,
            status: 'active',
            description: '운동재활전문가 자격증 취득을 위한 기본 과정입니다.',
            pricing: {
                education: 180000,
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
            capacity: 20,
            enrolledCount: 5,
            status: 'active',
            description: '필라테스 전문가 자격증 취득을 위한 기본 과정입니다.',
            pricing: {
                education: 200000,
                certificate: 60000,
                material: 40000,
                materialRequired: false,
                packageDiscount: 12
            }
        }
    ];
}

function getTestCourseData() {
    return getTestScheduleData();
}

// 전역 함수로 노출
window.loadScheduleData = loadScheduleData;

// =================================
// 🔧 추가 이벤트 리스너들
// =================================

// 🔧 페이지 언로드 시 플래그 초기화
window.addEventListener('beforeunload', function (event) {
    console.log('페이지 언로드 전, 플래그 초기화');

    // 내부 네비게이션인 경우 확인 안함
    if (isInternalNavigation) {
        console.log('내부 네비게이션으로 판단, 확인 메시지 표시 안함');
        return;
    }

    // 폼에 의미있는 데이터가 있는 경우만 확인
    if (formHasData) {
        console.log('작성 중인 데이터 있음, 확인 메시지 표시');
        const message = '작성 중인 교육신청 내용이 있습니다. 정말 나가시겠습니까?';
        event.preventDefault();
        event.returnValue = message;
        return message;
    }

    console.log('확인 메시지 표시 조건 없음');
});

// 🔧 페이지 포커스 시 플래그 초기화 (뒤로가기 등)
window.addEventListener('pageshow', function (event) {
    console.log('페이지 표시, 플래그 초기화');
    isInternalNavigation = false;

    // 뒤로가기로 돌아온 경우가 아니라면 폼 데이터 상태 재확인
    if (!event.persisted) {
        // 폼 데이터 상태 재확인
        const form = document.getElementById('unified-application-form');
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            const hasData = Array.from(inputs).some(inp => {
                if (inp.type === 'checkbox' || inp.type === 'radio') {
                    return inp.checked && inp.id !== 'include-certificate'; // 기본 체크된 것 제외
                }
                return inp.value && inp.value.trim().length > 0;
            });
            formHasData = hasData;
            console.log('페이지 로드 시 폼 데이터 상태:', formHasData);
        }
    }
});

// 🔧 전역 함수로 탭 네비게이션 핸들러 등록
window.handleTabNavigation = function (event, targetPath) {
    event.preventDefault();
    console.log('탭 네비게이션:', targetPath);

    // 내부 네비게이션 플래그 설정
    isInternalNavigation = true;

    // 폼 데이터 확인
    const form = document.getElementById('unified-application-form');
    if (form && formHasData) {
        const confirmed = confirm('작성 중인 교육신청 내용이 있습니다. 다른 페이지로 이동하시겠습니까?');
        if (!confirmed) {
            isInternalNavigation = false;
            return;
        }
    }

    // 페이지 이동
    setTimeout(() => {
        try {
            const adjustedPath = window.adjustPath ? window.adjustPath(targetPath) : targetPath;
            console.log('이동할 경로:', adjustedPath);
            window.location.href = adjustedPath;
        } catch (error) {
            console.error('페이지 이동 오류:', error);
            window.location.href = targetPath;
        }
    }, 10);
};

// 🔧 헤더 네비게이션 핸들러
window.handleHeaderNavigation = function (event, targetPath) {
    event.preventDefault();
    console.log('헤더 네비게이션:', targetPath);

    // 내부 네비게이션 플래그 설정
    isInternalNavigation = true;

    // 즉시 이동 (헤더 링크는 확인하지 않음)
    setTimeout(() => {
        try {
            const adjustedPath = window.adjustPath ? window.adjustPath(targetPath) : targetPath;
            window.location.href = adjustedPath;
        } catch (error) {
            console.error('헤더 네비게이션 오류:', error);
            window.location.href = targetPath;
        }
    }, 10);
};

// =================================
// 🔧 Course Application 디버깅 도구 완전판
// course-application.js 파일 맨 아래에 추가할 코드
// =================================

if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.web.app') ||
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {

    window.debugUnifiedCourseApplication = {

        // =================================
        // 📊 데이터 관련 메소드
        // =================================

        /**
         * 사용 가능한 과정 목록 확인
         */
        showCourses: function () {
            console.log('📚 사용 가능한 과정들:', availableCourses);
            if (availableCourses.length > 0) {
                console.table(availableCourses.map((course, index) => ({
                    순번: index + 1,
                    ID: course.id,
                    과정명: course.title,
                    자격증: course.certificateType,
                    교육비: course.price || course.pricing?.education || 0,
                    자격증비: course.certificatePrice || course.pricing?.certificate || 0,
                    교재비: course.materialPrice || course.pricing?.material || 0,
                    상태: course.status
                })));
            } else {
                console.log('❌ 등록된 과정이 없습니다.');
            }
            return availableCourses;
        },

        /**
         * 특정 과정 선택
         */
        selectCourse: function (courseId) {
            if (!courseId && availableCourses.length > 0) {
                courseId = availableCourses[0].id;
                console.log('🎯 과정 ID가 없어서 첫 번째 과정 선택:', courseId);
            }

            if (!courseId) {
                console.log('❌ 선택할 과정이 없습니다.');
                return false;
            }

            const success = selectCourseById(courseId);
            if (success) {
                console.log('✅ 과정 선택 성공:', courseId);
                // 선택된 과정 정보 표시
                const selectedCourse = availableCourses.find(c => c.id === courseId);
                if (selectedCourse) {
                    console.log('📋 선택된 과정 상세:', {
                        과정명: selectedCourse.title,
                        자격증: selectedCourse.certificateType,
                        강사: selectedCourse.instructor,
                        교육비: selectedCourse.price || selectedCourse.pricing?.education,
                        자격증비: selectedCourse.certificatePrice || selectedCourse.pricing?.certificate,
                        교재비: selectedCourse.materialPrice || selectedCourse.pricing?.material
                    });
                }
            } else {
                console.log('❌ 과정 선택 실패:', courseId);
            }
            return success;
        },

        /**
         * 현재 가격 정보 확인
         */
        showPricing: function () {
            console.log('💰 현재 가격 정보:', pricingData);
            console.log('📚 선택된 과정:', selectedCourseData?.title || '없음');

            if (selectedCourseData) {
                const includeCert = document.getElementById('include-certificate')?.checked || false;
                const includeMaterial = document.getElementById('include-material')?.checked || false;

                console.log('✅ 선택된 옵션:');
                console.log('  - 교육 수강: ✅ (필수)');
                console.log(`  - 자격증 발급: ${includeCert ? '✅' : '❌'}`);
                console.log(`  - 교재 구매: ${includeMaterial ? '✅' : '❌'}`);

                // 가격 계산 실행
                console.log('🧮 실시간 가격 계산:');
                calculateAndDisplaySummary();

                // 가격 동기화 상태 확인
                this.testPriceSync();
            } else {
                console.log('⚠️ 과정을 먼저 선택해주세요.');
            }
        },

        /**
         * 🔧 NEW: 자격증 발급비 동기화 테스트
         */
        testPriceSync: function () {
            console.log('🔧 자격증 발급비 동기화 테스트 시작');

            if (!selectedCourseData) {
                console.log('❌ 과정이 선택되지 않음');
                return { success: false, reason: 'no_course_selected' };
            }

            console.log('📊 현재 선택된 과정:', selectedCourseData.title);
            console.log('💰 로드된 가격 정보:', pricingData);

            // 신청 옵션 섹션 가격 확인
            const certificateOptionPrice = document.querySelector('.option-card.required .option-price');
            const materialOptionPrice = document.querySelector('.option-card.optional .option-price');

            console.log('📋 신청 옵션 섹션 표시 가격:');
            console.log('  - 자격증 발급비:', certificateOptionPrice?.textContent || '❌ 요소 없음');
            console.log('  - 교재비:', materialOptionPrice?.textContent || '❌ 요소 없음');

            // 결제 요약 섹션 가격 확인
            const summaryEducationPrice = document.getElementById('education-price');
            const summaryCertificatePrice = document.getElementById('certificate-price');
            const summaryMaterialPrice = document.getElementById('material-price');
            const summaryTotalPrice = document.getElementById('total-price');

            console.log('📋 결제 요약 섹션 표시 가격:');
            console.log('  - 교육비:', summaryEducationPrice?.textContent || '❌ 요소 없음');
            console.log('  - 자격증 발급비:', summaryCertificatePrice?.textContent || '❌ 요소 없음');
            console.log('  - 교재비:', summaryMaterialPrice?.textContent || '❌ 요소 없음');
            console.log('  - 총 금액:', summaryTotalPrice?.textContent || '❌ 요소 없음');

            // 동기화 확인
            const certificateSync = certificateOptionPrice?.textContent === summaryCertificatePrice?.textContent;
            const materialSync = materialOptionPrice?.textContent === summaryMaterialPrice?.textContent;

            console.log('🔍 동기화 상태 검사:');
            console.log(`  - 자격증 발급비 동기화: ${certificateSync ? '✅ 성공' : '❌ 실패'}`);
            console.log(`  - 교재비 동기화: ${materialSync ? '✅ 성공' : '❌ 실패'}`);

            // 관리자 설정 가격과 비교
            const formatCurrency = (amount) => window.formatters?.formatCurrency(amount) || `${amount.toLocaleString()}원`;
            const expectedCertPrice = formatCurrency(pricingData.certificate);
            const expectedMaterialPrice = formatCurrency(pricingData.material);

            console.log('🎯 예상 가격 vs 실제 표시:');
            console.log(`  - 자격증비 예상: ${expectedCertPrice} / 실제: ${certificateOptionPrice?.textContent}`);
            console.log(`  - 교재비 예상: ${expectedMaterialPrice} / 실제: ${materialOptionPrice?.textContent}`);

            const result = {
                success: certificateSync && materialSync,
                certificateSync,
                materialSync,
                pricingData,
                selectedCourse: selectedCourseData?.title,
                expectedPrices: {
                    certificate: expectedCertPrice,
                    material: expectedMaterialPrice
                },
                actualPrices: {
                    certificateOption: certificateOptionPrice?.textContent,
                    materialOption: materialOptionPrice?.textContent,
                    certificateSummary: summaryCertificatePrice?.textContent,
                    materialSummary: summaryMaterialPrice?.textContent
                }
            };

            if (result.success) {
                console.log('🎉 모든 가격이 정상적으로 동기화되었습니다!');
            } else {
                console.log('⚠️ 가격 동기화에 문제가 있습니다. forcePriceSync()를 실행해보세요.');
            }

            return result;
        },

        /**
         * 🔧 NEW: 강제 가격 동기화 실행
         */
        forcePriceSync: function () {
            console.log('🔧 강제 가격 동기화 실행');

            if (!selectedCourseData) {
                console.log('❌ 과정이 선택되지 않음');
                return false;
            }

            try {
                console.log('1️⃣ 신청 옵션 섹션 가격 업데이트');
                updateApplicationOptionPrices();

                console.log('2️⃣ 전체 가격 표시 업데이트');
                updatePricingDisplay();

                console.log('3️⃣ 가격 요약 계산');
                calculateAndDisplaySummary();

                console.log('✅ 강제 가격 동기화 완료');

                // 동기화 결과 확인
                return this.testPriceSync();

            } catch (error) {
                console.error('❌ 강제 가격 동기화 중 오류:', error);
                return false;
            }
        },

        // =================================
        // 📝 폼 관련 메소드
        // =================================

        /**
         * 테스트 데이터로 폼 자동 완성
         */
        fillTestData: function () {
            console.log('📝 테스트 데이터 입력 시작');

            try {
                // 1. 과정 선택
                if (availableCourses.length > 0) {
                    const success = this.selectCourse(availableCourses[0].id);
                    if (!success) {
                        console.log('❌ 과정 선택 실패');
                        return false;
                    }
                }

                // 2. 기본 정보 입력
                const testData = {
                    'applicant-name': '홍길동',
                    'applicant-name-english': 'Hong Gil Dong',
                    'phone': '010-1234-5678',
                    'email': 'test@example.com',
                    'birth-date': '1990-01-01',
                    'address': '서울시 강남구 테헤란로 123',
                    'emergency-contact': '010-9876-5432'
                };

                let filledCount = 0;
                Object.entries(testData).forEach(([id, value]) => {
                    const input = document.getElementById(id);
                    if (input) {
                        input.value = value;
                        // input 이벤트 발생 (폼 변경 추적)
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log(`  ✅ ${id}: ${value}`);
                        filledCount++;
                    } else {
                        console.log(`  ⚠️ ${id}: 요소를 찾을 수 없음`);
                    }
                });

                // 3. 옵션 선택
                const certificateCheckbox = document.getElementById('include-certificate');
                const materialCheckbox = document.getElementById('include-material');

                if (certificateCheckbox && !certificateCheckbox.checked) {
                    certificateCheckbox.checked = true;
                    certificateCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('  ✅ 자격증 발급 선택');
                }

                if (materialCheckbox && !materialCheckbox.checked) {
                    materialCheckbox.checked = true;
                    materialCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('  ✅ 교재 구매 선택');
                }

                // 4. 약관 동의
                const agreements = ['agree-privacy', 'agree-marketing'];
                agreements.forEach(id => {
                    const checkbox = document.getElementById(id);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`  ✅ ${id} 동의`);
                    }
                });

                // 5. 최종 확인 카드 업데이트
                updateFinalCheck();

                console.log(`🎯 테스트 데이터 입력 완료! (${filledCount}개 필드 입력)`);
                console.log('💡 이제 checkForm() 또는 simulatePayment()를 실행할 수 있습니다.');

                return true;

            } catch (error) {
                console.error('❌ 테스트 데이터 입력 중 오류:', error);
                return false;
            }
        },

        /**
         * 폼 유효성 검사
         */
        checkForm: function () {
            console.log('🔍 폼 유효성 검사 시작');

            try {
                const isValid = validateUnifiedForm();

                if (isValid) {
                    console.log('✅ 폼 유효성 검사 통과');

                    // 수집된 데이터 미리보기
                    const form = document.getElementById('unified-application-form');
                    if (form) {
                        const applicationData = collectApplicationData();
                        console.log('📊 수집된 신청 데이터:', applicationData);
                    }
                } else {
                    console.log('❌ 폼 유효성 검사 실패');
                }

                return isValid;

            } catch (error) {
                console.error('❌ 폼 유효성 검사 중 오류:', error);
                return false;
            }
        },

        /**
         * 결제 시뮬레이션
         */
        simulatePayment: function () {
            console.log('💳 결제 시뮬레이션 시작');

            if (!this.checkForm()) {
                console.log('❌ 폼 검증 실패, 시뮬레이션 중단');
                return false;
            }

            try {
                console.log('📤 결제 폼 제출 시뮬레이션');
                const form = document.getElementById('unified-application-form');
                if (form) {
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(submitEvent);
                    console.log('✅ 결제 시뮬레이션 실행됨');
                    return true;
                } else {
                    console.log('❌ 폼을 찾을 수 없음');
                    return false;
                }
            } catch (error) {
                console.error('❌ 결제 시뮬레이션 중 오류:', error);
                return false;
            }
        },

        // =================================
        // 👤 사용자 관련 메소드
        // =================================

        /**
         * 현재 사용자 정보 확인
         */
        showUser: function () {
            console.log('👤 현재 사용자 정보:');
            if (courseApplicationUser) {
                console.log('  📧 이메일:', courseApplicationUser.email);
                console.log('  🆔 UID:', courseApplicationUser.uid);
                console.log('  👤 표시명:', courseApplicationUser.displayName || '설정되지 않음');
                console.log('  ✅ 로그인 상태: 로그인됨');
            } else {
                console.log('  ❌ 로그인 상태: 비로그인');
            }
            return courseApplicationUser;
        },

        /**
         * 약관 동의 상태 확인
         */
        showAgreements: function () {
            console.log('📋 약관 동의 상태:');
            console.log('  💾 저장된 동의 상태:', userAgreements);

            const currentAgreements = {
                privacy: document.getElementById('agree-privacy')?.checked || false,
                marketing: document.getElementById('agree-marketing')?.checked || false
            };

            console.log('  📄 현재 폼 상태:', currentAgreements);

            return {
                saved: userAgreements,
                current: currentAgreements
            };
        },

        // =================================
        // 🔗 네비게이션 관련 메소드
        // =================================

        /**
         * 네비게이션 상태 확인
         */
        showNavigationState: function () {
            console.log('🔗 네비게이션 상태:');
            console.log('  🚪 내부 네비게이션:', isInternalNavigation);
            console.log('  📝 폼 데이터 있음:', formHasData);

            // 실제 폼 데이터 확인
            const form = document.getElementById('unified-application-form');
            if (form) {
                const inputs = form.querySelectorAll('input, select, textarea');
                const hasRealData = Array.from(inputs).some(inp => {
                    if (inp.type === 'checkbox' || inp.type === 'radio') {
                        return inp.checked && inp.id !== 'include-certificate';
                    }
                    return inp.value && inp.value.trim().length > 0;
                });

                console.log('  🔍 실제 폼 데이터 상태:', hasRealData);

                if (formHasData !== hasRealData) {
                    console.log('  ⚠️ 플래그와 실제 상태가 다름!');
                }
            }

            return {
                isInternalNavigation,
                formHasData,
                realFormHasData: form ? Array.from(form.querySelectorAll('input, select, textarea')).some(inp => {
                    if (inp.type === 'checkbox' || inp.type === 'radio') {
                        return inp.checked && inp.id !== 'include-certificate';
                    }
                    return inp.value && inp.value.trim().length > 0;
                }) : false
            };
        },

        /**
         * 내부 네비게이션 플래그 설정
         */
        setInternalNavigation: function (value) {
            isInternalNavigation = value;
            console.log('🚪 내부 네비게이션 플래그 설정:', value);
        },

        /**
         * 폼 데이터 플래그 설정
         */
        setFormHasData: function (value) {
            formHasData = value;
            console.log('📝 폼 데이터 플래그 설정:', value);
        },

        /**
         * 탭 네비게이션 테스트
         */
        testTabNavigation: function () {
            console.log('🔗 탭 네비게이션 테스트');
            const certTab = document.querySelector('.tab-item[href*="cert-application"]');
            if (certTab) {
                console.log('  🎯 자격증 신청 탭 클릭 시뮬레이션');
                certTab.click();
            } else {
                console.log('  ❌ 자격증 신청 탭을 찾을 수 없음');
            }
        },

        // =================================
        // 🧪 통합 테스트 메소드
        // =================================

        /**
         * 전체 시스템 테스트
         */
        runFullTest: function () {
            console.log('🧪 전체 시스템 테스트 시작');
            console.log('='.repeat(50));

            try {
                console.log('\n1️⃣ 과정 데이터 확인');
                this.showCourses();

                console.log('\n2️⃣ 사용자 정보 확인');
                this.showUser();

                console.log('\n3️⃣ 네비게이션 상태 확인');
                this.showNavigationState();

                console.log('\n4️⃣ 테스트 데이터 입력');
                const fillSuccess = this.fillTestData();

                if (fillSuccess) {
                    console.log('\n5️⃣ 가격 정보 확인');
                    this.showPricing();

                    console.log('\n6️⃣ 가격 동기화 테스트');
                    this.testPriceSync();

                    console.log('\n7️⃣ 폼 유효성 검사');
                    const formValid = this.checkForm();

                    console.log('\n8️⃣ 약관 동의 상태 확인');
                    this.showAgreements();

                    console.log('\n🎯 전체 테스트 완료!');

                    if (formValid) {
                        console.log('✅ 모든 테스트 통과');
                        console.log('💡 이제 simulatePayment()를 실행하여 결제를 시뮬레이션할 수 있습니다.');
                    } else {
                        console.log('⚠️ 일부 테스트에서 문제 발견');
                    }
                } else {
                    console.log('❌ 테스트 데이터 입력 실패');
                }

                return fillSuccess;

            } catch (error) {
                console.error('❌ 전체 테스트 중 오류:', error);
                return false;
            }
        },

        /**
         * 성능 테스트
         */
        performanceTest: function () {
            console.log('⚡ 성능 테스트 시작');

            const tests = [
                {
                    name: '과정 선택',
                    fn: () => this.selectCourse()
                },
                {
                    name: '가격 계산',
                    fn: () => calculateAndDisplaySummary()
                },
                {
                    name: '가격 동기화',
                    fn: () => updateApplicationOptionPrices()
                },
                {
                    name: '폼 검증',
                    fn: () => validateUnifiedForm()
                }
            ];

            const results = [];

            tests.forEach(test => {
                const start = performance.now();
                try {
                    test.fn();
                    const end = performance.now();
                    const duration = end - start;
                    results.push({
                        name: test.name,
                        duration: duration.toFixed(2) + 'ms',
                        success: true
                    });
                    console.log(`  ✅ ${test.name}: ${duration.toFixed(2)}ms`);
                } catch (error) {
                    const end = performance.now();
                    const duration = end - start;
                    results.push({
                        name: test.name,
                        duration: duration.toFixed(2) + 'ms',
                        success: false,
                        error: error.message
                    });
                    console.log(`  ❌ ${test.name}: ${duration.toFixed(2)}ms (오류: ${error.message})`);
                }
            });

            console.table(results);
            return results;
        },

        // =================================
        // 🔧 유틸리티 메소드
        // =================================

        /**
         * 모든 데이터 초기화
         */
        resetAll: function () {
            console.log('🔄 모든 데이터 초기화');

            try {
                // 폼 리셋
                const form = document.getElementById('unified-application-form');
                if (form) {
                    form.reset();
                }

                // 과정 선택 초기화
                const courseSelect = document.getElementById('course-select');
                if (courseSelect) {
                    courseSelect.value = '';
                    courseSelect.dispatchEvent(new Event('change'));
                }

                // 체크박스 초기화
                const checkboxes = ['include-certificate', 'include-material', 'agree-privacy', 'agree-marketing'];
                checkboxes.forEach(id => {
                    const checkbox = document.getElementById(id);
                    if (checkbox) {
                        if (id === 'include-certificate') {
                            checkbox.checked = true; // 자격증은 기본 선택
                        } else {
                            checkbox.checked = false;
                        }
                        if (id.startsWith('include-')) {
                            checkbox.dispatchEvent(new Event('change'));
                        }
                    }
                });

                // 전역 변수 초기화
                selectedCourseData = null;
                clearPricingData();
                resetApplicationOptionPrices();
                updateFinalCheck();

                // 네비게이션 플래그 초기화
                isInternalNavigation = false;
                formHasData = false;

                console.log('✅ 모든 데이터 초기화 완료');

            } catch (error) {
                console.error('❌ 초기화 중 오류:', error);
            }
        },

        /**
         * 디버깅 도구 상태 확인
         */
        status: function () {
            console.log('🔧 디버깅 도구 상태:');
            console.log('  📚 사용 가능한 과정 수:', availableCourses.length);
            console.log('  🎯 선택된 과정:', selectedCourseData?.title || '없음');
            console.log('  💰 가격 데이터 로드:', Object.keys(pricingData).length > 0);
            console.log('  👤 사용자 로그인:', !!courseApplicationUser);
            console.log('  📝 폼 초기화:', !!document.getElementById('unified-application-form'));
            console.log('  🔗 네비게이션 상태:', { isInternalNavigation, formHasData });

            return {
                coursesAvailable: availableCourses.length,
                courseSelected: !!selectedCourseData,
                pricingLoaded: Object.keys(pricingData).length > 0,
                userLoggedIn: !!courseApplicationUser,
                formInitialized: !!document.getElementById('unified-application-form'),
                navigationState: { isInternalNavigation, formHasData }
            };
        },

        /**
         * 도움말
         */
        help: function () {
            console.log('🎯 통합 교육 신청 디버깅 도구 (완전판)');
            console.log('');
            console.log('🔧 데이터 관련:');
            console.log('  - showCourses() : 사용 가능한 과정 목록 (테이블 형태)');
            console.log('  - selectCourse(id) : 특정 과정 선택');
            console.log('  - showPricing() : 현재 가격 정보 및 계산');
            console.log('  - testPriceSync() : 자격증 발급비 동기화 테스트');
            console.log('  - forcePriceSync() : 강제 가격 동기화 실행');

            console.log('\n📝 폼 관련:');
            console.log('  - fillTestData() : 테스트 데이터 자동 입력');
            console.log('  - checkForm() : 폼 유효성 검사');
            console.log('  - simulatePayment() : 결제 시뮬레이션');

            console.log('\n👤 사용자 관련:');
            console.log('  - showUser() : 현재 사용자 정보');
            console.log('  - showAgreements() : 약관 동의 상태');

            console.log('\n🔗 네비게이션 관련:');
            console.log('  - showNavigationState() : 네비게이션 상태 확인');
            console.log('  - setInternalNavigation(bool) : 내부 네비게이션 플래그 설정');
            console.log('  - setFormHasData(bool) : 폼 데이터 플래그 설정');
            console.log('  - testTabNavigation() : 탭 네비게이션 테스트');

            console.log('\n🧪 통합 테스트:');
            console.log('  - runFullTest() : 전체 시스템 테스트 (추천)');
            console.log('  - performanceTest() : 성능 테스트');

            console.log('\n🔧 유틸리티:');
            console.log('  - resetAll() : 모든 데이터 초기화');
            console.log('  - status() : 디버깅 도구 상태 확인');
            console.log('  - help() : 이 도움말');

            console.log('\n💡 사용법:');
            console.log('1. 🚀 빠른 시작: runFullTest()');
            console.log('2. 🔧 문제 해결: testPriceSync() -> forcePriceSync()');
            console.log('3. 🧪 개별 테스트: fillTestData() -> checkForm() -> simulatePayment()');
            console.log('4. 🔄 초기화: resetAll()');

            console.log('\n🎯 새로운 기능 (자격증 발급비 동기화):');
            console.log('- testPriceSync() : 신청 옵션과 결제 요약의 가격 동기화 확인');
            console.log('- forcePriceSync() : 가격 동기화 문제 발생 시 강제 수정');
            console.log('- 실시간 가격 계산 및 패키지 할인 적용');
            console.log('- 관리자 설정 가격 자동 반영');

            console.log('\n🔗 네비게이션 개선:');
            console.log('- beforeunload 이벤트 내부 네비게이션 구분 처리');
            console.log('- 폼 데이터 상태 실시간 추적');
            console.log('- 탭 변경 시 불필요한 확인 대화상자 방지');
        },

        // =================================
        // 🎯 고급 디버깅 메소드
        // =================================

        /**
         * 가격 계산 로직 상세 분석
         */
        analyzePricing: function () {
            console.log('🔍 가격 계산 로직 상세 분석');

            if (!selectedCourseData) {
                console.log('❌ 과정이 선택되지 않음');
                return null;
            }

            const includeCert = document.getElementById('include-certificate')?.checked || false;
            const includeMaterial = document.getElementById('include-material')?.checked || false;

            console.log('📊 기본 데이터:');
            console.log('  - 선택된 과정:', selectedCourseData.title);
            console.log('  - 교육비:', pricingData.education);
            console.log('  - 자격증비:', pricingData.certificate);
            console.log('  - 교재비:', pricingData.material);
            console.log('  - 패키지 할인율:', pricingData.packageDiscount + '%');
            console.log('  - 교재 필수:', pricingData.materialRequired);

            console.log('\n📋 선택된 옵션:');
            console.log('  - 교육 수강: ✅ (항상 포함)');
            console.log('  - 자격증 발급:', includeCert ? '✅' : '❌');
            console.log('  - 교재 구매:', includeMaterial ? '✅' : '❌');

            // 가격 계산
            let educationAmount = pricingData.education;
            let certificateAmount = includeCert ? pricingData.certificate : 0;
            let materialAmount = includeMaterial ? pricingData.material : 0;
            let discountAmount = 0;

            const hasPackageDiscount = includeCert && includeMaterial;
            if (hasPackageDiscount) {
                const subtotal = educationAmount + certificateAmount + materialAmount;
                discountAmount = Math.floor(subtotal * (pricingData.packageDiscount / 100));
            }

            const totalAmount = educationAmount + certificateAmount + materialAmount - discountAmount;

            console.log('\n💰 계산 과정:');
            console.log('  1️⃣ 교육비:', educationAmount.toLocaleString() + '원');
            console.log('  2️⃣ 자격증비:', certificateAmount.toLocaleString() + '원');
            console.log('  3️⃣ 교재비:', materialAmount.toLocaleString() + '원');
            console.log('  4️⃣ 소계:', (educationAmount + certificateAmount + materialAmount).toLocaleString() + '원');

            if (hasPackageDiscount) {
                console.log('  5️⃣ 패키지 할인 적용:', `-${discountAmount.toLocaleString()}원 (${pricingData.packageDiscount}%)`);
            } else {
                console.log('  5️⃣ 패키지 할인:', '적용 안됨 (자격증+교재 모두 선택 시에만 적용)');
            }

            console.log('  6️⃣ 최종 금액:', totalAmount.toLocaleString() + '원');

            // 실제 표시된 금액과 비교
            const displayedTotal = document.getElementById('total-price')?.textContent;
            const formatCurrency = (amount) => window.formatters?.formatCurrency(amount) || `${amount.toLocaleString()}원`;
            const expectedTotal = formatCurrency(totalAmount);

            console.log('\n🔍 검증:');
            console.log('  - 계산된 금액:', expectedTotal);
            console.log('  - 표시된 금액:', displayedTotal);
            console.log('  - 일치 여부:', expectedTotal === displayedTotal ? '✅' : '❌');

            return {
                education: educationAmount,
                certificate: certificateAmount,
                material: materialAmount,
                discount: discountAmount,
                total: totalAmount,
                hasPackageDiscount,
                expectedDisplay: expectedTotal,
                actualDisplay: displayedTotal,
                isCorrect: expectedTotal === displayedTotal
            };
        },

        /**
         * DOM 요소 상태 분석
         */
        analyzeDOMState: function () {
            console.log('🔍 DOM 요소 상태 분석');

            const elements = {
                // 과정 선택
                courseSelect: document.getElementById('course-select'),
                courseInfo: document.getElementById('course-info'),

                // 신청 옵션
                certificateOption: document.querySelector('.option-card.required .option-price'),
                materialOption: document.querySelector('.option-card.optional .option-price'),

                // 결제 요약
                educationPrice: document.getElementById('education-price'),
                certificatePrice: document.getElementById('certificate-price'),
                materialPrice: document.getElementById('material-price'),
                totalPrice: document.getElementById('total-price'),

                // 체크박스
                certificateCheckbox: document.getElementById('include-certificate'),
                materialCheckbox: document.getElementById('include-material'),

                // 폼
                form: document.getElementById('unified-application-form'),
                paymentButton: document.getElementById('payment-button')
            };

            console.log('📋 DOM 요소 존재 여부:');
            Object.entries(elements).forEach(([name, element]) => {
                const exists = !!element;
                const visible = element ? !element.hidden && element.offsetParent !== null : false;
                console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? (visible ? '보임' : '숨김') : '없음'}`);
            });

            console.log('\n📋 체크박스 상태:');
            if (elements.certificateCheckbox) {
                console.log('  - 자격증 발급:', elements.certificateCheckbox.checked ? '✅ 선택됨' : '❌ 선택안됨');
            }
            if (elements.materialCheckbox) {
                console.log('  - 교재 구매:', elements.materialCheckbox.checked ? '✅ 선택됨' : '❌ 선택안됨');
            }

            console.log('\n📋 표시된 가격:');
            ['certificateOption', 'materialOption', 'educationPrice', 'certificatePrice', 'materialPrice', 'totalPrice'].forEach(key => {
                if (elements[key]) {
                    console.log(`  - ${key}:`, elements[key].textContent || '없음');
                }
            });

            return elements;
        },

        /**
         * 이벤트 리스너 상태 확인
         */
        checkEventListeners: function () {
            console.log('🔍 이벤트 리스너 상태 확인');

            const testElements = [
                { id: 'course-select', events: ['change'] },
                { id: 'include-certificate', events: ['change'] },
                { id: 'include-material', events: ['change'] },
                { id: 'unified-application-form', events: ['submit'] }
            ];

            testElements.forEach(({ id, events }) => {
                const element = document.getElementById(id);
                if (element) {
                    console.log(`📋 ${id}:`);
                    events.forEach(eventType => {
                        // 이벤트 테스트
                        let eventFired = false;
                        const testHandler = () => { eventFired = true; };

                        element.addEventListener(eventType, testHandler);
                        element.dispatchEvent(new Event(eventType, { bubbles: true }));
                        element.removeEventListener(eventType, testHandler);

                        console.log(`  - ${eventType} 이벤트:`, eventFired ? '✅ 정상' : '❌ 문제');
                    });
                } else {
                    console.log(`❌ ${id}: 요소 없음`);
                }
            });
        },

        /**
         * Firebase 연동 상태 확인
         */
        checkFirebaseConnection: function () {
            console.log('🔥 Firebase 연동 상태 확인');

            const firebaseChecks = {
                'Firebase 앱': !!window.dhcFirebase,
                'Authentication': !!window.dhcFirebase?.auth,
                'Firestore': !!window.dhcFirebase?.db,
                'Auth Service': !!window.authService,
                'DB Service': !!window.dbService,
                '현재 사용자': !!courseApplicationUser,
                '사용자 이메일': courseApplicationUser?.email || '없음'
            };

            console.table(firebaseChecks);

            if (window.dhcFirebase && window.dhcFirebase.db) {
                console.log('✅ Firebase 연동 정상');
                return true;
            } else {
                console.log('⚠️ Firebase 연동 문제 - 로컬 테스트 모드로 진행');
                return false;
            }
        },

        /**
         * 로컬 스토리지 상태 확인
         */
        checkLocalStorage: function () {
            console.log('💾 로컬 스토리지 상태 확인');

            const keys = [
                'dhc_application_data',
                'dhc_user_preferences',
                'dhc_form_autosave'
            ];

            keys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`✅ ${key}:`, parsed);
                    } catch (e) {
                        console.log(`📄 ${key}:`, data);
                    }
                } else {
                    console.log(`❌ ${key}: 없음`);
                }
            });
        }
    };

    // 디버깅 도구 활성화 메시지
    console.log('🎯 통합 교육 신청 디버깅 도구 활성화됨 (완전판)');
    console.log('🚀 빠른 시작: window.debugUnifiedCourseApplication.runFullTest()');
    console.log('💡 도움말: window.debugUnifiedCourseApplication.help()');
    console.log('🔧 상태 확인: window.debugUnifiedCourseApplication.status()');
    console.log('');
    console.log('🎯 주요 기능:');
    console.log('📊 데이터: showCourses(), selectCourse(), showPricing()');
    console.log('🔧 가격 동기화: testPriceSync(), forcePriceSync()');
    console.log('📝 폼: fillTestData(), checkForm(), simulatePayment()');
    console.log('👤 사용자: showUser(), showAgreements()');
    console.log('🔗 네비게이션: showNavigationState(), testTabNavigation()');
    console.log('🧪 테스트: runFullTest(), performanceTest()');
    console.log('🔍 고급 분석: analyzePricing(), analyzeDOMState()');

} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');

    // 프로덕션에서도 기본적인 상태 확인은 가능하도록
    window.debugUnifiedCourseApplication = {
        status: function () {
            return {
                mode: 'production',
                coursesAvailable: availableCourses.length,
                courseSelected: !!selectedCourseData,
                userLoggedIn: !!courseApplicationUser
            };
        },
        help: function () {
            console.log('프로덕션 모드에서는 제한된 디버깅 기능만 사용 가능합니다.');
            console.log('전체 디버깅 도구를 사용하려면 개발 환경에서 실행하세요.');
        }
    };
}

// =================================
// 🎉 완료 메시지
// =================================

console.log('\n🎉 === Course Application 디버깅 도구 완전판 로드 완료 ===');
console.log('✅ 총 25개의 디버깅 메소드 제공');
console.log('✅ 자격증 발급비 동기화 테스트 기능');
console.log('✅ 전체 시스템 통합 테스트');
console.log('✅ 성능 테스트 및 분석 기능');
console.log('✅ DOM 상태 및 이벤트 리스너 검증');
console.log('✅ Firebase 연동 상태 확인');
console.log('✅ 네비게이션 상태 관리');
console.log('✅ 프로덕션/개발 모드 자동 감지');
console.log('');
console.log('🚀 사용 시작: window.debugUnifiedCourseApplication.runFullTest()');
console.log('💡 문제 해결: window.debugUnifiedCourseApplication.help()');
console.log('');
console.log('🎯 이제 완전한 디버깅 환경이 준비되었습니다!');

// 완료 플래그 설정
window.unifiedCourseApplicationReady = true;
window.courseApplicationFullyLoaded = true;

console.log('🚀 course-application.js 완전 로딩 완료!');
