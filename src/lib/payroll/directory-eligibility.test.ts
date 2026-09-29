import { it } from "node:test";
import assert from "node:assert/strict";
import { eligibleDirectoryEmployers } from "./directory-eligibility";
import { parsePayslipInput, toStoredPayslip } from "./parse";
import { toStoredProfile } from "./profile";
import { STATISTICS_NOTICE_VERSION } from "./statistics-sharing";
function records(user = "a", employerName = "Synthetic Firm", dates = ["2024-12-20", "2024-12-27", "2025-01-03"]) {
 return dates.map(paymentDate => toStoredPayslip(user, parsePayslipInput({employerName,paymentDate,payFrequency:"weekly",grossPay:500,netPay:400,deductions:[],allowances:[]}).input!));
}
const profile = {...toStoredProfile("a",{},"2026-09-25"), statisticsSharing:{enabled:true,noticeVersion:STATISTICS_NOTICE_VERSION,updatedAt:"2026-09-28"}, employmentStarts:{"synthetic-firm":{employerName:"Synthetic Firm",startMonth:"2024-01",source:"user_declared" as const,updatedAt:""}}};
it("requires three consecutive payslips and a valid employer start", () => {
 const slips = records();
 assert.equal(eligibleDirectoryEmployers(slips.slice(0,2),[profile]).length,0);
 assert.equal(eligibleDirectoryEmployers(slips,[]).length,0);
 assert.equal(eligibleDirectoryEmployers(records("a","Synthetic Firm",["2024-12-06","2024-12-27","2025-01-03"]),[profile]).length,0);
 assert.deepEqual(eligibleDirectoryEmployers(slips,[profile]),[{employerName:"Synthetic Firm",employerSlug:"synthetic-firm"}]);
 assert.equal(eligibleDirectoryEmployers([...slips,...slips],[profile]).length,1);
});
it("does not combine users or unlock a second employer from the first", () => {
 assert.equal(eligibleDirectoryEmployers([...records().slice(0,2),records("b")[2]],[profile]).length,0);
 assert.equal(eligibleDirectoryEmployers([...records(),...records("a","Another Firm").slice(0,2)],[profile]).length,1);
});
it("does not reveal an employer from private or withdrawn contributions", () => {
 assert.deepEqual(eligibleDirectoryEmployers(records(),[{...profile,statisticsSharing:undefined}]),[]);
 assert.deepEqual(eligibleDirectoryEmployers(records(),[{...profile,statisticsSharing:{...profile.statisticsSharing,enabled:false}}]),[]);
});
