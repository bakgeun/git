/**
 * 교육 과정 관련 JavaScript
 * 교육 과정 안내, 신청, 결제, 시험 안내 등의 기능을 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
    // 교육 페이지 네임스페이스 생성
    window.educationPage = {
        /**
         * 교육 페이지 초기화
         */
        init: function () {
            // 현재 페이지 경로 확인
            const currentPath = window.location.pathname;

            // 페이지별 초기화 함수 호출
            if (currentPath.includes('course-info.html')) {
                this.initCourseInfo();
            } else if (currentPath.includes('course-application.html')) {
                this.initCourseApplication();
            } else if (currentPath.includes('cert-application.html')) {
                this.initCertApplication();
            } else if (currentPath.includes('exam-info.html')) {
                this.initExamInfo();
            } else if (currentPath.includes('payment.html')) {
                this.initPayment();
            } else if (currentPath.includes('cert-issuance.html')) {
                this.initCertIssuance();
            } else if (currentPath.includes('cert-renewal.html')) {
                this.initCertRenewal();
            }
        },

        /**
         * 교육 과정 안내 페이지 초기화
         */
        initCourseInfo: function () {
            // 교육 과정 선택 이벤트 처리
            const courseSelect = document.getElementById('course-select');
            if (courseSelect) {
                courseSelect.addEventListener('change', this.handleCourseSelect);

                // URL 파라미터에서 과정 정보 가져오기
                const urlParams = new URLSearchParams(window.location.search);
                const courseParam = urlParams.get('course');

                if (courseParam) {
                    courseSelect.value = courseParam;
                    this.updateCourseInfo(courseParam);
                } else if (courseSelect.value) {
                    this.updateCourseInfo(courseSelect.value);
                }
            }

            // 탭 기능 초기화
            this.initTabs();
        },

        /**
         * 교육 과정 선택 처리
         */
        handleCourseSelect: function () {
            window.educationPage.updateCourseInfo(this.value);
        },

        /**
         * 교육 과정 정보 업데이트
         * 
         * @param {string} courseId - 교육 과정 ID
         */
        updateCourseInfo: function (courseId) {
            // 교육 과정 데이터 (실제 구현에서는 Firebase에서 가져오거나 API 호출)
            const courseData = {
                'health-1': {
                    title: '건강운동처방사 과정 1기',
                    period: '2025.06.03 ~ 2025.08.23 (12주)',
                    price: '1,200,000원',
                    method: '블렌디드 과정 (온라인+오프라인)',
                    capacity: '30명',
                    location: '서울 강남 본원',
                    description: '질환별 맞춤형 운동 프로그램을 설계하고 지도할 수 있는 전문가 양성 과정입니다.'
                },
                'rehab-1': {
                    title: '운동재활전문가 과정 1기',
                    period: '2025.07.01 ~ 2025.10.18 (16주)',
                    price: '1,500,000원',
                    method: '블렌디드 과정 (온라인+오프라인)',
                    capacity: '24명',
                    location: '서울 강남 본원',
                    description: '부상 및 질환 이후 신체 기능 회복을 위한 운동재활 프로그램을 설계하고 지도할 수 있는 전문가 양성 과정입니다.'
                },
                'pilates-2': {
                    title: '필라테스 전문가 과정 2기',
                    period: '2025.05.20 ~ 2025.08.10 (12주)',
                    price: '1,300,000원',
                    method: '오프라인 중심 (실습 위주)',
                    capacity: '20명',
                    location: '서울 강남 본원',
                    description: '필라테스 원리와 기구를 활용한 운동 지도 능력을 갖춘 전문가 양성 과정입니다.'
                },
                'pilates-3': {
                    title: '필라테스 전문가 과정 3기',
                    period: '2025.09.02 ~ 2025.11.22 (12주)',
                    price: '1,300,000원',
                    method: '오프라인 중심 (실습 위주)',
                    capacity: '20명',
                    location: '서울 강남 본원',
                    description: '필라테스 원리와 기구를 활용한 운동 지도 능력을 갖춘 전문가 양성 과정입니다.'
                },
                'rec-2': {
                    title: '레크리에이션지도자 과정 2기',
                    period: '2025.06.10 ~ 2025.08.02 (8주)',
                    price: '900,000원',
                    method: '블렌디드 과정 (온라인+오프라인)',
                    capacity: '30명',
                    location: '서울 강남 본원',
                    description: '다양한 연령층과 단체를 대상으로 레크리에이션 프로그램을 기획하고 진행할 수 있는 전문가 양성 과정입니다.'
                }
            };

            const courseInfo = courseData[courseId];
            if (courseInfo) {
                // 과정 정보 업데이트
                const elements = [
                    { id: 'course-title', property: 'title' },
                    { id: 'course-period', property: 'period' },
                    { id: 'course-price', property: 'price' },
                    { id: 'course-method', property: 'method' },
                    { id: 'course-capacity', property: 'capacity' },
                    { id: 'course-location', property: 'location' },
                    { id: 'course-description', property: 'description' }
                ];

                elements.forEach(element => {
                    const el = document.getElementById(element.id);
                    if (el) {
                        el.textContent = courseInfo[element.property];
                    }
                });

                // 신청 버튼 활성화/비활성화
                const applyButton = document.getElementById('apply-button');
                if (applyButton) {
                    if (courseId === 'pilates-2') {
                        applyButton.disabled = true;
                        applyButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                        applyButton.classList.add('bg-gray-400', 'cursor-not-allowed');
                        applyButton.textContent = '마감된 과정입니다';
                    } else {
                        applyButton.disabled = false;
                        applyButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
                        applyButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
                        applyButton.textContent = '신청하기';
                    }
                }
            }
        },

        /**
         * 교육 과정 신청 페이지 초기화
         */
        initCourseApplication: function () {
            // 폼 제출 이벤트 처리
            const applicationForm = document.getElementById('application-form');
            if (applicationForm) {
                applicationForm.addEventListener('submit', this.handleCourseApplicationSubmit);

                // URL 파라미터에서 과정 정보 가져오기
                const urlParams = new URLSearchParams(window.location.search);
                const courseParam = urlParams.get('course');

                if (courseParam) {
                    const courseSelect = document.getElementById('course-select');
                    if (courseSelect) {
                        courseSelect.value = courseParam;
                        // 과정 정보 업데이트 이벤트 발생
                        const event = new Event('change');
                        courseSelect.dispatchEvent(event);
                    }
                }
            }
        },

        /**
         * 교육 과정 신청 폼 제출 처리
         * 
         * @param {Event} event - 폼 제출 이벤트
         */
        handleCourseApplicationSubmit: function (event) {
            event.preventDefault();

            // 유효성 검사
            if (!window.educationPage.validateCourseApplicationForm()) {
                return;
            }

            // 폼 데이터 수집
            const formData = new FormData(this);
            const applicationData = {};

            for (const [key, value] of formData.entries()) {
                applicationData[key] = value;
            }

            // 로그인 상태 확인
            if (window.dhcFirebase && window.dhcFirebase.auth.currentUser) {
                // 사용자 ID 추가
                applicationData.userId = window.dhcFirebase.auth.currentUser.uid;
                applicationData.userEmail = window.dhcFirebase.auth.currentUser.email;
                applicationData.createdAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();

                // Firebase에 신청 데이터 저장
                window.dhcFirebase.db.collection('courseApplications').add(applicationData)
                    .then(docRef => {
                        console.log('신청서 제출 성공:', docRef.id);

                        // 결제 페이지로 이동
                        window.location.href = `payment.html?type=course&product_id=${applicationData['course-select']}`;
                    })
                    .catch(error => {
                        console.error('신청서 제출 오류:', error);
                        alert('신청서 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
                    });
            } else {
                // 비로그인 상태면 로그인 페이지로 리디렉션
                alert('로그인이 필요한 서비스입니다.');
                window.location.href = '../auth/login.html?redirect=' + encodeURIComponent(window.location.href);
            }
        },

        /**
         * 교육 과정 신청 폼 유효성 검사
         * 
         * @returns {boolean} - 유효성 검사 결과
         */
        validateCourseApplicationForm: function () {
            const courseSelect = document.getElementById('course-select');
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone');
            const agreeTerms = document.getElementById('agree-terms');

            // 필수 항목 확인
            if (!courseSelect.value) {
                alert('교육 과정을 선택해주세요.');
                courseSelect.focus();
                return false;
            }

            if (!nameInput.value.trim()) {
                alert('이름을 입력해주세요.');
                nameInput.focus();
                return false;
            }

            if (!emailInput.value.trim() || !window.validators.isValidEmail(emailInput.value)) {
                alert('유효한 이메일 주소를 입력해주세요.');
                emailInput.focus();
                return false;
            }

            if (!phoneInput.value.trim() || !window.validators.isValidPhone(phoneInput.value)) {
                alert('유효한 전화번호를 입력해주세요.');
                phoneInput.focus();
                return false;
            }

            if (!agreeTerms.checked) {
                alert('이용 약관에 동의해주세요.');
                agreeTerms.focus();
                return false;
            }

            return true;
        },

        /**
         * 자격증 신청 페이지 초기화
         */
        initCertApplication: function () {
            // 자격증 유형 선택 이벤트 처리
            const certTypeSelect = document.getElementById('cert-type');
            if (certTypeSelect) {
                certTypeSelect.addEventListener('change', this.handleCertTypeSelect);

                // 초기 자격증 유형 정보 업데이트
                if (certTypeSelect.value) {
                    this.updateCertTypeInfo(certTypeSelect.value);
                }
            }

            // 옵션 선택에 따른 가격 계산
            const certOption = document.getElementById('cert-option');
            if (certOption) {
                certOption.addEventListener('change', this.updateCertPrice);
            }

            // 폼 제출 처리
            const certApplicationForm = document.getElementById('cert-application-form');
            if (certApplicationForm) {
                certApplicationForm.addEventListener('submit', this.handleCertApplicationSubmit);
            }
        },

        /**
         * 자격증 유형 선택 처리
         */
        handleCertTypeSelect: function () {
            window.educationPage.updateCertTypeInfo(this.value);
        },

        /**
         * 자격증 유형 정보 업데이트
         * 
         * @param {string} certType - 자격증 유형
         */
        updateCertTypeInfo: function (certType) {
            // 자격증 정보 (실제 구현에서는 Firebase에서 가져오거나 API 호출)
            const certData = {
                'health': {
                    title: '건강운동처방사',
                    description: '건강운동처방사는 개인의 건강 상태와 체력 수준에 맞는 운동 프로그램을 설계하고 지도하는 전문가입니다.',
                    price: '50,000원',
                    requirements: ['건강운동처방사 교육과정 이수', '필기시험 60점 이상', '실기시험 70점 이상']
                },
                'rehab': {
                    title: '운동재활전문가',
                    description: '운동재활전문가는 부상이나 질환 후 신체 기능 회복을 위한 운동 프로그램을 설계하고 지도하는 전문가입니다.',
                    price: '60,000원',
                    requirements: ['운동재활전문가 교육과정 이수', '필기시험 60점 이상', '실기시험 70점 이상']
                },
                'pilates': {
                    title: '필라테스 전문가',
                    description: '필라테스 전문가는 필라테스 원리와 기구를 활용하여 체형 교정과 신체 기능 향상을 위한 프로그램을 지도하는 전문가입니다.',
                    price: '55,000원',
                    requirements: ['필라테스 전문가 교육과정 이수', '필기시험 60점 이상', '실기시험 70점 이상']
                },
                'recreation': {
                    title: '레크리에이션지도자',
                    description: '레크리에이션지도자는 다양한 연령층과 단체를 대상으로 레크리에이션 프로그램을 기획하고 진행하는 전문가입니다.',
                    price: '45,000원',
                    requirements: ['레크리에이션지도자 교육과정 이수', '필기시험 60점 이상', '실기시험 70점 이상']
                }
            };

            const certInfo = certData[certType];
            if (certInfo) {
                // 자격증 정보 업데이트
                const elements = [
                    { id: 'cert-title', property: 'title' },
                    { id: 'cert-description', property: 'description' },
                    { id: 'cert-price', property: 'price' }
                ];

                elements.forEach(element => {
                    const el = document.getElementById(element.id);
                    if (el) {
                        el.textContent = certInfo[element.property];
                    }
                });

                // 자격 요건 목록 업데이트
                const requirementsList = document.getElementById('cert-requirements');
                if (requirementsList) {
                    requirementsList.innerHTML = '';

                    certInfo.requirements.forEach(requirement => {
                        const li = document.createElement('li');
                        li.className = 'flex items-start mb-2';
                        li.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>${requirement}</span>
                        `;
                        requirementsList.appendChild(li);
                    });
                }

                // 가격 정보 초기화
                this.updateCertPrice();
            }
        },

        /**
         * 자격증 옵션에 따른 가격 업데이트
         */
        updateCertPrice: function () {
            const certOption = document.getElementById('cert-option');
            const optionPriceEl = document.getElementById('option-price');
            const totalPriceEl = document.getElementById('total-price');

            if (!certOption || !optionPriceEl || !totalPriceEl) {
                return;
            }

            let optionPrice = 0;
            let basePrice = 50000;

            // 선택된 자격증 유형에 따른 기본 가격 설정
            const certTypeSelect = document.getElementById('cert-type');
            if (certTypeSelect) {
                switch (certTypeSelect.value) {
                    case 'health':
                        basePrice = 50000;
                        break;
                    case 'rehab':
                        basePrice = 60000;
                        break;
                    case 'pilates':
                        basePrice = 55000;
                        break;
                    case 'recreation':
                        basePrice = 45000;
                        break;
                }
            }

            // 옵션에 따른 추가 가격 계산
            switch (certOption.value) {
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

            // 가격 표시 업데이트
            optionPriceEl.textContent = optionPrice.toLocaleString() + '원';
            totalPriceEl.textContent = (basePrice + optionPrice).toLocaleString() + '원';
        },

        /**
         * 자격증 신청 폼 제출 처리
         * 
         * @param {Event} event - 폼 제출 이벤트
         */
        handleCertApplicationSubmit: function (event) {
            event.preventDefault();

            // 유효성 검사
            if (!window.educationPage.validateCertApplicationForm()) {
                return;
            }

            // 폼 데이터 수집
            const formData = new FormData(this);
            const applicationData = {};

            for (const [key, value] of formData.entries()) {
                applicationData[key] = value;
            }

            // 로그인 상태 확인
            if (window.dhcFirebase && window.dhcFirebase.auth.currentUser) {
                // 사용자 ID 추가
                applicationData.userId = window.dhcFirebase.auth.currentUser.uid;
                applicationData.userEmail = window.dhcFirebase.auth.currentUser.email;
                applicationData.createdAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();

                // Firebase에 신청 데이터 저장
                window.dhcFirebase.db.collection('certApplications').add(applicationData)
                    .then(docRef => {
                        console.log('자격증 신청서 제출 성공:', docRef.id);

                        // 결제 페이지로 이동
                        window.location.href = `payment.html?type=certificate&product_id=${applicationData['cert-type']}`;
                    })
                    .catch(error => {
                        console.error('자격증 신청서 제출 오류:', error);
                        alert('신청서 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
                    });
            } else {
                // 비로그인 상태면 로그인 페이지로 리디렉션
                alert('로그인이 필요한 서비스입니다.');
                window.location.href = '../auth/login.html?redirect=' + encodeURIComponent(window.location.href);
            }
        },

        /**
         * 자격증 신청 폼 유효성 검사
         * 
         * @returns {boolean} - 유효성 검사 결과
         */
        validateCertApplicationForm: function () {
            const certType = document.getElementById('cert-type');
            const nameInput = document.getElementById('name');
            const birthdateInput = document.getElementById('birthdate');
            const phoneInput = document.getElementById('phone');
            const agreeTerms = document.getElementById('agree-terms');

            // 필수 항목 확인
            if (!certType.value) {
                alert('자격증 종류를 선택해주세요.');
                certType.focus();
                return false;
            }

            if (!nameInput.value.trim()) {
                alert('이름을 입력해주세요.');
                nameInput.focus();
                return false;
            }

            if (!birthdateInput.value.trim()) {
                alert('생년월일을 입력해주세요.');
                birthdateInput.focus();
                return false;
            }

            if (!phoneInput.value.trim() || !window.validators.isValidPhone(phoneInput.value)) {
                alert('유효한 전화번호를 입력해주세요.');
                phoneInput.focus();
                return false;
            }

            if (!agreeTerms.checked) {
                alert('이용 약관에 동의해주세요.');
                agreeTerms.focus();
                return false;
            }

            return true;
        },

        /**
         * 시험 안내 페이지 초기화
         */
        initExamInfo: function () {
            // 탭 기능 초기화
            this.initTabs();
        },

        /**
         * 탭 기능 초기화
         */
        initTabs: function () {
            const tabs = document.querySelectorAll('.tab-link');
            if (tabs.length > 0) {
                tabs.forEach(tab => {
                    tab.addEventListener('click', function (e) {
                        e.preventDefault();

                        // 탭 활성화 클래스 전환
                        tabs.forEach(t => t.classList.remove('active'));
                        this.classList.add('active');

                        // 탭 콘텐츠 전환
                        const target = this.getAttribute('data-tab');
                        document.querySelectorAll('.tab-content').forEach(content => {
                            content.classList.remove('active');
                            content.style.display = 'none';
                        });

                        document.getElementById(target).classList.add('active');
                        document.getElementById(target).style.display = 'block';
                    });
                });

                // 첫 번째 탭 활성화 (기본값)
                if (tabs[0]) {
                    tabs[0].click();
                }
            }

            // 시험 탭 기능 초기화
            const examTabs = document.querySelectorAll('.exam-tab');
            if (examTabs.length > 0) {
                examTabs.forEach(tab => {
                    tab.addEventListener('click', function () {
                        // 모든 탭 비활성화
                        examTabs.forEach(t => {
                            t.classList.remove('bg-blue-600', 'text-white');
                            t.classList.add('bg-gray-100', 'text-gray-800');
                        });

                        // 클릭한 탭 활성화
                        this.classList.remove('bg-gray-100', 'text-gray-800');
                        this.classList.add('bg-blue-600', 'text-white');

                        // 모든 콘텐츠 숨기기
                        const contentPanels = document.querySelectorAll('.exam-content');
                        contentPanels.forEach(panel => {
                            panel.classList.add('hidden');
                        });

                        // 선택한 탭에 해당하는 콘텐츠 표시
                        const targetContent = document.getElementById(this.dataset.target);
                        if (targetContent) {
                            targetContent.classList.remove('hidden');
                        }
                    });
                });

                // 첫 번째 탭 활성화 (기본값)
                if (examTabs[0]) {
                    examTabs[0].click();
                }
            }
        },

        /**
         * 결제 페이지 초기화
         */
        initPayment: function () {
            // 결제 정보 초기화
            this.initPaymentForm();

            // 결제 수단 선택 이벤트 처리
            const paymentMethods = document.querySelectorAll('.payment-method');
            const paymentDetails = document.querySelectorAll('.payment-details');

            paymentMethods.forEach(method => {
                method.addEventListener('click', function () {
                    // 라디오 버튼 선택
                    const radio = this.querySelector('input[type="radio"]');
                    radio.checked = true;

                    // 활성화 클래스 변경
                    paymentMethods.forEach(m => m.classList.remove('active', 'border-blue-500'));
                    this.classList.add('active', 'border-blue-500');

                    // 결제 수단에 맞는 상세 폼 표시
                    const methodValue = radio.value;
                    paymentDetails.forEach(detail => {
                        detail.classList.add('hidden');
                    });

                    document.getElementById(`${methodValue}-details`).classList.remove('hidden');
                });
            });

            // 약관 동의 전체 선택/해제 기능
            const agreeAll = document.getElementById('agree-all');
            const agreeTerms = document.getElementById('agree-terms');
            const agreePrivacy = document.getElementById('agree-privacy');
            const agreeRefund = document.getElementById('agree-refund');

            if (agreeAll) {
                agreeAll.addEventListener('change', function () {
                    const isChecked = this.checked;

                    if (agreeTerms) agreeTerms.checked = isChecked;
                    if (agreePrivacy) agreePrivacy.checked = isChecked;
                    if (agreeRefund) agreeRefund.checked = isChecked;
                });

                // 개별 약관 체크 시 전체 동의 상태 업데이트
                [agreeTerms, agreePrivacy, agreeRefund].forEach(checkbox => {
                    if (checkbox) {
                        checkbox.addEventListener('change', function () {
                            if (agreeAll) {
                                agreeAll.checked =
                                    (agreeTerms ? agreeTerms.checked : true) &&
                                    (agreePrivacy ? agreePrivacy.checked : true) &&
                                    (agreeRefund ? agreeRefund.checked : true);
                            }
                        });
                    }
                });
            }

            // 약관 모달 기능
            const modalButtons = document.querySelectorAll('[data-modal]');
            const modalCloseButtons = document.querySelectorAll('[data-dismiss="modal"]');

            modalButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const modalId = this.getAttribute('data-modal');
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.classList.remove('hidden');
                    }
                });
            });

            modalCloseButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const modal = this.closest('.modal');
                    if (modal) {
                        modal.classList.add('hidden');
                    }
                });
            });

            // 모달 외부 클릭 시 닫기
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.addEventListener('click', function (e) {
                    if (e.target === this) {
                        this.classList.add('hidden');
                    }
                });
            });

            // ESC 키로 모달 닫기
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    modals.forEach(modal => {
                        modal.classList.add('hidden');
                    });
                }
            });

            // 카드 번호 입력 시 자동 포맷팅
            const cardNumberInput = document.getElementById('card-number');
            if (cardNumberInput) {
                cardNumberInput.addEventListener('input', function () {
                    // 숫자만 추출
                    let cardNumber = this.value.replace(/\D/g, '');

                    // 4자리마다 하이픈 추가
                    if (cardNumber.length > 0) {
                        cardNumber = cardNumber.match(/.{1,4}/g).join('-');
                    }

                    // 16자리(하이픈 포함 19자리)로 제한
                    if (cardNumber.length > 19) {
                        cardNumber = cardNumber.substring(0, 19);
                    }

                    this.value = cardNumber;
                });
            }

            // 카드 유효기간 입력 시 자동 포맷팅
            const cardExpiryInput = document.getElementById('card-expiry');
            if (cardExpiryInput) {
                cardExpiryInput.addEventListener('input', function () {
                    // 숫자만 추출
                    let expiry = this.value.replace(/\D/g, '');

                    // MM/YY 형식으로 포맷팅
                    if (expiry.length > 2) {
                        expiry = expiry.substring(0, 2) + '/' + expiry.substring(2, 4);
                    }

                    this.value = expiry;
                });
            }

            // 결제 폼 제출 처리
            const paymentForm = document.getElementById('payment-form');
            if (paymentForm) {
                paymentForm.addEventListener('submit', this.handlePaymentSubmit);
            }
        },

        /**
         * 결제 폼 초기화
         */
        initPaymentForm: function () {
            const productInfo = this.getProductInfoFromUrl();

            // 상품명 및 가격 업데이트
            const productNameEl = document.getElementById('product-name');
            const totalPriceEl = document.getElementById('total-price');

            if (productNameEl) {
                productNameEl.textContent = productInfo.name;
            }

            if (totalPriceEl) {
                totalPriceEl.textContent = '₩' + window.formatters.formatNumber(productInfo.price);
            }

            // 사용자 정보 가져오기 (로그인된 경우)
            if (window.dhcFirebase && window.dhcFirebase.auth.currentUser) {
                const currentUser = window.dhcFirebase.auth.currentUser;

                // Firestore에서 사용자 추가 정보 가져오기
                window.dhcFirebase.db.collection('users').doc(currentUser.uid).get()
                    .then(doc => {
                        if (doc.exists) {
                            const userData = doc.data();

                            // 사용자 정보 표시
                            const customerNameEl = document.getElementById('customer-name');
                            const customerEmailEl = document.getElementById('customer-email');
                            const customerPhoneEl = document.getElementById('customer-phone');

                            if (customerNameEl) {
                                customerNameEl.textContent = userData.displayName || currentUser.displayName || '이름 정보 없음';
                            }

                            if (customerEmailEl) {
                                customerEmailEl.textContent = userData.email || currentUser.email;
                            }

                            if (customerPhoneEl) {
                                customerPhoneEl.textContent = userData.phoneNumber || '연락처 정보 없음';
                            }

                            // 카드 소유자 이름 자동 입력
                            const cardNameInput = document.getElementById('card-name');
                            if (cardNameInput) {
                                cardNameInput.value = userData.displayName || currentUser.displayName || '';
                            }
                        }
                    })
                    .catch(error => {
                        console.error('사용자 정보 가져오기 오류:', error);
                    });
            } else {
                // 로그인되지 않은 경우 로그인 페이지로 리디렉션
                window.location.href = '../auth/login.html?redirect=' + encodeURIComponent(window.location.href);
            }
        },

        /**
         * URL 쿼리스트링에서 상품 정보 가져오기
         * 
         * @returns {object} - 상품 정보 객체
         */
        getProductInfoFromUrl: function () {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product_id');
            const productType = urlParams.get('type') || 'course'; // 기본값은 course(교육과정)

            // 실제 구현에서는 서버에서 상품 정보를 가져오거나 Firebase에서 조회해야 함
            // 여기서는 간단하게 하드코딩된 정보 반환
            let productInfo = {
                id: productId || 'health-1',
                name: '건강운동처방사 자격과정 1기',
                price: 1200000
            };

            // 자격증 신청인 경우
            if (productType === 'certificate') {
                productInfo = {
                    id: productId || 'cert-health',
                    name: '건강운동처방사 자격증 신청',
                    price: 50000
                };
            }

            return productInfo;
        },

        /**
         * 결제 폼 제출 처리
         * 
         * @param {Event} event - 폼 제출 이벤트
         */
        handlePaymentSubmit: function (event) {
            event.preventDefault();

            // 선택된 결제 수단 확인
            const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;

            // 필수 약관 동의 확인
            const agreeTerms = document.getElementById('agree-terms');
            const agreePrivacy = document.getElementById('agree-privacy');
            const agreeRefund = document.getElementById('agree-refund');

            if (!agreeTerms.checked || !agreePrivacy.checked || !agreeRefund.checked) {
                alert('필수 약관에 모두 동의해주세요.');
                return;
            }

            // 결제 수단별 필수 입력값 검증
            if (selectedMethod === 'card') {
                const cardNumber = document.getElementById('card-number').value;
                const cardExpiry = document.getElementById('card-expiry').value;
                const cardName = document.getElementById('card-name').value;
                const cardCvc = document.getElementById('card-cvc').value;

                if (!cardNumber || !cardExpiry || !cardName || !cardCvc) {
                    alert('카드 정보를 모두 입력해주세요.');
                    return;
                }

                // 카드번호 유효성 검사 (간단한 형식 검사만 수행)
                const cleanNumber = cardNumber.replace(/\D/g, '');
                if (cleanNumber.length < 16) {
                    alert('유효한 카드번호를 입력해주세요.');
                    return;
                }

                // 유효기간 형식 검사
                if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                    alert('유효기간을 MM/YY 형식으로 입력해주세요.');
                    return;
                }
            } else if (selectedMethod === 'bank') {
                // 무통장 입금 선택 시 특별한 검증 필요 없음
            } else if (selectedMethod === 'virtual') {
                const virtualBank = document.getElementById('virtual-bank').value;
                const virtualHolder = document.getElementById('virtual-holder').value;

                if (!virtualBank || !virtualHolder) {
                    alert('가상계좌 정보를 모두 입력해주세요.');
                    return;
                }
            }

            // 실제 구현에서는 여기서 PG사 결제 모듈과 연동하거나 Firebase Functions 호출
            // 이 예제에서는 Firebase에 결제 정보 기록만 수행

            // 결제 정보 객체 생성
            const productInfo = window.educationPage.getProductInfoFromUrl();
            const paymentData = {
                productId: productInfo.id,
                productName: productInfo.name,
                amount: productInfo.price,
                paymentMethod: selectedMethod,
                status: selectedMethod === 'card' ? 'completed' : 'pending', // 카드는 즉시 완료, 무통장/가상계좌는 대기
                userId: window.dhcFirebase.auth.currentUser.uid,
                userEmail: window.dhcFirebase.auth.currentUser.email,
                createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                orderNumber: 'ORD' + Date.now()
            };

            // Firebase에 결제 정보 저장
            window.dhcFirebase.db.collection('payments').add(paymentData)
                .then(docRef => {
                    console.log('결제 정보 저장 성공:', docRef.id);

                    // 결제 완료 모달 정보 업데이트
                    const orderNumberEl = document.getElementById('order-number');
                    const paymentMethodDisplayEl = document.getElementById('payment-method-display');
                    const paidAmountEl = document.getElementById('paid-amount');

                    if (orderNumberEl) {
                        orderNumberEl.textContent = paymentData.orderNumber;
                    }

                    if (paymentMethodDisplayEl) {
                        paymentMethodDisplayEl.textContent =
                            selectedMethod === 'card' ? '신용카드' :
                                selectedMethod === 'bank' ? '무통장입금' : '가상계좌';
                    }

                    if (paidAmountEl) {
                        paidAmountEl.textContent = '₩' + window.formatters.formatNumber(productInfo.price);
                    }

                    // 결제 완료 모달 표시
                    const paymentSuccessModal = document.getElementById('payment-success-modal');
                    if (paymentSuccessModal) {
                        paymentSuccessModal.classList.remove('hidden');
                    }
                })
                .catch(error => {
                    console.error('결제 정보 저장 오류:', error);
                    alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
                });
        },

        /**
         * 자격증 발급 페이지 초기화
         */
        initCertIssuance: function () {
            // 로그인 상태 확인 및 인터페이스 업데이트
            this.updateCertIssuanceInterface();

            // 발급 신청 폼 제출 처리
            const issuanceForm = document.getElementById('issuance-form');
            if (issuanceForm) {
                issuanceForm.addEventListener('submit', this.handleCertIssuanceSubmit);
            }
        },

        /**
         * 자격증 발급 인터페이스 업데이트
         */
        updateCertIssuanceInterface: function () {
            const eligibleCertificates = document.getElementById('eligible-certificates');
            const loginRequired = document.getElementById('login-required');
            const noCertificates = document.getElementById('no-certificates');
            const certificateForm = document.getElementById('certificate-form');

            // 로그인 상태 확인
            if (!window.dhcFirebase || !window.dhcFirebase.auth.currentUser) {
                // 비로그인 상태
                if (eligibleCertificates) eligibleCertificates.classList.add('hidden');
                if (loginRequired) loginRequired.classList.remove('hidden');
                if (noCertificates) noCertificates.classList.add('hidden');
                if (certificateForm) certificateForm.classList.add('hidden');

                return;
            }

            // 로그인 상태에서는 사용자의 자격증 시험 결과 확인
            const userId = window.dhcFirebase.auth.currentUser.uid;

            window.dhcFirebase.db.collection('examResults')
                .where('userId', '==', userId)
                .where('passed', '==', true)
                .where('certificateIssued', '==', false)
                .get()
                .then(snapshot => {
                    if (snapshot.empty) {
                        // 발급 가능한 자격증이 없는 경우
                        if (eligibleCertificates) eligibleCertificates.classList.add('hidden');
                        if (loginRequired) loginRequired.classList.add('hidden');
                        if (noCertificates) noCertificates.classList.remove('hidden');
                        if (certificateForm) certificateForm.classList.add('hidden');
                    } else {
                        // 발급 가능한 자격증이 있는 경우
                        if (eligibleCertificates) {
                            eligibleCertificates.classList.remove('hidden');
                            eligibleCertificates.innerHTML = '';

                            // 자격증 목록 표시
                            snapshot.forEach(doc => {
                                const examResult = doc.data();

                                const certItem = document.createElement('div');
                                certItem.className = 'bg-white border rounded-lg p-4 mb-4';
                                certItem.innerHTML = `
                                    <div class="flex justify-between items-center mb-2">
                                        <h3 class="font-bold text-lg">${examResult.certType === 'health' ? '건강운동처방사' :
                                        examResult.certType === 'rehab' ? '운동재활전문가' :
                                            examResult.certType === 'pilates' ? '필라테스 전문가' :
                                                '레크리에이션지도자'}</h3>
                                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">합격</span>
                                    </div>
                                    <div class="text-gray-600 mb-2">
                                        <p>시험일: ${window.formatters.formatDate(examResult.examDate, 'YYYY.MM.DD')}</p>
                                        <p>필기 점수: ${examResult.writtenScore}점 | 실기 점수: ${examResult.practicalScore}점</p>
                                    </div>
                                    <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mt-2 w-full issue-certificate-btn" data-cert-type="${examResult.certType}" data-exam-id="${doc.id}">
                                        자격증 발급 신청
                                    </button>
                                `;

                                eligibleCertificates.appendChild(certItem);
                            });

                            // 자격증 발급 신청 버튼 이벤트 처리
                            const issueBtns = document.querySelectorAll('.issue-certificate-btn');
                            issueBtns.forEach(btn => {
                                btn.addEventListener('click', this.handleCertificateSelection);
                            });
                        }

                        if (loginRequired) loginRequired.classList.add('hidden');
                        if (noCertificates) noCertificates.classList.add('hidden');
                        // 폼은 자격증 선택 시 표시됨
                        if (certificateForm) certificateForm.classList.add('hidden');
                    }
                })
                .catch(error => {
                    console.error('자격증 시험 결과 조회 오류:', error);
                });
        },

        /**
         * 자격증 선택 처리
         */
        handleCertificateSelection: function () {
            const certType = this.getAttribute('data-cert-type');
            const examId = this.getAttribute('data-exam-id');

            // 자격증 유형 및 시험 ID 설정
            const certTypeSelect = document.getElementById('cert-type');
            const examIdInput = document.getElementById('exam-id');

            if (certTypeSelect) {
                certTypeSelect.value = certType;
            }

            if (examIdInput) {
                examIdInput.value = examId;
            }

            // 선택한 자격증 정보 표시
            window.dhcFirebase.db.collection('examResults').doc(examId)
                .get()
                .then(doc => {
                    if (doc.exists) {
                        const examResult = doc.data();

                        // 폼에 시험 정보 표시
                        const examDateInput = document.getElementById('exam-date');
                        if (examDateInput) {
                            examDateInput.value = window.formatters.formatDate(examResult.examDate, 'YYYY.MM.DD');
                        }

                        // 발급 신청 폼 표시
                        const certificateForm = document.getElementById('certificate-form');
                        if (certificateForm) {
                            certificateForm.classList.remove('hidden');
                        }

                        // 폼으로 스크롤
                        certificateForm.scrollIntoView({ behavior: 'smooth' });
                    }
                })
                .catch(error => {
                    console.error('시험 정보 조회 오류:', error);
                });
        },

        /**
         * 자격증 발급 신청 폼 제출 처리
         * 
         * @param {Event} event - 폼 제출 이벤트
         */
        handleCertIssuanceSubmit: function (event) {
            event.preventDefault();

            // 유효성 검사
            if (!window.educationPage.validateCertIssuanceForm()) {
                return;
            }

            // 폼 데이터 수집
            const formData = new FormData(this);
            const issuanceData = {};

            for (const [key, value] of formData.entries()) {
                issuanceData[key] = value;
            }

            // 로그인 상태 확인
            if (window.dhcFirebase && window.dhcFirebase.auth.currentUser) {
                // 사용자 ID 추가
                issuanceData.userId = window.dhcFirebase.auth.currentUser.uid;
                issuanceData.userEmail = window.dhcFirebase.auth.currentUser.email;
                issuanceData.createdAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                issuanceData.status = 'pending'; // 대기 상태로 시작

                // Firebase에 발급 신청 데이터 저장
                window.dhcFirebase.db.collection('certIssuanceRequests').add(issuanceData)
                    .then(docRef => {
                        console.log('자격증 발급 신청 성공:', docRef.id);

                        // 시험 결과 문서 업데이트 (발급 신청 상태로)
                        return window.dhcFirebase.db.collection('examResults').doc(issuanceData['exam-id']).update({
                            certificateRequested: true,
                            certificateRequestDate: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                        });
                    })
                    .then(() => {
                        // 결제 페이지로 이동
                        window.location.href = `payment.html?type=cert-issuance&product_id=${issuanceData['cert-type']}`;
                    })
                    .catch(error => {
                        console.error('자격증 발급 신청 오류:', error);
                        alert('발급 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
                    });
            } else {
                // 비로그인 상태면 로그인 페이지로 리디렉션
                alert('로그인이 필요한 서비스입니다.');
                window.location.href = '../auth/login.html?redirect=' + encodeURIComponent(window.location.href);
            }
        },

        /**
         * 자격증 발급 신청 폼 유효성 검사
         * 
         * @returns {boolean} - 유효성 검사 결과
         */
        validateCertIssuanceForm: function () {
            const certType = document.getElementById('cert-type');
            const examId = document.getElementById('exam-id');
            const nameInput = document.getElementById('name');
            const addressInput = document.getElementById('address');
            const phoneInput = document.getElementById('phone');

            // 필수 항목 확인
            if (!certType.value) {
                alert('자격증 종류 정보가 누락되었습니다.');
                return false;
            }

            if (!examId.value) {
                alert('시험 정보가 누락되었습니다.');
                return false;
            }

            if (!nameInput.value.trim()) {
                alert('이름을 입력해주세요.');
                nameInput.focus();
                return false;
            }

            if (!addressInput.value.trim()) {
                alert('주소를 입력해주세요.');
                addressInput.focus();
                return false;
            }

            if (!phoneInput.value.trim() || !window.validators.isValidPhone(phoneInput.value)) {
                alert('유효한 전화번호를 입력해주세요.');
                phoneInput.focus();
                return false;
            }

            return true;
        },

        /**
         * 자격증 갱신 페이지 초기화
         */
        initCertRenewal: function () {
            // 자격증 유형 선택에 따른 금액 업데이트
            const certTypeSelect = document.getElementById('cert-type');
            const deliveryMethodSelect = document.getElementById('delivery-method');
            const educationTypeSelect = document.getElementById('education-type');

            // 금액 요소
            const renewalFeeElem = document.querySelector('.renewal-fee');
            const educationFeeElem = document.querySelector('.education-fee');
            const deliveryFeeElem = document.querySelector('.delivery-fee');
            const totalAmountElem = document.querySelector('.total-amount');
            const deliveryFeeRow = document.getElementById('delivery-fee-row');

            // 자격증 유형별 갱신 요금
            const feeData = {
                'health': { renewal: 50000, education: 100000 },
                'rehab': { renewal: 50000, education: 120000 },
                'pilates': { renewal: 40000, education: 80000 },
                'recreation': { renewal: 30000, education: 70000 }
            };

            // 교육 유형별 교육비 할인율
            const educationDiscount = {
                'online': 1.0,  // 할인 없음
                'offline': 1.0, // 할인 없음
                'completed': 0  // 이미 완료한 경우 교육비 0
            };

            // 로그인 알림과 폼
            const loginAlert = document.getElementById('login-alert');
            const renewalForm = document.getElementById('renewal-form');

            // 주소 관련 요소
            const addressFields = document.getElementById('address-fields');
            const findAddressButton = document.getElementById('find-address');

            // 교육 이수 증명 필드
            const educationCompletionField = document.getElementById('education-completion-field');

            // 금액 업데이트 함수
            const updateFees = () => {
                if (!certTypeSelect || !renewalFeeElem || !educationFeeElem || !totalAmountElem) {
                    return;
                }

                const certType = certTypeSelect.value;
                const deliveryMethod = deliveryMethodSelect ? deliveryMethodSelect.value : 'physical';
                const educationType = educationTypeSelect ? educationTypeSelect.value : 'online';

                let renewalFee = 0;
                let educationFee = 0;
                let deliveryFee = 0;

                // 자격증 유형에 따른 갱신비 및 교육비 설정
                if (certType && feeData[certType]) {
                    renewalFee = feeData[certType].renewal;

                    // 교육 유형에 따른 교육비 계산
                    if (educationType && educationDiscount[educationType] !== undefined) {
                        educationFee = feeData[certType].education * educationDiscount[educationType];
                    } else {
                        educationFee = feeData[certType].education;
                    }
                }

                // 배송 방법에 따른 추가 비용
                if (deliveryMethod === 'both') {
                    deliveryFee = 5000;
                    if (deliveryFeeRow) deliveryFeeRow.classList.remove('hidden');
                } else {
                    if (deliveryFeeRow) deliveryFeeRow.classList.add('hidden');
                }

                // 금액 표시 업데이트
                renewalFeeElem.textContent = renewalFee.toLocaleString() + '원';
                educationFeeElem.textContent = educationFee.toLocaleString() + '원';
                if (deliveryFeeElem) deliveryFeeElem.textContent = deliveryFee.toLocaleString() + '원';

                // 총 결제 금액 계산
                const totalAmount = renewalFee + educationFee + deliveryFee;
                totalAmountElem.textContent = totalAmount.toLocaleString() + '원';
            };

            // 배송 방법에 따른 주소 필드 표시/숨김
            const toggleAddressFields = () => {
                if (!deliveryMethodSelect || !addressFields) {
                    return;
                }

                const deliveryMethod = deliveryMethodSelect.value;

                if (deliveryMethod === 'digital') {
                    addressFields.classList.add('hidden');
                    // 필수 속성 제거
                    const requiredInputs = addressFields.querySelectorAll('[required]');
                    requiredInputs.forEach(input => {
                        input.removeAttribute('required');
                        input.dataset.wasRequired = 'true';
                    });
                } else {
                    addressFields.classList.remove('hidden');
                    // 필수 속성 복원
                    const previouslyRequiredInputs = addressFields.querySelectorAll('[data-was-required="true"]');
                    previouslyRequiredInputs.forEach(input => {
                        input.setAttribute('required', '');
                    });
                }
            };

            // 교육 유형에 따른 교육 이수 증명 필드 표시/숨김
            const toggleEducationCompletionField = () => {
                if (!educationTypeSelect || !educationCompletionField) {
                    return;
                }

                const educationType = educationTypeSelect.value;

                if (educationType === 'completed') {
                    educationCompletionField.classList.remove('hidden');
                    const educationCompletionInput = document.getElementById('education-completion');
                    if (educationCompletionInput) {
                        educationCompletionInput.setAttribute('required', '');
                    }
                } else {
                    educationCompletionField.classList.add('hidden');
                    const educationCompletionInput = document.getElementById('education-completion');
                    if (educationCompletionInput) {
                        educationCompletionInput.removeAttribute('required');
                    }
                }
            };

            // 로그인 상태에 따른 알림 메시지 표시/숨김
            const checkAuthState = () => {
                if (!loginAlert || !renewalForm) {
                    return;
                }

                // 현재 사용자 확인 (Firebase 인증 서비스 사용)
                if (window.dhcFirebase && window.dhcFirebase.auth) {
                    const currentUser = window.dhcFirebase.getCurrentUser();

                    if (currentUser) {
                        // 로그인 상태: 알림 숨기고 폼 활성화
                        loginAlert.classList.add('hidden');
                        renewalForm.classList.remove('opacity-50', 'pointer-events-none');

                        // 사용자 정보 자동 입력
                        fillUserData(currentUser);
                    } else {
                        // 비로그인 상태: 알림 표시하고 폼 비활성화
                        loginAlert.classList.remove('hidden');
                        renewalForm.classList.add('opacity-50', 'pointer-events-none');
                    }
                }
            };

            // 사용자 정보 자동 입력
            const fillUserData = (currentUser) => {
                if (!currentUser || !window.dhcFirebase || !window.dhcFirebase.db) {
                    return;
                }

                window.dhcFirebase.db.collection('users').doc(currentUser.uid).get()
                    .then(doc => {
                        if (doc.exists) {
                            const userData = doc.data();

                            // 사용자 기본 정보 입력
                            const nameInput = document.getElementById('name');
                            const emailInput = document.getElementById('email');
                            const phoneInput = document.getElementById('phone');
                            const birthInput = document.getElementById('birth');

                            if (nameInput && userData.displayName) nameInput.value = userData.displayName;
                            if (emailInput && userData.email) emailInput.value = userData.email;
                            if (phoneInput && userData.phoneNumber) phoneInput.value = userData.phoneNumber;
                            if (birthInput && userData.birthdate) birthInput.value = window.formatters.formatDate(userData.birthdate, 'YYYY-MM-DD');

                            // 주소 정보 입력
                            const zipcodeInput = document.getElementById('zipcode');
                            const address1Input = document.getElementById('address1');
                            const address2Input = document.getElementById('address2');

                            if (userData.address) {
                                if (zipcodeInput && userData.address.zipCode) zipcodeInput.value = userData.address.zipCode;
                                if (address1Input && userData.address.address1) address1Input.value = userData.address.address1;
                                if (address2Input && userData.address.address2) address2Input.value = userData.address.address2;
                            }

                            // 자격증 정보 조회 및 입력
                            window.dhcFirebase.db.collection('certificates')
                                .where('userId', '==', currentUser.uid)
                                .get()
                                .then(snapshot => {
                                    if (!snapshot.empty) {
                                        // 가장 최근 자격증 정보 사용
                                        const certData = snapshot.docs[0].data();

                                        if (certTypeSelect && certData.type) certTypeSelect.value = certData.type;

                                        const certNumberInput = document.getElementById('cert-number');
                                        const issueDateInput = document.getElementById('issue-date');
                                        const expiryDateInput = document.getElementById('expiry-date');

                                        if (certNumberInput && certData.certNumber) certNumberInput.value = certData.certNumber;
                                        if (issueDateInput && certData.issueDate) issueDateInput.value = window.formatters.formatDate(certData.issueDate, 'YYYY-MM-DD');
                                        if (expiryDateInput && certData.expiryDate) expiryDateInput.value = window.formatters.formatDate(certData.expiryDate, 'YYYY-MM-DD');

                                        // 금액 업데이트
                                        updateFees();
                                    }
                                })
                                .catch(error => {
                                    console.error("자격증 정보 조회 오류:", error);
                                });
                        }
                    })
                    .catch(error => {
                        console.error("사용자 정보 가져오기 오류:", error);
                    });
            };

            // 주소찾기 팝업 열기
            const openPostcodeSearch = () => {
                // Daum 우편번호 서비스 사용 (실제 구현 시 스크립트 추가 필요)
                alert('주소 찾기 기능은 Daum 우편번호 서비스를 연동하여 구현해야 합니다.');

                // 실제 구현 예시 (주석 처리)
                /*
                new daum.Postcode({
                    oncomplete: function(data) {
                        // 우편번호와 기본주소 입력
                        document.getElementById('zipcode').value = data.zonecode;
                        document.getElementById('address1').value = data.address;
                        
                        // 상세주소 필드로 포커스 이동
                        document.getElementById('address2').focus();
                    }
                }).open();
                */
            };

            // 폼 제출 처리
            const handleFormSubmit = (e) => {
                e.preventDefault();

                // 현재 사용자 확인
                if (window.dhcFirebase && window.dhcFirebase.auth) {
                    const currentUser = window.dhcFirebase.getCurrentUser();

                    if (!currentUser) {
                        alert('로그인 후 이용해주세요.');
                        window.location.href = '../auth/login.html?redirect=' + encodeURIComponent(window.location.href);
                        return;
                    }
                }

                // 폼 데이터 수집
                const formData = new FormData(renewalForm);
                const renewalData = {
                    userId: window.dhcFirebase ? window.dhcFirebase.getCurrentUser()?.uid : null,
                    name: formData.get('name'),
                    birth: formData.get('birth'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    certType: formData.get('cert-type'),
                    certNumber: formData.get('cert-number'),
                    issueDate: formData.get('issue-date'),
                    expiryDate: formData.get('expiry-date'),
                    educationType: formData.get('education-type'),
                    cpeHours: formData.get('cpe-hours'),
                    deliveryMethod: formData.get('delivery-method'),
                    address: {
                        zipCode: formData.get('zipcode'),
                        address1: formData.get('address1'),
                        address2: formData.get('address2')
                    },
                    paymentMethod: formData.get('payment-method'),
                    appliedAt: new Date(),
                    status: 'pending' // 신청 상태 (pending, approved, rejected)
                };

                // 신청 데이터 저장 (Firebase Firestore)
                if (window.dhcFirebase && window.dhcFirebase.db) {
                    window.dhcFirebase.db.collection('certRenewals').add(renewalData)
                        .then(docRef => {
                            console.log("자격증 갱신 신청 ID:", docRef.id);

                            // 파일 업로드
                            uploadFiles(docRef.id);

                            // 결제 페이지로 이동 또는 완료 메시지 표시
                            alert('자격증 갱신 신청이 접수되었습니다. 결제 페이지로 이동합니다.');
                            window.location.href = `payment.html?type=renewal&id=${docRef.id}`;
                        })
                        .catch(error => {
                            console.error("자격증 갱신 신청 저장 오류:", error);
                            alert('자격증 갱신 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                        });
                } else {
                    // Firebase가 없는 경우 더미 처리
                    alert('자격증 갱신 신청이 접수되었습니다. 검토 후 안내 메일을 발송해 드리겠습니다.');
                }
            };

            // 파일 업로드 처리
            const uploadFiles = (renewalId) => {
                if (!window.dhcFirebase || !window.dhcFirebase.storage) {
                    return;
                }

                const educationCompletionFile = document.getElementById('education-completion')?.files[0];
                const cpeDocumentsFiles = document.getElementById('cpe-documents')?.files;

                // 교육 이수 증명 파일 업로드
                if (educationCompletionFile) {
                    const storageRef = window.dhcFirebase.storage.ref(`certRenewals/${renewalId}/education-completion/${educationCompletionFile.name}`);
                    storageRef.put(educationCompletionFile).then(() => {
                        console.log("교육 이수 증명 파일 업로드 완료");
                    }).catch(error => {
                        console.error("교육 이수 증명 파일 업로드 오류:", error);
                    });
                }

                // 보수교육 증빙 파일 업로드
                if (cpeDocumentsFiles && cpeDocumentsFiles.length > 0) {
                    Array.from(cpeDocumentsFiles).forEach((file, index) => {
                        const storageRef = window.dhcFirebase.storage.ref(`certRenewals/${renewalId}/cpe-documents/${file.name}`);
                        storageRef.put(file).then(() => {
                            console.log(`보수교육 증빙 파일 ${index + 1} 업로드 완료`);
                        }).catch(error => {
                            console.error(`보수교육 증빙 파일 ${index + 1} 업로드 오류:`, error);
                        });
                    });
                }
            };

            // 약관 모달 관련 기능
            const setupModalEvents = () => {
                const modalButtons = document.querySelectorAll('[data-modal-target]');
                const modalCloseButtons = document.querySelectorAll('[data-dismiss="modal"]');

                modalButtons.forEach(button => {
                    button.addEventListener('click', function () {
                        const modalId = this.getAttribute('data-modal-target');
                        const modal = document.getElementById(modalId);
                        if (modal) {
                            modal.classList.remove('hidden');
                        }
                    });
                });

                modalCloseButtons.forEach(button => {
                    button.addEventListener('click', function () {
                        const modal = this.closest('.modal');
                        if (modal) {
                            modal.classList.add('hidden');
                        }
                    });
                });

                // 모달 외부 클릭 시 닫기
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => {
                    modal.addEventListener('click', function (e) {
                        if (e.target === this) {
                            this.classList.add('hidden');
                        }
                    });
                });

                // ESC 키로 모달 닫기
                document.addEventListener('keydown', function (e) {
                    if (e.key === 'Escape') {
                        const visibleModal = document.querySelector('.modal:not(.hidden)');
                        if (visibleModal) {
                            visibleModal.classList.add('hidden');
                        }
                    }
                });
            };

            // FAQ 아코디언 기능
            const setupFaqAccordion = () => {
                const faqQuestions = document.querySelectorAll('.faq-question');

                faqQuestions.forEach(question => {
                    question.addEventListener('click', function () {
                        const answer = this.nextElementSibling;
                        const arrow = this.querySelector('svg');

                        // 다른 모든 FAQ 닫기
                        faqQuestions.forEach(otherQuestion => {
                            if (otherQuestion !== this) {
                                otherQuestion.nextElementSibling.classList.add('hidden');
                                const otherArrow = otherQuestion.querySelector('svg');
                                if (otherArrow) otherArrow.classList.remove('rotate-180');
                            }
                        });

                        // 현재 FAQ 토글
                        answer.classList.toggle('hidden');
                        if (arrow) arrow.classList.toggle('rotate-180');
                    });
                });
            };

            // 이벤트 리스너 등록
            if (certTypeSelect) {
                certTypeSelect.addEventListener('change', updateFees);
            }

            if (deliveryMethodSelect) {
                deliveryMethodSelect.addEventListener('change', function () {
                    updateFees();
                    toggleAddressFields();
                });
            }

            if (educationTypeSelect) {
                educationTypeSelect.addEventListener('change', function () {
                    updateFees();
                    toggleEducationCompletionField();
                });
            }

            if (findAddressButton) {
                findAddressButton.addEventListener('click', openPostcodeSearch);
            }

            if (renewalForm) {
                renewalForm.addEventListener('submit', handleFormSubmit);
            }

            // 초기 상태 설정
            checkAuthState();
            updateFees();
            toggleAddressFields();
            toggleEducationCompletionField();
            setupModalEvents();
            setupFaqAccordion();

            // 인증 상태 변경 이벤트 리스너
            document.addEventListener('authStateChanged', checkAuthState);
        },

        /**
         * 자격증 갱신 인터페이스 업데이트
         */
        updateCertRenewalInterface: function () {
            const activeCertificates = document.getElementById('active-certificates');
            const loginRequired = document.getElementById('login-required');
            const noCertificates = document.getElementById('no-certificates');
            const renewalForm = document.getElementById('renewal-form');

            // 로그인 상태 확인
            if (!window.dhcFirebase || !window.dhcFirebase.auth.currentUser) {
                // 비로그인 상태
                if (activeCertificates) activeCertificates.classList.add('hidden');
                if (loginRequired) loginRequired.classList.remove('hidden');
                if (noCertificates) noCertificates.classList.add('hidden');
                if (renewalForm) renewalForm.classList.add('hidden');

                return;
            }

            // 로그인 상태에서는 사용자의 만료 예정 자격증 확인
            const userId = window.dhcFirebase.auth.currentUser.uid;

            window.dhcFirebase.db.collection('certificates')
                .where('userId', '==', userId)
                .where('status', '==', 'active')
                .get()
                .then(snapshot => {
                    if (snapshot.empty) {
                        // 갱신 가능한 자격증이 없는 경우
                        if (activeCertificates) activeCertificates.classList.add('hidden');
                        if (loginRequired) loginRequired.classList.add('hidden');
                        if (noCertificates) noCertificates.classList.remove('hidden');
                        if (renewalForm) renewalForm.classList.add('hidden');
                    } else {
                        // 갱신 가능한 자격증이 있는 경우
                        if (activeCertificates) {
                            activeCertificates.classList.remove('hidden');
                            activeCertificates.innerHTML = '';

                            // 현재 날짜 기준 1년 이내 만료 예정인 자격증만 필터링
                            const oneYearFromNow = new Date();
                            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

                            let hasRenewableCerts = false;

                            // 자격증 목록 표시
                            snapshot.forEach(doc => {
                                const certificate = doc.data();
                                const expiryDate = certificate.expiryDate.toDate();

                                // 만료일이 1년 이내인 자격증만 표시
                                if (expiryDate <= oneYearFromNow) {
                                    hasRenewableCerts = true;

                                    const certItem = document.createElement('div');
                                    certItem.className = 'bg-white border rounded-lg p-4 mb-4';

                                    // 만료 임박 표시 (90일 이내)
                                    const ninetyDaysFromNow = new Date();
                                    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

                                    const isExpiringSoon = expiryDate <= ninetyDaysFromNow;

                                    certItem.innerHTML = `
                                        <div class="flex justify-between items-center mb-2">
                                            <h3 class="font-bold text-lg">${certificate.certType === 'health' ? '건강운동처방사' :
                                            certificate.certType === 'rehab' ? '운동재활전문가' :
                                                certificate.certType === 'pilates' ? '필라테스 전문가' :
                                                    '레크리에이션지도자'}</h3>
                                            <span class="bg-${isExpiringSoon ? 'red' : 'yellow'}-100 text-${isExpiringSoon ? 'red' : 'yellow'}-800 px-2 py-1 rounded text-sm font-medium">
                                                ${isExpiringSoon ? '만료 임박' : '갱신 가능'}
                                            </span>
                                        </div>
                                        <div class="text-gray-600 mb-2">
                                            <p>자격증 번호: ${certificate.certNumber}</p>
                                            <p>발급일: ${window.formatters.formatDate(certificate.issueDate, 'YYYY.MM.DD')}</p>
                                            <p>만료일: ${window.formatters.formatDate(certificate.expiryDate, 'YYYY.MM.DD')}</p>
                                        </div>
                                        <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mt-2 w-full renew-certificate-btn" data-cert-id="${doc.id}" data-cert-type="${certificate.certType}">
                                            갱신 신청
                                        </button>
                                    `;

                                    activeCertificates.appendChild(certItem);
                                }
                            });

                            if (!hasRenewableCerts) {
                                // 갱신 가능한 자격증이 없는 경우
                                activeCertificates.innerHTML = `
                                    <div class="bg-blue-50 p-4 rounded-lg">
                                        <p class="text-center text-gray-600">현재 갱신이 필요한 자격증이 없습니다.</p>
                                        <p class="text-center text-gray-600 mt-2">자격증은 만료일 1년 이내에 갱신 신청이 가능합니다.</p>
                                    </div>
                                `;
                            } else {
                                // 갱신 신청 버튼 이벤트 처리
                                const renewBtns = document.querySelectorAll('.renew-certificate-btn');
                                renewBtns.forEach(btn => {
                                    btn.addEventListener('click', window.educationPage.handleCertificateRenewalSelection);
                                });
                            }
                        }

                        if (loginRequired) loginRequired.classList.add('hidden');
                        if (noCertificates) noCertificates.classList.add('hidden');
                        // 폼은 갱신할 자격증 선택 시 표시됨
                        if (renewalForm) renewalForm.classList.add('hidden');
                    }
                })
                .catch(error => {
                    console.error('자격증 조회 오류:', error);
                });
        },

        /**
         * 자격증 갱신 선택 처리
         */
        handleCertificateRenewalSelection: function () {
            const certId = this.getAttribute('data-cert-id');
            const certType = this.getAttribute('data-cert-type');

            // 자격증 ID 및 유형 설정
            const certIdInput = document.getElementById('cert-id');
            const certTypeSelect = document.getElementById('cert-type');

            if (certIdInput) {
                certIdInput.value = certId;
            }

            if (certTypeSelect) {
                certTypeSelect.value = certType;
            }

            // 선택한 자격증 정보 표시
            window.dhcFirebase.db.collection('certificates').doc(certId)
                .get()
                .then(doc => {
                    if (doc.exists) {
                        const certificate = doc.data();

                        // 폼에 자격증 정보 표시
                        const certNumberInput = document.getElementById('cert-number');
                        const issueDateInput = document.getElementById('issue-date');
                        const expiryDateInput = document.getElementById('expiry-date');

                        if (certNumberInput) {
                            certNumberInput.value = certificate.certNumber;
                        }

                        if (issueDateInput) {
                            issueDateInput.value = window.formatters.formatDate(certificate.issueDate, 'YYYY.MM.DD');
                        }

                        if (expiryDateInput) {
                            expiryDateInput.value = window.formatters.formatDate(certificate.expiryDate, 'YYYY.MM.DD');
                        }

                        // 갱신 신청 폼 표시
                        const renewalForm = document.getElementById('renewal-form');
                        if (renewalForm) {
                            renewalForm.classList.remove('hidden');
                        }

                        // 폼으로 스크롤
                        renewalForm.scrollIntoView({ behavior: 'smooth' });
                    }
                })
                .catch(error => {
                    console.error('자격증 정보 조회 오류:', error);
                });
        },

        /**
         * 자격증 갱신 신청 폼 제출 처리
         * 
         * @param {Event} event - 폼 제출 이벤트
         */
        handleCertRenewalSubmit: function (event) {
            event.preventDefault();

            // 유효성 검사
            if (!window.educationPage.validateCertRenewalForm()) {
                return;
            }

            // 폼 데이터 수집
            const formData = new FormData(this);
            const renewalData = {};

            for (const [key, value] of formData.entries()) {
                renewalData[key] = value;
            }

            // 로그인 상태 확인
            if (window.dhcFirebase && window.dhcFirebase.auth.currentUser) {
                // 사용자 ID 추가
                renewalData.userId = window.dhcFirebase.auth.currentUser.uid;
                renewalData.userEmail = window.dhcFirebase.auth.currentUser.email;
                renewalData.createdAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                renewalData.status = 'pending'; // 대기 상태로 시작

                // Firebase에 갱신 신청 데이터 저장
                window.dhcFirebase.db.collection('certRenewalRequests').add(renewalData)
                    .then(docRef => {
                        console.log('자격증 갱신 신청 성공:', docRef.id);

                        // 결제 페이지로 이동
                        window.location.href = `payment.html?type=cert-renewal&product_id=${renewalData['cert-type']}`;
                    })
                    .catch(error => {
                        console.error('자격증 갱신 신청 오류:', error);
                        alert('갱신 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
                    });
            } else {
                // 비로그인 상태면 로그인 페이지로 리디렉션
                alert('로그인이 필요한 서비스입니다.');
                window.location.href = '../auth/login.html?redirect=' + encodeURIComponent(window.location.href);
            }
        },

        /**
         * 자격증 갱신 신청 폼 유효성 검사
         * 
         * @returns {boolean} - 유효성 검사 결과
         */
        validateCertRenewalForm: function () {
            const certId = document.getElementById('cert-id');
            const phoneInput = document.getElementById('phone');
            const addressInput = document.getElementById('address');
            const continueEdInput = document.getElementById('continue-ed-hours');
            const agreeTerms = document.getElementById('agree-terms');

            // 필수 항목 확인
            if (!certId.value) {
                alert('자격증 정보가 누락되었습니다.');
                return false;
            }

            if (!phoneInput.value.trim() || !window.validators.isValidPhone(phoneInput.value)) {
                alert('유효한 전화번호를 입력해주세요.');
                phoneInput.focus();
                return false;
            }

            if (!addressInput.value.trim()) {
                alert('주소를 입력해주세요.');
                addressInput.focus();
                return false;
            }

            if (!continueEdInput.value.trim()) {
                alert('보수교육 이수 시간을 입력해주세요.');
                continueEdInput.focus();
                return false;
            }

            if (!agreeTerms.checked) {
                alert('갱신 약관에 동의해주세요.');
                agreeTerms.focus();
                return false;
            }

            return true;
        }
    };

    // 문서 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', function () {
        window.educationPage.init();
    });
})();