// cert-application.js - 자격증 신청 페이지 JavaScript (영문명 처리 + 사진 업로드)
console.log('=== cert-application.js 파일 로드됨 (영문명 처리 + 사진 업로드 기능 추가) ===');

// 전역 변수 - 업로드된 사진 정보 저장
let uploadedPhotoData = null;

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

// 페이지 초기화 함수 (영문명 처리 + 사진 업로드)
function initCertApplicationPage() {
    console.log('=== initCertApplicationPage 실행 시작 (영문명 처리 + 사진 업로드 추가) ===');
    
    // URL 파라미터 처리 (가장 먼저 실행)
    handleUrlParameters();
    
    // 🔧 MODIFIED: 가격 계산 기능 초기화 (발급옵션 제거)
    initSimplePriceCalculation();
    
    // 🔧 NEW: 사진 업로드 기능 초기화 (기존 파일 드래그앤드롭 대체)
    initPhotoUpload();
    
    // 🔧 MODIFIED: 폼 유효성 검사 초기화 (영문명 검증 추가)
    initFormValidationWithEnglishName();
    
    // 약관 동의 처리
    initAgreementHandling();
    
    // 🔧 MODIFIED: 폼 제출 처리 (영문명 + 사진 업로드 포함)
    initFormSubmissionWithEnglishNameAndPhoto();
    
    // 자격증 조회 폼 처리
    initVerifyForm();
    
    // 🔧 MODIFIED: 전화번호 자동 포맷팅 + 영문명 실시간 검증
    initPhoneFormatting();
    initEnglishNameValidation();
    
    // 날짜 제한 설정
    setDateLimits();
    
    // 결제 관련 기능들
    initPaymentMethods();
    initModalHandling();
    initTossPayments();
    
    console.log('=== initCertApplicationPage 완료 (영문명 처리 + 사진 업로드 추가) ===');
}

// 🔧 NEW: 영문명 실시간 검증 초기화
function initEnglishNameValidation() {
    console.log('=== initEnglishNameValidation 시작 ===');
    
    const englishNameInput = document.getElementById('name-english');
    
    if (!englishNameInput) {
        console.warn('영문명 입력 필드를 찾을 수 없습니다.');
        return;
    }
    
    // 실시간 검증 및 포맷팅
    englishNameInput.addEventListener('input', function() {
        let value = this.value;
        
        // 영문, 공백, 점(.)만 허용하고 나머지 문자 제거
        value = value.replace(/[^a-zA-Z\s.]/g, '');
        
        // 연속된 공백을 하나로 변경
        value = value.replace(/\s+/g, ' ');
        
        // 앞뒤 공백 제거 (입력 중에는 뒤쪽 공백만)
        value = value.replace(/^\s+/, '');
        
        this.value = value;
        
        // 실시간 검증
        if (value.length > 0) {
            validateEnglishName(value, this);
        } else {
            clearFieldError(this);
        }
    });
    
    // 포커스 아웃 시 최종 검증
    englishNameInput.addEventListener('blur', function() {
        const value = this.value.trim();
        this.value = value; // 앞뒤 공백 완전 제거
        
        if (value.length > 0) {
            validateEnglishName(value, this);
        }
    });
    
    console.log('=== initEnglishNameValidation 완료 ===');
}

// 🔧 NEW: 영문명 검증 함수
function validateEnglishName(name, inputElement) {
    // 최소 길이 검사 (2자 이상)
    if (name.length < 2) {
        showFieldError(inputElement, '영문명은 최소 2자 이상 입력해주세요.');
        return false;
    }
    
    // 최대 길이 검사 (50자 이하)
    if (name.length > 50) {
        showFieldError(inputElement, '영문명은 50자 이하로 입력해주세요.');
        return false;
    }
    
    // 영문, 공백, 점만 허용
    const englishNameRegex = /^[a-zA-Z\s.]+$/;
    if (!englishNameRegex.test(name)) {
        showFieldError(inputElement, '영문명은 영문자, 공백, 점(.)만 입력 가능합니다.');
        return false;
    }
    
    // 최소한 하나의 문자 포함
    const hasLetter = /[a-zA-Z]/.test(name);
    if (!hasLetter) {
        showFieldError(inputElement, '영문명에는 최소 하나의 영문자가 포함되어야 합니다.');
        return false;
    }
    
    // 연속된 공백 검사
    const hasConsecutiveSpaces = /\s{2,}/.test(name);
    if (hasConsecutiveSpaces) {
        showFieldError(inputElement, '연속된 공백은 사용할 수 없습니다.');
        return false;
    }
    
    // 시작이나 끝이 공백인지 검사
    if (name.startsWith(' ') || name.endsWith(' ')) {
        showFieldError(inputElement, '영문명의 앞뒤에 공백을 사용할 수 없습니다.');
        return false;
    }
    
    // 일반적인 영문명 패턴 검사 (성+이름 구조 권장)
    const nameParts = name.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length < 2) {
        showFieldError(inputElement, '성과 이름을 모두 입력해주세요 (예: Hong Gil Dong).');
        return false;
    }
    
    // 각 부분이 최소 1자 이상인지 검사
    for (let part of nameParts) {
        if (part.length < 1) {
            showFieldError(inputElement, '성과 이름은 각각 최소 1자 이상이어야 합니다.');
            return false;
        }
    }
    
    clearFieldError(inputElement);
    return true;
}

// 🔧 NEW: 사진 업로드 기능 초기화
function initPhotoUpload() {
    console.log('=== initPhotoUpload 시작 ===');
    
    const photoInput = document.getElementById('photo');
    const photoDropZone = document.querySelector('[data-input="photo"]');
    
    if (!photoInput || !photoDropZone) {
        console.warn('사진 업로드 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 드래그 이벤트 처리
    photoDropZone.addEventListener('dragover', handleDragOver);
    photoDropZone.addEventListener('dragleave', handleDragLeave);
    photoDropZone.addEventListener('drop', handlePhotoDrop);
    
    // 클릭으로 파일 선택
    photoDropZone.addEventListener('click', function() {
        photoInput.click();
    });
    
    // 파일 입력 변경 이벤트
    photoInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handlePhotoSelection(this.files[0]);
        }
    });
    
    console.log('=== initPhotoUpload 완료 ===');
}

// 드래그 오버 처리
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

// 드래그 리브 처리
function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

// 파일 드롭 처리
function handlePhotoDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handlePhotoSelection(files[0]);
    }
}

// 🔧 NEW: 사진 선택 및 검증 처리
function handlePhotoSelection(file) {
    console.log('선택된 파일:', file);
    
    // 파일 유효성 검사
    const validationResult = validatePhotoFile(file);
    if (!validationResult.isValid) {
        showPhotoError(validationResult.message);
        return;
    }
    
    // 미리보기 표시
    showPhotoPreview(file);
    
    // 파일을 전역 변수에 임시 저장 (실제 업로드는 폼 제출 시)
    uploadedPhotoData = {
        file: file,
        isUploaded: false,
        url: null
    };
    
    console.log('사진 선택 완료, 임시 저장됨');
}

// 🔧 NEW: 사진 파일 유효성 검사
function validatePhotoFile(file) {
    // 파일 타입 검사
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            message: 'JPG, JPEG, PNG 형식의 이미지 파일만 업로드 가능합니다.'
        };
    }
    
    // 파일 크기 검사 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return {
            isValid: false,
            message: '파일 크기가 5MB를 초과합니다. 더 작은 파일을 선택해주세요.'
        };
    }
    
    // 최소 크기 검사 (너무 작은 이미지 방지)
    const minSize = 10 * 1024; // 10KB
    if (file.size < minSize) {
        return {
            isValid: false,
            message: '파일이 너무 작습니다. 10KB 이상의 파일을 선택해주세요.'
        };
    }
    
    return { isValid: true };
}

// 🔧 NEW: 사진 미리보기 표시
function showPhotoPreview(file) {
    const dropZone = document.querySelector('[data-input="photo"]');
    const content = dropZone.querySelector('.file-drop-content');
    
    // FileReader로 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onload = function(e) {
        content.innerHTML = `
            <div class="photo-preview">
                <img src="${e.target.result}" alt="증명사진 미리보기" class="preview-image">
                <div class="photo-info">
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${formatFileSize(file.size)}</p>
                    <p class="success-message">✅ 업로드 준비 완료</p>
                </div>
                <button type="button" class="remove-photo-btn" onclick="removePhoto()">
                    ❌ 제거
                </button>
            </div>
        `;
        
        dropZone.classList.add('file-uploaded');
        clearPhotoError();
    };
    reader.readAsDataURL(file);
}

// 🔧 NEW: 사진 제거
function removePhoto() {
    const dropZone = document.querySelector('[data-input="photo"]');
    const content = dropZone.querySelector('.file-drop-content');
    const photoInput = document.getElementById('photo');
    
    // UI 원래대로 복원
    content.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p>파일을 끌어다 놓거나 클릭하여 업로드</p>
        <p class="file-info">JPG, PNG (최대 5MB)<br>3.5cm x 4.5cm, 흰 배경</p>
    `;
    
    dropZone.classList.remove('file-uploaded');
    photoInput.value = '';
    uploadedPhotoData = null;
    
    console.log('사진 제거됨');
}

// 🔧 NEW: 사진 오류 표시
function showPhotoError(message) {
    const dropZone = document.querySelector('[data-input="photo"]');
    
    // 기존 오류 제거
    clearPhotoError();
    
    // 오류 메시지 추가
    const errorDiv = document.createElement('div');
    errorDiv.className = 'photo-error text-red-500 text-sm mt-2';
    errorDiv.textContent = message;
    
    dropZone.parentNode.appendChild(errorDiv);
    dropZone.classList.add('error');
    
    // 3초 후 자동 제거
    setTimeout(clearPhotoError, 3000);
}

// 🔧 NEW: 사진 오류 제거
function clearPhotoError() {
    const dropZone = document.querySelector('[data-input="photo"]');
    const errorDiv = dropZone.parentNode.querySelector('.photo-error');
    
    if (errorDiv) {
        errorDiv.remove();
    }
    
    dropZone.classList.remove('error');
}

// 🔧 NEW: 실제 사진 업로드 (Firebase Storage)
async function uploadPhotoToStorage(file, applicationId) {
    console.log('Firebase Storage에 사진 업로드 시작:', file.name);
    
    try {
        // Firebase Storage 사용 가능 여부 확인
        if (!window.storageService) {
            console.warn('storageService를 사용할 수 없습니다. 시뮬레이션 모드로 진행');
            return {
                success: true,
                url: URL.createObjectURL(file), // 임시 URL 생성
                path: `certificate-photos/${applicationId}/${file.name}`
            };
        }
        
        // 파일 경로 생성 (certificates/photos/신청ID/파일명)
        const timestamp = new Date().getTime();
        const fileExt = file.name.split('.').pop();
        const fileName = `photo_${timestamp}.${fileExt}`;
        const storagePath = `certificate-photos/${applicationId}/${fileName}`;
        
        // 메타데이터 설정
        const metadata = {
            customMetadata: {
                applicationId: applicationId,
                uploadType: 'certificate_photo',
                originalName: file.name
            }
        };
        
        // 파일 업로드 실행
        const uploadResult = await window.storageService.uploadFile(file, storagePath, metadata);
        
        if (uploadResult.success) {
            console.log('사진 업로드 성공:', uploadResult.url);
            return {
                success: true,
                url: uploadResult.url,
                path: storagePath
            };
        } else {
            console.error('사진 업로드 실패:', uploadResult.error);
            return {
                success: false,
                error: uploadResult.error.message || '사진 업로드에 실패했습니다.'
            };
        }
        
    } catch (error) {
        console.error('사진 업로드 중 오류:', error);
        return {
            success: false,
            error: '사진 업로드 중 오류가 발생했습니다.'
        };
    }
}

// 🔧 MODIFIED: 폼 제출 처리 (영문명 + 사진 업로드 포함)
function initFormSubmissionWithEnglishNameAndPhoto() {
    console.log('=== initFormSubmissionWithEnglishNameAndPhoto 시작 ===');
    const form = document.getElementById('certificate-form');
    const submitButton = document.getElementById('apply-button');

    if (!form || !submitButton) {
        console.log('폼 또는 제출 버튼을 찾을 수 없습니다.');
        return;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('폼 제출 시도 (자격증 신청 + 영문명 + 사진 업로드 + 결제)');

        // 기본 폼 검증 (영문명 포함)
        if (!validateFormWithEnglishName()) {
            console.log('폼 검증 실패');
            return;
        }
        
        // 🔧 NEW: 사진 업로드 검증
        if (!validatePhotoUpload()) {
            console.log('사진 업로드 검증 실패');
            return;
        }

        console.log('폼 검증 성공, 사진 업로드 및 결제 처리 시작');
        
        // 버튼 상태 변경
        updateSubmitButtonState(submitButton, 'uploading');

        try {
            // 🔧 NEW: 1단계 - 사진 업로드
            const applicationId = 'CERT_APP_' + Date.now();
            let photoUploadResult = null;
            
            if (uploadedPhotoData && uploadedPhotoData.file) {
                console.log('사진 업로드 시작...');
                photoUploadResult = await uploadPhotoToStorage(uploadedPhotoData.file, applicationId);
                
                if (!photoUploadResult.success) {
                    showPhotoError(photoUploadResult.error);
                    updateSubmitButtonState(submitButton, 'error');
                    return;
                }
                
                console.log('사진 업로드 완료:', photoUploadResult.url);
            }
            
            // 2단계 - 폼 데이터 수집 (영문명 + 사진 URL 포함)
            const formData = collectFormDataWithEnglishNameAndPhoto(photoUploadResult);
            console.log('수집된 폼 데이터 (영문명 + 사진 포함):', formData);

            // 3단계 - 결제 처리
            updateSubmitButtonState(submitButton, 'processing');
            
            const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
            
            if (selectedPaymentMethod === 'card') {
                await processCardPaymentWithEnglishNameAndPhoto(formData);
            } else if (selectedPaymentMethod === 'bank') {
                await processBankTransferWithEnglishNameAndPhoto(formData);
            }
            
        } catch (error) {
            console.error('폼 처리 중 오류:', error);
            showPhotoError('신청 처리 중 오류가 발생했습니다.');
            updateSubmitButtonState(submitButton, 'error');
        }
    });

    console.log('=== initFormSubmissionWithEnglishNameAndPhoto 완료 ===');
}

// 🔧 NEW: 사진 업로드 검증
function validatePhotoUpload() {
    const photoInput = document.getElementById('photo');
    
    // 필수 파일 확인
    if (photoInput.hasAttribute('required')) {
        if (!uploadedPhotoData || !uploadedPhotoData.file) {
            showPhotoError('증명사진을 업로드해주세요.');
            return false;
        }
        
        // 다시 한번 파일 유효성 검사
        const validationResult = validatePhotoFile(uploadedPhotoData.file);
        if (!validationResult.isValid) {
            showPhotoError(validationResult.message);
            return false;
        }
    }
    
    return true;
}

// 🔧 MODIFIED: 폼 데이터 수집 (영문명 + 사진 URL 포함)
function collectFormDataWithEnglishNameAndPhoto(photoUploadResult) {
    const form = document.getElementById('certificate-form');
    const formData = new FormData(form);
    const data = {};

    // 기본 폼 데이터 수집
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // 결제 방법 정보 추가
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
    data.paymentMethod = selectedPaymentMethod ? selectedPaymentMethod.value : '';
    
    // 🔧 NEW: 영문명 추가 처리
    data.nameKorean = data.name || ''; // 한글명
    data.nameEnglish = data['name-english'] || ''; // 영문명
    
    // 🔧 NEW: 사진 정보 추가
    if (photoUploadResult && photoUploadResult.success) {
        data.photoUrl = photoUploadResult.url;
        data.photoPath = photoUploadResult.path;
        data.hasPhoto = true;
    } else {
        data.hasPhoto = false;
    }
    
    // 신청 ID 추가
    data.applicationId = 'CERT_APP_' + Date.now();

    return data;
}

// 🔧 NEW: 제출 버튼 상태 업데이트
function updateSubmitButtonState(button, state) {
    const buttonIcon = button.querySelector('.button-icon');
    const buttonText = button.querySelector('.button-text');
    
    switch (state) {
        case 'uploading':
            button.disabled = true;
            if (buttonIcon) buttonIcon.textContent = '📤';
            if (buttonText) buttonText.textContent = '사진 업로드 중...';
            break;
            
        case 'processing':
            button.disabled = true;
            if (buttonIcon) buttonIcon.textContent = '⏳';
            if (buttonText) buttonText.textContent = '결제 처리 중...';
            break;
            
        case 'error':
            button.disabled = false;
            if (buttonIcon) buttonIcon.textContent = '❌';
            if (buttonText) buttonText.textContent = '다시 시도';
            // 3초 후 원래 상태로 복원
            setTimeout(() => updateSubmitButtonState(button, 'normal'), 3000);
            break;
            
        case 'normal':
        default:
            button.disabled = false;
            const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
            if (paymentMethod === 'card') {
                if (buttonIcon) buttonIcon.textContent = '💳';
                if (buttonText) buttonText.textContent = '신청 및 카드 결제하기';
            } else {
                if (buttonIcon) buttonIcon.textContent = '🏦';
                if (buttonText) buttonText.textContent = '신청 및 입금 안내받기';
            }
            break;
    }
}

// 🔧 MODIFIED: 카드 결제 처리 (영문명 + 사진 정보 포함)
function processCardPaymentWithEnglishNameAndPhoto(formData) {
    console.log('=== 토스페이먼트 결제 처리 시작 (영문명 + 사진 정보 포함) ===');
    
    // 토스페이먼트 연동을 위한 결제 정보 준비
    const paymentData = {
        amount: 50000, // 고정 금액
        orderId: formData.applicationId,
        orderName: formData['cert-type'] + ' 자격증 발급',
        customerName: formData.nameKorean, // 한글명 사용
        customerNameEnglish: formData.nameEnglish, // 영문명 추가
        customerEmail: formData.email,
        customerMobilePhone: formData.phone,
        successUrl: window.location.origin + window.adjustPath('pages/education/payment-success.html'),
        failUrl: window.location.origin + window.adjustPath('pages/education/payment-fail.html'),
        // 🔧 NEW: 사진 정보 추가
        photoUrl: formData.photoUrl || null,
        hasPhoto: formData.hasPhoto || false
    };
    
    console.log('토스페이먼트 결제 데이터 (영문명 + 사진 포함):', paymentData);
    
    // 현재는 시뮬레이션
    setTimeout(() => {
        // 성공 시뮬레이션 (90% 확률)
        if (Math.random() > 0.1) {
            showPaymentSuccessWithEnglishNameAndPhoto({
                success: true,
                orderId: paymentData.orderId,
                method: 'card',
                amount: '₩' + paymentData.amount.toLocaleString(),
                customerName: paymentData.customerName,
                customerNameEnglish: paymentData.customerNameEnglish,
                photoUrl: paymentData.photoUrl,
                hasPhoto: paymentData.hasPhoto
            });
        } else {
            showPaymentError('결제가 취소되거나 실패했습니다.');
        }
        
        // 버튼 복원
        const submitButton = document.getElementById('apply-button');
        updateSubmitButtonState(submitButton, 'normal');
    }, 2000);
}

// 🔧 MODIFIED: 무통장 입금 처리 (영문명 + 사진 정보 포함)
function processBankTransferWithEnglishNameAndPhoto(formData) {
    console.log('=== 무통장 입금 처리 시작 (영문명 + 사진 정보 포함) ===');
    
    // 무통장 입금 신청 처리
    const bankTransferData = {
        orderId: formData.applicationId,
        method: 'bank',
        amount: '₩50,000',
        customerName: formData.nameKorean, // 한글명
        customerNameEnglish: formData.nameEnglish, // 영문명 추가
        depositorName: formData['bank-depositor'] || formData.nameKorean,
        certType: formData['cert-type'],
        // 🔧 NEW: 사진 정보 추가
        photoUrl: formData.photoUrl || null,
        hasPhoto: formData.hasPhoto || false
    };
    
    console.log('무통장 입금 데이터 (영문명 + 사진 포함):', bankTransferData);
    
    // 서버에 무통장 입금 신청 저장 (시뮬레이션)
    setTimeout(() => {
        showBankTransferSuccessWithEnglishNameAndPhoto(bankTransferData);
        
        // 버튼 복원
        const submitButton = document.getElementById('apply-button');
        updateSubmitButtonState(submitButton, 'normal');
    }, 1500);
}

// 🔧 MODIFIED: 결제 성공 표시 (영문명 + 사진 정보 포함)
function showPaymentSuccessWithEnglishNameAndPhoto(result) {
    console.log('결제 성공 (영문명 + 사진 포함):', result);
    
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
    
    // 🔧 NEW: 결제 정보 저장 (영문명 + 사진 정보 포함)
    savePaymentInfoWithEnglishNameAndPhoto(result);
}

// 🔧 MODIFIED: 무통장 입금 성공 표시 (영문명 + 사진 정보 포함)
function showBankTransferSuccessWithEnglishNameAndPhoto(result) {
    console.log('무통장 입금 신청 성공 (영문명 + 사진 포함):', result);
    
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
    
    // 🔧 NEW: 입금 정보 저장 (영문명 + 사진 정보 포함)
    savePaymentInfoWithEnglishNameAndPhoto(result);
}

// 🔧 MODIFIED: 결제 정보 저장 (영문명 + 사진 정보 포함)
function savePaymentInfoWithEnglishNameAndPhoto(paymentResult) {
    console.log('결제 정보 저장 (영문명 + 사진 포함):', paymentResult);
    
    // 🔧 실제 구현 시 Firebase Firestore에 저장
    const paymentData = {
        ...paymentResult,
        timestamp: new Date().toISOString(),
        status: paymentResult.method === 'card' ? 'completed' : 'pending',
        customer: {
            nameKorean: document.getElementById('name')?.value || '',
            nameEnglish: document.getElementById('name-english')?.value || '', // 영문명 추가
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            address: document.getElementById('address')?.value || ''
        },
        certificate: {
            type: document.getElementById('cert-type')?.value || '',
            amount: '50000' // 고정 금액
        },
        // 🔧 NEW: 사진 정보 추가
        photo: {
            hasPhoto: paymentResult.hasPhoto || false,
            photoUrl: paymentResult.photoUrl || null,
            uploadedAt: paymentResult.hasPhoto ? new Date().toISOString() : null
        }
    };
    
    // 🔧 실제 Firebase 연동 시 dbService 사용
    if (window.dbService) {
        // Firebase Firestore에 저장
        window.dbService.addDocument('certificate_applications', paymentData)
            .then(result => {
                if (result.success) {
                    console.log('Firebase에 자격증 신청 정보 저장 완료 (영문명 포함):', result.id);
                } else {
                    console.error('Firebase 저장 실패:', result.error);
                }
            })
            .catch(error => {
                console.error('Firebase 저장 중 오류:', error);
            });
    }
    
    // 로컬 스토리지에도 임시 저장 (개발용)
    const existingPayments = JSON.parse(localStorage.getItem('cert_payments') || '[]');
    existingPayments.push(paymentData);
    localStorage.setItem('cert_payments', JSON.stringify(existingPayments));
    
    console.log('결제 정보 저장 완료 (영문명 + 사진 포함)');
}

// =================================
// 기존 함수들 (URL 파라미터, 가격 계산 등) - 발급옵션 제거됨
// =================================

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

// 🔧 MODIFIED: 가격 계산 기능 (발급옵션 제거, 단순화)
function initSimplePriceCalculation() {
    console.log('=== initSimplePriceCalculation 시작 (발급옵션 제거) ===');
    
    const certTypeSelect = document.getElementById('cert-type');
    const selectedCertName = document.getElementById('selected-cert-name');
    const totalPriceSpan = document.getElementById('total-price');
    const finalPaymentAmount = document.getElementById('final-payment-amount');
    
    if (!totalPriceSpan) {
        console.warn('가격 표시 요소를 찾을 수 없습니다.');
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
            
            updateSimplePrice();
        });
    }
    
    function updateSimplePrice() {
        const fixedPrice = 50000; // 고정 가격
        
        if (totalPriceSpan) totalPriceSpan.textContent = formatPrice(fixedPrice);
        if (finalPaymentAmount) finalPaymentAmount.textContent = '₩' + fixedPrice.toLocaleString();
    }
    
    // 초기 가격 설정
    updateSimplePrice();
    
    console.log('=== initSimplePriceCalculation 완료 (발급옵션 제거) ===');
}

// 가격 포맷팅 함수
function formatPrice(price) {
    return price.toLocaleString('ko-KR') + '원';
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    if (submitButton) {
        updateSubmitButtonState(submitButton, 'normal');
    }
}

// 🔧 MODIFIED: 폼 유효성 검사 초기화 (영문명 검증 추가)
function initFormValidationWithEnglishName() {
    console.log('=== initFormValidationWithEnglishName 시작 ===');
    const form = document.getElementById('certificate-form');
    if (!form) {
        console.log('certificate-form을 찾을 수 없습니다.');
        return;
    }
    
    const inputs = form.querySelectorAll('input, select, textarea');
    console.log('폼 입력 요소 개수:', inputs.length);

    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateFieldWithEnglishName(this);
        });

        input.addEventListener('input', function () {
            clearFieldError(this);
        });
    });
    
    console.log('=== initFormValidationWithEnglishName 완료 ===');
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

// 결제 실패 처리
function showPaymentError(message) {
    alert('결제 실패: ' + message);
    console.error('결제 실패:', message);
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

// 🔧 MODIFIED: 폼 유효성 검사 (영문명 포함)
function validateFormWithEnglishName() {
    console.log('=== validateFormWithEnglishName 시작 (자격증 + 영문명 + 결제 + 사진) ===');
    let isValid = true;

    // 필수 입력 필드 확인
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    console.log('필수 필드 개수:', requiredFields.length);
    
    requiredFields.forEach(field => {
        if (!validateFieldWithEnglishName(field)) {
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

    console.log('폼 검증 결과 (자격증 + 영문명 + 결제 + 사진):', isValid);
    return isValid;
}

// 🔧 MODIFIED: 개별 필드 유효성 검사 (영문명 포함)
function validateFieldWithEnglishName(field) {
    if (!field) return false;
    
    const value = field.value.trim();

    // 필수 필드 확인
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, '필수 입력 항목입니다.');
        return false;
    }

    // 한글 이름 검증
    if (field.id === 'name') {
        if (value.length < 2) {
            showFieldError(field, '한글 이름은 2자 이상 입력해주세요.');
            return false;
        }
        if (!/^[가-힣\s]+$/.test(value)) {
            showFieldError(field, '한글 이름은 한글만 입력 가능합니다.');
            return false;
        }
    }

    // 🔧 NEW: 영문명 검증
    if (field.id === 'name-english') {
        if (value.length > 0) {
            return validateEnglishName(value, field);
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
                    holderEnglish: 'Hong Gil Dong', // 영문명 추가
                    type: '건강운동처방사',
                    status: '유효'
                });
            }, 2000);
        }
    });
    
    console.log('=== initVerifyForm 완료 ===');
}

// 🔧 MODIFIED: 자격증 조회 결과 표시 (영문명 포함)
function showVerificationResult(result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'verification-result mt-6 p-4 bg-green-50 border border-green-200 rounded-md';
    resultDiv.innerHTML = `
        <h3 class="text-lg font-bold text-green-800 mb-2">조회 결과</h3>
        <div class="space-y-1">
            <p><span class="font-medium">자격증 번호:</span> ${result.number}</p>
            <p><span class="font-medium">소지자 (한글):</span> ${result.holder}</p>
            <p><span class="font-medium">소지자 (영문):</span> ${result.holderEnglish}</p>
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
// 스타일 및 디버깅 도구 (영문명 추가)
// =================================

// 🔧 NEW: 사진 업로드 관련 스타일 추가
const photoUploadStyle = document.createElement('style');
photoUploadStyle.textContent = `
    /* 사진 미리보기 스타일 */
    .photo-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        text-align: center;
    }
    
    .preview-image {
        width: 120px;
        height: 160px;
        object-fit: cover;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 1rem;
    }
    
    .photo-info .file-name {
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.25rem;
    }
    
    .photo-info .file-size {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }
    
    .photo-info .success-message {
        font-size: 0.875rem;
        color: #059669;
        font-weight: 600;
    }
    
    .remove-photo-btn {
        background: none;
        border: none;
        color: #dc2626;
        cursor: pointer;
        font-size: 0.875rem;
        padding: 0.5rem;
        border-radius: 4px;
        transition: background-color 0.2s;
        margin-top: 0.5rem;
    }
    
    .remove-photo-btn:hover {
        background-color: rgba(220, 38, 38, 0.1);
    }
    
    /* 사진 업로드 오류 스타일 */
    .photo-error {
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        padding: 0.75rem;
        margin-top: 0.5rem;
    }
    
    .file-drop-zone.error {
        border-color: #dc2626 !important;
        background-color: rgba(220, 38, 38, 0.05) !important;
    }
    
    /* 업로드 완료 상태 */
    .file-uploaded {
        border-color: #10b981 !important;
        background-color: rgba(16, 185, 129, 0.05) !important;
    }
    
    /* 영문명 입력 필드 스타일 */
    #name-english {
        font-family: 'Arial', sans-serif;
    }
    
    #name-english:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    /* 로딩 스피너 */
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
`;
document.head.appendChild(photoUploadStyle);

// 🔧 MODIFIED: 개발 모드에서 사용되는 디버깅 함수들 (영문명 + 사진 업로드 포함)
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('.web.app') || 
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {
    
    window.debugCertApplication = {
        // 기본 디버깅 함수들
        logFormData: function() {
            console.log('현재 폼 데이터:', collectFormDataWithEnglishNameAndPhoto(null));
        },
        
        checkValidation: function() {
            const form = document.getElementById('certificate-form');
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            
            inputs.forEach(input => {
                console.log(`${input.name || input.id}: ${validateFieldWithEnglishName(input) ? '✓' : '✗'}`);
            });
            
            console.log(`사진 업로드: ${validatePhotoUpload() ? '✓' : '✗'}`);
        },
        
        // 🔧 MODIFIED: 영문명 포함 테스트 데이터
        fillTestData: function() {
            const certType = document.getElementById('cert-type');
            const name = document.getElementById('name');
            const nameEnglish = document.getElementById('name-english');
            const birth = document.getElementById('birth');
            const phone = document.getElementById('phone');
            const email = document.getElementById('email');
            const address = document.getElementById('address');
            const courseCompletion = document.getElementById('course-completion');
            const examPass = document.getElementById('exam-pass');
            
            if (certType) certType.value = 'health';
            if (name) name.value = '홍길동';
            if (nameEnglish) nameEnglish.value = 'Hong Gil Dong'; // 영문명 추가
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
            
            console.log('테스트 데이터 입력 완료 (영문명 포함)');
        },
        
        // 🔧 NEW: 영문명 검증 테스트
        testEnglishNameValidation: function() {
            const englishNameInput = document.getElementById('name-english');
            if (!englishNameInput) {
                console.log('영문명 입력 필드를 찾을 수 없습니다.');
                return;
            }
            
            const testCases = [
                { value: 'Hong Gil Dong', expected: true, description: '정상적인 영문명' },
                { value: 'John Smith', expected: true, description: '일반적인 서구식 이름' },
                { value: 'Kim Min-Jung', expected: false, description: '하이픈 포함 (허용되지 않음)' },
                { value: 'Lee123', expected: false, description: '숫자 포함' },
                { value: 'Park', expected: false, description: '단일 단어 (성만)' },
                { value: 'A B', expected: true, description: '최소 길이' },
                { value: '', expected: false, description: '빈 값' },
                { value: '홍길동', expected: false, description: '한글 입력' },
                { value: 'Hong  Gil  Dong', expected: false, description: '연속된 공백' },
                { value: ' Hong Gil Dong ', expected: false, description: '앞뒤 공백' }
            ];
            
            console.log('🧪 영문명 검증 테스트 시작:');
            testCases.forEach((testCase, index) => {
                const result = validateEnglishName(testCase.value, englishNameInput);
                const status = result === testCase.expected ? '✅' : '❌';
                console.log(`${index + 1}. ${status} "${testCase.value}" - ${testCase.description}`);
                if (result !== testCase.expected) {
                    console.log(`   예상: ${testCase.expected}, 실제: ${result}`);
                }
            });
            
            // 입력 필드 초기화
            englishNameInput.value = '';
            clearFieldError(englishNameInput);
        },
        
        // 🔧 NEW: 사진 관련 테스트 함수들
        testPhotoUpload: function() {
            console.log('사진 업로드 테스트 - 실제 이미지 파일을 선택해서 테스트하세요.');
            console.log('업로드된 사진 데이터:', uploadedPhotoData);
            
            if (uploadedPhotoData) {
                console.log('- 파일명:', uploadedPhotoData.file.name);
                console.log('- 파일 크기:', formatFileSize(uploadedPhotoData.file.size));
                console.log('- 파일 타입:', uploadedPhotoData.file.type);
                console.log('- 업로드 상태:', uploadedPhotoData.isUploaded ? '완료' : '대기중');
            } else {
                console.log('업로드된 사진이 없습니다.');
            }
        },
        
        simulatePhotoUpload: function() {
            // 가상의 사진 파일 생성 (테스트용)
            const canvas = document.createElement('canvas');
            canvas.width = 350;
            canvas.height = 450;
            const ctx = canvas.getContext('2d');
            
            // 간단한 테스트 이미지 그리기
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 350, 450);
            ctx.fillStyle = '#333';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('테스트 증명사진', 175, 225);
            
            canvas.toBlob(function(blob) {
                const file = new File([blob], 'test-photo.jpg', { type: 'image/jpeg' });
                handlePhotoSelection(file);
                console.log('가상 사진 업로드 시뮬레이션 완료');
            }, 'image/jpeg');
        },
        
        clearPhoto: function() {
            removePhoto();
            console.log('사진 제거 완료');
        },
        
        // 🔧 MODIFIED: 결제 관련 테스트 함수들 (영문명 + 사진 포함)
        testCardPaymentWithEnglishNameAndPhoto: function() {
            this.fillTestData();
            this.simulatePhotoUpload();
            
            setTimeout(() => {
                const methodCard = document.getElementById('method-card');
                const cardPaymentMethod = document.querySelector('[data-method="card"]');
                
                if (methodCard) methodCard.checked = true;
                if (cardPaymentMethod) cardPaymentMethod.click();
                
                console.log('카드 결제 테스트 준비 완료 (영문명 + 사진 포함)');
            }, 1000);
        },
        
        testBankTransferWithEnglishNameAndPhoto: function() {
            this.fillTestData();
            this.simulatePhotoUpload();
            
            setTimeout(() => {
                const methodBank = document.getElementById('method-bank');
                const bankPaymentMethod = document.querySelector('[data-method="bank"]');
                const bankDepositor = document.getElementById('bank-depositor');
                
                if (methodBank) methodBank.checked = true;
                if (bankPaymentMethod) bankPaymentMethod.click();
                if (bankDepositor) bankDepositor.value = '김입금';
                
                console.log('무통장 입금 테스트 준비 완료 (영문명 + 사진 포함)');
            }, 1000);
        },
        
        simulatePaymentSuccessWithEnglishNameAndPhoto: function() {
            showPaymentSuccessWithEnglishNameAndPhoto({
                success: true,
                orderId: 'TEST_CERT_' + Date.now(),
                method: 'card',
                amount: '₩50,000',
                customerName: '테스트 사용자',
                customerNameEnglish: 'Test User',
                hasPhoto: true,
                photoUrl: 'test-photo-url'
            });
        },
        
        simulateBankTransferSuccessWithEnglishNameAndPhoto: function() {
            showBankTransferSuccessWithEnglishNameAndPhoto({
                orderId: 'TEST_CERT_BANK_' + Date.now(),
                method: 'bank',
                amount: '₩50,000',
                customerName: '테스트 사용자',
                customerNameEnglish: 'Test User',
                hasPhoto: true,
                photoUrl: 'test-photo-url'
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
        
        // 🔧 MODIFIED: 전체 플로우 테스트 (영문명 포함)
        testFullFlowWithEnglishNameAndPhoto: function() {
            console.log('🚀 전체 플로우 테스트 시작 (영문명 + 사진 포함)');
            
            // 1단계: 기본 데이터 입력 (영문명 포함)
            this.fillTestData();
            console.log('✅ 1단계: 기본 데이터 입력 완료 (영문명 포함)');
            
            // 2단계: 영문명 검증 테스트
            setTimeout(() => {
                this.testEnglishNameValidation();
                console.log('✅ 2단계: 영문명 검증 테스트 완료');
                
                // 3단계: 사진 업로드 시뮬레이션
                setTimeout(() => {
                    this.simulatePhotoUpload();
                    console.log('✅ 3단계: 사진 업로드 시뮬레이션 완료');
                    
                    // 4단계: 결제 방법 선택
                    setTimeout(() => {
                        const cardMethod = document.querySelector('[data-method="card"]');
                        if (cardMethod) cardMethod.click();
                        console.log('✅ 4단계: 결제 방법 선택 완료');
                        
                        console.log('🎯 모든 준비 완료! "신청 및 결제하기" 버튼을 눌러 테스트하세요.');
                    }, 500);
                }, 1000);
            }, 500);
        }
    };
    
    console.log('개발 모드 디버깅 도구 활성화됨 (자격증 신청 + 영문명 + 결제 + 사진 업로드)');
    console.log('현재 호스트:', window.location.hostname);
    console.log('사용 가능한 함수들:');
    console.log('📝 기본: fillTestData(), logFormData(), checkValidation()');
    console.log('🔤 영문명: testEnglishNameValidation()');
    console.log('📸 사진: testPhotoUpload(), simulatePhotoUpload(), clearPhoto()');
    console.log('💳 결제: testCardPaymentWithEnglishNameAndPhoto(), testBankTransferWithEnglishNameAndPhoto()');
    console.log('🎭 모달: showModal(), hideModal()');
    console.log('🧪 종합: testFullFlowWithEnglishNameAndPhoto()');
    console.log('');
    console.log('💡 빠른 시작: window.debugCertApplication.testFullFlowWithEnglishNameAndPhoto()');
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
    if (form && (form.modified || uploadedPhotoData)) {
        e.preventDefault();
        e.returnValue = '작성 중인 내용이나 업로드된 사진이 있습니다. 정말 페이지를 떠나시겠습니까?';
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

// 에러 처리
window.addEventListener('error', function(e) {
    console.error('cert-application.js error:', e);
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', function() {
    console.log('cert-application.js 정리 중...');
    
    // 업로드된 임시 파일 URL 정리
    if (uploadedPhotoData && uploadedPhotoData.file) {
        console.log('업로드 데이터 정리');
    }
});

console.log('=== cert-application.js 로드 완료 (영문명 처리 + 사진 업로드 기능 포함) ===');