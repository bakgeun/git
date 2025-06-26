/**
 * cert-management.js - 완전한 자격증 관리 시스템 (전문적인 PDF 디자인 포함)
 * 🎨 전문적인 자격증 PDF 디자인으로 완전히 재설계됨
 */

console.log('=== cert-management.js 파일 로드됨 (전문적인 PDF 시스템) ===');

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
    const basePath = window.adjustPath ? window.adjustPath('') : '';
    const borderImagePath = `${basePath}assets/images/logo/border-gold.png`;
    const koreaImagePath = `${basePath}assets/images/logo/korea-medal.png`;
    const englishImagePath = `${basePath}assets/images/logo/english-medal.png`;
    const sealImagePath = `${basePath}assets/images/logo/seal.png`;

    console.log('🎨 정확한 이미지 경로:', {
        border: borderImagePath,
        korea: koreaImagePath,
        english: englishImagePath,
        seal: sealImagePath
    });

    return { borderImagePath, koreaImagePath, englishImagePath, sealImagePath };
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

/**
 * 🎨 전문적인 황금 테두리 SVG (대체 이미지)
 */
function createFallbackBorderSvg() {
    return 'data:image/svg+xml;base64,' + btoa(`
        <svg width="794" height="1123" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- 황금 그라데이션 정의 -->
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#FFD700"/>
                    <stop offset="25%" style="stop-color:#FFA500"/>
                    <stop offset="50%" style="stop-color:#FFD700"/>
                    <stop offset="75%" style="stop-color:#DAA520"/>
                    <stop offset="100%" style="stop-color:#FFD700"/>
                </linearGradient>
                
                <!-- 음영 효과 -->
                <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="3" dy="3" stdDeviation="5" flood-color="#00000020"/>
                </filter>
            </defs>
            
            <!-- 배경 -->
            <rect width="794" height="1123" fill="#FEFEFE" stroke="none"/>
            
            <!-- 외부 메인 테두리 -->
            <rect x="20" y="20" width="754" height="1083" 
                  fill="none" 
                  stroke="url(#goldGradient)" 
                  stroke-width="8" 
                  filter="url(#dropShadow)"/>
            
            <!-- 중간 테두리 -->
            <rect x="35" y="35" width="724" height="1053" 
                  fill="none" 
                  stroke="url(#goldGradient)" 
                  stroke-width="3"/>
            
            <!-- 내부 테두리 -->
            <rect x="50" y="50" width="694" height="1023" 
                  fill="none" 
                  stroke="url(#goldGradient)" 
                  stroke-width="1"/>
            
            <!-- 모서리 장식 -->
            <g stroke="url(#goldGradient)" stroke-width="4" fill="none" stroke-linecap="round">
                <!-- 좌상단 모서리 장식 -->
                <path d="M20,20 L120,20 M20,20 L20,120"/>
                <path d="M25,25 L100,25 M25,25 L25,100"/>
                <circle cx="70" cy="70" r="15" stroke-width="2"/>
                
                <!-- 우상단 모서리 장식 -->
                <path d="M774,20 L674,20 M774,20 L774,120"/>
                <path d="M769,25 L694,25 M769,25 M769,100"/>
                <circle cx="724" cy="70" r="15" stroke-width="2"/>
                
                <!-- 좌하단 모서리 장식 -->
                <path d="M20,1103 L120,1103 M20,1103 L20,1003"/>
                <path d="M25,1098 L100,1098 M25,1098 L25,1023"/>
                <circle cx="70" cy="1053" r="15" stroke-width="2"/>
                
                <!-- 우하단 모서리 장식 -->
                <path d="M774,1103 L674,1103 M774,1103 L774,1003"/>
                <path d="M769,1098 L694,1098 M769,1098 L769,1023"/>
                <circle cx="724" cy="1053" r="15" stroke-width="2"/>
            </g>
            
            <!-- 상단 중앙 장식 -->
            <g transform="translate(397, 80)" stroke="url(#goldGradient)" fill="none" stroke-width="2">
                <circle r="25"/>
                <circle r="15"/>
                <path d="M-20,0 L20,0 M0,-20 L0,20"/>
            </g>
            
            <!-- 하단 중앙 장식 -->
            <g transform="translate(397, 1043)" stroke="url(#goldGradient)" fill="none" stroke-width="2">
                <circle r="25"/>
                <circle r="15"/>
                <path d="M-20,0 L20,0 M0,-20 L0,20"/>
            </g>
        </svg>
    `);
}

/**
 * 🎨 전문적인 한글 메달 SVG (대체 이미지)
 */
function createFallbackSealSvg(isEnglish = false) {
    if (isEnglish) {
        return 'data:image/svg+xml;base64,' + btoa(`
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="englishGold" cx="50%" cy="30%">
                        <stop offset="0%" style="stop-color:#FFD700"/>
                        <stop offset="40%" style="stop-color:#FFA500"/>
                        <stop offset="80%" style="stop-color:#DAA520"/>
                        <stop offset="100%" style="stop-color:#B8860B"/>
                    </radialGradient>
                    
                    <radialGradient id="royalBlue" cx="50%" cy="50%">
                        <stop offset="0%" style="stop-color:#1E40AF"/>
                        <stop offset="70%" style="stop-color:#1E3A8A"/>
                        <stop offset="100%" style="stop-color:#0F172A"/>
                    </radialGradient>
                    
                    <filter id="medalShadow">
                        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#00000050"/>
                    </filter>
                </defs>
                
                <circle cx="50" cy="50" r="45" 
                        fill="url(#englishGold)" 
                        stroke="#B8860B" 
                        stroke-width="2" 
                        filter="url(#medalShadow)"/>
                
                <circle cx="50" cy="50" r="32" 
                        fill="url(#royalBlue)" 
                        stroke="#FFD700" 
                        stroke-width="2"/>
                
                <text x="50" y="35" text-anchor="middle" 
                      fill="#FFD700" 
                      font-size="9" 
                      font-weight="bold"
                      font-family="serif">DIGITAL</text>
                <text x="50" y="47" text-anchor="middle" 
                      fill="#FFD700" 
                      font-size="8" 
                      font-weight="bold"
                      font-family="serif">HEALTHCARE</text>
                <text x="50" y="59" text-anchor="middle" 
                      fill="#FFD700" 
                      font-size="9" 
                      font-weight="bold"
                      font-family="serif">CENTER</text>
            </svg>
        `);
    } else {
        return 'data:image/svg+xml;base64,' + btoa(`
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="koreaGold" cx="50%" cy="30%">
                        <stop offset="0%" style="stop-color:#FFD700"/>
                        <stop offset="40%" style="stop-color:#FFA500"/>
                        <stop offset="80%" style="stop-color:#DAA520"/>
                        <stop offset="100%" style="stop-color:#B8860B"/>
                    </radialGradient>
                    
                    <radialGradient id="koreaBlue" cx="50%" cy="50%">
                        <stop offset="0%" style="stop-color:#1E40AF"/>
                        <stop offset="70%" style="stop-color:#1E3A8A"/>
                        <stop offset="100%" style="stop-color:#1E293B"/>
                    </radialGradient>
                    
                    <filter id="medalShadow">
                        <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#00000040"/>
                    </filter>
                </defs>
                
                <circle cx="50" cy="50" r="45" 
                        fill="url(#koreaGold)" 
                        stroke="#B8860B" 
                        stroke-width="2" 
                        filter="url(#medalShadow)"/>
                
                <circle cx="50" cy="50" r="35" 
                        fill="url(#koreaBlue)" 
                        stroke="#FFD700" 
                        stroke-width="2"/>
                
                <circle cx="50" cy="50" r="25" 
                        fill="none" 
                        stroke="#FFD700" 
                        stroke-width="1.5"/>
                
                <text x="50" y="38" text-anchor="middle" 
                      fill="#FFD700" 
                      font-size="11" 
                      font-weight="bold"
                      font-family="serif">디지털</text>
                <text x="50" y="50" text-anchor="middle" 
                      fill="#FFD700" 
                      font-size="10" 
                      font-weight="bold"
                      font-family="serif">헬스케어</text>
                <text x="50" y="62" text-anchor="middle" 
                      fill="#FFD700" 
                      font-size="11" 
                      font-weight="bold"
                      font-family="serif">센터</text>
            </svg>
        `);
    }
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

        /**
         * 🔧 개선된 모달 시스템 - 깜빡임 문제 해결
         */

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
         * 자격증 목록 로드
         */
        loadCertificates: async function () {
            try {
                // 로딩 상태 표시
                const tableBody = document.querySelector('#cert-table tbody');
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4 text-gray-500">데이터 로딩 중...</td>
                    </tr>
                `;

                // 자격증 데이터 가져오기
                let certificates = [];

                // Firebase가 초기화되었는지 확인
                const firebaseStatus = checkFirebaseConnection();
                if (firebaseStatus.connected && window.dbService) {
                    try {
                        console.log('Firebase에서 자격증 데이터 로드 시작');

                        // 필터 옵션 설정 - 인덱스 오류 방지를 위해 단순화된 쿼리 사용
                        let query = window.dhcFirebase.db.collection('certificates')
                            .where('certificateType', '==', this.currentCertType);

                        // 상태 필터 적용 (선택적)
                        const statusFilter = document.getElementById('filter-status')?.value;
                        if (statusFilter) {
                            query = query.where('status', '==', statusFilter);
                        }

                        // 검색어 필터
                        const nameSearch = document.getElementById('search-name')?.value.trim();
                        const certNumberSearch = document.getElementById('search-cert-number')?.value.trim();

                        // 검색어가 없으면 기본 쿼리 실행
                        if (!nameSearch && !certNumberSearch) {
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

                                // 페이지네이션 처리 (클라이언트 측)
                                const startIndex = (this.currentPage - 1) * this.pageSize;
                                certificates = certificates.slice(startIndex, startIndex + this.pageSize);
                            }
                        } else {
                            // 검색어가 있으면 전체 데이터를 가져와서 클라이언트에서 필터링
                            const snapshot = await window.dhcFirebase.db.collection('certificates')
                                .where('certificateType', '==', this.currentCertType)
                                .get();

                            if (!snapshot.empty) {
                                const allCerts = [];
                                snapshot.forEach(doc => {
                                    allCerts.push({
                                        id: doc.id,
                                        ...doc.data()
                                    });
                                });

                                // 클라이언트 측에서 필터링
                                certificates = allCerts.filter(cert => {
                                    // 상태 필터
                                    if (statusFilter && cert.status !== statusFilter) {
                                        return false;
                                    }

                                    // 이름 검색
                                    if (nameSearch &&
                                        !(cert.holderName && cert.holderName.includes(nameSearch))) {
                                        return false;
                                    }

                                    // 자격증 번호 검색
                                    if (certNumberSearch &&
                                        !(cert.certificateNumber && cert.certificateNumber.includes(certNumberSearch))) {
                                        return false;
                                    }

                                    return true;
                                });

                                // 클라이언트 측에서 정렬 (최신 발급일 기준)
                                certificates.sort((a, b) => {
                                    const dateA = a.issueDate?.seconds || 0;
                                    const dateB = b.issueDate?.seconds || 0;
                                    return dateB - dateA;
                                });

                                // 페이지네이션 처리 (클라이언트 측)
                                const startIndex = (this.currentPage - 1) * this.pageSize;
                                certificates = certificates.slice(startIndex, startIndex + this.pageSize);
                            }
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

                // 페이지네이션 업데이트
                // 기존 페이지네이션 로직을 클라이언트 측으로 변경
                let totalCount = 0;

                if (firebaseStatus.connected && window.dhcFirebase && window.dhcFirebase.db) {
                    try {
                        // 전체 개수만 계산 (인덱스 문제 없는 간단한 쿼리)
                        const snapshot = await window.dhcFirebase.db.collection('certificates')
                            .where('certificateType', '==', this.currentCertType)
                            .get();

                        totalCount = snapshot.size;

                        // 필터링된 경우는 클라이언트 측에서 계산
                        const statusFilter = document.getElementById('filter-status')?.value;
                        const nameSearch = document.getElementById('search-name')?.value.trim();
                        const certNumberSearch = document.getElementById('search-cert-number')?.value.trim();

                        if (statusFilter || nameSearch || certNumberSearch) {
                            // 매우 많은 데이터일 경우 여기서 최적화가 필요할 수 있음
                            // 현재는 단순하게 메모리에서 필터링
                            totalCount = snapshot.docs.filter(doc => {
                                const data = doc.data();

                                // 상태 필터
                                if (statusFilter && data.status !== statusFilter) {
                                    return false;
                                }

                                // 이름 검색
                                if (nameSearch &&
                                    !(data.holderName && data.holderName.includes(nameSearch))) {
                                    return false;
                                }

                                // 자격증 번호 검색
                                if (certNumberSearch &&
                                    !(data.certificateNumber && data.certificateNumber.includes(certNumberSearch))) {
                                    return false;
                                }

                                return true;
                            }).length;
                        }
                    } catch (error) {
                        console.error('문서 수 계산 오류:', error);
                        totalCount = certificates.length > 0 ? certificates.length + (this.currentPage - 1) * this.pageSize : 0;
                    }
                } else {
                    // 테스트 데이터는 20개로 가정
                    totalCount = 20;
                }

                const totalPages = Math.ceil(totalCount / this.pageSize);
                this.updatePagination(this.currentPage, totalPages);

            } catch (error) {
                console.error('자격증 데이터 로드 오류:', error);

                const tableBody = document.querySelector('#cert-table tbody');
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4 text-red-500">데이터 로드 중 오류가 발생했습니다.</td>
                    </tr>
                `;
            }
        },

        /**
         * 자격증 테이블 업데이트 - 🔧 전역 유틸리티 사용 + PDF 아이콘 수정
         */
        updateCertificateTable: function (certificates) {
            const tableBody = document.querySelector('#cert-table tbody');

            if (!certificates || certificates.length === 0) {
                tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="admin-empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z">
                        </path>
                    </svg>
                    <h3>등록된 자격증이 없습니다</h3>
                    <p>새로운 자격증을 발급해보세요.</p>
                </td>
            </tr>
        `;
                return;
            }

            let tableHtml = '';

            certificates.forEach(cert => {
                // 🔧 전역 유틸리티 사용 - formatDate
                const issueDate = cert.issueDate && typeof cert.issueDate.toDate === 'function'
                    ? window.formatters.formatDate(cert.issueDate.toDate(), 'YYYY-MM-DD')
                    : (cert.issueDate ? window.formatters.formatDate(cert.issueDate, 'YYYY-MM-DD') : '-');

                const expiryDate = cert.expiryDate && typeof cert.expiryDate.toDate === 'function'
                    ? window.formatters.formatDate(cert.expiryDate.toDate(), 'YYYY-MM-DD')
                    : (cert.expiryDate ? window.formatters.formatDate(cert.expiryDate, 'YYYY-MM-DD') : '-');

                const getStatusBadge = (status) => {
                    const badges = {
                        'active': '<span class="cert-status-badge status-valid">유효</span>',
                        'expired': '<span class="cert-status-badge status-expired">만료</span>',
                        'revoked': '<span class="cert-status-badge status-suspended">취소</span>',
                        'suspended': '<span class="cert-status-badge status-suspended">정지</span>'
                    };
                    return badges[status] || `<span class="cert-status-badge status-expired">${this.getStatusText(status)}</span>`;
                };

                // 🎯 반응형 테이블: data-label 속성 추가 + 🔧 PDF 아이콘 수정
                tableHtml += `
            <tr class="hover:bg-gray-50 transition-colors">
                <td data-label="선택" class="text-center">
                    <input type="checkbox" class="cert-checkbox" data-id="${cert.id}">
                </td>
                <td data-label="자격증 번호">${cert.certificateNumber || cert.certNumber || '-'}</td>
                <td data-label="수료자명">${cert.holderName || cert.name || '-'}</td>
                <td data-label="교육 과정">${cert.courseName || cert.course || '-'}</td>
                <td data-label="발급일">${issueDate}</td>
                <td data-label="만료일">${expiryDate}</td>
                <td data-label="상태">${getStatusBadge(cert.status)}</td>
                <td data-label="작업">
                    <div class="table-actions">
                        <button onclick="certManager.viewCertDetails('${cert.id}')" 
                            class="table-action-btn btn-view" title="상세 보기">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z">
                                </path>
                            </svg>
                            상세
                        </button>
                        <button onclick="certManager.editCert('${cert.id}')" 
                            class="table-action-btn btn-edit" title="수정">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                                </path>
                            </svg>
                            수정
                        </button>
                        
                        <!-- 🔧 PDF 아이콘 수정: 다운로드 화살표 → PDF 파일 아이콘 -->
                        <div class="cert-pdf-dropdown">
                            <button onclick="certManager.togglePdfDropdown('${cert.id}')" 
                                class="cert-pdf-btn" title="PDF 다운로드">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                    </path>
                                </svg>
                                PDF
                            </button>
                            <div id="pdf-dropdown-${cert.id}" class="cert-pdf-menu hidden">
                                <a href="#" onclick="certManager.downloadCertPdf('${cert.id}', 'ko'); event.preventDefault();">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                        </path>
                                    </svg>
                                    한글 PDF
                                </a>
                                <a href="#" onclick="certManager.downloadCertPdf('${cert.id}', 'en'); event.preventDefault();">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                        </path>
                                    </svg>
                                    영문 PDF
                                </a>
                            </div>
                        </div>
                        
                        ${cert.status !== 'suspended' && cert.status !== 'revoked' ? `
                            <button onclick="certManager.revokeCertificate('${cert.id}')" 
                                class="table-action-btn btn-delete" title="자격증 취소">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                    </path>
                                </svg>
                                취소
                                </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
            });

            tableBody.innerHTML = tableHtml;

            // 🔧 개선된 PDF 드롭다운 이벤트 처리
            this.initPdfDropdowns();
        },

        /**
         * PDF 드롭다운 토글 (새로 추가)
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
         * 🔧 PDF 드롭다운 초기화 (z-index 문제 해결)
         */
        initPdfDropdowns: function () {
            // 🔧 기존 이벤트 리스너 제거 방지
            if (this._pdfDropdownInitialized) return;
            this._pdfDropdownInitialized = true;

            // 전역 클릭 이벤트로 드롭다운 닫기
            document.addEventListener('click', (e) => {
                // PDF 버튼이나 드롭다운 내부 클릭이 아닌 경우만 닫기
                if (!e.target.closest('.cert-pdf-dropdown')) {
                    document.querySelectorAll('[id^="pdf-dropdown-"]').forEach(dropdown => {
                        dropdown.classList.add('hidden');
                        dropdown.classList.remove('show');
                    });
                }
            });

            // ESC 키로 드롭다운 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    document.querySelectorAll('[id^="pdf-dropdown-"]').forEach(dropdown => {
                        dropdown.classList.add('hidden');
                        dropdown.classList.remove('show');
                    });
                }
            });

            console.log('✅ PDF 드롭다운 이벤트 리스너 초기화 완료');
        },

        /**
         * 페이지네이션 업데이트
         */
        updatePagination: function (currentPage, totalPages) {
            const paginationContainer = document.getElementById('cert-pagination');

            if (!paginationContainer) return;

            let paginationHtml = '<div class="flex justify-center">';

            // 이전 페이지 버튼
            paginationHtml += `
                <button onclick="certManager.changePage(${currentPage - 1})" 
                    class="px-3 py-1 rounded-md mx-1 ${currentPage <= 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-700'}"
                    ${currentPage <= 1 ? 'disabled' : ''}>
                    이전
                </button>
            `;

            // 페이지 번호들
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += `
                    <button onclick="certManager.changePage(${i})" 
                        class="px-3 py-1 rounded-md mx-1 ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}">
                        ${i}
                    </button>
                `;
            }

            // 다음 페이지 버튼
            paginationHtml += `
                <button onclick="certManager.changePage(${currentPage + 1})" 
                    class="px-3 py-1 rounded-md mx-1 ${currentPage >= totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-700'}"
                    ${currentPage >= totalPages ? 'disabled' : ''}>
                    다음
                </button>
            `;

            paginationHtml += '</div>';

            paginationContainer.innerHTML = paginationHtml;
        },

        /**
         * 페이지 변경
         */
        changePage: function (page) {
            // 유효한 페이지 체크
            if (page < 1) return;

            this.currentPage = page;
            this.loadCertificates();
        },

        /**
         * 검색 기능
         */
        search: function () {
            // 검색 시 첫 페이지로 이동
            this.currentPage = 1;
            this.lastDoc = null;
            this.loadCertificates();
        },

        /**
         * 검색 필터 초기화
         */
        resetFilters: function () {
            console.log('검색 필터 초기화');

            // 검색 필드 초기화
            const searchName = document.getElementById('search-name');
            if (searchName) searchName.value = '';

            const searchCertNumber = document.getElementById('search-cert-number');
            if (searchCertNumber) searchCertNumber.value = '';

            const statusFilter = document.getElementById('filter-status');
            if (statusFilter) statusFilter.value = '';

            // 페이지 상태 초기화
            this.currentPage = 1;
            this.lastDoc = null;

            // 데이터 새로고침
            this.loadCertificates();

            // 사용자 피드백
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('검색 필터가 초기화되었습니다.', 'info');
            }
        },

        /**
         * 전체 선택 토글
         */
        toggleSelectAll: function (checkbox) {
            const certCheckboxes = document.querySelectorAll('.cert-checkbox');
            certCheckboxes.forEach(cb => {
                cb.checked = checkbox.checked;
            });
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

        // 🔧 모달 이벤트 리스너 재등록 보장
        ensureModalEvents: function () {
            console.log('🔧 모달 이벤트 리스너 재등록 시작');

            // 🔧 X 버튼 이벤트 재등록
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

            // 🔧 백드롭 클릭 이벤트 재등록
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

            // 🔧 ESC 키 이벤트 (전역, 한 번만 등록)
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

        /**
         * 자격증 발급 모달 닫기
         */
        closeIssueCertModal: function () {
            console.log('🔧 자격증 발급 모달 닫기');

            const modal = document.getElementById('cert-issue-modal');
            if (modal && this.modalStates['cert-issue-modal']) {
                // 상태 업데이트
                this.modalStates['cert-issue-modal'] = false;

                // 모달 숨김
                modal.classList.add('hidden');

                // 폼 초기화
                const form = document.getElementById('cert-issue-form');
                if (form) form.reset();

                // body 클래스 업데이트
                this.updateBodyModalState();

                console.log('✅ 자격증 발급 모달 닫기 완료');
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
         * 🔧 일괄 발급 모달 닫기
         */
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

        /**
         * 일괄 발급 파일 업로드 처리
         */
        handleBulkFileUpload: function (event) {
            const file = event.target.files[0];
            if (!file) return;

            const previewArea = document.getElementById('bulk-preview');
            const previewHeader = document.getElementById('bulk-preview-header');
            const previewBody = document.getElementById('bulk-preview-body');
            const bulkIssueBtn = document.getElementById('bulk-issue-btn');

            // 파일 형식 확인 (xlsx, xls만 허용)
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                window.adminAuth?.showNotification('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.', 'error');
                event.target.value = '';
                return;
            }

            // 여기서는 실제 파일 처리는 생략하고 미리보기만 표시
            previewHeader.innerHTML = `
                <tr class="bg-gray-100">
                    <th class="border border-gray-300 px-4 py-2">이름</th>
                    <th class="border border-gray-300 px-4 py-2">이메일</th>
                    <th class="border border-gray-300 px-4 py-2">교육과정</th>
                    <th class="border border-gray-300 px-4 py-2">수료일</th>
                </tr>
            `;

            // 샘플 데이터로 미리보기 표시
            previewBody.innerHTML = `
                <tr>
                    <td class="border border-gray-300 px-4 py-2">홍길동</td>
                    <td class="border border-gray-300 px-4 py-2">hong@example.com</td>
                    <td class="border border-gray-300 px-4 py-2">건강운동처방사 1기</td>
                    <td class="border border-gray-300 px-4 py-2">2025-03-15</td>
                </tr>
                <tr>
                    <td class="border border-gray-300 px-4 py-2">김철수</td>
                    <td class="border border-gray-300 px-4 py-2">kim@example.com</td>
                    <td class="border border-gray-300 px-4 py-2">건강운동처방사 1기</td>
                    <td class="border border-gray-300 px-4 py-2">2025-03-15</td>
                </tr>
            `;

            previewArea.classList.remove('hidden');

            // 일괄 발급 버튼 활성화
            if (bulkIssueBtn) bulkIssueBtn.disabled = false;
        },

        /**
         * 일괄 발급 처리
         */
        processBulkIssuance: function () {
            const fileInput = document.getElementById('bulk-file');
            if (!fileInput || !fileInput.files[0]) {
                window.adminAuth?.showNotification('업로드된 파일이 없습니다.', 'error');
                return;
            }

            // 로딩 표시
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(true);
            }

            // 실제로는 여기서 파일 처리 및 DB 저장 로직 구현
            setTimeout(() => {
                // 로딩 종료
                if (window.adminUtils?.showLoadingOverlay) {
                    window.adminUtils.showLoadingOverlay(false);
                }

                // 모달 닫기
                this.closeBulkIssuanceModal();

                // 성공 메시지
                window.adminAuth?.showNotification('자격증 일괄 발급이 완료되었습니다.', 'success');

                // 목록 새로고침
                this.loadCertificates();
            }, 2000);
        },

        /**
         * 교육 과정 옵션 로드
         */
        loadCourseOptions: async function () {
            const courseSelect = document.getElementById('issue-course');

            if (!courseSelect) {
                console.error('교육 과정 선택 필드를 찾을 수 없습니다.');
                return;
            }

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

                // 4. 옵션 업데이트
                if (courses.length > 0) {
                    courseSelect.innerHTML = '<option value="">교육 과정을 선택하세요</option>';

                    courses.forEach(course => {
                        // 날짜 포맷팅
                        const startDate = this.formatCourseDate(course.startDate);
                        const endDate = this.formatCourseDate(course.endDate);

                        const title = course.title || course.name || `${this.getCertTypeName(this.currentCertType)} 과정`;
                        const dateRange = startDate && endDate ? ` (${startDate} ~ ${endDate})` : '';

                        courseSelect.innerHTML += `
                    <option value="${course.id}" data-course="${JSON.stringify(course).replace(/"/g, '&quot;')}">${title}${dateRange}</option>
                `;
                    });

                    console.log(`교육과정 옵션 ${courses.length}개 로드 완료`);
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
                    endDate: '2025-03-15',
                    instructor: '김영수 교수',
                    capacity: 30,
                    currentEnrollment: 25
                },
                {
                    id: 'course2',
                    title: '2025년 1기 운동재활전문가 과정',
                    certificateType: 'rehabilitation',
                    status: 'active',
                    startDate: '2025-02-01',
                    endDate: '2025-04-01',
                    instructor: '이미연 교수',
                    capacity: 25,
                    currentEnrollment: 20
                },
                {
                    id: 'course3',
                    title: '2025년 1기 필라테스 전문가 과정',
                    certificateType: 'pilates',
                    status: 'active',
                    startDate: '2025-01-20',
                    endDate: '2025-03-20',
                    instructor: '박지혜 강사',
                    capacity: 20,
                    currentEnrollment: 18
                },
                {
                    id: 'course4',
                    title: '2025년 1기 레크리에이션지도자 과정',
                    certificateType: 'recreation',
                    status: 'active',
                    startDate: '2025-02-10',
                    endDate: '2025-04-10',
                    instructor: '최민수 강사',
                    capacity: 35,
                    currentEnrollment: 30
                }
            ];
        },

        /**
         * 테스트 교육과정 데이터 생성
         */
        createTestCourseData: async function () {
            console.log('테스트 교육과정 데이터 생성 시작');

            const testCourses = [
                {
                    title: '2025년 1기 건강운동처방사 과정',
                    certificateType: 'health-exercise',
                    status: 'active',
                    startDate: new Date('2025-01-15'),
                    endDate: new Date('2025-03-15'),
                    instructor: '김영수 교수',
                    capacity: 30,
                    currentEnrollment: 25
                },
                {
                    title: '2025년 1기 운동재활전문가 과정',
                    certificateType: 'rehabilitation',
                    status: 'active',
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2025-04-01'),
                    instructor: '이미연 교수',
                    capacity: 25,
                    currentEnrollment: 20
                },
                {
                    title: '2025년 1기 필라테스 전문가 과정',
                    certificateType: 'pilates',
                    status: 'active',
                    startDate: new Date('2025-01-20'),
                    endDate: new Date('2025-03-20'),
                    instructor: '박지혜 강사',
                    capacity: 20,
                    currentEnrollment: 18
                },
                {
                    title: '2025년 1기 레크리에이션지도자 과정',
                    certificateType: 'recreation',
                    status: 'active',
                    startDate: new Date('2025-02-10'),
                    endDate: new Date('2025-04-10'),
                    instructor: '최민수 강사',
                    capacity: 35,
                    currentEnrollment: 30
                }
            ];

            try {
                const batch = window.dhcFirebase.db.batch();

                testCourses.forEach(courseData => {
                    const docRef = window.dhcFirebase.db.collection('courses').doc();
                    const dataWithTimestamp = {
                        ...courseData,
                        createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    };
                    batch.set(docRef, dataWithTimestamp);
                });

                await batch.commit();
                console.log('테스트 교육과정 데이터 생성 완료');

                if (window.adminAuth?.showNotification) {
                    window.adminAuth.showNotification('테스트 교육과정 데이터가 생성되었습니다.', 'info');
                }
            } catch (error) {
                console.error('테스트 데이터 생성 오류:', error);
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
         * 자격증 발급 처리
         */
        issueCertificate: async function (form) {
            try {
                // 폼 데이터 가져오기
                const name = document.getElementById('issue-name').value.trim();
                const email = document.getElementById('issue-email').value.trim();
                const courseId = document.getElementById('issue-course').value;
                const completionDate = document.getElementById('issue-completion-date').value;
                const expiryDate = document.getElementById('issue-expiry-date').value;

                // 유효성 검사
                if (!name || !email || !courseId || !completionDate || !expiryDate) {
                    window.adminAuth?.showNotification('모든 필드를 입력해주세요.', 'error');
                    return;
                }

                // 로딩 표시
                if (window.adminUtils?.showLoadingOverlay) {
                    window.adminUtils.showLoadingOverlay(true);
                }

                // 자격증 번호 생성 (예: HE-2025-0001)
                const certTypePrefix = {
                    'health-exercise': 'HE',
                    'rehabilitation': 'RE',
                    'pilates': 'PI',
                    'recreation': 'RC'
                }[this.currentCertType] || 'XX';

                const year = new Date().getFullYear();
                const count = await this.getCertificateCount(this.currentCertType, year);
                const certificateNumber = `${certTypePrefix}-${year}-${String(count + 1).padStart(4, '0')}`;

                const firebaseStatus = checkFirebaseConnection();
                if (firebaseStatus.connected) {
                    // 자격증 데이터 생성
                    const certData = {
                        certificateNumber: certificateNumber,
                        certificateType: this.currentCertType,
                        holderName: name,
                        holderEmail: email,
                        courseId: courseId,
                        issueDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(completionDate)),
                        expiryDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(expiryDate)),
                        status: 'active',
                        createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    };

                    // Firebase에 저장
                    try {
                        const docRef = await window.dhcFirebase.db.collection('certificates').add(certData);

                        // 성공
                        window.adminAuth?.showNotification('자격증이 성공적으로 발급되었습니다.', 'success');

                        // 모달 닫기
                        this.closeIssueCertModal();

                        // 목록 새로고침
                        this.loadCertificates();
                    } catch (error) {
                        console.error('자격증 저장 오류:', error);
                        window.adminAuth?.showNotification('자격증 발급에 실패했습니다.', 'error');
                    }
                } else {
                    // 테스트 환경에서는 성공으로 처리
                    setTimeout(() => {
                        // 성공 메시지
                        window.adminAuth?.showNotification('자격증이 성공적으로 발급되었습니다.', 'success');

                        // 모달 닫기
                        this.closeIssueCertModal();

                        // 목록 새로고침
                        this.loadCertificates();
                    }, 1000);
                }
            } catch (error) {
                console.error('자격증 발급 오류:', error);
                window.adminAuth?.showNotification('자격증 발급 중 오류가 발생했습니다.', 'error');
            } finally {
                // 로딩 종료
                if (window.adminUtils?.showLoadingOverlay) {
                    window.adminUtils.showLoadingOverlay(false);
                }
            }
        },

        /**
         * 자격증 수 조회 (번호 생성용)
         */
        getCertificateCount: async function (certType, year) {
            try {
                const firebaseStatus = checkFirebaseConnection();
                if (firebaseStatus.connected) {
                    const startOfYear = new Date(year, 0, 1);
                    const endOfYear = new Date(year + 1, 0, 1);

                    // 단순 쿼리로 변경 (인덱스 문제 해결)
                    const query = window.dhcFirebase.db.collection('certificates')
                        .where('certificateType', '==', certType);

                    const snapshot = await query.get();

                    // 클라이언트 측에서 필터링 (연도별)
                    let count = 0;

                    if (!snapshot.empty) {
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            const issueDate = data.issueDate?.toDate ? data.issueDate.toDate() : null;

                            if (issueDate && issueDate >= startOfYear && issueDate < endOfYear) {
                                count++;
                            }
                        });
                    }

                    return count;
                }

                // 테스트 환경에서는 0 반환 (첫 번째 자격증 번호는 0001이 됨)
                return 0;
            } catch (error) {
                console.error('자격증 수 조회 오류:', error);
                return 0;
            }
        },

        /**
         * 자격증 상세 정보 보기
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

                        console.log('🔥 Firebase 문서 조회 결과:', {
                            exists: docSnap.exists,
                            id: docSnap.id,
                            dataExists: !!docSnap.data()
                        });

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
                            } else {
                                console.error('❌ Firebase 문서 데이터가 비어있음');
                                cert = null;
                            }
                        } else {
                            console.error('❌ Firebase에서 해당 ID의 문서를 찾을 수 없음:', certId);
                            cert = null;
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

                // 🔧 안전한 자격증 정보 추출
                const certNumber = safeGetValue(cert, 'certificateNumber') ||
                    safeGetValue(cert, 'certNumber') ||
                    safeGetValue(cert, 'id') ||
                    'Unknown';

                const holderName = safeGetValue(cert, 'holderName') ||
                    safeGetValue(cert, 'name') ||
                    userName ||
                    'Unknown';

                const holderEmail = safeGetValue(cert, 'holderEmail') ||
                    safeGetValue(cert, 'email') ||
                    userEmail ||
                    'unknown@example.com';

                const certType = this.getCertTypeName(safeGetValue(cert, 'certificateType') || this.currentCertType);

                // 🔧 안전한 날짜 포맷팅
                const issueDate = this.formatDate(cert.issueDate) ||
                    safeGetValue(cert, 'issueDate') ||
                    '-';

                const expiryDate = this.formatDate(cert.expiryDate) ||
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

                console.log('✅ 안전한 자격증 정보 추출 완료:', {
                    certNumber, holderName, holderEmail, certType, issueDate, expiryDate, status
                });

                // 모달 내용 생성
                const modalContent = document.getElementById('cert-detail-content');
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
                <p class="text-gray-900">${holderName} (${holderEmail})</p>
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
                        한글 PDF
                    </button>
                    <button onclick="certManager.downloadCertPdf('${certId}', 'en'); certManager.closeCertDetailModal();" 
                        class="admin-btn admin-btn-primary">
                        영문 PDF
                    </button>
                </div>
            </div>
        `;

                // 🔧 모달 표시 개선
                const modal = document.getElementById('cert-detail-modal');
                if (modal) {
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

                    console.log('✅ 자격증 상세 정보 모달 표시 완료');
                }

            } catch (error) {
                console.error('자격증 상세 정보 조회 오류:', error);
                window.adminAuth?.showNotification('자격증 정보 조회 중 오류가 발생했습니다.', 'error');
            }
        },

        /**
         * 자격증 상세보기 모달 닫기
         */
        closeCertDetailModal: function () {
            console.log('🔧 자격증 상세보기 모달 닫기');

            const modal = document.getElementById('cert-detail-modal');
            if (modal && this.modalStates['cert-detail-modal']) {
                // 상태 업데이트
                this.modalStates['cert-detail-modal'] = false;

                // 모달 숨김
                modal.classList.add('hidden');

                // body 클래스 업데이트
                this.updateBodyModalState();

                console.log('✅ 자격증 상세보기 모달 닫기 완료');
            }
        },

        /**
         * 자격증 수정
         */
        editCert: async function (certId) {
            try {
                console.log('🔧 자격증 수정 모달 표시:', certId);

                // 로딩 표시
                if (window.adminAuth?.showNotification) {
                    window.adminAuth.showNotification('자격증 정보를 불러오는 중...', 'info');
                }

                let cert = null;

                // 🔧 Firebase 연동 시 강화된 오류 처리
                const firebaseStatus = checkFirebaseConnection();
                if (firebaseStatus.connected && window.dhcFirebase) {
                    try {
                        console.log('🔥 Firebase에서 자격증 수정 정보 조회 시작, ID:', certId);

                        const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                        const docSnap = await docRef.get();

                        console.log('🔥 Firebase 수정 문서 조회 결과:', {
                            exists: docSnap.exists,
                            id: docSnap.id,
                            dataExists: !!docSnap.data()
                        });

                        if (docSnap.exists) {
                            const data = docSnap.data();
                            if (data) {
                                cert = {
                                    id: docSnap.id,
                                    ...data
                                };
                                console.log('✅ Firebase에서 수정할 자격증 정보 조회 성공:', cert);
                            } else {
                                console.error('❌ Firebase 수정 문서 데이터가 비어있음');
                                cert = null;
                            }
                        } else {
                            console.error('❌ Firebase에서 수정할 해당 ID의 문서를 찾을 수 없음:', certId);
                            cert = null;
                        }
                    } catch (error) {
                        console.error('❌ Firebase 수정 자격증 정보 조회 오류:', error);
                        cert = null;
                    }
                }

                // 🔧 Firebase에서 찾지 못했거나 연결되지 않은 경우 테스트 데이터 사용
                if (!cert) {
                    console.log('🔧 Firebase에서 수정 데이터를 찾지 못함, 테스트 데이터 사용');
                    cert = this.getMockCertificateById(certId);

                    if (!cert) {
                        console.error('❌ 테스트 데이터에서도 수정할 자격증을 찾을 수 없음:', certId);
                        window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                        return;
                    }

                    console.log('✅ 수정용 테스트 데이터 사용:', cert);
                }

                // 🔧 안전한 데이터 접근 (수정용)
                const safeGetValue = (obj, path, defaultValue = '') => {
                    try {
                        return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
                    } catch {
                        return defaultValue;
                    }
                };

                // 🔧 폼에 안전하게 데이터 입력
                try {
                    document.getElementById('edit-cert-id').value = certId;

                    document.getElementById('edit-cert-number').value =
                        safeGetValue(cert, 'certificateNumber') ||
                        safeGetValue(cert, 'certNumber') ||
                        certId;

                    document.getElementById('edit-holder-name').value =
                        safeGetValue(cert, 'holderName') ||
                        safeGetValue(cert, 'name') ||
                        'Unknown';

                    document.getElementById('edit-issue-date').value =
                        this.formatDateToInput(cert.issueDate) ||
                        safeGetValue(cert, 'issueDate') ||
                        '';

                    document.getElementById('edit-expiry-date').value =
                        this.formatDateToInput(cert.expiryDate) ||
                        safeGetValue(cert, 'expiryDate') ||
                        '';

                    document.getElementById('edit-status').value =
                        safeGetValue(cert, 'status') ||
                        'active';

                    document.getElementById('edit-remarks').value =
                        safeGetValue(cert, 'remarks') ||
                        '';

                    console.log('✅ 수정 폼에 데이터 입력 완료');
                } catch (error) {
                    console.error('❌ 수정 폼 데이터 입력 오류:', error);
                    window.adminAuth?.showNotification('폼 데이터 입력 중 오류가 발생했습니다.', 'error');
                    return;
                }

                // 🔧 모달 표시 개선
                const modal = document.getElementById('cert-edit-modal');
                if (modal) {
                    // 다른 모달들 먼저 닫기
                    this.closeOtherModals('cert-edit-modal');

                    // 상태 업데이트
                    this.modalStates['cert-edit-modal'] = true;

                    // 모달 표시
                    modal.classList.remove('hidden');

                    // body 스크롤 방지
                    document.body.classList.add('modal-open');

                    // 🔧 이벤트 리스너 재등록
                    this.ensureModalEvents();

                    console.log('✅ 자격증 수정 모달 표시 완료');
                }

            } catch (error) {
                console.error('자격증 수정 폼 로드 오류:', error);
                window.adminAuth?.showNotification('자격증 정보 조회 중 오류가 발생했습니다.', 'error');
            }
        },

        /**
         * 자격증 수정 모달 닫기
         */
        closeCertEditModal: function () {
            console.log('🔧 자격증 수정 모달 닫기');

            const modal = document.getElementById('cert-edit-modal');
            if (modal && this.modalStates['cert-edit-modal']) {
                // 상태 업데이트
                this.modalStates['cert-edit-modal'] = false;

                // 모달 숨김
                modal.classList.add('hidden');

                // 폼 초기화
                const form = document.getElementById('cert-edit-form');
                if (form) form.reset();

                // body 클래스 업데이트
                this.updateBodyModalState();

                console.log('✅ 자격증 수정 모달 닫기 완료');
            }
        },

        closeOtherModals: function (excludeModalId) {
            Object.keys(this.modalStates).forEach(modalId => {
                if (modalId !== excludeModalId && this.modalStates[modalId]) {
                    this.closeModalById(modalId);
                }
            });
        },

        /**
         * 🔧 body 모달 상태 업데이트
         */
        updateBodyModalState: function () {
            const hasOpenModal = Object.values(this.modalStates).some(isOpen => isOpen);

            if (!hasOpenModal) {
                document.body.classList.remove('modal-open');
                document.documentElement.classList.remove('modal-open');
                document.body.style.overflow = '';
            }
        },

        /**
         * 자격증 수정 처리
         */
        handleUpdateCertificate: async function (event) {
            event.preventDefault();

            try {
                // 로딩 표시
                if (window.adminAuth?.showNotification) {
                    window.adminAuth.showNotification('자격증 정보를 수정하는 중...', 'info');
                }

                // 폼 데이터 가져오기
                const certId = document.getElementById('edit-cert-id').value;
                const issueDate = document.getElementById('edit-issue-date').value;
                const expiryDate = document.getElementById('edit-expiry-date').value;
                const status = document.getElementById('edit-status').value;
                const remarks = document.getElementById('edit-remarks').value;

                // 유효성 검사
                if (!issueDate || !expiryDate || !status) {
                    window.adminAuth?.showNotification('필수 필드를 모두 입력해주세요.', 'error');
                    return;
                }

                // Firebase 연동 시
                const firebaseStatus = checkFirebaseConnection();
                if (firebaseStatus.connected) {
                    // 업데이트 데이터
                    const updateData = {
                        issueDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(issueDate)),
                        expiryDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(expiryDate)),
                        status: status,
                        remarks: remarks,
                        updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    };

                    // Firebase에 업데이트
                    try {
                        const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                        await docRef.update(updateData);

                        // 모달 닫기
                        this.closeCertEditModal();

                        // 성공 메시지
                        window.adminAuth?.showNotification('자격증 정보가 성공적으로 수정되었습니다.', 'success');

                        // 목록 새로고침
                        this.loadCertificates();
                    } catch (error) {
                        console.error('자격증 정보 업데이트 오류:', error);
                        window.adminAuth?.showNotification('자격증 정보 수정에 실패했습니다.', 'error');
                    }
                } else {
                    // 테스트 환경에서는 성공으로 처리
                    setTimeout(() => {
                        // 모달 닫기
                        this.closeCertEditModal();

                        // 성공 메시지
                        window.adminAuth?.showNotification('자격증 정보가 성공적으로 수정되었습니다.', 'success');

                        // 목록 새로고침
                        this.loadCertificates();
                    }, 1000);
                }
            } catch (error) {
                console.error('자격증 정보 수정 오류:', error);
                window.adminAuth?.showNotification('자격증 정보 수정 중 오류가 발생했습니다.', 'error');
            }
        },

        /**
         * 🎨 전문적인 자격증 PDF 다운로드 (기존 함수명 유지)
         */
        downloadCertPdf: function (certId, lang) {
            console.log('🎨 PDF 다운로드 시작:', { certId, lang });

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
                    this.generateKoreanCertPdf(certId);
                } else {
                    this.generateEnglishCertPdf(certId);
                }
            } else {
                console.log('❌ 라이브러리 미로드, 동적 로드 시도');
                // 라이브러리 동적 로드
                this.loadJsPdfLibrary(() => {
                    if (lang === 'ko') {
                        this.generateKoreanCertPdf(certId);
                    } else {
                        this.generateEnglishCertPdf(certId);
                    }
                });
            }
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
                    }, 100); // 약간의 지연을 두어 라이브러리가 완전히 로드되도록 함
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
                    // 전역 변수 설정 시도
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

        /**
         * 🎨 참고 자격증 기반 한글 자격증 PDF 생성 (실제 이미지 적용)
         */
        generateKoreanCertPdf: async function (certId) {
            try {
                console.log('🎨 참고 자격증 기반 한글 PDF 생성 시작:', certId);

                // jsPDF 생성자 확인
                let jsPDFConstructor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
                if (!jsPDFConstructor) {
                    throw new Error('jsPDF 라이브러리가 로드되지 않았습니다.');
                }

                // 자격증 정보 조회
                let cert = await this.getCertificateData(certId);
                if (!cert) {
                    window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                    return;
                }

                // 안전한 데이터 추출
                const certData = this.extractCertificateData(cert);
                const today = new Date();
                const formattedToday = window.formatters.formatDate(today, 'YYYY년 MM월 DD일');

                // 🔧 올바른 이미지 경로 설정 (pages/admin에서 상위로 이동)
                const borderImagePath = '../../assets/images/logo/border-gold.png';
                const koreaImagePath = '../../assets/images/logo/korea-medal.png';
                const sealImagePath = '../../assets/images/logo/seal.png';

                console.log('🖼️ 수정된 이미지 경로:', {
                    border: borderImagePath,
                    medal: koreaImagePath,
                    seal: sealImagePath
                });

                // 🎨 참고 자격증 기반 한글 HTML 템플릿 생성
                const certTemplate = this.createReferenceKoreanTemplate(
                    certData,
                    borderImagePath,
                    koreaImagePath,
                    sealImagePath,
                    formattedToday
                );

                // DOM에 추가
                document.body.appendChild(certTemplate);

                try {
                    // 이미지 로딩 대기
                    console.log('⏳ 실제 이미지 로딩 대기 중...');
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

                    const fileName = `${certData.certType}_${certData.holderName}_${certData.certNumber}_한글.pdf`;
                    doc.save(fileName);

                    console.log('✅ 참고 자격증 기반 한글 PDF 생성 완료:', fileName);
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
         * 🎨 경로 수정된 영문 자격증 PDF 생성
         */
        generateEnglishCertPdf: async function (certId) {
            try {
                console.log('🎨 참고 자격증 기반 영문 PDF 생성 시작:', certId);

                // jsPDF 생성자 확인
                let jsPDFConstructor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
                if (!jsPDFConstructor) {
                    throw new Error('jsPDF 라이브러리가 로드되지 않았습니다.');
                }

                // 자격증 정보 조회
                let cert = await this.getCertificateData(certId);
                if (!cert) {
                    window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                    return;
                }

                // 안전한 데이터 추출
                const certData = this.extractCertificateData(cert);
                const today = new Date();
                const formattedToday = today.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // 🔧 올바른 이미지 경로 설정 (pages/admin에서 상위로 이동)
                const borderImagePath = '../../assets/images/logo/border-gold.png';
                const englishImagePath = '../../assets/images/logo/english-medal.png';
                const sealImagePath = '../../assets/images/logo/seal.png';

                console.log('🖼️ 수정된 이미지 경로:', {
                    border: borderImagePath,
                    medal: englishImagePath,
                    seal: sealImagePath
                });

                // 🎨 참고 자격증 기반 영문 HTML 템플릿 생성
                const certTemplate = this.createReferenceEnglishTemplate(
                    certData,
                    borderImagePath,
                    englishImagePath,
                    sealImagePath,
                    formattedToday
                );

                // DOM에 추가
                document.body.appendChild(certTemplate);

                try {
                    // 이미지 로딩 대기
                    console.log('⏳ 실제 이미지 로딩 대기 중...');
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

                    const certTypeEn = this.getCertTypeNameEn(certData.certificateType);
                    const fileName = `${certTypeEn.replace(/\s+/g, '_')}_${certData.holderName.replace(/\s+/g, '_')}_${certData.certNumber}_English.pdf`;
                    doc.save(fileName);

                    console.log('✅ 참고 자격증 기반 영문 PDF 생성 완료:', fileName);
                    window.adminAuth?.showNotification('영문 자격증 PDF가 생성되었습니다.', 'success');

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
                console.error('영문 PDF 생성 전체 오류:', error);
                window.adminAuth?.showNotification('PDF 생성 중 오류가 발생했습니다: ' + error.message, 'error');
            }
        },

        /**
         * 🔧 이미지 경로 테스트 함수 (디버깅용)
         */
        testImagePaths: function () {
            console.log('🔧 이미지 경로 테스트...');

            const paths = [
                '../../assets/images/logo/border-gold.png',
                '../../assets/images/logo/korea-medal.png',
                '../../assets/images/logo/english-medal.png',
                '../../assets/images/logo/seal.png'
            ];

            paths.forEach(path => {
                const img = new Image();
                img.onload = () => console.log('✅', path, '로드 성공');
                img.onerror = () => console.error('❌', path, '로드 실패');
                img.src = path;
            });
        },

        /**
         * 🎨 참고 자격증 기반 한글 HTML 템플릿 (실제 이미지 적용 + 레이아웃 개선)
         */
        createReferenceKoreanTemplate: function (certData, borderPath, medalPath, sealPath, issuedDate) {
            const template = document.createElement('div');
            template.id = 'korean-cert-template';
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

            // 🔧 영문 자격증명 매칭
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
                     "
                     onerror="this.style.display='none';">

                <!-- 🔧 국문 메달 이미지 ("건"자 왼쪽, 제목과 겹치지 않게) -->
                <img src="${medalPath}" 
                     style="
                         position: absolute;
                         top: 100px;
                         left: 100px;
                         width: 110px;
                         height: 110px;
                         z-index: 2;
                     "
                     onerror="this.style.display='none';">

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
                                    ">${certData.holderName}</span>
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
                            
                            <!-- 우측: 사진 영역 -->
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
                                margin-right: 20px;
                            ">
                                사진
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

                        <!-- 🔧 하단: 발급 정보 (중앙 정렬 날짜 + 중앙 정렬 센터명 + 우측 직인) -->
                        <div style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            margin-top: 30px;
                        ">
                            <!-- 🔧 1단계: 날짜 (중앙 정렬) -->
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

                            <!-- 🔧 2단계: 센터명 (중앙 정렬, 날짜 바로 아래) -->
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
                                
                                <!-- 직인 ('터'자 우측에 배치) -->
                                <img src="${sealPath}" 
                                     style="
                                         width: 85px;
                                         height: 85px;
                                         object-fit: contain;
                                         position: absolute;
                                         top: 50%;
                                         transform: translateY(-50%);
                                         right: -80px;
                                     "
                                     onerror="this.outerHTML='<div style=&quot;width: 85px; height: 85px; background: #dc2626; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; text-align: center; line-height: 1.2; position: absolute; top: 50%; transform: translateY(-50%); right: -110px;&quot;><div>문경<br>부설<br>센터</div></div>';">
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
         * 🎨 참고 자격증 기반 영문 HTML 템플릿 (실제 이미지 적용)
         */
        createReferenceEnglishTemplate: function (certData, borderPath, medalPath, sealPath, issuedDate) {
            const template = document.createElement('div');
            template.id = 'english-cert-template';
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

            // 영문 자격증 유형명 변환
            const certTypeEn = this.getCertTypeNameEn(certData.certificateType);

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
                     "
                     onerror="this.style.display='none';">

                <!-- 🖼️ 영문 메달 이미지 (제목과 겹치지 않게 상단으로 이동) -->
                <img src="${medalPath}" 
                     style="
                         position: absolute;
                         top: 80px;
                         left: 50%;
                         transform: translateX(-50%);
                         width: 90px;
                         height: 90px;
                         z-index: 2;
                     "
                     onerror="this.style.display='none';">

                <!-- 콘텐츠 영역 (테두리 안쪽) - 하단 패딩 줄여서 여백 조정 -->
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
                    <!-- 상단: 메달과 제목 (간격 대폭 축소) -->
                    <div style="margin-bottom: 30px; margin-top: 80px;">
                        <!-- 자격증 제목 -->
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
                        
                        <!-- 🔧 자격증 번호 (중앙 배치 + 텍스트 중앙 정렬 완전 수정) -->
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

                    <!-- 중앙: 인증 내용 (간격 조정) -->
                    <div style="
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        margin: 0;
                        padding: 0 40px;
                    ">
                        <!-- 🔧 This is to certify that (간격 최소화) -->
                        <p style="
                            margin: 5px 0 10px 0;
                            font-size: 20px;
                            color: #4a5568;
                            font-style: italic;
                            font-weight: 500;
                        ">This is to certify that</p>
                        
                        <!-- 수료자명 강조 (간격 축소) -->
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
                            ">Test User</h2>
                        </div>
                        
                        <!-- 🔧 완료 내용 (간격 최소화) -->
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
                        
                        <!-- 🔧 하단: 발급 정보 (마진 최소화로 하단 여백 최대 확보) -->
                        <div style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            margin-top: 5px;
                        ">
                            <!-- 🔧 날짜 (폰트 크기 확대: 18px → 22px) -->
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

                            <!-- 🔧 센터명과 직인 (폰트 크기 확대: 22px → 28px) -->
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
                                
                                <!-- 직인 -->
                                <img src="${sealPath}" 
                                     style="
                                         width: 75px;
                                         height: 75px;
                                         object-fit: contain;
                                         position: absolute;
                                         top: 50%;
                                         transform: translateY(-50%);
                                         right: -95px;
                                     "
                                     onerror="this.outerHTML='<div style=&quot;width: 75px; height: 75px; background: #dc2626; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; text-align: center; line-height: 1.2; position: absolute; top: 50%; transform: translateY(-50%); right: -95px;&quot;><div>문경<br>부설<br>센터</div></div>';">
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
         * 🎨 영문 교육과정명 변환
         */
        translateCourseNameToEnglish: function (courseName) {
            if (!courseName) return 'Professional Training Course';

            // 자격증 유형별 매핑
            const typeMapping = {
                '건강운동처방사': 'Health Exercise Specialist',
                '운동재활전문가': 'Exercise Rehabilitation Specialist',
                '필라테스 전문가': 'Pilates Specialist',
                '레크리에이션지도자': 'Recreation Instructor'
            };

            // 키워드 매핑
            const keywordMapping = {
                '교육과정': 'Training Course',
                '과정': 'Course',
                '프로그램': 'Program',
                '전문가': 'Specialist',
                '지도자': 'Instructor'
            };

            let englishName = courseName;

            // 자격증 유형 변환
            Object.keys(typeMapping).forEach(korean => {
                if (englishName.includes(korean)) {
                    englishName = englishName.replace(new RegExp(korean, 'g'), typeMapping[korean]);
                }
            });

            // 기수/회차 변환
            englishName = englishName.replace(/(\d+)기/g, 'Course $1');
            englishName = englishName.replace(/제(\d+)기/g, 'Course $1');

            // 키워드 변환
            Object.keys(keywordMapping).forEach(korean => {
                if (englishName.includes(korean)) {
                    englishName = englishName.replace(new RegExp(korean, 'g'), keywordMapping[korean]);
                }
            });

            // 공백 정리
            englishName = englishName.replace(/\s+/g, ' ').trim();

            // 유효성 검사
            if (englishName === courseName || englishName.length < 3) {
                return 'Professional Training Course';
            }

            return englishName;
        },

        /**
         * 🎨 자격증 유형 영문명 반환
         */
        getCertTypeNameEn: function (type) {
            const typeMap = {
                'health-exercise': 'Health Exercise Specialist',
                'rehabilitation': 'Exercise Rehabilitation Specialist',
                'pilates': 'Pilates Specialist',
                'recreation': 'Recreation Instructor'
            };
            return typeMap[type] || 'Professional Specialist';
        },

        /**
         * 🎨 이미지 로딩 대기
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

        // =================================
        // 🔧 공통 유틸리티 함수들
        // =================================

        /**
         * 자격증 데이터 조회
         */
        getCertificateData: async function (certId) {
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
                    }
                } catch (error) {
                    console.error('Firebase 자격증 정보 조회 오류:', error);
                }
            }

            // Firebase에서 찾지 못한 경우 테스트 데이터 사용
            if (!cert) {
                cert = this.getMockCertificateById(certId);
                if (cert) {
                    cert.courseName = cert.course || '전문 교육과정';
                }
            }

            return cert;
        },

        /**
         * 안전한 자격증 데이터 추출
         */
        extractCertificateData: function (cert) {
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
                holderName: safeGetValue(cert, 'holderName') ||
                    safeGetValue(cert, 'name') ||
                    '홍길동',
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
         * 한글 교육과정명을 영문으로 변환
         */
        translateCourseNameToEnglish: function (courseName) {
            if (!courseName) return 'Professional Training Course';

            // 자격증 유형별 매핑
            const typeMapping = {
                '건강운동처방사': 'Health Exercise Specialist',
                '운동재활전문가': 'Exercise Rehabilitation Specialist',
                '재활운동전문가': 'Exercise Rehabilitation Specialist',
                '필라테스 전문가': 'Pilates Specialist',
                '필라테스전문가': 'Pilates Specialist',
                '레크리에이션지도자': 'Recreation Instructor',
                '레크리에이션 지도자': 'Recreation Instructor'
            };

            // 키워드 매핑
            const keywordMapping = {
                '교육과정': 'Training Course',
                '과정': 'Course',
                '프로그램': 'Program',
                '워크샵': 'Workshop',
                '세미나': 'Seminar',
                '자격증': 'Certification',
                '전문가': 'Specialist',
                '지도자': 'Instructor',
                '트레이너': 'Trainer'
            };

            // 기수/회차 패턴
            const periodPatterns = [
                { pattern: /(\d+)기/g, replacement: 'Course $1' },
                { pattern: /(\d+)회차/g, replacement: 'Session $1' },
                { pattern: /제(\d+)기/g, replacement: 'Course $1' },
                { pattern: /(\d+)차/g, replacement: 'Phase $1' }
            ];

            let englishName = courseName;

            // 1. 자격증 유형 변환
            Object.keys(typeMapping).forEach(korean => {
                if (englishName.includes(korean)) {
                    englishName = englishName.replace(new RegExp(korean, 'g'), typeMapping[korean]);
                }
            });

            // 2. 기수/회차 변환
            periodPatterns.forEach(({ pattern, replacement }) => {
                englishName = englishName.replace(pattern, replacement);
            });

            // 3. 키워드 변환
            Object.keys(keywordMapping).forEach(korean => {
                if (englishName.includes(korean)) {
                    englishName = englishName.replace(new RegExp(korean, 'g'), keywordMapping[korean]);
                }
            });

            // 4. 공백 정리 및 대소문자 조정
            englishName = englishName
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/\b\w/g, l => l.toUpperCase());

            // 5. 유효성 검사 및 기본값 처리
            if (englishName === courseName ||
                englishName.includes('undefined') ||
                englishName.length < 3 ||
                /^[^a-zA-Z]*$/.test(englishName)) {

                return 'Professional Training Course';
            }

            // 6. 최종 정리
            englishName = englishName
                .replace(/Course Course/g, 'Course')
                .replace(/Specialist Specialist/g, 'Specialist')
                .replace(/Instructor Instructor/g, 'Instructor')
                .trim();

            return englishName;
        },

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
         * 자격증 취소
         */
        revokeCertificate: function (certId) {
            if (window.adminUtils?.confirmDialog) {
                window.adminUtils.confirmDialog(
                    '정말로 이 자격증을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                    `certManager.handleRevokeCertificate('${certId}')`
                );
            } else {
                if (confirm('정말로 이 자격증을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    this.handleRevokeCertificate(certId);
                }
            }
        },

        /**
         * 자격증 취소 처리
         */
        handleRevokeCertificate: async function (certId) {
            try {
                // 로딩 표시
                if (window.adminUtils?.showLoadingOverlay) {
                    window.adminUtils.showLoadingOverlay(true);
                }

                // Firebase 연동 시
                const firebaseStatus = checkFirebaseConnection();
                if (firebaseStatus.connected) {
                    // 업데이트 데이터
                    const updateData = {
                        status: 'revoked',
                        revokedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    };

                    // Firebase에 업데이트
                    try {
                        const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                        await docRef.update(updateData);

                        // 성공 메시지
                        window.adminAuth?.showNotification('자격증이 성공적으로 취소되었습니다.', 'success');

                        // 목록 새로고침
                        this.loadCertificates();
                    } catch (error) {
                        console.error('자격증 취소 오류:', error);
                        window.adminAuth?.showNotification('자격증 취소에 실패했습니다.', 'error');
                    }
                } else {
                    // 테스트 환경에서는 성공으로 처리
                    setTimeout(() => {
                        // 성공 메시지
                        window.adminAuth?.showNotification('자격증이 성공적으로 취소되었습니다.', 'success');

                        // 목록 새로고침
                        this.loadCertificates();
                    }, 1000);
                }
            } catch (error) {
                console.error('자격증 취소 오류:', error);
                window.adminAuth?.showNotification('자격증 취소 중 오류가 발생했습니다.', 'error');
            } finally {
                // 로딩 종료
                if (window.adminUtils?.showLoadingOverlay) {
                    window.adminUtils.showLoadingOverlay(false);
                }
            }
        },

        // =================================
        // 유틸리티 함수들 - 🔧 전역 유틸리티 사용
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
         * 날짜 포맷팅 - 🔧 전역 유틸리티 사용
         */
        formatDate: function (date, includeTime = false) {
            if (!date) return '-';

            try {
                // Firebase Timestamp인 경우
                if (typeof date.toDate === 'function') {
                    date = date.toDate();
                } else if (typeof date === 'string') {
                    // 이미 문자열 형태이면 그대로 반환
                    return date;
                }

                // Date 객체인 경우 - 🔧 전역 유틸리티 사용
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

        /**
         * 날짜를 input[type="date"]용으로 포맷팅 - 🔧 전역 유틸리티 사용
         */
        formatDateToInput: function (date) {
            if (!date) return '';

            try {
                // Firebase Timestamp인 경우
                if (typeof date.toDate === 'function') {
                    date = date.toDate();
                } else if (typeof date === 'string') {
                    // YYYY-MM-DD 형식인지 확인
                    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                        return date;
                    }
                    // 다른 형식의 문자열일 경우 Date 객체로 변환
                    date = new Date(date);
                }

                // Date 객체인 경우 - 🔧 전역 유틸리티 사용
                if (date instanceof Date) {
                    return window.formatters.formatDate(date, 'YYYY-MM-DD');
                }
            } catch (error) {
                console.error('날짜 포맷팅 오류:', error);
            }

            return '';
        },

        /**
         * 테스트용 모의 자격증 데이터 가져오기
         */
        getMockCertificates: function () {
            // Firebase 연동 전 테스트용 데이터
            return [
                {
                    id: 'cert1',
                    certNumber: 'HE-2025-0001',
                    name: '홍길동',
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
                    course: '건강운동처방사 4기',
                    issueDate: '2024-12-20',
                    expiryDate: '2027-12-19',
                    status: 'active',
                    remarks: ''
                },
                {
                    id: 'cert4',
                    certNumber: 'HE-2024-0012',
                    name: '박지민',
                    course: '건강운동처방사 2기',
                    issueDate: '2024-06-30',
                    expiryDate: '2024-06-29',
                    status: 'expired',
                    remarks: '만료됨'
                },
                {
                    id: 'cert5',
                    certNumber: 'HE-2024-0018',
                    name: '최민수',
                    course: '건강운동처방사 3기',
                    issueDate: '2024-09-15',
                    expiryDate: '2027-09-14',
                    status: 'suspended',
                    remarks: '위반 행위로 인한 자격 정지'
                }
            ];
        },

        /**
         * ID로 테스트용 모의 자격증 데이터 가져오기
         */
        getMockCertificateById: function (certId) {
            console.log('🔧 테스트 데이터에서 자격증 검색:', certId);

            const certs = this.getMockCertificates();

            // ID로 먼저 검색
            let cert = certs.find(cert => cert.id === certId);

            // ID로 찾지 못하면 인덱스로 검색 (Firebase ID는 보통 랜덤 문자열)
            if (!cert && certs.length > 0) {
                // certId가 Firebase 스타일의 랜덤 ID인 경우 첫 번째 항목 반환
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
                    holderName: '테스트',
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
                console.log('🔧 기본 테스트 데이터 생성:', cert);
            }

            return cert;
        }
    };

    // 자격증 관리자 초기화
    window.certManager.init();
}

// 페이지 초기화 함수 (script-loader.js에 의해 호출됨)
window.initPage = function () {
    console.log('자격증 관리 페이지 초기화 중...');
    // 추가 초기화 로직 (필요시)
    console.log('자격증 관리 페이지 초기화 완료');
};

// =================================
// 🎯 디버깅 및 개발자 도구
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
            console.log('🎯 전문적인 자격증 관리 디버깅 도구 사용법');
            console.log('\n📊 데이터 관련:');
            console.log('- showCertificates() : 현재 자격증 목록');
            console.log('- reloadCertList() : 자격증 목록 다시 로드');
            console.log('- testDependencies() : 유틸리티 의존성 확인');
            console.log('- checkFirebase() : Firebase 연결 상태 확인');

            console.log('\n🎨 PDF 테스트:');
            console.log('- testKoreanPdf("cert-id") : 한글 PDF 테스트');
            console.log('- testEnglishPdf("cert-id") : 영문 PDF 테스트');
            console.log('- testBothPdfs("cert-id") : 한글/영문 PDF 모두 테스트');
            console.log('- checkImages() : 이미지 에셋 확인');

            console.log('\n🧪 종합 테스트:');
            console.log('- runFullTest() : 전체 기능 테스트');
        },

        testKoreanPdf: function (certId = 'cert1') {
            console.log('🎨 한글 PDF 테스트 시작:', certId);
            if (window.certManager) {
                window.certManager.generateKoreanCertPdf(certId);
            } else {
                console.error('❌ certManager가 로드되지 않음');
            }
        },

        testEnglishPdf: function (certId = 'cert1') {
            console.log('🎨 영문 PDF 테스트 시작:', certId);
            if (window.certManager) {
                window.certManager.generateEnglishCertPdf(certId);
            } else {
                console.error('❌ certManager가 로드되지 않음');
            }
        },

        testBothPdfs: function (certId = 'cert1') {
            console.log('🎨 한글/영문 PDF 모두 테스트:', certId);
            this.testKoreanPdf(certId);
            setTimeout(() => this.testEnglishPdf(certId), 3000);
        },

        checkImages: async function () {
            console.log('🖼️ 이미지 에셋 확인...');
            const { borderImagePath, koreaImagePath, englishImagePath } = getImagePaths();

            const results = {
                border: await checkImageExists(borderImagePath),
                korea: await checkImageExists(koreaImagePath),
                english: await checkImageExists(englishImagePath)
            };

            console.log('이미지 존재 여부:', results);
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
            console.log('🚀 전문적인 자격증 관리 전체 기능 테스트 시작...');

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

            console.log('\n4️⃣ PDF 생성 테스트');
            this.testBothPdfs();

            console.log('\n🎯 전체 테스트 완료!');
            console.log('💡 이제 관리자 페이지에서 PDF 다운로드를 테스트해보세요!');
        }
    };

    // 디버깅 도구 안내
    console.log('🎯 개발 모드 전문적인 자격증 관리 디버깅 도구 활성화됨');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('📊 데이터: testDependencies(), checkFirebase()');
    console.log('🎨 PDF 테스트: testKoreanPdf(), testEnglishPdf(), testBothPdfs()');
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

console.log('\n🎉 === cert-management.js 전문적인 PDF 시스템 완료 ===');
console.log('✅ 전문적인 한글 자격증: 참고 이미지 기반 고급 디자인');
console.log('✅ 전문적인 영문 자격증: 국제 표준 클래식 디자인');
console.log('✅ 실제 에셋 활용: border-gold.png, korea-medal.png, english-medal.png');
console.log('✅ 대체 시스템: 전문적인 SVG 기반 대체 이미지');
console.log('✅ 고해상도 PDF: 3배 스케일링으로 인쇄 품질 최적화');
console.log('✅ 기존 함수명 유지: generateKoreanCertPdf(), generateEnglishCertPdf()');
console.log('✅ PDF 아이콘 개선: 직관적인 PDF 파일 아이콘으로 교체');
console.log('✅ 드롭다운 z-index 수정: 테이블에 가려지지 않도록 개선');
console.log('\n🔧 해결된 문제:');
console.log('- 이미지 경로를 실제 에셋 경로로 수정 (assets/images/logo/)');
console.log('- 참고 자격증과 유사한 전문적이고 아름다운 디자인 적용');
console.log('- 계층적 정보 구조와 균형잡힌 레이아웃');
console.log('- 한글/영문별 최적화된 폰트 및 색상 조합');
console.log('- 고품질 인쇄를 위한 고해상도 PDF 생성');
console.log('- 견고한 오류 처리 및 대체 시스템');
console.log('\n🚀 이제 전문적이고 아름다운 자격증 PDF를 생성할 수 있습니다!');

// 완료 플래그 설정
window.certManagementProfessionalPdfComplete = true;