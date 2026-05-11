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
            if (!await window.mypageHelpers.checkAuthState()) {
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
                const end = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : null;

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
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        ${payment.status === 'completed' ?
                            `<button onclick="downloadReceipt('${payment.id}')" class="btn btn-sm btn-secondary">영수증</button>` : ''}
                        ${payment.receiptUrl ?
                            `<button onclick="window.open('${payment.receiptUrl}','_blank')" class="btn btn-sm btn-secondary">카드전표</button>` : ''}
                        ${!payment.receiptUrl && payment.status !== 'completed' ? '-' : ''}
                    </div>
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
    function generateReceiptHtml(payment) {
        const formatCurrency = (amount) =>
            window.formatters?.formatCurrency
                ? window.formatters.formatCurrency(amount)
                : `${Number(amount).toLocaleString()}원`;

        const formatDate = (date) =>
            window.formatters?.formatDate
                ? window.formatters.formatDate(date, 'YYYY-MM-DD HH:mm')
                : date.toLocaleString('ko-KR');

        const paymentDate = new Date(payment.createdAt.seconds * 1000);
        const paymentTypeText = getPaymentTypeText(payment.paymentType);
        const now = new Date();
        const printDate = `${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일`;

        return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>결제 영수증 - ${payment.orderId}</title>
<style>
  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
    @page { margin: 20mm; size: A4; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; color: #1a1a1a; background: #fff; margin: 0; padding: 0; }
  .receipt-wrapper { max-width: 680px; margin: 0 auto; padding: 40px 40px 60px; }
  .receipt-header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 24px; margin-bottom: 32px; }
  .company-name { font-size: 22px; font-weight: 700; color: #1e3a5f; margin-bottom: 4px; }
  .company-sub { font-size: 13px; color: #555; }
  .receipt-title { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 16px 0 4px; }
  .receipt-date { font-size: 13px; color: #777; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 13px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; margin-bottom: 16px; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #555; flex: 0 0 140px; }
  .info-value { color: #1a1a1a; font-weight: 500; text-align: right; flex: 1; }
  .total-box { background: #f0f4f9; border: 2px solid #1e3a5f; border-radius: 8px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
  .total-label { font-size: 16px; font-weight: 700; color: #1e3a5f; }
  .total-amount { font-size: 24px; font-weight: 700; color: #1e3a5f; }
  .stamp-area { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px dashed #ccc; color: #888; font-size: 13px; line-height: 1.8; }
  .print-btn { display: block; margin: 32px auto 0; padding: 14px 48px; background: #1e3a5f; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
  .print-btn:hover { background: #152d4a; }
</style>
</head>
<body>
<div class="receipt-wrapper">
  <div class="receipt-header">
    <div class="company-name">문경 부설 디지털헬스케어센터</div>
    <div class="company-sub">Mungyeong Digital Healthcare Center</div>
    <div class="receipt-title">결 제 영 수 증</div>
    <div class="receipt-date">발행일: ${printDate}</div>
  </div>
  <div class="section">
    <div class="section-title">결제 정보</div>
    <div class="info-row"><span class="info-label">주문번호</span><span class="info-value">${payment.orderId || '-'}</span></div>
    <div class="info-row"><span class="info-label">결제일시</span><span class="info-value">${formatDate(paymentDate)}</span></div>
    <div class="info-row"><span class="info-label">결제방법</span><span class="info-value">${payment.paymentMethod || '-'}</span></div>
    <div class="info-row"><span class="info-label">결제상태</span><span class="info-value">결제 완료</span></div>
  </div>
  <div class="section">
    <div class="section-title">상품 정보</div>
    <div class="info-row"><span class="info-label">상품명</span><span class="info-value">${payment.productName || '-'}</span></div>
    <div class="info-row"><span class="info-label">구분</span><span class="info-value">${paymentTypeText}</span></div>
  </div>
  <div class="total-box">
    <span class="total-label">최종 결제금액</span>
    <span class="total-amount">${formatCurrency(payment.amount)}</span>
  </div>
  <div class="stamp-area">
    <p>본 영수증은 전자상거래법에 의한 정식 영수증입니다.</p>
    <p>문의: 010-2596-2233 &nbsp;|&nbsp; nhohs1507@gmail.com</p>
  </div>
  <button class="print-btn no-print" onclick="window.print()">인쇄 / PDF 저장</button>
</div>
</body>
</html>`;
    }

    window.downloadReceipt = async function(paymentId) {
        try {
            const payment = allPayments.find(p => p.id === paymentId);
            if (!payment) {
                window.mypageHelpers.showNotification('결제 정보를 찾을 수 없습니다.', 'error');
                return;
            }
            const receiptHtml = generateReceiptHtml(payment);
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                window.mypageHelpers.showNotification('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.', 'error');
                return;
            }
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
        } catch (error) {
            console.error('영수증 다운로드 오류:', error);
            window.mypageHelpers.showNotification('영수증 다운로드 중 오류가 발생했습니다.', 'error');
        }
    };

    // 페이지 로드 시 초기화 (동적 로드 대응)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePage);
    } else {
        initializePage();
    }
})();