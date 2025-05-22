// cert-application.js - 자격증 신청 페이지 전용 JavaScript (URL 파라미터 처리 추가)
console.log('=== cert-application.js 파일 로드됨 ===');

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

// 페이지 초기화 함수
function initCertApplicationPage() {
    console.log('=== initCertApplicationPage 실행 시작 ===');
    
    // URL 파라미터 처리 (가장 먼저 실행)
    handleUrlParameters();
    
    // 가격 계산 기능 초기화
    initPriceCalculation();
    
    // 파일 드래그 앤 드롭 초기화
    initFileUploads();
    
    // 폼 유효성 검사 초기화
    initFormValidation();
    
    // 폼 제출 처리
    initFormSubmission();
    
    // 자격증 조회 폼 처리
    initVerifyForm();
    
    // 전화번호 자동 포맷팅
    initPhoneFormatting();
    
    // 날짜 제한 설정
    setDateLimits();
    
    console.log('=== initCertApplicationPage 완료 ===');
}

// URL 파라미터 처리 함수 추가
function handleUrlParameters() {
    console.log('=== URL 파라미터 처리 시작 ===');
    
    // URL에서 파라미터 추출
    const urlParams = new URLSearchParams(window.location.search);
    const certParam = urlParams.get('cert');
    
    console.log('받은 cert 파라미터:', certParam);
    
    if (certParam) {
        // 자격증 종류 셀렉트 박스 찾기
        const certTypeSelect = document.getElementById('cert-type');
        
        if (certTypeSelect) {
            // 파라미터에 따라 자격증 종류 자동 선택
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
            
            // 시각적 피드백을 위한 애니메이션 효과
            certTypeSelect.style.backgroundColor = '#dbeafe';
            certTypeSelect.style.transition = 'background-color 0.5s ease';
            
            setTimeout(() => {
                certTypeSelect.style.backgroundColor = '';
            }, 1500);
            
            console.log(`${certName}이(가) 자동으로 선택되었습니다:`, optionValue);
            
            // change 이벤트 발생시켜서 다른 연동 기능들이 동작하도록 함
            const changeEvent = new Event('change', { bubbles: true });
            certTypeSelect.dispatchEvent(changeEvent);
            
            // 사용자에게 알림 (선택사항)
            setTimeout(() => {
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300';
                notification.textContent = `${certName} 자격증이 자동으로 선택되었습니다.`;
                document.body.appendChild(notification);
                
                // 3초 후 알림 제거
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, 3000);
            }, 500);
            
        } else {
            console.error('cert-type 셀렉트 박스를 찾을 수 없습니다');
        }
    } else {
        console.log('cert 파라미터가 없습니다. 기본 상태로 진행합니다.');
    }
    
// 가격 계산 기능
function initPriceCalculation() {
    const certOptionSelect = document.getElementById('cert-option');
    const optionPriceSpan = document.getElementById('option-price');
    const totalPriceSpan = document.getElementById('total-price');
    
    if (!certOptionSelect || !optionPriceSpan || !totalPriceSpan) {
        console.warn('가격 계산 요소를 찾을 수 없습니다.');
        return;
    }
    
    certOptionSelect.addEventListener('change', function() {
        let optionPrice = 0;
        const basePrice = 50000;
        
        switch(this.value) {
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
        
        optionPriceSpan.textContent = formatPrice(optionPrice);
        totalPriceSpan.textContent = formatPrice(basePrice + optionPrice);
    });
}

// 가격 포맷팅 함수
function formatPrice(price) {
    return price.toLocaleString('ko-KR') + '원';
}

// 파일 드래그 앤 드롭 기능
function initFileUploads() {
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
}

// 파일 표시 업데이트
function updateFileDisplay(zone, file) {
    const content = zone.querySelector('.file-drop-content');
    
    // 파일 크기 검사 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
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

// 폼 유효성 검사
function initFormValidation() {
    const form = document.getElementById('certificate-form');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        // 실시간 유효성 검사
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        // 입력 시 오류 메시지 제거
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
    
    // 이메일 유효성 검사
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const email = this.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                showFieldError(this, '올바른 이메일 형식을 입력해주세요.');
            } else {
                clearFieldError(this);
            }
        });
    }
}

// 개별 필드 유효성 검사
function validateField(field) {
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, '필수 입력 항목입니다.');
        return false;
    }
    
    // 특정 필드별 유효성 검사
    switch (field.type) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
                showFieldError(field, '올바른 이메일 형식을 입력해주세요.');
                return false;
            }
            break;
            
        case 'tel':
            const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
            if (value && !phoneRegex.test(value)) {
                showFieldError(field, '올바른 전화번호 형식을 입력해주세요.');
                return false;
            }
            break;
            
        case 'file':
            if (field.hasAttribute('required') && !field.files.length) {
                showFieldError(field, '필수 파일을 업로드해주세요.');
                return false;
            }
            break;
    }
    
    clearFieldError(field);
    return true;
}

// 필드 에러 표시
function showFieldError(field, message) {
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

// 필드 에러 제거
function clearFieldError(field) {
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

// 폼 제출 처리
function initFormSubmission() {
    const form = document.getElementById('certificate-form');
    const submitButton = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 필수 필드 검증
        if (!validateForm()) {
            return;
        }
        
        // 로딩 상태 표시
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> 신청 중...';
        
        // 폼 데이터 수집
        const formData = collectFormData();
        
        // 서버에 데이터 전송 (실제 구현 시 Firebase 연동)
        setTimeout(() => {
            // 성공 메시지 표시
           alert('자격증 신청이 완료되었습니다. 담당자 확인 후 발급 예정입니다.');
           
           // 결제 페이지로 이동
           window.location.href = window.adjustPath('pages/education/payment.html');
       }, 2000);
   });
}

// 폼 데이터 수집
function collectFormData() {
   const form = document.getElementById('certificate-form');
   const formData = new FormData();
   
   // 모든 입력 필드 수집
   const inputs = form.querySelectorAll('input, select, textarea');
   inputs.forEach(input => {
       if (input.type === 'checkbox' || input.type === 'radio') {
           if (input.checked) {
               formData.append(input.name, input.value);
           }
       } else if (input.type === 'file') {
           if (input.files.length > 0) {
               formData.append(input.name, input.files[0]);
           }
       } else {
           formData.append(input.name, input.value);
       }
   });
   
   return formData;
}

// 폼 유효성 검사
function validateForm() {
   const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
   let isValid = true;
   
   requiredFields.forEach(field => {
       if (!validateField(field)) {
           isValid = false;
       }
   });
   
   // 첫 번째 오류 필드로 스크롤
   if (!isValid) {
       const firstError = document.querySelector('.field-error');
       if (firstError) {
           firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
   }
   
   return isValid;
}

// 자격증 조회 폼 처리
function initVerifyForm() {
   const verifyForm = document.getElementById('verify-form');
   
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
   const phoneInput = document.getElementById('phone');
   
   if (phoneInput) {
       phoneInput.addEventListener('input', function() {
           let value = this.value.replace(/[^0-9]/g, '');
           
           if (value.length >= 7) {
               if (value.length <= 10) {
                   value = value.replace(/(\d{3})(\d{3,4})(\d{0,4})/, '$1-$2-$3');
               } else {
                   value = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3');
               }
               
               // 마지막 하이픈 제거
               value = value.replace(/-$/, '');
           }
           
           this.value = value;
       });
   }
}

// 날짜 제한 설정
function setDateLimits() {
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
}

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
`;
document.head.appendChild(style);

// 에러 처리
window.addEventListener('error', function(e) {
   console.error('cert-application.js error:', e);
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', function() {
   // 필요한 정리 작업 수행
   console.log('cert-application.js 정리 중...');
});
}