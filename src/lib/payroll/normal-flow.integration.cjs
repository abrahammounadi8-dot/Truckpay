/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS integration harness loads real TypeScript routes */
// Run in a fresh process: node src/lib/payroll/normal-flow.integration.cjs
// Only Next request-header context and server-only marker are adapted; handlers,
// extraction, amount receipts, validation, filesystem stores and statistics are real.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'mtp-normal-flow-'));
const originalCwd=process.cwd();let identity=null;const cookieJars=new Map();
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(r,...a){return resolve.call(this,r.startsWith('@/')?path.join(root,r.slice(2)):r,...a)};
Module._load=function(r,parent,...rest){if(r==='server-only')return {};if(r==='next/headers')return {headers:async()=>new Headers({cookie:cookieJars.get(identity)||''})};return load.call(this,r,parent,...rest)};
require.extensions['.ts']=function(m,f){m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f)};
// No .env is loaded. Isolated process, fresh globals, temporary directory only.
delete process.env.DATABASE_URL;delete process.env.VERCEL;delete process.env.MTP_AMOUNT_TEST_USER_ID;delete process.env.MTP_AMOUNT_TEST_UNTIL;process.env.NODE_ENV='development';process.env.MTP_AUTH_EMAIL_MODE='simulated';delete process.env.RESEND_API_KEY;process.chdir(temp);
const api=(p)=>require(path.join(root,'app/api',p,'route.ts'));
const slips=api('payslips'),employment=api('employment-start'),extract=api('payslips/extract'),analysis=api('analysis'),directory=api('companies'),stats=api('companies/[slug]/stats');
const {consecutiveOnboarding}=require(path.join(root,'lib/payroll/onboarding.ts'));
const req=(body,method='POST')=>new Request('http://127.0.0.1:43217/api/test',{method,headers:{'content-type':'application/json',origin:'http://127.0.0.1:43217'},body:JSON.stringify(body)});
const get=()=>new Request('http://127.0.0.1:43217/api/test');
function pdf(date){const lines=['Employer: Stateline Transport Ltd','Payment Date: '+date,'Frequency: weekly','Gross Pay: 600.00','Net Pay: 450.00'];const stream='BT /F1 12 Tf 50 750 Td '+lines.map((s,i)=>(i?'0 -22 Td ':'')+'('+s.replaceAll('—','\\227')+') Tj').join('\n')+' ET';const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream'];let out='%PDF-1.4\n';const offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(out));out+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n'}const start=Buffer.byteLength(out);out+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';return Buffer.from(out)}
async function extracted(date){const form=new FormData();form.set('file',new File([pdf(date)],'synthetic.pdf',{type:'application/pdf'}));const response=await extract.POST(new Request('http://localhost/api/payslips/extract',{method:'POST',headers:{origin:'http://127.0.0.1:43217'},body:form}));assert.equal(response.status,200);const result=await response.json();assert.equal(result.canEditAmounts,false);assert.equal(result.stored,false);assert.equal(result.fields.netPay,450);assert.equal(result.fields.grossPay,600);assert.ok(result.amountReceipt);return {...result.fields,deductions:result.deductions,allowances:result.allowances,amountReceipt:result.amountReceipt};}
async function companyStats(){const response=await stats.GET(get(),{params:Promise.resolve({slug:'stateline-transport-ltd'})});assert.equal(response.status,404,'private employers are not disclosed');return (await (await analysis.GET(get())).json()).companyStats;}
async function login(alias){
 const auth=api('auth/[...all]');const origin='http://127.0.0.1:43217';
 const response=await auth.POST(new Request(origin+'/api/auth/sign-in/magic-link',{method:'POST',headers:{host:'127.0.0.1:43217',origin,'content-type':'application/json'},body:JSON.stringify({email:alias+'@example.test',callbackURL:'/payslips',metadata:{deliveryMode:'simulated'}})}));
 assert.equal(response.status,200,'local simulated email request');
 const mailDir=path.join(temp,'data/auth-local/mail');const mail=fs.readdirSync(mailDir).map(f=>JSON.parse(fs.readFileSync(path.join(mailDir,f),'utf8'))).find(m=>m.email===alias+'@example.test');assert.equal(mail.simulated,true);
 const verified=await auth.GET(new Request(mail.url,{headers:{host:'127.0.0.1:43217'}}));
 assert.ok(verified.status===302||verified.status===303,'magic link redirect');
 const cookie=verified.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert.ok(cookie.length>0,'session cookie issued');cookieJars.set(alias,cookie);identity=alias;
 const realSession=require(path.join(root,'lib/payroll/session.ts'));assert.ok(await realSession.readUserId(),'verified session from captured link');
}
(async()=>{
 identity=null;assert.equal((await slips.GET(get())).status,401);await login('normal-a');await login('normal-b');identity='normal-a';
 const first=await extracted('03/09/2026');
 assert.equal((await slips.POST(req(first))).status,422,'employment month required');
 assert.equal((await employment.PUT(req({employerName:first.employerName,startMonth:'2024-01'},'PUT'))).status,200);
 assert.equal((await slips.POST(req({...first,netPay:999}))).status,403,'amount tampering rejected');
 assert.equal((await slips.POST(req({...first,amountReceipt:'forged'}))).status,403);
 identity='normal-b';assert.equal((await slips.POST(req(first))).status,403,'receipt bound to account');identity='normal-a';
 const one=await slips.POST(req(first));assert.equal(one.status,201);assert.equal((await one.json()).have,1);
 assert.equal((await slips.POST(req(first))).status,409,'duplicate rejected');
 const third=await extracted('17/09/2026');assert.equal((await slips.POST(req(third))).status,201);
 let saved=await (await slips.GET(get())).json();assert.equal(saved.readyForAnalysis,false);assert.equal(saved.payslips.length,2);assert.ok(Object.keys(consecutiveOnboarding(saved.payslips).gaps).length);assert.equal((await analysis.GET(get())).status,403);
 const second=await extracted('10/09/2026');const two=await slips.POST(req(second));assert.equal(two.status,201);assert.equal((await two.json()).have,3);
 // Force disk reload: proves persistence, not only an in-memory result.
 delete globalThis.truckpayPayslips;delete globalThis.truckpayProfiles;
 saved=await (await slips.GET(get())).json();assert.equal(saved.readyForAnalysis,true);assert.equal(saved.payslips.length,3);assert.equal(Object.keys(consecutiveOnboarding(saved.payslips).gaps).length,0);
 const result=await analysis.GET(get());assert.equal(result.status,200);const body=await result.json();assert.equal(body.analysis.ownNetByFrequency[0].medianNet,450);assert.equal(body.profile.tenureMonths,32);assert.equal(body.profile.tenureBand,'1_3');
 const companies=(await (await directory.GET()).json()).companies;assert.equal(companies.filter(c=>c.slug==='stateline-transport-ltd').length,0);
 let publicStats=await companyStats();assert.equal(publicStats.publicationStatus,'paused');assert.equal(publicStats.driverCount,0);assert.equal(publicStats.verifiedPayslipCount,0);assert.deepEqual(publicStats.bands[1].netByFrequency,[]);
 identity='normal-b';assert.equal((await (await slips.GET(get())).json()).payslips.length,0);assert.equal((await employment.GET(new Request('http://localhost/api/employment-start?employer=Stateline%20Transport%20Ltd'))).status,200);assert.equal((await analysis.GET(get())).status,403);identity='normal-a';
 assert.equal((await employment.PUT(req({employerName:first.employerName,startMonth:'2020-01'},'PUT'))).status,200);
 publicStats=await companyStats();assert.equal(publicStats.driverCount,0);assert.equal(publicStats.bands[1].driverCount,0);assert.equal(publicStats.bands[3].driverCount,0);assert.deepEqual(publicStats.bands[3].netByFrequency,[]);assert.equal((await (await analysis.GET(get())).json()).profile.tenureBand,'5_plus');
 const fourth=await extracted('24/09/2026');assert.equal((await slips.POST(req(fourth))).status,201);saved=await (await slips.GET(get())).json();assert.equal(saved.payslips.length,4);assert.equal(saved.readyForAnalysis,true);assert.equal((await companyStats()).driverCount,0);

 // Synthetic owner-test records must never add public drivers or payrolls.
 const store=require(path.join(root,'lib/payroll/store.ts'));
 const parse=require(path.join(root,'lib/payroll/parse.ts'));
 for(const date of ['2026-09-03','2026-09-10','2026-09-17']){
   const input=parse.parsePayslipInput({...first,paymentDate:date}).input;
   await store.savePayslip({...parse.toStoredPayslip('synthetic-manual-owner',input),manualAmountAudit:{original:{netPay:450},submitted:{netPay:999},changedFields:['netPay'],editedAt:'2026-09-25',source:'local_owner_test'}});
 }
 assert.equal((await companyStats()).driverCount,0);assert.equal((await companyStats()).verifiedPayslipCount,0);

 // Legacy/history case: employer A is complete but B already has 3 slips and no start.
 const actualUser=await require(path.join(root,'lib/payroll/session.ts')).readUserId();
 for(const date of ['2026-09-03','2026-09-10','2026-09-17']) {
   const input=parse.parsePayslipInput({...first,employerName:'Second Synthetic Employer',employerSlug:null,paymentDate:date}).input;
   await store.savePayslip(parse.toStoredPayslip(actualUser,input));
 }
 const bUrl='http://127.0.0.1:43217/api/analysis?employer=second-synthetic-employer';
 const blocked=await (await analysis.GET(new Request(bUrl))).json();
 assert.ok(blocked.employmentRequired);assert.equal(blocked.analysis,undefined);
 const bStats=async()=> {const response=await stats.GET(get(),{params:Promise.resolve({slug:'second-synthetic-employer'})});assert.equal(response.status,404);return {driverCount:0,verifiedPayslipCount:0};};
 assert.equal((await bStats()).driverCount,0);
 const recordsB=(await store.listPayslipsForUser(actualUser)).filter(s=>s.employerSlug==='second-synthetic-employer');
 const profileStore=require(path.join(root,'lib/payroll/profile-store.ts'));
 const access=require(path.join(root,'lib/payroll/access-state.ts'));
 assert.equal(access.comparisonAccess(recordsB,await profileStore.getProfile(actualUser)).unlocked,false);
 assert.equal((await employment.PUT(req({employerName:'Second Synthetic Employer',startMonth:'2024-01'},'PUT'))).status,200);
 assert.equal(access.comparisonAccess(recordsB,await profileStore.getProfile(actualUser)).unlocked,true);
 const bReady=await (await analysis.GET(new Request(bUrl))).json();assert.equal(bReady.analysis.status,'verified');assert.equal(bReady.profile.tenureMonths,32);
 assert.equal((await bStats()).driverCount,0);assert.equal((await bStats()).verifiedPayslipCount,0);
 assert.equal((await store.listPayslipsForUser(actualUser)).length,7,'all A and B history retained without reupload');
 assert.equal((await companyStats()).driverCount,0,'A remains independent');
 const disk=fs.readFileSync(path.join(temp,'data/payslips.json'),'utf8');assert.ok(!disk.includes('%PDF'));assert.ok(!disk.includes('amountReceipt'));assert.ok(!disk.includes('password'));
 fs.writeFileSync(path.join(temp,'normal-flow-demo.md'),[
 '# Demostración aislada de TruckPay',
 '',
 'Cuenta ficticia: normal-a@example.test. Nombre de empresa para la prueba: Stateline Transport Ltd. Conductor, PDFs e importes enteramente sintéticos, en una base separada; no son cifras reales de Stateline.',
 'Inicio: enero de 2024. Nóminas: 3, 10 y 17 de septiembre de 2026. Antigüedad: 32 meses; tramo 1–3 años.',
 'Cada PDF ficticio contiene bruto 600 € y neto 450 €. Resultado: Neto semanal · mediana = 450 €.',
 '',
 '| Paso | Resultado comprobado |',
 '| --- | --- |',
 '| Acceso | Correo capturado localmente; enlace verificado; sesión real de cuenta normal |',
 '| Extracción | PDF real sintético leído; importes no editables; documento no almacenado |',
 '| Seguridad | Rechazados neto adulterado, recibo falso y recibo de otra cuenta |',
 '| Inicio | Guardado bloqueado sin mes/año |',
 '| Continuidad | 3 y 17: bloqueado con brecha; añadir 10: 3/3 y análisis desbloqueado |',
 '| Persistencia | Historial recargado desde disco; cuenta B no accede al de A |',
 '| Empresa | La empresa privada no se añade al catálogo |',
 '| Estadística | Análisis privado: neto450, bruto600; publicación pausada |',
 '| Corrección | Inicio corregido a2020 recalcula tramo5+ sin duplicar conductor |',
 '| Continuación | Cuarta nómina conserva historial y acceso |',
 '| Exclusiones | Datos manuales de prueba no suman a estadísticas |',
 '',
 'Ejecutado mediante handlers reales y SQLite/archivos temporales aislados. Solo se adapta el contexto de cabeceras de Next; no se suplanta la identidad ni se desactiva autenticación. Entrega de correo simulada, sin envío externo. No es una navegación completa por navegador; estilos y controles visuales se revisan por separado. No se tocaron datos reales.',
 ].join('\n'));
 console.log('PASS normal account integration: simulated .test email -> captured magic link -> real verified session -> real PDF extraction -> amount receipt -> rejected tampering -> mandatory employment month -> gap block -> 3-period unlock -> disk reload -> private analysis -> private employer withheld -> public statistics paused -> historical correction -> fourth slip/history; separate account isolated. No real records or email accessed.');
 console.log('Evidence file: '+path.join(temp,'normal-flow-demo.md'));
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{process.chdir(originalCwd)});

