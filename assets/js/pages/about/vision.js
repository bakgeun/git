// vision 페이지 전용 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 페이지 초기화
    initVisionPage();
    
    // 스크롤 애니메이션
    initScrollAnimations();
    
    // 카드 호버 효과
    initCardEffects();
    
    // 통계 애니메이션
    initAchievementStats();
    
    // 테이블 반응형 처리
    initResponseTable();
});

// 페이지 초기화
function initVisionPage() {
    // 페이지 클래스 추가
    document.body.classList.add('vision-page');
    
    // 테이블 스타일 적용
    const table = document.querySelector('.development-plan-table table');
    if (table) {
        table.classList.add('table-responsive');
    }
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
            }
        });
    }, observerOptions);
    
    // 애니메이션 대상 요소 선택
    const animateElements = document.querySelectorAll('.vision-card, .strategy-card, .achievement-stat, .partnership-card');
    animateElements.forEach(el => {
        el.classList.add('fade-out');
        observer.observe(el);
    });
}

// 카드 호버 효과
function initCardEffects() {
    const strategyCards = document.querySelectorAll('.strategy-card');
    
    strategyCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.strategy-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.background = getComputedStyle(this).getPropertyValue('--card-color');
                icon.style.color = 'white';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.strategy-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
                icon.style.background = getComputedStyle(this).getPropertyValue('--card-light-color');
                icon.style.color = getComputedStyle(this).getPropertyValue('--card-color');
            }
        });
    });
}

// 통계 애니메이션
function initAchievementStats() {
    const stats = document.querySelectorAll('.achievement-number');
    
    const animateNumber = (element, target) => {
        const start = 0;
        const duration = 2000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 이지아웃 효과
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);
            
            if (target.toString().includes('%')) {
                element.textContent = current + '%';
            } else if (target.toString().includes('+')) {
                element.textContent = current.toLocaleString() + '+';
            } else {
                element.textContent = current.toLocaleString();
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target.dataset.target;
                if (target) {
                    animateNumber(entry.target, parseInt(target));
                }
                observer.unobserve(entry.target);
            }
        });
    });
    
    stats.forEach(stat => {
        observer.observe(stat);
    });
}

// 테이블 반응형 처리
function initResponseTable() {
    const table = document.querySelector('.development-plan-table table');
    if (!table) return;
    
    // 모바일에서 테이블 스크롤 가능하도록 처리
    const wrapper = document.createElement('div');
    wrapper.style.overflowX = 'auto';
    wrapper.style.marginBottom = '1rem';
    
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    
    // 스크롤 인디케이터 추가
    if (window.innerWidth <= 768) {
        const indicator = document.createElement('div');
        indicator.textContent = '← 좌우로 스크롤하여 더 보기 →';
        indicator.style.textAlign = 'center';
        indicator.style.fontSize = '0.875rem';
        indicator.style.color = '#6b7280';
        indicator.style.marginBottom = '0.5rem';
        wrapper.parentNode.insertBefore(indicator, wrapper);
    }
}

// 유틸리티 함수: 부드러운 스크롤
function smoothScrollTo(element, duration = 300) {
    const target = document.querySelector(element);
    if (target) {
        const start = window.pageYOffset;
        const end = target.offsetTop;
        const distance = end - start;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeInOut = 0.5 - Math.cos(progress * Math.PI) / 2;
            
            window.scrollTo(0, start + distance * easeInOut);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
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