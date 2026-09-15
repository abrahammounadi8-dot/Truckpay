/**
 * TEST DATA ONLY — synthetic payslip photo for automated tests.
 * Not a real driver payslip.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { extractPayslipDocument } from "./extract-document";

function hasTesseract(): boolean {
  try {
    execFileSync("tesseract", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

describe("extract payslip photo", () => {
  it("does not invent figures from an image with no labels", async () => {
    const png = pngWithNoPayLabels();
    const result = await extractPayslipDocument({
      bytes: png,
      mime: "image/png",
      filename: "blank-test.png",
    });
    assert.equal(result.kind, "image");
    assert.equal(result.stored, false);
    assert.equal(result.draft.fields.grossPay, undefined);
    assert.equal(result.draft.filledKeys.length, 0);
  });

  it("reads labelled fields from a synthetic test photo when OCR is available", async (t) => {
    if (!hasTesseract()) {
      t.skip("tesseract is not installed");
      return;
    }
    const bytes = await readFile(join(import.meta.dirname, "fixtures/TEST-payslip-photo-not-real.png"));
    const result = await extractPayslipDocument({
      bytes,
      mime: "image/png",
      filename: "TEST-payslip-photo-not-real.png",
    });
    assert.equal(result.kind, "image");
    assert.equal(result.stored, false);
    assert.equal(result.draft.fields.employerName, "TEST Haulage Co");
    assert.equal(result.draft.fields.paymentDate, "2024-03-28");
    assert.equal(result.draft.fields.weekNumber, 12);
    assert.equal(result.draft.fields.basicHours, 40);
    assert.equal(result.draft.fields.grossPay, 1000);
    assert.equal(result.draft.fields.netPay, 810);
    assert.equal(
      result.draft.deductions.some((line) => line.rawLabel === "PAYE" && line.amount === 120),
      true,
    );
  });
});

function pngWithNoPayLabels(): Uint8Array {
  // 1x1 white PNG
  return Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
      "base64",
    ),
  );
}
