/**
 * payment-service.js - 토스페이먼츠 v2 SDK 연동
 *
 * - SDK v2: https://js.tosspayments.com/v2/standard
 * - 결제 승인/취소: Firebase Functions 경유 (SECRET_KEY 서버 보관)
 * - 면세 처리: 토스페이먼츠에 면세사업자로 등록되어 있어 별도 파라미터 불필요
 */

(function () {
    'use strict';

    // =================================
    // 설정 로드 (toss-config.js 선행 필요)
    // =================================

    if (typeof window.TOSS_KEYS === 'undefined') {
        console.error('❌ toss-config.js가 로드되지 않았습니다. payment-service.js보다 먼저 로드해주세요.');
    }

    const _keys         = window.TOSS_KEYS || { ENV: 'TEST', TEST: {}, PRODUCTION: {} };
    const IS_PRODUCTION = _keys.ENV === 'PRODUCTION';
    const _activeKeys   = IS_PRODUCTION ? _keys.PRODUCTION : _keys.TEST;

    const CONFIG = {
        CLIENT_KEY:       _activeKeys.CLIENT_KEY || '',
        FUNCTIONS_BASE:   '/api',   // firebase.json hosting rewrite 경로
        BASE_URL:         window.location.origin,
        SUCCESS_URL_PATH: '/pages/payment/success.html',
        FAIL_URL_PATH:    '/pages/payment/fail.html'
    };

    // =================================
    // 결제 서비스
    // =================================

    window.paymentService = {

        tossPayments:  null,
        isInitialized: false,

        /**
         * SDK 초기화 (requestPayment 전에 호출)
         */
        init: function () {
            return new Promise((resolve, reject) => {
                try {
                    if (typeof TossPayments === 'undefined') {
                        throw new Error('TossPayments v2 SDK가 로드되지 않았습니다.');
                    }
                    if (!CONFIG.CLIENT_KEY) {
                        throw new Error('CLIENT_KEY가 없습니다. toss-config.js를 확인하세요.');
                    }
                    this.tossPayments  = TossPayments(CONFIG.CLIENT_KEY);
                    this.isInitialized = true;
                    console.log('✅ 토스페이먼츠 v2 초기화 완료 |', IS_PRODUCTION ? '운영' : '테스트');
                    resolve(true);
                } catch (error) {
                    console.error('❌ 초기화 실패:', error);
                    this.isInitialized = false;
                    reject(error);
                }
            });
        },

        /**
         * 결제 요청 (v2 SDK)
         *
         * @param {Object} paymentData
         *   { amount, orderId, orderName, customerName, customerEmail,
         *     customerMobilePhone, successUrl?, failUrl? }
         * @param {Object} options
         *   { customerKey? }  — Firebase UID 권장, 비회원은 생략
         */
        requestPayment: async function (paymentData, options = {}) {
            try {
                if (!this.isInitialized) {
                    throw new Error('토스페이먼츠가 초기화되지 않았습니다.');
                }

                this._validatePaymentData(paymentData);

                // v2: payment 객체 생성 (customerKey 필수)
                const customerKey = options.customerKey || 'ANONYMOUS';
                const payment = this.tossPayments.payment({ customerKey });

                const tossRequest = {
                    method: 'CARD',
                    amount: {
                        value:    paymentData.amount,
                        currency: 'KRW'
                    },
                    orderId:             paymentData.orderId,
                    orderName:           paymentData.orderName,
                    customerName:        paymentData.customerName || '',
                    customerEmail:       paymentData.customerEmail || '',
                    customerMobilePhone: paymentData.customerMobilePhone || '',
                    successUrl: paymentData.successUrl || `${CONFIG.BASE_URL}${CONFIG.SUCCESS_URL_PATH}`,
                    failUrl:    paymentData.failUrl    || `${CONFIG.BASE_URL}${CONFIG.FAIL_URL_PATH}`,
                    card: {
                        useEscrow:      false,
                        flowMode:       'DEFAULT',
                        useCardPoint:   false,
                        useAppCardOnly: false
                    }
                };

                console.log('💳 v2 결제 요청:', {
                    orderId:     tossRequest.orderId,
                    amount:      tossRequest.amount.value,
                    customerKey: customerKey
                });

                return await payment.requestPayment(tossRequest);

            } catch (error) {
                console.error('❌ 결제 요청 오류:', error);
                throw error;
            }
        },

        /**
         * 결제 승인 — Firebase Functions 경유 (SECRET_KEY 서버 보관)
         *
         * @param {string} paymentKey
         * @param {string} orderId
         * @param {number} amount
         */
        confirmPayment: async function (paymentKey, orderId, amount) {
            try {
                console.log('✅ 결제 승인 요청 → Firebase Functions');

                const res = await fetch(`${CONFIG.FUNCTIONS_BASE}/confirmPayment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentKey, orderId, amount })
                });

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.message || '결제 승인 실패');
                }

                console.log('✅ 결제 승인 성공:', result);
                return { success: true, data: result };

            } catch (error) {
                console.error('❌ 결제 승인 오류:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * 결제 취소 — Firebase Functions 경유
         *
         * @param {string} paymentKey
         * @param {string} cancelReason
         * @param {number|null} cancelAmount  - 부분 취소 시 금액, 전액 취소 시 null
         */
        cancelPayment: async function (paymentKey, cancelReason, cancelAmount = null) {
            try {
                console.log('❌ 결제 취소 요청 → Firebase Functions');

                const res = await fetch(`${CONFIG.FUNCTIONS_BASE}/cancelPayment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentKey, cancelReason, cancelAmount })
                });

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.message || '결제 취소 실패');
                }

                return { success: true, data: result };

            } catch (error) {
                console.error('❌ 결제 취소 오류:', error);
                return { success: false, error: error.message };
            }
        },

        // =================================
        // 유틸
        // =================================

        _validatePaymentData: function (paymentData) {
            const missing = ['amount', 'orderId', 'orderName'].filter(f => !paymentData[f]);
            if (missing.length) {
                throw new Error('필수 결제 데이터 누락: ' + missing.join(', '));
            }
            if (paymentData.amount < 100) {
                throw new Error('결제 금액은 100원 이상이어야 합니다.');
            }
            if (!/^[A-Za-z0-9_\-=.@]+$/.test(paymentData.orderId)) {
                throw new Error('주문 ID 형식이 올바르지 않습니다.');
            }
        },

        generateOrderId: function (prefix = 'DHC') {
            const ts     = Date.now();
            const random = Math.random().toString(36).substr(2, 9).toUpperCase();
            return `${prefix}_${ts}_${random}`;
        },

        formatAmount: function (amount) {
            return new Intl.NumberFormat('ko-KR').format(amount) + '원';
        }
    };

    // =================================
    // 결제 상태 상수
    // =================================

    window.paymentService.status = {
        PENDING:             'PENDING',
        IN_PROGRESS:         'IN_PROGRESS',
        WAITING_FOR_DEPOSIT: 'WAITING_FOR_DEPOSIT',
        DONE:                'DONE',
        CANCELED:            'CANCELED',
        PARTIAL_CANCELED:    'PARTIAL_CANCELED',
        ABORTED:             'ABORTED',
        EXPIRED:             'EXPIRED'
    };

    // =================================
    // 자동 초기화
    // =================================

    function checkAndInit() {
        if (typeof TossPayments !== 'undefined') {
            window.paymentService.init().catch(err => console.error('자동 초기화 실패:', err));
        } else {
            // success 페이지 등 SDK 없이도 confirmPayment/cancelPayment 동작
            console.log('ℹ️ TossPayments SDK 미감지 — confirmPayment/cancelPayment는 정상 동작합니다.');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndInit);
    } else {
        setTimeout(checkAndInit, 100);
    }

    // =================================
    // 디버그 도구 (비운영 환경만)
    // =================================

    if (!IS_PRODUCTION) {
        window.debugPayment = {
            env:    () => IS_PRODUCTION ? '운영' : '테스트',
            config: () => ({ ...CONFIG, note: 'SECRET_KEY는 Firebase Functions에 보관' }),
            testId: () => window.paymentService.generateOrderId('TEST')
        };
        console.log('🔧 debugPayment 도구 활성화 (비운영 환경)');
    }

})();
