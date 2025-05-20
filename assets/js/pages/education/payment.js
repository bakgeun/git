// payment.js - 결제 페이지 전용 JavaScript
console.log('=== payment.js 파일 로드됨 ===');

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        // DOM이 아직 로딩 중이면 이벤트 리스너 등록
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initPaymentPage();
        });
    } else {
        // DOM이 이미 로드된 경우 즉시 실행
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initPaymentPage();
    }
}

// 초기화 시작
initializeWhenReady();

// 페이지 초기화 함수
function initPaymentPage() {
    console.log('=== initPaymentPage 실행 시작 ===');

    // 결제 수단 선택 초기화
    initPaymentMethods();

    // 카드 번호 자동 포맷팅
    initCardFormatting();

    // 카드 유효 기간 자동 포맷팅
    initExpiryFormatting();

    // 약관 동의 처리
    initAgreementHandling();

    // 모달 처리
    initModalHandling();

    // 결제 폼 제출 처리
    initPaymentFormSubmission();

    // URL 파라미터에서 결제 정보 가져오기
    loadPaymentInfoFromURL();

    // 카드 입력 시 카드 브랜드 감지
    initCardBrandDetection();

    console.log('=== initPaymentPage 완료 ===');
}

// 결제 수단 선택 초기화
function initPaymentMethods() {
    console.log('=== initPaymentMethods 시작 ===');
    
    const paymentMethods = document.querySelectorAll('.payment-method');
    const paymentDetails = document.querySelectorAll('.payment-details');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // 모든 결제 수단 비활성화
            paymentMethods.forEach(m => m.classList.remove('active'));
            paymentDetails.forEach(detail => detail.classList.add('hidden'));
            
            // 선택된 결제 수단 활성화
            this.classList.add('active');
            const selectedMethod = this.getAttribute('data-method');
            const selectedDetail = document.getElementById(selectedMethod + '-details');
            
            if (selectedDetail) {
                selectedDetail.classList.remove('hidden');
            }
            
            // 라디오 버튼 선택
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
        });
    });
}

// 카드 번호 자동 포맷팅
function initCardFormatting() {
    const cardNumberInput = document.getElementById('card-number');
    
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})/g, '$1-');
            value = value.replace(/\-$/, '');
            this.value = value;
            
            // 카드 브랜드 감지
            detectCardBrand(value);
        });
    }
}

// 카드 유효 기간 자동 포맷팅
function initExpiryFormatting() {
    const expiryInput = document.getElementById('card-expiry');
    
    if (expiryInput) {
        expiryInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            this.value = value;
        });
    }
}

// 카드 브랜드 감지
function initCardBrandDetection() {
    const cardNumberInput = document.getElementById('card-number');
    
    if (cardNumberInput) {
        // 카드 브랜드 표시 영역 생성
        const brandIndicator = document.createElement('div');
        brandIndicator.className = 'card-brand-indicator';
        cardNumberInput.parentNode.appendChild(brandIndicator);
    }
}

// 카드 브랜드 감지 함수
function detectCardBrand(cardNumber) {
    const brandIndicator = document.querySelector('.card-brand-indicator');
    if (!brandIndicator) return;
    
    // 카드 번호에서 하이픈 제거
    const cleanNumber = cardNumber.replace(/\-/g, '');
    
    let brand = '';
    let brandClass = '';
    
    if (cleanNumber.match(/^4/)) {
        brand = 'VISA';
        brandClass = 'visa';
    } else if (cleanNumber.match(/^5[1-5]/)) {
        brand = 'MasterCard';
        brandClass = 'mastercard';
    } else if (cleanNumber.match(/^3[47]/)) {
        brand = 'AMEX';
        brandClass = 'amex';
    } else if (cleanNumber.match(/^3[0-6]/)) {
        brand = 'Diners';
        brandClass = 'diners';
    } else if (cleanNumber.match(/^6[0-5]/)) {
        brand = 'Discover';
        brandClass = 'discover';
    }
    
    brandIndicator.innerHTML = brand ? `<span class="card-brand ${brandClass}">${brand}</span>` : '';
}

// 약관 동의 처리 초기화
function initAgreementHandling() {
    const agreeAllCheckbox = document.getElementById('agree-all');
    const agreementCheckboxes = document.querySelectorAll('input[type="checkbox"]:not(#agree-all)');
    
    // 전체 동의 체크박스 처리
    agreeAllCheckbox.addEventListener('change', function() {
        const isChecked = this.checked;
        agreementCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });
    
    // 개별 체크박스 처리
    agreementCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // 모든 개별 약관이 체크되었는지 확인
            const allChecked = Array.from(agreementCheckboxes).every(cb => cb.checked);
            agreeAllCheckbox.checked = allChecked;
        });
    });
}

// 모달 처리 초기화
function initModalHandling() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modalCloses = document.querySelectorAll('[data-dismiss="modal"]');
    
    // 모달 열기
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // 모달 닫기
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
}

// 결제 폼 제출 처리
function initPaymentFormSubmission() {
    const paymentForm = document.getElementById('payment-form');
    const submitButton = document.getElementById('submit-payment');
    
    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 유효성 검사
        if (!validatePaymentForm()) {
            return;
        }
        
        // 로딩 상태 표시
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> 결제 처리 중...';
        
        // 선택된 결제 수단 확인
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        // 결제 처리 (실제 구현 시 PG사 연동)
        processPayment(selectedMethod).then(result => {
            if (result.success) {
                showPaymentSuccess(result);
            } else {
                showPaymentError(result.message);
            }
        }).catch(error => {
            console.error('결제 처리 중 오류:', error);
            showPaymentError('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        }).finally(() => {
            // 로딩 상태 해제
            submitButton.disabled = false;
            submitButton.innerHTML = '결제하기';
        });
    });
}

// 결제 폼 유효성 검사
function validatePaymentForm() {
    const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    // 필수 약관 동의 확인
    const requiredAgreements = document.querySelectorAll('input[type="checkbox"][required]');
    for (let agreement of requiredAgreements) {
        if (!agreement.checked) {
            alert('필수 약관에 동의해주세요.');
            agreement.focus();
            return false;
        }
    }
    
    // 결제 수단별 유효성 검사
    if (selectedMethod === 'card') {
        return validateCardPayment();
    } else if (selectedMethod === 'bank') {
        return validateBankPayment();
    } else if (selectedMethod === 'virtual') {
        return validateVirtualPayment();
    }
    
    return true;
}

// 카드 결제 유효성 검사
function validateCardPayment() {
    const cardNumber = document.getElementById('card-number').value.replace(/\-/g, '');
    const cardExpiry = document.getElementById('card-expiry').value;
    const cardName = document.getElementById('card-name').value;
    const cardCvc = document.getElementById('card-cvc').value;
    
    if (!cardNumber || cardNumber.length < 16) {
        alert('카드 번호를 정확히 입력해주세요.');
        return false;
    }
    
    if (!cardExpiry || !cardExpiry.includes('/')) {
        alert('카드 유효 기간을 정확히 입력해주세요.');
        return false;
    }
    
    if (!cardName) {
        alert('카드 소유자 이름을 입력해주세요.');
        return false;
    }
    
    if (!cardCvc || cardCvc.length < 3) {
        alert('CVC 번호를 정확히 입력해주세요.');
        return false;
    }
    
    return true;
}

// 무통장 입금 유효성 검사
function validateBankPayment() {
    const depositor = document.getElementById('bank-depositor').value;
    // 입금자명은 선택사항이므로 별도 검증 없음
    return true;
}

// 가상계좌 유효성 검사
function validateVirtualPayment() {
    const virtualBank = document.getElementById('virtual-bank').value;
    const virtualHolder = document.getElementById('virtual-holder').value;
    
    if (!virtualBank) {
        alert('은행을 선택해주세요.');
        return false;
    }
    
    if (!virtualHolder) {
        alert('예금주명을 입력해주세요.');
        return false;
    }
    
    return true;
}

// 결제 처리 함수 (실제 구현 시 PG사 연동)
function processPayment(method) {
    return new Promise((resolve, reject) => {
        // 시뮬레이션용 지연
        setTimeout(() => {
            // 무작위 성공/실패 시뮬레이션 (실제로는 PG사 응답)
            if (Math.random() > 0.1) { // 90% 성공률
                resolve({
                    success: true,
                    orderId: 'ORD' + Date.now(),
                    method: method,
                    amount: document.getElementById('total-price').textContent
                });
            } else {
                reject(new Error('결제 실패'));
            }
        }, 2000);
    });
}

// 결제 성공 처리
function showPaymentSuccess(result) {
    // 결제 성공 모달 표시
    const successModal = document.getElementById('payment-success-modal');
    
    // 모달 정보 업데이트
    document.getElementById('order-number').textContent = result.orderId;
    document.getElementById('payment-method-display').textContent = getPaymentMethodName(result.method);
    document.getElementById('paid-amount').textContent = result.amount;
    
    // 모달 표시
    successModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // 결제 정보 저장 (실제 구현 시 Firebase 등에 저장)
    savePaymentInfo(result);
}

// 결제 오류 처리
function showPaymentError(message) {
    alert('결제 실패: ' + message);
}

// 결제 수단 이름 반환
function getPaymentMethodName(method) {
    const methodNames = {
        'card': '신용카드',
        'bank': '무통장 입금',
        'virtual': '가상계좌'
    };
    return methodNames[method] || method;
}

// URL 파라미터에서 결제 정보 로드
function loadPaymentInfoFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 결제 정보 업데이트
    const productName = urlParams.get('product');
    const customerName = urlParams.get('name');
    const customerEmail = urlParams.get('email');
    const customerPhone = urlParams.get('phone');
    const totalPrice = urlParams.get('price');
    
    if (productName) document.getElementById('product-name').textContent = productName;
    if (customerName) document.getElementById('customer-name').textContent = customerName;
    if (customerEmail) document.getElementById('customer-email').textContent = customerEmail;
    if (customerPhone) document.getElementById('customer-phone').textContent = customerPhone;
    if (totalPrice) document.getElementById('total-price').textContent = totalPrice;
}

// 결제 정보 저장
function savePaymentInfo(paymentResult) {
    // 실제 구현 시 Firebase Firestore에 저장
    console.log('결제 정보 저장:', paymentResult);
    
    // 로컬 스토리지에 임시 저장
    const paymentData = {
        ...paymentResult,
        timestamp: new Date().toISOString(),
        customer: {
            name: document.getElementById('customer-name').textContent,
            email: document.getElementById('customer-email').textContent,
            phone: document.getElementById('customer-phone').textContent
        },
        product: document.getElementById('product-name').textContent
    };
    
    const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    existingPayments.push(paymentData);
    localStorage.setItem('payments', JSON.stringify(existingPayments));
}

// 로딩 스피너 CSS 추가
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .payment-method.active {
        border-color: #3b82f6;
        background-color: #eff6ff;
    }
    
    .card-brand-indicator {
        margin-top: 0.5rem;
        text-align: right;
    }
    
    .card-brand {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: bold;
        color: white;
    }
    
    .card-brand.visa {
        background-color: #1a1f71;
    }
    
    .card-brand.mastercard {
        background-color: #eb001b;
    }
    
    .card-brand.amex {
        background-color: #006fcf;
    }
    
    .card-brand.diners {
        background-color: #004b5c;
    }
    
    .card-brand.discover {
        background-color: #ff6000;
    }
    
    .payment-details {
        transition: all 0.3s ease;
    }
    
    .payment-method {
        transition: all 0.3s ease;
    }
    
    .modal {
        backdrop-filter: blur(2px);
    }
    
    .modal-dialog {
        animation: modalFadeIn 0.3s ease;
    }
    
    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .form-control:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .payment-method:hover {
        border-color: #93c5fd;
        background-color: #f3f4f6;
    }
`;
document.head.appendChild(style);

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

// 페이지 이탈 시 확인
window.addEventListener('beforeunload', function(e) {
    const form = document.getElementById('payment-form');
    if (form.modified) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// 폼 수정 감지
document.getElementById('payment-form').addEventListener('input', function() {
    this.modified = true;
});

console.log('=== payment.js 로드 완료 ===');