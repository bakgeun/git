/**
 * 로컬 테스트용 인증 서비스 오버라이드
 * 기존 Firebase SDK와 함께 사용하면서 로컬 테스트를 위한 인증 기능을 제공합니다.
 */

// local-auth-override.js 파일 상단에 추가
console.log('local-auth-override.js 파일이 로드되었습니다.');

(function() {
    // 로컬 테스트 모드 설정 (true: 로컬 테스트 모드, false: 실제 Firebase 사용)
    const LOCAL_TEST_MODE = false;  // ← 이 부분을 false로 변경
    
    // 현재 설정을 콘솔에 출력
    console.log('LOCAL_TEST_MODE 값:', LOCAL_TEST_MODE);
    
    // 로컬 테스트 모드가 아니면 초기화하지 않음
    if (!LOCAL_TEST_MODE) {
        console.log('실제 Firebase 서비스를 사용합니다.');
        console.log('local-auth-override.js는 비활성화되었습니다.');
        
        // Firebase가 이미 로드되었는지 확인
        if (typeof firebase !== 'undefined' && firebase.auth) {
            console.log('Firebase 인증 서비스 사용 가능');
        } else {
            console.warn('Firebase 서비스가 아직 로드되지 않았습니다.');
        }
        
        return;
    }
    
    // 아래의 테스트 계정 코드들은 LOCAL_TEST_MODE가 true일 때만 실행됨
    // (현재는 실행되지 않음)
    
    console.log('=== 로컬 테스트 모드 활성화 ===');
    console.log('테스트 계정을 사용하려면 Firebase 콘솔에서 직접 계정을 생성하세요.');
    console.log('===========================');

    // 테스트용 사용자 데이터베이스 (보안상 자격 증명 제거됨)
    const mockUsers = {};
    
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
    
    // 나머지 로컬 테스트 코드들은 그대로 유지...
    // (LOCAL_TEST_MODE가 false이므로 실행되지 않음)
})();