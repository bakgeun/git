/**
 * Header Component JavaScript
 * Firebase 인증과 통합된 헤더 컴포넌트 스크립트
 * 관리자 페이지 호환성 개선 버전
 */

console.log('=== header.js 파일 로드 시작 ===');

// 전역 변수로 현재 사용자 정보 저장
let currentUser = null;
let currentUserType = null;

// 페이지 타입 감지
function detectPageType() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/')) {
        return 'admin';
    } else if (currentPath.includes('/auth/')) {
        return 'auth';
    } else if (currentPath.includes('/mypage/')) {
        return 'mypage';
    }
    return 'general';
}

// 초기화 함수
function initHeader() {
    console.log('=== 헤더 초기화 시작 ===');

    const pageType = detectPageType();
    console.log('페이지 타입 감지:', pageType);

    // Firebase가 로드될 때까지 기다림
    waitForFirebase().then(() => {
        console.log('=== Firebase 준비 완료, 인증 리스너 설정 ===');
        // Firebase 인증 상태 변화 감지
        initAuthStateListener();

        // 모바일 메뉴 초기화 (요소 존재 시에만)
        initMobileMenu();

        // 전역 객체에 함수 등록
        window.headerLogin = login;
        window.headerLogout = logout;
        window.headerCheckAuth = checkAuthState;
    });
}

// DOM이 준비되었는지 확인하고 초기화
if (document.readyState === 'loading') {
    console.log('=== DOM 로딩 중, DOMContentLoaded 이벤트 대기 ===');
    document.addEventListener('DOMContentLoaded', initHeader);
} else {
    console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
    initHeader();
}

// Firebase 로드 대기
async function waitForFirebase() {
    let attempts = 0;
    const maxAttempts = 50; // 5초 대기

    while (!window.dhcFirebase && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.dhcFirebase) {
        console.error('Firebase가 로드되지 않았습니다.');
        return;
    }

    console.log('Firebase 인증 초기화 완료');
}

// Firebase 인증 상태 리스너 초기화
function initAuthStateListener() {
    if (!window.dhcFirebase) {
        console.error('Firebase가 없습니다.');
        return;
    }

    console.log('Firebase 인증 상태 리스너 설정');

    window.dhcFirebase.onAuthStateChanged(function (user) {
        console.log('인증 상태 변화 감지:', user ? '로그인됨' : '로그아웃됨');

        if (user) {
            // 로그인된 사용자
            getUserDetails(user);
        } else {
            // 로그아웃된 사용자
            currentUser = null;
            currentUserType = null;
            updateAuthUI(null, null);
            updateMobileAuthStatus();
        }
    });
}

// 사용자 상세 정보 가져오기
async function getUserDetails(user) {
    try {
        // Firestore에서 사용자 정보 가져오기
        const userDoc = await window.dhcFirebase.db.collection('users').doc(user.uid).get();

        let userType = 'student'; // 기본값

        if (userDoc.exists) {
            const userData = userDoc.data();
            userType = userData.userType || 'student';
        }

        currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified
        };

        currentUserType = userType;

        updateAuthUI(currentUser, userType);
        updateMobileAuthStatus();

    } catch (error) {
        console.error('사용자 정보 조회 오류:', error);

        // 기본 정보로 설정 (Firestore 오류 시에도 UI 업데이트)
        currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified
        };

        currentUserType = 'student';

        updateAuthUI(currentUser, currentUserType);
        updateMobileAuthStatus();
    }
}

// 인증 상태 확인 (기존 호환성 유지)
function checkAuthState() {
    console.log('인증 상태 확인...');
    // Firebase에서 자동으로 처리되므로 별도 작업 불필요
}

// 로그인 처리 (기존 호환성 유지)
async function login(email, password) {
    console.log('로그인 시도:', email);

    if (!window.dhcFirebase) {
        console.error('Firebase가 초기화되지 않았습니다.');
        return { success: false, error: 'Firebase 초기화 오류' };
    }

    try {
        const result = await window.dhcFirebase.auth.signInWithEmailAndPassword(email, password);
        console.log('로그인 성공');
        return { success: true, user: result.user };
    } catch (error) {
        console.error('로그인 실패:', error);
        return { success: false, error: error.message };
    }
}

// 로그아웃 처리
async function logout() {
    console.log('로그아웃 처리');

    if (!window.dhcFirebase) {
        console.error('Firebase가 초기화되지 않았습니다.');
        return;
    }

    try {
        await window.dhcFirebase.auth.signOut();
        console.log('로그아웃 완료');

        // 홈페이지로 리다이렉트
        window.location.href = window.adjustPath ? window.adjustPath('index.html') : 'index.html';
    } catch (error) {
        console.error('로그아웃 오류:', error);
    }
}

// 인증 UI 업데이트 (수정됨 - 요소 존재 확인)
function updateAuthUI(user, userType) {
    console.log('UI 업데이트 중...', user, userType);

    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) {
        console.warn('auth-buttons 요소를 찾을 수 없음 - 관리자 페이지이거나 해당 요소가 없는 페이지입니다.');
        return;
    }

    console.log('auth-buttons 요소 찾음:', authButtons);

    if (user) {
        // 로그인 상태
        const displayName = user.displayName || user.email;
        console.log('사용자 이름:', displayName, '타입:', userType);

        // 관리자 메뉴
        let adminMenu = '';
        if (userType === 'admin') {
            adminMenu = `
                <button onclick="window.location.href=window.adjustPath('pages/admin/dashboard.html')" 
                        class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md text-blue-600">
                    관리자 페이지
                </button>
            `;
        }

        authButtons.innerHTML = `
            <div class="user-menu relative">
                <button onclick="toggleUserMenu()" class="flex items-center text-sm text-gray-600 hover:text-blue-600">
                    <span class="mr-1">${displayName}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                <div id="user-dropdown" class="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md p-2 hidden z-10">
                    <button onclick="window.location.href=window.adjustPath('pages/mypage/personal-info.html')" 
                            class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md">마이페이지</button>
                    <button onclick="window.location.href=window.adjustPath('pages/mypage/course-history.html')" 
                            class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md">수강 내역</button>
                    <button onclick="window.location.href=window.adjustPath('pages/mypage/cert-management.html')" 
                            class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md">자격증 관리</button>
                    ${adminMenu}
                    <div class="border-t border-gray-200 my-1"></div>
                    <button onclick="logout()" class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md text-red-600">로그아웃</button>
                </div>
            </div>
        `;

    } else {
        // 로그아웃 상태
        authButtons.innerHTML = `
            <a href="javascript:window.location.href=window.adjustPath('pages/auth/login.html')" 
               class="login-btn text-sm text-gray-600 hover:text-blue-600 mr-4">로그인</a>
            <a href="javascript:window.location.href=window.adjustPath('pages/auth/signup.html')" 
               class="signup-btn text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">회원가입</a>
        `;
    }

    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', function (e) {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('user-dropdown');

        if (userMenu && dropdown && !userMenu.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    console.log('UI 업데이트 완료, auth-buttons 내용:', authButtons.innerHTML);
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// 모바일 메뉴 초기화 (수정됨 - 요소 존재 확인)
function initMobileMenu() {
    console.log('모바일 메뉴 초기화');

    const mobileButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    const mobileClose = document.getElementById('mobile-menu-close');

    console.log('모바일 요소들:', {
        button: !!mobileButton,
        overlay: !!mobileOverlay,
        close: !!mobileClose
    });

    if (!mobileButton || !mobileOverlay) {
        console.warn('모바일 메뉴 요소를 찾을 수 없습니다 - 관리자 페이지이거나 모바일 메뉴가 없는 페이지입니다.');
        return;
    }

    // 모바일 메뉴 토글
    mobileButton.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('모바일 메뉴 버튼 클릭');
        toggleMobileMenu();
    });

    // 모바일 메뉴 닫기
    if (mobileClose) {
        mobileClose.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('모바일 메뉴 닫기 버튼 클릭');
            closeMobileMenu();
        });
    }

    // 오버레이 클릭 시 닫기
    mobileOverlay.addEventListener('click', function (e) {
        if (e.target === mobileOverlay) {
            console.log('오버레이 클릭');
            closeMobileMenu();
        }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !mobileOverlay.classList.contains('hidden')) {
            console.log('ESC 키 눌림');
            closeMobileMenu();
        }
    });

    // 전역 함수로 등록
    window.createMobileMenu = createMobileMenu;
    window.updateMobileAuthStatus = updateMobileAuthStatus;
}

// 모바일 메뉴 토글 (수정됨 - 요소 존재 확인)
function toggleMobileMenu() {
    const mobileButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');

    if (!mobileButton || !mobileOverlay) {
        console.warn('모바일 메뉴 요소가 없어 토글할 수 없습니다.');
        return;
    }

    const isExpanded = mobileButton.getAttribute('aria-expanded') === 'true';
    console.log('모바일 메뉴 토글, 현재 상태:', isExpanded);

    if (isExpanded) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

// 모바일 메뉴 열기 (수정됨 - 요소 존재 확인)
function openMobileMenu() {
    console.log('모바일 메뉴 열기');

    const mobileButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');

    if (!mobileButton || !mobileOverlay) {
        console.warn('모바일 메뉴 요소가 없어 열 수 없습니다.');
        return;
    }

    mobileButton.setAttribute('aria-expanded', 'true');
    mobileButton.classList.add('active');

    mobileOverlay.classList.remove('hidden');
    setTimeout(() => {
        mobileOverlay.classList.add('show');
    }, 10);

    document.body.style.overflow = 'hidden';

    // 인증 상태 업데이트 후 메뉴 생성
    updateMobileAuthStatus();
    createMobileMenu();
}

// 모바일 메뉴 닫기 (수정됨 - 요소 존재 확인)
function closeMobileMenu() {
    console.log('모바일 메뉴 닫기');

    const mobileButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');

    if (!mobileButton || !mobileOverlay) {
        console.warn('모바일 메뉴 요소가 없어 닫을 수 없습니다.');
        return;
    }

    mobileButton.setAttribute('aria-expanded', 'false');
    mobileButton.classList.remove('active');

    mobileOverlay.classList.remove('show');
    setTimeout(() => {
        mobileOverlay.classList.add('hidden');
    }, 300);

    document.body.style.overflow = '';
}

// 모바일 메뉴 생성 (KSPO 스타일) - 수정됨 - 요소 존재 확인
function createMobileMenu() {
    console.log('모바일 메뉴 생성 시작, 현재 사용자:', currentUser);

    // 모바일 메뉴 컨테이너 찾기
    const mobileMenuContent = document.querySelector('#mobile-menu-overlay .overflow-y-auto');
    if (!mobileMenuContent) {
        console.warn('모바일 메뉴 컨테이너를 찾을 수 없습니다 - 관리자 페이지이거나 모바일 메뉴가 없는 페이지입니다.');
        return;
    }

    // 기존 내용 초기화
    mobileMenuContent.innerHTML = `
        <div class="p-4">
            <!-- 회원 정보 영역 -->
            <div class="mb-6 p-4 bg-white rounded-lg shadow-sm">
                <span class="text-blue-600 font-semibold">로그인 해주세요 ></span>
            </div>

            <!-- 메인 메뉴 -->
            <div class="space-y-2">
                <!-- 동적으로 생성됨 -->
            </div>
        </div>
    `;

    // 사용자 정보 영역과 메뉴 컨테이너 가져오기
    const userInfoDiv = mobileMenuContent.querySelector('.mb-6.p-4.bg-white.rounded-lg.shadow-sm');
    const menuContainer = mobileMenuContent.querySelector('.space-y-2');

    // 사용자 정보 업데이트
    if (currentUser) {
        const displayName = currentUser.displayName || currentUser.email.split('@')[0];
        userInfoDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-blue-600 font-semibold">${displayName} 님</span>
                <button onclick="logout()" class="text-red-500 text-sm hover:text-red-700">
                    로그아웃
                </button>
            </div>
        `;
    } else {
        userInfoDiv.innerHTML = `
            <span class="text-blue-600 font-semibold cursor-pointer" 
                  onclick="closeMobileMenu(); window.location.href=window.adjustPath('pages/auth/login.html')">
                로그인 해주세요 &gt;
            </span>
        `;
    }

    // 메뉴 항목 정의
    const menuItems = [
        {
            title: '홈',
            icon: '🏠',
            url: 'index.html',
            items: [] // 빈 배열 추가 (직접 링크)
        },
        {
            title: '기관 소개',
            icon: '🏢',
            items: [
                { name: '센터장 인사말', url: 'pages/about.html#greeting' },
                { name: '미션과 핵심가치', url: 'pages/about.html#mission' },
                { name: '조직도', url: 'pages/about.html#organization' },
                { name: '주요 사업영역', url: 'pages/about.html#business' },
                { name: '협력 네트워크', url: 'pages/about.html#partners' }
            ]
        },
        {
            title: '자문위원',
            icon: '👔',
            url: 'pages/advisor.html',
            items: [] // 직접 링크
        },
        {
            title: '학술·연구',
            icon: '🔬',
            items: [
                { name: '국내', url: 'pages/research/domestic.html' },
                { name: '국제', url: 'pages/research/international.html' }
            ]
        },
        {
            title: '자격증 소개',
            icon: '🏆',
            items: [
                { name: '운동건강관리사', url: 'pages/certificate/health-exercise.html' },
                { name: '스포츠헬스케어지도자', url: 'pages/certificate/rehabilitation.html' },
                { name: '필라테스전문가', url: 'pages/certificate/pilates.html' },
                { name: '레크리에이션지도자', url: 'pages/certificate/recreation.html' }
            ]
        },
        {
            title: '교육 과정',
            icon: '📚',
            items: [
                { name: '강사 소개', url: 'pages/education/instructors.html' },
                { name: '교육 신청', url: 'pages/education/course-application.html' },
                { name: '자격증 신청', url: 'pages/education/cert-application.html' }
            ]
        },
        {
            title: '게시판',
            icon: '📋',
            items: [
                { name: '공지사항', url: 'pages/board/notice/index.html' },
                { name: '칼럼', url: 'pages/board/column/index.html' },
                { name: '강의자료', url: 'pages/board/materials/index.html' },
                { name: '동영상 강의', url: 'pages/board/videos/index.html' }
            ]
        }
    ];

    // 로그인한 사용자를 위한 추가 메뉴
    if (currentUser) {
        menuItems.push({
            title: '마이페이지',
            icon: '👤',
            items: [
                { name: '개인정보 관리', url: 'pages/mypage/personal-info.html' },
                { name: '수강 내역', url: 'pages/mypage/course-history.html' },
                { name: '자격증 관리', url: 'pages/mypage/cert-management.html' },
                { name: '결제 내역', url: 'pages/mypage/payment-history.html' }
            ]
        });

        // 관리자인 경우 관리자 메뉴 추가
        if (currentUserType === 'admin') {
            menuItems.push({
                title: '관리자',
                icon: '⚙️',
                items: [
                    { name: '대시보드', url: 'pages/admin/dashboard.html' },
                    { name: '회원 관리', url: 'pages/admin/user-management.html' },
                    { name: '교육 관리', url: 'pages/admin/course-management.html' },
                    { name: '자격증 관리', url: 'pages/admin/cert-management.html' },
                    { name: '게시판 관리', url: 'pages/admin/board-management.html' },
                    { name: '결제 관리', url: 'pages/admin/payment-management.html' }
                ]
            });
        }
    }

    // 메뉴 항목 생성
    menuItems.forEach(menu => {
        const menuDiv = document.createElement('div');
        menuDiv.className = 'mobile-menu-item';

        // items가 없거나 빈 배열인 경우 (직접 링크)
        if (!menu.items || menu.items.length === 0) {
            const link = document.createElement('a');
            link.className = 'w-full text-left p-3 bg-white rounded-lg shadow-sm font-semibold text-gray-800 flex items-center';
            link.href = window.adjustPath ? window.adjustPath(menu.url) : menu.url;
            link.onclick = () => closeMobileMenu();
            link.innerHTML = `
            <span class="mr-2">${menu.icon}</span>
            ${menu.title}
        `;
            menuDiv.appendChild(link);
        }
        // items가 있는 경우 (드롭다운 메뉴)
        else {
            const menuButton = document.createElement('button');
            menuButton.className = 'w-full text-left p-3 bg-white rounded-lg shadow-sm font-semibold text-gray-800 flex justify-between items-center';
            menuButton.innerHTML = `
            <span class="flex items-center">
                <span class="mr-2">${menu.icon}</span>
                ${menu.title}
            </span>
            <span class="toggle-icon">▷</span>
        `;

            const submenuDiv = document.createElement('div');
            submenuDiv.className = 'mobile-submenu mt-2 ml-4 space-y-1 hidden';

            menu.items.forEach(item => {
                const link = document.createElement('a');
                link.className = 'block p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded';
                link.href = window.adjustPath ? window.adjustPath(item.url) : item.url;
                link.textContent = item.name;
                link.onclick = () => closeMobileMenu();
                submenuDiv.appendChild(link);
            });

            menuButton.onclick = () => {
                const toggleIcon = menuButton.querySelector('.toggle-icon');
                const isOpen = !submenuDiv.classList.contains('hidden');

                // 다른 메뉴 닫기
                menuContainer.querySelectorAll('.mobile-submenu').forEach(sub => {
                    if (sub !== submenuDiv) {
                        sub.classList.add('hidden');
                        sub.parentElement.querySelector('.toggle-icon').textContent = '▷';
                        sub.parentElement.querySelector('.toggle-icon').classList.remove('open');
                    }
                });

                // 현재 메뉴 토글
                submenuDiv.classList.toggle('hidden');
                if (submenuDiv.classList.contains('hidden')) {
                    toggleIcon.textContent = '▷';
                    toggleIcon.classList.remove('open');
                } else {
                    toggleIcon.textContent = '▽';
                    toggleIcon.classList.add('open');
                }

                // CSS에서 애니메이션 처리
                submenuDiv.classList.add('open');
            };

            menuDiv.appendChild(menuButton);
            menuDiv.appendChild(submenuDiv);
        }

        menuContainer.appendChild(menuDiv);
    });
}

// 창 크기 변경 시 모바일 메뉴 닫기
window.addEventListener('resize', function () {
    // 1200px 이상일 때 모바일 메뉴 닫기
    if (window.innerWidth >= 1200) {
        closeMobileMenu();
    }
});

// 모바일 인증 상태 업데이트 (호환성 유지)
function updateMobileAuthStatus() {
    console.log('모바일 인증 상태 업데이트, 현재 사용자:', currentUser);
    // 실제 업데이트는 createMobileMenu에서 처리됨
}

// 전역 함수로 등록 (관리자 페이지에서 사용)
window.toggleUserMenu = toggleUserMenu;

// 부드러운 스크롤 기능 - 해시 링크 처리
(function() {
    // 헤더 높이 계산 함수
    function getHeaderHeight() {
        const header = document.getElementById('main-header');
        return header ? header.offsetHeight + 20 : 100; // 20px 여유 공간
    }

    // 섹션으로 스크롤하는 함수
    function scrollToSection(targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            const headerHeight = getHeaderHeight();
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // 페이지 로드 시 해시가 있으면 해당 섹션으로 스크롤
    if (window.location.hash) {
        setTimeout(function() {
            const targetId = window.location.hash.substring(1);
            scrollToSection(targetId);
        }, 100);
    }

    // 페이지 내 모든 해시 링크에 부드러운 스크롤 적용
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a[href*="#"]');
        if (target && target.hash) {
            const targetId = target.hash.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // URL 업데이트
                history.pushState(null, null, target.hash);
                
                // 부드러운 스크롤
                scrollToSection(targetId);
            }
        }
    });
})();

// ========================================
// 드롭다운 메뉴 완전 제어 시스템
// ========================================
(function initDropdownMenuSystem() {
    console.log('=== 드롭다운 메뉴 시스템 초기화 ===');
    
    // 스타일 태그가 없으면 추가
    if (!document.querySelector('#dropdown-control-styles')) {
        const style = document.createElement('style');
        style.id = 'dropdown-control-styles';
        style.textContent = `
            .nav-item .submenu {
                display: none !important;
            }
            .nav-item.dropdown-open .submenu {
                display: block !important;
            }
        `;
        document.head.appendChild(style);
        console.log('드롭다운 제어 스타일 추가됨');
    }
    
    // 드롭다운 초기화 함수
    function initDropdowns() {
        const navItems = document.querySelectorAll('.nav-item.group.relative');
        
        if (navItems.length === 0) {
            console.log('드롭다운 메뉴를 찾을 수 없음, 나중에 다시 시도');
            return false;
        }
        
        console.log('드롭다운 초기화 시작, 발견된 메뉴:', navItems.length);

        navItems.forEach(item => {
            const mainLink = item.querySelector('a.nav-link');
            const submenu = item.querySelector('.submenu');

            if (mainLink && submenu) {
                // 기존 이벤트 리스너 제거 (중복 방지)
                if (item._mouseenterHandler) {
                    item.removeEventListener('mouseenter', item._mouseenterHandler);
                }
                if (item._mouseleaveHandler) {
                    item.removeEventListener('mouseleave', item._mouseleaveHandler);
                }
                
                // 마우스 오버 시 열기
                item._mouseenterHandler = function () {
                    // 먼저 모든 다른 드롭다운 닫기
                    navItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('dropdown-open');
                        }
                    });
                    
                    // 현재 드롭다운 열기
                    this.classList.add('dropdown-open');
                };
                
                item.addEventListener('mouseenter', item._mouseenterHandler);

                // 마우스 아웃 시 닫기
                item._mouseleaveHandler = function () {
                    this.classList.remove('dropdown-open');
                };
                
                item.addEventListener('mouseleave', item._mouseleaveHandler);

                // 서브메뉴 링크 클릭 시 강제로 닫기
                submenu.querySelectorAll('a').forEach(link => {
                    // 기존 리스너 제거
                    if (link._clickHandler) {
                        link.removeEventListener('click', link._clickHandler);
                    }
                    
                    link._clickHandler = function () {
                        // 모든 드롭다운 닫기
                        navItems.forEach(navItem => {
                            navItem.classList.remove('dropdown-open');
                        });
                    };
                    
                    link.addEventListener('click', link._clickHandler);
                });
            }
        });
        
        console.log('드롭다운 초기화 완료');
        return true;
    }
    
    // 즉시 초기화 시도
    const initialized = initDropdowns();
    
    // 실패하면 DOM 로드 후 재시도
    if (!initialized) {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded 이벤트에서 드롭다운 재초기화');
            initDropdowns();
        });
    }
    
    // 페이지 완전 로드 후에도 재초기화 (header.js 로드 타이밍 문제 해결)
    window.addEventListener('load', function() {
        setTimeout(function() {
            console.log('window.load 이벤트에서 드롭다운 재초기화');
            initDropdowns();
        }, 100);
    });
    
    // 전역 함수로 노출 (필요시 수동 재초기화)
    window.reinitDropdowns = initDropdowns;
    
    console.log('=== 드롭다운 메뉴 시스템 설정 완료 ===');
})();