/**
 * cert-management.js
 * 자격증 관리 페이지 기능
 */

(function() {
    // 현재 활성 탭
    let activeTab = 'active';
    let certificates = [];

    /**
     * 페이지 초기화
     */
    async function initializePage() {
        try {
            // 인증 상태 확인
            if (!window.mypageHelpers.checkAuthState()) {
                return;
            }

            // 이벤트 리스너 설정
            setupEventListeners();

            // 자격증 목록 로드
            await loadCertificates();

        } catch (error) {
            console.error('페이지 초기화 오류:', error);
            window.mypageHelpers.showNotification('페이지 초기화 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 탭 클릭 이벤트
        document.querySelectorAll('.cert-tab').forEach(tab => {
            tab.addEventListener('click', handleTabClick);
        });
    }

    /**
     * 탭 클릭 처리
     * @param {Event} event - 이벤트 객체
     */
    function handleTabClick(event) {
        const tab = event.target;
        activeTab = tab.dataset.tab;

        // 활성 탭 스타일 업데이트
        document.querySelectorAll('.cert-tab').forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');

        // 자격증 목록 다시 렌더링
        renderCertificateList();
    }

    /**
     * 자격증 목록 로드
     */
    async function loadCertificates() {
        try {
            // 로딩 상태 표시
            showLoadingState(true);

            const user = window.authService.getCurrentUser();
            
            // Firestore에서 자격증 조회
            const result = await window.dbService.getDocuments('certificates', {
                where: {
                    field: 'userId',
                    operator: '==',
                    value: user.uid
                },
                orderBy: {
                    field: 'issuedAt',
                    direction: 'desc'
                }
            });

            if (result.success) {
                certificates = result.data;
                renderCertificateList();
            } else {
                throw new Error('자격증 조회 실패');
            }

        } catch (error) {
            console.error('자격증 로드 오류:', error);
            window.mypageHelpers.showNotification('자격증 정보를 불러오는데 실패했습니다.', 'error');
            showEmptyState();
        } finally {
            showLoadingState(false);
        }
    }

    /**
     * 자격증 목록 렌더링
     */
    function renderCertificateList() {
        const certList = document.getElementById('cert-list');
        
        // 현재 탭에 맞는 자격증 필터링
        const filteredCerts = certificates.filter(cert => {
            const today = new Date();
            const expiryDate = cert.expiryDate ? new Date(cert.expiryDate.seconds * 1000) : null;
            
            switch (activeTab) {
                case 'active':
                    return cert.status === 'issued' && (!expiryDate || expiryDate > today);
                case 'expired':
                    return cert.status === 'issued' && expiryDate && expiryDate <= today;
                case 'pending':
                    return cert.status === 'pending';
                default:
                    return true;
            }
        });

        if (filteredCerts.length === 0) {
            showEmptyState();
            return;
        }

        certList.innerHTML = filteredCerts.map(cert => createCertificateItem(cert)).join('');
        document.getElementById('empty-state').classList.add('hidden');
    }

    /**
     * 자격증 아이템 생성
     * @param {object} cert - 자격증 데이터
     * @returns {string} - HTML 문자열
     */
    function createCertificateItem(cert) {
        const expiryDate = cert.expiryDate ? new Date(cert.expiryDate.seconds * 1000) : null;
        const issuedDate = cert.issuedAt ? new Date(cert.issuedAt.seconds * 1000) : null;
        const certTypeText = getCertTypeText(cert.certType);
        
        let statusBadge = '';
        let actions = '';
        
        if (cert.status === 'issued') {
            // 만료 상태 확인
            const today = new Date();
            const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)) : null;
            
            if (!expiryDate || daysUntilExpiry > 90) {
                statusBadge = '<span class="cert-badge badge-valid">유효</span>';
            } else if (daysUntilExpiry > 0) {
                statusBadge = `<span class="cert-badge badge-expiring">만료 임박 (${daysUntilExpiry}일)</span>`;
            } else {
                statusBadge = '<span class="cert-badge badge-expired">만료됨</span>';
            }
            
            actions = `
                <button onclick="downloadCertificate('${cert.id}')" class="btn btn-primary">
                    자격증 다운로드
                </button>
                ${daysUntilExpiry && daysUntilExpiry <= 90 ? 
                    `<button onclick="renewCertificate('${cert.id}')" class="btn btn-secondary">
                        갱신 신청
                    </button>` : ''}
            `;
        } else if (cert.status === 'pending') {
            statusBadge = '<span class="cert-badge badge-pending">발급 대기중</span>';
            actions = `
                <button class="btn btn-secondary" disabled>
                    처리중
                </button>
            `;
        }
        
        return `
            <div class="cert-item">
                <div class="cert-info">
                    <h3 class="cert-name">${certTypeText}</h3>
                    <div class="cert-details">
                        ${cert.certNumber ? `<p>자격증 번호: ${cert.certNumber}</p>` : ''}
                        ${issuedDate ? `<p>발급일: ${window.formatters.formatDate(issuedDate)}</p>` : ''}
                        ${expiryDate ? `<p>만료일: ${window.formatters.formatDate(expiryDate)}</p>` : ''}
                        ${statusBadge}
                    </div>
                </div>
                <div class="cert-actions">
                    ${actions}
                </div>
            </div>
        `;
    }

    /**
     * 자격증 타입 텍스트 반환
     * @param {string} certType - 자격증 타입
     * @returns {string} - 자격증 텍스트
     */
    function getCertTypeText(certType) {
        switch (certType) {
            case 'health-exercise':
                return '건강운동처방사';
            case 'rehabilitation':
                return '운동재활전문가';
            case 'pilates':
                return '필라테스 전문가';
            case 'recreation':
                return '레크리에이션지도자';
            default:
                return '기타 자격증';
        }
    }

    /**
     * 로딩 상태 표시
     * @param {boolean} show - 표시 여부
     */
    function showLoadingState(show) {
        const loadingState = document.getElementById('loading-state');
        const certList = document.getElementById('cert-list');
        const emptyState = document.getElementById('empty-state');
        
        if (show) {
            loadingState.classList.remove('hidden');
            certList.innerHTML = '';
            emptyState.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
        }
    }

    /**
     * 빈 상태 표시
     */
    function showEmptyState() {
        const certList = document.getElementById('cert-list');
        const emptyState = document.getElementById('empty-state');
        
        certList.innerHTML = '';
        emptyState.classList.remove('hidden');
    }

    /**
     * 자격증 다운로드
     * @param {string} certId - 자격증 ID
     */
    window.downloadCertificate = async function(certId) {
        try {
            window.mypageHelpers.showNotification('자격증 다운로드 기능은 준비 중입니다.', 'info');
            
            // 실제 구현 시 PDF 다운로드 로직 추가
            // const cert = certificates.find(c => c.id === certId);
            // if (cert && cert.pdfUrl) {
            //     window.open(cert.pdfUrl, '_blank');
            // }
        } catch (error) {
            console.error('자격증 다운로드 오류:', error);
            window.mypageHelpers.showNotification('자격증 다운로드 중 오류가 발생했습니다.', 'error');
        }
    };

    /**
     * 자격증 갱신
     * @param {string} certId - 자격증 ID
     */
    window.renewCertificate = async function(certId) {
        try {
            const cert = certificates.find(c => c.id === certId);
            
            if (!cert) {
                throw new Error('자격증을 찾을 수 없습니다.');
            }

            window.mypageHelpers.showConfirmDialog(
                '자격증 갱신을 신청하시겠습니까?\n갱신 절차에 따라 추가 비용이 발생할 수 있습니다.',
                async function() {
                    try {
                        // 갱신 신청 페이지로 이동
                        window.location.href = `../education/cert-renewal.html?certId=${certId}`;
                    } catch (error) {
                        console.error('갱신 신청 오류:', error);
                        window.mypageHelpers.showNotification('갱신 신청 중 오류가 발생했습니다.', 'error');
                    }
                }
            );
        } catch (error) {
            console.error('자격증 갱신 오류:', error);
            window.mypageHelpers.showNotification('자격증 갱신 중 오류가 발생했습니다.', 'error');
        }
    };

    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', initializePage);
})();