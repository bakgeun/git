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

const functions = require('firebase-functions');
const fetch     = require('node-fetch');

const TOSS_API  = 'https://api.tosspayments.com/v1/payments';

// Firebase Secret Manager에서 SECRET_KEY 로드
// 배포 시: firebase functions:secrets:set TOSS_SECRET_KEY
// 로컬 시: functions/.env 파일에 TOSS_SECRET_KEY=test_sk_... 설정
function getSecretKey() {
    return process.env.TOSS_SECRET_KEY || '';
}

function basicAuth(secretKey) {
    return 'Basic ' + Buffer.from(secretKey + ':').toString('base64');
}

// Firebase Hosting rewrite를 통해 호출되므로 별도 CORS 불필요
// 직접 호출 시 대비하여 최소 헤더만 설정
function handleCors(req, res) {
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
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
        // 면세 처리: 토스페이먼츠에 면세사업자로 등록되어 있어 별도 파라미터 불필요
        const requestBody = { paymentKey, orderId, amount };

        const tossRes = await fetch(`${TOSS_API}/confirm`, {
            method: 'POST',
            headers: {
                'Authorization': basicAuth(secretKey),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
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
