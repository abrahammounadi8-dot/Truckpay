import { it } from "node:test";
import assert from "node:assert/strict";
import { parsePayslipInput } from "./parse";
it("rejects impossible dates and backwards periods without guessing replacements", () => {
  const base = { paymentDate: "2026-03-10", grossPay: 1000 };
  assert.ok(parsePayslipInput({ ...base, paymentDate: "2026-02-30" }).error);
  assert.ok(parsePayslipInput({ ...base, payPeriodStart: "2026-02-30" }).error);
  assert.ok(parsePayslipInput({ ...base, payPeriodStart: "2026-03-09", payPeriodEnd: "2026-03-01" }).error);
  assert.ok(parsePayslipInput({ ...base, payPeriodStart: "2024-02-29", payPeriodEnd: "2024-03-01" }).input);
  assert.equal(parsePayslipInput(base).input?.payPeriodStart, null);
});
