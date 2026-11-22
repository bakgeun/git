/**
 * 자격증 페이지 스크립트
 * 자격증 소개 페이지의 탭 기능 등을 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // DOM 요소 참조
    const tabNav = document.getElementById('tab-nav');
    const tabLinks = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    /**
     * 탭 변경 처리
     * 
     * @param {string} tabId - 활성화할 탭 ID
     */
    function switchTab(tabId) {
        // 모든 탭 링크의 active 클래스 제거
        tabLinks.forEach(link => {
            link.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
            link.classList.add('text-gray-500');
        });
        
        // 모든 탭 컨텐츠 숨기기
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        
        // 선택한 탭 링크에 active 클래스 추가
        const activeLink = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-500');
            activeLink.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        }
        
        // 선택한 탭 컨텐츠 표시
        const activeContent = document.getElementById(`${tabId}-content`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
        
        // URL 해시 업데이트 (브라우저 히스토리 추가 없이)
        window.history.replaceState(null, null, `#${tabId}`);
    }
    
    /**
     * 초기 탭 설정
     * URL 해시가 있으면 해당 탭으로, 없으면 기본 탭으로 설정
     */
    function initTabs() {
        // URL에서 해시 추출
        const hash = window.location.hash.substring(1);
        
        // 해시가 있고 해당 탭이 존재하면 그 탭 활성화, 아니면 기본 탭(overview) 활성화
        if (hash && document.querySelector(`[data-tab="${hash}"]`)) {
            switchTab(hash);
        } else {
            switchTab('overview');
        }
    }
    
    /**
     * 탭 네비게이션 스크롤 시 고정 처리
     */
    function handleTabNavScroll() {
        if (!tabNav) return;
        
        const tabNavTop = tabNav.getBoundingClientRect().top;
        const header = document.getElementById('main-header');
        const headerHeight = header ? header.offsetHeight : 0;
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > tabNavTop - headerHeight) {
                tabNav.parentElement.classList.add('sticky', 'top-0', 'z-20', 'shadow-md');
                if (header) {
                    tabNav.parentElement.style.top = `${headerHeight}px`;
                }
            } else {
                tabNav.parentElement.classList.remove('sticky', 'top-0', 'z-20', 'shadow-md');
                tabNav.parentElement.style.top = '';
            }
        });
    }
    
    /**
     * 앵커 링크 스크롤 처리
     * 
     * @param {string} hash - 스크롤할 요소의 ID (해시 포함)
     */
    function scrollToAnchor(hash) {
        const id = hash.substring(1);
        const element = document.getElementById(id);
        
        if (element) {
            const header = document.getElementById('main-header');
            const tabNavHeight = tabNav ? tabNav.offsetHeight : 0;
            const headerHeight = header ? header.offsetHeight : 0;
            const offset = headerHeight + tabNavHeight + 20;
            
            const elementTop = element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: elementTop - offset,
                behavior: 'smooth'
            });
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 탭 링크 클릭 이벤트
        tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // 앵커 링크 클릭 이벤트
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // 탭 링크인 경우 처리하지 않음 (위에서 이미 처리함)
                if (this.hasAttribute('data-tab')) {
                    return;
                }
                
                // 페이지 내 앵커 링크인 경우
                if (href !== '#') {
                    e.preventDefault();
                    scrollToAnchor(href);
                }
            });
        });
        
        // 해시 변경 이벤트 (브라우저 뒤로가기, 앞으로가기 등)
        window.addEventListener('hashchange', function() {
            const hash = window.location.hash.substring(1);
            
            // 탭 ID가 있는 경우 탭 전환
            if (hash && document.querySelector(`[data-tab="${hash}"]`)) {
                switchTab(hash);
            }
        });
    }
    
    /**
     * 페이지 로드 시 초기화
     */
    function init() {
        if (!tabNav || tabLinks.length === 0 || tabContents.length === 0) {
            return;
        }
        
        initTabs();
        handleTabNavScroll();
        setupEventListeners();
        
        // URL 해시가 있는 경우 해당 위치로 스크롤
        if (window.location.hash) {
            // 약간의 지연을 두어 탭 전환 후 스크롤하도록 함
            setTimeout(() => {
                scrollToAnchor(window.location.hash);
            }, 100);
        }
    }
    
    // 페이지 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', init);
})();