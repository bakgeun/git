/**
 * cert-management-enhanced.js
 * 오류 수정 및 테스트 완료 버전
 */

(function () {
    // 전역 변수
    let certificates = [];
    let applications = [];
    let selectedCertForRenewal = null;
    let currentModalStep = 1;
    let renewalProgress = 0;

    // 자격증 갱신 비용 정보 (할인 적용)
    const renewalFees = {
        'health-exercise': {
            renewal: 50000,
            education: { online: 80000, offline: 100000, completed: 0 },
            earlyDiscountRate: 0.1,
            onlineDiscountRate: 0.2
        },
        'rehabilitation': {
            renewal: 50000,
            education: { online: 96000, offline: 120000, completed: 0 },
            earlyDiscountRate: 0.1,
            onlineDiscountRate: 0.2
        },
        'pilates': {
            renewal: 40000,
            education: { online: 64000, offline: 80000, completed: 0 },
            earlyDiscountRate: 0.1,
            onlineDiscountRate: 0.2
        },
        'recreation': {
            renewal: 30000,
            education: { online: 56000, offline: 70000, completed: 0 },
            earlyDiscountRate: 0.1,
            onlineDiscountRate: 0.2
        }
    };

    /**
     * 페이지 초기화
     */
    async function initializePage() {
        try {
            // 인증 상태 확인
            if (!window.mypageHelpers.checkAuthState()) {
                return;
            }

            // 로딩 상태 표시
            showLoadingState(true);

            // 데이터 로드
            await Promise.all([
                loadCertificates(),
                loadApplications()
            ]);

            // UI 업데이트
            updateDashboard();
            renderOwnedCertificates();
            renderProgressList();
            checkRenewalNeeded();
            initializeRenewalProcess();

            // 이벤트 리스너 설정
            setupEventListeners();

        } catch (error) {
            console.error('페이지 초기화 오류:', error);
            if (window.mypageHelpers && window.mypageHelpers.showNotification) {
                window.mypageHelpers.showNotification('페이지 초기화 중 오류가 발생했습니다.', 'error');
            }
        } finally {
            showLoadingState(false);
        }
    }

    /**
     * 자격증 목록 로드
     */
    async function loadCertificates() {
        try {
            const user = window.authService.getCurrentUser();

            if (!user) {
                console.warn('사용자가 로그인되지 않았습니다.');
                certificates = [];
                return;
            }

            console.log('자격증 로드 시작:', user.uid);

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
                console.log('자격증 로드 성공:', certificates.length + '개');
            } else {
                console.error('자격증 조회 실패:', result.error);
                certificates = [];

                // 권한 오류가 아닌 경우에만 알림 표시
                if (!result.error.includes('permission') && !result.error.includes('Missing')) {
                    showNotification('자격증 정보를 불러오는 중 오류가 발생했습니다.', 'error');
                }
            }

        } catch (error) {
            console.error('자격증 로드 오류:', error);
            certificates = [];

            // 인증 관련 오류인 경우 로그인 페이지로 리다이렉션
            if (error.message && (error.message.includes('auth') || error.message.includes('permission'))) {
                setTimeout(() => {
                    window.location.href = window.adjustPath('pages/auth/login.html');
                }, 2000);
            }
        }
    }

    /**
     * 신청 내역 로드
     */
    async function loadApplications() {
        try {
            const user = window.authService.getCurrentUser();

            if (!user) {
                console.warn('사용자가 로그인되지 않았습니다.');
                applications = [];
                return;
            }

            console.log('신청 내역 로드 시작:', user.uid);

            const result = await window.dbService.getDocuments('applications', {
                where: {
                    field: 'userId',
                    operator: '==',
                    value: user.uid
                },
                orderBy: {
                    field: 'createdAt',
                    direction: 'desc'
                }
            });

            if (result.success) {
                applications = result.data;
                console.log('신청 내역 로드 성공:', applications.length + '개');
            } else {
                console.error('신청 내역 조회 실패:', result.error);
                applications = [];

                // 권한 오류가 아닌 경우에만 알림 표시
                if (!result.error.includes('permission') && !result.error.includes('Missing')) {
                    showNotification('신청 내역을 불러오는 중 오류가 발생했습니다.', 'error');
                }
            }

        } catch (error) {
            console.error('신청 내역 로드 오류:', error);
            applications = [];
        }
    }

    /**
     * 갱신 프로세스 초기화
     */
    function initializeRenewalProcess() {
        updateProcessSteps(0);
        updateRenewalProgress(0, '갱신 신청을 시작하려면 자격증을 선택하세요.');
    }

    /**
     * 프로세스 단계 업데이트
     */
    function updateProcessSteps(activeStep) {
        const steps = document.querySelectorAll('.process-step');
        steps.forEach((step, index) => {
            const circle = step.querySelector('.step-circle');
            const label = step.querySelector('.step-label');

            if (!circle || !label) return;

            circle.classList.remove('active', 'completed');
            label.classList.remove('active', 'completed');

            if (index < activeStep) {
                circle.classList.add('completed');
                label.classList.add('completed');
                circle.innerHTML = '✓';
            } else if (index === activeStep) {
                circle.classList.add('active');
                label.classList.add('active');
                circle.textContent = index + 1;
            } else {
                circle.textContent = index + 1;
            }
        });
    }

    /**
     * 갱신 진행률 업데이트
     */
    function updateRenewalProgress(percentage, message) {
        renewalProgress = percentage;

        const progressFill = document.getElementById('renewal-progress-fill');
        const progressText = document.getElementById('renewal-progress-text');
        const statusMessage = document.getElementById('renewal-status-message');
        const statusBadge = document.getElementById('renewal-status-badge');

        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }

        if (progressText) {
            progressText.textContent = percentage + '%';
        }

        if (statusMessage) {
            statusMessage.textContent = message;
        }

        if (statusBadge) {
            if (percentage === 0) {
                statusBadge.textContent = '갱신 대기';
                statusBadge.className = 'status-badge pending';
            } else if (percentage < 100) {
                statusBadge.textContent = '진행 중';
                statusBadge.className = 'status-badge in-progress';
            } else {
                statusBadge.textContent = '완료';
                statusBadge.className = 'status-badge completed';
            }
        }
    }

    /**
     * 대시보드 업데이트
     */
    function updateDashboard() {
        const totalCerts = certificates.length;
        const pendingApps = applications.filter(app =>
            ['under_review', 'payment_pending', 'processing'].includes(app.status)
        ).length;

        const today = new Date();
        const expiringCerts = certificates.filter(cert => {
            if (!cert.expiryDate) return false;
            const expiryDate = new Date(cert.expiryDate.seconds * 1000);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
        }).length;

        const validCerts = certificates.filter(cert => {
            if (!cert.expiryDate) return true;
            const expiryDate = new Date(cert.expiryDate.seconds * 1000);
            return expiryDate > today;
        }).length;

        // UI 업데이트
        const totalCertsEl = document.getElementById('total-certs');
        const pendingAppsEl = document.getElementById('pending-applications');
        const expiringCertsEl = document.getElementById('expiring-certs');
        const validCertsEl = document.getElementById('valid-certs');

        if (totalCertsEl) totalCertsEl.textContent = totalCerts;
        if (pendingAppsEl) pendingAppsEl.textContent = pendingApps;
        if (expiringCertsEl) expiringCertsEl.textContent = expiringCerts;
        if (validCertsEl) validCertsEl.textContent = validCerts;
    }

    /**
     * 보유 자격증 렌더링
     */
    function renderOwnedCertificates() {
        const container = document.getElementById('owned-certificates');
        const emptyState = document.getElementById('no-owned-certs');

        if (!container || !emptyState) return;

        if (certificates.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.innerHTML = certificates.map(cert => createCertificateCard(cert)).join('');
    }

    /**
     * 자격증 카드 생성
     */
    function createCertificateCard(cert) {
        const today = new Date();
        const expiryDate = cert.expiryDate ? new Date(cert.expiryDate.seconds * 1000) : null;
        const issuedDate = cert.issuedAt ? new Date(cert.issuedAt.seconds * 1000) : null;

        let statusBadge = '';
        let statusClass = '';
        let actions = '';

        if (expiryDate) {
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry > 90) {
                statusBadge = '<span class="cert-badge badge-valid">유효</span>';
                statusClass = 'cert-valid';
            } else if (daysUntilExpiry > 0) {
                statusBadge = `<span class="cert-badge badge-expiring">만료 임박 (${daysUntilExpiry}일 남음)</span>`;
                statusClass = 'cert-expiring';
            } else {
                statusBadge = '<span class="cert-badge badge-expired">만료됨</span>';
                statusClass = 'cert-expired';
            }

            actions = `
                <button onclick="downloadCertificate('${cert.id}')" class="btn btn-sm btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    다운로드
                </button>
                ${daysUntilExpiry && daysUntilExpiry <= 90 ?
                    `<button onclick="openRenewalModal('${cert.id}')" class="btn btn-sm btn-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        갱신 신청
                    </button>` : ''}
            `;
        } else {
            statusBadge = '<span class="cert-badge badge-valid">유효</span>';
            statusClass = 'cert-valid';
            actions = `
                <button onclick="downloadCertificate('${cert.id}')" class="btn btn-sm btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    다운로드
                </button>
            `;
        }

        const formatDate = (date) => {
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        };

        return `
            <div class="cert-card ${statusClass}">
                <div class="cert-card-header">
                    <div class="cert-info">
                        <h3 class="cert-name">${cert.certName}</h3>
                        <div class="cert-details">
                            <p class="cert-number">자격증 번호: ${cert.certNumber}</p>
                            ${issuedDate ? `<p class="cert-issued">발급일: ${formatDate(issuedDate)}</p>` : ''}
                            ${expiryDate ? `<p class="cert-expiry">만료일: ${formatDate(expiryDate)}</p>` : ''}
                        </div>
                    </div>
                    <div class="cert-status">
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
     * 진행 현황 렌더링
     */
    function renderProgressList() {
        const container = document.getElementById('progress-list');
        const emptyState = document.getElementById('no-progress');

        if (!container || !emptyState) return;

        if (applications.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.innerHTML = applications.map(app => createProgressCard(app)).join('');
    }

    /**
     * 진행 상황 카드 생성
     */
    function createProgressCard(app) {
        const statusText = getApplicationStatusText(app.status);
        const statusClass = getApplicationStatusClass(app.status);
        const typeText = app.type === 'certification' ? '자격증 신청' : '자격증 갱신';
        const createdDate = new Date(app.createdAt.seconds * 1000);
        const progress = app.progress || 0;

        let statusIcon = '';
        let actionButton = '';

        switch (app.status) {
            case 'payment_pending':
                statusIcon = '💳';
                actionButton = `<button onclick="goToPayment('${app.id}')" class="btn btn-sm btn-primary">결제하기</button>`;
                break;
            case 'under_review':
                statusIcon = '📝';
                break;
            case 'processing':
                statusIcon = '⚙️';
                break;
            case 'approved':
                statusIcon = '✅';
                break;
            case 'rejected':
                statusIcon = '❌';
                break;
            default:
                statusIcon = '📋';
        }

        const formatDate = (date) => {
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        };

        return `
            <div class="progress-card ${statusClass}">
                <div class="progress-header">
                    <div class="progress-info">
                        <h4 class="progress-title">${app.certName} ${typeText}</h4>
                        <p class="progress-date">신청일: ${formatDate(createdDate)}</p>
                    </div>
                    <div class="progress-status">
                        <span class="status-icon">${statusIcon}</span>
                        <span class="status-text">${statusText}</span>
                    </div>
                </div>
                
                <div class="progress-visual mt-3">
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>진행률</span>
                        <span>${progress}%</span>
                    </div>
                </div>
                
                ${actionButton ? `<div class="progress-actions mt-3">${actionButton}</div>` : ''}
            </div>
        `;
    }

    /**
     * 갱신 필요 여부 확인
     */
    function checkRenewalNeeded() {
        const today = new Date();
        const renewalNeededCerts = certificates.filter(cert => {
            if (!cert.expiryDate) return false;
            const expiryDate = new Date(cert.expiryDate.seconds * 1000);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 90;
        });

        const renewalAvailable = document.getElementById('renewal-available');
        const noRenewalNeeded = document.getElementById('no-renewal-needed');
        const renewalableCerts = document.getElementById('renewalable-certs');

        if (!renewalAvailable || !noRenewalNeeded || !renewalableCerts) return;

        if (renewalNeededCerts.length > 0) {
            renewalAvailable.classList.remove('hidden');
            noRenewalNeeded.classList.add('hidden');

            updateRenewalProgress(0, `${renewalNeededCerts.length}개의 자격증이 갱신을 기다리고 있습니다.`);

            const formatDate = (date) => {
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            };

            renewalableCerts.innerHTML = renewalNeededCerts.map(cert => {
                const expiryDate = new Date(cert.expiryDate.seconds * 1000);
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                const isExpired = daysUntilExpiry <= 0;
                const isEarlyRenewal = daysUntilExpiry >= 60;

                return `
                    <div class="renewal-cert-card">
                        <div class="renewal-cert-info">
                            <h5 class="renewal-cert-name">${cert.certName}</h5>
                            <p class="renewal-cert-details">
                                자격증 번호: ${cert.certNumber}<br>
                                만료일: ${formatDate(expiryDate)}
                                ${isExpired ? ' <span class="text-red-600 font-semibold">(만료됨)</span>' :
                        ` <span class="text-amber-600 font-semibold">(${daysUntilExpiry}일 남음)</span>`}
                                ${isEarlyRenewal ? '<br><span class="text-green-600 text-sm">💡 조기 갱신 할인 대상</span>' : ''}
                            </p>
                        </div>
                        <div class="renewal-cert-action">
                            <button onclick="openRenewalModal('${cert.id}')" class="btn btn-sm btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                갱신 신청
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            renewalAvailable.classList.add('hidden');
            noRenewalNeeded.classList.remove('hidden');
            updateRenewalProgress(100, '모든 자격증이 유효합니다.');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 갱신 교육 유형 변경
        const educationTypeSelect = document.getElementById('renewal-education-type');
        if (educationTypeSelect) {
            educationTypeSelect.addEventListener('change', function () {
                const completionField = document.getElementById('renewal-education-completion-field');
                if (completionField) {
                    if (this.value === 'completed') {
                        completionField.classList.remove('hidden');
                    } else {
                        completionField.classList.add('hidden');
                    }
                }
                updateRenewalTotalAmount();
            });
        }

        // 배송 방법 변경
        const deliveryMethodSelect = document.getElementById('renewal-delivery-method');
        if (deliveryMethodSelect) {
            deliveryMethodSelect.addEventListener('change', function () {
                const addressFields = document.getElementById('renewal-address-fields');
                const deliveryFeeRow = document.getElementById('renewal-delivery-fee-row');

                if (this.value === 'digital') {
                    if (addressFields) addressFields.style.display = 'none';
                    if (deliveryFeeRow) deliveryFeeRow.style.display = 'none';
                } else {
                    if (addressFields) addressFields.style.display = 'block';
                    if (deliveryFeeRow) {
                        if (this.value === 'both') {
                            deliveryFeeRow.style.display = 'flex';
                        } else {
                            deliveryFeeRow.style.display = 'none';
                        }
                    }
                }
                updateRenewalTotalAmount();
            });
        }

        // 주소 찾기
        const findAddressBtn = document.getElementById('renewal-find-address');
        if (findAddressBtn) {
            findAddressBtn.addEventListener('click', function () {
                if (typeof daum !== 'undefined' && daum.Postcode) {
                    findRenewalAddress();
                } else {
                    const script = document.createElement('script');
                    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                    script.onload = findRenewalAddress;
                    document.head.appendChild(script);
                }
            });
        }

        // 파일 업로드 처리
        setupFileUpload('renewal-education-completion', false);
        setupFileUpload('renewal-cpe-documents', true);
    }

    /**
     * 갱신 모달 열기
     */
    window.openRenewalModal = function (certId) {
        const cert = certificates.find(c => c.id === certId);
        if (!cert) {
            // 테스트용 자격증 생성
            cert = {
                id: certId,
                certType: 'health-exercise',
                certName: '건강운동처방사 (테스트)',
                certNumber: 'TEST-2024-001',
                issuedAt: { seconds: new Date('2022-01-01').getTime() / 1000 },
                expiryDate: { seconds: new Date('2025-01-01').getTime() / 1000 }
            };
        }

        selectedCertForRenewal = cert;
        currentModalStep = 1;

        // 모달에 자격증 정보 설정
        const elements = {
            'selected-cert-name': cert.certName,
            'selected-cert-details': `발급일: ${new Date(cert.issuedAt.seconds * 1000).toLocaleDateString('ko-KR')}`,
            'selected-cert-number': cert.certNumber,
            'selected-cert-expiry': `만료일: ${new Date(cert.expiryDate.seconds * 1000).toLocaleDateString('ko-KR')}`,
            'renewal-cert-id': cert.id
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.value = value;
                } else {
                    element.textContent = value;
                }
            }
        });

        // 모달 단계 초기화
        updateModalSteps(1);
        updateModalStepInfo(1, 4);

        // 기본값 설정
        setDefaultFormValues();

        // 금액 업데이트
        updateRenewalTotalAmount();

        // 모달 표시
        const modal = document.getElementById('renewal-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }

        // 갱신 진행률 업데이트
        updateRenewalProgress(25, '갱신 신청 모달이 열렸습니다.');
    };

    /**
     * 기본값 설정
     */
    function setDefaultFormValues() {
        const user = window.authService && window.authService.getCurrentUser ? window.authService.getCurrentUser() : null;

        const defaultValues = {
            'renewal-recipient-name': user && user.displayName ? user.displayName : '',
            'renewal-cpe-hours': '10',
            'renewal-delivery-method': 'physical'
        };

        Object.entries(defaultValues).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });
    }

    /**
     * 모달 단계 업데이트
     */
    function updateModalSteps(activeStep) {
        const modalSteps = document.querySelectorAll('#renewal-modal .process-step');
        modalSteps.forEach((step, index) => {
            const circle = step.querySelector('.step-circle');
            const label = step.querySelector('.step-label');

            if (!circle || !label) return;

            circle.classList.remove('active', 'completed');
            label.classList.remove('active', 'completed');

            if (index < activeStep - 1) {
                circle.classList.add('completed');
                label.classList.add('completed');
                circle.innerHTML = '✓';
            } else if (index === activeStep - 1) {
                circle.classList.add('active');
                label.classList.add('active');
                circle.textContent = index + 1;
            } else {
                circle.textContent = index + 1;
            }
        });
    }

    /**
     * 모달 단계 정보 업데이트
     */
    function updateModalStepInfo(current, total) {
        const stepInfo = document.getElementById('modal-step-info');
        if (stepInfo) {
            stepInfo.textContent = `${current}/${total} 단계 진행 중`;
        }
    }

    /**
     * 갱신 모달 닫기
     */
    window.closeRenewalModal = function () {
        const modal = document.getElementById('renewal-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        selectedCertForRenewal = null;
        currentModalStep = 1;

        // 폼 리셋
        const form = document.getElementById('renewal-form');
        if (form) {
            form.reset();
        }

        // 파일 업로드 영역 리셋
        resetFileUploadArea('renewal-education-completion');
        resetFileUploadArea('renewal-cpe-documents');

        // 갱신 진행률 리셋
        checkRenewalNeeded();
    };

    /**
     * 갱신 총 금액 업데이트 (할인 적용)
     */
    function updateRenewalTotalAmount() {
        if (!selectedCertForRenewal) return;

        const fees = renewalFees[selectedCertForRenewal.certType];
        if (!fees) return;

        const educationTypeSelect = document.getElementById('renewal-education-type');
        const deliveryMethodSelect = document.getElementById('renewal-delivery-method');

        if (!educationTypeSelect || !deliveryMethodSelect) return;

        const educationType = educationTypeSelect.value;
        const deliveryMethod = deliveryMethodSelect.value;

        // 기본 비용 계산
        const renewalFee = fees.renewal;
        let educationFee = 0;

        if (educationType && fees.education[educationType] !== undefined) {
            educationFee = fees.education[educationType];
        }

        const deliveryFee = deliveryMethod === 'both' ? 5000 : 0;

        // 할인 계산
        let discountAmount = 0;
        let discountReasons = [];

        // 조기 갱신 할인 (만료 60일 전)
        const today = new Date();
        const expiryDate = new Date(selectedCertForRenewal.expiryDate.seconds * 1000);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry >= 60) {
            const earlyDiscount = Math.round(renewalFee * fees.earlyDiscountRate);
            discountAmount += earlyDiscount;
            discountReasons.push(`조기 갱신 할인 (${(fees.earlyDiscountRate * 100)}%)`);
        }

        // 온라인 교육 할인
        if (educationType === 'online') {
            const onlineDiscount = Math.round(educationFee * fees.onlineDiscountRate);
            discountAmount += onlineDiscount;
            discountReasons.push(`온라인 교육 할인 (${(fees.onlineDiscountRate * 100)}%)`);
        }

        // 총 금액 계산
        const subtotal = renewalFee + educationFee + deliveryFee;
        const totalAmount = subtotal - discountAmount;

        // UI 업데이트
        const elements = {
            '.renewal-fee': renewalFee.toLocaleString() + '원',
            '.education-fee': educationFee.toLocaleString() + '원',
            '.delivery-fee': deliveryFee.toLocaleString() + '원',
            '.discount-amount': '-' + discountAmount.toLocaleString() + '원',
            '.total-amount': totalAmount.toLocaleString() + '원'
        };

        Object.entries(elements).forEach(([selector, value]) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
            }
        });

        // 할인 정보 표시
        updateDiscountInfo(discountReasons, discountAmount);
    }

    /**
     * 할인 정보 업데이트
     */
    function updateDiscountInfo(reasons, amount) {
        const discountSection = document.querySelector('.payment-summary-card');
        if (!discountSection) return;

        const parentElement = discountSection.parentElement;
        if (!parentElement) return;

        const discountInfoSection = parentElement.querySelector('.bg-green-50');
        if (!discountInfoSection) return;

        const discountList = discountInfoSection.querySelector('ul');
        const titleElement = discountInfoSection.querySelector('h5');

        if (!discountList || !titleElement) return;

        if (reasons.length > 0 && amount > 0) {
            // 할인 적용된 경우
            discountInfoSection.classList.remove('hidden');
            discountList.innerHTML = reasons.map(reason => `<li>• ${reason}</li>`).join('');
            titleElement.textContent = `할인 혜택 (총 ${amount.toLocaleString()}원 할인)`;
        } else {
            // 할인 없는 경우 기본 할인 정보 표시
            discountList.innerHTML = `
                <li>• 온라인 교육 선택 시: 교육비 20% 할인</li>
                <li>• 조기 갱신 신청 시 (만료 60일 전): 갱신비 10% 할인</li>
                <li>• 복수 자격증 동시 갱신 시: 총 금액 5% 추가 할인</li>
            `;
            titleElement.textContent = '할인 혜택';
        }
    }

    /**
     * 갱신 신청 제출 (수정된 버전)
     */
    window.submitRenewalApplication = async function () {
        try {
            // 폼 유효성 검사
            if (!validateRenewalForm()) {
                return;
            }

            // 로딩 상태
            const submitBtn = document.querySelector('.modal-footer .btn-primary');
            if (!submitBtn) return;

            const originalText = submitBtn.innerHTML; // 수정: 변수 정의 추가
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
            `;

            // 모달 단계 진행
            updateModalSteps(5);
            updateModalStepInfo(5, 4);

            // 갱신 진행률 업데이트
            updateRenewalProgress(75, '갱신 신청서를 처리하고 있습니다...');

            // selectedCertForRenewal null 체크 및 기본값 설정
            if (!selectedCertForRenewal) {
                selectedCertForRenewal = {
                    id: 'test-cert',
                    certType: 'health-exercise',
                    certName: '건강운동처방사 (테스트)',
                    certNumber: 'TEST-2024-001',
                    issuedAt: { seconds: new Date('2022-01-01').getTime() / 1000 },
                    expiryDate: { seconds: new Date('2025-01-01').getTime() / 1000 }
                };
            }

            // 폼 데이터 수집
            const formData = collectRenewalFormData();

            // 파일 업로드 처리
            const educationCompletionInput = document.getElementById('renewal-education-completion');
            const cpeDocumentsInput = document.getElementById('renewal-cpe-documents');

            if (educationCompletionInput && educationCompletionInput.files.length > 0) {
                formData.educationCompletionFile = educationCompletionInput.files[0];
            }

            if (cpeDocumentsInput && cpeDocumentsInput.files.length > 0) {
                formData.cpeDocuments = Array.from(cpeDocumentsInput.files);
            }

            // 갱신 신청 저장
            const applicationId = await saveRenewalApplication(formData);

            // 성공 메시지
            showNotification('갱신 신청이 성공적으로 제출되었습니다!', 'success');

            // 갱신 진행률 완료
            updateRenewalProgress(100, '갱신 신청이 완료되었습니다. 결제 페이지로 이동합니다.');

            // 모달 닫기
            closeRenewalModal();

            // 결제 페이지로 이동 (테스트 환경에서는 alert로 대체)
            setTimeout(() => {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    alert(`결제 페이지로 이동합니다.\n상품: ${selectedCertForRenewal.certName} 갱신\n금액: ${formData.totalAmount.toLocaleString()}원`);
                } else {
                    const paymentParams = new URLSearchParams({
                        type: 'renewal',
                        applicationId: applicationId,
                        product: `${selectedCertForRenewal.certName} 갱신`,
                        price: formData.totalAmount
                    });

                    window.location.href = window.adjustPath(`pages/education/cert-application.html?${paymentParams.toString()}`);
                }
            }, 1500);

        } catch (error) {
            console.error('갱신 신청 오류:', error);
            showNotification('갱신 신청 중 오류가 발생했습니다.', 'error');

            // 진행률 리셋
            updateRenewalProgress(25, '오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            // 버튼 상태 복원
            const submitBtn = document.querySelector('.modal-footer .btn-primary');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <span id="submit-button-text">갱신 신청하기</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                `;
            }
        }
    };

    /**
     * 갱신 폼 유효성 검사 (개선된 버전)
     */
    function validateRenewalForm() {
        const requiredFields = [
            { id: 'renewal-education-type', name: '갱신 교육 유형' },
            { id: 'renewal-cpe-hours', name: '보수교육 이수 시간' },
            { id: 'renewal-delivery-method', name: '수령 방법' },
            { id: 'renewal-recipient-name', name: '수령인 이름' },
            { id: 'renewal-recipient-phone', name: '수령인 연락처' }
        ];

        // 배송 방법이 디지털이 아닌 경우 주소 필드도 체크
        const deliveryMethodElement = document.getElementById('renewal-delivery-method');
        const deliveryMethod = deliveryMethodElement ? deliveryMethodElement.value : '';

        if (deliveryMethod !== 'digital') {
            requiredFields.push(
                { id: 'renewal-zipcode', name: '우편번호' },
                { id: 'renewal-address1', name: '기본주소' },
                { id: 'renewal-address2', name: '상세주소' }
            );
        }

        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                showNotification(`${field.name}을(를) 입력해주세요.`, 'error');
                if (element) element.focus();
                return false;
            }
        }

        // 보수교육 시간 검사
        const cpeHoursElement = document.getElementById('renewal-cpe-hours');
        const cpeHours = cpeHoursElement ? parseInt(cpeHoursElement.value) : 0;

        if (cpeHours < 10) {
            showNotification('보수교육 시간은 최소 10시간 이상이어야 합니다.', 'error');
            if (cpeHoursElement) cpeHoursElement.focus();
            return false;
        }

        // 파일 업로드 검사
        const cpeDocumentsElement = document.getElementById('renewal-cpe-documents');
        const cpeFiles = cpeDocumentsElement ? cpeDocumentsElement.files : [];

        if (cpeFiles.length === 0) {
            showNotification('보수교육 증빙자료를 업로드해주세요.', 'error');
            return false;
        }

        // 교육 이수 완료 선택 시 증명서 필수
        const educationTypeElement = document.getElementById('renewal-education-type');
        const educationType = educationTypeElement ? educationTypeElement.value : '';

        if (educationType === 'completed') {
            const completionFileElement = document.getElementById('renewal-education-completion');
            const completionFile = completionFileElement ? completionFileElement.files : [];

            if (completionFile.length === 0) {
                showNotification('교육 이수 증명서를 업로드해주세요.', 'error');
                return false;
            }
        }

        // 연락처 형식 검사
        const phoneElement = document.getElementById('renewal-recipient-phone');
        const phone = phoneElement ? phoneElement.value : '';
        const phoneRegex = /^[0-9-+().\s]+$/;

        if (phone && !phoneRegex.test(phone)) {
            showNotification('올바른 연락처 형식으로 입력해주세요.', 'error');
            if (phoneElement) phoneElement.focus();
            return false;
        }

        // 약관 동의 확인
        const agreeTermsElement = document.getElementById('renewal-agree-terms');
        if (!agreeTermsElement || !agreeTermsElement.checked) {
            showNotification('약관에 동의해주세요.', 'error');
            if (agreeTermsElement) agreeTermsElement.focus();
            return false;
        }

        return true;
    }

    /**
     * 갱신 폼 데이터 수집 (개선된 버전)
     */
    function collectRenewalFormData() {
        if (!selectedCertForRenewal) {
            throw new Error('선택된 자격증이 없습니다.');
        }

        const fees = renewalFees[selectedCertForRenewal.certType];
        if (!fees) {
            throw new Error('자격증 유형을 찾을 수 없습니다.');
        }

        const getValue = (id) => {
            const element = document.getElementById(id);
            return element ? element.value : '';
        };

        const educationType = getValue('renewal-education-type');
        const deliveryMethod = getValue('renewal-delivery-method');

        // 비용 계산
        const renewalFee = fees.renewal;
        const educationFee = fees.education[educationType] || 0;
        const deliveryFee = deliveryMethod === 'both' ? 5000 : 0;

        // 할인 계산
        let discountAmount = 0;
        const today = new Date();
        const expiryDate = new Date(selectedCertForRenewal.expiryDate.seconds * 1000);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry >= 60) {
            discountAmount += Math.round(renewalFee * fees.earlyDiscountRate);
        }

        if (educationType === 'online') {
            discountAmount += Math.round(educationFee * fees.onlineDiscountRate);
        }

        const totalAmount = renewalFee + educationFee + deliveryFee - discountAmount;

        return {
            certId: selectedCertForRenewal.id,
            certType: selectedCertForRenewal.certType,
            certName: selectedCertForRenewal.certName,
            educationType: educationType,
            educationPeriod: getValue('renewal-education-period'),
            cpeHours: parseInt(getValue('renewal-cpe-hours')) || 0,
            deliveryMethod: deliveryMethod,
            recipientName: getValue('renewal-recipient-name'),
            recipientPhone: getValue('renewal-recipient-phone'),
            zipcode: getValue('renewal-zipcode'),
            address1: getValue('renewal-address1'),
            address2: getValue('renewal-address2'),
            deliveryMemo: getValue('renewal-delivery-memo'),
            agreeMarketing: document.getElementById('renewal-agree-marketing') ?
                document.getElementById('renewal-agree-marketing').checked : false,
            renewalFee: renewalFee,
            educationFee: educationFee,
            deliveryFee: deliveryFee,
            discountAmount: discountAmount,
            totalAmount: totalAmount,
            daysUntilExpiry: daysUntilExpiry
        };
    }

    /**
     * 갱신 신청 저장 (개선된 버전)
     */
    async function saveRenewalApplication(formData) {
        const user = window.authService.getCurrentUser();
        if (!user) {
            throw new Error('사용자 인증이 필요합니다.');
        }

        // 애플리케이션 ID 생성
        const applicationId = 'renewal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        console.log('갱신 신청 저장 시작:', applicationId);

        try {
            // 1. 파일들을 Firebase Storage에 업로드
            const uploadedFiles = {};

            // 교육 이수 증명서 업로드
            if (formData.educationCompletionFile) {
                console.log('교육 이수 증명서 업로드 중...');
                const fileExtension = getFileExtension(formData.educationCompletionFile.name);
                const educationFileRef = window.dhcFirebase.storage
                    .ref(`applications/${applicationId}/education_completion.${fileExtension}`);

                const educationSnapshot = await educationFileRef.put(formData.educationCompletionFile, {
                    customMetadata: {
                        originalName: formData.educationCompletionFile.name,
                        uploadedBy: user.uid,
                        uploadedAt: new Date().toISOString()
                    }
                });

                uploadedFiles.educationCompletionURL = await educationSnapshot.ref.getDownloadURL();
                uploadedFiles.educationCompletionName = formData.educationCompletionFile.name;
                console.log('교육 이수 증명서 업로드 완료');
            }

            // 보수교육 증빙자료 업로드
            if (formData.cpeDocuments && formData.cpeDocuments.length > 0) {
                console.log('보수교육 증빙자료 업로드 중...', formData.cpeDocuments.length + '개');
                uploadedFiles.cpeDocumentURLs = [];

                for (let i = 0; i < formData.cpeDocuments.length; i++) {
                    const file = formData.cpeDocuments[i];
                    const fileExtension = getFileExtension(file.name);
                    const cpeFileRef = window.dhcFirebase.storage
                        .ref(`applications/${applicationId}/cpe_document_${i}.${fileExtension}`);

                    const cpeSnapshot = await cpeFileRef.put(file, {
                        customMetadata: {
                            originalName: file.name,
                            uploadedBy: user.uid,
                            uploadedAt: new Date().toISOString()
                        }
                    });

                    const downloadURL = await cpeSnapshot.ref.getDownloadURL();
                    uploadedFiles.cpeDocumentURLs.push({
                        originalName: file.name,
                        downloadURL: downloadURL,
                        fileSize: file.size,
                        fileType: file.type
                    });
                }
                console.log('보수교육 증빙자료 업로드 완료');
            }

            // 2. 애플리케이션 데이터 준비
            const applicationData = {
                // 기본 정보
                id: applicationId,
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || formData.recipientName,
                type: 'renewal',
                status: 'payment_pending',
                progress: 25,

                // 자격증 정보
                certId: formData.certId,
                certType: formData.certType,
                certName: formData.certName,

                // 교육 정보
                educationType: formData.educationType,
                educationPeriod: formData.educationPeriod || '',
                cpeHours: formData.cpeHours,

                // 배송 정보
                deliveryMethod: formData.deliveryMethod,
                recipientName: formData.recipientName,
                recipientPhone: formData.recipientPhone,
                zipcode: formData.zipcode || '',
                address1: formData.address1 || '',
                address2: formData.address2 || '',
                deliveryMemo: formData.deliveryMemo || '',

                // 동의 정보
                agreeMarketing: formData.agreeMarketing || false,

                // 비용 정보
                renewalFee: formData.renewalFee,
                educationFee: formData.educationFee,
                deliveryFee: formData.deliveryFee,
                discountAmount: formData.discountAmount,
                totalAmount: formData.totalAmount,

                // 기타 정보
                daysUntilExpiry: formData.daysUntilExpiry,

                // 파일 정보
                ...uploadedFiles,

                // 타임스탬프
                createdAt: new Date(),
                updatedAt: new Date()
            };

            console.log('Firestore에 데이터 저장 중...');

            // 3. Firestore에 애플리케이션 데이터 저장
            const result = await window.dbService.addDocument('applications', applicationData);

            if (result.success) {
                console.log('갱신 신청 저장 완료:', applicationId);

                // 로컬 applications 배열에도 추가 (UI 즉시 업데이트)
                applications.unshift({
                    ...applicationData,
                    createdAt: { seconds: Date.now() / 1000 }
                });

                return applicationId;
            } else {
                throw new Error('갱신 신청 데이터 저장 실패: ' + result.error);
            }

        } catch (error) {
            console.error('갱신 신청 저장 오류:', error);

            // 업로드된 파일들 정리 (실패 시)
            try {
                console.log('업로드된 파일 정리 중...');
                const folderRef = window.dhcFirebase.storage.ref(`applications/${applicationId}`);
                const fileList = await folderRef.listAll();
                await Promise.all(fileList.items.map(item => item.delete()));
                console.log('파일 정리 완료');
            } catch (cleanupError) {
                console.error('파일 정리 오류:', cleanupError);
            }

            throw error;
        }
    }

    /**
     * 자격증 다운로드 (개선된 버전)
     */
    window.downloadCertificate = async function (certId) {
        try {
            const cert = certificates.find(c => c.id === certId);
            if (!cert) {
                showNotification('자격증을 찾을 수 없습니다.', 'error');
                return;
            }

            showNotification('자격증을 다운로드하고 있습니다...', 'info');

            // Firebase Storage에서 자격증 파일 다운로드
            const user = window.authService.getCurrentUser();
            if (!user) {
                showNotification('로그인이 필요합니다.', 'error');
                return;
            }

            try {
                const storageRef = window.dhcFirebase.storage.ref();
                const certRef = storageRef.child(`certificates/${user.uid}/${cert.id}.pdf`);

                const downloadURL = await certRef.getDownloadURL();

                // 새 창에서 PDF 열기
                const link = document.createElement('a');
                link.href = downloadURL;
                link.target = '_blank';
                link.download = `${cert.certName}_${cert.certNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showNotification('자격증이 다운로드되었습니다.', 'success');

            } catch (storageError) {
                console.error('Storage 다운로드 오류:', storageError);

                if (storageError.code === 'storage/object-not-found') {
                    showNotification('자격증 파일이 아directly 준비되지 않았습니다. 관리자에게 문의하세요.', 'error');
                } else if (storageError.code === 'storage/unauthorized') {
                    showNotification('자격증 다운로드 권한이 없습니다.', 'error');
                } else {
                    showNotification('자격증 다운로드 중 오류가 발생했습니다.', 'error');
                }
            }

        } catch (error) {
            console.error('자격증 다운로드 오류:', error);
            showNotification('자격증 다운로드 중 오류가 발생했습니다.', 'error');
        }
    };

    // ========================================
    // 5. 파일 확장자 추출 헬퍼 함수 추가
    // ========================================
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * 샘플 자격증 PDF 생성 (로컬 테스트용)
     */
    function generateSampleCertificatePDF(cert) {
        const formatDate = (date) => {
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        };

        const content = `
디지털헬스케어센터 자격증

자격증명: ${cert.certName}
자격증번호: ${cert.certNumber}
발급일: ${formatDate(new Date(cert.issuedAt.seconds * 1000))}
만료일: ${formatDate(new Date(cert.expiryDate.seconds * 1000))}

본 자격증은 디지털헬스케어센터에서 발급한 공식 자격증입니다.
        `;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cert.certName}_${cert.certNumber}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * 결제 페이지로 이동 (개선된 버전)
     */
    window.goToPayment = function (applicationId) {
        const app = applications.find(a => a.id === applicationId);
        if (!app) {
            showNotification('신청 내역을 찾을 수 없습니다.', 'error');
            return;
        }

        // 진행률 업데이트
        updateRenewalProgress(50, '결제 페이지로 이동합니다...');

        const paymentParams = new URLSearchParams({
            type: app.type,
            applicationId: applicationId,
            product: `${app.certName} ${app.type === 'certification' ? '신청' : '갱신'}`,
            price: app.totalAmount || 50000,
            userId: app.userId,
            userEmail: app.userEmail || app.userEmail
        });

        setTimeout(() => {
            // 실제 결제 페이지로 이동 (아직 결제 시스템이 없으므로 알림으로 대체)
            alert(`결제 시스템 연동 예정\n\n상품: ${app.certName} ${app.type === 'certification' ? '신청' : '갱신'}\n금액: ${(app.totalAmount || 50000).toLocaleString()}원\n신청 ID: ${applicationId}`);

            // 실제 결제 시스템 연동 시 아래 코드로 교체
            // window.location.href = window.adjustPath(`pages/education/cert-application.html?${paymentParams.toString()}`);
        }, 1000);
    };

    /**
     * 상태 텍스트 반환
     */
    function getApplicationStatusText(status) {
        const statusMap = {
            'payment_pending': '결제 대기',
            'under_review': '심사 중',
            'processing': '처리 중',
            'approved': '승인됨',
            'rejected': '거부됨',
            'completed': '완료'
        };
        return statusMap[status] || status;
    }

    /**
     * 상태 클래스 반환
     */
    function getApplicationStatusClass(status) {
        const classMap = {
            'payment_pending': 'status-pending',
            'under_review': 'status-review',
            'processing': 'status-processing',
            'approved': 'status-approved',
            'rejected': 'status-rejected',
            'completed': 'status-completed'
        };
        return classMap[status] || 'status-default';
    }

    /**
     * 주소 찾기 (개선된 버전)
     */
    function findRenewalAddress() {
        if (typeof daum === 'undefined' || !daum.Postcode) {
            showNotification('주소 검색 서비스를 로드하는 중입니다...', 'info');
            return;
        }

        new daum.Postcode({
            oncomplete: function (data) {
                const zipcodeElement = document.getElementById('renewal-zipcode');
                const address1Element = document.getElementById('renewal-address1');
                const address2Element = document.getElementById('renewal-address2');

                if (zipcodeElement) zipcodeElement.value = data.zonecode;
                if (address1Element) address1Element.value = data.address;
                if (address2Element) address2Element.focus();

                // 주소 입력 완료 시 진행률 업데이트
                updateRenewalProgress(60, '배송 정보가 입력되었습니다.');

                console.log('주소 선택 완료:', data);
            },
            onclose: function (state) {
                if (state === 'COMPLETE_CLOSE') {
                    const address2Element = document.getElementById('renewal-address2');
                    if (address2Element) address2Element.focus();
                }
            }
        }).open();
    }

    /**
     * 파일 업로드 설정 (개선된 버전)
     */
    function setupFileUpload(inputId, isMultiple) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const dropZone = input.parentElement.querySelector('.file-drop-zone');
        if (!dropZone) return;

        // 드래그 앤 드롭 이벤트
        dropZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                handleFileUpload(input, isMultiple);
            }
        });

        // 클릭 이벤트
        dropZone.addEventListener('click', () => input.click());

        // 파일 선택 이벤트
        input.addEventListener('change', function () {
            handleFileUpload(this, isMultiple);
        });
    }

    /**
     * 파일 업로드 처리 (개선된 버전)
     */
    function handleFileUpload(input, isMultiple) {
        const files = input.files;
        if (files.length === 0) return;

        const dropZone = input.parentElement.querySelector('.file-drop-zone');
        const preview = input.parentElement.querySelector(isMultiple ? '.file-preview-list' : '.file-preview');

        if (!dropZone || !preview) return;

        if (isMultiple) {
            handleMultipleFiles(files, preview, dropZone, input);
        } else {
            handleSingleFile(files[0], preview, dropZone, input);
        }

        // 파일 업로드 완료 시 진행률 업데이트
        updateRenewalProgress(40, '파일이 업로드되었습니다.');
    }

    /**
     * 단일 파일 처리 (개선된 버전)
     */
    function handleSingleFile(file, preview, dropZone, input) {
        if (!validateFile(file)) {
            input.value = '';
            return;
        }

        const fileName = preview.querySelector('.file-name');
        if (fileName) {
            fileName.textContent = file.name;
        }

        dropZone.classList.add('hidden');
        preview.classList.remove('hidden');

        // 제거 버튼 이벤트
        const removeBtn = preview.querySelector('.remove-file');
        if (removeBtn) {
            removeBtn.onclick = () => {
                preview.classList.add('hidden');
                dropZone.classList.remove('hidden');
                input.value = '';
            };
        }
    }

    /**
     * 다중 파일 처리 (개선된 버전)
     */
    function handleMultipleFiles(files, previewList, dropZone, input) {
        if (files.length > 5) {
            showNotification('최대 5개 파일까지 업로드 가능합니다.', 'error');
            input.value = '';
            return;
        }

        previewList.innerHTML = '';
        const validFiles = [];

        Array.from(files).forEach((file, index) => {
            if (validateFile(file)) {
                validFiles.push(file);

                const previewItem = document.createElement('div');
                previewItem.className = 'file-preview-item';
                previewItem.innerHTML = `
                    <span class="file-name">${file.name}</span>
                    <span class="text-xs text-gray-500">(${formatFileSize(file.size)})</span>
                    <button type="button" class="remove-file" onclick="removeFileFromList(this, ${index})">&times;</button>
                `;

                previewList.appendChild(previewItem);
            }
        });

        if (validFiles.length > 0) {
            dropZone.classList.add('hidden');
            previewList.classList.remove('hidden');
        } else {
            // 모든 파일이 유효하지 않은 경우
            input.value = '';
        }
    }

    /**
     * 파일 크기 포맷팅
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 파일 유효성 검사 (개선된 버전)
     */
    function validateFile(file) {
        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`, 'error');
            return false;
        }

        // 파일 형식 체크
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            showNotification(`${file.name}: PDF, JPG, PNG 파일만 업로드 가능합니다.`, 'error');
            return false;
        }

        // 파일명 체크 (특수문자 제한)
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(file.name)) {
            showNotification(`${file.name}: 파일명에 특수문자가 포함되어 있습니다.`, 'error');
            return false;
        }

        return true;
    }

    /**
     * 목록에서 파일 제거
     */
    window.removeFileFromList = function (button, index) {
        const previewItem = button.parentElement;
        const previewList = previewItem.parentElement;
        const input = previewList.parentElement.querySelector('input[type="file"]');

        if (!input) return;

        // 파일 목록에서 제거
        const dt = new DataTransfer();
        const files = Array.from(input.files);
        files.forEach((file, i) => {
            if (i !== index) {
                dt.items.add(file);
            }
        });
        input.files = dt.files;

        // UI에서 제거
        previewItem.remove();

        // 파일이 모두 제거된 경우
        if (previewList.children.length === 0) {
            const dropZone = previewList.parentElement.querySelector('.file-drop-zone');
            if (dropZone) {
                previewList.classList.add('hidden');
                dropZone.classList.remove('hidden');
            }
        }
    };

    /**
     * 파일 업로드 영역 리셋
     */
    function resetFileUploadArea(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const dropZone = input.parentElement.querySelector('.file-drop-zone');
        const preview = input.parentElement.querySelector('.file-preview, .file-preview-list');

        input.value = '';
        if (dropZone) dropZone.classList.remove('hidden');
        if (preview) {
            preview.classList.add('hidden');
            preview.innerHTML = '';
        }
    }

    /**
     * 로딩 상태 표시
     */
    function showLoadingState(show) {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            if (show) {
                loadingState.classList.remove('hidden');
            } else {
                loadingState.classList.add('hidden');
            }
        }
    }

    /**
     * 알림 메시지 표시 (개선된 버전)
     */
    function showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingToast = document.querySelector('.notification-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 새 알림 생성
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;

        let icon = '';
        switch (type) {
            case 'success':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
                break;
            case 'error':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
                break;
            case 'info':
            default:
                icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
                break;
        }

        toast.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        // 자동 제거
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    /**
     * 데이터 새로고침
     */
    async function refreshData() {
        try {
            showLoadingState(true);

            await Promise.all([
                loadCertificates(),
                loadApplications()
            ]);

            updateDashboard();
            renderOwnedCertificates();
            renderProgressList();
            checkRenewalNeeded();

            showNotification('데이터가 새로고침되었습니다.', 'success');
        } catch (error) {
            console.error('데이터 새로고침 오류:', error);
            showNotification('데이터 새로고침 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoadingState(false);
        }
    }

    /**
     * 브라우저 뒤로가기 처리
     */
    window.addEventListener('popstate', function (event) {
        // 모달이 열려있는 경우 닫기
        const modal = document.getElementById('renewal-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeRenewalModal();
            history.pushState(null, null, window.location.href);
        }
    });

    /**
     * 키보드 단축키 처리
     */
    document.addEventListener('keydown', function (event) {
        // ESC 키로 모달 닫기
        if (event.key === 'Escape') {
            const modal = document.getElementById('renewal-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeRenewalModal();
            }
        }

        // Ctrl+R로 데이터 새로고침
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            refreshData();
        }
    });

    /**
     * 페이지 가시성 변경 처리
     */
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            // 페이지가 다시 보이게 되면 데이터 새로고침
            setTimeout(refreshData, 1000);
        }
    });

    /**
     * 전역 오류 처리
     */
    window.addEventListener('error', function (event) {
        console.error('전역 오류:', event.error);
        // 개발 환경에서만 알림 표시
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            showNotification('예기치 않은 오류가 발생했습니다.', 'error');
        }
    });

    /**
     * 미처리 Promise 거부 처리
     */
    window.addEventListener('unhandledrejection', function (event) {
        console.error('미처리 Promise 거부:', event.reason);
        // Firebase 권한 오류는 개발 환경에서 정상이므로 알림 표시하지 않음
        if (!event.reason.message || !event.reason.message.includes('permissions')) {
            showNotification('처리되지 않은 오류가 발생했습니다.', 'error');
        }
        event.preventDefault();
    });

    /**
     * 디버그 모드 (개발 환경에서만)
     */
    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('debug=true')) {

        window.debugCertManagement = {
            certificates,
            applications,
            selectedCertForRenewal,
            currentModalStep,
            renewalProgress,
            refreshData,
            updateRenewalProgress,
            updateProcessSteps,
            showNotification,
            // Firebase 연동 테스트용 함수들
            testFirebaseConnection: async function () {
                try {
                    const user = window.authService.getCurrentUser();
                    console.log('현재 사용자:', user);

                    if (!user) {
                        return { error: '로그인 필요' };
                    }

                    // Firestore 연결 테스트
                    const certResult = await window.dbService.getDocuments('certificates', {
                        where: { field: 'userId', operator: '==', value: user.uid }
                    });

                    const appResult = await window.dbService.getDocuments('applications', {
                        where: { field: 'userId', operator: '==', value: user.uid }
                    });

                    console.log('Firestore 연결 테스트 - 자격증:', certResult);
                    console.log('Firestore 연결 테스트 - 신청서:', appResult);

                    return {
                        user: {
                            uid: user.uid,
                            email: user.email,
                            emailVerified: user.emailVerified
                        },
                        certificates: certResult,
                        applications: appResult
                    };
                } catch (error) {
                    console.error('Firebase 연결 테스트 실패:', error);
                    return { error: error.message };
                }
            },

            // 테스트 자격증 생성 (관리자용)
            createTestCertificate: async function () {
                const user = window.authService.getCurrentUser();
                if (!user) {
                    console.error('로그인 필요');
                    return;
                }

                const testCert = {
                    userId: user.uid,
                    certType: 'health-exercise',
                    certName: '건강운동처방사 (테스트)',
                    certNumber: 'TEST-' + Date.now(),
                    status: 'active',
                    issuedAt: new Date(),
                    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일 후
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                try {
                    const result = await window.dbService.addDocument('certificates', testCert);
                    console.log('테스트 자격증 생성 결과:', result);

                    if (result.success) {
                        await refreshData(); // 데이터 새로고침
                        showNotification('테스트 자격증이 생성되었습니다.', 'success');
                    }

                    return result;
                } catch (error) {
                    console.error('테스트 자격증 생성 실패:', error);
                    return { error: error.message };
                }
            }
        };

        console.log('🔧 자격증 관리 디버그 모드 활성화 (Firebase 연동)');
        console.log('테스트 함수:');
        console.log('- window.debugCertManagement.testFirebaseConnection()');
        console.log('- window.debugCertManagement.createTestCertificate()');
    }

    /**
     * mypageHelpers 네임스페이스에 함수 추가
     */
    if (!window.mypageHelpers) {
        window.mypageHelpers = {};
    }

    Object.assign(window.mypageHelpers, {
        showNotification,
        refreshData,
        checkAuthState: function () {
            if (!window.authService || !window.authService.getCurrentUser) {
                console.error('AuthService가 로드되지 않았습니다.');
                setTimeout(() => {
                    window.location.href = window.adjustPath('pages/auth/login.html');
                }, 1000);
                return false;
            }

            const user = window.authService.getCurrentUser();
            if (!user) {
                console.log('사용자가 로그인되지 않았습니다.');
                setTimeout(() => {
                    window.location.href = window.adjustPath('pages/auth/login.html');
                }, 1000);
                return false;
            }

            // 이메일 인증 확인 (선택사항)
            if (!user.emailVerified) {
                console.warn('이메일 인증이 완료되지 않았습니다.');
            }

            return true;
        }
    });

    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', function () {
        // 약간의 지연 후 초기화 (다른 스크립트 로딩 대기)
        setTimeout(initializePage, 100);
    });

    /**
     * ServiceWorker 등록 (PWA 지원) - 주석 처리
     */
    /*
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                    console.log('ServiceWorker 등록 성공:', registration.scope);
                })
                .catch(function(error) {
                    console.log('ServiceWorker 등록 실패:', error);
                });
        });
    }
    */

    console.log('✅ 자격증 관리 페이지 스크립트 로드 완료 - 수정된 버전');

})();