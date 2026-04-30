/**
 * 토스페이먼츠 키 설정 파일
 *
 * 운영 전환 방법:
 *   1. 토스페이먼츠 대시보드 → 개발 → API 키 에서 라이브 키 복사
 *   2. CLIENT_KEY: PRODUCTION 항목에 live_ck_... 입력
 *   3. ENV 값을 'PRODUCTION' 으로 변경
 *   4. SECRET_KEY는 아래에 입력하지 않습니다 → Firebase Functions 시크릿으로 등록:
 *        firebase functions:secrets:set TOSS_SECRET_KEY
 *        (입력 프롬프트에 live_sk_... 값 입력)
 *   ─ 이 파일 외에 다른 파일은 수정 불필요 ─
 */
window.TOSS_KEYS = {

    // ============================================================
    //  환경 전환 스위치
    //  테스트 → 운영: 아래 값을 'TEST' 에서 'PRODUCTION' 으로 변경
    // ============================================================
    ENV: 'TEST',

    // 테스트 클라이언트 키 (공개용 — 노출되어도 무방)
    TEST: {
        CLIENT_KEY: 'test_ck_Z61JOxRQVE2xdezv4v1QrW0X9bAq'
    },

    // 운영 클라이언트 키 (공개용 — 노출되어도 무방)
    // SECRET_KEY는 Firebase Functions 환경변수에만 보관
    PRODUCTION: {
        CLIENT_KEY: ''   // live_ck_ 로 시작하는 클라이언트 키 입력
    }
};
