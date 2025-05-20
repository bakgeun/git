// course-info.js - 교육 과정 안내 페이지 전용 JavaScript
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
    
    // 스크롤 기반 애니메이션 초기화
    initScrollAnimations();
    
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
                
                // 카운터 애니메이션 처리
                if (entry.target.classList.contains('statistics-item')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // 관찰할 요소들 등록
    const animateElements = document.querySelectorAll(
        '.education-feature-card, .course-card, .process-step, .benefit-card, .statistics-item'
    );
    
    animateElements.forEach(el => {
        el.classList.add('fade-out');
        observer.observe(el);
    });
}

// FAQ 토글 기능
function initFAQToggles() {
    console.log('=== initFAQToggles 시작 ===');
    const faqButtons = document.querySelectorAll('.faq-button');
    console.log('FAQ 버튼 개수:', faqButtons.length);
    
    if (faqButtons.length === 0) {
        console.warn('FAQ 버튼을 찾을 수 없습니다!');
        return;
    }
    
    faqButtons.forEach((button, index) => {
        console.log(`FAQ 버튼 ${index + 1} 이벤트 등록`);
        
        button.addEventListener('click', function() {
            console.log('FAQ 버튼 클릭됨:', index + 1);
            
            const faqItem = button.closest('.faq-item');
            const faqAnswer = faqItem.querySelector('.faq-answer');
            const icon = button.querySelector('svg');
            
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
            
            // 현재 FAQ 토글
            faqItem.classList.toggle('active');
            faqAnswer.classList.toggle('show');
            
            // 아이콘 회전
            if (icon) {
                if (faqAnswer.classList.contains('show')) {
                    icon.style.transform = 'rotate(180deg)';
                    console.log('FAQ 답변 표시됨');
                } else {
                    icon.style.transform = 'rotate(0deg)';
                    console.log('FAQ 답변 숨겨짐');
                }
            }
        });
    });
    
    console.log('=== initFAQToggles 완료 ===');
}

// 스크롤 스파이 기능
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navTabs = document.querySelectorAll('.navigation-tabs .tab-item');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop - 60) {
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
    });
}

// 부드러운 스크롤 기능
function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 교육 일정 테이블 개선
function initScheduleTable() {
    const scheduleRows = document.querySelectorAll('.schedule-row');
    
    scheduleRows.forEach(row => {
        // 호버 효과
        row.addEventListener('mouseenter', function() {
            row.style.transform = 'translateX(4px)';
            row.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
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

// 교육 카드 호버 효과
function initCourseCardEffects() {
    const courseCards = document.querySelectorAll('.course-card');
    
    courseCards.forEach(card => {
        const image = card.querySelector('.course-image img');
        
        card.addEventListener('mouseenter', function() {
            // 이미지 줌 효과
            if (image) {
                image.style.transform = 'scale(1.1)';
            }
            
            // 카드 전체 효과
            card.style.transform = 'translateY(-8px)';
            card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            if (image) {
                image.style.transform = 'scale(1)';
            }
            
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
        });
        
        // 교육 신청 버튼 효과
        const applyBtn = card.querySelector('.btn-primary');
        if (applyBtn) {
            applyBtn.addEventListener('click', function(e) {
                // 클릭 애니메이션
                applyBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    applyBtn.style.transform = 'scale(1)';
                }, 150);
            });
        }
    });
}

// 탭 활성화 처리
function initNavigationTabs() {
    // 현재 페이지에 해당하는 탭 활성화
    const currentPath = window.location.pathname;
    const tabs = document.querySelectorAll('.navigation-tabs .tab-item');
    
    tabs.forEach(tab => {
        const href = tab.getAttribute('href');
        if (href && currentPath.includes(href)) {
            tab.classList.add('active');
        }
    });
}

// 카운터 애니메이션
function animateCounter(element) {
    const target = parseInt(element.dataset.count) || 0;
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

// 스크롤 힌트 추가 (모바일)
function addScrollHint(wrapper) {
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
    `;
    
    wrapper.style.position = 'relative';
    wrapper.appendChild(hint);
    
    // 스크롤 시 힌트 숨기기
    let scrollTimeout;
    wrapper.addEventListener('scroll', () => {
        hint.style.opacity = '0';
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            hint.style.opacity = '1';
        }, 1000);
    });
}

// 교육 필터링 기능 (향후 확장용)
function filterCourses(category) {
    const courseCards = document.querySelectorAll('.course-card');
    
    courseCards.forEach(card => {
        const courseCategory = card.querySelector('.course-category').textContent;
        
        if (category === 'all' || courseCategory.includes(category)) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
        }
    });
}

// 교육 검색 기능 (향후 확장용)
function searchCourses(keyword) {
    const courseCards = document.querySelectorAll('.course-card');
    
    courseCards.forEach(card => {
        const title = card.querySelector('.course-title').textContent.toLowerCase();
        const description = card.querySelector('.course-description').textContent.toLowerCase();
        
        if (title.includes(keyword.toLowerCase()) || description.includes(keyword.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 모달 기능 (교육 상세 정보)
function openCourseModal(courseId) {
    // 향후 교육 상세 정보 모달을 위한 함수
    console.log('Opening modal for course:', courseId);
}

// 페이지 로딩 진행률 표시
function showLoadingProgress() {
    const loadingBar = document.createElement('div');
    loadingBar.className = 'loading-bar';
    loadingBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #10b981);
        z-index: 9999;
        transition: width 0.3s ease;
    `;
    
    document.body.appendChild(loadingBar);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        loadingBar.style.width = Math.min(progress, 100) + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadingBar.remove();
            }, 500);
        }
    }, 50);
}

// 에러 처리
window.addEventListener('error', (e) => {
    console.error('Course info page error:', e);
    // 에러 발생 시 사용자에게 알리는 토스트 메시지
    showToast('페이지를 불러오는 중 오류가 발생했습니다.', 'error');
});

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    const colors = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500'
    };
    
    toast.classList.add(colors[type]);
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
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
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 페이지 방문 통계 (향후 확장용)
function trackPageVisit() {
    // GA4나 다른 분석 도구와 연동 가능
    console.log('Course info page visited');
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', trackPageVisit);

// 반응형 처리
window.addEventListener('resize', () => {
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
window.addEventListener('load', enhanceAccessibility);

// PWA 설치 프롬프트 (향후 확장용)
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    // PWA 설치 버튼 표시
    showPWAInstallPrompt();
});

function showPWAInstallPrompt() {
    // PWA 설치 배너 표시
    console.log('PWA install prompt available');
}

// 오프라인 감지
window.addEventListener('online', () => {
    showToast('인터넷 연결이 복구되었습니다.', 'success');
});

window.addEventListener('offline', () => {
    showToast('인터넷 연결이 끊어졌습니다.', 'warning');
});

// 페이지 떠날 때 정보 저장 (향후 확장용)
window.addEventListener('beforeunload', (e) => {
    // 페이지 방문 시간 저장 등
    console.log('Page unloading...');
});

// 코스 관련 이벤트 추적
function trackCourseInteraction(action, courseId) {
    // Google Analytics 또는 기타 분석 도구와 연동
    console.log(`Course interaction: ${action} - ${courseId}`);
}

// 사용자 스크롤 동작 추적
function trackScrollBehavior() {
    let maxScroll = 0;
    
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        maxScroll = Math.max(maxScroll, scrollPercent);
    });
    
    window.addEventListener('beforeunload', () => {
        console.log(`Max scroll reached: ${maxScroll.toFixed(2)}%`);
    });
}

// 스크롤 동작 추적 시작
document.addEventListener('DOMContentLoaded', trackScrollBehavior);

// 이미지 지연 로딩 (Intersection Observer 사용)
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// 페이지 성능 측정
function measurePerformance() {
    window.addEventListener('load', () => {
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }
    });
}

// 페이지 초기화 완료
document.addEventListener('DOMContentLoaded', () => {
    initLazyLoading();
    measurePerformance();
});

// 키보드 단축키 지원
document.addEventListener('keydown', (e) => {
    // Ctrl + K로 검색 모달 열기 (향후 구현)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        console.log('Search shortcut pressed');
    }
    
    // ESC로 모달 닫기
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
    }
});

// 테마 토글 (다크모드) 지원 준비
function initThemeToggle() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 시스템 테마 변경 감지
    prefersDark.addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });
    
    // 초기 테마 설정
    if (prefersDark.matches) {
        document.body.classList.add('dark-theme');
    }
}

// 페이지 로드 시 테마 초기화
document.addEventListener('DOMContentLoaded', initThemeToggle);

// 웹 폰트 로딩 최적화
function optimizeFontLoading() {
    if ('fonts' in document) {
        // Noto Sans KR 폰트 프리로드
        const fontFaces = [
            new FontFace('Noto Sans KR', 'url(/fonts/NotoSansKR-Regular.woff2)', {
                weight: '400'
            }),
            new FontFace('Noto Sans KR', 'url(/fonts/NotoSansKR-Bold.woff2)', {
                weight: '700'
            })
        ];
        
        fontFaces.forEach(font => {
            font.load().then(() => {
                document.fonts.add(font);
            });
        });
    }
}

// 폰트 로딩 최적화 실행
document.addEventListener('DOMContentLoaded', optimizeFontLoading);

// 마우스 이동 추적 (UX 분석용)
function trackMouseMovement() {
    let mouseMovements = [];
    
    document.addEventListener('mousemove', (e) => {
        mouseMovements.push({
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
        });
        
        // 메모리 사용량 제한을 위해 100개만 저장
        if (mouseMovements.length > 100) {
            mouseMovements.shift();
        }
    });
}

// 사용자 인터랙션 시작
// trackMouseMovement(); // 필요시 주석 해제

// 현재 시간 표시 및 업데이트
function displayCurrentTime() {
    const timeElement = document.querySelector('.current-time');
    if (timeElement) {
        const updateTime = () => {
            const now = new Date();
            timeElement.textContent = now.toLocaleString('ko-KR');
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }
}

// 시간 표시 초기화
document.addEventListener('DOMContentLoaded', displayCurrentTime);

// 페이지 스크롤 위치 저장 및 복원
function saveScrollPosition() {
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('scrollPosition', window.scrollY);
    });
    
    window.addEventListener('load', () => {
        const savedPosition = sessionStorage.getItem('scrollPosition');
        if (savedPosition) {
            window.scrollTo(0, parseInt(savedPosition));
            sessionStorage.removeItem('scrollPosition');
        }
    });
}

// 스크롤 위치 저장 시작
saveScrollPosition();

// 교육과정 페이지 특화 기능들
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
        // Firebase 로그인 상태 확인 (임시)
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