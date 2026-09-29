import { it } from "node:test";
import assert from "node:assert/strict";
import { amountSnapshot, issueAmountReceipt, checkAmountReceipt, canEditTestAmounts } from "./amount-review";
import { parsePayslipInput, toStoredPayslip } from "./parse";
import { attachProcessing } from "./process";
import { consecutiveOnboarding } from "./onboarding";
const now = Date.parse("2026-09-25T12:00:00Z");
const env = { NODE_ENV: "development", MTP_AUTH_EMAIL_MODE: "resend", MTP_AMOUNT_TEST_USER_ID: "owner-test", MTP_AMOUNT_TEST_UNTIL: "2026-09-26T12:00:00Z" };
const input = parsePayslipInput({ employerName: "Synthetic transport", paymentDate: "2026-09-25", payFrequency: "weekly", grossPay: 500, netPay: 400, deductions: [], allowances: [] }).input!;
it("enables only the configured verified identity in development until expiry", () => {
  assert.equal(canEditTestAmounts("owner-test", env, now), true);
  for (const config of [{}, { ...env, NODE_ENV: "production" }, { ...env, MTP_AUTH_EMAIL_MODE: "simulated" }, { ...env, MTP_AMOUNT_TEST_UNTIL: "2026-09-24" }]) assert.equal(canEditTestAmounts("owner-test", config, now), false);
  assert.equal(canEditTestAmounts("other", env, now), false);
});
it("rejects missing, forged, expired and cross-account extraction receipts", () => {
  const id = issueAmountReceipt("owner-test", amountSnapshot(input as unknown as Record<string, unknown>), now);
  for (const token of [undefined, "forged"]) assert.ok(checkAmountReceipt("owner-test", token, input, env, now).error);
  assert.ok(checkAmountReceipt("other", id, input, env, now).error);
  assert.ok(checkAmountReceipt("owner-test", id, input, env, now + 31 * 60_000).error);
});
it("normal users can save unchanged extracted amounts but cannot edit any monetary field or lines", () => {
  const id = issueAmountReceipt("other", amountSnapshot(input as unknown as Record<string, unknown>), now);
  assert.deepEqual(checkAmountReceipt("other", id, input, env, now), {});
  for (const modified of [{ ...input, grossPay: 600 }, { ...input, basicRate: 20 }, { ...input, deductions: [{rawLabel: "Test", amount: 25}] }]) assert.ok(checkAmountReceipt("other", id, modified, env, now).error);
});
it("owner changes keep original amounts and remain unverified after hydration", () => {
  const original = amountSnapshot(input as unknown as Record<string, unknown>);
  const id = issueAmountReceipt("owner-test", original, now);
  const result = checkAmountReceipt("owner-test", id, { ...input, netPay: 450 }, env, now);
  assert.equal(result.audit?.original.netPay, 400);
  assert.equal(result.audit?.submitted.netPay, 450);
  assert.deepEqual(result.audit?.changedFields, ["netPay"]);
  assert.ok(checkAmountReceipt("owner-test", id, { ...input, netPay: 450 }, {...env, NODE_ENV:"production"}, now).error);
  const slip = attachProcessing({ ...toStoredPayslip("owner-test", input), manualAmountAudit: result.audit });
  assert.equal(slip.provenance?.netPay.verification_status, "unverified");
  assert.equal(slip.weeklyRecord?.comparable, false);
  assert.equal(consecutiveOnboarding([slip]).have, 0);
});

it("production extraction receipts survive process boundaries without trusting altered amounts",()=>{
 const prod={NODE_ENV:"production",MTP_RECEIPT_SECRET:"synthetic-deployment-secret-never-used-123456"};
 const token=issueAmountReceipt("normal",amountSnapshot(input as unknown as Record<string,unknown>),now,prod);
 assert.ok(token.startsWith("v1."));
 assert.deepEqual(checkAmountReceipt("normal",token,input,prod,now),{});
 assert.ok(checkAmountReceipt("other",token,input,prod,now).error);
 assert.ok(checkAmountReceipt("normal",token,{...input,netPay:999},prod,now).error);
 const parts=token.split(".");parts[2]=(parts[2][0]==="a"?"b":"a")+parts[2].slice(1);
 assert.ok(checkAmountReceipt("normal",parts.join("."),input,prod,now).error);
 assert.ok(checkAmountReceipt("normal",token,input,prod,now+31*60_000).error);
 assert.ok(checkAmountReceipt("normal",token,input,{...prod,MTP_RECEIPT_SECRET:"other-synthetic-deployment-secret-12345"},now).error);
 assert.throws(()=>issueAmountReceipt("normal",{},now,{NODE_ENV:"production"}),/MTP_RECEIPT_SECRET/);
});
