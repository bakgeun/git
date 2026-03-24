/**
 * cert-management-enhanced.js Part 1
 * 초기화 및 변수 설정, 동적 갱신 비용 시스템
 */

(function () {
    'use strict';

    // =================================
    // 전역 변수 선언 및 초기화
    // =================================

    let certificates = [];
    let applications = [];
    let selectedCertForRenewal = null;
    let currentModalStep = 1;
    let renewalProgress = 0;

    // 🔧 자격증 갱신 비용 정보 (동적 로드 가능)
    let renewalFees = {
        'health-exercise': {
            renewal: 50000,
            deliveryFee: 5000,
            education: { online: 80000, offline: 100000, completed: 0 },
            earlyDiscountRate: 0.1,
            onlineDiscountRate: 0.2
        },
        'rehabilitation': {
            renewal: 50000,
            deliveryFee: 5000,
            education: { online: 96000, offline: 120000, completed: 0 },
            earlyDiscountRate: 0.1,
            onlineDiscountRate: 0.2
        },
        'pilates': {
            renewal: 40000,
            deliveryFee: 5000,
            education: { online: 64000, offline: 80000, completed: 0 },
            earlyDiscountRate: 0.1,
            onlineDiscountRate: 0.2
        },
        'recreation': {
            renewal: 30000,
            deliveryFee: 5000,
            education: { online: 56000, offline: 70000, completed: 0 },
            earlyDiscountRate: 0.1,
            onlineDiscountRate: 0.2
        }
    };

    // 🆕 전역 변수로 노출 (디버깅 및 외부 접근용)
    window.renewalFees = renewalFees;
    window.selectedCertForRenewal = selectedCertForRenewal;
    window.certificates = certificates;
    window.applications = applications;

    // =================================
    // Firebase 연결 상태 확인 함수
    // =================================

    function checkFirebaseConnection() {
        try {
            return {
                connected: !!(window.dhcFirebase && window.dhcFirebase.db && window.dhcFirebase.auth),
                auth: !!(window.dhcFirebase && window.dhcFirebase.auth),
                db: !!(window.dhcFirebase && window.dhcFirebase.db),
                user: window.dhcFirebase?.auth?.currentUser || null
            };
        } catch (error) {
            console.error('Firebase 연결 상태 확인 오류:', error);
            return {
                connected: false,
                auth: false,
                db: false,
                user: null
            };
        }
    }

    // =================================
    // 동적 갱신 비용 로드 함수
    // =================================

    /**
     * 동적 갱신 비용 로드
     */
    async function loadDynamicRenewalFees() {
        console.log('📥 동적 갱신 비용 로드 시작');

        try {
            const firebaseStatus = checkFirebaseConnection();

            if (firebaseStatus.connected && window.dhcFirebase) {
                const result = await window.dbService.getRenewalFeeSettings();

                if (result.success && result.data) {
                    Object.keys(renewalFees).forEach(key => delete renewalFees[key]);
                    Object.assign(renewalFees, result.data);
                    window.renewalFees = renewalFees;

                    console.log('✅ 동적 갱신 비용 로드 성공:', renewalFees);
                    showNotification('최신 갱신 비용이 적용되었습니다.', 'success');
                    return true;
                } else {
                    console.log('📝 설정된 갱신 비용 없음, 기본값 사용');
                    showNotification('기본 갱신 비용을 사용합니다.', 'info');
                    return false;
                }
            } else {
                console.log('🔧 Firebase 미연결, 기본값 사용');
                showNotification('기본 갱신 비용을 사용합니다. (오프라인 모드)', 'info');
                return false;
            }
        } catch (error) {
            console.error('❌ 동적 갱신 비용 로드 오류:', error);
            showNotification('갱신 비용 로드 중 오류가 발생했습니다. 기본값을 사용합니다.', 'error');
            return false;
        }
    }

    // =================================
    // 페이지 초기화 함수
    // =================================

    /**
     * 페이지 초기화 (Firebase 인증 대기 포함)
     */
    async function initializePage() {
        console.log('=== 🚀 자격증 관리 페이지 초기화 시작 ===');

        try {
            // 🆕 1. Firebase 인증 준비 대기
            console.log('⏳ Firebase 인증 서비스 준비 대기 중...');

            if (!window.authService) {
                console.error('❌ authService를 찾을 수 없습니다.');
                showNotification('인증 서비스를 초기화하는 중입니다. 잠시 후 다시 시도해주세요.', 'error');
                setTimeout(initializePage, 500); // 0.5초 후 재시도
                return;
            }

            // 🆕 2. Firebase onAuthStateChanged 리스너로 사용자 대기
            const waitForAuth = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('인증 타임아웃'));
                }, 5000); // 5초 타임아웃

                window.dhcFirebase.onAuthStateChanged((user) => {
                    clearTimeout(timeout);
                    resolve(user);
                });
            });

            console.log('⏳ 사용자 인증 상태 확인 중...');
            const user = await waitForAuth;

            if (!user) {
                console.log('❌ 로그인되지 않은 사용자, 로그인 페이지로 이동');
                setTimeout(() => {
                    window.location.href = window.adjustPath('pages/auth/login.html');
                }, 1000);
                return;
            }

            console.log('✅ 사용자 인증 확인:', user.email);

            // 🆕 3. 로딩 상태 표시
            showLoadingState(true);

            // 🆕 4. 데이터 로드
            console.log('📊 데이터 로드 시작...');
            await Promise.all([
                loadCertificates(),
                loadApplications() // 🔧 수정된 통합 조회 버전 사용
            ]);

            console.log('✅ 데이터 로드 완료');
            console.log('  - certificates:', certificates.length + '개');
            console.log('  - applications:', applications.length + '개');

            // 🆕 5. URL 파라미터 처리
            const urlParams = new URLSearchParams(window.location.search);
            const from = urlParams.get('from');
            const applicationId = urlParams.get('applicationId');

            if (from === 'cert-application' && applicationId) {
                console.log('✅ 자격증 신청 완료 후 리다이렉트됨:', applicationId);
                showNotification('자격증 발급 신청이 완료되었습니다!', 'success');

                // 🔧 추가 동기화 (1초 후)
                setTimeout(async () => {
                    console.log('🔄 추가 데이터 동기화...');
                    await loadApplications();
                    updateDashboard();
                    renderProgressList();
                    console.log('✅ 추가 동기화 완료');
                }, 1000);
            }

            // 🆕 6. UI 업데이트
            console.log('🎨 UI 업데이트 시작...');
            updateDashboard();
            renderOwnedCertificates();
            renderProgressList();
            checkRenewalNeeded();
            initializeRenewalProcess();

            // 🆕 7. 이벤트 리스너 설정
            setupEventListeners();

            console.log('=== ✅ 자격증 관리 페이지 초기화 완료 ===');

        } catch (error) {
            console.error('❌ 페이지 초기화 오류:', error);

            if (error.message === '인증 타임아웃') {
                showNotification('인증 확인 중 시간이 초과되었습니다. 페이지를 새로고침해주세요.', 'error');
            } else {
                showNotification('페이지 초기화 중 오류가 발생했습니다.', 'error');
            }
        } finally {
            showLoadingState(false);
        }
    }

    // =================================
    // 자격증 및 신청 내역 로드
    // =================================

    /**
     * 자격증 목록 로드
     */
    async function loadCertificates() {
        try {
            const user = window.authService.getCurrentUser();

            if (!user) {
                console.warn('사용자가 로그인되지 않았습니다.');
                certificates = [];
                return;
            }

            console.log('자격증 로드 시작:', user.uid);

            const result = await window.dbService.getDocuments('certificates', {
                where: {
                    field: 'userId',
                    operator: '==',
                    value: user.uid
                },
                orderBy: {
                    field: 'issuedAt',
                    direction: 'desc'
                }
            });

            if (result.success) {
                certificates = result.data;
                window.certificates = certificates;
                console.log('자격증 로드 성공:', certificates.length + '개');
            } else {
                console.error('자격증 조회 실패:', result.error);
                certificates = [];

                if (!result.error.includes('permission') && !result.error.includes('Missing')) {
                    showNotification('자격증 정보를 불러오는 중 오류가 발생했습니다.', 'error');
                }
            }

        } catch (error) {
            console.error('자격증 로드 오류:', error);
            certificates = [];

            if (error.message && (error.message.includes('auth') || error.message.includes('permission'))) {
                setTimeout(() => {
                    window.location.href = window.adjustPath('pages/auth/login.html');
                }, 2000);
            }
        }
    }

    /**
     * 신청 내역 로드 (certificates + applications 통합)
     * 🆕 두 컬렉션 통합 조회로 수정
     */
    async function loadApplications() {
        try {
            const user = window.authService.getCurrentUser();

            if (!user) {
                console.warn('⚠️ 사용자가 로그인되지 않았습니다.');
                applications = [];
                window.applications = applications;
                return;
            }

            console.log('📋 신청 내역 로드 시작 (통합 조회):', user.uid);

            // 1. applications 컬렉션 조회
            let applicationsData = [];
            try {
                const appResult = await window.dbService.getDocuments('applications', {
                    where: { field: 'userId', operator: '==', value: user.uid },
                    limit: 50
                });

                if (appResult.success && appResult.data) {
                    applicationsData = appResult.data;
                    console.log('  ✅ applications 컬렉션:', applicationsData.length + '개');
                } else {
                    console.log('  ⚠️ applications 컬렉션 조회 결과 없음');
                }
            } catch (appError) {
                console.warn('  ⚠️ applications 컬렉션 조회 오류:', appError.message);
            }

            // 2. certificates 컬렉션에서 신청 상태 데이터 조회
            let certificatesApplicationData = [];
            try {
                const certResult = await window.dbService.getDocuments('certificates', {
                    where: { field: 'userId', operator: '==', value: user.uid },
                    limit: 50
                });

                if (certResult.success && certResult.data) {
                    // 신청 진행 중인 상태만 필터링
                    certificatesApplicationData = certResult.data.filter(cert => {
                        const status = cert.status || cert.applicationStatus || '';
                        const isApplicationStatus = [
                            'pending',
                            'submitted',
                            'pending_review',
                            'document_submitted',
                            'under_review',
                            'payment_pending',
                            'processing'
                        ].includes(status.toLowerCase());

                        // 발급되지 않은 것만 (신청 중인 것)
                        const notIssued = !cert.isIssued && !cert.certificateNumber;

                        return isApplicationStatus || notIssued;
                    });
                    console.log('  ✅ certificates 컬렉션 (신청중):', certificatesApplicationData.length + '개');
                }
            } catch (certError) {
                console.warn('  ⚠️ certificates 컬렉션 조회 오류:', certError.message);
            }

            // 3. 두 컬렉션 데이터 병합 (중복 제거)
            const mergedData = [...applicationsData];

            certificatesApplicationData.forEach(certApp => {
                const isDuplicate = applicationsData.some(app =>
                    (app.id && app.id === certApp.id) ||
                    (app.applicationId && app.applicationId === certApp.applicationId) ||
                    (certApp.applicationDocId && app.id === certApp.applicationDocId)
                );

                if (!isDuplicate) {
                    mergedData.push(certApp);
                }
            });

            // 4. 날짜순 정렬 (최신순)
            const sortedApplications = mergedData.sort((a, b) => {
                const getTimestamp = (item) => {
                    if (item.createdAt) {
                        return item.createdAt.seconds ? item.createdAt.seconds * 1000 : new Date(item.createdAt).getTime();
                    }
                    if (item.timestamp) {
                        return item.timestamp.seconds ? item.timestamp.seconds * 1000 : new Date(item.timestamp).getTime();
                    }
                    return 0;
                };

                return getTimestamp(b) - getTimestamp(a);
            });

            applications = sortedApplications;
            window.applications = applications;

            console.log('✅ 통합 신청 내역 로드 완료:', applications.length + '개');
            console.log('  📊 상세:');
            console.log('    - applications 컬렉션:', applicationsData.length + '개');
            console.log('    - certificates 컬렉션 (신청중):', certificatesApplicationData.length + '개');
            console.log('    - 병합 후 총:', applications.length + '개');

            // 디버깅용 데이터 출력
            if (applications.length > 0) {
                console.log('  📋 최신 신청:', {
                    id: applications[0].id || applications[0].applicationId,
                    name: applications[0].certificateName || applications[0].certName,
                    status: applications[0].status || applications[0].applicationStatus,
                    date: new Date(applications[0].createdAt || applications[0].timestamp).toLocaleString('ko-KR')
                });
            }

        } catch (error) {
            console.error('❌ 신청 내역 로드 오류:', error);
            applications = [];
            window.applications = applications;
        }
    }

    // =================================
    // Part 2: 갱신 모달 관련 함수들
    // =================================

    /**
     * 갱신 모달 열기
     */
    window.openRenewalModal = async function (certId) {
        console.log('🔄 갱신 모달 열기 시작:', certId);

        try {
            // 1. 동적 비용 로드
            console.log('💰 최신 갱신 비용 로드 중...');
            const feeLoaded = await loadDynamicRenewalFees();

            // 2. 자격증 정보 확인
            let cert = certificates.find(c => c.id === certId);

            if (!cert) {
                console.log('🧪 테스트용 자격증 데이터 생성');
                cert = {
                    id: certId,
                    certType: 'health-exercise',
                    certName: '건강운동처방사 (테스트)',
                    certNumber: 'TEST-2024-001',
                    issuedAt: { seconds: new Date('2022-01-01').getTime() / 1000 },
                    expiryDate: { seconds: new Date('2025-01-01').getTime() / 1000 }
                };
            }

            selectedCertForRenewal = cert;
            window.selectedCertForRenewal = cert;
            currentModalStep = 1;

            // 3. 모달 표시
            const modal = document.getElementById('renewal-modal');
            if (!modal) {
                console.error('❌ 갱신 모달 요소를 찾을 수 없습니다!');
                showNotification('갱신 모달을 찾을 수 없습니다.', 'error');
                return;
            }

            // 강력한 모달 표시
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.zIndex = '9999';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';

            document.body.style.overflow = 'hidden';

            // 4. 모달에 자격증 정보 설정
            const elements = {
                'selected-cert-name': cert.certName,
                'selected-cert-details': `발급일: ${new Date(cert.issuedAt.seconds * 1000).toLocaleDateString('ko-KR')}`,
                'selected-cert-number': cert.certNumber,
                'selected-cert-expiry': `만료일: ${new Date(cert.expiryDate.seconds * 1000).toLocaleDateString('ko-KR')}`,
                'renewal-cert-id': cert.id
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    if (element.tagName === 'INPUT') {
                        element.value = value;
                    } else {
                        element.textContent = value;
                    }
                }
            });

            // 5. 초기화
            updateModalSteps(1);
            updateModalStepInfo(1, 4);
            setDefaultFormValues();

            // 6. 주소찾기 기능 설정 (중요!)
            setupAddressSearchFeature();

            // 7. 동적 비용으로 금액 업데이트
            setTimeout(() => {
                updateRenewalTotalAmountWithDynamicFees();
            }, 200);

            // 8. 갱신 진행률 업데이트
            const statusMessage = feeLoaded ?
                '갱신 신청 모달이 열렸습니다. (최신 비용 적용)' :
                '갱신 신청 모달이 열렸습니다. (기본 비용 적용)';

            updateRenewalProgress(25, statusMessage);

            console.log('✅ 갱신 모달 열기 완료');

        } catch (error) {
            console.error('❌ 갱신 모달 열기 오류:', error);
            showNotification('갱신 모달을 여는 중 오류가 발생했습니다.', 'error');
        }
    };

    /**
     * 갱신 모달 닫기
     */
    window.closeRenewalModal = function () {
        console.log('🔒 갱신 모달 닫기');

        const modal = document.getElementById('renewal-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            document.body.style.overflow = '';
        }

        selectedCertForRenewal = null;
        window.selectedCertForRenewal = null;
        currentModalStep = 1;

        const form = document.getElementById('renewal-form');
        if (form) {
            form.reset();
        }

        resetFileUploadArea('renewal-education-completion');
        resetFileUploadArea('renewal-cpe-documents');
        checkRenewalNeeded();
    };

    // =================================
    // 주소찾기 기능 (완전히 정리된 버전)
    // =================================

    /**
     * 전역 주소찾기 함수
     */
    window.findRenewalAddress = function () {
        console.log('🏠 주소찾기 시작');

        // 배송 방법 확인
        const deliveryMethod = document.getElementById('renewal-delivery-method');
        if (deliveryMethod && deliveryMethod.value === 'digital') {
            showNotification('디지털 수령 시에는 주소 입력이 필요하지 않습니다.', 'info');
            return;
        }

        // Daum Postcode API 확인 및 실행
        if (typeof daum !== 'undefined' && daum.Postcode) {
            executePostcodeSearch();
        } else {
            loadPostcodeAPI();
        }
    };

    /**
     * 다음 우편번호 API 로드
     */
    function loadPostcodeAPI() {
        console.log('📥 Daum Postcode API 로드 중...');
        showNotification('주소 검색 서비스를 로드하는 중입니다...', 'info');

        const script = document.createElement('script');
        script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.onload = function () {
            console.log('✅ Daum Postcode API 로드 완료');
            executePostcodeSearch();
        };
        script.onerror = function () {
            console.error('❌ Daum Postcode API 로드 실패');
            showNotification('주소 검색 서비스 로드에 실패했습니다.', 'error');
        };
        document.head.appendChild(script);
    }

    /**
     * 우편번호 검색 실행
     */
    function executePostcodeSearch() {
        console.log('🔍 우편번호 검색 팝업 열기');

        try {
            // z-index 스타일 적용
            ensurePostcodeStyles();

            new daum.Postcode({
                oncomplete: function (data) {
                    console.log('📍 주소 선택됨:', data);

                    const zipcode = document.getElementById('renewal-zipcode');
                    const address1 = document.getElementById('renewal-address1');
                    const address2 = document.getElementById('renewal-address2');

                    if (zipcode) {
                        zipcode.value = data.zonecode;
                        console.log('✅ 우편번호 입력:', data.zonecode);
                    }

                    if (address1) {
                        address1.value = data.address;
                        console.log('✅ 기본주소 입력:', data.address);
                    }

                    if (address2) {
                        address2.focus();
                        console.log('✅ 상세주소 필드로 포커스 이동');
                    }

                    showNotification('주소가 입력되었습니다.', 'success');
                    updateRenewalProgress(60, '배송 정보가 입력되었습니다.');
                },
                onclose: function (state) {
                    console.log('주소찾기 팝업 닫힘:', state);
                    if (state === 'COMPLETE_CLOSE') {
                        const address2 = document.getElementById('renewal-address2');
                        if (address2) address2.focus();
                    }
                }
            }).open();

        } catch (error) {
            console.error('❌ 우편번호 검색 실행 오류:', error);
            showNotification('주소 검색 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * Postcode 팝업 z-index 스타일 보장
     */
    function ensurePostcodeStyles() {
        if (!document.getElementById('postcode-zindex-fix')) {
            const style = document.createElement('style');
            style.id = 'postcode-zindex-fix';
            style.textContent = `
                #daum-postcode-container, 
                .daum-postcode,
                #layer_daum_postcode {
                    z-index: 99999 !important;
                    position: fixed !important;
                }
                .renewal-modal {
                    z-index: 9999 !important;
                }
            `;
            document.head.appendChild(style);
            console.log('✅ Postcode z-index 스타일 적용 완료');
        }
    }

    /**
     * 주소찾기 기능 설정
     */
    function setupAddressSearchFeature() {
        console.log('🏠 주소찾기 기능 설정');

        ensurePostcodeStyles();

        setTimeout(() => {
            const findAddressBtn = document.getElementById('renewal-find-address');
            if (findAddressBtn) {
                // 기존 이벤트 제거
                findAddressBtn.onclick = null;
                findAddressBtn.removeAttribute('onclick');

                // 새 이벤트 추가
                findAddressBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔍 주소찾기 버튼 클릭됨');
                    window.findRenewalAddress();
                });

                console.log('✅ 주소찾기 버튼 설정 완료');
            } else {
                console.warn('⚠️ 주소찾기 버튼을 찾을 수 없습니다.');
            }
        }, 100);
    }

    // HTML onclick을 위한 전역 함수
    window.handleAddressSearch = function () {
        console.log('🏠 HTML onclick 주소찾기 호출');
        window.findRenewalAddress();
    };

    // =================================
    // Part 3: 갱신 비용 계산 및 UI 업데이트
    // =================================

    /**
     * 갱신 총 금액 업데이트 (동적 비용 사용)
     */
    function updateRenewalTotalAmountWithDynamicFees() {
        console.log('💰 갱신 비용 계산 시작');

        if (!selectedCertForRenewal) {
            console.warn('선택된 자격증이 없습니다.');
            return;
        }

        const fees = renewalFees[selectedCertForRenewal.certType];
        if (!fees) {
            console.error('자격증 유형에 해당하는 비용 정보를 찾을 수 없습니다:', selectedCertForRenewal.certType);
            showNotification('자격증 유형의 비용 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        const educationTypeSelect = document.getElementById('renewal-education-type');
        const deliveryMethodSelect = document.getElementById('renewal-delivery-method');

        if (!educationTypeSelect || !deliveryMethodSelect) {
            console.warn('필수 선택 요소를 찾을 수 없습니다.');
            return;
        }

        const educationType = educationTypeSelect.value;
        const deliveryMethod = deliveryMethodSelect.value;

        // 기본 비용 계산
        const renewalFee = fees.renewal || 0;
        let educationFee = 0;

        if (educationType && fees.education && fees.education[educationType] !== undefined) {
            educationFee = fees.education[educationType];
        }

        const deliveryFee = deliveryMethod === 'both' ? (fees.deliveryFee || 0) : 0;

        // 할인 계산
        let discountAmount = 0;
        let discountReasons = [];

        // 조기 갱신 할인 (만료 60일 전)
        const today = new Date();
        const expiryDate = new Date(selectedCertForRenewal.expiryDate.seconds * 1000);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry >= 60) {
            const earlyDiscount = Math.round(renewalFee * (fees.earlyDiscountRate || 0));
            discountAmount += earlyDiscount;
            discountReasons.push(`조기 갱신 할인 (${((fees.earlyDiscountRate || 0) * 100)}%)`);
        }

        // 온라인 교육 할인
        if (educationType === 'online') {
            const onlineDiscount = Math.round(educationFee * (fees.onlineDiscountRate || 0));
            discountAmount += onlineDiscount;
            discountReasons.push(`온라인 교육 할인 (${((fees.onlineDiscountRate || 0) * 100)}%)`);
        }

        // 총 금액 계산
        const subtotal = renewalFee + educationFee + deliveryFee;
        const totalAmount = Math.max(0, subtotal - discountAmount);

        // UI 업데이트
        const elements = {
            '.renewal-fee': renewalFee.toLocaleString() + '원',
            '.education-fee': educationFee.toLocaleString() + '원',
            '.delivery-fee': deliveryFee.toLocaleString() + '원',
            '.discount-amount': '-' + discountAmount.toLocaleString() + '원',
            '.total-amount': totalAmount.toLocaleString() + '원'
        };

        Object.entries(elements).forEach(([selector, value]) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
            }
        });

        // 할인 정보 표시
        updateDiscountInfo(discountReasons, discountAmount);

        // 배송비 행 표시/숨김
        const deliveryFeeRow = document.getElementById('renewal-delivery-fee-row');
        if (deliveryFeeRow) {
            if (deliveryMethod === 'both' && deliveryFee > 0) {
                deliveryFeeRow.style.display = 'flex';
            } else {
                deliveryFeeRow.style.display = 'none';
            }
        }

        console.log('✅ 갱신 비용 업데이트 완료:', {
            renewalFee,
            educationFee,
            deliveryFee,
            discountAmount,
            totalAmount,
            discountReasons
        });
    }

    // 전역으로 노출
    window.updateRenewalTotalAmount = updateRenewalTotalAmountWithDynamicFees;
    window.updateRenewalTotalAmountWithDynamicFees = updateRenewalTotalAmountWithDynamicFees;

    // =================================
    // 갱신 프로세스 관련 함수들
    // =================================

    /**
     * 갱신 프로세스 초기화
     */
    function initializeRenewalProcess() {
        updateProcessSteps(0);
        updateRenewalProgress(0, '갱신 신청을 시작하려면 자격증을 선택하세요.');
    }

    /**
     * 프로세스 단계 업데이트
     */
    function updateProcessSteps(activeStep) {
        const steps = document.querySelectorAll('.process-step');
        steps.forEach((step, index) => {
            const circle = step.querySelector('.step-circle');
            const label = step.querySelector('.step-label');

            if (!circle || !label) return;

            circle.classList.remove('active', 'completed');
            label.classList.remove('active', 'completed');

            if (index < activeStep) {
                circle.classList.add('completed');
                label.classList.add('completed');
                circle.innerHTML = '✓';
            } else if (index === activeStep) {
                circle.classList.add('active');
                label.classList.add('active');
                circle.textContent = index + 1;
            } else {
                circle.textContent = index + 1;
            }
        });
    }

    // =================================
    // Part 4: UI 렌더링 및 대시보드
    // =================================

    /**
     * 갱신 진행률 업데이트 (Part 3에서 이어짐)
     */
    function updateRenewalProgress(percentage, message) {
        renewalProgress = percentage;

        const progressFill = document.getElementById('renewal-progress-fill');
        const progressText = document.getElementById('renewal-progress-text');
        const statusMessage = document.getElementById('renewal-status-message');
        const statusBadge = document.getElementById('renewal-status-badge');

        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }

        if (progressText) {
            progressText.textContent = percentage + '%';
        }

        if (statusMessage) {
            statusMessage.textContent = message;
        }

        if (statusBadge) {
            if (percentage === 0) {
                statusBadge.textContent = '갱신 대기';
                statusBadge.className = 'status-badge pending';
            } else if (percentage < 100) {
                statusBadge.textContent = '진행 중';
                statusBadge.className = 'status-badge in-progress';
            } else {
                statusBadge.textContent = '완료';
                statusBadge.className = 'status-badge completed';
            }
        }
    }

    /**
     * 모달 단계 업데이트
     */
    function updateModalSteps(activeStep) {
        const modalSteps = document.querySelectorAll('#renewal-modal .process-step');
        modalSteps.forEach((step, index) => {
            const circle = step.querySelector('.step-circle');
            const label = step.querySelector('.step-label');

            if (!circle || !label) return;

            circle.classList.remove('active', 'completed');
            label.classList.remove('active', 'completed');

            if (index < activeStep - 1) {
                circle.classList.add('completed');
                label.classList.add('completed');
                circle.innerHTML = '✓';
            } else if (index === activeStep - 1) {
                circle.classList.add('active');
                label.classList.add('active');
                circle.textContent = index + 1;
            } else {
                circle.textContent = index + 1;
            }
        });
    }

    /**
     * 모달 단계 정보 업데이트
     */
    function updateModalStepInfo(current, total) {
        const stepInfo = document.getElementById('modal-step-info');
        if (stepInfo) {
            stepInfo.textContent = `${current}/${total} 단계 진행 중`;
        }
    }

    /**
     * 대시보드 업데이트
     */
    function updateDashboard() {
        const totalCerts = certificates.length;

        // 🔧 개선: 더 많은 상태 조건 체크
        const pendingApps = applications.filter(app => {
            const status = (app.status || app.applicationStatus || '').toLowerCase();
            return [
                'pending',
                'submitted',
                'under_review',
                'payment_pending',
                'processing',
                'pending_review',
                'document_submitted'
            ].includes(status);
        }).length;

        const today = new Date();
        const expiringCerts = certificates.filter(cert => {
            if (!cert.expiryDate) return false;
            const expiryDate = new Date(cert.expiryDate.seconds * 1000);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
        }).length;

        const validCerts = certificates.filter(cert => {
            if (!cert.expiryDate) return true;
            const expiryDate = new Date(cert.expiryDate.seconds * 1000);
            return expiryDate > today;
        }).length;

        // UI 업데이트
        const totalCertsEl = document.getElementById('total-certs');
        const pendingAppsEl = document.getElementById('pending-applications');
        const expiringCertsEl = document.getElementById('expiring-certs');
        const validCertsEl = document.getElementById('valid-certs');

        if (totalCertsEl) totalCertsEl.textContent = totalCerts;
        if (pendingAppsEl) pendingAppsEl.textContent = pendingApps;
        if (expiringCertsEl) expiringCertsEl.textContent = expiringCerts;
        if (validCertsEl) validCertsEl.textContent = validCerts;

        // 🆕 디버깅 로그 추가
        console.log('📊 대시보드 업데이트:', {
            totalCerts,
            pendingApps,
            expiringCerts,
            validCerts,
            applicationsCount: applications.length
        });
    }

    /**
     * 보유 자격증 렌더링
     */
    function renderOwnedCertificates() {
        const container = document.getElementById('owned-certificates');
        const emptyState = document.getElementById('no-owned-certs');

        if (!container || !emptyState) return;

        if (certificates.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.innerHTML = certificates.map(cert => createCertificateCard(cert)).join('');
    }

    /**
     * 자격증 카드 생성
     */
    function createCertificateCard(cert) {
        const today = new Date();
        const expiryDate = cert.expiryDate ? new Date(cert.expiryDate.seconds * 1000) : null;
        const issuedDate = cert.issuedAt ? new Date(cert.issuedAt.seconds * 1000) : null;

        let statusBadge = '';
        let statusClass = '';
        let actions = '';

        if (expiryDate) {
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry > 90) {
                statusBadge = '<span class="cert-badge badge-valid">유효</span>';
                statusClass = 'cert-valid';
            } else if (daysUntilExpiry > 0) {
                statusBadge = `<span class="cert-badge badge-expiring">만료 임박 (${daysUntilExpiry}일 남음)</span>`;
                statusClass = 'cert-expiring';
            } else {
                statusBadge = '<span class="cert-badge badge-expired">만료됨</span>';
                statusClass = 'cert-expired';
            }

            actions = `
                <button onclick="downloadCertificate('${cert.id}')" class="btn btn-sm btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    다운로드
                </button>
                ${daysUntilExpiry && daysUntilExpiry <= 90 ?
                    `<button onclick="openRenewalModal('${cert.id}')" class="btn btn-sm btn-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        갱신 신청
                    </button>` : ''}
            `;
        } else {
            statusBadge = '<span class="cert-badge badge-valid">유효</span>';
            statusClass = 'cert-valid';
            actions = `
                <button onclick="downloadCertificate('${cert.id}')" class="btn btn-sm btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    다운로드
                </button>
            `;
        }

        const formatDate = (date) => {
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        };

        return `
            <div class="cert-card ${statusClass}">
                <div class="cert-card-header">
                    <div class="cert-info">
                        <h3 class="cert-name">${cert.certName}</h3>
                        <div class="cert-details">
                            <p class="cert-number">자격증 번호: ${cert.certNumber}</p>
                            ${issuedDate ? `<p class="cert-issued">발급일: ${formatDate(issuedDate)}</p>` : ''}
                            ${expiryDate ? `<p class="cert-expiry">만료일: ${formatDate(expiryDate)}</p>` : ''}
                        </div>
                    </div>
                    <div class="cert-status">
                        ${statusBadge}
                    </div>
                </div>
                <div class="cert-actions">
                    ${actions}
                </div>
            </div>
        `;
    }

    /**
     * 진행 현황 렌더링
     */
    function renderProgressList() {
        const container = document.getElementById('progress-list');
        const emptyState = document.getElementById('no-progress');

        if (!container || !emptyState) return;

        if (applications.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.innerHTML = applications.map(app => createProgressCard(app)).join('');
    }

    /**
     * 진행 상황 카드 생성
     */
    function createProgressCard(app) {
        const statusText = getApplicationStatusText(app.status);
        const statusClass = getApplicationStatusClass(app.status);
        const typeText = app.type === 'certification' ? '자격증 신청' : '자격증 갱신';
        const createdDate = new Date(app.createdAt.seconds * 1000);
        const progress = app.progress || 0;

        // 🔧 수정: certName과 certificateName 둘 다 체크
        const certName = app.certName || app.certificateName || app.certType || '자격증';

        // 🔧 추가: certType이 있는 경우 한글명으로 변환
        const displayCertName = certName === app.certType ? getCertificateTypeName(certName) : certName;

        let statusIcon = '';
        let actionButton = '';

        switch (app.status) {
            case 'payment_pending':
                statusIcon = '💳';
                actionButton = `<button onclick="goToPayment('${app.id}')" class="btn btn-sm btn-primary">결제하기</button>`;
                break;
            case 'under_review':
                statusIcon = '🔍';
                break;
            case 'processing':
                statusIcon = '⚙️';
                break;
            case 'approved':
                statusIcon = '✅';
                break;
            case 'rejected':
                statusIcon = '❌';
                break;
            default:
                statusIcon = '📋';
        }

        const formatDate = (date) => {
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        };

        return `
        <div class="progress-card ${statusClass}">
            <div class="progress-header">
                <div class="progress-info">
                    <h4 class="progress-title">${displayCertName} ${typeText}</h4>
                    <p class="progress-date">신청일: ${formatDate(createdDate)}</p>
                </div>
                <div class="progress-status">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text">${statusText}</span>
                </div>
            </div>
            
            <div class="progress-visual mt-3">
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">
                    <span>진행률</span>
                    <span>${progress}%</span>
                </div>
            </div>
            
            ${actionButton ? `<div class="progress-actions mt-3">${actionButton}</div>` : ''}
        </div>
    `;
    }

    /**
     * 갱신 필요 여부 확인
     */
    function checkRenewalNeeded() {
        const today = new Date();
        const renewalNeededCerts = certificates.filter(cert => {
            if (!cert.expiryDate) return false;
            const expiryDate = new Date(cert.expiryDate.seconds * 1000);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 90;
        });

        const renewalAvailable = document.getElementById('renewal-available');
        const noRenewalNeeded = document.getElementById('no-renewal-needed');
        const renewalableCerts = document.getElementById('renewalable-certs');

        if (!renewalAvailable || !noRenewalNeeded || !renewalableCerts) return;

        if (renewalNeededCerts.length > 0) {
            renewalAvailable.classList.remove('hidden');
            noRenewalNeeded.classList.add('hidden');

            updateRenewalProgress(0, `${renewalNeededCerts.length}개의 자격증이 갱신을 기다리고 있습니다.`);

            const formatDate = (date) => {
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            };

            renewalableCerts.innerHTML = renewalNeededCerts.map(cert => {
                const expiryDate = new Date(cert.expiryDate.seconds * 1000);
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                const isExpired = daysUntilExpiry <= 0;
                const isEarlyRenewal = daysUntilExpiry >= 60;

                return `
                    <div class="renewal-cert-card">
                        <div class="renewal-cert-info">
                            <h5 class="renewal-cert-name">${cert.certName}</h5>
                            <p class="renewal-cert-details">
                                자격증 번호: ${cert.certNumber}<br>
                                만료일: ${formatDate(expiryDate)}
                                ${isExpired ? ' <span class="text-red-600 font-semibold">(만료됨)</span>' :
                        ` <span class="text-amber-600 font-semibold">(${daysUntilExpiry}일 남음)</span>`}
                                ${isEarlyRenewal ? '<br><span class="text-green-600 text-sm">💡 조기 갱신 할인 대상</span>' : ''}
                            </p>
                        </div>
                        <div class="renewal-cert-action">
                            <button onclick="openRenewalModal('${cert.id}')" class="btn btn-sm btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                갱신 신청
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            renewalAvailable.classList.add('hidden');
            noRenewalNeeded.classList.remove('hidden');
            updateRenewalProgress(100, '모든 자격증이 유효합니다.');
        }
    }

    // =================================
    // Part 5: 폼 처리 및 갱신 신청
    // =================================

    /**
     * 기본값 설정
     */
    function setDefaultFormValues() {
        const user = window.authService && window.authService.getCurrentUser ? window.authService.getCurrentUser() : null;

        const defaultValues = {
            'renewal-recipient-name': user && user.displayName ? user.displayName : '',
            'renewal-cpe-hours': '10',
            'renewal-delivery-method': 'physical'
        };

        Object.entries(defaultValues).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });
    }

    /**
     * 할인 정보 업데이트
     */
    function updateDiscountInfo(reasons, amount) {
        const discountSection = document.querySelector('.payment-summary-card');
        if (!discountSection) return;

        const parentElement = discountSection.parentElement;
        if (!parentElement) return;

        const discountInfoSection = parentElement.querySelector('.bg-green-50');
        if (!discountInfoSection) return;

        const discountList = discountInfoSection.querySelector('ul');
        const titleElement = discountInfoSection.querySelector('h5');

        if (!discountList || !titleElement) return;

        if (reasons.length > 0 && amount > 0) {
            discountInfoSection.classList.remove('hidden');
            discountList.innerHTML = reasons.map(reason => `<li>• ${reason}</li>`).join('');
            titleElement.textContent = `할인 혜택 (총 ${amount.toLocaleString()}원 할인)`;
        } else {
            discountList.innerHTML = `
                <li>• 온라인 교육 선택 시: 교육비 20% 할인</li>
                <li>• 조기 갱신 신청 시 (만료 60일 전): 갱신비 10% 할인</li>
                <li>• 복수 자격증 동시 갱신 시: 총 금액 5% 추가 할인</li>
            `;
            titleElement.textContent = '할인 혜택';
        }
    }

    /**
     * 갱신 신청 제출
     */
    window.submitRenewalApplication = async function () {
        try {
            // 폼 유효성 검사
            if (!validateRenewalForm()) {
                return;
            }

            // 로딩 상태
            const submitBtn = document.querySelector('.modal-footer .btn-primary');
            if (!submitBtn) return;

            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
            `;

            // 모달 단계 진행
            updateModalSteps(5);
            updateModalStepInfo(5, 4);
            updateRenewalProgress(75, '갱신 신청서를 처리하고 있습니다...');

            // selectedCertForRenewal null 체크 및 기본값 설정
            if (!selectedCertForRenewal) {
                selectedCertForRenewal = {
                    id: 'test-cert',
                    certType: 'health-exercise',
                    certName: '건강운동처방사 (테스트)',
                    certNumber: 'TEST-2024-001',
                    issuedAt: { seconds: new Date('2022-01-01').getTime() / 1000 },
                    expiryDate: { seconds: new Date('2025-01-01').getTime() / 1000 }
                };
            }

            // 폼 데이터 수집
            const formData = collectRenewalFormData();

            // 파일 업로드 처리
            const educationCompletionInput = document.getElementById('renewal-education-completion');
            const cpeDocumentsInput = document.getElementById('renewal-cpe-documents');

            if (educationCompletionInput && educationCompletionInput.files.length > 0) {
                formData.educationCompletionFile = educationCompletionInput.files[0];
            }

            if (cpeDocumentsInput && cpeDocumentsInput.files.length > 0) {
                formData.cpeDocuments = Array.from(cpeDocumentsInput.files);
            }

            // 갱신 신청 저장
            const applicationId = await saveRenewalApplication(formData);

            // 성공 메시지
            showNotification('갱신 신청이 성공적으로 제출되었습니다!', 'success');
            updateRenewalProgress(100, '갱신 신청이 완료되었습니다. 결제 페이지로 이동합니다.');

            // 모달 닫기
            closeRenewalModal();

            // 결제 페이지로 이동
            setTimeout(() => {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    alert(`결제 페이지로 이동합니다.\n상품: ${selectedCertForRenewal.certName} 갱신\n금액: ${formData.totalAmount.toLocaleString()}원`);
                } else {
                    const paymentParams = new URLSearchParams({
                        type: 'renewal',
                        applicationId: applicationId,
                        product: `${selectedCertForRenewal.certName} 갱신`,
                        price: formData.totalAmount
                    });

                    window.location.href = window.adjustPath(`pages/education/cert-application.html?${paymentParams.toString()}`);
                }
            }, 1500);

        } catch (error) {
            console.error('갱신 신청 오류:', error);
            showNotification('갱신 신청 중 오류가 발생했습니다.', 'error');
            updateRenewalProgress(25, '오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            // 버튼 상태 복원
            const submitBtn = document.querySelector('.modal-footer .btn-primary');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <span id="submit-button-text">갱신 신청하기</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                `;
            }
        }
    };

    /**
     * 갱신 폼 유효성 검사
     */
    function validateRenewalForm() {
        const requiredFields = [
            { id: 'renewal-education-type', name: '갱신 교육 유형' },
            { id: 'renewal-cpe-hours', name: '보수교육 이수 시간' },
            { id: 'renewal-delivery-method', name: '수령 방법' },
            { id: 'renewal-recipient-name', name: '수령인 이름' },
            { id: 'renewal-recipient-phone', name: '수령인 연락처' }
        ];

        // 배송 방법이 디지털이 아닌 경우 주소 필드도 체크
        const deliveryMethodElement = document.getElementById('renewal-delivery-method');
        const deliveryMethod = deliveryMethodElement ? deliveryMethodElement.value : '';

        if (deliveryMethod !== 'digital') {
            requiredFields.push(
                { id: 'renewal-zipcode', name: '우편번호' },
                { id: 'renewal-address1', name: '기본주소' },
                { id: 'renewal-address2', name: '상세주소' }
            );
        }

        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                showNotification(`${field.name}을(를) 입력해주세요.`, 'error');
                if (element) element.focus();
                return false;
            }
        }

        // 보수교육 시간 검사
        const cpeHoursElement = document.getElementById('renewal-cpe-hours');
        const cpeHours = cpeHoursElement ? parseInt(cpeHoursElement.value) : 0;

        if (cpeHours < 10) {
            showNotification('보수교육 시간은 최소 10시간 이상이어야 합니다.', 'error');
            if (cpeHoursElement) cpeHoursElement.focus();
            return false;
        }

        // 파일 업로드 검사
        const cpeDocumentsElement = document.getElementById('renewal-cpe-documents');
        const cpeFiles = cpeDocumentsElement ? cpeDocumentsElement.files : [];

        if (cpeFiles.length === 0) {
            showNotification('보수교육 증빙자료를 업로드해주세요.', 'error');
            return false;
        }

        // 교육 이수 완료 선택 시 증명서 필수
        const educationTypeElement = document.getElementById('renewal-education-type');
        const educationType = educationTypeElement ? educationTypeElement.value : '';

        if (educationType === 'completed') {
            const completionFileElement = document.getElementById('renewal-education-completion');
            const completionFile = completionFileElement ? completionFileElement.files : [];

            if (completionFile.length === 0) {
                showNotification('교육 이수 증명서를 업로드해주세요.', 'error');
                return false;
            }
        }

        // 연락처 형식 검사
        const phoneElement = document.getElementById('renewal-recipient-phone');
        const phone = phoneElement ? phoneElement.value : '';
        const phoneRegex = /^[0-9-+().\s]+$/;

        if (phone && !phoneRegex.test(phone)) {
            showNotification('올바른 연락처 형식으로 입력해주세요.', 'error');
            if (phoneElement) phoneElement.focus();
            return false;
        }

        // 약관 동의 확인
        const agreeTermsElement = document.getElementById('renewal-agree-terms');
        if (!agreeTermsElement || !agreeTermsElement.checked) {
            showNotification('약관에 동의해주세요.', 'error');
            if (agreeTermsElement) agreeTermsElement.focus();
            return false;
        }

        return true;
    }

    // =================================
    // Part 6: 파일 처리 및 데이터 저장
    // =================================

    /**
     * 갱신 폼 데이터 수집 (Part 5에서 이어짐)
     */
    function collectRenewalFormData() {
        if (!selectedCertForRenewal) {
            throw new Error('선택된 자격증이 없습니다.');
        }

        const fees = renewalFees[selectedCertForRenewal.certType];
        if (!fees) {
            throw new Error('자격증 유형을 찾을 수 없습니다.');
        }

        const getValue = (id) => {
            const element = document.getElementById(id);
            return element ? element.value : '';
        };

        const educationType = getValue('renewal-education-type');
        const deliveryMethod = getValue('renewal-delivery-method');

        // 비용 계산
        const renewalFee = fees.renewal;
        const educationFee = fees.education[educationType] || 0;
        const deliveryFee = deliveryMethod === 'both' ? (fees.deliveryFee || 5000) : 0;

        // 할인 계산
        let discountAmount = 0;
        const today = new Date();
        const expiryDate = new Date(selectedCertForRenewal.expiryDate.seconds * 1000);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry >= 60) {
            discountAmount += Math.round(renewalFee * fees.earlyDiscountRate);
        }

        if (educationType === 'online') {
            discountAmount += Math.round(educationFee * fees.onlineDiscountRate);
        }

        const totalAmount = renewalFee + educationFee + deliveryFee - discountAmount;

        return {
            certId: selectedCertForRenewal.id,
            certType: selectedCertForRenewal.certType,
            certName: selectedCertForRenewal.certName,
            educationType: educationType,
            educationPeriod: getValue('renewal-education-period'),
            cpeHours: parseInt(getValue('renewal-cpe-hours')) || 0,
            deliveryMethod: deliveryMethod,
            recipientName: getValue('renewal-recipient-name'),
            recipientPhone: getValue('renewal-recipient-phone'),
            zipcode: getValue('renewal-zipcode'),
            address1: getValue('renewal-address1'),
            address2: getValue('renewal-address2'),
            deliveryMemo: getValue('renewal-delivery-memo'),
            agreeMarketing: document.getElementById('renewal-agree-marketing') ?
                document.getElementById('renewal-agree-marketing').checked : false,
            renewalFee: renewalFee,
            educationFee: educationFee,
            deliveryFee: deliveryFee,
            discountAmount: discountAmount,
            totalAmount: totalAmount,
            daysUntilExpiry: daysUntilExpiry
        };
    }

    /**
     * 갱신 신청 저장
     */
    async function saveRenewalApplication(formData) {
        const user = window.authService.getCurrentUser();
        if (!user) {
            throw new Error('사용자 인증이 필요합니다.');
        }

        const applicationId = 'renewal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.log('갱신 신청 저장 시작:', applicationId);

        try {
            // 1. 파일들을 Firebase Storage에 업로드
            const uploadedFiles = {};

            // 교육 이수 증명서 업로드
            if (formData.educationCompletionFile) {
                console.log('교육 이수 증명서 업로드 중...');
                const fileExtension = getFileExtension(formData.educationCompletionFile.name);
                const educationFileRef = window.dhcFirebase.storage
                    .ref(`applications/${applicationId}/education_completion.${fileExtension}`);

                const educationSnapshot = await educationFileRef.put(formData.educationCompletionFile, {
                    customMetadata: {
                        originalName: formData.educationCompletionFile.name,
                        uploadedBy: user.uid,
                        uploadedAt: new Date().toISOString()
                    }
                });

                uploadedFiles.educationCompletionURL = await educationSnapshot.ref.getDownloadURL();
                uploadedFiles.educationCompletionName = formData.educationCompletionFile.name;
                console.log('교육 이수 증명서 업로드 완료');
            }

            // 보수교육 증빙자료 업로드
            if (formData.cpeDocuments && formData.cpeDocuments.length > 0) {
                console.log('보수교육 증빙자료 업로드 중...', formData.cpeDocuments.length + '개');
                uploadedFiles.cpeDocumentURLs = [];

                for (let i = 0; i < formData.cpeDocuments.length; i++) {
                    const file = formData.cpeDocuments[i];
                    const fileExtension = getFileExtension(file.name);
                    const cpeFileRef = window.dhcFirebase.storage
                        .ref(`applications/${applicationId}/cpe_document_${i}.${fileExtension}`);

                    const cpeSnapshot = await cpeFileRef.put(file, {
                        customMetadata: {
                            originalName: file.name,
                            uploadedBy: user.uid,
                            uploadedAt: new Date().toISOString()
                        }
                    });

                    const downloadURL = await cpeSnapshot.ref.getDownloadURL();
                    uploadedFiles.cpeDocumentURLs.push({
                        originalName: file.name,
                        downloadURL: downloadURL,
                        fileSize: file.size,
                        fileType: file.type
                    });
                }
                console.log('보수교육 증빙자료 업로드 완료');
            }

            // 2. 애플리케이션 데이터 준비
            const applicationData = {
                // 기본 정보
                id: applicationId,
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || formData.recipientName,
                type: 'renewal',
                status: 'payment_pending',
                progress: 25,

                // 자격증 정보
                certId: formData.certId,
                certType: formData.certType,
                certName: formData.certName,

                // 교육 정보
                educationType: formData.educationType,
                educationPeriod: formData.educationPeriod || '',
                cpeHours: formData.cpeHours,

                // 배송 정보
                deliveryMethod: formData.deliveryMethod,
                recipientName: formData.recipientName,
                recipientPhone: formData.recipientPhone,
                zipcode: formData.zipcode || '',
                address1: formData.address1 || '',
                address2: formData.address2 || '',
                deliveryMemo: formData.deliveryMemo || '',

                // 동의 정보
                agreeMarketing: formData.agreeMarketing || false,

                // 비용 정보
                renewalFee: formData.renewalFee,
                educationFee: formData.educationFee,
                deliveryFee: formData.deliveryFee,
                discountAmount: formData.discountAmount,
                totalAmount: formData.totalAmount,

                // 기타 정보
                daysUntilExpiry: formData.daysUntilExpiry,

                // 파일 정보
                ...uploadedFiles,

                // 타임스탬프
                createdAt: new Date(),
                updatedAt: new Date()
            };

            console.log('Firestore에 데이터 저장 중...');

            // 3. Firestore에 애플리케이션 데이터 저장
            const result = await window.dbService.addDocument('applications', applicationData);

            if (result.success) {
                console.log('갱신 신청 저장 완료:', applicationId);

                // 로컬 applications 배열에도 추가 (UI 즉시 업데이트)
                applications.unshift({
                    ...applicationData,
                    createdAt: { seconds: Date.now() / 1000 }
                });

                return applicationId;
            } else {
                throw new Error('갱신 신청 데이터 저장 실패: ' + result.error);
            }

        } catch (error) {
            console.error('갱신 신청 저장 오류:', error);

            // 업로드된 파일들 정리 (실패 시)
            try {
                console.log('업로드된 파일 정리 중...');
                const folderRef = window.dhcFirebase.storage.ref(`applications/${applicationId}`);
                const fileList = await folderRef.listAll();
                await Promise.all(fileList.items.map(item => item.delete()));
                console.log('파일 정리 완료');
            } catch (cleanupError) {
                console.error('파일 정리 오류:', cleanupError);
            }

            throw error;
        }
    }

    /**
     * 파일 확장자 추출
     */
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * 자격증 다운로드
     */
    window.downloadCertificate = async function (certId) {
        try {
            const cert = certificates.find(c => c.id === certId);
            if (!cert) {
                showNotification('자격증을 찾을 수 없습니다.', 'error');
                return;
            }

            showNotification('자격증을 다운로드하고 있습니다...', 'info');

            const user = window.authService.getCurrentUser();
            if (!user) {
                showNotification('로그인이 필요합니다.', 'error');
                return;
            }

            try {
                const storageRef = window.dhcFirebase.storage.ref();
                const certRef = storageRef.child(`certificates/${user.uid}/${cert.id}.pdf`);

                const downloadURL = await certRef.getDownloadURL();

                // 새 창에서 PDF 열기
                const link = document.createElement('a');
                link.href = downloadURL;
                link.target = '_blank';
                link.download = `${cert.certName}_${cert.certNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showNotification('자격증이 다운로드되었습니다.', 'success');

            } catch (storageError) {
                console.error('Storage 다운로드 오류:', storageError);

                if (storageError.code === 'storage/object-not-found') {
                    showNotification('자격증 파일이 아직 준비되지 않았습니다. 관리자에게 문의하세요.', 'error');
                } else if (storageError.code === 'storage/unauthorized') {
                    showNotification('자격증 다운로드 권한이 없습니다.', 'error');
                } else {
                    showNotification('자격증 다운로드 중 오류가 발생했습니다.', 'error');
                }
            }

        } catch (error) {
            console.error('자격증 다운로드 오류:', error);
            showNotification('자격증 다운로드 중 오류가 발생했습니다.', 'error');
        }
    };

    /**
     * 결제 페이지로 이동
     */
    window.goToPayment = function (applicationId) {
        const app = applications.find(a => a.id === applicationId);
        if (!app) {
            showNotification('신청 내역을 찾을 수 없습니다.', 'error');
            return;
        }

        updateRenewalProgress(50, '결제 페이지로 이동합니다...');

        const paymentParams = new URLSearchParams({
            type: app.type,
            applicationId: applicationId,
            product: `${app.certName} ${app.type === 'certification' ? '신청' : '갱신'}`,
            price: app.totalAmount || 50000,
            userId: app.userId,
            userEmail: app.userEmail || app.userEmail
        });

        setTimeout(() => {
            alert(`결제 시스템 연동 예정\n\n상품: ${app.certName} ${app.type === 'certification' ? '신청' : '갱신'}\n금액: ${(app.totalAmount || 50000).toLocaleString()}원\n신청 ID: ${applicationId}`);
        }, 1000);
    };

    // =================================
    // 상태 및 헬퍼 함수들
    // =================================

    /**
     * 상태 텍스트 반환
     */
    function getApplicationStatusText(status) {
        const statusMap = {
            'payment_pending': '결제 대기',
            'under_review': '심사 중',
            'processing': '처리 중',
            'approved': '승인됨',
            'rejected': '거부됨',
            'completed': '완료'
        };
        return statusMap[status] || status;
    }

    /**
     * 상태 클래스 반환
     */
    function getApplicationStatusClass(status) {
        const classMap = {
            'payment_pending': 'status-pending',
            'under_review': 'status-review',
            'processing': 'status-processing',
            'approved': 'status-approved',
            'rejected': 'status-rejected',
            'completed': 'status-completed'
        };
        return classMap[status] || 'status-default';
    }

    // =================================
    // 파일 업로드 처리
    // =================================

    /**
     * 파일 업로드 설정
     */
    function setupFileUpload(inputId, isMultiple) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const dropZone = input.parentElement.querySelector('.file-drop-zone');
        if (!dropZone) return;

        // 드래그 앤 드롭 이벤트
        dropZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                handleFileUpload(input, isMultiple);
            }
        });

        // 클릭 이벤트
        dropZone.addEventListener('click', () => input.click());

        // 파일 선택 이벤트
        input.addEventListener('change', function () {
            handleFileUpload(this, isMultiple);
        });
    }

    /**
     * 파일 업로드 처리
     */
    function handleFileUpload(input, isMultiple) {
        const files = input.files;
        if (files.length === 0) return;

        const dropZone = input.parentElement.querySelector('.file-drop-zone');
        const preview = input.parentElement.querySelector(isMultiple ? '.file-preview-list' : '.file-preview');

        if (!dropZone || !preview) return;

        if (isMultiple) {
            handleMultipleFiles(files, preview, dropZone, input);
        } else {
            handleSingleFile(files[0], preview, dropZone, input);
        }

        updateRenewalProgress(40, '파일이 업로드되었습니다.');
    }

    /**
     * 단일 파일 처리
     */
    function handleSingleFile(file, preview, dropZone, input) {
        if (!validateFile(file)) {
            input.value = '';
            return;
        }

        const fileName = preview.querySelector('.file-name');
        if (fileName) {
            fileName.textContent = file.name;
        }

        dropZone.classList.add('hidden');
        preview.classList.remove('hidden');

        const removeBtn = preview.querySelector('.remove-file');
        if (removeBtn) {
            removeBtn.onclick = () => {
                preview.classList.add('hidden');
                dropZone.classList.remove('hidden');
                input.value = '';
            };
        }
    }

    /**
     * 다중 파일 처리
     */
    function handleMultipleFiles(files, previewList, dropZone, input) {
        if (files.length > 5) {
            showNotification('최대 5개 파일까지 업로드 가능합니다.', 'error');
            input.value = '';
            return;
        }

        previewList.innerHTML = '';
        const validFiles = [];

        Array.from(files).forEach((file, index) => {
            if (validateFile(file)) {
                validFiles.push(file);

                const previewItem = document.createElement('div');
                previewItem.className = 'file-preview-item';
                previewItem.innerHTML = `
                    <span class="file-name">${file.name}</span>
                    <span class="text-xs text-gray-500">(${formatFileSize(file.size)})</span>
                    <button type="button" class="remove-file" onclick="removeFileFromList(this, ${index})">&times;</button>
                `;

                previewList.appendChild(previewItem);
            }
        });

        if (validFiles.length > 0) {
            dropZone.classList.add('hidden');
            previewList.classList.remove('hidden');
        } else {
            input.value = '';
        }
    }

    /**
     * 파일 크기 포맷팅
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 파일 유효성 검사
     */
    function validateFile(file) {
        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`, 'error');
            return false;
        }

        // 파일 형식 체크
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            showNotification(`${file.name}: PDF, JPG, PNG 파일만 업로드 가능합니다.`, 'error');
            return false;
        }

        // 파일명 체크 (특수문자 제한)
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(file.name)) {
            showNotification(`${file.name}: 파일명에 특수문자가 포함되어 있습니다.`, 'error');
            return false;
        }

        return true;
    }

    /**
     * 목록에서 파일 제거
     */
    window.removeFileFromList = function (button, index) {
        const previewItem = button.parentElement;
        const previewList = previewItem.parentElement;
        const input = previewList.parentElement.querySelector('input[type="file"]');

        if (!input) return;

        const dt = new DataTransfer();
        const files = Array.from(input.files);
        files.forEach((file, i) => {
            if (i !== index) {
                dt.items.add(file);
            }
        });
        input.files = dt.files;

        previewItem.remove();

        if (previewList.children.length === 0) {
            const dropZone = previewList.parentElement.querySelector('.file-drop-zone');
            if (dropZone) {
                previewList.classList.add('hidden');
                dropZone.classList.remove('hidden');
            }
        }
    };

    /**
     * 파일 업로드 영역 리셋
     */
    function resetFileUploadArea(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const dropZone = input.parentElement.querySelector('.file-drop-zone');
        const preview = input.parentElement.querySelector('.file-preview, .file-preview-list');

        input.value = '';
        if (dropZone) dropZone.classList.remove('hidden');
        if (preview) {
            preview.classList.add('hidden');
            preview.innerHTML = '';
        }
    }

    // =================================
    // Part 7: 이벤트 리스너 및 유틸리티
    // =================================

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        console.log('🔧 이벤트 리스너 설정 시작');

        // 갱신 교육 유형 변경
        const educationTypeSelect = document.getElementById('renewal-education-type');
        if (educationTypeSelect) {
            educationTypeSelect.addEventListener('change', function () {
                const completionField = document.getElementById('renewal-education-completion-field');
                if (completionField) {
                    if (this.value === 'completed') {
                        completionField.classList.remove('hidden');
                    } else {
                        completionField.classList.add('hidden');
                    }
                }
                updateRenewalTotalAmountWithDynamicFees();
            });
            console.log('✅ 교육 유형 선택 이벤트 설정 완료');
        }

        // 배송 방법 변경
        const deliveryMethodSelect = document.getElementById('renewal-delivery-method');
        if (deliveryMethodSelect) {
            deliveryMethodSelect.addEventListener('change', function () {
                const addressFields = document.getElementById('renewal-address-fields');
                const deliveryFeeRow = document.getElementById('renewal-delivery-fee-row');

                console.log('📦 배송 방법 변경됨:', this.value);

                if (this.value === 'digital') {
                    if (addressFields) {
                        addressFields.style.display = 'none';
                        console.log('📱 디지털 수령 - 주소 필드 숨김');
                    }
                    if (deliveryFeeRow) {
                        deliveryFeeRow.style.display = 'none';
                        console.log('💰 배송비 숨김');
                    }
                } else {
                    if (addressFields) {
                        addressFields.style.display = 'block';
                        console.log('📦 실물 수령 - 주소 필드 표시');
                    }
                    if (deliveryFeeRow) {
                        const currentFees = selectedCertForRenewal
                            ? renewalFees[selectedCertForRenewal.certType]
                            : null;
                        const currentDeliveryFee = currentFees?.deliveryFee ?? 5000;
                        if (this.value === 'both' && currentDeliveryFee > 0) {
                            deliveryFeeRow.style.display = 'flex';
                            console.log('💰 배송비 표시 (실물+디지털)');
                        } else {
                            deliveryFeeRow.style.display = 'none';
                            console.log('💰 배송비 숨김 (실물만 또는 배송비 0원)');
                        }
                    }
                }
                updateRenewalTotalAmountWithDynamicFees();
            });
            console.log('✅ 배송 방법 선택 이벤트 설정 완료');
        }

        // 파일 업로드 처리
        setupFileUpload('renewal-education-completion', false);
        setupFileUpload('renewal-cpe-documents', true);

        console.log('✅ 모든 이벤트 리스너 설정 완료');
    }

    // =================================
    // 유틸리티 함수들
    // =================================

    /**
     * 자격증 타입을 한글명으로 변환
     */
    function getCertificateTypeName(type) {
        const typeNames = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        return typeNames[type] || type || '알 수 없음';
    }

    /**
     * 로딩 상태 표시
     */
    function showLoadingState(show) {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            if (show) {
                loadingState.classList.remove('hidden');
            } else {
                loadingState.classList.add('hidden');
            }
        }
    }

    /**
     * 알림 메시지 표시
     */
    function showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingToast = document.querySelector('.notification-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 새 알림 생성
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;

        let icon = '';
        switch (type) {
            case 'success':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
                break;
            case 'error':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
                break;
            case 'info':
            default:
                icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
                break;
        }

        toast.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        // 자동 제거
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    /**
     * 데이터 새로고침
     */
    async function refreshData(showToast = false) {  // 👈 매개변수 추가
        try {
            showLoadingState(true);

            await Promise.all([
                loadCertificates(),
                loadApplications()
            ]);

            updateDashboard();
            renderOwnedCertificates();
            renderProgressList();
            checkRenewalNeeded();

            // 👇 조건부로만 Toast 표시
            if (showToast) {
                showNotification('데이터가 새로고침되었습니다.', 'success');
            }
        } catch (error) {
            console.error('데이터 새로고침 오류:', error);
            showNotification('데이터 새로고침 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoadingState(false);
        }
    }

    // =================================
    // 전역 함수 노출 및 새로고침 기능
    // =================================

    /**
     * 갱신 비용 새로고침 함수
     */
    window.refreshRenewalFees = async function () {
        console.log('🔄 갱신 비용 수동 새로고침');

        try {
            showNotification('갱신 비용 정보를 업데이트하고 있습니다...', 'info');

            const result = await loadDynamicRenewalFees();

            if (result) {
                if (selectedCertForRenewal) {
                    updateRenewalTotalAmountWithDynamicFees();
                }

                showNotification('갱신 비용 정보가 성공적으로 업데이트되었습니다.', 'success');
            } else {
                showNotification('갱신 비용 정보 업데이트에 실패했습니다.', 'error');
            }

            return result;
        } catch (error) {
            console.error('갱신 비용 새로고침 오류:', error);
            showNotification('갱신 비용 새로고침 중 오류가 발생했습니다.', 'error');
            return false;
        }
    };

    // =================================
    // Part 8: 이벤트 처리 및 최종 완성
    // =================================

    // 전역 접근을 위한 함수들 노출
    window.loadDynamicRenewalFees = loadDynamicRenewalFees;
    window.updateRenewalTotalAmountWithDynamicFees = updateRenewalTotalAmountWithDynamicFees;

    // =================================
    // 브라우저 이벤트 처리
    // =================================

    /**
     * 브라우저 뒤로가기 처리
     */
    window.addEventListener('popstate', function (event) {
        const modal = document.getElementById('renewal-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeRenewalModal();
            history.pushState(null, null, window.location.href);
        }
    });

    /**
     * 키보드 단축키 처리
     */
    document.addEventListener('keydown', function (event) {
        // ESC 키로 모달 닫기
        if (event.key === 'Escape') {
            const modal = document.getElementById('renewal-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeRenewalModal();
            }
        }

        // Ctrl+R로 데이터 새로고침
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            refreshData(true); // 👈 수동 새로고침일 때만 Toast 표시
        }
    });

    /**
     * 페이지 가시성 변경 처리
     */
    /*
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            setTimeout(refreshData, 1000);
        }
    });
    */

    /**
     * 전역 오류 처리
     */
    window.addEventListener('error', function (event) {
        console.error('전역 오류:', event.error);
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            showNotification('예기치 않은 오류가 발생했습니다.', 'error');
        }
    });

    /**
     * 미처리 Promise 거부 처리
     */
    window.addEventListener('unhandledrejection', function (event) {
        console.error('미처리 Promise 거부:', event.reason);
        if (!event.reason.message || !event.reason.message.includes('permissions')) {
            showNotification('처리되지 않은 오류가 발생했습니다.', 'error');
        }
        event.preventDefault();
    });

    // =================================
    // mypageHelpers 네임스페이스
    // =================================

    /**
     * mypageHelpers 네임스페이스에 함수 추가
     */
    if (!window.mypageHelpers) {
        window.mypageHelpers = {};
    }

    Object.assign(window.mypageHelpers, {
        showNotification,
        refreshData,
        loadDynamicRenewalFees: loadDynamicRenewalFees,
        updateRenewalTotalAmountWithDynamicFees: updateRenewalTotalAmountWithDynamicFees,
        checkAuthState: function () {
            if (!window.authService || !window.authService.getCurrentUser) {
                console.error('AuthService가 로드되지 않았습니다.');
                setTimeout(() => {
                    window.location.href = window.adjustPath('pages/auth/login.html');
                }, 1000);
                return false;
            }

            const user = window.authService.getCurrentUser();
            if (!user) {
                console.log('사용자가 로그인되지 않았습니다.');
                setTimeout(() => {
                    window.location.href = window.adjustPath('pages/auth/login.html');
                }, 1000);
                return false;
            }

            if (!user.emailVerified) {
                console.warn('이메일 인증이 완료되지 않았습니다.');
            }

            return true;
        }
    });

    // =================================
    // 디버깅 도구 (개발 환경)
    // =================================

    /**
     * 디버그 모드 (개발 환경에서만)
     */
    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('debug=true')) {

        window.debugCertManagement = {
            certificates,
            applications,
            selectedCertForRenewal,
            currentModalStep,
            renewalProgress,
            refreshData,
            updateRenewalProgress,
            updateProcessSteps,
            showNotification,

            // Firebase 연동 테스트용 함수들
            testFirebaseConnection: async function () {
                try {
                    const user = window.authService.getCurrentUser();
                    console.log('현재 사용자:', user);

                    if (!user) {
                        return { error: '로그인 필요' };
                    }

                    const certResult = await window.dbService.getDocuments('certificates', {
                        where: { field: 'userId', operator: '==', value: user.uid }
                    });

                    const appResult = await window.dbService.getDocuments('applications', {
                        where: { field: 'userId', operator: '==', value: user.uid }
                    });

                    console.log('Firestore 연결 테스트 - 자격증:', certResult);
                    console.log('Firestore 연결 테스트 - 신청서:', appResult);

                    return {
                        user: {
                            uid: user.uid,
                            email: user.email,
                            emailVerified: user.emailVerified
                        },
                        certificates: certResult,
                        applications: appResult
                    };
                } catch (error) {
                    console.error('Firebase 연결 테스트 실패:', error);
                    return { error: error.message };
                }
            },

            // 테스트 자격증 생성
            createTestCertificate: async function () {
                const user = window.authService.getCurrentUser();
                if (!user) {
                    console.error('로그인 필요');
                    return;
                }

                const testCert = {
                    userId: user.uid,
                    certType: 'health-exercise',
                    certName: '건강운동처방사 (테스트)',
                    certNumber: 'TEST-' + Date.now(),
                    status: 'active',
                    issuedAt: new Date(),
                    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일 후
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                try {
                    const result = await window.dbService.addDocument('certificates', testCert);
                    console.log('테스트 자격증 생성 결과:', result);

                    if (result.success) {
                        await refreshData();
                        showNotification('테스트 자격증이 생성되었습니다.', 'success');
                    }

                    return result;
                } catch (error) {
                    console.error('테스트 자격증 생성 실패:', error);
                    return { error: error.message };
                }
            }
        };

        // 갱신 비용 디버깅 도구
        window.debugRenewalSystem = {
            help: () => {
                console.log('🔧 갱신 비용 시스템 디버깅 도구');
                console.log('- checkGlobalVars() : 전역 변수 상태 확인');
                console.log('- testDynamicLoad() : 동적 로드 테스트');
                console.log('- testModalOpen() : 모달 열기 테스트');
                console.log('- testFeeCalculation() : 비용 계산 테스트');
                console.log('- refreshFees() : 수동 새로고침');
            },

            checkGlobalVars: () => {
                console.log('=== 전역 변수 상태 ===');
                console.log('renewalFees:', window.renewalFees);
                console.log('selectedCertForRenewal:', window.selectedCertForRenewal);
                console.log('certificates:', window.certificates);
            },

            testDynamicLoad: () => window.loadDynamicRenewalFees(),
            testModalOpen: () => window.openRenewalModal('test-cert-001'),
            testFeeCalculation: () => window.updateRenewalTotalAmountWithDynamicFees(),
            refreshFees: () => window.refreshRenewalFees()
        };

        // 주소찾기 디버깅 도구
        window.debugAddressSearch = {
            help: () => {
                console.log('🔧 주소찾기 디버깅 도구');
                console.log('- test() : 주소찾기 직접 테스트');
                console.log('- check() : 버튼 상태 확인');
                console.log('- setup() : 이벤트 리스너 재설정');
            },

            test: () => {
                console.log('🧪 주소찾기 테스트');
                window.findRenewalAddress();
            },

            check: () => {
                const btn = document.getElementById('renewal-find-address');
                console.log('주소찾기 버튼:', btn ? '존재' : '없음');
                if (btn) {
                    console.log('버튼 onclick:', btn.onclick);
                }

                console.log('전역 함수들:');
                console.log('- window.findRenewalAddress:', typeof window.findRenewalAddress);
                console.log('- window.handleAddressSearch:', typeof window.handleAddressSearch);
            },

            setup: () => {
                console.log('🔧 이벤트 리스너 재설정');
                setupAddressSearchFeature();
            }
        };

        // 전역 디버깅 유틸리티
        window.debugUtils = {
            help: () => {
                console.log('🔧 전역 디버깅 유틸리티');
                console.log('- checkAllGlobals() : 모든 전역 변수 확인');
                console.log('- testFullFlow() : 전체 플로우 테스트');
                console.log('- resetAllData() : 모든 데이터 리셋');
            },

            checkAllGlobals: () => {
                console.log('=== 모든 전역 변수 확인 ===');
                console.log('renewalFees:', window.renewalFees);
                console.log('selectedCertForRenewal:', window.selectedCertForRenewal);
                console.log('certificates:', window.certificates);
                console.log('applications:', window.applications);
                console.log('mypageHelpers:', window.mypageHelpers);
                console.log('authService:', window.authService);
                console.log('dbService:', window.dbService);
            },

            testFullFlow: async () => {
                console.log('🧪 전체 플로우 테스트 시작');

                try {
                    // 1. 동적 비용 로드 테스트
                    console.log('1. 동적 비용 로드 테스트...');
                    await window.loadDynamicRenewalFees();

                    // 2. 모달 열기 테스트
                    console.log('2. 모달 열기 테스트...');
                    window.openRenewalModal('test-cert-001');

                    // 3. 비용 계산 테스트 (지연 실행)
                    setTimeout(() => {
                        console.log('3. 비용 계산 테스트...');
                        window.updateRenewalTotalAmountWithDynamicFees();
                        console.log('✅ 전체 플로우 테스트 완료');
                    }, 1000);

                } catch (error) {
                    console.error('❌ 전체 플로우 테스트 실패:', error);
                }
            },

            resetAllData: () => {
                console.log('🔄 모든 데이터 리셋');
                window.certificates = [];
                window.applications = [];
                window.selectedCertForRenewal = null;
                if (window.mypageHelpers && window.mypageHelpers.refreshData) {
                    window.mypageHelpers.refreshData();
                }
                console.log('✅ 데이터 리셋 완료');
            }
        };

        console.log('🔧 자격증 관리 디버그 모드 활성화');
        console.log('테스트 함수:');
        console.log('- window.debugCertManagement.testFirebaseConnection()');
        console.log('- window.debugCertManagement.createTestCertificate()');
        console.log('- window.debugRenewalSystem.help()');
        console.log('- window.debugAddressSearch.help()');
        console.log('- window.debugUtils.help()');
    }

    // =================================
    // 최종 초기화 및 완료
    // =================================

    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initializePage, 100);
    });

    console.log('✅ 자격증 관리 페이지 스크립트 로드 완료 - 정리된 버전');
    console.log('🎉 동적 갱신 비용 시스템 및 주소찾기 기능 완성!');

    // =================================
    // 🆕 IIFE 내부에서 직접 초기화
    // =================================

    /**
     * 안전한 초기화 실행
     */
    function safeInitialize() {
        console.log('🔧 IIFE 내부 - 안전한 초기화 함수 실행');

        // DOM 준비 확인
        if (document.readyState === 'loading') {
            console.log('⏳ DOM 로딩 중, DOMContentLoaded 대기');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('✅ DOMContentLoaded 이벤트 발생');
                setTimeout(initializePage, 100);
            });
        } else {
            console.log('✅ DOM 이미 준비됨, 즉시 초기화');
            setTimeout(initializePage, 100);
        }
    }

    // 초기화 실행
    safeInitialize();

})(); // IIFE 끝

// =================================
// IIFE 외부 - 추가 디버깅 도구
// =================================

console.log('🎉 cert-management-enhanced.js 전체 로딩 완료!');
console.log('📋 주요 기능:');
console.log('  ✅ 동적 갱신 비용 로드');
console.log('  ✅ 갱신 모달 시스템');
console.log('  ✅ 주소찾기 기능 (완전 정리됨)');
console.log('  ✅ 파일 업로드 처리');
console.log('  ✅ 폼 유효성 검사');
console.log('  ✅ Firebase 연동');
console.log('  ✅ 디버깅 도구');
console.log('🚀 시스템 준비 완료!');
