import { it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { monthlyTenure, validEmploymentMonth, validateEmploymentStart, profileAtPayslip, employmentStartFor } from "./employment-month";
import { toStoredProfile } from "./profile";
import { getProfile, updateProfile } from "./profile-store";

it("calculates exact monthly band boundaries without inventing a day", () => {
  for (const [end, months, band] of [["2024-12-31",11,"0_1"],["2025-01-01",12,"1_3"],["2026-12-31",35,"1_3"],["2027-01-01",36,"3_5"],["2028-12-31",59,"3_5"],["2029-01-01",60,"5_plus"]] as const) assert.deepEqual(monthlyTenure("2024-01",end),{months,band});
  assert.deepEqual(monthlyTenure("2024-02","2024-02-01"),monthlyTenure("2024-02","2024-02-29"));
  assert.equal(monthlyTenure("2024-03","2024-02-29"),null);
  for(const invalid of ["", "2024-00", "2024-13", "2024-2", "2024-02-01", null]) assert.equal(validEmploymentMonth(invalid),false);
});
it("rejects a later start than historical employer records without mixing employers", () => {
  const slips=[{employerSlug:"a",paymentDate:"2024-03-08",payPeriodEnd:"2024-02-29"},{employerSlug:"b",paymentDate:"2020-01-10",payPeriodEnd:null}];
  assert.equal(validateEmploymentStart("2024-02","a",slips,undefined,"2026-09"),null);
  assert.match(validateEmploymentStart("2024-03","a",slips,undefined,"2026-09")!,/posterior/);
  assert.match(validateEmploymentStart("2027-01","a",[],undefined,"2026-09")!,/futuro/);
  assert.ok(validateEmploymentStart(null,"a",slips));
});
it("uses the employer-specific declaration and payslip period end, not today or fiscal week", () => {
  const p=toStoredProfile("u",{employerSlug:"a"},"2030-01-01");
  p.employmentStarts={a:{employerName:"A",startMonth:"2024-01",source:"user_declared",updatedAt:""},b:{employerName:"B",startMonth:"2020-01",source:"user_declared",updatedAt:""}};
  const s={employerSlug:"a",employerName:"A",paymentDate:"2025-01-03",payPeriodEnd:"2024-12-31"};
  const result=profileAtPayslip(p,s)!; assert.equal(result.tenureMonths,11);assert.equal(result.tenureBand,"0_1");assert.equal(result.tenureSource,"user_declared");assert.equal(result.employmentStartDate,null);
  assert.equal(profileAtPayslip(p,{...s,employerSlug:"missing"})?.tenureMonths,null);
  assert.equal(profileAtPayslip(null,s),null);
  assert.equal(employmentStartFor(p,"missing"),null);
});
it("persists independent account/employer starts and preserves them on correction", async () => {
  const cwd=process.cwd(), oldDb=process.env.DATABASE_URL;
  const state=globalThis as typeof globalThis & {truckpayProfiles?: import('./types').EmploymentProfile[]};
  const oldProfiles=state.truckpayProfiles; const dir=await mkdtemp(path.join(tmpdir(),"mtp-tenure-test-"));
  try {
    process.chdir(dir); delete process.env.DATABASE_URL; delete state.truckpayProfiles;
    const save=(user:string,company:string,month:string)=>updateProfile(user,current=>({...current??toStoredProfile(user,{employerSlug:company},"2026-09-25"),employmentStarts:{...current?.employmentStarts,[company]:{employerName:company,startMonth:month,source:"user_declared",updatedAt:"2026-09-25"}}}));
    await Promise.all([save("alice","a","2024-01"),save("alice","b","2021-05"),save("bob","a","2025-07")]);
    await save("alice","a","2023-12"); delete state.truckpayProfiles;
    const a=await getProfile("alice"),b=await getProfile("bob");
    assert.equal(employmentStartFor(a,"a")?.startMonth,"2023-12");assert.equal(employmentStartFor(a,"b")?.startMonth,"2021-05");assert.equal(employmentStartFor(b,"a")?.startMonth,"2025-07");
    assert.equal(employmentStartFor(b,"b"),null);
    const disk=JSON.parse(await readFile(path.join(dir,"data/profiles.json"),"utf8"));assert.equal(disk.profiles.length,2);assert.equal(a?.employmentStartDate,null);
  } finally {process.chdir(cwd); if(oldDb===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=oldDb;state.truckpayProfiles=oldProfiles;}
});
