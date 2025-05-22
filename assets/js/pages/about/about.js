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
    
    // 페이지 내 앵커 스크롤 초기화
    initSmoothAnchorScroll();
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
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.value-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
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
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.business-area-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
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
            placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm';
            placeholder.textContent = '협력 기관';
            
            this.parentNode.replaceChild(placeholder, this);
        });
    });
}

// TOP 버튼 초기화
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (!scrollTopBtn) return;
    
    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.remove('hidden');
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
            scrollTopBtn.classList.add('hidden');
        }
    });
    
    // 클릭 이벤트 리스너
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 페이지 내 앵커 스크롤 초기화
function initSmoothAnchorScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // 상단 내비게이션 바의 높이 고려
                const navHeight = 60;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 페이지 내 탭이 있을 경우 활성 탭 처리
function handleActiveTab() {
    // 현재 스크롤 위치 기준으로 어떤 섹션이 보이는지 확인
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY;
    
    // 현재 보이는 섹션 찾기
    let currentSection = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    // 해당 섹션의 탭 활성화
    if (currentSection) {
        const tabLinks = document.querySelectorAll('.page-nav a');
        tabLinks.forEach(link => {
            const href = link.getAttribute('href').substring(1);
            if (href === currentSection) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// 스크롤 이벤트에 탭 활성화 함수 연결
window.addEventListener('scroll', handleActiveTab);