/**
 * 메인 JavaScript 파일
 * 모든 페이지에서 공통으로 사용되는 기능을 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // 전역 네임스페이스 생성
    window.dhcApp = {
        // 시작 함수
        init: function() {
            this.setupEventListeners();
            this.detectColorScheme();
            this.setupTooltips();
            this.setupModals();
            this.setupMobileMenu();
            this.setupScrollHeader();
            this.setupFaqAccordion();
            this.setupExamTabs();
            this.setupCourseSelector();
            this.setupPaymentCalculator();
            this.setupAgreementCheckboxes();
        },
        
        // 이벤트 리스너 설정
        setupEventListeners: function() {
            // 문서 클릭 이벤트
            document.addEventListener('click', function(e) {
                // 드롭다운 외부 클릭 시 닫기
                const dropdowns = document.querySelectorAll('.dropdown-content');
                if (dropdowns.length) {
                    dropdowns.forEach(dropdown => {
                        if (!e.target.closest('.dropdown') && !dropdown.classList.contains('hidden')) {
                            dropdown.classList.add('hidden');
                        }
                    });
                }
            });
            
            // 스크롤 이벤트
            window.addEventListener('scroll', this.handleScroll.bind(this));
            
            // 페이지 이탈 방지 (필요한 경우)
            window.addEventListener('beforeunload', function(e) {
                const needsConfirmation = document.querySelector('form.needs-confirmation.dirty');
                if (needsConfirmation) {
                    e.preventDefault();
                    e.returnValue = '작성 중인 내용이 있습니다. 페이지를 나가시겠습니까?';
                    return e.returnValue;
                }
            });
        },
        
        // 스크롤 이벤트 처리
        handleScroll: function() {
            // 스크롤 위치에 따른 요소 애니메이션 등
            this.animateOnScroll();
            
            // 스크롤 업 버튼 표시 여부
            this.toggleScrollUpButton();
            
            // 헤더 고정 처리
            this.handleScrollHeader();
        },
        
        // 스크롤 애니메이션 처리
        animateOnScroll: function() {
            const animateElements = document.querySelectorAll('.animate-on-scroll');
            const windowHeight = window.innerHeight;
            
            animateElements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const elementVisible = 150;
                
                if (elementTop < windowHeight - elementVisible) {
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            });
        },
        
        // 스크롤 업 버튼 토글
        toggleScrollUpButton: function() {
            const scrollUpButton = document.getElementById('scroll-up-button');
            
            if (scrollUpButton) {
                if (window.scrollY > 300) {
                    scrollUpButton.classList.remove('hidden');
                } else {
                    scrollUpButton.classList.add('hidden');
                }
            }
        },
        
        // 스크롤 업 기능 실행
        scrollToTop: function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },
        
        // 컬러 스킴 감지 (다크 모드 등)
        detectColorScheme: function() {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const savedTheme = localStorage.getItem('theme');
            
            // 저장된 테마가 있으면 적용
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            } else if (darkModeMediaQuery.matches) {
                // 시스템 설정이 다크 모드인 경우
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            
            // 테마 변경 감지
            darkModeMediaQuery.addEventListener('change', e => {
                if (!localStorage.getItem('theme')) {
                    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                }
            });
        },
        
        // 테마 전환
        toggleTheme: function() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        },
        
        // 툴팁 설정
        setupTooltips: function() {
            const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
            
            tooltipTriggers.forEach(trigger => {
                trigger.addEventListener('mouseenter', function() {
                    const tooltipText = this.getAttribute('data-tooltip');
                    
                    if (!tooltipText) return;
                    
                    const tooltip = document.createElement('div');
                    tooltip.className = 'tooltip';
                    tooltip.textContent = tooltipText;
                    
                    document.body.appendChild(tooltip);
                    
                    const triggerRect = this.getBoundingClientRect();
                    const tooltipRect = tooltip.getBoundingClientRect();
                    
                    // 툴팁 위치 설정
                    tooltip.style.left = `${triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)}px`;
                    tooltip.style.top = `${triggerRect.top - tooltipRect.height - 10}px`;
                    
                    // 툴팁 표시
                    setTimeout(() => tooltip.classList.add('visible'), 10);
                    
                    this.addEventListener('mouseleave', function onMouseLeave() {
                        tooltip.classList.remove('visible');
                        
                        // 툴팁 제거
                        setTimeout(() => {
                            if (tooltip.parentNode) {
                                tooltip.parentNode.removeChild(tooltip);
                            }
                        }, 200);
                        
                        this.removeEventListener('mouseleave', onMouseLeave);
                    });
                });
            });
        },
        
        // 모달 설정
        setupModals: function() {
            // 모달 열기 버튼
            const modalTriggers = document.querySelectorAll('[data-modal-target]');
            
            modalTriggers.forEach(trigger => {
                trigger.addEventListener('click', function() {
                    const modalId = this.getAttribute('data-modal-target');
                    const modal = document.getElementById(modalId);
                    
                    if (modal) {
                        modal.classList.add('show');
                        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
                    }
                });
            });
            
            // 모달 닫기 버튼
            const modalCloseButtons = document.querySelectorAll('[data-modal-close]');
            
            modalCloseButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    
                    if (modal) {
                        modal.classList.remove('show');
                        document.body.style.overflow = ''; // 배경 스크롤 복원
                    }
                });
            });
            
            // 모달 외부 클릭 시 닫기
            const modals = document.querySelectorAll('.modal');
            
            modals.forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.classList.remove('show');
                        document.body.style.overflow = ''; // 배경 스크롤 복원
                    }
                });
            });
            
            // ESC 키로 모달 닫기
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    const visibleModal = document.querySelector('.modal.show');
                    
                    if (visibleModal) {
                        visibleModal.classList.remove('show');
                        document.body.style.overflow = ''; // 배경 스크롤 복원
                    }
                }
            });
        },
        
        // 폼 유효성 검사
        validateForm: function(formElement) {
            const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                // 기존 에러 메시지 제거
                const existingError = input.nextElementSibling;
                if (existingError && existingError.classList.contains('error-message')) {
                    existingError.remove();
                }
                
                // 입력값 유효성 검사
                if (!input.value.trim()) {
                    isValid = false;
                    this.showInputError(input, '이 필드는 필수입니다.');
                } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
                    isValid = false;
                    this.showInputError(input, '유효한 이메일 주소를 입력하세요.');
                } else if (input.type === 'tel' && !this.isValidPhone(input.value)) {
                    isValid = false;
                    this.showInputError(input, '유효한 전화번호를 입력하세요.');
                }
            });
            
            return isValid;
        },
        
        // 입력 필드 에러 표시
        showInputError: function(inputElement, message) {
            inputElement.classList.add('error');
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message text-red-500 text-sm mt-1';
            errorMessage.textContent = message;
            
            inputElement.parentNode.insertBefore(errorMessage, inputElement.nextSibling);
        },
        
        // 이메일 유효성 검사
        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        // 전화번호 유효성 검사
        isValidPhone: function(phone) {
            const phoneRegex = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/;
            return phoneRegex.test(phone);
        },
        
        // 알림 메시지 표시
        showNotification: function(message, type = 'info', duration = 3000) {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // 알림 표시 애니메이션
            setTimeout(() => notification.classList.add('show'), 10);
            
            // 지정 시간 후 알림 제거
            setTimeout(() => {
                notification.classList.remove('show');
                
                // 애니메이션 완료 후 요소 제거
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
        },
        
        // 서버 시간과 클라이언트 시간 차이 계산 (필요한 경우)
        calculateTimeOffset: function() {
            // 서버 시간 API 호출 (예시)
            fetch('/api/current-time')
                .then(response => response.json())
                .then(data => {
                    const serverTime = new Date(data.serverTime).getTime();
                    const clientTime = new Date().getTime();
                    const offset = serverTime - clientTime;
                    
                    // 시간 차이 저장
                    localStorage.setItem('timeOffset', offset);
                })
                .catch(error => {
                    console.error('서버 시간 동기화 오류:', error);
                });
        },
        
        // 현재 서버 시간 가져오기 (필요한 경우)
        getServerTime: function() {
            const offset = localStorage.getItem('timeOffset') || 0;
            return new Date(new Date().getTime() + parseInt(offset));
        },
        
        // URL 파라미터 가져오기
        getUrlParameter: function(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        },
        
        // 날짜 포맷팅
        formatDate: function(date, format = 'YYYY-MM-DD') {
            const d = new Date(date);
            
            if (isNaN(d.getTime())) {
                return '';
            }
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        },
        
        // 숫자 포맷팅 (천 단위 콤마 등)
        formatNumber: function(number, decimals = 0) {
            return number.toLocaleString('ko-KR', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        },
        
        // 모바일 메뉴 설정
        setupMobileMenu: function() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener('click', function() {
                    mobileMenu.classList.toggle('hidden');
                    
                    // 모바일 메뉴가 처음 열릴 때 동적으로 내용 생성
                    if (!mobileMenu.querySelector('ul')) {
                        const mobileMenuContent = document.createElement('div');
                        mobileMenuContent.className = 'container mx-auto px-4';
                        
                        // 메인 내비게이션에서 메뉴 항목 복제
                        const mainNav = document.querySelector('.main-nav');
                        if (mainNav) {
                            const menuItems = mainNav.querySelectorAll('ul > li');
                            const mobileNavList = document.createElement('ul');
                            mobileNavList.className = 'space-y-2';
                            
                            menuItems.forEach(item => {
                                // 메인 메뉴 항목
                                const mainLink = item.querySelector('a');
                                const newItem = document.createElement('li');
                                newItem.className = 'py-2 border-b border-gray-200';
                                
                                const newLink = document.createElement('a');
                                newLink.href = mainLink.href;
                                newLink.textContent = mainLink.textContent;
                                newLink.className = 'block text-lg font-medium';
                                
                                newItem.appendChild(newLink);
                                
                                // 서브메뉴가 있는 경우
                                const submenu = item.querySelector('.submenu');
                                if (submenu) {
                                    const subItems = submenu.querySelectorAll('li');
                                    const subList = document.createElement('ul');
                                    subList.className = 'pl-4 mt-2 space-y-1';
                                    
                                    subItems.forEach(subItem => {
                                        const subLink = subItem.querySelector('a');
                                        const newSubItem = document.createElement('li');
                                        
                                        const newSubLink = document.createElement('a');
                                        newSubLink.href = subLink.href;
                                        newSubLink.textContent = subLink.textContent;
                                        newSubLink.className = 'block py-1 text-gray-600';
                                        
                                        newSubItem.appendChild(newSubLink);
                                        subList.appendChild(newSubItem);
                                    });
                                    
                                    newItem.appendChild(subList);
                                    
                                    // 토글 기능 추가
                                    newLink.addEventListener('click', function(e) {
                                        e.preventDefault();
                                        subList.classList.toggle('hidden');
                                    });
                                }
                                
                                mobileNavList.appendChild(newItem);
                            });
                            
                            mobileMenuContent.appendChild(mobileNavList);
                        }
                        
                        // 로그인/회원가입 버튼 추가
                        const authButtons = document.createElement('div');
                        authButtons.className = 'mt-4 flex space-x-4';
                        
                        const loginBtn = document.createElement('a');
                        loginBtn.href = '../auth/login.html';
                        loginBtn.className = 'block w-1/2 text-center py-2 border border-gray-300 rounded-md text-gray-700';
                        loginBtn.textContent = '로그인';
                        
                        const signupBtn = document.createElement('a');
                        signupBtn.href = '../auth/signup.html';
                        signupBtn.className = 'block w-1/2 text-center py-2 bg-blue-600 text-white rounded-md';
                        signupBtn.textContent = '회원가입';
                        
                        authButtons.appendChild(loginBtn);
                        authButtons.appendChild(signupBtn);
                        mobileMenuContent.appendChild(authButtons);
                        
                        mobileMenu.innerHTML = '';
                        mobileMenu.appendChild(mobileMenuContent);
                    }
                });
            }
        },
        
        // 스크롤 시 헤더 고정 기능 설정
        setupScrollHeader: function() {
            const header = document.getElementById('main-header');
            if (header) {
                window.addEventListener('scroll', this.handleScrollHeader.bind(this));
            }
        },
        
        // 스크롤 시 헤더 고정 처리
        handleScrollHeader: function() {
            const header = document.getElementById('main-header');
            if (!header) return;
            
            const currentScrollPosition = window.scrollY;
            
            if (currentScrollPosition > 100) {
                header.classList.add('fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'shadow-md', 'animate-slideDown');
                document.body.style.paddingTop = header.offsetHeight + 'px';
            } else {
                header.classList.remove('fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'shadow-md', 'animate-slideDown');
                document.body.style.paddingTop = '0';
            }
        },
        
        // FAQ 아코디언 기능 설정
        setupFaqAccordion: function() {
            const faqItems = document.querySelectorAll('.faq-item');
            faqItems.forEach(item => {
                const question = item.querySelector('h4');
                const answer = item.querySelector('p');
                
                if (question && answer) {
                    question.addEventListener('click', function() {
                        // 다른 모든 답변 닫기
                        faqItems.forEach(otherItem => {
                            if (otherItem !== item) {
                                const otherAnswer = otherItem.querySelector('p');
                                if (otherAnswer) {
                                    otherAnswer.classList.add('hidden');
                                }
                            }
                        });
                        
                        // 현재 답변 토글
                        answer.classList.toggle('hidden');
                    });
                }
            });
        },
        
        // 시험 안내 페이지 탭 기능 설정
        setupExamTabs: function() {
            const examTabs = document.querySelectorAll('.exam-tab');
            examTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // 모든 탭 비활성화
                    examTabs.forEach(t => {
                        t.classList.remove('bg-blue-600', 'text-white');
                        t.classList.add('bg-gray-100', 'text-gray-800');
                    });
                    
                    // 클릭한 탭 활성화
                    this.classList.remove('bg-gray-100', 'text-gray-800');
                    this.classList.add('bg-blue-600', 'text-white');
                    
                    // 모든 콘텐츠 숨기기
                    const contentPanels = document.querySelectorAll('.exam-content');
                    contentPanels.forEach(panel => {
                        panel.classList.add('hidden');
                    });
                    
                    // 선택한 탭에 해당하는 콘텐츠 표시
                    const targetContent = document.getElementById(this.dataset.target);
                    if (targetContent) {
                        targetContent.classList.remove('hidden');
                    }
                });
            });
        },
        
        // 교육 과정 선택 기능 설정
        setupCourseSelector: function() {
            const courseSelect = document.getElementById('course-select');
            if (courseSelect) {
                courseSelect.addEventListener('change', function() {
                    updateCourseInfo(this.value);
                });
                
                // URL 파라미터에서 과정 정보 가져오기
                const urlParams = new URLSearchParams(window.location.search);
                const courseParam = urlParams.get('course');
                
                if (courseParam) {
                    courseSelect.value = courseParam;
                    this.updateCourseInfo(courseParam);
                } else if (courseSelect.value) {
                    this.updateCourseInfo(courseSelect.value);
                }
            }
        },
        
        // 과정 정보 업데이트
        updateCourseInfo: function(courseId) {
            const courseData = {
                'health-1': {
                    title: '건강운동처방사 과정 1기',
                    period: '2025.06.03 ~ 2025.08.23 (12주)',
                    price: '1,200,000원',
                    method: '블렌디드 과정 (온라인+오프라인)',
                    capacity: '30명',
                    location: '서울 강남 본원',
                    description: '질환별 맞춤형 운동 프로그램을 설계하고 지도할 수 있는 전문가 양성 과정입니다.'
                },
                'rehab-1': {
                    title: '운동재활전문가 과정 1기',
                    period: '2025.07.01 ~ 2025.10.18 (16주)',
                    price: '1,500,000원',
                    method: '블렌디드 과정 (온라인+오프라인)',
                    capacity: '24명',
                    location: '서울 강남 본원',
                    description: '부상 및 질환 이후 신체 기능 회복을 위한 운동재활 프로그램을 설계하고 지도할 수 있는 전문가 양성 과정입니다.'
                },
                'pilates-2': {
                    title: '필라테스 전문가 과정 2기',
                    period: '2025.05.20 ~ 2025.08.10 (12주)',
                    price: '1,300,000원',
                    method: '오프라인 중심 (실습 위주)',
                    capacity: '20명',
                    location: '서울 강남 본원',
                    description: '필라테스 원리와 기구를 활용한 운동 지도 능력을 갖춘 전문가 양성 과정입니다.'
                },
                'pilates-3': {
                    title: '필라테스 전문가 과정 3기',
                    period: '2025.09.02 ~ 2025.11.22 (12주)',
                    price: '1,300,000원',
                    method: '오프라인 중심 (실습 위주)',
                    capacity: '20명',
                    location: '서울 강남 본원',
                    description: '필라테스 원리와 기구를 활용한 운동 지도 능력을 갖춘 전문가 양성 과정입니다.'
                },
                'rec-2': {
                    title: '레크리에이션지도자 과정 2기',
                    period: '2025.06.10 ~ 2025.08.02 (8주)',
                    price: '900,000원',
                    method: '블렌디드 과정 (온라인+오프라인)',
                    capacity: '30명',
                    location: '서울 강남 본원',
                    description: '다양한 연령층과 단체를 대상으로 레크리에이션 프로그램을 기획하고 진행할 수 있는 전문가 양성 과정입니다.'
                }
            };
            
            const courseInfo = courseData[courseId];
            if (courseInfo) {
                // 과정 정보 업데이트
                document.getElementById('course-title').textContent = courseInfo.title;
                document.getElementById('course-period').textContent = courseInfo.period;
                document.getElementById('course-price').textContent = courseInfo.price;
                document.getElementById('course-method').textContent = courseInfo.method;
                document.getElementById('course-capacity').textContent = courseInfo.capacity;
                document.getElementById('course-location').textContent = courseInfo.location;
                document.getElementById('course-description').textContent = courseInfo.description;
                
                // 신청 버튼 활성화/비활성화
                const applyButton = document.getElementById('apply-button');
                if (applyButton) {
                    if (courseId === 'pilates-2') {
                        applyButton.disabled = true;
                        applyButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                        applyButton.classList.add('bg-gray-400', 'cursor-not-allowed');
                        applyButton.textContent = '마감된 과정입니다';
                    } else {
                        applyButton.disabled = false;
                        applyButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
                        applyButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
                        applyButton.textContent = '신청하기';
                    }
                }
            }
        },
        
        // 자격증 옵션에 따른 결제 계산 기능 설정
        setupPaymentCalculator: function() {
            const certOption = document.getElementById('cert-option');
            if (certOption) {
                certOption.addEventListener('change', function() {
                    let optionPrice = 0;
                    let basePrice = 50000;
                    
                    switch(this.value) {
                        case 'express':
                            optionPrice = 20000;
                            break;
                        case 'eng':
                            optionPrice = 30000;
                            break;
                        case 'express-eng':
                            optionPrice = 50000;
                            break;
                        default:
                            optionPrice = 0;
                    }
                    
                    document.getElementById('option-price').textContent = optionPrice.toLocaleString() + '원';
                    document.getElementById('total-price').textContent = (basePrice + optionPrice).toLocaleString() + '원';
                });
            }
        },
        
        // 약관 동의 체크박스 기능 설정
        setupAgreementCheckboxes: function() {
            const agreeAll = document.getElementById('agree-all');
            if (agreeAll) {
                agreeAll.addEventListener('change', function() {
                    const checkboxes = document.querySelectorAll('input[type="checkbox"][name^="agree-"]');
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = this.checked;
                    });
                });
                
                // 개별 체크박스 변경 시 전체 동의 체크박스 상태 업데이트
                const individualCheckboxes = document.querySelectorAll('input[type="checkbox"][name^="agree-"]:not([name="agree-all"])');
                individualCheckboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', function() {
                        const allChecked = Array.from(individualCheckboxes).every(cb => cb.checked);
                        document.getElementById('agree-all').checked = allChecked;
                    });
                });
            }
        }
    };
    
    // 앱 초기화
    document.addEventListener('DOMContentLoaded', function() {
        window.dhcApp.init();
        
        // 스크롤 업 버튼 생성
        if (!document.getElementById('scroll-up-button')) {
            const scrollUpButton = document.createElement('button');
            scrollUpButton.id = 'scroll-up-button';
            scrollUpButton.className = 'fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hidden hover:bg-blue-700 focus:outline-none';
            scrollUpButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            `;
            scrollUpButton.addEventListener('click', window.dhcApp.scrollToTop);
            
            document.body.appendChild(scrollUpButton);
        }
        
        // 애니메이션 스타일 추가
        if (!document.getElementById('animation-styles')) {
            const style = document.createElement('style');
            style.id = 'animation-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
                
                .animate-slideDown {
                    animation: slideDown 0.3s ease forwards;
                }
                
                .animate-fade-in {
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 페이지별 초기화
        const currentPath = window.location.pathname;
        
        // 현재 페이지 메뉴 표시
        document.querySelectorAll('.main-nav a').forEach(link => {
            if (currentPath.includes(link.getAttribute('href'))) {
                link.classList.add('text-blue-600', 'font-bold');
            }
        });
        
        // 페이지별 초기화
        if (currentPath.includes('/education/course-application.html')) {
            // 교육 신청 페이지 초기화
            const applicationForm = document.getElementById('application-form');
            if (applicationForm) {
                applicationForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // 필수 항목 확인
                    const courseSelect = document.getElementById('course-select');
                    if (!courseSelect.value) {
                        alert('교육 과정을 선택해주세요.');
                        courseSelect.focus();
                        return;
                    }
                    
                    // 신청 완료 메시지 표시
                    alert('교육 신청이 완료되었습니다. 담당자 확인 후 개별 연락드리겠습니다.');
                    
                    // 신청 완료 페이지로 이동 (실제 구현 시에는 서버로 데이터 전송 후 처리)
                    window.location.href = 'application-complete.html';
                });
            }
        } else if (currentPath.includes('/education/cert-application.html')) {
            // 자격증 신청 페이지 초기화
            const certificateForm = document.getElementById('certificate-form');
            if (certificateForm) {
                certificateForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // 필수 항목 확인
                    const certType = document.getElementById('cert-type');
                    if (!certType.value) {
                        alert('자격증 종류를 선택해주세요.');
                        certType.focus();
                        return;
                    }
                    
                    // 신청 완료 메시지 표시
                    alert('자격증 신청이 완료되었습니다. 담당자 확인 후 발급 예정입니다.');
                    
                    // 신청 완료 페이지로 이동 (실제 구현 시에는 서버로 데이터 전송 후 처리)
                    window.location.href = 'application-complete.html';
                });
                
                // 자격증 조회 폼 이벤트
                const verifyForm = document.getElementById('verify-form');
                if (verifyForm) {
                    verifyForm.addEventListener('submit', function(e) {
                        e.preventDefault();
                        
                        // 실제 구현 시에는 서버로 데이터 전송 후 결과 처리
                        const certNumber = document.getElementById('cert-number').value;
                        const certDate = document.getElementById('cert-date').value;
                        
                        if(certNumber && certDate) {
                            alert('입력하신 정보로 자격증 확인 중입니다.');
                            // 여기에 자격증 조회 요청 로직 구현
                        }
                    });
                }
            }
        }
        
        // 애니메이션 요소 처리
        document.querySelectorAll('.animate-fade-in').forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('opacity-100');
            }, 100 * index);
        });
    });
})();