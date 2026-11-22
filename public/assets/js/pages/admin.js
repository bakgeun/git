/**
 * 관리자 페이지 공통 스크립트 (최적화 버전 - 중복 실행 방지)
 * 모든 관리자 페이지에서 사용되는 공통 기능
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
    // 🔧 초기화 상태 관리
    let adminUtilsInitialized = false;
    let sidebarInitialized = false;
    let authListenerInitialized = false;

    // adminUtils 네임스페이스 생성
    window.adminUtils = {
        /**
         * 🔧 사이드바 토글 시스템 (최적화 - 중복 방지)
         */
        initAdminSidebar: function () {
            if (sidebarInitialized) {
                console.log('⚠️ 사이드바가 이미 초기화됨 - 중복 방지');
                return true;
            }

            console.log('🔧 관리자 사이드바 초기화 시작');
            
            const toggleButton = document.getElementById('admin-sidebar-toggle');
            const sidebar = document.querySelector('.admin-sidebar');
            let overlay = document.getElementById('sidebar-overlay');
            
            console.log('사이드바 요소들 확인:', {
                button: !!toggleButton,
                sidebar: !!sidebar,
                overlay: !!overlay
            });
            
            // 오버레이가 없으면 동적 생성
            if (!overlay) {
                console.log('오버레이 없음, 동적 생성');
                overlay = this.createSidebarOverlay();
            }
            
            if (!sidebar) {
                console.error('❌ 사이드바를 찾을 수 없습니다.');
                return false;
            }
            
            // 토글 버튼이 없으면 동적 생성
            if (!toggleButton) {
                console.log('토글 버튼 없음, 동적 생성');
                this.createToggleButton();
            } else {
                // 기존 토글 버튼에 이벤트 등록
                this.attachToggleEvents(toggleButton);
            }
            
            // 오버레이 이벤트 등록
            this.attachOverlayEvents(overlay);
            
            // 전역 이벤트 등록
            this.attachGlobalEvents();
            
            sidebarInitialized = true;
            console.log('✅ 관리자 사이드바 초기화 완료');
            return true;
        },

        /**
         * 오버레이 동적 생성
         */
        createSidebarOverlay: function () {
            const overlay = document.createElement('div');
            overlay.id = 'sidebar-overlay';
            overlay.className = 'admin-sidebar-overlay';
            
            // 스타일 직접 적용 (CSS 로드 순서 문제 방지)
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1025;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
                cursor: pointer;
            `;
            
            document.body.appendChild(overlay);
            console.log('✅ 오버레이 동적 생성 완료');
            return overlay;
        },

        /**
         * 토글 버튼 동적 생성
         */
        createToggleButton: function () {
            const header = document.querySelector('header, .admin-header');
            if (!header) {
                console.error('❌ 헤더를 찾을 수 없습니다.');
                return null;
            }
            
            const container = header.querySelector('.container');
            if (!container) {
                console.error('❌ 헤더 컨테이너를 찾을 수 없습니다.');
                return null;
            }
            
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'admin-sidebar-toggle';
            toggleBtn.className = 'admin-toggle-button';
            toggleBtn.setAttribute('aria-label', '메뉴 토글');
            toggleBtn.setAttribute('type', 'button');
            
            // 스타일 직접 적용
            toggleBtn.style.cssText = `
                display: none;
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                z-index: 1041;
                width: 32px;
                height: 32px;
                padding: 0;
                line-height: 1;
                align-items: center;
                justify-content: center;
            `;
            
            // 반응형 표시 (모바일에서만)
            const mediaQuery = window.matchMedia('(max-width: 1199px)');
            const updateButtonDisplay = () => {
                toggleBtn.style.display = mediaQuery.matches ? 'flex' : 'none';
            };
            
            updateButtonDisplay();
            mediaQuery.addListener(updateButtonDisplay);
            
            toggleBtn.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            `;
            
            // 컨테이너의 첫 번째 자식으로 삽입
            container.insertBefore(toggleBtn, container.firstChild);
            
            // 이벤트 등록
            this.attachToggleEvents(toggleBtn);
            
            console.log('✅ 토글 버튼 동적 생성 완료');
            return toggleBtn;
        },

        /**
         * 토글 버튼 이벤트 등록 (최적화 - 중복 방지)
         */
        attachToggleEvents: function (toggleButton) {
            // 이미 이벤트가 등록되어 있는지 확인
            if (toggleButton.dataset.eventAttached === 'true') {
                console.log('⚠️ 토글 버튼 이벤트가 이미 등록됨 - 중복 방지');
                return;
            }

            // 새 이벤트 등록
            toggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔧 토글 버튼 클릭됨');
                this.toggleSidebar();
            });
            
            // 이벤트 등록 플래그 설정
            toggleButton.dataset.eventAttached = 'true';
            console.log('✅ 토글 버튼 이벤트 등록 완료');
        },

        /**
         * 오버레이 이벤트 등록 (최적화 - 중복 방지)
         */
        attachOverlayEvents: function (overlay) {
            if (!overlay) return;
            
            // 이미 이벤트가 등록되어 있는지 확인
            if (overlay.dataset.eventAttached === 'true') {
                console.log('⚠️ 오버레이 이벤트가 이미 등록됨 - 중복 방지');
                return;
            }
            
            // 새 이벤트 등록
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔧 오버레이 클릭됨 - 사이드바 닫기');
                this.closeSidebar();
            });
            
            // 이벤트 등록 플래그 설정
            overlay.dataset.eventAttached = 'true';
            console.log('✅ 오버레이 이벤트 등록 완료');
        },

        /**
         * 전역 이벤트 등록 (최적화 - 중복 방지)
         */
        attachGlobalEvents: function () {
            // 이미 등록되어 있는지 확인
            if (window.adminGlobalEventsAttached) {
                console.log('⚠️ 전역 이벤트가 이미 등록됨 - 중복 방지');
                return;
            }

            // ESC 키로 사이드바 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const sidebar = document.querySelector('.admin-sidebar');
                    if (sidebar && sidebar.classList.contains('active')) {
                        console.log('🔧 ESC 키로 사이드바 닫기');
                        this.closeSidebar();
                    }
                }
            });
            
            // 화면 크기 변경 시 처리
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1200) {
                    console.log('🔧 데스크톱 모드 - 사이드바 자동 닫기');
                    this.closeSidebar();
                }
            });
            
            // 사이드바 외부 클릭 감지
            document.addEventListener('click', (e) => {
                const sidebar = document.querySelector('.admin-sidebar');
                const toggleButton = document.getElementById('admin-sidebar-toggle');
                
                if (sidebar && 
                    sidebar.classList.contains('active') &&
                    !sidebar.contains(e.target) &&
                    (!toggleButton || !toggleButton.contains(e.target))) {
                    console.log('🔧 사이드바 외부 클릭 감지');
                    this.closeSidebar();
                }
            });
            
            // 전역 이벤트 등록 플래그 설정
            window.adminGlobalEventsAttached = true;
            console.log('✅ 전역 이벤트 등록 완료');
        },

        /**
         * 🔧 사이드바 토글
         */
        toggleSidebar: function () {
            const sidebar = document.querySelector('.admin-sidebar');
            if (!sidebar) {
                console.error('❌ 사이드바를 찾을 수 없습니다.');
                return;
            }
            
            const isActive = sidebar.classList.contains('active');
            
            console.log('🔧 사이드바 토글:', isActive ? '닫기' : '열기');
            
            if (isActive) {
                this.closeSidebar();
            } else {
                this.openSidebar();
            }
        },

        /**
         * 🔧 사이드바 열기
         */
        openSidebar: function () {
            const sidebar = document.querySelector('.admin-sidebar');
            const overlay = document.getElementById('sidebar-overlay') || document.querySelector('.admin-sidebar-overlay');
            
            if (!sidebar) {
                console.error('❌ 사이드바를 찾을 수 없습니다.');
                return;
            }
            
            console.log('🔧 사이드바 열기 실행');
            
            // 사이드바 활성화
            sidebar.classList.add('active');
            
            // 오버레이 표시
            if (overlay) {
                overlay.classList.add('active');
                overlay.style.display = 'block';
                overlay.style.opacity = '1';
            }
            
            // 바디 스크롤 방지 (모바일에서)
            if (window.innerWidth < 1200) {
                document.body.classList.add('sidebar-open');
                document.documentElement.classList.add('sidebar-open');
                document.body.style.overflow = 'hidden';
            }
            
            console.log('✅ 사이드바 열기 완료');
        },

        /**
         * 🔧 사이드바 닫기
         */
        closeSidebar: function () {
            const sidebar = document.querySelector('.admin-sidebar');
            const overlay = document.getElementById('sidebar-overlay') || document.querySelector('.admin-sidebar-overlay');
            
            if (!sidebar) {
                console.error('❌ 사이드바를 찾을 수 없습니다.');
                return;
            }
            
            console.log('🔧 사이드바 닫기 실행');
            
            // 사이드바 비활성화
            sidebar.classList.remove('active');
            
            // 오버레이 숨기기
            if (overlay) {
                overlay.classList.remove('active');
                overlay.style.opacity = '0';
                
                // 애니메이션 후 display none
                setTimeout(() => {
                    if (!overlay.classList.contains('active')) {
                        overlay.style.display = 'none';
                    }
                }, 300);
            }
            
            // 바디 스크롤 복원
            document.body.classList.remove('sidebar-open');
            document.documentElement.classList.remove('sidebar-open');
            document.body.style.overflow = '';
            
            console.log('✅ 사이드바 닫기 완료');
        },

        /**
         * 페이지 간 사용자 정보 유지를 위한 함수 (최적화 - 중복 방지)
         */
        initUserInfo: function () {
            console.log('사용자 정보 초기화 시작');

            // 기본값 설정 (즉시 표시)
            const defaultAdminName = '관리자';
            const defaultAdminEmail = '';

            // DOM 요소 참조
            const adminNameElem = document.getElementById('admin-name');
            const adminEmailElem = document.getElementById('admin-email');

            // 기본값으로 즉시 채우기
            if (adminNameElem) adminNameElem.textContent = defaultAdminName;
            if (adminEmailElem) adminEmailElem.textContent = defaultAdminEmail;

            // 세션 스토리지에서 사용자 정보 확인 (기본값보다 우선)
            const savedAdminName = sessionStorage.getItem('admin_name');
            const savedAdminEmail = sessionStorage.getItem('admin_email');

            // 저장된 정보가 있으면 즉시 표시
            if (savedAdminName && savedAdminEmail) {
                console.log('저장된 사용자 정보 발견:', savedAdminName, savedAdminEmail);

                if (adminNameElem) adminNameElem.textContent = savedAdminName;
                if (adminEmailElem) adminEmailElem.textContent = savedAdminEmail;
            }

            // 사용자 정보가 표시되었음을 표시
            const userInfoElem = document.querySelector('.admin-user-info');
            if (userInfoElem) {
                userInfoElem.classList.add('loaded');
                userInfoElem.classList.remove('not-loaded');
            }

            // 사이드바 정보 업데이트
            this.addUserInfoToSidebar();

            // Firebase 인증 정보 확인 후 업데이트 (중복 방지)
            this.setupFirebaseAuthListener();

            console.log('사용자 정보 초기화 완료 (기본값 적용)');
        },

        /**
         * Firebase 인증 리스너 설정 (최적화 - 중복 방지)
         */
        setupFirebaseAuthListener: function() {
            // 이미 리스너가 설정되어 있는지 확인
            if (authListenerInitialized) {
                console.log('⚠️ Firebase 인증 리스너가 이미 설정됨 - 중복 방지');
                return;
            }

            if (window.dhcFirebase) {
                console.log('Firebase 인증 리스너 설정');

                window.dhcFirebase.onAuthStateChanged((user) => {
                    if (user) {
                        console.log('인증된 사용자 확인');

                        const displayName = user.displayName || '관리자';
                        const email = user.email;

                        // DOM 업데이트
                        const adminNameElem = document.getElementById('admin-name');
                        const adminEmailElem = document.getElementById('admin-email');
                        
                        if (adminNameElem) adminNameElem.textContent = displayName;
                        if (adminEmailElem) adminEmailElem.textContent = email;

                        // 세션 스토리지에 저장
                        sessionStorage.setItem('admin_name', displayName);
                        sessionStorage.setItem('admin_email', email);

                        // 사이드바 정보 업데이트
                        this.addUserInfoToSidebar();
                    } else {
                        console.log('로그아웃 상태');
                        // 로그아웃 상태 - 기본값 유지, 세션 스토리지는 비우지 않음
                    }
                });

                authListenerInitialized = true;
            } else {
                console.warn('Firebase를 찾을 수 없음');
            }
        },

        /**
         * 사이드바에 사용자 정보 추가 함수
         */
        addUserInfoToSidebar: function () {
            console.log('사이드바에 사용자 정보 추가');

            const sidebar = document.querySelector('.admin-sidebar');
            if (!sidebar) {
                console.warn('사이드바를 찾을 수 없음');
                return;
            }

            // 기존 사용자 정보가 있으면 제거
            const existingUserInfo = sidebar.querySelector('.sidebar-user-info');
            if (existingUserInfo) {
                existingUserInfo.remove();
            }

            // 헤더에서 사용자 정보 가져오기
            const adminName = document.getElementById('admin-name')?.textContent || sessionStorage.getItem('admin_name') || '관리자';
            const adminEmail = document.getElementById('admin-email')?.textContent || sessionStorage.getItem('admin_email') || '';

            // 사용자 정보 영역 생성
            const userInfoDiv = document.createElement('div');
            userInfoDiv.className = 'sidebar-user-info';
            userInfoDiv.innerHTML = `
        <div class="text-white mb-2">
            <div class="font-bold">${adminName}</div>
            <div class="text-indigo-200 text-sm">${adminEmail}</div>
        </div>
        <button id="sidebar-logout-button" 
            class="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm text-white w-full">
            로그아웃
        </button>
    `;

            // 사이드바의 첫 번째 요소로 추가
            if (sidebar.firstChild) {
                sidebar.insertBefore(userInfoDiv, sidebar.firstChild);
            } else {
                sidebar.appendChild(userInfoDiv);
            }

            // 로그아웃 버튼에 이벤트 추가 (중복 방지)
            const logoutButton = document.getElementById('sidebar-logout-button');
            if (logoutButton && !logoutButton.dataset.eventAttached) {
                logoutButton.addEventListener('click', () => {
                    console.log('사이드바 로그아웃 버튼 클릭');

                    // 기존 로그아웃 함수 호출 (다양한 가능성 고려)
                    if (typeof window.logout === 'function') {
                        window.logout();
                    } else if (typeof window.headerLogout === 'function') {
                        window.headerLogout();
                    } else if (window.adminAuth && typeof window.adminAuth.logout === 'function') {
                        window.adminAuth.logout();
                    } else if (window.dhcFirebase && window.dhcFirebase.auth) {
                        // Firebase 직접 로그아웃
                        window.dhcFirebase.auth.signOut().then(() => {
                            console.log('Firebase 로그아웃 성공');
                            window.location.href = window.adjustPath ? window.adjustPath('index.html') : 'index.html';
                        }).catch(error => {
                            console.error('로그아웃 오류:', error);
                        });
                    } else {
                        console.error('로그아웃 함수를 찾을 수 없음');
                        alert('로그아웃 기능을 사용할 수 없습니다. 페이지를 새로고침하세요.');
                    }
                });

                logoutButton.dataset.eventAttached = 'true';
                console.log('사이드바 로그아웃 버튼에 이벤트 등록 완료');
            }

            // 메인 웹사이트 메뉴 추가 (모바일용)
            this.addMobileMenuLinks(sidebar);

            // 로딩이 완료되면 애니메이션 적용
            setTimeout(() => {
                const sidebarUserInfo = document.querySelector('.sidebar-user-info');
                const headerUserInfo = document.querySelector('.admin-user-info');

                if (sidebarUserInfo) {
                    sidebarUserInfo.classList.add('loaded');
                }

                if (headerUserInfo) {
                    headerUserInfo.classList.add('loaded');
                }
            }, 300);
        },

        // 모바일 메뉴 링크 추가 함수
        addMobileMenuLinks: function (sidebar) {
            // 이미 메인 메뉴 섹션이 있는지 확인
            const existingMainMenu = sidebar.querySelector('.sidebar-main-menu');
            if (existingMainMenu) {
                existingMainMenu.remove();
            }

            // 메인 메뉴 컨테이너 생성
            const mainMenuDiv = document.createElement('div');
            mainMenuDiv.className = 'sidebar-main-menu mt-4 mb-2';

            // 메인 웹사이트로 이동 섹션 추가
            mainMenuDiv.innerHTML = `
        <div class="px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
            메인 메뉴
        </div>
        <div class="mt-2">
            <a href="${window.adjustPath ? window.adjustPath('index.html') : 'index.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    메인 홈페이지
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/about.html') : 'pages/about.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    기관 소개
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/certificate/health-exercise.html') : 'pages/certificate/health-exercise.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                    </svg>
                    자격증 소개
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/education/course-application.html') : 'pages/education/course-application.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    교육 신청
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/board/notice/index.html') : 'pages/board/notice/index.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                    </svg>
                    게시판
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/mypage/personal-info.html') : 'pages/mypage/personal-info.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    마이페이지
                </span>
            </a>
        </div>
    `;

            // 관리자 메뉴 다음에 추가 (현재 nav 요소)
            const adminNav = sidebar.querySelector('.admin-nav');
            if (adminNav) {
                // 분리선 추가
                const divider = document.createElement('div');
                divider.className = 'border-t border-indigo-700 my-4';
                adminNav.after(divider);
                divider.after(mainMenuDiv);
            } else {
                // nav가 없으면 맨 마지막에 추가
                sidebar.appendChild(mainMenuDiv);
            }

            console.log('사이드바에 메인 메뉴 링크 추가 완료');
        },

        /**
         * 🔧 관리자 페이지 초기화 (최적화 - 중복 방지)
         */
        initAdminPage: function () {
            // 중복 초기화 방지
            if (adminUtilsInitialized) {
                console.log('⚠️ 관리자 페이지가 이미 초기화됨 - 중복 방지');
                return;
            }

            console.log('🔧 관리자 페이지 초기화 시작');

            // 1. 사용자 정보 초기화 (우선 실행)
            this.initUserInfo();

            // 2. 사이드바 토글 시스템 초기화
            this.initAdminSidebar();

            // 초기화 완료 플래그 설정
            adminUtilsInitialized = true;
            console.log('✅ 관리자 페이지 초기화 완료');
        },

        // 🔧 추가된 공통 기능들 (기존 코드 유지)
        
        /**
         * 데이터 테이블 생성
         */
        createDataTable: function (tableId, data, columns, options = {}) {
            const table = document.getElementById(tableId);
            if (!table) return;

            // 헤더 생성
            const thead = table.querySelector('thead') || document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    ${Object.values(columns).map(col => `<th>${col.label}</th>`).join('')}
                    ${options.actions ? '<th>작업</th>' : ''}
                </tr>
            `;

            if (!table.querySelector('thead')) {
                table.appendChild(thead);
            }

            // 바디 생성
            const tbody = table.querySelector('tbody') || document.createElement('tbody');
            tbody.innerHTML = data.map(item => `
                <tr data-id="${item.id}">
                    ${Object.keys(columns).map(key => {
                const column = columns[key];
                let value = item[key];

                // 포맷터 적용
                if (column.formatter) {
                    value = column.formatter(value, item);
                }

                return `<td>${value || '-'}</td>`;
            }).join('')}
                    ${options.actions ? `
                        <td>
                            ${options.actions.map(action =>
                `<button class="admin-btn admin-btn-${action.type} btn-sm" 
                                    onclick="${action.handler}('${item.id}')">
                                    ${action.label}
                                </button>`
            ).join(' ')}
                        </td>
                    ` : ''}
                </tr>
            `).join('');

            if (!table.querySelector('tbody')) {
                table.appendChild(tbody);
            }

            // 빈 데이터 처리
            if (data.length === 0) {
                const colspan = Object.keys(columns).length + (options.actions ? 1 : 0);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="${colspan}" class="text-center py-4 text-gray-500">
                            데이터가 없습니다.
                        </td>
                    </tr>
                `;
            }
        },

        /**
         * 모달 표시
         */
        showModal: function (options) {
            // 기존 모달 제거
            const existingModal = document.getElementById('admin-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // 모달 생성
            const modalHtml = `
                <div id="admin-modal" class="admin-modal-overlay">
                    <div class="admin-modal">
                        <div class="admin-modal-header">
                            <h3 class="text-lg font-medium">${options.title || '알림'}</h3>
                            <button onclick="adminUtils.closeModal()" class="text-gray-400 hover:text-gray-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="admin-modal-body">
                            ${options.content || ''}
                        </div>
                        <div class="admin-modal-footer">
                            ${options.buttons ? options.buttons.map(btn => `
                                <button class="admin-btn admin-btn-${btn.type || 'secondary'}"
                                    onclick="${btn.handler}">
                                    ${btn.label}
                                </button>
                            `).join('') : ''}
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
        },

        /**
         * 모달 닫기
         */
        closeModal: function () {
            const modal = document.getElementById('admin-modal');
            if (modal) {
                modal.remove();
            }
        },

        /**
         * 토스트 알림 표시
         */
        showToast: function (message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white z-50 
                ${type === 'success' ? 'bg-green-500' :
                    type === 'error' ? 'bg-red-500' :
                        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`;
            toast.textContent = message;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, duration);
        }
    };

    // 🔧 최적화된 DOM 이벤트 리스너 (중복 방지)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            console.log('🔧 DOMContentLoaded 이벤트 발생, 관리자 페이지 초기화 시작');
            
            // 중복 실행 방지
            if (!window.adminUtilsInitialized) {
                if (window.adminUtils && window.adminUtils.initAdminPage) {
                    window.adminUtils.initAdminPage();
                    window.adminUtilsInitialized = true;
                } else {
                    console.warn('❌ adminUtils가 로드되지 않았거나 initAdminPage 함수가 없습니다.');
                }
            }
        });
    } else {
        // DOM이 이미 로드된 경우
        console.log('🔧 DOM 이미 로드됨, 즉시 초기화');
        if (!window.adminUtilsInitialized) {
            if (window.adminUtils && window.adminUtils.initAdminPage) {
                window.adminUtils.initAdminPage();
                window.adminUtilsInitialized = true;
            }
        }
    }

    // 페이지 로드 완료 시 추가 초기화 (이미지 등의 로딩까지 완료된 후)
    window.addEventListener('load', function () {
        console.log('🔧 페이지 로드 완료');

        // 관리자 요소 확인 및 클래스 추가
        if (!document.querySelector('.admin-header')) {
            const header = document.querySelector('header');
            if (header) {
                header.classList.add('admin-header');
            }
        }

        // 헤더의 제목에 클래스 추가
        if (!document.querySelector('.admin-title')) {
            const headerTitle = document.querySelector('header a[href*="index.html"]');
            if (headerTitle) {
                headerTitle.classList.add('admin-title');

                // 텍스트가 "디지털헬스케어센터 관리자"인 경우 "관리자 페이지"로 변경
                if (headerTitle.textContent.trim() === '디지털헬스케어센터 관리자') {
                    headerTitle.textContent = '관리자 페이지';
                }
            }
        }

        // 사용자 정보에 클래스 추가
        if (!document.querySelector('.admin-user-info')) {
            const adminName = document.getElementById('admin-name');
            if (adminName) {
                let parent = adminName.parentElement;
                while (parent && !parent.classList.contains('flex')) {
                    parent = parent.parentElement;
                }

                if (parent) {
                    parent.classList.add('admin-user-info');

                    // 초기 로딩 시 not-loaded 클래스 추가
                    if (!sessionStorage.getItem('admin_name')) {
                        parent.classList.add('not-loaded');
                    }
                }
            }
        }
    });

    // 🔧 디버깅을 위한 전역 함수
    window.adminDebug = {
        toggleSidebar: window.adminUtils.toggleSidebar.bind(window.adminUtils),
        openSidebar: window.adminUtils.openSidebar.bind(window.adminUtils),
        closeSidebar: window.adminUtils.closeSidebar.bind(window.adminUtils),
        initSidebar: window.adminUtils.initAdminSidebar.bind(window.adminUtils),
        checkElements: function() {
            console.log('🔧 사이드바 요소 확인:');
            console.log('- 토글 버튼:', !!document.getElementById('admin-sidebar-toggle'));
            console.log('- 사이드바:', !!document.querySelector('.admin-sidebar'));
            console.log('- 오버레이:', !!document.getElementById('sidebar-overlay'));
            console.log('- 사이드바 활성:', document.querySelector('.admin-sidebar')?.classList.contains('active'));
            console.log('- 초기화 상태:', {
                adminUtilsInitialized,
                sidebarInitialized, 
                authListenerInitialized
            });
        }
    };

})();

console.log('✅ admin.js 최적화 완료 - 중복 실행 방지 적용');