import { it } from "node:test";
import assert from "node:assert/strict";
import { preparePayslipBatch } from "./prepare-batch";
import { issueAmountReceipt, amountSnapshot } from "./amount-review";
function item(date: string, name = "Synthetic Firm") {
 const fields = {employerName:name,paymentDate:date,payFrequency:"weekly",grossPay:600,netPay:450,deductions:[],allowances:[]};
 return {...fields,amountReceipt:issueAmountReceipt("test-user",amountSnapshot(fields))};
}
const group = () => [item("2024-12-06"),item("2024-12-13"),item("2024-12-20")];
it("prepares all three with employer and start month",()=>{const records=preparePayslipBatch("test-user",group(),"2024-01");assert.equal(records.length,3);assert.ok(records.every(s=>s.userId==="test-user" && s.employerSlug==="synthetic-firm"));});
it("rejects incomplete, duplicate, mixed or nonconsecutive sets",()=>{
 const all=group();for(const items of [all.slice(0,2),[all[0],all[0],all[2]],[all[0],all[1],item("2024-12-20","Other Firm")],[all[0],all[1],item("2025-01-03")]])assert.throws(()=>preparePayslipBatch("test-user",items,"2024-01"));
});
it("requires valid start and original amounts belonging to this user",()=>{
 for(const month of ["","2025-01","2099-01"])assert.throws(()=>preparePayslipBatch("test-user",group(),month));
 assert.throws(()=>preparePayslipBatch("another-user",group(),"2024-01"));
 const all=group();all[0].netPay=999;assert.throws(()=>preparePayslipBatch("test-user",all,"2024-01"));
});
