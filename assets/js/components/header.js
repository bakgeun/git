/**
 * 헤더 컴포넌트
 * 웹사이트 헤더의 동작을 제어합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // DOM 요소 참조
    let mobileMenuButton;
    let mobileMenu;
    
    // 모바일 메뉴 토글 함수
    function toggleMobileMenu(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        if (!mobileMenu) return;
        
        if (mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.remove('hidden');
            if (mobileMenuButton) mobileMenuButton.setAttribute('aria-expanded', 'true');
            
            // 모바일 메뉴 내용이 비어있으면 생성
            if (!mobileMenu.querySelector('.mobile-nav-items')) {
                createMobileMenu();
            }
        } else {
            mobileMenu.classList.add('hidden');
            if (mobileMenuButton) mobileMenuButton.setAttribute('aria-expanded', 'false');
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
        const mobileMenuContent = document.createElement('div');
        mobileMenuContent.className = 'container mx-auto px-4';
        
        const mobileNavList = document.createElement('ul');
        mobileNavList.className = 'mobile-nav-items py-2';
        
        mainNavItems.forEach(item => {
            const listItem = document.createElement('li');
            
            // 메인 메뉴 항목
            const mainLink = item.querySelector('a');
            
            // 링크 생성
            const menuItemLink = document.createElement('a');
            
            // 서브메뉴 항목이 있는 경우
            const submenu = item.querySelector('.submenu');
            if (submenu) {
                // 토글 가능한 메뉴 아이템 생성
                menuItemLink.href = '#';
                menuItemLink.className = 'block text-gray-800 hover:text-blue-600 py-2 font-medium w-full flex justify-between items-center';
                
                // 메뉴 텍스트
                const menuText = document.createElement('span');
                menuText.textContent = mainLink.textContent;
                menuItemLink.appendChild(menuText);
                
                // 화살표 아이콘
                const arrowIcon = document.createElement('span');
                arrowIcon.className = 'transform transition-transform duration-200';
                arrowIcon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                `;
                menuItemLink.appendChild(arrowIcon);
                
                // 클릭 이벤트 리스너 추가
                menuItemLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    const submenuElement = this.nextElementSibling;
                    
                    // 서브메뉴 토글
                    if (submenuElement.classList.contains('show')) {
                        submenuElement.classList.remove('show');
                        arrowIcon.classList.remove('rotate-180');
                    } else {
                        // 다른 모든 서브메뉴 닫기
                        document.querySelectorAll('#mobile-menu .submenu').forEach(menu => {
                            menu.classList.remove('show');
                        });
                        document.querySelectorAll('#mobile-menu .rotate-180').forEach(icon => {
                            icon.classList.remove('rotate-180');
                        });
                        
                        // 현재 서브메뉴 열기
                        submenuElement.classList.add('show');
                        arrowIcon.classList.add('rotate-180');
                    }
                });
                
                listItem.appendChild(menuItemLink);
                
                // 서브메뉴 생성
                const submenuItems = submenu.querySelectorAll('li a');
                const submenuList = document.createElement('ul');
                submenuList.className = 'submenu pl-4';
                
                submenuItems.forEach(subItem => {
                    const subListItem = document.createElement('li');
                    const subLinkClone = document.createElement('a');
                    
                    // 서브메뉴 링크 설정
                    subLinkClone.textContent = subItem.textContent;
                    subLinkClone.className = 'block text-gray-600 hover:text-blue-600 py-2';
                    
                    // 서브메뉴 경로 조정
                    const subHref = subItem.getAttribute('href');
                    if (subHref && subHref !== '#') {
                        if (typeof window.adjustPath === 'function') {
                            subLinkClone.setAttribute('href', window.adjustPath(subHref));
                        } else {
                            subLinkClone.setAttribute('href', subHref);
                        }
                    } else {
                        subLinkClone.setAttribute('href', '#');
                    }
                    
                    subListItem.appendChild(subLinkClone);
                    submenuList.appendChild(subListItem);
                });
                
                listItem.appendChild(submenuList);
            } else {
                // 서브메뉴가 없는 경우 기본 링크 복제
                menuItemLink.textContent = mainLink.textContent;
                menuItemLink.className = 'block text-gray-800 hover:text-blue-600 py-2 font-medium';
                
                // 경로 조정
                const href = mainLink.getAttribute('href');
                if (href && href !== '#') {
                    if (typeof window.adjustPath === 'function') {
                        menuItemLink.setAttribute('href', window.adjustPath(href));
                    } else {
                        menuItemLink.setAttribute('href', href);
                    }
                } else {
                    menuItemLink.setAttribute('href', '#');
                }
                
                listItem.appendChild(menuItemLink);
            }
            
            mobileNavList.appendChild(listItem);
        });
        
        mobileMenuContent.appendChild(mobileNavList);
        
        // 기존 내용 초기화 후 새 메뉴 추가
        mobileMenu.innerHTML = '';
        mobileMenu.appendChild(mobileMenuContent);
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
                        <a href="${window.adjustPath ? window.adjustPath('pages/mypage/personal-info.html') : 'pages/mypage/personal-info.html'}" class="block px-4 py-2 hover:bg-gray-100 rounded-md">마이페이지</a>
                        <a href="${window.adjustPath ? window.adjustPath('pages/mypage/course-history.html') : 'pages/mypage/course-history.html'}" class="block px-4 py-2 hover:bg-gray-100 rounded-md">수강 내역</a>
                        <a href="${window.adjustPath ? window.adjustPath('pages/mypage/cert-management.html') : 'pages/mypage/cert-management.html'}" class="block px-4 py-2 hover:bg-gray-100 rounded-md">자격증 관리</a>
                        <div class="border-t border-gray-200 my-1"></div>
                        <button id="logout-button" class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md text-red-600">로그아웃</button>
                    </div>
                </div>
                <button id="mobile-menu-button" class="md:hidden ml-4" aria-expanded="false" aria-controls="mobile-menu">
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
                        adminLink.href = window.adjustPath ? window.adjustPath('pages/admin/dashboard.html') : 'pages/admin/dashboard.html';
                        adminLink.className = 'block px-4 py-2 hover:bg-gray-100 rounded-md text-blue-600';
                        adminLink.textContent = '관리자 페이지';
                        
                        userMenu.insertBefore(adminLink, divider);
                    }
                });
            }
        } else {
            // 비로그인 상태
            authButtons.innerHTML = `
                <a href="${window.adjustPath ? window.adjustPath('pages/auth/login.html') : 'pages/auth/login.html'}" class="login-btn text-sm text-gray-600 hover:text-blue-600 mr-4">로그인</a>
                <a href="${window.adjustPath ? window.adjustPath('pages/auth/signup.html') : 'pages/auth/signup.html'}" class="signup-btn text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">회원가입</a>
                <button id="mobile-menu-button" class="md:hidden ml-4" aria-expanded="false" aria-controls="mobile-menu">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            `;
        }
        
        // 모바일 메뉴 버튼 이벤트 리스너 재설정
        mobileMenuButton = document.getElementById('mobile-menu-button');
        if (mobileMenuButton) {
            // 이전 이벤트 리스너 제거 (중복 방지)
            const newButton = mobileMenuButton.cloneNode(true);
            mobileMenuButton.parentNode.replaceChild(newButton, mobileMenuButton);
            mobileMenuButton = newButton;
            
            // 새 이벤트 리스너 추가
            mobileMenuButton.addEventListener('click', toggleMobileMenu);
        }
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
            if (href && window.adjustPath) {
                logoLink.setAttribute('href', window.adjustPath('index.html'));
            }
        }
        
        // 메인 네비게이션 링크들
        const navLinks = document.querySelectorAll('.main-nav a[href]');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '#' && window.adjustPath) {
                link.setAttribute('href', window.adjustPath(href));
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
        
        function updateHeaderStyle() {
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
        
        // 스크롤 이벤트 리스너 추가
        window.addEventListener('scroll', updateHeaderStyle);
        
        // 초기 실행
        updateHeaderStyle();
    }
    
    // 문서 로드 완료 시 실행
    function initHeader() {
        // DOM 요소 참조 업데이트
        mobileMenuButton = document.getElementById('mobile-menu-button');
        mobileMenu = document.getElementById('mobile-menu');
        
        // 모바일 메뉴 버튼 이벤트 리스너 추가
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', toggleMobileMenu);
        }
        
        // 헤더의 모든 링크 경로 조정
        adjustAllHeaderLinks();
        
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
    }
    
    // DOM이 로드되었을 때 헤더 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeader);
    } else {
        // 이미 DOM이 로드된 경우
        initHeader();
    }
    
    // 전역 함수로 토글 기능 노출 (다른 스크립트에서 접근 가능)
    window.toggleMobileMenu = toggleMobileMenu;
     window.updateHeaderForAuthState = updateHeaderForAuthState; // 이 줄을 추가
})();