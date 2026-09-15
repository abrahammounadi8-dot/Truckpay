import { test } from "node:test";
import assert from "node:assert/strict";
import { draftFromExtraction } from "./form-draft";
test("replacing a complete payslip with a sparse one does not retain amounts or lines", () => {
 let state = draftFromExtraction({grossPay:1000,netPay:800,employerName:"TEST A",overtimePay:150,payFrequency:"weekly"},[{rawLabel:"PAYE",amount:200}],[{rawLabel:"Night",amount:80}]);
 state = draftFromExtraction({grossPay:700,employerName:"TEST B"},[],[]);
 assert.equal(state.form.grossPay,"700");
 assert.equal(state.form.employerName,"TEST B");
 assert.equal(state.form.netPay,"");
 assert.equal(state.form.overtimePay,"");
 assert.equal(state.form.payFrequency,"unknown");
 assert.ok(state.deductions.every(l => l.amount === "" && l.rawLabel === ""));
 assert.ok(state.allowances.every(l => l.amount === "" && l.rawLabel === ""));
});
test("unreadable replacement leaves all payroll figures blank, retaining genuine zero when read", () => {
 const blank = draftFromExtraction({},[],[]);
 assert.equal(blank.form.grossPay,"");
 assert.equal(blank.form.paymentDate,"");
 const zero = draftFromExtraction({netPay:0,grossPay:null},[{rawLabel:"PAYE",amount:0}],[]);
 assert.equal(zero.form.netPay,"0");
 assert.equal(zero.form.grossPay,"");
 assert.equal(zero.deductions[0].amount,"0");
 assert.equal(blank.form.netPay,"");
});
