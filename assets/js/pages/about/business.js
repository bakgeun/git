// business 페이지 전용 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 페이지 초기화
    initBusinessPage();
    
    // 스크롤 애니메이션
    initScrollAnimations();
    
    // 카드 호버 효과
    initCardEffects();
    
    // 테이블 반응형 처리
    initResponsiveTables();
    
    // 번호 애니메이션
    initNumberAnimation();
});

// 페이지 초기화
function initBusinessPage() {
    // 페이지 클래스 추가
    document.body.classList.add('business-page');
    
    // 액코디언 기능 초기화
    initCertificateAccordion();
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
    const animateElements = document.querySelectorAll('.business-area-card, .certificate-card, .process-card, .research-center');
    animateElements.forEach(el => {
        el.classList.add('fade-out');
        observer.observe(el);
    });
}

// 카드 호버 효과
function initCardEffects() {
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
    
    const researchCenters = document.querySelectorAll('.research-center');
    
    researchCenters.forEach(center => {
        center.addEventListener('mouseenter', function() {
            const teams = this.querySelectorAll('.team-item');
            teams.forEach((team, index) => {
                setTimeout(() => {
                    team.style.transform = 'translateX(10px)';
                }, index * 100);
            });
        });
        
        center.addEventListener('mouseleave', function() {
            const teams = this.querySelectorAll('.team-item');
            teams.forEach(team => {
                team.style.transform = 'translateX(0)';
            });
        });
    });
}

// 자격증 아코디언 기능
function initCertificateAccordion() {
    const certificates = document.querySelectorAll('.certificate-card');
    
    certificates.forEach(cert => {
        const details = cert.querySelector('.certificate-details');
        if (details) {
            // 초기 높이 설정
            const initialHeight = details.scrollHeight;
            details.style.maxHeight = initialHeight + 'px';
            
            cert.addEventListener('click', function() {
                const isExpanded = this.classList.contains('expanded');
                
                // 모든 카드 축소
                certificates.forEach(c => {
                    c.classList.remove('expanded');
                    const d = c.querySelector('.certificate-details');
                    if (d) d.style.maxHeight = initialHeight + 'px';
                });
                
                // 클릭된 카드만 확장/축소
                if (!isExpanded) {
                    this.classList.add('expanded');
                    details.style.maxHeight = details.scrollHeight + 'px';
                }
            });
        }
    });
}

// 테이블 반응형 처리
function initResponsiveTables() {
    const tables = document.querySelectorAll('.cost-table');
    
    tables.forEach(tableWrapper => {
        const table = tableWrapper.querySelector('table');
        if (!table) return;
        
        // 모바일에서 스크롤 가능하도록 래퍼 추가
        if (window.innerWidth <= 768) {
            const scrollWrapper = document.createElement('div');
            scrollWrapper.style.overflowX = 'auto';
            scrollWrapper.style.marginBottom = '1rem';
            
            table.parentNode.insertBefore(scrollWrapper, table);
            scrollWrapper.appendChild(table);
            
            // 스크롤 인디케이터 추가
            const indicator = document.createElement('div');
            indicator.textContent = '← 좌우로 스크롤하여 더 보기 →';
            indicator.style.textAlign = 'center';
            indicator.style.fontSize = '0.875rem';
            indicator.style.color = '#6b7280';
            indicator.style.marginBottom = '0.5rem';
            scrollWrapper.parentNode.insertBefore(indicator, scrollWrapper);
        }
    });
}

// 번호 애니메이션
function initNumberAnimation() {
    const processCards = document.querySelectorAll('.process-card');
    
    processCards.forEach((card, index) => {
        const number = card.querySelector('.process-number');
        if (number) {
            number.style.opacity = '0';
            number.style.transform = 'scale(0)';
            
            setTimeout(() => {
                number.style.transition = 'all 0.5s ease';
                number.style.opacity = '1';
                number.style.transform = 'scale(1)';
            }, index * 200);
        }
    });
}

// 부드러운 스크롤 함수
function smoothScrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.getBoundingClientTop() + window.pageYOffset - 100;
        
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// 세부 정보 토글
function toggleDetails(element, isExpanded) {
    const details = element.querySelector('.certificate-details');
    if (!details) return;
    
    if (isExpanded) {
        details.style.maxHeight = details.scrollHeight + 'px';
        element.classList.add('expanded');
    } else {
        details.style.maxHeight = '180px';
        element.classList.remove('expanded');
    }
}

// 유틸리티: 요소의 가시성 확인
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    return rect.top >= 0 && rect.top <= windowHeight * 0.75;
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