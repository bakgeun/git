// rehabilitation.js - 운동재활전문가 페이지 전용 스크립트

console.log('rehabilitation.js 로드됨');

// 즉시 실행 함수로 감싸기
(function () {
    console.log('재활 페이지 즉시 실행 함수 시작');

    // 페이지가 이미 로드된 경우 즉시 실행, 아니면 DOMContentLoaded 대기
    if (document.readyState === 'loading') {
        console.log('DOM 로딩 중, DOMContentLoaded 이벤트 대기');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('DOM 이미 로드됨, 즉시 초기화');
        init();
    }

    function init() {
        console.log('재활 페이지 초기화 시작');

        // 스크립트 로더가 완료될 때까지 약간 지연
        setTimeout(function () {
            console.log('지연 후 탭 초기화 시작');
            initializeTabs();
            initCertificateSwitcher();
            // 추가 초기화 함수들
            initHeroSection();
            initScrollEffects();
        }, 500);
    }

    function initializeTabs() {
        console.log('탭 초기화 함수 실행');

        // 모든 탭 아이템과 콘텐츠 찾기
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
            console.log('탭 ' + index + '에 이벤트 리스너 추가');

            tab.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('탭 클릭됨:', this.getAttribute('data-tab'));

                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

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
    window.testRehabTab = function (tabId) {
        console.log('수동 재활 탭 전환 테스트:', tabId);
        switchTab(tabId);
    };

})();

console.log('rehabilitation.js 실행 완료');