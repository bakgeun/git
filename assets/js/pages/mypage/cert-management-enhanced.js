/**
 * cert-management-enhanced.js
 * 개선된 자격증 관리 페이지 기능
 */

(function() {
    // 전역 변수
    let certificates = [];
    let applications = [];
    let selectedCertForRenewal = null;

    // 자격증 갱신 비용 정보
    const renewalFees = {
        'health-exercise': { renewal: 50000, education: 100000 },
        'rehabilitation': { renewal: 50000, education: 120000 },
        'pilates': { renewal: 40000, education: 80000 },
        'recreation': { renewal: 30000, education: 70000 }
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

            // 이벤트 리스너 설정
            setupEventListeners();

        } catch (error) {
            console.error('페이지 초기화 오류:', error);
            window.mypageHelpers.showNotification('페이지 초기화 중 오류가 발생했습니다.', 'error');
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
            
            if (window.dhcFirebase && window.dhcFirebase.db) {
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
                } else {
                    throw new Error('자격증 조회 실패');
                }
            } else {
                // 로컬 테스트용 데이터
                certificates = [
                    {
                        id: 'cert1',
                        certType: 'health-exercise',
                        certName: '건강운동처방사',
                        certNumber: 'DHC-2022-001',
                        status: 'active',
                        issuedAt: { seconds: new Date('2022-03-15').getTime() / 1000 },
                        expiryDate: { seconds: new Date('2025-03-15').getTime() / 1000 }
                    },
                    {
                        id: 'cert2',
                        certType: 'pilates',
                        certName: '필라테스 전문가',
                        certNumber: 'DHC-2021-045',
                        status: 'expiring',
                        issuedAt: { seconds: new Date('2021-12-20').getTime() / 1000 },
                        expiryDate: { seconds: new Date('2025-01-15').getTime() / 1000 }
                    }
                ];
            }
        } catch (error) {
            console.error('자격증 로드 오류:', error);
            certificates = [];
        }
    }

    /**
     * 신청 내역 로드
     */
    async function loadApplications() {
        try {
            const user = window.authService.getCurrentUser();
            
            if (window.dhcFirebase && window.dhcFirebase.db) {
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
                } else {
                    throw new Error('신청 내역 조회 실패');
                }
            } else {
                // 로컬 테스트용 데이터
                applications = [
                    {
                        id: 'app1',
                        type: 'certification', // cert-application.html에서 온 것
                        certType: 'rehabilitation',
                        certName: '운동재활전문가',
                        status: 'under_review',
                        createdAt: { seconds: new Date('2024-11-15').getTime() / 1000 },
                        paymentStatus: 'completed'
                    },
                    {
                        id: 'app2',
                        type: 'renewal', // 마이페이지에서 갱신 신청한 것
                        certType: 'pilates',
                        certName: '필라테스 전문가',
                        status: 'payment_pending',
                        createdAt: { seconds: new Date('2024-11-20').getTime() / 1000 },
                        paymentStatus: 'pending'
                    }
                ];
            }
        } catch (error) {
            console.error('신청 내역 로드 오류:', error);
            applications = [];
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
        document.getElementById('total-certs').textContent = totalCerts;
        document.getElementById('pending-applications').textContent = pendingApps;
        document.getElementById('expiring-certs').textContent = expiringCerts;
        document.getElementById('valid-certs').textContent = validCerts;
    }

    /**
     * 보유 자격증 렌더링
     */
    function renderOwnedCertificates() {
        const container = document.getElementById('owned-certificates');
        const emptyState = document.getElementById('no-owned-certs');

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
            
            // 액션 버튼
            actions = `
                <button onclick="downloadCertificate('${cert.id}')" class="btn btn-sm btn-primary">
                    다운로드
                </button>
                ${daysUntilExpiry && daysUntilExpiry <= 90 ? 
                    `<button onclick="openRenewalModal('${cert.id}')" class="btn btn-sm btn-secondary">
                        갱신 신청
                    </button>` : ''}
            `;
        } else {
            statusBadge = '<span class="cert-badge badge-valid">유효</span>';
            statusClass = 'cert-valid';
            actions = `
                <button onclick="downloadCertificate('${cert.id}')" class="btn btn-sm btn-primary">
                    다운로드
                </button>
            `;
        }
        
        return `
            <div class="cert-card ${statusClass}">
                <div class="cert-card-header">
                    <div class="cert-info">
                        <h3 class="cert-name">${cert.certName}</h3>
                        <div class="cert-details">
                            <p class="cert-number">자격증 번호: ${cert.certNumber}</p>
                            ${issuedDate ? `<p class="cert-issued">발급일: ${window.formatters.formatDate(issuedDate)}</p>` : ''}
                            ${expiryDate ? `<p class="cert-expiry">만료일: ${window.formatters.formatDate(expiryDate)}</p>` : ''}
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
        
        return `
            <div class="progress-card ${statusClass}">
                <div class="progress-header">
                    <div class="progress-info">
                        <h4 class="progress-title">${app.certName} ${typeText}</h4>
                        <p class="progress-date">신청일: ${window.formatters.formatDate(createdDate)}</p>
                    </div>
                    <div class="progress-status">
                        <span class="status-icon">${statusIcon}</span>
                        <span class="status-text">${statusText}</span>
                    </div>
                </div>
                ${actionButton ? `<div class="progress-actions">${actionButton}</div>` : ''}
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
            return daysUntilExpiry <= 90; // 90일 이내 또는 만료된 것
        });

        const renewalAvailable = document.getElementById('renewal-available');
        const noRenewalNeeded = document.getElementById('no-renewal-needed');
        const renewalableCerts = document.getElementById('renewalable-certs');

        if (renewalNeededCerts.length > 0) {
            renewalAvailable.classList.remove('hidden');
            noRenewalNeeded.classList.add('hidden');
            
            renewalableCerts.innerHTML = renewalNeededCerts.map(cert => {
                const expiryDate = new Date(cert.expiryDate.seconds * 1000);
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                const isExpired = daysUntilExpiry <= 0;
                
                return `
                    <div class="renewal-cert-card">
                        <div class="renewal-cert-info">
                            <h5 class="renewal-cert-name">${cert.certName}</h5>
                            <p class="renewal-cert-details">
                                자격증 번호: ${cert.certNumber}<br>
                                만료일: ${window.formatters.formatDate(expiryDate)}
                                ${isExpired ? ' <span class="text-red-600">(만료됨)</span>' : 
                                  ` <span class="text-amber-600">(${daysUntilExpiry}일 남음)</span>`}
                            </p>
                        </div>
                        <div class="renewal-cert-action">
                            <button onclick="openRenewalModal('${cert.id}')" class="btn btn-sm btn-primary">
                                갱신 신청
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            renewalAvailable.classList.add('hidden');
            noRenewalNeeded.classList.remove('hidden');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 갱신 교육 유형 변경
        document.getElementById('renewal-education-type').addEventListener('change', function() {
            const completionField = document.getElementById('renewal-education-completion-field');
            if (this.value === 'completed') {
                completionField.classList.remove('hidden');
            } else {
                completionField.classList.add('hidden');
            }
        });

        // 배송 방법 변경
        document.getElementById('renewal-delivery-method').addEventListener('change', function() {
            const addressFields = document.getElementById('renewal-address-fields');
            const deliveryFeeRow = document.getElementById('renewal-delivery-fee-row');
            
            if (this.value === 'digital') {
                addressFields.style.display = 'none';
                deliveryFeeRow.style.display = 'none';
            } else {
                addressFields.style.display = 'block';
                if (this.value === 'both') {
                    deliveryFeeRow.style.display = 'flex';
                } else {
                    deliveryFeeRow.style.display = 'none';
                }
            }
            updateRenewalTotalAmount();
        });

        // 주소 찾기
        document.getElementById('renewal-find-address').addEventListener('click', function() {
            if (typeof daum !== 'undefined' && daum.Postcode) {
                findRenewalAddress();
            } else {
                // Daum 우편번호 API 동적 로드
                const script = document.createElement('script');
                script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                script.onload = findRenewalAddress;
                document.head.appendChild(script);
            }
        });

        // 파일 업로드 처리
        setupFileUpload('renewal-education-completion', false);
        setupFileUpload('renewal-cpe-documents', true);
    }

    /**
     * 갱신 모달 열기
     */
    window.openRenewalModal = function(certId) {
        const cert = certificates.find(c => c.id === certId);
        if (!cert) return;

        selectedCertForRenewal = cert;
        
        // 모달에 자격증 정보 설정
        document.getElementById('selected-cert-name').textContent = cert.certName;
        document.getElementById('selected-cert-details').textContent = `발급일: ${window.formatters.formatDate(new Date(cert.issuedAt.seconds * 1000))}`;
        document.getElementById('selected-cert-number').textContent = cert.certNumber;
        document.getElementById('selected-cert-expiry').textContent = `만료일: ${window.formatters.formatDate(new Date(cert.expiryDate.seconds * 1000))}`;
        document.getElementById('renewal-cert-id').value = certId;

        // 금액 업데이트
        updateRenewalTotalAmount();

        // 모달 표시
        document.getElementById('renewal-modal').classList.remove('hidden');
    };

    /**
     * 갱신 모달 닫기
     */
    window.closeRenewalModal = function() {
        document.getElementById('renewal-modal').classList.add('hidden');
        selectedCertForRenewal = null;
        
        // 폼 리셋
        document.getElementById('renewal-form').reset();
        
        // 파일 업로드 영역 리셋
        resetFileUploadArea('renewal-education-completion');
        resetFileUploadArea('renewal-cpe-documents');
    };

    /**
     * 갱신 총 금액 업데이트
     */
    function updateRenewalTotalAmount() {
        if (!selectedCertForRenewal) return;

        const fees = renewalFees[selectedCertForRenewal.certType] || { renewal: 50000, education: 100000 };
        const deliveryMethod = document.getElementById('renewal-delivery-method').value;
        const deliveryFee = deliveryMethod === 'both' ? 5000 : 0;
        
        const totalAmount = fees.renewal + fees.education + deliveryFee;
        
        document.querySelector('.renewal-fee').textContent = fees.renewal.toLocaleString() + '원';
        document.querySelector('.education-fee').textContent = fees.education.toLocaleString() + '원';
        document.querySelector('.delivery-fee').textContent = deliveryFee.toLocaleString() + '원';
        document.querySelector('.total-amount').textContent = totalAmount.toLocaleString() + '원';
    }

    /**
     * 갱신 신청 제출
     */
    window.submitRenewalApplication = async function() {
        try {
            // 폼 유효성 검사
            if (!validateRenewalForm()) {
                return;
            }

            // 로딩 상태
            const submitBtn = document.querySelector('.modal-footer .btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '처리 중...';

            // 폼 데이터 수집
            const formData = collectRenewalFormData();

            // 파일 업로드 처리
            if (document.getElementById('renewal-education-completion').files.length > 0) {
                formData.educationCompletionFile = document.getElementById('renewal-education-completion').files[0];
            }
            
            const cpeFiles = document.getElementById('renewal-cpe-documents').files;
            if (cpeFiles.length > 0) {
                formData.cpeDocuments = Array.from(cpeFiles);
            }

            // 갱신 신청 저장
            const applicationId = await saveRenewalApplication(formData);

            // 결제 페이지로 이동
            const paymentParams = new URLSearchParams({
                type: 'renewal',
                applicationId: applicationId,
                product: `${selectedCertForRenewal.certName} 갱신`,
                price: formData.totalAmount
            });

            window.location.href = window.adjustPath(`pages/education/payment.html?${paymentParams.toString()}`);

        } catch (error) {
            console.error('갱신 신청 오류:', error);
            window.mypageHelpers.showNotification('갱신 신청 중 오류가 발생했습니다.', 'error');
        } finally {
            // 버튼 상태 복원
            const submitBtn = document.querySelector('.modal-footer .btn-primary');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    };

    /**
     * 갱신 폼 유효성 검사
     */
    function validateRenewalForm() {
        const requiredFields = [
            'renewal-education-type',
            'renewal-cpe-hours',
            'renewal-cpe-documents',
            'renewal-delivery-method'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value && fieldId !== 'renewal-cpe-documents') {
                window.mypageHelpers.showNotification(`${field.labels[0].textContent}을(를) 입력해주세요.`, 'error');
                field.focus();
                return false;
            }
        }

        // 보수교육 시간 검사
        const cpeHours = parseInt(document.getElementById('renewal-cpe-hours').value);
        if (cpeHours < 10) {
            window.mypageHelpers.showNotification('보수교육 시간은 최소 10시간 이상이어야 합니다.', 'error');
            return false;
        }

        // 약관 동의 확인
        if (!document.getElementById('renewal-agree-terms').checked) {
            window.mypageHelpers.showNotification('약관에 동의해주세요.', 'error');
            return false;
        }

        return true;
    }

    /**
     * 갱신 폼 데이터 수집
     */
    function collectRenewalFormData() {
        const fees = renewalFees[selectedCertForRenewal.certType] || { renewal: 50000, education: 100000 };
        const deliveryMethod = document.getElementById('renewal-delivery-method').value;
        const deliveryFee = deliveryMethod === 'both' ? 5000 : 0;
        const totalAmount = fees.renewal + fees.education + deliveryFee;

        return {
            certId: selectedCertForRenewal.id,
            certType: selectedCertForRenewal.certType,
            certName: selectedCertForRenewal.certName,
            educationType: document.getElementById('renewal-education-type').value,
            cpeHours: parseInt(document.getElementById('renewal-cpe-hours').value),
            deliveryMethod: deliveryMethod,
            zipcode: document.getElementById('renewal-zipcode').value,
            address1: document.getElementById('renewal-address1').value,
            address2: document.getElementById('renewal-address2').value,
            renewalFee: fees.renewal,
            educationFee: fees.education,
            deliveryFee: deliveryFee,
            totalAmount: totalAmount
        };
    }

    /**
     * 갱신 신청 저장
     */
    async function saveRenewalApplication(formData) {
        if (window.dhcFirebase && window.dhcFirebase.db) {
            const user = window.authService.getCurrentUser();
            const applicationData = {
                ...formData,
                userId: user.uid,
                type: 'renewal',
                status: 'payment_pending',
                createdAt: new Date()
            };

            const result = await window.dbService.addDocument('applications', applicationData);
            if (result.success) {
                return result.id;
            } else {
                throw new Error('갱신 신청 저장 실패');
            }
        } else {
            // 로컬 테스트용
            const applicationId = 'renewal_' + Date.now();
            console.log('갱신 신청 데이터:', formData);
            return applicationId;
        }
    }

    /**
     * 자격증 다운로드
     */
    window.downloadCertificate = async function(certId) {
        try {
            window.mypageHelpers.showNotification('자격증 다운로드 기능은 준비 중입니다.', 'info');
            // 실제 구현에서는 PDF 생성 및 다운로드 로직 추가
        } catch (error) {
            console.error('자격증 다운로드 오류:', error);
            window.mypageHelpers.showNotification('자격증 다운로드 중 오류가 발생했습니다.', 'error');
        }
    };

    /**
     * 결제 페이지로 이동
     */
    window.goToPayment = function(applicationId) {
        const app = applications.find(a => a.id === applicationId);
        if (!app) return;

        const paymentParams = new URLSearchParams({
            applicationId: applicationId,
            product: `${app.certName} ${app.type === 'certification' ? '신청' : '갱신'}`,
            price: app.totalAmount || 50000
        });

        window.location.href = window.adjustPath(`pages/education/payment.html?${paymentParams.toString()}`);
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
     * 주소 찾기
     */
    function findRenewalAddress() {
        new daum.Postcode({
            oncomplete: function(data) {
                document.getElementById('renewal-zipcode').value = data.zonecode;
                document.getElementById('renewal-address1').value = data.address;
                document.getElementById('renewal-address2').focus();
            }
        }).open();
    }

    /**
     * 파일 업로드 설정
     */
    function setupFileUpload(inputId, isMultiple) {
        const input = document.getElementById(inputId);
        const dropZone = input.parentElement.querySelector('.file-drop-zone');
        
        // 드래그 앤 드롭 및 클릭 이벤트 설정
        dropZone.addEventListener('click', () => input.click());
        
        input.addEventListener('change', function() {
            handleFileUpload(this, isMultiple);
        });
    }

    /**
     * 파일 업로드 처리
     */
    function handleFileUpload(input, isMultiple) {
        const files = input.files;
        if (files.length === 0) return;

        const dropZone = input.parentElement.querySelector('.file-drop-zone');
        const preview = input.parentElement.querySelector(isMultiple ? '.file-preview-list' : '.file-preview');
        
        if (isMultiple) {
            handleMultipleFiles(files, preview, dropZone);
        } else {
            handleSingleFile(files[0], preview, dropZone);
        }
    }

    /**
     * 단일 파일 처리
     */
    function handleSingleFile(file, preview, dropZone) {
        if (!validateFile(file)) return;

        const fileName = preview.querySelector('.file-name');
        fileName.textContent = file.name;
        
        dropZone.classList.add('hidden');
        preview.classList.remove('hidden');
        
        // 제거 버튼 이벤트
        const removeBtn = preview.querySelector('.remove-file');
        removeBtn.onclick = () => {
            preview.classList.add('hidden');
            dropZone.classList.remove('hidden');
            dropZone.parentElement.querySelector('input[type="file"]').value = '';
        };
    }

    /**
     * 다중 파일 처리
     */
    function handleMultipleFiles(files, previewList, dropZone) {
        if (files.length > 5) {
            window.mypageHelpers.showNotification('최대 5개 파일까지 업로드 가능합니다.', 'error');
            return;
        }

        previewList.innerHTML = '';
        
        Array.from(files).forEach((file, index) => {
            if (!validateFile(file)) return;
            
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';
            previewItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <button type="button" class="remove-file" onclick="removeFileFromList(this, ${index})">&times;</button>
            `;
            
            previewList.appendChild(previewItem);
        });
        
        if (previewList.children.length > 0) {
            dropZone.classList.add('hidden');
            previewList.classList.remove('hidden');
        }
    }

    /**
     * 파일 유효성 검사
     */
    function validateFile(file) {
        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            window.mypageHelpers.showNotification('파일 크기는 5MB 이하여야 합니다.', 'error');
            return false;
        }

        // 파일 형식 체크
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            window.mypageHelpers.showNotification('PDF, JPG, PNG 파일만 업로드 가능합니다.', 'error');
            return false;
        }

        return true;
    }

    /**
     * 파일 업로드 영역 리셋
     */
    function resetFileUploadArea(inputId) {
        const input = document.getElementById(inputId);
        const dropZone = input.parentElement.querySelector('.file-drop-zone');
        const preview = input.parentElement.querySelector('.file-preview, .file-preview-list');
        
        input.value = '';
        dropZone.classList.remove('hidden');
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
        if (show) {
            loadingState.classList.remove('hidden');
        } else {
            loadingState.classList.add('hidden');
        }
    }

    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', initializePage);
})();