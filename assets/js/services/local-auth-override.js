/**
 * 로컬 테스트용 인증 서비스 오버라이드
 * 기존 Firebase SDK와 함께 사용하면서 로컬 테스트를 위한 인증 기능을 제공합니다.
 */

// local-auth-override.js 파일 상단에 추가
console.log('local-auth-override.js 파일이 로드되었습니다.');

(function() {
    // 로컬 테스트 모드 설정 (true: 로컬 테스트 모드, false: 실제 Firebase 사용)
    const LOCAL_TEST_MODE = true;
    
    // 현재 설정을 콘솔에 출력
    console.log('LOCAL_TEST_MODE 값:', LOCAL_TEST_MODE);
    
    // 테스트용 사용자 데이터베이스
    const mockUsers = {
        'admin@test.com': {
            uid: 'mock-admin-uid',
            email: 'admin@test.com',
            password: 'admin123',
            displayName: '관리자',
            userType: 'admin',
            phoneNumber: '010-1234-5678',
            address: '서울시 강남구',
            createdAt: new Date().toISOString()
        },
        'student@test.com': {
            uid: 'mock-student-uid',
            email: 'student@test.com',
            password: 'student123',
            displayName: '홍길동',
            userType: 'student',
            phoneNumber: '010-9876-5432',
            address: '서울시 서초구',
            createdAt: new Date().toISOString()
        }
    };
    
    console.log('테스트 계정 정보가 올바르게 설정되었는지 확인:', 
                mockUsers['admin@test.com'] ? '관리자 계정 확인됨' : '관리자 계정 없음',
                mockUsers['student@test.com'] ? '학생 계정 확인됨' : '학생 계정 없음');
    
    // 로컬 테스트 모드가 아니면 초기화하지 않음
    if (!LOCAL_TEST_MODE) {
        console.log('실제 Firebase 서비스를 사용합니다.');
        return;
    }
    
    console.log('=== 로컬 테스트 모드 활성화 ===');
    console.log('테스트 계정 정보:');
    console.log('1. 관리자 계정');
    console.log('   - 이메일: admin@test.com');
    console.log('   - 비밀번호: admin123');
    console.log('2. 학생 계정');
    console.log('   - 이메일: student@test.com');
    console.log('   - 비밀번호: student123');
    console.log('===========================');

    // 현재 로그인한 사용자 정보 (localStorage에서 복원)
    let currentUser = null;
    
    // 로컬 스토리지에서 사용자 정보 복원
    try {
        const savedUser = localStorage.getItem('mockUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            console.log('로컬 스토리지에서 사용자 정보 복원:', currentUser);
        }
    } catch (e) {
        console.error('로컬 스토리지에서 사용자 정보 복원 실패:', e);
    }
    
    // dhcFirebase 객체가 없으면 초기화
    if (!window.dhcFirebase) {
        console.log('dhcFirebase 객체 초기화');
        window.dhcFirebase = {};
    }
    
    // dhcFirebase 객체 오버라이드
    window.dhcFirebase = {
        // 현재 사용자 가져오기
        getCurrentUser: function() {
            // localStorage에서 다시 확인하여 사용자 정보 반환
            try {
                const savedUser = localStorage.getItem('mockUser');
                if (savedUser) {
                    currentUser = JSON.parse(savedUser);
                    console.log('getCurrentUser: 로컬 스토리지에서 사용자 정보 검색됨:', currentUser);
                    return currentUser;
                }
            } catch (e) {
                console.error('getCurrentUser: 로컬 스토리지 접근 오류:', e);
            }
            
            return currentUser;
        },
        
        // 인증 객체
        auth: {
            // 현재 사용자 속성
            currentUser: currentUser,
            
            // 이메일/비밀번호로 로그인
            signInWithEmailAndPassword: async function(email, password) {
                console.log('로컬 인증 시도:', email);
                return new Promise((resolve, reject) => {
                    const user = mockUsers[email];
                    console.log('사용자 확인:', user ? '찾음' : '없음');
                    
                    if (user && user.password === password) {
                        console.log('비밀번호 일치, 로그인 성공');
                        currentUser = {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName
                        };
                        
                        // auth.currentUser 속성 업데이트
                        window.dhcFirebase.auth.currentUser = currentUser;
                        
                        // 로컬 스토리지에 사용자 정보 저장
                        try {
                            localStorage.setItem('mockUser', JSON.stringify(currentUser));
                            localStorage.setItem('mockUserType', user.userType);
                            console.log('사용자 정보 로컬 스토리지에 저장됨');
                        } catch (e) {
                            console.error('로컬 스토리지 저장 오류:', e);
                        }
                        
                        // 인증 상태 변경 이벤트 발생
                        if (typeof window.dhcFirebase.authStateChangedCallback === 'function') {
                            window.dhcFirebase.authStateChangedCallback(currentUser);
                        }
                        
                        resolve({ user: currentUser });
                    } else {
                        console.log('로그인 실패. 사유:', !user ? '사용자 없음' : '비밀번호 불일치');
                        reject({ code: 'auth/wrong-password', message: '이메일 또는 비밀번호가 잘못되었습니다.' });
                    }
                });
            },
            
            // 로그아웃
            signOut: async function() {
                console.log('로그아웃 시도');
                currentUser = null;
                window.dhcFirebase.auth.currentUser = null;
                
                try {
                    localStorage.removeItem('mockUser');
                    localStorage.removeItem('mockUserType');
                    console.log('로컬 스토리지에서 사용자 정보 삭제됨');
                } catch (e) {
                    console.error('로컬 스토리지 삭제 오류:', e);
                }
                
                // 인증 상태 변경 이벤트 발생
                if (typeof window.dhcFirebase.authStateChangedCallback === 'function') {
                    window.dhcFirebase.authStateChangedCallback(null);
                }
                
                return Promise.resolve();
            },
            
            // 회원가입
            createUserWithEmailAndPassword: async function(email, password) {
                return new Promise((resolve, reject) => {
                    if (mockUsers[email]) {
                        reject({ code: 'auth/email-already-in-use', message: '이미 사용 중인 이메일입니다.' });
                    } else {
                        const newUser = {
                            uid: 'mock-' + Date.now(),
                            email: email,
                            password: password,
                            displayName: '',
                            userType: 'student',
                            createdAt: new Date().toISOString()
                        };
                        
                        mockUsers[email] = newUser;
                        currentUser = {
                            uid: newUser.uid,
                            email: newUser.email,
                            displayName: newUser.displayName
                        };
                        
                        // auth.currentUser 속성 업데이트
                        window.dhcFirebase.auth.currentUser = currentUser;
                        
                        try {
                            localStorage.setItem('mockUser', JSON.stringify(currentUser));
                            localStorage.setItem('mockUserType', newUser.userType);
                        } catch (e) {
                            console.error('로컬 스토리지 저장 오류:', e);
                        }
                        
                        // 인증 상태 변경 이벤트 발생
                        if (typeof window.dhcFirebase.authStateChangedCallback === 'function') {
                            window.dhcFirebase.authStateChangedCallback(currentUser);
                        }
                        
                        resolve({ user: currentUser });
                    }
                });
            },
            
            // 비밀번호 재설정 이메일 전송
            sendPasswordResetEmail: async function(email) {
                console.log(`[Mock] 비밀번호 재설정 이메일 전송 요청: ${email}`);
                return Promise.resolve();
            },
            
            // 인증 지속성 설정
            setPersistence: async function(persistence) {
                console.log(`[Mock] 인증 지속성 설정: ${persistence}`);
                return Promise.resolve();
            }
        },
        
        // 데이터베이스 객체 (이전과 동일)
        db: {
            collection: function(collectionName) {
                return {
                    doc: function(docId) {
                        return {
                            // 문서 가져오기
                            get: async function() {
                                if (collectionName === 'users' && currentUser) {
                                    const userData = mockUsers[currentUser.email];
                                    return {
                                        exists: true,
                                        data: function() {
                                            return userData;
                                        }
                                    };
                                }
                                return { exists: false };
                            },
                            
                            // 문서 생성/덮어쓰기
                            set: async function(data) {
                                if (collectionName === 'users' && currentUser) {
                                    mockUsers[currentUser.email] = { 
                                        ...mockUsers[currentUser.email], 
                                        ...data 
                                    };
                                }
                                return Promise.resolve();
                            },
                            
                            // 문서 업데이트
                            update: async function(data) {
                                if (collectionName === 'users' && currentUser) {
                                    mockUsers[currentUser.email] = { 
                                        ...mockUsers[currentUser.email], 
                                        ...data 
                                    };
                                }
                                return Promise.resolve();
                            },
                            
                            // 문서 삭제
                            delete: async function() {
                                if (collectionName === 'users' && currentUser) {
                                    delete mockUsers[currentUser.email];
                                }
                                return Promise.resolve();
                            }
                        };
                    },
                    
                    // 쿼리 - 조건부 문서 조회
                    where: function(field, operator, value) {
                        return {
                            get: async function() {
                                // users 컬렉션에서 email로 검색
                                if (collectionName === 'users' && field === 'email' && operator === '==') {
                                    const user = mockUsers[value];
                                    if (user) {
                                        return {
                                            empty: false,
                                            docs: [
                                                {
                                                    id: user.uid,
                                                    data: () => user,
                                                    ref: {
                                                        update: async function(data) {
                                                            mockUsers[value] = { 
                                                                ...mockUsers[value], 
                                                                ...data 
                                                            };
                                                            return Promise.resolve();
                                                        }
                                                    }
                                                }
                                            ]
                                        };
                                    }
                                }
                                return { empty: true, docs: [] };
                            }
                        };
                    }
                };
            }
        },
        
        // 파이어베이스 객체
        firebase: {
            auth: {
                GoogleAuthProvider: function() {
                    return {};
                },
                EmailAuthProvider: {
                    credential: function(email, password) {
                        return { email, password };
                    }
                },
                Auth: {
                    Persistence: {
                        LOCAL: 'LOCAL',
                        SESSION: 'SESSION'
                    }
                }
            },
            firestore: {
                FieldValue: {
                    serverTimestamp: function() {
                        return new Date().toISOString();
                    }
                }
            }
        },
        
        // 인증 상태 변경 리스너 등록
        onAuthStateChanged: function(callback) {
            console.log('인증 상태 변경 콜백 등록');
            window.dhcFirebase.authStateChangedCallback = callback;
            
            // 현재 상태 즉시 반영
            if (callback) {
                callback(currentUser);
            }
        }
    };
    
    // 초기화가 완료되면 이벤트 발생
    console.log('local-auth-override.js 초기화 완료, 이벤트 발생');
    const event = new CustomEvent('localAuthOverrideInitialized');
    document.dispatchEvent(event);
})();