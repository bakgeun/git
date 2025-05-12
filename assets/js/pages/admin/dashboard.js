/**
 * 관리자 대시보드 페이지 스크립트
 */

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', async function() {
    // Firebase 초기화 대기
    await window.dhcFirebase.initialize();
    
    // 관리자 권한 확인
    const hasAccess = await window.adminAuth.checkAdminAccess();
    if (!hasAccess) {
        return; // 권한이 없으면 이미 리디렉션됨
    }
    
    // 관리자 정보 표시
    await window.adminAuth.displayAdminInfo();
    
    // 대시보드 데이터 로드
    await loadDashboardData();
    
    // 최근 데이터 로드
    await loadRecentUsers();
    await loadRecentApplications();
    await loadRecentNotices();
    
    // 시스템 상태 표시
    updateSystemStatus();
    
    // 실시간 업데이트 설정
    setupRealtimeUpdates();
});

/**
 * 대시보드 통계 데이터 로드
 */
async function loadDashboardData() {
    try {
        // 전체 회원 수
        const usersCount = await dbService.countDocuments('users');
        if (usersCount.success) {
            document.getElementById('total-users').textContent = usersCount.count;
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
            document.getElementById('today-users').textContent = todayUsers.data.length;
        }
        
        // 진행 중인 교육 과정 수
        const activeCourses = await dbService.getDocuments('courses', {
            where: { field: 'status', operator: '==', value: 'active' }
        });
        
        if (activeCourses.success) {
            document.getElementById('active-courses').textContent = activeCourses.data.length;
        }
        
        // 활성 자격증 수
        const activeCertificates = await dbService.getDocuments('certificates', {
            where: { field: 'status', operator: '==', value: 'active' }
        });
        
        if (activeCertificates.success) {
            document.getElementById('active-certificates').textContent = activeCertificates.data.length;
        }
        
        // 이번 달 수익 계산
        await calculateMonthlyRevenue();
        
    } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
        window.adminAuth.showNotification('대시보드 데이터 로드 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 이번 달 수익 계산
 */
async function calculateMonthlyRevenue() {
    try {
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const monthlyPayments = await dbService.getDocuments('payments', {
            where: [
                { field: 'status', operator: '==', value: 'completed' },
                { field: 'createdAt', operator: '>=', value: firstDayOfMonth }
            ]
        });
        
        if (monthlyPayments.success) {
            const totalRevenue = monthlyPayments.data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
            document.getElementById('monthly-revenue').textContent = formatters.formatCurrency(totalRevenue);
        }
    } catch (error) {
        console.error('월별 수익 계산 오류:', error);
    }
}

/**
 * 최근 가입 회원 로드
 */
async function loadRecentUsers() {
    try {
        const recentUsers = await dbService.getDocuments('users', {
            orderBy: { field: 'createdAt', direction: 'desc' },
            limit: 5
        });
        
        if (recentUsers.success && recentUsers.data.length > 0) {
            const tbody = document.getElementById('recent-users-tbody');
            tbody.innerHTML = recentUsers.data.map(user => `
                <tr class="border-b">
                    <td class="py-2 text-sm">${user.displayName || '이름 없음'}</td>
                    <td class="py-2 text-sm text-gray-600">${user.email}</td>
                    <td class="py-2 text-sm text-gray-600">${formatters.formatDate(user.createdAt?.toDate?.())}</td>
                </tr>
            `).join('');
        } else {
            document.getElementById('recent-users-tbody').innerHTML = `
                <tr>
                    <td colspan="3" class="py-4 text-center text-gray-500">최근 가입한 회원이 없습니다.</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('최근 회원 로드 오류:', error);
    }
}

/**
 * 최근 교육 신청 로드
 */
async function loadRecentApplications() {
    try {
        const recentApplications = await dbService.getDocuments('applications', {
            orderBy: { field: 'createdAt', direction: 'desc' },
            limit: 5
        });
        
        if (recentApplications.success && recentApplications.data.length > 0) {
            const tbody = document.getElementById('recent-applications-tbody');
            
            // 각 신청에 대한 추가 정보 로드
            const applicationRows = await Promise.all(recentApplications.data.map(async (application) => {
                // 교육 과정 정보 가져오기
                const courseData = await dbService.getDocument('courses', application.courseId);
                const courseName = courseData.success ? courseData.data.title : '알 수 없음';
                
                // 신청자 정보 가져오기
                const userData = await dbService.getDocument('users', application.userId);
                const userName = userData.success ? userData.data.displayName || userData.data.email : '알 수 없음';
                
                return `
                    <tr class="border-b">
                        <td class="py-2 text-sm">${courseName}</td>
                        <td class="py-2 text-sm text-gray-600">${userName}</td>
                        <td class="py-2 text-sm text-gray-600">${formatters.formatDate(application.createdAt?.toDate?.())}</td>
                    </tr>
                `;
            }));
            
            tbody.innerHTML = applicationRows.join('');
        } else {
            document.getElementById('recent-applications-tbody').innerHTML = `
                <tr>
                    <td colspan="3" class="py-4 text-center text-gray-500">최근 교육 신청이 없습니다.</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('최근 교육 신청 로드 오류:', error);
    }
}

/**
 * 최근 공지사항 로드
 */
async function loadRecentNotices() {
    try {
        const recentNotices = await dbService.getDocuments('board_notice', {
            orderBy: { field: 'createdAt', direction: 'desc' },
            limit: 5
        });
        
        if (recentNotices.success && recentNotices.data.length > 0) {
            const noticesList = document.getElementById('recent-notices');
            noticesList.innerHTML = recentNotices.data.map(notice => `
                <li class="flex items-center justify-between text-sm">
                    <a href="/pages/board/notice/view.html?id=${notice.id}" class="text-gray-800 hover:text-blue-600 truncate">
                        ${notice.title}
                    </a>
                    <span class="text-gray-500 ml-2 shrink-0">${formatters.formatDate(notice.createdAt?.toDate?.())}</span>
                </li>
            `).join('');
        } else {
            document.getElementById('recent-notices').innerHTML = '<li class="text-gray-500">최근 공지사항이 없습니다.</li>';
        }
    } catch (error) {
        console.error('최근 공지사항 로드 오류:', error);
    }
}

/**
 * 시스템 상태 업데이트
 */
function updateSystemStatus() {
    // Firebase 연결 상태
    if (window.dhcFirebase && window.dhcFirebase.auth && window.dhcFirebase.db) {
        document.getElementById('firebase-status').textContent = '정상';
        document.getElementById('firebase-status').className = 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full';
    } else {
        document.getElementById('firebase-status').textContent = '오류';
        document.getElementById('firebase-status').className = 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full';
    }
    
    // 서버 시간 표시
    const serverTime = new Date();
    document.getElementById('server-time').textContent = formatters.formatDateTime(serverTime);
    
    // 스토리지 사용량 계산 (예시)
    calculateStorageUsage();
}

/**
 * 스토리지 사용량 계산
 */
async function calculateStorageUsage() {
    try {
        // 실제로는 Firebase Storage API를 사용하여 계산해야 함
        // 여기서는 예시로 표시
        document.getElementById('storage-usage').textContent = '사용 중: 2.5GB / 5GB';
    } catch (error) {
        console.error('스토리지 사용량 계산 오류:', error);
        document.getElementById('storage-usage').textContent = '계산 실패';
    }
}

/**
 * 실시간 업데이트 설정
 */
function setupRealtimeUpdates() {
    // 실시간 사용자 수 업데이트
    const unsubscribeUsers = dbService.onCollectionChange('users', {}, (result) => {
        if (result.success) {
            document.getElementById('total-users').textContent = result.data.length;
            
            // 오늘 가입한 사용자 수 계산
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayUsers = result.data.filter(user => {
                const createdAt = user.createdAt?.toDate?.();
                return createdAt && createdAt >= today;
            });
            
            document.getElementById('today-users').textContent = todayUsers.length;
        }
    });
    
    // 페이지 언로드 시 리스너 해제
    window.addEventListener('beforeunload', () => {
        unsubscribeUsers();
    });
    
    // 실시간 서버 시간 업데이트
    setInterval(() => {
        const serverTime = new Date();
        document.getElementById('server-time').textContent = formatters.formatDateTime(serverTime);
    }, 1000);
}