/**
 * 자격증 갱신 페이지 스크립트
 * cert-renewal.js
 */

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    // 초기화
    initRenewalForm();
    bindEvents();
    loadUserData();
});

// 전역 변수
let selectedFiles = [];
let certificationFees = {
    health: { renewal: 50000, education: 100000 },
    rehab: { renewal: 50000, education: 120000 },
    pilates: { renewal: 40000, education: 80000 },
    recreation: { renewal: 30000, education: 70000 }
};

/**
 * 폼 초기화
 */
function initRenewalForm() {
    // 로그인 체크
    checkLoginStatus();
    
    // 배송 방법에 따른 주소 필드 표시/숨김
    const deliveryMethod = document.getElementById('delivery-method');
    const addressFields = document.getElementById('address-fields');
    
    function toggleAddressFields() {
        if (deliveryMethod.value === 'digital') {
            addressFields.style.display = 'none';
            // 필수 속성 제거
            document.getElementById('zipcode').removeAttribute('required');
            document.getElementById('address1').removeAttribute('required');
            document.getElementById('address2').removeAttribute('required');
        } else {
            addressFields.style.display = 'block';
            // 필수 속성 추가
            document.getElementById('zipcode').setAttribute('required', '');
            document.getElementById('address1').setAttribute('required', '');
            document.getElementById('address2').setAttribute('required', '');
        }
        updateTotalAmount();
    }
    
    deliveryMethod.addEventListener('change', toggleAddressFields);
    toggleAddressFields(); // 초기 실행
}

/**
 * 이벤트 바인딩
 */
function bindEvents() {
    // 자격증 유형 변경 시 비용 업데이트
    document.getElementById('cert-type').addEventListener('change', updateTotalAmount);
    
    // 갱신 교육 유형 변경 시 파일 업로드 필드 표시/숨김
    document.getElementById('education-type').addEventListener('change', function() {
        const educationCompletionField = document.getElementById('education-completion-field');
        if (this.value === 'completed') {
            educationCompletionField.classList.remove('hidden');
            document.getElementById('education-completion').setAttribute('required', '');
        } else {
            educationCompletionField.classList.add('hidden');
            document.getElementById('education-completion').removeAttribute('required');
        }
    });
    
    // 파일 업로드 이벤트
    setupFileUpload('education-completion', false);
    setupFileUpload('cpe-documents', true);
    
    // 주소 찾기 버튼
    document.getElementById('find-address').addEventListener('click', function() {
        if (typeof daum !== 'undefined' && daum.Postcode) {
            findAddress();
        } else {
            // Daum 우편번호 API 동적 로드
            const script = document.createElement('script');
            script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
            script.onload = findAddress;
            document.head.appendChild(script);
        }
    });
    
    // 폼 제출
    document.getElementById('renewal-form').addEventListener('submit', handleFormSubmit);
    
    // FAQ 토글
    document.querySelectorAll('.faq-button').forEach(button => {
        button.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const answer = faqItem.querySelector('.faq-answer');
            const icon = this.querySelector('svg');
            
            faqItem.classList.toggle('active');
            
            if (faqItem.classList.contains('active')) {
                answer.classList.add('show');
                icon.style.transform = 'rotate(180deg)';
            } else {
                answer.classList.remove('show');
                icon.style.transform = 'rotate(0deg)';
            }
        });
    });
    
    // 약관 모달
    document.querySelectorAll('[data-modal-target="terms-modal"]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            document.getElementById('terms-modal').classList.remove('hidden');
        });
    });
    
    document.querySelectorAll('[data-dismiss="modal"]').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').classList.add('hidden');
        });
    });
    
    // 유효기간 자동 계산
    document.getElementById('issue-date').addEventListener('change', function() {
        if (this.value) {
            const issueDate = new Date(this.value);
            const expiryDate = new Date(issueDate);
            expiryDate.setFullYear(expiryDate.getFullYear() + 3);
            
            const year = expiryDate.getFullYear();
            const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
            const day = String(expiryDate.getDate()).padStart(2, '0');
            
            document.getElementById('expiry-date').value = `${year}-${month}-${day}`;
        }
    });
}

/**
 * 로그인 상태 확인
 */
function checkLoginStatus() {
    if (window.dhcFirebase && window.dhcFirebase.auth) {
        window.dhcFirebase.onAuthStateChanged(function(user) {
            const loginAlert = document.getElementById('login-alert');
            const renewalForm = document.getElementById('renewal-form');
            
            if (user) {
                // 로그인됨
                loginAlert.style.display = 'none';
                renewalForm.style.display = 'block';
                
                // 사용자 정보 자동 입력
                loadUserData(user);
            } else {
                // 로그인되지 않음
                loginAlert.style.display = 'block';
                renewalForm.style.display = 'none';
            }
        });
    } else {
        console.warn('Firebase not initialized');
        // 로컬 테스트 모드일 경우 폼 표시
        if (window.LOCAL_TEST_MODE) {
            document.getElementById('login-alert').style.display = 'none';
            document.getElementById('renewal-form').style.display = 'block';
        }
    }
}

/**
 * 사용자 데이터 로드
 */
function loadUserData(user) {
    if (user) {
        // Firebase 사용자 정보로 폼 자동 입력
        document.getElementById('email').value = user.email || '';
        
        // 추가 사용자 정보가 있으면 불러오기
        if (window.dhcFirebase && window.dhcFirebase.db) {
            window.dhcFirebase.db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    document.getElementById('name').value = userData.name || '';
                    document.getElementById('phone').value = userData.phone || '';
                    document.getElementById('birth').value = userData.birth || '';
                }
            }).catch(error => {
                console.error('Error loading user data:', error);
            });
        }
    }
}

/**
 * 파일 업로드 설정
 */
function setupFileUpload(inputId, isMultiple) {
    const input = document.getElementById(inputId);
    const dropZone = input.parentElement.querySelector('.file-drop-zone');
    const preview = input.parentElement.querySelector(isMultiple ? '.file-preview-list' : '.file-preview');
    
    // 파일 선택 이벤트
    input.addEventListener('change', function() {
        if (isMultiple) {
            handleMultipleFiles(this.files, preview);
        } else {
            handleSingleFile(this.files[0], preview);
        }
    });
    
    // 드래그 앤 드롭 이벤트
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (isMultiple) {
            handleMultipleFiles(files, preview);
        } else {
            handleSingleFile(files[0], preview);
        }
    });
    
    // 클릭으로 파일 선택
    dropZone.addEventListener('click', function() {
        input.click();
    });
}

/**
 * 단일 파일 처리
 */
function handleSingleFile(file, preview) {
    if (!file) return;
    
    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
    }
    
    // 파일 형식 체크
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        alert('PDF, JPG, PNG 파일만 업로드 가능합니다.');
        return;
    }
    
    // 미리보기 표시
    const fileName = preview.querySelector('.file-name');
    fileName.textContent = file.name;
    
    preview.classList.remove('hidden');
    preview.parentElement.querySelector('.file-drop-zone').style.display = 'none';
    
    // 삭제 버튼
    const removeBtn = preview.querySelector('.remove-file');
    removeBtn.addEventListener('click', function() {
        preview.classList.add('hidden');
        preview.parentElement.querySelector('.file-drop-zone').style.display = 'block';
        preview.parentElement.querySelector('input[type="file"]').value = '';
    });
}

/**
 * 다중 파일 처리
 */
function handleMultipleFiles(files, previewList) {
    // 최대 5개 파일
    if (files.length > 5) {
        alert('최대 5개 파일까지 업로드 가능합니다.');
        return;
    }
    
    // 기존 파일 목록 초기화
    previewList.innerHTML = '';
    selectedFiles = [];
    
    Array.from(files).forEach((file, index) => {
        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`);
            return;
        }
        
        // 파일 형식 체크
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            alert(`${file.name}: PDF, JPG, PNG 파일만 업로드 가능합니다.`);
            return;
        }
        
        selectedFiles.push(file);
        
        // 미리보기 생성
        const previewItem = document.createElement('div');
        previewItem.className = 'file-preview-item';
        previewItem.innerHTML = `
            <div class="file-preview-info">
                <div class="file-type-icon">${getFileIcon(file.type)}</div>
                <div class="file-details">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
            <button type="button" class="remove-file" data-index="${index}">&times;</button>
        `;
        
        previewList.appendChild(previewItem);
    });
    
    if (selectedFiles.length > 0) {
        previewList.classList.remove('hidden');
        previewList.parentElement.querySelector('.file-drop-zone').style.display = 'none';
        
        // 삭제 버튼 이벤트
        previewList.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                selectedFiles.splice(index, 1);
                
                if (selectedFiles.length === 0) {
                    previewList.classList.add('hidden');
                    previewList.parentElement.querySelector('.file-drop-zone').style.display = 'block';
                    previewList.parentElement.querySelector('input[type="file"]').value = '';
                } else {
                    this.parentElement.remove();
                    // 인덱스 재정렬
                    previewList.querySelectorAll('.remove-file').forEach((btn, i) => {
                        btn.dataset.index = i;
                    });
                }
            });
        });
    }
}

/**
 * 파일 아이콘 반환
 */
function getFileIcon(type) {
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('image/')) return '🖼️';
    return '📎';
}

/**
 * 파일 크기 포맷
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 주소 찾기
 */
function findAddress() {
    new daum.Postcode({
        oncomplete: function(data) {
            document.getElementById('zipcode').value = data.zonecode;
            document.getElementById('address1').value = data.address;
            document.getElementById('address2').focus();
        }
    }).open();
}

/**
 * 총 금액 업데이트
 */
function updateTotalAmount() {
    const certType = document.getElementById('cert-type').value;
    const deliveryMethod = document.getElementById('delivery-method').value;
    
    if (!certType) return;
    
    const fees = certificationFees[certType];
    const renewalFee = fees.renewal;
    const educationFee = fees.education;
    const deliveryFee = deliveryMethod === 'both' ? 5000 : 0;
    const totalAmount = renewalFee + educationFee + deliveryFee;
    
    document.querySelector('.renewal-fee').textContent = renewalFee.toLocaleString() + '원';
    document.querySelector('.education-fee').textContent = educationFee.toLocaleString() + '원';
    document.querySelector('.delivery-fee').textContent = deliveryFee.toLocaleString() + '원';
    document.querySelector('.total-amount').textContent = totalAmount.toLocaleString() + '원';
    
    // 배송 추가 비용 행 표시/숨김
    const deliveryFeeRow = document.getElementById('delivery-fee-row');
    if (deliveryMethod === 'both') {
        deliveryFeeRow.style.display = 'flex';
    } else {
        deliveryFeeRow.style.display = 'none';
    }
}

/**
 * 폼 검증
 */
function validateForm() {
    const requiredFields = document.querySelectorAll('#renewal-form [required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            showError(field, '필수 항목입니다.');
        } else {
            field.classList.remove('error');
            hideError(field);
        }
    });
    
    // 이메일 형식 검증
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value && !emailRegex.test(email.value)) {
        isValid = false;
        email.classList.add('error');
        showError(email, '올바른 이메일 형식이 아닙니다.');
    }
    
    // 휴대폰 번호 형식 검증
    const phone = document.getElementById('phone');
    const phoneRegex = /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/;
    if (phone.value && !phoneRegex.test(phone.value)) {
        isValid = false;
        phone.classList.add('error');
        showError(phone, '올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)');
    }
    
    // 보수교육 시간 검증
    const cpeHours = document.getElementById('cpe-hours');
    if (cpeHours.value && parseInt(cpeHours.value) < 10) {
        isValid = false;
        cpeHours.classList.add('error');
        showError(cpeHours, '최소 10시간 이상이어야 합니다.');
    }
    
    // 약관 동의 확인
    const agreeTerms = document.getElementById('agree-terms');
    if (!agreeTerms.checked) {
        isValid = false;
        showError(agreeTerms.parentElement, '개인정보 수집 및 이용, 자격증 갱신 약관에 동의해주세요.');
    }
    
    return isValid;
}

/**
 * 에러 메시지 표시
 */
function showError(element, message) {
    hideError(element);
    
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    element.parentElement.appendChild(errorElement);
}

/**
 * 에러 메시지 숨김
 */
function hideError(element) {
    const existingError = element.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * 폼 제출 처리
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // 로딩 표시
    showLoading();
    
    // 폼 데이터 수집
    const formData = new FormData(e.target);
    
    // 파일 데이터 추가
    if (document.getElementById('education-completion').files.length > 0) {
        formData.append('education-completion', document.getElementById('education-completion').files[0]);
    }
    
    selectedFiles.forEach((file, index) => {
        formData.append(`cpe-documents-${index}`, file);
    });
    
    // Firebase에 데이터 저장
    saveRenewalApplication(formData)
        .then(() => {
            hideLoading();
            showSuccess('갱신 신청이 완료되었습니다. 결제 페이지로 이동합니다.');
            setTimeout(() => {
                window.location.href = window.adjustPath('pages/education/payment.html');
            }, 2000);
        })
        .catch(error => {
            hideLoading();
            showError(document.getElementById('renewal-form'), '갱신 신청 중 오류가 발생했습니다.');
            console.error('Error submitting renewal application:', error);
        });
}

/**
 * 갱신 신청 데이터 저장
 */
function saveRenewalApplication(formData) {
    // 로컬 테스트 모드일 경우 콘솔에 출력
    if (window.LOCAL_TEST_MODE) {
        console.log('Renewal application data:', formData);
        return Promise.resolve();
    }
    
    // Firebase에 데이터 저장
    if (window.dhcFirebase && window.dhcFirebase.db) {
        const user = window.dhcFirebase.getCurrentUser();
        if (!user) {
            return Promise.reject(new Error('User not authenticated'));
        }
        
        // 폼 데이터를 객체로 변환
        const applicationData = {};
        for (const [key, value] of formData.entries()) {
            if (!key.startsWith('cpe-documents-') && key !== 'education-completion') {
                applicationData[key] = value;
            }
        }
        
        applicationData.userId = user.uid;
        applicationData.status = 'pending';
        applicationData.submittedAt = new Date();
        
        return window.dhcFirebase.db.collection('renewalApplications').add(applicationData);
    }
    
    return Promise.reject(new Error('Firebase not initialized'));
}

/**
 * 로딩 표시
 */
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div>
            <div class="loading-spinner"></div>
            <div class="loading-text">갱신 신청을 처리하는 중입니다...</div>
        </div>
    `;
    document.body.appendChild(overlay);
}

/**
 * 로딩 숨김
 */
function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * 성공 메시지 표시
 */
function showSuccess(message) {
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    
    document.getElementById('renewal-form').insertBefore(successElement, document.getElementById('renewal-form').firstChild);
    
    setTimeout(() => {
        successElement.remove();
    }, 5000);
}

// 전화번호 자동 포맷팅
document.getElementById('phone').addEventListener('input', function() {
    let value = this.value.replace(/[^0-9]/g, '');
    
    if (value.length >= 4 && value.length <= 7) {
        value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
    } else if (value.length >= 8) {
        value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
    }
    
    this.value = value;
});