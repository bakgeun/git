/**
 * 헤더 컴포넌트
 * 웹사이트 헤더의 동작을 제어합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // DOM 요소 참조
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    // 현재 경로에 따른 상대 경로 조정
    function adjustPath(path) {
        const currentPath = window.location.pathname;
        
        // 루트 경로인 경우
        if (currentPath === '/' || currentPath === '/index.html') {
            return path;
        }
        
        // pages 폴더 내부에 있는 경우
        const depth = currentPath.split('/').filter(p => p).length - 1;
        
        if (path.startsWith('pages/')) {
            // pages 폴더의 depth가 1인 경우 (예: /pages/auth/login.html)
            if (depth === 2) {
                return '../../' + path;
            }
            // pages 폴더의 depth가 2인 경우 (예: /pages/board/notice/index.html)
            else if (depth === 3) {
                return '../../../' + path;
            }
        }
        
        return path;
    }
    
    // 모바일 메뉴 토글 함수
    function toggleMobileMenu() {
        if (mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.remove('hidden');
        } else {
            mobileMenu.classList.add('hidden');
        }
    }
    
    // 모바일 메뉴 생성 함수
    function createMobileMenu() {
        // 메인 네비게이션의 내용을 기반으로 모바일 메뉴 생성
        const mainNav = document.querySelector('.main-nav');
        
        if (!mainNav || !mobileMenu) {
            return;
        }
        
        const mainNavItems = mainNav.querySelectorAll('ul > li');
        const mobileMenuContent = document.createElement('ul');
        mobileMenuContent.className = 'mobile-nav-items space-y-4 py-2';
        
        mainNavItems.forEach(item => {
            const listItem = document.createElement('li');
            
            // 메인 메뉴 항목
            const mainLink = item.querySelector('a');
            const mainLinkClone = mainLink.cloneNode(true);
            mainLinkClone.className = 'block text-gray-800 hover:text-blue-600 py-2 font-medium';
            
            // 경로 조정
            const href = mainLinkClone.getAttribute('href');
            if (href && href !== '#') {
                mainLinkClone.setAttribute('href', adjustPath(href));
            }
            
            listItem.appendChild(mainLinkClone);
            
            // 서브메뉴 항목이 있는 경우
            const submenu = item.querySelector('.submenu');
            if (submenu) {
                const submenuItems = submenu.querySelectorAll('li a');
                const submenuList = document.createElement('ul');
                submenuList.className = 'pl-4 mt-2 space-y-2';
                
                submenuItems.forEach(subItem => {
                    const subListItem = document.createElement('li');
                    const subLinkClone = subItem.cloneNode(true);
                    subLinkClone.className = 'block text-gray-600 hover:text-blue-600 py-1';
                    
                    // 서브메뉴 경로 조정
                    const subHref = subLinkClone.getAttribute('href');
                    if (subHref && subHref !== '#') {
                        subLinkClone.setAttribute('href', adjustPath(subHref));
                    }
                    
                    subListItem.appendChild(subLinkClone);
                    submenuList.appendChild(subListItem);
                });
                
                listItem.appendChild(submenuList);
            }
            
            mobileMenuContent.appendChild(listItem);
        });
        
        // 기존 내용 초기화 후 새 메뉴 추가
        mobileMenu.querySelector('.container').innerHTML = '';
        mobileMenu.querySelector('.container').appendChild(mobileMenuContent);
    }
    
    // 인증 상태에 따른 헤더 UI 업데이트
    function updateHeaderForAuthState(user) {
        const authButtons = document.querySelector('.auth-buttons');
        
        if (!authButtons) {
            return;
        }
        
        if (user) {
            // 로그인 상태
            authButtons.innerHTML = `
                <div class="user-menu relative group">
                    <button class="flex items-center text-sm text-gray-600 hover:text-blue-600">
                        <span class="mr-1">${user.displayName || user.email}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <div class="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md p-2 hidden group-hover:block z-10">
                        <a href="${adjustPath('pages/mypage/personal-info.html')}" class="block px-4 py-2 hover:bg-gray-100 rounded-md">마이페이지</a>
                        <a href="${adjustPath('pages/mypage/course-history.html')}" class="block px-4 py-2 hover:bg-gray-100 rounded-md">수강 내역</a>
                        <a href="${adjustPath('pages/mypage/cert-management.html')}" class="block px-4 py-2 hover:bg-gray-100 rounded-md">자격증 관리</a>
                        <div class="border-t border-gray-200 my-1"></div>
                        <button id="logout-button" class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md text-red-600">로그아웃</button>
                    </div>
                </div>
                <button id="mobile-menu-button" class="md:hidden ml-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            `;
            
            // 로그아웃 버튼에 이벤트 리스너 추가
            document.getElementById('logout-button').addEventListener('click', handleLogout);
            
            // 관리자인 경우 관리자 메뉴 추가
            if (window.authService) {
                window.authService.checkUserRole().then(roleInfo => {
                    if (roleInfo.isAdmin) {
                        const userMenu = document.querySelector('.user-menu .absolute');
                        const divider = userMenu.querySelector('.border-t');
                        
                        const adminLink = document.createElement('a');
                        adminLink.href = adjustPath('pages/admin/dashboard.html');
                        adminLink.className = 'block px-4 py-2 hover:bg-gray-100 rounded-md text-blue-600';
                        adminLink.textContent = '관리자 페이지';
                        
                        userMenu.insertBefore(adminLink, divider);
                    }
                });
            }
        } else {
            // 비로그인 상태
            authButtons.innerHTML = `
                <a href="${adjustPath('pages/auth/login.html')}" class="login-btn text-sm text-gray-600 hover:text-blue-600 mr-4">로그인</a>
                <a href="${adjustPath('pages/auth/signup.html')}" class="signup-btn text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">회원가입</a>
                <button id="mobile-menu-button" class="md:hidden ml-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            `;
        }
        
        // 모바일 메뉴 버튼 이벤트 리스너 재설정
        document.getElementById('mobile-menu-button').addEventListener('click', toggleMobileMenu);
    }
    
    // 로그아웃 처리 함수
    async function handleLogout() {
        if (window.authService) {
            const result = await window.authService.signOut();
            
            if (result.success) {
                // 홈페이지로 리디렉션
                window.location.href = '/index.html';
            } else {
                alert('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        }
    }
    
    // 헤더의 모든 링크 경로 조정
    function adjustAllHeaderLinks() {
        // 로고 링크
        const logoLink = document.querySelector('.logo a');
        if (logoLink) {
            const href = logoLink.getAttribute('href');
            if (href) {
                const currentPath = window.location.pathname;
                
                // pages 폴더 내부에 있는 경우
                if (currentPath.includes('/pages/')) {
                    const depth = currentPath.split('/').filter(p => p).length - 1;
                    
                    if (depth === 2) {
                        logoLink.setAttribute('href', '../../index.html');
                    } else if (depth === 3) {
                        logoLink.setAttribute('href', '../../../index.html');
                    }
                }
            }
        }
        
        // 메인 네비게이션 링크들
        const navLinks = document.querySelectorAll('.main-nav a[href]');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                link.setAttribute('href', adjustPath(href));
            }
        });
    }
    
    // 현재 페이지 경로에 따른 네비게이션 활성화
    function highlightCurrentPage() {
        const currentPath = window.location.pathname;
        
        // 메인 네비게이션 항목
        const navLinks = document.querySelectorAll('.main-nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                const absolutePath = new URL(href, window.location.href).pathname;
                if (currentPath === absolutePath || currentPath.includes(absolutePath)) {
                    link.classList.add('text-blue-600');
                    link.classList.remove('text-gray-800');
                    
                    // 상위 메뉴 항목도 활성화
                    const parentMenuItem = link.closest('li.group');
                    if (parentMenuItem) {
                        const parentLink = parentMenuItem.querySelector('a');
                        if (parentLink) {
                            parentLink.classList.add('text-blue-600');
                            parentLink.classList.remove('text-gray-800');
                        }
                    }
                }
            }
        });
    }
    
    // 스크롤에 따른 헤더 스타일 변경
    function handleHeaderScroll() {
        const header = document.getElementById('main-header');
        
        if (!header) {
            return;
        }
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > 10) {
                header.classList.add('bg-white', 'shadow-md');
                header.classList.remove('bg-transparent');
            } else {
                if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
                    header.classList.remove('bg-white', 'shadow-md');
                    header.classList.add('bg-transparent');
                }
            }
        });
        
        // 초기 실행
        if (window.scrollY > 10) {
            header.classList.add('bg-white', 'shadow-md');
            header.classList.remove('bg-transparent');
        } else {
            if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
                header.classList.remove('bg-white', 'shadow-md');
                header.classList.add('bg-transparent');
            }
        }
    }
    
    // 문서 로드 완료 시 실행
    document.addEventListener('DOMContentLoaded', function() {
        // 헤더의 모든 링크 경로 조정
        adjustAllHeaderLinks();
        
        // 모바일 메뉴 초기화
        createMobileMenu();
        
        // 모바일 메뉴 버튼 이벤트 리스너 추가
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', toggleMobileMenu);
        }
        
        // 현재 페이지 하이라이트
        highlightCurrentPage();
        
        // 스크롤 처리
        handleHeaderScroll();
        
        // 인증 상태 변경 감지
        document.addEventListener('authStateChanged', function(event) {
            updateHeaderForAuthState(event.detail.user);
        });
        
        // 현재 인증 상태로 헤더 업데이트
        if (window.dhcFirebase) {
            const currentUser = window.dhcFirebase.getCurrentUser();
            updateHeaderForAuthState(currentUser);
        }
    });
})();