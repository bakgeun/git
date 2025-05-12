/**
 * 관리자 권한 확인 미들웨어
 * 관리자 페이지 접근 시 권한을 확인합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // adminAuth 네임스페이스 생성
    window.adminAuth = {
        /**
         * 관리자 권한 확인
         * 
         * @returns {Promise} - 권한 확인 결과 프로미스
         */
        checkAdminAccess: async function() {
            try {
                // 현재 로그인한 사용자 확인
                const user = window.dhcFirebase.getCurrentUser();
                
                if (!user) {
                    // 로그인하지 않은 경우
                    console.log('로그인이 필요합니다.');
                    window.location.href = '/pages/auth/login.html?redirect=' + encodeURIComponent(window.location.pathname);
                    return false;
                }
                
                // 사용자 역할 확인
                const roleInfo = await window.authService.checkUserRole();
                
                if (!roleInfo.isAdmin) {
                    // 관리자가 아닌 경우
                    console.log('관리자 권한이 필요합니다.');
                    alert('관리자 권한이 필요합니다.');
                    window.location.href = '/index.html';
                    return false;
                }
                
                // 관리자 네비게이션 설정
                this.setupAdminNavigation();
                
                return true;
            } catch (error) {
                console.error('관리자 권한 확인 오류:', error);
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
                if (item.getAttribute('href') === currentPath) {
                    item.classList.add('bg-indigo-700', 'text-white');
                    item.classList.remove('text-indigo-300', 'hover:bg-indigo-600');
                }
            });
            
            // 로그아웃 버튼 이벤트 리스너
            const logoutButton = document.getElementById('admin-logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', async function() {
                    if (confirm('로그아웃 하시겠습니까?')) {
                        const result = await window.authService.signOut();
                        if (result.success) {
                            window.location.href = '/index.html';
                        }
                    }
                });
            }
        },
        
        /**
         * 관리자 정보 표시
         */
        displayAdminInfo: async function() {
            try {
                const userDetails = await window.authService.getCurrentUserDetails();
                
                if (userDetails) {
                    const adminNameElement = document.getElementById('admin-name');
                    const adminEmailElement = document.getElementById('admin-email');
                    
                    if (adminNameElement) {
                        adminNameElement.textContent = userDetails.displayName || '관리자';
                    }
                    
                    if (adminEmailElement) {
                        adminEmailElement.textContent = userDetails.email;
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
                // 전체 회원 수
                const usersCount = await dbService.countDocuments('users');
                if (usersCount.success) {
                    const totalUsersElement = document.getElementById('total-users');
                    if (totalUsersElement) {
                        totalUsersElement.textContent = usersCount.count;
                    }
                }
                
                // 오늘 가입한 회원 수
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const todayUsers = await dbService.getDocuments('users', {
                    where: [
                        { field: 'createdAt', operator: '>=', value: today }
                    ]
                });
                
                if (todayUsers.success) {
                    const todayUsersElement = document.getElementById('today-users');
                    if (todayUsersElement) {
                        todayUsersElement.textContent = todayUsers.data.length;
                    }
                }
                
                // 진행 중인 교육 과정 수
                const activeCourses = await dbService.getDocuments('courses', {
                    where: { field: 'status', operator: '==', value: 'active' }
                });
                
                if (activeCourses.success) {
                    const activeCoursesElement = document.getElementById('active-courses');
                    if (activeCoursesElement) {
                        activeCoursesElement.textContent = activeCourses.data.length;
                    }
                }
                
                // 활성 자격증 수
                const activeCertificates = await dbService.getDocuments('certificates', {
                    where: { field: 'status', operator: '==', value: 'active' }
                });
                
                if (activeCertificates.success) {
                    const activeCertificatesElement = document.getElementById('active-certificates');
                    if (activeCertificatesElement) {
                        activeCertificatesElement.textContent = activeCertificates.data.length;
                    }
                }
            } catch (error) {
                console.error('대시보드 데이터 로드 오류:', error);
            }
        },
        
        /**
         * 알림 표시
         * 
         * @param {string} message - 알림 메시지
         * @param {string} type - 알림 타입 ('success', 'error', 'info', 'warning')
         */
        showNotification: function(message, type = 'info') {
            const notification = document.getElementById('admin-notification');
            if (!notification) return;
            
            // 타입별 스타일 클래스
            const typeClasses = {
                'success': 'bg-green-100 border-green-400 text-green-700',
                'error': 'bg-red-100 border-red-400 text-red-700',
                'info': 'bg-blue-100 border-blue-400 text-blue-700',
                'warning': 'bg-yellow-100 border-yellow-400 text-yellow-700'
            };
            
            // 기존 클래스 제거
            notification.className = 'border px-4 py-3 rounded relative mb-4';
            
            // 새 클래스 추가
            notification.classList.add(...typeClasses[type].split(' '));
            
            // 메시지 설정
            notification.innerHTML = `
                <strong class="font-bold">${type === 'success' ? '성공!' : type === 'error' ? '오류!' : type === 'warning' ? '경고!' : '알림'}</strong>
                <span class="block sm:inline">${message}</span>
                <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <svg class="fill-current h-6 w-6 text-current" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" onclick="this.parentElement.parentElement.style.display='none'">
                        <title>Close</title>
                        <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                    </svg>
                </span>
            `;
            
            // 알림 표시
            notification.style.display = 'block';
            
            // 5초 후 자동으로 숨김
            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);
        }
    };
})();