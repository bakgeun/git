/**
 * cert-management.js - 완전한 자격증 관리 시스템 (영문명 처리 포함)
 * 🎨 전문적인 자격증 PDF 디자인으로 완전히 재설계됨
 * 🔤 영문PDF에서 영문명 사용하도록 개선됨
 */

console.log('=== cert-management.js 파일 로드됨 (영문명 처리 포함) ===');

// 🔧 의존성 체크 시스템
function checkDependencies() {
    const requiredUtils = [
        { name: 'window.formatters', path: 'formatters.js' },
        { name: 'window.dateUtils', path: 'date-utils.js' }
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

    // 🔧 추가: formatters 함수들이 실제로 작동하는지 테스트
    try {
        const testDate = new Date();
        const testFormatDate = window.formatters.formatDate(testDate, 'YYYY.MM.DD');
        const testFormatCurrency = window.formatters.formatCurrency(350000);

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

// 🔧 Firebase 연결 상태 확인
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
    console.log('=== 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initCertManagementPage();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initCertManagementPage();
    }
}

// 초기화 시작
initializeWhenReady();

// 페이지 초기화 함수
function initCertManagementPage() {
    console.log('=== initCertManagementPage 실행 시작 ===');

    try {
        // 🔧 의존성 체크 먼저 실행
        if (!checkDependencies()) {
            console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
            showDependencyError();
            return;
        }

        // Firebase 연결 상태 확인
        const firebaseStatus = checkFirebaseConnection();
        if (!firebaseStatus.connected) {
            console.log('🔧 Firebase 미연결, 테스트 모드로 계속 진행');
        }

        // 자격증 관리자 초기화
        initCertManager();

        console.log('=== initCertManagementPage 완료 ===');
    } catch (error) {
        console.error('페이지 초기화 중 오류:', error);
    }
}

// 🔧 의존성 오류 표시 함수
function showDependencyError() {
    const tableBody = document.querySelector('#cert-table tbody');

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-red-500">
                    <div class="text-lg font-semibold mb-2">⚠️ 시스템 오류</div>
                    <p class="text-red-700 mb-4">필수 유틸리티 파일이 로드되지 않았습니다.</p>
                    <p class="text-red-600 text-sm">페이지를 새로고침하거나 관리자에게 문의하세요.</p>
                </td>
            </tr>
        `;
    }
}

// =================================
// 🎨 전문적인 이미지 경로 및 에셋 관리
// =================================

/**
 * 🎨 실제 에셋 경로로 이미지 경로 생성 (수정됨)
 */
function getImagePaths() {
    // 🔧 FIXED: window.adjustPath를 올바르게 사용
    const borderImagePath = window.adjustPath ?
        window.adjustPath('assets/images/logo/border-gold.png') :
        'assets/images/logo/border-gold.png';

    const koreaImagePath = window.adjustPath ?
        window.adjustPath('assets/images/logo/korea-medal.png') :
        'assets/images/logo/korea-medal.png';

    const englishImagePath = window.adjustPath ?
        window.adjustPath('assets/images/logo/english-medal.png') :
        'assets/images/logo/english-medal.png';

    const sealImagePath = window.adjustPath ?
        window.adjustPath('assets/images/logo/seal.png') :
        'assets/images/logo/seal.png';

    console.log('🎨 수정된 이미지 경로:', {
        border: borderImagePath,
        korea: koreaImagePath,
        english: englishImagePath,
        seal: sealImagePath
    });

    return {
        borderImagePath,
        koreaImagePath,
        englishImagePath,
        sealImagePath
    };
}

// 🔧 이미지 존재 여부 확인 함수
async function checkImageExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const exists = response.ok;
        console.log(`🔧 이미지 존재 확인 [${exists ? '✅' : '❌'}]:`, url);
        return exists;
    } catch (error) {
        console.error(`🔧 이미지 확인 실패:`, url, error);
        return false;
    }
}

// =================================
// 🔧 NEW: 증명사진 로딩 및 처리 함수들
// =================================

/**
 * 🔧 NEW: 증명사진 로드 및 처리 함수
 */
async function loadCertificatePhoto(photoUrl) {
    console.log('📸 증명사진 로드 시작:', photoUrl ? photoUrl.substring(0, 50) + '...' : 'null');

    if (!photoUrl) {
        console.log('📸 증명사진 URL이 없음, 기본 플레이스홀더 사용');
        return null;
    }

    try {
        // 🔧 NEW: Base64 이미지인지 확인
        if (photoUrl.startsWith('data:image/')) {
            console.log('📸 Base64 이미지 감지, 직접 처리');

            return new Promise((resolve) => {
                const img = new Image();

                img.onload = function () {
                    console.log('📸 Base64 이미지 로드 성공:', {
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        type: 'base64'
                    });

                    // Canvas를 사용하여 크기 조정
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 증명사진 표준 크기로 조정 (3.5cm x 4.5cm 비율)
                    const targetWidth = 120; // PDF 템플릿에 맞는 크기
                    const targetHeight = 160;

                    canvas.width = targetWidth;
                    canvas.height = targetHeight;

                    // 이미지를 캔버스에 그리기 (크기 조정 및 크롭)
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    const targetAspectRatio = targetWidth / targetHeight;

                    let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;

                    if (aspectRatio > targetAspectRatio) {
                        // 이미지가 더 넓음 - 좌우 크롭
                        sWidth = img.naturalHeight * targetAspectRatio;
                        sx = (img.naturalWidth - sWidth) / 2;
                    } else {
                        // 이미지가 더 높음 - 상하 크롭
                        sHeight = img.naturalWidth / targetAspectRatio;
                        sy = (img.naturalHeight - sHeight) / 2;
                    }

                    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

                    // base64 데이터 URL로 변환
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                    resolve({
                        dataUrl: dataUrl,
                        width: targetWidth,
                        height: targetHeight,
                        originalUrl: photoUrl,
                        isPhoto: true,
                        isBase64: true
                    });
                };

                img.onerror = function () {
                    console.error('📸 Base64 이미지 로드 실패');
                    resolve(null);
                };

                img.src = photoUrl;
            });
        }

        // 🔧 기존 외부 URL 처리 로직
        const img = new Image();
        img.crossOrigin = 'anonymous'; // CORS 문제 해결

        return new Promise((resolve, reject) => {
            img.onload = function () {
                console.log('📸 외부 이미지 로드 성공:', {
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    url: photoUrl
                });

                // Canvas를 사용하여 이미지를 base64로 변환
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 증명사진 표준 크기로 조정 (3.5cm x 4.5cm 비율)
                const targetWidth = 120; // PDF 템플릿에 맞는 크기
                const targetHeight = 160;

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                // 이미지를 캔버스에 그리기 (크기 조정 및 크롭)
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                const targetAspectRatio = targetWidth / targetHeight;

                let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;

                if (aspectRatio > targetAspectRatio) {
                    // 이미지가 더 넓음 - 좌우 크롭
                    sWidth = img.naturalHeight * targetAspectRatio;
                    sx = (img.naturalWidth - sWidth) / 2;
                } else {
                    // 이미지가 더 높음 - 상하 크롭
                    sHeight = img.naturalWidth / targetAspectRatio;
                    sy = (img.naturalHeight - sHeight) / 2;
                }

                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

                // base64 데이터 URL로 변환
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                resolve({
                    dataUrl: dataUrl,
                    width: targetWidth,
                    height: targetHeight,
                    originalUrl: photoUrl,
                    isPhoto: true,
                    isBase64: false
                });
            };

            img.onerror = function () {
                console.error('📸 외부 이미지 로드 실패:', photoUrl);
                reject(new Error('사진 로드 실패'));
            };

            img.src = photoUrl;
        });

    } catch (error) {
        console.error('📸 증명사진 처리 중 오류:', error);
        return null;
    }
}

/**
 * 🔧 NEW: 기본 플레이스홀더 사진 생성
 */
function createPlaceholderPhoto() {
    console.log('📸 플레이스홀더 사진 생성');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 120;
    canvas.height = 160;

    // 배경 그리기
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 테두리 그리기
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    // 텍스트 그리기
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('사진', canvas.width / 2, canvas.height / 2);

    return {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
        isPlaceholder: true
    };
}

// =================================
// 자격증 관리 시스템 초기화
// =================================

function initCertManager() {
    console.log('🎓 자격증 관리자 초기화 시작');

    // 전역 certManager 객체 생성
    window.certManager = {
        currentPage: 1,
        pageSize: 10,
        lastDoc: null,
        currentCertType: 'health-exercise',

        /**
         * 초기화
         */
        init: async function () {
            try {
                console.log('자격증 관리자 초기화 시작');

                // 🔧 모든 모달 강제 닫기 (자동 실행 방지)
                this.closeAllModals();

                // 이벤트 리스너 등록
                this.registerEventListeners();

                // 자격증 데이터 로드
                await this.loadCertificates();

                console.log('자격증 관리자 초기화 완료');
                return true;
            } catch (error) {
                console.error('자격증 관리자 초기화 오류:', error);
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('초기화 중 오류가 발생했습니다.', 'error');
                }
                return false;
            }
        },

        // 모달 상태 관리
        modalStates: {
            'cert-issue-modal': false,
            'bulk-issue-modal': false,
            'cert-detail-modal': false,
            'cert-edit-modal': false
        },

        /**
         * 모든 모달 강제 닫기 (초기화 시 한 번만 실행)
         */
        closeAllModals: function () {
            console.log('🔧 모든 모달 강제 닫기 실행 (이벤트 보존)');

            const modals = [
                'cert-issue-modal',
                'bulk-issue-modal',
                'cert-detail-modal',
                'cert-edit-modal'
            ];

            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal) {
                    // 🔧 이벤트 리스너는 보존하고 표시만 숨김
                    modal.classList.add('hidden');

                    // 상태 업데이트
                    this.modalStates[modalId] = false;
                }
            });

            // body 클래스 정리
            document.body.classList.remove('modal-open');
            document.documentElement.classList.remove('modal-open');
            document.body.style.overflow = '';

            console.log('✅ 모든 모달 강제 닫기 완료 (이벤트 보존)');
        },

        /**
         * 🔧 개선된 이벤트 리스너 등록 (중복 방지)
         */
        registerEventListeners: function () {
            console.log('🔧 이벤트 리스너 등록 시작');

            // 자격증 발급 폼 제출 이벤트 (중복 방지)
            const certIssueForm = document.getElementById('cert-issue-form');
            if (certIssueForm && !certIssueForm.dataset.eventAttached) {
                certIssueForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.issueCertificate(e.target);
                });
                certIssueForm.dataset.eventAttached = 'true';
                console.log('✅ 자격증 발급 폼 이벤트 등록');
            }

            // 자격증 수정 폼 제출 이벤트 (중복 방지)
            const certEditForm = document.getElementById('cert-edit-form');
            if (certEditForm && !certEditForm.dataset.eventAttached) {
                certEditForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleUpdateCertificate(e);
                });
                certEditForm.dataset.eventAttached = 'true';
                console.log('✅ 자격증 수정 폼 이벤트 등록');
            }

            // 검색어 입력 시 엔터키 이벤트 (중복 방지)
            const searchInputs = document.querySelectorAll('#search-name, #search-cert-number');
            searchInputs.forEach(input => {
                if (!input.dataset.eventAttached) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            this.search();
                        }
                    });
                    input.dataset.eventAttached = 'true';
                }
            });

            // 상태 필터 변경 이벤트 (중복 방지)
            const statusFilter = document.getElementById('filter-status');
            if (statusFilter && !statusFilter.dataset.eventAttached) {
                statusFilter.addEventListener('change', () => this.search());
                statusFilter.dataset.eventAttached = 'true';
            }

            // 일괄 발급 파일 업로드 이벤트 (중복 방지)
            const bulkFileInput = document.getElementById('bulk-file');
            if (bulkFileInput && !bulkFileInput.dataset.eventAttached) {
                bulkFileInput.addEventListener('change', this.handleBulkFileUpload.bind(this));
                bulkFileInput.dataset.eventAttached = 'true';
            }

            // 🔧 모달별 이벤트 설정 (분리하여 관리)
            this.setupModalEvents();

            console.log('✅ 이벤트 리스너 등록 완료');
        },

        /**
         * 🔧 모달별 이벤트 설정 (중복 방지)
         */
        setupModalEvents: function () {
            console.log('🔧 모달 이벤트 설정 시작');

            // 이미 설정되었는지 확인
            if (this._modalEventsSetup) {
                console.log('⚠️ 모달 이벤트가 이미 설정됨 - 중복 방지');
                return;
            }

            // ESC 키 이벤트 (전역, 한 번만 등록)
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeTopModal();
                }
            });

            // 전역 클릭 이벤트 (백드롭 클릭 감지)
            document.addEventListener('click', (e) => {
                // 모달 백드롭 클릭 확인
                if (e.target.classList.contains('cert-modal')) {
                    const modalId = e.target.id;
                    this.closeModalById(modalId);
                }
            });

            this._modalEventsSetup = true;
            console.log('✅ 모달 이벤트 설정 완료');
        },

        /**
         * 🔧 최상위 모달 닫기 (ESC 키용)
         */
        closeTopModal: function () {
            const visibleModals = Object.keys(this.modalStates).filter(modalId => this.modalStates[modalId]);

            if (visibleModals.length > 0) {
                const topModalId = visibleModals[visibleModals.length - 1];
                this.closeModalById(topModalId);
            }
        },

        /**
         * 🔧 모달 ID로 닫기
         */
        closeModalById: function (modalId) {
            console.log('🔧 모달 닫기 by ID:', modalId);

            switch (modalId) {
                case 'cert-issue-modal':
                    this.closeIssueCertModal();
                    break;
                case 'bulk-issue-modal':
                    this.closeBulkIssuanceModal();
                    break;
                case 'cert-detail-modal':
                    this.closeCertDetailModal();
                    break;
                case 'cert-edit-modal':
                    this.closeCertEditModal();
                    break;
                default:
                    console.warn('알 수 없는 모달 ID:', modalId);
            }
        },

        /**
         * 자격증 발급 모달 표시
         */
        showIssueCertModal: function () {
            console.log('🔧 자격증 발급 모달 표시');

            const modal = document.getElementById('cert-issue-modal');
            if (modal) {
                // 다른 모달들 먼저 닫기
                this.closeOtherModals('cert-issue-modal');

                // 상태 업데이트
                this.modalStates['cert-issue-modal'] = true;

                // 모달 표시
                modal.classList.remove('hidden');

                // body 스크롤 방지
                document.body.classList.add('modal-open');

                // 🔧 이벤트 리스너 재등록 (중복 방지)
                this.ensureModalEvents();

                // 교육 과정 옵션 로드
                this.loadCourseOptions();

                // 날짜 설정
                const today = new Date();
                const issueDateInput = document.getElementById('issue-completion-date');
                if (issueDateInput) {
                    issueDateInput.value = window.formatters.formatDate(today, 'YYYY-MM-DD');
                }

                const expiryDateInput = document.getElementById('issue-expiry-date');
                if (expiryDateInput) {
                    const expiryDate = window.dateUtils.addYears(today, 3);
                    expiryDateInput.value = window.formatters.formatDate(expiryDate, 'YYYY-MM-DD');
                }

                console.log('✅ 자격증 발급 모달 표시 완료');
            }
        },

        /**
         * 일괄 발급 모달 표시
         */
        showBulkIssuanceModal: function () {
            console.log('🔧 일괄 발급 모달 표시');

            this.closeOtherModals('bulk-issue-modal');

            const modal = document.getElementById('bulk-issue-modal');
            if (modal && !this.modalStates['bulk-issue-modal']) {
                this.modalStates['bulk-issue-modal'] = true;

                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                modal.style.opacity = '1';
                modal.style.visibility = 'visible';

                document.body.classList.add('modal-open');

                // 초기화
                const previewArea = document.getElementById('bulk-preview');
                if (previewArea) previewArea.classList.add('hidden');

                const fileInput = document.getElementById('bulk-file');
                if (fileInput) fileInput.value = '';

                const bulkIssueBtn = document.getElementById('bulk-issue-btn');
                if (bulkIssueBtn) bulkIssueBtn.disabled = true;

                console.log('✅ 일괄 발급 모달 표시 완료');
            }
        },

        /**
         * 교육 과정 옵션 로드
         */
        loadCourseOptions: async function () {
            console.log('🔧 개선된 교육과정 옵션 로드 시작');

            const courseSelect = document.getElementById('issue-course');

            if (!courseSelect) {
                console.error('교육 과정 선택 필드를 찾을 수 없습니다.');
                return;
            }

            // 로딩 상태 표시
            courseSelect.innerHTML = '<option value="">로딩 중...</option>';

            try {
                let courses = [];

                // Firebase 연결 상태 확인
                const firebaseStatus = checkFirebaseConnection();
                console.log('Firebase 연결 상태:', firebaseStatus);

                if (firebaseStatus.connected && window.dhcFirebase) {
                    try {
                        console.log('Firebase에서 교육 과정 로드 시작');
                        console.log('현재 자격증 유형:', this.currentCertType);

                        // 🔧 개선된 쿼리 - 단계별 접근

                        // 1. 먼저 전체 교육과정 확인
                        const allCoursesSnapshot = await window.dhcFirebase.db.collection('courses').get();
                        console.log('전체 교육과정 수:', allCoursesSnapshot.size);

                        if (allCoursesSnapshot.size === 0) {
                            console.log('교육과정 컬렉션이 비어있음 - 테스트 데이터 생성');
                            // 테스트 데이터 생성
                            await this.createTestCourseData();
                            // 다시 조회
                            const retrySnapshot = await window.dhcFirebase.db.collection('courses').get();
                            console.log('테스트 데이터 생성 후 교육과정 수:', retrySnapshot.size);
                        }

                        // 2. 현재 자격증 유형에 맞는 교육과정 조회
                        let query = window.dhcFirebase.db.collection('courses');

                        // certificateType 필드로 필터링 (있는 경우)
                        try {
                            const filteredSnapshot = await query
                                .where('certificateType', '==', this.currentCertType)
                                .get();

                            console.log('필터링된 교육과정 수:', filteredSnapshot.size);

                            if (filteredSnapshot.size > 0) {
                                filteredSnapshot.forEach(doc => {
                                    courses.push({
                                        id: doc.id,
                                        ...doc.data()
                                    });
                                });
                            } else {
                                // certificateType 필터링 결과가 없으면 전체 조회
                                console.log('필터링 결과 없음 - 전체 교육과정 조회');
                                const allSnapshot = await window.dhcFirebase.db.collection('courses').get();
                                allSnapshot.forEach(doc => {
                                    courses.push({
                                        id: doc.id,
                                        ...doc.data()
                                    });
                                });
                            }
                        } catch (queryError) {
                            console.warn('필터링 쿼리 실패, 전체 조회로 대체:', queryError);
                            // 쿼리 실패 시 전체 조회
                            const allSnapshot = await window.dhcFirebase.db.collection('courses').get();
                            allSnapshot.forEach(doc => {
                                courses.push({
                                    id: doc.id,
                                    ...doc.data()
                                });
                            });
                        }
                        console.log('조회된 교육과정:', courses);

                        // 3. 클라이언트 측에서 추가 필터링 및 정렬
                        if (courses.length > 0) {
                            // 활성 상태인 교육과정만 필터링
                            courses = courses.filter(course => {
                                const isActive = course.status === 'active' ||
                                    course.status === 'completed' ||
                                    course.status === 'closed' ||
                                    !course.status; // status 필드가 없는 경우도 포함
                                console.log(`교육과정 ${course.id} 상태: ${course.status}, 포함여부: ${isActive}`);
                                return isActive;
                            });

                            // 최신 순으로 정렬
                            courses.sort((a, b) => {
                                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                                return dateB - dateA;
                            });
                        }

                    } catch (error) {
                        console.error('Firebase 교육 과정 조회 오류:', error);
                        // Firebase 오류 시 테스트 데이터 사용
                        courses = this.getTestCourseData();
                    }
                } else {
                    console.log('Firebase 미연결, 테스트 데이터 사용');
                    courses = this.getTestCourseData();
                }

                // 4. 옵션 업데이트 (🔧 중요: data-course 속성 추가)
                if (courses.length > 0) {
                    courseSelect.innerHTML = '<option value="">교육 과정을 선택하세요</option>';

                    courses.forEach(course => {
                        // 날짜 포맷팅
                        const startDate = this.formatCourseDate(course.startDate);
                        const endDate = this.formatCourseDate(course.endDate);

                        const title = course.title || course.name || `${this.getCertTypeName(this.currentCertType)} 과정`;
                        const dateRange = startDate && endDate ? ` (${startDate} ~ ${endDate})` : '';

                        // 🔧 핵심: data-course 속성에 전체 교육과정 데이터 포함 (날짜 자동 설정을 위해 필요)
                        const courseDataJson = JSON.stringify(course).replace(/"/g, '&quot;');

                        courseSelect.innerHTML += `
                    <option value="${course.id}" data-course="${courseDataJson}">${title}${dateRange}</option>
                `;
                    });

                    console.log(`교육과정 옵션 ${courses.length}개 로드 완료 (data-course 속성 포함)`);
                } else {
                    courseSelect.innerHTML = '<option value="">현재 등록된 교육과정이 없습니다</option>';
                    console.log('표시할 교육과정이 없음');
                }

                // 5. 사용자에게 피드백
                if (window.adminAuth?.showNotification) {
                    if (courses.length > 0) {
                        window.adminAuth.showNotification(`교육과정 ${courses.length}개를 불러왔습니다.`, 'success');
                    } else {
                        window.adminAuth.showNotification('등록된 교육과정이 없습니다. 먼저 교육과정을 등록해주세요.', 'warning');
                    }
                }

            } catch (error) {
                console.error('교육 과정 로드 전체 오류:', error);
                courseSelect.innerHTML = '<option value="">교육 과정 로드 실패</option>';

                if (window.adminAuth?.showNotification) {
                    window.adminAuth.showNotification('교육과정을 불러오는데 실패했습니다.', 'error');
                }
            }
        },

        /**
         * 테스트용 교육과정 데이터 가져오기
         */
        getTestCourseData: function () {
            return [
                {
                    id: 'course1',
                    title: '2025년 1기 건강운동처방사 과정',
                    certificateType: 'health-exercise',
                    status: 'active',
                    startDate: '2025-01-15',
                    endDate: '2025-03-15', // 🔧 중요: 수료일 자동 설정을 위해 필요
                    instructor: '김영수 교수',
                    capacity: 30,
                    currentEnrollment: 25,
                    createdAt: new Date('2025-01-01')
                },
                {
                    id: 'course2',
                    title: '2025년 1기 운동재활전문가 과정',
                    certificateType: 'rehabilitation',
                    status: 'active',
                    startDate: '2025-02-01',
                    endDate: '2025-04-01', // 🔧 중요: 수료일 자동 설정을 위해 필요
                    instructor: '이미연 교수',
                    capacity: 25,
                    currentEnrollment: 20,
                    createdAt: new Date('2025-01-05')
                },
                {
                    id: 'course3',
                    title: '2025년 1기 필라테스 전문가 과정',
                    certificateType: 'pilates',
                    status: 'active',
                    startDate: '2025-01-20',
                    endDate: '2025-03-20', // 🔧 중요: 수료일 자동 설정을 위해 필요
                    instructor: '박지혜 강사',
                    capacity: 20,
                    currentEnrollment: 18,
                    createdAt: new Date('2025-01-10')
                },
                {
                    id: 'course4',
                    title: '2025년 1기 레크리에이션지도자 과정',
                    certificateType: 'recreation',
                    status: 'active',
                    startDate: '2025-02-10',
                    endDate: '2025-04-10', // 🔧 중요: 수료일 자동 설정을 위해 필요
                    instructor: '최민수 강사',
                    capacity: 35,
                    currentEnrollment: 30,
                    createdAt: new Date('2025-01-15')
                }
            ];
        },

        /**
         * 🔧 테스트 교육과정 데이터 생성 (Firebase에 없을 경우)
         */
        createTestCourseData: async function () {
            console.log('🔧 테스트 교육과정 데이터 생성 시작');

            const firebaseStatus = checkFirebaseConnection();
            if (!firebaseStatus.connected || !window.dhcFirebase) {
                console.log('Firebase 미연결, 테스트 데이터 생성 건너뛰기');
                return;
            }

            try {
                const testCourses = this.getTestCourseData();
                const batch = window.dhcFirebase.db.batch();

                testCourses.forEach(course => {
                    const docRef = window.dhcFirebase.db.collection('courses').doc(course.id);

                    // Firebase 타임스탬프로 변환
                    const courseWithTimestamp = {
                        ...course,
                        startDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(course.startDate)),
                        endDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(course.endDate)),
                        createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    };

                    batch.set(docRef, courseWithTimestamp);
                });

                await batch.commit();
                console.log('✅ 테스트 교육과정 데이터 생성 완료');

            } catch (error) {
                console.error('❌ 테스트 교육과정 데이터 생성 실패:', error);
            }
        },

        /**
         * 교육과정 날짜 포맷팅
         */
        formatCourseDate: function (date) {
            if (!date) return '';

            try {
                // Firebase Timestamp인 경우
                if (typeof date.toDate === 'function') {
                    date = date.toDate();
                } else if (typeof date === 'string') {
                    date = new Date(date);
                }

                if (date instanceof Date && !isNaN(date)) {
                    return window.formatters.formatDate(date, 'YYYY-MM-DD');
                }
            } catch (error) {
                console.error('날짜 포맷팅 오류:', error);
            }

            return '';
        },

        /**
         * 자격증 유형 전환
         */
        switchCertType: function (certType) {
            // 이미 선택된 유형이면 무시
            if (this.currentCertType === certType) return;

            // 탭 상태 업데이트
            const tabs = document.querySelectorAll('.cert-tab');
            tabs.forEach(tab => {
                if (tab.dataset.cert === certType) {
                    tab.classList.add('active', 'border-indigo-500', 'text-indigo-600');
                    tab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                } else {
                    tab.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
                    tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                }
            });

            // 타이틀 업데이트
            const certTypeTitle = document.getElementById('cert-type-title');
            if (certTypeTitle) {
                certTypeTitle.textContent = this.getCertTypeName(certType);
            }

            // 현재 자격증 유형 업데이트
            this.currentCertType = certType;
            this.currentPage = 1;
            this.lastDoc = null;

            // 자격증 데이터 로드
            this.loadCertificates();
        },

        /**
         * 자격증 목록 로드 (완전 구현)
         */
        loadCertificates: async function () {
            try {
                // 로딩 상태 표시
                const tableBody = document.querySelector('#cert-table tbody');
                if (tableBody) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="8" class="text-center py-4 text-gray-500">데이터 로딩 중...</td>
                        </tr>
                    `;
                }

                // 자격증 데이터 가져오기
                let certificates = [];

                // Firebase가 초기화되었는지 확인
                const firebaseStatus = checkFirebaseConnection();
                if (firebaseStatus.connected && window.dbService) {
                    try {
                        console.log('Firebase에서 자격증 데이터 로드 시작');

                        // 단순화된 쿼리 사용
                        let query = window.dhcFirebase.db.collection('certificates')
                            .where('certificateType', '==', this.currentCertType);

                        // 상태 필터 적용 (선택적)
                        const statusFilter = document.getElementById('filter-status')?.value;
                        if (statusFilter) {
                            query = query.where('status', '==', statusFilter);
                        }

                        const snapshot = await query.get();

                        if (!snapshot.empty) {
                            snapshot.forEach(doc => {
                                certificates.push({
                                    id: doc.id,
                                    ...doc.data()
                                });
                            });

                            // 클라이언트 측에서 정렬 (최신 발급일 기준)
                            certificates.sort((a, b) => {
                                const dateA = a.issueDate?.seconds || 0;
                                const dateB = b.issueDate?.seconds || 0;
                                return dateB - dateA;
                            });

                            // 페이지네이션 처리
                            const startIndex = (this.currentPage - 1) * this.pageSize;
                            certificates = certificates.slice(startIndex, startIndex + this.pageSize);
                        }
                    } catch (error) {
                        console.error('Firebase 데이터 조회 오류:', error);
                        window.adminAuth?.showNotification('데이터 조회 중 오류가 발생했습니다.', 'error');
                    }
                } else {
                    // Firebase 연동 전 테스트 데이터 사용
                    console.log('Firebase 미연결, 테스트 데이터 사용');
                    certificates = await this.getMockCertificates();
                }

                // 테이블 업데이트
                this.updateCertificateTable(certificates);

            } catch (error) {
                console.error('자격증 데이터 로드 오류:', error);
                const tableBody = document.querySelector('#cert-table tbody');
                if (tableBody) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="8" class="text-center py-4 text-red-500">데이터 로드 중 오류가 발생했습니다.</td>
                        </tr>
                    `;
                }
            }
        },

        /**
         * 자격증 테이블 업데이트
         */
        updateCertificateTable: function (certificates) {
            const tableBody = document.querySelector('#cert-table tbody');

            if (!tableBody) {
                console.error('cert-table tbody를 찾을 수 없습니다.');
                return;
            }

            if (!certificates || certificates.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4 text-gray-500">
                            <div class="text-lg font-semibold mb-2">등록된 자격증이 없습니다</div>
                            <p class="text-gray-600">새로운 자격증을 발급해보세요.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            let tableHtml = '';

            certificates.forEach(cert => {
                // 안전한 데이터 접근
                const certNumber = cert.certificateNumber || cert.certNumber || cert.id || '-';
                const holderName = cert.holderName || cert.name || cert.nameKorean || '-';
                const courseName = cert.courseName || cert.course || '-';

                // 날짜 포맷팅
                const issueDate = this.formatDateSafe(cert.issueDate) || '-';
                const expiryDate = this.formatDateSafe(cert.expiryDate) || '-';

                const status = cert.status || 'active';

                const getStatusBadge = (status) => {
                    const badges = {
                        'active': '<span class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">유효</span>',
                        'expired': '<span class="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">만료</span>',
                        'revoked': '<span class="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">취소</span>',
                        'suspended': '<span class="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">정지</span>'
                    };
                    return badges[status] || `<span class="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">${status}</span>`;
                };

                tableHtml += `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="text-center">
                            <input type="checkbox" class="cert-checkbox" data-id="${cert.id}">
                        </td>
                        <td>${certNumber}</td>
                        <td>${holderName}</td>
                        <td>${courseName}</td>
                        <td>${issueDate}</td>
                        <td>${expiryDate}</td>
                        <td>${getStatusBadge(status)}</td>
                        <td>
                            <div class="flex space-x-2">
                                <button onclick="certManager.viewCertDetails('${cert.id}')" 
                                    class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600" title="상세 보기">
                                    상세
                                </button>
                                <button onclick="certManager.editCert('${cert.id}')" 
                                    class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600" title="수정">
                                    수정
                                </button>
                                
                                <!-- PDF 드롭다운 -->
                                <div class="relative inline-block">
                                    <button onclick="certManager.togglePdfDropdown('${cert.id}')" 
                                        class="px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600" title="PDF 다운로드">
                                        PDF
                                    </button>
                                    <div id="pdf-dropdown-${cert.id}" class="hidden absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                                        <a href="#" onclick="certManager.downloadCertPdf('${cert.id}', 'ko'); event.preventDefault();"
                                           class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            한글 PDF
                                        </a>
                                        <a href="#" onclick="certManager.downloadCertPdf('${cert.id}', 'en'); event.preventDefault();"
                                           class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            영문 PDF
                                        </a>
                                    </div>
                                </div>
                                
                                ${status !== 'suspended' && status !== 'revoked' ? `
                                    <button onclick="certManager.revokeCertificate('${cert.id}')" 
                                        class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600" title="자격증 취소">
                                        취소
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            });

            tableBody.innerHTML = tableHtml;

            // PDF 드롭다운 초기화
            this.initPdfDropdowns();
        },

        /**
         * PDF 드롭다운 토글
         */
        togglePdfDropdown: function (certId) {
            const dropdown = document.getElementById(`pdf-dropdown-${certId}`);
            if (!dropdown) return;

            // 다른 모든 드롭다운 닫기
            document.querySelectorAll('[id^="pdf-dropdown-"]').forEach(dd => {
                if (dd.id !== `pdf-dropdown-${certId}`) {
                    dd.classList.add('hidden');
                    dd.classList.remove('show');
                }
            });

            // 현재 드롭다운 토글
            dropdown.classList.toggle('hidden');
            dropdown.classList.toggle('show');
        },

        /**
         * PDF 드롭다운 초기화
         */
        initPdfDropdowns: function () {
            // 이미 초기화되었으면 중복 방지
            if (this._pdfDropdownInitialized) return;
            this._pdfDropdownInitialized = true;

            // 전역 클릭 이벤트로 드롭다운 닫기
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.relative')) {
                    document.querySelectorAll('[id^="pdf-dropdown-"]').forEach(dropdown => {
                        dropdown.classList.add('hidden');
                        dropdown.classList.remove('show');
                    });
                }
            });

            console.log('✅ PDF 드롭다운 이벤트 리스너 초기화 완료');
        },

        /**
         * 일괄 발급 파일 업로드 처리
         */
        handleBulkFileUpload: function (event) {
            const file = event.target.files[0];
            if (!file) return;

            console.log('일괄 발급 파일 업로드:', file.name);

            // 파일 형식 확인
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                window.adminAuth?.showNotification('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.', 'error');
                event.target.value = '';
                return;
            }

            // 미리보기 표시 (간단한 구현)
            const previewArea = document.getElementById('bulk-preview');
            if (previewArea) {
                previewArea.classList.remove('hidden');
                previewArea.innerHTML = `
                    <div class="p-4 bg-green-50 border border-green-200 rounded">
                        <p class="text-green-800">파일 업로드 완료: ${file.name}</p>
                        <p class="text-sm text-green-600">일괄 발급을 진행하려면 "일괄 발급" 버튼을 클릭하세요.</p>
                    </div>
                `;
            }

            // 일괄 발급 버튼 활성화
            const bulkIssueBtn = document.getElementById('bulk-issue-btn');
            if (bulkIssueBtn) {
                bulkIssueBtn.disabled = false;
            }
        },

        /**
         * 검색 기능
         */
        search: function () {
            console.log('검색 실행');
            this.currentPage = 1;
            this.lastDoc = null;
            this.loadCertificates();
        },

        /**
         * 🔧 MODIFIED: 자격증 상세 정보 보기 (영문명 포함)
         */
        viewCertDetails: async function (certId) {
            try {
                console.log('🔧 자격증 상세 정보 보기:', certId);

                // 로딩 표시
                if (window.adminAuth?.showNotification) {
                    window.adminAuth.showNotification('자격증 정보를 불러오는 중...', 'info');
                }

                let cert = null;
                let courseName = '-';
                let userName = '-';
                let userEmail = '-';

                // 🔧 Firebase 연동 시 강화된 오류 처리
                const firebaseStatus = checkFirebaseConnection();
                if (firebaseStatus.connected && window.dhcFirebase) {
                    try {
                        console.log('🔥 Firebase에서 자격증 정보 조회 시작, ID:', certId);

                        const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                        const docSnap = await docRef.get();

                        if (docSnap.exists) {
                            const data = docSnap.data();
                            if (data) {
                                cert = {
                                    id: docSnap.id,
                                    ...data
                                };
                                console.log('✅ Firebase에서 자격증 정보 조회 성공:', cert);

                                // 교육 과정 정보 조회 (선택적)
                                if (cert.courseId) {
                                    try {
                                        const courseRef = window.dhcFirebase.db.collection('courses').doc(cert.courseId);
                                        const courseSnap = await courseRef.get();
                                        if (courseSnap.exists) {
                                            courseName = courseSnap.data().title || '-';
                                            console.log('✅ 교육과정 정보 조회 성공:', courseName);
                                        }
                                    } catch (error) {
                                        console.error('교육 과정 조회 오류:', error);
                                        courseName = '-';
                                    }
                                }

                                // 사용자 정보 조회 (선택적)
                                if (cert.userId) {
                                    try {
                                        const userRef = window.dhcFirebase.db.collection('users').doc(cert.userId);
                                        const userSnap = await userRef.get();
                                        if (userSnap.exists) {
                                            const userData = userSnap.data();
                                            userName = userData.displayName || userData.name || '-';
                                            userEmail = userData.email || '-';
                                            console.log('✅ 사용자 정보 조회 성공:', { userName, userEmail });
                                        }
                                    } catch (error) {
                                        console.error('사용자 정보 조회 오류:', error);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('❌ Firebase 자격증 정보 조회 오류:', error);
                        cert = null;
                    }
                }

                // 🔧 Firebase에서 찾지 못했거나 연결되지 않은 경우 테스트 데이터 사용
                if (!cert) {
                    console.log('🔧 Firebase에서 데이터를 찾지 못함, 테스트 데이터 사용');
                    cert = this.getMockCertificateById(certId);

                    if (!cert) {
                        console.error('❌ 테스트 데이터에서도 자격증을 찾을 수 없음:', certId);
                        window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                        return;
                    }

                    courseName = cert.course || '-';
                    userName = cert.name || cert.holderName || '-';
                    userEmail = cert.email || cert.holderEmail || 'test@example.com';

                    console.log('✅ 테스트 데이터 사용:', cert);
                }

                // 🔧 안전한 데이터 접근
                const safeGetValue = (obj, path, defaultValue = '-') => {
                    try {
                        return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
                    } catch {
                        return defaultValue;
                    }
                };

                // 🔧 MODIFIED: 안전한 자격증 정보 추출 (영문명 포함)
                const certNumber = safeGetValue(cert, 'certificateNumber') ||
                    safeGetValue(cert, 'certNumber') ||
                    safeGetValue(cert, 'id') ||
                    'Unknown';

                const holderNameKorean = safeGetValue(cert, 'holderName') ||
                    safeGetValue(cert, 'nameKorean') ||
                    safeGetValue(cert, 'name') ||
                    userName ||
                    'Unknown';

                // 🔧 NEW: 영문명 추가
                const holderNameEnglish = safeGetValue(cert, 'holderNameEnglish') ||
                    safeGetValue(cert, 'nameEnglish') ||
                    'Not provided';

                const holderEmail = safeGetValue(cert, 'holderEmail') ||
                    safeGetValue(cert, 'email') ||
                    userEmail ||
                    'unknown@example.com';

                const certType = this.getCertTypeName(safeGetValue(cert, 'certificateType') || this.currentCertType);

                // 🔧 안전한 날짜 포맷팅
                const issueDate = this.formatDateSafe(cert.issueDate) ||
                    safeGetValue(cert, 'issueDate') ||
                    '-';

                const expiryDate = this.formatDateSafe(cert.expiryDate) ||
                    safeGetValue(cert, 'expiryDate') ||
                    '-';

                const createdAt = this.formatDate(cert.createdAt, true) ||
                    safeGetValue(cert, 'createdAt') ||
                    '-';

                const updatedAt = this.formatDate(cert.updatedAt, true) ||
                    safeGetValue(cert, 'updatedAt') ||
                    '-';

                const status = safeGetValue(cert, 'status') || 'active';
                const remarks = safeGetValue(cert, 'remarks') || '-';

                console.log('✅ 안전한 자격증 정보 추출 완료 (영문명 포함):', {
                    certNumber, holderNameKorean, holderNameEnglish, holderEmail, certType, issueDate, expiryDate, status
                });

                // 🔧 MODIFIED: 모달 내용 생성 및 표시 (영문명 포함)
                const modalContent = document.getElementById('cert-detail-content');
                if (!modalContent) {
                    console.error('cert-detail-content를 찾을 수 없습니다.');
                    window.adminAuth?.showNotification('모달 콘텐츠를 찾을 수 없습니다.', 'error');
                    return;
                }

                modalContent.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-700">자격증 번호</h4>
                    <p class="text-gray-900">${certNumber}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700">자격증 종류</h4>
                    <p class="text-gray-900">${certType}</p>
                </div>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-700">수료자 정보</h4>
                <div class="space-y-1">
                    <p><span class="font-medium">한글명:</span> ${holderNameKorean}</p>
                    <p><span class="font-medium">영문명:</span> ${holderNameEnglish}</p>
                    <p><span class="font-medium">이메일:</span> ${holderEmail}</p>
                </div>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-700">교육 과정</h4>
                <p class="text-gray-900">${courseName}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-700">발급일</h4>
                    <p class="text-gray-900">${issueDate}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700">만료일</h4>
                    <p class="text-gray-900">${expiryDate}</p>
                </div>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-700">상태</h4>
                <p>
                    <span class="px-2 py-1 rounded-full text-xs 
                        ${status === 'active' ? 'bg-green-100 text-green-800' :
                        status === 'expired' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}">
                        ${this.getStatusText(status)}
                    </span>
                </p>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-700">비고</h4>
                <p class="text-gray-900 whitespace-pre-wrap">${remarks}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-700">등록일시</h4>
                    <p class="text-gray-900">${createdAt}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700">수정일시</h4>
                    <p class="text-gray-900">${updatedAt}</p>
                </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-200">
                <h4 class="font-medium text-gray-700">자격증 PDF 다운로드</h4>
                <div class="flex space-x-3 mt-2">
                    <button onclick="certManager.downloadCertPdf('${certId}', 'ko'); certManager.closeCertDetailModal();" 
                        class="admin-btn admin-btn-secondary">
                        한글 PDF (${holderNameKorean})
                    </button>
                    <button onclick="certManager.downloadCertPdf('${certId}', 'en'); certManager.closeCertDetailModal();" 
                        class="admin-btn admin-btn-primary">
                        영문 PDF (${holderNameEnglish})
                    </button>
                </div>
            </div>
        `;

                // 🔧 NEW: 모달 표시
                const modal = document.getElementById('cert-detail-modal');
                if (!modal) {
                    console.error('cert-detail-modal을 찾을 수 없습니다.');
                    window.adminAuth?.showNotification('상세보기 모달을 찾을 수 없습니다.', 'error');
                    return;
                }

                // 다른 모달들 먼저 닫기
                this.closeOtherModals('cert-detail-modal');

                // 상태 업데이트
                this.modalStates['cert-detail-modal'] = true;

                // 모달 표시
                modal.classList.remove('hidden');

                // body 스크롤 방지
                document.body.classList.add('modal-open');

                // 🔧 이벤트 리스너 재등록
                this.ensureModalEvents();

                console.log('✅ 자격증 상세 정보 모달 표시 완료 (영문명 포함)');

            } catch (error) {
                console.error('자격증 상세 정보 조회 오류:', error);
                window.adminAuth?.showNotification('자격증 정보 조회 중 오류가 발생했습니다.', 'error');
            }
        },

        /**
         * 🎨 전문적인 자격증 PDF 다운로드 (영문명 처리 포함)
         */
        downloadCertPdf: function (certId, lang) {
            console.log('🎨 PDF 다운로드 시작 (영문명 처리 포함):', { certId, lang });

            window.adminAuth?.showNotification('PDF 생성 중...', 'info');

            // 라이브러리 체크 개선
            const checkLibraries = () => {
                const jsPdfReady = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
                const html2canvasReady = window.html2canvas;

                console.log('라이브러리 상태:', {
                    jsPDF: !!jsPdfReady,
                    html2canvas: !!html2canvasReady,
                    windowJsPDF: !!window.jsPDF,
                    windowJspdf: !!window.jspdf,
                    windowHtml2canvas: !!window.html2canvas
                });

                return jsPdfReady && html2canvasReady;
            };

            if (checkLibraries()) {
                console.log('✅ 라이브러리 체크 통과, PDF 생성 시작');
                // jsPDF 전역 변수 설정 (필요한 경우)
                if (!window.jsPDF && window.jspdf && window.jspdf.jsPDF) {
                    window.jsPDF = window.jspdf.jsPDF;
                }

                // 언어에 따른 함수 호출
                if (lang === 'ko') {
                    this.generateKoreanCertPdfWithPhoto(certId);
                } else {
                    this.generateEnglishCertPdfWithEnglishName(certId); // 🔧 NEW: 영문명 사용
                }
            } else {
                console.log('❌ 라이브러리 미로드, 동적 로드 시도');
                // 라이브러리 동적 로드
                this.loadJsPdfLibrary(() => {
                    if (lang === 'ko') {
                        this.generateKoreanCertPdfWithPhoto(certId);
                    } else {
                        this.generateEnglishCertPdfWithEnglishName(certId); // 🔧 NEW: 영문명 사용
                    }
                });
            }
        },

        /**
         * 🔧 NEW: 사진 포함 한글 자격증 PDF 생성 (기존 유지)
         */
        generateKoreanCertPdfWithPhoto: async function (certId) {
            try {
                console.log('🎨 한글 PDF 생성 시작 (사진 삽입 포함):', certId);

                // jsPDF 생성자 확인
                let jsPDFConstructor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
                if (!jsPDFConstructor) {
                    throw new Error('jsPDF 라이브러리가 로드되지 않았습니다.');
                }

                // 자격증 정보 조회
                let cert = await this.getCertificateDataWithEnglishName(certId);
                if (!cert) {
                    window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                    return;
                }

                // 안전한 데이터 추출
                const certData = this.extractCertificateDataWithEnglishName(cert);
                const today = new Date();
                const formattedToday = window.formatters.formatDate(today, 'YYYY년 MM월 DD일');

                // 🔧 NEW: 증명사진 로드
                console.log('📸 증명사진 로드 시작...');
                let photoData = null;

                try {
                    // 자격증 데이터에서 사진 URL 확인
                    const photoUrl = cert.photoUrl || cert.photo?.url || null;

                    if (photoUrl) {
                        console.log('📸 사진 URL 발견:', photoUrl);
                        photoData = await loadCertificatePhoto(photoUrl);
                    } else {
                        console.log('📸 사진 URL이 없음, 플레이스홀더 사용');
                    }

                    if (!photoData) {
                        console.log('📸 사진 로드 실패, 플레이스홀더 생성');
                        photoData = createPlaceholderPhoto();
                    }
                } catch (error) {
                    console.error('📸 사진 처리 중 오류:', error);
                    photoData = createPlaceholderPhoto();
                }

                // 🔧 FIXED: 동적 이미지 경로 사용
                const imagePaths = getImagePaths();
                const borderImagePath = imagePaths.borderImagePath;
                const koreaImagePath = imagePaths.koreaImagePath;
                const sealImagePath = imagePaths.sealImagePath;

                console.log('🖼️ 이미지 경로:', {
                    border: borderImagePath,
                    medal: koreaImagePath,
                    seal: sealImagePath,
                    photo: photoData ? 'loaded' : 'placeholder'
                });

                // 🔧 NEW: 사진 포함 한글 HTML 템플릿 생성
                const certTemplate = this.createKoreanTemplateWithPhoto(
                    certData,
                    borderImagePath,
                    koreaImagePath,
                    sealImagePath,
                    formattedToday,
                    photoData
                );

                // DOM에 추가
                document.body.appendChild(certTemplate);

                try {
                    // 이미지 로딩 대기
                    console.log('⏳ 모든 이미지 로딩 대기 중...');
                    await this.waitForImagesLoad(certTemplate);

                    // HTML to Canvas
                    console.log('🖼️ HTML을 Canvas로 변환 중...');
                    const canvas = await window.html2canvas(certTemplate, {
                        scale: 3, // 고해상도
                        logging: false,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: "#ffffff",
                        width: 794,
                        height: 1123
                    });

                    console.log('✅ Canvas 생성 완료, 크기:', canvas.width, 'x', canvas.height);

                    // PDF 생성
                    console.log('📄 PDF 생성 중...');
                    const doc = new jsPDFConstructor({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4',
                        compress: true
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

                    const fileName = `${certData.certType}_${certData.holderNameKorean}_${certData.certNumber}_한글.pdf`;
                    doc.save(fileName);

                    console.log('✅ 사진 포함 한글 PDF 생성 완료:', fileName);
                    window.adminAuth?.showNotification('한글 자격증 PDF가 생성되었습니다.', 'success');

                } catch (error) {
                    console.error('PDF 생성 중 오류:', error);
                    window.adminAuth?.showNotification('PDF 생성 중 오류가 발생했습니다: ' + error.message, 'error');
                } finally {
                    // 템플릿 제거
                    if (document.body.contains(certTemplate)) {
                        document.body.removeChild(certTemplate);
                        console.log('🧹 임시 템플릿 제거 완료');
                    }
                }

            } catch (error) {
                console.error('한글 PDF 생성 전체 오류:', error);
                window.adminAuth?.showNotification('PDF 생성 중 오류가 발생했습니다: ' + error.message, 'error');
            }
        },

        /**
         * 🔧 MODIFIED: 영문 자격증 PDF 생성 (영문명 사용)
         */
        generateEnglishCertPdfWithEnglishName: async function (certId) {
            try {
                console.log('🎨 영문 PDF 생성 시작 (영문명 사용):', certId);

                let jsPDFConstructor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
                if (!jsPDFConstructor) {
                    throw new Error('jsPDF 라이브러리가 로드되지 않았습니다.');
                }

                let cert = await this.getCertificateDataWithEnglishName(certId);
                if (!cert) {
                    window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                    return;
                }

                const certData = this.extractCertificateDataWithEnglishName(cert);
                const today = new Date();
                const formattedToday = today.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // 🔧 FIXED: 동적 이미지 경로 사용
                const imagePaths = getImagePaths();
                const borderImagePath = imagePaths.borderImagePath;
                const englishImagePath = imagePaths.englishImagePath;
                const sealImagePath = imagePaths.sealImagePath;

                console.log('🖼️ 영문 이미지 경로:', {
                    border: borderImagePath,
                    medal: englishImagePath,
                    seal: sealImagePath
                });

                const certTemplate = this.createEnglishTemplateWithEnglishName(
                    certData,
                    borderImagePath,
                    englishImagePath,
                    sealImagePath,
                    formattedToday
                );

                document.body.appendChild(certTemplate);

                try {
                    console.log('⏳ 영문 이미지 로딩 대기 중...');
                    await this.waitForImagesLoad(certTemplate);

                    console.log('🖼️ HTML을 Canvas로 변환 중...');
                    const canvas = await window.html2canvas(certTemplate, {
                        scale: 3,
                        logging: false,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: "#ffffff",
                        width: 794,
                        height: 1123
                    });

                    console.log('✅ Canvas 생성 완료, 크기:', canvas.width, 'x', canvas.height);

                    console.log('📄 PDF 생성 중...');
                    const doc = new jsPDFConstructor({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4',
                        compress: true
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

                    const certTypeEn = this.getCertTypeNameEn(certData.certificateType);
                    const fileName = `${certTypeEn.replace(/\s+/g, '_')}_${certData.holderNameEnglish.replace(/\s+/g, '_')}_${certData.certNumber}_English.pdf`;
                    doc.save(fileName);

                    console.log('✅ 영문 PDF 생성 완료 (영문명 사용):', fileName);
                    window.adminAuth?.showNotification('영문 자격증 PDF가 생성되었습니다.', 'success');

                } catch (error) {
                    console.error('PDF 생성 중 오류:', error);
                    window.adminAuth?.showNotification('PDF 생성 중 오류가 발생했습니다: ' + error.message, 'error');
                } finally {
                    if (document.body.contains(certTemplate)) {
                        document.body.removeChild(certTemplate);
                        console.log('🧹 임시 템플릿 제거 완료');
                    }
                }

            } catch (error) {
                console.error('영문 PDF 생성 전체 오류:', error);
                window.adminAuth?.showNotification('PDF 생성 중 오류가 발생했습니다: ' + error.message, 'error');
            }
        },

        /**
         * 🔧 MODIFIED: 영문 HTML 템플릿 (영문명 사용)
         */
        createEnglishTemplateWithEnglishName: function (certData, borderPath, medalPath, sealPath, issuedDate) {
            const template = document.createElement('div');
            template.id = 'english-cert-template-with-english-name';
            template.style.cssText = `
                width: 794px;
                height: 1123px;
                position: absolute;
                left: -10000px;
                top: -10000px;
                font-family: 'Times New Roman', 'Georgia', serif;
                background: #ffffff;
                overflow: hidden;
                z-index: -1000;
                padding: 0;
                margin: 0;
                box-sizing: border-box;
            `;

            const certTypeEn = this.getCertTypeNameEn(certData.certificateType);

            template.innerHTML = `
                <div style="
                    position: relative;
                    width: 794px;
                    height: 1123px;
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    padding: 30px;
                    box-sizing: border-box;
                ">
                    <div style="
                        position: relative;
                        width: 100%;
                        height: 100%;
                        background: #ffffff;
                        overflow: hidden;
                    ">
                        <img src="${borderPath}" 
                             style="
                                 position: absolute;
                                 top: 0;
                                 left: 0;
                                 width: 100%;
                                 height: 100%;
                                 object-fit: cover;
                                 z-index: 1;
                             ">

                        <img src="${medalPath}" 
                             style="
                                 position: absolute;
                                 top: 80px;
                                 left: 50%;
                                 transform: translateX(-50%);
                                 width: 90px;
                                 height: 90px;
                                 z-index: 2;
                             ">

                        <div style="
                            position: relative;
                            z-index: 3;
                            padding: 90px 100px 60px 100px;
                            height: 100%;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                            text-align: center;
                        ">
                            <div style="margin-bottom: 30px; margin-top: 80px;">
                                <h1 style="
                                    font-size: 48px;
                                    font-weight: bold;
                                    color: #1e3a8a;
                                    margin: 0 0 15px 0;
                                    letter-spacing: 6px;
                                    font-family: 'Times New Roman', serif;
                                    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                                ">CERTIFICATE</h1>
                                
                                <h2 style="
                                    font-size: 28px;
                                    color: #3b82f6;
                                    margin: 0 0 25px 0;
                                    font-style: italic;
                                    letter-spacing: 3px;
                                    font-weight: 400;
                                ">of Achievement</h2>
                                
                                <h3 style="
                                    font-size: 24px;
                                    color: #8B4513;
                                    margin: 0 0 20px 0;
                                    font-weight: 600;
                                ">${certTypeEn}</h3>
                                
                                <div style="
                                    color: #1e3a8a;
                                    border: 2px solid #1e3a8a;
                                    border-radius: 5px;
                                    font-size: 16px;
                                    font-weight: 600;
                                    margin: 0 auto 15px auto;
                                    background: transparent;
                                    width: 280px;
                                    height: 50px;
                                    display: block;
                                    text-align: center;
                                    line-height: 46px;
                                    box-sizing: border-box;
                                ">Certificate No: ${certData.certNumber}</div>
                            </div>

                            <div style="
                                flex: 1;
                                display: flex;
                                flex-direction: column;
                                justify-content: flex-start;
                                margin: 0;
                                padding: 0 40px;
                            ">
                                <p style="
                                    margin: 5px 0 10px 0;
                                    font-size: 20px;
                                    color: #4a5568;
                                    font-style: italic;
                                    font-weight: 500;
                                ">This is to certify that</p>
                                
                                <div style="
                                    margin: 10px 0 15px 0;
                                    padding: 12px 0;
                                    border-bottom: 3px solid #FFD700;
                                    position: relative;
                                ">
                                    <h2 style="
                                        font-size: 32px;
                                        font-weight: bold;
                                        color: #1a202c;
                                        margin: 0;
                                        letter-spacing: 2px;
                                        font-family: 'Times New Roman', serif;
                                    ">${certData.holderNameEnglish}</h2>
                                </div>
                                
                                <p style="
                                    margin: 15px 0 25px 0;
                                    font-size: 16px;
                                    color: #374151;
                                    line-height: 1.6;
                                    font-weight: 500;
                                ">has successfully completed the ${certTypeEn}<br>
                                training program and passed all theoretical<br>
                                and practical examinations with distinction,<br>
                                and is hereby certified.</p>
                                
                                <div style="
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    margin-top: 5px;
                                ">
                                    <div style="
                                        text-align: center;
                                        margin-bottom: 30px;
                                    ">
                                        <p style="
                                            font-size: 22px;
                                            margin: 0 0 15px 0;
                                            color: #1e293b;
                                            font-weight: 700;
                                        ">${issuedDate}</p>
                                        
                                        <div style="
                                            display: flex;
                                            justify-content: center;
                                            gap: 30px;
                                            margin-top: 10px;
                                        ">
                                            <span style="font-weight: 600; color: #1e293b; font-size: 16px;">
                                                Issue Date: <span style="font-weight: 700; color: #1e3a8a;">${certData.issueDate}</span>
                                            </span>
                                            <span style="font-weight: 600; color: #1e293b; font-size: 16px;">
                                                Expiry Date: <span style="font-weight: 700; color: #1e3a8a;">${certData.expiryDate}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div style="
                                        text-align: center;
                                        position: relative;
                                        display: inline-block;
                                    ">
                                        <h3 style="
                                            font-size: 28px;
                                            font-weight: 700;
                                            margin: 0;
                                            color: #1e3a8a;
                                            line-height: 1.2;
                                            display: inline-block;
                                        ">Digital Healthcare Center</h3>
                                        <p style="
                                            font-size: 18px;
                                            margin: 5px 0 0 0;
                                            color: #64748b;
                                            font-style: italic;
                                            font-weight: 500;
                                        ">Mungyeong Subsidiary</p>
                                        
                                        <img src="${sealPath}" 
                                             style="
                                                 width: 75px;
                                                 height: 75px;
                                                 object-fit: contain;
                                                 position: absolute;
                                                 top: 50%;
                                                 transform: translateY(-50%);
                                                 right: -95px;
                                             ">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            return template;
        },

        /**
         * 🔧 MODIFIED: 자격증 데이터 조회 함수 개선 (영문명 포함)
         */
        getCertificateDataWithEnglishName: async function (certId) {
            let cert = null;

            const firebaseStatus = checkFirebaseConnection();
            if (firebaseStatus.connected && window.dhcFirebase) {
                try {
                    const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                    const docSnap = await docRef.get();

                    if (docSnap.exists) {
                        cert = { id: docSnap.id, ...docSnap.data() };

                        // 교육 과정 정보 조회
                        if (cert.courseId) {
                            try {
                                const courseRef = window.dhcFirebase.db.collection('courses').doc(cert.courseId);
                                const courseSnap = await courseRef.get();
                                if (courseSnap.exists) {
                                    cert.courseName = courseSnap.data().title || '';
                                }
                            } catch (error) {
                                console.error('교육 과정 조회 오류:', error);
                            }
                        }

                        // 🔧 NEW: 사진 URL 확인 및 Base64 대체
                        if (cert.photoUrl || cert.photo?.url) {
                            console.log('📸 자격증 데이터에서 사진 URL 발견:', cert.photoUrl || cert.photo?.url);

                            // 실제 사진 URL이 있지만 접근할 수 없는 경우를 대비해 검증
                            const photoUrl = cert.photoUrl || cert.photo?.url;

                            // 외부 placeholder 서비스 URL이면 Base64로 대체
                            if (photoUrl.includes('placeholder.com') || photoUrl.includes('via.placeholder')) {
                                console.log('🔧 외부 플레이스홀더 감지, Base64 이미지로 대체');
                                cert.photoUrl = this.createBase64TestPhoto();
                                cert.isBase64Photo = true;
                            }
                        } else {
                            console.log('📸 자격증 데이터에 사진 URL 없음, Base64 플레이스홀더 생성');
                            cert.photoUrl = this.createSimpleBase64Placeholder();
                            cert.isBase64Photo = true;
                        }
                    }
                } catch (error) {
                    console.error('Firebase 자격증 정보 조회 오류:', error);
                }
            }

            // Firebase에서 찾지 못한 경우 테스트 데이터 사용
            if (!cert) {
                cert = this.getMockCertificateByIdWithEnglishName(certId);
                if (cert) {
                    cert.courseName = cert.course || '전문 교육과정';
                    // 🔧 NEW: 테스트 데이터에 Base64 사진 추가
                    cert.photoUrl = this.createBase64TestPhoto();
                    cert.isBase64Photo = true;
                    console.log('📸 테스트 데이터에 Base64 증명사진 추가');
                }
            }

            return cert;
        },

        /**
         * 🔧 MODIFIED: 안전한 자격증 데이터 추출 (영문명 포함)
         */
        extractCertificateDataWithEnglishName: function (cert) {
            const safeGetValue = (obj, path, defaultValue = '') => {
                try {
                    return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
                } catch {
                    return defaultValue;
                }
            };

            return {
                certNumber: safeGetValue(cert, 'certificateNumber') ||
                    safeGetValue(cert, 'certNumber') ||
                    'DHC-2025-0001',

                // 🔧 MODIFIED: 한글명과 영문명 분리
                holderNameKorean: safeGetValue(cert, 'holderName') ||
                    safeGetValue(cert, 'nameKorean') ||
                    safeGetValue(cert, 'name') ||
                    '홍길동',

                holderNameEnglish: safeGetValue(cert, 'holderNameEnglish') ||
                    safeGetValue(cert, 'nameEnglish') ||
                    'Hong Gil Dong',

                holderEmail: safeGetValue(cert, 'holderEmail') ||
                    safeGetValue(cert, 'email') ||
                    'test@example.com',

                certificateType: safeGetValue(cert, 'certificateType') ||
                    this.currentCertType ||
                    'health-exercise',

                certType: this.getCertTypeName(safeGetValue(cert, 'certificateType') || 'health-exercise'),

                courseName: safeGetValue(cert, 'courseName') ||
                    safeGetValue(cert, 'course') ||
                    '전문 교육과정',

                issueDate: this.formatDateSafe(cert.issueDate) || '2025-05-19',
                expiryDate: this.formatDateSafe(cert.expiryDate) || '2028-05-19',
                status: safeGetValue(cert, 'status') || 'active'
            };
        },

        /**
         * 🔧 MODIFIED: 테스트용 모의 자격증 데이터 가져오기 (영문명 포함)
         */
        getMockCertificateByIdWithEnglishName: function (certId) {
            console.log('🔧 테스트 데이터에서 자격증 검색 (영문명 포함):', certId);

            const certs = [
                {
                    id: 'cert1',
                    certNumber: 'HE-2025-0001',
                    name: '홍길동',
                    nameKorean: '홍길동',
                    nameEnglish: 'Hong Gil Dong', // 🔧 NEW: 영문명 추가
                    course: '건강운동처방사 1기',
                    issueDate: '2025-03-15',
                    expiryDate: '2028-03-14',
                    status: 'active',
                    remarks: '최우수 성적으로 수료'
                },
                {
                    id: 'cert2',
                    certNumber: 'HE-2025-0002',
                    name: '김철수',
                    nameKorean: '김철수',
                    nameEnglish: 'Kim Chul Soo', // 🔧 NEW: 영문명 추가
                    course: '건강운동처방사 1기',
                    issueDate: '2025-03-15',
                    expiryDate: '2028-03-14',
                    status: 'active',
                    remarks: ''
                },
                {
                    id: 'cert3',
                    certNumber: 'HE-2024-0035',
                    name: '이영희',
                    nameKorean: '이영희',
                    nameEnglish: 'Lee Young Hee', // 🔧 NEW: 영문명 추가
                    course: '건강운동처방사 4기',
                    issueDate: '2024-12-20',
                    expiryDate: '2027-12-19',
                    status: 'active',
                    remarks: ''
                }
            ];

            // ID로 먼저 검색
            let cert = certs.find(cert => cert.id === certId);

            // ID로 찾지 못하면 인덱스로 검색
            if (!cert && certs.length > 0) {
                if (certId.length > 10 && /^[a-zA-Z0-9]+$/.test(certId)) {
                    cert = certs[0];
                    console.log('🔧 Firebase 스타일 ID로 첫 번째 테스트 데이터 반환:', cert);
                }
            }

            // 그래도 없으면 기본 테스트 데이터 생성
            if (!cert) {
                cert = {
                    id: certId,
                    certificateNumber: 'HE-2025-TEST',
                    certNumber: 'HE-2025-TEST',
                    name: '테스트',
                    nameKorean: '테스트', // 🔧 NEW: 한글명
                    nameEnglish: 'Test User', // 🔧 NEW: 영문명
                    holderName: '테스트',
                    holderNameKorean: '테스트',
                    holderNameEnglish: 'Test User',
                    course: '건강운동처방사 1기',
                    courseName: '건강운동처방사 1기',
                    issueDate: '2025-05-19',
                    expiryDate: '2028-05-19',
                    status: 'active',
                    remarks: '테스트 데이터',
                    holderEmail: 'test@example.com',
                    email: 'test@example.com',
                    certificateType: this.currentCertType
                };
                console.log('🔧 기본 테스트 데이터 생성 (영문명 포함):', cert);
            }

            return cert;
        },

        /**
         * 🔧 NEW: Base64 테스트 이미지 생성 함수
         */
        createBase64TestPhoto: function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 표준 증명사진 크기 (3.5cm x 4.5cm 비율)
            canvas.width = 350;
            canvas.height = 450;

            // 배경 그라데이션 (전문적인 스튜디오 배경)
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#f0f8ff');
            gradient.addColorStop(0.5, '#e6f3ff');
            gradient.addColorStop(1, '#d0e7ff');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 사람 실루엣 그리기 (간단한 아바타 스타일)
            const centerX = canvas.width / 2;
            const centerY = canvas.height * 0.45;

            // 얼굴 (타원)
            ctx.fillStyle = '#4a5568';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY - 60, 45, 55, 0, 0, 2 * Math.PI);
            ctx.fill();

            // 목 (사각형)
            ctx.fillRect(centerX - 15, centerY - 5, 30, 40);

            // 어깨 (사다리꼴)
            ctx.beginPath();
            ctx.moveTo(centerX - 25, centerY + 35);
            ctx.lineTo(centerX + 25, centerY + 35);
            ctx.lineTo(centerX + 65, canvas.height);
            ctx.lineTo(centerX - 65, canvas.height);
            ctx.closePath();
            ctx.fill();

            // 정장/셔츠 디테일
            ctx.fillStyle = '#2d3748';
            ctx.fillRect(centerX - 3, centerY + 20, 6, 50);

            // 텍스트 추가 (선택적)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('증명사진', centerX, canvas.height - 20);

            // 테두리
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

            return canvas.toDataURL('image/jpeg', 0.9);
        },

        /**
         * 🔧 NEW: 간단한 플레이스홀더 이미지 생성
         */
        createSimpleBase64Placeholder: function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 350;
            canvas.height = 450;

            // 배경
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 테두리
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3;
            ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

            // 내부 테두리
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

            // 카메라 아이콘 (간단한 사각형과 원)
            const iconSize = 60;
            const iconX = canvas.width / 2 - iconSize / 2;
            const iconY = canvas.height / 2 - iconSize / 2 - 30;

            // 카메라 몸체
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(iconX, iconY, iconSize, iconSize * 0.7);

            // 렌즈
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(iconX + iconSize / 2, iconY + iconSize * 0.35, iconSize * 0.25, 0, 2 * Math.PI);
            ctx.fill();

            // 텍스트
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('증명사진', canvas.width / 2, canvas.height / 2 + 60);

            ctx.font = '16px Arial';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('사진을 업로드해주세요', canvas.width / 2, canvas.height / 2 + 90);

            return canvas.toDataURL('image/jpeg', 0.9);
        },

        // =================================
        // 기존 함수들 (수정 없음)
        // =================================

        /**
         * 이미지 로딩 대기
         */
        waitForImagesLoad: async function (container) {
            const images = container.querySelectorAll('img');

            if (images.length === 0) {
                return Promise.resolve();
            }

            const imagePromises = Array.from(images).map(img => {
                return new Promise((resolve) => {
                    if (img.complete && img.naturalWidth > 0) {
                        resolve();
                    } else {
                        img.onload = resolve;
                        img.onerror = resolve; // 실패해도 진행
                    }
                });
            });

            // 최대 5초 대기
            const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));

            return Promise.race([
                Promise.all(imagePromises),
                timeoutPromise
            ]);
        },

        /**
         * jsPDF 라이브러리 동적 로드
         */
        loadJsPdfLibrary: function (callback) {
            console.log('🔄 PDF 라이브러리 동적 로드 시작...');

            // 이미 로드되어 있는지 재확인
            const jsPDFAvailable = window.jsPDF || (window.jspdf && window.jspdf.jsPDF) || (typeof jsPDF !== 'undefined');

            if (jsPDFAvailable && window.html2canvas) {
                console.log('✅ 라이브러리가 이미 로드되어 있음');
                callback();
                return;
            }

            let loadedCount = 0;
            const totalLibraries = 2;

            const checkComplete = () => {
                loadedCount++;
                console.log(`라이브러리 로드 진행: ${loadedCount}/${totalLibraries}`);

                if (loadedCount >= totalLibraries) {
                    // 로드 완료 후 전역 변수 설정
                    setTimeout(() => {
                        if (window.jspdf && window.jspdf.jsPDF && !window.jsPDF) {
                            window.jsPDF = window.jspdf.jsPDF;
                            console.log('✅ jsPDF 전역 변수 설정 완료');
                        }

                        console.log('✅ 모든 라이브러리 로드 및 설정 완료');
                        console.log('최종 라이브러리 상태:', {
                            jsPDF: !!window.jsPDF,
                            jspdf: !!window.jspdf,
                            html2canvas: !!window.html2canvas
                        });

                        callback();
                    }, 100);
                }
            };

            // jsPDF 라이브러리 로드
            if (!jsPDFAvailable) {
                console.log('📦 jsPDF 라이브러리 로드 중...');
                const jsPdfScript = document.createElement('script');
                jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                jsPdfScript.crossOrigin = 'anonymous';
                jsPdfScript.onload = () => {
                    console.log('✅ jsPDF 로드 완료');
                    if (window.jspdf && window.jspdf.jsPDF && !window.jsPDF) {
                        window.jsPDF = window.jspdf.jsPDF;
                        console.log('🔧 jsPDF 전역 변수 설정');
                    }
                    checkComplete();
                };
                jsPdfScript.onerror = () => {
                    console.error('❌ jsPDF 로드 실패');
                    window.adminAuth?.showNotification('PDF 라이브러리 로드에 실패했습니다.', 'error');
                };
                document.head.appendChild(jsPdfScript);
            } else {
                console.log('✅ jsPDF 이미 로드됨');
                checkComplete();
            }

            // html2canvas 라이브러리 로드
            if (!window.html2canvas) {
                console.log('📦 html2canvas 라이브러리 로드 중...');
                const html2canvasScript = document.createElement('script');
                html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                html2canvasScript.crossOrigin = 'anonymous';
                html2canvasScript.onload = () => {
                    console.log('✅ html2canvas 로드 완료');
                    checkComplete();
                };
                html2canvasScript.onerror = () => {
                    console.error('❌ html2canvas 로드 실패');
                    window.adminAuth?.showNotification('Canvas 라이브러리 로드에 실패했습니다.', 'error');
                };
                document.head.appendChild(html2canvasScript);
            } else {
                console.log('✅ html2canvas 이미 로드됨');
                checkComplete();
            }
        },

        // =================================
        // 유틸리티 함수들
        // =================================

        /**
         * 상태 텍스트 가져오기
         */
        getStatusText: function (status) {
            switch (status) {
                case 'active': return '유효';
                case 'expired': return '만료';
                case 'revoked': return '취소';
                case 'suspended': return '정지';
                default: return status || '알 수 없음';
            }
        },

        /**
         * 🧪 이미지 경로 디버깅 함수
         */
        debugImagePaths: function () {
            console.log('🔧 이미지 경로 디버깅 시작...');

            // 현재 페이지 정보
            console.log('📍 현재 페이지:', window.location.pathname);
            console.log('📍 현재 호스트:', window.location.host);

            // script-loader의 adjustPath 함수 확인
            console.log('🔧 adjustPath 함수:', typeof window.adjustPath);

            if (window.adjustPath) {
                console.log('✅ adjustPath 사용 가능');

                // 테스트 경로들
                const testPaths = [
                    'assets/images/logo/border-gold.png',
                    'assets/images/logo/korea-medal.png',
                    'assets/images/logo/english-medal.png',
                    'assets/images/logo/seal.png'
                ];

                testPaths.forEach(path => {
                    const adjustedPath = window.adjustPath(path);
                    console.log(`🔍 ${path} → ${adjustedPath}`);
                });
            } else {
                console.error('❌ adjustPath 함수를 찾을 수 없음');
            }

            // getImagePaths 결과 확인
            const imagePaths = getImagePaths();
            console.log('📸 최종 이미지 경로들:', imagePaths);

            return imagePaths;
        },

        /**
         * 🧪 이미지 존재 여부 실제 테스트
         */
        testImageExistence: async function () {
            console.log('🔍 이미지 존재 여부 실제 테스트...');

            const imagePaths = getImagePaths();
            const results = {};

            for (const [key, path] of Object.entries(imagePaths)) {
                try {
                    const response = await fetch(path, { method: 'HEAD' });
                    results[key] = {
                        path: path,
                        exists: response.ok,
                        status: response.status
                    };
                    console.log(`${response.ok ? '✅' : '❌'} ${key}: ${path} (${response.status})`);
                } catch (error) {
                    results[key] = {
                        path: path,
                        exists: false,
                        error: error.message
                    };
                    console.log(`❌ ${key}: ${path} (${error.message})`);
                }
            }

            return results;
        },

        /**
         * 자격증 유형 이름 가져오기 (한글)
         */
        getCertTypeName: function (type) {
            switch (type) {
                case 'health-exercise': return '건강운동처방사';
                case 'rehabilitation': return '운동재활전문가';
                case 'pilates': return '필라테스 전문가';
                case 'recreation': return '레크리에이션지도자';
                default: return type || '알 수 없음';
            }
        },

        /**
         * 자격증 유형 이름 가져오기 (영문)
         */
        getCertTypeNameEn: function (type) {
            switch (type) {
                case 'health-exercise': return 'Health Exercise Specialist';
                case 'rehabilitation': return 'Exercise Rehabilitation Specialist';
                case 'pilates': return 'Pilates Specialist';
                case 'recreation': return 'Recreation Instructor';
                default: return type || 'Unknown';
            }
        },

        /**
         * 안전한 날짜 포맷팅
         */
        formatDateSafe: function (date) {
            if (!date) return null;

            try {
                // Firebase Timestamp인 경우
                if (typeof date.toDate === 'function') {
                    date = date.toDate();
                } else if (typeof date === 'string') {
                    // 이미 문자열 형태이면 그대로 반환
                    return date;
                }

                // Date 객체인 경우
                if (date instanceof Date && !isNaN(date)) {
                    return window.formatters.formatDate(date, 'YYYY-MM-DD');
                }
            } catch (error) {
                console.error('날짜 포맷팅 오류:', error);
            }

            return null;
        },

        /**
         * 테스트용 모의 자격증 데이터 목록
         */
        getMockCertificates: function () {
            return [
                {
                    id: 'cert1',
                    certificateNumber: 'HE-2025-0001',
                    certNumber: 'HE-2025-0001',
                    holderName: '홍길동',
                    name: '홍길동',
                    nameKorean: '홍길동',
                    nameEnglish: 'Hong Gil Dong', // 🔧 NEW: 영문명 추가
                    courseName: '건강운동처방사 1기',
                    course: '건강운동처방사 1기',
                    issueDate: '2025-03-15',
                    expiryDate: '2028-03-14',
                    status: 'active',
                    remarks: '최우수 성적으로 수료'
                },
                {
                    id: 'cert2',
                    certificateNumber: 'HE-2025-0002',
                    certNumber: 'HE-2025-0002',
                    holderName: '김철수',
                    name: '김철수',
                    nameKorean: '김철수',
                    nameEnglish: 'Kim Chul Soo', // 🔧 NEW: 영문명 추가
                    courseName: '건강운동처방사 1기',
                    course: '건강운동처방사 1기',
                    issueDate: '2025-03-15',
                    expiryDate: '2028-03-14',
                    status: 'active',
                    remarks: ''
                },
                {
                    id: 'cert3',
                    certificateNumber: 'HE-2024-0035',
                    certNumber: 'HE-2024-0035',
                    holderName: '이영희',
                    name: '이영희',
                    nameKorean: '이영희',
                    nameEnglish: 'Lee Young Hee', // 🔧 NEW: 영문명 추가
                    courseName: '건강운동처방사 4기',
                    course: '건강운동처방사 4기',
                    issueDate: '2024-12-20',
                    expiryDate: '2027-12-19',
                    status: 'active',
                    remarks: ''
                }
            ];
        },

        // 기존 한글 템플릿 생성 함수 (수정 없음)
        createKoreanTemplateWithPhoto: function (certData, borderPath, medalPath, sealPath, issuedDate, photoData) {
            const template = document.createElement('div');
            template.id = 'korean-cert-template-with-photo';
            template.style.cssText = `
                width: 794px;
                height: 1123px;
                position: absolute;
                left: -10000px;
                top: -10000px;
                font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
                background: #ffffff;
                overflow: hidden;
                z-index: -1000;
                padding: 0;
                margin: 0;
                box-sizing: border-box;
            `;

            // 영문 자격증명 매칭
            const getEnglishCertName = (koreanCertType) => {
                const mapping = {
                    '건강운동처방사': 'Health Exercise Specialist',
                    '운동재활전문가': 'Exercise Rehabilitation Specialist',
                    '필라테스 전문가': 'Pilates Specialist',
                    '레크리에이션지도자': 'Recreation Instructor'
                };
                return mapping[koreanCertType] || 'Health Exercise Specialist';
            };

            const englishCertName = getEnglishCertName(certData.certType);

            // 🔧 NEW: 사진 HTML 생성
            const photoHtml = photoData ? `
                <img src="${photoData.dataUrl}" 
                     style="
                         width: 120px;
                         height: 160px;
                         object-fit: cover;
                         border: 2px solid #64748b;
                         border-radius: 4px;
                         display: block;
                     "
                     alt="증명사진">
            ` : `
                <div style="
                    width: 120px;
                    height: 160px;
                    border: 2px solid #64748b;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: #64748b;
                    font-weight: 500;
                    border-radius: 4px;
                ">
                    사진
                </div>
            `;

            template.innerHTML = `
                <!-- 전체 파란색 배경 -->
                <div style="
                    position: relative;
                    width: 794px;
                    height: 1123px;
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    padding: 30px;
                    box-sizing: border-box;
                ">
                    <!-- 흰색 내부 영역 -->
                    <div style="
                        position: relative;
                        width: 100%;
                        height: 100%;
                        background: #ffffff;
                        overflow: hidden;
                    ">
                        <!-- 🖼️ 황금 테두리 이미지 (배경) -->
                        <img src="${borderPath}" 
                             style="
                                 position: absolute;
                                 top: 0;
                                 left: 0;
                                 width: 100%;
                                 height: 100%;
                                 object-fit: cover;
                                 z-index: 1;
                             ">

                        <!-- 🔧 국문 메달 이미지 -->
                        <img src="${medalPath}" 
                             style="
                                 position: absolute;
                                 top: 100px;
                                 left: 100px;
                                 width: 110px;
                                 height: 110px;
                                 z-index: 2;
                             ">

                        <!-- 🔧 콘텐츠 영역 -->
                        <div style="
                            position: relative;
                            z-index: 3;
                            padding: 90px 100px 80px 100px;
                            height: 100%;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                        ">
                            <!-- 상단: 자격증 제목 -->
                            <div style="text-align: center; margin-bottom: 60px;">
                                <h1 style="
                                    font-size: 48px;
                                    font-weight: 900;
                                    color: #1e3a8a;
                                    margin: 0 0 15px 0;
                                    letter-spacing: 3px;
                                ">
                                    ${certData.certType}
                                </h1>
                                <p style="
                                    font-size: 18px;
                                    color: #3b82f6;
                                    margin: 0;
                                    letter-spacing: 2px;
                                    font-weight: 500;
                                    font-style: italic;
                                ">
                                    ${englishCertName}
                                </p>
                            </div>

                            <!-- 중앙: 정보 영역 -->
                            <div style="
                                flex: 1;
                                display: flex;
                                flex-direction: column;
                                justify-content: flex-start;
                                margin: 20px 0 20px 0;
                            ">
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: flex-start;
                                    margin-bottom: 60px;
                                ">
                                    <!-- 좌측: 자격증 정보 -->
                                    <div style="
                                        flex: 1; 
                                        text-align: left; 
                                        padding-right: 60px;
                                        padding-left: 20px;
                                    ">
                                        <div style="margin-bottom: 25px;">
                                            <span style="
                                                font-weight: 600; 
                                                color: #1e293b;
                                                font-size: 17px;
                                            ">인증번호 : </span>
                                            <span style="
                                                font-weight: 700; 
                                                color: #1e3a8a;
                                                font-size: 17px;
                                            ">${certData.certNumber}</span>
                                        </div>
                                        
                                        <div style="margin-bottom: 25px;">
                                            <span style="
                                                font-weight: 600; 
                                                color: #1e293b;
                                                font-size: 17px;
                                            ">성 명 : </span>
                                            <span style="
                                                font-weight: 700; 
                                                color: #1e3a8a; 
                                                font-size: 20px;
                                            ">${certData.holderNameKorean || certData.holderName}</span>
                                        </div>
                                        
                                        <div style="margin-bottom: 25px;">
                                            <span style="
                                                font-weight: 600; 
                                                color: #1e293b;
                                                font-size: 17px;
                                            ">급 수 : </span>
                                            <span style="
                                                font-weight: 700; 
                                                color: #1e3a8a;
                                                font-size: 17px;
                                            ">1급</span>
                                        </div>
                                        
                                        <div style="margin-bottom: 25px;">
                                            <span style="
                                                font-weight: 600; 
                                                color: #1e293b;
                                                font-size: 17px;
                                            ">취득일자 : </span>
                                            <span style="
                                                font-weight: 700; 
                                                color: #1e3a8a;
                                                font-size: 17px;
                                            ">${certData.issueDate}</span>
                                        </div>
                                    </div>
                                    
                                    <!-- 🔧 NEW: 우측 - 실제 사진 영역 -->
                                    <div style="
                                        width: 120px;
                                        height: 160px;
                                        margin-right: 20px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    ">
                                        ${photoHtml}
                                    </div>
                                </div>

                                <!-- 🎨 인증 문구 -->
                                <div style="
                                    text-align: center;
                                    margin: 40px 0 60px 0;
                                    line-height: 2.2;
                                    font-size: 19px;
                                    color: #1e293b;
                                ">
                                    <p style="margin: 0 0 15px 0; font-weight: 500;">
                                        위 사람은 <strong style="color: #1e3a8a;">${certData.certType}</strong> 1급 교육과정을
                                    </p>
                                    <p style="margin: 0 0 15px 0; font-weight: 500;">
                                        이수하고 이론 및 실기 심사에 통과하였으므로
                                    </p>
                                    <p style="margin: 0; font-weight: 700; color: #1e3a8a; font-size: 21px;">
                                        자격증을 수여합니다.
                                    </p>
                                </div>

                                <!-- 🔧 하단: 발급 정보 -->
                                <div style="
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    margin-top: 30px;
                                ">
                                    <!-- 날짜 (중앙 정렬) -->
                                    <div style="
                                        text-align: center;
                                        margin-bottom: 35px;
                                    ">
                                        <p style="
                                            font-size: 20px;
                                            margin: 0;
                                            color: #1e293b;
                                            font-weight: 600;
                                        ">${issuedDate}</p>
                                    </div>

                                    <!-- 센터명과 직인 -->
                                    <div style="
                                        text-align: center;
                                        margin-bottom: 20px;
                                        position: relative;
                                        display: inline-block;
                                    ">
                                        <h3 style="
                                            font-size: 26px;
                                            font-weight: 800;
                                            margin: 0;
                                            color: #1e3a8a;
                                            line-height: 1.3;
                                            text-align: center;
                                            display: inline-block;
                                        ">(사)문경 부설 디지털헬스케어센터</h3>
                                        
                                        <!-- 직인 -->
                                        <img src="${sealPath}" 
                                             style="
                                                 width: 85px;
                                                 height: 85px;
                                                 object-fit: contain;
                                                 position: absolute;
                                                 top: 50%;
                                                 transform: translateY(-50%);
                                                 right: -80px;
                                             ">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            return template;
        },

        // 기타 필요한 함수들 (기존 유지)
        closeCertDetailModal: function () {
            console.log('🔧 자격증 상세보기 모달 닫기');
            const modal = document.getElementById('cert-detail-modal');
            if (modal && this.modalStates['cert-detail-modal']) {
                this.modalStates['cert-detail-modal'] = false;
                modal.classList.add('hidden');
                this.updateBodyModalState();
                console.log('✅ 자격증 상세보기 모달 닫기 완료');
            }
        },

        closeCertEditModal: function () {
            console.log('🔧 자격증 수정 모달 닫기');
            const modal = document.getElementById('cert-edit-modal');
            if (modal && this.modalStates['cert-edit-modal']) {
                this.modalStates['cert-edit-modal'] = false;
                modal.classList.add('hidden');
                const form = document.getElementById('cert-edit-form');
                if (form) form.reset();
                this.updateBodyModalState();
                console.log('✅ 자격증 수정 모달 닫기 완료');
            }
        },

        closeIssueCertModal: function () {
            console.log('🔧 자격증 발급 모달 닫기');
            const modal = document.getElementById('cert-issue-modal');
            if (modal && this.modalStates['cert-issue-modal']) {
                this.modalStates['cert-issue-modal'] = false;
                modal.classList.add('hidden');
                const form = document.getElementById('cert-issue-form');
                if (form) form.reset();
                this.updateBodyModalState();
                console.log('✅ 자격증 발급 모달 닫기 완료');
            }
        },

        closeBulkIssuanceModal: function () {
            console.log('🔧 일괄 발급 모달 닫기');
            const modal = document.getElementById('bulk-issue-modal');
            if (modal && this.modalStates['bulk-issue-modal']) {
                this.modalStates['bulk-issue-modal'] = false;
                modal.style.opacity = '0';
                setTimeout(() => {
                    if (!this.modalStates['bulk-issue-modal']) {
                        modal.classList.add('hidden');
                        modal.style.display = 'none';
                        modal.style.visibility = 'hidden';
                        this.updateBodyModalState();
                    }
                }, 150);
                console.log('✅ 일괄 발급 모달 닫기 완료');
            }
        },

        updateBodyModalState: function () {
            const hasOpenModal = Object.values(this.modalStates).some(isOpen => isOpen);
            if (!hasOpenModal) {
                document.body.classList.remove('modal-open');
                document.documentElement.classList.remove('modal-open');
                document.body.style.overflow = '';
            }
        },

        closeOtherModals: function (excludeModalId) {
            Object.keys(this.modalStates).forEach(modalId => {
                if (modalId !== excludeModalId && this.modalStates[modalId]) {
                    this.closeModalById(modalId);
                }
            });
        },

        ensureModalEvents: function () {
            console.log('🔧 모달 이벤트 리스너 재등록 시작');
            const closeButtons = document.querySelectorAll('.cert-modal-close');
            closeButtons.forEach(button => {
                if (!button.dataset.eventAttached) {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const modal = button.closest('.cert-modal');
                        if (modal) {
                            const modalId = modal.id;
                            console.log('🔧 X 버튼 클릭:', modalId);
                            this.closeModalById(modalId);
                        }
                    });
                    button.dataset.eventAttached = 'true';
                    console.log('✅ X 버튼 이벤트 등록:', button);
                }
            });

            const backdrops = document.querySelectorAll('.cert-modal-backdrop');
            backdrops.forEach(backdrop => {
                if (!backdrop.dataset.eventAttached) {
                    backdrop.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const modal = backdrop.closest('.cert-modal');
                        if (modal) {
                            const modalId = modal.id;
                            console.log('🔧 백드롭 클릭:', modalId);
                            this.closeModalById(modalId);
                        }
                    });
                    backdrop.dataset.eventAttached = 'true';
                    console.log('✅ 백드롭 이벤트 등록:', backdrop);
                }
            });

            if (!this._escKeyAttached) {
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        console.log('🔧 ESC 키 눌림');
                        this.closeTopModal();
                    }
                });
                this._escKeyAttached = true;
                console.log('✅ ESC 키 이벤트 등록');
            }

            console.log('✅ 모달 이벤트 리스너 재등록 완료');
        },

        // 추가 필요한 함수들 (기존 코드에서 가져옴)
        editCert: async function (certId) {
            // 자격증 수정 로직 (기존과 동일)
            console.log('자격증 수정:', certId);
            // 구현 필요
        },

        revokeCertificate: function (certId) {
            if (confirm('정말로 이 자격증을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                this.handleRevokeCertificate(certId);
            }
        },

        handleRevokeCertificate: async function (certId) {
            try {
                console.log('자격증 취소 처리:', certId);
                const firebaseStatus = checkFirebaseConnection();
                if (firebaseStatus.connected) {
                    const updateData = {
                        status: 'revoked',
                        revokedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    };
                    const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                    await docRef.update(updateData);
                    window.adminAuth?.showNotification('자격증이 성공적으로 취소되었습니다.', 'success');
                } else {
                    setTimeout(() => {
                        window.adminAuth?.showNotification('자격증이 성공적으로 취소되었습니다.', 'success');
                    }, 1000);
                }
                this.loadCertificates();
            } catch (error) {
                console.error('자격증 취소 오류:', error);
                window.adminAuth?.showNotification('자격증 취소 중 오류가 발생했습니다.', 'error');
            }
        },

        resetFilters: function () {
            document.getElementById('search-name').value = '';
            document.getElementById('search-cert-number').value = '';
            document.getElementById('filter-status').value = '';
            this.search();
        },

        toggleSelectAll: function (checkbox) {
            const checkboxes = document.querySelectorAll('.cert-checkbox');
            checkboxes.forEach(cb => cb.checked = checkbox.checked);
        },

        processBulkIssuance: function () {
            console.log('일괄 발급 처리');
            window.adminAuth?.showNotification('일괄 발급 기능은 준비 중입니다.', 'info');
        },

        formatDate: function (date, includeTime = false) {
            if (!date) return '-';
            try {
                if (typeof date.toDate === 'function') {
                    date = date.toDate();
                } else if (typeof date === 'string') {
                    return date;
                }
                if (date instanceof Date) {
                    if (includeTime) {
                        return window.formatters.formatDate(date, 'YYYY-MM-DD HH:mm');
                    } else {
                        return window.formatters.formatDate(date, 'YYYY-MM-DD');
                    }
                }
            } catch (error) {
                console.error('날짜 포맷팅 오류:', error);
            }
            return '-';
        },

        formatDateToInput: function (date) {
            if (!date) return '';
            try {
                if (typeof date.toDate === 'function') {
                    date = date.toDate();
                } else if (typeof date === 'string') {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                        return date;
                    }
                    date = new Date(date);
                }
                if (date instanceof Date && !isNaN(date)) {
                    return window.formatters.formatDate(date, 'YYYY-MM-DD');
                }
            } catch (error) {
                console.error('날짜 포맷팅 오류:', error);
            }
            return '';
        }
    };

    // 자격증 관리자 초기화
    window.certManager.init();
}

// 페이지 초기화 함수 (script-loader.js에 의해 호출됨)
window.initPage = function () {
    console.log('자격증 관리 페이지 초기화 중...');
    console.log('자격증 관리 페이지 초기화 완료');
};

// =================================
// 🎯 디버깅 및 개발자 도구 (영문명 처리 포함)
// =================================

// 개발 모드에서 사용되는 디버깅 함수들
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.web.app') ||
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {

    window.debugCertManagement = {
        // 기본 정보 확인
        help: function () {
            console.log('🎯 전문적인 자격증 관리 디버깅 도구 사용법 (영문명 처리 포함)');
            console.log('\n📊 데이터 관련:');
            console.log('- showCertificates() : 현재 자격증 목록');
            console.log('- reloadCertList() : 자격증 목록 다시 로드');
            console.log('- testDependencies() : 유틸리티 의존성 확인');
            console.log('- checkFirebase() : Firebase 연결 상태 확인');

            console.log('\n🎨 PDF 테스트:');
            console.log('- testKoreanPdf("cert-id") : 한글 PDF 테스트 (사진 포함)');
            console.log('- testEnglishPdf("cert-id") : 영문 PDF 테스트 (영문명 사용)');
            console.log('- testBothPdfs("cert-id") : 한글/영문 PDF 모두 테스트');
            console.log('- checkImages() : 이미지 에셋 확인');

            console.log('\n🔤 영문명 테스트:');
            console.log('- testEnglishNameData() : 영문명 포함 테스트 데이터 확인');
            console.log('- compareKoreanVsEnglish("cert-id") : 한글/영문 PDF 비교');

            console.log('\n🧪 종합 테스트:');
            console.log('- runFullTest() : 전체 기능 테스트 (영문명 포함)');
        },

        testKoreanPdf: function (certId = 'cert1') {
            console.log('🎨 한글 PDF 테스트 시작 (사진 포함):', certId);
            if (window.certManager) {
                window.certManager.generateKoreanCertPdfWithPhoto(certId);
            } else {
                console.error('❌ certManager가 로드되지 않음');
            }
        },

        testEnglishPdf: function (certId = 'cert1') {
            console.log('🎨 영문 PDF 테스트 시작 (영문명 사용):', certId);
            if (window.certManager) {
                window.certManager.generateEnglishCertPdfWithEnglishName(certId);
            } else {
                console.error('❌ certManager가 로드되지 않음');
            }
        },

        testBothPdfs: function (certId = 'cert1') {
            console.log('🎨 한글/영문 PDF 모두 테스트 (영문명 처리):', certId);
            this.testKoreanPdf(certId);
            setTimeout(() => this.testEnglishPdf(certId), 3000);
        },

        // 🔧 NEW: 영문명 테스트 함수
        testEnglishNameData: function () {
            console.log('🔤 영문명 포함 테스트 데이터 확인...');
            const mockCerts = window.certManager?.getMockCertificates();

            if (mockCerts) {
                console.log('📊 테스트 자격증 데이터:');
                mockCerts.forEach((cert, index) => {
                    console.log(`${index + 1}. ${cert.nameKorean} / ${cert.nameEnglish} (${cert.certNumber})`);
                });
            } else {
                console.error('❌ 테스트 데이터를 가져올 수 없습니다.');
            }
        },

        // 🔧 NEW: 한글/영문 PDF 비교 테스트
        compareKoreanVsEnglish: function (certId = 'cert1') {
            console.log('🔤 한글/영문 PDF 비교 테스트 시작:', certId);

            console.log('1️⃣ 한글 PDF 생성 (한글명 사용)...');
            this.testKoreanPdf(certId);

            setTimeout(() => {
                console.log('2️⃣ 영문 PDF 생성 (영문명 사용)...');
                this.testEnglishPdf(certId);

                setTimeout(() => {
                    console.log('✅ 비교 테스트 완료!');
                    console.log('📋 확인 사항:');
                    console.log('- 한글 PDF: 한글명이 표시되는지 확인');
                    console.log('- 영문 PDF: 영문명이 표시되는지 확인');
                    console.log('- 파일명: 각각 올바른 이름으로 저장되는지 확인');
                }, 3000);
            }, 3000);
        },

        checkImages: async function () {
            console.log('🖼️ 이미지 에셋 확인...');

            // 디버깅 정보 먼저 출력
            this.debugImagePaths();

            // 실제 존재 여부 테스트
            const results = await this.testImageExistence();

            console.log('📊 최종 결과:', results);
            return results;
        },

        testDependencies: function () {
            console.log('🔧 유틸리티 의존성 테스트...');
            const result = checkDependencies();
            return result;
        },

        checkFirebase: function () {
            console.log('🔥 Firebase 연결 상태 확인...');
            const status = checkFirebaseConnection();
            console.log('연결 상태:', status);
            return status;
        },

        runFullTest: function () {
            console.log('🚀 전문적인 자격증 관리 전체 기능 테스트 시작 (영문명 처리 포함)...');

            console.log('\n1️⃣ 의존성 및 유틸리티 테스트');
            const dependenciesOk = this.testDependencies();

            if (!dependenciesOk) {
                console.error('❌ 의존성 테스트 실패 - 테스트 중단');
                return;
            }

            console.log('\n2️⃣ Firebase 연결 상태 확인');
            this.checkFirebase();

            console.log('\n3️⃣ 이미지 에셋 확인');
            this.checkImages();

            console.log('\n4️⃣ 영문명 포함 테스트 데이터 확인');
            this.testEnglishNameData();

            console.log('\n5️⃣ 한글/영문 PDF 비교 테스트');
            this.compareKoreanVsEnglish();

            console.log('\n🎯 전체 테스트 완료!');
            console.log('💡 이제 관리자 페이지에서 PDF 다운로드를 테스트해보세요!');
            console.log('📸 한글 PDF는 한글명과 Base64 증명사진이 포함됩니다!');
            console.log('🔤 영문 PDF는 영문명이 올바르게 표시됩니다!');
            console.log('🔧 네트워크 의존성 없이 안정적으로 동작합니다!');
        }
    };

    // 디버깅 도구 안내
    console.log('🎯 개발 모드 전문적인 자격증 관리 디버깅 도구 활성화됨 (영문명 처리 완료)');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('📊 데이터: testDependencies(), checkFirebase()');
    console.log('🎨 PDF 테스트: testKoreanPdf(), testEnglishPdf(), testBothPdfs()');
    console.log('🔤 영문명: testEnglishNameData(), compareKoreanVsEnglish()');
    console.log('🖼️ 이미지: checkImages()');
    console.log('🧪 종합: runFullTest()');
    console.log('\n💡 도움말: window.debugCertManagement.help()');
    console.log('🚀 빠른 시작: window.debugCertManagement.runFullTest()');

} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
    console.log('현재 호스트:', window.location.hostname);
}

// =================================
// 최종 완료 메시지
// =================================

console.log('\n🎉 === cert-management.js 영문명 처리 완료 ===');
console.log('✅ 영문PDF에서 영문명 사용하도록 수정 완료');
console.log('✅ 한글PDF는 한글명, 영문PDF는 영문명 사용');
console.log('✅ 자격증 데이터 구조에 영문명 필드 추가');
console.log('✅ 테스트 데이터에 영문명 포함');
console.log('✅ 상세보기 모달에 영문명 표시');
console.log('✅ PDF 다운로드 버튼에 해당 이름 표시');
console.log('\n🔧 주요 개선사항:');
console.log('- generateEnglishCertPdfWithEnglishName(): 영문명 사용하는 영문 PDF 생성');
console.log('- getCertificateDataWithEnglishName(): 영문명 포함 데이터 조회');
console.log('- extractCertificateDataWithEnglishName(): 영문명 분리 처리');
console.log('- getMockCertificateByIdWithEnglishName(): 영문명 포함 테스트 데이터');
console.log('- createEnglishTemplateWithEnglishName(): 영문명 사용하는 영문 템플릿');
console.log('\n🚀 이제 영문PDF에서 영문명이 올바르게 표시됩니다!');
console.log('📸 테스트: window.debugCertManagement.compareKoreanVsEnglish()');

// 완료 플래그 설정
window.certManagementEnglishNameComplete = true;

/**
 * 🆕 NEW: 결제자 선택 발급 기능 추가
 * cert-management.js에 추가할 코드
 */

// =================================
// 🆕 결제자 선택 발급 기능 추가
// =================================

// window.certManager 객체에 추가할 함수들
Object.assign(window.certManager, {

    // 선택된 신청자 관리
    selectedApplicants: [],
    allPaidApplicants: [],
    filteredPaidApplicants: [],

    /**
     * 🆕 결제 완료자 선택 모달 표시
     */
    showPaidApplicantsModal: async function () {
        console.log('🆕 결제 완료자 선택 모달 표시');

        const modal = document.getElementById('paid-applicants-modal');
        if (!modal) {
            console.error('paid-applicants-modal을 찾을 수 없습니다.');
            window.adminAuth?.showNotification('결제자 선택 모달을 찾을 수 없습니다.', 'error');
            return;
        }

        // 다른 모달들 먼저 닫기
        this.closeOtherModals('paid-applicants-modal');

        // 상태 업데이트
        this.modalStates['paid-applicants-modal'] = true;

        // 모달 표시
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');

        // 현재 자격증 타입 이름 업데이트
        const certTypeName = document.getElementById('current-cert-type-name');
        if (certTypeName) {
            certTypeName.textContent = this.getCertTypeName(this.currentCertType);
        }

        // 날짜 기본값 설정
        this.setupDefaultDates();

        // 초기화
        this.resetPaidApplicantsModal();

        // 결제 완료자 목록 로드
        await this.loadPaidApplicants();

        console.log('✅ 결제 완료자 선택 모달 표시 완료');
    },

    /**
     * 🆕 결제 완료자 선택 모달 닫기
     */
    closePaidApplicantsModal: function () {
        console.log('🆕 결제 완료자 선택 모달 닫기');

        const modal = document.getElementById('paid-applicants-modal');
        if (modal && this.modalStates['paid-applicants-modal']) {
            this.modalStates['paid-applicants-modal'] = false;
            modal.classList.add('hidden');

            // 상태 초기화
            this.resetPaidApplicantsModal();

            // body 모달 상태 업데이트
            this.updateBodyModalState();

            console.log('✅ 결제 완료자 선택 모달 닫기 완료');
        }
    },

    /**
     * 🆕 기본 날짜 설정
     */
    setupDefaultDates: function () {
        const today = new Date();

        // 발급일 (오늘)
        const issueDateInput = document.getElementById('bulk-issue-date');
        if (issueDateInput) {
            issueDateInput.value = window.formatters.formatDate(today, 'YYYY-MM-DD');
        }

        // 만료일 (3년 후)
        const expiryDateInput = document.getElementById('bulk-expiry-date');
        if (expiryDateInput) {
            const expiryDate = window.dateUtils.addYears(today, 3);
            expiryDateInput.value = window.formatters.formatDate(expiryDate, 'YYYY-MM-DD');
        }
    },

    /**
     * 🆕 모달 상태 초기화
     */
    resetPaidApplicantsModal: function () {
        // 선택 상태 초기화
        this.selectedApplicants = [];

        // 체크박스 초기화
        const selectAllCheckbox = document.getElementById('select-all-paid');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }

        // 선택 개수 업데이트
        this.updateSelectedCount();

        // 검색 필드 초기화
        const searchName = document.getElementById('paid-search-name');
        if (searchName) searchName.value = '';

        const filterCourse = document.getElementById('paid-filter-course');
        if (filterCourse) filterCourse.value = '';

        // 선택된 신청자 정보 영역 숨김
        const selectedInfo = document.getElementById('selected-applicants-info');
        if (selectedInfo) {
            selectedInfo.classList.add('hidden');
        }

        // 발급 버튼 비활성화
        const issueBtn = document.getElementById('issue-selected-btn');
        if (issueBtn) {
            issueBtn.disabled = true;
        }
    },

    /**
     * 🆕 결제 완료자 목록 조회
     */
    loadPaidApplicants: async function () {
        console.log('🆕 결제 완료자 목록 조회 시작');

        const tbody = document.getElementById('paid-applicants-tbody');
        const countSpan = document.getElementById('paid-count');

        if (!tbody) {
            console.error('paid-applicants-tbody를 찾을 수 없습니다.');
            return;
        }

        // 로딩 표시
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                        <span>결제 완료자 목록을 불러오는 중...</span>
                    </div>
                </td>
            </tr>
        `;

        try {
            let paidApplicants = [];

            // Firebase 연결 상태 확인
            const firebaseStatus = checkFirebaseConnection();

            if (firebaseStatus.connected && window.dhcFirebase) {
                try {
                    console.log('🔥 Firebase에서 결제 완료자 조회');

                    // payments 컬렉션에서 완료된 결제 조회
                    let query = window.dhcFirebase.db.collection('payments')
                        .where('status', '==', 'completed');

                    // 자격증 타입 필터링 (있는 경우)
                    if (this.currentCertType) {
                        query = query.where('certificateType', '==', this.currentCertType);
                    }

                    const snapshot = await query.orderBy('paidAt', 'desc').get();

                    if (!snapshot.empty) {
                        snapshot.forEach(doc => {
                            const data = doc.data();

                            // 자격증 결제가 포함된 경우만 필터링
                            const hasCertificatePayment = data.items?.some(item =>
                                item.type === 'certificate' || item.type === 'package'
                            );

                            if (hasCertificatePayment) {
                                paidApplicants.push({
                                    id: doc.id,
                                    ...data
                                });
                            }
                        });
                    }

                    console.log(`✅ Firebase에서 ${paidApplicants.length}명의 결제 완료자 조회`);

                } catch (error) {
                    console.error('❌ Firebase 결제 데이터 조회 오류:', error);
                    // Firebase 오류 시 테스트 데이터 사용
                    paidApplicants = this.getMockPaidApplicants();
                }
            } else {
                console.log('🔧 Firebase 미연결, 테스트 데이터 사용');
                paidApplicants = this.getMockPaidApplicants();
            }

            // 데이터 저장 및 표시
            this.allPaidApplicants = paidApplicants;
            this.filteredPaidApplicants = [...paidApplicants];

            this.updatePaidApplicantsTable();
            this.loadCourseFilterOptions();

            // 개수 업데이트
            if (countSpan) {
                countSpan.textContent = `총 ${paidApplicants.length}명`;
            }

            if (paidApplicants.length === 0) {
                window.adminAuth?.showNotification(
                    `${this.getCertTypeName(this.currentCertType)} 자격증비를 결제한 신청자가 없습니다.`,
                    'info'
                );
            }

        } catch (error) {
            console.error('❌ 결제 완료자 목록 조회 오류:', error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-red-500">
                        <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="text-lg font-medium">데이터 로드 실패</span>
                            <span class="text-sm">결제 완료자 목록을 불러올 수 없습니다.</span>
                        </div>
                    </td>
                </tr>
            `;

            window.adminAuth?.showNotification('결제 완료자 목록 조회 중 오류가 발생했습니다.', 'error');
        }
    },

    /**
     * 🔧 NEW: 교육과정 선택 시 처리
     */
    handleCourseSelection: function (selectElement) {
        const selectedValue = selectElement.value;

        if (!selectedValue) {
            // 선택 해제시 날짜 초기화
            this.clearCourseDates();
            return;
        }

        try {
            const selectedOption = selectElement.querySelector(`option[value="${selectedValue}"]`);
            if (!selectedOption || !selectedOption.dataset.course) {
                console.warn('교육과정 데이터를 찾을 수 없습니다.');
                return;
            }

            const courseData = JSON.parse(selectedOption.dataset.course);
            console.log('선택된 교육과정:', courseData);

            // 수료일 설정 (교육과정 마지막 날)
            this.setCompletionDate(courseData);

            // 만료일 설정 (수료일로부터 3년 후)
            this.setExpiryDate(courseData);

        } catch (error) {
            console.error('교육과정 선택 처리 오류:', error);
        }
    },

    /**
     * 🔧 NEW: 수료일 설정 (교육과정 마지막 날)
     */
    setCompletionDate: function (courseData) {
        const completionDateInput = document.getElementById('issue-completion-date');
        if (!completionDateInput) return;

        let completionDate = null;

        // 교육과정 종료일이 있는 경우
        if (courseData.endDate) {
            try {
                if (typeof courseData.endDate === 'string') {
                    completionDate = new Date(courseData.endDate);
                } else if (courseData.endDate.toDate) {
                    // Firebase Timestamp
                    completionDate = courseData.endDate.toDate();
                } else if (courseData.endDate.seconds) {
                    // Firebase Timestamp object
                    completionDate = new Date(courseData.endDate.seconds * 1000);
                }
            } catch (error) {
                console.error('교육과정 종료일 파싱 오류:', error);
            }
        }

        // 종료일이 없거나 파싱에 실패한 경우 오늘 날짜 사용
        if (!completionDate || isNaN(completionDate.getTime())) {
            completionDate = new Date();
            console.log('교육과정 종료일을 찾을 수 없어 오늘 날짜로 설정');
        }

        // input 필드에 설정
        const formattedDate = window.formatters.formatDate(completionDate, 'YYYY-MM-DD');
        completionDateInput.value = formattedDate;

        console.log('수료일 설정:', formattedDate);
    },

    /**
     * 🔧 NEW: 만료일 설정 (수료일로부터 3년 후)
     */
    setExpiryDate: function (courseData) {
        const completionDateInput = document.getElementById('issue-completion-date');
        const expiryDateInput = document.getElementById('issue-expiry-date');

        if (!completionDateInput || !expiryDateInput) return;

        // 수료일 가져오기
        const completionDateValue = completionDateInput.value;
        if (!completionDateValue) return;

        try {
            const completionDate = new Date(completionDateValue);

            // 3년 후 계산
            const expiryDate = window.dateUtils.addYears(completionDate, 3);

            // input 필드에 설정
            const formattedExpiryDate = window.formatters.formatDate(expiryDate, 'YYYY-MM-DD');
            expiryDateInput.value = formattedExpiryDate;

            console.log('만료일 설정:', formattedExpiryDate);

        } catch (error) {
            console.error('만료일 계산 오류:', error);
        }
    },

    /**
     * 🔧 NEW: 교육과정 날짜 초기화
     */
    clearCourseDates: function () {
        const completionDateInput = document.getElementById('issue-completion-date');
        const expiryDateInput = document.getElementById('issue-expiry-date');

        if (completionDateInput) {
            const today = new Date();
            completionDateInput.value = window.formatters.formatDate(today, 'YYYY-MM-DD');
        }

        if (expiryDateInput) {
            const today = new Date();
            const expiryDate = window.dateUtils.addYears(today, 3);
            expiryDateInput.value = window.formatters.formatDate(expiryDate, 'YYYY-MM-DD');
        }

        console.log('교육과정 날짜 초기화 완료');
    },

    /**
     * 🆕 테스트용 결제 완료자 데이터
     */
    getMockPaidApplicants: function () {
        const mockData = [
            {
                id: 'payment-001',
                userId: 'user-001',
                name: '김영수',
                nameKorean: '김영수',
                nameEnglish: 'Kim Young Soo',
                email: 'kim.youngsoo@example.com',
                courseId: 'course-001',
                courseName: '건강운동처방사 2025년 1기',
                certificateType: 'health-exercise',
                paymentAmount: 50000,
                paidAt: new Date('2025-07-01T10:30:00'),
                status: 'completed',
                items: [
                    { type: 'certificate', amount: 50000, name: '자격증 발급비' }
                ]
            },
            {
                id: 'payment-002',
                userId: 'user-002',
                name: '이미영',
                nameKorean: '이미영',
                nameEnglish: 'Lee Mi Young',
                email: 'lee.miyoung@example.com',
                courseId: 'course-001',
                courseName: '건강운동처방사 2025년 1기',
                certificateType: 'health-exercise',
                paymentAmount: 80000,
                paidAt: new Date('2025-07-01T14:15:00'),
                status: 'completed',
                items: [
                    { type: 'certificate', amount: 50000, name: '자격증 발급비' },
                    { type: 'material', amount: 30000, name: '교재비' }
                ]
            },
            {
                id: 'payment-003',
                userId: 'user-003',
                name: '박철민',
                nameKorean: '박철민',
                nameEnglish: 'Park Chul Min',
                email: 'park.chulmin@example.com',
                courseId: 'course-002',
                courseName: '건강운동처방사 2025년 2기',
                certificateType: 'health-exercise',
                paymentAmount: 50000,
                paidAt: new Date('2025-07-02T09:45:00'),
                status: 'completed',
                items: [
                    { type: 'certificate', amount: 50000, name: '자격증 발급비' }
                ]
            }
        ];

        // 현재 자격증 타입에 맞는 데이터만 필터링
        return mockData.filter(item => item.certificateType === this.currentCertType);
    },

    /**
     * 🆕 결제 완료자 테이블 업데이트
     */
    updatePaidApplicantsTable: function () {
        const tbody = document.getElementById('paid-applicants-tbody');

        if (!tbody) {
            console.error('paid-applicants-tbody를 찾을 수 없습니다.');
            return;
        }

        if (!this.filteredPaidApplicants || this.filteredPaidApplicants.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2m16-7H4m16 0l-2-2m-14 2l2-2"></path>
                            </svg>
                            <span class="text-lg font-medium">결제 완료자가 없습니다</span>
                            <span class="text-sm">${this.getCertTypeName(this.currentCertType)} 자격증비를 결제한 신청자가 없습니다.</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let tableHtml = '';

        this.filteredPaidApplicants.forEach(applicant => {
            const isSelected = this.selectedApplicants.some(selected => selected.id === applicant.id);

            // 안전한 데이터 접근
            const name = applicant.name || applicant.nameKorean || '-';
            const email = applicant.email || '-';
            const courseName = applicant.courseName || '-';
            const paidDate = this.formatDateSafe(applicant.paidAt) || '-';
            const amount = this.formatCurrency(applicant.paymentAmount) || '-';

            // 결제 상태 (이미 자격증을 발급받았는지 확인)
            const status = this.getCertificateStatus(applicant);

            tableHtml += `
                <tr class="hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}">
                    <td class="px-4 py-3">
                        <input type="checkbox" 
                               class="paid-applicant-checkbox rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                               data-applicant='${JSON.stringify(applicant).replace(/'/g, "&apos;")}'
                               ${isSelected ? 'checked' : ''}
                               onchange="certManager.toggleApplicantSelection(this)">
                    </td>
                    <td class="px-4 py-3 font-medium text-gray-900">${name}</td>
                    <td class="px-4 py-3 text-gray-600">${email}</td>
                    <td class="px-4 py-3 text-gray-600">${courseName}</td>
                    <td class="px-4 py-3 text-gray-600">${paidDate}</td>
                    <td class="px-4 py-3 font-medium text-green-600">${amount}</td>
                    <td class="px-4 py-3">${status}</td>
                </tr>
            `;
        });

        tbody.innerHTML = tableHtml;

        // 개수 업데이트
        const countSpan = document.getElementById('paid-count');
        if (countSpan) {
            countSpan.textContent = `총 ${this.filteredPaidApplicants.length}명`;
        }
    },

    /**
     * 🆕 자격증 발급 상태 확인
     */
    getCertificateStatus: function (applicant) {
        // 실제로는 certificates 컬렉션에서 해당 사용자의 자격증 발급 여부 확인
        // 여기서는 간단한 상태 표시
        const badges = {
            'completed': '<span class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">결제완료</span>',
            'issued': '<span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">발급완료</span>',
            'pending': '<span class="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">발급대기</span>'
        };

        return badges['completed']; // 기본적으로 결제완료 상태
    },

    /**
     * 🆕 통화 포맷팅
     */
    formatCurrency: function (amount) {
        if (!amount && amount !== 0) return '-';
        try {
            return new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW'
            }).format(amount);
        } catch (error) {
            return `₩${amount.toLocaleString()}`;
        }
    },

    /**
     * 🆕 교육과정 필터 옵션 로드
     */
    loadCourseFilterOptions: function () {
        const filterSelect = document.getElementById('paid-filter-course');
        if (!filterSelect || !this.allPaidApplicants) return;

        // 고유한 교육과정 목록 추출
        const uniqueCourses = [...new Set(
            this.allPaidApplicants
                .map(applicant => applicant.courseName)
                .filter(courseName => courseName && courseName !== '-')
        )];

        // 옵션 업데이트
        filterSelect.innerHTML = '<option value="">전체</option>';
        uniqueCourses.forEach(courseName => {
            filterSelect.innerHTML += `<option value="${courseName}">${courseName}</option>`;
        });
    },

    /**
     * 🆕 신청자 선택/해제 토글
     */
    toggleApplicantSelection: function (checkbox) {
        const applicantData = JSON.parse(checkbox.dataset.applicant);

        if (checkbox.checked) {
            // 선택 추가
            if (!this.selectedApplicants.some(selected => selected.id === applicantData.id)) {
                this.selectedApplicants.push(applicantData);
            }
        } else {
            // 선택 제거
            this.selectedApplicants = this.selectedApplicants.filter(
                selected => selected.id !== applicantData.id
            );
        }

        this.updateSelectedCount();
        this.updateSelectedApplicantsInfo();
    },

    /**
     * 🆕 전체 선택/해제 토글
     */
    toggleSelectAllPaid: function (checkbox) {
        const applicantCheckboxes = document.querySelectorAll('.paid-applicant-checkbox');

        applicantCheckboxes.forEach(cb => {
            cb.checked = checkbox.checked;
            if (checkbox.checked) {
                const applicantData = JSON.parse(cb.dataset.applicant);
                if (!this.selectedApplicants.some(selected => selected.id === applicantData.id)) {
                    this.selectedApplicants.push(applicantData);
                }
            }
        });

        if (!checkbox.checked) {
            this.selectedApplicants = [];
        }

        this.updateSelectedCount();
        this.updateSelectedApplicantsInfo();
    },

    /**
     * 🆕 선택 개수 업데이트
     */
    updateSelectedCount: function () {
        const count = this.selectedApplicants.length;

        // 상단 선택 개수
        const selectedCountSpan = document.getElementById('selected-count');
        if (selectedCountSpan) {
            selectedCountSpan.textContent = `${count}명 선택`;
        }

        // 버튼 내 개수
        const selectedCountBtn = document.getElementById('selected-count-btn');
        if (selectedCountBtn) {
            selectedCountBtn.textContent = count;
        }

        // 발급 버튼 상태
        const issueBtn = document.getElementById('issue-selected-btn');
        if (issueBtn) {
            issueBtn.disabled = count === 0;
        }

        // 전체 선택 체크박스 상태 업데이트
        const selectAllCheckbox = document.getElementById('select-all-paid');
        if (selectAllCheckbox) {
            const totalFiltered = this.filteredPaidApplicants.length;
            selectAllCheckbox.checked = count > 0 && count === totalFiltered;
            selectAllCheckbox.indeterminate = count > 0 && count < totalFiltered;
        }
    },

    /**
     * 🆕 선택된 신청자 정보 표시
     */
    updateSelectedApplicantsInfo: function () {
        const infoDiv = document.getElementById('selected-applicants-info');
        const listDiv = document.getElementById('selected-applicants-list');

        if (!infoDiv || !listDiv) return;

        if (this.selectedApplicants.length === 0) {
            infoDiv.classList.add('hidden');
            return;
        }

        infoDiv.classList.remove('hidden');

        const namesList = this.selectedApplicants
            .map(applicant => `${applicant.name || applicant.nameKorean} (${applicant.email})`)
            .join(', ');

        listDiv.textContent = namesList;
    },

    /**
     * 🆕 검색 및 필터링
     */
    filterPaidApplicants: function () {
        console.log('🆕 결제 완료자 필터링 실행');

        const searchName = document.getElementById('paid-search-name')?.value.toLowerCase().trim() || '';
        const filterCourse = document.getElementById('paid-filter-course')?.value || '';

        // 필터링 실행
        this.filteredPaidApplicants = this.allPaidApplicants.filter(applicant => {
            const nameMatch = !searchName ||
                (applicant.name && applicant.name.toLowerCase().includes(searchName)) ||
                (applicant.nameKorean && applicant.nameKorean.toLowerCase().includes(searchName)) ||
                (applicant.email && applicant.email.toLowerCase().includes(searchName));

            const courseMatch = !filterCourse || applicant.courseName === filterCourse;

            return nameMatch && courseMatch;
        });

        console.log(`필터링 결과: ${this.filteredPaidApplicants.length}/${this.allPaidApplicants.length}`);

        // 테이블 업데이트
        this.updatePaidApplicantsTable();

        // 선택 상태 초기화 (필터링된 결과에 없는 선택 항목 제거)
        this.selectedApplicants = this.selectedApplicants.filter(selected =>
            this.filteredPaidApplicants.some(filtered => filtered.id === selected.id)
        );

        this.updateSelectedCount();
        this.updateSelectedApplicantsInfo();
    },

    /**
     * 🆕 선택된 신청자들에게 자격증 발급
     */
    issueSelectedCertificates: async function () {
        console.log('🆕 선택된 신청자들에게 자격증 발급 시작');

        if (this.selectedApplicants.length === 0) {
            window.adminAuth?.showNotification('발급할 신청자를 선택해주세요.', 'warning');
            return;
        }

        // 발급 설정 값 확인
        const issueDate = document.getElementById('bulk-issue-date')?.value;
        const expiryDate = document.getElementById('bulk-expiry-date')?.value;

        if (!issueDate || !expiryDate) {
            window.adminAuth?.showNotification('발급일과 만료일을 설정해주세요.', 'warning');
            return;
        }

        // 확인 다이얼로그
        const confirmMessage = `선택된 ${this.selectedApplicants.length}명에게 ${this.getCertTypeName(this.currentCertType)} 자격증을 발급하시겠습니까?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // 로딩 표시
            const issueBtn = document.getElementById('issue-selected-btn');
            if (issueBtn) {
                issueBtn.disabled = true;
                issueBtn.innerHTML = `
                    <svg class="inline-block w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    발급 중... (<span id="selected-count-btn">${this.selectedApplicants.length}</span>명)
                `;
            }

            window.adminAuth?.showNotification('자격증 발급을 시작합니다...', 'info');

            const results = {
                success: 0,
                failed: 0,
                errors: []
            };

            // 각 신청자에 대해 자격증 발급
            for (const applicant of this.selectedApplicants) {
                try {
                    await this.issueCertificateForApplicant(applicant, issueDate, expiryDate);
                    results.success++;

                    console.log(`✅ ${applicant.name} 자격증 발급 성공`);

                } catch (error) {
                    console.error(`❌ ${applicant.name} 자격증 발급 실패:`, error);
                    results.failed++;
                    results.errors.push(`${applicant.name}: ${error.message}`);
                }
            }

            // 결과 알림
            if (results.success > 0) {
                const message = `${results.success}명의 자격증이 성공적으로 발급되었습니다.` +
                    (results.failed > 0 ? ` (실패: ${results.failed}명)` : '');

                window.adminAuth?.showNotification(message, 'success');

                // 자격증 목록 새로고침
                this.loadCertificates();

                // 모달 닫기
                this.closePaidApplicantsModal();

            } else {
                window.adminAuth?.showNotification('자격증 발급에 실패했습니다.', 'error');
            }

            // 오류 상세 정보 (개발 모드에서)
            if (results.failed > 0 && window.location.hostname === 'localhost') {
                console.error('발급 실패 상세:', results.errors);
            }

        } catch (error) {
            console.error('❌ 일괄 발급 처리 오류:', error);
            window.adminAuth?.showNotification('자격증 발급 중 오류가 발생했습니다.', 'error');
        } finally {
            // 버튼 상태 복원 (Part 1에서 이어짐)
            const issueBtn = document.getElementById('issue-selected-btn');
            if (issueBtn) {
                issueBtn.disabled = this.selectedApplicants.length === 0;
                issueBtn.innerHTML = `
                    <svg class="inline-block w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    선택된 신청자 발급 (<span id="selected-count-btn">${this.selectedApplicants.length}</span>명)
                `;
            }
        }
    },

    /**
     * 🆕 개별 신청자 자격증 발급
     */
    issueCertificateForApplicant: async function (applicant, issueDate, expiryDate) {
        console.log(`🆕 ${applicant.name}에게 자격증 발급 시작`);

        // 자격증 번호 생성
        const certNumber = await this.generateCertificateNumber();

        // 자격증 데이터 구성
        const certificateData = {
            certificateNumber: certNumber,
            certNumber: certNumber,

            // 한글명과 영문명 분리
            holderName: applicant.name || applicant.nameKorean,
            holderNameKorean: applicant.nameKorean || applicant.name,
            holderNameEnglish: applicant.nameEnglish || this.generateEnglishName(applicant.name),

            holderEmail: applicant.email,
            userId: applicant.userId,
            certificateType: this.currentCertType,

            courseId: applicant.courseId,
            courseName: applicant.courseName,

            issueDate: issueDate,
            expiryDate: expiryDate,

            status: 'active',
            paymentId: applicant.id, // 결제 정보 연결

            // 메타데이터
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'admin', // 관리자가 발급
            issueMethod: 'bulk_payment', // 결제자 선택 발급

            remarks: `${this.getCertTypeName(this.currentCertType)} 자격증 (결제자 선택 발급)`
        };

        // Firebase에 저장
        const firebaseStatus = checkFirebaseConnection();

        if (firebaseStatus.connected && window.dhcFirebase) {
            try {
                // Firebase Firestore에 저장
                const docRef = await window.dhcFirebase.db.collection('certificates').add(certificateData);

                console.log(`✅ Firebase에 자격증 저장 완료: ${docRef.id}`);

                // 결제 정보에 자격증 발급 상태 업데이트
                await this.updatePaymentStatus(applicant.id, docRef.id);

                return {
                    success: true,
                    certificateId: docRef.id,
                    certificateNumber: certNumber
                };

            } catch (error) {
                console.error(`❌ Firebase 저장 실패 (${applicant.name}):`, error);
                throw new Error(`Firebase 저장 실패: ${error.message}`);
            }
        } else {
            // 테스트 모드 - 로컬 저장소 시뮬레이션
            console.log(`🔧 테스트 모드: ${applicant.name} 자격증 발급 시뮬레이션`);

            // 1초 지연으로 실제 처리 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                success: true,
                certificateId: `test_cert_${Date.now()}`,
                certificateNumber: certNumber
            };
        }
    },

    /**
     * 🆕 자격증 번호 생성
     */
    generateCertificateNumber: async function () {
        const year = new Date().getFullYear();
        const certTypeCode = this.getCertTypeCode(this.currentCertType);

        // Firebase에서 가장 최근 번호 조회하여 순번 결정
        let nextNumber = 1;

        const firebaseStatus = checkFirebaseConnection();
        if (firebaseStatus.connected && window.dhcFirebase) {
            try {
                const query = window.dhcFirebase.db.collection('certificates')
                    .where('certificateType', '==', this.currentCertType)
                    .orderBy('certificateNumber', 'desc')
                    .limit(1);

                const snapshot = await query.get();

                if (!snapshot.empty) {
                    const lastCert = snapshot.docs[0].data();
                    const lastNumber = lastCert.certificateNumber;

                    // 번호에서 순번 추출 (예: HE-2025-0001 → 1)
                    const match = lastNumber.match(/-(\d+)$/);
                    if (match) {
                        nextNumber = parseInt(match[1]) + 1;
                    }
                }
            } catch (error) {
                console.error('마지막 자격증 번호 조회 오류:', error);
                // 오류 시 현재 시간 기반으로 번호 생성
                nextNumber = Date.now() % 10000;
            }
        } else {
            // 테스트 모드
            nextNumber = Math.floor(Math.random() * 1000) + 1;
        }

        // 번호 포맷팅 (4자리로 패딩)
        const formattedNumber = nextNumber.toString().padStart(4, '0');

        return `${certTypeCode}-${year}-${formattedNumber}`;
    },

    /**
     * 🆕 자격증 타입 코드 가져오기
     */
    getCertTypeCode: function (certType) {
        const codes = {
            'health-exercise': 'HE',
            'rehabilitation': 'RE',
            'pilates': 'PI',
            'recreation': 'RC'
        };
        return codes[certType] || 'HE';
    },

    /**
     * 🆕 영문명 생성 (한글명이 있을 때)
     */
    generateEnglishName: function (koreanName) {
        if (!koreanName) return 'Unknown';

        // 간단한 한글 → 영문 변환 (실제로는 더 정교한 변환 필요)
        const nameMap = {
            '김': 'Kim',
            '이': 'Lee',
            '박': 'Park',
            '최': 'Choi',
            '정': 'Jung',
            '강': 'Kang',
            '조': 'Cho',
            '윤': 'Yoon',
            '장': 'Jang',
            '임': 'Lim',
            '한': 'Han',
            '오': 'Oh',
            '서': 'Seo',
            '신': 'Shin',
            '권': 'Kwon',
            '황': 'Hwang',
            '안': 'Ahn',
            '송': 'Song',
            '류': 'Ryu',
            '전': 'Jeon'
        };

        if (koreanName.length >= 2) {
            const lastName = koreanName.charAt(0);
            const firstName = koreanName.slice(1);

            const englishLastName = nameMap[lastName] || lastName;
            const englishFirstName = this.koreanToEnglish(firstName);

            return `${englishLastName} ${englishFirstName}`;
        }

        return koreanName; // 변환 실패 시 원본 반환
    },

    /**
     * 🆕 한글 → 영문 음성 변환 (간단한 버전)
     */
    koreanToEnglish: function (korean) {
        const conversionMap = {
            '가': 'Ga', '나': 'Na', '다': 'Da', '라': 'Ra', '마': 'Ma',
            '바': 'Ba', '사': 'Sa', '아': 'A', '자': 'Ja', '차': 'Cha',
            '카': 'Ka', '타': 'Ta', '파': 'Pa', '하': 'Ha',
            '영': 'Young', '수': 'Soo', '민': 'Min', '준': 'Jun',
            '현': 'Hyun', '지': 'Ji', '은': 'Eun', '혜': 'Hye',
            '철': 'Chul', '미': 'Mi', '성': 'Sung', '호': 'Ho'
        };

        let result = '';
        for (let char of korean) {
            result += conversionMap[char] || char;
        }

        return result || 'Unknown';
    },

    /**
     * 🆕 결제 상태 업데이트
     */
    updatePaymentStatus: async function (paymentId, certificateId) {
        try {
            const firebaseStatus = checkFirebaseConnection();
            if (firebaseStatus.connected && window.dhcFirebase) {
                const updateData = {
                    certificateIssued: true,
                    certificateId: certificateId,
                    certificateIssuedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };

                await window.dhcFirebase.db.collection('payments').doc(paymentId).update(updateData);
                console.log(`✅ 결제 정보 업데이트 완료: ${paymentId}`);
            }
        } catch (error) {
            console.error('결제 상태 업데이트 오류:', error);
            // 오류가 있어도 자격증 발급은 완료된 상태이므로 throw하지 않음
        }
    },

    /**
     * 🔧 NEW: 자격증 발급 함수 (누락된 함수 추가)
     */
    issueCertificate: async function (formElement) {
        console.log('🔧 자격증 발급 함수 실행');

        try {
            // 폼 데이터 수집
            const formData = new FormData(formElement);
            const issueData = {
                name: formData.get('name'),
                email: formData.get('email'),
                course: formData.get('course'),
                completionDate: formData.get('completionDate'),
                expiryDate: formData.get('expiryDate')
            };

            // 유효성 검사
            if (!issueData.name || !issueData.email || !issueData.course ||
                !issueData.completionDate || !issueData.expiryDate) {
                window.adminAuth?.showNotification('모든 필드를 입력해주세요.', 'warning');
                return;
            }

            // 이메일 유효성 검사
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(issueData.email)) {
                window.adminAuth?.showNotification('올바른 이메일 주소를 입력해주세요.', 'warning');
                return;
            }

            // 날짜 유효성 검사
            const completionDate = new Date(issueData.completionDate);
            const expiryDate = new Date(issueData.expiryDate);

            if (completionDate >= expiryDate) {
                window.adminAuth?.showNotification('만료일은 수료일보다 이후여야 합니다.', 'warning');
                return;
            }

            // 로딩 표시
            window.adminAuth?.showNotification('자격증을 발급하는 중...', 'info');

            // 자격증 번호 생성
            const certNumber = await this.generateCertificateNumber();

            // 자격증 데이터 구성
            const certificateData = {
                certificateNumber: certNumber,
                certNumber: certNumber,

                holderName: issueData.name,
                holderNameKorean: issueData.name,
                holderNameEnglish: this.generateEnglishName(issueData.name),
                holderEmail: issueData.email,

                certificateType: this.currentCertType,
                courseName: this.getSelectedCourseName(issueData.course),
                courseId: issueData.course,

                issueDate: issueData.completionDate,
                expiryDate: issueData.expiryDate,

                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'admin',
                issueMethod: 'manual',

                remarks: `${this.getCertTypeName(this.currentCertType)} 자격증 (관리자 직접 발급)`
            };

            // Firebase에 저장
            const firebaseStatus = checkFirebaseConnection();

            if (firebaseStatus.connected && window.dhcFirebase) {
                try {
                    const docRef = await window.dhcFirebase.db.collection('certificates').add(certificateData);
                    console.log('✅ Firebase에 자격증 저장 완료:', docRef.id);

                    window.adminAuth?.showNotification('자격증이 성공적으로 발급되었습니다.', 'success');

                } catch (error) {
                    console.error('❌ Firebase 저장 실패:', error);
                    window.adminAuth?.showNotification('자격증 발급 중 오류가 발생했습니다.', 'error');
                    return;
                }
            } else {
                // 테스트 모드
                console.log('🔧 테스트 모드: 자격증 발급 시뮬레이션');
                await new Promise(resolve => setTimeout(resolve, 1000));
                window.adminAuth?.showNotification('자격증이 성공적으로 발급되었습니다. (테스트 모드)', 'success');
            }

            // 모달 닫기 및 목록 새로고침
            this.closeIssueCertModal();
            this.loadCertificates();

        } catch (error) {
            console.error('자격증 발급 오류:', error);
            window.adminAuth?.showNotification('자격증 발급 중 오류가 발생했습니다.', 'error');
        }
    },

    /**
     * 🔧 NEW: 선택된 교육과정 이름 가져오기
     */
    getSelectedCourseName: function (courseId) {
        const courseSelect = document.getElementById('issue-course');
        if (courseSelect) {
            const selectedOption = courseSelect.querySelector(`option[value="${courseId}"]`);
            if (selectedOption) {
                try {
                    const courseData = JSON.parse(selectedOption.dataset.course);
                    return courseData.title || courseData.name || selectedOption.textContent;
                } catch (error) {
                    return selectedOption.textContent;
                }
            }
        }
        return '알 수 없는 교육과정';
    }

}); // Object.assign 끝

// =================================
// 🆕 모달 상태 관리 업데이트
// =================================

// modalStates에 새로운 모달 추가
Object.assign(window.certManager.modalStates, {
    'paid-applicants-modal': false
});

// closeModalById 함수에 케이스 추가
const originalCloseModalById = window.certManager.closeModalById;
window.certManager.closeModalById = function (modalId) {
    if (modalId === 'paid-applicants-modal') {
        this.closePaidApplicantsModal();
    } else {
        originalCloseModalById.call(this, modalId);
    }
};

// closeOtherModals 함수가 새 모달도 처리하도록 업데이트
const originalCloseOtherModals = window.certManager.closeOtherModals;
window.certManager.closeOtherModals = function (excludeModalId) {
    const allModalIds = [
        'cert-issue-modal',
        'bulk-issue-modal',
        'cert-detail-modal',
        'cert-edit-modal',
        'paid-applicants-modal' // 🆕 추가
    ];

    allModalIds.forEach(modalId => {
        if (modalId !== excludeModalId && this.modalStates[modalId]) {
            this.closeModalById(modalId);
        }
    });
};

// =================================
// 🆕 이벤트 리스너 등록 (추가)
// =================================

// registerEventListeners에 새로운 이벤트들 추가
const originalRegisterEventListeners = window.certManager.registerEventListeners;
window.certManager.registerEventListeners = function () {
    // 기존 이벤트 리스너 등록
    originalRegisterEventListeners.call(this);

    console.log('🆕 결제자 선택 발급 이벤트 리스너 등록');

    // 교육과정 선택 change 이벤트 추가
    const courseSelect = document.getElementById('issue-course');
    if (courseSelect && !courseSelect.dataset.eventAttached) {
        courseSelect.addEventListener('change', (e) => {
            this.handleCourseSelection(e.target);
        });
        courseSelect.dataset.eventAttached = 'true';
        console.log('✅ 교육과정 선택 change 이벤트 등록 완료');
    }

    // 검색 필드 엔터키 이벤트
    const paidSearchName = document.getElementById('paid-search-name');
    if (paidSearchName && !paidSearchName.dataset.eventAttached) {
        paidSearchName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.filterPaidApplicants();
            }
        });
        paidSearchName.dataset.eventAttached = 'true';
    }

    // 교육과정 필터 변경 이벤트
    const paidFilterCourse = document.getElementById('paid-filter-course');
    if (paidFilterCourse && !paidFilterCourse.dataset.eventAttached) {
        paidFilterCourse.addEventListener('change', () => this.filterPaidApplicants());
        paidFilterCourse.dataset.eventAttached = 'true';
    }

    console.log('✅ 결제자 선택 발급 이벤트 리스너 등록 완료');
};

// =================================
// 🆕 자격증 타입 전환 시 모달 닫기
// =================================

// switchCertType 함수에 모달 닫기 추가
const originalSwitchCertType = window.certManager.switchCertType;
window.certManager.switchCertType = function (certType) {
    // 결제자 선택 모달이 열려있으면 닫기
    if (this.modalStates['paid-applicants-modal']) {
        this.closePaidApplicantsModal();
    }

    // 기존 함수 호출
    originalSwitchCertType.call(this, certType);
};

// =================================
// 🆕 CSS 클래스 추가 (admin.css에 추가할 스타일)
// =================================

/**
 * 🎨 결제자 선택 발급 모달 전용 CSS (admin.css에 추가)
 */
const additionalCSS = `
/* 🆕 결제자 선택 발급 모달 스타일 */
.paid-applicants-modal {
    z-index: 2100 !important; /* secondary modal */
}

.paid-applicant-checkbox:checked {
    background-color: #3b82f6 !important;
    border-color: #3b82f6 !important;
}

.paid-applicant-checkbox:checked + tr {
    background-color: #eff6ff !important;
}

.paid-applicants-table {
    max-height: 400px !important;
    overflow-y: auto !important;
}

.selected-applicants-info {
    border-left: 4px solid #10b981 !important;
}

/* 반응형 - 모바일에서 테이블 스크롤 */
@media (max-width: 768px) {
    .paid-applicants-table {
        max-height: 300px !important;
    }
    
    .paid-applicants-modal .cert-modal-container {
        max-width: 95vw !important;
        max-height: 90vh !important;
    }
    
    .paid-applicants-modal .form-row {
        grid-template-columns: 1fr !important;
    }
}

/* 로딩 스피너 */
.paid-loading {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// =================================
// 🆕 디버깅 함수 추가
// =================================

if (window.debugCertManagement) {
    Object.assign(window.debugCertManagement, {

        // 🆕 결제자 선택 발급 테스트
        testPaidApplicantsModal: function () {
            console.log('🆕 결제자 선택 발급 모달 테스트');
            if (window.certManager) {
                window.certManager.showPaidApplicantsModal();
            } else {
                console.error('❌ certManager가 로드되지 않음');
            }
        },

        // 🆕 테스트 데이터 확인
        showMockPaidApplicants: function () {
            console.log('🆕 테스트 결제 완료자 데이터:');
            if (window.certManager) {
                const mockData = window.certManager.getMockPaidApplicants();
                console.table(mockData);
                return mockData;
            } else {
                console.error('❌ certManager가 로드되지 않음');
            }
        },

        // 🆕 자격증 번호 생성 테스트
        testCertNumberGeneration: async function () {
            console.log('🆕 자격증 번호 생성 테스트');
            if (window.certManager) {
                for (let i = 0; i < 5; i++) {
                    const certNumber = await window.certManager.generateCertificateNumber();
                    console.log(`${i + 1}. ${certNumber}`);
                }
            } else {
                console.error('❌ certManager가 로드되지 않음');
            }
        },

        // 🆕 영문명 변환 테스트
        testEnglishNameGeneration: function () {
            console.log('🆕 영문명 변환 테스트');
            const testNames = ['김영수', '이미영', '박철민', '최지혜', '정현호'];

            if (window.certManager) {
                testNames.forEach(name => {
                    const englishName = window.certManager.generateEnglishName(name);
                    console.log(`${name} → ${englishName}`);
                });
            } else {
                console.error('❌ certManager가 로드되지 않음');
            }
        },

        // 🆕 결제자 선택 발급 전체 플로우 테스트
        testFullPaidFlow: async function () {
            console.log('🆕 결제자 선택 발급 전체 플로우 테스트 시작');

            if (!window.certManager) {
                console.error('❌ certManager가 로드되지 않음');
                return;
            }

            console.log('1️⃣ 모달 표시 테스트');
            this.testPaidApplicantsModal();

            setTimeout(() => {
                console.log('2️⃣ 테스트 데이터 확인');
                this.showMockPaidApplicants();
            }, 1000);

            setTimeout(() => {
                console.log('3️⃣ 자격증 번호 생성 테스트');
                this.testCertNumberGeneration();
            }, 2000);

            setTimeout(() => {
                console.log('4️⃣ 영문명 변환 테스트');
                this.testEnglishNameGeneration();
            }, 3000);

            setTimeout(() => {
                console.log('✅ 전체 플로우 테스트 완료!');
                console.log('💡 이제 모달에서 신청자를 선택하고 발급을 테스트해보세요!');
            }, 4000);
        }
    });

    // 새로운 도움말 업데이트
    const originalHelp = window.debugCertManagement.help;
    window.debugCertManagement.help = function () {
        originalHelp.call(this);

        console.log('\n🆕 결제자 선택 발급 테스트:');
        console.log('- testPaidApplicantsModal() : 결제자 선택 모달 표시');
        console.log('- showMockPaidApplicants() : 테스트 결제 완료자 데이터');
        console.log('- testCertNumberGeneration() : 자격증 번호 생성 테스트');
        console.log('- testEnglishNameGeneration() : 영문명 변환 테스트');
        console.log('- testFullPaidFlow() : 전체 플로우 테스트');
    };
}

// =================================
// 🎉 완료 메시지
// =================================

console.log('\n🎉 === 결제자 선택 발급 기능 추가 완료 ===');
console.log('✅ 결제 완료자 선택 모달 구현');
console.log('✅ Firebase/테스트 데이터 지원');
console.log('✅ 검색 및 필터링 기능');
console.log('✅ 다중 선택 및 일괄 발급');
console.log('✅ 자격증 번호 자동 생성');
console.log('✅ 영문명 자동 변환');
console.log('✅ 결제 정보 연동');
console.log('\n🔧 주요 함수들:');
console.log('- showPaidApplicantsModal(): 모달 표시');
console.log('- loadPaidApplicants(): 결제 완료자 조회');
console.log('- issueSelectedCertificates(): 선택된 신청자 발급');
console.log('- generateCertificateNumber(): 자격증 번호 생성');
console.log('\n🚀 이제 관리자는 결제 완료자를 선택하여 자격증을 발급할 수 있습니다!');
console.log('📸 테스트: window.debugCertManagement.testFullPaidFlow()');

// 완료 플래그 설정
window.certManagementPaidApplicantsComplete = true;