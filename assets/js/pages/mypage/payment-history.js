/**
 * payment-history.js
 * 결제 내역 페이지 기능
 */

(function() {
    // 현재 페이지 정보
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalPages = 1;
    let allPayments = [];
    let filteredPayments = [];

    // 필터 상태
    let filters = {
        status: '',
        type: '',
        startDate: '',
        endDate: ''
    };

    /**
     * 페이지 초기화
     */
    async function initializePage() {
        try {
            // 인증 상태 확인
            if (!window.mypageHelpers.checkAuthState()) {
                return;
            }

            // 이벤트 리스너 설정
            setupEventListeners();

            // 기본 날짜 필터 설정 (최근 3개월)
            setDefaultDateFilter();

            // 결제 내역 로드
            await loadPaymentHistory();

        } catch (error) {
            console.error('페이지 초기화 오류:', error);
            window.mypageHelpers.showNotification('페이지 초기화 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 필터 변경 이벤트
        document.getElementById('status-filter').addEventListener('change', handleFilterChange);
        document.getElementById('type-filter').addEventListener('change', handleFilterChange);
        document.getElementById('apply-date-filter').addEventListener('click', handleDateFilterApply);
    }

    /**
     * 기본 날짜 필터 설정
     */
    function setDefaultDateFilter() {
        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        
        document.getElementById('end-date').value = formatDateForInput(today);
        document.getElementById('start-date').value = formatDateForInput(threeMonthsAgo);
        
        filters.startDate = formatDateForInput(threeMonthsAgo);
        filters.endDate = formatDateForInput(today);
    }

    /**
     * 날짜를 입력 필드용 형식으로 변환
     * @param {Date} date - 날짜 객체
     * @returns {string} - YYYY-MM-DD 형식 문자열
     */
    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * 결제 내역 로드
     */
    async function loadPaymentHistory() {
        try {
            // 로딩 상태 표시
            showLoadingState(true);

            const user = window.authService.getCurrentUser();
            
            // Firestore에서 결제 내역 조회
            const result = await window.dbService.getDocuments('payments', {
                where: {
                    field: 'userId',
                    operator: '==',
                    value: user.uid
                },
                orderBy: {
                    field: 'createdAt',
                    direction: 'desc'
                }
            });

            if (result.success) {
                allPayments = result.data;
                applyFiltersAndRender();
                updatePaymentSummary();
            } else {
                throw new Error('결제 내역 조회 실패');
            }

        } catch (error) {
            console.error('결제 내역 로드 오류:', error);
            window.mypageHelpers.showNotification('결제 내역을 불러오는데 실패했습니다.', 'error');
            showEmptyState();
        } finally {
            showLoadingState(false);
        }
    }

    /**
     * 필터 변경 처리
     */
    function handleFilterChange() {
        filters.status = document.getElementById('status-filter').value;
        filters.type = document.getElementById('type-filter').value;
        
        currentPage = 1; // 필터 변경 시 첫 페이지로
        applyFiltersAndRender();
    }

    /**
     * 날짜 필터 적용
     */
    function handleDateFilterApply() {
        filters.startDate = document.getElementById('start-date').value;
        filters.endDate = document.getElementById('end-date').value;
        
        currentPage = 1;
        applyFiltersAndRender();
    }

    /**
     * 필터 적용 및 렌더링
     */
    function applyFiltersAndRender() {
        // 필터 적용
        filteredPayments = allPayments.filter(payment => {
            // 상태 필터
            if (filters.status && payment.status !== filters.status) {
                return false;
            }
            
            // 유형 필터
            if (filters.type && payment.paymentType !== filters.type) {
                return false;
            }
            
            // 날짜 필터
            if (filters.startDate || filters.endDate) {
                const paymentDate = new Date(payment.createdAt.seconds * 1000);
                const start = filters.startDate ? new Date(filters.startDate) : null;
                const end = filters.endDate ? new Date(filters.endDate) : null;
                
                if (start && paymentDate < start) return false;
                if (end && paymentDate > end) return false;
            }
            
            return true;
        });

        // 페이지네이션 계산
        totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

        // 렌더링
        renderPaymentTable();
        renderPagination();
    }

    /**
     * 결제 테이블 렌더링
     */
    function renderPaymentTable() {
        const tableBody = document.getElementById('payment-table-body');
        
        if (filteredPayments.length === 0) {
            showEmptyState();
            return;
        }

        // 현재 페이지의 아이템만 표시
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paymentsToShow = filteredPayments.slice(startIndex, endIndex);

        tableBody.innerHTML = paymentsToShow.map(payment => createPaymentRow(payment)).join('');
        document.getElementById('empty-state').classList.add('hidden');
    }

    /**
     * 결제 행 생성
     * @param {object} payment - 결제 데이터
     * @returns {string} - HTML 문자열
     */
    function createPaymentRow(payment) {
        const paymentDate = new Date(payment.createdAt.seconds * 1000);
        const statusClass = getPaymentStatusClass(payment.status);
        const statusText = getPaymentStatusText(payment.status);
        const paymentTypeText = getPaymentTypeText(payment.paymentType);
        
        return `
            <tr>
                <td>${window.formatters.formatDate(paymentDate, 'YYYY-MM-DD HH:mm')}</td>
                <td>
                    <div>
                        <div class="font-medium">${payment.productName}</div>
                        <div class="text-xs text-gray-500">${paymentTypeText}</div>
                    </div>
                </td>
                <td>${window.formatters.formatCurrency(payment.amount)}</td>
                <td>
                    <span class="payment-status ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="payment-method">
                        ${getPaymentMethodIcon(payment.paymentMethod)}
                        <span>${payment.paymentMethod}</span>
                    </div>
                </td>
                <td>
                    ${payment.status === 'completed' ? 
                        `<button onclick="downloadReceipt('${payment.id}')" class="btn btn-sm btn-secondary">
                            영수증
                        </button>` : '-'}
                </td>
            </tr>
        `;
    }

    /**
     * 결제 상태 클래스 반환
     * @param {string} status - 결제 상태
     * @returns {string} - CSS 클래스
     */
    function getPaymentStatusClass(status) {
        switch (status) {
            case 'completed':
                return 'payment-completed';
            case 'pending':
                return 'payment-pending';
            case 'cancelled':
            case 'refunded':
                return 'payment-failed';
            default:
                return '';
        }
    }

    /**
     * 결제 상태 텍스트 반환
     * @param {string} status - 결제 상태
     * @returns {string} - 상태 텍스트
     */
    function getPaymentStatusText(status) {
        switch (status) {
            case 'completed':
                return '결제 완료';
            case 'pending':
                return '결제 대기';
            case 'cancelled':
                return '취소됨';
            case 'refunded':
                return '환불됨';
            default:
                return status;
        }
    }

    /**
     * 결제 유형 텍스트 반환
     * @param {string} type - 결제 유형
     * @returns {string} - 유형 텍스트
     */
    function getPaymentTypeText(type) {
        switch (type) {
            case 'course':
                return '교육 과정';
            case 'certificate':
                return '자격증 발급';
            case 'exam':
                return '시험 응시';
            case 'renewal':
                return '자격증 갱신';
            default:
                return '기타';
        }
    }

    /**
     * 결제 방법 아이콘 반환
     * @param {string} method - 결제 방법
     * @returns {string} - SVG 아이콘
     */
    function getPaymentMethodIcon(method) {
        switch (method) {
            case '신용카드':
                return `<svg xmlns="http://www.w3.org/2000/svg" class="payment-method-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>`;
            case '계좌이체':
                return `<svg xmlns="http://www.w3.org/2000/svg" class="payment-method-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>`;
            default:
                return `<svg xmlns="http://www.w3.org/2000/svg" class="payment-method-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`;
        }
    }

    /**
     * 결제 요약 업데이트
     */
    function updatePaymentSummary() {
        // 총 결제 건수 및 금액 계산
        const completedPayments = allPayments.filter(p => p.status === 'completed');
        const totalCount = completedPayments.length;
        const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // 이번 달 결제 계산
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyPayments = completedPayments.filter(p => {
            const paymentDate = new Date(p.createdAt.seconds * 1000);
            return paymentDate >= thisMonth;
        });
        const monthlyAmount = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // UI 업데이트
        document.getElementById('total-count').textContent = `${totalCount}건`;
        document.getElementById('total-amount').textContent = window.formatters.formatCurrency(totalAmount);
        document.getElementById('monthly-amount').textContent = window.formatters.formatCurrency(monthlyAmount);
    }

    /**
     * 페이지네이션 렌더링
     */
    function renderPagination() {
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        window.mypageHelpers.setupPagination(pagination, currentPage, totalPages, function(page) {
            currentPage = page;
            renderPaymentTable();
            renderPagination();
            window.scrollTo(0, 0);
        });
    }

    /**
     * 로딩 상태 표시
     * @param {boolean} show - 표시 여부
     */
    function showLoadingState(show) {
        const loadingState = document.getElementById('loading-state');
        const tableBody = document.getElementById('payment-table-body');
        const emptyState = document.getElementById('empty-state');
        
        if (show) {
            loadingState.classList.remove('hidden');
            tableBody.innerHTML = '';
            emptyState.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
        }
    }

    /**
     * 빈 상태 표시
     */
    function showEmptyState() {
        const tableBody = document.getElementById('payment-table-body');
        const emptyState = document.getElementById('empty-state');
        const pagination = document.getElementById('pagination');
        
        tableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        pagination.innerHTML = '';
    }

    /**
     * 영수증 다운로드
     * @param {string} paymentId - 결제 ID
     */
    window.downloadReceipt = async function(paymentId) {
        try {
            window.mypageHelpers.showNotification('영수증 다운로드 기능은 준비 중입니다.', 'info');
            
            // 실제 구현 시 영수증 PDF 생성 및 다운로드 로직 추가
            // const payment = filteredPayments.find(p => p.id === paymentId);
            // if (payment) {
            //     // 영수증 생성 및 다운로드
            //     const receiptUrl = await generateReceipt(payment);
            //     window.open(receiptUrl, '_blank');
            // }
        } catch (error) {
            console.error('영수증 다운로드 오류:', error);
            window.mypageHelpers.showNotification('영수증 다운로드 중 오류가 발생했습니다.', 'error');
        }
    };

    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', initializePage);
})();