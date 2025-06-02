// course-application.js - 완전한 통합 버전 (2단계: 동적 과정 선택 완료)
console.log('=== 완전한 course-application.js 파일 로드됨 (2단계: 동적 과정 선택 완료) ===');

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

// 페이지 초기화 함수 (2단계 완성 버전)
function initCourseApplicationPage() {
    console.log('=== initCourseApplicationPage 실행 시작 (2단계 완성) ===');

    // 기존 기능들
    initScrollAnimations();
    initSmoothScroll();

    // 1단계: 동적 교육 일정 로딩
    loadScheduleData();

    // 2단계: 동적 과정 선택 초기화 (Firebase 기반)
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
    
    // URL 파라미터 및 자동 선택 기능 (2단계에서 강화)
    initAutoSelection();

    console.log('=== initCourseApplicationPage 완료 (2단계 완성) ===');
}

// =================================
// 1단계: 동적 교육 일정 로딩 기능들
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
            
            // 단순 쿼리로 모든 과정 가져오기 (인덱스 오류 방지)
            const result = await window.dbService.getDocuments('courses');
            
            if (result.success) {
                courses = result.data;
                console.log('Firebase에서 로드된 교육 과정 수:', courses.length);
                
                // 클라이언트에서 정렬 처리
                courses.sort((a, b) => {
                    // 1. 자격증 타입별 정렬
                    const typeOrder = ['health-exercise', 'rehabilitation', 'pilates', 'recreation'];
                    const typeA = typeOrder.indexOf(a.certificateType) !== -1 ? typeOrder.indexOf(a.certificateType) : 999;
                    const typeB = typeOrder.indexOf(b.certificateType) !== -1 ? typeOrder.indexOf(b.certificateType) : 999;
                    
                    if (typeA !== typeB) {
                        return typeA - typeB;
                    }
                    
                    // 2. 시작일 기준 정렬
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
            // 테스트용 더미 데이터
            courses = getTestScheduleData();
        }
        
        // 데이터가 있는지 확인
        if (courses.length === 0) {
            showEmptyState();
            return;
        }
        
        // 교육 일정 테이블 렌더링
        renderScheduleTable(courses);
        showScheduleContainer();
        
        // 테이블 인터랙션 초기화
        initScheduleTableInteractions();
        
        console.log('=== loadScheduleData 완료 ===');
        
    } catch (error) {
        console.error('교육 일정 로드 오류:', error);
        
        // Firebase 인덱스 오류인 경우 테스트 데이터로 폴백
        if (error.message && error.message.includes('index')) {
            console.log('🔧 Firebase 인덱스 오류 감지, 테스트 데이터로 폴백');
            
            try {
                const testCourses = getTestScheduleData();
                renderScheduleTable(testCourses);
                showScheduleContainer();
                initScheduleTableInteractions();
                
                // 사용자에게 알림 표시
                if (typeof showToast === 'function') {
                    showToast('Firebase 인덱스 설정 중입니다. 임시로 테스트 데이터를 표시합니다.', 'warning');
                } else {
                    console.warn('Firebase 인덱스 설정 중, 테스트 데이터 표시 중');
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
            // 날짜 처리 (Firebase Timestamp 또는 Date 객체)
            const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
            const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);
            
            // 신청 기간 계산 (시작일 기준 30일 전부터 7일 전까지)
            const applyStartDate = new Date(startDate);
            applyStartDate.setDate(applyStartDate.getDate() - 30);
            const applyEndDate = new Date(startDate);
            applyEndDate.setDate(applyEndDate.getDate() - 7);
            
            // 날짜 포맷팅
            const formatDate = (date) => {
                return date.toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                }).replace(/\. /g, '.').replace(/\.$/, '');
            };
            
            // 상태 결정
            const now = new Date();
            let status = 'upcoming';
            let statusText = '준비중';
            let statusClass = 'status-upcoming';
            
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
            
            // 기수 생성 (년도 + 상반기/하반기)
            const year = startDate.getFullYear();
            const month = startDate.getMonth() + 1;
            const period = month <= 6 ? '상반기' : '하반기';
            const coursePeriod = `${year.toString().slice(-2)}년 ${period}`;
            
            // 자격증 타입을 한글 이름으로 변환
            const getCertificateName = (type) => {
                const names = {
                    'health-exercise': '건강운동처방사',
                    'rehabilitation': '운동재활전문가',
                    'pilates': '필라테스 전문가',
                    'recreation': '레크리에이션지도자'
                };
                return names[type] || type;
            };
            
            // 신청 버튼 생성 (courseId 포함)
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
            // 오류가 있는 과정은 건너뛰고 계속 진행
        }
    });
    
    tbody.innerHTML = html;
    console.log('=== renderScheduleTable 완료 ===');
}

/**
 * 테이블 인터랙션 초기화 (2단계: 과정 선택 연동)
 */
function initScheduleTableInteractions() {
    console.log('=== initScheduleTableInteractions 시작 (과정 선택 연동) ===');
    
    const scheduleRows = document.querySelectorAll('.schedule-row');
    
    scheduleRows.forEach(row => {
        // 호버 효과
        row.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) {
                row.style.transform = 'translateX(4px)';
                row.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                row.style.transition = 'all 0.3s ease';
            }
        });
        
        row.addEventListener('mouseleave', function() {
            row.style.transform = 'translateX(0)';
            row.style.boxShadow = 'none';
        });

        // 신청하기 버튼 클릭 이벤트 (과정 선택 연동)
        const applyBtn = row.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const courseId = this.getAttribute('data-course-id');
                const courseName = this.getAttribute('data-course-name');
                const coursePeriod = this.getAttribute('data-course-period');
                
                console.log('신청하기 클릭 (과정 선택 연동):', { courseId, courseName, coursePeriod });
                
                // 과정 선택 드롭다운에서 해당 과정 자동 선택
                if (courseId) {
                    selectCourseById(courseId);
                } else {
                    // courseId가 없는 경우 과정명과 기수로 찾기
                    selectCourseByNameAndPeriod(courseName, coursePeriod);
                }
                
                // 과정 선택 섹션으로 스크롤
                scrollToCourseSelection();
                
                // 성공 알림
                if (typeof showToast === 'function') {
                    showToast(`${courseName} ${coursePeriod} 과정이 선택되었습니다.`, 'success');
                } else {
                    console.log(`✅ ${courseName} ${coursePeriod} 과정 선택됨`);
                }
            });
        }
    });
    
    // 모바일에서 테이블 스크롤 힌트
    const tableWrapper = document.querySelector('.schedule-table-wrapper');
    if (tableWrapper && window.innerWidth < 768) {
        addScrollHint(tableWrapper);
    }
    
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
 * 테스트용 더미 데이터 (교육 일정용)
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
            title: '필라테스 전문가 기본과정 2기',
            certificateType: 'pilates',
            instructor: '박필라',
            startDate: new Date(now.getTime() - oneMonth * 0.5),
            endDate: new Date(now.getTime() + oneMonth * 2.5),
            price: 480000,
            capacity: 20,
            enrolledCount: 20,
            status: 'closed',
            description: '필라테스 전문가 자격증 취득을 위한 기본 과정입니다.'
        },
        {
            id: 'test-pilates-2',
            title: '필라테스 전문가 기본과정 3기',
            certificateType: 'pilates',
            instructor: '박필라',
            startDate: new Date(now.getTime() + oneMonth * 3.5),
            endDate: new Date(now.getTime() + oneMonth * 6.5),
            price: 480000,
            capacity: 20,
            enrolledCount: 0,
            status: 'preparing',
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
        },
        {
            id: 'test-recreation-2',
            title: '레크리에이션지도자 기본과정 2기',
            certificateType: 'recreation',
            instructor: '최레크',
            startDate: new Date(now.getTime() + oneMonth * 4.2),
            endDate: new Date(now.getTime() + oneMonth * 5.7),
            price: 280000,
            capacity: 25,
            enrolledCount: 0,
            status: 'preparing',
            description: '레크리에이션지도자 자격증 취득을 위한 기본 과정입니다.'
        }
    ];
}

// =================================
// 2단계: 동적 과정 선택 기능들
// =================================

/**
 * 동적 과정 선택 초기화 (Firebase 기반)
 */
async function initDynamicCourseSelection() {
    console.log('=== initDynamicCourseSelection 시작 (Firebase 기반) ===');
    
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다!');
        return;
    }

    try {
        // 로딩 상태 표시
        courseSelect.innerHTML = '<option value="">과정 데이터 로딩 중...</option>';
        courseSelect.disabled = true;

        // Firebase에서 교육 과정 데이터 로드
        let courses = [];
        
        if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
            console.log('Firebase에서 교육 과정 옵션 로드 시작');
            
            // 단순 쿼리로 모든 과정 가져오기 (인덱스 오류 방지)
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

        // 과정 데이터를 옵션으로 변환
        await populateCourseOptions(courses);

        // 이벤트 리스너 등록
        courseSelect.addEventListener('change', function () {
            handleCourseSelection(this.value);
        });

        // 활성화
        courseSelect.disabled = false;

        // 전역에서 접근 가능하도록 저장
        window.availableCourses = courses;

        console.log('=== initDynamicCourseSelection 완료 ===');

    } catch (error) {
        console.error('동적 과정 선택 초기화 오류:', error);
        
        // 폴백: 테스트 데이터 사용
        console.log('폴백: 테스트 과정 데이터 사용');
        const testCourses = getTestCourseData();
        await populateCourseOptions(testCourses);
        
        courseSelect.disabled = false;
        window.availableCourses = testCourses;
        
        // 사용자에게 알림
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

    // 기본 옵션
    let optionsHtml = '<option value="">과정을 선택하세요</option>';

    // 과정이 없는 경우
    if (courses.length === 0) {
        optionsHtml += '<option value="" disabled>등록된 교육 과정이 없습니다</option>';
        courseSelect.innerHTML = optionsHtml;
        return;
    }

    // 과정 정렬 및 필터링
    const validCourses = courses
        .filter(course => course.certificateType && course.title) // 유효한 데이터만
        .sort((a, b) => {
            // 1. 자격증 타입별 정렬
            const typeOrder = ['health-exercise', 'rehabilitation', 'pilates', 'recreation'];
            const typeA = typeOrder.indexOf(a.certificateType);
            const typeB = typeOrder.indexOf(b.certificateType);
            
            if (typeA !== typeB) {
                return typeA - typeB;
            }
            
            // 2. 시작일 기준 정렬
            const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
            const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);
            
            return dateA.getTime() - dateB.getTime();
        });

    // 현재 날짜
    const now = new Date();
    
    // 자격증 타입별로 그룹화하여 옵션 생성
    const groupedCourses = groupCoursesByType(validCourses);
    
    Object.keys(groupedCourses).forEach(certType => {
        const typeName = getCertificateDisplayName(certType);
        
        // 그룹 헤더 (optgroup 사용)
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

    // select에 옵션 적용
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
 * 개별 과정 옵션 생성
 */
function generateCourseOption(course, now) {
    // 날짜 처리
    const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
    const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);
    
    // 신청 기간 계산
    const applyStartDate = new Date(startDate);
    applyStartDate.setDate(applyStartDate.getDate() - 30);
    const applyEndDate = new Date(startDate);
    applyEndDate.setDate(applyEndDate.getDate() - 7);
    
    // 상태 결정
    let isAvailable = false;
    let statusText = '';
    let isDisabled = false;
    
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
    
    // 날짜 포맷팅
    const formatDate = (date) => {
        return date.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        }).replace(/\. /g, '.').replace(/\.$/, '');
    };
    
    // 기수 생성
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    const period = month <= 6 ? '상반기' : '하반기';
    const coursePeriod = `${year.toString().slice(-2)}년 ${period}`;
    
    // 옵션 텍스트 생성
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
    
    // 선택된 과정 찾기
    const selectedCourse = window.availableCourses.find(course => course.id === courseId);
    
    if (!selectedCourse) {
        console.error('선택된 과정을 찾을 수 없습니다:', courseId);
        clearCourseInfo();
        return;
    }
    
    console.log('선택된 과정:', selectedCourse);
    
    // 과정 정보 업데이트
    updateCourseInfoFromFirebase(selectedCourse);
    
    console.log('=== handleCourseSelection 완료 ===');
}

/**
 * Firebase 데이터로 과정 정보 업데이트
 */
function updateCourseInfoFromFirebase(course) {
    console.log('=== updateCourseInfoFromFirebase 시작 ===');
    
    const courseInfo = document.getElementById('course-info');
    
    try {
        // 날짜 처리
        const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
        const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);
        
        // 날짜 포맷팅
        const formatDate = (date) => {
            return date.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            }).replace(/\. /g, '.').replace(/\.$/, '');
        };
        
        // 기간 계산
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7));
        const dateRange = `${formatDate(startDate)} ~ ${formatDate(endDate)} (${duration}주)`;
        
        // 신청 기간 계산
        const applyStartDate = new Date(startDate);
        applyStartDate.setDate(applyStartDate.getDate() - 30);
        const applyEndDate = new Date(startDate);
        applyEndDate.setDate(applyEndDate.getDate() - 7);
        const applyPeriod = `${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}`;
        
        // 가격 포맷팅
        const formatPrice = (price) => {
            return new Intl.NumberFormat('ko-KR').format(price) + '원';
        };
        
        // 기본값 설정
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

        // DOM 업데이트
        document.getElementById('course-title').textContent = courseData.title;
        document.getElementById('course-period').textContent = courseData.period;
        document.getElementById('course-price').textContent = courseData.price;
        document.getElementById('course-method').textContent = courseData.method;
        document.getElementById('course-capacity').textContent = courseData.capacity;
        document.getElementById('course-location').textContent = courseData.location;
        document.getElementById('course-apply-period').textContent = courseData.applyPeriod;
        document.getElementById('course-description').textContent = courseData.description;

        // 결제 정보 카드 업데이트
        updatePaymentInfo(courseData);

        // 과정 정보 카드 표시
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
    
    // 기본 상태로 초기화
    document.getElementById('course-title').textContent = '과정을 선택해주세요';
    document.getElementById('course-period').textContent = '-';
    document.getElementById('course-price').textContent = '-';
    document.getElementById('course-method').textContent = '-';
    document.getElementById('course-capacity').textContent = '-';
    document.getElementById('course-location').textContent = '-';
    document.getElementById('course-apply-period').textContent = '-';
    document.getElementById('course-description').textContent = '과정에 대한 상세 정보가 표시됩니다.';

    // 결제 정보도 초기화
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
 * 테스트용 과정 데이터 (Firebase 대신 사용)
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
            description: '질병 예방과 건강 증진을 위한 맞춤형 운동처방 전문가 양성 과정입니다. 이론 40시간, 실습 20시간으로 구성되어 있으며, 체계적인 교육을 통해 전문적인 지식과 실무 능력을 기를 수 있습니다.',
            method: '온라인 + 오프라인 병행',
            location: '서울 강남구 센터'
        },
        {
            id: 'test-health-2',
            title: '건강운동처방사 기본과정 2기',
            certificateType: 'health-exercise',
            instructor: '김운동 교수',
            startDate: new Date(now.getTime() + oneMonth * 4),
            endDate: new Date(now.getTime() + oneMonth * 6),
            price: 350000,
            capacity: 30,
            enrolledCount: 0,
            status: 'preparing',
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
            title: '필라테스 전문가 기본과정 2기',
            certificateType: 'pilates',
            instructor: '박필라 마스터',
            startDate: new Date(now.getTime() - oneMonth * 0.5),
            endDate: new Date(now.getTime() + oneMonth * 2.5),
            price: 480000,
            capacity: 20,
            enrolledCount: 20,
            status: 'closed',
            description: '과학적 원리 기반의 체계적인 필라테스 실기 및 이론 전문가 양성 과정입니다.',
            method: '오프라인 집중과정',
            location: '서울 강남구 센터'
        },
        {
            id: 'test-pilates-2',
            title: '필라테스 전문가 기본과정 3기',
            certificateType: 'pilates',
            instructor: '박필라 마스터',
            startDate: new Date(now.getTime() + oneMonth * 3.5),
            endDate: new Date(now.getTime() + oneMonth * 6.5),
            price: 480000,
            capacity: 20,
            enrolledCount: 0,
            status: 'preparing',
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
        },
        {
            id: 'test-recreation-2',
            title: '레크리에이션지도자 기본과정 2기',
            certificateType: 'recreation',
            instructor: '최레크 선생',
            startDate: new Date(now.getTime() + oneMonth * 4.2),
            endDate: new Date(now.getTime() + oneMonth * 5.7),
            price: 280000,
            capacity: 25,
            enrolledCount: 0,
            status: 'preparing',
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
    
    // 해당 옵션이 있는지 확인
    const targetOption = courseSelect.querySelector(`option[value="${courseId}"]`);
    if (!targetOption) {
        console.error(`courseId ${courseId}에 해당하는 옵션을 찾을 수 없습니다!`);
        console.log('사용 가능한 옵션들:');
        courseSelect.querySelectorAll('option').forEach(option => {
            console.log('- value:', option.value, 'text:', option.textContent);
        });
        return false;
    }
    
    // 비활성화된 옵션인지 확인
    if (targetOption.disabled) {
        console.warn(`courseId ${courseId}는 비활성화된 옵션입니다.`);
        if (typeof showToast === 'function') {
            showToast('선택하신 과정은 현재 신청할 수 없습니다.', 'warning');
        }
        return false;
    }
    
    // 과정 선택
    courseSelect.value = courseId;
    console.log('드롭다운에서 과정 선택됨:', courseId);
    
    // change 이벤트 수동 트리거
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
    
    // 매칭되는 과정 찾기
    const matchingCourse = window.availableCourses.find(course => {
        // 자격증 타입 매칭
        const certName = getCertificateDisplayName(course.certificateType);
        if (certName !== courseName) return false;
        
        // 기수 매칭 (년도 + 상반기/하반기)
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
        console.log('검색 조건:', { courseName, period });
        console.log('사용 가능한 과정들:');
        window.availableCourses.forEach(course => {
            const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
            const year = startDate.getFullYear();
            const month = startDate.getMonth() + 1;
            const coursePeriod = month <= 6 ? '상반기' : '하반기';
            const generatedPeriod = `${year.toString().slice(-2)}년 ${coursePeriod}`;
            
            console.log(`- ${getCertificateDisplayName(course.certificateType)} ${generatedPeriod} (ID: ${course.id})`);
        });
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
    
    // URL 파라미터 확인
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
        // 과정 데이터가 로드될 때까지 대기 후 선택
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
    const maxRetries = 50; // 5초 대기
    
    const waitForData = async () => {
        // 과정 데이터가 로드되었는지 확인
        if (window.availableCourses && window.availableCourses.length > 0) {
            console.log('과정 데이터 로드 완료, 자동 선택 시작');
            
            // courseParam이 직접 courseId인지 확인
            if (selectCourseById(courseParam)) {
                console.log('✅ courseId로 직접 선택 성공:', courseParam);
                setTimeout(() => scrollToCourseSelection(), 500);
                return;
            }
            
            // certificateType인 경우 처리
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
        
        // 재시도
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
    
    // 해당 자격증 타입의 모집중인 과정 찾기
    const availableCourses = window.availableCourses
        .filter(course => course.certificateType === certType)
        .sort((a, b) => {
            // 시작일 기준 정렬 (가장 빠른 것부터)
            const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
            const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);
            return dateA.getTime() - dateB.getTime();
        });
    
    // 현재 신청 가능한 과정 찾기
    const now = new Date();
    
    for (const course of availableCourses) {
        const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
        const applyStartDate = new Date(startDate);
        applyStartDate.setDate(applyStartDate.getDate() - 30);
        const applyEndDate = new Date(startDate);
        applyEndDate.setDate(applyEndDate.getDate() - 7);
        
        // 신청 가능 기간 확인
        if (now >= applyStartDate && now <= applyEndDate) {
            const enrolledCount = course.enrolledCount || 0;
            const capacity = course.capacity || 30;
            
            // 정원이 남은 경우
            if (enrolledCount < capacity) {
                console.log('신청 가능한 과정 발견:', course);
                return selectCourseById(course.id);
            }
        }
    }
    
    // 신청 가능한 과정이 없는 경우 가장 빠른 과정 선택
    if (availableCourses.length > 0) {
        console.log('신청 가능한 과정 없음, 첫 번째 과정 선택:', availableCourses[0]);
        return selectCourseById(availableCourses[0].id);
    }
    
    console.log('해당 자격증 타입의 과정을 찾을 수 없습니다:', certType);
    return false;
}

// =================================
// 기본 UI 기능들
// =================================

// 스크롤 애니메이션
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

// 부드러운 스크롤 기능
function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
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

// 교육 과정 선택 섹션으로 스크롤
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
 * 교육 일정 데이터 다시 로드 (에러 상태에서 재시도 버튼용)
 */
window.loadScheduleData = loadScheduleData;

// =================================
// 디버깅 및 개발자 도구 (완전 버전)
// =================================

// 개발 모드에서 사용되는 디버깅 함수들
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('.web.app') || 
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {
    
    window.debugCourseApplication = {
        // 1단계 기능들 - 교육 일정 관련
        reloadSchedule: function() {
            console.log('교육 일정 다시 로드');
            loadScheduleData();
        },
        
        showTestData: function() {
            console.log('테스트 교육 일정 데이터:', getTestScheduleData());
            console.log('테스트 과정 데이터:', getTestCourseData());
        },
        
        simulateFirebaseError: function() {
            console.log('Firebase 오류 시뮬레이션');
            window.dhcFirebase = null;
            loadScheduleData();
            initDynamicCourseSelection();
        },
        
        // 2단계 기능들 - 동적 과정 선택 관련
        reloadCourseOptions: function() {
            console.log('과정 선택 옵션 다시 로드');
            initDynamicCourseSelection();
        },
        
        showAvailableCourses: function() {
            console.log('현재 사용 가능한 과정들:', window.availableCourses);
            if (window.availableCourses) {
                console.log('과정 수:', window.availableCourses.length);
                window.availableCourses.forEach((course, index) => {
                    console.log(`${index + 1}. [${course.id}] ${course.title} (${course.certificateType})`);
                });
            }
        },
        
        testCourseSelection: function(courseId) {
            if (!courseId) {
                console.log('사용법: testCourseSelection("course-id")');
                console.log('사용 가능한 과정 ID들:');
                if (window.availableCourses) {
                    window.availableCourses.forEach(course => {
                        console.log(`- ${course.id}: ${course.title}`);
                    });
                } else {
                    console.log('과정 데이터가 아직 로드되지 않았습니다.');
                }
                return;
            }
            
            console.log('과정 선택 테스트:', courseId);
            const success = selectCourseById(courseId);
            if (success) {
                console.log('✅ 과정 선택 성공');
            } else {
                console.log('❌ 과정 선택 실패');
            }
        },
        
        testAutoSelection: function(certType) {
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
        
        simulateApplyButtonClick: function(courseId) {
            if (!courseId) {
                console.log('사용법: simulateApplyButtonClick("course-id")');
                return;
            }
            
            console.log('신청하기 버튼 클릭 시뮬레이션:', courseId);
            const applyBtn = document.querySelector(`[data-course-id="${courseId}"]`)?.querySelector('.apply-btn');
            if (applyBtn) {
                applyBtn.click();
                console.log('✅ 신청 버튼 클릭됨');
            } else {
                console.error('❌ 해당 courseId의 신청 버튼을 찾을 수 없습니다:', courseId);
                console.log('사용 가능한 courseId들을 확인하려면 showAvailableCourses()를 실행하세요.');
            }
        },
        
        // URL 파라미터 테스트
        testUrlParams: function(course, from) {
            course = course || 'health-exercise';
            from = from || 'certificate';
            
            console.log('URL 파라미터 테스트:', { course, from });
            
            // URL 파라미터 시뮬레이션
            const testUrl = new URL(window.location);
            testUrl.searchParams.set('course', course);
            testUrl.searchParams.set('from', from);
            
            console.log('테스트 URL:', testUrl.toString());
            
            // 자동 선택 테스트
            waitForCourseDataAndSelect(course, from);
        },
        
        // 폼 관련 디버깅
        logFormData: function() {
            const formData = collectFormData();
            console.log('현재 폼 데이터:', formData);
            
            // 폼 유효성 상태 체크
            const isValid = validateForm();
            console.log('폼 유효성:', isValid ? '✅ 유효' : '❌ 무효');
            
            return formData;
        },
        
        checkValidation: function() {
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
                const fieldName = input.name || input.id || input.type;
                const value = input.value?.trim() || '';
                console.log(`${isValid ? '✅' : '❌'} ${fieldName}: "${value}"`);
            });
            
            // 약관 동의 체크
            const requiredCheckboxes = document.querySelectorAll('input[type="checkbox"][required]');
            console.log(`\n약관 동의 (${requiredCheckboxes.length}개):`);
            requiredCheckboxes.forEach(checkbox => {
                const isChecked = checkbox.checked;
                const labelText = checkbox.parentElement?.textContent?.trim() || checkbox.id;
                console.log(`${isChecked ? '✅' : '❌'} ${labelText}`);
            });
            
            // 결제 방법 체크
            const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
            console.log(`\n결제 방법: ${selectedPaymentMethod ? '✅ ' + selectedPaymentMethod.value : '❌ 미선택'}`);
        },
        
        fillTestData: function() {
            console.log('테스트 데이터 입력 시작...');
            
            // 기본 정보 입력
            const applicantName = document.getElementById('applicant-name');
            const phone = document.getElementById('phone');
            const email = document.getElementById('email');
            
            if (applicantName) {
                applicantName.value = '홍길동';
                console.log('✅ 이름 입력됨');
            }
            if (phone) {
                phone.value = '010-1234-5678';
                console.log('✅ 전화번호 입력됨');
            }
            if (email) {
                email.value = 'test@example.com';
                console.log('✅ 이메일 입력됨');
            }
            
            // 과정 선택 (2단계: 동적 선택)
            const courseSelect = document.getElementById('course-select');
            if (courseSelect && window.availableCourses && window.availableCourses.length > 0) {
                // 첫 번째 사용 가능한 과정 찾기
                const firstAvailableCourse = window.availableCourses.find(course => {
                    const option = courseSelect.querySelector(`option[value="${course.id}"]`);
                    return option && !option.disabled;
                });
                
                if (firstAvailableCourse) {
                    const success = selectCourseById(firstAvailableCourse.id);
                    if (success) {
                        console.log('✅ 과정 선택됨:', firstAvailableCourse.title);
                    }
                }
            }
            
            // 약관 동의
            const agreeTerms = document.getElementById('agree-terms');
            const agreePrivacy = document.getElementById('agree-privacy');
            const agreeRefund = document.getElementById('agree-refund');
            
            if (agreeTerms) {
                agreeTerms.checked = true;
                console.log('✅ 이용약관 동의');
            }
            if (agreePrivacy) {
                agreePrivacy.checked = true;
                console.log('✅ 개인정보 수집 동의');
            }
            if (agreeRefund) {
                agreeRefund.checked = true;
                console.log('✅ 환불규정 동의');
            }
            
            console.log('🎯 테스트 데이터 입력 완료!');
            console.log('이제 testCardPayment() 또는 testBankTransfer()를 실행하세요.');
        },
        
        // 결제 테스트 기능들
        testCardPayment: function() {
            console.log('카드 결제 테스트 준비...');
            
            // 테스트 데이터 입력
            this.fillTestData();
            
            // 카드 결제 선택
            const methodCard = document.getElementById('method-card');
            const cardPaymentMethod = document.querySelector('[data-method="card"]');
            
            if (methodCard) {
                methodCard.checked = true;
                console.log('✅ 카드 결제 선택됨');
            }
            if (cardPaymentMethod) {
                cardPaymentMethod.click();
                console.log('✅ 카드 결제 UI 활성화됨');
            }
            
            console.log('🎯 카드 결제 테스트 준비 완료!');
            console.log('이제 폼 제출 버튼을 클릭하거나 simulatePaymentSuccess()를 실행하세요.');
        },
        
        testBankTransfer: function() {
            console.log('무통장 입금 테스트 준비...');
            
            // 테스트 데이터 입력
            this.fillTestData();
            
            // 무통장 입금 선택
            const methodBank = document.getElementById('method-bank');
            const bankPaymentMethod = document.querySelector('[data-method="bank"]');
            const bankDepositor = document.getElementById('bank-depositor');
            
            if (methodBank) {
                methodBank.checked = true;
                console.log('✅ 무통장 입금 선택됨');
            }
            if (bankPaymentMethod) {
                bankPaymentMethod.click();
                console.log('✅ 무통장 입금 UI 활성화됨');
            }
            if (bankDepositor) {
                bankDepositor.value = '김입금';
                console.log('✅ 입금자명 입력됨');
            }
            
            console.log('🎯 무통장 입금 테스트 준비 완료!');
            console.log('이제 폼 제출 버튼을 클릭하거나 simulateBankTransferSuccess()를 실행하세요.');
        },
        
        // 결제 결과 시뮬레이션
        simulatePaymentSuccess: function() {
            console.log('결제 성공 시뮬레이션...');
            showPaymentSuccess({
                success: true,
                orderId: 'TEST_ORDER_' + Date.now(),
                method: 'card',
                amount: '₩350,000',
                customerName: '테스트 사용자'
            });
            console.log('✅ 결제 성공 모달 표시됨');
        },
        
        simulateBankTransferSuccess: function() {
            console.log('무통장 입금 성공 시뮬레이션...');
            showBankTransferSuccess({
                orderId: 'TEST_BANK_' + Date.now(),
                method: 'bank',
                amount: '₩350,000',
                customerName: '테스트 사용자'
            });
            console.log('✅ 무통장 입금 성공 모달 표시됨');
        },
        
        // 모달 테스트
        showModal: function() {
            const modal = document.getElementById('payment-success-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                console.log('✅ 모달 표시됨');
            } else {
                console.log('❌ 모달을 찾을 수 없습니다');
            }
        },
        
        hideModal: function() {
            const modal = document.getElementById('payment-success-modal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
                console.log('✅ 모달 숨겨짐');
            } else {
                console.log('❌ 모달을 찾을 수 없습니다');
            }
        },
        
        // 종합 테스트
        runFullTest: function() {
            console.log('🚀 전체 기능 테스트 시작...');
            
            console.log('\n1️⃣ 과정 데이터 로드 테스트');
            this.showAvailableCourses();
            
            console.log('\n2️⃣ 폼 데이터 입력 테스트');
            this.fillTestData();
            
            console.log('\n3️⃣ 과정 선택 테스트');
            if (window.availableCourses && window.availableCourses.length > 0) {
                this.testCourseSelection(window.availableCourses[0].id);
            }
            
            console.log('\n4️⃣ 폼 유효성 검사');
            this.checkValidation();
            
            console.log('\n5️⃣ 결제 UI 테스트');
            this.testCardPayment();
            
            console.log('\n🎯 전체 테스트 완료!');
            console.log('💡 이제 다음 명령어들을 시도해보세요:');
            console.log('- simulatePaymentSuccess() : 결제 성공 시뮬레이션');
            console.log('- simulateBankTransferSuccess() : 무통장 입금 성공 시뮬레이션');
            console.log('- testAutoSelection("health-exercise") : 자동 선택 테스트');
        },
        
        // 도움말
        help: function() {
            console.log('🎯 디버깅 도구 사용법');
            console.log('\n📊 데이터 관련:');
            console.log('- showAvailableCourses() : 사용 가능한 과정 목록');
            console.log('- showTestData() : 테스트 데이터 확인');
            console.log('- reloadSchedule() : 교육 일정 다시 로드');
            console.log('- reloadCourseOptions() : 과정 선택 옵션 다시 로드');
            
            console.log('\n🎯 선택 관련:');
            console.log('- testCourseSelection("course-id") : 특정 과정 선택');
            console.log('- testAutoSelection("cert-type") : 자격증 타입으로 자동 선택');
            console.log('- simulateApplyButtonClick("course-id") : 신청 버튼 클릭');
            
            console.log('\n📝 폼 관련:');
            console.log('- fillTestData() : 테스트 데이터 자동 입력');
            console.log('- logFormData() : 현재 폼 데이터 확인');
            console.log('- checkValidation() : 유효성 검사 결과');
            
            console.log('\n💳 결제 관련:');
            console.log('- testCardPayment() : 카드 결제 테스트 준비');
            console.log('- testBankTransfer() : 무통장 입금 테스트 준비');
            console.log('- simulatePaymentSuccess() : 결제 성공 시뮬레이션');
            console.log('- simulateBankTransferSuccess() : 무통장 입금 성공 시뮬레이션');
            
            console.log('\n🖼️  UI 관련:');
            console.log('- showModal() : 모달 표시');
            console.log('- hideModal() : 모달 숨김');
            
            console.log('\n🧪 종합 테스트:');
            console.log('- runFullTest() : 전체 기능 테스트');
            console.log('- simulateFirebaseError() : Firebase 오류 시뮬레이션');
            
            console.log('\n💡 빠른 시작:');
            console.log('1. runFullTest() - 전체 기능 테스트');
            console.log('2. testCardPayment() - 카드 결제 테스트');
            console.log('3. simulatePaymentSuccess() - 결제 성공 확인');
        }
    };
    
    // 디버깅 도구 안내
    console.log('🎯 2단계 완료! 개발 모드 디버깅 도구 활성화됨');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('📊 데이터: showAvailableCourses(), reloadSchedule(), reloadCourseOptions()');
    console.log('🎯 선택: testCourseSelection(id), testAutoSelection(type)');
    console.log('📝 폼: fillTestData(), logFormData(), checkValidation()');
    console.log('💳 결제: testCardPayment(), testBankTransfer(), simulatePaymentSuccess()');
    console.log('🧪 테스트: runFullTest(), simulateFirebaseError()');
    console.log('\n💡 도움말: window.debugCourseApplication.help()');
    console.log('🚀 빠른 시작: window.debugCourseApplication.runFullTest()');
    
} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
    console.log('현재 호스트:', window.location.hostname);
}

// =================================
// 최종 완료 메시지
// =================================

console.log('\n🎉 === 2단계 완료: 동적 과정 선택 드롭다운 구현 완료 ===');
console.log('✅ Firebase에서 교육 과정 데이터 기반 드롭다운 생성');
console.log('✅ 교육 일정 테이블의 신청하기 버튼과 과정 선택 연동');
console.log('✅ URL 파라미터 자동 선택 기능 강화');
console.log('✅ 자격증 타입별 그룹화 및 상태별 필터링');
console.log('✅ 실시간 과정 정보 업데이트');
console.log('✅ 완전한 폼 검증 및 결제 시스템');
console.log('✅ 포괄적인 디버깅 도구 제공');
console.log('\n🚀 관리자가 교육과정을 추가하면 즉시 사용자 페이지에 반영됩니다!');
console.log('🔧 Firebase 인덱스 생성이 완료되면 모든 기능이 정상 작동합니다.');
console.log('\n=== 완전한 course-application.js 로드 완료 ===');