// course-info.js - 교육 과정 안내 페이지 전용 JavaScript (수정됨)
console.log('=== course-info.js 파일 로드됨 ===');

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== course-info.js 초기화 준비, 현재 상태:', document.readyState);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initCoursePage();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initCoursePage();
    }
}

// 초기화 시작
initializeWhenReady();

// 페이지 초기화 함수 수정
function initCoursePage() {
    console.log('=== initCoursePage 실행 시작 ===');
    
    // 스크롤 기반 애니메이션 초기화 (조건부로 실행)
    if (window.innerWidth > 768) {
        initScrollAnimations();
    }
    
    // FAQ 토글 기능
    initFAQToggles();
    
    // 스크롤 스파이 기능
    initScrollSpy();
    
    // 부드러운 스크롤 기능
    initSmoothScroll();
    
    // 교육 일정 테이블 개선
    initScheduleTable();
    
    // 교육 카드 호버 효과
    initCourseCardEffects();
    
    // 탭 활성화 처리
    initNavigationTabs();
    
    console.log('=== initCoursePage 완료 ===');
}

// 스크롤 애니메이션 초기화 (수정됨 - 문제 해결)
function initScrollAnimations() {
    // 모바일에서는 애니메이션 비활성화
    if (window.innerWidth <= 768) {
        console.log('모바일 화면에서 스크롤 애니메이션 비활성화');
        return;
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // fade-out 클래스 제거하고 fade-in 클래스 추가
                entry.target.classList.remove('fade-out');
                entry.target.classList.add('fade-in');
                
                // 카운터 애니메이션 처리
                if (entry.target.classList.contains('statistics-item')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // 관찰할 요소들 등록 (선택적으로만)
    const animateElements = document.querySelectorAll(
        '.education-feature-card, .course-card, .process-step, .benefit-card, .statistics-item'
    );
    
    // 애니메이션 요소가 존재할 때만 적용
    if (animateElements.length > 0) {
        animateElements.forEach(el => {
            // 처음에는 살짝 투명하게만 설정 (완전히 숨기지 않음)
            el.style.opacity = '0.3';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// FAQ 토글 기능 (개선됨)
function initFAQToggles() {
    console.log('=== initFAQToggles 시작 ===');
    const faqButtons = document.querySelectorAll('.faq-button');
    console.log('FAQ 버튼 개수:', faqButtons.length);
    
    if (faqButtons.length === 0) {
        console.log('FAQ 버튼이 없습니다. 건너뜀.');
        return;
    }
    
    faqButtons.forEach((button, index) => {
        console.log(`FAQ 버튼 ${index + 1} 이벤트 등록`);
        
        button.addEventListener('click', function() {
            console.log('FAQ 버튼 클릭됨:', index + 1);
            
            const faqItem = button.closest('.faq-item');
            const faqAnswer = faqItem.querySelector('.faq-answer');
            const icon = button.querySelector('svg');
            
            // 현재 FAQ가 열려있는지 확인
            const isCurrentlyOpen = faqAnswer.classList.contains('show');
            
            // 다른 열린 FAQ 닫기
            faqButtons.forEach(otherButton => {
                if (otherButton !== button) {
                    const otherItem = otherButton.closest('.faq-item');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    const otherIcon = otherButton.querySelector('svg');
                    
                    otherItem.classList.remove('active');
                    otherAnswer.classList.remove('show');
                    if (otherIcon) {
                        otherIcon.style.transform = 'rotate(0deg)';
                    }
                }
            });
            
            // 현재 FAQ 토글 (이미 열려있었다면 닫기)
            if (!isCurrentlyOpen) {
                faqItem.classList.add('active');
                faqAnswer.classList.add('show');
                
                // 아이콘 회전
                if (icon) {
                    icon.style.transform = 'rotate(180deg)';
                }
                console.log('FAQ 답변 표시됨');
            } else {
                faqItem.classList.remove('active');
                faqAnswer.classList.remove('show');
                
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
                console.log('FAQ 답변 숨겨짐');
            }
        });
    });
    
    console.log('=== initFAQToggles 완료 ===');
}

// 스크롤 스파이 기능 (개선됨)
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navTabs = document.querySelectorAll('.navigation-tabs .tab-item');
    
    if (sections.length === 0 || navTabs.length === 0) {
        console.log('스크롤 스파이 대상 요소가 없습니다.');
        return;
    }
    
    // 스크롤 이벤트 최적화 (throttle)
    let ticking = false;
    
    function updateActiveTab() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        // 현재 섹션에 해당하는 탭 활성화
        navTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('href') === `#${current}`) {
                tab.classList.add('active');
            }
        });
        
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateActiveTab);
            ticking = true;
        }
    });
}

// 부드러운 스크롤 기능 (개선됨)
function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = link.getAttribute('href');
            
            // 빈 해시나 페이지 최상단 링크는 건너뜀
            if (href === '#' || href === '#top') {
                return;
            }
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 100; // 헤더 높이 고려
                
                window.scrollTo({
                    top: Math.max(0, offsetTop),
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 교육 일정 테이블 개선 (수정됨)
function initScheduleTable() {
    const scheduleRows = document.querySelectorAll('.schedule-row');
    
    if (scheduleRows.length === 0) {
        console.log('교육 일정 테이블이 없습니다. 건너뜀.');
        return;
    }
    
    scheduleRows.forEach(row => {
        // 호버 효과
        row.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) { // 데스크톱에서만
                row.style.transform = 'translateX(4px)';
                row.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                row.style.transition = 'all 0.3s ease';
            }
        });
        
        row.addEventListener('mouseleave', function() {
            row.style.transform = 'translateX(0)';
            row.style.boxShadow = 'none';
        });
    });
    
    // 모바일에서 테이블 수평 스크롤 안내
    const tableWrapper = document.querySelector('.schedule-table-wrapper');
    if (tableWrapper && window.innerWidth < 768) {
        addScrollHint(tableWrapper);
    }
}

// 교육 카드 호버 효과 (개선됨)
function initCourseCardEffects() {
    const courseCards = document.querySelectorAll('.course-card');
    
    if (courseCards.length === 0) {
        console.log('교육 카드가 없습니다. 건너뜀.');
        return;
    }
    
    courseCards.forEach(card => {
        const image = card.querySelector('.course-image img');
        
        // 데스크톱에서만 호버 효과 적용
        if (window.innerWidth > 768) {
            card.addEventListener('mouseenter', function() {
                // 이미지 줌 효과
                if (image) {
                    image.style.transform = 'scale(1.1)';
                    image.style.transition = 'transform 0.3s ease';
                }
                
                // 카드 전체 효과
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1)';
                card.style.transition = 'all 0.3s ease';
            });
            
            card.addEventListener('mouseleave', function() {
                if (image) {
                    image.style.transform = 'scale(1)';
                }
                
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
            });
        }
        
        // 교육 신청 버튼 효과 (모든 화면에서)
        const applyBtns = card.querySelectorAll('.btn-primary, .apply-btn');
        applyBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                // 클릭 애니메이션
                btn.style.transform = 'scale(0.95)';
                btn.style.transition = 'transform 0.15s ease';
                
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 150);
            });
        });
    });
}

// 탭 활성화 처리 (개선됨)
function initNavigationTabs() {
    // 현재 페이지에 해당하는 탭 활성화
    const currentPath = window.location.pathname;
    const tabs = document.querySelectorAll('.navigation-tabs .tab-item');
    
    // 기본적으로 모든 탭에서 active 클래스 제거
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // course-info 페이지인 경우 첫 번째 탭 활성화
    if (currentPath.includes('course-info')) {
        const firstTab = document.querySelector('.navigation-tabs .tab-item');
        if (firstTab) {
            firstTab.classList.add('active');
        }
    }
}

// 카운터 애니메이션 (안전하게 개선됨)
function animateCounter(element) {
    const target = parseInt(element.dataset.count) || 0;
    if (target === 0) return;
    
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const counter = () => {
        current += step;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(counter);
        } else {
            element.textContent = target;
        }
    };
    
    counter();
}

// 스크롤 힌트 추가 (모바일) - 개선됨
function addScrollHint(wrapper) {
    // 이미 힌트가 있는지 확인
    if (wrapper.querySelector('.scroll-hint')) {
        return;
    }
    
    const hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.textContent = '← 좌우로 스크롤하세요 →';
    hint.style.cssText = `
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        color: #666;
        animation: blink 2s infinite;
        z-index: 10;
    `;
    
    wrapper.style.position = 'relative';
    wrapper.appendChild(hint);
    
    // 스크롤 시 힌트 숨기기
    let scrollTimeout;
    wrapper.addEventListener('scroll', () => {
        hint.style.opacity = '0.3';
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            hint.style.opacity = '1';
        }, 1000);
    });
}

// 에러 처리 개선
window.addEventListener('error', (e) => {
    console.error('Course info page error:', e);
    // 에러 발생해도 페이지는 계속 작동하도록
});

// 반응형 처리 개선
window.addEventListener('resize', () => {
    // 디바운스를 위한 타이머
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        // 모바일 테이블 스크롤 힌트 재설정
        const tableWrapper = document.querySelector('.schedule-table-wrapper');
        if (tableWrapper) {
            const existingHint = tableWrapper.querySelector('.scroll-hint');
            if (window.innerWidth >= 768 && existingHint) {
                existingHint.remove();
            } else if (window.innerWidth < 768 && !existingHint) {
                addScrollHint(tableWrapper);
            }
        }
        
        // 스크롤 애니메이션 재설정
        if (window.innerWidth <= 768) {
            // 모바일에서는 모든 애니메이션 요소를 보이게
            const animateElements = document.querySelectorAll('.fade-out');
            animateElements.forEach(el => {
                el.classList.remove('fade-out');
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        }
    }, 250);
});

// 접근성 개선
function enhanceAccessibility() {
    // 키보드 네비게이션 지원
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    
    interactiveElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '2px solid #3b82f6';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
}

// 페이지 로드 완료 후 실행
window.addEventListener('load', () => {
    enhanceAccessibility();
    
    // 스크롤 위치 복원
    const savedPosition = sessionStorage.getItem('courseInfoScrollPosition');
    if (savedPosition) {
        window.scrollTo(0, parseInt(savedPosition));
        sessionStorage.removeItem('courseInfoScrollPosition');
    }
});

// 페이지 떠날 때 스크롤 위치 저장
window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('courseInfoScrollPosition', window.scrollY);
});

// 토스트 메시지 표시 함수 개선
function showToast(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    const colors = {
        info: '#3b82f6',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(toast);
    
    // 애니메이션
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // 자동 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// 교육과정 페이지 특화 기능들 개선
const CourseInfoPage = {
    // 교육 신청 관련 기능
    handleCourseApplication: function(courseId) {
        // 로그인 체크
        if (!this.isLoggedIn()) {
            this.showLoginModal();
            return;
        }
        
        // 교육 신청 페이지로 이동
        window.location.href = window.adjustPath(`pages/education/course-application.html?course=${courseId}`);
    },
    
    // 로그인 상태 확인
    isLoggedIn: function() {
        // Firebase 로그인 상태 확인
        if (window.dhcFirebase && window.dhcFirebase.getCurrentUser) {
            return !!window.dhcFirebase.getCurrentUser();
        }
        // 임시 fallback
        return !!sessionStorage.getItem('user');
    },
    
    // 로그인 모달 표시
    showLoginModal: function() {
        showToast('로그인이 필요한 서비스입니다.', 'warning');
        setTimeout(() => {
            window.location.href = window.adjustPath('pages/auth/login.html');
        }, 2000);
    }
};

// 전역 객체로 노출
window.CourseInfoPage = CourseInfoPage;

console.log('=== course-info.js 로드 완료 ===');