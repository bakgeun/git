// instructors.js - 강사 소개 페이지 전용 JavaScript (개선됨)

// 전역 변수로 디버깅 도움
let isInitialized = false;
let tabClickCount = 0;

// Firestore에서 강사 데이터 로드
async function loadInstructorsFromFirestore() {
    console.log('🔥 Firestore에서 강사 데이터 로드 시작');

    try {
        if (!window.dhcFirebase || !window.dhcFirebase.db) {
            console.warn('Firebase 미연동, 하드코딩된 데이터 사용');
            return false;
        }

        const snapshot = await window.dhcFirebase.db
            .collection('instructors')
            .where('active', '==', true)
            .orderBy('order', 'asc')
            .get();

        if (snapshot.empty) {
            console.warn('강사 데이터가 없습니다.');
            return false;
        }

        // 기존 카드들 제거
        const grid = document.querySelector('.instructor-grid');
        if (!grid) return false;

        grid.innerHTML = '';

        // Firestore 데이터로 카드 생성
        snapshot.forEach(doc => {
            const instructor = doc.data();
            const card = createInstructorCard(instructor);
            grid.appendChild(card);
        });

        console.log(`✅ ${snapshot.size}명의 강사 데이터 로드 완료`);
        return true;

    } catch (error) {
        console.error('❌ 강사 데이터 로드 오류:', error);
        return false;
    }
}

// 강사 카드 생성 함수
function createInstructorCard(instructor) {
    const card = document.createElement('div');
    card.className = 'instructor-card';

    // specialties 배열을 data-category로 변환
    const categoryMap = {
        'health-exercise': 'health',
        'rehabilitation': 'rehab',
        'pilates': 'pilates',
        'recreation': 'recreation'
    };

    // 첫 번째 specialty를 카테고리로 사용
    const mainCategory = categoryMap[instructor.specialties[0]] || 'health';
    card.setAttribute('data-category', mainCategory);

    const categoryNames = {
        'health': '건강운동처방',
        'rehab': '운동재활',
        'pilates': '필라테스',
        'recreation': '레크리에이션'
    };

    card.innerHTML = `
        <div class="instructor-photo">
            <img src="${instructor.photoUrl}" alt="${instructor.name}" onerror="this.src='../../assets/images/instructors/default.jpg'">
        </div>
        <div class="instructor-info">
            <div class="instructor-header">
                <h3 class="instructor-name">${instructor.name}</h3>
                <span class="instructor-category ${mainCategory}-category">${categoryNames[mainCategory]}</span>
            </div>
            <p class="instructor-position">${instructor.position}</p>
            <div class="instructor-details">
                <div class="detail-item">
                    <strong>전문 분야:</strong> ${instructor.description}
                </div>
                <div class="detail-item">
                    <strong>학력:</strong> ${instructor.education}
                </div>
                <div class="detail-item">
                    <strong>경력:</strong> ${instructor.career}
                </div>
            </div>
        </div>
    `;

    return card;
}

// 페이지 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function () {
    console.log('===== DOM Content Loaded =====');
    console.log('Timestamp:', new Date().toISOString());

    // 빠른 초기화
    console.log('Starting immediate initialization...');
    initializePage();
});

// 메인 초기화 함수 (재구성) - Firestore 연동 추가
async function initializePage() {
    console.log('===== Page Initialization Started =====');

    try {
        // 1. Firestore에서 강사 데이터 로드 시도
        console.log('1. Attempting to load instructors from Firestore...');
        const loaded = await loadInstructorsFromFirestore();

        if (!loaded) {
            console.log('Firestore 데이터 없음, HTML 하드코딩 데이터 사용');
        } else {
            console.log('Firestore 데이터 로드 성공');
        }

        // 2. 요소 찾기
        const tabs = document.querySelectorAll('.instructor-tab');
        const cards = document.querySelectorAll('.instructor-card');
        const grid = document.querySelector('.instructor-grid');

        console.log('Elements found:', {
            tabs: tabs.length,
            cards: cards.length,
            grid: grid ? 'Yes' : 'No'
        });

        if (tabs.length === 0 || cards.length === 0) {
            console.error('Essential elements not found!');
            return false;
        }

        // 3. 카드 초기화
        console.log('2. Initializing cards...');
        initializeCards(cards);

        // 4. 탭 설정
        console.log('3. Setting up tab functionality...');
        setupTabs(tabs, cards, grid);

        // 5. 카드 애니메이션
        console.log('4. Adding card animations...');
        initInstructorCards(cards);

        // 6. 이미지 에러 처리
        console.log('5. Setting up image error handling...');
        initImageErrorHandling();

        // 7. 초기 상태 설정
        console.log('6. Setting initial state...');
        const activeTab = document.querySelector('.instructor-tab.active');
        if (activeTab) {
            const category = activeTab.getAttribute('data-category');
            console.log('Setting initial filter:', category);
            filterCards(category, cards);
        }

        // 성공적으로 완료
        isInitialized = true;
        console.log('===== Initialization Completed Successfully =====');
        console.log('isInitialized is now:', isInitialized);

        return true;

    } catch (error) {
        console.error('Error during initialization:', error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// 카드 초기화
function initializeCards(cards) {
    console.log('Initializing cards...');

    cards.forEach((card, index) => {
        // 기본 스타일 설정
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease, display 0.3s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        card.style.display = 'block';

        const category = card.getAttribute('data-category');
        console.log(`Card ${index} initialized:`, {
            category,
            visibility: card.style.display,
            opacity: card.style.opacity
        });
    });

    console.log('Cards initialization complete');
}

// 탭 설정 개선
function setupTabs(tabs, cards, grid) {
    console.log('Setting up tab event listeners...');

    tabs.forEach((tab, index) => {
        const category = tab.getAttribute('data-category');

        // 기존 이벤트 리스너 제거 (중복 방지)
        tab.removeEventListener('click', handleTabClick);

        // 클릭 이벤트 핸들러
        const clickHandler = function (event) {
            handleTabClick(event, this, tabs, cards, grid);
        };

        tab.addEventListener('click', clickHandler);

        // 키보드 접근성
        tab.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.click();
            }
        });

        console.log(`Tab ${index} (${category}) event listeners added`);
    });

    console.log('Tab setup complete');
}

// 탭 클릭 핸들러 개선
function handleTabClick(event, clickedTab, tabs, cards, grid) {
    event.preventDefault();
    event.stopPropagation();

    tabClickCount++;
    const category = clickedTab.getAttribute('data-category');

    console.log('======= TAB CLICK =======');
    console.log('Click count:', tabClickCount);
    console.log('Clicked category:', category);
    console.log('Event:', event);
    console.log('Target:', clickedTab);

    try {
        // 1. 모든 탭에서 active 클래스 제거
        tabs.forEach((tab, i) => {
            const wasActive = tab.classList.contains('active');
            tab.classList.remove('active');
            if (wasActive) console.log(`Removed active from tab ${i}`);
        });

        // 2. 클릭된 탭에 active 클래스 추가
        clickedTab.classList.add('active');
        console.log('Added active class to clicked tab');

        // 3. 그리드 애니메이션 시작
        if (grid) {
            grid.classList.add('filtering');
            console.log('Added filtering class to grid');
        }

        // 4. 필터링 실행
        console.log('Starting filter process...');
        filterCards(category, cards);

        // 5. 애니메이션 완료 후 정리
        setTimeout(() => {
            if (grid) {
                grid.classList.remove('filtering');
                console.log('Removed filtering class from grid');
            }
        }, 500);

    } catch (error) {
        console.error('Error in handleTabClick:', error);
    }
}

// 카드 필터링 함수 개선
function filterCards(category, cards) {
    console.log('===== FILTERING CARDS =====');
    console.log('Target category:', category);

    let showCount = 0;
    let hideCount = 0;

    cards.forEach((card, index) => {
        const cardCategory = card.getAttribute('data-category');
        const shouldShow = (category === 'all' || cardCategory === category);

        console.log(`Card ${index}:`, {
            category: cardCategory,
            shouldShow,
            currentDisplay: card.style.display,
            currentOpacity: card.style.opacity
        });

        if (shouldShow) {
            // 카드 보이기
            showCount++;
            card.style.display = 'block';

            // 페이드 인 효과 (순차적)
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);

        } else {
            // 카드 숨기기
            hideCount++;
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';

            // 완전히 숨기기
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });

    console.log(`Filtering complete: ${showCount} shown, ${hideCount} hidden`);
    return { showCount, hideCount };
}

// 카드 호버 애니메이션
function initInstructorCards(cards) {
    console.log('Setting up card hover animations...');

    cards.forEach((card, index) => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.15)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        });

        console.log(`Card ${index} hover animation set`);
    });

    console.log('Card animations complete');
}

// 이미지 에러 처리
function initImageErrorHandling() {
    console.log('Setting up image error handling...');

    const images = document.querySelectorAll('.instructor-photo img');
    let handleCount = 0;

    images.forEach((img, index) => {
        img.addEventListener('error', function () {
            console.log(`Image error for image ${index}:`, this.src);

            const placeholder = document.createElement('div');
            placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-100 rounded-lg';
            placeholder.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            `;

            this.parentNode.replaceChild(placeholder, this);
            handleCount++;
        });
    });

    console.log(`Image error handling set for ${images.length} images`);
}

// 디버깅 함수들 개선
window.debugInstructors = function () {
    console.log('===== DEBUG INFO =====');
    console.log('isInitialized:', isInitialized);
    console.log('tabClickCount:', tabClickCount);

    const tabs = document.querySelectorAll('.instructor-tab');
    const cards = document.querySelectorAll('.instructor-card');

    console.log('Current tab states:');
    tabs.forEach((tab, i) => {
        console.log(`Tab ${i}:`, {
            category: tab.getAttribute('data-category'),
            active: tab.classList.contains('active'),
            hasClickListener: tab.onclick ? 'onclick property' : 'addEventListener'
        });
    });

    console.log('Current card states:');
    cards.forEach((card, i) => {
        console.log(`Card ${i}:`, {
            category: card.getAttribute('data-category'),
            display: card.style.display,
            opacity: card.style.opacity,
            visible: card.offsetHeight > 0
        });
    });

    return {
        isInitialized,
        tabClickCount,
        tabsCount: tabs.length,
        cardsCount: cards.length
    };
};

window.testTabClick = function (category) {
    console.log('===== MANUAL TAB TEST =====');
    console.log('Requested category:', category);

    const tab = document.querySelector(`.instructor-tab[data-category="${category}"]`);
    if (!tab) {
        console.error('Tab not found for category:', category);
        return false;
    }

    console.log('Found tab:', tab);
    console.log('Tab classes:', Array.from(tab.classList));

    // 직접 클릭 핸들러 호출
    const cards = document.querySelectorAll('.instructor-card');
    const tabs = document.querySelectorAll('.instructor-tab');
    const grid = document.querySelector('.instructor-grid');

    console.log('Calling handleTabClick directly...');
    handleTabClick(
        { preventDefault: () => { }, stopPropagation: () => { } },
        tab,
        tabs,
        cards,
        grid
    );

    return true;
};

// 페이지 상태 체크
window.checkPageState = function () {
    console.log('===== PAGE STATE =====');
    console.log('DOM ready state:', document.readyState);
    console.log('Window loaded:', document.readyState === 'complete');
    console.log('isInitialized:', isInitialized);

    // 요소 존재 확인
    const tabs = document.querySelectorAll('.instructor-tab');
    const cards = document.querySelectorAll('.instructor-card');
    console.log('Current elements:', { tabs: tabs.length, cards: cards.length });

    // 초기화 강제 실행
    if (!isInitialized && document.readyState === 'complete') {
        console.log('Attempting manual initialization...');
        initializePage();
    }

    return {
        domState: document.readyState,
        isInitialized,
        elementCounts: { tabs: tabs.length, cards: cards.length }
    };
};

// 강제 재초기화 함수
window.reinitializeInstructors = function () {
    console.log('===== FORCE REINITIALIZE =====');
    isInitialized = false;
    tabClickCount = 0;

    // 잠시 대기 후 초기화
    setTimeout(() => {
        initializePage();
    }, 100);

    return 'Reinitialization started...';
};

// 페이지 로드 완료 시 추가 확인
window.addEventListener('load', function () {
    console.log('Window load event fired');
    if (!isInitialized) {
        console.log('Not initialized yet, attempting...');
        setTimeout(() => {
            initializePage();
        }, 100);
    }
});

// 개발 모드용 전역 함수들
window.instructorPageUtils = {
    getInitStatus: () => isInitialized,
    forceInit: () => initializePage(),
    debug: window.debugInstructors,
    testClick: window.testTabClick,
    checkState: window.checkPageState
};

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