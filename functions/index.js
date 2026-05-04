/**
 * Firebase Functions - 토스페이먼츠 결제 처리
 *
 * SECRET_KEY는 이 서버에서만 보관합니다. 프론트엔드에 절대 노출하지 마세요.
 * 면세 처리는 토스페이먼츠 사업자 계정 설정으로 자동 적용됩니다 (별도 파라미터 불필요).
 *
 * 배포 전 SECRET_KEY 등록:
 *   firebase functions:secrets:set TOSS_SECRET_KEY
 *   (입력 프롬프트에 live_sk_... 값 입력)
 *
 * 로컬 테스트:
 *   functions/.env 파일에 TOSS_SECRET_KEY=test_sk_... 설정 후
 *   firebase emulators:start --only functions
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
admin.initializeApp();

const TOSS_API = 'https://api.tosspayments.com/v1/payments';

function getSecretKey() {
    return process.env.TOSS_SECRET_KEY || '';
}

function basicAuth(secretKey) {
    return 'Basic ' + Buffer.from(secretKey + ':').toString('base64');
}

function handleCors(req, res) {
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return true;
    }
    return false;
}

function handleAdminCors(req, res) {
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return true;
    }
    return false;
}

// =============================================================
// 결제 승인
// POST /api/confirmPayment
// body: { paymentKey, orderId, amount }
// =============================================================
exports.confirmPayment = functions.https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    const { paymentKey, orderId, amount } = req.body;

    if (!paymentKey || !orderId || !amount) {
        res.status(400).json({ message: '필수 파라미터 누락: paymentKey, orderId, amount' });
        return;
    }

    const secretKey = getSecretKey();
    if (!secretKey) {
        console.error('[confirmPayment] TOSS_SECRET_KEY가 설정되지 않았습니다.');
        res.status(500).json({ message: '서버 설정 오류 - 관리자에게 문의하세요.' });
        return;
    }

    try {
        const tossRes = await fetch(`${TOSS_API}/confirm`, {
            method: 'POST',
            headers: {
                'Authorization': basicAuth(secretKey),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ paymentKey, orderId, amount })
        });

        const result = await tossRes.json();

        if (!tossRes.ok) {
            console.error('[confirmPayment] 토스 API 오류:', result);
        }

        res.status(tossRes.status).json(result);

    } catch (error) {
        console.error('[confirmPayment] 처리 오류:', error);
        res.status(500).json({ message: '결제 승인 중 서버 오류가 발생했습니다.' });
    }
});

// =============================================================
// 결제 취소
// POST /api/cancelPayment
// body: { paymentKey, cancelReason, cancelAmount? }
// =============================================================
exports.cancelPayment = functions.https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    const { paymentKey, cancelReason, cancelAmount } = req.body;

    if (!paymentKey || !cancelReason) {
        res.status(400).json({ message: '필수 파라미터 누락: paymentKey, cancelReason' });
        return;
    }

    const secretKey = getSecretKey();
    if (!secretKey) {
        console.error('[cancelPayment] TOSS_SECRET_KEY가 설정되지 않았습니다.');
        res.status(500).json({ message: '서버 설정 오류 - 관리자에게 문의하세요.' });
        return;
    }

    try {
        const requestBody = { cancelReason };
        if (cancelAmount) requestBody.cancelAmount = cancelAmount;

        const tossRes = await fetch(`${TOSS_API}/${encodeURIComponent(paymentKey)}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': basicAuth(secretKey),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await tossRes.json();

        if (!tossRes.ok) {
            console.error('[cancelPayment] 토스 API 오류:', result);
        }

        res.status(tossRes.status).json(result);

    } catch (error) {
        console.error('[cancelPayment] 처리 오류:', error);
        res.status(500).json({ message: '결제 취소 중 서버 오류가 발생했습니다.' });
    }
});

// =============================================================
// Firebase Auth 계정 삭제 (관리자 전용)
// POST /api/deleteAuthUser
// headers: { Authorization: 'Bearer <idToken>' }
// body: { uid }
// =============================================================
exports.deleteAuthUser = functions.https.onRequest(async (req, res) => {
    if (handleAdminCors(req, res)) return;
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    // ID 토큰 검증
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
        res.status(401).json({ message: '인증 토큰이 필요합니다.' });
        return;
    }

    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
        res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
        return;
    }

    // 관리자 권한 확인
    const callerDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
        res.status(403).json({ message: '관리자 권한이 필요합니다.' });
        return;
    }

    const { uid } = req.body;
    if (!uid) {
        res.status(400).json({ message: '필수 파라미터 누락: uid' });
        return;
    }

    try {
        await admin.auth().deleteUser(uid);
        console.log(`[deleteAuthUser] Firebase Auth 계정 삭제 완료: ${uid}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[deleteAuthUser] 처리 오류:', error);
        res.status(500).json({ message: 'Firebase Auth 계정 삭제 실패: ' + error.message });
    }
});
