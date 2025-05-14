/**
 * 홈페이지 전용 JavaScript
 * 메인 페이지의 특정 기능을 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // 홈페이지 네임스페이스 생성
    window.homePage = {
        // 슬라이드 인덱스 추적
        currentSlide: 0,
        
        // 초기화 함수
        init: function() {
            this.setupHeroSlider();
            this.setupCoursesCarousel();
            this.setupAnimations();
            this.setupNewsUpdate();
        },
        
        // 히어로 섹션 슬라이더 설정
        setupHeroSlider: function() {
            const heroSection = document.querySelector('.hero-section');
            
            // 히어로 섹션이 없으면 중단
            if (!heroSection) {
                return;
            }
            
            // 슬라이더 이미지 및 텍스트
            const slides = [
                {
                    bgImage: 'assets/images/banners/hero-bg.jpg',
                    heading: '운동과학 기반 전문인력 양성 플랫폼',
                    subheading: '디지털헬스케어센터에서 각 분야 최고의 전문가들과 함께<br>건강운동 전문가의 꿈을 이루세요.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg2.jpg',
                    heading: '체계적인 교육으로 전문성을 키우세요',
                    subheading: '이론과 실습이 결합된 과학적 교육과정을 통해<br>건강운동 분야의 진정한 전문가로 성장할 수 있습니다.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg3.jpg',
                    heading: '국제적으로 인정받는 자격증 과정',
                    subheading: '엄격한 기준과 체계적인 교육과정을 통해<br>신뢰할 수 있는 전문가 자격을 취득하세요.'
                }
            ];
            
            // 슬라이더 내비게이션 추가
            if (slides.length > 1) {
                const sliderNav = document.createElement('div');
                sliderNav.className = 'slider-nav flex justify-center mt-8';
                
                slides.forEach((slide, index) => {
                    const navDot = document.createElement('button');
                    navDot.className = `slider-nav-dot w-3 h-3 rounded-full mx-1 ${index === 0 ? 'bg-white' : 'bg-white bg-opacity-50'}`;
                    navDot.setAttribute('data-slide', index);
                    
                    navDot.addEventListener('click', () => {
                        this.goToSlide(index);
                    });
                    
                    sliderNav.appendChild(navDot);
                });
                
                heroSection.querySelector('.container').appendChild(sliderNav);
                
                // 자동 슬라이드 시작
                this.startAutoSlide();
            }
        },
        
        // 슬라이드 변경 함수
        goToSlide: function(index) {
            const heroSection = document.querySelector('.hero-section');
            const slides = [
                {
                    bgImage: 'assets/images/banners/hero-bg.jpg',
                    heading: '운동과학 기반 전문인력 양성 플랫폼',
                    subheading: '디지털헬스케어센터에서 각 분야 최고의 전문가들과 함께<br>건강운동 전문가의 꿈을 이루세요.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg2.jpg',
                    heading: '체계적인 교육으로 전문성을 키우세요',
                    subheading: '이론과 실습이 결합된 과학적 교육과정을 통해<br>건강운동 분야의 진정한 전문가로 성장할 수 있습니다.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg3.jpg',
                    heading: '국제적으로 인정받는 자격증 과정',
                    subheading: '엄격한 기준과 체계적인 교육과정을 통해<br>신뢰할 수 있는 전문가 자격을 취득하세요.'
                }
            ];
            
            // 슬라이더가 없으면 중단
            if (!heroSection) {
                return;
            }
            
            // 현재 슬라이드 인덱스 업데이트
            this.currentSlide = index;
            
            // 배경 이미지 변경
            const slideData = slides[index];
            heroSection.style.backgroundImage = `linear-gradient(to right, rgba(37, 99, 235, 0.9), rgba(79, 70, 229, 0.9)), url('${slideData.bgImage}')`;
            
            // 텍스트 변경 (페이드 효과 적용)
            const heading = heroSection.querySelector('h1');
            const subheading = heroSection.querySelector('p');
            
            if (heading && subheading) {
                // 페이드 아웃
                heading.style.opacity = '0';
                subheading.style.opacity = '0';
                
                setTimeout(() => {
                    // 내용 변경
                    heading.innerHTML = slideData.heading;
                    subheading.innerHTML = slideData.subheading;
                    
                    // 페이드 인
                    heading.style.opacity = '1';
                    subheading.style.opacity = '1';
                }, 500);
            }
            
            // 내비게이션 도트 업데이트
            const navDots = document.querySelectorAll('.slider-nav-dot');
            navDots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.add('bg-white');
                    dot.classList.remove('bg-opacity-50');
                } else {
                    dot.classList.add('bg-opacity-50');
                    dot.classList.remove('bg-white');
                }
            });
        },
        
        // 자동 슬라이드 시작
        startAutoSlide: function() {
            const slides = [
                {
                    bgImage: 'assets/images/banners/hero-bg.jpg',
                    heading: '운동과학 기반 전문인력 양성 플랫폼',
                    subheading: '디지털헬스케어센터에서 각 분야 최고의 전문가들과 함께<br>건강운동 전문가의 꿈을 이루세요.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg2.jpg',
                    heading: '체계적인 교육으로 전문성을 키우세요',
                    subheading: '이론과 실습이 결합된 과학적 교육과정을 통해<br>건강운동 분야의 진정한 전문가로 성장할 수 있습니다.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg3.jpg',
                    heading: '국제적으로 인정받는 자격증 과정',
                    subheading: '엄격한 기준과 체계적인 교육과정을 통해<br>신뢰할 수 있는 전문가 자격을 취득하세요.'
                }
            ];
            
            // 5초마다 슬라이드 변경
            this.slideInterval = setInterval(() => {
                const nextSlide = (this.currentSlide + 1) % slides.length;
                this.goToSlide(nextSlide);
            }, 5000);
            
            // 마우스 오버 시 자동 슬라이드 일시 중지
            const heroSection = document.querySelector('.hero-section');
            
            if (heroSection) {
                heroSection.addEventListener('mouseenter', () => {
                    clearInterval(this.slideInterval);
                });
                
                heroSection.addEventListener('mouseleave', () => {
                    this.startAutoSlide();
                });
            }
        },
        
        // 교육 과정 캐러셀 설정
        setupCoursesCarousel: function() {
            const coursesSection = document.querySelector('.courses-section');
            
            // 교육 과정 섹션이 없으면 중단
            if (!coursesSection) {
                return;
            }
            
            // 모바일에서만 캐러셀 활성화
            if (window.innerWidth < 768) {
                const coursesGrid = coursesSection.querySelector('.grid');
                const courseCards = coursesGrid.querySelectorAll('.grid > div');
                
                // 그리드를 슬라이더로 변환
                coursesGrid.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-6');
                coursesGrid.classList.add('carousel', 'relative', 'overflow-hidden');
                
                // 슬라이더 래퍼 생성
                const carouselWrapper = document.createElement('div');
                carouselWrapper.className = 'carousel-wrapper flex transition-transform duration-300';
                
                // 카드를 래퍼로 이동
                courseCards.forEach(card => {
                    card.classList.add('carousel-item', 'w-full', 'flex-shrink-0');
                    carouselWrapper.appendChild(card);
                });
                
                coursesGrid.appendChild(carouselWrapper);
                
                // 내비게이션 버튼 추가
                const prevButton = document.createElement('button');
                prevButton.className = 'carousel-prev absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md z-10';
                prevButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>';
                
                const nextButton = document.createElement('button');
                nextButton.className = 'carousel-next absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md z-10';
                nextButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>';
                
                coursesGrid.appendChild(prevButton);
                coursesGrid.appendChild(nextButton);
                
                // 캐러셀 기능 구현
                let currentIndex = 0;
                const totalItems = courseCards.length;
                
                prevButton.addEventListener('click', () => {
                    if (currentIndex > 0) {
                        currentIndex--;
                        carouselWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
                    }
                });
                
                nextButton.addEventListener('click', () => {
                    if (currentIndex < totalItems - 1) {
                        currentIndex++;
                        carouselWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
                    }
                });
            }
        },
        
        // 최신 공지사항 및 칼럼 가져오기
        setupNewsUpdate: function() {
            console.log('홈페이지: Firebase 실시간 데이터 로드 준비');
            // TODO: Firebase 연동 시 실제 데이터 가져오기 구현
        },   
        
        // 스크롤 애니메이션 설정
        setupAnimations: function() {
            // 애니메이션 대상 요소
            const animationTargets = [
                '.certificate-section .grid > div',
                '.courses-section .grid > div',
                '.notice-column-section .grid > div',
                '.cta-section'
            ];
            
            // 요소에 애니메이션 클래스 추가
            animationTargets.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                
                elements.forEach((element, index) => {
                    element.classList.add('animate-on-scroll');
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(20px)';
                    element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                    element.style.transitionDelay = `${index * 0.1}s`;
                });
            });
            
            // 스크롤 이벤트 리스너 추가
            window.addEventListener('scroll', this.checkAnimations.bind(this));
            
            // 초기 체크
            this.checkAnimations();
        },
        
        // 스크롤 애니메이션 체크
        checkAnimations: function() {
            const animatedElements = document.querySelectorAll('.animate-on-scroll');
            const windowHeight = window.innerHeight;
            
            animatedElements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const elementVisible = 100;
                
                if (elementTop < windowHeight - elementVisible) {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }
            });
        },
        
        // 날짜 포맷팅 (Firebase 타임스탬프 처리)
        formatDate: function(timestamp) {
            if (!timestamp) {
                return '';
            }
            
            let date;
            
            if (timestamp.toDate) {
                // Firestore 타임스탬프인 경우
                date = timestamp.toDate();
            } else if (timestamp.seconds) {
                // Firestore 타임스탬프 객체인 경우
                date = new Date(timestamp.seconds * 1000);
            } else {
                // 일반 Date 객체 또는 문자열인 경우
                date = new Date(timestamp);
            }
            
            // 날짜가 유효하지 않은 경우
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // YYYY.MM.DD 형식으로 반환
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}.${month}.${day}`;
        }
    };
    
    // 문서 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', function() {
        console.log('홈페이지: DOM 로드 완료, 초기화 시작');
        window.homePage.init();
    });
})();