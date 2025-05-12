/**
 * pilates.js
 * 필라테스 전문가 자격증 페이지 전용 스크립트
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // 필라테스 전문가 자격증 정보
    const certificateData = {
        certificateId: 'pilates',
        name: '필라테스 전문가',
        description: '과학적 운동법을 기반으로 한 필라테스 지도 전문가',
        registrationNumber: '제2023-12347호',
        examSchedule: {
            registrationPeriod: '2025.05.01-2025.05.31',
            examDate: '2025.06.20 (토)',
            resultDate: '2025.07.05',
            locations: ['서울', '부산', '대구']
        },
        curriculum: {
            theory: 100, // 이론 교육 시간
            practice: 200, // 실습 교육 시간
            total: 300
        },
        price: {
            fullCourse: 3500000,
            theoryCourse: 1000000,
            practiceCourse: 2700000,
            examFee: {
                written: 80000,
                practical: 150000,
                certificate: 50000
            }
        }
    };

    /**
     * 시험 일정 카운트다운 표시
     */
    function displayExamCountdown() {
        const examCountdownElement = document.getElementById('exam-countdown');
        if (!examCountdownElement) return;

        const examDate = new Date('2025-06-20');
        const today = new Date();
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            examCountdownElement.innerHTML = `
                <div class="bg-purple-100 border-l-4 border-purple-500 text-purple-700 p-4 mb-6">
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
                            <span id="course-price" class="font-bold">₩3,500,000</span>
                        </div>
                        <div class="flex justify-between items-center text-red-600">
                            <span>할인액:</span>
                            <span id="discount-amount" class="font-bold">₩0</span>
                        </div>
                        <div class="flex justify-between items-center text-lg font-bold border-t mt-2 pt-2">
                            <span>최종 금액:</span>
                            <span id="final-price" class="text-purple-600">₩3,500,000</span>
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
                question: '필라테스 전문가 자격증은 국제적으로 인정받나요?',
                answer: '디지털헬스케어센터의 필라테스 전문가 자격증은 국내에서 널리 인정받는 민간자격증입니다. 추가로 PMA(Pilates Method Alliance) 등 국제 자격증을 취득하면 해외에서도 활동이 가능합니다.'
            },
            {
                question: '필라테스 기구가 없어도 교육받을 수 있나요?',
                answer: '실습 교육은 교육기관에 구비된 다양한 필라테스 기구를 활용하여 진행됩니다. 개인적으로 기구를 구입할 필요는 없으며, 교육 과정에서 모든 기구의 사용법을 익힐 수 있습니다.'
            },
            {
                question: '비전공자도 필라테스 전문가가 될 수 있나요?',
                answer: '네, 가능합니다. 필라테스에 대한 열정과 관심이 있다면 누구나 전문가가 될 수 있습니다. 교육과정에서 기초부터 체계적으로 학습할 수 있도록 커리큘럼이 구성되어 있습니다.'
            },
            {
                question: '필라테스 스튜디오 창업에 필요한 것은 무엇인가요?',
                answer: '필라테스 전문가 자격증, 사업자 등록, 적절한 공간, 필라테스 기구가 기본적으로 필요합니다. 교육과정에서 스튜디오 운영 및 경영에 대한 내용도 포함하여 창업 준비에 도움을 드립니다.'
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
                description: '재활 필라테스 프로그램 운영을 위한 전문 자격'
            },
            {
                name: '건강운동처방사',
                url: 'health-exercise.html',
                description: '건강 증진을 위한 운동 프로그램 설계'
            },
            {
                name: '요가 지도자',
                url: '#',
                description: '필라테스와 함께 종합적인 Mind-Body 프로그램 운영'
            }
        ];

        let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
        relatedCertificates.forEach(cert => {
            html += `
                <div class="bg-white p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h4 class="font-bold mb-2">${cert.name}</h4>
                    <p class="text-sm text-gray-600 mb-3">${cert.description}</p>
                    <a href="${cert.url}" class="text-purple-600 hover:text-purple-800 text-sm font-medium">자세히 보기 →</a>
                </div>
            `;
        });
        html += '</div>';

        relatedElement.innerHTML = html;
    }

    /**
     * 필라테스 기구 소개 슬라이더
     */
    function setupEquipmentSlider() {
        const sliderElement = document.getElementById('equipment-slider');
        if (!sliderElement) return;

        const equipment = [
            {
                name: '리포머(Reformer)',
                description: '스프링 저항을 이용한 전신 운동 기구로 필라테스의 핵심 장비입니다.',
                image: '../../assets/images/equipment/reformer.jpg'
            },
            {
                name: '캐딜락(Cadillac)',
                description: '다양한 스프링과 바를 활용한 종합 운동 기구입니다.',
                image: '../../assets/images/equipment/cadillac.jpg'
            },
            {
                name: '체어(Chair)',
                description: '다리와 코어 강화에 효과적인 컴팩트한 기구입니다.',
                image: '../../assets/images/equipment/chair.jpg'
            },
            {
                name: '배럴(Barrel)',
                description: '척추의 유연성과 코어 강화를 위한 곡선형 기구입니다.',
                image: '../../assets/images/equipment/barrel.jpg'
            }
        ];

        let currentIndex = 0;

        function renderSlider() {
            const item = equipment[currentIndex];
            sliderElement.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">필라테스 기구 소개</h3>
                        <div>
                            <button id="prev-btn" class="mr-2 p-2 rounded bg-gray-200 hover:bg-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            <button id="next-btn" class="p-2 rounded bg-gray-200 hover:bg-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="text-center">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-cover rounded-lg mb-4" onerror="this.src='../../assets/images/placeholder.jpg'">
                        <h4 class="font-bold text-lg mb-2">${item.name}</h4>
                        <p class="text-gray-600">${item.description}</p>
                    </div>
                    <div class="flex justify-center mt-4">
                        ${equipment.map((_, index) => `
                            <button class="w-2 h-2 rounded-full mx-1 ${index === currentIndex ? 'bg-purple-600' : 'bg-gray-300'}" data-index="${index}"></button>
                        `).join('')}
                    </div>
                </div>
            `;

            // 이벤트 리스너 설정
            const prevBtn = sliderElement.querySelector('#prev-btn');
            const nextBtn = sliderElement.querySelector('#next-btn');
            const dots = sliderElement.querySelectorAll('[data-index]');

            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + equipment.length) % equipment.length;
                renderSlider();
            });

            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % equipment.length;
                renderSlider();
            });

            dots.forEach(dot => {
                dot.addEventListener('click', () => {
                    currentIndex = parseInt(dot.dataset.index);
                    renderSlider();
                });
            });
        }

        renderSlider();
    }

    /**
     * 필라테스 프로그램 타임라인
     */
    function setupProgramTimeline() {
        const timelineElement = document.getElementById('program-timeline');
        if (!timelineElement) return;

        const programs = [
            {
                level: '초급',
                duration: '1-3개월',
                content: '기본 자세 습득, 호흡법 익히기, 코어 인지 훈련, 기초 매트 동작'
            },
            {
                level: '중급',
                duration: '4-6개월',
                content: '기구 활용 동작, 근력 강화 운동, 균형 감각 향상, 중급 매트 시퀀스'
            },
            {
                level: '고급',
                duration: '6개월 이상',
                content: '고난도 기구 운동, 전신 협응력 향상, 고급 매트 시퀀스, 플로우 프로그램'
            }
        ];

        let html = '<div class="relative">';
        programs.forEach((program, index) => {
            html += `
                <div class="mb-8 flex">
                    <div class="flex flex-col items-center mr-4">
                        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white font-bold mb-2">
                            ${index + 1}
                        </div>
                        ${index < programs.length - 1 ? '<div class="w-px h-full bg-purple-300"></div>' : ''}
                    </div>
                    <div class="bg-white p-4 rounded-lg border flex-1">
                        <h4 class="font-bold text-lg mb-2">${program.level}</h4>
                        <p class="text-sm text-gray-600 mb-2">기간: ${program.duration}</p>
                        <p class="text-gray-700">${program.content}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        timelineElement.innerHTML = html;
    }

    /**
     * 수강 후기 표시
     */
    function displayTestimonials() {
        const testimonialsElement = document.getElementById('testimonials');
        if (!testimonialsElement) return;

        const testimonials = [
            {
                name: '김지현',
                age: 32,
                occupation: '필라테스 강사',
                rating: 5,
                review: '체계적인 커리큘럼과 실무 중심의 교육 덕분에 자신있게 필라테스를 지도할 수 있게 되었습니다. 특히 기구 실습 시간이 충분해서 좋았어요.'
            },
            {
                name: '이수진',
                age: 28,
                occupation: '필라테스 스튜디오 운영',
                rating: 5,
                review: '기초부터 심화까지 단계별로 잘 구성된 교육과정이었습니다. 창업 준비에 큰 도움이 되었고, 현재 성공적으로 스튜디오를 운영 중입니다.'
            },
            {
                name: '박민영',
                age: 35,
                occupation: '재활 필라테스 전문가',
                rating: 5,
                review: '물리치료사로 일하다가 필라테스를 추가로 배웠는데, 재활 분야에 특화된 내용이 많아 실무에 바로 적용할 수 있었습니다.'
            }
        ];

        let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">';
        testimonials.forEach(testimonial => {
            html += `
                <div class="bg-white p-6 rounded-lg border">
                    <div class="flex items-center mb-4">
                        <div class="mr-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                ${testimonial.name.charAt(0)}
                            </div>
                        </div>
                        <div>
                            <h4 class="font-bold">${testimonial.name}</h4>
                            <p class="text-sm text-gray-600">${testimonial.occupation}</p>
                        </div>
                    </div>
                    <div class="mb-3">
                        ${Array(testimonial.rating).fill().map(() => '⭐').join('')}
                    </div>
                    <p class="text-gray-700">${testimonial.review}</p>
                </div>
            `;
        });
        html += '</div>';

        testimonialsElement.innerHTML = html;
    }

    /**
     * 필라테스 6대 원칙 인포그래픽
     */
    function setupPrinciplesInfographic() {
        const principlesElement = document.getElementById('pilates-principles');
        if (!principlesElement) return;

        const principles = [
            {
                name: '집중(Concentration)',
                description: '모든 동작에 의식을 집중하여 수행',
                icon: '🧠'
            },
            {
                name: '조절(Control)',
                description: '모든 움직임을 정확하게 조절',
                icon: '🎯'
            },
            {
                name: '중심(Centering)',
                description: '몸의 중심부에서 움직임이 시작',
                icon: '⭕'
            },
            {
                name: '흐름(Flow)',
                description: '부드럽고 유연한 동작의 연결',
                icon: '🌊'
            },
            {
                name: '정확성(Precision)',
                description: '정확한 자세와 동작 수행',
                icon: '✅'
            },
            {
                name: '호흡(Breathing)',
                description: '올바른 호흡으로 움직임 조절',
                icon: '💨'
            }
        ];

        let html = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
        principles.forEach(principle => {
            html += `
                <div class="bg-purple-50 p-4 rounded-lg text-center">
                    <div class="text-3xl mb-2">${principle.icon}</div>
                    <h4 class="font-bold mb-2">${principle.name}</h4>
                    <p class="text-sm text-gray-600">${principle.description}</p>
                </div>
            `;
        });
        html += '</div>';

        principlesElement.innerHTML = html;
    }

    /**
     * 페이지 초기화
     */
    function init() {
        // 현재 페이지가 필라테스 자격증 페이지인지 확인
        if (!document.body.classList.contains('pilates-certificate-page') && 
            !window.location.pathname.includes('pilates.html')) {
            return;
        }

        displayExamCountdown();
        setupCostCalculator();
        setupFAQAccordion();
        displayRelatedCertificates();
        setupEquipmentSlider();
        setupProgramTimeline();
        displayTestimonials();
        setupPrinciplesInfographic();

        // 탭 전환 시 색상 변경 (필라테스는 보라색 테마)
        const tabLinks = document.querySelectorAll('[data-tab]');
        tabLinks.forEach(link => {
            link.addEventListener('click', function() {
                // 기존 활성 탭 스타일 제거
                tabLinks.forEach(l => {
                    l.classList.remove('text-purple-600', 'border-purple-600');
                    l.classList.add('text-gray-500');
                });
                
                // 새 활성 탭 스타일 적용
                this.classList.remove('text-gray-500');
                this.classList.add('text-purple-600', 'border-purple-600');
            });
        });
    }

    // 페이지 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', init);
})();