/**
 * user-management.js - 완전한 통합 유틸리티 시스템 적용 버전 (수정)
 * 회원 관리 페이지의 모든 기능을 포함합니다.
 */

console.log('=== 완전한 표준화된 user-management.js 파일 로드됨 ===');

// =================================
// 전역 변수 선언 (🔧 호이스팅 문제 해결 - 최상단으로 이동)
// =================================

let userManagementInitialized = false;
let authStateListener = null;

// =================================
// 의존성 체크 시스템
// =================================

function checkDependencies() {
    const requiredUtils = [
        { name: 'window.formatters', path: 'formatters.js' },
        { name: 'window.dateUtils', path: 'date-utils.js' }
        // admin.js와 admin-auth.js는 선택적 의존성
    ];
    
    const missing = [];
    
    requiredUtils.forEach(util => {
        if (!eval(util.name)) {
            missing.push(util);
        }
    });
    
    if (missing.length > 0) {
        console.error('⚠️ 필수 유틸리티가 로드되지 않음:', missing.map(m => m.path));
        console.log('📝 HTML에서 다음 스크립트들이 먼저 로드되어야 합니다:');
        missing.forEach(m => {
            console.log(`   <script src="{basePath}assets/js/utils/${m.path}"></script>`);
        });
        return false;
    }
    
    console.log('✅ 모든 필수 유틸리티 로드 확인됨');
    
    // 🔧 추가: 유틸리티 함수들이 실제로 작동하는지 테스트
    try {
        const testDate = new Date();
        const testFormatDate = window.formatters.formatDate(testDate, 'YYYY.MM.DD');
        const testFormatNumber = window.formatters.formatNumber(1500);
        
        console.log('✅ formatters.formatDate 테스트 성공:', testFormatDate);
        console.log('✅ formatters.formatNumber 테스트 성공:', testFormatNumber);
        
        if (!testFormatDate || !testFormatNumber) {
            throw new Error('포맷터 함수 결과가 유효하지 않습니다.');
        }
        
    } catch (error) {
        console.error('❌ 유틸리티 함수 테스트 실패:', error);
        return false;
    }
    
    return true;
}

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== 회원 관리 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initUserManagementPage();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initUserManagementPage();
    }
}

// 초기화 시작
initializeWhenReady();

// 🔧 의존성 오류 표시 함수
function showDependencyError() {
    const mainContent = document.querySelector('.admin-content');
    
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div class="text-red-600 text-lg font-semibold mb-2">⚠️ 시스템 오류</div>
                <p class="text-red-700 mb-4">필수 유틸리티 파일이 로드되지 않았습니다.</p>
                <p class="text-red-600 text-sm">페이지를 새로고침하거나 관리자에게 문의하세요.</p>
                <button onclick="location.reload()" class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    페이지 새로고침
                </button>
            </div>
        `;
    }
}

// =================================
// 메인 초기화 함수 (🔧 변수 선언 이후로 이동)
// =================================

/**
 * 회원 관리 페이지 초기화 함수
 */
async function initUserManagementPage() {
    if (userManagementInitialized) {
        console.log('⚠️ 회원 관리가 이미 초기화됨 - 중복 방지');
        return;
    }
    
    console.log('=== initUserManagementPage 실행 시작 ===');
    
    try {
        // 🔧 의존성 체크 먼저 실행
        if (!checkDependencies()) {
            console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
            showDependencyError();
            return;
        }

        // Firebase 초기화 대기
        await waitForFirebase();
        
        // 인증 상태 감지 및 초기화
        await initializeWithAuth();
        
        console.log('=== initUserManagementPage 완료 ===');
        
    } catch (error) {
        console.error('❌ 회원 관리 초기화 오류:', error);
        showErrorMessage('회원 관리 페이지 로드 중 오류가 발생했습니다.');
    }
}

// =================================
// Firebase 및 인증 관련 함수들
// =================================

/**
 * Firebase 초기화 대기
 */
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100;
        
        function check() {
            attempts++;
            console.log('Firebase 확인 시도:', attempts);
            
            if (window.dhcFirebase && 
                window.dhcFirebase.getCurrentUser && 
                window.dhcFirebase.onAuthStateChanged &&
                window.dhcFirebase.auth) {
                console.log('✅ Firebase 준비됨');
                resolve();
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(check, 50);
            } else {
                console.error('❌ Firebase 초기화 시간 초과');
                reject(new Error('Firebase 초기화 실패'));
            }
        }
        
        check();
    });
}

/**
 * 인증 상태를 기반으로 한 초기화
 */
function initializeWithAuth() {
    return new Promise((resolve, reject) => {
        console.log('인증 상태 감지 시작');
        
        // 현재 인증 상태 확인
        const currentUser = window.dhcFirebase.getCurrentUser();
        console.log('초기 인증 상태:', currentUser ? `${currentUser.email} 로그인됨` : '로그인하지 않음');
        
        // 🔧 기존 리스너 제거 (중복 방지)
        if (authStateListener) {
            console.log('⚠️ 기존 인증 리스너 제거');
            authStateListener();
            authStateListener = null;
        }
        
        // 인증 상태 변화 감지 리스너 설정
        authStateListener = window.dhcFirebase.onAuthStateChanged(async (user) => {
            console.log('인증 상태 변화 감지:', user ? `${user.email} 로그인됨` : '로그아웃됨');
            
            try {
                if (user) {
                    // 사용자가 로그인된 경우
                    const hasAccess = await checkAdminAccess(user);
                    if (hasAccess) {
                        await initializeUserManagement(user);
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

/**
 * 관리자 권한 확인
 */
async function checkAdminAccess(user = null) {
    console.log('관리자 권한 확인 시작');
    
    try {
        // adminAuth 유틸리티 사용
        if (window.adminAuth && typeof window.adminAuth.isAdmin === 'function') {
            const isAdmin = window.adminAuth.isAdmin();
            console.log('adminAuth를 통한 권한 확인 결과:', isAdmin);
            
            if (!isAdmin) {
                console.log('관리자 권한 없음');
                showErrorMessage('관리자 권한이 필요합니다.');
                setTimeout(() => {
                    window.location.href = window.adjustPath ? window.adjustPath('index.html') : '../../index.html';
                }, 2000);
                return false;
            }
            
            return true;
        }
        
        // adminAuth가 없는 경우 기본 체크
        const currentUser = user || window.dhcFirebase.getCurrentUser();
        
        if (!currentUser || !currentUser.email) {
            console.log('로그인하지 않은 상태');
            return false;
        }
        
        console.log('현재 사용자:', currentUser.email);
        
        const adminEmails = ['admin@test.com', 'gostepexercise@gmail.com'];
        const isAdmin = adminEmails.includes(currentUser.email);
        console.log('기본 권한 확인 결과:', isAdmin);
        
        if (!isAdmin) {
            console.log('관리자 권한 없음');
            showErrorMessage('관리자 권한이 필요합니다.');
            setTimeout(() => {
                window.location.href = window.adjustPath ? window.adjustPath('index.html') : '../../index.html';
            }, 2000);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('권한 확인 오류:', error);
        return false;
    }
}

/**
 * 로그인 페이지로 리다이렉트
 */
function redirectToLogin() {
    console.log('로그인 페이지로 리다이렉트');
    showErrorMessage('로그인이 필요합니다.');
    setTimeout(() => {
        const loginPath = window.adjustPath ? window.adjustPath('pages/auth/login.html') : '../auth/login.html';
        window.location.href = loginPath;
    }, 2000);
}

// =================================
// 회원 관리 초기화 및 기능
// =================================

/**
 * 회원 관리 초기화 (인증된 사용자)
 */
async function initializeUserManagement(user) {
    if (userManagementInitialized) {
        console.log('⚠️ 회원 관리가 이미 초기화됨 - 중복 방지');
        return;
    }
    
    console.log('✅ 인증된 사용자로 회원 관리 초기화:', user.email);
    
    try {
        // 기본 UI 기능들
        initBasicUI();
        
        // 관리자 정보 표시
        displayAdminInfo(user);
        
        // 로그아웃 버튼 설정
        setupLogoutButton();
        
        // 회원 관리자 초기화
        await window.userManager.init();
        
        userManagementInitialized = true;
        console.log('✅ 회원 관리 초기화 완료');
        
    } catch (error) {
        console.error('❌ 회원 관리 초기화 오류:', error);
        showErrorMessage('회원 관리 페이지 로드 중 오류가 발생했습니다.');
    }
}

/**
 * 기본 UI 기능 초기화
 */
function initBasicUI() {
    console.log('🎨 기본 UI 기능 초기화');
    
    // 관리자 페이지 공통 기능 초기화 (중복 방지)
    if (window.adminUtils && typeof window.adminUtils.initAdminPage === 'function') {
        // admin.js에서 이미 초기화했는지 확인
        if (!window.adminUtilsInitialized) {
            window.adminUtils.initAdminPage();
        } else {
            console.log('⚠️ adminUtils가 이미 초기화됨 - 중복 방지');
        }
    }
}

/**
 * 관리자 정보 표시
 */
function displayAdminInfo(user = null) {
    try {
        const currentUser = user || window.dhcFirebase.getCurrentUser();
        
        if (currentUser) {
            const adminNameElement = document.getElementById('admin-name');
            const adminEmailElement = document.getElementById('admin-email');
            
            // 🔧 전역 유틸리티 사용
            const displayName = currentUser.displayName || '관리자';
            const email = currentUser.email;
            
            if (adminNameElement) {
                adminNameElement.textContent = displayName;
            }
            
            if (adminEmailElement) {
                adminEmailElement.textContent = email;
            }
            
            // 사이드바 사용자 정보도 업데이트
            const sidebarUserInfo = document.querySelector('.sidebar-user-info');
            if (sidebarUserInfo) {
                const nameElement = sidebarUserInfo.querySelector('.font-bold');
                const emailElement = sidebarUserInfo.querySelector('.text-indigo-200');
                
                if (nameElement) nameElement.textContent = displayName;
                if (emailElement) emailElement.textContent = email;
            }
            
            // adminAuth 유틸리티도 함께 호출
            if (window.adminAuth && typeof window.adminAuth.displayAdminInfo === 'function') {
                window.adminAuth.displayAdminInfo();
            }
            
            console.log('✅ 관리자 정보 표시 완료');
        }
    } catch (error) {
        console.error('❌ 관리자 정보 표시 오류:', error);
    }
}

/**
 * 로그아웃 버튼 설정 (🔧 중복 방지)
 */
function setupLogoutButton() {
    const logoutButton = document.getElementById('admin-logout-button');
    if (logoutButton && !logoutButton.dataset.eventAttached) {
        logoutButton.addEventListener('click', handleLogout);
        logoutButton.dataset.eventAttached = 'true';
    }
    
    const sidebarLogoutButton = document.getElementById('sidebar-logout-button');
    if (sidebarLogoutButton && !sidebarLogoutButton.dataset.eventAttached) {
        sidebarLogoutButton.addEventListener('click', handleLogout);
        sidebarLogoutButton.dataset.eventAttached = 'true';
    }
}

/**
 * 로그아웃 처리
 */
async function handleLogout(e) {
    e.preventDefault();
    
    if (confirm('로그아웃 하시겠습니까?')) {
        try {
            // 인증 상태 리스너 제거
            if (authStateListener) {
                authStateListener();
                authStateListener = null;
            }
            
            if (window.adminAuth && typeof window.adminAuth.handleLogout === 'function') {
                await window.adminAuth.handleLogout(e);
                return;
            }
            
            await window.dhcFirebase.auth.signOut();
            console.log('✅ 로그아웃 성공');
            showSuccessMessage('로그아웃 되었습니다.');
            
            setTimeout(() => {
                const indexPath = window.adjustPath ? window.adjustPath('index.html') : '../../index.html';
                window.location.href = indexPath;
            }, 1000);
        } catch (error) {
            console.error('❌ 로그아웃 오류:', error);
            showErrorMessage('로그아웃 중 오류가 발생했습니다.');
        }
    }
}

// =================================
// 회원 관리 객체 (기존 기능 유지)
// =================================

window.userManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    pendingRoleChange: null,
    pendingStatusChange: null,
    currentUsers: [],
    
    /**
     * 초기화 함수
     */
    init: async function() {
        try {
            console.log('회원 관리자 초기화 시작');
            
            // 관리자 정보 표시
            if (window.adminAuth && typeof window.adminAuth.displayAdminInfo === 'function') {
                await window.adminAuth.displayAdminInfo();
            }
            
            // 이벤트 리스너 등록
            this.registerEventListeners();
            
            // 회원 목록 로드
            await this.loadUsers();
            
            // 통계 정보 업데이트
            await this.updateUserStats();
            
            console.log('회원 관리자 초기화 완료');
            return true;
        } catch (error) {
            console.error('회원 관리자 초기화 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('초기화 중 오류가 발생했습니다.', 'error');
            }
            return false;
        }
    },
    
    /**
     * 이벤트 리스너 등록
     */
    registerEventListeners: function() {
        console.log('이벤트 리스너 등록 시작');
        
        const searchButton = document.getElementById('search-button');
        if (searchButton) {
            searchButton.addEventListener('click', this.applyFilters.bind(this));
        }
        
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', this.resetFilters.bind(this));
        }
        
        const closeModalButton = document.getElementById('close-modal');
        const cancelButton = document.getElementById('cancel-button');
        if (closeModalButton) {
            closeModalButton.addEventListener('click', this.closeUserModal.bind(this));
        }
        if (cancelButton) {
            cancelButton.addEventListener('click', this.closeUserModal.bind(this));
        }
        
        const userForm = document.getElementById('user-form');
        if (userForm) {
            userForm.addEventListener('submit', this.handleEditUser.bind(this));
        }
        
        const searchKeyword = document.getElementById('search-keyword');
        if (searchKeyword) {
            searchKeyword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        }
        
        console.log('이벤트 리스너 등록 완료');
    },
    
    /**
     * Firebase 사용 가능 여부 확인
     */
    isFirebaseAvailable: function() {
        try {
            return window.dhcFirebase && 
                   window.dhcFirebase.db && 
                   window.dbService && 
                   window.dhcFirebase.auth &&
                   window.dhcFirebase.auth.currentUser;
        } catch (error) {
            console.log('Firebase 가용성 확인 오류:', error);
            return false;
        }
    },
    
    /**
     * 회원 통계 업데이트
     */
    updateUserStats: async function() {
        try {
            let totalUsers = 0;
            let activeUsers = 0;
            let instructorUsers = 0;
            let suspendedUsers = 0;
            
            if (this.isFirebaseAvailable()) {
                try {
                    const totalResult = await window.dbService.countDocuments('users');
                    if (totalResult.success) {
                        totalUsers = totalResult.count;
                    }
                    
                    const activeResult = await window.dbService.countDocuments('users', {
                        where: [{ field: 'status', operator: '==', value: 'active' }]
                    });
                    if (activeResult.success) {
                        activeUsers = activeResult.count;
                    }
                    
                    const instructorResult = await window.dbService.countDocuments('users', {
                        where: [{ field: 'userType', operator: '==', value: 'instructor' }]
                    });
                    if (instructorResult.success) {
                        instructorUsers = instructorResult.count;
                    }
                    
                    const suspendedResult = await window.dbService.countDocuments('users', {
                        where: [{ field: 'status', operator: '==', value: 'suspended' }]
                    });
                    if (suspendedResult.success) {
                        suspendedUsers = suspendedResult.count;
                    }
                } catch (error) {
                    console.error('Firebase 통계 조회 오류:', error);
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('통계 조회 중 오류가 발생했습니다.', 'error');
                    }
                }
            }
            
            // UI 업데이트 (🔧 전역 유틸리티 사용)
            this.updateStatElement('total-users-count', totalUsers);
            this.updateStatElement('active-users-count', activeUsers);
            this.updateStatElement('instructor-users-count', instructorUsers);
            this.updateStatElement('suspended-users-count', suspendedUsers);
            
            console.log('통계 업데이트 완료:', { totalUsers, activeUsers, instructorUsers, suspendedUsers });
            
        } catch (error) {
            console.error('회원 통계 업데이트 오류:', error);
        }
    },
    
    /**
     * 통계 요소 업데이트 (🔧 전역 유틸리티 사용)
     */
    updateStatElement: function(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            const formattedValue = window.formatters.formatNumber(value);
            element.textContent = formattedValue;
        }
    },
    
    /**
     * 회원 목록 로드
     */
    loadUsers: async function() {
        console.log('회원 목록 로드 시작');
        
        document.getElementById('user-list').innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    데이터를 불러오는 중입니다...
                </td>
            </tr>
        `;
        
        try {
            let users = [];
            
            if (this.isFirebaseAvailable()) {
                const options = {
                    orderBy: { field: 'createdAt', direction: 'desc' },
                    pageSize: this.pageSize
                };
                
                const userType = document.getElementById('filter-role')?.value;
                const status = document.getElementById('filter-status')?.value;
                const searchKeyword = document.getElementById('search-keyword')?.value;
                
                if (userType) {
                    options.where = options.where || [];
                    options.where.push({ field: 'userType', operator: '==', value: userType });
                }
                
                if (status) {
                    options.where = options.where || [];
                    options.where.push({ field: 'status', operator: '==', value: status });
                }
                
                if (searchKeyword) {
                    try {
                        const nameResults = await window.dbService.searchDocuments('users', 'displayName', searchKeyword, options);
                        const emailResults = await window.dbService.searchDocuments('users', 'email', searchKeyword, options);
                        
                        const allResults = [...(nameResults.data || []), ...(emailResults.data || [])];
                        const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
                        users = uniqueResults;
                    } catch (error) {
                        console.error('검색 오류:', error);
                        if (window.adminAuth && window.adminAuth.showNotification) {
                            window.adminAuth.showNotification('검색 중 오류가 발생했습니다.', 'error');
                        }
                    }
                } else {
                    try {
                        const result = await window.dbService.getPaginatedDocuments('users', options, this.currentPage > 1 ? this.lastDoc : null);
                        if (result.success) {
                            users = result.data;
                            this.lastDoc = result.lastDoc;
                            
                            const countResult = await window.dbService.countDocuments('users', { where: options.where });
                            if (countResult.success) {
                                const totalPages = Math.ceil(countResult.count / this.pageSize);
                                this.updatePagination(totalPages);
                            }
                        }
                    } catch (error) {
                        console.error('사용자 목록 조회 오류:', error);
                        if (window.adminAuth && window.adminAuth.showNotification) {
                            window.adminAuth.showNotification('사용자 목록 로드 중 오류가 발생했습니다.', 'error');
                        }
                    }
                }
            } else {
                console.log('Firebase를 사용할 수 없습니다.');
                document.getElementById('user-list').innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                            데이터베이스에 연결할 수 없습니다.
                        </td>
                    </tr>
                `;
                return;
            }
            
            this.currentUsers = users;
            console.log('로드된 사용자 수:', this.currentUsers.length);
            
            this.updateUserList(users);
            
        } catch (error) {
            console.error('회원 목록 로드 오류:', error);
            document.getElementById('user-list').innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-red-500">
                        데이터 로드 중 오류가 발생했습니다.
                    </td>
                </tr>
            `;
        }
    },
    
    /**
     * 사용자 목록 업데이트
     */
    updateUserList: function(users) {
        const userList = document.getElementById('user-list');
        
        if (!users || users.length === 0) {
            userList.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        등록된 회원이 없습니다.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        users.forEach((user, index) => {
            // 🔧 전역 유틸리티 사용
            const createdAt = user.createdAt ? 
                (typeof user.createdAt.toDate === 'function' ? 
                    window.formatters.formatDate(user.createdAt.toDate()) : 
                    user.createdAt) : 
                '-';
            
            const isAdmin = user.userType === 'admin';
            const canEdit = !isAdmin;
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${index + 1 + ((this.currentPage - 1) * this.pageSize)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="text-sm font-medium text-gray-900">${user.displayName || '미설정'}</div>
                            ${isAdmin ? '<span class="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">관리자</span>' : ''}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${user.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <span class="text-sm text-gray-900">${this.getUserTypeName(user.userType)}</span>
                            ${canEdit ? `
                                <button onclick="userManager.quickRoleChange('${user.id}', '${user.userType}')" 
                                    class="ml-2 text-xs text-indigo-600 hover:text-indigo-900 underline">
                                    변경
                                </button>
                            ` : ''}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${this.getStatusBadgeClass(user.status)}">
                                ${this.getStatusName(user.status)}
                            </span>
                            ${canEdit ? `
                                <button onclick="userManager.quickStatusChange('${user.id}', '${user.status}')" 
                                    class="ml-2 text-xs text-indigo-600 hover:text-indigo-900 underline">
                                    변경
                                </button>
                            ` : ''}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${createdAt}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${canEdit ? `
                            <button onclick="userManager.editUser('${user.id}')" 
                                class="text-indigo-600 hover:text-indigo-900 mr-3">
                                수정
                            </button>
                            <button onclick="userManager.deleteUser('${user.id}')" 
                                class="text-red-600 hover:text-red-900">
                                삭제
                            </button>
                        ` : `
                            <span class="text-gray-400">편집 불가</span>
                        `}
                    </td>
                </tr>
            `;
        });
        
        userList.innerHTML = html;
    },
    
    /**
     * 상태별 배지 클래스 반환
     */
    getStatusBadgeClass: function(status) {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    },
    
    /**
     * 빠른 권한 변경
     */
    quickRoleChange: async function(userId, currentRole) {
        console.log('빠른 권한 변경 시도:', userId, currentRole);
        
        const user = await this.getUserById(userId);
        if (!user) {
            console.error('사용자를 찾을 수 없음:', userId);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('사용자 정보를 찾을 수 없습니다.', 'error');
            }
            return;
        }
        
        const nextRole = currentRole === 'student' ? 'instructor' : 'student';
        
        this.pendingRoleChange = {
            userId: userId,
            newRole: nextRole,
            userName: user.displayName || user.email
        };
        
        const message = `"${user.displayName || user.email}" 사용자의 권한을 "${this.getUserTypeName(nextRole)}"으로 변경하시겠습니까?`;
        document.getElementById('role-change-message').textContent = message;
        document.getElementById('role-change-modal').classList.remove('hidden');
    },
    
    /**
     * 빠른 상태 변경
     */
    quickStatusChange: async function(userId, currentStatus) {
        console.log('빠른 상태 변경 시도:', userId, currentStatus);
        
        const user = await this.getUserById(userId);
        if (!user) {
            console.error('사용자를 찾을 수 없음:', userId);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('사용자 정보를 찾을 수 없습니다.', 'error');
            }
            return;
        }
        
        let nextStatus;
        switch (currentStatus) {
            case 'active': nextStatus = 'inactive'; break;
            case 'inactive': nextStatus = 'suspended'; break;
            case 'suspended': nextStatus = 'active'; break;
            default: nextStatus = 'active';
        }
        
        this.pendingStatusChange = {
            userId: userId,
            newStatus: nextStatus,
            userName: user.displayName || user.email
        };
        
        const message = `"${user.displayName || user.email}" 사용자의 상태를 "${this.getStatusName(nextStatus)}"으로 변경하시겠습니까?`;
        document.getElementById('status-change-message').textContent = message;
        document.getElementById('status-change-modal').classList.remove('hidden');
    },
    
    /**
     * 사용자 ID로 사용자 정보 가져오기
     */
    getUserById: async function(userId) {
        console.log('사용자 조회 시도:', userId);
        
        if (this.currentUsers && this.currentUsers.length > 0) {
            const cachedUser = this.currentUsers.find(u => u.id === userId);
            if (cachedUser) {
                console.log('캐시된 사용자 목록에서 찾음:', cachedUser);
                return cachedUser;
            }
        }
        
        if (this.isFirebaseAvailable()) {
            try {
                console.log('Firebase에서 검색 시도:', userId);
                const result = await window.dbService.getDocument('users', userId);
                if (result.success) {
                    console.log('Firebase에서 사용자 찾음:', result.data);
                    return result.data;
                } else {
                    console.log('Firebase에서 사용자 조회 실패:', result.error);
                }
            } catch (error) {
                console.error('Firebase 사용자 조회 오류:', error);
            }
        }
        
        console.error('사용자를 찾을 수 없음:', userId);
        return null;
    },
    
    /**
     * 권한 변경 확인
     */
    confirmRoleChange: async function() {
        if (!this.pendingRoleChange) return;
        
        try {
            const { userId, newRole } = this.pendingRoleChange;
            console.log('권한 변경 확인:', userId, newRole);
            
            if (this.isFirebaseAvailable()) {
                const result = await window.dbService.updateDocument('users', userId, {
                    userType: newRole
                });
                
                if (result.success) {
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('권한이 성공적으로 변경되었습니다.', 'success');
                    }
                    this.loadUsers();
                    this.updateUserStats();
                } else {
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('권한 변경에 실패했습니다.', 'error');
                    }
                }
            } else {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('데이터베이스에 연결할 수 없습니다.', 'error');
                }
            }
        } catch (error) {
            console.error('권한 변경 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('권한 변경 중 오류가 발생했습니다.', 'error');
            }
        }
        
        this.closeRoleChangeModal();
    },
    
    /**
     * 상태 변경 확인
     */
    confirmStatusChange: async function() {
        if (!this.pendingStatusChange) return;
        
        try {
            const { userId, newStatus } = this.pendingStatusChange;
            console.log('상태 변경 확인:', userId, newStatus);
            
            if (this.isFirebaseAvailable()) {
                const result = await window.dbService.updateDocument('users', userId, {
                    status: newStatus
                });
                
                if (result.success) {
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('상태가 성공적으로 변경되었습니다.', 'success');
                    }
                    this.loadUsers();
                    this.updateUserStats();
                } else {
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('상태 변경에 실패했습니다.', 'error');
                    }
                }
            } else {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('데이터베이스에 연결할 수 없습니다.', 'error');
                }
            }
        } catch (error) {
            console.error('상태 변경 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('상태 변경 중 오류가 발생했습니다.', 'error');
            }
        }
        
        this.closeStatusChangeModal();
    },
    
    /**
     * 권한 변경 모달 닫기
     */
    closeRoleChangeModal: function() {
        document.getElementById('role-change-modal').classList.add('hidden');
        this.pendingRoleChange = null;
    },
    
    /**
     * 상태 변경 모달 닫기
     */
    closeStatusChangeModal: function() {
        document.getElementById('status-change-modal').classList.add('hidden');
        this.pendingStatusChange = null;
    },
    
    /**
     * 페이지네이션 업데이트
     */
    updatePagination: function(totalPages) {
        const paginationContainer = document.getElementById('pagination-container');
        
        if (!paginationContainer) return;
        
        let html = '';
        
        if (totalPages > 1) {
            html = '<div class="flex space-x-1">';
            
            html += `
                <button onclick="userManager.changePage(${this.currentPage - 1})" 
                    class="px-4 py-2 border rounded-md text-sm 
                    ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                    이전
                </button>
            `;
            
            const maxVisiblePages = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `
                    <button onclick="userManager.changePage(${i})" 
                        class="px-4 py-2 border rounded-md text-sm 
                        ${this.currentPage === i ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'}">
                        ${i}
                    </button>
                `;
            }
            
            html += `
                <button onclick="userManager.changePage(${this.currentPage + 1})" 
                    class="px-4 py-2 border rounded-md text-sm 
                    ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                    다음
                </button>
            `;
            
            html += '</div>';
        }
        
        paginationContainer.innerHTML = html;
    },
    
    /**
     * 페이지 변경
     */
    changePage: function(page) {
        if (page < 1) return;
        
        this.currentPage = page;
        this.loadUsers();
    },
    
    /**
     * 사용자 유형 이름 가져오기
     */
    getUserTypeName: function(userType) {
        switch (userType) {
            case 'admin': return '관리자';
            case 'student': return '수강생';
            case 'instructor': return '강사';
            case 'user': return '일반 회원';
            default: return userType || '일반 회원';
        }
    },
    
    /**
     * 상태 이름 가져오기
     */
    getStatusName: function(status) {
        switch (status) {
            case 'active': return '활성';
            case 'inactive': return '비활성';
            case 'suspended': return '정지';
            default: return status || '활성';
        }
    },
    
    /**
     * 회원 수정 모달 표시
     */
    editUser: async function(userId) {
        console.log('회원 수정 모달 표시:', userId);
        
        try {
            const modal = document.getElementById('user-modal');
            const form = document.getElementById('user-form');
            
            if (!modal || !form) {
                console.error('모달 또는 폼을 찾을 수 없습니다.');
                return;
            }
            
            form.reset();
            
            const user = await this.getUserById(userId);
            if (!user) {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('사용자 정보를 불러올 수 없습니다.', 'error');
                }
                return;
            }
            
            document.getElementById('user-name').value = user.displayName || '';
            document.getElementById('user-email').value = user.email || '';
            
            const roleSelect = document.getElementById('user-role');
            if (roleSelect) {
                if (user.userType === 'admin') {
                    roleSelect.innerHTML = '<option value="admin">관리자</option>';
                    roleSelect.disabled = true;
                } else {
                    roleSelect.innerHTML = `
                        <option value="student">수강생</option>
                        <option value="instructor">강사</option>
                    `;
                    roleSelect.disabled = false;
                    for (let option of roleSelect.options) {
                        if (option.value === user.userType) {
                            option.selected = true;
                            break;
                        }
                    }
                }
            }
            
            const statusSelect = document.getElementById('user-status');
            if (statusSelect) {
                if (user.userType === 'admin') {
                    statusSelect.innerHTML = '<option value="active">활성</option>';
                    statusSelect.disabled = true;
                } else {
                    statusSelect.innerHTML = `
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                        <option value="suspended">정지</option>
                    `;
                    statusSelect.disabled = false;
                    for (let option of statusSelect.options) {
                        if (option.value === user.status) {
                            option.selected = true;
                            break;
                        }
                    }
                }
            }
            
            form.dataset.userId = userId;
            modal.classList.remove('hidden');
            
        } catch (error) {
            console.error('회원 수정 모달 표시 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('사용자 정보를 불러오는 중 오류가 발생했습니다.', 'error');
            }
        }
    },
    
    /**
     * 회원 모달 닫기
     */
    closeUserModal: function() {
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    /**
     * 회원 수정 처리
     */
    handleEditUser: async function(event) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const userId = form.dataset.userId;
            const name = document.getElementById('user-name').value;
            const role = document.getElementById('user-role').value;
            const status = document.getElementById('user-status').value;
            
            if (!name) {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('이름을 입력해주세요.', 'error');
                }
                return;
            }
            
            if (this.isFirebaseAvailable()) {
                const updateData = {
                    displayName: name,
                    userType: role,
                    status: status
                };
                
                try {
                    const result = await window.dbService.updateDocument('users', userId, updateData);
                    
                    if (result.success) {
                        if (window.adminAuth && window.adminAuth.showNotification) {
                            window.adminAuth.showNotification('회원 정보가 성공적으로 수정되었습니다.', 'success');
                        }
                        this.closeUserModal();
                        this.loadUsers();
                        this.updateUserStats();
                    } else {
                        if (window.adminAuth && window.adminAuth.showNotification) {
                            window.adminAuth.showNotification(`회원 정보 수정 실패: ${result.error?.message || '알 수 없는 오류'}`, 'error');
                        }
                    }
                } catch (error) {
                    console.error('회원 정보 수정 오류:', error);
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification(`회원 정보 수정 오류: ${error.message || '알 수 없는 오류'}`, 'error');
                    }
                }
            } else {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('데이터베이스에 연결할 수 없습니다.', 'error');
                }
            }
            
        } catch (error) {
            console.error('회원 수정 처리 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('회원 정보 수정 중 오류가 발생했습니다.', 'error');
            }
        }
    },
    
    /**
     * 회원 삭제
     */
    deleteUser: async function(userId) {
        console.log('회원 삭제:', userId);
        
        const user = await this.getUserById(userId);
        if (!user) {
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('사용자 정보를 찾을 수 없습니다.', 'error');
            }
            return;
        }
        
        if (user.userType === 'admin') {
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('관리자 계정은 삭제할 수 없습니다.', 'error');
            }
            return;
        }
        
        const userName = user.displayName || user.email;
        const confirmMessage = `정말로 "${userName}" 회원을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 회원의 모든 데이터가 영구적으로 삭제됩니다.`;
        
        if (confirm(confirmMessage)) {
            const doubleConfirm = confirm(`마지막 확인: "${userName}" 회원을 정말로 삭제하시겠습니까?`);
            if (doubleConfirm) {
                await this.handleDeleteUser(userId);
            }
        }
    },
    
    /**
     * 회원 삭제 처리 (완전 삭제)
     */
    handleDeleteUser: async function(userId) {
        try {
            if (this.isFirebaseAvailable()) {
                try {
                    await this.deleteRelatedUserData(userId);
                    
                    const result = await window.dbService.deleteDocument('users', userId);
                    
                    if (result.success) {
                        if (window.adminAuth && window.adminAuth.showNotification) {
                            window.adminAuth.showNotification('회원이 성공적으로 삭제되었습니다.', 'success');
                        }
                        this.loadUsers();
                        this.updateUserStats();
                    } else {
                        if (window.adminAuth && window.adminAuth.showNotification) {
                            window.adminAuth.showNotification(`회원 삭제 실패: ${result.error?.message || '알 수 없는 오류'}`, 'error');
                        }
                    }
                } catch (error) {
                    console.error('회원 삭제 오류:', error);
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification(`회원 삭제 오류: ${error.message || '알 수 없는 오류'}`, 'error');
                    }
                }
            } else {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('데이터베이스에 연결할 수 없습니다.', 'error');
                }
            }
        } catch (error) {
            console.error('회원 삭제 처리 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('회원 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    },
    
    /**
     * 관련 사용자 데이터 삭제
     */
    deleteRelatedUserData: async function(userId) {
        try {
            if (!window.dbService) return;
            
            const deletePromises = [
                this.deleteUserCollection('enrollments', userId),
                this.deleteUserCollection('certificates', userId),
                this.deleteUserCollection('payments', userId),
                this.deleteUserCollection('posts', userId),
                this.deleteUserCollection('comments', userId)
            ];
            
            await Promise.allSettled(deletePromises);
            console.log('관련 사용자 데이터 삭제 완료');
        } catch (error) {
            console.error('관련 사용자 데이터 삭제 오류:', error);
        }
    },
    
    /**
     * 특정 컬렉션에서 사용자 관련 문서 삭제
     */
    deleteUserCollection: async function(collectionName, userId) {
        try {
            const result = await window.dbService.getDocuments(collectionName, {
                where: [{ field: 'userId', operator: '==', value: userId }]
            });
            
            if (result.success && result.data.length > 0) {
                const deletePromises = result.data.map(doc => 
                    window.dbService.deleteDocument(collectionName, doc.id)
                );
                
                await Promise.all(deletePromises);
                console.log(`${collectionName}에서 ${result.data.length}개 문서 삭제 완료`);
            }
        } catch (error) {
            console.error(`${collectionName} 삭제 오류:`, error);
        }
    },
    
    /**
     * 검색 필터 적용
     */
    applyFilters: function() {
        console.log('검색 필터 적용');
        
        const searchKeyword = document.getElementById('search-keyword')?.value.trim();
        const userType = document.getElementById('filter-role')?.value;
        const status = document.getElementById('filter-status')?.value;
        
        console.log('검색 조건:', { searchKeyword, userType, status });
        
        this.currentPage = 1;
        this.lastDoc = null;
        
        this.loadUsers();
    },
    
    /**
     * 검색 필터 초기화
     */
    resetFilters: function() {
        console.log('검색 필터 초기화');
        
        const searchKeyword = document.getElementById('search-keyword');
        if (searchKeyword) searchKeyword.value = '';
        
        const userType = document.getElementById('filter-role');
        if (userType) userType.value = '';
        
        const status = document.getElementById('filter-status');
        if (status) status.value = '';
        
        this.currentPage = 1;
        this.lastDoc = null;
        
        this.loadUsers();
    }
};

// =================================
// 메시지 및 알림 시스템
// =================================

/**
 * 오류 메시지 표시
 */
function showErrorMessage(message) {
    showNotification(message, 'error');
}

/**
 * 성공 메시지 표시
 */
function showSuccessMessage(message) {
    showNotification(message, 'success');
}

/**
 * 정보 메시지 표시
 */
function showInfoMessage(message) {
    showNotification(message, 'info');
}

/**
 * 알림 메시지 표시
 */
function showNotification(message, type = 'info') {
    // adminAuth 유틸리티 사용 시도
    if (window.adminAuth && typeof window.adminAuth.showNotification === 'function') {
        window.adminAuth.showNotification(message, type);
        return;
    }
    
    // 기본 알림 시스템
    const existingNotification = document.querySelector('.admin-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `admin-notification fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg`;
    
    let bgColor = 'bg-blue-100 border-blue-400 text-blue-700';
    let icon = 'ℹ️';
    
    switch (type) {
        case 'error':
            bgColor = 'bg-red-100 border-red-400 text-red-700';
            icon = '❌';
            break;
        case 'success':
            bgColor = 'bg-green-100 border-green-400 text-green-700';
            icon = '✅';
            break;
        case 'warning':
            bgColor = 'bg-yellow-100 border-yellow-400 text-yellow-700';
            icon = '⚠️';
            break;
    }
    
    notification.className += ` ${bgColor} border`;
    
    notification.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0 mr-3">
                <span class="text-lg">${icon}</span>
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg font-semibold hover:opacity-70">
                ×
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    const autoRemoveTime = type === 'error' ? 7000 : 4000;
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, autoRemoveTime);
}

// =================================
// 전역 함수 노출
// =================================

/**
 * 회원 관리 페이지 초기화 함수 (전역)
 */
window.initUserManagement = async function() {
    try {
        console.log('회원 관리 페이지 초기화 시작');
        
        // Firebase 초기화 대기
        if (window.dhcFirebase && typeof window.dhcFirebase.initialize === 'function') {
            await window.dhcFirebase.initialize();
        }
        
        // 관리자 권한 확인
        let hasAccess = true;
        if (window.adminAuth && typeof window.adminAuth.checkAdminAccess === 'function') {
            hasAccess = await window.adminAuth.checkAdminAccess();
        }
        
        if (hasAccess) {
            await window.userManager.init();
        }
        
        console.log('회원 관리 페이지 초기화 완료');
    } catch (error) {
        console.error('회원 관리 페이지 초기화 오류:', error);
    }
};

// 전역 스코프에 주요 함수들 노출
window.initUserManagementPage = initUserManagementPage;

// =================================
// 페이지 종료 시 정리 (최적화)
// =================================

// 페이지 언로드 시 리스너 정리
window.addEventListener('beforeunload', function() {
    console.log('🔄 페이지 종료 - 리스너 정리');
    if (authStateListener) {
        authStateListener();
        authStateListener = null;
    }
});

// =================================
// 디버깅 및 개발자 도구
// =================================

// 개발 모드에서 사용되는 디버깅 함수들
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.web.app') ||
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {

    window.debugUserManagement = {
        // 기본 정보 확인
        help: function () {
            console.log('🎯 회원 관리 디버깅 도구 사용법');
            console.log('\n📊 데이터 관련:');
            console.log('- checkDependencies() : 유틸리티 의존성 확인');
            console.log('- refreshUsers() : 회원 목록 새로고침');
            console.log('- getUserStats() : 회원 통계 조회');

            console.log('\n🔧 시스템 관련:');
            console.log('- checkFirebase() : Firebase 연결 상태 확인');
            console.log('- checkAuth() : 인증 상태 확인');
            console.log('- testUserManager() : userManager 객체 테스트');

            console.log('\n🎨 UI 관련:');
            console.log('- testNotification(message, type) : 알림 테스트');
            console.log('- simulateUserLoad() : 사용자 로딩 시뮬레이션');

            console.log('\n🧪 종합 테스트:');
            console.log('- runFullTest() : 전체 기능 테스트');
        },

        // 🔧 의존성 테스트
        checkDependencies: checkDependencies,

        // 데이터 관련
        refreshUsers: function() {
            if (window.userManager) {
                return window.userManager.loadUsers();
            } else {
                console.error('userManager를 찾을 수 없습니다.');
            }
        },

        getUserStats: function() {
            if (window.userManager) {
                return window.userManager.updateUserStats();
            } else {
                console.error('userManager를 찾을 수 없습니다.');
            }
        },

        // 시스템 관련
        checkFirebase: function () {
            console.log('🔥 Firebase 상태 확인');
            console.log('- dhcFirebase:', !!window.dhcFirebase);
            console.log('- auth:', !!window.dhcFirebase?.auth);
            console.log('- db:', !!window.dhcFirebase?.db);
            console.log('- dbService:', !!window.dbService);
            console.log('- 현재 사용자:', window.dhcFirebase?.getCurrentUser()?.email || '없음');
        },

        checkAuth: function () {
            console.log('🔐 인증 상태 확인');
            const user = window.dhcFirebase?.getCurrentUser();
            if (user) {
                console.log('✅ 로그인됨:', user.email);
                console.log('- displayName:', user.displayName);
                console.log('- uid:', user.uid);
            } else {
                console.log('❌ 로그인되지 않음');
            }
        },

        testUserManager: function() {
            console.log('👥 userManager 객체 테스트');
            console.log('- userManager 존재:', !!window.userManager);
            console.log('- currentUsers 길이:', window.userManager?.currentUsers?.length || 0);
            console.log('- currentPage:', window.userManager?.currentPage || 'N/A');
            console.log('- 주요 메서드들:');
            console.log('  - loadUsers:', typeof window.userManager?.loadUsers);
            console.log('  - updateUserStats:', typeof window.userManager?.updateUserStats);
            console.log('  - editUser:', typeof window.userManager?.editUser);
            console.log('  - deleteUser:', typeof window.userManager?.deleteUser);
        },

        // UI 관련
        testNotification: function (message = '테스트 알림입니다', type = 'info') {
            showNotification(message, type);
        },

        simulateUserLoad: async function () {
            console.log('👥 사용자 로딩 시뮬레이션 시작');
            
            showInfoMessage('시뮬레이션 사용자 로딩 중...');
            
            // 시뮬레이션 지연
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.userManager) {
                await window.userManager.loadUsers();
                await window.userManager.updateUserStats();
            }
            
            showSuccessMessage('시뮬레이션 사용자 로딩 완료');
            console.log('✅ 사용자 로딩 시뮬레이션 완료');
        },

        // 종합 테스트
        runFullTest: async function () {
            console.log('🚀 회원 관리 전체 기능 테스트 시작...');

            console.log('\n1️⃣ 의존성 및 유틸리티 테스트');
            const dependenciesOk = checkDependencies();
            
            if (!dependenciesOk) {
                console.error('❌ 의존성 테스트 실패 - 테스트 중단');
                return;
            }

            console.log('\n2️⃣ Firebase 연결 테스트');
            this.checkFirebase();

            console.log('\n3️⃣ 인증 상태 테스트');
            this.checkAuth();

            console.log('\n4️⃣ userManager 객체 테스트');
            this.testUserManager();

            console.log('\n5️⃣ 사용자 데이터 시뮬레이션');
            await this.simulateUserLoad();

            console.log('\n6️⃣ 알림 시스템 테스트');
            this.testNotification('테스트 완료!', 'success');

            console.log('\n🎯 전체 테스트 완료!');
            console.log('💡 이제 다음 명령어들을 시도해보세요:');
            console.log('- refreshUsers() : 실제 사용자 목록 새로고침');
            console.log('- getUserStats() : 사용자 통계 업데이트');
            console.log('- testNotification("메시지", "error") : 다른 타입 알림');
        }
    };

    // 디버깅 도구 안내
    console.log('🎯 개발 모드 회원 관리 디버깅 도구 활성화됨');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('📊 데이터: checkDependencies(), refreshUsers(), getUserStats()');
    console.log('🔧 시스템: checkFirebase(), checkAuth(), testUserManager()');
    console.log('🎨 UI: testNotification(), simulateUserLoad()');
    console.log('🧪 테스트: runFullTest()');
    console.log('\n💡 도움말: window.debugUserManagement.help()');
    console.log('🚀 빠른 시작: window.debugUserManagement.runFullTest()');

} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
    console.log('현재 호스트:', window.location.hostname);
}

// 이전 버전과의 호환성을 위한 함수
if (typeof window.scriptLoaderInitialized === 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        window.initUserManagement();
    });
}

// =================================
// 최종 완료 메시지
// =================================

console.log('\n🎉 === user-management.js 통합 유틸리티 시스템 적용 완료 ===');
console.log('✅ 전역 변수 선언 순서 수정 (호이스팅 문제 해결)');
console.log('✅ 전역 유틸리티 시스템 통합');
console.log('✅ 의존성 체크 시스템 구축');
console.log('✅ Firebase 연결 상태 강화');
console.log('✅ 관리자 권한 확인 개선');
console.log('✅ 중복 실행 방지 시스템 구축');
console.log('✅ 이벤트 리스너 중복 방지');
console.log('✅ 메모리 누수 방지 (beforeunload 정리)');
console.log('✅ 향상된 알림 시스템');
console.log('✅ 포괄적인 디버깅 도구');
console.log('\n🔧 dashboard.js와 동일한 표준 적용:');
console.log('- checkDependencies() 의존성 체크');
console.log('- window.formatters, window.dateUtils 전역 유틸리티 사용');
console.log('- 최적화된 스크립트 로딩 순서 준비');
console.log('- Firebase 연결 상태 확인 강화');
console.log('- 디버깅 도구 시스템 구축');
console.log('\n🚀 회원 관리 페이지가 완전히 표준화되었습니다!');

// 완료 플래그 설정
window.userManagementReady = true;