/**
 * payment-management.js - 완전한 통합 유틸리티 시스템 적용 버전
 * 결제 관리 페이지의 모든 기능을 포함합니다.
 */

console.log('=== 완전한 표준화된 payment-management.js 파일 로드됨 ===');

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
// 전역 변수 선언 (최적화 - 중복 방지)
// =================================

let paymentManagerInitialized = false;
let authStateListener = null;
let realtimeListenersSetup = false; // 실시간 리스너 중복 방지

// 실시간 리스너 참조 저장 (메모리 누수 방지)
let paymentsListener = null;

// 페이지네이션 상태
let currentPage = 1;
let pageSize = 10;
let lastDoc = null;
let currentFilters = {};

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
    
    // 추가: 유틸리티 함수들이 실제로 작동하는지 테스트
    try {
        const testDate = new Date();
        const testFormatDate = window.formatters.formatDate(testDate, 'YYYY.MM.DD');
        const testFormatCurrency = window.formatters.formatCurrency(500000);
        
        console.log('✅ formatters.formatDate 테스트 성공:', testFormatDate);
        console.log('✅ formatters.formatCurrency 테스트 성공:', testFormatCurrency);
        
        if (!testFormatDate || !testFormatCurrency) {
            throw new Error('포맷터 함수 결과가 유효하지 않습니다.');
        }
        
    } catch (error) {
        console.error('❌ 유틸리티 함수 테스트 실패:', error);
        return false;
    }
    
    return true;
}

// Firebase 연결 상태 확인
function checkFirebaseConnection() {
    console.log('🔥 Firebase 연결 상태 확인...');
    
    if (!window.dhcFirebase) {
        console.warn('⚠️ Firebase가 초기화되지 않음 - 테스트 모드로 동작');
        return { connected: false, reason: 'not_initialized' };
    }
    
    if (!window.dhcFirebase.db) {
        console.warn('⚠️ Firestore 데이터베이스가 초기화되지 않음');
        return { connected: false, reason: 'db_not_initialized' };
    }
    
    console.log('✅ Firebase 연결 상태 정상');
    return { connected: true };
}

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== 결제 관리 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initPaymentManagement();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initPaymentManagement();
    }
}

// 초기화 시작
initializeWhenReady();

// 의존성 오류 표시 함수
function showDependencyError() {
    const mainContent = document.querySelector('main');
    
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
// 메인 초기화 함수 (최적화)
// =================================

/**
 * 결제 관리 초기화 함수 (최적화 - 중복 실행 방지)
 */
async function initPaymentManagement() {
    if (paymentManagerInitialized) {
        console.log('⚠️ 결제 관리가 이미 초기화됨 - 중복 방지');
        return;
    }
    
    console.log('=== initPaymentManagement 실행 시작 ===');
    
    try {
        // 의존성 체크 먼저 실행
        if (!checkDependencies()) {
            console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
            showDependencyError();
            return;
        }

        // Firebase 초기화 대기
        await waitForFirebase();
        
        // 인증 상태 감지 및 초기화
        await initializeWithAuth();
        
        console.log('=== initPaymentManagement 완료 ===');
        
    } catch (error) {
        console.error('❌ 결제 관리 초기화 오류:', error);
        showErrorMessage('결제 관리 로드 중 오류가 발생했습니다.');
    }
}

// =================================
// Firebase 및 인증 관련 함수들 (최적화)
// =================================

/**
 * Firebase 초기화 대기 (개선된 버전)
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
 * 인증 상태를 기반으로 한 초기화 (최적화 - 중복 리스너 방지)
 */
function initializeWithAuth() {
    return new Promise((resolve, reject) => {
        console.log('인증 상태 감지 시작');
        
        // 현재 인증 상태 확인
        const currentUser = window.dhcFirebase.getCurrentUser();
        console.log('초기 인증 상태:', currentUser ? `${currentUser.email} 로그인됨` : '로그인하지 않음');
        
        // 기존 리스너 제거 (중복 방지)
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
                        await initializePaymentManager(user);
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
 * 관리자 권한 확인 (개선된 버전)
 */
async function checkAdminAccess(user = null) {
    console.log('관리자 권한 확인 시작');

    try {
        // onAuthStateChanged 콜백에서 전달된 user 객체를 직접 사용
        // (getCurrentUser()는 콜백 시점에 null일 수 있는 race condition 존재)
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
// 결제 관리 초기화 및 데이터 로드 (최적화)
// =================================

/**
 * 결제 관리 초기화 (인증된 사용자) - 최적화됨
 */
async function initializePaymentManager(user) {
    if (paymentManagerInitialized) {
        console.log('⚠️ 결제 관리가 이미 초기화됨 - 중복 방지');
        return;
    }
    
    console.log('✅ 인증된 사용자로 결제 관리 초기화:', user.email);
    
    try {
        // 기본 UI 기능들
        initBasicUI();
        
        // 관리자 정보 표시
        displayAdminInfo(user);
        
        // 로그아웃 버튼 설정
        setupLogoutButton();
        
        // 결제 관리자 초기화
        await window.paymentManager.init();
        
        paymentManagerInitialized = true;
        console.log('✅ 결제 관리 초기화 완료');
        
    } catch (error) {
        console.error('❌ 결제 관리 초기화 오류:', error);
        showErrorMessage('결제 관리 로드 중 오류가 발생했습니다.');
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
 * 관리자 정보 표시 (개선된 버전)
 */
function displayAdminInfo(user = null) {
    try {
        const currentUser = user || window.dhcFirebase.getCurrentUser();
        
        if (currentUser) {
            const adminNameElement = document.getElementById('admin-name');
            const adminEmailElement = document.getElementById('admin-email');
            
            // 전역 유틸리티 사용
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
 * 로그아웃 버튼 설정 (최적화 - 중복 방지)
 */
function setupLogoutButton() {
    const logoutButton = document.getElementById('admin-logout-button');
    if (logoutButton && !logoutButton.dataset.eventAttached) {
        logoutButton.addEventListener('click', handleLogout);
        logoutButton.dataset.eventAttached = 'true';
    }
    
    // 사이드바 로그아웃 버튼도 설정 (중복 방지)
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
            
            // 실시간 리스너 정리
            cleanupRealtimeListeners();
            
            // adminAuth 유틸리티 사용
            if (window.adminAuth && typeof window.adminAuth.handleLogout === 'function') {
                await window.adminAuth.handleLogout(e);
                return;
            }
            
            // 기본 로그아웃 처리
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
// 결제 관리 객체 (메인 기능)
// =================================

window.paymentManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    currentPayments: [],

    /**
     * 초기화 함수
     */
    init: async function () {
        try {
            console.log('결제 관리자 초기화 시작');

            // 관리자 정보 표시
            if (window.adminAuth && typeof window.adminAuth.displayAdminInfo === 'function') {
                await window.adminAuth.displayAdminInfo();
            }

            // 이벤트 리스너 등록
            this.registerEventListeners();

            // 결제 통계 로드
            await this.loadPaymentStats();

            // 결제 목록 로드
            await this.loadPayments();

            console.log('결제 관리자 초기화 완료');
            return true;
        } catch (error) {
            console.error('결제 관리자 초기화 오류:', error);
            if (window.showErrorToast) {
                window.showErrorToast('초기화 중 오류가 발생했습니다.');
            }
            return false;
        }
    },

    /**
     * 이벤트 리스너 등록
     */
    registerEventListeners: function () {
        console.log('이벤트 리스너 등록 시작');

        const applyButton = document.getElementById('apply-filters');
        const resetButton = document.getElementById('reset-filters');

        if (applyButton) {
            applyButton.addEventListener('click', this.applyFilters.bind(this));
        }

        if (resetButton) {
            resetButton.addEventListener('click', this.resetFilters.bind(this));
        }

        const searchInput = document.getElementById('search-keyword');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
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
                window.dhcFirebase.auth &&
                window.dhcFirebase.auth.currentUser;
        } catch (error) {
            console.log('Firebase 가용성 확인 오류:', error);
            return false;
        }
    },

    /**
     * 결제 통계 로드
     */
    loadPaymentStats: async function () {
        console.log('📊 결제 통계 로드 시작');
        
        try {
            if (this.isFirebaseAvailable()) {
                // 실제 Firebase 데이터 로드
                await this.loadRealPaymentStats();
            } else {
                // 더미 데이터 표시
                this.displayDummyStats();
            }
        } catch (error) {
            console.error('결제 통계 로드 오류:', error);
            this.displayDummyStats();
        }
    },

    /**
     * 실제 결제 통계 로드
     */
    loadRealPaymentStats: async function () {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            // 오늘 결제
            const todayPayments = await window.dbService.getDocuments('payments', {
                where: [
                    { field: 'status', operator: '==', value: 'completed' },
                    { field: 'createdAt', operator: '>=', value: today }
                ]
            });
            
            if (todayPayments.success) {
                const todayAmount = todayPayments.data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                this.updateStatElement('today-payment-amount', window.formatters.formatCurrency(todayAmount));
                this.updateStatElement('today-payment-count', todayPayments.data.length);
            }
            
            // 이번 달 결제
            const monthPayments = await window.dbService.getDocuments('payments', {
                where: [
                    { field: 'status', operator: '==', value: 'completed' },
                    { field: 'createdAt', operator: '>=', value: firstDayOfMonth }
                ]
            });
            
            if (monthPayments.success) {
                const monthAmount = monthPayments.data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                this.updateStatElement('month-payment-amount', window.formatters.formatCurrency(monthAmount));
                this.updateStatElement('month-payment-count', monthPayments.data.length);
            }
            
            // 환불 요청
            const refundRequests = await window.dbService.getDocuments('payments', {
                where: { field: 'status', operator: '==', value: 'refund_requested' }
            });
            
            if (refundRequests.success) {
                this.updateStatElement('refund-request-count', refundRequests.data.length);
            }
            
            // 최근 7일 결제 실패
            const failedPayments = await window.dbService.getDocuments('payments', {
                where: [
                    { field: 'status', operator: '==', value: 'failed' },
                    { field: 'createdAt', operator: '>=', value: sevenDaysAgo }
                ]
            });
            
            if (failedPayments.success) {
                this.updateStatElement('failed-payment-count', failedPayments.data.length);
            }
            
        } catch (error) {
            console.error('실제 결제 통계 로드 오류:', error);
            this.displayDummyStats();
        }
    },

    /**
     * 더미 통계 데이터 표시
     */
    displayDummyStats: function () {
        this.updateStatElement('today-payment-amount', window.formatters.formatCurrency(2500000));
        this.updateStatElement('today-payment-count', 15);
        this.updateStatElement('month-payment-amount', window.formatters.formatCurrency(35000000));
        this.updateStatElement('month-payment-count', 124);
        this.updateStatElement('refund-request-count', 3);
        this.updateStatElement('failed-payment-count', 7);
    },

    /**
     * 통계 요소 업데이트
     */
    updateStatElement: function (elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    },

    /**
     * 결제 목록 로드
     */
    loadPayments: async function () {
        console.log('📋 결제 목록 로드 시작');
        
        // 로딩 표시
        this.showLoadingState();
        
        try {
            if (this.isFirebaseAvailable()) {
                await this.loadRealPayments();
            } else {
                this.displayDummyPayments();
            }
        } catch (error) {
            console.error('결제 목록 로드 오류:', error);
            this.displayDummyPayments();
        }
    },

    /**
     * 로딩 상태 표시
     */
    showLoadingState: function () {
        const paymentList = document.getElementById('payment-list');
        if (paymentList) {
            paymentList.innerHTML = `
                <tr>
                    <td colspan="8" class="admin-loading-state">
                        <div class="admin-loading-spinner"></div>
                        <span class="text-gray-600">데이터를 불러오는 중입니다...</span>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * 실제 결제 목록 로드
     */
    loadRealPayments: async function () {
        try {
            const options = {
                orderBy: { field: 'createdAt', direction: 'desc' },
                limit: this.pageSize
            };

            // 필터 적용
            this.applyFiltersToOptions(options);

            let result;
            if (this.filters.searchKeyword) {
                // 검색 결과
                result = await this.searchPayments(this.filters.searchKeyword, options);
            } else {
                // 일반 페이징
                result = await window.dbService.getPaginatedDocuments('payments', options, this.currentPage > 1 ? this.lastDoc : null);
            }

            if (result.success) {
                // 추가 정보 조회
                const paymentsWithDetails = await this.enrichPaymentData(result.data);
                
                this.currentPayments = paymentsWithDetails;
                this.updatePaymentList(paymentsWithDetails);
                
                // 페이지네이션 업데이트
                if (!this.filters.searchKeyword) {
                    this.lastDoc = result.lastDoc;
                    const totalCount = await window.dbService.countDocuments('payments', { where: options.where });
                    const totalPages = Math.ceil(totalCount.count / this.pageSize);
                    this.updatePagination(totalPages);
                } else {
                    this.updatePagination(1);
                }
            } else {
                console.error('결제 목록 로드 실패:', result.error);
                if (window.showErrorToast) {
                    window.showErrorToast('결제 목록을 불러오는데 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('실제 결제 목록 로드 오류:', error);
            this.displayDummyPayments();
        }
    },

    /**
     * 필터를 옵션에 적용
     */
    applyFiltersToOptions: function (options) {
        if (this.filters.status) {
            options.where = options.where || [];
            options.where.push({ field: 'status', operator: '==', value: this.filters.status });
        }

        if (this.filters.paymentMethod) {
            options.where = options.where || [];
            options.where.push({ field: 'paymentMethod', operator: '==', value: this.filters.paymentMethod });
        }

        if (this.filters.startDate) {
            options.where = options.where || [];
            options.where.push({ field: 'createdAt', operator: '>=', value: new Date(this.filters.startDate) });
        }

        if (this.filters.endDate) {
            options.where = options.where || [];
            const endDate = new Date(this.filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            options.where.push({ field: 'createdAt', operator: '<=', value: endDate });
        }
    },

    /**
     * 결제 검색
     */
    searchPayments: async function (keyword, options) {
        try {
            const paymentIdResults = await window.dbService.searchDocuments('payments', 'paymentId', keyword, options);
            const userNameResults = await window.dbService.searchDocuments('payments', 'userName', keyword, options);

            // 결과 병합 및 중복 제거
            const combinedResults = [];
            const seenIds = new Set();

            if (paymentIdResults.success) {
                paymentIdResults.data.forEach(item => {
                    if (!seenIds.has(item.id)) {
                        combinedResults.push(item);
                        seenIds.add(item.id);
                    }
                });
            }

            if (userNameResults.success) {
                userNameResults.data.forEach(item => {
                    if (!seenIds.has(item.id)) {
                        combinedResults.push(item);
                        seenIds.add(item.id);
                    }
                });
            }

            return {
                success: true,
                data: combinedResults,
                lastDoc: null
            };
        } catch (error) {
            console.error('결제 검색 오류:', error);
            return { success: false, error };
        }
    },

    /**
     * 결제 데이터 보강 (사용자 정보, 교육과정 정보 추가)
     */
    enrichPaymentData: async function (payments) {
        return await Promise.all(payments.map(async (payment) => {
            // 결제자 정보
            if (payment.userId) {
                try {
                    const userDoc = await window.dbService.getDocument('users', payment.userId);
                    if (userDoc.success) {
                        payment.userName = userDoc.data.displayName || userDoc.data.email;
                        payment.userEmail = userDoc.data.email;
                        payment.userPhone = userDoc.data.phoneNumber;
                    }
                } catch (error) {
                    console.error('사용자 정보 조회 오류:', error);
                }
            }

            // 교육과정 정보
            if (payment.courseId) {
                try {
                    const courseDoc = await window.dbService.getDocument('courses', payment.courseId);
                    if (courseDoc.success) {
                        payment.courseName = courseDoc.data.title;
                        payment.courseType = courseDoc.data.certificateType;
                    }
                } catch (error) {
                    console.error('교육과정 정보 조회 오류:', error);
                }
            }

            return payment;
        }));
    },

    /**
     * 더미 결제 데이터 표시
     */
    displayDummyPayments: function () {
        const dummyPayments = [
            {
                id: 'dummy-1',
                paymentId: 'PAY-20250618-001',
                userName: '홍길동',
                userEmail: 'hong@example.com',
                userPhone: '010-1234-5678',
                courseName: '건강운동처방사 기본과정',
                courseType: 'health-exercise',
                amount: 350000,
                paymentMethod: 'card',
                status: 'completed',
                createdAt: new Date(),
                pgResponse: {
                    authCode: 'AUTH123456',
                    transactionId: 'TXN789012',
                    cardName: '신한카드',
                    installment: 0
                }
            },
            {
                id: 'dummy-2',
                paymentId: 'PAY-20250618-002',
                userName: '김영희',
                userEmail: 'kim@example.com',
                userPhone: '010-2345-6789',
                courseName: '운동재활전문가 기본과정',
                courseType: 'rehabilitation',
                amount: 420000,
                paymentMethod: 'transfer',
                status: 'completed',
                createdAt: new Date(Date.now() - 3600000)
            },
            {
                id: 'dummy-3',
                paymentId: 'PAY-20250618-003',
                userName: '박철수',
                userEmail: 'park@example.com',
                userPhone: '010-3456-7890',
                courseName: '필라테스 전문가 기본과정',
                courseType: 'pilates',
                amount: 480000,
                paymentMethod: 'vbank',
                status: 'pending',
                createdAt: new Date(Date.now() - 7200000)
            },
            {
                id: 'dummy-4',
                paymentId: 'PAY-20250618-004',
                userName: '이민수',
                userEmail: 'lee@example.com',
                userPhone: '010-4567-8901',
                courseName: '레크리에이션지도자 기본과정',
                courseType: 'recreation',
                amount: 280000,
                paymentMethod: 'card',
                status: 'refund_requested',
                createdAt: new Date(Date.now() - 86400000)
            },
            {
                id: 'dummy-5',
                paymentId: 'PAY-20250618-005',
                userName: '정하나',
                userEmail: 'jung@example.com',
                userPhone: '010-5678-9012',
                courseName: '건강운동처방사 심화과정',
                courseType: 'health-exercise',
                amount: 450000,
                paymentMethod: 'card',
                status: 'failed',
                createdAt: new Date(Date.now() - 172800000)
            }
        ];

        this.currentPayments = dummyPayments;
        this.updatePaymentList(dummyPayments);
        this.updatePagination(1);
    },

    /**
     * 결제 목록 업데이트
     */
    updatePaymentList: function (payments) {
        console.log('📋 결제 목록 업데이트, 결제 수:', payments.length);

        const paymentList = document.getElementById('payment-list');
        if (!paymentList) {
            console.error('결제 목록 요소를 찾을 수 없습니다.');
            return;
        }

        if (!payments || payments.length === 0) {
            paymentList.innerHTML = `
                <tr>
                    <td colspan="8" class="admin-empty-state">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z">
                            </path>
                        </svg>
                        <h3>등록된 결제 내역이 없습니다</h3>
                        <p>새로운 결제가 완료되면 여기에 표시됩니다.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        payments.forEach((payment, index) => {
            html += this.createPaymentTableRow(payment, index);
        });

        paymentList.innerHTML = html;
    },

    /**
     * 결제 테이블 행 생성
     */
    createPaymentTableRow: function (payment, index) {
        const formatDate = (date) => {
            if (!date) return '-';
            if (date.toDate) {
                return window.formatters.formatDate(date.toDate(), 'YYYY-MM-DD HH:mm');
            }
            return window.formatters.formatDate(date, 'YYYY-MM-DD HH:mm');
        };

        const formatCurrency = (amount) => {
            return window.formatters.formatCurrency(amount || 0);
        };

        const getPaymentMethodName = (method) => {
            const methods = {
                'card': '신용카드',
                'transfer': '계좌이체',
                'vbank': '가상계좌'
            };
            return methods[method] || method;
        };

        const getStatusBadge = (status) => {
            const statusConfig = {
                'pending': { class: 'status-badge bg-yellow-100 text-yellow-800', text: '대기중' },
                'completed': { class: 'status-badge bg-green-100 text-green-800', text: '완료' },
                'failed': { class: 'status-badge bg-red-100 text-red-800', text: '실패' },
                'cancelled': { class: 'status-badge bg-gray-100 text-gray-800', text: '취소' },
                'refund_requested': { class: 'status-badge bg-orange-100 text-orange-800', text: '환불요청' },
                'refunded': { class: 'status-badge bg-blue-100 text-blue-800', text: '환불완료' }
            };

            const config = statusConfig[status] || { class: 'status-badge bg-gray-100 text-gray-800', text: status };
            return `<span class="${config.class}">${config.text}</span>`;
        };

        const getActionButtons = (payment) => {
            const buttons = [];

            // 상세 보기 버튼 (항상 표시)
            buttons.push(`
                <button onclick="viewPaymentDetail('${payment.id}')" 
                        class="table-action-btn btn-view">
                    상세
                </button>
            `);

            // 환불 버튼 (완료된 결제만)
            if (payment.status === 'completed' || payment.status === 'refund_requested') {
                buttons.push(`
                    <button onclick="showRefundModal('${payment.id}')" 
                            class="table-action-btn btn-edit">
                        환불
                    </button>
                `);
            }

            // 취소 버튼 (대기중인 결제만)
            if (payment.status === 'pending') {
                buttons.push(`
                    <button onclick="cancelPayment('${payment.id}')" 
                            class="table-action-btn btn-delete">
                        취소
                    </button>
                `);
            }

            return buttons.join(' ');
        };

        const paymentNumber = index + 1 + ((this.currentPage - 1) * this.pageSize);

        return `
            <tr class="hover:bg-gray-50 transition-colors" data-payment-id="${payment.id}">
                <td data-label="결제번호">
                    <div class="font-medium text-gray-900">
                        ${payment.paymentId || `#${paymentNumber}`}
                    </div>
                </td>
                <td data-label="결제자">
                    <div>
                        <div class="font-medium text-gray-900">${escapeHtml(payment.userName || '알 수 없음')}</div>
                        <div class="text-sm text-gray-500">${escapeHtml(payment.userEmail || '')}</div>
                    </div>
                </td>
                <td data-label="교육과정">
                    <div class="text-sm text-gray-900">
                        ${escapeHtml(payment.courseName || '-')}
                    </div>
                </td>
                <td data-label="결제금액">
                    <div class="font-medium text-gray-900">
                        ${formatCurrency(payment.amount)}
                    </div>
                </td>
                <td data-label="결제방법">
                    <div class="text-sm text-gray-900">
                        ${getPaymentMethodName(payment.paymentMethod)}
                    </div>
                </td>
                <td data-label="결제일시">
                    <div class="text-sm text-gray-500">
                        ${formatDate(payment.createdAt)}
                    </div>
                </td>
                <td data-label="상태">
                    ${getStatusBadge(payment.status)}
                </td>
                <td data-label="작업">
                    <div class="table-actions">
                        ${getActionButtons(payment)}
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * 페이지네이션 업데이트
     */
    updatePagination: function (totalPages) {
        const paginationContainer = document.getElementById('payment-pagination');
        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '<div class="flex items-center justify-center gap-2">';

        // 이전 페이지 버튼
        html += `
            <button onclick="changePage(${this.currentPage - 1})" 
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
            html += `<button onclick="changePage(1)" class="admin-pagination-btn">1</button>`;
            if (startPage > 2) {
                html += `<span class="admin-pagination-btn cursor-default">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button onclick="changePage(${i})" 
                    class="admin-pagination-btn ${this.currentPage === i ? 'active' : ''}"
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
            html += `<button onclick="changePage(${totalPages})" class="admin-pagination-btn">${totalPages}</button>`;
        }

        // 다음 페이지 버튼
        html += `
            <button onclick="changePage(${this.currentPage + 1})" 
                    class="admin-pagination-btn ${this.currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''}"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <span class="hide-mobile">다음</span>
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        `;

        html += '</div>';
        paginationContainer.innerHTML = html;
    },

    /**
     * 페이지 변경
     */
    changePage: function (page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadPayments();
    },

    /**
     * 필터 적용
     */
    applyFilters: function () {
        console.log('🔍 필터 적용');

        this.filters = {
            searchKeyword: document.getElementById('search-keyword')?.value || '',
            status: document.getElementById('payment-status')?.value || '',
            paymentMethod: document.getElementById('payment-method')?.value || '',
            startDate: document.getElementById('start-date')?.value || '',
            endDate: document.getElementById('end-date')?.value || ''
        };

        // 첫 페이지로 리셋
        this.currentPage = 1;
        this.lastDoc = null;

        // 데이터 다시 로드
        this.loadPayments();
    },

    /**
     * 필터 초기화
     */
    resetFilters: function () {
        console.log('🔄 필터 초기화');

        // 모든 필터 입력값 초기화
        document.getElementById('search-keyword').value = '';
        document.getElementById('payment-status').value = '';
        document.getElementById('payment-method').value = '';
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';

        // 필터 적용
        this.applyFilters();
    },

    /**
     * 결제 상세 보기
     */
    viewPaymentDetail: async function (paymentId) {
        console.log('📋 결제 상세 보기:', paymentId);

        try {
            let payment = this.currentPayments.find(p => p.id === paymentId);

            if (!payment && this.isFirebaseAvailable()) {
                const paymentDoc = await window.dbService.getDocument('payments', paymentId);
                if (paymentDoc.success) {
                    payment = paymentDoc.data;
                    payment = (await this.enrichPaymentData([payment]))[0];
                }
            }

            if (!payment) {
                if (window.showErrorToast) {
                    window.showErrorToast('결제 정보를 찾을 수 없습니다.');
                }
                return;
            }

            this.showPaymentDetailModal(payment);

        } catch (error) {
            console.error('결제 상세 조회 오류:', error);
            if (window.showErrorToast) {
                window.showErrorToast('결제 정보를 불러오는데 실패했습니다.');
            }
        }
    },

    /**
     * 결제 상세 모달 표시
     */
    showPaymentDetailModal: function (payment) {
        const modal = document.getElementById('payment-detail-modal');
        const content = document.getElementById('payment-detail-content');

        if (!modal || !content) return;

        const formatDate = (date) => {
            if (!date) return '-';
            if (date.toDate) {
                return window.formatters.formatDate(date.toDate(), 'YYYY-MM-DD HH:mm:ss');
            }
            return window.formatters.formatDate(date, 'YYYY-MM-DD HH:mm:ss');
        };

        const formatCurrency = (amount) => {
            return window.formatters.formatCurrency(amount || 0);
        };

        const getStatusText = (status) => {
            const statusMap = {
                'pending': '대기중',
                'completed': '완료',
                'failed': '실패',
                'cancelled': '취소',
                'refund_requested': '환불요청',
                'refunded': '환불완료'
            };
            return statusMap[status] || status;
        };

        const getPaymentMethodText = (method) => {
            const methods = {
                'card': '신용카드',
                'transfer': '계좌이체',
                'vbank': '가상계좌'
            };
            return methods[method] || method;
        };

        content.innerHTML = `
            <div class="space-y-6">
                <!-- 기본 정보 -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3">기본 정보</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-500">결제번호</label>
                            <p class="mt-1 text-sm font-medium text-gray-900">${payment.paymentId || '-'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">결제상태</label>
                            <p class="mt-1 text-sm font-medium text-gray-900">${getStatusText(payment.status)}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">결제금액</label>
                            <p class="mt-1 text-lg font-bold text-gray-900">${formatCurrency(payment.amount)}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">결제방법</label>
                            <p class="mt-1 text-sm text-gray-900">${getPaymentMethodText(payment.paymentMethod)}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">결제일시</label>
                            <p class="mt-1 text-sm text-gray-900">${formatDate(payment.createdAt)}</p>
                        </div>
                    </div>
                </div>

                <!-- 결제자 정보 -->
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3">결제자 정보</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-500">이름</label>
                            <p class="mt-1 text-sm text-gray-900">${escapeHtml(payment.userName || '-')}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">이메일</label>
                            <p class="mt-1 text-sm text-gray-900">${escapeHtml(payment.userEmail || '-')}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">연락처</label>
                            <p class="mt-1 text-sm text-gray-900">${escapeHtml(payment.userPhone || '-')}</p>
                        </div>
                    </div>
                </div>

                <!-- 교육과정 정보 -->
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3">교육과정 정보</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-500">교육과정명</label>
                            <p class="mt-1 text-sm text-gray-900">${escapeHtml(payment.courseName || '-')}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">자격증 유형</label>
                            <p class="mt-1 text-sm text-gray-900">${escapeHtml(payment.courseType || '-')}</p>
                        </div>
                    </div>
                </div>

                ${payment.pgResponse ? `
                <!-- PG 응답 정보 -->
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3">PG 응답 정보</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${payment.pgResponse.authCode ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-500">승인번호</label>
                            <p class="mt-1 text-sm text-gray-900">${escapeHtml(payment.pgResponse.authCode)}</p>
                        </div>
                        ` : ''}
                        ${payment.pgResponse.transactionId ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-500">거래번호</label>
                            <p class="mt-1 text-sm text-gray-900">${escapeHtml(payment.pgResponse.transactionId)}</p>
                        </div>
                        ` : ''}
                        ${payment.pgResponse.cardName ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-500">카드사</label>
                            <p class="mt-1 text-sm text-gray-900">${escapeHtml(payment.pgResponse.cardName)}</p>
                        </div>
                        ` : ''}
                        ${payment.pgResponse.installment !== undefined ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-500">할부</label>
                            <p class="mt-1 text-sm text-gray-900">${payment.pgResponse.installment === 0 ? '일시불' : payment.pgResponse.installment + '개월'}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        modal.classList.remove('hidden');
    },

    /**
     * 환불 모달 표시
     */
    showRefundModal: async function (paymentId) {
        console.log('💰 환불 모달 표시:', paymentId);

        try {
            let payment = this.currentPayments.find(p => p.id === paymentId);

            if (!payment && this.isFirebaseAvailable()) {
                const paymentDoc = await window.dbService.getDocument('payments', paymentId);
                if (paymentDoc.success) {
                    payment = paymentDoc.data;
                }
            }

            if (!payment) {
                if (window.showErrorToast) {
                    window.showErrorToast('결제 정보를 찾을 수 없습니다.');
                }
                return;
            }

            if (payment.status !== 'completed' && payment.status !== 'refund_requested') {
                if (window.showWarningToast) {
                    window.showWarningToast('완료된 결제만 환불 처리할 수 있습니다.');
                }
                return;
            }

            const modal = document.getElementById('refund-modal');
            const amountInput = document.getElementById('refund-amount');
            const reasonInput = document.getElementById('refund-reason');

            if (modal && amountInput && reasonInput) {
                amountInput.value = window.formatters.formatCurrency(payment.amount);
                reasonInput.value = '';
                
                // 환불 폼에 결제 ID 저장
                const form = document.getElementById('refund-form');
                if (form) {
                    form.dataset.paymentId = paymentId;
                }

                modal.classList.remove('hidden');
            }

        } catch (error) {
            console.error('환불 모달 표시 오류:', error);
            if (window.showErrorToast) {
                window.showErrorToast('환불 처리 중 오류가 발생했습니다.');
            }
        }
    },

    /**
     * 결제 취소
     */
    cancelPayment: async function (paymentId) {
        console.log('❌ 결제 취소:', paymentId);

        if (!confirm('정말로 이 결제를 취소하시겠습니까?')) {
            return;
        }

        try {
            let payment = this.currentPayments.find(p => p.id === paymentId);

            if (!payment) {
                if (window.showErrorToast) {
                    window.showErrorToast('결제 정보를 찾을 수 없습니다.');
                }
                return;
            }

            if (payment.status !== 'pending') {
                if (window.showWarningToast) {
                    window.showWarningToast('대기중인 결제만 취소할 수 있습니다.');
                }
                return;
            }

            if (this.isFirebaseAvailable()) {
                const result = await window.dbService.updateDocument('payments', paymentId, {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelReason: '관리자 취소'
                });

                if (result.success) {
                    if (window.showSuccessToast) {
                        window.showSuccessToast('결제가 성공적으로 취소되었습니다.');
                    }
                    this.loadPayments();
                    this.loadPaymentStats();
                } else {
                    if (window.showErrorToast) {
                        window.showErrorToast('결제 취소에 실패했습니다.');
                    }
                }
            } else {
                // 더미 데이터에서 상태 변경
                payment.status = 'cancelled';
                this.updatePaymentList(this.currentPayments);
                if (window.showSuccessToast) {
                    window.showSuccessToast('결제가 취소되었습니다 (테스트 모드).');
                }
            }

        } catch (error) {
            console.error('결제 취소 오류:', error);
            if (window.showErrorToast) {
                window.showErrorToast('결제 취소 중 오류가 발생했습니다.');
            }
        }
    }
};

// =================================
// 실시간 리스너 관리
// =================================

/**
 * 실시간 업데이트 설정 (중복 방지)
 */
function setupRealtimeUpdates() {
    if (realtimeListenersSetup) {
        console.log('⚠️ 실시간 리스너가 이미 설정됨 - 중복 방지');
        return;
    }

    if (!window.dhcFirebase || !window.dhcFirebase.db) {
        console.log('Firebase가 준비되지 않아 실시간 업데이트를 설정할 수 없습니다.');
        return;
    }

    try {
        // 결제 컬렉션 실시간 리스너
        paymentsListener = window.dhcFirebase.db.collection('payments')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                console.log('📊 실시간 결제 데이터 업데이트');
                // 통계만 업데이트 (목록은 수동 새로고침)
                if (window.paymentManager) {
                    window.paymentManager.loadPaymentStats();
                }
            }, (error) => {
                console.error('실시간 결제 리스너 오류:', error);
            });

        realtimeListenersSetup = true;
        console.log('✅ 실시간 업데이트 설정 완료');

    } catch (error) {
        console.error('실시간 리스너 설정 오류:', error);
    }
}

/**
 * 실시간 리스너 정리
 */
function cleanupRealtimeListeners() {
    console.log('🧹 실시간 리스너 정리 시작');

    if (paymentsListener) {
        paymentsListener();
        paymentsListener = null;
        console.log('✅ 결제 리스너 정리 완료');
    }

    realtimeListenersSetup = false;
    console.log('✅ 모든 실시간 리스너 정리 완료');
}

// =================================
// 폼 이벤트 처리
// =================================

// 환불 폼 제출 처리
document.addEventListener('DOMContentLoaded', function() {
    const refundForm = document.getElementById('refund-form');
    if (refundForm) {
        refundForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const paymentId = this.dataset.paymentId;
            const reason = document.getElementById('refund-reason').value.trim();
            
            if (!reason) {
                if (window.showWarningToast) {
                    window.showWarningToast('환불 사유를 입력해주세요.');
                }
                return;
            }
            
            if (!confirm('환불을 처리하시겠습니까?')) {
                return;
            }
            
            try {
                if (window.paymentManager.isFirebaseAvailable()) {
                    const result = await window.dbService.updateDocument('payments', paymentId, {
                        status: 'refunded',
                        refundedAt: new Date(),
                        refundReason: reason,
                        refundProcessedBy: window.dhcFirebase.getCurrentUser()?.email
                    });
                    
                    if (result.success) {
                        if (window.showSuccessToast) {
                            window.showSuccessToast('환불이 성공적으로 처리되었습니다.');
                        }
                        document.getElementById('refund-modal').classList.add('hidden');
                        window.paymentManager.loadPayments();
                        window.paymentManager.loadPaymentStats();
                    } else {
                        if (window.showErrorToast) {
                            window.showErrorToast('환불 처리에 실패했습니다.');
                        }
                    }
                } else {
                    // 테스트 모드
                    const payment = window.paymentManager.currentPayments.find(p => p.id === paymentId);
                    if (payment) {
                        payment.status = 'refunded';
                        window.paymentManager.updatePaymentList(window.paymentManager.currentPayments);
                    }
                    document.getElementById('refund-modal').classList.add('hidden');
                    if (window.showSuccessToast) {
                        window.showSuccessToast('환불이 처리되었습니다 (테스트 모드).');
                    }
                }
                
            } catch (error) {
                console.error('환불 처리 오류:', error);
                if (window.showErrorToast) {
                    window.showErrorToast('환불 처리 중 오류가 발생했습니다.');
                }
            }
        });
    }
});

// =================================
// 메시지 및 알림 시스템
// =================================

/**
 * 오류 메시지 표시
 */
function showErrorMessage(message) {
    if (window.showErrorToast) {
        window.showErrorToast(message);
    } else {
        showNotification(message, 'error');
    }
}

/**
 * 성공 메시지 표시
 */
function showSuccessMessage(message) {
    if (window.showSuccessToast) {
        window.showSuccessToast(message);
    } else {
        showNotification(message, 'success');
    }
}

/**
 * 정보 메시지 표시
 */
function showInfoMessage(message) {
    if (window.showInfoToast) {
        window.showInfoToast(message);
    } else {
        showNotification(message, 'info');
    }
}

/**
 * 경고 메시지 표시
 */
function showWarningMessage(message) {
    if (window.showWarningToast) {
        window.showWarningToast(message);
    } else {
        showNotification(message, 'warning');
    }
}

/**
 * 기본 알림 메시지 표시 (Toast 시스템이 없는 경우)
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

// 결제 관리 페이지 초기화 함수 (전역)
window.initPaymentManagement = initPaymentManagement;

// 페이지 변경 함수 (전역)
window.changePage = function(page) {
    if (window.paymentManager) {
        window.paymentManager.changePage(page);
    }
};

// 결제 상세 보기 함수 (전역)
window.viewPaymentDetail = function(paymentId) {
    if (window.paymentManager) {
        window.paymentManager.viewPaymentDetail(paymentId);
    }
};

// 환불 모달 표시 함수 (전역)
window.showRefundModal = function(paymentId) {
    if (window.paymentManager) {
        window.paymentManager.showRefundModal(paymentId);
    }
};

// 결제 취소 함수 (전역)
window.cancelPayment = function(paymentId) {
    if (window.paymentManager) {
        window.paymentManager.cancelPayment(paymentId);
    }
};

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
    cleanupRealtimeListeners();
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

    window.debugPaymentManagement = {
        // 기본 정보 확인
        help: function () {
            console.log('🎯 결제 관리 디버깅 도구 사용법');
            console.log('\n📊 데이터 관련:');
            console.log('- testDependencies() : 유틸리티 의존성 확인');
            console.log('- refreshPayments() : 결제 목록 새로고침');
            console.log('- getPaymentStats() : 결제 통계 조회');
            console.log('- testPaymentData() : 더미 데이터 표시');

            console.log('\n🔧 시스템 관련:');
            console.log('- checkFirebase() : Firebase 연결 상태 확인');
            console.log('- checkAuth() : 인증 상태 확인');
            console.log('- testPaymentManager() : paymentManager 객체 테스트');

            console.log('\n🎨 UI 관련:');
            console.log('- testNotification(message, type) : 알림 테스트');
            console.log('- simulatePaymentLoad() : 결제 로딩 시뮬레이션');
            console.log('- testModal() : 모달 테스트');

            console.log('\n🧪 종합 테스트:');
            console.log('- runFullTest() : 전체 기능 테스트');
        },

        // 의존성 테스트
        testDependencies: function () {
            console.log('🔧 결제 관리 의존성 테스트...');
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

        // 의존성 테스트
        checkDependencies: checkDependencies,

        // 데이터 관련
        refreshPayments: function () {
            if (window.paymentManager) {
                return window.paymentManager.loadPayments();
            } else {
                console.error('paymentManager를 찾을 수 없습니다.');
            }
        },

        getPaymentStats: function () {
            if (window.paymentManager) {
                return window.paymentManager.loadPaymentStats();
            } else {
                console.error('paymentManager를 찾을 수 없습니다.');
            }
        },

        testPaymentData: function () {
            if (window.paymentManager) {
                window.paymentManager.displayDummyPayments();
                window.paymentManager.displayDummyStats();
                console.log('✅ 더미 데이터 표시 완료');
            } else {
                console.error('paymentManager를 찾을 수 없습니다.');
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

        testPaymentManager: function () {
            console.log('💳 paymentManager 객체 테스트');
            console.log('- paymentManager 존재:', !!window.paymentManager);
            console.log('- currentPayments 길이:', window.paymentManager?.currentPayments?.length || 0);
            console.log('- currentPage:', window.paymentManager?.currentPage || 'N/A');
            console.log('- 주요 메서드들:');
            console.log('  - loadPayments:', typeof window.paymentManager?.loadPayments);
            console.log('  - loadPaymentStats:', typeof window.paymentManager?.loadPaymentStats);
            console.log('  - viewPaymentDetail:', typeof window.paymentManager?.viewPaymentDetail);
            console.log('  - showRefundModal:', typeof window.paymentManager?.showRefundModal);
        },

        // UI 관련
        testNotification: function (message = '테스트 알림입니다', type = 'info') {
            if (window.showToast) {
                window.showToast(message, type);
            } else {
                showNotification(message, type);
            }
        },

        simulatePaymentLoad: async function () {
            console.log('💳 결제 로딩 시뮬레이션 시작');

            if (window.showInfoToast) {
                window.showInfoToast('시뮬레이션 결제 로딩 중...');
            }

            // 시뮬레이션 지연
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (window.paymentManager) {
                await window.paymentManager.loadPayments();
                await window.paymentManager.loadPaymentStats();
            }

            if (window.showSuccessToast) {
                window.showSuccessToast('시뮬레이션 결제 로딩 완료');
            }
            console.log('✅ 결제 로딩 시뮬레이션 완료');
        },

        testModal: function () {
            console.log('🔨 모달 테스트');
            
            // 더미 결제 데이터로 상세 모달 테스트
            if (window.paymentManager && window.paymentManager.currentPayments.length > 0) {
                const firstPayment = window.paymentManager.currentPayments[0];
                window.paymentManager.showPaymentDetailModal(firstPayment);
                console.log('✅ 결제 상세 모달 테스트 완료');
            } else {
                console.log('⚠️ 표시할 결제 데이터가 없습니다. 먼저 더미 데이터를 로드하세요.');
                console.log('💡 testPaymentData() 함수를 실행해보세요.');
            }
        },

        // 종합 테스트
        runFullTest: async function () {
            console.log('🚀 결제 관리 전체 기능 테스트 시작...');

            console.log('\n1️⃣ 의존성 및 유틸리티 테스트');
            const dependenciesOk = this.testDependencies();

            if (!dependenciesOk) {
                console.error('❌ 의존성 테스트 실패 - 테스트 중단');
                return;
            }

            console.log('\n2️⃣ Firebase 연결 테스트');
            this.checkFirebase();

            console.log('\n3️⃣ 인증 상태 테스트');
            this.checkAuth();

            console.log('\n4️⃣ paymentManager 객체 테스트');
            this.testPaymentManager();

            console.log('\n5️⃣ 결제 데이터 시뮬레이션');
            await this.simulatePaymentLoad();

            console.log('\n6️⃣ 알림 시스템 테스트');
            this.testNotification('테스트 완료!', 'success');

            console.log('\n7️⃣ 모달 시스템 테스트');
            setTimeout(() => {
                this.testModal();
            }, 1000);

            console.log('\n🎯 전체 테스트 완료!');
            console.log('💡 이제 다음 명령어들을 시도해보세요:');
            console.log('- refreshPayments() : 실제 결제 목록 새로고침');
            console.log('- getPaymentStats() : 결제 통계 업데이트');
            console.log('- testNotification("메시지", "error") : 다른 타입 알림');
        }
    };

    // 디버깅 도구 안내
    console.log('🎯 개발 모드 결제 관리 디버깅 도구 활성화됨');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('📊 데이터: testDependencies(), refreshPayments(), getPaymentStats(), testPaymentData()');
    console.log('🔧 시스템: checkFirebase(), checkAuth(), testPaymentManager()');
    console.log('🎨 UI: testNotification(), simulatePaymentLoad(), testModal()');
    console.log('🧪 테스트: runFullTest()');
    console.log('\n💡 도움말: window.debugPaymentManagement.help()');
    console.log('🚀 빠른 시작: window.debugPaymentManagement.runFullTest()');

} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
    console.log('현재 호스트:', window.location.hostname);
}

// =================================
// 최종 완료 메시지
// =================================

console.log('\n🎉 === payment-management.js 통합 유틸리티 시스템 적용 완료 ===');
console.log('✅ 전역 변수 선언 최적화');
console.log('✅ 전역 유틸리티 시스템 통합');
console.log('✅ 의존성 체크 시스템 구축');
console.log('✅ Firebase 연결 상태 강화');
console.log('✅ 관리자 권한 확인 개선');
console.log('✅ 중복 실행 방지 시스템 구축');
console.log('✅ 이벤트 리스너 중복 방지');
console.log('✅ 메모리 누수 방지 (beforeunload 정리)');
console.log('✅ 향상된 Toast 알림 시스템');
console.log('✅ 반응형 테이블 시스템 준비');
console.log('✅ 포괄적인 디버깅 도구');
console.log('\n🔧 다른 관리자 페이지와 동일한 표준 적용:');
console.log('- checkDependencies() 의존성 체크');
console.log('- window.formatters, window.dateUtils 전역 유틸리티 사용');
console.log('- 최적화된 스크립트 로딩 순서 준비');
console.log('- Firebase 연결 상태 확인 강화');
console.log('- 디버깅 도구 시스템 구축');
console.log('- Toast 알림 시스템 통합');
console.log('\n🚀 결제 관리 페이지가 완전히 표준화되었습니다!');

// 완료 플래그 설정
window.paymentManagementReady = true;