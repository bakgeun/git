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

async function initializeSuccessPage() {
    console.log('🎉 결제 성공 페이지 초기화');

    // URL 파라미터 파싱
    const urlParams = new URLSearchParams(window.location.search);
    const paymentKey = urlParams.get('paymentKey');
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');

    console.log('📋 URL 파라미터 확인: orderId 존재 여부', !!orderId);

    if (!paymentKey || !orderId || !amount) {
        showError('결제 정보가 올바르지 않습니다.');
        return;
    }

    // Toss 리다이렉트 후 Firebase Auth 세션 복원 대기 (최대 5초)
    const user = await new Promise((resolve) => {
        if (!window.dhcFirebase?.auth) {
            resolve(null);
            return;
        }
        const unsubscribe = window.dhcFirebase.auth.onAuthStateChanged((u) => {
            unsubscribe();
            resolve(u);
        });
    });

    if (!user) {
        showError('로그인 세션이 만료되었습니다. 다시 로그인 후 시도해주세요.');
        return;
    }

    confirmPayment(paymentKey, orderId, parseInt(amount));
}

// 🔧 즉시 실행 또는 DOMContentLoaded 대기
if (document.readyState === 'loading') {
    // 아직 로딩 중이면 이벤트 리스너 등록
    document.addEventListener('DOMContentLoaded', initializeSuccessPage);
} else {
    // 이미 로드 완료되었으면 즉시 실행
    console.log('⚡ DOM 이미 준비됨 - 즉시 초기화 실행');
    initializeSuccessPage();
}

// =================================
// 결제 승인 처리
// =================================

/**
 * 토스페이먼츠 결제 승인
 */
async function confirmPayment(paymentKey, orderId, amount) {
    try {
        console.log('✅ 결제 승인 시작 (Firebase Functions 경유)');

        // confirmPayment는 Firebase Functions를 호출하므로 SDK 초기화 불필요
        if (!window.paymentService) {
            throw new Error('payment-service가 로드되지 않았습니다.');
        }

        // taxFreeAmount는 서버(Firebase Functions)에서 처리 — 클라이언트 전달 불필요
        const confirmResult = await window.paymentService.confirmPayment(
            paymentKey,
            orderId,
            amount
        );
        
        if (confirmResult.success) {
            console.log('✅ 결제 승인 성공:', confirmResult.data);
            paymentData = confirmResult.data;

            // 신청 데이터 로드 및 DB 저장 — 실패 시 결제 완료 안내와 함께 오류 화면 표시
            try {
                await loadAndUpdateApplicationData();
                showSuccessResult();
            } catch (writeError) {
                console.error('❌ 수강 등록 처리 오류:', writeError);
                showError(
                    `결제는 완료됐으나 수강 등록 처리 중 오류가 발생했습니다.\n` +
                    `주문번호: ${paymentData?.orderId || ''}\n` +
                    `고객센터 010-2596-2233으로 문의해 주시면 빠르게 처리해 드립니다.`
                );
            }

        } else {
            // 🔧 에러 메시지 개선
            const errorMessage = confirmResult.error || '결제 승인 실패';
            console.error('❌ 결제 승인 실패:', errorMessage);
            
            // 🔧 사용자 친화적인 에러 메시지 표시
            if (errorMessage.includes('만료') || errorMessage.includes('존재하지 않습니다')) {
                showError('결제 시간이 만료되었거나 유효하지 않은 결제 정보입니다. 다시 시도해주세요.');
            } else if (errorMessage.includes('404')) {
                showError('결제 정보를 찾을 수 없습니다. 고객센터로 문의해주세요.');
            } else {
                showError('결제 승인 중 오류가 발생했습니다: ' + errorMessage);
            }
        }
        
    } catch (error) {
        console.error('❌ 결제 승인 오류:', error);
        
        // 🔧 에러 타입별 처리
        let userMessage = '결제 승인 중 오류가 발생했습니다.';
        
        if (error.message) {
            if (error.message.includes('만료')) {
                userMessage = '결제 시간이 만료되었습니다. 다시 시도해주세요.';
            } else if (error.message.includes('404') || error.message.includes('존재하지 않습니다')) {
                userMessage = '결제 정보를 찾을 수 없습니다. 테스트 결제 키가 아닌 실제 결제 후 접속해주세요.';
            } else {
                userMessage = '결제 승인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            }
        }

        showError(userMessage);
    }
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
                where: { field: 'orderId', operator: '==', value: paymentData.orderId }
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

        // dbService 필수 확인 — 없으면 저장 자체가 불가능하므로 즉시 실패
        if (!window.dbService) {
            throw new Error('데이터베이스 서비스를 사용할 수 없습니다. 고객센터에 문의해 주세요.');
        }

        const currentUser = window.dhcFirebase?.getCurrentUser?.() || window.authService?.getCurrentUser?.();
        const userId = currentUser?.uid || applicationData.userId || '';

        if (!userId) {
            throw new Error('사용자 정보를 확인할 수 없습니다. 다시 로그인 후 시도해 주세요.');
        }

        // 중복 처리 방지: userId + orderId 조합으로 조회 (보안 규칙 준수)
        const dupCheck = await window.dbService.getDocuments('payments', {
            where: [
                { field: 'userId', operator: '==', value: userId },
                { field: 'orderId', operator: '==', value: paymentData.orderId }
            ]
        });
        if (dupCheck.success && dupCheck.data.length > 0) {
            console.log('✅ 이미 처리된 결제 (중복 요청 무시):', paymentData.orderId);
            applicationData = updatedData;
            return;
        }

        // ── 핵심 쓰기: payments + enrollments 배치 커밋 (둘 다 성공하거나 둘 다 실패)
        if (!window.dhcFirebase?.db) {
            throw new Error('데이터베이스 연결을 사용할 수 없습니다. 고객센터에 문의해 주세요.');
        }
        const db = window.dhcFirebase.db;
        const methodMap = { '카드': 'card', 'card': 'card', '계좌이체': 'transfer', 'transfer': 'transfer', '가상계좌': 'vbank', 'vbank': 'vbank' };
        const rawMethod = paymentData.method || paymentData.type || '카드';

        const payRef = db.collection('payments').doc();
        const enrollRef = db.collection('enrollments').doc();
        const writeBatch = db.batch();

        writeBatch.set(payRef, {
            userId: userId,
            orderId: paymentData.orderId,
            paymentKey: paymentData.paymentKey,
            amount: paymentData.totalAmount || paymentData.amount || 0,
            status: 'completed',
            paymentType: 'course',
            productName: applicationData.courseInfo?.courseName ||
                         applicationData.displayInfo?.courseName || '교육과정',
            paymentMethod: methodMap[rawMethod] || rawMethod,
            receiptUrl: paymentData.receipt?.url || '',
            createdAt: new Date(),
            paidAt: paymentData.approvedAt || new Date().toISOString()
        });

        writeBatch.set(enrollRef, {
            userId: userId,
            courseId: applicationData.courseInfo?.courseId || '',
            courseName: applicationData.courseInfo?.courseName ||
                        applicationData.displayInfo?.courseName || '교육과정',
            certType: applicationData.courseInfo?.certificateType || '',
            status: 'enrolled',
            progress: 0,
            enrolledAt: new Date(),
            applicationId: applicationData.applicationId || '',
            paymentKey: paymentData.paymentKey,
            orderId: paymentData.orderId,
            paidAmount: paymentData.totalAmount || paymentData.amount || 0,
            startDate: applicationData.courseInfo?.startDate || '',
            endDate: applicationData.courseInfo?.endDate || ''
        });

        try {
            await writeBatch.commit();
        } catch (batchErr) {
            throw new Error(`수강 등록 저장 실패 (주문번호: ${paymentData.orderId}) — ${batchErr.message}`);
        }
        console.log('✅ payments + enrollments 배치 커밋 성공:', payRef.id, enrollRef.id);

        // ── 비핵심 쓰기: applications ── 실패해도 성공 화면 표시 (추가 기록용)
        try {
            const result = await window.dbService.addDocument('applications', updatedData);
            if (result.success) {
                updatedData.firestoreId = result.id;
                console.log('✅ applications 저장 성공:', result.id);
            }
        } catch (dbError) {
            console.error('⚠️ applications 저장 오류 (비핵심):', dbError);
        }

        // 로컬 저장소 정리는 핵심 쓰기 성공 후에만 실행
        try {
            const recentApplications = JSON.parse(localStorage.getItem('dhc_recent_applications') || '[]');
            recentApplications.unshift({
                applicationId: updatedData.applicationId,
                type: 'course_enrollment',
                courseName: updatedData.displayInfo.courseName,
                applicantName: updatedData.displayInfo.applicantName,
                totalAmount: updatedData.displayInfo.totalAmount,
                status: 'payment_completed',
                timestamp: new Date().toISOString(),
                paymentKey: paymentData.paymentKey,
                orderId: paymentData.orderId
            });
            if (recentApplications.length > 10) recentApplications.splice(10);
            localStorage.setItem('dhc_recent_applications', JSON.stringify(recentApplications));
        } catch (localError) {
            console.warn('⚠️ 로컬 저장소 업데이트 실패:', localError);
        }
        localStorage.removeItem('dhc_pending_order');
        localStorage.removeItem('dhc_payment_backup');

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
            from: 'course-application',
            type: 'course_enrollment',
            status: 'payment_completed',
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
                callback: function (doc) {
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