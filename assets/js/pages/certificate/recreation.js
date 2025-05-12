/**
 * recreation.js
 * 레크리에이션지도자 자격증 페이지 전용 스크립트
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // 레크리에이션지도자 자격증 정보
    const certificateData = {
        certificateId: 'recreation',
        name: '레크리에이션지도자',
        description: '즐거운 여가활동과 프로그램을 기획하고 지도하는 전문가',
        registrationNumber: '제2023-12348호',
        examSchedule: {
            registrationPeriod: '2025.07.01-2025.07.31',
            examDate: '2025.08.16 (토)',
            resultDate: '2025.08.30',
            locations: ['서울', '부산', '대전']
        },
        curriculum: {
            theory: 40, // 이론 교육 시간
            practice: 80, // 실습 교육 시간
            total: 120
        },
        price: {
            fullCourse: 980000,
            theoryCourse: 300000,
            practiceCourse: 700000,
            examFee: {
                written: 40000,
                practical: 60000,
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

        const examDate = new Date('2025-08-16');
        const today = new Date();
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            examCountdownElement.innerHTML = `
                <div class="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-6">
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
                            <span id="course-price" class="font-bold">₩980,000</span>
                        </div>
                        <div class="flex justify-between items-center text-red-600">
                            <span>할인액:</span>
                            <span id="discount-amount" class="font-bold">₩0</span>
                        </div>
                        <div class="flex justify-between items-center text-lg font-bold border-t mt-2 pt-2">
                            <span>최종 금액:</span>
                            <span id="final-price" class="text-orange-600">₩980,000</span>
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
                question: '레크리에이션지도자는 어떤 분야에서 활동할 수 있나요?',
                answer: '교육기관, 복지시설, 기업체, 이벤트 기획사, 캠프장, 리조트 등 다양한 분야에서 활동할 수 있습니다. 프리랜서로 행사 진행이나 MC 활동도 가능합니다.'
            },
            {
                question: '특별한 재능이 없어도 레크리에이션지도자가 될 수 있나요?',
                answer: '네, 가능합니다. 레크리에이션은 기술보다는 소통능력과 창의성이 중요합니다. 교육과정을 통해 필요한 기법과 노하우를 체계적으로 배울 수 있습니다.'
            },
            {
                question: '레크리에이션지도자 자격증만으로 창업이 가능한가요?',
                answer: '이벤트 기획사, 파티플래너, 레크리에이션 강사 등으로 창업이 가능합니다. 특히 이벤트 기획 분야는 초기 투자 비용이 적어 창업에 유리합니다.'
            },
            {
                question: '치료레크리에이션과 일반 레크리에이션의 차이점은 무엇인가요?',
                answer: '치료레크리에이션은 의료적 목적으로 특수대상(노인, 장애인 등)의 재활과 치료를 돕는 프로그램이며, 일반 레크리에이션은 여가활동과 즐거움을 위한 프로그램입니다.'
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
                name: '청소년지도사',
                url: '#',
                description: '청소년 대상 프로그램 전문가'
            },
            {
                name: '사회복지사',
                url: '#',
                description: '복지시설 레크리에이션 프로그램 운영'
            },
            {
                name: '평생교육사',
                url: '#',
                description: '성인 대상 여가교육 프로그램 기획'
            }
        ];

        let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
        relatedCertificates.forEach(cert => {
            html += `
                <div class="bg-white p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h4 class="font-bold mb-2">${cert.name}</h4>
                    <p class="text-sm text-gray-600 mb-3">${cert.description}</p>
                    <a href="${cert.url}" class="text-orange-600 hover:text-orange-800 text-sm font-medium">자세히 보기 →</a>
                </div>
            `;
        });
        html += '</div>';

        relatedElement.innerHTML = html;
    }

    /**
     * 게임 카테고리 소개
     */
    function setupGameCategories() {
        const categoriesElement = document.getElementById('game-categories');
        if (!categoriesElement) return;

        const categories = [
            {
                name: '아이스브레이킹',
                description: '참가자들의 긴장을 풀고 친밀감을 형성하는 게임',
                examples: ['자기소개 게임', '몸풀기 게임', '분위기 전환 게임']
            },
            {
                name: '팀빌딩',
                description: '협동심과 소속감을 강화하는 팀 활동',
                examples: ['미션 게임', '릴레이 게임', '문제해결 게임']
            },
            {
                name: '실내게임',
                description: '공간 제약 없이 즐길 수 있는 실내 활동',
                examples: ['퀴즈 게임', '보드 게임', '창의력 게임']
            },
            {
                name: '실외게임',
                description: '야외에서 진행하는 활동적인 게임',
                examples: ['레크리에이션 스포츠', '추적 게임', '캠프파이어 게임']
            },
            {
                name: '특수대상 게임',
                description: '특정 대상을 위한 맞춤형 프로그램',
                examples: ['유아 게임', '실버 게임', '장애인 게임']
            },
            {
                name: '이벤트 게임',
                description: '행사나 파티를 위한 특별 프로그램',
                examples: ['경품 게임', '축하 게임', '테마 게임']
            }
        ];

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        categories.forEach(category => {
            html += `
                <div class="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
                    <h4 class="font-bold text-lg mb-2">${category.name}</h4>
                    <p class="text-gray-600 mb-3">${category.description}</p>
                    <div class="text-sm">
                        <p class="font-medium mb-1">예시:</p>
                        <ul class="list-disc pl-5 text-gray-600">
                            ${category.examples.map(example => `<li>${example}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        categoriesElement.innerHTML = html;
    }

    /**
     * 레크리에이션 프로그램 샘플
     */
    function displayProgramSamples() {
        const samplesElement = document.getElementById('program-samples');
        if (!samplesElement) return;

        const samples = [
            {
                title: '신입사원 오리엔테이션',
                duration: '3시간',
                participants: '20-30명',
                activities: ['아이스브레이킹', '팀빌딩 게임', '회사 퀴즈', '미션 수행']
            },
            {
                title: '노인복지관 실버레크리에이션',
                duration: '1시간',
                participants: '15-20명',
                activities: ['건강체조', '추억의 노래', '인지력 게임', '레크리에이션 댄스']
            },
            {
                title: '어린이집 생일파티',
                duration: '2시간',
                participants: '10-15명',
                activities: ['풍선 게임', '보물찾기', '생일 축하', '페이스페인팅']
            },
            {
                title: '가족 캠프 프로그램',
                duration: '2일 1박',
                participants: '5-10가족',
                activities: ['가족 미션', '캠프파이어', '별자리 관찰', '가족 운동회']
            }
        ];

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
        samples.forEach(sample => {
            html += `
                <div class="bg-orange-50 p-6 rounded-lg">
                    <h4 class="font-bold text-lg mb-3">${sample.title}</h4>
                    <div class="space-y-2 mb-3">
                        <p><span class="font-medium">진행시간:</span> ${sample.duration}</p>
                        <p><span class="font-medium">참가인원:</span> ${sample.participants}</p>
                    </div>
                    <div>
                        <p class="font-medium mb-1">주요 활동:</p>
                        <ul class="list-disc pl-5 text-gray-700">
                            ${sample.activities.map(activity => `<li>${activity}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        samplesElement.innerHTML = html;
    }

    /**
     * 수강 후기 표시
     */
    function displayTestimonials() {
        const testimonialsElement = document.getElementById('testimonials');
        if (!testimonialsElement) return;

        const testimonials = [
            {
                name: '최민준',
                age: 29,
                occupation: '이벤트 플래너',
                rating: 5,
                review: '실무에서 바로 활용할 수 있는 프로그램들을 많이 배웠습니다. 특히 MC 진행 실습이 정말 도움이 되었어요.'
            },
            {
                name: '정은주',
                age: 35,
                occupation: '사회복지사',
                rating: 5,
                review: '치료레크리에이션 부분이 특히 유익했습니다. 노인복지관에서 어르신들과 함께하는 프로그램 진행에 큰 도움이 되고 있어요.'
            },
            {
                name: '박서연',
                age: 26,
                occupation: '유치원 교사',
                rating: 5,
                review: '아이들과 함께할 수 있는 다양한 게임과 활동을 배웠습니다. 매일 수업에 활용하고 있어요!'
            }
        ];

        let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">';
        testimonials.forEach(testimonial => {
            html += `
                <div class="bg-white p-6 rounded-lg border">
                    <div class="flex items-center mb-4">
                        <div class="mr-4">
                            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
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
     * 레크리에이션 도구 소개
     */
    function setupEquipmentGallery() {
        const galleryElement = document.getElementById('equipment-gallery');
        if (!galleryElement) return;

        const equipment = [
            {
                name: '낙하산',
                description: '다양한 협동 게임에 활용되는 대형 낙하산',
                usage: '낙하산 놀이, 팀워크 게임'
            },
            {
                name: '훌라후프',
                description: '개인 및 단체 게임용 훌라후프',
                usage: '릴레이 게임, 체조 활동'
            },
            {
                name: '콩주머니',
                description: '던지기, 받기 게임용 콩주머니',
                usage: '표적 게임, 균형 게임'
            },
            {
                name: '리본막대',
                description: '리듬 활동용 컬러풀한 리본막대',
                usage: '댄스 게임, 창의적 표현'
            },
            {
                name: '원마커',
                description: '공간 구분 및 게임용 마커',
                usage: '영역 게임, 이동 게임'
            },
            {
                name: '음향장비',
                description: '행사 진행용 마이크와 스피커',
                usage: 'MC 진행, 음악 게임'
            }
        ];

        let html = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
        equipment.forEach(item => {
            html += `
                <div class="bg-white p-4 rounded-lg border text-center">
                    <div class="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <span class="text-2xl">🎯</span>
                    </div>
                    <h4 class="font-bold mb-1">${item.name}</h4>
                    <p class="text-sm text-gray-600 mb-2">${item.description}</p>
                    <p class="text-xs text-orange-600">${item.usage}</p>
                </div>
            `;
        });
        html += '</div>';

        galleryElement.innerHTML = html;
    }

    /**
     * 이벤트 캘린더
     */
    function setupEventCalendar() {
        const calendarElement = document.getElementById('event-calendar');
        if (!calendarElement) return;

        const events = [
            {
                month: '1월',
                events: ['신년 행사', '겨울 캠프', '설날 이벤트']
            },
            {
                month: '2월',
                events: ['발렌타인데이', '졸업식', '입학 오리엔테이션']
            },
            {
                month: '3월',
                events: ['봄맞이 축제', '신입사원 연수', '봄 캠프']
            },
            {
                month: '4월',
                events: ['벚꽃 축제', '지구의 날', '봄 소풍']
            },
            {
                month: '5월',
                events: ['어린이날', '가정의 달 행사', '스승의 날']
            },
            {
                month: '6월',
                events: ['현충일 행사', '하계 워크샵', '졸업 파티']
            }
        ];

        let html = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
        events.forEach(event => {
            html += `
                <div class="bg-orange-50 p-4 rounded-lg">
                    <h4 class="font-bold text-orange-600 mb-2">${event.month}</h4>
                    <ul class="text-sm space-y-1">
                        ${event.events.map(e => `<li>• ${e}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
        html += '</div>';

        calendarElement.innerHTML = html;
    }

    /**
     * 레크리에이션 프로그램 플래너
     */
    function setupProgramPlanner() {
        const plannerElement = document.getElementById('program-planner');
        if (!plannerElement) return;

        const html = `
            <div class="bg-white p-6 rounded-lg border">
                <h3 class="text-xl font-bold mb-4">나만의 레크리에이션 프로그램 만들기</h3>
                <form id="program-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">프로그램명</label>
                        <input type="text" id="program-name" class="w-full p-2 border rounded" placeholder="예: 우리 회사 워크샵">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">대상</label>
                        <select id="target-audience" class="w-full p-2 border rounded">
                            <option value="">선택하세요</option>
                            <option value="children">어린이</option>
                            <option value="teens">청소년</option>
                            <option value="adults">성인</option>
                            <option value="elderly">노인</option>
                            <option value="family">가족</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">참가인원</label>
                        <input type="number" id="participants" class="w-full p-2 border rounded" placeholder="예: 30">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">진행시간</label>
                        <select id="duration" class="w-full p-2 border rounded">
                            <option value="">선택하세요</option>
                            <option value="1hour">1시간</option>
                            <option value="2hours">2시간</option>
                            <option value="halfday">반나절</option>
                            <option value="fullday">하루</option>
                            <option value="overnight">1박2일</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">주요 활동 (최대 5개)</label>
                        <div id="activities-container" class="space-y-2">
                            <input type="text" class="activity-input w-full p-2 border rounded" placeholder="활동 1">
                        </div>
                        <button type="button" id="add-activity" class="mt-2 text-sm text-orange-600 hover:text-orange-700">+ 활동 추가</button>
                    </div>
                    <button type="submit" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded">
                        프로그램 계획서 생성
                    </button>
                </form>
                <div id="program-result" class="mt-6 hidden">
                    <h4 class="font-bold mb-3">프로그램 계획서</h4>
                    <div id="result-content" class="bg-gray-50 p-4 rounded"></div>
                </div>
            </div>
        `;

        plannerElement.innerHTML = html;

        // 활동 추가 버튼 이벤트
        const addActivityBtn = plannerElement.querySelector('#add-activity');
        const activitiesContainer = plannerElement.querySelector('#activities-container');
        let activityCount = 1;

        addActivityBtn.addEventListener('click', () => {
            if (activityCount < 5) {
                activityCount++;
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'activity-input w-full p-2 border rounded';
                input.placeholder = `활동 ${activityCount}`;
                activitiesContainer.appendChild(input);
            }
            if (activityCount >= 5) {
                addActivityBtn.style.display = 'none';
            }
        });

        // 폼 제출 이벤트
        const form = plannerElement.querySelector('#program-form');
        const resultDiv = plannerElement.querySelector('#program-result');
        const resultContent = plannerElement.querySelector('#result-content');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const programName = document.getElementById('program-name').value;
            const targetAudience = document.getElementById('target-audience').value;
            const participants = document.getElementById('participants').value;
            const duration = document.getElementById('duration').value;
            const activities = Array.from(document.querySelectorAll('.activity-input'))
                .map(input => input.value)
                .filter(value => value);

            if (programName && targetAudience && participants && duration && activities.length > 0) {
                const audienceText = {
                    'children': '어린이',
                    'teens': '청소년',
                    'adults': '성인',
                    'elderly': '노인',
                    'family': '가족'
                }[targetAudience];

                const durationText = {
                    '1hour': '1시간',
                    '2hours': '2시간',
                    'halfday': '반나절',
                    'fullday': '하루',
                    'overnight': '1박2일'
                }[duration];

                resultContent.innerHTML = `
                    <h5 class="font-bold text-lg mb-2">${programName}</h5>
                    <div class="space-y-2">
                        <p><span class="font-medium">대상:</span> ${audienceText}</p>
                        <p><span class="font-medium">참가인원:</span> ${participants}명</p>
                        <p><span class="font-medium">진행시간:</span> ${durationText}</p>
                        <div>
                            <p class="font-medium mb-1">프로그램 구성:</p>
                            <ol class="list-decimal pl-5">
                                ${activities.map(activity => `<li>${activity}</li>`).join('')}
                            </ol>
                        </div>
                    </div>
                    <p class="mt-4 text-sm text-gray-600">이 계획서를 바탕으로 더 자세한 프로그램을 구성해보세요!</p>
                `;
                resultDiv.classList.remove('hidden');
            }
        });
    }

    /**
     * 페이지 초기화
     */
    function init() {
        // 현재 페이지가 레크리에이션지도자 페이지인지 확인
        if (!document.body.classList.contains('recreation-certificate-page') && 
            !window.location.pathname.includes('recreation.html')) {
            return;
        }

        displayExamCountdown();
        setupCostCalculator();
        setupFAQAccordion();
        displayRelatedCertificates();
        setupGameCategories();
        displayProgramSamples();
        displayTestimonials();
        setupEquipmentGallery();
        setupEventCalendar();
        setupProgramPlanner();

        // 탭 전환 시 색상 변경 (레크리에이션은 주황색 테마)
        const tabLinks = document.querySelectorAll('[data-tab]');
        tabLinks.forEach(link => {
            link.addEventListener('click', function() {
                // 기존 활성 탭 스타일 제거
                tabLinks.forEach(l => {
                    l.classList.remove('text-orange-600', 'border-orange-600');
                    l.classList.add('text-gray-500');
                });
                
                // 새 활성 탭 스타일 적용
                this.classList.remove('text-gray-500');
                this.classList.add('text-orange-600', 'border-orange-600');
            });
        });
    }

    // 페이지 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', init);
})();