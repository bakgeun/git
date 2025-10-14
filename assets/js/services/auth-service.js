/**
 * 인증 관련 서비스
 * 로그인, 회원가입, 로그아웃 등 사용자 인증 관련 기능을 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
    // authService 네임스페이스 생성
    window.authService = {
        /**
         * 이메일/비밀번호로 회원가입 (⭐ 수정 버전)
         * ⭐ Firebase Auth 프로필 업데이트 추가로 displayName 저장 문제 해결
         * 
         * @param {string} email - 사용자 이메일
         * @param {string} password - 사용자 비밀번호
         * @param {object} userData - 추가 사용자 정보 (이름, 전화번호 등)
         * @returns {Promise} - 회원가입 결과 프로미스
         */
        signUp: async function (email, password, userData) {
            console.log('📝 회원가입 시작:', email);
            console.log('📝 사용자 데이터:', userData);

            try {
                // 1. Firebase Auth를 사용하여 사용자 생성
                console.log('🔐 Firebase Auth 계정 생성 중...');
                const userCredential = await window.dhcFirebase.auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                console.log('✅ Firebase Auth 계정 생성 성공:', user.uid);

                // ⭐ 2. Firebase Auth 프로필 업데이트 (새로 추가된 부분)
                try {
                    await user.updateProfile({
                        displayName: userData.displayName || '',
                        photoURL: userData.photoURL || null
                    });
                    console.log('✅ Firebase Auth 프로필 업데이트 완료:', {
                        displayName: userData.displayName
                    });
                } catch (profileError) {
                    console.warn('⚠️ Firebase Auth 프로필 업데이트 실패:', profileError);
                    // 프로필 업데이트 실패해도 계속 진행 (Firestore 저장이 더 중요)
                }

                // 3. Firestore에 추가 사용자 정보 저장 (기존 코드)
                const userDoc = {
                    email: email,
                    displayName: userData.displayName || '',
                    phoneNumber: userData.phoneNumber || '',
                    address: userData.address || '',
                    birthdate: userData.birthdate || '',
                    gender: userData.gender || '',

                    // ⭐ 추가: 주소 분리 필드
                    postalCode: userData.postalCode || '',
                    addressBasic: userData.addressBasic || '',
                    addressDetail: userData.addressDetail || '',

                    userType: 'student', // 기본 사용자 유형
                    status: 'active',    // ⭐ 중요: 활성 상태로 설정
                    marketingConsent: userData.marketingConsent || false,
                    registrationMethod: userData.registrationMethod || 'email',
                    termsAgreedAt: userData.termsAgreedAt || new Date(),
                    userAgent: userData.userAgent || navigator.userAgent,
                    registrationIP: userData.registrationIP || null,
                    createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };

                console.log('💾 Firestore에 사용자 데이터 저장 중...', {
                    email: userDoc.email,
                    displayName: userDoc.displayName,
                    phoneNumber: userDoc.phoneNumber
                });

                // 4. Firestore에 사용자 문서 생성
                await window.dhcFirebase.db.collection('users').doc(user.uid).set(userDoc);

                console.log('✅ Firestore 사용자 데이터 저장 완료');

                // 5. 성공 결과 반환
                return {
                    success: true,
                    user: user,
                    message: '회원가입이 완료되었습니다.'
                };

            } catch (error) {
                console.error("❌ 회원가입 오류:", error);

                // Firebase Auth 계정은 생성되었지만 Firestore 저장이 실패한 경우
                // 생성된 Auth 계정을 정리
                if (error.code && error.code.includes('firestore')) {
                    // userCredential이 정의되어 있는지 확인
                    if (typeof userCredential !== 'undefined' && userCredential?.user) {
                        try {
                            console.log('🔄 Firestore 저장 실패로 인한 Auth 계정 정리...');
                            await userCredential.user.delete();
                            console.log('✅ Auth 계정 정리 완료');
                        } catch (deleteError) {
                            console.error('❌ Auth 계정 정리 실패:', deleteError);
                        }
                    }
                }

                return {
                    success: false,
                    error: error,
                    message: '회원가입 중 오류가 발생했습니다.'
                };
            }
        },

        /**
         * 이메일/비밀번호로 로그인
         * 
         * @param {string} email - 사용자 이메일
         * @param {string} password - 사용자 비밀번호
         * @param {boolean} rememberMe - 로그인 상태 유지 여부
         * @returns {Promise} - 로그인 결과 프로미스
         */
        signIn: async function (email, password, rememberMe = false) {
            try {
                // 로그인 상태 유지 설정
                if (rememberMe) {
                    await window.dhcFirebase.auth.setPersistence(window.dhcFirebase.firebase.auth.Auth.Persistence.LOCAL);
                } else {
                    await window.dhcFirebase.auth.setPersistence(window.dhcFirebase.firebase.auth.Auth.Persistence.SESSION);
                }

                // 로그인 시도
                const userCredential = await window.dhcFirebase.auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 마지막 로그인 시간 업데이트
                try {
                    await window.dhcFirebase.db.collection('users').doc(user.uid).update({
                        lastLogin: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('✅ 마지막 로그인 시간 업데이트 완료');
                } catch (updateError) {
                    console.warn('⚠️ 마지막 로그인 시간 업데이트 실패:', updateError);
                    // 로그인은 성공했으므로 계속 진행
                }

                return { success: true, user: user };
            } catch (error) {
                console.error("로그인 오류:", error);
                return { success: false, error: error };
            }
        },

        /**
         * Google 계정으로 로그인 (개선된 버전)
         * 
         * @returns {Promise} - 로그인 결과 프로미스
         */
        signInWithGoogle: async function () {
            console.log('🔵 Google 로그인 시작');

            try {
                const provider = new window.dhcFirebase.firebase.auth.GoogleAuthProvider();
                const userCredential = await window.dhcFirebase.auth.signInWithPopup(provider);
                const user = userCredential.user;

                console.log('✅ Google 로그인 성공:', user.email);

                // 사용자가 처음 Google 로그인하는 경우 Firestore에 기본 정보 저장
                const userDoc = await window.dhcFirebase.db.collection('users').doc(user.uid).get();

                if (!userDoc.exists) {
                    console.log('👤 신규 Google 사용자, Firestore에 데이터 저장');

                    const newUserDoc = {
                        email: user.email,
                        displayName: user.displayName || '',
                        photoURL: user.photoURL || '',
                        userType: 'student', // 기본 사용자 유형
                        status: 'active',    // ⭐ 중요: 활성 상태로 설정
                        marketingConsent: false, // Google 로그인시 기본값
                        registrationMethod: 'google',
                        createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    };

                    await window.dhcFirebase.db.collection('users').doc(user.uid).set(newUserDoc);
                    console.log('✅ 신규 Google 사용자 데이터 저장 완료');
                } else {
                    console.log('👤 기존 Google 사용자, 로그인 시간만 업데이트');

                    // 기존 사용자인 경우 마지막 로그인 시간만 업데이트
                    await window.dhcFirebase.db.collection('users').doc(user.uid).update({
                        lastLogin: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    });
                }

                return { success: true, user: user };
            } catch (error) {
                console.error("Google 로그인 오류:", error);
                return { success: false, error: error };
            }
        },

        /**
         * 사용자 로그아웃
         * 
         * @returns {Promise} - 로그아웃 결과 프로미스
         */
        signOut: async function () {
            try {
                await window.dhcFirebase.auth.signOut();
                return { success: true };
            } catch (error) {
                console.error("로그아웃 오류:", error);
                return { success: false, error: error };
            }
        },

        /**
         * 비밀번호 재설정 이메일 전송
         * 
         * @param {string} email - 사용자 이메일
         * @returns {Promise} - 이메일 전송 결과 프로미스
         */
        resetPassword: async function (email) {
            try {
                await window.dhcFirebase.auth.sendPasswordResetEmail(email);
                return { success: true };
            } catch (error) {
                console.error("비밀번호 재설정 오류:", error);
                return { success: false, error: error };
            }
        },

        /**
         * 현재 로그인한 사용자 정보 가져오기
         * 
         * @returns {Object|null} - 로그인한 사용자 정보 또는 null
         */
        getCurrentUser: function () {
            return window.dhcFirebase.auth.currentUser;
        },

        /**
         * 현재 로그인한 사용자의 상세 정보 가져오기 (Firestore 데이터 포함)
         * 
         * @returns {Promise} - 사용자 상세 정보를 포함한 프로미스
         */
        getCurrentUserDetails: async function () {
            const user = window.dhcFirebase.auth.currentUser;

            if (!user) {
                return null;
            }

            try {
                const userDoc = await window.dhcFirebase.db.collection('users').doc(user.uid).get();

                if (userDoc.exists) {
                    return {
                        ...user,
                        ...userDoc.data()
                    };
                } else {
                    return user;
                }
            } catch (error) {
                console.error("사용자 상세 정보 조회 오류:", error);
                return user;
            }
        },

        /**
         * 사용자 프로필 정보 업데이트
         * 
         * @param {object} profileData - 업데이트할 프로필 정보
         * @returns {Promise} - 업데이트 결과 프로미스
         */
        updateProfile: async function (profileData) {
            const user = window.dhcFirebase.auth.currentUser;

            if (!user) {
                return { success: false, error: { message: "로그인이 필요합니다." } };
            }

            try {
                // Firebase Auth 프로필 업데이트 (displayName, photoURL만 가능)
                if (profileData.displayName || profileData.photoURL) {
                    await user.updateProfile({
                        displayName: profileData.displayName,
                        photoURL: profileData.photoURL
                    });
                }

                // 이메일 변경이 있는 경우
                if (profileData.email && profileData.email !== user.email) {
                    await user.updateEmail(profileData.email);
                }

                // ⭐ 중요: Firestore에 추가 정보 저장 - set({merge: true}) 사용
                // 문서가 없으면 생성하고, 있으면 업데이트
                await window.dhcFirebase.db.collection('users').doc(user.uid).set({
                    ...profileData,
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }); // ⭐ merge: true 옵션 추가

                return { success: true };
            } catch (error) {
                console.error("프로필 업데이트 오류:", error);
                return { success: false, error: error };
            }
        },

        /**
         * 비밀번호 변경
         * 
         * @param {string} currentPassword - 현재 비밀번호
         * @param {string} newPassword - 새 비밀번호
         * @returns {Promise} - 비밀번호 변경 결과 프로미스
         */
        changePassword: async function (currentPassword, newPassword) {
            const user = window.dhcFirebase.auth.currentUser;

            if (!user) {
                return { success: false, error: { message: "로그인이 필요합니다." } };
            }

            try {
                // 현재 비밀번호 확인을 위한 재인증
                const credential = window.dhcFirebase.firebase.auth.EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );

                await user.reauthenticateWithCredential(credential);

                // 비밀번호 변경
                await user.updatePassword(newPassword);

                return { success: true };
            } catch (error) {
                console.error("비밀번호 변경 오류:", error);
                return { success: false, error: error };
            }
        },

        /**
         * 사용자 계정 삭제
         * 
         * @param {string} password - 현재 비밀번호 (재인증 용)
         * @returns {Promise} - 계정 삭제 결과 프로미스
         */
        deleteAccount: async function (password) {
            const user = window.dhcFirebase.auth.currentUser;

            if (!user) {
                return { success: false, error: { message: "로그인이 필요합니다." } };
            }

            try {
                // 재인증
                const credential = window.dhcFirebase.firebase.auth.EmailAuthProvider.credential(
                    user.email,
                    password
                );

                await user.reauthenticateWithCredential(credential);

                // Firestore 사용자 문서를 소프트 삭제 (실제 삭제 대신 상태 변경)
                await window.dhcFirebase.db.collection('users').doc(user.uid).update({
                    deletedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'deleted',
                    deletedEmail: user.email, // 삭제된 이메일 보관
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                });

                // 사용자의 관련 데이터도 소프트 삭제 처리
                const batch = window.dhcFirebase.db.batch();

                // 수강신청 소프트 삭제
                const enrollmentsSnapshot = await window.dhcFirebase.db
                    .collection('enrollments')
                    .where('userId', '==', user.uid)
                    .get();

                enrollmentsSnapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        status: 'deleted',
                        deletedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                // 자격증 소프트 삭제
                const certificatesSnapshot = await window.dhcFirebase.db
                    .collection('certificates')
                    .where('userId', '==', user.uid)
                    .get();

                certificatesSnapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        status: 'deleted',
                        deletedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                // 배치 커밋
                await batch.commit();

                // Firebase Auth 계정 삭제 (마지막 단계)
                await user.delete();

                return { success: true };
            } catch (error) {
                console.error("계정 삭제 오류:", error);
                return { success: false, error: error };
            }
        },

        /**
         * 사용자 역할 확인 (관리자 여부 등) - 개선된 버전
         * 
         * @returns {Promise} - 사용자 역할 정보를 포함한 프로미스
         */
        checkUserRole: async function () {
            const user = window.dhcFirebase.auth.currentUser;

            if (!user) {
                return { isAdmin: false, userType: null, status: null };
            }

            try {
                const userDoc = await window.dhcFirebase.db.collection('users').doc(user.uid).get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    return {
                        isAdmin: userData.userType === 'admin',
                        userType: userData.userType,
                        status: userData.status || 'unknown'
                    };
                } else {
                    // Firestore에 사용자 데이터가 없는 경우 기본값 반환
                    return { isAdmin: false, userType: 'student', status: 'unknown' };
                }
            } catch (error) {
                console.error("사용자 역할 확인 오류:", error);
                return { isAdmin: false, userType: null, status: null };
            }
        }
    };

    // 인증 상태 감지 함수 등록 (개선된 버전)
    window.dhcFirebase.onAuthStateChanged(function (user) {
        if (user) {
            console.log('🔐 사용자 로그인 상태 감지:', user.email);
        } else {
            console.log('🔐 사용자 로그아웃 상태 감지');
        }

        // 인증 상태 변경 시 이벤트 디스패치
        const event = new CustomEvent('authStateChanged', { detail: { user } });
        document.dispatchEvent(event);
    });

    console.log('✅ authService 초기화 완료 (개선된 버전)');
})();