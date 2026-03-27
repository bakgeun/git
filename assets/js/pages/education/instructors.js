// instructors.js - 강사 소개 페이지 전용 JavaScript (가로 레이아웃)

// 전역 변수
let isInitialized = false;

// Firestore에서 강사 데이터 로드
async function loadInstructorsFromFirestore() {
    console.log('🔥 Firestore에서 강사 데이터 로드 시작');

    // HTML 정적 데이터만 사용하려면 여기를 true로 변경
    const USE_STATIC_HTML_ONLY = false;
    
    if (USE_STATIC_HTML_ONLY) {
        console.log('📄 HTML 정적 데이터만 사용하도록 설정됨');
        return false;
    }

    try {
        if (!window.dhcFirebase || !window.dhcFirebase.db) {
            console.warn('Firebase 미연동, 하드코딩된 데이터 사용');
            return false;
        }

        const snapshot = await window.dhcFirebase.db
            .collection('instructors')
            .orderBy('order', 'asc')
            .get();

        if (snapshot.empty) {
            console.warn('강사 데이터가 없습니다.');
            return false;
        }

        // active가 true인 것만 필터링 (클라이언트 측)
        const activeInstructors = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.active !== false) {  // active가 false가 아니면 포함
                activeInstructors.push(data);
            }
        });

        if (activeInstructors.length === 0) {
            console.warn('활성화된 강사가 없습니다.');
            return false;
        }

        // 기존 카드들 제거
        const grid = document.querySelector('.instructor-grid-horizontal');
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

// 강사 카드 생성 함수 (가로 레이아웃 + 4줄 형식 + 완벽한 들여쓰기)
function createInstructorCard(instructor) {
    const card = document.createElement('div');
    card.className = 'instructor-card-horizontal';

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

    // 과정명 매핑
    const courseNames = {
        'health': '운동건강관리사 과정',
        'rehab': '스포츠헬스케어지도자 과정',
        'pilates': '필라테스 전문가 과정',
        'recreation': '레크리에이션 지도자 과정'
    };

    // 배지 클래스 매핑
    const badgeClasses = {
        'health': 'badge-health',
        'rehab': 'badge-rehab',
        'pilates': 'badge-pilates',
        'recreation': 'badge-recreation'
    };

    const courseName = courseNames[mainCategory] || '전문 과정';
    const badgeClass = badgeClasses[mainCategory] || 'badge-health';

    // 4줄 형식으로 데이터 구성
    let contentHTML = '';
    
    // 1. Position (주요 직책) - 첫 번째 항목
    if (instructor.position) {
        contentHTML += `<li class="position-item">${instructor.position}</li>`;
    }
    
    // 2. 전문분야 - 박민선 교수는 3개, 2개로 줄바꿈
    if (instructor.specialties_detail && Array.isArray(instructor.specialties_detail) && instructor.specialties_detail.length > 0) {
        let specialtiesHTML;
        
        // 박민선 교수 (instructor3)는 전문분야를 2줄로
        if (instructor.name === '박민선 교수' || instructor.order === 3) {
            const line1 = instructor.specialties_detail.slice(0, 3).join(', ');
            const line2 = instructor.specialties_detail.slice(3).join(', ');
            specialtiesHTML = [line1, line2].filter(Boolean).join('<br>');
        } else {
            // 나머지는 한 줄로
            specialtiesHTML = instructor.specialties_detail.join(', ');
        }
        
        contentHTML += `<li class="section-item"><span class="section-label">전문분야 :</span> ${specialtiesHTML}</li>`;
    }
    
    // 3. 학력 - 박민선 교수는 2개, 1개로 줄바꿈
    if (instructor.education && Array.isArray(instructor.education) && instructor.education.length > 0) {
        let educationHTML;
        
        // 박민선 교수 (instructor3)는 학력을 2줄로
        if (instructor.name === '박민선 교수' || instructor.order === 3) {
            const line1 = instructor.education.slice(0, 2).join(', ');
            const line2 = instructor.education.slice(2).join(', ');
            educationHTML = [line1, line2].filter(Boolean).join('<br>');
        } else {
            // 나머지는 한 줄로
            educationHTML = instructor.education.join(', ');
        }
        
        contentHTML += `<li class="section-item"><span class="section-label">학력 :</span> ${educationHTML}</li>`;
    }
    
    // 4. 경력 - 박성언 교수는 3줄, 나머지는 2개씩 묶어서 줄바꿈
    if (instructor.career && Array.isArray(instructor.career) && instructor.career.length > 0) {
        let careerHTML;
        
        // 박성언 교수 (instructor4)는 경력을 3줄로 표시
        if (instructor.name === '박성언 교수' || instructor.order === 4) {
            // 첫 줄: 2개, 둘째 줄: 1개, 셋째 줄: 1개
            const line1 = instructor.career.slice(0, 2).join(', ');
            const line2 = instructor.career[2] || '';
            const line3 = instructor.career[3] || '';
            careerHTML = [line1, line2, line3].filter(Boolean).join('<br>');
        } else {
            // 나머지는 2개씩 묶어서 줄바꿈
            const careerChunks = [];
            for (let i = 0; i < instructor.career.length; i += 2) {
                const chunk = instructor.career.slice(i, i + 2).join(', ');
                careerChunks.push(chunk);
            }
            careerHTML = careerChunks.join('<br>');
        }
        
        contentHTML += `<li class="section-item"><span class="section-label">경력 :</span> ${careerHTML}</li>`;
    }

    if (instructor.comingSoon) {
        card.innerHTML = `
            <div class="instructor-info-horizontal">
                <div class="instructor-header-row">
                    <span class="course-badge ${badgeClass}">${courseName}</span>
                </div>
                <p style="margin-top: 12px; font-size: 1rem; color: #555;">과정 개설 준비중</p>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="instructor-photo-small">
                <img src="${instructor.photoUrl}" alt="${instructor.name}" onerror="this.src='../../assets/images/instructors/default.jpg'">
            </div>
            <div class="instructor-info-horizontal">
                <div class="instructor-header-row">
                    <h3 class="instructor-name-horizontal">${instructor.name}</h3>
                    <span class="course-badge ${badgeClass}">${courseName}</span>
                </div>
                <ul class="instructor-details-list">
                    ${contentHTML}
                </ul>
            </div>
        `;
    }

    return card;
}

// 페이지 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function () {
    console.log('===== DOM Content Loaded =====');
    console.log('Timestamp:', new Date().toISOString());

    // 약간의 지연 후 초기화 (DOM 완전 로드 보장)
    console.log('Starting initialization...');
    setTimeout(() => {
        initializePage();
    }, 100);
});

// 메인 초기화 함수
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

        // 2. 요소 찾기 (가로 레이아웃용)
        const cards = document.querySelectorAll('.instructor-card-horizontal');
        const grid = document.querySelector('.instructor-grid-horizontal');

        console.log('Elements found:', {
            cards: cards.length,
            grid: grid ? 'Yes' : 'No'
        });

        if (cards.length === 0) {
            console.warn('No instructor cards found! Using HTML static content.');
            // HTML 정적 컨텐츠 사용, 애니메이션만 적용
            isInitialized = true;
            return true;
        }

        // 3. 카드 초기화
        console.log('2. Initializing cards...');
        initializeCards(cards);

        // 4. 카드 애니메이션
        console.log('3. Adding card animations...');
        initInstructorCards(cards);

        // 5. 이미지 에러 처리
        console.log('4. Setting up image error handling...');
        initImageErrorHandling();

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
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';

        const category = card.getAttribute('data-category');
        console.log(`Card ${index} initialized:`, {
            category,
            opacity: card.style.opacity
        });
    });

    console.log('Cards initialization complete');
}

// 카드 호버 애니메이션
function initInstructorCards(cards) {
    console.log('Setting up card hover animations...');

    cards.forEach((card, index) => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
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

    const images = document.querySelectorAll('.instructor-photo-small img');
    let handleCount = 0;

    images.forEach((img, index) => {
        img.addEventListener('error', function () {
            console.log(`Image error for image ${index}:`, this.src);

            const placeholder = document.createElement('div');
            placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-100 rounded-lg';
            placeholder.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            `;

            this.parentNode.replaceChild(placeholder, this);
            handleCount++;
        });
    });

    console.log(`Image error handling set for ${images.length} images`);
}

// 디버깅 함수
window.debugInstructors = function () {
    console.log('===== DEBUG INFO =====');
    console.log('isInitialized:', isInitialized);

    const cards = document.querySelectorAll('.instructor-card-horizontal');

    console.log('Current card states:');
    cards.forEach((card, i) => {
        console.log(`Card ${i}:`, {
            category: card.getAttribute('data-category'),
            opacity: card.style.opacity,
            visible: card.offsetHeight > 0
        });
    });

    return {
        isInitialized,
        cardsCount: cards.length
    };
};

// 페이지 상태 체크
window.checkPageState = function () {
    console.log('===== PAGE STATE =====');
    console.log('DOM ready state:', document.readyState);
    console.log('Window loaded:', document.readyState === 'complete');
    console.log('isInitialized:', isInitialized);

    // 요소 존재 확인
    const cards = document.querySelectorAll('.instructor-card-horizontal');
    console.log('Current elements:', { cards: cards.length });

    // 초기화 강제 실행
    if (!isInitialized && document.readyState === 'complete') {
        console.log('Attempting manual initialization...');
        initializePage();
    }

    return {
        domState: document.readyState,
        isInitialized,
        elementCounts: { cards: cards.length }
    };
};

// 강제 재초기화 함수
window.reinitializeInstructors = function () {
    console.log('===== FORCE REINITIALIZE =====');
    isInitialized = false;

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
    checkState: window.checkPageState
};

// 네비게이션 탭 스크롤 함수 (모바일용)
function scrollActiveTabIntoView() {
    const activeTab = document.querySelector('.navigation-tabs .tab-item.active');
    if (activeTab && window.innerWidth <= 768) {
        const container = document.querySelector('.navigation-tabs nav');
        if (!container) return;
        
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

// 화면 크기 변경 시 실행
window.addEventListener('resize', scrollActiveTabIntoView);