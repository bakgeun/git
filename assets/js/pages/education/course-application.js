// course-application.js - 통합된 교육 과정 페이지 JavaScript (완전판)
console.log('=== 통합된 course-application.js 파일 로드됨 ===');

// DOM이 이미 로드된 경우와 로딩 중인 경우 모두 처리
function initializeWhenReady() {
    console.log('=== 초기화 준비, 현재 상태:', document.readyState);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            console.log('=== DOMContentLoaded 이벤트 발생 ===');
            initCourseApplicationPage();
        });
    } else {
        console.log('=== DOM 이미 로드됨, 즉시 초기화 ===');
        initCourseApplicationPage();
    }
}

// 초기화 시작
initializeWhenReady();

// 페이지 초기화 함수 (통합 - 결제 기능 포함)
function initCourseApplicationPage() {
    console.log('=== initCourseApplicationPage 실행 시작 (결제 통합) ===');

    // course-info.js 기능들
    initScrollAnimations();
    initScheduleTable();
    initSmoothScroll();

    // course-application.js 기능들 (수정됨)
    initCourseSelection();
    initFormValidation();
    initAgreementHandling();
    initFormSubmission(); // 결제 통합 버전
    initPhoneFormatting();
    initEmailValidation();
    
    // 결제 관련 새 기능들
    initPaymentMethods();
    initModalHandling();
    initTossPayments();
    
    // URL 파라미터 및 자동 선택 기능
    initAutoSelection();

    console.log('=== initCourseApplicationPage 완료 (결제 통합) ===');
}

// =================================
// 2. 스크롤 애니메이션 (course-info.js에서)
// =================================
function initScrollAnimations() {
    if (window.innerWidth <= 768) {
        console.log('모바일 화면에서 스크롤 애니메이션 비활성화');
        return;
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('fade-out');
                entry.target.classList.add('fade-in');
                
                if (entry.target.classList.contains('statistics-item')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);
    
    const animateElements = document.querySelectorAll(
        '.education-feature-card, .course-card, .process-step, .benefit-card, .statistics-item'
    );
    
    if (animateElements.length > 0) {
        animateElements.forEach(el => {
            el.style.opacity = '0.3';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// =================================
// 3. 교육 일정 테이블 기능
// =================================
function initScheduleTable() {
    console.log('=== initScheduleTable 시작 ===');
    const scheduleRows = document.querySelectorAll('.schedule-row');
    
    if (scheduleRows.length === 0) {
        console.log('교육 일정 테이블이 없습니다. 건너뜀.');
        return;
    }
    
    scheduleRows.forEach(row => {
        // 호버 효과
        row.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) {
                row.style.transform = 'translateX(4px)';
                row.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                row.style.transition = 'all 0.3s ease';
            }
        });
        
        row.addEventListener('mouseleave', function() {
            row.style.transform = 'translateX(0)';
            row.style.boxShadow = 'none';
        });

        // 신청하기 버튼 클릭 이벤트 추가
        const applyBtn = row.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 과정명에서 자격증 타입 추출
                const courseName = row.querySelector('.course-name').textContent.trim();
                console.log('선택된 과정명:', courseName);
                
                // 과정명과 기수 정보로 자동 선택
                const courseCell = row.cells;
                const period = courseCell[1].textContent.trim(); // 기수 정보
                
                // 자동 선택 및 스크롤
                selectCourseByNameAndPeriod(courseName, period);
                scrollToCourseSelection();
            });
        }
    });
    
    // 모바일에서 테이블 스크롤 힌트
    const tableWrapper = document.querySelector('.schedule-table-wrapper');
    if (tableWrapper && window.innerWidth < 768) {
        addScrollHint(tableWrapper);
    }
    
    console.log('=== initScheduleTable 완료 ===');
}

// =================================
// 4. 부드러운 스크롤 기능
// =================================
function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = link.getAttribute('href');
            
            if (href === '#' || href === '#top') {
                return;
            }
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 100;
                
                window.scrollTo({
                    top: Math.max(0, offsetTop),
                    behavior: 'smooth'
                });
            }
        });
    });
}

// =================================
// 5. 과정 선택 드롭다운
// =================================
function initCourseSelection() {
    console.log('=== initCourseSelection 시작 ===');
    const courseSelect = document.getElementById('course-select');

    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다!');
        return;
    }

    // 과정 데이터 정의 (확장됨)
    const courseData = {
        'health-1': {
            title: '건강운동처방사 과정 1기',
            period: '2025.06.01 ~ 2025.08.16 (12주)',
            price: '350,000원',
            method: '온라인 + 오프라인 병행',
            capacity: '30명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.04.15 ~ 2025.05.25',
            description: '질병 예방과 건강 증진을 위한 맞춤형 운동처방 전문가 양성 과정입니다. 이론 40시간, 실습 20시간으로 구성되어 있으며, 체계적인 교육을 통해 전문적인 지식과 실무 능력을 기를 수 있습니다.',
            courseName: '건강운동처방사',
            coursePeriod: '25년 상반기'
        },
        'health-2': {
            title: '건강운동처방사 과정 2기',
            period: '2025.10.01 ~ 2025.12.16 (12주)',
            price: '350,000원',
            method: '온라인 + 오프라인 병행',
            capacity: '30명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.08.15 ~ 2025.09.25',
            description: '질병 예방과 건강 증진을 위한 맞춤형 운동처방 전문가 양성 과정입니다.',
            courseName: '건강운동처방사',
            coursePeriod: '25년 하반기'
        },
        'rehab-1': {
            title: '운동재활전문가 과정 1기',
            period: '2025.07.01 ~ 2025.10.18 (16주)',
            price: '420,000원',
            method: '온라인 + 오프라인 병행',
            capacity: '25명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.05.01 ~ 2025.06.20',
            description: '부상 및 질환 이후 효과적인 운동재활 프로그램 설계 및 지도 전문가 양성 과정입니다.',
            courseName: '운동재활전문가',
            coursePeriod: '25년 상반기'
        },
        'pilates-2': {
            title: '필라테스 전문가 과정 2기',
            period: '2025.05.20 ~ 2025.08.10 (12주)',
            price: '480,000원',
            method: '오프라인 집중과정',
            capacity: '20명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.04.01 ~ 2025.05.10',
            description: '과학적 원리 기반의 체계적인 필라테스 실기 및 이론 전문가 양성 과정입니다.',
            courseName: '필라테스 전문가',
            coursePeriod: '25년 2기'
        },
        'pilates-3': {
            title: '필라테스 전문가 과정 3기',
            period: '2025.09.15 ~ 2025.12.20 (12주)',
            price: '480,000원',
            method: '오프라인 집중과정',
            capacity: '20명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.07.15 ~ 2025.08.31',
            description: '과학적 원리 기반의 체계적인 필라테스 실기 및 이론 전문가 양성 과정입니다.',
            courseName: '필라테스 전문가',
            coursePeriod: '25년 3기'
        },
        'rec-1': {
            title: '레크리에이션지도자 과정 1기',
            period: '2025.06.10 ~ 2025.07.25 (8주)',
            price: '280,000원',
            method: '온라인 + 오프라인 병행',
            capacity: '25명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.04.20 ~ 2025.05.30',
            description: '즐거운 신체활동과 여가생활을 위한 레크리에이션 지도 전문가 양성 과정입니다.',
            courseName: '레크리에이션지도자',
            coursePeriod: '25년 상반기'
        },
        'rec-2': {
            title: '레크리에이션지도자 과정 2기',
            period: '2025.10.15 ~ 2025.11.30 (8주)',
            price: '280,000원',
            method: '온라인 + 오프라인 병행',
            capacity: '25명',
            location: '서울 강남구 센터',
            applyPeriod: '2025.08.15 ~ 2025.09.30',
            description: '즐거운 신체활동과 여가생활을 위한 레크리에이션 지도 전문가 양성 과정입니다.',
            courseName: '레크리에이션지도자',
            coursePeriod: '25년 하반기'
        }
    };

    // 전역에서 접근 가능하도록 저장
    window.courseData = courseData;

    courseSelect.addEventListener('change', function () {
        updateCourseInfo(this.value, courseData);
    });
}

// 과정 정보 업데이트 함수 (결제 정보 포함)
function updateCourseInfo(selectedValue, courseData) {
    console.log('=== updateCourseInfo 시작 (결제 정보 포함) ===');
    
    const courseInfo = document.getElementById('course-info');
    
    if (selectedValue && courseData[selectedValue]) {
        const data = courseData[selectedValue];

        // 기존 과정 정보 업데이트
        document.getElementById('course-title').textContent = data.title;
        document.getElementById('course-period').textContent = data.period;
        document.getElementById('course-price').textContent = data.price;
        document.getElementById('course-method').textContent = data.method;
        document.getElementById('course-capacity').textContent = data.capacity;
        document.getElementById('course-location').textContent = data.location;
        document.getElementById('course-apply-period').textContent = data.applyPeriod;
        document.getElementById('course-description').textContent = data.description;

        // 결제 정보 카드 업데이트 (새로 추가)
        const selectedCourseName = document.getElementById('selected-course-name');
        const selectedCoursePeriod = document.getElementById('selected-course-period');
        const selectedCoursePrice = document.getElementById('selected-course-price');
        const finalPaymentAmount = document.getElementById('final-payment-amount');
        
        if (selectedCourseName) selectedCourseName.textContent = data.title;
        if (selectedCoursePeriod) selectedCoursePeriod.textContent = data.period;
        if (selectedCoursePrice) selectedCoursePrice.textContent = data.price;
        if (finalPaymentAmount) finalPaymentAmount.textContent = data.price;

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

        // 결제 정보도 초기화
        const selectedCourseName = document.getElementById('selected-course-name');
        const selectedCoursePeriod = document.getElementById('selected-course-period');
        const selectedCoursePrice = document.getElementById('selected-course-price');
        const finalPaymentAmount = document.getElementById('final-payment-amount');
        
        if (selectedCourseName) selectedCourseName.textContent = '과정을 먼저 선택해주세요';
        if (selectedCoursePeriod) selectedCoursePeriod.textContent = '-';
        if (selectedCoursePrice) selectedCoursePrice.textContent = '-';
        if (finalPaymentAmount) finalPaymentAmount.textContent = '₩0';

        courseInfo.classList.remove('show');
    }
    
    console.log('=== updateCourseInfo 완료 (결제 정보 포함) ===');
}

// =================================
// 6. 자동 선택 기능
// =================================
function initAutoSelection() {
    console.log('=== initAutoSelection 시작 ===');
    
    // URL 파라미터 확인
    checkUrlParams();
    
    console.log('=== initAutoSelection 완료 ===');
}

// URL 파라미터 확인 및 자동 선택 (수정된 버전)
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get('course');
    const from = urlParams.get('from');

    console.log('URL 파라미터 - course:', course, 'from:', from);

    if (course) {
        // 직접 과정 ID가 전달된 경우 (자격증 페이지에서 온 경우)
        selectCourseDirectly(course);
    }
}

// 직접 과정 선택 함수 (새로 추가)
function selectCourseDirectly(courseId) {
    console.log('직접 과정 선택:', courseId);
    
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다!');
        return;
    }

    // courseData에 해당 과정이 있는지 확인
    if (window.courseData && window.courseData[courseId]) {
        console.log('과정 데이터 찾음:', courseId);
        
        // 과정 선택
        courseSelect.value = courseId;
        
        // 과정 정보 업데이트
        updateCourseInfo(courseId, window.courseData);
        
        // 과정 선택 섹션으로 스크롤
        setTimeout(() => {
            scrollToCourseSelection();
        }, 500);
        
        console.log(`✅ ${courseId} 직접 선택 완료`);
    } else {
        console.error('❌ 해당 과정을 찾을 수 없습니다:', courseId);
        console.log('사용 가능한 과정들:', Object.keys(window.courseData || {}));
    }
}

// 직접 과정 선택 함수 (새로 추가)
function selectCourseDirectly(courseId) {
    console.log('직접 과정 선택:', courseId);
    
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다!');
        return;
    }

    // courseData에 해당 과정이 있는지 확인
    if (window.courseData && window.courseData[courseId]) {
        console.log('과정 데이터 찾음:', courseId);
        
        // 과정 선택
        courseSelect.value = courseId;
        
        // 과정 정보 업데이트
        updateCourseInfo(courseId, window.courseData);
        
        // 과정 선택 섹션으로 스크롤
        setTimeout(() => {
            scrollToCourseSelection();
        }, 500);
        
        console.log(`✅ ${courseId} 직접 선택 완료`);
    } else {
        console.error('❌ 해당 과정을 찾을 수 없습니다:', courseId);
        console.log('사용 가능한 과정들:', Object.keys(window.courseData || {}));
    }
}

// 기존 selectCourseFromCertificate 함수는 유지 (다른 방식으로 올 경우 대비)
function selectCourseFromCertificate(certType) {
    console.log('자격증 페이지에서 자동 선택 (구 방식):', certType);
    
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) return;

    // 자격증 타입에 따른 첫 번째 모집중 과정 찾기
    const courseMapping = {
        'health-exercise': ['health-1', 'health-2'],
        'rehabilitation': ['rehab-1'],
        'pilates': ['pilates-3'], // pilates-2는 마감
        'recreation': ['rec-1', 'rec-2']
    };

    const availableCourses = courseMapping[certType] || [];
    
    if (availableCourses.length > 0) {
        // 첫 번째 모집중인 과정 선택
        const targetCourse = availableCourses[0];
        
        // 직접 선택 함수 호출
        selectCourseDirectly(targetCourse);
    }
}

// 자격증 페이지에서 온 경우 자동 선택
function selectCourseFromCertificate(certType) {
    console.log('자격증 페이지에서 자동 선택:', certType);
    
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) return;

    // 자격증 타입에 따른 첫 번째 모집중 과정 찾기
    const courseMapping = {
        'health-exercise': ['health-1', 'health-2'],
        'rehabilitation': ['rehab-1'],
        'pilates': ['pilates-3'], // pilates-2는 마감
        'recreation': ['rec-1', 'rec-2']
    };

    const availableCourses = courseMapping[certType] || [];
    
    if (availableCourses.length > 0) {
        // 첫 번째 모집중인 과정 선택
        const targetCourse = availableCourses[0];
        
        // 과정 선택
        courseSelect.value = targetCourse;
        
        // 과정 정보 업데이트
        const changeEvent = new Event('change');
        courseSelect.dispatchEvent(changeEvent);
        
        // 과정 선택 섹션으로 스크롤
        setTimeout(() => {
            scrollToCourseSelection();
        }, 500);
        
        console.log(`${certType} -> ${targetCourse} 자동 선택 완료`);
    }
}

// 과정명과 기수로 자동 선택하는 함수
function selectCourseByNameAndPeriod(courseName, period) {
    console.log('=== selectCourseByNameAndPeriod 시작 ===');
    console.log('과정명:', courseName);
    console.log('기수:', period);
    
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) {
        console.error('course-select 요소를 찾을 수 없습니다!');
        return;
    }

    if (!window.courseData) {
        console.error('courseData가 없습니다!');
        return;
    }

    // courseData에서 매칭되는 과정 찾기
    let targetCourseId = null;
    
    console.log('=== courseData 검색 시작 ===');
    Object.keys(window.courseData).forEach(courseId => {
        const courseInfo = window.courseData[courseId];
        console.log(`검사 중: ${courseId}`, {
            courseName: courseInfo.courseName,
            coursePeriod: courseInfo.coursePeriod,
            matches: (courseInfo.courseName === courseName && courseInfo.coursePeriod === period)
        });
        
        if (courseInfo.courseName === courseName && courseInfo.coursePeriod === period) {
            targetCourseId = courseId;
            console.log('매칭 찾음!', targetCourseId);
        }
    });

    if (targetCourseId) {
        console.log('=== 과정 선택 시도 ===');
        console.log('대상 과정 ID:', targetCourseId);
        
        // 드롭다운에 해당 옵션이 있는지 확인
        const targetOption = courseSelect.querySelector(`option[value="${targetCourseId}"]`);
        if (!targetOption) {
            console.error(`드롭다운에 ${targetCourseId} 옵션이 없습니다!`);
            console.log('사용 가능한 옵션들:');
            courseSelect.querySelectorAll('option').forEach(option => {
                console.log('- value:', option.value, 'text:', option.textContent);
            });
            return;
        }
        
        // 과정 선택
        courseSelect.value = targetCourseId;
        console.log('드롭다운 값 설정:', courseSelect.value);
        
        // 과정 정보 업데이트
        updateCourseInfo(targetCourseId, window.courseData);
        
        // 선택 확인
        console.log('최종 선택된 값:', courseSelect.value);
        console.log('선택된 옵션 텍스트:', courseSelect.options[courseSelect.selectedIndex].textContent);
        
        console.log(`✅ ${courseName} ${period} -> ${targetCourseId} 자동 선택 완료`);
    } else {
        console.error('❌ 매칭되는 과정을 찾을 수 없습니다.');
        console.log('검색 조건:', { courseName, period });
        console.log('사용 가능한 과정들:');
        Object.keys(window.courseData).forEach(courseId => {
            const courseInfo = window.courseData[courseId];
            console.log(`- ${courseId}: ${courseInfo.courseName} ${courseInfo.coursePeriod}`);
        });
    }
    
    console.log('=== selectCourseByNameAndPeriod 완료 ===');
}

// 교육 과정 선택 섹션으로 스크롤
function scrollToCourseSelection() {
    const courseSelectionSection = document.getElementById('course-selection');
    if (courseSelectionSection) {
        courseSelectionSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// =================================
// 7. 폼 관련 기능들
// =================================

// 폼 유효성 검사 초기화
function initFormValidation() {
    console.log('=== initFormValidation 시작 ===');
    const form = document.getElementById('application-form');
    if (!form) {
        console.log('application-form을 찾을 수 없습니다.');
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

// 폼 제출 처리 초기화 (결제 통합 버전)
function initFormSubmission() {
    console.log('=== initFormSubmission 시작 (결제 통합) ===');
    const form = document.getElementById('application-form');
    const submitButton = document.getElementById('apply-button');

    if (!form || !submitButton) {
        console.log('폼 또는 제출 버튼을 찾을 수 없습니다.');
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('폼 제출 시도 (신청 + 결제)');

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

// =================================
// 8. 입력 필드 검증 및 포맷팅
// =================================

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

// 이메일 검증 초기화
function initEmailValidation() {
    console.log('=== initEmailValidation 시작 ===');
    const emailInput = document.getElementById('email');
    if (!emailInput) {
        console.log('email 입력 필드를 찾을 수 없습니다.');
        return;
    }

    emailInput.addEventListener('blur', function() {
        validateEmailField(this);
    });
    
    emailInput.addEventListener('input', function() {
        clearFieldError(this);
    });
    
    console.log('=== initEmailValidation 완료 ===');
}

// =================================
// 9. 결제 관련 기능들 (새로 추가)
// =================================

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

// 토스페이먼트 결제 처리
function processCardPayment(formData) {
    console.log('=== 토스페이먼트 결제 처리 시작 ===');
    
    // 토스페이먼트 연동을 위한 결제 정보 준비
    const paymentData = {
        amount: parseInt(formData.coursePrice.replace(/[^\d]/g, '')), // 숫자만 추출
        orderId: 'ORDER_' + Date.now(), // 주문 ID 생성
        orderName: formData.courseTitle,
        customerName: formData['applicant-name'],
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
        orderId: 'BANK_' + Date.now(),
        method: 'bank',
        amount: formData.coursePrice,
        customerName: formData['applicant-name'],
        depositorName: formData['bank-depositor'] || formData['applicant-name'],
        course: formData.courseTitle
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
        successDescription.innerHTML = '입금 계좌 정보를 확인하시고 입금해주세요.<br>입금 확인 후 수강이 승인됩니다.';
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
            name: document.getElementById('applicant-name')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || ''
        },
        course: {
            id: document.getElementById('course-select')?.value || '',
            title: document.getElementById('course-title')?.textContent || '',
            price: document.getElementById('course-price')?.textContent || ''
        }
    };
    
    // 로컬 스토리지에 임시 저장 (개발용)
    const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    existingPayments.push(paymentData);
    localStorage.setItem('payments', JSON.stringify(existingPayments));
    
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

// =================================
// 10. 유틸리티 함수들
// =================================

// 폼 데이터 수집 (결제 정보 포함)
function collectFormData() {
    const form = document.getElementById('application-form');
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // 과정 정보 추가
    const courseSelect = document.getElementById('course-select');
    if (courseSelect) {
        data.course = courseSelect.value;
        data.courseTitle = document.getElementById('course-title')?.textContent || '';
        data.coursePrice = document.getElementById('course-price')?.textContent || '';
        data.coursePeriod = document.getElementById('course-period')?.textContent || '';
    }

    // 결제 방법 정보 추가
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
    data.paymentMethod = selectedPaymentMethod ? selectedPaymentMethod.value : '';

    return data;
}

// 폼 유효성 검사 (결제 관련 검증 추가)
function validateForm() {
    console.log('=== validateForm 시작 (결제 포함) ===');
    let isValid = true;

    // 과정 선택 확인
    const courseSelect = document.getElementById('course-select');
    if (!courseSelect || !courseSelect.value) {
        if (courseSelect) {
            showFieldError(courseSelect, '교육 과정을 선택해주세요.');
        }
        isValid = false;
    }

    // 필수 입력 필드 확인
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    console.log('필수 필드 개수:', requiredFields.length);
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, '필수 입력 항목입니다.');
            isValid = false;
        } else {
            // 개별 필드 검증
            if (!validateField(field)) {
                isValid = false;
            }
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
        
        // 입금자명이 입력되었을 때만 유효성 검사 (선택사항이므로)
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

    console.log('폼 검증 결과 (결제 포함):', isValid);
    return isValid;
}

// 필드 에러 표시/제거
function showFieldError(field, message) {
    if (!field) return;
    
    clearFieldError(field);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-red-500 text-sm mt-1';
    errorDiv.textContent = message;

    field.classList.add('error');
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    if (!field) return;
    
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// 개별 필드 검증
function validateField(field) {
    if (!field) return false;
    
    const value = field.value.trim();

    // 필수 필드 확인
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, '필수 입력 항목입니다.');
        return false;
    }

    // 이름 검증
    if (field.id === 'applicant-name') {
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
        return validateEmailField(field);
    }

    clearFieldError(field);
    return true;
}

// 이메일 필드 검증
function validateEmailField(field) {
    if (!field) return false;
    
    const value = field.value.trim();
    
    if (!value && field.hasAttribute('required')) {
        showFieldError(field, '이메일 주소를 입력해주세요.');
        return false;
    }
    
    if (value) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, '올바른 이메일 형식을 입력해주세요. (예: example@email.com)');
            return false;
        }
        
        // 이메일 길이 제한 (일반적으로 320자)
        if (value.length > 320) {
            showFieldError(field, '이메일 주소가 너무 깁니다.');
            return false;
        }
    }
    
    clearFieldError(field);
    return true;
}

// =================================
// 11. 기타 유틸리티 함수들
// =================================

// 카운터 애니메이션
function animateCounter(element) {
    const target = parseInt(element.dataset.count) || 0;
    if (target === 0) return;
    
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const counter = () => {
        current += step;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(counter);
        } else {
            element.textContent = target;
        }
    };
    
    counter();
}

// 스크롤 힌트 추가 (모바일)
function addScrollHint(wrapper) {
    if (wrapper.querySelector('.scroll-hint')) {
        return;
    }
    
    const hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.textContent = '← 좌우로 스크롤하세요 →';
    hint.style.cssText = `
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        color: #666;
        animation: blink 2s infinite;
        z-index: 10;
    `;
    
    wrapper.style.position = 'relative';
    wrapper.appendChild(hint);
    
    let scrollTimeout;
    wrapper.addEventListener('scroll', () => {
        hint.style.opacity = '0.3';
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            hint.style.opacity = '1';
        }, 1000);
    });
}

// =================================
// 12. 전역 함수들 (자격증 페이지에서 호출용)
// =================================

// 자격증 페이지에서 교육 신청 버튼 클릭 시 호출되는 함수
window.applyForCourse = function(certType) {
    console.log('자격증 페이지에서 교육 신청:', certType);
    
    // 교육 신청 페이지로 이동하면서 파라미터 전달
    const targetUrl = window.adjustPath(`pages/education/course-application.html?course=${certType}&from=certificate`);
    window.location.href = targetUrl;
};

// 교육 일정에서 특정 과정 신청하기 (전역 함수)
window.applyForSpecificCourse = function(courseName, period) {
    console.log('특정 과정 신청:', courseName, period);
    
    // 같은 페이지 내에서 자동 선택 후 스크롤
    selectCourseByNameAndPeriod(courseName, period);
    scrollToCourseSelection();
};

// 전체 과정 보기 함수 (전역)
window.showAllCourses = function() {
    console.log('전체 과정 보기');

    const courseSelect = document.getElementById('course-select');
    if (!courseSelect) return;
    
    const options = courseSelect.querySelectorAll('option');

    options.forEach(option => {
        option.style.display = 'block';
        option.disabled = false;
    });

    const filterNotice = document.getElementById('course-filter-notice');
    if (filterNotice) {
        filterNotice.remove();
    }

    const url = new URL(window.location);
    url.searchParams.delete('course');
    window.history.replaceState({}, '', url);

    console.log('전체 과정 표시 완료');
};

// =================================
// 13. 교육과정 페이지 특화 기능들
// =================================

const CourseInfoPage = {
    // 교육 신청 관련 기능
    handleCourseApplication: function(courseId) {
        if (!this.isLoggedIn()) {
            this.showLoginModal();
            return;
        }
        
        window.location.href = window.adjustPath(`pages/education/course-application.html?course=${courseId}`);
    },
    
    // 로그인 상태 확인
    isLoggedIn: function() {
        if (window.dhcFirebase && window.dhcFirebase.getCurrentUser) {
            return !!window.dhcFirebase.getCurrentUser();
        }
        return !!sessionStorage.getItem('user');
    },
    
    // 로그인 모달 표시
    showLoginModal: function() {
        // showToast 함수가 있다면 사용, 없으면 기본 alert 사용
        if (typeof showToast === 'function') {
            showToast('로그인이 필요한 서비스입니다.', 'warning');
        } else {
            alert('로그인이 필요한 서비스입니다.');
        }
        
        setTimeout(() => {
            window.location.href = window.adjustPath('pages/auth/login.html');
        }, 2000);
    }
};

// 전역 객체로 노출
window.CourseInfoPage = CourseInfoPage;

// =================================
// 14. 디버깅 및 개발자 도구 (개발 모드용)
// =================================

// 개발 모드에서만 사용되는 디버깅 함수들
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugCourseApplication = {
        // 기존 기능들
        logFormData: function() {
            console.log('현재 폼 데이터:', collectFormData());
        },
        
        checkValidation: function() {
            const form = document.getElementById('application-form');
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            
            inputs.forEach(input => {
                console.log(`${input.name || input.id}: ${validateField(input) ? '✓' : '✗'}`);
            });
        },
        
        fillTestData: function() {
            const applicantName = document.getElementById('applicant-name');
            const phone = document.getElementById('phone');
            const email = document.getElementById('email');
            const courseSelect = document.getElementById('course-select');
            
            if (applicantName) applicantName.value = '홍길동';
            if (phone) phone.value = '010-1234-5678';
            if (email) email.value = 'test@example.com';
            if (courseSelect) courseSelect.value = 'health-1';
            
            // 과정 정보 업데이트 트리거
            if (courseSelect) {
                const changeEvent = new Event('change');
                courseSelect.dispatchEvent(changeEvent);
            }
            
            // 필수 약관 체크
            const agreeTerms = document.getElementById('agree-terms');
            const agreePrivacy = document.getElementById('agree-privacy');
            const agreeRefund = document.getElementById('agree-refund');
            
            if (agreeTerms) agreeTerms.checked = true;
            if (agreePrivacy) agreePrivacy.checked = true;
            if (agreeRefund) agreeRefund.checked = true;
            
            console.log('테스트 데이터 입력 완료');
        },
        
        // 결제 관련 새 기능들
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
                orderId: 'TEST_ORDER_' + Date.now(),
                method: 'card',
                amount: '₩350,000',
                customerName: '테스트 사용자'
            });
        },
        
        simulateBankTransferSuccess: function() {
            showBankTransferSuccess({
                orderId: 'TEST_BANK_' + Date.now(),
                method: 'bank',
                amount: '₩350,000',
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
        }
    };
    
    console.log('개발 모드 디버깅 도구 활성화됨 (결제 기능 포함)');
    console.log('사용 가능한 함수들:');
    console.log('- window.debugCourseApplication.fillTestData()');
    console.log('- window.debugCourseApplication.testCardPayment()');
    console.log('- window.debugCourseApplication.testBankTransfer()');
    console.log('- window.debugCourseApplication.simulatePaymentSuccess()');
    console.log('- window.debugCourseApplication.simulateBankTransferSuccess()');
    console.log('- window.debugCourseApplication.showModal()');
    console.log('- window.debugCourseApplication.hideModal()');
}

// =================================
// 15. 페이지 이탈 방지 및 키보드 네비게이션
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
    const form = document.getElementById('application-form');
    if (form && form.modified) {
        e.preventDefault();
        e.returnValue = '작성 중인 내용이 있습니다. 정말 페이지를 떠나시겠습니까?';
    }
});

// 폼 수정 감지
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('application-form');
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

console.log('=== 통합된 course-application.js 로드 완료 (결제 기능 포함) ===');