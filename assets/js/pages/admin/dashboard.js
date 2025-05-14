/**
 * 관리자 대시보드 페이지 스크립트
 */

let dashboardInitialized = false;

// 대시보드 초기화 함수 (dashboard.html에서 호출)
async function initDashboard() {
    if (dashboardInitialized) {
        console.log('대시보드가 이미 초기화됨');
        return;
    }
    
    console.log('dashboard.js 초기화 시작');
    
    try {
        // Firebase 초기화 대기
        await waitForFirebase();
        
        // 관리자 권한 확인
        const hasAccess = await checkAdminAccess();
        if (!hasAccess) {
            return;
        }
        
        // 관리자 정보 표시
        displayAdminInfo();
        
        // 로그아웃 버튼 설정
        setupLogoutButton();
        
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
        
        dashboardInitialized = true;
        console.log('대시보드 초기화 완료');
        
    } catch (error) {
        console.error('대시보드 초기화 오류:', error);
        alert('대시보드 로드 중 오류가 발생했습니다.');
    }
}

// Firebase 초기화 대기
function waitForFirebase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        function check() {
            attempts++;
            console.log('Firebase 확인 시도:', attempts);
            
            if (window.dhcFirebase && window.dhcFirebase.getCurrentUser) {
                console.log('Firebase 준비됨');
                resolve();
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                console.error('Firebase 초기화 시간 초과');
                reject(new Error('Firebase 초기화 실패'));
            }
        }
        
        check();
    });
}

// 관리자 권한 확인
async function checkAdminAccess() {
    console.log('관리자 권한 확인 시작');
    
    try {
        const currentUser = window.dhcFirebase.getCurrentUser();
        console.log('현재 사용자:', currentUser);
        
        if (!currentUser || !currentUser.email) {
            console.log('로그인하지 않은 상태');
            alert('로그인이 필요합니다.');
            setTimeout(() => {
                window.location.href = '../auth/login.html';
            }, 1000);
            return false;
        }
        
        const adminEmails = ['admin@test.com', 'gostepexercise@gmail.com'];
        const isAdmin = adminEmails.includes(currentUser.email);
        console.log('관리자 권한 결과:', isAdmin);
        
        if (!isAdmin) {
            console.log('관리자 권한 없음');
            alert('관리자 권한이 필요합니다.');
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1000);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('권한 확인 오류:', error);
        return false;
    }
}

// 관리자 정보 표시
function displayAdminInfo() {
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
            
            console.log('관리자 정보 표시 완료');
        }
    } catch (error) {
        console.error('관리자 정보 표시 오류:', error);
    }
}

// 로그아웃 버튼 설정
function setupLogoutButton() {
    const logoutButton = document.getElementById('admin-logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (confirm('로그아웃 하시겠습니까?')) {
                try {
                    await window.dhcFirebase.auth.signOut();
                    console.log('로그아웃 성공');
                    alert('로그아웃 되었습니다.');
                    window.location.href = '../../index.html';
                } catch (error) {
                    console.error('로그아웃 오류:', error);
                    alert('로그아웃 중 오류가 발생했습니다.');
                }
            }
        });
    }
}

/**
 * 대시보드 통계 데이터 로드
 */
async function loadDashboardData() {
    console.log('대시보드 데이터 로드 시작');
    
    try {
        // 더미 데이터 사용 (dbService가 완전히 구현되지 않은 경우)
        if (!window.dbService || typeof window.dbService.countDocuments !== 'function') {
            console.log('dbService를 찾을 수 없음 - 더미 데이터 사용');
            displayDummyData();
            return;
        }
        
        // 실제 데이터베이스에서 데이터 로드
        try {
            // 전체 회원 수
            const usersCount = await window.dbService.countDocuments('users');
            if (usersCount.success) {
                updateElement('total-users', usersCount.count);
            }
            
            // 오늘 가입한 회원 수
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayUsers = await window.dbService.getDocuments('users', {
                where: [{ field: 'createdAt', operator: '>=', value: today }]
            });
            
            if (todayUsers.success) {
                updateElement('today-users', todayUsers.data.length);
            }
            
            // 진행 중인 교육 과정 수
            const activeCourses = await window.dbService.getDocuments('courses', {
                where: [{ field: 'status', operator: '==', value: 'active' }]
            });
            
            if (activeCourses.success) {
                updateElement('active-courses', activeCourses.data.length);
            }
            
            // 활성 자격증 수
            const activeCertificates = await window.dbService.getDocuments('certificates', {
                where: [{ field: 'status', operator: '==', value: 'active' }]
            });
            
            if (activeCertificates.success) {
                updateElement('active-certificates', activeCertificates.data.length);
            }
            
            // 이번 달 수익 계산
            await calculateMonthlyRevenue();
            
        } catch (dbError) {
            console.error('데이터베이스 접근 오류:', dbError);
            console.log('더미 데이터로 대체');
            displayDummyData();
        }
        
    } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
        displayDummyData();
    }
}

// 더미 데이터 표시
function displayDummyData() {
    const dummyData = {
        totalUsers: 150,
        todayUsers: 5,
        activeCourses: 12,
        activeCertificates: 84,
        monthlyRevenue: 15000000
    };
    
    updateElement('total-users', dummyData.totalUsers);
    updateElement('today-users', dummyData.todayUsers);
    updateElement('active-courses', dummyData.activeCourses);
    updateElement('active-certificates', dummyData.activeCertificates);
    updateElement('monthly-revenue', '₩' + dummyData.monthlyRevenue.toLocaleString());
}

// 요소 업데이트 헬퍼 함수
function updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = typeof value === 'number' ? value.toLocaleString() : value;
    } else {
        console.warn(`요소를 찾을 수 없음: ${elementId}`);
    }
}

/**
 * 최근 가입 회원 로드
 */
async function loadRecentUsers() {
    const tbody = document.getElementById('recent-users-tbody');
    if (!tbody) return;
    
    // 더미 데이터
    const dummyUsers = [
        { name: '홍길동', email: 'hong@example.com', date: '2025-05-13' },
        { name: '김영희', email: 'kim@example.com', date: '2025-05-12' },
        { name: '박철수', email: 'park@example.com', date: '2025-05-11' }
    ];
    
    const html = dummyUsers.map(user => `
        <tr class="border-b">
            <td class="py-2">${user.name}</td>
            <td class="py-2">${user.email}</td>
            <td class="py-2">${user.date}</td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
}

/**
 * 최근 교육 신청 로드
 */
async function loadRecentApplications() {
    const tbody = document.getElementById('recent-applications-tbody');
    if (!tbody) return;
    
    // 더미 데이터
    const dummyApplications = [
        { course: '건강운동처방사', applicant: '이미영', date: '2025-05-13' },
        { course: '운동재활전문가', applicant: '정현우', date: '2025-05-12' },
        { course: '필라테스 전문가', applicant: '최서연', date: '2025-05-11' }
    ];
    
    const html = dummyApplications.map(app => `
        <tr class="border-b">
            <td class="py-2">${app.course}</td>
            <td class="py-2">${app.applicant}</td>
            <td class="py-2">${app.date}</td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
}

/**
 * 최근 공지사항 로드
 */
async function loadRecentNotices() {
    const noticesList = document.getElementById('recent-notices');
    if (!noticesList) return;
    
    // 더미 데이터
    const dummyNotices = [
        { title: '5월 건강운동처방사 시험 일정 안내', date: '2025-05-13' },
        { title: '온라인 교육 시스템 업데이트 공지', date: '2025-05-12' },
        { title: '자격증 갱신 절차 변경 안내', date: '2025-05-11' }
    ];
    
    const html = dummyNotices.map(notice => `
        <li class="border-b pb-2 last:border-b-0">
            <div class="flex justify-between items-start">
                <span class="text-gray-800 text-sm">${notice.title}</span>
                <span class="text-gray-500 text-xs ml-4">${notice.date}</span>
            </div>
        </li>
    `).join('');
    
    noticesList.innerHTML = html;
}

/**
 * 시스템 상태 업데이트
 */
function updateSystemStatus() {
    // Firebase 연결 상태
    const firebaseStatus = document.getElementById('firebase-status');
    if (firebaseStatus) {
        if (window.dhcFirebase && window.dhcFirebase.auth && window.dhcFirebase.db) {
            firebaseStatus.textContent = '정상';
            firebaseStatus.className = 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full';
        } else {
            firebaseStatus.textContent = '오류';
            firebaseStatus.className = 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full';
        }
    }
    
    // 서버 시간 표시
    updateServerTime();
    
    // 스토리지 사용량 표시
    const storageUsage = document.getElementById('storage-usage');
    if (storageUsage) {
        storageUsage.textContent = '사용 중: 2.5GB / 5GB';
    }
}

/**
 * 실시간 업데이트 설정
 */
function setupRealtimeUpdates() {
    // 실시간 서버 시간 업데이트
    setInterval(updateServerTime, 1000);
}

// 서버 시간 업데이트
function updateServerTime() {
    const serverTime = document.getElementById('server-time');
    if (serverTime) {
        const now = new Date();
        serverTime.textContent = now.toLocaleString('ko-KR');
    }
}

/**
 * 이번 달 수익 계산
 */
async function calculateMonthlyRevenue() {
    // 더미 데이터로 대체
    const monthlyRevenue = 15000000;
    updateElement('monthly-revenue', '₩' + monthlyRevenue.toLocaleString());
}

// 전역 스코프에 함수 노출
window.initDashboard = initDashboard;