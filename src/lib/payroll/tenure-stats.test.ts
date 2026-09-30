import { analyseLatestSet } from "./analysis";
import { it } from "node:test";
import assert from "node:assert/strict";
import { calculateCompanyPayStats as companyPayStats } from "./company-stats";
import { parsePayslipInput, toStoredPayslip } from "./parse";
import { toStoredProfile } from "./profile";
import type { Payslip, EmploymentProfile } from "./types";
import { ACTIVE_PUBLICATION_NOTICE_VERSION } from "./publication-consent";
const dates = ["2024-12-20", "2024-12-27", "2025-01-03"];
function slips(user: string, gross = 500): Payslip[] { return dates.map(paymentDate => toStoredPayslip(user, parsePayslipInput({employerName:"Synthetic Firm",paymentDate,payFrequency:"weekly",grossPay:gross,netPay:gross-100,basicRate:20,deductions:[],allowances:[]}).input!)); }
function profile(user: string, startMonth: string): EmploymentProfile { return {...toStoredProfile(user,{employerName:"Synthetic Firm",employerSlug:"synthetic-firm"},"2026-09-25"),publicationSharing:{enabled:true,noticeVersion:ACTIVE_PUBLICATION_NOTICE_VERSION,updatedAt:"2026-09-28"},employmentStarts:{"synthetic-firm":{employerName:"Synthetic Firm",startMonth,source:"user_declared",updatedAt:""}}}; }
it("assigns each old payslip to its historical band and counts one driver across bands", () => {
 const s=slips("a"),p=profile("a","2024-01");const result=companyPayStats("synthetic-firm",s,[p],"2035-01-01");
 assert.equal(result.driverCount,1);assert.equal(result.verifiedPayslipCount,3);
 const low=result.bands.find(b=>b.band==="0_1")!,next=result.bands.find(b=>b.band==="1_3")!;
 assert.equal(low.verifiedPayslipCount,2);assert.equal(next.verifiedPayslipCount,1);assert.equal(low.driverCount,1);assert.equal(next.driverCount,1);
 assert.equal(low.published,true);assert.equal(next.medianObservedGrossWeekly,500);
});
it("publishes one-driver contributions, deduplicates slips and recalculates corrections", () => {
 const a=slips("a",500),b=slips("b",600),c=slips("c",700);const profiles=[profile("a","2024-07"),profile("b","2024-07"),profile("c","2024-07")];
 const one=companyPayStats("synthetic-firm",[...a,...a],profiles,"2026-09-25");assert.equal(one.driverCount,1);assert.equal(one.verifiedPayslipCount,3);assert.equal(one.bands[0].published,true);
 const three=companyPayStats("synthetic-firm",[...a,...b,...c],profiles,"2026-09-25");assert.equal(three.bands[0].driverCount,3);assert.equal(three.bands[0].published,true);assert.equal(three.bands[0].medianObservedGrossWeekly,600);
 const corrected=companyPayStats("synthetic-firm",[...a,...b,...c],[profile("a","2019-07"),...profiles.slice(1)],"2026-09-25");assert.equal(corrected.bands[0].driverCount,2);assert.equal(corrected.bands[0].published,true);assert.equal(corrected.bands[0].medianObservedGrossWeekly,650);assert.equal(corrected.bands[3].driverCount,1);
});
it("omits missing starts and manual test amounts from salary contributions", () => {
 const s=slips("a");const missing=toStoredProfile("a",{employerSlug:"synthetic-firm"},"2026-09-25");assert.equal(companyPayStats("synthetic-firm",s,[missing],"2026-09-25").driverCount,0);
 const manual=s.map(slip=>({...slip,manualAmountAudit:{original:{grossPay:500},submitted:{grossPay:600},changedFields:["grossPay"],editedAt:"",source:"local_owner_test" as const}}));
 assert.equal(companyPayStats("synthetic-firm",manual,[profile("a","2024-07")],"2026-09-25").driverCount,0);
});
it("new eligible uploads update counts without re-counting their driver", () => {
 const s=slips("a"),newSlip=toStoredPayslip("a",parsePayslipInput({employerName:"Synthetic Firm",paymentDate:"2025-01-10",payFrequency:"weekly",grossPay:550,deductions:[],allowances:[]}).input!);
 const r=companyPayStats("synthetic-firm",[...s,newSlip],[profile("a","2024-07")],"2026-09-25");assert.equal(r.driverCount,1);assert.equal(r.verifiedPayslipCount,4);assert.equal(r.bands[0].published,true);
});

it("keeps native weekly and monthly net in separate frequency groups", () => {
 const weekly=slips("weekly");
 const monthly=["2024-11-30","2024-12-31","2025-01-31"].map(paymentDate=>toStoredPayslip("monthly",parsePayslipInput({employerName:"Synthetic Firm",paymentDate,payFrequency:"monthly",grossPay:2400,netPay:2000,deductions:[],allowances:[]}).input!));
 const r=companyPayStats("synthetic-firm",[...weekly,...monthly],[profile("weekly","2024-07"),profile("monthly","2024-07")],"2026-09-25");
 assert.equal(r.driverCount,2);assert.equal(r.verifiedPayslipCount,6);
 const groups=r.bands[0].netByFrequency;
 assert.equal(groups.length,2);
 assert.deepEqual(groups.find(g=>g.frequency==="weekly"),{frequency:"weekly",medianNet:400,driverCount:1,payslipCount:3});
 assert.deepEqual(groups.find(g=>g.frequency==="monthly"),{frequency:"monthly",medianNet:2000,driverCount:1,payslipCount:3});
 assert.equal(r.bands[0].medianObservedGrossWeekly,500);
});

it("does not substitute gross or zero when net is absent",()=>{
 const records=slips("a").map(s=>({...s,netPay:null}));
 const result=companyPayStats("synthetic-firm",records,[profile("a","2024-07")],"2026-09-25");
 assert.equal(result.driverCount,1);assert.deepEqual(result.bands[0].netByFrequency,[]);assert.deepEqual(result.slices[0].netByFrequency,[]);
});

it("personal summary takes real net, preserving distinct original gross",()=>{
 const records=slips("a",500);const analysis=analyseLatestSet(records,profile("a","2024-07"));
 assert.deepEqual(analysis.ownNetByFrequency,[{frequency:"weekly",medianNet:400,payslipCount:3}]);
 assert.equal(analysis.ownMedianWeeklyGross,500);assert.equal(records[0].grossPay,500);
 const empty=analyseLatestSet(records.map(s=>({...s,netPay:null})),profile("a","2024-07"));assert.deepEqual(empty.ownNetByFrequency,[]);
});

import { companyPayStats as protectedStats } from "./company-stats";
it("excludes absent, outdated and withdrawn permission without changing private analysis",()=>{
 const records=slips("private",987), p=profile("private","2024-07");
 for(const choice of [undefined,{...p.publicationSharing!,enabled:false},{...p.publicationSharing!,noticeVersion:"tenure-review-2026-09-29"}]) {
  const privateProfile={...p,publicationSharing:choice};
  const result=protectedStats("synthetic-firm",records,[privateProfile],"2026-09-28");
  assert.equal(result.driverCount,0);
  assert.ok(result.bands.every(b=>b.netByFrequency.length===0));
  assert.equal(analyseLatestSet(records,privateProfile).status,"verified");
 }
});
it("public output includes even one authorised account and excludes withdrawals", () => {
 const empty=protectedStats("synthetic-firm",[],[],"2026-09-29");
 for(const count of [1,9,10,30]) {
  const users=Array.from({length:count},(_,i)=>"driver-"+i);
  const records=users.flatMap(u=>slips(u,987));
  const profiles=users.map(u=>profile(u,"2024-07"));
  const result=protectedStats("synthetic-firm",records,profiles,"2026-09-29");
  assert.equal(result.driverCount,count);
  assert.equal(result.verifiedPayslipCount,count*3);
  assert.equal(result.publicationStatus,"active");
  assert.equal(result.bands[0].netByFrequency[0].medianNet,887);
  assert.ok(!JSON.stringify(result).includes("driver-0"));
  assert.equal(analyseLatestSet(slips(users[0],987),profiles[0]).ownNetByFrequency[0].medianNet,887);
  assert.deepEqual(protectedStats("synthetic-firm",records,profiles.map(p=>({...p,publicationSharing:undefined})),"2026-09-29"),empty);
 }
});
it("does not publish an incomplete first contribution",()=>{
 const result=protectedStats("synthetic-firm",slips("one").slice(0,2),[profile("one","2024-07")],"2026-09-27");
 assert.equal(result.driverCount,0);assert.ok(result.bands.every(b=>b.netByFrequency.length===0));
});
it("does not persist free-text deduction or allowance labels in new payslips",()=>{
 const saved=toStoredPayslip("a",{paymentDate:"2026-09-01",grossPay:500,deductions:[{rawLabel:"Union membership PRIVATE-NAME",amount:5}],allowances:[{rawLabel:"PRIVATE-NAME medical refund",amount:10}]});
 assert.equal(JSON.stringify(saved).includes("PRIVATE-NAME"),false);assert.equal(saved.deductions[0].amount,5);assert.equal(saved.allowances[0].amount,10);
});
