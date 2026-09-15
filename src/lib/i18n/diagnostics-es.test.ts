import test from "node:test";
import assert from "node:assert/strict";
import { diagnosticSpanish } from "./diagnostics-es";
import { translateUi } from "./ui-copy";

test("all advanced Spanish diagnostics preserve placeholders and render without English fallback", () => {
  for (const [source, target] of diagnosticSpanish) {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
    assert.deepEqual(placeholders(source), placeholders(target), source);
    const example = source.replace(/\{\w+\}/g, "123");
    const rendered = translateUi("es", example);
    assert.notEqual(rendered, example, source);
    assert.doesNotMatch(rendered, /\{\w+\}/, source);
  }
});
test("diagnostic translations keep original payroll line labels and translate directional words", () => {
  const raw = "Deduction “Pension” is kept as written and needs review. It is not classified as incorrect or unlawful.";
  assert.match(translateUi("es", raw), /«Pension»/);
  const source = "On a weekly-equivalent basis this slip is €20.00 below your recent median from 1 earlier slip (€680.00 vs €700.00). That is a difference on the figures, not a finding of underpayment.";
  const result = translateUi("es", source);
  assert.match(result, /por debajo de/);
  assert.match(result, /1 nómina/);
  assert.match(result, /€680.00/);
});
