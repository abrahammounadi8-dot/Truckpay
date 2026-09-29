// Synthetic layout only: no real payroll data or identifiers.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractSagePage, type PositionedText } from "./extract-sage";

function fixture() {
  const items: PositionedText[] = [];
  const add = (str: string, x: number, top: number, width = str.length * 5) => items.push({ str, x, y: 700 - top, width, height: 10 });
  add("TEST Haulage Ltd", 50, 30); add("Company Reg. Number: TEST", 525, 30);
  add("EMP. NAME", 55, 50); add("PRIVATE PERSON", 175, 50); add("PPS NUMBER", 650, 50); add("1234567T", 775, 50);
  add("FREQUENCY", 520, 50); add("W", 605, 50);
  add("PAY PERIOD", 520, 75); add("30", 605, 75);
  add("PAYMENT DATE", 650, 75); add("28/07/2026", 770, 75);
  add("PAYMENT DETAILS", 165, 100); add("DEDUCTION DETAILS", 530, 100);
  add("DESCRIPTION", 55, 120); add("HOURS", 224, 120); add("VALUE", 330, 120);
  add("DESCRIPTION", 395, 120); add("THIS PERIOD", 552, 120); add("BALANCE", 698, 120);
  add("Basic", 55, 142); add("T", 165, 142); add("40.00", 247, 142); add("800.00", 355, 142);
  add("Misc Exp.", 55, 160); add("N", 165, 160); add("20.00", 360, 160);
  add("SubsistUNV", 55, 180); add("N", 165, 180); add("100.00", 355, 180);
  add("PAYE", 395, 142); add("90.00", 606, 142); add("900.00", 723, 142);
  add("PRSI", 395, 160); add("30.00", 606, 160); add("300.00", 723, 160);
  add("USC", 395, 180); add("10.00", 606, 180); add("100.00", 723, 180);
  add("AE Pension", 395, 200); add("T", 500, 200); add("12.00", 606, 200); add("120.00", 723, 200);
  add("--Employer Pension Contribution--", 395, 220);
  add("AE Pension", 395, 250); add("99.00", 606, 250); add("999.00", 723, 250);
  add("GROSSPAY", 800, 135); add("800.00", 810, 166);
  add("TOTAL DEDS", 800, 210); add("142.00", 810, 240);
  add("NON-TAX ADJS.", 800, 290); add("120.00", 810, 315);
  add("NET PAY", 800, 440); add("778.00", 810, 490);
  add("CUMULATIVE DETAILS", 115, 440);
  add("GROSS PAY", 55, 478); add("8800.00", 234, 478);
  add("TAX PAID", 55, 560); add("900.00", 234, 560);
  return items;
}

describe("Sage column extraction", () => {
  it("separates current values, balances, expenses and employer pension", () => {
    const result = extractSagePage(fixture())!;
    assert.equal(result.fields.paymentDate, "2026-07-28");
    assert.equal(result.fields.employerName, "TEST Haulage Ltd");
    assert.equal(result.fields.payFrequency, "weekly");
    assert.equal(result.fields.weekNumber, undefined);
    assert.equal(result.fields.basicHours, 40);
    assert.equal(result.fields.basicPay, 800);
    assert.equal(result.fields.basicRate, undefined);
    assert.equal(result.fields.grossPay, 800);
    assert.equal(result.fields.netPay, 778);
    assert.equal(result.fields.cumulativeGross, 8800);
    assert.equal(result.fields.cumulativeTax, 900);
    assert.equal(result.fields.cumulativePrsi, 300);
    assert.equal(result.fields.cumulativeUsc, 100);
    assert.equal(result.fields.cumulativePension, 120);
    assert.deepEqual(result.deductions.map(i => i.amount), [90, 30, 10, 12]);
    assert.deepEqual(result.allowances.map(i => i.amount), [20, 100]);
    assert.ok(!JSON.stringify(result).includes("PRIVATE PERSON"));
    assert.ok(!JSON.stringify(result).includes("1234567T"));
  });
  it("accepts Sage NETT PAY without discarding all other fields", () => {
    const variant = fixture().map(i => i.str === "NET PAY" ? { ...i, str: "NETT PAY" } : i);
    assert.deepEqual(extractSagePage(variant), extractSagePage(fixture()));
  });
  it("does not depend on PDF internal drawing order or page scale", () => {
    const original = fixture();
    const moved = [...original].reverse().map(i => ({ ...i, x: i.x * 0.8 + 35, y: i.y * 0.8 + 40, width: i.width * 0.8, height: i.height * 0.8 }));
    assert.deepEqual(extractSagePage(moved), extractSagePage(original));
  });
  it("reads headings emitted as separate words and characters", () => {
    const split = fixture().flatMap(i => {
      if (!/^(PAYMENT DETAILS|DEDUCTION DETAILS|CUMULATIVE DETAILS|THIS PERIOD|PAYMENT DATE|DESCRIPTION|NET PAY)$/.test(i.str)) return [i];
      return [...i.str].map((str, n) => ({ ...i, str, x: i.x + n * i.width / i.str.length, width: i.width / i.str.length }));
    });
    assert.deepEqual(extractSagePage(split), extractSagePage(fixture()));
  });
  it("does not substitute a balance for a missing current amount", () => {
    const result = extractSagePage(fixture().filter(i => i.str !== "90.00"))!;
    assert.ok(!result.deductions.some(i => i.rawLabel === "PAYE"));
    assert.equal(result.fields.cumulativeTax, 900);
  });
  it("refuses unsupported or ambiguous layouts", () => {
    assert.equal(extractSagePage([]), null);
    const incomplete = extractSagePage(fixture().filter(i => i.str !== "THIS PERIOD"))!;
    assert.deepEqual(incomplete.filledKeys, []);
  });
});
