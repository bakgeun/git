/**
 * health-exercise.js
 * 건강운동처방사 자격증 페이지 전용 스크립트
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // 건강운동처방사 자격증 정보
    const certificateData = {
        certificateId: 'health-exercise',
        name: '건강운동처방사',
        description: '운동을 통한 건강증진과 질병예방을 위한 운동처방 전문가',
        registrationNumber: '제2023-12345호',
        examSchedule: {
            registrationPeriod: '2025.02.01-2025.02.28',
            examDate: '2025.03.15 (토)',
            resultDate: '2025.03.31',
            locations: ['서울', '부산', '대구', '광주']
        },
        curriculum: {
            theory: 60, // 이론 교육 시간
            practice: 60, // 실습 교육 시간
            total: 120
        },
        price: {
            fullCourse: 1200000,
            theoryCourse: 600000,
            practiceCourse: 700000,
            examFee: {
                written: 50000,
                practical: 70000,
                certificate: 20000
            }
        }
    };

    /**
     * 시험 일정 카운트다운 표시
     */
    function displayExamCountdown() {
        const examCountdownElement = document.getElementById('exam-countdown');
        if (!examCountdownElement) return;

        const examDate = new Date('2025-03-15');
        const today = new Date();
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            examCountdownElement.innerHTML = `
                <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
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
                        </select>
                    </div>
                    <div class="border-t pt-4">
                        <div class="flex justify-between items-center">
                            <span>교육비:</span>
                            <span id="course-price" class="font-bold">₩1,200,000</span>
                        </div>
                        <div class="flex justify-between items-center text-red-600">
                            <span>할인액:</span>
                            <span id="discount-amount" class="font-bold">₩0</span>
                        </div>
                        <div class="flex justify-between items-center text-lg font-bold border-t mt-2 pt-2">
                            <span>최종 금액:</span>
                            <span id="final-price" class="text-blue-600">₩1,200,000</span>
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
                question: '건강운동처방사 자격증은 국가공인 자격증인가요?',
                answer: '디지털헬스케어센터의 건강운동처방사는 등록 민간자격증으로, 업계에서 널리 인정받는 공신력 있는 자격증입니다. 건강운동 분야 전문기관 취업 시 우대 혜택이 있습니다.'
            },
            {
                question: '교육 과정을 온라인으로만 수강할 수 있나요?',
                answer: '이론 교육(60시간)은 온라인으로 수강 가능하지만, 실습 교육(60시간)은 반드시 오프라인으로 참여해야 합니다. 실습은 실제 운동 장비를 사용한 실기 교육이 필수적이기 때문입니다.'
            },
            {
                question: '자격증 갱신은 어떻게 하나요?',
                answer: '건강운동처방사 자격증의 유효기간은 3년이며, 갱신을 위해서는 보수교육 16시간 이상을 이수하고 갱신비용 30,000원을 납부하시면 됩니다.'
            },
            {
                question: '비전공자도 자격증 취득이 가능한가요?',
                answer: '네, 가능합니다. 고등학교 졸업 이상 학력 소지자로서 관련 분야 실무경력 2년 이상이거나, 디지털헬스케어센터 지정 교육기관에서 교육과정을 이수하시면 응시 자격이 주어집니다.'
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
                name: '운동재활전문가',
                url: 'rehabilitation.html',
                description: '부상 및 질환 후 재활을 위한 운동 전문가'
            },
            {
                name: '필라테스 전문가',
                url: 'pilates.html',
                description: '필라테스 실기 및 이론 지도 전문가'
            },
            {
                name: '노인체육지도자',
                url: '#',
                description: '노인 대상 맞춤형 운동 프로그램 전문가'
            }
        ];

        let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
        relatedCertificates.forEach(cert => {
            html += `
                <div class="bg-white p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h4 class="font-bold mb-2">${cert.name}</h4>
                    <p class="text-sm text-gray-600 mb-3">${cert.description}</p>
                    <a href="${cert.url}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">자세히 보기 →</a>
                </div>
            `;
        });
        html += '</div>';

        relatedElement.innerHTML = html;
    }

    /**
     * 페이지 초기화
     */
    function init() {
        displayExamCountdown();
        setupCostCalculator();
        setupFAQAccordion();
        displayRelatedCertificates();
    }

    // 페이지 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', init);
})();