// exam-info.js - 시험 안내 페이지 전용 JavaScript
console.log('=== exam-info.js 파일 로드됨 ===');

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        // DOM이 아직 로딩 중이면 이벤트 리스너 등록
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initExamInfoPage();
        });
    } else {
        // DOM이 이미 로드된 경우 즉시 실행
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initExamInfoPage();
    }
}

// 초기화 시작
initializeWhenReady();

// 페이지 초기화 함수
function initExamInfoPage() {
    console.log('=== initExamInfoPage 실행 시작 ===');

    // 시험 탭 네비게이션 초기화
    initExamTabs();

    // FAQ 아코디언 초기화
    initFAQAccordion();

    // 동적 콘텐츠 로드
    loadExamContent();

    // 스크롤 이벤트 처리
    initScrollEvents();

    // 애니메이션 효과
    initAnimations();

    console.log('=== initExamInfoPage 완료 ===');
}

// 시험 탭 네비게이션 초기화
function initExamTabs() {
    console.log('=== initExamTabs 시작 ===');
    
    const examTabs = document.querySelectorAll('.exam-tab');
    const examContents = document.querySelectorAll('.exam-content');

    if (examTabs.length === 0) {
        console.error('exam-tab 요소를 찾을 수 없습니다!');
        return;
    }

    examTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 활성화된 탭 제거
            examTabs.forEach(t => t.classList.remove('active'));
            examContents.forEach(content => content.classList.remove('active'));
            
            // 클릭된 탭 활성화
            this.classList.add('active');
            
            // 해당 콘텐츠 표시
            const targetId = this.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 콘텐츠로 스크롤
                setTimeout(() => {
                    targetContent.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 100);
            }
            
            console.log('탭 전환:', targetId);
        });
    });
}

// FAQ 아코디언 초기화
function initFAQAccordion() {
    console.log('=== initFAQAccordion 시작 ===');
    
    const faqButtons = document.querySelectorAll('.faq-button');
    
    faqButtons.forEach(button => {
        button.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const faqAnswer = faqItem.querySelector('.faq-answer');
            const isActive = faqItem.classList.contains('active');
            
            // 모든 FAQ 아이템 닫기
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-answer').classList.remove('show');
            });
            
            // 클릭된 아이템만 열기 (이미 열려있지 않은 경우)
            if (!isActive) {
                faqItem.classList.add('active');
                faqAnswer.classList.add('show');
            }
            
            // 아이콘 회전 애니메이션
            const icon = this.querySelector('svg');
            if (icon) {
                if (faqItem.classList.contains('active')) {
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });
    });
}

// 동적 콘텐츠 로드
function loadExamContent() {
    console.log('=== loadExamContent 시작 ===');
    
    // 시험 일정 정보 (실제로는 API에서 가져올 데이터)
    const examSchedule = [
        {
            quarter: '1분기',
            date: '2025.03.15',
            apply: '2025.02.15 ~ 2025.03.01',
            result: '2025.03.31',
            status: 'closed'
        },
        {
            quarter: '2분기',
            date: '2025.06.14',
            apply: '2025.05.15 ~ 2025.05.31',
            result: '2025.06.30',
            status: 'current'
        },
        {
            quarter: '3분기',
            date: '2025.09.13',
            apply: '2025.08.15 ~ 2025.08.31',
            result: '2025.09.30',
            status: 'upcoming'
        },
        {
            quarter: '4분기',
            date: '2025.12.06',
            apply: '2025.11.08 ~ 2025.11.22',
            result: '2025.12.20',
            status: 'future'
        }
    ];
    
    // 현재 시험 안내 업데이트
    updateCurrentExamInfo(examSchedule);
    
    // 각 자격증별 상세 정보 로드
    loadCertificateExamDetails();
}

// 현재 시험 안내 업데이트
function updateCurrentExamInfo(schedule) {
    const currentExam = schedule.find(exam => exam.status === 'current');
    
    if (currentExam) {
        // 현재 접수 중인 시험 정보를 페이지에 하이라이트
        const currentInfoDiv = document.createElement('div');
        currentInfoDiv.className = 'current-exam-highlight';
        currentInfoDiv.innerHTML = `
            <h3>현재 접수 중인 시험</h3>
            <p class="exam-date">${currentExam.date} 시험</p>
            <p class="apply-period">접수기간: ${currentExam.apply}</p>
            <a href="javascript:window.location.href=window.adjustPath('pages/education/cert-application.html')" class="btn-primary">지금 신청하기</a>
        `;
        
        // 시험 개요 섹션 상단에 추가
        const overviewSection = document.getElementById('exam-overview');
        if (overviewSection && overviewSection.querySelector('.exam-content-card')) {
            overviewSection.querySelector('.exam-content-card').insertBefore(currentInfoDiv, overviewSection.querySelector('.exam-intro-box'));
        }
    }
}

// 자격증별 상세 정보 로드
function loadCertificateExamDetails() {
    // 건강운동처방사 시험 정보 로드
    loadHealthExamDetails();
    
    // 운동재활전문가 시험 정보 로드
    loadRehabExamDetails();
    
    // 필라테스 전문가 시험 정보 로드
    loadPilatesExamDetails();
    
    // 레크리에이션지도자 시험 정보 로드
    loadRecreationExamDetails();
}

// 건강운동처방사 시험 상세 정보
function loadHealthExamDetails() {
    const healthExamContent = document.getElementById('health-exam');
    if (!healthExamContent) return;
    
    const existingCard = healthExamContent.querySelector('.exam-content-card');
    if (existingCard && existingCard.children.length === 1) {
        // 기본 타이틀만 있는 경우 내용 추가
        existingCard.innerHTML += `
            <div class="exam-intro-box">
                <h3>시험 개요</h3>
                <p>건강운동처방사 자격증은 다양한 질환을 가진 대상자에게 적합한 운동 프로그램을 설계하고 지도할 수 있는 전문성을 검증하는 시험입니다.</p>
            </div>
            
            <div class="exam-requirements-card">
                <h3 class="card-title">응시 자격</h3>
                <ul class="requirements-list">
                    <li>건강운동처방사 과정 수료자 (출석률 80% 이상)</li>
                    <li>체육계열 전공자 (학사 이상) 또는 관련 자격증 보유자</li>
                    <li>운동처방 관련 실무 경력 1년 이상 (신입자 제외)</li>
                </ul>
            </div>
            
            <div class="exam-details-grid">
                <div class="exam-detail-card">
                    <h3 class="card-title">이론시험</h3>
                    <div class="detail-content">
                        <p><strong>문제 수:</strong> 80문항 (객관식 60문항, 주관식 20문항)</p>
                        <p><strong>시험 시간:</strong> 90분</p>
                        <p><strong>합격 기준:</strong> 100점 만점 중 70점 이상</p>
                        <p><strong>출제 범위:</strong></p>
                        <ul>
                            <li>운동생리학 (25%)</li>
                            <li>운동역학 (20%)</li>
                            <li>스포츠의학 (20%)</li>
                            <li>운동처방론 (25%)</li>
                            <li>건강관리론 (10%)</li>
                        </ul>
                    </div>
                </div>
                
                <div class="exam-detail-card">
                    <h3 class="card-title">실기시험</h3>
                    <div class="detail-content">
                        <p><strong>평가 방법:</strong> 실기 평가 + 구술 면접</p>
                        <p><strong>시험 시간:</strong> 30분 내외</p>
                        <p><strong>합격 기준:</strong> 100점 만점 중 80점 이상</p>
                        <p><strong>평가 항목:</strong></p>
                        <ul>
                            <li>체력 측정 및 평가 (30%)</li>
                            <li>운동처방 작성 (40%)</li>
                            <li>운동 지도 실연 (20%)</li>
                            <li>구술 평가 (10%)</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="study-tips-card">
                <h3 class="card-title">시험 준비 팁</h3>
                <ul class="tips-list">
                    <li><strong>이론시험:</strong> 기본서 반복 학습 후 최신 출제 경향 분석</li>
                    <li><strong>실기시험:</strong> 실무 경험을 바탕으로 한 체계적인 준비</li>
                    <li><strong>모의시험:</strong> 센터에서 제공하는 모의시험 적극 활용</li>
                    <li><strong>멘토링:</strong> 기존 합격자와의 멘토링 프로그램 참여</li>
                </ul>
            </div>
        `;
    }
}

// 운동재활전문가 시험 상세 정보
function loadRehabExamDetails() {
    const rehabExamContent = document.getElementById('rehab-exam');
    if (!rehabExamContent) return;
    
    const existingCard = rehabExamContent.querySelector('.exam-content-card');
    if (existingCard && existingCard.children.length === 1) {
        existingCard.innerHTML += `
            <div class="exam-intro-box">
                <h3>시험 개요</h3>
                <p>운동재활전문가 자격증은 부상이나 질환 이후 회복 과정에서 안전하고 효과적인 운동재활 프로그램을 제공할 수 있는 전문성을 검증합니다.</p>
            </div>
            
            <div class="exam-requirements-card">
                <h3 class="card-title">응시 자격</h3>
                <ul class="requirements-list">
                    <li>운동재활전문가 과정 수료자 (출석률 85% 이상)</li>
                    <li>의료 관련 자격증 보유자 (물리치료사, 운동처방사 등)</li>
                    <li>재활 분야 실무 경력 6개월 이상</li>
                </ul>
            </div>
            
            <div class="exam-details-grid">
                <div class="exam-detail-card">
                    <h3 class="card-title">이론시험</h3>
                    <div class="detail-content">
                        <p><strong>문제 수:</strong> 100문항 (전체 객관식)</p>
                        <p><strong>시험 시간:</strong> 90분</p>
                        <p><strong>합격 기준:</strong> 100점 만점 중 75점 이상</p>
                        <p><strong>출제 범위:</strong></p>
                        <ul>
                            <li>재활의학 (30%)</li>
                            <li>운동치료학 (25%)</li>
                            <li>기능해부학 (20%)</li>
                            <li>병리학 (15%)</li>
                            <li>운동재활실무 (10%)</li>
                        </ul>
                    </div>
                </div>
                
                <div class="exam-detail-card">
                    <h3 class="card-title">실기시험</h3>
                    <div class="detail-content">
                        <p><strong>평가 방법:</strong> 케이스 스터디 + 실기 평가</p>
                        <p><strong>시험 시간:</strong> 40분 내외</p>
                        <p><strong>합격 기준:</strong> 100점 만점 중 80점 이상</p>
                        <p><strong>평가 항목:</strong></p>
                        <ul>
                            <li>기능 평가 (35%)</li>
                            <li>재활계획 수립 (30%)</li>
                            <li>운동치료 실시 (25%)</li>
                            <li>안전관리 (10%)</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
}

// 필라테스 전문가 시험 상세 정보
function loadPilatesExamDetails() {
    const pilatesExamContent = document.getElementById('pilates-exam');
    if (!pilatesExamContent) return;
    
    const existingCard = pilatesExamContent.querySelector('.exam-content-card');
    if (existingCard && existingCard.children.length === 1) {
        existingCard.innerHTML += `
            <div class="exam-intro-box">
                <h3>시험 개요</h3>
                <p>필라테스 전문가 자격증은 과학적 원리에 기반한 체계적인 필라테스 지도 능력을 검증하는 시험으로, 국제적 수준의 지도자 양성을 목표로 합니다.</p>
            </div>
            
            <div class="exam-requirements-card">
                <h3 class="card-title">응시 자격</h3>
                <ul class="requirements-list">
                    <li>필라테스 전문가 과정 수료자 (출석률 90% 이상)</li>
                    <li>필라테스 관련 자격증 보유자 (국내외 불문)</li>
                    <li>필라테스 지도 경력 3개월 이상</li>
                </ul>
            </div>
            
            <div class="exam-details-grid">
                <div class="exam-detail-card">
                    <h3 class="card-title">이론시험</h3>
                    <div class="detail-content">
                        <p><strong>문제 수:</strong> 70문항 (객관식 50문항, 주관식 20문항)</p>
                        <p><strong>시험 시간:</strong> 80분</p>
                        <p><strong>합격 기준:</strong> 100점 만점 중 70점 이상</p>
                        <p><strong>출제 범위:</strong></p>
                        <ul>
                            <li>필라테스 역사와 원리 (20%)</li>
                            <li>기능해부학 (30%)</li>
                            <li>운동생리학 (20%)</li>
                            <li>필라테스 방법론 (20%)</li>
                            <li>지도법 및 안전관리 (10%)</li>
                        </ul>
                    </div>
                </div>
                
                <div class="exam-detail-card">
                    <h3 class="card-title">실기시험</h3>
                    <div class="detail-content">
                        <p><strong>평가 방법:</strong> 동작 시연 + 지도 실연</p>
                        <p><strong>시험 시간:</strong> 35분 내외</p>
                        <p><strong>합격 기준:</strong> 100점 만점 중 85점 이상</p>
                        <p><strong>평가 항목:</strong></p>
                        <ul>
                            <li>기본 동작 수행 (40%)</li>
                            <li>응용 동작 수행 (25%)</li>
                            <li>지도 능력 평가 (25%)</li>
                            <li>자세 교정 능력 (10%)</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
}

// 레크리에이션지도자 시험 상세 정보
function loadRecreationExamDetails() {
    const recreationExamContent = document.getElementById('recreation-exam');
    if (!recreationExamContent) return;
    
    const existingCard = recreationExamContent.querySelector('.exam-content-card');
    if (existingCard && existingCard.children.length === 1) {
        existingCard.innerHTML += `
            <div class="exam-intro-box">
                <h3>시험 개요</h3>
                <p>레크리에이션지도자 자격증은 다양한 연령층을 대상으로 창의적이고 즐거운 여가활동 프로그램을 기획하고 운영할 수 있는 능력을 검증합니다.</p>
            </div>
            
            <div class="exam-requirements-card">
                <h3 class="card-title">응시 자격</h3>
                <ul class="requirements-list">
                    <li>레크리에이션지도자 과정 수료자 (출석률 80% 이상)</li>
                    <li>여가 및 체육 관련 학과 재학생 이상</li>
                    <li>레크리에이션 활동 참여 또는 지도 경험</li>
                </ul>
            </div>
            
            <div class="exam-details-grid">
                <div class="exam-detail-card">
                    <h3 class="card-title">이론시험</h3>
                    <div class="detail-content">
                        <p><strong>문제 수:</strong> 60문항 (전체 객관식)</p>
                        <p><strong>시험 시간:</strong> 70분</p>
                        <p><strong>합격 기준:</strong> 100점 만점 중 65점 이상</p>
                        <p><strong>출제 범위:</strong></p>
                        <ul>
                            <li>레크리에이션론 (30%)</li>
                            <li>여가학 개론 (25%)</li>
                            <li>프로그램 기획론 (20%)</li>
                            <li>집단 관리론 (15%)</li>
                            <li>안전관리 (10%)</li>
                        </ul>
                    </div>
                </div>
                
                <div class="exam-detail-card">
                    <h3 class="card-title">실기시험</h3>
                    <div class="detail-content">
                        <p><strong>평가 방법:</strong> 프로그램 진행 + 창작 활동</p>
                        <p><strong>시험 시간:</strong> 25분 내외</p>
                        <p><strong>합격 기준:</strong> 100점 만점 중 75점 이상</p>
                        <p><strong>평가 항목:</strong></p>
                        <ul>
                            <li>프로그램 진행력 (40%)</li>
                            <li>창의적 구성 (30%)</li>
                            <li>참여 유도력 (20%)</li>
                            <li>안전관리 (10%)</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
}

// 스크롤 이벤트 처리
function initScrollEvents() {
    console.log('=== initScrollEvents 시작 ===');
    
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                // 스크롤에 따른 탭 네비게이션 하이라이트
                updateActiveTabOnScroll();
                
                // 스크롤에 따른 컨텐츠 애니메이션
                handleScrollAnimations();
                
                ticking = false;
            });
            ticking = true;
        }
    });
}

// 스크롤 위치에 따른 활성 탭 업데이트
function updateActiveTabOnScroll() {
    const examContents = document.querySelectorAll('.exam-content');
    const examTabs = document.querySelectorAll('.exam-tab');
    
    let currentSection = '';
    
    examContents.forEach(content => {
        const rect = content.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 200) {
            currentSection = content.id;
        }
    });
    
    if (currentSection) {
        examTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-target') === currentSection) {
                tab.classList.add('active');
            }
        });
    }
}

// 스크롤 애니메이션 처리
function handleScrollAnimations() {
    const animationElements = document.querySelectorAll('.fade-in-scroll');
    
    animationElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.top < windowHeight * 0.8) {
            element.classList.add('visible');
        }
    });
}

// 초기 애니메이션 효과
function initAnimations() {
    console.log('=== initAnimations 시작 ===');
    
    // 페이지 로드 시 요소들에 애니메이션 클래스 추가
    const animateElements = document.querySelectorAll('.exam-content-card, .exam-section-title, .exam-intro-box');
    
    animateElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // 탭 전환 시 애니메이션
    document.querySelectorAll('.exam-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            
            if (targetContent) {
                targetContent.style.opacity = '0';
                targetContent.style.transform = 'translateX(50px)';
                
                setTimeout(() => {
                    targetContent.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    targetContent.style.opacity = '1';
                    targetContent.style.transform = 'translateX(0)';
                }, 100);
            }
        });
    });
}

// 유틸리티 함수: 날짜 포맷
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// 유틸리티 함수: D-Day 계산
function calculateDDay(targetDate) {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
        return `D-${diffDays}`;
    } else if (diffDays === 0) {
        return 'D-Day';
    } else {
        return `D+${Math.abs(diffDays)}`;
    }
}

// 시험 알림 설정 (로컬 스토리지 활용)
function setExamReminder(examDate, examType) {
    const reminders = JSON.parse(localStorage.getItem('examReminders') || '[]');
    
    const newReminder = {
        id: Date.now(),
        examDate: examDate,
        examType: examType,
        createdAt: new Date().toISOString()
    };
    
    reminders.push(newReminder);
    localStorage.setItem('examReminders', JSON.stringify(reminders));
    
    console.log('시험 알림 설정:', newReminder);
}

// 키보드 네비게이션 지원
function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            // 탭 네비게이션 시각적 피드백 추가
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // 화살표 키로 탭 이동
    document.querySelectorAll('.exam-tab').forEach((tab, index, tabs) => {
        tab.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' && index < tabs.length - 1) {
                tabs[index + 1].focus();
                tabs[index + 1].click();
            } else if (e.key === 'ArrowLeft' && index > 0) {
                tabs[index - 1].focus();
                tabs[index - 1].click();
            }
        });
    });
}

// 초기화 시 키보드 네비게이션도 함께 시작
window.addEventListener('load', function() {
    initKeyboardNavigation();
});

// 성능 최적화: Intersection Observer 활용
function initIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '50px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 관찰할 요소들 등록
    document.querySelectorAll('.fade-in-scroll').forEach(el => {
        observer.observe(el);
    });
    
    console.log('Intersection Observer 초기화 완료');
}

// 초기화 시 Intersection Observer도 시작
window.addEventListener('load', function() {
    initIntersectionObserver();
});