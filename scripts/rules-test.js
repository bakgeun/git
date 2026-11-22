/**
 * 보안 규칙 테스트 (Firebase Rules 테스트 API 사용)
 *
 * 실제 계정·운영 데이터 없이, 가상 요청(일반 회원/관리자/공격자)을 보내
 * 로컬 firestore.rules / storage.rules 의 허용·거부 판정을 확인합니다.
 * 운영 DB와 Storage는 읽거나 쓰지 않으며, 배포된 규칙도 바꾸지 않습니다.
 * Java·에뮬레이터 없이 동작합니다.
 *
 * 사용법 (저장소 루트에서, firebase login 상태여야 함):
 *   node scripts/rules-test.js
 *
 * 규칙을 수정했다면 배포 전에 실행하고, 새 규칙에 맞는 테스트 케이스를 F(Firestore)·S(Storage)에 추가하세요.
 * 하나라도 실패하면 종료 코드 1을 반환합니다.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const G = execSync("npm root -g").toString().trim();
const { requireAuth } = require(path.join(G, "firebase-tools/lib/requireAuth"));
const { Client } = require(path.join(G, "firebase-tools/lib/apiv2"));
const { getGlobalDefaultAccount } = require(path.join(G, "firebase-tools/lib/auth"));

const P = JSON.parse(fs.readFileSync(path.join(ROOT, ".firebaserc"), "utf8")).projects.default;
const BK = fs.readFileSync(path.join(ROOT, "public/assets/js/config/firebase-config.js"), "utf8")
  .match(/storageBucket:\s*"([^"]+)"/)[1];
const fsPath=p=>`/databases/(default)/documents/${p}`;
// isAdmin mocks: exists/get on users/{uid}
const fsMocks=(admin)=>[
 {function:'exists',args:[{anyValue:{}}],result:{value:true}},
 {function:'get',args:[{anyValue:{}}],result:{value:{data:{userType:admin?'admin':'student'}}}}];
const stMocks=(admin)=>[
 {function:'firestore.exists',args:[{anyValue:{}}],result:{value:true}},
 {function:'firestore.get',args:[{anyValue:{}}],result:{value:{data:{userType:admin?'admin':'student'}}}}];
const F=[
 ['가입: 본인 문서를 student로 생성','ALLOW',{auth:{uid:'u1'},path:fsPath('users/u1'),method:'create',resource:{data:{email:'a@b.c',userType:'student'}}},null,false],
 ['가입: userType 없이 생성','ALLOW',{auth:{uid:'u1'},path:fsPath('users/u1'),method:'create',resource:{data:{email:'a@b.c'}}},null,false],
 ['공격: 본인 문서를 admin으로 생성','DENY',{auth:{uid:'u1'},path:fsPath('users/u1'),method:'create',resource:{data:{userType:'admin'}}},null,false],
 ['공격: 남의 문서 생성','DENY',{auth:{uid:'u1'},path:fsPath('users/u2'),method:'create',resource:{data:{userType:'student'}}},null,false],
 ['관리자: 회원 문서를 admin으로 생성','ALLOW',{auth:{uid:'ad'},path:fsPath('users/u2'),method:'create',resource:{data:{userType:'admin'}}},null,true],
 ['공격: student→admin 수정','DENY',{auth:{uid:'u1'},path:fsPath('users/u1'),method:'update',resource:{data:{userType:'admin'}}},{data:{userType:'student'}},false],
 ['공격: userType 없는 문서에 admin 추가','DENY',{auth:{uid:'u1'},path:fsPath('users/u1'),method:'update',resource:{data:{userType:'admin'}}},{data:{email:'x'}},false],
 ['정상: 본인 정보 수정','ALLOW',{auth:{uid:'u1'},path:fsPath('users/u1'),method:'update',resource:{data:{userType:'student',phone:'1'}}},{data:{userType:'student'}},false],
];
const sp=p=>`/b/${BK}/o/${p.endsWith("/")?p.slice(0,-1):p}`;
const own={metadata:{uploadedBy:'u1'}};
const S=[
 ['신청: 본인 증명사진 업로드','ALLOW',{auth:{uid:'u1'},path:sp('certificate-photos/app1/photo.jpg'),method:'create',resource:{name:'certificate-photos/app1/photo.jpg',contentType:'image/jpeg',size:200000,metadata:{uploadedBy:'u1'}}},null,false],
 ['신청: 업로드 직후 다운로드URL(본인 읽기)','ALLOW',{auth:{uid:'u1'},path:sp('certificate-photos/app1/photo.jpg'),method:'get'},own,false],
 ['공격: 남의 증명사진 읽기','DENY',{auth:{uid:'u2'},path:sp('certificate-photos/app1/photo.jpg'),method:'get'},own,false],
 ['공격: 증명사진 목록 조회','DENY',{auth:{uid:'u2'},path:sp('certificate-photos/'),method:'list'},null,false],
 ['공격: 남의 증명사진 덮어쓰기','DENY',{auth:{uid:'u2'},path:sp('certificate-photos/app1/photo.jpg'),method:'update',resource:{name:'x',contentType:'image/jpeg',size:1000,metadata:{uploadedBy:'u2'}}},own,false],
 ['공격: uploadedBy 위장 업로드','DENY',{auth:{uid:'u2'},path:sp('certificate-photos/app9/p.jpg'),method:'create',resource:{name:'x',contentType:'image/jpeg',size:1000,metadata:{uploadedBy:'u1'}}},null,false],
 ['공격: 이미지 아닌 파일','DENY',{auth:{uid:'u1'},path:sp('certificate-photos/app1/a.html'),method:'create',resource:{name:'x',contentType:'text/html',size:100,metadata:{uploadedBy:'u1'}}},null,false],
 ['정상: 본인 증명사진 다시 올리기(덮어쓰기)','ALLOW',{auth:{uid:'u1'},path:sp('certificate-photos/app1/photo.jpg'),method:'update',resource:{name:'x',contentType:'image/png',size:1000,metadata:{uploadedBy:'u1'}}},own,false],
 ['공격: 증명사진 5MB 초과','DENY',{auth:{uid:'u1'},path:sp('certificate-photos/app1/big.jpg'),method:'create',resource:{name:'x',contentType:'image/jpeg',size:6000000,metadata:{uploadedBy:'u1'}}},null,false],
 ['관리자: 증명사진 읽기','ALLOW',{auth:{uid:'ad'},path:sp('certificate-photos/app1/photo.jpg'),method:'get'},own,true],
 ['관리자: 증명사진 목록','ALLOW',{auth:{uid:'ad'},path:sp('certificate-photos/'),method:'list'},null,true],
 ['갱신: 본인 첨부 PDF 업로드','ALLOW',{auth:{uid:'u1'},path:sp('applications/r1/education_completion.pdf'),method:'create',resource:{name:'x',contentType:'application/pdf',size:300000,metadata:{uploadedBy:'u1'}}},null,false],
 ['갱신: 본인 첨부 다운로드URL','ALLOW',{auth:{uid:'u1'},path:sp('applications/r1/education_completion.pdf'),method:'get'},own,false],
 ['갱신: 실패 시 본인 파일 정리(삭제)','ALLOW',{auth:{uid:'u1'},path:sp('applications/r1/education_completion.pdf'),method:'delete'},own,false],
 ['공격: 남의 신청 첨부 읽기','DENY',{auth:{uid:'u2'},path:sp('applications/r1/education_completion.pdf'),method:'get'},own,false],
 ['관리자: 신청 첨부 읽기','ALLOW',{auth:{uid:'ad'},path:sp('applications/r1/education_completion.pdf'),method:'get'},own,true],
 ['공격: uploads/에 일반회원 업로드','DENY',{auth:{uid:'u1'},path:sp('uploads/x.png'),method:'create',resource:{name:'x',contentType:'image/png',size:100,metadata:{}}},null,false],
 ['관리자: 강의자료 업로드(형식검사)','ALLOW',{auth:{uid:'ad'},path:sp('materials/a.pdf'),method:'create',resource:{name:'x',contentType:'application/pdf',size:1000,metadata:{}}},null,true],
];
(async()=>{const acc=getGlobalDefaultAccount();if(!acc)throw new Error("firebase login 이 필요합니다");await requireAuth({user:acc.user,tokens:acc.tokens});const c=new Client({urlPrefix:'https://firebaserules.googleapis.com',apiVersion:'v1'});
 let fail=0;
 for(const [file,cases,mk] of [['firestore.rules',F,fsMocks],['storage.rules',S,stMocks]]){
  const testCases=cases.map(([n,exp,req,res,adm])=>({expectation:exp,request:req,...(res?{resource:res}:{}),functionMocks:mk(adm)}));
  const r=await c.post(`/projects/${P}:test`,{source:{files:[{name:file,content:fs.readFileSync(path.join(ROOT,file),'utf8')}]},testSuite:{testCases}});
  console.log('\n['+file+']');
  r.body.testResults.forEach((t,i)=>{const ok=t.state==='SUCCESS';if(!ok)fail++;console.log((ok?'✅':'❌'),cases[i][1].padEnd(5),cases[i][0],ok?'':JSON.stringify(t.debugMessages||t.errorPosition||t))});
 }
 console.log('\n실패:',fail);process.exitCode=fail?1:0;})().catch(e=>{console.error('ERR',e.message,JSON.stringify(e.context?.body||'').slice(0,800));process.exitCode=1;});
