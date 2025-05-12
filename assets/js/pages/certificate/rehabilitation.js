/**
 * rehabilitation.js
 * 운동재활전문가 자격증 페이지 전용 스크립트
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // 운동재활전문가 자격증 정보
    const certificateData = {
        certificateId: 'rehabilitation',
        name: '운동재활전문가',
        description: '부상 및 질환 이후 재활을 위한 운동재활 전문가',
        registrationNumber: '제2023-12346호',
        examSchedule: {
            registrationPeriod: '2025.03.01-2025.03.31',
            examDate: '2025.04.20 (토)',
            resultDate: '2025.05.10',
            locations: ['서울', '부산', '대구', '대전']
        },
        curriculum: {
            theory: 80, // 이론 교육 시간
            practice: 70, // 실습 교육 시간
            total: 150
        },
        price: {
            fullCourse: 1500000,
            theoryCourse: 800000,
            practiceCourse: 800000,
            examFee: {
                written: 60000,
                practical: 90000,
                certificate: 30000
            }
        }
    };

    /**
     * 시험 일정 카운트다운 표시
     */
    function displayExamCountdown() {
        const examCountdownElement = document.getElementById('exam-countdown');
        if (!examCountdownElement) return;

        const examDate = new Date('2025-04-20');
        const today = new Date();
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            examCountdownElement.innerHTML = `
                <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                    <p class="font-bold">다음 시험까지 D-${diffDays}</p>
                    <p>시험일: ${certificateData.examSchedule.examDate}</p>
                </div>
            `;
        }
    }

    /**
     * 교육비 계산기
     */
    function setupCostCalculator() {
        const calculatorElement = document.getElementById('cost-calculator');
        if (!calculatorElement) return;

        const html = `
            <div class="bg-white p-6 border rounded-lg">
                <h4 class="font-bold mb-4">교육비 계산기</h4>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">교육 과정 선택</label>
                        <select id="course-type" class="w-full p-2 border rounded">
                            <option value="full">전체 과정 (이론+실습)</option>
                            <option value="theory">이론 과정만</option>
                            <option value="practice">실습 과정만</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">할인 유형</label>
                        <select id="discount-type" class="w-full p-2 border rounded">
                            <option value="none">해당 없음</option>
                            <option value="early">조기 신청 (10%)</option>
                            <option value="student">학생 할인 (15%)</option>
                            <option value="group">단체 할인 (20%)</option>
                            <option value="professional">의료인 할인 (25%)</option>
                        </select>
                    </div>
                    <div class="border-t pt-4">
                        <div class="flex justify-between items-center">
                            <span>교육비:</span>
                            <span id="course-price" class="font-bold">₩1,500,000</span>
                        </div>
                        <div class="flex justify-between items-center text-red-600">
                            <span>할인액:</span>
                            <span id="discount-amount" class="font-bold">₩0</span>
                        </div>
                        <div class="flex justify-between items-center text-lg font-bold border-t mt-2 pt-2">
                            <span>최종 금액:</span>
                            <span id="final-price" class="text-green-600">₩1,500,000</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        calculatorElement.innerHTML = html;

        // 이벤트 리스너 설정
        const courseTypeSelect = document.getElementById('course-type');
        const discountTypeSelect = document.getElementById('discount-type');

        function calculatePrice() {
            const courseType = courseTypeSelect.value;
            const discountType = discountTypeSelect.value;

            let basePrice = 0;
            switch (courseType) {
                case 'full':
                    basePrice = certificateData.price.fullCourse;
                    break;
                case 'theory':
                    basePrice = certificateData.price.theoryCourse;
                    break;
                case 'practice':
                    basePrice = certificateData.price.practiceCourse;
                    break;
            }

            let discountRate = 0;
            switch (discountType) {
                case 'early':
                    discountRate = 0.10;
                    break;
                case 'student':
                    discountRate = 0.15;
                    break;
                case 'group':
                    discountRate = 0.20;
                    break;
                case 'professional':
                    discountRate = 0.25;
                    break;
            }

            const discountAmount = basePrice * discountRate;
            const finalPrice = basePrice - discountAmount;

            document.getElementById('course-price').textContent = `₩${basePrice.toLocaleString()}`;
            document.getElementById('discount-amount').textContent = `₩${discountAmount.toLocaleString()}`;
            document.getElementById('final-price').textContent = `₩${finalPrice.toLocaleString()}`;
        }

        courseTypeSelect.addEventListener('change', calculatePrice);
        discountTypeSelect.addEventListener('change', calculatePrice);
    }

    /**
     * FAQ 아코디언
     */
    function setupFAQAccordion() {
        const faqElement = document.getElementById('certificate-faq');
        if (!faqElement) return;

        const faqs = [
            {
                question: '운동재활전문가와 물리치료사의 차이점은 무엇인가요?',
                answer: '물리치료사는 의료법에 따른 국가면허 자격으로 의료기관에서 의사의 처방에 따라 물리치료를 수행합니다. 운동재활전문가는 운동을 통한 기능회복에 중점을 두며, 운동재활센터, 스포츠센터 등에서 자율적으로 재활운동 프로그램을 제공할 수 있습니다.'
            },
            {
                question: '의료기관에서도 운동재활전문가로 근무할 수 있나요?',
                answer: '네, 가능합니다. 재활의학과, 정형외과 등 의료기관에서 운동재활실을 운영하는 경우가 많으며, 운동재활전문가는 의료진과 협업하여 환자의 운동재활 프로그램을 담당할 수 있습니다.'
            },
            {
                question: '실습 교육은 어디에서 진행되나요?',
                answer: '실습 교육은 디지털헬스케어센터가 운영하는 실습센터와 협약 의료기관, 스포츠재활센터에서 진행됩니다. 실제 환자 케이스를 다루며 현장 실무 능력을 기를 수 있습니다.'
            },
            {
                question: '운동재활전문가의 평균 연봉은 얼마인가요?',
                answer: '경력에 따라 차이가 있지만, 초봉은 약 2,800~3,500만원, 경력 5년 이상은 4,500~6,000만원 수준입니다. 개인 스튜디오 운영 시 더 높은 수입도 가능합니다.'
            },
            {
                question: '자격증 갱신은 어떻게 하나요?',
                answer: '운동재활전문가 자격증의 유효기간은 3년이며, 갱신을 위해서는 보수교육 20시간 이상을 이수하고 갱신비용 40,000원을 납부하시면 됩니다.'
            }
        ];

        let html = '<div class="space-y-4">';
        faqs.forEach((faq, index) => {
            html += `
                <div class="border rounded-lg">
                    <button class="faq-question w-full text-left p-4 font-bold hover:bg-gray-50 focus:outline-none focus:bg-gray-50" data-index="${index}">
                        ${faq.question}
                        <span class="float-right">+</span>
                    </button>
                    <div class="faq-answer hidden p-4 border-t bg-gray-50">
                        <p>${faq.answer}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        faqElement.innerHTML = html;

        // 이벤트 리스너 설정
        const faqQuestions = faqElement.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const answer = this.nextElementSibling;
                const icon = this.querySelector('span');
                
                // 다른 FAQ 닫기
                faqQuestions.forEach(q => {
                    if (q !== this) {
                        q.nextElementSibling.classList.add('hidden');
                        q.querySelector('span').textContent = '+';
                    }
                });

                // 토글
                if (answer.classList.contains('hidden')) {
                    answer.classList.remove('hidden');
                    icon.textContent = '−';
                } else {
                    answer.classList.add('hidden');
                    icon.textContent = '+';
                }
            });
        });
    }

    /**
     * 관련 자격증 추천
     */
    function displayRelatedCertificates() {
        const relatedElement = document.getElementById('related-certificates');
        if (!relatedElement) return;

        const relatedCertificates = [
            {
                name: '건강운동처방사',
                url: 'health-exercise.html',
                description: '운동을 통한 건강증진과 질병예방 전문가'
            },
            {
                name: '스포츠마사지사',
                url: '#',
                description: '스포츠마사지 및 근육이완 전문가'
            },
            {
                name: 'ATC (Athletic Trainer)',
                url: '#',
                description: '운동선수 재활 트레이닝 전문가'
            }
        ];

        let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
        relatedCertificates.forEach(cert => {
            html += `
                <div class="bg-white p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h4 class="font-bold mb-2">${cert.name}</h4>
                    <p class="text-sm text-gray-600 mb-3">${cert.description}</p>
                    <a href="${cert.url}" class="text-green-600 hover:text-green-800 text-sm font-medium">자세히 보기 →</a>
                </div>
            `;
        });
        html += '</div>';

        relatedElement.innerHTML = html;
    }

    /**
     * 케이스 스터디 표시
     */
    function displayCaseStudies() {
        const caseStudyElement = document.getElementById('case-studies');
        if (!caseStudyElement) return;

        const caseStudies = [
            {
                title: '전방십자인대 재건술 후 재활',
                description: 'ACL 재건술 후 6개월간의 단계별 재활 프로그램',
                duration: '6개월',
                result: '완전 복귀'
            },
            {
                title: '회전근개 파열 보존적 치료',
                description: '수술 없이 운동재활로 회전근개 기능 회복',
                duration: '3개월',
                result: '80% 기능 회복'
            },
            {
                title: '뇌졸중 후 보행 재활',
                description: '뇌졸중 환자의 독립적 보행 능력 회복 프로그램',
                duration: '12개월',
                result: '독립보행 가능'
            }
        ];

        let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
        caseStudies.forEach(study => {
            html += `
                <div class="bg-white p-4 border rounded-lg">
                    <h4 class="font-bold mb-2">${study.title}</h4>
                    <p class="text-sm text-gray-600 mb-3">${study.description}</p>
                    <div class="flex justify-between text-sm">
                        <span class="text-green-600">기간: ${study.duration}</span>
                        <span class="text-blue-600">결과: ${study.result}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        caseStudyElement.innerHTML = html;
    }

    /**
     * 페이지 초기화
     */
    function init() {
        displayExamCountdown();
        setupCostCalculator();
        setupFAQAccordion();
        displayRelatedCertificates();
        displayCaseStudies();
    }

    // 페이지 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', init);
})();