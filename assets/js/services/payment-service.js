/**
 * payment-service.js - 토스페이먼츠 연동 서비스 (면세 파라미터 추가 버전)
 * 토스페이먼츠 일반결제를 처리하는 서비스 모듈
 */

console.log('=== payment-service.js 면세 파라미터 추가 버전 로드됨 ===');

(function() {
    'use strict';

    // =================================
    // 토스페이먼츠 설정
    // =================================
    
    const TOSS_CONFIG = {
        // 테스트 환경 설정
        TEST: {
            CLIENT_KEY: 'test_ck_Z61JOxRQVE2xdezv4v1QrW0X9bAq',  // 토스페이먼츠 공식 테스트 클라이언트 키
            SECRET_KEY: 'test_sk_0RnYX2w5322bmEEknNlM3NeyqApQ',  // 토스페이먼츠 공식 테스트 시크릿 키
            PAYMENT_URL: 'https://api.tosspayments.com/v1/payments',
            BASE_URL: window.location.origin,
            SUCCESS_URL_PATH: '/pages/payment/success.html',
            FAIL_URL_PATH: '/pages/payment/fail.html'
        },
        
        // 운영 환경 설정 (승인 후 사용)
        PRODUCTION: {
            CLIENT_KEY: 'live_ck_...',  // 실제 운영 클라이언트 키로 교체 필요
            SECRET_KEY: 'live_sk_...',  // 실제 운영 시크릿 키로 교체 필요
            PAYMENT_URL: 'https://api.tosspayments.com/v1/payments'
        }
    };

    // 현재 환경 설정 (테스트/운영)
    const IS_PRODUCTION = false;  // 승인 후 true로 변경
    const CONFIG = IS_PRODUCTION ? TOSS_CONFIG.PRODUCTION : TOSS_CONFIG.TEST;

    // =================================
    // 🆕 면세사업자 설정 (NEW)
    // =================================
    
    const TAX_FREE_CONFIG = {
        // 사업자 유형 설정
        BUSINESS_TYPE: 'TAX_FREE',  // 'GENERAL' | 'TAX_FREE' | 'MIXED'
        
        // 면세 상품 카테고리 (필요시 확장)
        TAX_FREE_CATEGORIES: [
            'education',     // 교육 서비스
            'material',      // 교재 (도서)
            'certificate'    // 자격증 발급 (일부 면세 가능)
        ],
        
        // 과세/면세 기본 설정
        DEFAULT_TAX_SETTINGS: {
            education: { isTaxFree: true, taxRate: 0 },      // 교육비 면세
            material: { isTaxFree: true, taxRate: 0 },       // 도서 면세  
            certificate: { isTaxFree: true, taxRate: 0 }  // 자격증 발급비는 과세
        }
    };

    // =================================
    // 결제 서비스 메인 객체
    // =================================
    
    window.paymentService = {
        tossPayments: null,
        isInitialized: false,

        /**
         * 토스페이먼츠 초기화
         */
        init: function() {
            return new Promise((resolve, reject) => {
                try {
                    console.log('💳 토스페이먼츠 초기화 시작');
                    
                    // TossPayments 객체 확인
                    if (typeof TossPayments === 'undefined') {
                        throw new Error('TossPayments SDK가 로드되지 않았습니다.');
                    }
                    
                    // 토스페이먼츠 인스턴스 생성
                    this.tossPayments = TossPayments(CONFIG.CLIENT_KEY);
                    this.isInitialized = true;
                    
                    console.log('✅ 토스페이먼츠 초기화 성공');
                    console.log('🔧 환경:', IS_PRODUCTION ? '운영' : '테스트');
                    console.log('💰 사업자 유형:', TAX_FREE_CONFIG.BUSINESS_TYPE);
                    resolve(true);
                    
                } catch (error) {
                    console.error('❌ 토스페이먼츠 초기화 실패:', error);
                    this.isInitialized = false;
                    reject(error);
                }
            });
        },

        /**
         * 🆕 면세 금액 계산 (NEW)
         * @param {Object} paymentItems - 결제 항목들
         * @returns {Object} 면세/과세 금액 분석 결과
         */
        calculateTaxFreeAmount: function(paymentItems) {
            console.log('💰 면세 금액 계산 시작:', paymentItems);
            
            let totalAmount = 0;
            let taxFreeAmount = 0;
            let taxableAmount = 0;
            let vat = 0;
            
            const itemBreakdown = [];
            
            // 각 항목별 세금 계산
            Object.keys(paymentItems).forEach(itemType => {
                const amount = paymentItems[itemType] || 0;
                if (amount <= 0) return;
                
                const taxSettings = TAX_FREE_CONFIG.DEFAULT_TAX_SETTINGS[itemType] || 
                                  { isTaxFree: false, taxRate: 0.1 };
                
                totalAmount += amount;
                
                if (taxSettings.isTaxFree) {
                    // 면세 항목
                    taxFreeAmount += amount;
                    itemBreakdown.push({
                        type: itemType,
                        amount: amount,
                        isTaxFree: true,
                        vat: 0,
                        suppliedAmount: amount
                    });
                } else {
                    // 과세 항목 - 부가세 포함 가격에서 공급가액과 부가세 분리
                    const suppliedAmount = Math.floor(amount / (1 + taxSettings.taxRate));
                    const itemVat = amount - suppliedAmount;
                    
                    taxableAmount += suppliedAmount;
                    vat += itemVat;
                    
                    itemBreakdown.push({
                        type: itemType,
                        amount: amount,
                        isTaxFree: false,
                        vat: itemVat,
                        suppliedAmount: suppliedAmount
                    });
                }
            });
            
            const result = {
                totalAmount: totalAmount,
                taxFreeAmount: taxFreeAmount,
                taxableAmount: taxableAmount,
                suppliedAmount: taxableAmount,  // 과세 상품의 공급가액
                vat: vat,
                itemBreakdown: itemBreakdown,
                businessType: TAX_FREE_CONFIG.BUSINESS_TYPE
            };
            
            console.log('💰 면세 금액 계산 결과:', result);
            return result;
        },

        /**
         * 결제 요청 (면세 파라미터 추가)
         * @param {Object} paymentData - 결제 데이터
         * @param {Object} options - 추가 옵션
         * @returns {Promise}
         */
        requestPayment: async function(paymentData, options = {}) {
            try {
                console.log('💳 결제 요청 시작 (면세 지원):', paymentData);
                
                // 초기화 확인
                if (!this.isInitialized) {
                    throw new Error('토스페이먼츠가 초기화되지 않았습니다.');
                }

                // 결제 데이터 검증
                this.validatePaymentData(paymentData);

                // 🆕 면세 금액 계산 및 추가
                const tossPaymentData = this.buildTossPaymentDataWithTaxFree(paymentData, options);
                
                console.log('🔧 토스페이먼츠 요청 데이터 (면세 포함):', tossPaymentData);

                // 결제 방법에 따른 처리
                const paymentMethod = options.paymentMethod || '카드';
                
                switch (paymentMethod) {
                    case '카드':
                    case 'CARD':
                        return await this.requestCardPayment(tossPaymentData);
                    
                    case '계좌이체':
                    case 'TRANSFER':
                        return await this.requestTransferPayment(tossPaymentData);
                    
                    case '가상계좌':
                    case 'VIRTUAL_ACCOUNT':
                        return await this.requestVirtualAccountPayment(tossPaymentData);
                    
                    default:
                        return await this.requestCardPayment(tossPaymentData);
                }

            } catch (error) {
                console.error('❌ 결제 요청 오류:', error);
                throw this.createPaymentError(error);
            }
        },

        /**
         * 카드 결제 요청
         */
        requestCardPayment: async function(paymentData) {
            console.log('💳 카드 결제 요청 (면세 지원)');
            return await this.tossPayments.requestPayment('카드', paymentData);
        },

        /**
         * 계좌이체 결제 요청
         */
        requestTransferPayment: async function(paymentData) {
            console.log('🏦 계좌이체 결제 요청 (면세 지원)');
            return await this.tossPayments.requestPayment('계좌이체', paymentData);
        },

        /**
         * 가상계좌 결제 요청
         */
        requestVirtualAccountPayment: async function(paymentData) {
            console.log('🏛️ 가상계좌 결제 요청 (면세 지원)');
            return await this.tossPayments.requestPayment('가상계좌', {
                ...paymentData,
                validHours: 24  // 가상계좌 유효시간 (24시간)
            });
        },

        /**
         * 결제 데이터 검증
         */
        validatePaymentData: function(paymentData) {
            const required = ['amount', 'orderId', 'orderName'];
            const missing = required.filter(field => !paymentData[field]);
            
            if (missing.length > 0) {
                throw new Error(`필수 결제 데이터가 누락되었습니다: ${missing.join(', ')}`);
            }

            // 금액 검증
            if (paymentData.amount < 100) {
                throw new Error('결제 금액은 100원 이상이어야 합니다.');
            }

            // 주문 ID 형식 검증
            if (!/^[A-Za-z0-9_-]+$/.test(paymentData.orderId)) {
                throw new Error('주문 ID는 영문, 숫자, _, - 만 사용할 수 있습니다.');
            }

            console.log('✅ 결제 데이터 검증 통과');
        },

        /**
         * 🆕 토스페이먼츠 요청 데이터 구성 (면세 파라미터 포함) (NEW)
         */
        buildTossPaymentDataWithTaxFree: function(paymentData, options = {}) {
            const baseUrl = CONFIG.BASE_URL || window.location.origin;
            
            // 기본 결제 데이터
            const tossData = {
                amount: paymentData.amount,
                orderId: paymentData.orderId,
                orderName: paymentData.orderName,
                customerName: paymentData.customerName || '고객',
                customerEmail: paymentData.customerEmail || '',
                customerMobilePhone: paymentData.customerMobilePhone || '',
                successUrl: paymentData.successUrl || `${baseUrl}${CONFIG.SUCCESS_URL_PATH}`,
                failUrl: paymentData.failUrl || `${baseUrl}${CONFIG.FAIL_URL_PATH}`
            };
            
            // 🆕 면세 금액 계산 및 추가
            if (paymentData.paymentItems) {
                const taxCalculation = this.calculateTaxFreeAmount(paymentData.paymentItems);
                
                // 면세 금액이 있는 경우에만 파라미터 추가
                if (taxCalculation.taxFreeAmount > 0) {
                    tossData.taxFreeAmount = taxCalculation.taxFreeAmount;
                    
                    console.log('💰 면세 파라미터 추가됨:', {
                        totalAmount: taxCalculation.totalAmount,
                        taxFreeAmount: taxCalculation.taxFreeAmount,
                        suppliedAmount: taxCalculation.suppliedAmount,
                        vat: taxCalculation.vat
                    });
                }
                
                // 메타데이터에 세금 계산 정보 저장 (디버깅용)
                tossData.metadata = {
                    ...options.additionalData,
                    taxCalculation: taxCalculation,
                    businessType: TAX_FREE_CONFIG.BUSINESS_TYPE
                };
            }
            
            // 추가 옵션 적용
            if (options.additionalData) {
                Object.assign(tossData, options.additionalData);
            }
            
            return tossData;
        },

        /**
         * 토스페이먼츠 요청 데이터 구성 (기존 호환용)
         */
        buildTossPaymentData: function(paymentData, options = {}) {
            console.warn('⚠️ 기존 buildTossPaymentData 사용됨. buildTossPaymentDataWithTaxFree 사용을 권장합니다.');
            return this.buildTossPaymentDataWithTaxFree(paymentData, options);
        },

        /**
         * 결제 승인 (면세 정보 포함)
         * @param {string} paymentKey - 결제 키
         * @param {string} orderId - 주문 ID
         * @param {number} amount - 결제 금액
         * @returns {Promise}
         */
        confirmPayment: async function(paymentKey, orderId, amount) {
            try {
                console.log('✅ 결제 승인 요청 (면세 지원):', { paymentKey, orderId, amount });

                const response = await fetch(`${CONFIG.PAYMENT_URL}/confirm`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${btoa(CONFIG.SECRET_KEY + ':')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        paymentKey: paymentKey,
                        orderId: orderId,
                        amount: amount
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '결제 승인 실패');
                }

                const result = await response.json();
                
                // 🆕 면세 정보 로깅
                if (result.taxFreeAmount) {
                    console.log('💰 승인된 면세 정보:', {
                        totalAmount: result.totalAmount,
                        taxFreeAmount: result.taxFreeAmount,
                        suppliedAmount: result.suppliedAmount,
                        vat: result.vat
                    });
                }
                
                console.log('✅ 결제 승인 성공:', result);
                
                return {
                    success: true,
                    data: result
                };

            } catch (error) {
                console.error('❌ 결제 승인 오류:', error);
                return {
                    success: false,
                    error: error.message || '결제 승인 중 오류가 발생했습니다.'
                };
            }
        },

        /**
         * 🆕 면세 금액 포함 결제 취소
         * @param {string} paymentKey - 결제 키
         * @param {string} cancelReason - 취소 사유
         * @param {number} cancelAmount - 취소 금액 (부분 취소시)
         * @param {number} taxFreeAmount - 취소할 면세 금액
         * @returns {Promise}
         */
        cancelPayment: async function(paymentKey, cancelReason, cancelAmount = null, taxFreeAmount = null) {
            try {
                console.log('❌ 결제 취소 요청 (면세 지원):', { 
                    paymentKey, cancelReason, cancelAmount, taxFreeAmount 
                });

                const requestBody = {
                    cancelReason: cancelReason
                };

                if (cancelAmount) {
                    requestBody.cancelAmount = cancelAmount;
                }

                // 🆕 면세 금액 취소 파라미터 추가
                if (taxFreeAmount && taxFreeAmount > 0) {
                    requestBody.taxFreeAmount = taxFreeAmount;
                    console.log('💰 면세 금액 취소:', taxFreeAmount);
                }

                const response = await fetch(`${CONFIG.PAYMENT_URL}/${paymentKey}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${btoa(CONFIG.SECRET_KEY + ':')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '결제 취소 실패');
                }

                const result = await response.json();
                console.log('✅ 결제 취소 성공:', result);
                
                return {
                    success: true,
                    data: result
                };

            } catch (error) {
                console.error('❌ 결제 취소 오류:', error);
                return {
                    success: false,
                    error: error.message || '결제 취소 중 오류가 발생했습니다.'
                };
            }
        },

        /**
         * 결제 정보 조회
         * @param {string} paymentKey - 결제 키
         * @returns {Promise}
         */
        getPayment: async function(paymentKey) {
            try {
                console.log('🔍 결제 정보 조회:', paymentKey);

                const response = await fetch(`${CONFIG.PAYMENT_URL}/${paymentKey}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${btoa(CONFIG.SECRET_KEY + ':')}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '결제 정보 조회 실패');
                }

                const result = await response.json();
                
                // 🆕 면세 정보가 있으면 로깅
                if (result.taxFreeAmount) {
                    console.log('💰 조회된 면세 정보:', {
                        totalAmount: result.totalAmount,
                        taxFreeAmount: result.taxFreeAmount,
                        suppliedAmount: result.suppliedAmount,
                        vat: result.vat
                    });
                }
                
                console.log('✅ 결제 정보 조회 성공:', result);
                
                return {
                    success: true,
                    data: result
                };

            } catch (error) {
                console.error('❌ 결제 정보 조회 오류:', error);
                return {
                    success: false,
                    error: error.message || '결제 정보 조회 중 오류가 발생했습니다.'
                };
            }
        },

        /**
         * 결제 에러 객체 생성
         */
        createPaymentError: function(error) {
            const paymentError = new Error(error.message || '결제 처리 중 오류가 발생했습니다.');
            paymentError.code = error.code || 'PAYMENT_ERROR';
            paymentError.originalError = error;
            return paymentError;
        },

        /**
         * 주문 ID 생성
         * @param {string} prefix - 접두사
         * @returns {string}
         */
        generateOrderId: function(prefix = 'DHC') {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            return `${prefix}_${timestamp}_${random}`;
        },

        /**
         * 결제 금액 포맷팅
         * @param {number} amount - 금액
         * @returns {string}
         */
        formatAmount: function(amount) {
            return new Intl.NumberFormat('ko-KR').format(amount) + '원';
        },

        /**
         * 테스트 카드 정보 제공
         */
        getTestCards: function() {
            return {
                success: {
                    number: '4242424242424242',
                    expiry: '12/30',
                    cvc: '123',
                    name: '홍길동'
                },
                failure: {
                    number: '4000000000000002',
                    expiry: '12/30', 
                    cvc: '123',
                    name: '테스트실패'
                },
                info: {
                    description: '토스페이먼츠 테스트 카드',
                    notice: '실제 결제는 발생하지 않습니다'
                }
            };
        },

        /**
         * 환경 정보 반환 (면세 설정 포함)
         */
        getEnvironmentInfo: function() {
            return {
                isProduction: IS_PRODUCTION,
                environment: IS_PRODUCTION ? '운영' : '테스트',
                clientKey: CONFIG.CLIENT_KEY,
                baseUrl: CONFIG.BASE_URL || window.location.origin,
                isInitialized: this.isInitialized,
                sdkLoaded: typeof TossPayments !== 'undefined',
                version: '1.1.0',
                // 🆕 면세 설정 정보 추가
                taxFreeConfig: {
                    businessType: TAX_FREE_CONFIG.BUSINESS_TYPE,
                    supportedCategories: TAX_FREE_CONFIG.TAX_FREE_CATEGORIES,
                    taxSettings: TAX_FREE_CONFIG.DEFAULT_TAX_SETTINGS
                }
            };
        },

        /**
         * 🆕 면세 설정 업데이트 (NEW)
         * @param {Object} newConfig - 새로운 면세 설정
         */
        updateTaxFreeConfig: function(newConfig) {
            console.log('💰 면세 설정 업데이트:', newConfig);
            
            if (newConfig.businessType) {
                TAX_FREE_CONFIG.BUSINESS_TYPE = newConfig.businessType;
            }
            
            if (newConfig.taxSettings) {
                Object.assign(TAX_FREE_CONFIG.DEFAULT_TAX_SETTINGS, newConfig.taxSettings);
            }
            
            console.log('✅ 면세 설정 업데이트 완료:', TAX_FREE_CONFIG);
        },

        /**
         * 🆕 면세 금액 검증 (NEW)
         * @param {Object} paymentItems - 결제 항목들
         * @returns {boolean} 검증 결과
         */
        validateTaxFreeAmount: function(paymentItems) {
            try {
                const calculation = this.calculateTaxFreeAmount(paymentItems);
                
                // 기본 검증
                if (calculation.totalAmount <= 0) {
                    console.error('❌ 총 결제 금액이 0원 이하입니다.');
                    return false;
                }
                
                if (calculation.taxFreeAmount < 0) {
                    console.error('❌ 면세 금액이 음수입니다.');
                    return false;
                }
                
                if (calculation.taxFreeAmount > calculation.totalAmount) {
                    console.error('❌ 면세 금액이 총 금액보다 큽니다.');
                    return false;
                }
                
                console.log('✅ 면세 금액 검증 통과');
                return true;
                
            } catch (error) {
                console.error('❌ 면세 금액 검증 오류:', error);
                return false;
            }
        }
    };

    // =================================
    // 결제 상태 관리
    // =================================
    
    window.paymentService.status = {
        PENDING: 'PENDING',                         // 결제 대기
        IN_PROGRESS: 'IN_PROGRESS',                 // 결제 진행 중
        WAITING_FOR_DEPOSIT: 'WAITING_FOR_DEPOSIT', // 입금 대기 (가상계좌)
        DONE: 'DONE',                               // 결제 완료
        CANCELED: 'CANCELED',                       // 결제 취소
        PARTIAL_CANCELED: 'PARTIAL_CANCELED',       // 부분 취소
        ABORTED: 'ABORTED',                         // 결제 중단
        EXPIRED: 'EXPIRED'                          // 결제 만료
    };

    // 결제 방법 정의
    window.paymentService.methods = {
        CARD: '카드',
        TRANSFER: '계좌이체',
        VIRTUAL_ACCOUNT: '가상계좌',
        MOBILE: '휴대폰',
        GIFT_CERTIFICATE: '상품권'
    };

    // 🆕 면세 관련 유틸리티 추가
    window.paymentService.taxFreeUtils = {
        /**
         * 면세 여부 확인
         */
        isTaxFreeItem: function(itemType) {
            const settings = TAX_FREE_CONFIG.DEFAULT_TAX_SETTINGS[itemType];
            return settings ? settings.isTaxFree : false;
        },
        
        /**
         * 부가세율 조회
         */
        getTaxRate: function(itemType) {
            const settings = TAX_FREE_CONFIG.DEFAULT_TAX_SETTINGS[itemType];
            return settings ? settings.taxRate : 0.1;
        },
        
        /**
         * 공급가액 계산 (부가세 포함 가격 → 공급가액)
         */
        calculateSuppliedAmount: function(totalAmount, taxRate = 0.1) {
            return Math.floor(totalAmount / (1 + taxRate));
        },
        
        /**
         * 부가세 계산
         */
        calculateVAT: function(totalAmount, taxRate = 0.1) {
            const suppliedAmount = this.calculateSuppliedAmount(totalAmount, taxRate);
            return totalAmount - suppliedAmount;
        }
    };

    // =================================
    // 자동 초기화 (SDK 로드 후)
    // =================================
    
    // SDK 로드 확인 및 자동 초기화
    function checkAndInit() {
        if (typeof TossPayments !== 'undefined') {
            window.paymentService.init().catch(error => {
                console.error('자동 초기화 실패:', error);
            });
        } else {
            console.warn('⚠️ TossPayments SDK가 아직 로드되지 않았습니다.');
            console.log('💡 HTML에 다음 스크립트를 추가하세요:');
            console.log('<script src="https://js.tosspayments.com/v1/payment-widget"></script>');
        }
    }

    // DOM 로드 후 초기화 시도
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndInit);
    } else {
        setTimeout(checkAndInit, 100); // 약간의 지연 후 초기화
    }

    // =================================
    // 🆕 면세 디버깅 도구 (NEW)
    // =================================

    // 개발 모드에서만 디버깅 도구 제공
    if (!IS_PRODUCTION) {
        window.debugTaxFree = {
            /**
             * 면세 설정 정보 조회
             */
            getConfig: () => TAX_FREE_CONFIG,
            
            /**
             * 면세 금액 계산 테스트
             */
            testCalculation: function(testItems) {
                console.log('🧪 면세 금액 계산 테스트');
                const defaultItems = testItems || {
                    education: 150000,   // 교육비 (면세)
                    certificate: 50000,  // 자격증 발급비 (과세)
                    material: 30000      // 교재비 (면세)
                };
                
                const result = window.paymentService.calculateTaxFreeAmount(defaultItems);
                console.table(result.itemBreakdown);
                console.log('💰 계산 결과:', result);
                return result;
            },
            
            /**
             * 면세 설정 변경 테스트
             */
            changeTaxSettings: function(itemType, isTaxFree) {
                console.log(`🔧 ${itemType} 면세 설정 변경: ${isTaxFree}`);
                TAX_FREE_CONFIG.DEFAULT_TAX_SETTINGS[itemType] = {
                    isTaxFree: isTaxFree,
                    taxRate: isTaxFree ? 0 : 0.1
                };
                console.log('✅ 설정 변경 완료');
                return TAX_FREE_CONFIG.DEFAULT_TAX_SETTINGS;
            },
            
            /**
             * 토스페이먼츠 결제 데이터 생성 테스트
             */
            createTestPaymentData: function() {
                const testItems = {
                    education: 150000,
                    certificate: 50000,
                    material: 30000
                };
                
                const calculation = window.paymentService.calculateTaxFreeAmount(testItems);
                
                const paymentData = {
                    amount: calculation.totalAmount,
                    orderId: window.paymentService.generateOrderId('TEST_TAX'),
                    orderName: '면세 테스트 결제',
                    customerName: '홍길동',
                    customerEmail: 'test@example.com',
                    customerMobilePhone: '01012345678',
                    paymentItems: testItems
                };
                
                const tossData = window.paymentService.buildTossPaymentDataWithTaxFree(paymentData);
                
                console.log('🧪 생성된 토스페이먼츠 결제 데이터:');
                console.log('📋 기본 정보:', {
                    amount: tossData.amount,
                    orderId: tossData.orderId,
                    orderName: tossData.orderName,
                    taxFreeAmount: tossData.taxFreeAmount
                });
                
                if (tossData.metadata && tossData.metadata.taxCalculation) {
                    console.log('💰 세금 계산 상세:');
                    console.table(tossData.metadata.taxCalculation.itemBreakdown);
                }
                
                return tossData;
            },
            
            /**
             * 면세 검증 테스트
             */
            testValidation: function() {
                console.log('🔍 면세 검증 테스트 시작');
                
                const testCases = [
                    { name: '정상 케이스', items: { education: 100000, material: 50000 } },
                    { name: '면세만', items: { education: 100000, material: 50000 } },
                    { name: '과세만', items: { certificate: 50000 } },
                    { name: '혼합', items: { education: 100000, certificate: 50000, material: 30000 } },
                    { name: '0원', items: { education: 0 } },
                    { name: '음수 (오류)', items: { education: -1000 } }
                ];
                
                testCases.forEach(testCase => {
                    console.log(`\n📝 테스트: ${testCase.name}`);
                    try {
                        const isValid = window.paymentService.validateTaxFreeAmount(testCase.items);
                        console.log(`결과: ${isValid ? '✅ 통과' : '❌ 실패'}`);
                        
                        if (isValid) {
                            const calculation = window.paymentService.calculateTaxFreeAmount(testCase.items);
                            console.log(`총액: ${calculation.totalAmount}원, 면세: ${calculation.taxFreeAmount}원`);
                        }
                    } catch (error) {
                        console.log('❌ 오류:', error.message);
                    }
                });
            },
            
            /**
             * 도움말
             */
            help: function() {
                console.log('🎯 면세 디버깅 도구 사용법');
                console.log('');
                console.log('📊 설정 확인:');
                console.log('  - getConfig(): 현재 면세 설정 조회');
                console.log('');
                console.log('🧪 테스트:');
                console.log('  - testCalculation(): 면세 금액 계산 테스트');
                console.log('  - createTestPaymentData(): 결제 데이터 생성 테스트');
                console.log('  - testValidation(): 면세 검증 테스트');
                console.log('');
                console.log('🔧 설정 변경:');
                console.log('  - changeTaxSettings(항목, 면세여부): 특정 항목 면세 설정 변경');
                console.log('    예: changeTaxSettings("certificate", true)');
                console.log('');
                console.log('💡 사용 예시:');
                console.log('  window.debugTaxFree.testCalculation()');
                console.log('  window.debugTaxFree.createTestPaymentData()');
                console.log('');
                console.log('⚠️ 주의사항:');
                console.log('  - 이 도구는 개발/테스트 환경에서만 사용하세요');
                console.log('  - changeTaxSettings()로 변경한 설정은 페이지 새로고침 시 초기화됩니다');
            }
        };
        
        console.log('🎯 면세 디버깅 도구 활성화됨');
        console.log('💡 도움말: window.debugTaxFree.help()');
        console.log('🧪 빠른 테스트: window.debugTaxFree.testCalculation()');
    }

    // =================================
    // 유틸리티 함수들 (기존 + 면세 관련)
    // =================================

    /**
     * 결제 데이터 검증 헬퍼 (면세 포함)
     */
    window.paymentService.validators = {
        /**
         * 이메일 검증
         */
        validateEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        /**
         * 전화번호 검증
         */
        validatePhone: function(phone) {
            const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
            return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
        },

        /**
         * 금액 검증
         */
        validateAmount: function(amount) {
            return typeof amount === 'number' && amount >= 100 && amount <= 100000000;
        },

        /**
         * 주문 ID 검증
         */
        validateOrderId: function(orderId) {
            return typeof orderId === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(orderId);
        },
        
        /**
         * 🆕 면세 금액 검증
         */
        validateTaxFreeAmount: function(totalAmount, taxFreeAmount) {
            if (typeof taxFreeAmount !== 'number' || taxFreeAmount < 0) {
                return false;
            }
            return taxFreeAmount <= totalAmount;
        }
    };

    /**
     * 결제 데이터 포맷터 (면세 포함)
     */
    window.paymentService.formatters = {
        /**
         * 전화번호 포맷팅
         */
        formatPhone: function(phone) {
            const numbers = phone.replace(/[^0-9]/g, '');
            if (numbers.length === 11 && numbers.startsWith('010')) {
                return `${numbers.substr(0, 3)}-${numbers.substr(3, 4)}-${numbers.substr(7, 4)}`;
            }
            return phone;
        },

        /**
         * 금액 포맷팅 (콤마 추가)
         */
        formatCurrency: function(amount) {
            return new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW'
            }).format(amount);
        },

        /**
         * 주문명 생성
         */
        generateOrderName: function(items) {
            if (!Array.isArray(items) || items.length === 0) {
                return '주문';
            }
            
            if (items.length === 1) {
                return items[0];
            }
            
            return `${items[0]} 외 ${items.length - 1}건`;
        },
        
        /**
         * 🆕 면세 영수증 정보 포맷팅
         */
        formatTaxInfo: function(taxCalculation) {
            return {
                총결제금액: this.formatCurrency(taxCalculation.totalAmount),
                면세금액: this.formatCurrency(taxCalculation.taxFreeAmount),
                공급가액: this.formatCurrency(taxCalculation.suppliedAmount),
                부가세: this.formatCurrency(taxCalculation.vat),
                사업자구분: taxCalculation.businessType
            };
        }
    };

    // =================================
    // 이벤트 리스너 및 생명주기 관리
    // =================================

    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', function() {
        console.log('🧹 결제 서비스 정리');
        // 필요한 경우 진행 중인 결제 요청 취소 등의 정리 작업
    });

    // 네트워크 상태 변화 감지
    window.addEventListener('online', function() {
        console.log('🌐 네트워크 연결됨');
    });

    window.addEventListener('offline', function() {
        console.log('📡 네트워크 연결 끊김');
    });

})();

console.log('✅ payment-service.js 면세 파라미터 추가 버전 로딩 완료');
console.log('💰 면세사업자 지원 기능 활성화됨');
console.log('🔧 사업자 유형:', window.paymentService?.taxFreeUtils ? 'TAX_FREE' : '설정 필요');