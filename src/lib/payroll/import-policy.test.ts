import assert from "node:assert/strict";
import test from "node:test";
import { filesForImport, preferredEmployer } from "./import-policy";

test("driver employer wins when payroll names an agency or a different legal entity", () => {
  assert.equal(preferredEmployer("  Driver's Company  ", "Payroll Agency Ltd"), "Driver's Company");
  assert.equal(preferredEmployer(undefined, " Payroll Agency Ltd "), "Payroll Agency Ltd");
  assert.equal(preferredEmployer(" ", "Payroll Agency Ltd"), "Payroll Agency Ltd");
});

test("multiple selection retains every document in selection order", () => {
  const first = { name: "week-1.pdf", netPay: 700 };
  const second = { name: "week-2.pdf", netPay: 800 };
  const third = { name: "week-3.pdf", netPay: 900 };
  const selected = filesForImport({ 0: first, 1: second, 2: third, length: 3 }, 3);
  assert.deepEqual(selected, [first, second, third]);
  assert.equal(selected[1], second);
  assert.deepEqual(filesForImport([], 3), []);
});

test("an oversized selection is rejected rather than silently truncating documents", () => {
  assert.throws(() => filesForImport([1, 2, 3, 4], 3), /3/);
  assert.equal(filesForImport(Array.from({ length: 20 }, (_, i) => i)).length, 20);
  assert.throws(() => filesForImport(Array.from({ length: 21 }, (_, i) => i)), /20/);
});
