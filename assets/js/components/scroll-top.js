/**
 * 스크롤 TOP 버튼 기능
 * 페이지 스크롤 시 상단으로 이동하는 버튼 제어
 */

// 전역 네임스페이스로 함수 노출
window.ScrollTopBtn = {
    init: function() {
        this.bindEvents();
        this.checkScroll(); // 초기 상태 설정
    },
    
    bindEvents: function() {
        const scrollTopBtn = document.getElementById('scroll-top-btn');
        if (!scrollTopBtn) return;
        
        // 스크롤 이벤트
        window.addEventListener('scroll', this.checkScroll.bind(this));
        
        // 클릭 이벤트
        scrollTopBtn.addEventListener('click', this.scrollToTop.bind(this));
    },
    
    checkScroll: function() {
        const scrollTopBtn = document.getElementById('scroll-top-btn');
        if (!scrollTopBtn) return;
        
        if (window.pageYOffset > 300) {
            scrollTopBtn.style.opacity = '1';
            scrollTopBtn.style.transform = 'translateY(0)';
        } else {
            scrollTopBtn.style.opacity = '0';
            scrollTopBtn.style.transform = 'translateY(100px)';
        }
    },
    
    scrollToTop: function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};

// 문서가 로드되었을 때 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.ScrollTopBtn.init();
});

// 이미 문서가 로드되었다면 즉시 초기화
if (document.readyState === 'complete' || document.readyState !== 'loading') {
    window.ScrollTopBtn.init();
}