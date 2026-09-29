/* eslint-disable @typescript-eslint/no-require-imports -- standalone synthetic TypeScript policy rehearsal */
// Synthetic data only. This script never reads runtime data or connects to a service.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(r,...a){return resolve.call(this,r.startsWith('@/')?path.join(root,'src',r.slice(2)):r,...a)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {PUBLICATION_POLICY,preparePublicationReview,reviewStillMatches}=require('../src/lib/payroll/publication-policy.ts');
const {parsePayslipInput,toStoredPayslip}=require('../src/lib/payroll/parse.ts');
const {toStoredProfile}=require('../src/lib/payroll/profile.ts');
const input={employerSlug:'synthetic-firm',publicEmployerSlugs:['synthetic-firm'],period:{start:'2025-01-01',end:'2025-03-31'},frozenAt:'2025-04-15T00:00:00.000Z',payslips:[],profiles:[],reviewedPeople:[],history:[]};
for(let i=0;i<22;i++){
 const userId='synthetic-'+i,monthly=i===21,startMonth=i<11?'2024-07':'2022-07',net=i<11?543.21:789.12;
 input.reviewedPeople.push({userId,personKey:'synthetic-person-'+i});
 input.profiles.push({...toStoredProfile(userId,{employerSlug:input.employerSlug},'2025-04-01'),statisticsSharing:{enabled:true,noticeVersion:PUBLICATION_POLICY.noticeVersion,updatedAt:'2025-04-02T00:00:00.000Z'},employmentStarts:{[input.employerSlug]:{employerName:'Synthetic Firm',startMonth,source:'user_declared',updatedAt:'2025-04-01T00:00:00.000Z'}}});
 for(const paymentDate of monthly?['2025-01-31','2025-02-28','2025-03-31']:['2025-01-03','2025-01-10','2025-01-17'])input.payslips.push({...toStoredPayslip(userId,parsePayslipInput({employerName:'Synthetic Firm',paymentDate,payFrequency:monthly?'monthly':'weekly',grossPay:net+100,netPay:net,deductions:[],allowances:[]}).input),createdAt:'2025-04-01T00:00:00.000Z'});
}
const review=preparePublicationReview(input);
input.profiles[0].statisticsSharing.enabled=false;
const afterWithdrawal=preparePublicationReview(input);
console.log(JSON.stringify({synthetic:true,publicationEnabled:false,proposal:review.proposal,
 checks:{twoTenureBands:review.proposal?.cells.length===2,onePersonMonthlyCellHidden:review.proposal?.cells.every(c=>c.frequency==='weekly'),
 withdrawalInvalidatesReview:!reviewStillMatches(review,input),withdrawalMayLeaveSameIntervals:JSON.stringify(review.proposal)===JSON.stringify(afterWithdrawal.proposal)},
 note:'Internal rehearsal only. Tenure is declared by the driver. No data is published; fresh notice, trusted person review, a durable release ledger and disclosure approval are still required.'},null,2));
