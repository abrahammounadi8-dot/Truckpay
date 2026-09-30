/* eslint-disable @typescript-eslint/no-require-imports -- standalone test harness for real Next route modules */
const fs=require('fs');
const Module=require('module');
const assert=require('node:assert/strict');
const root=require('path').resolve(__dirname,'..').replaceAll('\\','/');
const ts=require(root+'/node_modules/typescript');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...rest){if(request.startsWith('@/'))request=root+'/src/'+request.slice(2);return resolve.call(this,request,parent,...rest);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);

(async()=>{
 const {DatabaseSync}=require('node:sqlite');
 const {randomBytes}=require('node:crypto');
 const {PGlite}=require(root+'/node_modules/@electric-sql/pglite');
 const {createLocalAuth}=require(root+'/src/lib/auth/config.ts');
 const mail=[];
 const origin='http://127.0.0.1:43217';
 const auth=await createLocalAuth({database:new DatabaseSync(':memory:'),secret:randomBytes(48).toString('hex'),baseURL:origin,deliver:async message=>mail.push(message)});
 const db=new PGlite();
 await db.exec(fs.readFileSync(root+'/src/lib/persistence/migrations/001-documents.sql','utf8'));
 for(const name of ['003-publication-review.sql','004-publication-source.sql','005-publication-identity-controls.sql'])await db.exec(fs.readFileSync(root+'/src/lib/persistence/migrations/'+name,'utf8'));
 const adapter={query:async(sql,params)=>{const r=await db.query(sql,params);return {rows:r.rows,rowCount:r.affectedRows??null};}};
 adapter.connect=async()=>({...adapter,release:()=>{}});
 let requestHeaders=new Headers();
 const load=Module._load;
 Module._load=function(request,parent,...rest){
  if(request==='server-only')return {};
  if(request==='next/headers')return {headers:async()=>requestHeaders};
  if(request==='@/lib/auth/server')return {getLocalAuth:async()=>auth,localAuthOrigin:origin};
  if(request==='@/lib/persistence/database')return {database:()=>adapter,usesDatabase:()=>true};
  return load.call(this,request,parent,...rest);
 };
 process.env.NODE_ENV='development';
 const list=require(root+'/src/app/api/payslips/route.ts');
 const item=require(root+'/src/app/api/payslips/[id]/route.ts');
 const profile=require(root+'/src/app/api/profile/route.ts');
 const wipe=require(root+'/src/app/api/session/route.ts');
 async function login(email){
  assert.equal((await auth.handler(new Request(origin+'/api/auth/sign-in/magic-link',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email,callbackURL:'/account'})}))).status,200);
  const response=await auth.handler(new Request(mail.at(-1).url));
  return response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 }
 async function run(handler,method,cookie='',body,context,requestOrigin=origin,extraHeaders={}){
  requestHeaders=new Headers({cookie,origin:requestOrigin,'content-type':'application/json',...extraHeaders});
  return handler(new Request(origin+'/api/test',{method,headers:requestHeaders,body:body?JSON.stringify(body):undefined}),context);
 }
 try {
  assert.equal((await run(list.GET,'GET','tp_uid=00000000-0000-4000-8000-000000000001')).status,401);
  const a=await login('a-routes@example.test'), b=await login('b-routes@example.test');
  const aSession=await auth.api.getSession({headers:new Headers({cookie:a})});
  const bSession=await auth.api.getSession({headers:new Headers({cookie:b})});
  const extract=require(root+'/src/app/api/payslips/extract/route.ts');
  for(const [handler,method] of [[list.POST,'POST'],[profile.PUT,'PUT'],[extract.POST,'POST']]) {
   const oversized={'content-length':String(10*1024*1024)};
   assert.equal((await run(handler,method,'',{},undefined,origin,oversized)).status,401);
   const response=await run(handler,method,a,{},undefined,origin,oversized);
   assert.equal(response.status,413);
   assert.match(response.headers.get('cache-control'),/no-store/);
  }
  const reports=require(root+'/src/app/api/reports/route.ts');
  assert.equal((await run(reports.POST,'POST','',{},undefined,origin,{'content-length':'65537'})).status,413);
  const sharing=require(root+'/src/app/api/statistics-sharing/route.ts');
  const catalogue=require(root+'/src/app/api/companies/route.ts');
  assert.equal((await catalogue.GET()).status,200);
  const publicBaseline=await (await catalogue.GET()).json();
  const {STATISTICS_NOTICE_VERSION}=require(root+'/src/lib/payroll/statistics-sharing.ts');
  const sharingBody={enabled:true,noticeVersion:STATISTICS_NOTICE_VERSION,userId:bSession.user.id};
  assert.equal((await run(sharing.PUT,'PUT','',sharingBody)).status,401);
  assert.equal((await run(sharing.PUT,'PUT',a,sharingBody,undefined,'https://attacker.invalid')).status,403);
  assert.equal((await run(sharing.PUT,'PUT',a,{enabled:true,noticeVersion:'old'})).status,400);
  assert.equal((await run(sharing.PUT,'PUT',a,{enabled:true,noticeVersion:'2026-09-28'})).status,400);
  assert.equal((await run(sharing.PUT,'PUT',a,{enabled:'true',noticeVersion:STATISTICS_NOTICE_VERSION})).status,400);
  assert.equal((await run(sharing.PUT,'PUT',a,sharingBody)).status,200);
  assert.equal((await (await run(profile.GET,'GET',a)).json()).profile.statisticsSharing.enabled,true);
  assert.equal((await (await run(profile.GET,'GET',b)).json()).profile,null);
  assert.equal((await db.query('SELECT user_id FROM truckpay_publication_identities')).rows.length,0,'consent never self-attests a distinct person');
  const employment=require(root+'/src/app/api/employment-start/route.ts');
  const {issueAmountReceipt,amountSnapshot}=require(root+'/src/lib/payroll/amount-review.ts');
  const {parsePayslipInput}=require(root+'/src/lib/payroll/parse.ts');
  const payload={userId:bSession.user.id,employerName:'Synthetic Haulage',paymentDate:'2026-09-11',payPeriodStart:'2026-09-05',payPeriodEnd:'2026-09-11',grossPay:900,netPay:700,basicHours:40,basicPay:900,deductions:[],allowances:[]};
  assert.equal((await run(list.POST,'POST',a,payload)).status,403);
  assert.equal((await run(employment.PUT,'PUT',a,{employerName:payload.employerName,startMonth:'2026-01'})).status,200);
  const parsed=parsePayslipInput(payload).input;
  assert.ok(parsed);
  const amountReceipt=issueAmountReceipt(aSession.user.id,amountSnapshot(parsed,parsed.deductions,parsed.allowances));
  assert.equal((await run(list.POST,'POST',b,{...payload,amountReceipt})).status,403);
  const saved=await run(list.POST,'POST',a,{...payload,amountReceipt});
  assert.equal(saved.status,201);
  const aResponse=await run(list.GET,'GET',a);
  assert.match(aResponse.headers.get('cache-control'), /no-store/);
  const aList=await aResponse.json();
  assert.equal(aList.payslips.length,1);
  const id=aList.payslips[0].id;
  const owner=(await db.query('SELECT user_id FROM truckpay_documents WHERE id=$1',[id])).rows[0].user_id;
  assert.equal(owner,aSession.user.id);
  assert.equal((await (await run(list.GET,'GET',b)).json()).payslips.length,0);
  const context={params:Promise.resolve({id})};
  assert.equal((await run(item.GET,'GET',b,undefined,context)).status,404);
  assert.equal((await run(item.DELETE,'DELETE',b,undefined,context)).status,404);
  assert.equal((await run(item.DELETE,'DELETE',a,undefined,context,'https://attacker.invalid')).status,403);
  assert.equal((await run(profile.PUT,'PUT',a,{employerName:'Synthetic Haulage',startDate:'2026-01-01'})).status,200);
  assert.equal((await (await run(profile.GET,'GET',a)).json()).profile.statisticsSharing.enabled,true);
  const syntheticPerson='10000000-0000-4000-8000-000000000099';
  await db.query("INSERT INTO truckpay_publication_identities(user_id,person_key,reviewer_reference) VALUES($1::uuid,$2::uuid,'synthetic-review')",[aSession.user.id,syntheticPerson]);
  await db.query("INSERT INTO truckpay_publication_reviews(id,employer_slug,period_start,period_end,fingerprint,proposal,reviewer_reference) VALUES('route-test','synthetic-haulage','2025-01-01','2025-03-31','synthetic','{}','synthetic')");
  await db.query("INSERT INTO truckpay_publication_review_people(person_key,review_id) VALUES($1,'route-test')",[syntheticPerson]);
  assert.equal((await db.query("SELECT invalidated_at FROM truckpay_publication_reviews WHERE id='route-test'")).rows[0].invalidated_at,null);
  assert.equal((await run(sharing.PUT,'PUT',a,{enabled:false})).status,200);
  assert.ok((await db.query("SELECT invalidated_at FROM truckpay_publication_reviews WHERE id='route-test'")).rows[0].invalidated_at,'actual withdrawal route invalidates its pending review');
  assert.equal((await run(profile.PUT,'PUT',a,{employerName:'Synthetic Haulage',statisticsSharing:{enabled:true,noticeVersion:STATISTICS_NOTICE_VERSION}})).status,200);
  assert.equal((await (await run(profile.GET,'GET',a)).json()).profile.statisticsSharing.enabled,false);
  assert.equal((await catalogue.GET()).status,200);
  assert.deepEqual(await (await catalogue.GET()).json(),publicBaseline,'private payroll and withdrawn consent must not change public output');
  const companyRoute=require(root+'/src/app/api/companies/[slug]/stats/route.ts');
  for(const company of publicBaseline.companies) {
   const response=await companyRoute.GET(new Request(origin+'/api/companies/'+company.slug+'/stats'),{params:Promise.resolve({slug:company.slug})});
   assert.match(response.headers.get('cache-control'),/no-store/);
   const {stats}=await response.json();
   assert.equal(stats.publicationStatus,'paused');
   assert.equal(stats.driverCount,0);assert.equal(stats.verifiedPayslipCount,0);assert.deepEqual(stats.slices,[]);
   assert.ok(stats.bands.every(b=>!b.published && !b.netByFrequency.length));
  }
  assert.equal((await (await run(profile.GET,'GET',b)).json()).profile,null);
  assert.equal((await run(wipe.DELETE,'DELETE',b)).status,200);
  assert.equal((await run(item.GET,'GET',a,undefined,context)).status,200);
  assert.equal((await auth.handler(new Request(origin+'/api/auth/sign-out',{method:'POST',headers:{cookie:a,origin,'content-type':'application/json'},body:'{}'}))).status,200);
  assert.equal((await run(list.GET,'GET',a)).status,401);
  process.env.NODE_ENV='production';
  const authRoute=require(root+'/src/app/api/auth/[...all]/route.ts');
  assert.equal((await authRoute.GET(new Request(origin+'/api/auth/get-session'))).status,503);
  assert.equal((await run(list.GET,'GET',b)).status,401);
  process.env.NODE_ENV='development';
  console.log('PASS actual API routes + real auth and repository: anonymous denied; owner taken from session not body; A/B list/detail/delete/profile isolation; cross-origin delete denied; wiping B preserves A; signed-out session denied. Synthetic data only in in-memory PGlite.');
 } finally {await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

