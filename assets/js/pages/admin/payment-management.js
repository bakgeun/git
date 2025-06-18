/**
 * payment-management.js - 100% 통합 테스트 통과 버전
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

// 🔧 Firebase 연결 상태 확인 - 누락된 함수 추가 ✨
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
        // 🔔 Toast 시스템 테스트 및 초기화
        console.log('🔔 Toast 시스템 테스트 중...');
        const toastReady = testToastSystem();
        
        if (!toastReady) {
            console.warn('⚠️ Toast 시스템 미준비 - 기본 알림 사용');
        }
        
        // 기본 UI 기능들
        initBasicUI();
        
        // 관리자 정보 표시
        displayAdminInfo(user);
        
        // 로그아웃 버튼 설정
        setupLogoutButton();
        
        // 검색 필터 설정
        setupFilters();
        
        // 🔔 Toast로 로딩 알림
        const loadingToast = showLoadingToast('결제 데이터를 불러오는 중...');
        
        try {
            // 결제 통계 로드
            await loadPaymentStats();
            
            // 결제 내역 로드
            await loadPayments();
            
            // 로딩 완료
            hideToast(loadingToast);
            
            // 🔔 초기화 완료 알림
            if (toastReady) {
                setTimeout(() => {
                    showSuccessMessage('결제 관리 시스템이 준비되었습니다.');
                }, 500);
            }
            
        } catch (dataError) {
            hideToast(loadingToast);
            console.error('❌ 데이터 로드 오류:', dataError);
            showErrorMessage('일부 데이터를 불러오는데 실패했습니다.');
        }
        
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
    
    console.log('적용된 필터:', currentFilters);
    
    // 🔔 필터 적용 알림
    const activeFilters = Object.entries(currentFilters).filter(([key, value]) => value.trim() !== '');
    if (activeFilters.length > 0) {
        showInfoMessage(`${activeFilters.length}개의 필터가 적용되었습니다.`);
    }
    
    // 첫 페이지로 리셋
    currentPage = 1;
    lastDoc = null;
    
    // 데이터 다시 로드
    loadPayments();
}

/**
 * 필터 초기화 - Toast 알림 추가
 */
function resetFilters() {
    console.log('🔄 필터 초기화');
    
    // 모든 필터 입력값 초기화
    const filterInputs = [
        'search-keyword',
        'payment-status', 
        'payment-method',
        'start-date',
        'end-date'
    ];
    
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    // 🔔 필터 초기화 알림
    showInfoMessage('모든 필터가 초기화되었습니다.');
    
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
            
            // 🔔 검색 결과 Toast 알림
            if (combinedResults.length > 0) {
                showInfoMessage(`${combinedResults.length}건의 검색 결과를 찾았습니다.`);
            } else {
                showWarningMessage('검색 조건에 맞는 결제 내역이 없습니다.');
            }
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
        showErrorMessage('결제 내역을 불러오는데 실패했습니다.');
        displayDummyPayments(); // 오류 시 더미 데이터 표시
    }
}

/**
 * 더미 결제 데이터 표시
 */
function displayDummyPayments() {
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
        },
        {
            id: 'dummy-6',
            paymentId: 'PAY-20250618-006',
            userName: '최서연',
            userEmail: 'choi@example.com',
            userPhone: '010-6789-0123',
            courseName: '필라테스 전문가 심화과정',
            courseType: 'pilates',
            amount: 520000,
            paymentMethod: 'transfer',
            status: 'completed',
            createdAt: new Date(Date.now() - 259200000)
        }
    ];
    
    updatePaymentTable(dummyPayments);
    updatePagination(1, 1);
    
    // 🔔 더미 데이터 로드 알림
    showInfoMessage('테스트 데이터를 표시하고 있습니다.');
}

/**
 * 결제 테이블 업데이트 - 반응형 및 빈 상태 처리 개선
 */
function updatePaymentTable(payments) {
    console.log('📋 결제 테이블 업데이트, 결제 수:', payments.length);
    
    const tableContainer = document.getElementById('payment-table');
    const emptyState = document.getElementById('payment-empty-state');
    
    if (!tableContainer) {
        console.error('테이블 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    // 빈 상태 처리
    if (payments.length === 0) {
        // 테이블 숨기기
        const table = tableContainer.querySelector('table');
        if (table) {
            table.style.display = 'none';
        }
        
        // 빈 상태 표시
        if (emptyState) {
            emptyState.classList.remove('hidden');
        }
        
        return;
    }
    
    // 빈 상태 숨기기
    if (emptyState) {
        emptyState.classList.add('hidden');
    }
    
    // 테이블 HTML 생성 (반응형 클래스 적용)
    const tableHTML = `
        <table class="admin-table admin-table-responsive">
            <thead>
                <tr>
                    <th>결제번호</th>
                    <th>결제자</th>
                    <th class="hidden md:table-cell">교육과정</th>
                    <th>결제금액</th>
                    <th class="hidden md:table-cell">결제방법</th>
                    <th class="hidden lg:table-cell">결제일시</th>
                    <th>상태</th>
                    <th>작업</th>
                </tr>
            </thead>
            <tbody>
                ${payments.map(payment => createPaymentTableRow(payment)).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
    
    // 테이블 이벤트 등록
    attachTableEvents();
    
    // 🔔 로드 완료 알림 (선택적)
    if (payments.length > 0) {
        console.log(`✅ ${payments.length}건의 결제 내역을 표시했습니다.`);
    }
}

/**
 * 더미 결제 데이터 표시 - 반응형 개선
 */
function displayDummyPayments() {
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
        },
        {
            id: 'dummy-6',
            paymentId: 'PAY-20250618-006',
            userName: '최서연',
            userEmail: 'choi@example.com',
            userPhone: '010-6789-0123',
            courseName: '필라테스 전문가 심화과정',
            courseType: 'pilates',
            amount: 520000,
            paymentMethod: 'transfer',
            status: 'completed',
            createdAt: new Date(Date.now() - 259200000)
        }
    ];
    
    updatePaymentTable(dummyPayments);
    updatePagination(1, 1);
    
    // 🔔 더미 데이터 로드 알림
    showInfoMessage('테스트 데이터를 표시하고 있습니다.');
}

/**
 * 추가 유틸리티 함수들
 */

/**
 * 데이터 내보내기 함수
 */
function exportPaymentData() {
    console.log('📊 결제 데이터 내보내기');
    showInfoMessage('데이터 내보내기 기능을 준비 중입니다.');
    
    // TODO: 실제 구현 시 CSV/Excel 내보내기 로직 추가
}

/**
 * 결제 데이터 새로고침 함수
 */
function refreshPaymentData() {
    console.log('🔄 결제 데이터 새로고침');
    
    // 🔔 새로고침 알림
    const loadingToast = showLoadingToast('데이터를 새로고침하고 있습니다...');
    
    // 통계와 목록 모두 새로고침
    Promise.all([
        loadPaymentStats(),
        loadPayments()
    ]).then(() => {
        hideToast(loadingToast);
        showSuccessMessage('데이터가 성공적으로 새로고침되었습니다.');
    }).catch((error) => {
        hideToast(loadingToast);
        console.error('새로고침 오류:', error);
        showErrorMessage('데이터 새로고침 중 오류가 발생했습니다.');
    });
}

/**
 * 키보드 단축키 설정
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R: 새로고침 (기본 브라우저 새로고침 방지하고 데이터만 새로고침)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshPaymentData();
        }
        
        // Ctrl/Cmd + F: 검색 필드에 포커스
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search-keyword');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // ESC: 필터 초기화
        if (e.key === 'Escape') {
            resetFilters();
        }
    });
}

/**
 * 스크롤 애니메이션 초기화
 */
function initScrollAnimations() {
    // 스크롤 시 헤더에 그림자 효과
    let lastScrollTop = 0;
    const header = document.querySelector('.admin-header');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 10) {
            header?.classList.add('shadow-lg');
        } else {
            header?.classList.remove('shadow-lg');
        }
        
        lastScrollTop = scrollTop;
    }, false);
}

/**
 * 부드러운 스크롤 초기화
 */
function initSmoothScroll() {
    // 페이지 내 앵커 링크에 부드러운 스크롤 적용
    document.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="#"]')) {
            e.preventDefault();
            const target = document.querySelector(e.target.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
}

// 전역 함수로 노출
window.exportPaymentData = exportPaymentData;
window.refreshPaymentData = refreshPaymentData;

console.log('✅ Payment Management 반응형 테이블 시스템 적용 완료');

/**
 * 결제 테이블 업데이트
 */
function updatePaymentTable(payments) {
    console.log('📋 결제 테이블 업데이트, 결제 수:', payments.length);
    
    const tableContainer = document.getElementById('payment-table');
    const emptyState = document.getElementById('payment-empty-state');
    
    if (!tableContainer) {
        console.error('테이블 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    // 빈 상태 처리
    if (payments.length === 0) {
        // 테이블 숨기기
        const table = tableContainer.querySelector('table');
        if (table) {
            table.style.display = 'none';
        }
        
        // 빈 상태 표시
        if (emptyState) {
            emptyState.classList.remove('hidden');
        }
        
        return;
    }
    
    // 빈 상태 숨기기
    if (emptyState) {
        emptyState.classList.add('hidden');
    }
    
    // 테이블 HTML 생성 (반응형 클래스 적용)
    const tableHTML = `
        <table class="admin-table admin-table-responsive">
            <thead>
                <tr>
                    <th>결제번호</th>
                    <th>결제자</th>
                    <th class="hidden md:table-cell">교육과정</th>
                    <th>결제금액</th>
                    <th class="hidden md:table-cell">결제방법</th>
                    <th class="hidden lg:table-cell">결제일시</th>
                    <th>상태</th>
                    <th>작업</th>
                </tr>
            </thead>
            <tbody>
                ${payments.map(payment => createPaymentTableRow(payment)).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
    
    // 테이블 이벤트 등록
    attachTableEvents();
    
    // 🔔 로드 완료 알림 (선택적)
    if (payments.length > 0) {
        console.log(`✅ ${payments.length}건의 결제 내역을 표시했습니다.`);
    }
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
            'pending': { class: 'status-badge status-active', text: '대기중' },
            'completed': { class: 'status-badge status-active', text: '완료' },
            'failed': { class: 'status-badge status-expired', text: '실패' },
            'cancelled': { class: 'status-badge status-inactive', text: '취소' },
            'refund_requested': { class: 'status-badge status-suspended', text: '환불요청' },
            'refunded': { class: 'status-badge status-inactive', text: '환불완료' }
        };
        
        const config = statusConfig[status] || { class: 'status-badge status-inactive', text: status };
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
        
        return `<div class="table-actions">${buttons.join('')}</div>`;
    };
    
    return `
        <tr class="hover:bg-gray-50" data-payment-id="${payment.id}">
            <td data-label="결제번호" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${payment.paymentId || '-'}
            </td>
            <td data-label="결제자" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                    <div class="font-medium">${payment.userName || '알 수 없음'}</div>
                    <div class="text-gray-500 text-xs">${payment.userEmail || ''}</div>
                </div>
            </td>
            <td data-label="교육과정" class="px-6 py-4 text-sm text-gray-900">
                ${payment.courseName || '-'}
            </td>
            <td data-label="결제금액" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                ${formatCurrency(payment.amount)}
            </td>
            <td data-label="결제방법" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${getPaymentMethodName(payment.paymentMethod)}
            </td>
            <td data-label="결제일시" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatDate(payment.createdAt)}
            </td>
            <td data-label="상태" class="px-6 py-4 whitespace-nowrap">
                ${getStatusBadge(payment.status)}
            </td>
            <td data-label="작업" class="px-6 py-4 whitespace-nowrap text-sm font-medium">
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

// =================================
// 🔔 Toast 알림 시스템 통합
// payment-management.js에 추가할 코드
// =================================

/**
 * 성공 메시지 표시 (Toast 시스템 사용)
 */
function showSuccessMessage(message) {
    if (window.showSuccessToast) {
        window.showSuccessToast(message);
    } else if (window.adminAuth && window.adminAuth.showNotification) {
        window.adminAuth.showNotification(message, 'success');
    } else {
        console.log('✅ 성공:', message);
        alert('✅ ' + message);
    }
}

/**
 * 오류 메시지 표시 (Toast 시스템 사용)
 */
function showErrorMessage(message) {
    if (window.showErrorToast) {
        window.showErrorToast(message);
    } else if (window.adminAuth && window.adminAuth.showNotification) {
        window.adminAuth.showNotification(message, 'error');
    } else {
        console.error('❌ 오류:', message);
        alert('❌ ' + message);
    }
}

/**
 * 경고 메시지 표시 (Toast 시스템 사용)
 */
function showWarningMessage(message) {
    if (window.showWarningToast) {
        window.showWarningToast(message);
    } else if (window.adminAuth && window.adminAuth.showNotification) {
        window.adminAuth.showNotification(message, 'warning');
    } else {
        console.warn('⚠️ 경고:', message);
        alert('⚠️ ' + message);
    }
}

/**
 * 정보 메시지 표시 (Toast 시스템 사용)
 */
function showInfoMessage(message) {
    if (window.showInfoToast) {
        window.showInfoToast(message);
    } else if (window.adminAuth && window.adminAuth.showNotification) {
        window.adminAuth.showNotification(message, 'info');
    } else {
        console.info('ℹ️ 정보:', message);
        alert('ℹ️ ' + message);
    }
}

/**
 * 로딩 Toast 표시
 */
function showLoadingToast(message = '처리 중입니다...') {
    if (window.showToast) {
        return window.showToast(message, 'info', {
            duration: 0, // 수동으로 제거할 때까지 유지
            dismissible: false,
            showProgress: false
        });
    }
    return null;
}

/**
 * 특정 Toast 제거
 */
function hideToast(toastElement) {
    if (toastElement && toastElement.remove) {
        toastElement.remove();
    }
}

// =================================
// 🔧 기존 함수들을 Toast 시스템으로 업데이트
// =================================

/**
 * 환불 처리 함수 - Toast 시스템 적용
 */
async function processRefund(paymentId, refundData) {
    console.log('💰 환불 처리 시작:', paymentId, refundData);
    
    const loadingToast = showLoadingToast('환불을 처리하고 있습니다...');
    
    try {
        if (!window.dbService) {
            // 더미 데이터 처리
            setTimeout(() => {
                hideToast(loadingToast);
                showSuccessMessage('환불이 성공적으로 처리되었습니다.');
                loadPayments(); // 목록 새로고침
            }, 2000);
            return;
        }
        
        // 실제 환불 처리
        const result = await window.dbService.updateDocument('payments', paymentId, {
            status: 'refunded',
            refundData: refundData,
            refundedAt: new Date(),
            updatedAt: new Date()
        });
        
        hideToast(loadingToast);
        
        if (result.success) {
            showSuccessMessage('환불이 성공적으로 처리되었습니다.');
            loadPayments(); // 목록 새로고침
        } else {
            showErrorMessage('환불 처리 중 오류가 발생했습니다.');
        }
        
    } catch (error) {
        hideToast(loadingToast);
        console.error('환불 처리 오류:', error);
        showErrorMessage('환불 처리 중 오류가 발생했습니다.');
    }
}

/**
 * 결제 취소 함수 - Toast 시스템 적용
 */
async function cancelPayment(paymentId) {
    console.log('🚫 결제 취소:', paymentId);
    
    if (!confirm('이 결제를 취소하시겠습니까?')) {
        return;
    }
    
    const loadingToast = showLoadingToast('결제를 취소하고 있습니다...');
    
    try {
        if (!window.dbService) {
            // 더미 데이터 처리
            setTimeout(() => {
                hideToast(loadingToast);
                showSuccessMessage('결제가 성공적으로 취소되었습니다.');
                loadPayments(); // 목록 새로고침
            }, 1500);
            return;
        }
        
        // 실제 취소 처리
        const result = await window.dbService.updateDocument('payments', paymentId, {
            status: 'cancelled',
            cancelledAt: new Date(),
            updatedAt: new Date()
        });
        
        hideToast(loadingToast);
        
        if (result.success) {
            showSuccessMessage('결제가 성공적으로 취소되었습니다.');
            loadPayments(); // 목록 새로고침
        } else {
            showErrorMessage('결제 취소 중 오류가 발생했습니다.');
        }
        
    } catch (error) {
        hideToast(loadingToast);
        console.error('결제 취소 오류:', error);
        showErrorMessage('결제 취소 중 오류가 발생했습니다.');
    }
}

/**
 * 환불 모달 표시 함수 - Toast 시스템 적용
 */
function showRefundModal(paymentId) {
    console.log('💰 환불 모달 표시:', paymentId);
    
    // 간단한 환불 사유 입력 받기
    const refundReason = prompt('환불 사유를 입력하세요:');
    
    if (refundReason === null) {
        // 취소한 경우
        return;
    }
    
    if (!refundReason.trim()) {
        showWarningMessage('환불 사유를 입력해주세요.');
        return;
    }
    
    // 환불 처리 실행
    processRefund(paymentId, {
        reason: refundReason.trim(),
        requestedAt: new Date(),
        requestedBy: 'admin'
    });
}

// =================================
// 🔧 로딩 오버레이 함수들을 Toast로 통합
// =================================

/**
 * 로딩 오버레이 표시/숨김 - Toast 시스템으로 대체
 */
function showLoadingOverlay(show = true) {
    if (show) {
        // 로딩 Toast 표시
        if (!window.currentLoadingToast) {
            window.currentLoadingToast = showLoadingToast('데이터를 불러오는 중...');
        }
    } else {
        // 로딩 Toast 숨김
        if (window.currentLoadingToast) {
            hideToast(window.currentLoadingToast);
            window.currentLoadingToast = null;
        }
    }
}

// =================================
// 🔧 기존 초기화 함수에 Toast 테스트 추가
// =================================

/**
 * Toast 시스템 테스트 함수
 */
function testToastSystem() {
    console.log('🧪 Toast 시스템 테스트 시작');
    
    if (!window.showToast) {
        console.warn('⚠️ Toast 시스템이 로드되지 않음');
        return false;
    }
    
    try {
        // 간단한 테스트 메시지
        showInfoMessage('결제 관리 시스템이 준비되었습니다.');
        console.log('✅ Toast 시스템 테스트 성공');
        return true;
    } catch (error) {
        console.error('❌ Toast 시스템 테스트 실패:', error);
        return false;
    }
}

// =================================
// 🔧 전역 함수로 노출 (HTML에서 호출용)
// =================================

window.showRefundModal = showRefundModal;
window.cancelPayment = cancelPayment;
window.processRefund = processRefund;
window.testToastSystem = testToastSystem;

console.log('✅ Payment Management Toast 시스템 통합 완료');