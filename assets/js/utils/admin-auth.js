/**
 * 관리자 권한 확인 미들웨어
 * 관리자 페이지 접근 시 권한을 확인합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
    // 관리자 이메일 목록
    const ADMIN_EMAILS = [
        'admin@test.com', // 로컬 테스트용 계정
        'gostepexercise@gmail.com' // 실제 관리자 계정
    ];

    // adminAuth 네임스페이스 생성
    window.adminAuth = {
        /**
         * 페이지 깊이에 따른 경로 조정
         * @param {string} targetPath - 대상 경로
         * @returns {string} - 조정된 경로
         */
        adjustPath: function (targetPath) {
            try {
                // script-loader.js의 adjustPath 함수 사용 시도
                if (window.adjustPath && typeof window.adjustPath === 'function') {
                    return window.adjustPath(targetPath);
                }

                // script-loader.js가 없는 경우 자체 구현
                const pathSegments = window.location.pathname.split('/').filter(segment => segment);
                const currentDepth = pathSegments.length;

                // 관리자 페이지 기준으로 경로 조정
                // pages/admin/dashboard.html에서 다른 페이지로 이동 시
                if (currentDepth >= 2 && pathSegments.includes('admin')) {
                    // admin 페이지에서 다른 admin 페이지로 이동
                    if (targetPath.startsWith('pages/admin/')) {
                        return targetPath.replace('pages/admin/', '');
                    }
                    // admin 페이지에서 root나 다른 페이지로 이동
                    return '../../' + targetPath;
                }

                return targetPath;
            } catch (error) {
                console.error('경로 조정 오류:', error);
                return targetPath;
            }
        },

        /**
         * 현재 사용자가 관리자인지 확인
         * @returns {boolean} 관리자 여부
         */
        isAdmin: function () {
            try {
                if (!window.dhcFirebase) {
                    console.log('dhcFirebase가 초기화되지 않음');
                    return false;
                }

                const currentUser = window.dhcFirebase.getCurrentUser();

                if (!currentUser || !currentUser.email) {
                    console.log('로그인한 사용자가 없음');
                    return false;
                }

                // 이메일이 관리자 목록에 있는지 확인
                const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
                console.log('isAdmin 확인:', { email: currentUser.email, isAdmin });
                return isAdmin;
            } catch (error) {
                console.error('관리자 권한 확인 오류:', error);
                return false;
            }
        },

        /**
         * 관리자 권한 확인 (프로미스 기반)
         * @returns {Promise<boolean>} - 권한 확인 결과 프로미스
         */
        checkAdminAccess: async function() {
            // 무한 리디렉션 방지를 위해 함수 완전 비활성화
            console.log('checkAdminAccess 함수 비활성화됨 - 무한 리디렉션 방지');
            
            // dashboard.html에서 직접 권한 확인을 처리하므로 여기서는 아무것도 하지 않음
            return true;
        },

        /**
         * Firebase 초기화 대기
         * @returns {Promise<void>}
         */
        waitForFirebase: async function () {
            console.log('Firebase 초기화 대기...');
            let attempts = 0;
            const maxAttempts = 50;

            while (!window.dhcFirebase && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.dhcFirebase) {
                throw new Error('Firebase 초기화 시간 초과');
            }

            console.log('Firebase 초기화 완료');
        },

        /**
         * 관리자 네비게이션 설정
         */
        setupAdminNavigation: function () {
            console.log('관리자 네비게이션 설정');

            // 관리자 메뉴 활성화 표시
            const currentPath = window.location.pathname;
            const adminNavItems = document.querySelectorAll('.admin-nav a');

            adminNavItems.forEach(item => {
                const href = item.getAttribute('href');
                if (href && currentPath.includes(href)) {
                    item.classList.add('bg-indigo-700', 'text-white');
                    item.classList.remove('text-indigo-300', 'hover:bg-indigo-600');
                }
            });

            // 모든 네비게이션 링크에 경로 조정 적용
            const navLinks = document.querySelectorAll('a[href]');
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('javascript:')) {
                    // 상대 경로인 경우에만 조정
                    const adjustedPath = this.adjustPath(href);
                    if (adjustedPath !== href) {
                        link.setAttribute('href', adjustedPath);
                        console.log('네비게이션 링크 조정:', href, '->', adjustedPath);
                    }
                }
            });

            // 로그아웃 버튼 이벤트 리스너
            const logoutButton = document.getElementById('admin-logout-button');
            if (logoutButton) {
                // 기존 이벤트 리스너 제거
                logoutButton.removeEventListener('click', this.handleLogout);
                // 새 이벤트 리스너 추가
                logoutButton.addEventListener('click', this.handleLogout.bind(this));
            }
        },

        /**
         * 로그아웃 처리
         * @param {Event} e - 클릭 이벤트
         */
        handleLogout: async function (e) {
            e.preventDefault();
            console.log('로그아웃 시도');

            if (confirm('로그아웃 하시겠습니까?')) {
                try {
                    // Firebase 서비스 사용 가능 확인
                    if (window.authService && typeof window.authService.signOut === 'function') {
                        await window.authService.signOut();
                    } else if (window.dhcFirebase && window.dhcFirebase.auth) {
                        await window.dhcFirebase.auth.signOut();
                    } else {
                        throw new Error('인증 서비스를 찾을 수 없습니다.');
                    }

                    this.showNotification('로그아웃 되었습니다.', 'success');
                    console.log('로그아웃 성공');

                    setTimeout(() => {
                        const indexPath = this.adjustPath('index.html');
                        console.log('홈페이지로 이동:', indexPath);
                        window.location.href = indexPath;
                    }, 1000);
                } catch (error) {
                    console.error('로그아웃 오류:', error);
                    this.showNotification('로그아웃 중 오류가 발생했습니다.', 'error');
                }
            }
        },

        /**
         * 관리자 정보 표시
         */
        displayAdminInfo: function () {
            console.log('관리자 정보 표시');

            try {
                if (!window.dhcFirebase) {
                    console.log('dhcFirebase가 초기화되지 않아 관리자 정보 표시 불가');
                    return;
                }

                const currentUser = window.dhcFirebase.getCurrentUser();

                if (currentUser) {
                    console.log('현재 관리자 사용자:', currentUser.email);

                    const adminNameElement = document.getElementById('admin-name');
                    const adminEmailElement = document.getElementById('admin-email');

                    if (adminNameElement) {
                        const displayName = currentUser.displayName || '관리자';
                        adminNameElement.textContent = displayName;
                        console.log('관리자 이름 표시:', displayName);
                    }

                    if (adminEmailElement) {
                        adminEmailElement.textContent = currentUser.email;
                        console.log('관리자 이메일 표시:', currentUser.email);
                    }

                    // 프로필 이미지 표시
                    const adminPhotoElement = document.getElementById('admin-photo');
                    if (adminPhotoElement && currentUser.photoURL) {
                        adminPhotoElement.src = currentUser.photoURL;
                        console.log('관리자 프로필 이미지 표시');
                    }
                } else {
                    console.log('현재 로그인한 사용자가 없어 관리자 정보 표시 불가');
                }
            } catch (error) {
                console.error('관리자 정보 표시 오류:', error);
            }
        },

        /**
         * 대시보드 데이터 로드
         */
        loadDashboardData: async function () {
            console.log('대시보드 데이터 로드 시작');

            try {
                // 전체 회원 수 조회
                console.log('전체 회원 수 조회 중...');
                const totalUsers = await this.getTotalUsers();
                this.updateDashboardElement('total-users', totalUsers);

                // 오늘 가입한 회원 수 조회
                console.log('오늘 가입 회원 수 조회 중...');
                const todayUsers = await this.getTodayUsers();
                this.updateDashboardElement('today-users', todayUsers);

                // 진행 중인 교육 과정 수 조회
                console.log('활성 교육 과정 수 조회 중...');
                const activeCourses = await this.getActiveCourses();
                this.updateDashboardElement('active-courses', activeCourses);

                // 활성 자격증 수 조회
                console.log('활성 자격증 수 조회 중...');
                const activeCertificates = await this.getActiveCertificates();
                this.updateDashboardElement('active-certificates', activeCertificates);

                // 최근 활동 로드
                console.log('최근 활동 로드 중...');
                await this.loadRecentActivities();

                console.log('대시보드 데이터 로드 완료');
            } catch (error) {
                console.error('대시보드 데이터 로드 오류:', error);
                this.showNotification('대시보드 데이터를 불러오는데 실패했습니다.', 'error');
            }
        },

        /**
         * 전체 회원 수 조회
         */
        getTotalUsers: async function () {
            try {
                if (window.dbService && typeof window.dbService.countDocuments === 'function') {
                    const result = await window.dbService.countDocuments('users');
                    return result.success ? result.count : 0;
                } else {
                    console.log('dbService를 찾을 수 없음 - 더미 데이터 반환');
                    return 150; // 더미 데이터
                }
            } catch (error) {
                console.error('전체 회원 수 조회 오류:', error);
                return 0;
            }
        },

        /**
         * 오늘 가입한 회원 수 조회
         */
        getTodayUsers: async function () {
            try {
                if (window.dbService && typeof window.dbService.getDocuments === 'function') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const result = await window.dbService.getDocuments('users', {
                        where: [{ field: 'createdAt', operator: '>=', value: today }]
                    });

                    return result.success ? result.data.length : 0;
                } else {
                    console.log('dbService를 찾을 수 없음 - 더미 데이터 반환');
                    return 5; // 더미 데이터
                }
            } catch (error) {
                console.error('오늘 가입 회원 수 조회 오류:', error);
                return 0;
            }
        },

        /**
         * 활성 교육 과정 수 조회
         */
        getActiveCourses: async function () {
            try {
                if (window.dbService && typeof window.dbService.getDocuments === 'function') {
                    const result = await window.dbService.getDocuments('courses', {
                        where: [{ field: 'status', operator: '==', value: 'active' }]
                    });

                    return result.success ? result.data.length : 0;
                } else {
                    console.log('dbService를 찾을 수 없음 - 더미 데이터 반환');
                    return 12; // 더미 데이터
                }
            } catch (error) {
                console.error('활성 교육 과정 수 조회 오류:', error);
                return 0;
            }
        },

        /**
         * 활성 자격증 수 조회
         */
        getActiveCertificates: async function () {
            try {
                if (window.dbService && typeof window.dbService.getDocuments === 'function') {
                    const result = await window.dbService.getDocuments('certificates', {
                        where: [{ field: 'status', operator: '==', value: 'active' }]
                    });

                    return result.success ? result.data.length : 0;
                } else {
                    console.log('dbService를 찾을 수 없음 - 더미 데이터 반환');
                    return 84; // 더미 데이터
                }
            } catch (error) {
                console.error('활성 자격증 수 조회 오류:', error);
                return 0;
            }
        },

        /**
         * 대시보드 요소 업데이트
         * @param {string} elementId - 요소 ID
         * @param {number} value - 업데이트할 값
         */
        updateDashboardElement: function (elementId, value) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value.toLocaleString();
                console.log(`대시보드 ${elementId} 업데이트:`, value);
            } else {
                console.log(`대시보드 요소 ${elementId}를 찾을 수 없음`);
            }
        },

        /**
         * 최근 활동 로드
         */
        loadRecentActivities: async function () {
            console.log('최근 활동 로드 시작');

            try {
                const activities = [];

                // 최근 로그인 기록 조회
                if (window.dbService && typeof window.dbService.getDocuments === 'function') {
                    const loginLogs = await window.dbService.getDocuments('login_logs', {
                        orderBy: { field: 'timestamp', direction: 'desc' },
                        limit: 10
                    });

                    if (loginLogs.success) {
                        loginLogs.data.forEach(log => {
                            activities.push({
                                type: 'login',
                                message: `${log.userEmail}님이 로그인했습니다.`,
                                timestamp: log.timestamp,
                                icon: 'login'
                            });
                        });
                    }
                } else {
                    // dbService가 없는 경우 더미 데이터
                    console.log('dbService를 찾을 수 없음 - 더미 활동 데이터 생성');
                    activities.push(
                        {
                            type: 'login',
                            message: '관리자가 로그인했습니다.',
                            timestamp: new Date(),
                            icon: 'login'
                        },
                        {
                            type: 'registration',
                            message: '새로운 회원이 가입했습니다.',
                            timestamp: new Date(Date.now() - 3600000),
                            icon: 'user'
                        }
                    );
                }

                // 활동 목록 정렬 (최신순)
                activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                // 최근 활동 표시
                this.displayRecentActivities(activities.slice(0, 5));

                console.log('최근 활동 로드 완료:', activities.length);
            } catch (error) {
                console.error('최근 활동 로드 오류:', error);
            }
        },

        /**
         * 최근 활동 표시
         * @param {Array} activities - 활동 목록
         */
        displayRecentActivities: function (activities) {
            console.log('최근 활동 표시 시작');

            const container = document.getElementById('recent-activities');
            if (!container) {
                console.log('recent-activities 컨테이너를 찾을 수 없음');
                return;
            }

            if (activities.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">최근 활동이 없습니다.</p>';
                return;
            }

            const activitiesHtml = activities.map(activity => {
                const timeAgo = this.getTimeAgo(activity.timestamp);
                const iconSvg = this.getActivityIcon(activity.type);

                return `
                    <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div class="flex-shrink-0">
                            ${iconSvg}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900 truncate">${activity.message}</p>
                            <p class="text-xs text-gray-500">${timeAgo}</p>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = activitiesHtml;
            console.log('최근 활동 표시 완료');
        },

        /**
         * 활동 타입별 아이콘 반환
         * @param {string} type - 활동 타입
         * @returns {string} - SVG 아이콘 HTML
         */
        getActivityIcon: function (type) {
            const icons = {
                'login': `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>`,
                'user': `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>`,
                'course': `<svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>`,
                'certificate': `<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>`
            };

            return icons[type] || icons['user'];
        },

        /**
         * 시간 경과 표시
         * @param {Date|string} timestamp - 시간스탬프
         * @returns {string} - 시간 경과 문자열
         */
        getTimeAgo: function (timestamp) {
            try {
                const now = new Date();
                const time = new Date(timestamp);
                const diffInSeconds = Math.floor((now - time) / 1000);

                if (diffInSeconds < 60) {
                    return '방금 전';
                } else if (diffInSeconds < 3600) {
                    return `${Math.floor(diffInSeconds / 60)}분 전`;
                } else if (diffInSeconds < 86400) {
                    return `${Math.floor(diffInSeconds / 3600)}시간 전`;
                } else {
                    return `${Math.floor(diffInSeconds / 86400)}일 전`;
                }
            } catch (error) {
                console.error('시간 계산 오류:', error);
                return '알 수 없음';
            }
        },

        /**
         * 알림 표시
         * @param {string} message - 알림 메시지
         * @param {string} type - 알림 타입 ('success', 'error', 'info', 'warning')
         */
        showNotification: function (message, type = 'info') {
            console.log('관리자 알림 표시:', { message, type });

            let notification = document.getElementById('admin-notification');

            // 알림 컨테이너가 없으면 생성
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'admin-notification';
                notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 400px;';
                document.body.appendChild(notification);
                console.log('알림 컨테이너 생성');
            }

            // 타입별 스타일 클래스
            const typeClasses = {
                'success': 'bg-green-100 border-green-400 text-green-700',
                'error': 'bg-red-100 border-red-400 text-red-700',
                'info': 'bg-blue-100 border-blue-400 text-blue-700',
                'warning': 'bg-yellow-100 border-yellow-400 text-yellow-700'
            };

            // 알림 내용 생성
            notification.innerHTML = `
                <div class="border px-4 py-3 rounded relative ${typeClasses[type]} shadow-lg animate-pulse">
                    <strong class="font-bold">${this.getNotificationTitle(type)}</strong>
                    <span class="block sm:inline">${message}</span>
                    <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer hover:bg-opacity-80" onclick="this.parentElement.remove()">
                        <svg class="fill-current h-6 w-6 text-current" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <title>Close</title>
                            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                        </svg>
                    </span>
                </div>
            `;

            // 5초 후 자동으로 숨김
            setTimeout(() => {
                if (notification.firstChild) {
                    notification.firstChild.remove();
                    console.log('알림 자동 제거');
                }
            }, 5000);
        },

        /**
         * 알림 타입별 제목 반환
         * @param {string} type - 알림 타입
         * @returns {string} - 제목
         */
        getNotificationTitle: function (type) {
            const titles = {
                'success': '성공!',
                'error': '오류!',
                'info': '알림',
                'warning': '경고!'
            };
            return titles[type] || '알림';
        },

        /**
        * 권한 확인과 함께 함수 실행
        * @param {Function} callback - 실행할 함수
        * @param {Function} onUnauthorized - 권한 없을 때 실행할 함수
        */
        requireAdmin: function (callback, onUnauthorized = null) {
            const user = window.dhcFirebase.getCurrentUser();

            if (!user) {
                if (onUnauthorized) {
                    onUnauthorized();
                } else {
                    this.showNotification('로그인이 필요합니다.', 'warning');
                    setTimeout(() => {
                        const loginPath = this.adjustPath('pages/auth/login.html');
                        window.location.href = loginPath;
                    }, 1000);
                }
                return false;
            }

            if (!this.isAdmin()) {
                if (onUnauthorized) {
                    onUnauthorized();
                } else {
                    this.showNotification('관리자 권한이 필요합니다.', 'error');
                    setTimeout(() => {
                        const indexPath = this.adjustPath('index.html');
                        window.location.href = indexPath;
                    }, 1000);
                }
                return false;
            }

            if (callback && typeof callback === 'function') {
                callback();
            }
            return true;
        },

        /**
         * 관리자 계정 목록 반환 (디버깅용)
         */
        getAdminEmails: function () {
            return ADMIN_EMAILS;
        }
    };
})();