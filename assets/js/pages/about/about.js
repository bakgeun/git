// about.js - 기관 소개 페이지 통합 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 페이지 초기화
    initAboutPage();
    
    // 스크롤 애니메이션 초기화
    initScrollAnimations();
    
    // 가치 카드 인터랙션
    initValueCards();
    
    // 사업 영역 카드 호버 효과
    initBusinessCards();
    
    // 파트너 로고 로딩 에러 처리
    initPartnerLogos();
    
    // TOP 버튼 초기화
    initScrollToTop();
});

// 페이지 초기화
function initAboutPage() {
    // 페이지 클래스 추가
    document.body.classList.add('about-page');
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
    
    // 애니메이션 대상 요소 선택
    const animateElements = document.querySelectorAll('.value-card, .business-area-card, .partner-card');
    animateElements.forEach(el => {
        el.classList.add('fade-out');
        observer.observe(el);
    });
}

// 가치 카드 인터랙션
function initValueCards() {
    const valueCards = document.querySelectorAll('.value-card');
    
    valueCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.value-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.value-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
}

// 사업 영역 카드 호버 효과
function initBusinessCards() {
    const businessCards = document.querySelectorAll('.business-area-card');
    
    businessCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.business-area-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.business-area-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
}

// 파트너 로고 로딩 에러 처리
function initPartnerLogos() {
    const partnerImages = document.querySelectorAll('.partner-card img');
    
    partnerImages.forEach(img => {
        img.addEventListener('error', function() {
            // 이미지 로딩 실패 시 대체 텍스트 표시
            const placeholder = document.createElement('div');
            placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm font-medium';
            placeholder.textContent = '협력 기관';
            
            this.parentNode.replaceChild(placeholder, this);
        });
        
        // 이미지 로딩 시 부드러운 페이드인 효과
        img.addEventListener('load', function() {
            this.style.opacity = '0';
            this.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 100);
        });
    });
}

// TOP 버튼 초기화
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (!scrollTopBtn) return;
    
    // 스크롤 이벤트 리스너
    let isScrolling = false;
    
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                if (window.pageYOffset > 300) {
                    scrollTopBtn.classList.remove('hidden');
                    scrollTopBtn.classList.add('show');
                    scrollTopBtn.style.opacity = '1';
                    scrollTopBtn.style.transform = 'translateY(0)';
                } else {
                    scrollTopBtn.classList.remove('show');
                    scrollTopBtn.classList.add('hidden');
                    scrollTopBtn.style.opacity = '0';
                    scrollTopBtn.style.transform = 'translateY(100px)';
                }
                isScrolling = false;
            });
        }
        isScrolling = true;
    });
    
    // 클릭 이벤트 리스너
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}



// 섹션별 애니메이션 효과 추가
function addSectionAnimations() {
    const sections = document.querySelectorAll('section');
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
                
                // 각 섹션 내 요소들에 순차적 애니메이션 적용
                const animateElements = entry.target.querySelectorAll('.value-card, .business-area-card, .partner-card');
                animateElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('animate-fade-in');
                    }, index * 100);
                });
            }
        });
    }, {
        threshold: 0.2
    });
    
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
}

// 조직도 이미지 반응형 처리
function handleOrganizationChart() {
    const orgChart = document.querySelector('.org-chart-image img');
    if (!orgChart) return;
    
    // 모바일에서 조직도 이미지 확대/축소 기능
    if (window.innerWidth <= 768) {
        let isZoomed = false;
        
        orgChart.style.cursor = 'zoom-in';
        orgChart.addEventListener('click', function() {
            if (!isZoomed) {
                this.style.transform = 'scale(1.5)';
                this.style.cursor = 'zoom-out';
                this.style.transition = 'transform 0.3s ease';
                isZoomed = true;
            } else {
                this.style.transform = 'scale(1)';
                this.style.cursor = 'zoom-in';
                isZoomed = false;
            }
        });
    }
}

// 페이지 로드 완료 후 추가 초기화
window.addEventListener('load', function() {
    addSectionAnimations();
    handleOrganizationChart();
});

// 윈도우 리사이즈 처리
window.addEventListener('resize', function() {
    // 리사이즈 시 조직도 이미지 리셋
    const orgChart = document.querySelector('.org-chart-image img');
    if (orgChart) {
        orgChart.style.transform = 'scale(1)';
    }
    
    // 리사이즈 후 조직도 처리 재초기화
    setTimeout(handleOrganizationChart, 100);
});

// 성능 최적화를 위한 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}