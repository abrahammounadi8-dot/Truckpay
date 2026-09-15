import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveEmployer, slugifyEmployer } from "./employer";
import { parsePayslipInput } from "./parse";

describe("employer names", () => {
  it("leaves the employer empty when nothing was typed", () => {
    const resolved = resolveEmployer("  ");
    assert.equal(resolved.employerName, null);
    assert.equal(resolved.employerSlug, null);
  });

  it("accepts a firm that is not on the public directory", () => {
    const resolved = resolveEmployer("TEST Haulage Co");
    assert.equal(resolved.employerName, "TEST Haulage Co");
    assert.equal(resolved.employerSlug, slugifyEmployer("TEST Haulage Co"));
    const parsed = parsePayslipInput({
      paymentDate: "2024-03-28",
      grossPay: 900,
      employerName: "TEST Haulage Co",
    });
    assert.equal(parsed.error, undefined);
    assert.equal(parsed.input?.employerName, "TEST Haulage Co");
    assert.equal(parsed.input?.employerSlug, "test-haulage-co");
  });
});
