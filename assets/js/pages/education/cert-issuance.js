// cert-issuance.js - 자격증 발급 페이지 전용 JavaScript
console.log('=== cert-issuance.js 파일 로드됨 ===');

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        // DOM이 아직 로딩 중이면 이벤트 리스너 등록
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initCertIssuancePage();
        });
    } else {
        // DOM이 이미 로드된 경우 즉시 실행
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initCertIssuancePage();
    }
}

// 초기화 시작
initializeWhenReady();

// 페이지 초기화 함수
function initCertIssuancePage() {
    console.log('=== initCertIssuancePage 실행 시작 ===');

    // 로그인 상태 확인
    checkLoginStatus();

    // 발급 가능한 자격증 목록 로드
    loadEligibleCertificates();

    // 파일 업로드 처리
    initFileUpload();

    // 폰 번호 자동 포맷팅
    initPhoneFormatting();

    // 폼 제출 처리
    initFormSubmission();

    // 자격증 선택 처리
    initCertificateSelection();

    console.log('=== initCertIssuancePage 완료 ===');
}

// 로그인 상태 확인
function checkLoginStatus() {
    console.log('=== checkLoginStatus 시작 ===');
    
    // Firebase 인증 상태 확인
    if (window.dhcFirebase && window.dhcFirebase.onAuthStateChanged) {
        window.dhcFirebase.onAuthStateChanged((user) => {
            if (user) {
                console.log('로그인된 사용자:', user.email);
                document.getElementById('login-required').classList.add('hidden');
                loadEligibleCertificates();
            } else {
                console.log('로그인되지 않은 상태');
                document.getElementById('eligible-certificates').classList.add('hidden');
                document.getElementById('login-required').classList.remove('hidden');
                document.getElementById('no-certificates').classList.add('hidden');
            }
        });
    } else {
        // 로컬 테스트 환경에서의 처리
        console.log('Firebase 미초기화 상태, 로컬 테스트 진행');
        // 로컬 테스트용 사용자 상태 시뮬레이션
        const isLoggedIn = localStorage.getItem('testLogin') === 'true';
        
        if (isLoggedIn) {
            document.getElementById('login-required').classList.add('hidden');
            loadEligibleCertificates();
        } else {
            document.getElementById('eligible-certificates').classList.add('hidden');
            document.getElementById('login-required').classList.remove('hidden');
            document.getElementById('no-certificates').classList.add('hidden');
        }
    }
}

// 발급 가능한 자격증 목록 로드
function loadEligibleCertificates() {
    console.log('=== loadEligibleCertificates 시작 ===');
    
    const certificatesContainer = document.getElementById('eligible-certificates');
    
    // 로딩 상태 표시 제거
    certificatesContainer.innerHTML = '';
    
    // 시뮬레이션용 데이터 (실제로는 Firebase에서 가져옴)
    const eligibleCerts = [
        {
            id: 'health-001',
            type: 'health',
            name: '건강운동처방사',
            examDate: '2025-03-15',
            status: '합격',
            score: '85점'
        },
        {
            id: 'pilates-001',
            type: 'pilates',
            name: '필라테스 전문가',
            examDate: '2025-02-20',
            status: '합격',
            score: '92점'
        }
    ];
    
    if (eligibleCerts.length === 0) {
        document.getElementById('no-certificates').classList.remove('hidden');
        return;
    }
    
    // 자격증 목록 표시
    eligibleCerts.forEach(cert => {
        const certElement = createCertificateCard(cert);
        certificatesContainer.appendChild(certElement);
    });
}

// 자격증 카드 생성
function createCertificateCard(cert) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'certificate-card';
    cardDiv.innerHTML = `
        <div class="cert-card-header">
            <h4 class="cert-card-title">${cert.name}</h4>
            <span class="cert-status status-passed">${cert.status}</span>
        </div>
        <div class="cert-card-body">
            <div class="cert-info">
                <span class="cert-label">시험일자:</span>
                <span class="cert-value">${formatDate(cert.examDate)}</span>
            </div>
            <div class="cert-info">
                <span class="cert-label">시험점수:</span>
                <span class="cert-value">${cert.score}</span>
            </div>
        </div>
        <div class="cert-card-footer">
            <button type="button" class="btn-primary" onclick="selectCertificate('${cert.id}', '${cert.type}', '${cert.name}', '${cert.examDate}')">
                발급 신청하기
            </button>
        </div>
    `;
    
    return cardDiv;
}

// 자격증 선택 처리
function selectCertificate(examId, certType, certName, examDate) {
    console.log('자격증 선택:', { examId, certType, certName, examDate });
    
    // 선택된 자격증 정보를 폼에 설정
    document.getElementById('cert-type').value = certType;
    document.getElementById('exam-date').value = formatDate(examDate);
    document.getElementById('exam-id').value = examId;
    
    // 폼 표시
    document.getElementById('certificate-form').classList.remove('hidden');
    
    // 폼으로 스크롤
    document.getElementById('certificate-form').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// 파일 업로드 처리 초기화
function initFileUpload() {
    const fileInput = document.getElementById('photo');
    const dropZone = document.querySelector('.file-drop-zone');
    const previewArea = document.querySelector('.file-preview');
    const previewImage = document.getElementById('preview-image');
    const removeButton = document.querySelector('.remove-file');
    
    // 파일 선택 이벤트
    fileInput.addEventListener('change', handleFileSelect);
    
    // 드래그 앤 드롭 이벤트
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleFileDrop);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    
    // 파일 제거 버튼
    removeButton.addEventListener('click', removeFile);
    
    // 드롭존 클릭 시 파일 선택창 열기
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
}

// 파일 선택 처리
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndPreviewFile(file);
    }
}

// 드래그 오버 처리
function handleDragOver(event) {
    event.preventDefault();
}

// 드래그 엔터 처리
function handleDragEnter(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

// 드래그 리브 처리
function handleDragLeave(event) {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget)) {
        event.currentTarget.classList.remove('drag-over');
    }
}

// 파일 드롭 처리
function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        validateAndPreviewFile(files[0]);
    }
}

// 파일 유효성 검사 및 미리보기
function validateAndPreviewFile(file) {
    // 파일 타입 검사
    if (!file.type.match('image.*')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }
    
    // 파일 크기 검사 (3MB)
    if (file.size > 3 * 1024 * 1024) {
        alert('파일 크기는 3MB 이하만 가능합니다.');
        return;
    }
    
    // 파일 읽기 및 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImage = document.getElementById('preview-image');
        const dropZone = document.querySelector('.file-drop-zone');
        const previewArea = document.querySelector('.file-preview');
        
        previewImage.src = e.target.result;
        dropZone.classList.add('hidden');
        previewArea.classList.remove('hidden');
    };
    
    reader.readAsDataURL(file);
}

// 파일 제거
function removeFile() {
    const fileInput = document.getElementById('photo');
    const dropZone = document.querySelector('.file-drop-zone');
    const previewArea = document.querySelector('.file-preview');
    const previewImage = document.getElementById('preview-image');
    
    fileInput.value = '';
    previewImage.src = '';
    previewArea.classList.add('hidden');
    dropZone.classList.remove('hidden');
}

// 전화번호 자동 포맷팅
function initPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    
    phoneInput.addEventListener('input', function() {
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
}

// 자격증 선택 처리 초기화
function initCertificateSelection() {
    // 자격증 카드 클릭 시 선택 처리는 이미 구현됨
    console.log('자격증 선택 처리 초기화 완료');
}

// 폼 제출 처리 초기화
function initFormSubmission() {
    const form = document.getElementById('issuance-form');
    const submitButton = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 유효성 검사
        if (!validateForm()) {
            return;
        }
        
        // 로딩 상태 표시
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> 신청 중...';
        
        try {
            // 폼 데이터 수집
            const formData = collectFormData();
            
            // 파일 업로드 처리
            const photoFile = document.getElementById('photo').files[0];
            if (photoFile) {
                formData.photo = await uploadPhoto(photoFile);
            }
            
            // 신청 정보 저장
            const applicationId = await submitApplication(formData);
            
            // 결제 페이지로 이동
            const certType = document.getElementById('cert-type').value;
            const paymentAmount = getCertificateFee(certType);
            
            const paymentParams = new URLSearchParams({
                product: `자격증 발급 - ${formData.certName}`,
                name: formData.name,
                email: formData.email || 'temp@example.com',
                phone: formData.phone,
                price: `₩${paymentAmount.toLocaleString()}`
            });
            
            window.location.href = window.adjustPath(`pages/education/payment.html?${paymentParams.toString()}`);
            
        } catch (error) {
            console.error('신청 처리 중 오류:', error);
            alert('신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            // 로딩 상태 해제
            submitButton.disabled = false;
            submitButton.innerHTML = '자격증 발급 신청';
        }
    });
}

// 폼 유효성 검사
function validateForm() {
    const requiredFields = ['cert-type', 'name', 'phone', 'address', 'photo'];
    
    for (let fieldName of requiredFields) {
        const field = document.getElementById(fieldName);
        
        if (!field.value && fieldName !== 'photo') {
            alert(`${field.labels[0].textContent}을(를) 입력해주세요.`);
            field.focus();
            return false;
        }
        
        if (fieldName === 'photo' && !field.files[0]) {
            alert('증명사진을 업로드해주세요.');
            return false;
        }
    }
    
    // 체크박스 확인
    const agreeCheckbox = document.getElementById('agree-terms');
    if (!agreeCheckbox.checked) {
        alert('약관에 동의해주세요.');
        agreeCheckbox.focus();
        return false;
    }
    
    return true;
}

// 폼 데이터 수집
function collectFormData() {
    return {
        examId: document.getElementById('exam-id').value,
        certType: document.getElementById('cert-type').value,
        certName: document.getElementById('cert-type').options[document.getElementById('cert-type').selectedIndex].text,
        examDate: document.getElementById('exam-date').value,
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        email: getCurrentUserEmail() // 실제로는 현재 로그인한 사용자의 이메일
    };
}

// 증명사진 업로드
function uploadPhoto(file) {
    return new Promise((resolve, reject) => {
        // 실제로는 Firebase Storage에 업로드
        // 시뮬레이션용 코드
        setTimeout(() => {
            const photoUrl = URL.createObjectURL(file);
            resolve(photoUrl);
        }, 1000);
    });
}

// 신청 정보 저장
function submitApplication(data) {
    return new Promise((resolve, reject) => {
        // 실제로는 Firebase Firestore에 저장
        // 시뮬레이션용 코드
        setTimeout(() => {
            const applicationId = 'APP' + Date.now();
            console.log('신청 정보 저장:', data);
            resolve(applicationId);
        }, 500);
    });
}

// 자격증 발급 비용 조회
function getCertificateFee(certType) {
    const fees = {
        'health': 30000,
        'rehab': 35000,
        'pilates': 30000,
        'rec': 25000
    };
    
    return fees[certType] || 30000;
}

// 현재 로그인한 사용자 이메일 가져오기
function getCurrentUserEmail() {
    // 실제로는 Firebase에서 현재 사용자 정보 가져옴
    if (window.dhcFirebase && window.dhcFirebase.getCurrentUser) {
        const user = window.dhcFirebase.getCurrentUser();
        return user ? user.email : null;
    }
    
    // 로컬 테스트용
    return 'test@example.com';
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid #ffffff40;
        border-radius: 50%;
        border-top-color: #ffffff;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { 
            transform: rotate(360deg);
        }
    }
    
    .drag-over {
        background-color: var(--color-primary-light) !important;
        border-color: var(--color-primary) !important;
        transform: scale(1.02);
    }
    
    .certificate-card {
        background: white;
        border-radius: var(--border-radius);
        border: 2px solid var(--color-gray-200);
        padding: 1.5rem;
        margin-bottom: 1rem;
        transition: var(--transition);
    }
    
    .certificate-card:hover {
        border-color: var(--color-primary);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .cert-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .cert-card-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-gray-800);
    }
    
    .cert-status {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
    }
    
    .status-passed {
        background: var(--color-secondary-light);
        color: var(--color-secondary);
    }
    
    .cert-card-body {
        margin-bottom: 1.5rem;
    }
    
    .cert-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }
    
    .cert-label {
        color: var(--color-gray-600);
        font-weight: 500;
    }
    
    .cert-value {
        color: var(--color-gray-800);
        font-weight: 600;
    }
    
    .cert-card-footer {
        text-align: center;
    }
    
    .loading-skeleton {
        animation: pulse 1.5s ease-in-out infinite;
    }
    
    .skeleton-item {
        height: 120px;
        background: var(--color-gray-200);
        border-radius: var(--border-radius);
        margin-bottom: 1rem;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .file-upload-area {
        position: relative;
    }
    
    .file-drop-zone {
        border: 2px dashed var(--color-gray-300);
        border-radius: var(--border-radius);
        padding: 2rem;
        text-align: center;
        background: var(--color-gray-50);
        cursor: pointer;
        transition: var(--transition);
    }
    
    .file-drop-zone:hover {
        border-color: var(--color-primary);
        background: var(--color-primary-light);
    }
    
    .upload-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .upload-text {
        font-weight: 600;
        color: var(--color-gray-700);
        margin-bottom: 0.5rem;
    }
    
    .upload-description {
        font-size: 0.875rem;
        color: var(--color-gray-600);
        line-height: 1.5;
    }
    
    .file-preview {
        position: relative;
        background: white;
        border-radius: var(--border-radius);
        padding: 1rem;
        border: 2px solid var(--color-primary);
    }
    
    .file-preview img {
        max-width: 200px;
        max-height: 200px;
        border-radius: var(--border-radius);
        margin: 0 auto;
        display: block;
    }
    
    .remove-file {
        position: absolute;
        top: -10px;
        right: -10px;
        background: var(--color-accent);
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 1.5rem;
        cursor: pointer;
        transition: var(--transition);
    }
    
    .remove-file:hover {
        background: var(--color-accent-dark);
        transform: scale(1.1);
    }
    
    .login-prompt {
        text-align: center;
        padding: 3rem;
        background: var(--color-gray-50);
        border-radius: var(--border-radius);
    }
    
    .prompt-content {
        max-width: 400px;
        margin: 0 auto;
    }
    
    .prompt-content p {
        color: var(--color-gray-600);
        margin-bottom: 1.5rem;
        font-size: 1.125rem;
    }
    
    .no-data-message {
        text-align: center;
        padding: 3rem;
        background: var(--color-gray-50);
        border-radius: var(--border-radius);
    }
    
    .no-data-content {
        max-width: 400px;
        margin: 0 auto;
    }
    
    .no-data-content p {
        color: var(--color-gray-600);
        margin-bottom: 1.5rem;
        font-size: 1.125rem;
        line-height: 1.6;
    }
`;
document.head.appendChild(style);

console.log('=== cert-issuance.js 로드 완료 ===');