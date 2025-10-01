/**
 * success.js - 결제 성공 페이지 스크립트 (완전한 버전)
 * 토스페이먼츠 결제 성공 후 처리 로직
 */

console.log('=== 결제 성공 페이지 로드됨 ===');

// =================================
// 전역 변수
// =================================

let paymentData = null;
let applicationData = null;

// =================================
// 초기화
// =================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 결제 성공 페이지 초기화');
    
    // URL 파라미터 파싱
    const urlParams = new URLSearchParams(window.location.search);
    const paymentKey = urlParams.get('paymentKey');
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');
    
    console.log('📋 URL 파라미터:', { paymentKey, orderId, amount });
    
    if (paymentKey && orderId && amount) {
        // 토스페이먼츠 결제 승인 처리
        confirmPayment(paymentKey, orderId, parseInt(amount));
    } else {
        // 파라미터가 없는 경우 오류 처리
        showError('결제 정보가 올바르지 않습니다.');
    }
});

// =================================
// 결제 승인 처리
// =================================

/**
 * 토스페이먼츠 결제 승인
 */
async function confirmPayment(paymentKey, orderId, amount) {
    try {
        console.log('✅ 토스페이먼츠 결제 승인 시작:', { paymentKey, orderId, amount });
        
        // payment-service 초기화 확인
        if (!window.paymentService || !window.paymentService.isInitialized) {
            console.log('⚠️ payment-service 초기화 대기...');
            await waitForPaymentService();
        }
        
        // 토스페이먼츠 결제 승인 요청
        const confirmResult = await window.paymentService.confirmPayment(paymentKey, orderId, amount);
        
        if (confirmResult.success) {
            console.log('✅ 결제 승인 성공:', confirmResult.data);
            paymentData = confirmResult.data;
            
            // 신청 데이터 로드 및 업데이트
            await loadAndUpdateApplicationData();
            
            // 성공 화면 표시
            showSuccessResult();
            
        } else {
            throw new Error(confirmResult.error || '결제 승인 실패');
        }
        
    } catch (error) {
        console.error('❌ 결제 승인 오류:', error);
        showError('결제 승인 중 오류가 발생했습니다: ' + error.message);
    }
}

/**
 * payment-service 초기화 대기
 */
function waitForPaymentService() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        function check() {
            attempts++;
            
            if (window.paymentService && window.paymentService.isInitialized) {
                console.log('✅ payment-service 준비됨');
                resolve();
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                reject(new Error('payment-service 초기화 시간 초과'));
            }
        }
        
        check();
    });
}

/**
 * 신청 데이터 로드 및 업데이트
 */
async function loadAndUpdateApplicationData() {
    try {
        console.log('📄 신청 데이터 로드 및 업데이트');
        
        // 로컬 저장소에서 신청 데이터 로드
        const pendingOrderStr = localStorage.getItem('dhc_pending_order');
        if (pendingOrderStr) {
            const pendingOrder = JSON.parse(pendingOrderStr);
            if (pendingOrder.orderId === paymentData.orderId) {
                applicationData = pendingOrder.applicationData;
                console.log('✅ 로컬 저장소에서 신청 데이터 로드됨');
            }
        }
        
        // Firebase에서 신청 데이터 검색 (백업)
        if (!applicationData && window.dbService) {
            const searchResult = await window.dbService.getDocuments('pending_applications', {
                where: { field: 'applicationId', operator: '==', value: paymentData.orderId }
            });
            
            if (searchResult.success && searchResult.data.length > 0) {
                applicationData = searchResult.data[0];
                console.log('✅ Firebase에서 신청 데이터 로드됨');
            }
        }
        
        if (!applicationData) {
            throw new Error('신청 데이터를 찾을 수 없습니다.');
        }
        
        // 결제 정보로 신청 데이터 업데이트
        const updatedData = {
            ...applicationData,
            payment: {
                ...paymentData,
                status: 'completed',
                paidAt: new Date(),
                paymentMethod: 'toss_payments',
                pgProvider: 'tosspayments'
            },
            status: 'payment_completed',
            completedAt: new Date().toISOString(),
            
            displayInfo: {
                courseName: applicationData.courseInfo?.courseName || '교육과정',
                certificateType: applicationData.courseInfo?.certificateType || '',
                applicantName: applicationData.applicantInfo?.['applicant-name'] || '고객',
                totalAmount: paymentData.totalAmount || paymentData.amount,
                paymentDate: new Date().toISOString(),
                enrollmentStatus: 'enrolled',
                nextSteps: [
                    '교육 시작 전 안내 문자 발송',
                    '온라인 강의 자료 접근 권한 부여',
                    '교육 수료 후 자격증 발급 진행'
                ]
            }
        };
        
        // Firebase에 최종 데이터 저장
        if (window.dbService) {
            try {
                const result = await window.dbService.addDocument('applications', updatedData);
                if (result.success) {
                    updatedData.firestoreId = result.id;
                    console.log('✅ 결제 완료 데이터 저장 성공:', result.id);
                }
            } catch (dbError) {
                console.error('❌ Firebase 저장 오류:', dbError);
                // Firebase 저장 실패해도 계속 진행
            }
        }
        
        // 로컬 스토리지에 성공 데이터 저장
        try {
            const recentApplications = JSON.parse(localStorage.getItem('dhc_recent_applications') || '[]');
            const newApplication = {
                applicationId: updatedData.applicationId,
                type: 'course_enrollment',
                courseName: updatedData.displayInfo.courseName,
                applicantName: updatedData.displayInfo.applicantName,
                totalAmount: updatedData.displayInfo.totalAmount,
                status: 'payment_completed',
                timestamp: new Date().toISOString(),
                paymentKey: paymentData.paymentKey,
                orderId: paymentData.orderId
            };
            
            recentApplications.unshift(newApplication);
            if (recentApplications.length > 10) {
                recentApplications.splice(10);
            }
            
            localStorage.setItem('dhc_recent_applications', JSON.stringify(recentApplications));
            
            // 임시 저장 데이터 정리
            localStorage.removeItem('dhc_pending_order');
            localStorage.removeItem('dhc_payment_backup');
            
            console.log('✅ 로컬 저장소 업데이트 완료');
            
        } catch (localError) {
            console.warn('⚠️ 로컬 저장소 업데이트 실패:', localError);
        }
        
        // 업데이트된 데이터를 전역 변수에 저장
        applicationData = updatedData;
        
    } catch (error) {
        console.error('❌ 신청 데이터 업데이트 오류:', error);
        throw error;
    }
}

// =================================
// UI 업데이트
// =================================

/**
 * 성공 결과 화면 표시
 */
function showSuccessResult() {
    try {
        console.log('🎉 성공 결과 화면 표시');
        
        // 로딩 화면 숨기기
        document.getElementById('loading-container').classList.add('hidden');
        
        // 성공 화면 표시
        document.getElementById('success-container').classList.remove('hidden');
        
        // 결제 정보 표시
        updatePaymentInfo();
        
        console.log('✅ 성공 화면 표시 완료');
        
    } catch (error) {
        console.error('❌ 성공 화면 표시 오류:', error);
        showError('화면 표시 중 오류가 발생했습니다.');
    }
}

/**
 * 결제 정보 업데이트
 */
function updatePaymentInfo() {
    try {
        const formatCurrency = (amount) => {
            return window.formatters?.formatCurrency 
                ? window.formatters.formatCurrency(amount)
                : `${amount.toLocaleString()}원`;
        };
        
        const formatDate = (date) => {
            if (window.formatters?.formatDate) {
                return window.formatters.formatDate(new Date(date), 'YYYY-MM-DD HH:mm');
            }
            return new Date(date).toLocaleString('ko-KR');
        };
        
        // 주문번호
        const orderIdElement = document.getElementById('order-id');
        if (orderIdElement && paymentData) {
            orderIdElement.textContent = paymentData.orderId || '-';
        }
        
        // 교육과정명
        const courseNameElement = document.getElementById('course-name');
        if (courseNameElement && applicationData) {
            courseNameElement.textContent = applicationData.displayInfo?.courseName || '교육과정';
        }
        
        // 신청자명
        const customerNameElement = document.getElementById('customer-name');
        if (customerNameElement && applicationData) {
            customerNameElement.textContent = applicationData.displayInfo?.applicantName || '고객';
        }
        
        // 결제금액
        const paymentAmountElement = document.getElementById('payment-amount');
        if (paymentAmountElement && paymentData) {
            const amount = paymentData.totalAmount || paymentData.amount || 0;
            paymentAmountElement.textContent = formatCurrency(amount);
        }
        
        // 결제방법
        const paymentMethodElement = document.getElementById('payment-method');
        if (paymentMethodElement && paymentData) {
            const methodMap = {
                '카드': '신용카드',
                '계좌이체': '계좌이체',
                '가상계좌': '가상계좌'
            };
            const method = paymentData.method || paymentData.type || '카드';
            paymentMethodElement.textContent = methodMap[method] || method;
        }
        
        // 결제일시
        const paymentDateElement = document.getElementById('payment-date');
        if (paymentDateElement && paymentData) {
            const date = paymentData.approvedAt || paymentData.requestedAt || new Date();
            paymentDateElement.textContent = formatDate(date);
        }
        
        console.log('✅ 결제 정보 업데이트 완료');
        
    } catch (error) {
        console.error('❌ 결제 정보 업데이트 오류:', error);
    }
}

/**
 * 오류 화면 표시
 */
function showError(message) {
    console.log('❌ 오류 화면 표시:', message);
    
    // 로딩 화면 숨기기
    document.getElementById('loading-container').classList.add('hidden');
    
    // 오류 화면 표시
    const errorContainer = document.getElementById('error-container');
    const errorMessageElement = document.getElementById('error-message');
    
    if (errorContainer) {
        errorContainer.classList.remove('hidden');
    }
    
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
}

// =================================
// 액션 함수들
// =================================

/**
 * 마이페이지로 이동
 */
function goToMyPage() {
    try {
        console.log('📍 마이페이지로 이동');
        
        // URL 파라미터 구성
        const params = new URLSearchParams({
            from: 'payment_success',
            type: 'course_enrollment',
            highlight: 'latest'
        });
        
        if (applicationData?.applicationId) {
            params.set('applicationId', applicationData.applicationId);
        }
        
        if (applicationData?.displayInfo?.courseName) {
            params.set('courseName', applicationData.displayInfo.courseName);
        }
        
        // 수강 내역 페이지로 이동
        const mypageUrl = window.adjustPath 
            ? window.adjustPath(`pages/mypage/course-history.html?${params.toString()}`)
            : `../mypage/course-history.html?${params.toString()}`;
            
        window.location.href = mypageUrl;
        
    } catch (error) {
        console.error('❌ 마이페이지 이동 오류:', error);
        // 폴백: 파라미터 없이 이동
        const fallbackUrl = window.adjustPath 
            ? window.adjustPath('pages/mypage/course-history.html')
            : '../mypage/course-history.html';
        window.location.href = fallbackUrl;
    }
}

/**
 * 영수증 다운로드
 */
async function downloadReceipt() {
    try {
        console.log('🧾 영수증 다운로드');
        
        if (!paymentData || !applicationData) {
            alert('결제 정보가 없어 영수증을 다운로드할 수 없습니다.');
            return;
        }
        
        // 영수증 HTML 생성
        const receiptHtml = generateReceiptHtml();
        
        // PDF 생성 (jsPDF 사용 - CDN에서 로드)
        const { jsPDF } = window.jspdf || {};
        
        if (jsPDF) {
            const pdf = new jsPDF();
            pdf.html(receiptHtml, {
                callback: function(doc) {
                    const filename = `영수증_${paymentData.orderId}_${new Date().getTime()}.pdf`;
                    doc.save(filename);
                },
                x: 10,
                y: 10,
                width: 180,
                windowWidth: 800
            });
        } else {
            // jsPDF가 없는 경우 새 창에서 출력
            const printWindow = window.open('', '_blank');
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            printWindow.print();
        }
        
    } catch (error) {
        console.error('❌ 영수증 다운로드 오류:', error);
        alert('영수증 다운로드 중 오류가 발생했습니다.');
    }
}

/**
 * 영수증 HTML 생성
 */
function generateReceiptHtml() {
    const formatCurrency = (amount) => `${amount.toLocaleString()}원`;
    const formatDate = (date) => new Date(date).toLocaleString('ko-KR');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>영수증</title>
            <style>
                body { font-family: 'Noto Sans KR', sans-serif; margin: 20px; }
                .receipt { max-width: 600px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .receipt-title { font-size: 20px; color: #666; }
                .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .info-table th, .info-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                .info-table th { background-color: #f8f9fa; font-weight: bold; }
                .total-row { background-color: #e3f2fd; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <div class="company-name">문경 부설 디지털헬스케어센터</div>
                    <div class="receipt-title">결제 영수증</div>
                </div>
                
                <table class="info-table">
                    <tr>
                        <th>주문번호</th>
                        <td>${paymentData.orderId || '-'}</td>
                    </tr>
                    <tr>
                        <th>교육과정</th>
                        <td>${applicationData.displayInfo?.courseName || '-'}</td>
                    </tr>
                    <tr>
                        <th>신청자</th>
                        <td>${applicationData.displayInfo?.applicantName || '-'}</td>
                    </tr>
                    <tr>
                        <th>결제방법</th>
                        <td>${paymentData.method || paymentData.type || '카드'}</td>
                    </tr>
                    <tr>
                        <th>결제일시</th>
                        <td>${formatDate(paymentData.approvedAt || new Date())}</td>
                    </tr>
                    <tr class="total-row">
                        <th>결제금액</th>
                        <td>${formatCurrency(paymentData.totalAmount || paymentData.amount || 0)}</td>
                    </tr>
                </table>
                
                <div class="footer">
                    <p>이 영수증은 전자상거래법에 의한 정식 영수증입니다.</p>
                    <p>문의사항: 010-2596-2233 | nhohs1507@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * 홈으로 이동
 */
function goToHome() {
    console.log('🏠 홈으로 이동');
    const homeUrl = window.adjustPath ? window.adjustPath('index.html') : '../../index.html';
    window.location.href = homeUrl;
}

/**
 * 고객센터 문의
 */
function contactSupport() {
    console.log('📞 고객센터 문의');
    
    const message = `결제 관련 문의사항이 있습니다.\n\n` +
                   `주문번호: ${paymentData?.orderId || '알 수 없음'}\n` +
                   `결제일시: ${new Date().toLocaleString()}\n` +
                   `문의내용: `;
    
    // 이메일 또는 전화 연결
    const email = 'nhohs1507@gmail.com';
    const subject = '[결제문의] ' + (paymentData?.orderId || '결제관련문의');
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    // 이메일 클라이언트 열기 시도
    try {
        window.location.href = mailtoUrl;
    } catch (error) {
        // 이메일 클라이언트가 없는 경우 전화번호 표시
        alert('고객센터 연락처:\n전화: 010-2596-2233\n이메일: nhohs1507@gmail.com');
    }
}

/**
 * 결제 페이지로 돌아가기
 */
function goToPaymentPage() {
    console.log('💳 결제 페이지로 돌아가기');
    const paymentUrl = window.adjustPath 
        ? window.adjustPath('pages/education/course-application.html')
        : '../education/course-application.html';
    window.location.href = paymentUrl;
}

// =================================
// 전역 함수 노출
// =================================

// 전역 함수로 노출 (HTML에서 호출)
window.goToMyPage = goToMyPage;
window.downloadReceipt = downloadReceipt;
window.goToHome = goToHome;
window.contactSupport = contactSupport;
window.goToPaymentPage = goToPaymentPage;

// =================================
// 디버깅 도구
// =================================

if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.web.app')) {
    
    window.debugPaymentSuccess = {
        showPaymentData: () => {
            console.log('💳 결제 데이터:', paymentData);
            console.log('📄 신청 데이터:', applicationData);
        },
        
        testReceipt: () => {
            if (paymentData && applicationData) {
                downloadReceipt();
            } else {
                console.log('❌ 결제 데이터가 없습니다.');
            }
        },
        
        simulateError: (message = '테스트 오류') => {
            showError(message);
        },
        
        simulateSuccess: () => {
            // 테스트용 데이터 생성
            paymentData = {
                paymentKey: 'test_payment_' + Date.now(),
                orderId: 'TEST_' + Date.now(),
                amount: 50000,
                totalAmount: 50000,
                method: '카드',
                approvedAt: new Date().toISOString()
            };
            
            applicationData = {
                applicationId: paymentData.orderId,
                courseInfo: {
                    courseName: '테스트 교육과정'
                },
                applicantInfo: {
                    'applicant-name': '홍길동'
                },
                displayInfo: {
                    courseName: '테스트 교육과정',
                    applicantName: '홍길동',
                    totalAmount: 50000
                }
            };
            
            showSuccessResult();
            console.log('✅ 테스트 성공 화면 표시됨');
        },
        
        help: () => {
            console.log('🎯 결제 성공 페이지 디버깅 도구');
            console.log('📊 데이터: showPaymentData()');
            console.log('🧾 영수증: testReceipt()');
            console.log('❌ 오류: simulateError("메시지")');
            console.log('✅ 성공: simulateSuccess()');
        }
    };
    
    console.log('🎯 개발 모드 - 결제 성공 디버깅 도구 활성화됨');
    console.log('💡 도움말: window.debugPaymentSuccess.help()');
}

// =================================
// 완료 메시지
// =================================

console.log('✅ 결제 성공 페이지 스크립트 로딩 완료');