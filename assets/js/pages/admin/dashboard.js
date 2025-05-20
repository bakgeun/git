/**
 * 관리자 대시보드 페이지 스크립트 (수정 버전)
 */

let dashboardInitialized = false;
let authStateListener = null;

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
        
        // 인증 상태 감지 및 초기화
        await initializeWithAuth();
        
        console.log('대시보드 초기화 완료');
        
    } catch (error) {
        console.error('대시보드 초기화 오류:', error);
        showErrorMessage('대시보드 로드 중 오류가 발생했습니다.');
    }
}

// Firebase 초기화 대기 (개선된 버전)
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 시도 횟수 증가
        
        function check() {
            attempts++;
            console.log('Firebase 확인 시도:', attempts);
            
            if (window.dhcFirebase && 
                window.dhcFirebase.getCurrentUser && 
                window.dhcFirebase.onAuthStateChanged &&
                window.dhcFirebase.auth) {
                console.log('Firebase 준비됨');
                resolve();
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(check, 50); // 체크 간격 단축
            } else {
                console.error('Firebase 초기화 시간 초과');
                reject(new Error('Firebase 초기화 실패'));
            }
        }
        
        check();
    });
}

// 인증 상태를 기반으로 한 초기화
function initializeWithAuth() {
    return new Promise((resolve, reject) => {
        console.log('인증 상태 감지 시작');
        
        // 현재 인증 상태 확인
        const currentUser = window.dhcFirebase.getCurrentUser();
        console.log('초기 인증 상태:', currentUser ? `${currentUser.email} 로그인됨` : '로그인하지 않음');
        
        // 인증 상태 변화 감지 리스너 설정
        authStateListener = window.dhcFirebase.onAuthStateChanged(async (user) => {
            console.log('인증 상태 변화 감지:', user ? `${user.email} 로그인됨` : '로그아웃됨');
            
            try {
                if (user) {
                    // 사용자가 로그인된 경우
                    const hasAccess = await checkAdminAccess(user);
                    if (hasAccess) {
                        await initializeDashboard(user);
                        resolve();
                    } else {
                        reject(new Error('관리자 권한 없음'));
                    }
                } else {
                    // 사용자가 로그인하지 않은 경우
                    console.log('로그인하지 않은 상태 감지');
                    redirectToLogin();
                    reject(new Error('로그인 필요'));
                }
            } catch (error) {
                console.error('인증 상태 처리 오류:', error);
                reject(error);
            }
        });
    });
}

// 관리자 권한 확인 (개선된 버전)
async function checkAdminAccess(user = null) {
    console.log('관리자 권한 확인 시작');
    
    try {
        // 사용자 파라미터가 없으면 현재 사용자 확인
        const currentUser = user || window.dhcFirebase.getCurrentUser();
        
        if (!currentUser || !currentUser.email) {
            console.log('로그인하지 않은 상태');
            return false;
        }
        
        console.log('현재 사용자:', currentUser.email);
        
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

// 로그인 페이지로 리다이렉트
function redirectToLogin() {
    console.log('로그인 페이지로 리다이렉트');
    alert('로그인이 필요합니다.');
    setTimeout(() => {
        window.location.href = '../auth/login.html';
    }, 1000);
}

// 대시보드 초기화 (인증된 사용자)
async function initializeDashboard(user) {
    if (dashboardInitialized) {
        return;
    }
    
    console.log('인증된 사용자로 대시보드 초기화:', user.email);
    
    try {
        // 관리자 정보 표시
        displayAdminInfo(user);
        
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
        showErrorMessage('대시보드 로드 중 오류가 발생했습니다.');
    }
}

// 관리자 정보 표시 (개선된 버전)
function displayAdminInfo(user = null) {
    try {
        const currentUser = user || window.dhcFirebase.getCurrentUser();
        
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
        // 기존 이벤트 리스너 제거
        logoutButton.removeEventListener('click', handleLogout);
        // 새 이벤트 리스너 추가
        logoutButton.addEventListener('click', handleLogout);
    }
}

// 로그아웃 처리
async function handleLogout(e) {
    e.preventDefault();
    
    if (confirm('로그아웃 하시겠습니까?')) {
        try {
            // 인증 상태 리스너 제거
            if (authStateListener) {
                authStateListener();
            }
            
            // 로그아웃 실행
            await window.dhcFirebase.auth.signOut();
            console.log('로그아웃 성공');
            alert('로그아웃 되었습니다.');
            window.location.href = '../../index.html';
        } catch (error) {
            console.error('로그아웃 오류:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        }
    }
}

// 오류 메시지 표시
function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
    notification.innerHTML = `
        <div class="flex">
            <div class="flex-1">
                <strong class="font-bold">오류!</strong>
                <span class="block sm:inline">${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4">
                <span class="sr-only">닫기</span>
                ×
            </button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * 대시보드 통계 데이터 로드 (기존 코드 유지)
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
 * 최근 가입 회원 로드 (기존 코드 유지)
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
 * 최근 교육 신청 로드 (기존 코드 유지)
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
 * 최근 공지사항 로드 (기존 코드 유지)
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
 * 시스템 상태 업데이트 (기존 코드 유지)
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
 * 실시간 업데이트 설정 (기존 코드 유지)
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
 * 이번 달 수익 계산 (기존 코드 유지)
 */
async function calculateMonthlyRevenue() {
    // 더미 데이터로 대체
    const monthlyRevenue = 15000000;
    updateElement('monthly-revenue', '₩' + monthlyRevenue.toLocaleString());
}

// 전역 스코프에 함수 노출
window.initDashboard = initDashboard;