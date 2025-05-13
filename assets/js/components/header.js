/**
 * Simplified Header Component JavaScript
 * 간단화된 헤더 컴포넌트 스크립트
 */

// 전역 변수로 현재 사용자 정보 저장
let currentUser = null;
let currentUserType = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('헤더 스크립트 로드됨');
    
    // 인증 상태 확인
    checkAuthState();
    
    // 모바일 메뉴 초기화
    initMobileMenu();
    
    // 전역 객체에 함수 등록
    window.headerLogin = login;
    window.headerLogout = logout;
    window.headerCheckAuth = checkAuthState;
});

// 인증 상태 확인
function checkAuthState() {
    console.log('인증 상태 확인 중...');
    
    try {
        const savedUser = localStorage.getItem('mockUser');
        const savedUserType = localStorage.getItem('mockUserType');
        
        console.log('저장된 사용자:', savedUser);
        console.log('사용자 타입:', savedUserType);
        
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            currentUserType = savedUserType;
            updateAuthUI(currentUser, currentUserType);
            console.log('로그인된 사용자 발견:', currentUser);
        } else {
            updateAuthUI(null, null);
            console.log('로그인된 사용자 없음');
        }
        
        // 모바일 인증 상태도 함께 업데이트
        updateMobileAuthStatus();
    } catch (error) {
        console.error('인증 상태 확인 중 오류:', error);
        updateAuthUI(null, null);
        updateMobileAuthStatus();
    }
}

// 로그인 처리
function login(email, password) {
    console.log('로그인 시도:', email);
    
    // 테스트 계정 확인
    if (email === 'admin@test.com' && password === 'admin123') {
        const user = {
            email: 'admin@test.com',
            displayName: '관리자',
            uid: 'admin'
        };
        
        localStorage.setItem('mockUser', JSON.stringify(user));
        localStorage.setItem('mockUserType', 'admin');
        
        currentUser = user;
        currentUserType = 'admin';
        
        updateAuthUI(user, 'admin');
        
        console.log('관리자 로그인 성공');
        return { success: true, user: user };
        
    } else if (email === 'student@test.com' && password === 'student123') {
        const user = {
            email: 'student@test.com',
            displayName: '학생',
            uid: 'student'
        };
        
        localStorage.setItem('mockUser', JSON.stringify(user));
        localStorage.setItem('mockUserType', 'student');
        
        currentUser = user;
        currentUserType = 'student';
        
        updateAuthUI(user, 'student');
        
        console.log('학생 로그인 성공');
        return { success: true, user: user };
        
    } else {
        console.log('로그인 실패');
        return { success: false, error: '이메일 또는 비밀번호가 잘못되었습니다.' };
    }
}

// 로그아웃 처리
function logout() {
    console.log('로그아웃 처리');
    
    localStorage.removeItem('mockUser');
    localStorage.removeItem('mockUserType');
    
    currentUser = null;
    currentUserType = null;
    
    updateAuthUI(null, null);
    
    // 홈페이지로 리다이렉트
    window.location.href = window.adjustPath ? window.adjustPath('index.html') : 'index.html';
}

// 인증 UI 업데이트
function updateAuthUI(user, userType) {
    console.log('UI 업데이트 중...', user, userType);
    
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) {
        console.error('auth-buttons 요소를 찾을 수 없음');
        return;
    }
    
    // 기존 모바일 메뉴 버튼 보존
    const mobileButton = document.getElementById('mobile-menu-button');
    
    if (user) {
        // 로그인 상태
        const displayName = user.displayName || user.email;
        
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
        
        // 모바일 메뉴 인증 상태 업데이트
        const mobileAuthStatus = document.getElementById('mobile-auth-status');
        if (mobileAuthStatus) {
            mobileAuthStatus.innerHTML = `${displayName} 님 <span class="text-red-500 cursor-pointer" onclick="logout()">로그아웃</span>`;
        }
        
    } else {
        // 로그아웃 상태
        authButtons.innerHTML = `
            <a href="javascript:window.location.href=window.adjustPath('pages/auth/login.html')" 
               class="login-btn text-sm text-gray-600 hover:text-blue-600 mr-4">로그인</a>
            <a href="javascript:window.location.href=window.adjustPath('pages/auth/signup.html')" 
               class="signup-btn text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">회원가입</a>
        `;
        
        // 모바일 메뉴 인증 상태 업데이트
        const mobileAuthStatus = document.getElementById('mobile-auth-status');
        if (mobileAuthStatus) {
            mobileAuthStatus.innerHTML = '<span class="cursor-pointer" onclick="window.location.href=window.adjustPath(\'pages/auth/login.html\')">로그인 해주세요</span> >';
        }
    }
    
    // 모바일 메뉴 버튼 다시 추가
    if (mobileButton) {
        authButtons.appendChild(mobileButton);
    }
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', function(e) {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('user-dropdown');
        
        if (userMenu && dropdown && !userMenu.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// 사용자 메뉴 토글
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// 모바일 메뉴 초기화
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
        console.error('모바일 메뉴 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 모바일 메뉴 토글
    mobileButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('모바일 메뉴 버튼 클릭');
        toggleMobileMenu();
    });
    
    // 모바일 메뉴 닫기
    if (mobileClose) {
        mobileClose.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('모바일 메뉴 닫기 버튼 클릭');
            closeMobileMenu();
        });
    }
    
    // 오버레이 클릭 시 닫기
    mobileOverlay.addEventListener('click', function(e) {
        if (e.target === mobileOverlay) {
            console.log('오버레이 클릭');
            closeMobileMenu();
        }
    });
    
    // ESC 키로 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !mobileOverlay.classList.contains('hidden')) {
            console.log('ESC 키 눌림');
            closeMobileMenu();
        }
    });
    
    // 전역 함수로 등록
    window.createMobileMenu = createMobileMenu;
    window.updateMobileAuthStatus = updateMobileAuthStatus;
}

// 모바일 메뉴 토글
function toggleMobileMenu() {
    const mobileButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    
    if (!mobileButton || !mobileOverlay) return;
    
    const isExpanded = mobileButton.getAttribute('aria-expanded') === 'true';
    console.log('모바일 메뉴 토글, 현재 상태:', isExpanded);
    
    if (isExpanded) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

// 모바일 메뉴 열기
function openMobileMenu() {
    console.log('모바일 메뉴 열기');
    
    const mobileButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    
    if (!mobileButton || !mobileOverlay) return;
    
    mobileButton.setAttribute('aria-expanded', 'true');
    mobileButton.classList.add('active');
    
    mobileOverlay.classList.remove('hidden');
    setTimeout(() => {
        mobileOverlay.classList.add('show');
    }, 10);
    
    document.body.style.overflow = 'hidden';
    
    // 먼저 모바일 인증 상태 업데이트
    updateMobileAuthStatus();
    
    // 기존 메뉴 제거하고 새로 생성 (로그인 상태 반영을 위해)
    const menuContainer = document.querySelector('#mobile-menu-overlay .space-y-2');
    if (menuContainer) {
        menuContainer.innerHTML = '';
    }
    
    // 메뉴 항상 새로 생성
    createMobileMenu();
}

// 모바일 메뉴 닫기
function closeMobileMenu() {
    console.log('모바일 메뉴 닫기');
    
    const mobileButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    
    if (!mobileButton || !mobileOverlay) return;
    
    mobileButton.setAttribute('aria-expanded', 'false');
    mobileButton.classList.remove('active');
    
    mobileOverlay.classList.remove('show');
    setTimeout(() => {
        mobileOverlay.classList.add('hidden');
    }, 300);
    
    document.body.style.overflow = '';
}

// 모바일 메뉴 생성
function createMobileMenu() {
    const menuContainer = document.querySelector('#mobile-menu-overlay .space-y-2');
    if (!menuContainer) return;
    
    console.log('모바일 메뉴 생성');
    
    // 로그인 상태 확인
    const savedUser = localStorage.getItem('mockUser');
    const userType = localStorage.getItem('mockUserType');
    
    // 기존 메뉴 완전 초기화
    menuContainer.innerHTML = '';
    
    // 처음에 요소 생성을 위한 지연 후 인증 상태 업데이트
    setTimeout(() => {
        const existingAuthStatus = document.getElementById('mobile-auth-status');
        console.log('mobile-auth-status 요소 찾기 재시도:', !!existingAuthStatus);
        
        if (existingAuthStatus) {
            if (savedUser) {
                const user = JSON.parse(savedUser);
                const displayName = user.displayName || user.email;
                existingAuthStatus.innerHTML = `${displayName} 님 <span class="text-red-500 cursor-pointer" onclick="logout()">로그아웃</span>`;
                console.log('모바일 인증 상태 업데이트 완료:', displayName);
            } else {
                existingAuthStatus.innerHTML = '<span class="cursor-pointer" onclick="window.location.href=window.adjustPath(\'pages/auth/login.html\')">로그인 해주세요</span> >';
                
                // 클릭 이벤트 추가 (onclick이 작동하지 않는 경우를 대비)
                existingAuthStatus.onclick = function() {
                    console.log('로그인 페이지로 이동');
                    window.location.href = window.adjustPath ? window.adjustPath('pages/auth/login.html') : 'pages/auth/login.html';
                };
            }
        } else {
            console.error('여전히 mobile-auth-status 요소를 찾을 수 없음');
        }
    }, 100);
    
    const mainNav = document.querySelector('.main-nav');
    if (!mainNav) return;
    
    const menuItems = [
        {
            title: '기관 소개',
            items: [
                { name: '개요', url: 'pages/about/overview.html' },
                { name: '목표 및 전략', url: 'pages/about/vision.html' },
                { name: '사업 내용', url: 'pages/about/business.html' },
                { name: '조직도', url: 'pages/about/organization.html' },
                { name: '강사 소개', url: 'pages/about/instructors.html' }
            ]
        },
        {
            title: '자격증 소개',
            items: [
                { name: '건강운동처방사', url: 'pages/certificate/health-exercise.html' },
                { name: '운동재활전문가', url: 'pages/certificate/rehabilitation.html' },
                { name: '필라테스 전문가', url: 'pages/certificate/pilates.html' },
                { name: '레크리에이션지도자', url: 'pages/certificate/recreation.html' }
            ]
        },
        {
            title: '교육 과정',
            items: [
                { name: '교육 과정 안내', url: 'pages/education/course-info.html' },
                { name: '교육 신청', url: 'pages/education/course-application.html' },
                { name: '자격증 신청', url: 'pages/education/cert-application.html' },
                { name: '시험 안내', url: 'pages/education/exam-info.html' }
            ]
        },
        {
            title: '게시판',
            items: [
                { name: '공지사항', url: 'pages/board/notice/index.html' },
                { name: '칼럼', url: 'pages/board/column/index.html' },
                { name: '강의자료', url: 'pages/board/materials/index.html' },
                { name: '동영상 강의', url: 'pages/board/videos/index.html' }
            ]
        }
    ];
    
    // 로그인한 사용자를 위한 추가 메뉴
    if (savedUser) {
        menuItems.push({
            title: '마이페이지',
            items: [
                { name: '개인정보 관리', url: 'pages/mypage/personal-info.html' },
                { name: '수강 내역', url: 'pages/mypage/course-history.html' },
                { name: '자격증 관리', url: 'pages/mypage/cert-management.html' },
                { name: '결제 내역', url: 'pages/mypage/payment-history.html' }
            ]
        });
        
        // 관리자인 경우 관리자 메뉴 추가
        if (userType === 'admin') {
            menuItems.push({
                title: '관리자',
                items: [
                    { name: '대시보드', url: 'pages/admin/dashboard.html' },
                    { name: '회원 관리', url: 'pages/admin/user-management.html' },
                    { name: '교육 관리', url: 'pages/admin/course-management.html' },
                    { name: '자격증 관리', url: 'pages/admin/cert-management.html' }
                ]
            });
        }
    }
    
    menuItems.forEach(menu => {
        const menuDiv = document.createElement('div');
        menuDiv.className = 'mobile-menu-item';
        
        const menuButton = document.createElement('button');
        menuButton.className = 'w-full text-left p-3 bg-gray-100 font-semibold text-gray-800 flex justify-between items-center';
        menuButton.innerHTML = `
            ${menu.title}
            <span class="arrow">&gt;</span>
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
            const arrow = menuButton.querySelector('.arrow');
            const isOpen = !submenuDiv.classList.contains('hidden');
            
            // 다른 메뉴 닫기
            menuContainer.querySelectorAll('.mobile-submenu').forEach(sub => {
                if (sub !== submenuDiv) {
                    sub.classList.add('hidden');
                    sub.parentElement.querySelector('.arrow').innerHTML = '&gt;';
                }
            });
            
            // 현재 메뉴 토글
            submenuDiv.classList.toggle('hidden');
            arrow.innerHTML = isOpen ? '&gt;' : 'v';
        };
        
        menuDiv.appendChild(menuButton);
        menuDiv.appendChild(submenuDiv);
        menuContainer.appendChild(menuDiv);
    });
}

// 창 크기 변경 시 모바일 메뉴 닫기
window.addEventListener('resize', function() {
    if (window.innerWidth >= 768) {
        closeMobileMenu();
    }
});

// 모바일 인증 상태 업데이트 전용 함수
function updateMobileAuthStatus() {
    console.log('모바일 인증 상태 업데이트');
    
    // 여러 방법으로 요소를 찾는 시도
    let mobileAuthStatus = document.getElementById('mobile-auth-status');
    
    // 첫 번째 시도가 실패하면 잠시 기다린 후 재시도
    if (!mobileAuthStatus) {
        console.log('mobile-auth-status 요소를 찾지 못함, 재시도...');
        setTimeout(() => {
            mobileAuthStatus = document.getElementById('mobile-auth-status');
            updateMobileAuthStatusElement(mobileAuthStatus);
        }, 200);
        return;
    }
    
    updateMobileAuthStatusElement(mobileAuthStatus);
}

// 실제 업데이트 로직을 분리
function updateMobileAuthStatusElement(mobileAuthStatus) {
    if (!mobileAuthStatus) {
        console.error('mobile-auth-status 요소를 최종적으로 찾을 수 없음');
        return;
    }
    
    const savedUser = localStorage.getItem('mockUser');
    const userType = localStorage.getItem('mockUserType');
    
    console.log('저장된 사용자:', savedUser);
    console.log('사용자 타입:', userType);
    
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            const displayName = user.displayName || user.email;
            
            mobileAuthStatus.innerHTML = `${displayName} 님 <span class="text-red-500 cursor-pointer" onclick="logout()">로그아웃</span>`;
            mobileAuthStatus.onclick = null; // 기존 클릭 이벤트 제거
            
            console.log('모바일 인증 상태 업데이트 완료:', displayName);
        } catch (error) {
            console.error('사용자 정보 파싱 오류:', error);
            setLoginStatus(mobileAuthStatus);
        }
    } else {
        console.log('로그인된 사용자 없음');
        setLoginStatus(mobileAuthStatus);
    }
}

// 로그인 상태 설정 함수
function setLoginStatus(element) {
    element.innerHTML = '<span class="cursor-pointer" onclick="window.location.href=window.adjustPath(\'pages/auth/login.html\')">로그인 해주세요</span> >';
    
    // 클릭 이벤트 추가 (onclick이 작동하지 않는 경우를 대비)
    element.onclick = function() {
        console.log('로그인 페이지로 이동');
        window.location.href = window.adjustPath ? window.adjustPath('pages/auth/login.html') : 'pages/auth/login.html';
    };
}
window.addEventListener('popstate', function() {
    setTimeout(checkAuthState, 100);
});