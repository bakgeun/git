/**
 * 인증 관련 서비스
 * 로그인, 회원가입, 로그아웃 등 사용자 인증 관련 기능을 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // authService 네임스페이스 생성
    window.authService = {
        /**
         * 이메일/비밀번호로 회원가입
         * 
         * @param {string} email - 사용자 이메일
         * @param {string} password - 사용자 비밀번호
         * @param {object} userData - 추가 사용자 정보 (이름, 전화번호 등)
         * @returns {Promise} - 회원가입 결과 프로미스
         */
        signUp: async function(email, password, userData) {
            try {
                // Firebase Auth를 사용하여 사용자 생성
                const userCredential = await window.dhcFirebase.auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Firestore에 추가 사용자 정보 저장
                await window.dhcFirebase.db.collection('users').doc(user.uid).set({
                    email: email,
                    displayName: userData.displayName || '',
                    phoneNumber: userData.phoneNumber || '',
                    address: userData.address || '',
                    birthdate: userData.birthdate || '',
                    gender: userData.gender || '',
                    userType: 'student', // 기본 사용자 유형
                    createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return { success: true, user: user };
            } catch (error) {
                console.error("회원가입 오류:", error);
                return { success: false, error: error };
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
        signIn: async function(email, password, rememberMe = false) {
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
                await window.dhcFirebase.db.collection('users').doc(user.uid).update({
                    lastLogin: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return { success: true, user: user };
            } catch (error) {
                console.error("로그인 오류:", error);
                return { success: false, error: error };
            }
        },
        
        /**
         * Google 계정으로 로그인
         * 
         * @returns {Promise} - 로그인 결과 프로미스
         */
        signInWithGoogle: async function() {
            try {
                const provider = new window.dhcFirebase.firebase.auth.GoogleAuthProvider();
                const userCredential = await window.dhcFirebase.auth.signInWithPopup(provider);
                const user = userCredential.user;
                
                // 사용자가 처음 Google 로그인하는 경우 Firestore에 기본 정보 저장
                const userDoc = await window.dhcFirebase.db.collection('users').doc(user.uid).get();
                
                if (!userDoc.exists) {
                    await window.dhcFirebase.db.collection('users').doc(user.uid).set({
                        email: user.email,
                        displayName: user.displayName || '',
                        photoURL: user.photoURL || '',
                        userType: 'student', // 기본 사용자 유형
                        createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
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
        signOut: async function() {
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
        resetPassword: async function(email) {
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
        getCurrentUser: function() {
            return window.dhcFirebase.auth.currentUser;
        },
        
        /**
         * 현재 로그인한 사용자의 상세 정보 가져오기 (Firestore 데이터 포함)
         * 
         * @returns {Promise} - 사용자 상세 정보를 포함한 프로미스
         */
        getCurrentUserDetails: async function() {
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
        updateProfile: async function(profileData) {
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
                
                // Firestore에 추가 정보 저장
                await window.dhcFirebase.db.collection('users').doc(user.uid).update({
                    ...profileData,
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                });
                
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
        changePassword: async function(currentPassword, newPassword) {
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
        deleteAccount: async function(password) {
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
                
                // Firestore 사용자 문서 삭제
                await window.dhcFirebase.db.collection('users').doc(user.uid).delete();
                
                // Firebase Auth 계정 삭제
                await user.delete();
                
                return { success: true };
            } catch (error) {
                console.error("계정 삭제 오류:", error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 사용자 역할 확인 (관리자 여부 등)
         * 
         * @returns {Promise} - 사용자 역할 정보를 포함한 프로미스
         */
        checkUserRole: async function() {
            const user = window.dhcFirebase.auth.currentUser;
            
            if (!user) {
                return { isAdmin: false, userType: null };
            }
            
            try {
                const userDoc = await window.dhcFirebase.db.collection('users').doc(user.uid).get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    return {
                        isAdmin: userData.userType === 'admin',
                        userType: userData.userType
                    };
                } else {
                    return { isAdmin: false, userType: null };
                }
            } catch (error) {
                console.error("사용자 역할 확인 오류:", error);
                return { isAdmin: false, userType: null };
            }
        }
    };

    // 인증 상태 감지 함수 등록
    window.dhcFirebase.onAuthStateChanged(function(user) {
        // 인증 상태 변경 시 이벤트 디스패치
        const event = new CustomEvent('authStateChanged', { detail: { user } });
        document.dispatchEvent(event);
    });
})();