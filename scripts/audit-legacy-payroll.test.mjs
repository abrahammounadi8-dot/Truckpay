import test from "node:test";
import assert from "node:assert/strict";
import { summarizeLegacyPayroll } from "./audit-legacy-payroll.mjs";

test("legacy inventory counts owners without exposing payroll contents", () => {
  const first = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const second = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  assert.deepEqual(
    summarizeLegacyPayroll({ payslips: [{ userId: first, netPay: 100 }, { userId: first, netPay: 200 }, { userId: second, netPay: 300 }] }, { profiles: [{ userId: first, employerName: "Private" }] }),
    { payslips: 3, profiles: 1, anonymousOwners: 2, invalidRecords: 0 },
  );
  assert.throws(() => summarizeLegacyPayroll({}, { profiles: [] }), /Expected payslips/);
});
