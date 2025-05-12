/**
 * 결제 관리 페이지 스크립트
 */

// 결제 관리 객체
const paymentManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    
    /**
     * 결제 통계 로드
     */
    loadPaymentStats: async function() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            // 오늘 결제
            const todayPayments = await dbService.getDocuments('payments', {
                where: [
                    { field: 'status', operator: '==', value: 'completed' },
                    { field: 'createdAt', operator: '>=', value: today }
                ]
            });
            
            if (todayPayments.success) {
                const todayAmount = todayPayments.data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                document.getElementById('today-payment-amount').textContent = formatters.formatCurrency(todayAmount);
                document.getElementById('today-payment-count').textContent = todayPayments.data.length;
            }
            
            // 이번 달 결제
            const monthPayments = await dbService.getDocuments('payments', {
                where: [
                    { field: 'status', operator: '==', value: 'completed' },
                    { field: 'createdAt', operator: '>=', value: firstDayOfMonth }
                ]
            });
            
            if (monthPayments.success) {
                const monthAmount = monthPayments.data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                document.getElementById('month-payment-amount').textContent = formatters.formatCurrency(monthAmount);
                document.getElementById('month-payment-count').textContent = monthPayments.data.length;
            }
            
            // 환불 요청
            const refundRequests = await dbService.getDocuments('payments', {
                where: { field: 'status', operator: '==', value: 'refund_requested' }
            });
            
            if (refundRequests.success) {
                document.getElementById('refund-request-count').textContent = refundRequests.data.length;
            }
            
            // 최근 7일 결제 실패
            const failedPayments = await dbService.getDocuments('payments', {
                where: [
                    { field: 'status', operator: '==', value: 'failed' },
                    { field: 'createdAt', operator: '>=', value: sevenDaysAgo }
                ]
            });
            
            if (failedPayments.success) {
                document.getElementById('failed-payment-count').textContent = failedPayments.data.length;
            }
        } catch (error) {
            console.error('결제 통계 로드 오류:', error);
        }
    },
    
    /**
     * 결제 내역 로드
     */
    loadPayments: async function() {
        adminUtils.showLoadingOverlay(true);
        
        try {
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
                searchResults = await dbService.searchDocuments('payments', 'paymentId', this.filters.searchKeyword, options);
            } else {
                searchResults = await dbService.getPaginatedDocuments('payments', options, this.currentPage > 1 ? this.lastDoc : null);
            }
            
            if (searchResults.success) {
                // 추가 정보 조회 (결제자 정보, 교육과정 정보)
                const paymentsWithDetails = await Promise.all(searchResults.data.map(async (payment) => {
                    // 결제자 정보
                    if (payment.userId) {
                        const userDoc = await dbService.getDocument('users', payment.userId);
                        if (userDoc.success) {
                            payment.userName = userDoc.data.displayName || userDoc.data.email;
                            payment.userEmail = userDoc.data.email;
                        }
                    }
                    
                    // 교육과정 정보
                    if (payment.courseId) {
                        const courseDoc = await dbService.getDocument('courses', payment.courseId);
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
                    const totalCount = await dbService.countDocuments('payments', { where: options.where });
                    const totalPages = Math.ceil(totalCount.count / this.pageSize);
                    
                    adminUtils.createPagination('payment-pagination', this.currentPage, totalPages, 'paymentManager.changePage');
                }
            } else {
                console.error('결제 내역 로드 실패:', searchResults.error);
                adminAuth.showNotification('결제 내역을 불러오는데 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('결제 내역 로드 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 결제 테이블 업데이트
     */
    updatePaymentTable: function(payments) {
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
                formatter: (value) => formatters.formatCurrency(value)
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
                formatter: (value) => value ? formatters.formatDateTime(value.toDate()) : '-'
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
        
        adminUtils.createDataTable('payment-table', payments, columns, { actions });
    },
    
    /**
     * 페이지 변경
     */
    changePage: function(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadPayments();
    },
    
    /**
     * 결제 상세 보기
     */
    viewPayment: async function(paymentId) {
        try {
            const paymentDoc = await dbService.getDocument('payments', paymentId);
            
            if (!paymentDoc.success) {
                adminAuth.showNotification('결제 정보를 불러올 수 없습니다.', 'error');
                return;
            }
            
            const payment = paymentDoc.data;
            
            // 추가 정보 조회
            let userInfo = null;
            let courseInfo = null;
            
            if (payment.userId) {
                const userDoc = await dbService.getDocument('users', payment.userId);
                userInfo = userDoc.success ? userDoc.data : null;
            }
            
            if (payment.courseId) {
                const courseDoc = await dbService.getDocument('courses', payment.courseId);
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
                            <p>${formatters.formatCurrency(payment.amount)}</p>
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
                                <p>환불금액: ${formatters.formatCurrency(payment.refundInfo.amount)}</p>
                                <p>환불일시: ${formatters.formatDateTime(payment.refundInfo.completedAt?.toDate())}</p>
                                <p>환불사유: ${payment.refundInfo.reason}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
            
            adminUtils.showModal({
                title: '결제 상세 정보',
                content: modalContent,
                buttons: [
                    { label: '닫기', type: 'secondary', handler: 'adminUtils.closeModal()' }
                ]
            });
        } catch (error) {
            console.error('결제 상세 조회 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 환불 모달 표시
     */
    showRefundModal: async function(paymentId) {
        try {
            const paymentDoc = await dbService.getDocument('payments', paymentId);
            
            if (!paymentDoc.success) {
                adminAuth.showNotification('결제 정보를 불러올 수 없습니다.', 'error');
                return;
            }
            
            const payment = paymentDoc.data;
            
            // 이미 환불된 결제인지 확인
            if (payment.status === 'refunded') {
                adminAuth.showNotification('이미 환불 완료된 결제입니다.', 'error');
                return;
            }
            
            // 환불 가능한 상태인지 확인
            if (payment.status !== 'completed' && payment.status !== 'refund_requested') {
                adminAuth.showNotification('환불 가능한 상태가 아닙니다.', 'error');
                return;
            }
            
            const modalContent = `
                <form id="refund-form" onsubmit="paymentManager.handleRefund(event, '${paymentId}')">
                    <div class="mb-4">
                        <p>결제번호: <strong>${payment.paymentId}</strong></p>
                        <p>결제금액: <strong>${formatters.formatCurrency(payment.amount)}</strong></p>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">환불금액 <span class="text-red-500">*</span></label>
                        <input type="number" name="refundAmount" class="admin-form-control" value="${payment.amount}" max="${payment.amount}" required>
                        <p class="text-sm text-gray-500 mt-1">최대 ${formatters.formatCurrency(payment.amount)}</p>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">환불사유 <span class="text-red-500">*</span></label>
                        <textarea name="refundReason" rows="3" class="admin-form-control" required></textarea>
                    </div>
                </form>
            `;
            
            adminUtils.showModal({
                title: '환불 처리',
                content: modalContent,
                buttons: [
                    { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                    { label: '환불', type: 'danger', handler: 'document.getElementById("refund-form").submit()' }
                ]
            });
        } catch (error) {
            console.error('환불 모달 표시 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 환불 처리
     */
    handleRefund: async function(event, paymentId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        adminUtils.showLoadingOverlay(true);
        
        try {
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
            
            const result = await dbService.updateDocument('payments', paymentId, updateData);
            
            if (result.success) {
                // 수강생의 수강 상태도 업데이트 (환불 시 수강 취소)
                const paymentDoc = await dbService.getDocument('payments', paymentId);
                if (paymentDoc.success) {
                    const payment = paymentDoc.data;
                    if (payment.userId && payment.courseId) {
                        // 수강 신청 내역 찾기
                        const enrollments = await dbService.getDocuments('enrollments', {
                            where: [
                                { field: 'userId', operator: '==', value: payment.userId },
                                { field: 'courseId', operator: '==', value: payment.courseId }
                            ]
                        });
                        
                        if (enrollments.success && enrollments.data.length > 0) {
                            // 수강 상태를 취소로 변경
                            await dbService.updateDocument('enrollments', enrollments.data[0].id, {
                                status: 'cancelled',
                                cancelledAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }
                }
                
                adminAuth.showNotification('환불이 처리되었습니다.', 'success');
                adminUtils.closeModal();
                this.loadPayments();
                this.loadPaymentStats();
            } else {
                adminAuth.showNotification('환불 처리에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('환불 처리 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 결제 취소
     */
    cancelPayment: function(paymentId) {
        adminUtils.confirmDialog(
            '정말로 이 결제를 취소하시겠습니까?',
            () => this.handleCancelPayment(paymentId)
        );
    },
    
    /**
     * 결제 취소 처리
     */
    handleCancelPayment: async function(paymentId) {
        adminUtils.showLoadingOverlay(true);
        
        try {
            const paymentDoc = await dbService.getDocument('payments', paymentId);
            
            if (!paymentDoc.success) {
                adminAuth.showNotification('결제 정보를 찾을 수 없습니다.', 'error');
                return;
            }
            
            const payment = paymentDoc.data;
            
            // 취소 가능한 상태인지 확인
            if (payment.status !== 'pending' && payment.status !== 'completed') {
                adminAuth.showNotification('취소할 수 없는 상태입니다.', 'error');
                return;
            }
            
            // 결제 취소
            const result = await dbService.updateDocument('payments', paymentId, {
                status: 'cancelled',
                cancelledAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
            });
            
            if (result.success) {
                adminAuth.showNotification('결제가 취소되었습니다.', 'success');
                this.loadPayments();
                this.loadPaymentStats();
            } else {
                adminAuth.showNotification('결제 취소에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('결제 취소 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 검색 필터 적용
     */
    applyFilters: function() {
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
     * 결제 방법 이름 가져오기
     */
    getPaymentMethodName: function(method) {
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
    getStatusBadge: function(status) {
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

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', async function() {
    // Firebase 초기화 대기
    await window.dhcFirebase.initialize();
    
    // 관리자 권한 확인
    const hasAccess = await window.adminAuth.checkAdminAccess();
    if (!hasAccess) {
        return; // 권한이 없으면 이미 리디렉션됨
    }
    
    // 관리자 정보 표시
    await window.adminAuth.displayAdminInfo();
    
    // 검색 필터 설정
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
    
    adminUtils.createSearchFilter('payment-filter-container', filterOptions, 'paymentManager.applyFilters');
    
    // 결제 통계 로드
    paymentManager.loadPaymentStats();
    
    // 결제 내역 로드
    paymentManager.loadPayments();
    
    // 실시간 업데이트 설정 (결제 상태 변경 감지)
    const unsubscribe = dbService.onCollectionChange('payments', {
        where: { field: 'createdAt', operator: '>=', value: new Date(new Date().setHours(0, 0, 0, 0)) }
    }, (result) => {
        if (result.success) {
            // 통계 업데이트
            paymentManager.loadPaymentStats();
        }
    });
    
    // 페이지 언로드 시 리스너 해제
    window.addEventListener('beforeunload', () => {
        unsubscribe();
    });
});