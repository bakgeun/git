// course-application.js - 교육 신청 페이지 전용 JavaScript
console.log('=== course-application.js 파일 로드됨 ===');

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        // DOM이 아직 로딩 중이면 이벤트 리스너 등록
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initCourseApplicationPage();
        });
    } else {
        // DOM이 이미 로드된 경우 즉시 실행
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initCourseApplicationPage();
    }
}

// 초기화 시작
initializeWhenReady();

// 페이지 초기화 함수
function initCourseApplicationPage() {
    console.log('=== initCourseApplicationPage 실행 시작 ===');

    // 과정 선택 드롭다운 이벤트
    initCourseSelection();

    // 폼 유효성 검사 초기화
    initFormValidation();

    // 약관 동의 처리
    initAgreementHandling();

    // 폼 제출 처리
    initFormSubmission();

    // 현재 날짜 설정
    setDateLimits();

    // 전화번호 자동 포맷팅
    initPhoneFormatting();

    // URL 파라미터에서 과정 정보 가져오기
    checkUrlParams();

    console.log('=== initCourseApplicationPage 완료 ===');
}

// 과정 선택 드롭다운 초기화
function initCourseSelection() {
    console.log('=== initCourseSelection 시작 ===');
    const courseSelect = document.getElementById('course-select');

    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다!');
        return;
    }

    // 과정 데이터 정의
    const courseData = {
        'health-1': {
            title: '건강운동처방사 과정 1기',
            period: '2025.06.03 ~ 2025.08.23 (12주)',
            price: '350,000원',
            method: '온라인 + 오프라인 병행',
            capacity: '30명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.04.15 ~ 2025.05.25',
            description: '질병 예방과 건강 증진을 위한 맞춤형 운동처방 전문가 양성 과정입니다. 이론 40시간, 실습 20시간으로 구성되어 있으며, 체계적인 교육을 통해 전문적인 지식과 실무 능력을 기를 수 있습니다.'
        },
        'rehab-1': {
            title: '운동재활전문가 과정 1기',
            period: '2025.07.01 ~ 2025.10.18 (16주)',
            price: '420,000원',
            method: '온라인 + 오프라인 병행',
            capacity: '25명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.05.01 ~ 2025.06.20',
            description: '부상 및 질환 이후 효과적인 운동재활 프로그램 설계 및 지도 전문가 양성 과정입니다. 이론 45시간, 실습 30시간으로 구성되어 있으며, 의학적 지식과 운동 요법을 통합한 전문적인 교육을 제공합니다.'
        },
        'pilates-3': {
            title: '필라테스 전문가 과정 3기',
            period: '2025.09.02 ~ 2025.11.22 (12주)',
            price: '480,000원',
            method: '오프라인 집중과정',
            capacity: '20명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.07.15 ~ 2025.08.31',
            description: '과학적 원리 기반의 체계적인 필라테스 실기 및 이론 전문가 양성 과정입니다. 이론 30시간, 실습 60시간으로 구성되어 있으며, 국제 수준의 필라테스 지도자를 육성합니다.'
        },
        'rec-2': {
            title: '레크리에이션지도자 과정 2기',
            period: '2025.06.10 ~ 2025.08.02 (8주)',
            price: '280,000원',
            method: '온라인 + 오프라인 병행',
            capacity: '25명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.04.20 ~ 2025.05.30',
            description: '즐거운 신체활동과 여가생활을 위한 레크리에이션 지도 전문가 양성 과정입니다. 이론 25시간, 실습 20시간으로 구성되어 있으며, 창의적이고 다양한 레크리에이션 프로그램을 기획하고 운영할 수 있는 능력을 기를 수 있습니다.'
        }
    };

    courseSelect.addEventListener('change', function () {
        const selectedValue = this.value;
        const courseInfo = document.getElementById('course-info');

        if (selectedValue && courseData[selectedValue]) {
            const data = courseData[selectedValue];

            // 과정 정보 업데이트
            document.getElementById('course-title').textContent = data.title;
            document.getElementById('course-period').textContent = data.period;
            document.getElementById('course-price').textContent = data.price;
            document.getElementById('course-method').textContent = data.method;
            document.getElementById('course-capacity').textContent = data.capacity;
            document.getElementById('course-location').textContent = data.location;
            document.getElementById('course-apply-period').textContent = data.applyPeriod;
            document.getElementById('course-description').textContent = data.description;

            // 과정 정보 카드 표시
            courseInfo.classList.add('show');
        } else {
            // 기본 상태로 초기화
            document.getElementById('course-title').textContent = '과정을 선택해주세요';
            document.getElementById('course-period').textContent = '-';
            document.getElementById('course-price').textContent = '-';
            document.getElementById('course-method').textContent = '-';
            document.getElementById('course-capacity').textContent = '-';
            document.getElementById('course-location').textContent = '-';
            document.getElementById('course-apply-period').textContent = '-';
            document.getElementById('course-description').textContent = '과정에 대한 상세 정보가 표시됩니다.';

            courseInfo.classList.remove('show');
        }
    });
}

// 폼 유효성 검사 초기화
function initFormValidation() {
    const form = document.getElementById('application-form');
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        // 실시간 유효성 검사
        input.addEventListener('blur', function () {
            validateField(this);
        });

        // 입력 시 오류 메시지 제거
        input.addEventListener('input', function () {
            clearFieldError(this);
        });
    });

    // 이메일 유효성 검사
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('input', function () {
        const email = this.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email && !emailRegex.test(email)) {
            showFieldError(this, '올바른 이메일 형식을 입력해주세요.');
        } else {
            clearFieldError(this);
        }
    });

    // 생년월일 유효성 검사
    const birthInput = document.getElementById('birth');
    birthInput.addEventListener('change', function () {
        const birthDate = new Date(this.value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (age < 18) {
            showFieldError(this, '18세 이상만 지원 가능합니다.');
        } else if (age > 100) {
            showFieldError(this, '올바른 생년월일을 입력해주세요.');
        } else {
            clearFieldError(this);
        }
    });
}

// 약관 동의 처리 초기화
function initAgreementHandling() {
    const agreeAllCheckbox = document.getElementById('agree-all');
    const agreementCheckboxes = document.querySelectorAll('input[type="checkbox"]:not(#agree-all)');

    // 전체 동의 체크박스 처리
    agreeAllCheckbox.addEventListener('change', function () {
        const isChecked = this.checked;

        agreementCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });

    // 개별 체크박스 처리
    agreementCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            // 모든 필수 약관이 체크되었는지 확인
            const requiredCheckboxes = document.querySelectorAll('input[type="checkbox"][required]');
            const allRequiredChecked = Array.from(requiredCheckboxes).every(cb => cb.checked);

            // 모든 약관이 체크되었는지 확인
            const allCheckboxes = Array.from(agreementCheckboxes);
            const allChecked = allCheckboxes.every(cb => cb.checked);

            // 전체 동의 체크박스 상태 업데이트
            agreeAllCheckbox.checked = allChecked;

            // 전체 동의 체크박스 스타일 업데이트 (부분 선택 표시)
            if (allChecked) {
                agreeAllCheckbox.indeterminate = false;
            } else if (allRequiredChecked) {
                agreeAllCheckbox.indeterminate = true;
            } else {
                agreeAllCheckbox.indeterminate = false;
            }
        });
    });
}

// 폼 제출 처리 초기화
function initFormSubmission() {
    const form = document.getElementById('application-form');
    const submitButton = document.getElementById('apply-button');

    form.addEventListener('submit', function (e) {
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
            alert('교육 신청이 완료되었습니다. 담당자 확인 후 개별 연락드리겠습니다.');

            // 결제 페이지로 이동 또는 완료 페이지로 이동
            window.location.href = window.adjustPath('pages/education/payment.html');
        }, 2000);
    });
}

// 폼 데이터 수집
function collectFormData() {
    const form = document.getElementById('application-form');
    const formData = new FormData(form);
    const data = {};

    // FormData를 일반 객체로 변환
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // 선택된 과정 정보 추가
    const courseSelect = document.getElementById('course-select');
    data.course = courseSelect.value;
    data.courseTitle = document.getElementById('course-title').textContent;

    return data;
}

// 폼 유효성 검사
function validateForm() {
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    // 과정 선택 확인
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect.value) {
        showFieldError(courseSelect, '교육 과정을 선택해주세요.');
        isValid = false;
    }

    // 필수 필드 확인
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, '필수 입력 항목입니다.');
            isValid = false;
        }
    });

    // 필수 약관 동의 확인
    const requiredCheckboxes = document.querySelectorAll('input[type="checkbox"][required]');
    requiredCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            showFieldError(checkbox, '필수 약관에 동의해주세요.');
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

// 필드 에러 표시
function showFieldError(field, message) {
    clearFieldError(field);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-red-500 text-sm mt-1';
    errorDiv.textContent = message;

    field.classList.add('error');
    field.parentNode.appendChild(errorDiv);
}

// 필드 에러 제거
function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
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
    }

    clearFieldError(field);
    return true;
}

// 전화번호 자동 포맷팅
function initPhoneFormatting() {
    const phoneInput = document.getElementById('phone');

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
}

// 날짜 제한 설정
function setDateLimits() {
    const birthInput = document.getElementById('birth');
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

    birthInput.max = maxDate.toISOString().split('T')[0];
    birthInput.min = minDate.toISOString().split('T')[0];
}

// URL 파라미터 확인 및 자동 필터링
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get('course');

    if (course) {
        console.log('URL 파라미터로 전달된 과정:', course);

        const courseSelect = document.getElementById('course-select');

        // 건강운동처방사에서 온 경우 해당 과정들만 표시
        if (course.startsWith('health')) {
            filterCoursesByType('health');
        } else if (course.startsWith('rehab')) {
            filterCoursesByType('rehab');
        } else if (course.startsWith('pilates')) {
            filterCoursesByType('pilates');
        } else if (course.startsWith('rec')) {
            filterCoursesByType('recreation');
        }

        // 특정 과정 선택
        courseSelect.value = course;

        // 과정 정보 업데이트 트리거
        const changeEvent = new Event('change');
        courseSelect.dispatchEvent(changeEvent);

        // 페이지 상단으로 부드럽게 스크롤
        setTimeout(() => {
            const courseSelectionSection = document.querySelector('.course-selection-card');
            if (courseSelectionSection) {
                courseSelectionSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);
    }
}

// 자격증 타입별 과정 필터링
function filterCoursesByType(certType) {
    console.log('과정 필터링 시작:', certType);

    const courseSelect = document.getElementById('course-select');
    const options = courseSelect.querySelectorAll('option');

    // 모든 옵션 숨기기
    options.forEach(option => {
        if (option.value === '') return; // 기본 옵션은 유지
        option.style.display = 'none';
        option.disabled = true;
    });

    // 해당 타입의 옵션만 표시
    const filterPatterns = {
        'health': ['health-'],
        'rehab': ['rehab-'],
        'pilates': ['pilates-'],
        'recreation': ['rec-']
    };

    const patterns = filterPatterns[certType] || [];

    options.forEach(option => {
        if (option.value === '') return; // 기본 옵션은 유지

        const shouldShow = patterns.some(pattern => option.value.startsWith(pattern));

        if (shouldShow) {
            option.style.display = 'block';
            option.disabled = false;
        }
    });

    // 필터링 안내 메시지 표시
    const certTypeNames = {
        'health': '건강운동처방사',
        'rehab': '운동재활전문가',
        'pilates': '필라테스 전문가',
        'recreation': '레크리에이션지도자'
    };

    const certTypeName = certTypeNames[certType] || certType;

    // 안내 메시지 요소 생성 또는 업데이트
    let filterNotice = document.getElementById('course-filter-notice');
    if (!filterNotice) {
        filterNotice = document.createElement('div');
        filterNotice.id = 'course-filter-notice';
        filterNotice.className = 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4';

        // 과정 선택 카드 상단에 추가
        const courseCard = document.querySelector('.course-selection-card');
        courseCard.insertBefore(filterNotice, courseCard.firstChild);
    }

    filterNotice.innerHTML = `
        <div class="flex items-center">
            <svg class="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-blue-700 font-medium">${certTypeName} 관련 교육과정만 표시됩니다.</span>
            <button onclick="showAllCourses()" class="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium">전체 과정 보기</button>
        </div>
    `;

    console.log(`${certTypeName} 과정 필터링 완료`);
}

// 전체 과정 보기 함수
function showAllCourses() {
    console.log('전체 과정 보기');

    const courseSelect = document.getElementById('course-select');
    const options = courseSelect.querySelectorAll('option');

    // 모든 옵션 표시
    options.forEach(option => {
        option.style.display = 'block';
        option.disabled = false;
    });

    // 필터링 안내 메시지 제거
    const filterNotice = document.getElementById('course-filter-notice');
    if (filterNotice) {
        filterNotice.remove();
    }

    // URL 파라미터 제거
    const url = new URL(window.location);
    url.searchParams.delete('course');
    window.history.replaceState({}, '', url);

    console.log('전체 과정 표시 완료');
}

// 전역 함수로 등록
window.showAllCourses = showAllCourses;

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
   
   .field-error {
       color: #dc2626;
       font-size: 0.875rem;
       margin-top: 0.25rem;
   }
   
   .form-input.error,
   .form-select.error,
   .form-textarea.error {
       border-color: #dc2626;
       box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
   }
   
   .checkbox-label input[type="checkbox"]:checked {
       background-color: var(--color-primary);
       border-color: var(--color-primary);
   }
   
   .checkbox-label input[type="checkbox"]:indeterminate {
       background-color: var(--color-primary);
       border-color: var(--color-primary);
       background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e");
   }
`;
document.head.appendChild(style);