// pilates.js - 수정된 교육일정 동적 업데이트 버전 (수료증 발급 제거 + 인덱스 문제 해결)

console.log('pilates.js (수정된 교육일정 동적 버전) 로드됨');

// 즉시 실행 함수로 감싸기
(function () {
    console.log('필라테스 페이지 즉시 실행 함수 시작');

    // 🔧 NEW: 교육일정 데이터 저장 변수
    let latestEducationSchedule = null;

    // 페이지가 이미 로드된 경우 즉시 실행, 아니면 DOMContentLoaded 대기
    if (document.readyState === 'loading') {
        console.log('DOM 로딩 중, DOMContentLoaded 이벤트 대기');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('DOM 이미 로드됨, 즉시 초기화');
        init();
    }

    function init() {
        console.log('필라테스 페이지 초기화 시작');

        // 스크립트 로더가 완료될 때까지 약간 지연
        setTimeout(function () {
            console.log('지연 후 탭 초기화 시작');
            initializeTabs();
            initCertificateSwitcher();
            loadEducationSchedule(); // 🔧 교육일정 동적 로드
            initPageLinking();
            // 필라테스 페이지 전용 추가 기능
            initHeroSection();
            initScrollEffects();
        }, 500);
    }

    // 🔧 수정: 교육일정 동적 로드 함수 - 인덱스 문제 해결 + 수료증 발급 제거
    async function loadEducationSchedule() {
        console.log('📚 필라테스 교육일정 동적 로드 시작 (전체 로드 방식)');
        
        try {
            // Firebase 연결 확인
            if (!window.dhcFirebase || !window.dhcFirebase.db || !window.dbService) {
                console.log('⚠️ Firebase 미연동, 기본 데이터 사용');
                updateScheduleDisplay(getDefaultScheduleData());
                return;
            }

            // 현재 자격증 타입 확인
            const currentCertType = getCurrentCertificateType();
            if (!currentCertType) {
                console.warn('❌ 현재 자격증 타입을 확인할 수 없습니다');
                updateScheduleDisplay(getDefaultScheduleData());
                return;
            }

            console.log('🎯 현재 자격증 타입:', currentCertType);

            // 🔧 수정: 전체 courses 컬렉션 로드 (인덱스 문제 해결)
            const allCoursesResult = await window.dbService.getDocuments('courses');

            if (allCoursesResult.success && allCoursesResult.data.length > 0) {
                console.log('📋 전체 교육과정 로드됨:', allCoursesResult.data.length + '개');
                
                // 클라이언트에서 필터링 및 정렬
                const filteredCourses = allCoursesResult.data.filter(course => {
                    return course.certificateType === currentCertType && course.status === 'active';
                });
                
                console.log('✅ 필터링된 활성 교육과정:', filteredCourses.length + '개');
                
                if (filteredCourses.length > 0) {
                    // 시작일 기준으로 정렬 (가장 빠른 것부터)
                    filteredCourses.sort((a, b) => {
                        const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate);
                        const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate);
                        return dateA.getTime() - dateB.getTime();
                    });
                    
                    const latestCourse = filteredCourses[0];
                    console.log('✅ 최신 교육과정 찾음:', latestCourse.title);
                    console.log('📅 교육과정 상세 정보:', {
                        title: latestCourse.title,
                        certificateType: latestCourse.certificateType,
                        status: latestCourse.status,
                        startDate: latestCourse.startDate,
                        endDate: latestCourse.endDate,
                        applyStartDate: latestCourse.applyStartDate,
                        applyEndDate: latestCourse.applyEndDate,
                        location: latestCourse.location
                    });
                    
                    latestEducationSchedule = latestCourse;
                    updateScheduleDisplay(convertCourseToSchedule(latestCourse));
                } else {
                    console.log('⚠️ 활성 교육과정이 없음, 기본 데이터 사용');
                    updateScheduleDisplay(getDefaultScheduleData());
                }
            } else {
                console.log('⚠️ 교육과정 데이터가 없음, 기본 데이터 사용');
                updateScheduleDisplay(getDefaultScheduleData());
            }

        } catch (error) {
            console.error('❌ 교육일정 로드 오류:', error);
            updateScheduleDisplay(getDefaultScheduleData());
        }
    }

    // 🔧 수정: 교육과정 데이터를 교육일정 형태로 변환 - 수료증 발급 제거
    function convertCourseToSchedule(course) {
        try {
            // 🔧 수정: course-management.js의 실제 필드명에 맞춰 매핑
            const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
            const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);
            
            let applyStartDate, applyEndDate;
            if (course.applyStartDate && course.applyEndDate) {
                applyStartDate = course.applyStartDate?.toDate ? course.applyStartDate.toDate() : new Date(course.applyStartDate);
                applyEndDate = course.applyEndDate?.toDate ? course.applyEndDate.toDate() : new Date(course.applyEndDate);
            } else {
                // 신청기간이 설정되지 않은 경우 기본값 설정
                applyStartDate = new Date(startDate);
                applyStartDate.setDate(applyStartDate.getDate() - 30);
                applyEndDate = new Date(startDate);
                applyEndDate.setDate(applyEndDate.getDate() - 7);
            }

            const formatDate = (date) => {
                if (window.formatters && window.formatters.formatDate) {
                    return window.formatters.formatDate(date, 'YYYY.MM.DD');
                }
                return date.toLocaleDateString('ko-KR').replace(/\./g, '.').replace(/\s/g, '');
            };

            // 🔧 수정: 수료증 발급일 제거, 교육장소 필드명 정확히 매핑
            return {
                applyPeriod: `${formatDate(applyStartDate)} ~ ${formatDate(applyEndDate)}`,
                educationPeriod: `${formatDate(startDate)} ~ ${formatDate(endDate)}`,
                // 🔧 수정: course.location (단수형) 사용
                locations: course.location || '서울 강남구 센터'
            };

        } catch (error) {
            console.error('❌ 교육과정 데이터 변환 오류:', error);
            return getDefaultScheduleData();
        }
    }

    // 🔧 수정: 기본 교육일정 데이터 - 수료증 발급일 제거
    function getDefaultScheduleData() {
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(15); // 필라테스는 보통 15일 시작

        const endDate = new Date(nextMonth);
        endDate.setMonth(endDate.getMonth() + 2); // 2개월 과정

        const applyStart = new Date(today);
        const applyEnd = new Date(nextMonth);
        applyEnd.setDate(applyEnd.getDate() - 7);

        const formatDate = (date) => {
            return date.toLocaleDateString('ko-KR').replace(/\./g, '.').replace(/\s/g, '');
        };

        return {
            applyPeriod: `${formatDate(applyStart)} ~ ${formatDate(applyEnd)}`,
            educationPeriod: `${formatDate(nextMonth)} ~ ${formatDate(endDate)}`,
            locations: '서울 강남구 센터'
        };
    }

    // 현재 자격증 타입 확인
    function getCurrentCertificateType() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('health-exercise')) {
            return 'health-exercise';
        } else if (currentPath.includes('rehabilitation')) {
            return 'rehabilitation';
        } else if (currentPath.includes('pilates')) {
            return 'pilates';
        } else if (currentPath.includes('recreation')) {
            return 'recreation';
        }
        
        return null;
    }

    // 🔧 수정: 교육일정 표시 업데이트 - 수료증 발급 제거
    function updateScheduleDisplay(scheduleData) {
        console.log('📅 필라테스 교육일정 표시 업데이트:', scheduleData);
        
        const scheduleContainer = document.getElementById('exam-schedule-info');
        
        if (!scheduleContainer) {
            console.error('exam-schedule-info 요소를 찾을 수 없습니다');
            return;
        }

        // 🔧 수정: 수료증 발급 항목 제거, 교육장소 정보 추가
        scheduleContainer.innerHTML = `
            <div class="cert-detail-item">
                <span class="cert-detail-label">신청기간</span>
                <span class="cert-detail-value">${scheduleData.applyPeriod}</span>
            </div>
            <div class="cert-detail-item">
                <span class="cert-detail-label">교육기간</span>
                <span class="cert-detail-value">${scheduleData.educationPeriod}</span>
            </div>
            <div class="cert-detail-item">
                <span class="cert-detail-label">교육장소</span>
                <span class="cert-detail-value">${scheduleData.locations}</span>
            </div>
        `;
        
        console.log('✅ 필라테스 교육일정 업데이트 완료 (수료증 발급 제거됨)');
    }

    // 탭 초기화 함수 (2개 탭용으로 수정)
    function initializeTabs() {
        console.log('탭 초기화 함수 실행 (2개 탭)');

        const tabItems = document.querySelectorAll('.tab-item');
        const tabContents = document.querySelectorAll('.tab-content');

        console.log('탭 아이템 수:', tabItems.length);
        console.log('탭 콘텐츠 수:', tabContents.length);

        if (tabItems.length === 0) {
            console.error('탭 아이템을 찾을 수 없습니다');
            return;
        }

        if (tabContents.length === 0) {
            console.error('탭 콘텐츠를 찾을 수 없습니다');
            return;
        }

        // 탭 클릭 이벤트 등록
        tabItems.forEach(function (tab, index) {
            console.log('탭 ' + index + '에 이벤트 리스너 추가:', tab.getAttribute('data-tab'));

            tab.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('탭 클릭됨:', this.getAttribute('data-tab'));

                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        // 첫 번째 탭 활성화 확인
        const firstTab = document.querySelector('.tab-item[data-tab="overview"]');
        const firstContent = document.getElementById('overview-content');
        
        if (firstTab && firstContent) {
            firstTab.classList.add('active');
            firstContent.classList.add('active');
            console.log('첫 번째 탭 활성화 완료');
        }

        console.log('탭 초기화 완료');
    }

    // 자격증 전환 버튼 초기화
    function initCertificateSwitcher() {
        console.log('자격증 전환 탭 초기화');
        
        // 현재 페이지 식별
        const currentPage = window.location.pathname;
        let activeCert = '';
        
        if (currentPage.includes('health-exercise')) {
            activeCert = 'health-exercise';
        } else if (currentPage.includes('rehabilitation')) {
            activeCert = 'rehabilitation';
        } else if (currentPage.includes('pilates')) {
            activeCert = 'pilates';
        } else if (currentPage.includes('recreation')) {
            activeCert = 'recreation';
        }
        
        console.log('현재 자격증 페이지:', activeCert);
        
        // 모든 자격증 탭의 active 클래스 제거
        const certTabs = document.querySelectorAll('.cert-tab-item');
        certTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 현재 페이지에 해당하는 탭에 active 클래스 추가
        if (activeCert) {
            const activeTab = document.querySelector(`.cert-tab-item[href*="${activeCert}"]`);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        }
    }

    // 🔧 수정: 페이지 간 연동 기능 초기화 (자격증 시험 신청 버튼 제거)
    function initPageLinking() {
        console.log('페이지 간 연동 기능 초기화');
        
        // 교육 과정 신청하기 버튼들
        const courseApplicationBtns = document.querySelectorAll('a[href*="course-application.html"]');
        console.log('교육과정 신청 버튼 개수:', courseApplicationBtns.length);
        
        courseApplicationBtns.forEach((btn, index) => {
            console.log(`교육과정 신청 버튼 ${index}:`, btn.textContent.trim());
            
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('교육과정 신청 버튼 클릭됨:', this.textContent.trim());
                
                const certType = getCurrentCertificateType();
                
                // 🔧 수정: 실제 교육과정 ID 전달
                let targetUrl;
                if (latestEducationSchedule && latestEducationSchedule.id) {
                    targetUrl = window.adjustPath(`pages/education/course-application.html?courseId=${latestEducationSchedule.id}&from=certificate`);
                    console.log('실제 교육과정 ID로 이동:', latestEducationSchedule.id);
                } else {
                    // 폴백: 자격증 타입으로 매핑
                    const courseParam = getCourseParamByCertType(certType);
                    if (courseParam) {
                        targetUrl = window.adjustPath(`pages/education/course-application.html?courseId=${courseParam}&from=certificate`);
                        console.log('폴백: 자격증 타입으로 이동:', courseParam);
                    } else {
                        targetUrl = window.adjustPath('pages/education/course-application.html');
                        console.log('기본 페이지로 이동');
                    }
                }
                
                console.log('교육과정 신청 페이지로 이동:', targetUrl);
                window.location.href = targetUrl;
            });
        });
        
        // 🔧 자격증 시험 신청하기 버튼들 제거
        const certApplicationBtns = document.querySelectorAll('a[href*="cert-application.html"]');
        console.log('자격증 신청 버튼 개수 (제거 대상):', certApplicationBtns.length);
        
        certApplicationBtns.forEach((btn, index) => {
            console.log(`자격증 신청 버튼 ${index} 제거:`, btn.textContent.trim());
            
            // 버튼이 포함된 부모 요소도 함께 제거 (레이아웃 정리)
            const parentElement = btn.closest('.cert-cta-button, .button-container, .action-button');
            if (parentElement) {
                parentElement.remove();
                console.log('부모 요소와 함께 제거됨');
            } else {
                btn.remove();
                console.log('버튼만 제거됨');
            }
        });
        
        console.log('✅ 자격증 시험 신청 버튼 모두 제거 완료');
        console.log('페이지 간 연동 기능 초기화 완료');
    }

    // 자격증 타입에 따른 교육과정 파라미터 매핑 (폴백용)
    function getCourseParamByCertType(certType) {
        const courseMapping = {
            'health-exercise': 'test-health-1',  // 건강운동처방사 과정
            'rehabilitation': 'test-rehab-1',    // 운동재활전문가 과정
            'pilates': 'test-pilates-1',         // 필라테스 전문가 과정
            'recreation': 'test-recreation-1'    // 레크리에이션지도자 과정
        };
        
        return courseMapping[certType] || null;
    }

    // 탭 전환 함수 (2개 탭용으로 수정)
    function switchTab(tabId) {
        console.log('탭 전환 시작:', tabId);

        const tabItems = document.querySelectorAll('.tab-item');
        const tabContents = document.querySelectorAll('.tab-content');

        // 모든 탭 비활성화
        tabItems.forEach(function (item) {
            item.classList.remove('active');
        });

        // 모든 콘텐츠 숨기기
        tabContents.forEach(function (content) {
            content.classList.remove('active');
        });

        // 해당 탭 활성화
        const targetTab = document.querySelector('[data-tab="' + tabId + '"]');
        if (targetTab) {
            targetTab.classList.add('active');
            console.log('탭 활성화됨:', tabId);
        } else {
            console.error('탭을 찾을 수 없음:', tabId);
        }

        // 해당 콘텐츠 표시
        const targetContent = document.getElementById(tabId + '-content');
        if (targetContent) {
            targetContent.classList.add('active');
            console.log('콘텐츠 활성화됨:', tabId + '-content');
        } else {
            console.error('콘텐츠를 찾을 수 없음:', tabId + '-content');
        }

        // 페이지 맨 위로 스크롤
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // 히어로 섹션 초기화
    function initHeroSection() {
        console.log('히어로 섹션 초기화');
        
        // 히어로 섹션 애니메이션 효과
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.style.opacity = '0';
            heroSection.style.transform = 'translateY(30px)';
            
            // 페이드인 애니메이션
            setTimeout(() => {
                heroSection.style.transition = 'all 0.8s ease';
                heroSection.style.opacity = '1';
                heroSection.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    // 스크롤 효과 초기화
    function initScrollEffects() {
        console.log('스크롤 효과 초기화');
        
        // Intersection Observer를 사용한 스크롤 애니메이션
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                }
            });
        }, observerOptions);
        
        // 애니메이션 대상 요소들
        const animateElements = document.querySelectorAll('.cert-info-card, .cert-sidebar-card, .cert-feature, .career-card');
        animateElements.forEach(el => {
            el.classList.add('animate-ready');
            observer.observe(el);
        });
    }

    // 🔧 NEW: 교육일정 새로고침 함수 (외부에서 호출 가능)
    window.refreshPilatesEducationSchedule = function() {
        console.log('🔄 필라테스 교육일정 수동 새로고침');
        loadEducationSchedule();
    };

    // 🔧 NEW: 현재 로드된 교육과정 정보 확인 함수
    window.getCurrentPilatesEducationSchedule = function() {
        return latestEducationSchedule;
    };

    // 수동으로 탭 전환 테스트할 수 있는 전역 함수
    window.testPilatesTab = function (tabId) {
        console.log('수동 필라테스 탭 전환 테스트:', tabId);
        switchTab(tabId);
    };
    
    // 교육일정 업데이트 함수를 외부에서 호출 가능하도록 전역 함수로 등록
    window.updatePilatesEducationSchedule = loadEducationSchedule;

})();

console.log('pilates.js (수정된 교육일정 동적 버전) 실행 완료');