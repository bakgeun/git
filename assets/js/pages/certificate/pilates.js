// pilates.js - 2개 탭 버전

console.log('pilates.js (2개 탭 버전) 로드됨');

// 즉시 실행 함수로 감싸기
(function () {
    console.log('필라테스 페이지 즉시 실행 함수 시작');

    // 시험일정 데이터 정의 (health-exercise.js와 동일한 데이터 구조 사용)
    const examScheduleData = {
        'health-exercise': {
            currentExam: {
                applyPeriod: '2025.02.01-2025.02.28',
                examDate: '2025.03.15 (토)',
                resultDate: '2025.03.31',
                locations: '서울, 부산, 대구, 광주'
            },
            nextExam: {
                applyPeriod: '2025.05.01-2025.05.31',
                examDate: '2025.06.21 (토)',
                resultDate: '2025.07.07',
                locations: '서울, 부산, 대구, 광주, 대전'
            }
        },
        'rehabilitation': {
            currentExam: {
                applyPeriod: '2025.03.01-2025.03.31',
                examDate: '2025.04.19 (토)',
                resultDate: '2025.05.05',
                locations: '서울, 부산, 대구'
            },
            nextExam: {
                applyPeriod: '2025.06.01-2025.06.30',
                examDate: '2025.07.26 (토)',
                resultDate: '2025.08.11',
                locations: '서울, 부산, 대구, 광주'
            }
        },
        'pilates': {
            currentExam: {
                applyPeriod: '2025.02.15-2025.03.15',
                examDate: '2025.04.12 (토)',
                resultDate: '2025.04.28',
                locations: '서울, 부산'
            },
            nextExam: {
                applyPeriod: '2025.05.15-2025.06.15',
                examDate: '2025.07.19 (토)',
                resultDate: '2025.08.04',
                locations: '서울, 부산, 대구'
            }
        },
        'recreation': {
            currentExam: {
                applyPeriod: '2025.01.15-2025.02.15',
                examDate: '2025.03.08 (토)',
                resultDate: '2025.03.24',
                locations: '서울, 부산, 대구, 광주'
            },
            nextExam: {
                applyPeriod: '2025.04.15-2025.05.15',
                examDate: '2025.06.14 (토)',
                resultDate: '2025.06.30',
                locations: '서울, 부산, 대구, 광주, 대전'
            }
        }
    };

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
            updateExamSchedule();
            initPageLinking();
            // 필라테스 페이지 전용 추가 기능
            initHeroSection();
            initScrollEffects();
        }, 500);
    }

    // 시험일정 업데이트 함수
    function updateExamSchedule() {
        console.log('시험일정 업데이트 시작');
        
        // 현재 페이지가 어떤 자격증인지 확인
        const currentPage = getCurrentCertificateType();
        console.log('현재 자격증 타입:', currentPage);
        
        if (currentPage && examScheduleData[currentPage]) {
            const scheduleData = examScheduleData[currentPage];
            updateScheduleDisplay(scheduleData);
        } else {
            console.warn('자격증 타입을 찾을 수 없거나 해당 데이터가 없습니다:', currentPage);
        }
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

    // 시험일정 표시 업데이트
    function updateScheduleDisplay(scheduleData) {
        console.log('시험일정 표시 업데이트:', scheduleData);
        
        const scheduleContainer = document.getElementById('exam-schedule-info');
        
        if (!scheduleContainer) {
            console.error('exam-schedule-info 요소를 찾을 수 없습니다');
            return;
        }

        // 현재 날짜 확인하여 적절한 시험일정 선택
        const currentExam = selectCurrentExam(scheduleData);
        
        // HTML 업데이트
        scheduleContainer.innerHTML = `
            <div class="cert-detail-item">
                <span class="cert-detail-label">접수기간</span>
                <span class="cert-detail-value">${currentExam.applyPeriod}</span>
            </div>
            <div class="cert-detail-item">
                <span class="cert-detail-label">시험일자</span>
                <span class="cert-detail-value">${currentExam.examDate}</span>
            </div>
            <div class="cert-detail-item">
                <span class="cert-detail-label">합격발표</span>
                <span class="cert-detail-value">${currentExam.resultDate}</span>
            </div>
            <div class="cert-detail-item">
                <span class="cert-detail-label">시험장소</span>
                <span class="cert-detail-value">${currentExam.locations}</span>
            </div>
        `;
        
        console.log('시험일정 업데이트 완료');
    }

    // 현재 날짜에 따라 적절한 시험일정 선택
    function selectCurrentExam(scheduleData) {
        const today = new Date();
        const currentExamDate = new Date(scheduleData.currentExam.examDate.split(' ')[0]);
        
        // 현재 시험일이 지났으면 다음 시험일정 사용
        if (today > currentExamDate) {
            console.log('현재 시험일이 지나서 다음 시험일정 사용');
            return scheduleData.nextExam;
        } else {
            console.log('현재 시험일정 사용');
            return scheduleData.currentExam;
        }
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

    // 페이지 간 연동 기능 초기화
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
                const courseParam = getCourseParamByCertType(certType);
                
                console.log('자격증 타입:', certType, '과정 파라미터:', courseParam);
                
                if (courseParam) {
                    const targetUrl = window.adjustPath(`pages/education/course-application.html?course=${courseParam}`);
                    console.log('교육과정 신청 페이지로 이동:', targetUrl);
                    window.location.href = targetUrl;
                } else {
                    console.log('파라미터가 없어서 기본 페이지로 이동');
                    window.location.href = window.adjustPath('pages/education/course-application.html');
                }
            });
        });
        
        // 자격증 시험 신청하기 버튼들
        const certApplicationBtns = document.querySelectorAll('a[href*="cert-application.html"]');
        console.log('자격증 신청 버튼 개수:', certApplicationBtns.length);
        
        certApplicationBtns.forEach((btn, index) => {
            console.log(`자격증 신청 버튼 ${index}:`, btn.textContent.trim());
            
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('자격증 신청 버튼 클릭됨:', this.textContent.trim());
                
                const certType = getCurrentCertificateType();
                const certParam = getCertParamByCertType(certType);
                
                console.log('자격증 타입:', certType, '자격증 파라미터:', certParam);
                
                if (certParam) {
                    const targetUrl = window.adjustPath(`pages/education/cert-application.html?cert=${certParam}`);
                    console.log('자격증 신청 페이지로 이동:', targetUrl);
                    window.location.href = targetUrl;
                } else {
                    console.log('파라미터가 없어서 기본 페이지로 이동');
                    window.location.href = window.adjustPath('pages/education/cert-application.html');
                }
            });
        });
        
        console.log('페이지 간 연동 기능 초기화 완료');
    }

    // 자격증 타입에 따른 교육과정 파라미터 매핑
    function getCourseParamByCertType(certType) {
        const courseMapping = {
            'health-exercise': 'health-1',  // 건강운동처방사 과정 1기
            'rehabilitation': 'rehab-1',    // 운동재활전문가 과정 1기
            'pilates': 'pilates-3',         // 필라테스 전문가 과정 3기
            'recreation': 'rec-2'           // 레크리에이션지도자 과정 2기
        };
        
        return courseMapping[certType] || null;
    }

    // 자격증 타입에 따른 자격증 신청 파라미터 매핑
    function getCertParamByCertType(certType) {
        const certMapping = {
            'health-exercise': 'health',    // 건강운동처방사
            'rehabilitation': 'rehab',      // 운동재활전문가
            'pilates': 'pilates',          // 필라테스 전문가
            'recreation': 'recreation'      // 레크리에이션지도자
        };
        
        return certMapping[certType] || null;
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

    // 수동으로 탭 전환 테스트할 수 있는 전역 함수
    window.testPilatesTab = function (tabId) {
        console.log('수동 필라테스 탭 전환 테스트:', tabId);
        switchTab(tabId);
    };

    // 시험일정 데이터를 외부에서 접근 가능하도록 전역 객체에 추가
    window.examScheduleData = examScheduleData;
    
    // 시험일정 업데이트 함수를 외부에서 호출 가능하도록 전역 함수로 등록
    window.updateExamSchedule = updateExamSchedule;

})();

console.log('pilates.js (2개 탭 버전) 실행 완료');