// overview 페이지 전용 JavaScript

// 페이지 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 스크롤 애니메이션 초기화
    initScrollAnimations();
    
    // 히스토리 카드 호버 효과
    initHistoryCards();
    
    // 가치 카드 인터랙션
    initValueCards();
    
    // 파트너 로고 로딩 에러 처리
    initPartnerLogos();
    
    // 특징 카드 호버 효과
    initFeatureCards();
    
    // 페이지 로드 시 즉시 모든 섹션 표시
    showAllSections();
});

// 페이지 로드 시 모든 섹션 즉시 표시
function showAllSections() {
    const fadeElements = document.querySelectorAll('.fade-out');
    fadeElements.forEach(el => {
        el.classList.remove('fade-out');
        el.classList.add('fade-in');
    });
}

// 스크롤 애니메이션 초기화
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                entry.target.classList.remove('fade-out');
            }
        });
    }, observerOptions);
    
    // 이미 화면에 보이는 요소들은 즉시 표시
    const animateElements = document.querySelectorAll('.history-item, .value-card, .feature-card');
    animateElements.forEach(el => {
        if (isElementInViewport(el)) {
            el.classList.add('fade-in');
            el.classList.remove('fade-out');
        } else {
            observer.observe(el);
        }
    });
}

// 히스토리 카드 호버 효과
function initHistoryCards() {
    const historyItems = document.querySelectorAll('.history-item');
    
    historyItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const year = this.querySelector('.history-year-container');
            if (year) {
                year.style.transform = 'scale(1.05)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            const year = this.querySelector('.history-year-container');
            if (year) {
                year.style.transform = 'scale(1)';
            }
        });
    });
}

// 가치 카드 인터랙션
function initValueCards() {
    const valueCards = document.querySelectorAll('.value-card');
    
    valueCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.value-icon-container');
            const iconSvg = this.querySelector('.value-icon');
            
            if (icon && iconSvg) {
                // 배경색 변경 애니메이션
                icon.style.transform = 'scale(1.1)';
                iconSvg.style.transform = 'rotate(10deg)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.value-icon-container');
            const iconSvg = this.querySelector('.value-icon');
            
            if (icon && iconSvg) {
                icon.style.transform = 'scale(1)';
                iconSvg.style.transform = 'rotate(0deg)';
            }
        });
    });
}

// 주요특징 카드 호버 효과
function initFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card-improved');
    
    // Intersection Observer로 스크롤 애니메이션 관리
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    featureCards.forEach((card, index) => {
        // 초기에 애니메이션 일시 정지
        card.style.animationPlayState = 'paused';
        
        // 기존 호버 효과는 CSS에서 처리
        observer.observe(card);
    });
}

// 파트너 로고 로딩 에러 처리
function initPartnerLogos() {
    const partnerImages = document.querySelectorAll('.partner-logo');
    
    partnerImages.forEach(img => {
        img.addEventListener('error', function() {
            // 이미지 로딩 실패 시 대체 텍스트 표시
            const placeholder = document.createElement('div');
            placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm';
            placeholder.textContent = '협력 기관';
            
            this.parentNode.replaceChild(placeholder, this);
        });
    });
}

// 유틸리티 함수: 요소의 가시성 확인
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// about.css 와 함께 사용할 JavaScript (선택사항)
function scrollActiveTabIntoView() {
    const activeTab = document.querySelector('.navigation-tabs .tab-item.active');
    if (activeTab && window.innerWidth <= 768) {
        const container = document.querySelector('.navigation-tabs nav');
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        
        // 탭을 화면 중앙에 위치시키기
        const scrollLeft = container.scrollLeft + 
            tabRect.left - containerRect.left - 
            (containerRect.width / 2) + (tabRect.width / 2);
        
        container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', scrollActiveTabIntoView);
// 화면 크기 변경 시 실행
window.addEventListener('resize', scrollActiveTabIntoView);