/**
 * 홈페이지 전용 JavaScript
 * 메인 페이지의 특정 기능을 처리합니다.
 * 🔧 수정: 동적 교육과정 로딩 기능 추가
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
    // 홈페이지 네임스페이스 생성
    window.homePage = {
        // 슬라이드 인덱스 추적
        currentSlide: 0,

        // 🔧 NEW: 로딩된 데이터 캐시
        coursesCache: [],
        noticesCache: [],
        columnsCache: [],

        // 초기화 함수
        init: function () {
            this.setupHeroSlider();
            this.setupCoursesCarousel();
            this.setupAnimations();

            // 🔧 수정: 실제 데이터 로딩 구현
            this.loadDynamicContent();
        },

        // 🔧 NEW: 동적 콘텐츠 로딩 함수
        loadDynamicContent: async function () {
            console.log('🔄 홈페이지 동적 콘텐츠 로딩 시작');

            try {
                // Firebase 초기화 대기
                await this.waitForFirebase();

                // 로딩 상태 표시
                this.showLoadingState();

                // 병렬로 데이터 로딩
                const [coursesResult, noticesResult, columnsResult] = await Promise.allSettled([
                    this.loadLatestCourses(),
                    this.loadLatestNotices(),
                    this.loadLatestColumns()
                ]);

                // 결과 처리
                if (coursesResult.status === 'fulfilled') {
                    console.log('✅ 교육과정 로딩 성공');
                    this.hideLoadingState();
                } else {
                    console.warn('⚠️ 교육과정 로딩 실패:', coursesResult.reason);
                    this.fallbackToStaticCourses();
                }

                if (noticesResult.status === 'fulfilled') {
                    console.log('✅ 공지사항 로딩 성공');
                } else {
                    console.warn('⚠️ 공지사항 로딩 실패:', noticesResult.reason);
                }

                if (columnsResult.status === 'fulfilled') {
                    console.log('✅ 칼럼 로딩 성공');
                } else {
                    console.warn('⚠️ 칼럼 로딩 실패:', columnsResult.reason);
                }

            } catch (error) {
                console.error('❌ 동적 콘텐츠 로딩 오류:', error);
                this.fallbackToStaticCourses();
            }
        },

        generateCourseTitle: function (certificateType, startDate) {
            const certNames = {
                'health-exercise': '건강운동처방사',
                'rehabilitation': '운동재활전문가',
                'pilates': '필라테스 전문가',
                'recreation': '레크리에이션지도자'
            };

            const certName = certNames[certificateType] || certificateType;
            const year = startDate.getFullYear().toString().slice(-2);
            const month = startDate.getMonth() + 1;
            const period = month <= 6 ? '상반기' : '하반기';

            return `${certName} ${year}년 ${period} 과정`;
        },

        // 🔧 NEW: 로딩 상태 표시 함수들
        showLoadingState: function () {
            const loadingEl = document.getElementById('courses-loading');
            const errorEl = document.getElementById('courses-error');
            const coursesGrid = document.querySelector('#courses-grid');

            if (loadingEl) {
                loadingEl.classList.remove('hidden');
                console.log('📋 로딩 상태 표시');
            }
            if (errorEl) {
                errorEl.classList.add('hidden');
            }

            // 폴백 카드들 숨기기
            const fallbackCourses = document.querySelectorAll('.fallback-course');
            fallbackCourses.forEach(card => {
                card.style.display = 'none';
            });
        },

        hideLoadingState: function () {
            const loadingEl = document.getElementById('courses-loading');
            if (loadingEl) {
                loadingEl.classList.add('hidden');
                console.log('📋 로딩 상태 숨김');
            }
        },

        // 🔧 NEW: Firebase 초기화 대기
        waitForFirebase: async function () {
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                console.log('⏳ Firebase 초기화 대기 중...');

                let attempts = 0;
                const maxAttempts = 30; // 6초 대기

                while ((!window.dhcFirebase || !window.dhcFirebase.db) && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }

                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    console.warn('⚠️ Firebase 초기화 시간 초과');
                    throw new Error('Firebase 초기화 실패');
                }
            }

            console.log('✅ Firebase 연결 확인됨');
        },

        // 🔧 NEW: 최신 교육과정 로딩
        loadLatestCourses: async function () {
            try {
                console.log('📚 최신 교육과정 로딩 시작');

                // 🔧 로딩 상태 표시
                const loadingEl = document.getElementById('courses-loading');
                const errorEl = document.getElementById('courses-error');
                const coursesGrid = document.querySelector('#courses-grid');

                if (loadingEl) loadingEl.classList.remove('hidden');
                if (errorEl) errorEl.classList.add('hidden');

                if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                    console.log('🔥 Firebase 연결 확인됨, 데이터 로딩 시작');

                    // Firebase에서 활성 상태인 교육과정 중 최신 3개 가져오기
                    const result = await window.dbService.getDocuments('courses', {
                        where: [
                            { field: 'status', operator: '==', value: 'active' }
                        ],
                        orderBy: [
                            { field: 'createdAt', direction: 'desc' }
                        ],
                        limit: 3
                    });

                    console.log('📊 Firebase 쿼리 결과:', result);

                    if (result.success && result.data.length > 0) {
                        this.coursesCache = result.data;
                        console.log('✅ Firebase에서 교육과정 로딩 완료:', result.data.length + '개');
                        console.log('📋 로드된 과정들:', result.data.map(c => ({
                            id: c.id,
                            title: c.title,
                            price: c.price,
                            certificatePrice: c.certificatePrice,
                            materialPrice: c.materialPrice
                        })));

                        this.renderDynamicCourses(result.data);

                        // 🔧 로딩 상태 숨기기
                        if (loadingEl) loadingEl.classList.add('hidden');

                        return result.data;
                    } else {
                        console.warn('⚠️ Firebase 교육과정 데이터 없음 또는 빈 결과');
                        console.log('결과 상세:', result);
                        throw new Error('교육과정 데이터 없음');
                    }
                } else {
                    console.warn('⚠️ Firebase 미연동 상태');
                    console.log('Firebase 상태:', {
                        dhcFirebase: !!window.dhcFirebase,
                        db: !!window.dhcFirebase?.db,
                        dbService: !!window.dbService
                    });
                    throw new Error('Firebase 미연동');
                }

            } catch (error) {
                console.error('❌ 교육과정 로딩 오류:', error);

                // 🔧 오류 발생 시 폴백 처리
                console.log('🔄 테스트 데이터로 폴백 시작');

                try {
                    // 관리자 페이지와 일치하는 테스트 데이터 사용
                    const testCourses = this.getUpdatedTestCourses();
                    this.coursesCache = testCourses;
                    this.renderDynamicCourses(testCourses);

                    // 로딩 상태 숨기기
                    const loadingEl = document.getElementById('courses-loading');
                    if (loadingEl) loadingEl.classList.add('hidden');

                    console.log('✅ 테스트 데이터로 폴백 완료');

                    // 사용자에게 알림
                    setTimeout(() => {
                        this.showNotification('Firebase 연결 중 문제가 발생하여 예시 데이터를 표시합니다.', 'warning');
                    }, 1000);

                    return testCourses;

                } catch (fallbackError) {
                    console.error('❌ 테스트 데이터 폴백도 실패:', fallbackError);
                    this.showCoursesError();
                }

                throw error;
            }
        },

        // 🔧 NEW: 관리자 페이지와 일치하는 업데이트된 테스트 데이터
        getUpdatedTestCourses: function () {
            const now = new Date();
            const oneMonth = 30 * 24 * 60 * 60 * 1000;

            // 🔧 각 과정의 시작 날짜 설정
            const healthStartDate = new Date(now.getTime() + oneMonth);
            const pilatesStartDate = new Date(now.getTime() + oneMonth * 1.5);
            const rehabStartDate = new Date(now.getTime() + oneMonth * 2);

            return [
                {
                    id: 'test-health-1',
                    title: this.generateCourseTitle('health-exercise', healthStartDate), // 🔧 동적 생성
                    certificateType: 'health-exercise',
                    instructor: '김운동 교수',
                    startDate: healthStartDate,
                    endDate: new Date(healthStartDate.getTime() + oneMonth * 2),
                    applyStartDate: new Date(now.getTime() - oneMonth * 0.5),
                    applyEndDate: new Date(now.getTime() + oneMonth * 0.5),
                    price: 150000,
                    certificatePrice: 100000,
                    materialPrice: 30000,
                    pricing: {
                        education: 150000,
                        certificate: 100000,
                        material: 30000,
                        materialRequired: false,
                        packageDiscount: 0,
                        enableInstallment: false
                    },
                    materialName: '건강운동처방사 전문교재',
                    capacity: 30,
                    enrolledCount: 0,
                    status: 'active',
                    method: '온라인 + 오프라인 병행',
                    location: '서울 강남구 센터',
                    description: '질병예방과 건강증진을 위한 맞춤형 운동처방 전문가 양성과정'
                },
                {
                    id: 'test-pilates-1',
                    title: this.generateCourseTitle('pilates', pilatesStartDate), // 🔧 동적 생성
                    certificateType: 'pilates',
                    instructor: '박필라 마스터',
                    startDate: pilatesStartDate,
                    endDate: new Date(pilatesStartDate.getTime() + oneMonth * 3),
                    applyStartDate: new Date(now.getTime()),
                    applyEndDate: new Date(now.getTime() + oneMonth),
                    price: 150000,
                    certificatePrice: 100000,
                    materialPrice: 30000,
                    pricing: {
                        education: 150000,
                        certificate: 100000,
                        material: 30000,
                        materialRequired: false,
                        packageDiscount: 0,
                        enableInstallment: false
                    },
                    materialName: '필라테스 전문가 가이드북',
                    capacity: 10,
                    enrolledCount: 0,
                    status: 'active',
                    method: '오프라인 집중과정',
                    location: '서울 강남구 센터',
                    description: '과학적 원리 기반의 체계적인 필라테스 실기 및 이론 전문가 과정'
                },
                {
                    id: 'test-rehab-1',
                    title: this.generateCourseTitle('rehabilitation', rehabStartDate), // 🔧 동적 생성
                    certificateType: 'rehabilitation',
                    instructor: '이재활 박사',
                    startDate: rehabStartDate,
                    endDate: new Date(rehabStartDate.getTime() + oneMonth * 3),
                    applyStartDate: new Date(now.getTime() + oneMonth),
                    applyEndDate: new Date(now.getTime() + oneMonth * 2.5),
                    price: 200000,
                    certificatePrice: 100000,
                    materialPrice: 30000,
                    pricing: {
                        education: 200000,
                        certificate: 100000,
                        material: 30000,
                        materialRequired: false,
                        packageDiscount: 0,
                        enableInstallment: false
                    },
                    materialName: '운동재활전문가 실무교재',
                    capacity: 20,
                    enrolledCount: 0,
                    status: 'active',
                    method: '온라인 + 오프라인 병행',
                    location: '서울 강남구 센터',
                    description: '부상 및 질환 이후 효과적인 운동재활 프로그램 설계 및 지도 전문가 과정'
                }
            ];
        },

        // 🔧 NEW: 오류 상태 표시 함수
        showCoursesError: function () {
            const loadingEl = document.getElementById('courses-loading');
            const errorEl = document.getElementById('courses-error');
            const coursesGrid = document.querySelector('#courses-grid');

            if (loadingEl) loadingEl.classList.add('hidden');
            if (errorEl) errorEl.classList.remove('hidden');

            console.log('💥 교육과정 오류 상태 표시');
        },

        // 🔧 NEW: 알림 표시 함수
        showNotification: function (message, type = 'info') {
            console.log(`${type.toUpperCase()}: ${message}`);

            // 간단한 알림 생성
            const notification = document.createElement('div');
            notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 16px;
        background: ${type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        font-size: 14px;
    `;
            notification.textContent = message;

            document.body.appendChild(notification);

            // 5초 후 자동 제거
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        },

        // 🔧 NEW: 동적 교육과정 렌더링
        renderDynamicCourses: function (courses) {
            const coursesGrid = document.querySelector('.courses-section .grid');
            if (!coursesGrid) {
                console.warn('⚠️ 교육과정 그리드 요소를 찾을 수 없음');
                return;
            }

            console.log('🎨 교육과정 카드 렌더링 시작:', courses.length + '개');

            // 기존 하드코딩된 카드들 제거
            coursesGrid.innerHTML = '';

            // 새로운 카드들 생성
            courses.forEach((course, index) => {
                const courseCard = this.createCourseCard(course, index);
                coursesGrid.appendChild(courseCard);
            });

            console.log('✅ 교육과정 카드 렌더링 완료');
        },

        // 🔧 수정: 과정 ID를 URL 파라미터로 전달하는 교육과정 카드 생성
        createCourseCard: function (course, index) {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md overflow-hidden h-full';

            // 날짜 포맷팅
            const startDate = course.startDate?.toDate ? course.startDate.toDate() : new Date(course.startDate);
            const endDate = course.endDate?.toDate ? course.endDate.toDate() : new Date(course.endDate);

            // 🔧 수정: 관리자 설정 가격 정보 정확히 추출
            const coursePrice = course.price || course.pricing?.education || 0;
            const certificatePrice = course.certificatePrice || course.pricing?.certificate || 50000;
            const materialPrice = course.materialPrice || course.pricing?.material || 30000;

            // 할인 정보 처리 (관리자 설정 기준)
            const packageDiscount = course.pricing?.packageDiscount || 0;

            // 자격증 이름 매핑
            const certNames = {
                'health-exercise': '건강운동처방사',
                'rehabilitation': '운동재활전문가',
                'pilates': '필라테스 전문가',
                'recreation': '레크리에이션지도자'
            };

            // 배지 스타일 매핑
            const badgeStyles = {
                'health-exercise': 'text-blue-600 bg-blue-100',
                'rehabilitation': 'text-green-600 bg-green-100',
                'pilates': 'text-purple-600 bg-purple-100',
                'recreation': 'text-yellow-600 bg-yellow-100'
            };

            // 이미지 경로 매핑
            const imageMap = {
                'health-exercise': 'assets/images/courses/health-exercise-course.jpeg',
                'rehabilitation': 'assets/images/courses/rehabilitation-course.jpeg',
                'pilates': 'assets/images/courses/pilates-course.jpeg',
                'recreation': 'assets/images/courses/recreation-course.jpeg'
            };

            // 🔧 수정: 신청 마감일 계산으로 특별 배지 결정
            let specialBadge = '';
            const now = new Date();
            const applyEndDate = course.applyEndDate?.toDate ? course.applyEndDate.toDate() :
                new Date(course.applyEndDate || new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000));
            const daysLeft = Math.ceil((applyEndDate - now) / (1000 * 60 * 60 * 24));

            if (index === 0) {
                specialBadge = '<div class="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 m-2 rounded-md text-sm">인기 과정</div>';
            } else if (daysLeft <= 7 && daysLeft > 0) {
                specialBadge = '<div class="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 m-2 rounded-md text-sm">마감 임박</div>';
            } else if (course.enrolledCount >= (course.capacity * 0.8)) {
                specialBadge = '<div class="absolute top-0 right-0 bg-orange-600 text-white px-3 py-1 m-2 rounded-md text-sm">거의 마감</div>';
            }

            const certName = certNames[course.certificateType] || course.certificateType;
            const badgeStyle = badgeStyles[course.certificateType] || 'text-gray-600 bg-gray-100';
            const courseImage = imageMap[course.certificateType] || 'assets/images/courses/default-course.jpeg';

            // 🔧 수정: courseId와 from 파라미터를 포함한 신청하기 링크
            const applicationUrl = `pages/education/course-application.html?courseId=${course.id}&from=home`;

            // 🔧 수정: 단순한 가격 표시 (할인 복잡성 제거)
            const formatCurrency = (amount) => window.formatters ? window.formatters.formatCurrency(amount) : `${amount.toLocaleString()}원`;

            card.innerHTML = `
                <div class="relative">
                    <img src="${courseImage}" alt="${course.title}" class="w-full h-48 object-cover">
                    ${specialBadge}
                </div>
                <div class="p-6">
                    <span class="text-sm font-medium ${badgeStyle} px-2 py-1 rounded-md">${certName}</span>
                    <h3 class="text-xl font-bold mt-2 mb-2">${course.title}</h3>
                    <p class="text-gray-600 mb-4">${course.description || '전문적인 지식과 실무 능력을 갖춘 전문가 양성 과정입니다.'}</p>

                    <!-- 🔧 수정: 관리자 설정과 일치하는 단순한 가격 표시 -->
                    <div class="flex justify-between items-center">
                        <div class="price-info">
                            <div class="text-sm text-gray-500 mb-1">교육비</div>
                            <span class="text-gray-700 font-medium">${formatCurrency(coursePrice)}</span>
                            <div class="text-xs text-gray-400 mt-1">자격증비, 교재비 별도</div>
                        </div>
                        <a href="javascript:window.location.href=window.adjustPath('${applicationUrl}')" 
                           class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm course-apply-btn"
                           data-course-id="${course.id}"
                           data-course-name="${course.title}">신청하기</a>
                        </div>
                    </div>
            `;

            return card;
        },

        // 🔧 NEW: 정적 교육과정으로 폴백
        fallbackToStaticCourses: function () {
            console.log('🔄 정적 교육과정으로 폴백');

            // 로딩 상태 숨기기
            this.hideLoadingState();

            // 에러 상태도 숨기기
            const errorEl = document.getElementById('courses-error');
            if (errorEl) {
                errorEl.classList.add('hidden');
            }

            // 폴백 카드들 다시 표시
            const fallbackCourses = document.querySelectorAll('.fallback-course');
            fallbackCourses.forEach(card => {
                card.style.display = 'block';
            });

            console.log('✅ 정적 교육과정 폴백 완료');
        },

        // 🔧 NEW: 최신 공지사항 로딩
        loadLatestNotices: async function () {
            try {
                console.log('📢 최신 공지사항 로딩 시작');

                if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                    const result = await window.dbService.getDocuments('notices', {
                        orderBy: [
                            { field: 'createdAt', direction: 'desc' }
                        ],
                        limit: 5
                    });

                    if (result.success && result.data.length > 0) {
                        this.noticesCache = result.data;
                        this.renderDynamicNotices(result.data);
                        console.log('✅ 공지사항 로딩 완료:', result.data.length + '개');
                        return result.data;
                    }
                }

                console.warn('⚠️ 공지사항 데이터 없음, 정적 데이터 유지');

            } catch (error) {
                console.error('❌ 공지사항 로딩 오류:', error);
                throw error;
            }
        },

        // 🔧 NEW: 동적 공지사항 렌더링
        renderDynamicNotices: function (notices) {
            const noticesList = document.querySelector('.notice-column-section ul');
            if (!noticesList) {
                console.warn('⚠️ 공지사항 목록 요소를 찾을 수 없음');
                return;
            }

            console.log('🎨 공지사항 렌더링 시작:', notices.length + '개');

            noticesList.innerHTML = '';

            notices.forEach((notice, index) => {
                const listItem = document.createElement('li');

                // 중요 공지사항 배지
                const importantBadge = index === 0 ?
                    '<span class="inline-block bg-blue-100 text-blue-600 px-2 py-1 text-xs rounded mr-2">중요</span>' : '';

                // 날짜 포맷팅
                const createdDate = notice.createdAt?.toDate ? notice.createdAt.toDate() : new Date(notice.createdAt);
                const formattedDate = this.formatDate(createdDate);

                listItem.innerHTML = `
                    <a href="javascript:window.location.href=window.adjustPath('pages/board/notice/view.html?id=${notice.id}')"
                       class="flex items-center justify-between hover:bg-gray-50 p-2 rounded">
                        <div>
                            ${importantBadge}
                            <span>${notice.title}</span>
                        </div>
                        <span class="text-gray-500 text-sm">${formattedDate}</span>
                    </a>
                `;

                noticesList.appendChild(listItem);
            });

            console.log('✅ 공지사항 렌더링 완료');
        },

        // 🔧 NEW: 최신 칼럼 로딩
        loadLatestColumns: async function () {
            try {
                console.log('📝 최신 칼럼 로딩 시작');

                if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                    const result = await window.dbService.getDocuments('columns', {
                        orderBy: [
                            { field: 'createdAt', direction: 'desc' }
                        ],
                        limit: 3
                    });

                    if (result.success && result.data.length > 0) {
                        this.columnsCache = result.data;
                        this.renderDynamicColumns(result.data);
                        console.log('✅ 칼럼 로딩 완료:', result.data.length + '개');
                        return result.data;
                    }
                }

                console.warn('⚠️ 칼럼 데이터 없음, 정적 데이터 유지');

            } catch (error) {
                console.error('❌ 칼럼 로딩 오류:', error);
                throw error;
            }
        },

        // 🔧 NEW: 동적 칼럼 렌더링
        renderDynamicColumns: function (columns) {
            const columnsContainer = document.querySelector('.notice-column-section .space-y-4');
            if (!columnsContainer) {
                console.warn('⚠️ 칼럼 컨테이너 요소를 찾을 수 없음');
                return;
            }

            console.log('🎨 칼럼 렌더링 시작:', columns.length + '개');

            columnsContainer.innerHTML = '';

            columns.forEach(column => {
                const columnElement = document.createElement('a');
                columnElement.href = `javascript:window.location.href=window.adjustPath('pages/board/column/view.html?id=${column.id}')`;
                columnElement.className = 'block hover:bg-gray-50 p-2 rounded';

                // 날짜 포맷팅
                const createdDate = column.createdAt?.toDate ? column.createdAt.toDate() : new Date(column.createdAt);
                const formattedDate = this.formatDate(createdDate);

                // 이미지 경로 처리
                const columnImage = column.imageUrl || `assets/images/columns/column${Math.floor(Math.random() * 3) + 1}.jpeg`;

                columnElement.innerHTML = `
                    <div class="flex">
                        <div class="w-24 h-24 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                            <img src="${columnImage}" alt="칼럼 이미지" class="w-full h-full object-cover">
                        </div>
                        <div class="ml-4">
                            <h3 class="font-bold mb-1">${column.title}</h3>
                            <p class="text-gray-600 text-sm line-clamp-2">${column.excerpt || column.content?.substring(0, 100) + '...' || '전문가의 소중한 칼럼입니다.'}</p>
                            <p class="text-gray-500 text-xs mt-2">${column.author || '전문가'} | ${formattedDate}</p>
                        </div>
                    </div>
                `;

                columnsContainer.appendChild(columnElement);
            });

            console.log('✅ 칼럼 렌더링 완료');
        },

        // 히어로 섹션 슬라이더 설정
        setupHeroSlider: function () {
            const heroSection = document.querySelector('.hero-section');

            // 히어로 섹션이 없으면 중단
            if (!heroSection) {
                return;
            }

            // 슬라이더 이미지 및 텍스트
            const slides = [
                {
                    bgImage: 'assets/images/banners/hero-bg.jpg',
                    heading: '운동과학 기반 전문인력 양성 플랫폼',
                    subheading: '사&rpar;문경 부설 디지털헬스케어센터에서 각 분야 최고의 전문가들과 함께<br>건강운동 전문가의 꿈을 이루세요.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg2.jpg',
                    heading: '체계적인 교육으로 전문성을 키우세요',
                    subheading: '이론과 실습이 결합된 과학적 교육과정을 통해<br>건강운동 분야의 진정한 전문가로 성장할 수 있습니다.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg3.jpg',
                    heading: '국제적으로 인정받는 자격증 과정',
                    subheading: '엄격한 기준과 체계적인 교육과정을 통해<br>신뢰할 수 있는 전문가 자격을 취득하세요.'
                }
            ];

            // 슬라이더 내비게이션 추가
            if (slides.length > 1) {
                const sliderNav = document.createElement('div');
                sliderNav.className = 'slider-nav flex justify-center mt-8';

                slides.forEach((slide, index) => {
                    const navDot = document.createElement('button');
                    navDot.className = `slider-nav-dot w-3 h-3 rounded-full mx-1 ${index === 0 ? 'bg-white' : 'bg-white bg-opacity-50'}`;
                    navDot.setAttribute('data-slide', index);

                    navDot.addEventListener('click', () => {
                        this.goToSlide(index);
                    });

                    sliderNav.appendChild(navDot);
                });

                heroSection.querySelector('.container').appendChild(sliderNav);

                // 자동 슬라이드 시작
                this.startAutoSlide();
            }
        },

        // 슬라이드 변경 함수
        goToSlide: function (index) {
            const heroSection = document.querySelector('.hero-section');
            const slides = [
                {
                    bgImage: 'assets/images/banners/hero-bg.jpg',
                    heading: '운동과학 기반 전문인력 양성 플랫폼',
                    subheading: '사&rpar;문경 부설 디지털헬스케어센터에서 각 분야 최고의 전문가들과 함께<br>건강운동 전문가의 꿈을 이루세요.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg2.jpg',
                    heading: '체계적인 교육으로 전문성을 키우세요',
                    subheading: '이론과 실습이 결합된 과학적 교육과정을 통해<br>건강운동 분야의 진정한 전문가로 성장할 수 있습니다.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg3.jpg',
                    heading: '국제적으로 인정받는 자격증 과정',
                    subheading: '엄격한 기준과 체계적인 교육과정을 통해<br>신뢰할 수 있는 전문가 자격을 취득하세요.'
                }
            ];

            // 슬라이더가 없으면 중단
            if (!heroSection) {
                return;
            }

            // 현재 슬라이드 인덱스 업데이트
            this.currentSlide = index;

            // 배경 이미지 변경 (오버레이 제거)
            const slideData = slides[index];
            heroSection.style.backgroundImage = `url('${slideData.bgImage}')`;

            // 텍스트 변경 (부드러운 페이드 효과 적용)
            const heading = heroSection.querySelector('h1');
            const subheading = heroSection.querySelector('p');

            if (heading && subheading) {
                // 페이드 아웃
                heading.style.opacity = '0';
                subheading.style.opacity = '0';

                setTimeout(() => {
                    // 내용 변경
                    heading.innerHTML = slideData.heading;
                    subheading.innerHTML = slideData.subheading;

                    // 페이드 인
                    setTimeout(() => {
                        heading.style.opacity = '1';
                        subheading.style.opacity = '1';
                    }, 50);
                }, 600); // CSS transition 시간과 일치
            }

            // 내비게이션 도트 업데이트
            const navDots = document.querySelectorAll('.slider-nav-dot');
            navDots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.add('bg-white');
                    dot.classList.remove('bg-opacity-50');
                } else {
                    dot.classList.add('bg-opacity-50');
                    dot.classList.remove('bg-white');
                }
            });
        },

        // 자동 슬라이드 시작
        startAutoSlide: function () {
            const slides = [
                {
                    bgImage: 'assets/images/banners/hero-bg.jpg',
                    heading: '운동과학 기반 전문인력 양성 플랫폼',
                    subheading: '사&rpar;문경 부설 디지털헬스케어센터에서 각 분야 최고의 전문가들과 함께<br>건강운동 전문가의 꿈을 이루세요.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg2.jpg',
                    heading: '체계적인 교육으로 전문성을 키우세요',
                    subheading: '이론과 실습이 결합된 과학적 교육과정을 통해<br>건강운동 분야의 진정한 전문가로 성장할 수 있습니다.'
                },
                {
                    bgImage: 'assets/images/banners/hero-bg3.jpg',
                    heading: '국제적으로 인정받는 자격증 과정',
                    subheading: '엄격한 기준과 체계적인 교육과정을 통해<br>신뢰할 수 있는 전문가 자격을 취득하세요.'
                }
            ];

            // 기존 인터벌 클리어
            if (this.slideInterval) {
                clearInterval(this.slideInterval);
            }

            // 6초마다 슬라이드 변경 (더 여유있는 간격)
            this.slideInterval = setInterval(() => {
                const nextSlide = (this.currentSlide + 1) % slides.length;
                this.goToSlide(nextSlide);
            }, 6000);

            // 마우스 오버 시 자동 슬라이드 일시 중지
            const heroSection = document.querySelector('.hero-section');

            if (heroSection) {
                heroSection.addEventListener('mouseenter', () => {
                    if (this.slideInterval) {
                        clearInterval(this.slideInterval);
                    }
                });

                heroSection.addEventListener('mouseleave', () => {
                    this.startAutoSlide();
                });
            }
        },

        // 교육 과정 캐러셀 설정
        setupCoursesCarousel: function () {
            const coursesSection = document.querySelector('.courses-section');

            // 교육 과정 섹션이 없으면 중단
            if (!coursesSection) {
                return;
            }

            // 모바일에서만 캐러셀 활성화
            if (window.innerWidth < 768) {
                const coursesGrid = coursesSection.querySelector('.grid');
                const courseCards = coursesGrid.querySelectorAll('.grid > div');

                // 그리드를 슬라이더로 변환
                coursesGrid.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-6');
                coursesGrid.classList.add('carousel', 'relative', 'overflow-hidden');

                // 슬라이더 래퍼 생성
                const carouselWrapper = document.createElement('div');
                carouselWrapper.className = 'carousel-wrapper flex transition-transform duration-300';

                // 카드를 래퍼로 이동
                courseCards.forEach(card => {
                    card.classList.add('carousel-item', 'w-full', 'flex-shrink-0');
                    carouselWrapper.appendChild(card);
                });

                coursesGrid.appendChild(carouselWrapper);

                // 내비게이션 버튼 추가
                const prevButton = document.createElement('button');
                prevButton.className = 'carousel-prev absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md z-10';
                prevButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>';

                const nextButton = document.createElement('button');
                nextButton.className = 'carousel-next absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md z-10';
                nextButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>';

                coursesGrid.appendChild(prevButton);
                coursesGrid.appendChild(nextButton);

                // 캐러셀 기능 구현
                let currentIndex = 0;
                const totalItems = courseCards.length;

                prevButton.addEventListener('click', () => {
                    if (currentIndex > 0) {
                        currentIndex--;
                        carouselWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
                    }
                });

                nextButton.addEventListener('click', () => {
                    if (currentIndex < totalItems - 1) {
                        currentIndex++;
                        carouselWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
                    }
                });
            }
        },

        // 스크롤 애니메이션 설정
        setupAnimations: function () {
            // 애니메이션 대상 요소
            const animationTargets = [
                '.certificate-section .grid > div',
                '.courses-section .grid > div',
                '.notice-column-section .grid > div',
                '.cta-section'
            ];

            // 요소에 애니메이션 클래스 추가
            animationTargets.forEach(selector => {
                const elements = document.querySelectorAll(selector);

                elements.forEach((element, index) => {
                    element.classList.add('animate-on-scroll');
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(20px)';
                    element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                    element.style.transitionDelay = `${index * 0.1}s`;
                });
            });

            // 스크롤 이벤트 리스너 추가
            window.addEventListener('scroll', this.checkAnimations.bind(this));

            // 초기 체크
            this.checkAnimations();
        },

        // 스크롤 애니메이션 체크
        checkAnimations: function () {
            const animatedElements = document.querySelectorAll('.animate-on-scroll');
            const windowHeight = window.innerHeight;

            animatedElements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const elementVisible = 100;

                if (elementTop < windowHeight - elementVisible) {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }
            });
        },

        // 🔧 NEW: 날짜 포맷팅 (Firebase 타임스탬프 처리)
        formatDate: function (timestamp) {
            if (!timestamp) {
                return '';
            }

            let date;

            if (timestamp.toDate) {
                // Firestore 타임스탬프인 경우
                date = timestamp.toDate();
            } else if (timestamp.seconds) {
                // Firestore 타임스탬프 객체인 경우
                date = new Date(timestamp.seconds * 1000);
            } else {
                // 일반 Date 객체 또는 문자열인 경우
                date = new Date(timestamp);
            }

            // 날짜가 유효하지 않은 경우
            if (isNaN(date.getTime())) {
                return '';
            }

            // YYYY.MM.DD 형식으로 반환
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}.${month}.${day}`;
        },

        // 🔧 NEW: 데이터 새로고침 (관리자가 데이터를 업데이트했을 때 호출)
        refreshData: async function () {
            console.log('🔄 홈페이지 데이터 새로고침 시작');

            try {
                // 캐시 초기화
                this.coursesCache = [];
                this.noticesCache = [];
                this.columnsCache = [];

                // 동적 콘텐츠 다시 로딩
                await this.loadDynamicContent();

                console.log('✅ 홈페이지 데이터 새로고침 완료');
            } catch (error) {
                console.error('❌ 홈페이지 데이터 새로고침 오류:', error);
            }
        },

        // 🔧 NEW: 실시간 업데이트 설정 (선택적)
        setupRealTimeUpdates: function () {
            if (!window.dhcFirebase || !window.dhcFirebase.db || !window.dbService) {
                console.warn('⚠️ Firebase 미연동으로 실시간 업데이트 비활성화');
                return;
            }

            console.log('🔄 실시간 업데이트 설정 시작');

            // 교육과정 실시간 업데이트
            this.coursesUnsubscribe = window.dbService.onCollectionChange(
                'courses',
                {
                    where: [{ field: 'status', operator: '==', value: 'active' }],
                    orderBy: [{ field: 'createdAt', direction: 'desc' }],
                    limit: 3
                },
                (result) => {
                    if (result.success && result.data.length > 0) {
                        console.log('🔄 교육과정 실시간 업데이트:', result.data.length + '개');
                        this.coursesCache = result.data;
                        this.renderDynamicCourses(result.data);
                    }
                }
            );

            console.log('✅ 실시간 업데이트 설정 완료');
        },

        // 🔧 NEW: 실시간 업데이트 해제
        teardownRealTimeUpdates: function () {
            if (this.coursesUnsubscribe) {
                this.coursesUnsubscribe();
                console.log('✅ 교육과정 실시간 업데이트 해제');
            }
        }
    };

    // 문서 로드 완료 시 초기화
    document.addEventListener('DOMContentLoaded', function () {
        console.log('🏠 홈페이지: DOM 로드 완료, 초기화 시작');

        // homePage 객체가 있는지 확인
        if (window.homePage && typeof window.homePage.init === 'function') {
            console.log('🚀 homePage 객체 확인됨, 초기화 실행');
            window.homePage.init();
        } else {
            console.warn('⚠️ homePage 객체가 없음, 재시도');

            // 잠시 후 재시도
            setTimeout(() => {
                if (window.homePage && typeof window.homePage.init === 'function') {
                    console.log('🔄 재시도: homePage 초기화 실행');
                    window.homePage.init();
                } else {
                    console.error('❌ homePage 초기화 실패');
                }
            }, 1000);
        }
    });

    // 🔧 추가: window load 이벤트에서도 확인
    window.addEventListener('load', function () {
        console.log('🏠 홈페이지: 윈도우 로드 완료');

        // DOM 로드에서 초기화되지 않았다면 다시 시도
        if (window.homePage && !window.homePage.initialized) {
            console.log('🔄 윈도우 로드에서 homePage 초기화 재시도');
            window.homePage.init();
        }
    });

    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', function () {
        if (window.homePage && window.homePage.teardownRealTimeUpdates) {
            window.homePage.teardownRealTimeUpdates();
        }
    });
})();