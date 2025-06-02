/**
 * 스크롤 TOP 버튼 기능 - 디버깅 버전
 */

console.log('scroll-top.js 로드됨');

window.ScrollTopBtn = {
    init: function() {
        console.log('ScrollTopBtn 초기화 시작');
        const scrollTopBtn = document.getElementById('scroll-top-btn');
        console.log('TOP 버튼 요소:', scrollTopBtn);
        
        if (!scrollTopBtn) {
            console.error('TOP 버튼 요소를 찾을 수 없음');
            return;
        }
        
        this.bindEvents();
        this.checkScroll();
        console.log('ScrollTopBtn 초기화 완료');
    },
    
    bindEvents: function() {
        const scrollTopBtn = document.getElementById('scroll-top-btn');
        if (!scrollTopBtn) return;
        
        console.log('이벤트 바인딩 시작');
        
        // 스크롤 이벤트
        window.addEventListener('scroll', () => {
            this.checkScroll();
        });
        
        // 클릭 이벤트
        scrollTopBtn.addEventListener('click', () => {
            console.log('TOP 버튼 클릭됨');
            this.scrollToTop();
        });
        
        console.log('이벤트 바인딩 완료');
    },
    
    checkScroll: function() {
        const scrollTopBtn = document.getElementById('scroll-top-btn');
        if (!scrollTopBtn) return;
        
        const scrollY = window.pageYOffset || window.scrollY;
        
        if (scrollY > 300) {
            scrollTopBtn.classList.add('visible');
            console.log('TOP 버튼 표시, 스크롤 위치:', scrollY);
        } else {
            scrollTopBtn.classList.remove('visible');
            console.log('TOP 버튼 숨김, 스크롤 위치:', scrollY);
        }
    },
    
    scrollToTop: function() {
        console.log('페이지 상단으로 스크롤');
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded 이벤트 발생');
    if (window.ScrollTopBtn) {
        window.ScrollTopBtn.init();
    }
});

// 이미 로드된 경우 즉시 초기화
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('문서 이미 로드됨, 즉시 초기화');
    if (window.ScrollTopBtn) {
        window.ScrollTopBtn.init();
    }
}