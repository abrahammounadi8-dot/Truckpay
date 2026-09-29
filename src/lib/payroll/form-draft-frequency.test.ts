import { test } from "node:test";
import assert from "node:assert/strict";
import { draftFromExtraction } from "./form-draft";
test("reuses the group frequency without carrying financial values or dates", () => {
  for (const frequency of ["weekly", "fortnightly", "monthly"] as const) {
    const { form } = draftFromExtraction({ netPay: 100 }, [], [], frequency);
    assert.equal(form.payFrequency, frequency);
    assert.equal(form.netPay, "100");
    assert.equal(form.paymentDate, "");
    assert.equal(form.grossPay, "");
  }
});
test("preserves a frequency read from the document for validation", () => {
  assert.equal(draftFromExtraction({ payFrequency: "monthly" }, [], [], "weekly").form.payFrequency, "monthly");
});
test("a new group has no frequency inherited", () => {
  assert.equal(draftFromExtraction({}, [], []).form.payFrequency, "unknown");
});
