import { it } from "node:test";
import assert from "node:assert/strict";
import { groupPayslipsByEmployer } from "./history";

const slip = (id: string, employerName: string | null, employerSlug: string | null, paymentDate = "2026-09-11") => ({ id, employerName, employerSlug, paymentDate });
it("groups known aliases and legacy slugs without losing records", () => {
  const groups = groupPayslipsByEmployer([slip("1", "Nolan", "nolan"), slip("2", "Nolan Transport", null), slip("3", null, "nolan")]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].slips.length, 3);
});
it("keeps names with colliding generated slugs separate", () => {
  assert.equal(groupPayslipsByEmployer([slip("1", "A & B", "a-b"), slip("2", "A-B", "a-b")]).length, 2);
  assert.equal(groupPayslipsByEmployer([slip("1", "Nolan!", "nolan"), slip("2", "Nolan", "nolan")]).length, 2);
});
it("does not infer shared identity for missing names or conflicting slugs", () => {
  assert.equal(groupPayslipsByEmployer([slip("1", null, null), slip("2", null, null), slip("3", null, "unknown"), slip("4", null, "unknown")]).length, 4);
  assert.equal(groupPayslipsByEmployer([slip("1", "Same name", "one"), slip("2", "Same name", "two")]).length, 2);
});
it("orders payments newest first and preserves original data", () => {
  const input = [slip("1", "Example", "example", "2025-01-01"), slip("2", " example ", "example", "2026-09-11")];
  const group = groupPayslipsByEmployer(input)[0];
  assert.deepEqual(group.slips.map(s => s.id), ["2", "1"]);
  assert.equal(group.firstPaymentDate, "2025-01-01");
  assert.equal(group.lastPaymentDate, "2026-09-11");
  assert.equal(input[0].id, "1");
  assert.deepEqual(groupPayslipsByEmployer([]), []);
});

import { employerNetTotals } from "./history";
it("totals net cents without substituting missing amounts or mixing currencies",()=>{
 const result=employerNetTotals([{id:"a",currency:"EUR",netPay:0.1},{id:"b",currency:"EUR",netPay:0.2},{id:"c",currency:"EUR",netPay:null},{id:"d",currency:"GBP",netPay:50},{id:"a",currency:"EUR",netPay:0.1}]);
 assert.deepEqual(result,[{currency:"EUR",counted:2,missing:1,amount:0.3},{currency:"GBP",counted:1,missing:0,amount:50}]);
 assert.equal(employerNetTotals([{id:"z",currency:"EUR",netPay:0}])[0].amount,0);
 assert.equal(employerNetTotals([{id:"n",currency:"EUR",netPay:null}])[0].amount,null);
});
it("company totals stay separate and update after removal",()=>{
 const records=[{...slip("1","One","one"),netPay:100,currency:"EUR"},{...slip("2","One","one"),netPay:200,currency:"EUR"},{...slip("3","Two","two"),netPay:900,currency:"EUR"}];
 assert.deepEqual(groupPayslipsByEmployer(records).map(g=>employerNetTotals(g.slips)[0].amount),[300,900]);
 assert.equal(employerNetTotals(records.filter(r=>r.employerSlug==="one"&&r.id!=="1"))[0].amount,200);
});
