// cert-application.js - 자격증 신청 페이지 JavaScript (결제 통합 버전)
console.log('=== cert-application.js 파일 로드됨 (결제 통합) ===');

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== cert-application.js 초기화 준비, 현재 상태:', document.readyState);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initCertApplicationPage();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initCertApplicationPage();
    }
}

// 초기화 시작
initializeWhenReady();

// 페이지 초기화 함수 (결제 통합)
function initCertApplicationPage() {
    console.log('=== initCertApplicationPage 실행 시작 (결제 통합) ===');
    
    // URL 파라미터 처리 (가장 먼저 실행)
    handleUrlParameters();
    
    // 가격 계산 기능 초기화
    initPriceCalculation();
    
    // 파일 드래그 앤 드롭 초기화
    initFileUploads();
    
    // 폼 유효성 검사 초기화
    initFormValidation();
    
    // 약관 동의 처리
    initAgreementHandling();
    
    // 폼 제출 처리 (결제 통합)
    initFormSubmission();
    
    // 자격증 조회 폼 처리
    initVerifyForm();
    
    // 전화번호 자동 포맷팅
    initPhoneFormatting();
    
    // 날짜 제한 설정
    setDateLimits();
    
    // 결제 관련 기능들
    initPaymentMethods();
    initModalHandling();
    initTossPayments();
    
    console.log('=== initCertApplicationPage 완료 (결제 통합) ===');
}

// URL 파라미터 처리 함수
function handleUrlParameters() {
    console.log('=== URL 파라미터 처리 시작 ===');
    
    const urlParams = new URLSearchParams(window.location.search);
    const certParam = urlParams.get('cert');
    
    console.log('받은 cert 파라미터:', certParam);
    
    if (certParam) {
        const certTypeSelect = document.getElementById('cert-type');
        
        if (certTypeSelect) {
            let optionValue = '';
            let certName = '';
            
            switch (certParam) {
                case 'health':
                    optionValue = 'health';
                    certName = '건강운동처방사';
                    break;
                case 'rehab':
                    optionValue = 'rehab';
                    certName = '운동재활전문가';
                    break;
                case 'pilates':
                    optionValue = 'pilates';
                    certName = '필라테스 전문가';
                    break;
                case 'recreation':
                    optionValue = 'recreation';
                    certName = '레크리에이션지도자';
                    break;
                default:
                    console.warn('알 수 없는 자격증 파라미터:', certParam);
                    return;
            }
            
            // 셀렉트 박스 값 설정
            certTypeSelect.value = optionValue;
            
            // 시각적 피드백
            certTypeSelect.style.backgroundColor = '#dbeafe';
            certTypeSelect.style.transition = 'background-color 0.5s ease';
            
            setTimeout(() => {
                certTypeSelect.style.backgroundColor = '';
            }, 1500);
            
            console.log(`${certName}이(가) 자동으로 선택되었습니다:`, optionValue);
            
            // change 이벤트 발생
            const changeEvent = new Event('change', { bubbles: true });
            certTypeSelect.dispatchEvent(changeEvent);
            
            // 사용자 알림
            setTimeout(() => {
                showNotification(`${certName} 자격증이 자동으로 선택되었습니다.`);
            }, 500);
            
        } else {
            console.error('cert-type 셀렉트 박스를 찾을 수 없습니다');
        }
    } else {
        console.log('cert 파라미터가 없습니다. 기본 상태로 진행합니다.');
    }
    
    console.log('=== URL 파라미터 처리 완료 ===');
}

// 알림 표시 함수
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 가격 계산 기능
function initPriceCalculation() {
    console.log('=== initPriceCalculation 시작 ===');
    
    const certTypeSelect = document.getElementById('cert-type');
    const certOptionSelect = document.getElementById('cert-option');
    const selectedCertName = document.getElementById('selected-cert-name');
    const selectedCertOption = document.getElementById('selected-cert-option');
    const optionPriceSpan = document.getElementById('option-price');
    const totalPriceSpan = document.getElementById('total-price');
    const finalPaymentAmount = document.getElementById('final-payment-amount');
    
    if (!certOptionSelect || !optionPriceSpan || !totalPriceSpan) {
        console.warn('가격 계산 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 자격증 종류 변경 시
    if (certTypeSelect) {
        certTypeSelect.addEventListener('change', function() {
            const certNames = {
                'health': '건강운동처방사',
                'rehab': '운동재활전문가',
                'pilates': '필라테스 전문가',
                'recreation': '레크리에이션지도자'
            };
            
            const selectedName = certNames[this.value] || '자격증을 먼저 선택해주세요';
            if (selectedCertName) selectedCertName.textContent = selectedName;
            
            updateTotalPrice();
        });
    }
    
    // 발급 옵션 변경 시
    certOptionSelect.addEventListener('change', function() {
        const optionNames = {
            'standard': '일반 발급 (2주)',
            'express': '급행 발급 (3일)',
            'eng': '영문 자격증',
            'express-eng': '급행 영문 자격증'
        };
        
        const selectedOption = optionNames[this.value] || '일반 발급';
        if (selectedCertOption) selectedCertOption.textContent = selectedOption;
        
        updateTotalPrice();
    });
    
    function updateTotalPrice() {
        let optionPrice = 0;
        const basePrice = 50000;
        
        switch(certOptionSelect.value) {
            case 'express':
                optionPrice = 20000;
                break;
            case 'eng':
                optionPrice = 30000;
                break;
            case 'express-eng':
                optionPrice = 50000;
                break;
            default:
                optionPrice = 0;
        }
        
        const totalPrice = basePrice + optionPrice;
        
        optionPriceSpan.textContent = formatPrice(optionPrice);
        totalPriceSpan.textContent = formatPrice(totalPrice);
        if (finalPaymentAmount) finalPaymentAmount.textContent = '₩' + totalPrice.toLocaleString();
    }
    
    console.log('=== initPriceCalculation 완료 ===');
}

// 가격 포맷팅 함수
function formatPrice(price) {
    return price.toLocaleString('ko-KR') + '원';
}

// 결제 수단 선택 초기화
function initPaymentMethods() {
    console.log('=== initPaymentMethods 시작 ===');
    
    const paymentMethods = document.querySelectorAll('.payment-method-card');
    const bankDetails = document.getElementById('bank-details');
    
    if (paymentMethods.length === 0) {
        console.log('결제 수단 카드를 찾을 수 없습니다.');
        return;
    }
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // 모든 결제 수단 비활성화
            paymentMethods.forEach(m => m.classList.remove('active'));
            
            // 선택된 결제 수단 활성화
            this.classList.add('active');
            const selectedMethod = this.getAttribute('data-method');
            
            // 라디오 버튼 선택
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
            
            // 무통장 입금 상세 정보 표시/숨김
            if (bankDetails) {
                if (selectedMethod === 'bank') {
                    bankDetails.classList.remove('hidden');
                } else {
                    bankDetails.classList.add('hidden');
                }
            }
            
            // 버튼 텍스트 업데이트
            updatePaymentButtonText(selectedMethod);
        });
    });
    
    console.log('=== initPaymentMethods 완료 ===');
}

// 결제 버튼 텍스트 업데이트
function updatePaymentButtonText(paymentMethod) {
    const submitButton = document.getElementById('apply-button');
    const buttonText = submitButton.querySelector('.button-text');
    const buttonIcon = submitButton.querySelector('.button-icon');
    
    if (buttonText && buttonIcon) {
        if (paymentMethod === 'card') {
            buttonIcon.textContent = '💳';
            buttonText.textContent = '신청 및 카드 결제하기';
        } else if (paymentMethod === 'bank') {
            buttonIcon.textContent = '🏦';
            buttonText.textContent = '신청 및 입금 안내받기';
        }
    }
}

// 파일 드래그 앤 드롭 기능
function initFileUploads() {
    console.log('=== initFileUploads 시작 ===');
    
    const fileDropZones = document.querySelectorAll('.file-drop-zone');
    
    fileDropZones.forEach(zone => {
        const inputId = zone.dataset.input;
        const input = document.getElementById(inputId);
        
        if (!input) return;
        
        // 드래그 오버 이벤트
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        
        // 드래그 리브 이벤트
        zone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            zone.classList.remove('dragover');
        });
        
        // 드롭 이벤트
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            zone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                updateFileDisplay(zone, files[0]);
            }
        });
        
        // 클릭으로 파일 선택
        zone.addEventListener('click', function() {
            input.click();
        });
        
        // 파일 선택 시 처리
        input.addEventListener('change', function() {
            if (this.files.length > 0) {
                updateFileDisplay(zone, this.files[0]);
            }
        });
    });
    
    console.log('=== initFileUploads 완료 ===');
}

// 파일 표시 업데이트
function updateFileDisplay(zone, file) {
    const content = zone.querySelector('.file-drop-content');
    
    // 파일 크기 검사 (5MB 제한)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('파일 크기가 5MB를 초과합니다. 더 작은 파일을 선택해주세요.');
        return;
    }
    
    // 파일 정보 표시
    content.innerHTML = `
        <div class="file-info-display">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto mb-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <p class="font-medium">${file.name}</p>
            <p class="text-sm text-gray-500">${formatFileSize(file.size)}</p>
        </div>
    `;
    
    zone.classList.add('file-uploaded');
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 폼 유효성 검사 초기화
function initFormValidation() {
    console.log('=== initFormValidation 시작 ===');
    const form = document.getElementById('certificate-form');
    if (!form) {
        console.log('certificate-form을 찾을 수 없습니다.');
        return;
    }
    
    const inputs = form.querySelectorAll('input, select, textarea');
    console.log('폼 입력 요소 개수:', inputs.length);

    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateField(this);
        });

        input.addEventListener('input', function () {
            clearFieldError(this);
        });
    });
    
    console.log('=== initFormValidation 완료 ===');
}

// 약관 동의 처리 초기화
function initAgreementHandling() {
    console.log('=== initAgreementHandling 시작 ===');
    const agreeAllCheckbox = document.getElementById('agree-all');
    const agreementCheckboxes = document.querySelectorAll('input[type="checkbox"]:not(#agree-all)');

    if (!agreeAllCheckbox) {
        console.log('agree-all 체크박스를 찾을 수 없습니다.');
        return;
    }

    console.log('약관 체크박스 개수:', agreementCheckboxes.length);

    // 전체 동의 체크박스 처리
    agreeAllCheckbox.addEventListener('change', function () {
        const isChecked = this.checked;
        console.log('전체 동의 상태:', isChecked);

        agreementCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });

    // 개별 체크박스 처리
    agreementCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const requiredCheckboxes = document.querySelectorAll('input[type="checkbox"][required]');
            const allRequiredChecked = Array.from(requiredCheckboxes).every(cb => cb.checked);

            const allCheckboxes = Array.from(agreementCheckboxes);
            const allChecked = allCheckboxes.every(cb => cb.checked);

            agreeAllCheckbox.checked = allChecked;

            if (allChecked) {
                agreeAllCheckbox.indeterminate = false;
            } else if (allRequiredChecked) {
                agreeAllCheckbox.indeterminate = true;
            } else {
                agreeAllCheckbox.indeterminate = false;
            }
        });
    });
    
    console.log('=== initAgreementHandling 완료 ===');
}

// 폼 제출 처리 (결제 통합 버전)
function initFormSubmission() {
    console.log('=== initFormSubmission 시작 (결제 통합) ===');
    const form = document.getElementById('certificate-form');
    const submitButton = document.getElementById('apply-button');

    if (!form || !submitButton) {
        console.log('폼 또는 제출 버튼을 찾을 수 없습니다.');
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('폼 제출 시도 (자격증 신청 + 결제)');

        if (!validateForm()) {
            console.log('폼 검증 실패');
            return;
        }

        console.log('폼 검증 성공, 결제 처리 시작');
        
        // 버튼 상태 변경
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> 처리 중...';

        // 폼 데이터 수집
        const formData = collectFormData();
        console.log('수집된 폼 데이터:', formData);

        // 선택된 결제 방법에 따라 처리
        const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        if (selectedPaymentMethod === 'card') {
            // 토스페이먼트 연동
            processCardPayment(formData);
        } else if (selectedPaymentMethod === 'bank') {
            // 무통장 입금 처리
            processBankTransfer(formData);
        }
    });

    console.log('=== initFormSubmission 완료 ===');
}

// 토스페이먼트 결제 처리
function processCardPayment(formData) {
    console.log('=== 토스페이먼트 결제 처리 시작 ===');
    
    // 토스페이먼트 연동을 위한 결제 정보 준비
    const paymentData = {
        amount: parseInt(document.getElementById('total-price').textContent.replace(/[^\d]/g, '')),
        orderId: 'CERT_' + Date.now(),
        orderName: formData['cert-type'] + ' 자격증 발급',
        customerName: formData['name'],
        customerEmail: formData.email,
        customerMobilePhone: formData.phone,
        successUrl: window.location.origin + window.adjustPath('pages/education/payment-success.html'),
        failUrl: window.location.origin + window.adjustPath('pages/education/payment-fail.html')
    };
    
    console.log('토스페이먼트 결제 데이터:', paymentData);
    
    // 실제 토스페이먼트 연동 시 이 부분을 교체
    // tossPayments.requestPayment('카드', paymentData);
    
    // 현재는 시뮬레이션
    setTimeout(() => {
        // 성공 시뮬레이션 (90% 확률)
        if (Math.random() > 0.1) {
            showPaymentSuccess({
                success: true,
                orderId: paymentData.orderId,
                method: 'card',
                amount: '₩' + paymentData.amount.toLocaleString(),
                customerName: paymentData.customerName
            });
        } else {
            showPaymentError('결제가 취소되거나 실패했습니다.');
        }
        
        // 버튼 복원
        const submitButton = document.getElementById('apply-button');
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="button-icon">💳</span><span class="button-text">신청 및 카드 결제하기</span>';
    }, 2000);
}

// 무통장 입금 처리
function processBankTransfer(formData) {
    console.log('=== 무통장 입금 처리 시작 ===');
    
    // 무통장 입금 신청 처리
    const bankTransferData = {
        orderId: 'CERT_BANK_' + Date.now(),
        method: 'bank',
        amount: document.getElementById('total-price').textContent,
        customerName: formData['name'],
        depositorName: formData['bank-depositor'] || formData['name'],
        certType: formData['cert-type']
    };
    
    console.log('무통장 입금 데이터:', bankTransferData);
    
    // 서버에 무통장 입금 신청 저장 (시뮬레이션)
    setTimeout(() => {
        showBankTransferSuccess(bankTransferData);
        
        // 버튼 복원
        const submitButton = document.getElementById('apply-button');
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="button-icon">🏦</span><span class="button-text">신청 및 입금 안내받기</span>';
    }, 1500);
}

// 카드 결제 성공 처리
function showPaymentSuccess(result) {
    console.log('결제 성공:', result);
    
    // 결제 성공 모달 표시
    const successModal = document.getElementById('payment-success-modal');
    if (!successModal) {
        console.error('payment-success-modal을 찾을 수 없습니다!');
        return;
    }
    
    // 모달 정보 업데이트
    const orderNumber = document.getElementById('order-number');
    const paymentMethodDisplay = document.getElementById('payment-method-display');
    const paidAmount = document.getElementById('paid-amount');
    
    if (orderNumber) orderNumber.textContent = result.orderId;
    if (paymentMethodDisplay) paymentMethodDisplay.textContent = '신용카드';
    if (paidAmount) paidAmount.textContent = result.amount;
    
    // 모달 표시
    successModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // 결제 정보 저장
    savePaymentInfo(result);
}

// 무통장 입금 성공 처리
function showBankTransferSuccess(result) {
    console.log('무통장 입금 신청 성공:', result);
    
    // 성공 모달 표시
    const successModal = document.getElementById('payment-success-modal');
    if (!successModal) {
        console.error('payment-success-modal을 찾을 수 없습니다!');
        return;
    }
    
    // 모달 내용을 무통장 입금용으로 수정
    const modalTitle = successModal.querySelector('.modal-title');
    const successMessage = successModal.querySelector('.success-message h4');
    const successDescription = successModal.querySelector('.success-message p');
    
    if (modalTitle) modalTitle.innerHTML = '<span class="success-icon">🏦</span> 입금 안내';
    if (successMessage) successMessage.textContent = '무통장 입금 신청이 완료되었습니다!';
    if (successDescription) {
        successDescription.innerHTML = '입금 계좌 정보를 확인하시고 입금해주세요.<br>입금 확인 후 자격증 발급이 진행됩니다.';
    }
    
    // 결제 정보 업데이트
    const orderNumber = document.getElementById('order-number');
    const paymentMethodDisplay = document.getElementById('payment-method-display');
    const paidAmount = document.getElementById('paid-amount');
    
    if (orderNumber) orderNumber.textContent = result.orderId;
    if (paymentMethodDisplay) paymentMethodDisplay.textContent = '무통장 입금';
    if (paidAmount) paidAmount.textContent = result.amount;
    
    // 모달 표시
    successModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // 입금 정보 저장
    savePaymentInfo(result);
}

// 결제 실패 처리
function showPaymentError(message) {
    alert('결제 실패: ' + message);
    console.error('결제 실패:', message);
}

// 결제 정보 저장
function savePaymentInfo(paymentResult) {
    console.log('결제 정보 저장:', paymentResult);
    
    // 실제 구현 시 Firebase Firestore에 저장
    const paymentData = {
        ...paymentResult,
        timestamp: new Date().toISOString(),
        status: paymentResult.method === 'card' ? 'completed' : 'pending',
        customer: {
            name: document.getElementById('name')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || ''
        },
        certificate: {
            type: document.getElementById('cert-type')?.value || '',
            option: document.getElementById('cert-option')?.value || '',
            amount: document.getElementById('total-price')?.textContent || ''
        }
    };
    
    // 로컬 스토리지에 임시 저장 (개발용)
    const existingPayments = JSON.parse(localStorage.getItem('cert_payments') || '[]');
    existingPayments.push(paymentData);
    localStorage.setItem('cert_payments', JSON.stringify(existingPayments));
    
    console.log('결제 정보 저장 완료');
}

// 모달 처리 초기화
function initModalHandling() {
    console.log('=== initModalHandling 시작 ===');
    
    const modalCloses = document.querySelectorAll('[data-dismiss="modal"]');
    
    // 모달 닫기 버튼
    modalCloses.forEach(close => {
        close.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // 모달 배경 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal:not(.hidden)');
            if (openModal) {
                openModal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        }
    });
    
    console.log('=== initModalHandling 완료 ===');
}

// 토스페이먼트 초기화 (실제 연동 시 사용)
function initTossPayments() {
    console.log('=== initTossPayments 준비 ===');
    
    // 실제 토스페이먼트 연동 시 이 부분 활성화
    /*
    // 토스페이먼트 클라이언트 키 (실제 키로 교체 필요)
    const clientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
    
    // 토스페이먼트 SDK 로드
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.onload = function() {
        window.tossPayments = TossPayments(clientKey);
        console.log('토스페이먼트 SDK 로드 완료');
    };
    document.head.appendChild(script);
    */
    
    console.log('토스페이먼트 연동 준비 완료 (현재는 시뮬레이션 모드)');
}

// 폼 데이터 수집
function collectFormData() {
    const form = document.getElementById('certificate-form');
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // 결제 방법 정보 추가
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
    data.paymentMethod = selectedPaymentMethod ? selectedPaymentMethod.value : '';

    return data;
}

// 폼 유효성 검사
function validateForm() {
    console.log('=== validateForm 시작 (자격증 + 결제) ===');
    let isValid = true;

    // 필수 입력 필드 확인
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    console.log('필수 필드 개수:', requiredFields.length);
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    // 결제 방법 선택 확인
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
    if (!selectedPaymentMethod) {
        alert('결제 방법을 선택해주세요.');
        isValid = false;
    }

    // 무통장 입금 시 추가 검증
    if (selectedPaymentMethod && selectedPaymentMethod.value === 'bank') {
        const depositorInput = document.getElementById('bank-depositor');
        const depositorName = depositorInput?.value.trim();
        
        if (depositorName && depositorName.length < 2) {
            showFieldError(depositorInput, '입금자명은 2자 이상 입력해주세요.');
            isValid = false;
        }
    }

    // 필수 약관 동의 확인
    const requiredCheckboxes = document.querySelectorAll('input[type="checkbox"][required]');
    console.log('필수 약관 개수:', requiredCheckboxes.length);
    
    requiredCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            showFieldError(checkbox, '필수 약관에 동의해주세요.');
            isValid = false;
        }
    });

    // 첫 번째 에러로 스크롤
    if (!isValid) {
        const firstError = document.querySelector('.field-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    console.log('폼 검증 결과 (자격증 + 결제):', isValid);
    return isValid;
}

// 개별 필드 유효성 검사
function validateField(field) {
    if (!field) return false;
    
    const value = field.value.trim();

    // 필수 필드 확인
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, '필수 입력 항목입니다.');
        return false;
    }

    // 이름 검증
    if (field.id === 'name') {
        if (value.length < 2) {
            showFieldError(field, '이름은 2자 이상 입력해주세요.');
            return false;
        }
        if (!/^[가-힣a-zA-Z\s]+$/.test(value)) {
            showFieldError(field, '이름은 한글 또는 영문만 입력 가능합니다.');
            return false;
        }
    }

    // 전화번호 검증
    if (field.type === 'tel') {
        const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
        if (value && !phoneRegex.test(value)) {
            showFieldError(field, '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
            return false;
        }
    }

    // 이메일 검증
    if (field.type === 'email') {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (value && !emailRegex.test(value)) {
            showFieldError(field, '올바른 이메일 형식을 입력해주세요. (예: example@email.com)');
            return false;
        }
    }

    // 파일 검증
    if (field.type === 'file') {
        if (field.hasAttribute('required') && !field.files.length) {
            showFieldError(field, '필수 파일을 업로드해주세요.');
            return false;
        }
    }

    clearFieldError(field);
    return true;
}

// 필드 에러 표시/제거
function showFieldError(field, message) {
    if (!field) return;
    
    clearFieldError(field);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-red-500 text-sm mt-1';
    errorDiv.textContent = message;

    field.classList.add('error');
    
    // 파일 입력 필드의 경우 부모 컨테이너에 에러 표시
    if (field.type === 'file') {
        const dropZone = field.closest('.file-drop-zone');
        if (dropZone) {
            dropZone.parentNode.appendChild(errorDiv);
        }
    } else {
        field.parentNode.appendChild(errorDiv);
    }
}

function clearFieldError(field) {
    if (!field) return;
    
    field.classList.remove('error');
    
    // 일반 필드 에러 제거
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // 파일 입력 필드 에러 제거
    if (field.type === 'file') {
        const dropZone = field.closest('.file-drop-zone');
        if (dropZone) {
            const error = dropZone.parentNode.querySelector('.field-error');
            if (error) {
                error.remove();
            }
        }
    }
}

// 자격증 조회 폼 처리
function initVerifyForm() {
    console.log('=== initVerifyForm 시작 ===');
    const verifyForm = document.getElementById('verify-form');
    
    if (!verifyForm) {
        console.log('verify-form을 찾을 수 없습니다.');
        return;
    }
    
    verifyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const certNumber = document.getElementById('cert-number').value;
        const certDate = document.getElementById('cert-date').value;
        
        if (certNumber && certDate) {
            // 실제 구현 시에는 서버로 데이터 전송 후 결과 처리
            alert('입력하신 정보로 자격증 확인 중입니다.');
            
            // 로딩 상태 표시
            const button = verifyForm.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = '조회 중...';
            
            // 가상의 조회 결과 (실제 구현 시 서버 응답 처리)
            setTimeout(() => {
                button.disabled = false;
                button.textContent = '조회하기';
                
                // 예시 결과 표시
                showVerificationResult({
                    number: certNumber,
                    date: certDate,
                    holder: '홍길동',
                    type: '건강운동처방사',
                    status: '유효'
                });
            }, 2000);
        }
    });
    
    console.log('=== initVerifyForm 완료 ===');
}

// 자격증 조회 결과 표시
function showVerificationResult(result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'verification-result mt-6 p-4 bg-green-50 border border-green-200 rounded-md';
    resultDiv.innerHTML = `
        <h3 class="text-lg font-bold text-green-800 mb-2">조회 결과</h3>
        <div class="space-y-1">
            <p><span class="font-medium">자격증 번호:</span> ${result.number}</p>
            <p><span class="font-medium">소지자:</span> ${result.holder}</p>
            <p><span class="font-medium">자격증 종류:</span> ${result.type}</p>
            <p><span class="font-medium">발급일:</span> ${result.date}</p>
            <p><span class="font-medium">상태:</span> <span class="text-green-600 font-bold">${result.status}</span></p>
        </div>
    `;
    
    // 기존 결과 제거
    const existingResult = document.querySelector('.verification-result');
    if (existingResult) {
        existingResult.remove();
    }
    
    // 새 결과 추가
    document.getElementById('verify-form').after(resultDiv);
}

// 전화번호 자동 포맷팅
function initPhoneFormatting() {
    console.log('=== initPhoneFormatting 시작 ===');
    const phoneInput = document.getElementById('phone');
    
    if (!phoneInput) {
        console.log('phone 입력 필드를 찾을 수 없습니다.');
        return;
    }

    phoneInput.addEventListener('input', function () {
        let value = this.value.replace(/[^0-9]/g, '');

        if (value.length >= 7) {
            if (value.length <= 10) {
                value = value.replace(/(\d{3})(\d{3,4})(\d{0,4})/, '$1-$2-$3');
            } else {
                value = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3');
            }
        }

        this.value = value;
    });
    
    console.log('=== initPhoneFormatting 완료 ===');
}

// 날짜 제한 설정
function setDateLimits() {
    console.log('=== setDateLimits 시작 ===');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 교육 수료일과 시험 합격일은 오늘 이전만 선택 가능
    const completionDate = document.getElementById('course-completion');
    const examDate = document.getElementById('exam-pass');
    
    if (completionDate) {
        completionDate.max = todayStr;
    }
    
    if (examDate) {
        examDate.max = todayStr;
    }
    
    // 생년월일은 18세 이상만 선택 가능
    const birthInput = document.getElementById('birth');
    if (birthInput) {
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
        
        birthInput.max = maxDate.toISOString().split('T')[0];
        birthInput.min = minDate.toISOString().split('T')[0];
    }
    
    console.log('=== setDateLimits 완료 ===');
}

// =================================
// 디버깅 및 개발자 도구 (Firebase 호스팅 지원)
// =================================

// 개발 모드에서 사용되는 디버깅 함수들 (Firebase 호스팅 포함)
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('.web.app') || 
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {
    
    window.debugCertApplication = {
        // 기본 디버깅 함수들
        logFormData: function() {
            console.log('현재 폼 데이터:', collectFormData());
        },
        
        checkValidation: function() {
            const form = document.getElementById('certificate-form');
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            
            inputs.forEach(input => {
                console.log(`${input.name || input.id}: ${validateField(input) ? '✓' : '✗'}`);
            });
        },
        
        fillTestData: function() {
            const certType = document.getElementById('cert-type');
            const name = document.getElementById('name');
            const birth = document.getElementById('birth');
            const phone = document.getElementById('phone');
            const email = document.getElementById('email');
            const address = document.getElementById('address');
            const courseCompletion = document.getElementById('course-completion');
            const examPass = document.getElementById('exam-pass');
            
            if (certType) certType.value = 'health';
            if (name) name.value = '홍길동';
            if (birth) birth.value = '1990-01-01';
            if (phone) phone.value = '010-1234-5678';
            if (email) email.value = 'test@example.com';
            if (address) address.value = '서울특별시 강남구 테헤란로 123';
            if (courseCompletion) courseCompletion.value = '2024-12-15';
            if (examPass) examPass.value = '2025-01-15';
            
            // 필수 약관 체크
            const agreeTerms = document.getElementById('agree-terms');
            const agreeRefund = document.getElementById('agree-refund');
            
            if (agreeTerms) agreeTerms.checked = true;
            if (agreeRefund) agreeRefund.checked = true;
            
            // 자격증 종류 변경 이벤트 트리거
            if (certType) {
                const changeEvent = new Event('change');
                certType.dispatchEvent(changeEvent);
            }
            
            console.log('테스트 데이터 입력 완료');
        },
        
        // 결제 관련 테스트 함수들
        testCardPayment: function() {
            this.fillTestData();
            const methodCard = document.getElementById('method-card');
            const cardPaymentMethod = document.querySelector('[data-method="card"]');
            
            if (methodCard) methodCard.checked = true;
            if (cardPaymentMethod) cardPaymentMethod.click();
            
            console.log('카드 결제 테스트 준비 완료');
        },
        
        testBankTransfer: function() {
            this.fillTestData();
            const methodBank = document.getElementById('method-bank');
            const bankPaymentMethod = document.querySelector('[data-method="bank"]');
            const bankDepositor = document.getElementById('bank-depositor');
            
            if (methodBank) methodBank.checked = true;
            if (bankPaymentMethod) bankPaymentMethod.click();
            if (bankDepositor) bankDepositor.value = '김입금';
            
            console.log('무통장 입금 테스트 준비 완료');
        },
        
        simulatePaymentSuccess: function() {
            showPaymentSuccess({
                success: true,
                orderId: 'TEST_CERT_' + Date.now(),
                method: 'card',
                amount: '₩50,000',
                customerName: '테스트 사용자'
            });
        },
        
        simulateBankTransferSuccess: function() {
            showBankTransferSuccess({
                orderId: 'TEST_CERT_BANK_' + Date.now(),
                method: 'bank',
                amount: '₩50,000',
                customerName: '테스트 사용자'
            });
        },
        
        // 모달 테스트
        showModal: function() {
            const modal = document.getElementById('payment-success-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                console.log('모달 표시됨');
            }
        },
        
        hideModal: function() {
            const modal = document.getElementById('payment-success-modal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
                console.log('모달 숨겨짐');
            }
        },
        
        // 가격 계산 테스트
        testPriceCalculation: function() {
            const certOption = document.getElementById('cert-option');
            if (certOption) {
                console.log('가격 계산 테스트:');
                ['standard', 'express', 'eng', 'express-eng'].forEach(option => {
                    certOption.value = option;
                    const changeEvent = new Event('change');
                    certOption.dispatchEvent(changeEvent);
                    console.log(`- ${option}: ${document.getElementById('total-price').textContent}`);
                });
            }
        },
        
        // 파일 업로드 시뮬레이션
        simulateFileUpload: function() {
            console.log('파일 업로드 시뮬레이션 - 실제 파일을 선택해서 테스트하세요.');
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => {
                console.log(`- ${input.id}: ${input.required ? '필수' : '선택'}`);
            });
        }
    };
    
    console.log('개발 모드 디버깅 도구 활성화됨 (자격증 신청 + 결제 기능)');
    console.log('현재 호스트:', window.location.hostname);
    console.log('사용 가능한 함수들:');
    console.log('- window.debugCertApplication.fillTestData()');
    console.log('- window.debugCertApplication.testCardPayment()');
    console.log('- window.debugCertApplication.testBankTransfer()');
    console.log('- window.debugCertApplication.simulatePaymentSuccess()');
    console.log('- window.debugCertApplication.simulateBankTransferSuccess()');
    console.log('- window.debugCertApplication.testPriceCalculation()');
    console.log('- window.debugCertApplication.showModal()');
    console.log('- window.debugCertApplication.hideModal()');
} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
    console.log('현재 호스트:', window.location.hostname);
}

// =================================
// 페이지 이탈 방지 및 키보드 네비게이션
// =================================

// 키보드 네비게이션 지원
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) {
            openModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }
});

// 페이지 이탈 시 확인 (폼이 수정되었을 때만)
window.addEventListener('beforeunload', function(e) {
    const form = document.getElementById('certificate-form');
    if (form && form.modified) {
        e.preventDefault();
        e.returnValue = '작성 중인 내용이 있습니다. 정말 페이지를 떠나시겠습니까?';
    }
});

// 폼 수정 감지
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('certificate-form');
    if (form) {
        form.addEventListener('input', function() {
            this.modified = true;
        });
        
        form.addEventListener('change', function() {
            this.modified = true;
        });
        
        // 폼 제출 시 수정 플래그 제거
        form.addEventListener('submit', function() {
            this.modified = false;
        });
    }
});

// 로딩 애니메이션 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .field-error {
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }
    
    .form-input.error,
    .form-select.error,
    .form-textarea.error {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }
    
    .file-drop-zone.error {
        border-color: #dc2626;
        background-color: rgba(220, 38, 38, 0.05);
    }
    
    .file-uploaded {
        border-color: #16a34a;
        background-color: rgba(22, 163, 74, 0.05);
    }
    
    .file-info-display {
        text-align: center;
        padding: 1rem;
    }
    
    .file-drop-zone.dragover {
        border-color: #3b82f6;
        background-color: rgba(59, 130, 246, 0.05);
    }
    
    .payment-method-card {
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .payment-method-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .payment-method-card.active {
        border-color: #3b82f6;
        background-color: rgba(59, 130, 246, 0.05);
    }
`;
document.head.appendChild(style);

// 에러 처리
window.addEventListener('error', function(e) {
    console.error('cert-application.js error:', e);
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', function() {
    console.log('cert-application.js 정리 중...');
});

console.log('=== cert-application.js 로드 완료 (결제 통합, Firebase 호스팅 지원) ===');