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
 *
 * 헬스체크:
 *   GET /api/health → 200 OK (Firestore 연결 확인 포함)
 *
 * Firestore 자동 백업:
 *   scheduledBackup 함수가 매일 오전 3시(KST)에 실행됩니다.
 *   사전 준비: Cloud Storage 버킷 생성 및 서비스 계정 권한 부여
 *     gcloud storage buckets create gs://digital-healthcare-cente-2204b-backups --location=asia-northeast3
 *     gcloud projects add-iam-policy-binding digital-healthcare-cente-2204b \
 *       --member="serviceAccount:digital-healthcare-cente-2204b@appspot.gserviceaccount.com" \
 *       --role="roles/datastore.importExportAdmin"
 *     gcloud storage buckets add-iam-policy-binding gs://digital-healthcare-cente-2204b-backups \
 *       --member="serviceAccount:digital-healthcare-cente-2204b@appspot.gserviceaccount.com" \
 *       --role="roles/storage.admin"
 */

const functions = require('firebase-functions/v1');
const { logger } = require('firebase-functions');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
if (!admin.apps.length) {
    admin.initializeApp();
}

const tossSecretKey = defineSecret('TOSS_SECRET_KEY');

const TOSS_API = 'https://api.tosspayments.com/v1/payments';

// =============================================================
// 감사 로그 헬퍼
// _payment_logs 컬렉션에 결제 이벤트를 기록합니다.
// =============================================================
async function writePaymentLog(action, data) {
    try {
        await admin.firestore().collection('_payment_logs').add({
            action,
            ...data,
            loggedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        logger.error('[writePaymentLog] 감사 로그 기록 실패', { error: e.message });
    }
}

// payments + enrollments 상태 동기화 (orderId 또는 paymentKey 기준)
// targetStatus: 'cancelled'(기본) 또는 'refunded'(관리자 환불)
async function syncCancelledStatus(orderId, paymentKey, targetStatus = 'cancelled') {
    const db = admin.firestore();
    const now = new Date();
    const batch = db.batch();
    let hasUpdates = false;

    // payments 컬렉션 조회
    let snap = null;
    if (orderId) {
        snap = await db.collection('payments').where('orderId', '==', orderId).get();
    }
    if ((!snap || snap.empty) && paymentKey) {
        snap = await db.collection('payments').where('paymentKey', '==', paymentKey).get();
    }
    if (snap && !snap.empty) {
        snap.docs.forEach(doc => {
            batch.update(doc.ref, { status: targetStatus, cancelledAt: now });
            hasUpdates = true;
        });
    }

    // enrollments 컬렉션 조회
    if (orderId) {
        const enrollSnap = await db.collection('enrollments').where('orderId', '==', orderId).get();
        if (!enrollSnap.empty) {
            enrollSnap.docs.forEach(doc => {
                batch.update(doc.ref, { status: targetStatus, cancelledAt: now });
                hasUpdates = true;
            });
        }
    }

    // payments + enrollments를 단일 배치로 원자적 커밋
    if (hasUpdates) {
        await batch.commit();
        logger.info('[syncCancelledStatus] 배치 커밋 완료', { orderId, targetStatus });
    }
}

function getSecretKey() {
    return tossSecretKey.value() || '';
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
// headers: { Authorization: 'Bearer <idToken>' }
// body: { paymentKey, orderId, amount }
// =============================================================
exports.confirmPayment = functions.runWith({ secrets: ['TOSS_SECRET_KEY'] }).https.onRequest(async (req, res) => {
    if (handleAdminCors(req, res)) return;
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    // Firebase ID 토큰 검증
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
    }
    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
        res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
        return;
    }

    const { paymentKey, orderId, amount } = req.body;

    if (!paymentKey || !orderId || !amount) {
        res.status(400).json({ message: '필수 파라미터 누락: paymentKey, orderId, amount' });
        return;
    }

    // 클라이언트가 보낸 amount를 Firestore 기록과 대조 (금액 위변조 방지)
    try {
        const pendingRef = admin.firestore().collection('_pending_payments').doc(orderId);
        const pendingDoc = await pendingRef.get();
        if (!pendingDoc.exists) {
            logger.warn('[confirmPayment] 결제 검증 레코드 없음', { orderId });
            res.status(400).json({ message: '결제 정보를 찾을 수 없습니다. 다시 시도해주세요.' });
            return;
        }
        const pendingData = pendingDoc.data();
        if (pendingData.userId !== decoded.uid) {
            logger.warn('[confirmPayment] 결제 소유자 불일치', { orderId, claimant: decoded.uid });
            res.status(403).json({ message: '결제 정보가 일치하지 않습니다.' });
            return;
        }
        if (pendingData.amount !== amount) {
            logger.warn('[confirmPayment] 금액 불일치', {
                orderId, expected: pendingData.amount, received: amount
            });
            res.status(400).json({ message: '결제 금액이 올바르지 않습니다.' });
            return;
        }
        // 검증 완료 후 임시 레코드 삭제
        await pendingRef.delete();
    } catch (verifyErr) {
        logger.error('[confirmPayment] 금액 검증 오류', { orderId, error: verifyErr.message });
        res.status(500).json({ message: '결제 검증 중 오류가 발생했습니다.' });
        return;
    }

    const secretKey = getSecretKey();
    if (!secretKey) {
        logger.error('[confirmPayment] TOSS_SECRET_KEY가 설정되지 않았습니다.');
        res.status(500).json({ message: '서버 설정 오류 - 관리자에게 문의하세요.' });
        return;
    }

    // 멱등성 검사: 이미 완료된 결제인지 확인
    try {
        const existing = await admin.firestore()
            .collection('payments')
            .where('orderId', '==', orderId)
            .where('status', '==', 'completed')
            .limit(1)
            .get();

        if (!existing.empty) {
            logger.info('[confirmPayment] 이미 처리된 결제, 멱등 응답 반환', { orderId });
            res.status(200).json({ success: true, alreadyProcessed: true });
            return;
        }
    } catch (idempotencyErr) {
        logger.error('[confirmPayment] 멱등성 검사 오류', { orderId, error: idempotencyErr.message });
        // 검사 실패 시에도 결제 진행 (최악의 경우 중복 방지 실패, 웹훅으로 보완)
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
            logger.error('[confirmPayment] 토스 API 오류', {
                orderId,
                status: tossRes.status,
                code: result.code,
                message: result.message
            });
            await writePaymentLog('confirm_failed', {
                orderId,
                uid: decoded.uid,
                tossStatus: tossRes.status,
                errorCode: result.code
            });
        } else {
            logger.info('[confirmPayment] 결제 승인 완료', {
                orderId,
                tossStatus: result.status,
                amount: result.totalAmount
            });
            await writePaymentLog('confirm_success', {
                orderId,
                uid: decoded.uid,
                tossStatus: result.status,
                amount: result.totalAmount
            });
        }

        res.status(tossRes.status).json(result);

    } catch (error) {
        logger.error('[confirmPayment] 처리 오류', { orderId, error: error.message });
        await writePaymentLog('confirm_error', { orderId, uid: decoded.uid, error: error.message });
        res.status(500).json({ message: '결제 승인 중 서버 오류가 발생했습니다.' });
    }
});

// =============================================================
// 결제 취소 (관리자 전용)
// POST /api/cancelPayment
// headers: { Authorization: 'Bearer <idToken>' }
// body: { paymentKey, cancelReason, cancelAmount?, targetStatus? }
// =============================================================
exports.cancelPayment = functions.runWith({ secrets: ['TOSS_SECRET_KEY'] }).https.onRequest(async (req, res) => {
    if (handleAdminCors(req, res)) return;
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    // Firebase ID 토큰 검증
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
        res.status(401).json({ message: '인증이 필요합니다.' });
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
    if (!callerDoc.exists || callerDoc.data().userType !== 'admin') {
        res.status(403).json({ message: '관리자 권한이 필요합니다.' });
        return;
    }

    const { paymentKey, cancelReason, cancelAmount } = req.body;
    // targetStatus는 화이트리스트로만 허용 (기본: cancelled)
    const allowedTargets = ['cancelled', 'refunded'];
    const targetStatus = allowedTargets.includes(req.body.targetStatus)
        ? req.body.targetStatus
        : 'cancelled';

    if (!paymentKey || !cancelReason) {
        res.status(400).json({ message: '필수 파라미터 누락: paymentKey, cancelReason' });
        return;
    }

    const secretKey = getSecretKey();
    if (!secretKey) {
        logger.error('[cancelPayment] TOSS_SECRET_KEY가 설정되지 않았습니다.');
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
            logger.error('[cancelPayment] 토스 API 오류', {
                paymentKey,
                status: tossRes.status,
                code: result.code
            });
            await writePaymentLog('cancel_failed', {
                paymentKey,
                adminUid: decoded.uid,
                cancelReason,
                tossStatus: tossRes.status,
                errorCode: result.code
            });
        } else {
            // 취소 성공 시 Firestore payments / enrollments 상태 동기화
            try {
                await syncCancelledStatus(result.orderId, paymentKey, targetStatus);
            } catch (syncErr) {
                logger.error('[cancelPayment] Firestore 동기화 오류', {
                    orderId: result.orderId,
                    error: syncErr.message
                });
            }
            logger.info('[cancelPayment] 취소 완료', {
                orderId: result.orderId,
                paymentKey,
                targetStatus
            });
            await writePaymentLog('cancel_success', {
                orderId: result.orderId,
                paymentKey,
                adminUid: decoded.uid,
                cancelReason,
                cancelAmount: cancelAmount || null,
                targetStatus
            });
        }

        res.status(tossRes.status).json(result);

    } catch (error) {
        logger.error('[cancelPayment] 처리 오류', { paymentKey, error: error.message });
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
    if (!callerDoc.exists || callerDoc.data().userType !== 'admin') {
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
        logger.info('[deleteAuthUser] Firebase Auth 계정 삭제 완료', { targetUid: uid, adminUid: decoded.uid });
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('[deleteAuthUser] 처리 오류', { targetUid: uid, error: error.message });
        res.status(500).json({ message: 'Firebase Auth 계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    }
});


// =============================================================
// 헬스체크
// GET /api/health
// Firestore 연결 상태를 포함한 서비스 상태를 반환합니다.
// 외부 업타임 모니터(UptimeRobot 등)에서 이 엔드포인트를 주기적으로 호출하세요.
// =============================================================
exports.healthCheck = functions.runWith({ secrets: ['TOSS_SECRET_KEY'] }).https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const startTime = Date.now();
    const checks = {};

    // Firestore 연결 확인
    try {
        await admin.firestore()
            .collection('_health')
            .doc('ping')
            .set({ checkedAt: admin.firestore.FieldValue.serverTimestamp() });
        checks.firestore = 'ok';
    } catch (e) {
        checks.firestore = 'error';
        logger.error('[healthCheck] Firestore 연결 실패', { error: e.message });
    }

    // Toss Secret Key 설정 확인
    checks.tossSecretKey = getSecretKey() ? 'configured' : 'missing';

    const allOk = Object.values(checks).every(v => v === 'ok' || v === 'configured');
    const statusCode = allOk ? 200 : 503;

    res.status(statusCode).json({
        status: allOk ? 'ok' : 'degraded',
        checks,
        responseTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
    });
});

// =============================================================
// Firestore 정기 백업 (매일 오전 3시 KST)
// Cloud Storage 버킷에 주요 컬렉션을 내보냅니다.
//
// 사전 준비 (최초 1회):
//   1. 버킷 생성:
//      gcloud storage buckets create gs://digital-healthcare-cente-2204b-backups \
//        --location=asia-northeast3
//   2. 서비스 계정에 권한 부여:
//      gcloud projects add-iam-policy-binding digital-healthcare-cente-2204b \
//        --member="serviceAccount:digital-healthcare-cente-2204b@appspot.gserviceaccount.com" \
//        --role="roles/datastore.importExportAdmin"
//      gcloud storage buckets add-iam-policy-binding gs://digital-healthcare-cente-2204b-backups \
//        --member="serviceAccount:digital-healthcare-cente-2204b@appspot.gserviceaccount.com" \
//        --role="roles/storage.admin"
// =============================================================
exports.scheduledBackup = functions.pubsub
    .schedule('0 3 * * *')
    .timeZone('Asia/Seoul')
    .onRun(async () => {
        const projectId = process.env.GCLOUD_PROJECT
            || JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;
        const bucket = `gs://${projectId}-backups`;
        const timestamp = new Date().toISOString().split('T')[0];

        try {
            // GCE 메타데이터 서버에서 액세스 토큰 획득 (Cloud Functions 환경에서 자동 제공)
            const tokenRes = await fetch(
                'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
                { headers: { 'Metadata-Flavor': 'Google' } }
            );
            if (!tokenRes.ok) {
                throw new Error('메타데이터 서버에서 토큰 획득 실패');
            }
            const { access_token } = await tokenRes.json();

            const exportRes = await fetch(
                `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):exportDocuments`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        outputUriPrefix: `${bucket}/${timestamp}`,
                        collectionIds: [
                            'users',
                            'payments',
                            'enrollments',
                            'certificates',
                            'applications',
                            'pending_applications',
                            '_payment_logs'
                        ]
                    })
                }
            );

            if (!exportRes.ok) {
                const err = await exportRes.json();
                logger.error('[scheduledBackup] Firestore 백업 실패', {
                    projectId,
                    bucket,
                    error: err.error?.message || JSON.stringify(err)
                });
                return;
            }

            const operation = await exportRes.json();
            logger.info('[scheduledBackup] Firestore 백업 시작됨', {
                bucket: `${bucket}/${timestamp}`,
                operationName: operation.name
            });

        } catch (err) {
            logger.error('[scheduledBackup] 백업 오류', { projectId, error: err.message });
        }
    });

// =============================================================
// 관리자 공지 이메일 발송 (관리자 전용)
// POST /api/sendAdminEmail
// headers: { Authorization: 'Bearer <idToken>' }
// body: { subject, body, targets: [{email, name}] }
// targets 배열은 최대 500개로 제한합니다.
// users/{uid}.emailOptOut === true 인 사용자는 자동 제외됩니다.
// =============================================================

// bodyHtml: Quill 에디터에서 생성된 HTML (관리자 전용 엔드포인트이므로 XSS 위험 허용)
function buildAdminEmailHtml(recipientName, subject, bodyHtml) {
    const safeBody = bodyHtml || '';

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'맑은 고딕','Malgun Gothic',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

      <!-- 헤더 -->
      <tr>
        <td style="background:#1e3a5f;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#a8c4e0;font-size:13px;letter-spacing:1px;">MUNGYEONG DIGITAL HEALTHCARE CENTER</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">문경 부설 디지털헬스케어센터</h1>
        </td>
      </tr>

      <!-- 제목 -->
      <tr>
        <td style="padding:32px 40px 20px;border-bottom:1px solid #eef0f3;">
          <p style="margin:0 0 6px;color:#666;font-size:13px;">안녕하세요, <strong>${recipientName}</strong>님.</p>
          <h2 style="margin:0;color:#1a1a1a;font-size:20px;font-weight:700;">${subject}</h2>
        </td>
      </tr>

      <!-- 본문 -->
      <tr>
        <td style="padding:28px 40px 36px;">
          <p style="margin:0;color:#444;font-size:15px;line-height:1.8;">${safeBody}</p>
        </td>
      </tr>

      <!-- 문의처 -->
      <tr>
        <td style="padding:0 40px 28px;">
          <table width="100%" cellpadding="16" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #eef0f3;">
            <tr>
              <td>
                <p style="margin:0 0 6px;color:#1e3a5f;font-size:13px;font-weight:700;">📞 문의처</p>
                <p style="margin:0;color:#555;font-size:13px;line-height:1.8;">
                  전화: 010-2596-2233<br>
                  이메일: nhohs1507@gmail.com<br>
                  운영시간: 평일 09:00 ~ 18:00
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 푸터 -->
      <tr>
        <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #eef0f3;text-align:center;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.8;">
            본 이메일은 디지털헬스케어센터 회원에게 발송되는 공지 메일입니다.<br>
            수신 거부를 원하시면 <a href="mailto:nhohs1507@gmail.com" style="color:#1e3a5f;">nhohs1507@gmail.com</a>으로 연락해 주세요.<br>
            문경 부설 디지털헬스케어센터 | nhohs1507@gmail.com
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

exports.sendAdminEmail = functions.https.onRequest(async (req, res) => {
    if (handleAdminCors(req, res)) return;
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    // ID 토큰 검증
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
        res.status(401).json({ message: '인증이 필요합니다.' });
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
    if (!callerDoc.exists || callerDoc.data().userType !== 'admin') {
        res.status(403).json({ message: '관리자 권한이 필요합니다.' });
        return;
    }

    const { subject, body, targets, cc, bcc, attachments } = req.body;
    if (!subject || !body || !Array.isArray(targets) || targets.length === 0) {
        res.status(400).json({ message: '필수 파라미터 누락: subject, body, targets(배열)' });
        return;
    }
    if (targets.length > 500) {
        res.status(400).json({ message: '한 번에 발송 가능한 최대 수신자는 500명입니다.' });
        return;
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (!gmailUser || !gmailPass) {
        logger.warn('[sendAdminEmail] GMAIL 환경변수 미설정 — 발송 불가');
        res.status(500).json({ message: '이메일 서버 설정이 완료되지 않았습니다. 관리자에게 문의하세요.' });
        return;
    }

    // 첨부파일 구성 (base64 → Buffer)
    const builtAttachments = Array.isArray(attachments) && attachments.length > 0
        ? attachments.map(a => ({
            filename: a.filename,
            content: Buffer.from(a.content, 'base64'),
            contentType: a.contentType || 'application/octet-stream'
        }))
        : [];

    // CC/BCC 문자열 배열 처리
    const ccList = Array.isArray(cc) ? cc.filter(Boolean) : [];
    const bccList = Array.isArray(bcc) ? bcc.filter(Boolean) : [];
    logger.info('[sendAdminEmail] CC/BCC 수신 확인', { ccList, bccList });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass }
    });

    let successCount = 0;
    let failCount = 0;

    for (const recipient of targets) {
        if (!recipient.email) { failCount++; continue; }
        try {
            const mailOptions = {
                from: `"문경 부설 디지털헬스케어센터" <${gmailUser}>`,
                to: recipient.email,
                subject,
                html: buildAdminEmailHtml(recipient.name || '회원', subject, body)
            };
            if (ccList.length > 0) mailOptions.cc = ccList.join(', ');
            if (bccList.length > 0) mailOptions.bcc = bccList.join(', ');
            if (builtAttachments.length > 0) mailOptions.attachments = builtAttachments;

            await transporter.sendMail(mailOptions);
            successCount++;
        } catch (err) {
            failCount++;
            logger.warn('[sendAdminEmail] 개별 발송 실패', { email: recipient.email, error: err.message });
        }
    }

    // 발송 이력 기록
    try {
        await admin.firestore().collection('_email_logs').add({
            type: 'admin_notice',
            subject,
            totalCount: targets.length,
            successCount,
            failCount,
            adminUid: decoded.uid,
            sentAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        logger.error('[sendAdminEmail] 이력 기록 실패', { error: e.message });
    }

    logger.info('[sendAdminEmail] 발송 완료', {
        adminUid: decoded.uid,
        total: targets.length,
        successCount,
        failCount
    });

    res.status(200).json({ success: true, totalCount: targets.length, successCount, failCount });
});

// =============================================================
// 결제 완료 확인 이메일 자동 발송
// payments 컬렉션에 문서가 생성되면 자동 트리거
// 사전 설정: functions/.env 에 GMAIL_USER, GMAIL_APP_PASSWORD 추가
// =============================================================

function buildEmailHtml(recipientName, payment, formattedDate, formattedAmount) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>교육과정 신청 완료</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'맑은 고딕','Malgun Gothic',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

      <!-- 헤더 -->
      <tr>
        <td style="background:#1e3a5f;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#a8c4e0;font-size:13px;letter-spacing:1px;">MUNGYEONG DIGITAL HEALTHCARE CENTER</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">문경 부설 디지털헬스케어센터</h1>
        </td>
      </tr>

      <!-- 타이틀 -->
      <tr>
        <td style="padding:36px 40px 24px;border-bottom:1px solid #eef0f3;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#e8f4e8;border-radius:50%;width:48px;height:48px;text-align:center;vertical-align:middle;">
                <span style="font-size:24px;">✓</span>
              </td>
              <td style="padding-left:16px;">
                <p style="margin:0;color:#666;font-size:13px;">교육과정 신청이 완료되었습니다</p>
                <h2 style="margin:4px 0 0;color:#1a1a1a;font-size:20px;font-weight:700;">결제가 완료되었습니다</h2>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;color:#444;font-size:15px;line-height:1.7;">
            안녕하세요, <strong>${recipientName}</strong>님.<br>
            교육과정 신청 및 결제가 정상적으로 완료되었습니다.<br>
            교육 시작 전 별도로 안내 문자를 발송해 드리겠습니다.
          </p>
        </td>
      </tr>

      <!-- 결제 정보 -->
      <tr>
        <td style="padding:28px 40px;">
          <h3 style="margin:0 0 16px;color:#1e3a5f;font-size:15px;font-weight:700;border-left:4px solid #1e3a5f;padding-left:12px;">결제 정보</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef0f3;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <td style="padding:12px 20px;color:#666;font-size:13px;width:130px;">주문번호</td>
              <td style="padding:12px 20px;color:#1a1a1a;font-size:13px;font-weight:600;">${payment.orderId}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;color:#666;font-size:13px;border-top:1px solid #eef0f3;">교육과정</td>
              <td style="padding:12px 20px;color:#1a1a1a;font-size:13px;font-weight:600;border-top:1px solid #eef0f3;">${payment.productName}</td>
            </tr>
            <tr style="background:#f8fafc;">
              <td style="padding:12px 20px;color:#666;font-size:13px;border-top:1px solid #eef0f3;">결제방법</td>
              <td style="padding:12px 20px;color:#1a1a1a;font-size:13px;border-top:1px solid #eef0f3;">${payment.paymentMethod || '신용카드'}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;color:#666;font-size:13px;border-top:1px solid #eef0f3;">결제일시</td>
              <td style="padding:12px 20px;color:#1a1a1a;font-size:13px;border-top:1px solid #eef0f3;">${formattedDate}</td>
            </tr>
            <tr style="background:#e8f4fd;">
              <td style="padding:14px 20px;color:#1e3a5f;font-size:14px;font-weight:700;border-top:2px solid #1e3a5f;">결제금액</td>
              <td style="padding:14px 20px;color:#1e3a5f;font-size:18px;font-weight:700;border-top:2px solid #1e3a5f;">${formattedAmount}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 다음 단계 -->
      <tr>
        <td style="padding:0 40px 28px;">
          <h3 style="margin:0 0 16px;color:#1e3a5f;font-size:15px;font-weight:700;border-left:4px solid #1e3a5f;padding-left:12px;">다음 단계</h3>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;">
                <span style="display:inline-block;background:#1e3a5f;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">1</span>
                <span style="color:#444;font-size:14px;">교육 시작 전 담당자가 안내 문자를 발송해 드립니다.</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <span style="display:inline-block;background:#1e3a5f;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">2</span>
                <span style="color:#444;font-size:14px;">교육 수료 후 자격증 발급이 진행됩니다.</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <span style="display:inline-block;background:#1e3a5f;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">3</span>
                <span style="color:#444;font-size:14px;">문의사항은 아래 연락처로 언제든지 문의해 주세요.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 문의처 -->
      <tr>
        <td style="padding:0 40px 36px;">
          <table width="100%" cellpadding="16" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #eef0f3;">
            <tr>
              <td>
                <p style="margin:0 0 6px;color:#1e3a5f;font-size:13px;font-weight:700;">📞 문의처</p>
                <p style="margin:0;color:#555;font-size:13px;line-height:1.8;">
                  전화: 010-2596-2233<br>
                  이메일: nhohs1507@gmail.com<br>
                  운영시간: 평일 09:00 ~ 18:00
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 푸터 -->
      <tr>
        <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #eef0f3;text-align:center;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.8;">
            본 이메일은 발신 전용입니다. 답장을 보내도 확인이 어렵습니다.<br>
            문경 부설 디지털헬스케어센터 | nhohs1507@gmail.com
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

exports.sendPaymentConfirmEmail = functions.firestore
    .document('payments/{paymentId}')
    .onCreate(async (snap) => {
        const payment = snap.data();

        if (payment.status !== 'completed') return null;

        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD;
        if (!gmailUser || !gmailPass) {
            logger.warn('[sendPaymentConfirmEmail] GMAIL 환경변수 미설정 — 이메일 발송 건너뜀');
            return null;
        }

        try {
            // 사용자 이메일/이름 조회
            const userDoc = await admin.firestore().collection('users').doc(payment.userId).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            const recipientEmail = userData.email;
            const recipientName = userData.displayName || userData.name || '고객';

            if (!recipientEmail) {
                logger.warn('[sendPaymentConfirmEmail] 수신자 이메일 없음', { userId: payment.userId });
                return null;
            }

            // 날짜/금액 포맷
            const paymentDate = payment.createdAt?.toDate
                ? payment.createdAt.toDate()
                : new Date(payment.paidAt || Date.now());
            const pad = (n) => String(n).padStart(2, '0');
            const formattedDate =
                `${paymentDate.getFullYear()}년 ${paymentDate.getMonth() + 1}월 ${paymentDate.getDate()}일 ` +
                `${pad(paymentDate.getHours())}:${pad(paymentDate.getMinutes())}`;
            const formattedAmount = `${Number(payment.amount).toLocaleString()}원`;

            // 이메일 발송
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: gmailUser, pass: gmailPass }
            });

            await transporter.sendMail({
                from: `"문경 부설 디지털헬스케어센터" <${gmailUser}>`,
                to: recipientEmail,
                subject: `[신청 완료] ${payment.productName} 교육과정 신청이 완료되었습니다`,
                html: buildEmailHtml(recipientName, payment, formattedDate, formattedAmount)
            });

            logger.info('[sendPaymentConfirmEmail] 발송 완료', {
                to: recipientEmail,
                orderId: payment.orderId
            });

            // 발송 시각 기록
            await snap.ref.update({
                confirmEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            logger.error('[sendPaymentConfirmEmail] 발송 오류', {
                orderId: payment.orderId,
                error: error.message
            });
        }

        return null;
    });
