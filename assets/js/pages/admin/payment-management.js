/**
 * 결제 관리 페이지 스크립트 (완전 수정 버전)
 */

// 결제 관리 객체
const paymentManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    initialized: false,

    /**
     * 초기화 함수
     */
    init: async function () {
        if (this.initialized) {
            console.log('결제 관리자가 이미 초기화됨');
            return;
        }

        try {
            console.log('결제 관리자 초기화 시작');

            // Firebase 초기화 대기
            await this.waitForFirebase();

            // 관리자 권한 확인 (Promise 기반)
            const hasAccess = await this.checkAdminAccess();
            if (!hasAccess) {
                console.log('관리자 권한 없음, 초기화 중단');
                return;
            }

            console.log('관리자 권한 확인 완료, 초기화 계속');

            // 관리자 정보 표시
            this.displayAdminInfo();

            // 검색 필터 설정
            this.setupFilters();

            // 결제 통계 로드
            await this.loadPaymentStats();

            // 결제 내역 로드
            await this.loadPayments();

            // 실시간 업데이트 설정
            this.setupRealtimeUpdates();

            this.initialized = true;
            console.log('결제 관리자 초기화 완료');
        } catch (error) {
            console.error('결제 관리자 초기화 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('결제 관리자 초기화에 실패했습니다.', 'error');
            }
        }
    },

    /**
     * Firebase 초기화 대기
     */
    waitForFirebase: function () {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100;

            function check() {
                attempts++;
                console.log('Firebase 확인 시도:', attempts);

                if (window.dhcFirebase &&
                    window.dhcFirebase.auth &&
                    window.dhcFirebase.db &&
                    window.dhcFirebase.getCurrentUser) {
                    console.log('Firebase 준비됨');
                    resolve();
                    return;
                }

                if (attempts < maxAttempts) {
                    setTimeout(check, 50);
                } else {
                    console.error('Firebase 초기화 시간 초과');
                    reject(new Error('Firebase 초기화 실패'));
                }
            }

            check();
        });
    },

    /**
     * 관리자 권한 확인
     */
    checkAdminAccess: async function () {
        console.log('관리자 권한 확인 시작');

        // Firebase 인증 상태가 준비될 때까지 대기
        return new Promise((resolve) => {
            // 이미 로그인된 사용자가 있는지 확인
            const currentUser = window.dhcFirebase.getCurrentUser();

            if (currentUser) {
                console.log('이미 로그인된 사용자:', currentUser.email);
                const adminEmails = ['admin@test.com', 'gostepexercise@gmail.com'];
                const isAdmin = adminEmails.includes(currentUser.email);
                console.log('관리자 권한 결과:', isAdmin);

                if (!isAdmin) {
                    console.log('관리자 권한 없음');
                    alert('관리자 권한이 필요합니다.');
                    setTimeout(() => {
                        window.location.href = '../../index.html';
                    }, 1000);
                }

                resolve(isAdmin);
                return;
            }

            // 사용자가 없으면 인증 상태 변화를 기다림
            console.log('인증 상태 변화 대기 중...');
            const unsubscribe = window.dhcFirebase.onAuthStateChanged((user) => {
                console.log('인증 상태 변화 감지:', user ? user.email : 'null');

                if (user) {
                    const adminEmails = ['admin@test.com', 'gostepexercise@gmail.com'];
                    const isAdmin = adminEmails.includes(user.email);
                    console.log('관리자 권한 결과:', isAdmin);

                    if (!isAdmin) {
                        console.log('관리자 권한 없음');
                        alert('관리자 권한이 필요합니다.');
                        setTimeout(() => {
                            window.location.href = '../../index.html';
                        }, 1000);
                    }

                    unsubscribe(); // 리스너 해제
                    resolve(isAdmin);
                } else {
                    console.log('사용자가 로그인하지 않음');
                    alert('로그인이 필요합니다.');
                    setTimeout(() => {
                        window.location.href = '../auth/login.html';
                    }, 1000);
                    unsubscribe(); // 리스너 해제
                    resolve(false);
                }
            });
        });
    },

    /**
     * 관리자 정보 표시
     */
    displayAdminInfo: function () {
        console.log('관리자 정보 표시');

        // 현재 사용자 정보 가져오기
        const currentUser = window.dhcFirebase.getCurrentUser();

        if (currentUser) {
            console.log('현재 관리자 사용자:', currentUser.email);

            const adminNameElement = document.getElementById('admin-name');
            const adminEmailElement = document.getElementById('admin-email');

            if (adminNameElement) {
                const displayName = currentUser.displayName || '관리자';
                adminNameElement.textContent = displayName;
                console.log('관리자 이름 표시:', displayName);
            }

            if (adminEmailElement) {
                adminEmailElement.textContent = currentUser.email;
                console.log('관리자 이메일 표시:', currentUser.email);
            }
        } else {
            console.log('현재 로그인한 사용자가 없어 관리자 정보 표시 불가');
        }
    },

    /**
     * 검색 필터 설정
     */
    setupFilters: function () {
        const filterOptions = {
            searchField: {
                label: '검색',
                placeholder: '결제번호로 검색'
            },
            selectFilters: [
                {
                    id: 'payment-status',
                    label: '상태',
                    options: [
                        { value: 'pending', label: '대기중' },
                        { value: 'completed', label: '완료' },
                        { value: 'failed', label: '실패' },
                        { value: 'cancelled', label: '취소' },
                        { value: 'refund_requested', label: '환불요청' },
                        { value: 'refunded', label: '환불완료' }
                    ]
                },
                {
                    id: 'payment-method',
                    label: '결제방법',
                    options: [
                        { value: 'card', label: '신용카드' },
                        { value: 'transfer', label: '계좌이체' },
                        { value: 'vbank', label: '가상계좌' }
                    ]
                }
            ],
            dateFilter: true
        };

        if (window.adminUtils && window.adminUtils.createSearchFilter) {
            window.adminUtils.createSearchFilter('payment-filter-container', filterOptions, 'paymentManager.applyFilters');
        }
    },

    /**
     * 실시간 업데이트 설정
     */
    setupRealtimeUpdates: function () {
        if (!window.dbService) return;

        // 실시간 업데이트 설정 (결제 상태 변경 감지)
        const unsubscribe = window.dbService.onCollectionChange('payments', {
            where: { field: 'createdAt', operator: '>=', value: new Date(new Date().setHours(0, 0, 0, 0)) }
        }, (result) => {
            if (result.success) {
                // 통계 업데이트
                this.loadPaymentStats();
            }
        });

        // 페이지 언로드 시 리스너 해제
        window.addEventListener('beforeunload', () => {
            unsubscribe();
        });
    },

    /**
     * 결제 통계 로드
     */
    loadPaymentStats: async function () {
        try {
            // dbService가 없으면 더미 데이터 사용
            if (!window.dbService) {
                console.log('dbService가 없어 더미 데이터 사용');
                this.displayDummyStats();
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            // 오늘 결제
            const todayPayments = await window.dbService.getDocuments('payments', {
                where: [
                    { field: 'status', operator: '==', value: 'completed' },
                    { field: 'createdAt', operator: '>=', value: today }
                ]
            });

            if (todayPayments.success) {
                const todayAmount = todayPayments.data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                this.updateElement('today-payment-amount', this.formatCurrency(todayAmount));
                this.updateElement('today-payment-count', todayPayments.data.length);
            }

            // 이번 달 결제
            const monthPayments = await window.dbService.getDocuments('payments', {
                where: [
                    { field: 'status', operator: '==', value: 'completed' },
                    { field: 'createdAt', operator: '>=', value: firstDayOfMonth }
                ]
            });

            if (monthPayments.success) {
                const monthAmount = monthPayments.data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                this.updateElement('month-payment-amount', this.formatCurrency(monthAmount));
                this.updateElement('month-payment-count', monthPayments.data.length);
            }

            // 환불 요청
            const refundRequests = await window.dbService.getDocuments('payments', {
                where: { field: 'status', operator: '==', value: 'refund_requested' }
            });

            if (refundRequests.success) {
                this.updateElement('refund-request-count', refundRequests.data.length);
            }

            // 최근 7일 결제 실패
            const failedPayments = await window.dbService.getDocuments('payments', {
                where: [
                    { field: 'status', operator: '==', value: 'failed' },
                    { field: 'createdAt', operator: '>=', value: sevenDaysAgo }
                ]
            });

            if (failedPayments.success) {
                this.updateElement('failed-payment-count', failedPayments.data.length);
            }
        } catch (error) {
            console.error('결제 통계 로드 오류:', error);
            this.displayDummyStats();
        }
    },

    /**
     * 더미 통계 데이터 표시
     */
    displayDummyStats: function () {
        this.updateElement('today-payment-amount', '₩2,500,000');
        this.updateElement('today-payment-count', 15);
        this.updateElement('month-payment-amount', '₩35,000,000');
        this.updateElement('month-payment-count', 124);
        this.updateElement('refund-request-count', 3);
        this.updateElement('failed-payment-count', 7);
    },

    /**
     * 결제 내역 로드
     */
    loadPayments: async function () {
        if (window.adminUtils && window.adminUtils.showLoadingOverlay) {
            window.adminUtils.showLoadingOverlay(true);
        }

        try {
            // dbService가 없으면 더미 데이터 사용
            if (!window.dbService) {
                console.log('dbService가 없어 더미 데이터 사용');
                this.displayDummyPayments();
                return;
            }

            // 필터 옵션 설정
            const options = {
                orderBy: { field: 'createdAt', direction: 'desc' },
                pageSize: this.pageSize
            };

            // 필터 적용
            if (this.filters.status) {
                options.where = options.where || [];
                options.where.push({ field: 'status', operator: '==', value: this.filters.status });
            }

            if (this.filters.paymentMethod) {
                options.where = options.where || [];
                options.where.push({ field: 'paymentMethod', operator: '==', value: this.filters.paymentMethod });
            }

            // 날짜 필터
            if (this.filters.startDate) {
                options.where = options.where || [];
                options.where.push({ field: 'createdAt', operator: '>=', value: new Date(this.filters.startDate) });
            }

            if (this.filters.endDate) {
                options.where = options.where || [];
                const endDate = new Date(this.filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                options.where.push({ field: 'createdAt', operator: '<=', value: endDate });
            }

            // 검색어 필터 (결제번호)
            let searchResults;
            if (this.filters.searchKeyword) {
                searchResults = await window.dbService.searchDocuments('payments', 'paymentId', this.filters.searchKeyword, options);
            } else {
                searchResults = await window.dbService.getPaginatedDocuments('payments', options, this.currentPage > 1 ? this.lastDoc : null);
            }

            if (searchResults.success) {
                // 추가 정보 조회 (결제자 정보, 교육과정 정보)
                const paymentsWithDetails = await Promise.all(searchResults.data.map(async (payment) => {
                    // 결제자 정보
                    if (payment.userId) {
                        const userDoc = await window.dbService.getDocument('users', payment.userId);
                        if (userDoc.success) {
                            payment.userName = userDoc.data.displayName || userDoc.data.email;
                            payment.userEmail = userDoc.data.email;
                        }
                    }

                    // 교육과정 정보
                    if (payment.courseId) {
                        const courseDoc = await window.dbService.getDocument('courses', payment.courseId);
                        if (courseDoc.success) {
                            payment.courseName = courseDoc.data.title;
                        }
                    }

                    return payment;
                }));

                // 테이블 업데이트
                this.updatePaymentTable(paymentsWithDetails);

                // 페이지네이션 업데이트
                if (!this.filters.searchKeyword) {
                    this.lastDoc = searchResults.lastDoc;

                    // 전체 결제 수 계산
                    const totalCount = await window.dbService.countDocuments('payments', { where: options.where });
                    const totalPages = Math.ceil(totalCount.count / this.pageSize);

                    if (window.adminUtils && window.adminUtils.createPagination) {
                        window.adminUtils.createPagination('payment-pagination', this.currentPage, totalPages, 'paymentManager.changePage');
                    }
                }
            } else {
                console.error('결제 내역 로드 실패:', searchResults.error);
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('결제 내역을 불러오는데 실패했습니다.', 'error');
                }
            }
        } catch (error) {
            console.error('결제 내역 로드 오류:', error);
            this.displayDummyPayments();
        } finally {
            if (window.adminUtils && window.adminUtils.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }
        }
    },

    /**
     * 더미 결제 데이터 표시
     */
    displayDummyPayments: function () {
        const dummyPayments = [
            {
                id: '1',
                paymentId: 'PAY-20250513-001',
                userName: '홍길동',
                userEmail: 'hong@example.com',
                courseName: '건강운동처방사',
                amount: 300000,
                paymentMethod: 'card',
                status: 'completed',
                createdAt: new Date()
            },
            {
                id: '2',
                paymentId: 'PAY-20250513-002',
                userName: '김영희',
                userEmail: 'kim@example.com',
                courseName: '운동재활전문가',
                amount: 450000,
                paymentMethod: 'transfer',
                status: 'completed',
                createdAt: new Date(Date.now() - 3600000)
            },
            {
                id: '3',
                paymentId: 'PAY-20250513-003',
                userName: '박철수',
                userEmail: 'park@example.com',
                courseName: '필라테스 전문가',
                amount: 250000,
                paymentMethod: 'vbank',
                status: 'pending',
                createdAt: new Date(Date.now() - 7200000)
            }
        ];

        this.updatePaymentTable(dummyPayments);
    },

    /**
     * 결제 테이블 업데이트
     */
    updatePaymentTable: function (payments) {
        if (!window.adminUtils || !window.adminUtils.createDataTable) {
            console.log('adminUtils가 없어 테이블 생성 불가');
            return;
        }

        const columns = {
            paymentId: {
                label: '결제번호',
                formatter: (value) => value || '-'
            },
            userName: {
                label: '결제자',
                formatter: (value, payment) => value || payment.userEmail || '알 수 없음'
            },
            courseName: {
                label: '교육과정',
                formatter: (value) => value || '-'
            },
            amount: {
                label: '결제금액',
                formatter: (value) => this.formatCurrency(value)
            },
            paymentMethod: {
                label: '결제방법',
                formatter: (value) => {
                    const methods = {
                        'card': '신용카드',
                        'transfer': '계좌이체',
                        'vbank': '가상계좌'
                    };
                    return methods[value] || value;
                }
            },
            createdAt: {
                label: '결제일시',
                formatter: (value) => {
                    if (!value) return '-';
                    if (value.toDate) {
                        return this.formatDateTime(value.toDate());
                    }
                    return this.formatDateTime(value);
                }
            },
            status: {
                label: '상태',
                formatter: (value) => {
                    const statusBadge = {
                        'pending': '<span class="admin-badge admin-badge-warning">대기중</span>',
                        'completed': '<span class="admin-badge admin-badge-success">완료</span>',
                        'failed': '<span class="admin-badge admin-badge-danger">실패</span>',
                        'cancelled': '<span class="admin-badge admin-badge-danger">취소</span>',
                        'refund_requested': '<span class="admin-badge admin-badge-info">환불요청</span>',
                        'refunded': '<span class="admin-badge admin-badge-info">환불완료</span>'
                    };
                    return statusBadge[value] || value;
                }
            }
        };

        const actions = [
            { label: '상세', type: 'info', handler: 'paymentManager.viewPayment' },
            { label: '환불', type: 'warning', handler: 'paymentManager.showRefundModal' },
            { label: '취소', type: 'danger', handler: 'paymentManager.cancelPayment' }
        ];

        window.adminUtils.createDataTable('payment-table', payments, columns, { actions });
    },

    /**
     * 페이지 변경
     */
    changePage: function (page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadPayments();
    },

    /**
     * 검색 필터 적용
     */
    applyFilters: function () {
        this.filters = {
            searchKeyword: document.getElementById('search-keyword')?.value || '',
            status: document.getElementById('payment-status')?.value || '',
            paymentMethod: document.getElementById('payment-method')?.value || '',
            startDate: document.getElementById('start-date')?.value || '',
            endDate: document.getElementById('end-date')?.value || ''
        };

        this.currentPage = 1;
        this.lastDoc = null;
        this.loadPayments();
    },

    /**
     * 요소 업데이트
     */
    updateElement: function (elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    },

    /**
     * 화폐 포맷팅
     */
    formatCurrency: function (amount) {
        if (typeof amount !== 'number') return '₩0';
        return '₩' + amount.toLocaleString();
    },

    /**
     * 날짜 시간 포맷팅
     */
    formatDateTime: function (date) {
        if (!date) return '-';
        return date.toLocaleString('ko-KR');
    },

    /**
     * 결제 상세 보기
     */
    viewPayment: async function (paymentId) {
        try {
            if (!window.dbService) {
                console.log('dbService가 없어 더미 데이터 사용');
                // 더미 데이터 사용
                const modalContent = `
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-medium text-gray-700">결제번호</h4>
                            <p>${paymentId}</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <h4 class="font-medium text-gray-700">결제자</h4>
                                <p>홍길동</p>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-700">연락처</h4>
                                <p>010-1234-5678</p>
                            </div>
                        </div>
                        
                        <div>
                            <h4 class="font-medium text-gray-700">교육과정</h4>
                            <p>건강운동처방사</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <h4 class="font-medium text-gray-700">결제금액</h4>
                                <p>₩300,000</p>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-700">결제방법</h4>
                                <p>신용카드</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <h4 class="font-medium text-gray-700">결제일시</h4>
                                <p>${new Date().toLocaleString('ko-KR')}</p>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-700">상태</h4>
                                <p><span class="admin-badge admin-badge-success">완료</span></p>
                            </div>
                        </div>
                    </div>
                `;

                if (window.adminUtils && window.adminUtils.showModal) {
                    window.adminUtils.showModal({
                        title: '결제 상세 정보',
                        content: modalContent,
                        buttons: [
                            { label: '닫기', type: 'secondary', handler: 'adminUtils.closeModal()' }
                        ]
                    });
                }
                return;
            }

            const paymentDoc = await window.dbService.getDocument('payments', paymentId);

            if (!paymentDoc.success) {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('결제 정보를 불러올 수 없습니다.', 'error');
                }
                return;
            }

            const payment = paymentDoc.data;

            // 추가 정보 조회
            let userInfo = null;
            let courseInfo = null;

            if (payment.userId) {
                const userDoc = await window.dbService.getDocument('users', payment.userId);
                userInfo = userDoc.success ? userDoc.data : null;
            }

            if (payment.courseId) {
                const courseDoc = await window.dbService.getDocument('courses', payment.courseId);
                courseInfo = courseDoc.success ? courseDoc.data : null;
            }

            const modalContent = `
                <div class="space-y-4">
                    <div>
                        <h4 class="font-medium text-gray-700">결제번호</h4>
                        <p>${payment.paymentId || '-'}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">결제자</h4>
                            <p>${userInfo?.displayName || userInfo?.email || '알 수 없음'}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">연락처</h4>
                            <p>${userInfo?.phoneNumber || '-'}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">교육과정</h4>
                        <p>${courseInfo?.title || '-'}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">결제금액</h4>
                            <p>${this.formatCurrency(payment.amount)}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">결제방법</h4>
                            <p>${this.getPaymentMethodName(payment.paymentMethod)}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">결제일시</h4>
                            <p>${formatters.formatDateTime(payment.createdAt?.toDate())}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">상태</h4>
                            <p>${this.getStatusBadge(payment.status)}</p>
                        </div>
                    </div>
                    
                    ${payment.pgResponse ? `
                        <div>
                            <h4 class="font-medium text-gray-700">PG사 정보</h4>
                            <div class="bg-gray-50 p-4 rounded">
                                <p>승인번호: ${payment.pgResponse.authCode || '-'}</p>
                                <p>거래번호: ${payment.pgResponse.transactionId || '-'}</p>
                                <p>카드사: ${payment.pgResponse.cardName || '-'}</p>
                                <p>할부: ${payment.pgResponse.installment || 0}개월</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${payment.refundInfo ? `
                        <div>
                            <h4 class="font-medium text-gray-700">환불 정보</h4>
                            <div class="bg-red-50 p-4 rounded">
                                <p>환불금액: ${this.formatCurrency(payment.refundInfo.amount)}</p>
                                <p>환불일시: ${formatters.formatDateTime(payment.refundInfo.completedAt?.toDate())}</p>
                                <p>환불사유: ${payment.refundInfo.reason}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            if (window.adminUtils && window.adminUtils.showModal) {
                window.adminUtils.showModal({
                    title: '결제 상세 정보',
                    content: modalContent,
                    buttons: [
                        { label: '닫기', type: 'secondary', handler: 'adminUtils.closeModal()' }
                    ]
                });
            }
        } catch (error) {
            console.error('결제 상세 조회 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('오류가 발생했습니다.', 'error');
            }
        }
    },

    /**
     * 환불 모달 표시
     */
    showRefundModal: async function (paymentId) {
        try {
            if (!window.dbService) {
                // 더미 데이터 사용
                const modalContent = `
                    <form id="refund-form" onsubmit="paymentManager.handleRefund(event, '${paymentId}')">
                        <div class="mb-4">
                            <p>결제번호: <strong>${paymentId}</strong></p>
                            <p>결제금액: <strong>₩300,000</strong></p>
                        </div>
                        
                        <div class="admin-form-group">
                            <label class="admin-form-label">환불금액 <span class="text-red-500">*</span></label>
                            <input type="number" name="refundAmount" class="admin-form-control" value="300000" max="300000" required>
                            <p class="text-sm text-gray-500 mt-1">최대 ₩300,000</p>
                        </div>
                        
                        <div class="admin-form-group">
                            <label class="admin-form-label">환불사유 <span class="text-red-500">*</span></label>
                            <textarea name="refundReason" rows="3" class="admin-form-control" required></textarea>
                        </div>
                    </form>
                `;

                if (window.adminUtils && window.adminUtils.showModal) {
                    window.adminUtils.showModal({
                        title: '환불 처리',
                        content: modalContent,
                        buttons: [
                            { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                            { label: '환불', type: 'danger', handler: 'document.getElementById("refund-form").submit()' }
                        ]
                    });
                }
                return;
            }

            const paymentDoc = await window.dbService.getDocument('payments', paymentId);

            if (!paymentDoc.success) {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('결제 정보를 불러올 수 없습니다.', 'error');
                }
                return;
            }

            const payment = paymentDoc.data;

            // 이미 환불된 결제인지 확인
            if (payment.status === 'refunded') {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('이미 환불 완료된 결제입니다.', 'error');
                }
                return;
            }

            // 환불 가능한 상태인지 확인
            if (payment.status !== 'completed' && payment.status !== 'refund_requested') {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('환불 가능한 상태가 아닙니다.', 'error');
                }
                return;
            }

            const modalContent = `
               <form id="refund-form" onsubmit="paymentManager.handleRefund(event, '${paymentId}')">
                   <div class="mb-4">
                       <p>결제번호: <strong>${payment.paymentId}</strong></p>
                       <p>결제금액: <strong>${this.formatCurrency(payment.amount)}</strong></p>
                   </div>
                   
                   <div class="admin-form-group">
                       <label class="admin-form-label">환불금액 <span class="text-red-500">*</span></label>
                       <input type="number" name="refundAmount" class="admin-form-control" value="${payment.amount}" max="${payment.amount}" required>
                       <p class="text-sm text-gray-500 mt-1">최대 ${this.formatCurrency(payment.amount)}</p>
                   </div>
                   
                   <div class="admin-form-group">
                       <label class="admin-form-label">환불사유 <span class="text-red-500">*</span></label>
                       <textarea name="refundReason" rows="3" class="admin-form-control" required></textarea>
                   </div>
               </form>
           `;

            if (window.adminUtils && window.adminUtils.showModal) {
                window.adminUtils.showModal({
                    title: '환불 처리',
                    content: modalContent,
                    buttons: [
                        { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                        { label: '환불', type: 'danger', handler: 'document.getElementById("refund-form").submit()' }
                    ]
                });
            }
        } catch (error) {
            console.error('환불 모달 표시 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('오류가 발생했습니다.', 'error');
            }
        }
    },

    /**
     * 환불 처리
     */
    handleRefund: async function (event, paymentId) {
        event.preventDefault();

        if (window.adminUtils && window.adminUtils.showLoadingOverlay) {
            window.adminUtils.showLoadingOverlay(true);
        }

        try {
            if (!window.dbService) {
                console.log('환불 처리 (테스트):', paymentId);
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('환불이 처리되었습니다. (테스트)', 'success');
                }
                if (window.adminUtils && window.adminUtils.closeModal) {
                    window.adminUtils.closeModal();
                }
                this.loadPayments();
                this.loadPaymentStats();
                return;
            }

            const form = event.target;
            const formData = new FormData(form);
            const refundAmount = parseInt(formData.get('refundAmount'));
            const refundReason = formData.get('refundReason');

            // 실제 환불 처리는 PG사 API를 호출해야 하지만,
            // 여기서는 DB 업데이트만 처리
            const updateData = {
                status: 'refunded',
                refundInfo: {
                    amount: refundAmount,
                    reason: refundReason,
                    completedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    processedBy: window.dhcFirebase.getCurrentUser().uid
                }
            };

            const result = await window.dbService.updateDocument('payments', paymentId, updateData);

            if (result.success) {
                // 수강생의 수강 상태도 업데이트 (환불 시 수강 취소)
                const paymentDoc = await window.dbService.getDocument('payments', paymentId);
                if (paymentDoc.success) {
                    const payment = paymentDoc.data;
                    if (payment.userId && payment.courseId) {
                        // 수강 신청 내역 찾기
                        const enrollments = await window.dbService.getDocuments('enrollments', {
                            where: [
                                { field: 'userId', operator: '==', value: payment.userId },
                                { field: 'courseId', operator: '==', value: payment.courseId }
                            ]
                        });

                        if (enrollments.success && enrollments.data.length > 0) {
                            // 수강 상태를 취소로 변경
                            await window.dbService.updateDocument('enrollments', enrollments.data[0].id, {
                                status: 'cancelled',
                                cancelledAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }
                }

                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('환불이 처리되었습니다.', 'success');
                }
                if (window.adminUtils && window.adminUtils.closeModal) {
                    window.adminUtils.closeModal();
                }
                this.loadPayments();
                this.loadPaymentStats();
            } else {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('환불 처리에 실패했습니다.', 'error');
                }
            }
        } catch (error) {
            console.error('환불 처리 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('오류가 발생했습니다.', 'error');
            }
        } finally {
            if (window.adminUtils && window.adminUtils.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }
        }
    },

    /**
     * 결제 취소
     */
    cancelPayment: function (paymentId) {
        if (window.adminUtils && window.adminUtils.confirmDialog) {
            window.adminUtils.confirmDialog(
                '정말로 이 결제를 취소하시겠습니까?',
                () => this.handleCancelPayment(paymentId)
            );
        } else {
            this.handleCancelPayment(paymentId);
        }
    },

    /**
     * 결제 취소 처리
     */
    handleCancelPayment: async function (paymentId) {
        if (window.adminUtils && window.adminUtils.showLoadingOverlay) {
            window.adminUtils.showLoadingOverlay(true);
        }

        try {
            if (!window.dbService) {
                console.log('결제 취소 (테스트):', paymentId);
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('결제가 취소되었습니다. (테스트)', 'success');
                }
                this.loadPayments();
                this.loadPaymentStats();
                return;
            }

            const paymentDoc = await window.dbService.getDocument('payments', paymentId);

            if (!paymentDoc.success) {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('결제 정보를 찾을 수 없습니다.', 'error');
                }
                return;
            }

            const payment = paymentDoc.data;

            // 취소 가능한 상태인지 확인
            if (payment.status !== 'pending' && payment.status !== 'completed') {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('취소할 수 없는 상태입니다.', 'error');
                }
                return;
            }

            // 결제 취소
            const result = await window.dbService.updateDocument('payments', paymentId, {
                status: 'cancelled',
                cancelledAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
            });

            if (result.success) {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('결제가 취소되었습니다.', 'success');
                }
                this.loadPayments();
                this.loadPaymentStats();
            } else {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('결제 취소에 실패했습니다.', 'error');
                }
            }
        } catch (error) {
            console.error('결제 취소 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('오류가 발생했습니다.', 'error');
            }
        } finally {
            if (window.adminUtils && window.adminUtils.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }
        }
    },

    /**
     * 결제 방법 이름 가져오기
     */
    getPaymentMethodName: function (method) {
        const methods = {
            'card': '신용카드',
            'transfer': '계좌이체',
            'vbank': '가상계좌'
        };
        return methods[method] || method;
    },

    /**
     * 상태 뱃지 가져오기
     */
    getStatusBadge: function (status) {
        const statusBadge = {
            'pending': '<span class="admin-badge admin-badge-warning">대기중</span>',
            'completed': '<span class="admin-badge admin-badge-success">완료</span>',
            'failed': '<span class="admin-badge admin-badge-danger">실패</span>',
            'cancelled': '<span class="admin-badge admin-badge-danger">취소</span>',
            'refund_requested': '<span class="admin-badge admin-badge-info">환불요청</span>',
            'refunded': '<span class="admin-badge admin-badge-info">환불완료</span>'
        };
        return statusBadge[status] || status;
    }
};

// 전역 스코프에 노출
window.paymentManager = paymentManager;