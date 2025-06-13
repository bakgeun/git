/**
 * payment-management.js - 완전한 통합 유틸리티 시스템 적용 버전
 * 결제 관리 페이지의 모든 기능을 포함합니다.
 */

console.log('=== 완전한 표준화된 payment-management.js 파일 로드됨 ===');

// =================================
// 전역 변수 선언 (최적화 - 중복 방지)
// =================================

let paymentManagerInitialized = false;
let authStateListener = null;
let realtimeListenersSetup = false; // 🔧 실시간 리스너 중복 방지

// 🔧 실시간 리스너 참조 저장 (메모리 누수 방지)
let paymentsListener = null;

// 🔧 페이지네이션 상태
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

// 🔧 의존성 오류 표시 함수
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
        
        // 검색 필터 설정
        setupFilters();
        
        // 결제 통계 로드
        await loadPaymentStats();
        
        // 결제 내역 로드
        await loadPayments();
        
        // 실시간 업데이트 설정 (중복 방지)
        setupRealtimeUpdates();
        
        // 관리자 전용 기능 초기화
        initAdminFeatures();
        
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
    
    // 스크롤 애니메이션
    initScrollAnimations();
    
    // 부드러운 스크롤
    initSmoothScroll();
    
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
 * 관리자 전용 기능 초기화
 */
function initAdminFeatures() {
    console.log('🔧 관리자 전용 기능 초기화');
    
    // 관리자 네비게이션 설정
    if (window.adminAuth && typeof window.adminAuth.setupAdminNavigation === 'function') {
        window.adminAuth.setupAdminNavigation();
    }
    
    // 키보드 단축키 설정
    setupKeyboardShortcuts();
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
// 결제 관리 데이터 로드 기능들
// =================================

/**
 * 검색 필터 설정
 */
function setupFilters() {
    console.log('🔍 검색 필터 설정');
    
    // 필터 컨테이너 확인
    const filterContainer = document.getElementById('payment-filter-container');
    if (!filterContainer) {
        console.warn('필터 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    // 기본 필터 HTML 생성
    const filterHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">검색</label>
                <input type="text" id="search-keyword" placeholder="결제번호 또는 결제자명" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">결제 상태</label>
                <select id="payment-status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">전체</option>
                    <option value="pending">대기중</option>
                    <option value="completed">완료</option>
                    <option value="failed">실패</option>
                    <option value="cancelled">취소</option>
                    <option value="refund_requested">환불요청</option>
                    <option value="refunded">환불완료</option>
                </select>
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">결제 방법</label>
                <select id="payment-method" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">전체</option>
                    <option value="card">신용카드</option>
                    <option value="transfer">계좌이체</option>
                    <option value="vbank">가상계좌</option>
                </select>
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">기간</label>
                <div class="flex space-x-2">
                    <input type="date" id="start-date" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <input type="date" id="end-date" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
        </div>
        <div class="mt-4 flex justify-end space-x-2">
            <button id="reset-filters" class="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                초기화
            </button>
            <button id="apply-filters" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                검색
            </button>
        </div>
    `;
    
    filterContainer.innerHTML = filterHTML;
    
    // 필터 이벤트 등록
    const applyButton = document.getElementById('apply-filters');
    const resetButton = document.getElementById('reset-filters');
    
    if (applyButton) {
        applyButton.addEventListener('click', applyFilters);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }
    
    // 엔터 키로 검색
    const searchInput = document.getElementById('search-keyword');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
}

/**
 * 필터 적용
 */
function applyFilters() {
    console.log('🔍 필터 적용');
    
    currentFilters = {
        searchKeyword: document.getElementById('search-keyword')?.value || '',
        status: document.getElementById('payment-status')?.value || '',
        paymentMethod: document.getElementById('payment-method')?.value || '',
        startDate: document.getElementById('start-date')?.value || '',
        endDate: document.getElementById('end-date')?.value || ''
    };
    
    // 첫 페이지로 리셋
    currentPage = 1;
    lastDoc = null;
    
    // 데이터 다시 로드
    loadPayments();
}

/**
 * 필터 초기화
 */
function resetFilters() {
    console.log('🔄 필터 초기화');
    
    // 모든 필터 입력값 초기화
    document.getElementById('search-keyword').value = '';
    document.getElementById('payment-status').value = '';
    document.getElementById('payment-method').value = '';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    
    // 필터 적용
    applyFilters();
}

/**
 * 결제 통계 로드
 */
async function loadPaymentStats() {
    console.log('📊 결제 통계 로드 시작');
    
    try {
        // dbService가 없으면 더미 데이터 사용
        if (!window.dbService) {
            console.log('dbService가 없어 더미 데이터 사용');
            displayDummyStats();
            return;
        }
        
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
            updateElement('today-payment-amount', window.formatters.formatCurrency(todayAmount));
            updateElement('today-payment-count', todayPayments.data.length);
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
            updateElement('month-payment-amount', window.formatters.formatCurrency(monthAmount));
            updateElement('month-payment-count', monthPayments.data.length);
        }
        
        // 환불 요청
        const refundRequests = await window.dbService.getDocuments('payments', {
            where: { field: 'status', operator: '==', value: 'refund_requested' }
        });
        
        if (refundRequests.success) {
            updateElement('refund-request-count', refundRequests.data.length);
        }
        
        // 최근 7일 결제 실패
        const failedPayments = await window.dbService.getDocuments('payments', {
            where: [
                { field: 'status', operator: '==', value: 'failed' },
                { field: 'createdAt', operator: '>=', value: sevenDaysAgo }
            ]
        });
        
        if (failedPayments.success) {
            updateElement('failed-payment-count', failedPayments.data.length);
        }
        
    } catch (error) {
        console.error('결제 통계 로드 오류:', error);
        displayDummyStats();
    }
}

/**
 * 더미 통계 데이터 표시
 */
function displayDummyStats() {
    updateElement('today-payment-amount', window.formatters.formatCurrency(2500000));
    updateElement('today-payment-count', 15);
    updateElement('month-payment-amount', window.formatters.formatCurrency(35000000));
    updateElement('month-payment-count', 124);
    updateElement('refund-request-count', 3);
    updateElement('failed-payment-count', 7);
}

/**
 * 결제 내역 로드
 */
async function loadPayments() {
    console.log('📋 결제 내역 로드 시작');
    
    // 로딩 표시
    showLoadingOverlay(true);
    
    try {
        // dbService가 없으면 더미 데이터 사용
        if (!window.dbService) {
            console.log('dbService가 없어 더미 데이터 사용');
            displayDummyPayments();
            return;
        }
        
        // 필터 옵션 설정
        const options = {
            orderBy: { field: 'createdAt', direction: 'desc' },
            limit: pageSize
        };
        
        // 필터 적용
        if (currentFilters.status) {
            options.where = options.where || [];
            options.where.push({ field: 'status', operator: '==', value: currentFilters.status });
        }
        
        if (currentFilters.paymentMethod) {
            options.where = options.where || [];
            options.where.push({ field: 'paymentMethod', operator: '==', value: currentFilters.paymentMethod });
        }
        
        // 날짜 필터
        if (currentFilters.startDate) {
            options.where = options.where || [];
            options.where.push({ field: 'createdAt', operator: '>=', value: new Date(currentFilters.startDate) });
        }
        
        if (currentFilters.endDate) {
            options.where = options.where || [];
            const endDate = new Date(currentFilters.endDate);
            endDate.setHours(23, 59, 59, 999);
            options.where.push({ field: 'createdAt', operator: '<=', value: endDate });
        }
        
        // 검색어 필터 (결제번호 또는 결제자명)
        let searchResults;
        if (currentFilters.searchKeyword) {
            // 복합 검색 (결제번호와 결제자명)
            const paymentIdResults = await window.dbService.searchDocuments('payments', 'paymentId', currentFilters.searchKeyword, options);
            const userNameResults = await window.dbService.searchDocuments('payments', 'userName', currentFilters.searchKeyword, options);
            
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
            
            searchResults = {
                success: true,
                data: combinedResults,
                lastDoc: null
            };
        } else {
            searchResults = await window.dbService.getPaginatedDocuments('payments', options, currentPage > 1 ? lastDoc : null);
        }
        
        if (searchResults.success) {
            // 추가 정보 조회 (결제자 정보, 교육과정 정보)
            const paymentsWithDetails = await Promise.all(searchResults.data.map(async (payment) => {
                // 결제자 정보
                if (payment.userId) {
                    const userDoc = await window.dbService.getDocument('users', payment.userId);
                    if (userDoc.success) {
                        payment.userName = userDoc.data.displayName || userDoc.data.email;
                        payment.userEmail = userDoc.data.email;
                        payment.userPhone = userDoc.data.phoneNumber;
                    }
                }
                
                // 교육과정 정보
                if (payment.courseId) {
                    const courseDoc = await window.dbService.getDocument('courses', payment.courseId);
                    if (courseDoc.success) {
                        payment.courseName = courseDoc.data.title;
                        payment.courseType = courseDoc.data.certificateType;
                    }
                }
                
                return payment;
            }));
            
            // 테이블 업데이트
            updatePaymentTable(paymentsWithDetails);
            
            // 페이지네이션 업데이트
            if (!currentFilters.searchKeyword) {
                lastDoc = searchResults.lastDoc;
                
                // 전체 결제 수 계산
                const totalCount = await window.dbService.countDocuments('payments', { where: options.where });
                const totalPages = Math.ceil(totalCount.count / pageSize);
                
                updatePagination(currentPage, totalPages);
            } else {
                // 검색 결과의 경우 간단한 페이지네이션
                updatePagination(1, 1);
            }
        } else {
            console.error('결제 내역 로드 실패:', searchResults.error);
            showErrorMessage('결제 내역을 불러오는데 실패했습니다.');
        }
        
    } catch (error) {
        console.error('결제 내역 로드 오류:', error);
        displayDummyPayments();
    } finally {
        showLoadingOverlay(false);
    }
}

/**
 * 더미 결제 데이터 표시
 */
function displayDummyPayments() {
    const dummyPayments = [
        {
            id: 'dummy-1',
            paymentId: 'PAY-20250613-001',
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
            paymentId: 'PAY-20250613-002',
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
            paymentId: 'PAY-20250613-003',
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
            paymentId: 'PAY-20250613-004',
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
            paymentId: 'PAY-20250613-005',
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
    
    updatePaymentTable(dummyPayments);
    updatePagination(1, 1);
}

/**
 * 결제 테이블 업데이트
 */
function updatePaymentTable(payments) {
    console.log('📋 결제 테이블 업데이트, 결제 수:', payments.length);
    
    const tableContainer = document.getElementById('payment-table');
    if (!tableContainer) {
        console.error('테이블 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    // 테이블 헤더
    const tableHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제번호</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제자</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">교육과정</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제금액</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제방법</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제일시</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${payments.length > 0 ? payments.map(payment => createPaymentTableRow(payment)).join('') : 
                        '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">결제 내역이 없습니다.</td></tr>'
                    }
                </tbody>
            </table>
        </div>
    `;
    
    tableContainer.innerHTML = tableHTML;
    
    // 테이블 이벤트 등록
    attachTableEvents();
}

/**
 * 결제 테이블 행 생성
 */
function createPaymentTableRow(payment) {
    // 🔧 전역 유틸리티 사용
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
            'pending': { class: 'bg-yellow-100 text-yellow-800', text: '대기중' },
            'completed': { class: 'bg-green-100 text-green-800', text: '완료' },
            'failed': { class: 'bg-red-100 text-red-800', text: '실패' },
            'cancelled': { class: 'bg-gray-100 text-gray-800', text: '취소' },
            'refund_requested': { class: 'bg-orange-100 text-orange-800', text: '환불요청' },
            'refunded': { class: 'bg-blue-100 text-blue-800', text: '환불완료' }
        };
        
        const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', text: status };
        return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.class}">${config.text}</span>`;
    };
    
    const getActionButtons = (payment) => {
        const buttons = [];
        
        // 상세 보기 버튼 (항상 표시)
        buttons.push(`
            <button onclick="viewPaymentDetail('${payment.id}')" 
                    class="text-blue-600 hover:text-blue-900 text-sm font-medium">
                상세
            </button>
        `);
        
        // 환불 버튼 (완료된 결제만)
        if (payment.status === 'completed' || payment.status === 'refund_requested') {
            buttons.push(`
                <button onclick="showRefundModal('${payment.id}')" 
                        class="text-orange-600 hover:text-orange-900 text-sm font-medium">
                    환불
                </button>
            `);
        }
        
        // 취소 버튼 (대기중인 결제만)
        if (payment.status === 'pending') {
            buttons.push(`
                <button onclick="cancelPayment('${payment.id}')" 
                        class="text-red-600 hover:text-red-900 text-sm font-medium">
                    취소
                </button>
            `);
        }
        
        return buttons.join(' | ');
    };
    
    return `
        <tr class="hover:bg-gray-50" data-payment-id="${payment.id}">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${payment.paymentId || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                    <div class="font-medium">${payment.userName || '알 수 없음'}</div>
                    <div class="text-gray-500">${payment.userEmail || ''}</div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${payment.courseName || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                ${formatCurrency(payment.amount)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${getPaymentMethodName(payment.paymentMethod)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatDate(payment.createdAt)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${getStatusBadge(payment.status)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${getActionButtons(payment)}
            </td>
        </tr>
    `;
}

/**
 * 테이블 이벤트 등록
 */
function attachTableEvents() {
    // 테이블 행 클릭 시 상세 보기
    const tableRows = document.querySelectorAll('tbody tr[data-payment-id]');
    tableRows.forEach(row => {
        row.addEventListener('click', (e) => {
            // 버튼 클릭은 제외
            if (e.target.tagName === 'BUTTON') return;
            
            const paymentId = row.dataset.paymentId;
            if (paymentId) {
                viewPaymentDetail(paymentId);
            }
        });
    });
}

/**
 * 페이지네이션 업데이트
 */
function updatePagination(current, total) {
    const paginationContainer = document.getElementById('payment-pagination');
    if (!paginationContainer) return;
    
    if (total <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="flex items-center justify-between">';
    
    // 이전 버튼
    if (current > 1) {
        paginationHTML += `
            <button onclick="changePage(${current - 1})" 
                    class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                이전
            </button>
        `;
    } else {
        paginationHTML += `
            <button disabled class="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed">
                이전
            </button>
        `;
    }
    
    // 페이지 정보
    paginationHTML += `
        <span class="text-sm text-gray-700">
            ${current} / ${total} 페이지
        </span>
    `;
    
    // 다음 버튼
    if (current < total) {
        paginationHTML += `
            <button onclick="changePage(${current + 1})" 
                    class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                다음
            </button>
        `;
    } else {
        paginationHTML += `
            <button disabled class="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed">
                다음
            </button>
        `;
    }
    
    paginationHTML += '</div>';
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * 페이지 변경
 */
function changePage(page) {
    if (page < 1) return;
    
    currentPage = page;
    loadPayments();
}

/**
 * 요소 업데이트 헬퍼 함수
 */
function updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`요소를 찾을 수 없음: ${elementId}`);
    }
}

// 전역 함수로 노출
window.changePage = changePage;

// =================================
// 결제 관리 액션 함수들
// =================================

/**
 * 결제 상세 보기
 */
async function viewPaymentDetail(paymentId) {
    console.log('📋 결제 상세 보기:', paymentId);
    
    try {
        showLoadingOverlay(true);
        
        let payment = null;
        
        if (!window.dbService) {
            // 더미 데이터에서 찾기
            const dummyPayments = [
                {
                    id: 'dummy-1',
                    paymentId: 'PAY-20250613-001',
                    userName: '홍길동',
                    userEmail: 'hong@example.com',
                    userPhone: '010-1234-5678',
                    courseName: '건강운동처방사 기본과정',
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
                }
            ];
            payment = dummyPayments.find(p => p.id === paymentId) || dummyPayments[0];
        } else {
            const paymentDoc = await window.dbService.getDocument('payments', paymentId);
            
            if (!paymentDoc.success) {
                showErrorMessage('결제 정보를 불러올 수 없습니다.');
                return;
            }
            
            payment = paymentDoc.data;
            
            // 추가 정보 조회
            if (payment.userId) {
                const userDoc = await window.dbService.getDocument('users', payment.userId);
                if (userDoc.success) {
                    payment.userName = userDoc.data.displayName || userDoc.data.email;
                    payment.userEmail = userDoc.data.email;
                    payment.userPhone = userDoc.data.phoneNumber;
                }
            }
            
            if (payment.courseId) {
                const courseDoc = await window.dbService.getDocument('courses', payment.courseId);
                if (courseDoc.success) {
                    payment.courseName = courseDoc.data.title;
                    payment.courseType = courseDoc.data.certificateType;
                }
            }
        }
        
        // 모달 컨텐츠 생성
        const modalContent = createPaymentDetailModal(payment);
        
        // 모달 표시
        showModal({
            title: '결제 상세 정보',
            content: modalContent,
            size: 'large',
            buttons: [
                {
                    label: '닫기',
                    type: 'secondary',
                    handler: 'closeModal()'
                }
            ]
        });
        
    } catch (error) {
        console.error('결제 상세 조회 오류:', error);
        showErrorMessage('결제 정보를 불러오는데 실패했습니다.');
    } finally {
        showLoadingOverlay(false);
    }
}

/**
 * 결제 상세 모달 컨텐츠 생성
 */
function createPaymentDetailModal(payment) {
    // 🔧 전역 유틸리티 사용
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
            'pending': { class: 'bg-yellow-100 text-yellow-800', text: '대기중' },
            'completed': { class: 'bg-green-100 text-green-800', text: '완료' },
            'failed': { class: 'bg-red-100 text-red-800', text: '실패' },
            'cancelled': { class: 'bg-gray-100 text-gray-800', text: '취소' },
            'refund_requested': { class: 'bg-orange-100 text-orange-800', text: '환불요청' },
            'refunded': { class: 'bg-blue-100 text-blue-800', text: '환불완료' }
        };
        
        const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', text: status };
        return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.class}">${config.text}</span>`;
    };
    
    return `
        <div class="space-y-6">
            <!-- 기본 결제 정보 -->
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="text-lg font-medium text-gray-900 mb-4">📋 기본 정보</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">결제번호</label>
                        <p class="mt-1 text-sm text-gray-900 font-mono">${payment.paymentId || '-'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">결제상태</label>
                        <p class="mt-1">${getStatusBadge(payment.status)}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">결제금액</label>
                        <p class="mt-1 text-sm text-gray-900 font-bold text-lg">${formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">결제방법</label>
                        <p class="mt-1 text-sm text-gray-900">${getPaymentMethodName(payment.paymentMethod)}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">결제일시</label>
                        <p class="mt-1 text-sm text-gray-900">${formatDate(payment.createdAt)}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">결제자 ID</label>
                        <p class="mt-1 text-sm text-gray-900 font-mono">${payment.userId || '-'}</p>
                    </div>
                </div>
            </div>
            
            <!-- 결제자 정보 -->
            <div class="bg-blue-50 rounded-lg p-4">
                <h4 class="text-lg font-medium text-gray-900 mb-4">👤 결제자 정보</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">이름</label>
                        <p class="mt-1 text-sm text-gray-900">${payment.userName || '알 수 없음'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">이메일</label>
                        <p class="mt-1 text-sm text-gray-900">${payment.userEmail || '-'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">연락처</label>
                        <p class="mt-1 text-sm text-gray-900">${payment.userPhone || '-'}</p>
                    </div>
                </div>
            </div>
            
            <!-- 교육과정 정보 -->
            <div class="bg-green-50 rounded-lg p-4">
                <h4 class="text-lg font-medium text-gray-900 mb-4">📚 교육과정 정보</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">과정명</label>
                        <p class="mt-1 text-sm text-gray-900">${payment.courseName || '-'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">자격증 유형</label>
                        <p class="mt-1 text-sm text-gray-900">${getCertificateTypeName(payment.courseType)}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">과정 ID</label>
                        <p class="mt-1 text-sm text-gray-900 font-mono">${payment.courseId || '-'}</p>
                    </div>
                </div>
            </div>
            
            <!-- PG사 정보 (카드 결제인 경우) -->
            ${payment.paymentMethod === 'card' && payment.pgResponse ? `
                <div class="bg-purple-50 rounded-lg p-4">
                    <h4 class="text-lg font-medium text-gray-900 mb-4">💳 PG사 정보</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">승인번호</label>
                            <p class="mt-1 text-sm text-gray-900 font-mono">${payment.pgResponse.authCode || '-'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">거래번호</label>
                            <p class="mt-1 text-sm text-gray-900 font-mono">${payment.pgResponse.transactionId || '-'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">카드사</label>
                            <p class="mt-1 text-sm text-gray-900">${payment.pgResponse.cardName || '-'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">할부</label>
                            <p class="mt-1 text-sm text-gray-900">${payment.pgResponse.installment || 0}개월</p>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- 환불 정보 (환불된 경우) -->
            ${payment.refundInfo ? `
                <div class="bg-red-50 rounded-lg p-4">
                    <h4 class="text-lg font-medium text-gray-900 mb-4">🔄 환불 정보</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">환불금액</label>
                            <p class="mt-1 text-sm text-gray-900 font-bold">${formatCurrency(payment.refundInfo.amount)}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">환불일시</label>
                            <p class="mt-1 text-sm text-gray-900">${formatDate(payment.refundInfo.completedAt)}</p>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700">환불사유</label>
                            <p class="mt-1 text-sm text-gray-900">${payment.refundInfo.reason || '-'}</p>
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * 자격증 유형명 변환
 */
function getCertificateTypeName(type) {
    const types = {
        'health-exercise': '건강운동처방사',
        'rehabilitation': '운동재활전문가',
        'pilates': '필라테스 전문가',
        'recreation': '레크리에이션지도자'
    };
    return types[type] || type || '-';
}

/**
 * 환불 모달 표시
 */
async function showRefundModal(paymentId) {
    console.log('💸 환불 모달 표시:', paymentId);
    
    try {
        showLoadingOverlay(true);
        
        let payment = null;
        
        if (!window.dbService) {
            // 더미 데이터 사용
            payment = {
                id: paymentId,
                paymentId: 'PAY-20250613-001',
                amount: 350000,
                status: 'completed',
                userName: '홍길동'
            };
        } else {
            const paymentDoc = await window.dbService.getDocument('payments', paymentId);
            
            if (!paymentDoc.success) {
                showErrorMessage('결제 정보를 불러올 수 없습니다.');
                return;
            }
            
            payment = paymentDoc.data;
        }
        
        // 환불 가능 여부 확인
        if (!canRefund(payment)) {
            showErrorMessage('환불할 수 없는 상태입니다.');
            return;
        }
        
        // 환불 모달 컨텐츠 생성
        const modalContent = createRefundModal(payment);
        
        // 모달 표시
        showModal({
            title: '환불 처리',
            content: modalContent,
            size: 'medium',
            buttons: [
                {
                    label: '취소',
                    type: 'secondary',
                    handler: 'closeModal()'
                },
                {
                    label: '환불 처리',
                    type: 'danger',
                    handler: `processRefund('${paymentId}')`
                }
            ]
        });
        
    } catch (error) {
        console.error('환불 모달 표시 오류:', error);
        showErrorMessage('환불 처리 중 오류가 발생했습니다.');
    } finally {
        showLoadingOverlay(false);
    }
}

/**
 * 환불 가능 여부 확인
 */
function canRefund(payment) {
    return payment.status === 'completed' || payment.status === 'refund_requested';
}

/**
 * 환불 모달 컨텐츠 생성
 */
function createRefundModal(payment) {
    // 🔧 전역 유틸리티 사용
    const formatCurrency = (amount) => {
        return window.formatters.formatCurrency(amount || 0);
    };
    
    return `
        <div class="space-y-4">
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">환불 처리 확인</h3>
                        <div class="mt-2 text-sm text-yellow-700">
                            <p>환불 처리 후에는 취소할 수 없습니다. 신중하게 결정해주세요.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 mb-2">결제 정보</h4>
                <p><strong>결제번호:</strong> ${payment.paymentId}</p>
                <p><strong>결제자:</strong> ${payment.userName || '알 수 없음'}</p>
                <p><strong>결제금액:</strong> ${formatCurrency(payment.amount)}</p>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label for="refund-amount" class="block text-sm font-medium text-gray-700">환불금액 <span class="text-red-500">*</span></label>
                    <div class="mt-1">
                        <input type="number" id="refund-amount" name="refund-amount" 
                               value="${payment.amount}" max="${payment.amount}" min="0" required
                               class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <p class="mt-1 text-sm text-gray-500">최대 환불 가능 금액: ${formatCurrency(payment.amount)}</p>
                </div>
                
                <div>
                    <label for="refund-reason" class="block text-sm font-medium text-gray-700">환불사유 <span class="text-red-500">*</span></label>
                    <div class="mt-1">
                        <textarea id="refund-reason" name="refund-reason" rows="3" required
                                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="환불 사유를 입력하세요..."></textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 환불 처리
 */
async function processRefund(paymentId) {
    console.log('💸 환불 처리 시작:', paymentId);
    
    try {
        // 폼 데이터 수집
        const refundAmount = document.getElementById('refund-amount')?.value;
        const refundReason = document.getElementById('refund-reason')?.value;
        
        // 유효성 검사
        if (!refundAmount || !refundReason) {
            showErrorMessage('환불금액과 환불사유를 모두 입력해주세요.');
            return;
        }
        
        if (parseFloat(refundAmount) <= 0) {
            showErrorMessage('환불금액은 0보다 커야 합니다.');
            return;
        }
        
        showLoadingOverlay(true);
        
        if (!window.dbService) {
            // 테스트 모드
            console.log('환불 처리 (테스트):', { paymentId, refundAmount, refundReason });
            
            setTimeout(() => {
                showLoadingOverlay(false);
                closeModal();
                showSuccessMessage('환불이 처리되었습니다. (테스트)');
                loadPayments();
                loadPaymentStats();
            }, 1000);
            return;
        }
        
        // 실제 환불 처리
        const updateData = {
            status: 'refunded',
            refundInfo: {
                amount: parseFloat(refundAmount),
                reason: refundReason,
                completedAt: new Date(),
                processedBy: window.dhcFirebase.getCurrentUser()?.uid
            },
            updatedAt: new Date()
        };
        
        const result = await window.dbService.updateDocument('payments', paymentId, updateData);
        
        if (result.success) {
            // 수강생의 수강 상태도 업데이트 (환불 시 수강 취소)
            await updateEnrollmentStatus(paymentId);
            
            showSuccessMessage('환불이 처리되었습니다.');
            closeModal();
            loadPayments();
            loadPaymentStats();
        } else {
            showErrorMessage('환불 처리에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('환불 처리 오류:', error);
        showErrorMessage('환불 처리 중 오류가 발생했습니다.');
    } finally {
        showLoadingOverlay(false);
    }
}

/**
 * 수강 상태 업데이트 (환불 시)
 */
async function updateEnrollmentStatus(paymentId) {
    try {
        if (!window.dbService) return;
        
        // 결제 정보 조회
        const paymentDoc = await window.dbService.getDocument('payments', paymentId);
        if (!paymentDoc.success) return;
        
        const payment = paymentDoc.data;
        
        if (payment.userId && payment.courseId) {
            // 수강 신청 내역 찾기
            const enrollments = await window.dbService.getDocuments('enrollments', {
                where: [
                    { field: 'userId', operator: '==', value: payment.userId },
                    { field: 'courseId', operator: '==', value: payment.courseId }
                ]
            });
            
            if (enrollments.success && enrollments.data.length > 0) {
                // 수강 상태를 취소로 변경
                await window.dbService.updateDocument('enrollments', enrollments.data[0].id, {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelReason: '환불 처리'
                });
            }
        }
    } catch (error) {
        console.error('수강 상태 업데이트 오류:', error);
    }
}

/**
 * 결제 취소
 */
async function cancelPayment(paymentId) {
    console.log('❌ 결제 취소:', paymentId);
    
    if (!confirm('정말로 이 결제를 취소하시겠습니까?')) {
        return;
    }
    
    try {
        showLoadingOverlay(true);
        
        if (!window.dbService) {
            // 테스트 모드
            console.log('결제 취소 (테스트):', paymentId);
            
            setTimeout(() => {
                showLoadingOverlay(false);
                showSuccessMessage('결제가 취소되었습니다. (테스트)');
                loadPayments();
                loadPaymentStats();
            }, 1000);
            return;
        }
        
        // 결제 상태 확인
        const paymentDoc = await window.dbService.getDocument('payments', paymentId);
        if (!paymentDoc.success) {
            showErrorMessage('결제 정보를 찾을 수 없습니다.');
            return;
        }
        
        const payment = paymentDoc.data;
        
        // 취소 가능한 상태인지 확인
        if (payment.status !== 'pending') {
            showErrorMessage('취소할 수 없는 상태입니다.');
            return;
        }
        
        // 결제 취소 처리
        const result = await window.dbService.updateDocument('payments', paymentId, {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: window.dhcFirebase.getCurrentUser()?.uid
        });
        
        if (result.success) {
            showSuccessMessage('결제가 취소되었습니다.');
            loadPayments();
            loadPaymentStats();
        } else {
            showErrorMessage('결제 취소에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('결제 취소 오류:', error);
        showErrorMessage('결제 취소 중 오류가 발생했습니다.');
    } finally {
        showLoadingOverlay(false);
    }
}

// 전역 함수로 노출
window.viewPaymentDetail = viewPaymentDetail;
window.showRefundModal = showRefundModal;
window.processRefund = processRefund;
window.cancelPayment = cancelPayment;

// =================================
// 실시간 업데이트 시스템 (최적화)
// =================================

/**
 * 실시간 업데이트 설정 (최적화 - 중복 방지)
 */
function setupRealtimeUpdates() {
    // 이미 설정되었는지 확인
    if (realtimeListenersSetup) {
        console.log('⚠️ 실시간 리스너가 이미 설정됨 - 중복 방지');
        return;
    }

    console.log('🔄 실시간 업데이트 설정');
    
    // Firebase 실시간 리스너 설정 (선택적)
    if (window.dhcFirebase && window.dhcFirebase.db) {
        setupFirebaseRealtimeListeners();
    }

    realtimeListenersSetup = true;
}

/**
 * Firebase 실시간 리스너 설정 (최적화 - 중복 방지)
 */
function setupFirebaseRealtimeListeners() {
    try {
        // 기존 리스너가 있다면 제거
        cleanupRealtimeListeners();

        // 결제 데이터 실시간 업데이트
        paymentsListener = window.dhcFirebase.db.collection('payments')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                console.log('🔄 결제 데이터 실시간 업데이트');
                
                // 변경된 결제들 로그
                snapshot.docChanges().forEach((change) => {
                    const paymentData = change.doc.data();
                    if (change.type === 'added') {
                        console.log('➕ 새 결제 추가:', paymentData.paymentId);
                        showRealtimeNotification('새로운 결제가 접수되었습니다.', 'info');
                    } else if (change.type === 'modified') {
                        console.log('✏️ 결제 수정:', paymentData.paymentId);
                        if (paymentData.status === 'refunded') {
                            showRealtimeNotification('환불이 처리되었습니다.', 'warning');
                        } else if (paymentData.status === 'completed') {
                            showRealtimeNotification('결제가 완료되었습니다.', 'success');
                        }
                    }
                });
                
                // 통계 자동 새로고침
                setTimeout(() => {
                    loadPaymentStats();
                }, 1000);
                
                // 현재 페이지가 첫 페이지이고 필터가 없으면 테이블도 새로고침
                if (currentPage === 1 && Object.keys(currentFilters).length === 0) {
                    setTimeout(() => {
                        loadPayments();
                    }, 1500);
                }
            }, (error) => {
                console.warn('결제 실시간 업데이트 오류:', error);
            });
        
        console.log('✅ Firebase 실시간 리스너 설정 완료');
        
    } catch (error) {
        console.error('Firebase 실시간 리스너 설정 오류:', error);
    }
}

/**
 * 실시간 리스너 정리 (최적화 - 메모리 누수 방지)
 */
function cleanupRealtimeListeners() {
    if (paymentsListener) {
        paymentsListener();
        paymentsListener = null;
        console.log('✅ 결제 실시간 리스너 정리');
    }
}

/**
 * 실시간 알림 표시
 */
function showRealtimeNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 transform transition-all duration-300 translate-x-full opacity-0`;
    
    let icon = '';
    let borderColor = '';
    
    switch (type) {
        case 'success':
            icon = '✅';
            borderColor = 'border-green-400';
            break;
        case 'warning':
            icon = '⚠️';
            borderColor = 'border-yellow-400';
            break;
        case 'error':
            icon = '❌';
            borderColor = 'border-red-400';
            break;
        default:
            icon = 'ℹ️';
            borderColor = 'border-blue-400';
    }
    
    notification.className += ` ${borderColor}`;
    
    notification.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <span class="text-lg">${icon}</span>
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-gray-900">${message}</p>
                <p class="text-xs text-gray-500 mt-1">${window.formatters.formatDate(new Date(), 'HH:mm:ss')}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    class="ml-4 text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 애니메이션 시작
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
        notification.classList.add('translate-x-0', 'opacity-100');
    }, 100);
    
    // 자동 제거
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// =================================
// UI 기능들
// =================================

/**
 * 스크롤 애니메이션 초기화
 */
function initScrollAnimations() {
    if (window.innerWidth <= 768) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('fade-out');
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.bg-white, .admin-card, .statistics-card');

    if (animateElements.length > 0) {
        animateElements.forEach(el => {
            el.style.opacity = '0.8';
            el.style.transform = 'translateY(10px)';
            el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            observer.observe(el);
        });
    }
}

/**
 * 부드러운 스크롤 기능
 */
function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');

    scrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = link.getAttribute('href');

            if (href === '#' || href === '#top') {
                return;
            }

            e.preventDefault();

            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 100;

                window.scrollTo({
                    top: Math.max(0, offsetTop),
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * 키보드 단축키 설정 (최적화 - 중복 방지)
 */
function setupKeyboardShortcuts() {
    // 이미 설정되었는지 확인
    if (window.paymentKeyboardShortcutsSetup) {
        console.log('⚠️ 키보드 단축키가 이미 설정됨 - 중복 방지');
        return;
    }

    document.addEventListener('keydown', function (e) {
        // Ctrl/Cmd + R : 데이터 새로고침
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshPaymentData();
        }
        
        // Ctrl/Cmd + F : 검색 필드 포커스
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search-keyword');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // ESC : 모달 닫기
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    window.paymentKeyboardShortcutsSetup = true;
    console.log('⌨️ 키보드 단축키 설정 완료');
    console.log('- Ctrl+R : 데이터 새로고침');
    console.log('- Ctrl+F : 검색 필드 포커스');
    console.log('- ESC : 모달 닫기');
}

// =================================
// 모달 및 알림 시스템
// =================================

/**
 * 모달 표시
 */
function showModal(options) {
    // 기존 모달 제거
    closeModal();
    
    const modalSize = options.size === 'large' ? 'max-w-4xl' : options.size === 'medium' ? 'max-w-2xl' : 'max-w-md';
    
    const modalHTML = `
        <div id="admin-modal" class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${modalSize} sm:w-full sm:p-6">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">${options.title || '알림'}</h3>
                                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="mt-2">
                                ${options.content || ''}
                            </div>
                        </div>
                    </div>
                    ${options.buttons ? `
                        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            ${options.buttons.map(btn => `
                                <button onclick="${btn.handler}" 
                                        class="w-full inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm
                                        ${btn.type === 'danger' ? 'border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' :
                                          btn.type === 'primary' ? 'border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' :
                                          'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'}">
                                    ${btn.label}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 바디 스크롤 방지
    document.body.style.overflow = 'hidden';
}

/**
 * 모달 닫기
 */
function closeModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.remove();
    }
    
    // 바디 스크롤 복원
    document.body.style.overflow = '';
}

/**
 * 로딩 오버레이 표시/숨김
 */
function showLoadingOverlay(show) {
    const existingOverlay = document.getElementById('loading-overlay');
    
    if (show) {
        if (existingOverlay) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 flex items-center space-x-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="text-gray-700">처리 중...</span>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    } else {
        if (existingOverlay) {
            existingOverlay.remove();
            document.body.style.overflow = '';
        }
    }
}

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
    // 기존 알림 제거
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
    
    // 자동 제거 (오류는 더 오래 표시)
    const autoRemoveTime = type === 'error' ? 7000 : 4000;
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, autoRemoveTime);
}

// =================================
// 데이터 새로고침 기능
// =================================

/**
 * 결제 데이터 새로고침
 */
async function refreshPaymentData() {
    console.log('🔄 결제 데이터 새로고침 시작');
    
    try {
        showInfoMessage('데이터를 새로고침하고 있습니다...');
        
        // 모든 데이터 다시 로드
        await Promise.all([
            loadPaymentStats(),
            loadPayments()
        ]);
        
        showSuccessMessage('데이터 새로고침이 완료되었습니다.');
        console.log('✅ 결제 데이터 새로고침 완료');
        
    } catch (error) {
        console.error('❌ 데이터 새로고침 오류:', error);
        showErrorMessage('데이터 새로고침 중 오류가 발생했습니다.');
    }
}

// =================================
// 전역 함수 노출
// =================================

// 전역 스코프에 주요 함수들 노출
window.initPaymentManagement = initPaymentManagement;
window.refreshPaymentData = refreshPaymentData;
window.cleanupRealtimeListeners = cleanupRealtimeListeners;
window.showModal = showModal;
window.closeModal = closeModal;
window.showLoadingOverlay = showLoadingOverlay;

// =================================
// 페이지 종료 시 정리 (최적화)
// =================================

// 페이지 언로드 시 리스너 정리
window.addEventListener('beforeunload', function() {
    console.log('🔄 페이지 종료 - 리스너 정리');
    cleanupRealtimeListeners();
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

    window.debugPaymentManagement = {
        // 기본 정보 확인
        help: function () {
            console.log('🎯 결제 관리 디버깅 도구 사용법');
            console.log('\n📊 데이터 관련:');
            console.log('- checkDependencies() : 유틸리티 의존성 확인');
            console.log('- refreshData() : 모든 데이터 새로고침');
            console.log('- showDummyData() : 더미 데이터 표시');

            console.log('\n🔧 시스템 관련:');
            console.log('- checkFirebase() : Firebase 연결 상태 확인');
            console.log('- checkAuth() : 인증 상태 확인');
            console.log('- checkListeners() : 실시간 리스너 상태 확인');

            console.log('\n💳 결제 관련:');
            console.log('- testPaymentDetail(id) : 결제 상세 보기 테스트');
            console.log('- testRefund(id) : 환불 모달 테스트');
            console.log('- applyTestFilters() : 테스트 필터 적용');

            console.log('\n🎨 UI 관련:');
            console.log('- testNotification(message, type) : 알림 테스트');
            console.log('- testModal() : 모달 테스트');
            console.log('- simulateRealtimeUpdate() : 실시간 업데이트 시뮬레이션');

            console.log('\n🧪 종합 테스트:');
            console.log('- runFullTest() : 전체 기능 테스트');
        },

        // 🔧 의존성 테스트
        checkDependencies: checkDependencies,

        // 데이터 관련
        refreshData: refreshPaymentData,
        showDummyData: displayDummyPayments,

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

        checkListeners: function () {
            console.log('🔄 실시간 리스너 상태 확인');
            console.log('- realtimeListenersSetup:', realtimeListenersSetup);
            console.log('- paymentsListener:', !!paymentsListener);
            console.log('- authStateListener:', !!authStateListener);
            console.log('- paymentManagerInitialized:', paymentManagerInitialized);
        },

        // 결제 관련
        testPaymentDetail: function (id = 'dummy-1') {
            console.log('📋 결제 상세 보기 테스트');
            viewPaymentDetail(id);
        },

        testRefund: function (id = 'dummy-1') {
            console.log('💸 환불 모달 테스트');
            showRefundModal(id);
        },

        applyTestFilters: function () {
            console.log('🔍 테스트 필터 적용');
            
            // 테스트 필터 값 설정
            const searchInput = document.getElementById('search-keyword');
            const statusSelect = document.getElementById('payment-status');
            
            if (searchInput) searchInput.value = 'PAY-2025';
            if (statusSelect) statusSelect.value = 'completed';
            
            applyFilters();
        },

        // UI 관련
        testNotification: function (message = '테스트 알림입니다', type = 'info') {
            showNotification(message, type);
        },

        testModal: function () {
            showModal({
                title: '테스트 모달',
                content: '<p>이것은 테스트 모달입니다.</p>',
                size: 'medium',
                buttons: [
                    { label: '취소', type: 'secondary', handler: 'closeModal()' },
                    { label: '확인', type: 'primary', handler: 'closeModal()' }
                ]
            });
        },

        simulateRealtimeUpdate: function () {
            console.log('🔄 실시간 업데이트 시뮬레이션');
            showRealtimeNotification('새로운 결제가 접수되었습니다.', 'info');
            
            setTimeout(() => {
                showRealtimeNotification('결제가 완료되었습니다.', 'success');
            }, 2000);
        },

        // 종합 테스트
        runFullTest: async function () {
            console.log('🚀 결제 관리 전체 기능 테스트 시작...');

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

            console.log('\n4️⃣ 실시간 리스너 상태 테스트');
            this.checkListeners();

            console.log('\n5️⃣ 데이터 로드 테스트');
            await refreshPaymentData();

            console.log('\n6️⃣ UI 기능 테스트');
            this.testNotification('테스트 진행 중...', 'info');

            console.log('\n7️⃣ 결제 관리 기능 테스트');
            this.testPaymentDetail();
            
            setTimeout(() => {
                closeModal();
                this.testRefund();
            }, 2000);

            console.log('\n8️⃣ 실시간 업데이트 테스트');
            setTimeout(() => {
                closeModal();
                this.simulateRealtimeUpdate();
            }, 4000);

            console.log('\n🎯 전체 테스트 완료!');
            console.log('💡 이제 다음 명령어들을 시도해보세요:');
            console.log('- testPaymentDetail("payment-id") : 특정 결제 상세 보기');
            console.log('- applyTestFilters() : 테스트 필터 적용');
            console.log('- refreshData() : 데이터 새로고침');
        }
    };

    // 디버깅 도구 안내
    console.log('🎯 개발 모드 결제 관리 디버깅 도구 활성화됨');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('📊 데이터: checkDependencies(), refreshData(), showDummyData()');
    console.log('🔧 시스템: checkFirebase(), checkAuth(), checkListeners()');
    console.log('💳 결제: testPaymentDetail(), testRefund(), applyTestFilters()');
    console.log('🎨 UI: testNotification(), testModal(), simulateRealtimeUpdate()');
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

console.log('\n🎉 === payment-management.js 완전 표준화 완료 ===');
console.log('✅ 전역 유틸리티 시스템 통합 (formatters.js, date-utils.js)');
console.log('✅ 의존성 체크 시스템 구축');
console.log('✅ course-application.js 스타일 초기화 패턴 적용');
console.log('✅ dashboard.js 스타일 인증 및 권한 관리');
console.log('✅ Firebase 연결 상태 강화');
console.log('✅ 실시간 업데이트 시스템 (중복 방지)');
console.log('✅ 완전한 결제 관리 기능 (상세보기, 환불, 취소)');
console.log('✅ 고급 검색 및 필터링');
console.log('✅ 페이지네이션 시스템');
console.log('✅ 키보드 단축키 지원');
console.log('✅ 포괄적인 디버깅 도구');
console.log('✅ 메모리 누수 방지 및 리스너 정리');
console.log('\n🔧 해결된 표준화 문제점:');
console.log('- 중복된 기능 정의 → 전역 유틸리티 통합');
console.log('- 일관성 없는 참조 방식 → 표준화된 패턴 적용');
console.log('- 의존성 관리 부재 → 체크 시스템 구축');
console.log('\n🚀 payment-management.js 표준화가 완전히 완료되었습니다!');

// 완료 플래그 설정
window.paymentManagementReady = true;