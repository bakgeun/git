// 결제 확인 메일 트리거(sendPaymentConfirmEmail) 테스트 — Firebase 없이 모의 객체로 실행
// 사용: node scripts/email-trigger-test.js functions/index.js  (npm 설치 불필요)
const Module = require('module');
const path = require('path');
const sent = []; const warns = [];
let logs = []; let users = {}; let authUsers = {};
const chain = () => new Proxy(function(){}, {
  get: (t, k) => (['onCreate','onRequest','onRun','onUpdate','onCall'].includes(k) ? (fn) => fn : chain()),
  apply: () => chain()
});
const query = (filters=[]) => ({
  where: (f, op, v) => query([...filters, [f, v]]),
  limit: () => query(filters),
  get: async () => { const docs = logs.filter(l => filters.every(([f,v]) => l[f]===v)).map(d=>({data:()=>d})); return {empty: !docs.length, docs}; },
  doc: (id) => ({ get: async () => ({ exists: !!users[id], data: () => users[id] }) }),
  add: async () => {}
});
const admin = {
  apps: [1], initializeApp(){},
  firestore: Object.assign(() => ({ collection: () => query() }), { FieldValue: { serverTimestamp: () => 'ts' } }),
  auth: () => ({ getUser: async (uid) => { if (!authUsers[uid]) throw new Error('no user'); return authUsers[uid]; } })
};
const mocks = {
  'firebase-functions/v1': chain(),
  'firebase-functions': { logger: { info(){}, error(){}, warn: (m, d) => warns.push(m) } },
  'firebase-functions/params': { defineSecret: () => ({ value: () => '' }) },
  'firebase-admin': admin,
  'nodemailer': { createTransport: () => ({ sendMail: async (m) => sent.push(m) }) }
};
const orig = Module._load;
Module._load = function (req, ...rest) { return req in mocks ? mocks[req] : orig.call(this, req, ...rest); };
process.env.GMAIL_USER = 'center@example.com'; process.env.GMAIL_APP_PASSWORD = 'x';
const fns = require(path.resolve(process.argv[2]));
const handler = fns.sendPaymentConfirmEmail;
const snap = (data) => ({ id: 'p1', data: () => data, ref: { update: async () => {} } });
let fail = 0;
const check = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) fail++; };
(async () => {
  users = { u1: { name: '홍길동', email: 'victim@evil.test' } };
  authUsers = { u1: { email: 'real@user.test' } };
  // 1) 승인 기록 없는 가짜 결제 → 발송 안 함
  logs = [];
  sent.length = 0;
  await handler(snap({ userId: 'u1', orderId: 'ORD1', status: 'completed', amount: 1, productName: 'x' }));
  check('승인 기록 없으면 발송 안 함', sent.length === 0);
  // 2) 다른 회원의 승인 기록 재사용 → 발송 안 함
  logs = [{ action: 'confirm_success', orderId: 'ORD1', uid: 'other', amount: 300000 }];
  await handler(snap({ userId: 'u1', orderId: 'ORD1', status: 'completed', amount: 1, productName: 'x' }));
  check('다른 회원 주문번호면 발송 안 함', sent.length === 0);
  // 3) 정상 결제 → Auth 이메일로, 승인 금액, 이스케이프
  logs = [{ action: 'confirm_success', orderId: 'ORD1', uid: 'u1', amount: 300000 }];
  users.u1.name = '<b>홍</b>';
  await handler(snap({ userId: 'u1', orderId: 'ORD1', status: 'completed', amount: 1, productName: '<a href="http://phish">클릭</a>\r\nBcc: x@y' }));
  check('정상 결제는 1건 발송', sent.length === 1);
  const m = sent[0] || {};
  check('받는 주소는 Auth 이메일', m.to === 'real@user.test');
  check('금액은 토스 승인 금액', (m.html||'').includes('300,000원') && !(m.html||'').includes('>1원'));
  check('상품명 HTML 이스케이프', !(m.html||'').includes('<a href') && (m.html||'').includes('&lt;a href'));
  check('이름 HTML 이스케이프', (m.html||'').includes('&lt;b&gt;홍'));
  check('제목에 줄바꿈 없음', !/[\r\n]/.test(m.subject||''));
  // 4) completed 아닌 상태
  sent.length = 0;
  await handler(snap({ userId: 'u1', orderId: 'ORD1', status: 'pending' }));
  check('completed 아니면 발송 안 함', sent.length === 0);
  console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
