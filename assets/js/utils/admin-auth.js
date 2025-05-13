/**
 * 관리자 권한 확인 미들웨어
 * 관리자 페이지 접근 시 권한을 확인합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // 관리자 이메일 목록
    const ADMIN_EMAILS = [
        'admin@test.com', // 로컬 테스트용 계정
        'gostepexercise@gmail.com' // 실제 관리자 계정
    ];
    
    // adminAuth 네임스페이스 생성
    window.adminAuth = {
        /**
         * 현재 사용자가 관리자인지 확인
         * @returns {boolean} 관리자 여부
         */
        isAdmin: function() {
            try {
                const currentUser = window.dhcFirebase.getCurrentUser();
                
                if (!currentUser || !currentUser.email) {
                    return false;
                }
                
                // 이메일이 관리자 목록에 있는지 확인
                return ADMIN_EMAILS.includes(currentUser.email);
            } catch (error) {
                console.error('관리자 권한 확인 오류:', error);
                return false;
            }
        },
        
        /**
         * 관리자 권한 확인
         * 
         * @returns {Promise<boolean>} - 권한 확인 결과 프로미스
         */
        checkAdminAccess: async function() {
            try {
                // 현재 로그인한 사용자 확인
                const user = window.dhcFirebase.getCurrentUser();
                
                if (!user) {
                    // 로그인하지 않은 경우
                    console.log('로그인이 필요합니다.');
                    
                    // 현재 페이지를 리다이렉트 URL로 저장하여 로그인 후 돌아올 수 있도록 함
                    const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
                    window.location.href = `/pages/auth/login.html?redirect=${redirectUrl}`;
                    return false;
                }
                
                // 관리자 권한 확인
                if (!this.isAdmin()) {
                    // 관리자가 아닌 경우
                    console.log('관리자 권한이 필요합니다.');
                    alert('관리자 권한이 필요합니다.');
                    window.location.href = '/index.html';
                    return false;
                }
                
                // 관리자 네비게이션 설정
                this.setupAdminNavigation();
                
                // 관리자 정보 표시
                this.displayAdminInfo();
                
                return true;
            } catch (error) {
                console.error('관리자 권한 확인 오류:', error);
                alert('권한 확인 중 오류가 발생했습니다.');
                window.location.href = '/index.html';
                return false;
            }
        },
        
        /**
         * 관리자 네비게이션 설정
         */
        setupAdminNavigation: function() {
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
            
            // 로그아웃 버튼 이벤트 리스너
            const logoutButton = document.getElementById('admin-logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    
                    if (confirm('로그아웃 하시겠습니까?')) {
                        try {
                            await window.authService.signOut();
                            this.showNotification('로그아웃 되었습니다.', 'success');
                            setTimeout(() => {
                                window.location.href = '/index.html';
                            }, 1000);
                        } catch (error) {
                            console.error('로그아웃 오류:', error);
                            this.showNotification('로그아웃 중 오류가 발생했습니다.', 'error');
                        }
                    }
                });
            }
        },
        
        /**
         * 관리자 정보 표시
         */
        displayAdminInfo: function() {
            try {
                const currentUser = window.dhcFirebase.getCurrentUser();
                
                if (currentUser) {
                    const adminNameElement = document.getElementById('admin-name');
                    const adminEmailElement = document.getElementById('admin-email');
                    
                    if (adminNameElement) {
                        adminNameElement.textContent = currentUser.displayName || '관리자';
                    }
                    
                    if (adminEmailElement) {
                        adminEmailElement.textContent = currentUser.email;
                    }
                    
                    // 프로필 이미지 표시
                    const adminPhotoElement = document.getElementById('admin-photo');
                    if (adminPhotoElement && currentUser.photoURL) {
                        adminPhotoElement.src = currentUser.photoURL;
                    }
                }
            } catch (error) {
                console.error('관리자 정보 표시 오류:', error);
            }
        },
        
        /**
         * 대시보드 데이터 로드
         */
        loadDashboardData: async function() {
            try {
                // 전체 회원 수 조회
                const totalUsers = await this.getTotalUsers();
                this.updateDashboardElement('total-users', totalUsers);
                
                // 오늘 가입한 회원 수 조회
                const todayUsers = await this.getTodayUsers();
                this.updateDashboardElement('today-users', todayUsers);
                
                // 진행 중인 교육 과정 수 조회
                const activeCourses = await this.getActiveCourses();
                this.updateDashboardElement('active-courses', activeCourses);
                
                // 활성 자격증 수 조회
                const activeCertificates = await this.getActiveCertificates();
                this.updateDashboardElement('active-certificates', activeCertificates);
                
                // 최근 활동 로드
                this.loadRecentActivities();
                
            } catch (error) {
                console.error('대시보드 데이터 로드 오류:', error);
                this.showNotification('대시보드 데이터를 불러오는데 실패했습니다.', 'error');
            }
        },
        
        /**
         * 전체 회원 수 조회
         */
        getTotalUsers: async function() {
            if (window.dbService) {
                const result = await window.dbService.countDocuments('users');
                return result.success ? result.count : 0;
            }
            return 0;
        },
        
        /**
         * 오늘 가입한 회원 수 조회
         */
        getTodayUsers: async function() {
            if (window.dbService) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const result = await window.dbService.getDocuments('users', {
                    where: [{ field: 'createdAt', operator: '>=', value: today }]
                });
                
                return result.success ? result.data.length : 0;
            }
            return 0;
        },
        
        /**
         * 활성 교육 과정 수 조회
         */
        getActiveCourses: async function() {
            if (window.dbService) {
                const result = await window.dbService.getDocuments('courses', {
                    where: [{ field: 'status', operator: '==', value: 'active' }]
                });
                
                return result.success ? result.data.length : 0;
            }
            return 0;
        },
        
        /**
         * 활성 자격증 수 조회
         */
        getActiveCertificates: async function() {
            if (window.dbService) {
                const result = await window.dbService.getDocuments('certificates', {
                    where: [{ field: 'status', operator: '==', value: 'active' }]
                });
                
                return result.success ? result.data.length : 0;
            }
            return 0;
        },
        
        /**
         * 대시보드 요소 업데이트
         */
        updateDashboardElement: function(elementId, value) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value.toLocaleString();
            }
        },
        
        /**
         * 최근 활동 로드
         */
        loadRecentActivities: async function() {
            try {
                const activities = [];
                
                // 최근 로그인 기록 조회
                if (window.dbService) {
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
                }
                
                // 활동 목록 정렬 (최신순)
                activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // 최근 활동 표시
                this.displayRecentActivities(activities.slice(0, 5));
                
            } catch (error) {
                console.error('최근 활동 로드 오류:', error);
            }
        },
        
        /**
         * 최근 활동 표시
         */
        displayRecentActivities: function(activities) {
            const container = document.getElementById('recent-activities');
            if (!container) return;
            
            if (activities.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">최근 활동이 없습니다.</p>';
                return;
            }
            
            const activitiesHtml = activities.map(activity => {
                const timeAgo = this.getTimeAgo(activity.timestamp);
                return `
                    <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div class="flex-shrink-0">
                            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900 truncate">${activity.message}</p>
                            <p class="text-xs text-gray-500">${timeAgo}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = activitiesHtml;
        },
        
        /**
         * 시간 경과 표시
         */
        getTimeAgo: function(timestamp) {
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
        },
        
        /**
         * 알림 표시
         * 
         * @param {string} message - 알림 메시지
         * @param {string} type - 알림 타입 ('success', 'error', 'info', 'warning')
         */
        showNotification: function(message, type = 'info') {
            let notification = document.getElementById('admin-notification');
            
            // 알림 컨테이너가 없으면 생성
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'admin-notification';
                notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 400px;';
                document.body.appendChild(notification);
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
                <div class="border px-4 py-3 rounded relative ${typeClasses[type]}">
                    <strong class="font-bold">${this.getNotificationTitle(type)}</strong>
                    <span class="block sm:inline">${message}</span>
                    <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onclick="this.parentElement.remove()">
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
                }
            }, 5000);
        },
        
        /**
         * 알림 타입별 제목 반환
         */
        getNotificationTitle: function(type) {
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
        requireAdmin: function(callback, onUnauthorized = null) {
            const user = window.dhcFirebase.getCurrentUser();
            
            if (!user) {
                if (onUnauthorized) {
                    onUnauthorized();
                } else {
                    this.showNotification('로그인이 필요합니다.', 'warning');
                    setTimeout(() => {
                        window.location.href = '/pages/auth/login.html';
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
                        window.location.href = '/index.html';
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
        getAdminEmails: function() {
            return ADMIN_EMAILS;
        }
    };
})();