/**
 * user-management.js - 완전한 통합 유틸리티 시스템 적용 버전 (수정)
 * 회원 관리 페이지의 모든 기능을 포함합니다.
 */

console.log('=== 완전한 표준화된 user-management.js 파일 로드됨 ===');

// =================================
// XSS 방지 유틸리티
// =================================
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

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
        const val = util.name.split('.').reduce((o, k) => (o != null ? o[k] : undefined), globalThis);
        if (!val) {
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

// 🔧 Firebase 연결 상태 확인 함수 추가
function checkFirebaseConnection() {
    console.log('🔥 Firebase 연결 상태 확인...');

    if (!window.dhcFirebase) {
        console.warn('⚠️ Firebase가 초기화되지 않음');
        return { connected: false, reason: 'not_initialized' };
    }

    if (!window.dhcFirebase.db) {
        console.warn('⚠️ Firestore 데이터베이스가 초기화되지 않음');
        return { connected: false, reason: 'db_not_initialized' };
    }

    if (!window.dhcFirebase.auth) {
        console.warn('⚠️ Firebase Auth가 초기화되지 않음');
        return { connected: false, reason: 'auth_not_initialized' };
    }

    console.log('✅ Firebase 연결 상태 정상');
    return { connected: true };
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
        const currentUser = user || window.dhcFirebase?.getCurrentUser();
        if (!currentUser || !currentUser.uid) {
            console.log('관리자 권한 없음');
            showErrorMessage('관리자 권한이 필요합니다.');
            setTimeout(() => {
                window.location.href = window.adjustPath ? window.adjustPath('index.html') : '../../index.html';
            }, 2000);
            return false;
        }

        const userDoc = await window.dhcFirebase.db.collection('users').doc(currentUser.uid).get();
        const isAdmin = userDoc.exists && userDoc.data().userType === 'admin';
        console.log('Firestore 권한 확인 결과:', isAdmin);

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

    // ✅ 캐시 매니저 인스턴스 (간단해짐!)
    cacheManager: null,

    /**
     * 초기화 함수
     */
    init: async function () {
        try {
            console.log('회원 관리자 초기화 시작');

            // ✅ 캐시 매니저 초기화
            this.cacheManager = window.CacheManagerFactory.getInstance('users', {
                cacheExpiry: 5 * 60 * 1000 // 5분
            });

            // 관리자 정보 표시
            if (window.adminAuth && typeof window.adminAuth.displayAdminInfo === 'function') {
                await window.adminAuth.displayAdminInfo();
            }

            // 이벤트 리스너 등록
            this.registerEventListeners();

            // ✅ 병렬 처리로 속도 향상
            const [users] = await Promise.all([
                this.getAllUsers(),  // 사용자 로드
            ]);

            // UI 업데이트 (순차 처리)
            this.currentUsers = users;
            this.updateUserList(users);

            const totalPages = Math.ceil(users.length / this.pageSize);
            this.updatePagination(totalPages);

            // 통계는 같은 데이터로 계산
            await this.updateUserStats();

            console.log('✅ 회원 관리자 초기화 완료');
            return true;
        } catch (error) {
            console.error('회원 관리자 초기화 오류:', error);
            return false;
        }
    },

    /**
     * 전체 사용자 가져오기 (캐시 사용)
     */
    getAllUsers: async function (forceRefresh = false) {
        return await this.cacheManager.getData(async () => {
            const result = await window.dbService.getDocuments('users', {
                orderBy: { field: 'createdAt', direction: 'desc' }
            });

            if (result.success) {
                // 관리자 제외
                return result.data.filter(user => user.userType !== 'admin');
            }
            return [];
        }, forceRefresh);
    },

    /**
     * 클라이언트 측에서 필터 적용
     */
    applyClientSideFilters: function (users) {
        const searchKeyword = document.getElementById('search-keyword')?.value.trim().toLowerCase();
        const userType = document.getElementById('filter-role')?.value;
        const status = document.getElementById('filter-status')?.value;

        let filtered = users.filter(user => {
            // 검색어 필터
            if (searchKeyword) {
                const name = (user.displayName || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                if (!name.includes(searchKeyword) && !email.includes(searchKeyword)) {
                    return false;
                }
            }

            // 회원 유형 필터
            if (userType && user.userType !== userType) {
                return false;
            }

            // 상태 필터
            if (status && user.status !== status) {
                return false;
            }

            return true;
        });

        console.log('🔍 필터 적용: 전체', users.length, '명 → 필터링', filtered.length, '명');
        return filtered;
    },

    /**
     * 이벤트 리스너 등록
     */
    registerEventListeners: function () {
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
    isFirebaseAvailable: function () {
        try {
            return window.dhcFirebase &&
                window.dhcFirebase.db &&
                window.dbService &&
                window.dhcFirebase.auth;
        } catch (error) {
            console.log('Firebase 가용성 확인 오류:', error);
            return false;
        }
    },

    /**
     * 회원 통계 업데이트
     */
    updateUserStats: async function () {
        try {
            const users = await this.getAllUsers();

            let totalUsers = 0;
            let activeUsers = 0;
            let instructorUsers = 0;
            let suspendedUsers = 0;

            users.forEach(user => {
                const status = user.status || 'active';
                const userType = user.userType || 'student';

                if (status === 'deleted') return;

                totalUsers++;
                if (status === 'active') activeUsers++;
                if (userType === 'instructor') instructorUsers++;
                if (status === 'suspended') suspendedUsers++;
            });

            this.updateStatElement('total-users-count', totalUsers);
            this.updateStatElement('active-users-count', activeUsers);
            this.updateStatElement('instructor-users-count', instructorUsers);
            this.updateStatElement('suspended-users-count', suspendedUsers);

        } catch (error) {
            console.error('회원 통계 업데이트 오류:', error);
        }
    },

    /**
     * 통계 요소 업데이트 (🔧 전역 유틸리티 사용)
     */
    updateStatElement: function (elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            const formattedValue = window.formatters.formatNumber(value);
            element.textContent = formattedValue;
        }
    },

    /**
     * 회원 목록 로드
     */
    loadUsers: async function () {
        console.log('📋 회원 목록 로드 시작');

        const userList = document.getElementById('user-list');
        userList.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    데이터를 불러오는 중입니다...
                </td>
            </tr>
        `;

        try {
            const allUsers = await this.getAllUsers();
            const filteredUsers = this.applyClientSideFilters(allUsers);

            this.currentUsers = filteredUsers;

            this.updateUserList(filteredUsers);

            const totalPages = Math.ceil(filteredUsers.length / this.pageSize);
            this.updatePagination(totalPages);

        } catch (error) {
            console.error('회원 목록 로드 오류:', error);
            userList.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-red-500">
                        데이터 로드 중 오류가 발생했습니다.
                    </td>
                </tr>
            `;
        }
    },

    // 새로운 함수 추가 - Firebase Auth 사용자를 Firestore에 동기화
    syncMissingUsers: async function () {
        console.log('Firebase Auth 사용자 동기화 시작');

        try {
            // Admin SDK가 없으므로 클라이언트에서는 현재 사용자 정보만 확인 가능
            // 실제로는 Firebase Functions나 Admin SDK가 필요하지만
            // 임시 해결책으로 알려진 사용자들을 수동으로 추가

            const knownUsers = [
                {
                    uid: 'auth-user-1',
                    email: 'bakgeunjeon@gmail.com',
                    displayName: '박근전',
                    userType: 'student',
                    status: 'active',
                    registrationMethod: 'google'
                },
                {
                    uid: 'auth-user-2',
                    email: 'test12@test.com',
                    displayName: 'test12',
                    userType: 'student',
                    status: 'active',
                    registrationMethod: 'email'
                },
                {
                    uid: 'auth-user-3',
                    email: 'test25@test.com',
                    displayName: 'test25',
                    userType: 'student',
                    status: 'active',
                    registrationMethod: 'email'
                },
                {
                    uid: 'auth-user-4',
                    email: 'bravohank@naver.com',
                    displayName: 'bravohank',
                    userType: 'student',
                    status: 'active',
                    registrationMethod: 'email'
                },
                {
                    uid: 'auth-user-5',
                    email: 'test01@test.com',
                    displayName: 'test01',
                    userType: 'student',
                    status: 'active',
                    registrationMethod: 'email'
                }
            ];

            // 각 사용자가 Firestore에 있는지 확인하고 없으면 추가
            for (const userData of knownUsers) {
                const exists = await this.checkUserExistsInFirestore(userData.email);

                if (!exists) {
                    console.log('Firestore에 누락된 사용자 추가:', userData.email);
                    await this.createMissingUserProfile(userData);
                }
            }

            console.log('사용자 동기화 완료');

        } catch (error) {
            console.error('사용자 동기화 오류:', error);
        }
    },

    // Firestore에 사용자가 있는지 확인
    checkUserExistsInFirestore: async function (email) {
        try {
            const result = await window.dbService.getDocuments('users', {
                where: { field: 'email', operator: '==', value: email },
                limit: 1
            });

            return result.success && result.data.length > 0;
        } catch (error) {
            console.error('사용자 존재 확인 오류:', error);
            return false;
        }
    },

    // 누락된 사용자 프로필 생성
    createMissingUserProfile: async function (userData) {
        try {
            const userDoc = {
                email: userData.email,
                displayName: userData.displayName || userData.email.split('@')[0],
                userType: userData.userType || 'student',
                status: userData.status || 'active',
                registrationMethod: userData.registrationMethod || 'unknown',
                phoneNumber: '',
                address: '',
                marketingConsent: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                syncedFromAuth: true // 동기화로 생성된 사용자임을 표시
            };

            // 고유한 ID로 문서 생성 (실제로는 Firebase Auth UID 사용)
            const docId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const result = await window.dbService.addDocument('users', userDoc, docId);

            if (result.success) {
                console.log('사용자 프로필 생성 완료:', userData.email);
            } else {
                console.error('사용자 프로필 생성 실패:', result.error);
            }

        } catch (error) {
            console.error('사용자 프로필 생성 오류:', error);
        }
    },

    /**
     * 사용자 목록 업데이트
     */
    updateUserList: function (users) {
        const userList = document.getElementById('user-list');

        if (!users || users.length === 0) {
            userList.innerHTML = `
            <tr>
                <td colspan="7" class="admin-empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z">
                        </path>
                    </svg>
                    <h3>등록된 회원이 없습니다</h3>
                    <p>새로운 회원이 가입하면 여기에 표시됩니다.</p>
                </td>
            </tr>
        `;
            return;
        }

        // ✅ 현재 페이지의 사용자만 추출
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageUsers = users.slice(startIndex, endIndex);

        let html = '';

        pageUsers.forEach((user, index) => {
            // 전역 번호 계산 (전체 목록에서의 순번)
            const userNumber = startIndex + index + 1;

            // 📧 전역 유틸리티 사용하여 날짜 포맷팅
            const createdAt = user.createdAt ?
                (typeof user.createdAt.toDate === 'function' ?
                    window.formatters.formatDate(user.createdAt.toDate()) :
                    user.createdAt) :
                '-';

            const displayName = user.displayName || '미설정';
            const email = user.email || '';
            const userType = user.userType || 'student';
            const status = user.status || 'active';

            const isAdmin = userType === 'admin';
            const canEdit = !isAdmin;

            // 상태 및 유형 정보
            const statusInfo = this.getStatusInfo(status);
            const userTypeInfo = this.getUserTypeInfo(userType);

            html += `
            <tr class="hover:bg-gray-50 transition-colors">
                <td data-label="번호">
                    <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-900">${userNumber}</span>
                    </div>
                </td>
                <td data-label="이름">
                    <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-900">${escapeHtml(displayName)}</span>
                        ${isAdmin ? '<span class="ml-2 user-type-badge type-admin">관리자</span>' : ''}
                    </div>
                </td>
                <td data-label="이메일">
                    <div class="text-sm text-gray-900 text-truncate">${escapeHtml(email)}</div>
                </td>
                <td data-label="회원 유형">
                    <div class="flex items-center flex-wrap gap-2">
                        <span class="user-type-badge ${userTypeInfo.class}">${userTypeInfo.text}</span>
                        ${canEdit ? `
                            <button onclick="userManager.quickRoleChange('${user.id}', '${userType}')" 
                                class="table-action-btn btn-edit" title="권한 변경">
                                변경
                            </button>
                        ` : ''}
                    </div>
                </td>
                <td data-label="상태">
                    <div class="flex items-center flex-wrap gap-2">
                        <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                        ${canEdit ? `
                            <button onclick="userManager.quickStatusChange('${user.id}', '${status}')" 
                                class="table-action-btn btn-edit" title="상태 변경">
                                변경
                            </button>
                        ` : ''}
                    </div>
                </td>
                <td data-label="가입일">
                    <span class="text-sm text-gray-500">${createdAt}</span>
                </td>
                <td data-label="관리">
                    <div class="table-actions">
                        ${canEdit ? `
                            <button onclick="userManager.editUser('${user.id}')" 
                                class="table-action-btn btn-edit" title="회원 정보 수정">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                                    </path>
                                </svg>
                                수정
                            </button>
                            <button onclick="userManager.deleteUser('${user.id}')" 
                                class="table-action-btn btn-delete" title="회원 삭제">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                    </path>
                                </svg>
                                삭제
                            </button>
                        ` : `
                            <span class="text-gray-400 text-sm">편집 불가</span>
                        `}
                    </div>
                </td>
            </tr>
        `;
        });

        userList.innerHTML = html;
    },

    /**
     * 🎯 상태 정보 가져오기 (개선된 버전)
     */
    getStatusInfo: function (status) {
        const statusMap = {
            'active': { text: '활성', class: 'status-active' },
            'inactive': { text: '비활성', class: 'status-inactive' },
            'suspended': { text: '정지', class: 'status-suspended' },
            'deleted': { text: '탈퇴', class: 'status-deleted' }  // ⬅️ 이 줄 추가!
        };
        return statusMap[status] || { text: '알 수 없음', class: 'status-inactive' };
    },

    /**
     * 🎯 사용자 유형 정보 가져오기 (새로 추가)
     */
    getUserTypeInfo: function (userType) {
        const typeMap = {
            'admin': { text: '관리자', class: 'type-admin' },
            'instructor': { text: '강사', class: 'type-instructor' },
            'student': { text: '수강생', class: 'type-student' },
            'user': { text: '일반회원', class: 'type-student' }
        };
        return typeMap[userType] || { text: '일반회원', class: 'type-student' };
    },

    /**
     * 상태별 배지 클래스 반환
     */
    getStatusBadgeClass: function (status) {
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
    quickRoleChange: async function (userId, currentRole) {
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
    quickStatusChange: async function (userId, currentStatus) {
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
    getUserById: async function (userId) {
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
    confirmRoleChange: async function () {
        if (!this.pendingRoleChange) return;

        try {
            const { userId, newRole } = this.pendingRoleChange;
            console.log('권한 변경 확인:', userId, newRole);

            if (this.isFirebaseAvailable()) {
                const result = await window.dbService.updateDocument('users', userId, {
                    userType: newRole
                });

                if (result.success) {
                    // ✅ 캐시 무효화 추가
                    this.invalidateCache();

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
    confirmStatusChange: async function () {
        if (!this.pendingStatusChange) return;

        try {
            const { userId, newStatus } = this.pendingStatusChange;
            console.log('상태 변경 확인:', userId, newStatus);

            if (this.isFirebaseAvailable()) {
                const result = await window.dbService.updateDocument('users', userId, {
                    status: newStatus
                });

                if (result.success) {
                    // ✅ 캐시 무효화 추가
                    this.invalidateCache();

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
    closeRoleChangeModal: function () {
        document.getElementById('role-change-modal').classList.add('hidden');
        this.pendingRoleChange = null;
    },

    /**
     * 상태 변경 모달 닫기
     */
    closeStatusChangeModal: function () {
        document.getElementById('status-change-modal').classList.add('hidden');
        this.pendingStatusChange = null;
    },

    /**
     * 페이지네이션 업데이트
     */
    updatePagination: function (totalPages) {
        const paginationContainer = document.getElementById('pagination-container');

        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '';

        // 이전 페이지 버튼
        html += `
        <button onclick="userManager.changePage(${this.currentPage - 1})" 
            class="admin-pagination-btn ${this.currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}"
            ${this.currentPage === 1 ? 'disabled' : ''}>
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            <span class="hide-mobile">이전</span>
        </button>
    `;

        // 페이지 번호 버튼들
        const maxVisiblePages = window.innerWidth <= 480 ? 3 : 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // 첫 페이지가 표시 범위에 없으면 첫 페이지와 점선 추가
        if (startPage > 1) {
            html += `
            <button onclick="userManager.changePage(1)" class="admin-pagination-btn">1</button>
        `;
            if (startPage > 2) {
                html += `<span class="admin-pagination-btn cursor-default">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
            <button onclick="userManager.changePage(${i})" 
                class="admin-pagination-btn page-number ${this.currentPage === i ? 'active' : ''}"
                data-page="${i}">
                ${i}
            </button>
        `;
        }

        // 마지막 페이지가 표시 범위에 없으면 점선과 마지막 페이지 추가
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="admin-pagination-btn cursor-default">...</span>`;
            }
            html += `
            <button onclick="userManager.changePage(${totalPages})" class="admin-pagination-btn">${totalPages}</button>
        `;
        }

        // 다음 페이지 버튼
        html += `
        <button onclick="userManager.changePage(${this.currentPage + 1})" 
            class="admin-pagination-btn ${this.currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''}"
            ${this.currentPage === totalPages ? 'disabled' : ''}>
            <span class="hide-mobile">다음</span>
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
        </button>
    `;

        paginationContainer.innerHTML = html;
    },

    /**
     * 페이지 변경
     */
    changePage: function (page) {
        const totalPages = Math.ceil(this.currentUsers.length / this.pageSize);

        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.updateUserList(this.currentUsers);
        this.updatePagination(totalPages);
    },

    /**
     * 사용자 유형 이름 가져오기
     */
    getUserTypeName: function (userType) {
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
    getStatusName: function (status) {
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
    editUser: async function (userId) {
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
    closeUserModal: function () {
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    /**
     * 회원 수정 처리
     */
    handleEditUser: async function (event) {
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
                    status: status,
                    updatedAt: new Date()
                };

                const result = await window.dbService.updateDocument('users', userId, updateData);

                if (result.success) {
                    // ✅ 캐시 무효화 (간단해짐!)
                    this.cacheManager.invalidate();

                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('회원 정보가 성공적으로 수정되었습니다.', 'success');
                    }
                    this.closeUserModal();

                    await this.loadUsers();
                    await this.updateUserStats();
                } else {
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification(`회원 정보 수정 실패: ${result.error?.message || '알 수 없는 오류'}`, 'error');
                    }
                }
            }
        } catch (error) {
            console.error('회원 수정 처리 오류:', error);
        }
    },

    /**
     * 회원 삭제
     */
    deleteUser: async function (userId) {
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
    handleDeleteUser: async function (userId) {
        try {
            if (this.isFirebaseAvailable()) {
                await this.deleteRelatedUserData(userId);

                const result = await window.dbService.deleteDocument('users', userId);

                if (result.success) {
                    // Firebase Auth 계정도 삭제 (서버 함수 호출)
                    try {
                        const currentUser = window.dhcFirebase.getCurrentUser();
                        if (currentUser) {
                            const idToken = await currentUser.getIdToken();
                            const res = await fetch('/api/deleteAuthUser', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${idToken}`
                                },
                                body: JSON.stringify({ uid: userId })
                            });
                            if (!res.ok) {
                                const err = await res.json().catch(() => ({}));
                                console.warn('Firebase Auth 계정 삭제 실패:', err.message || res.status);
                            }
                        }
                    } catch (authErr) {
                        console.warn('Firebase Auth 삭제 요청 오류 (Firestore는 삭제됨):', authErr);
                    }

                    this.cacheManager.invalidate();

                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('회원이 성공적으로 삭제되었습니다.', 'success');
                    }

                    await this.loadUsers();
                    await this.updateUserStats();
                }
            }
        } catch (error) {
            console.error('회원 삭제 처리 오류:', error);
        }
    },

    /**
     * 관련 사용자 데이터 삭제
     */
    deleteRelatedUserData: async function (userId) {
        try {
            if (!window.dbService) return;

            // ✅ 실제로 사용 중인 컬렉션만 삭제
            const deletePromises = [
                this.deleteUserCollection('enrollments', userId),
                this.deleteUserCollection('certificates', userId),
                this.deleteUserCollection('payments', userId)
                // posts와 comments는 현재 사용하지 않으므로 제거
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
    deleteUserCollection: async function (collectionName, userId) {
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
    applyFilters: function () {
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
    resetFilters: function () {
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
    },

    /**
     * 회원 영구 삭제 (Firestore에서 완전히 제거)
     */
    permanentDeleteUser: function (userId) {
        if (!confirm('⚠️ 경고: 이 작업은 되돌릴 수 없습니다!\n\n정말로 이 회원의 데이터를 영구적으로 삭제하시겠습니까?\n\n삭제되는 데이터:\n• 사용자 정보 (Firestore)\n• 수강 내역\n• 자격증 정보\n• 결제 내역')) {
            return;
        }

        this.handlePermanentDeleteUser(userId);
    },

    /**
     * 회원 영구 삭제 처리
     */
    handlePermanentDeleteUser: async function (userId) {
        try {
            console.log('🗑️ 영구 삭제 시작:', userId);

            if (!this.isFirebaseAvailable()) {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('데이터베이스에 연결할 수 없습니다.', 'error');
                }
                return;
            }

            const batch = window.dhcFirebase.db.batch();

            const userRef = window.dhcFirebase.db.collection('users').doc(userId);
            batch.delete(userRef);

            const enrollmentsSnapshot = await window.dhcFirebase.db
                .collection('enrollments')
                .where('userId', '==', userId)
                .get();

            enrollmentsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            const certificatesSnapshot = await window.dhcFirebase.db
                .collection('certificates')
                .where('userId', '==', userId)
                .get();

            certificatesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            const paymentsSnapshot = await window.dhcFirebase.db
                .collection('payments')
                .where('userId', '==', userId)
                .get();

            paymentsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            console.log('✅ 영구 삭제 완료:', userId);

            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('회원 데이터가 영구적으로 삭제되었습니다.', 'success');
            }

            this.loadUsers();
            this.updateUserStats();
        } catch (error) {
            console.error('❌ 영구 삭제 오류:', error);

            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('영구 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    },

    // =================================
    // CSV 다운로드
    // =================================

    /**
     * 회원 정보를 CSV 파일로 다운로드
     */
    downloadCSV: async function () {
        try {
            console.log('CSV 다운로드 시작...');

            const users = this.currentUsers;

            if (!users || users.length === 0) {
                showErrorMessage('다운로드할 회원 데이터가 없습니다.');
                return;
            }

            showInfoMessage('회원 정보를 불러오는 중...');

            // 공통 유틸 함수
            const escapeCSV = (value) => {
                if (!value) return '';
                const str = String(value);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            };

            const formatDate = (timestamp) => {
                if (!timestamp) return '';
                try {
                    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                    return window.formatters.formatDate(date, 'YYYY.MM.DD HH:mm');
                } catch (e) {
                    return '';
                }
            };

            const formatPhoneNumber = (phone) => {
                if (!phone) return '';
                const numbers = phone.replace(/[^0-9]/g, '');
                if (numbers.length === 11) {
                    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
                } else if (numbers.length === 10) {
                    return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                }
                return phone;
            };

            const courseNames = {
                'health-exercise': '운동건강관리사',
                'sports-healthcare': '스포츠헬스케어지도자',
                'pilates': '필라테스전문가',
                'recreation': '레크리에이션지도자',
                'rehabilitation': '운동재활전문가'
            };

            const roleLabels = { 'student': '수강생', 'instructor': '강사', 'admin': '관리자' };
            const statusLabels = { 'active': '활성', 'inactive': '비활성', 'suspended': '정지' };

            // 헤더 (영문성명, 자격증발급번호 추가)
            const headers = [
                '이름', '이메일', '전화번호', '생년월일',
                '회원유형', '상태', '가입일', '최근로그인',
                '주소', '신청한 자격과정', '영문성명', '자격증발급번호'
            ];
            const csvRows = [headers.join(',')];

            for (const user of users) {
                console.log(`조회 중: ${user.displayName} (${user.id})`);

                // 기본 정보 (공통)
                const baseFields = [
                    escapeCSV(user.displayName || ''),
                    escapeCSV(user.email || ''),
                    escapeCSV(formatPhoneNumber(user.phoneNumber || '')),
                    escapeCSV(user.birthdate || user.birthDate || ''),
                    roleLabels[user.userType] || '',
                    statusLabels[user.status] || '',
                    formatDate(user.createdAt),
                    formatDate(user.lastLoginAt),
                    escapeCSV([user.address, user.detailAddress].filter(Boolean).join(' '))
                ];

                // applications 컬렉션 조회
                let applicationList = [];
                try {
                    const appSnapshot = await window.dhcFirebase.db
                        .collection('applications')
                        .where('userId', '==', user.id)
                        .get();

                    appSnapshot.forEach(doc => {
                        const data = doc.data();
                        const certType = data.certificateType || '';
                        const courseName = courseNames[certType] || certType;
                        if (courseName) {
                            applicationList.push({ certType, courseName });
                        }
                    });
                    // 중복 제거
                    applicationList = applicationList.filter(
                        (item, idx, arr) => arr.findIndex(i => i.certType === item.certType) === idx
                    );
                } catch (error) {
                    console.error(`${user.displayName} applications 조회 오류:`, error);
                }

                // certificates 컬렉션 조회 (영문성명, 자격증발급번호)
                const certMap = {}; // certType → { holderNameEnglish, certificateNumber }
                try {
                    const certSnapshot = await window.dhcFirebase.db
                        .collection('certificates')
                        .where('userId', '==', user.id)
                        .get();

                    certSnapshot.forEach(doc => {
                        const data = doc.data();
                        const certType = data.certificateType || '';
                        certMap[certType] = {
                            holderNameEnglish: data.holderNameEnglish || '',
                            certificateNumber: data.certificateNumber || ''
                        };
                    });
                } catch (error) {
                    console.error(`${user.displayName} certificates 조회 오류:`, error);
                }

                if (applicationList.length === 0) {
                    // 신청한 자격과정이 없으면 1행만 출력
                    csvRows.push([...baseFields, '', '', ''].join(','));
                } else {
                    // 자격과정별로 1행씩 출력 (방안 B)
                    applicationList.forEach(({ certType, courseName }) => {
                        const certInfo = certMap[certType] || {};
                        const row = [
                            ...baseFields,
                            escapeCSV(courseName),
                            escapeCSV(certInfo.holderNameEnglish || ''),
                            escapeCSV(certInfo.certificateNumber || '')
                        ];
                        csvRows.push(row.join(','));
                    });
                }
            }

            // 다운로드
            const csvContent = '\uFEFF' + csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            const now = new Date();
            const dateStr = now.getFullYear() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');

            link.setAttribute('href', url);
            link.setAttribute('download', `회원목록_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showSuccessMessage(`${users.length}명의 회원 정보가 CSV 파일로 다운로드되었습니다.`);
            console.log('CSV 다운로드 완료');

        } catch (error) {
            console.error('CSV 다운로드 오류:', error);
            showErrorMessage('CSV 다운로드 중 오류가 발생했습니다.');
        }
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
window.initUserManagement = async function () {
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
window.addEventListener('beforeunload', function () {
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

        // 🔧 의존성 테스트 (기존 help 함수 다음에 추가)
        testDependencies: function () {
            console.log('🔧 회원 관리 의존성 테스트...');
            const result = checkDependencies();
            if (result) {
                console.log('✅ 모든 유틸리티 정상 로드됨');

                // Firebase 연결 상태도 함께 확인
                const firebaseStatus = checkFirebaseConnection();
                console.log('Firebase 상태:', firebaseStatus);

                return result && firebaseStatus.connected;
            } else {
                console.error('❌ 필수 유틸리티 누락');
                return false;
            }
        },

        // 🔧 의존성 테스트
        checkDependencies: checkDependencies,

        // 데이터 관련
        refreshUsers: function () {
            if (window.userManager) {
                return window.userManager.loadUsers();
            } else {
                console.error('userManager를 찾을 수 없습니다.');
            }
        },

        getUserStats: function () {
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

        testUserManager: function () {
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
    document.addEventListener('DOMContentLoaded', function () {
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