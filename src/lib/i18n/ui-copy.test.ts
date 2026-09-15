import test from "node:test";
import assert from "node:assert/strict";
import { uiCopy, translateUi } from "./ui-copy";
test("UI translations have seven populated columns, unique keys, and matching placeholders", () => {
  assert.equal(new Set(uiCopy.map(row => row[0])).size, uiCopy.length);
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const row of uiCopy) {
    assert.equal(row.length, 7, row[0]);
    for (const text of row) {
      assert.ok(text.trim(), row[0]);
      assert.deepEqual(placeholders(text), placeholders(row[0]), row[0]);
    }
  }
  assert.equal(translateUi("es", "Tenure: {n} months", { n: 14 }), "Antigüedad: 14 meses");
  assert.equal(translateUi("es", "TruckPay Verified Analysis needs your latest 3 payslips. You have 1."), "El análisis necesita tus últimas 3 nóminas. Tienes 1.");
  assert.equal(translateUi("pl", "Employer's original label"), "Employer's original label");
});
