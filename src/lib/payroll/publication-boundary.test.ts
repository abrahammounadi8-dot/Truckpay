import { it } from "node:test";
import assert from "node:assert/strict";
import { ESLint } from "eslint";

it("CI rejects raw salary calculators and internal review data in serving code", async () => {
  const lint = new ESLint();
  for (const [filePath, code] of [
    ["src/app/api/example/route.ts", 'import { calculateCompanyPayStats as raw } from "@/lib/payroll/company-stats"; export const GET = raw;'],
    ["src/components/example.tsx", 'import { preparePublicationReview } from "@/lib/payroll/publication-policy"; export default preparePublicationReview;'],
    ["src/app/example/page.tsx", 'import { readPublicationHistory } from "../../lib/payroll/publication-journal"; export default readPublicationHistory;'],
  ]) {
    const [result] = await lint.lintText(code, { filePath });
    assert.ok(result.messages.some(m => m.ruleId === "no-restricted-imports"), filePath);
  }
  const [allowed] = await lint.lintText('import { companyPayStats } from "@/lib/payroll/company-stats"; export const GET = companyPayStats;', { filePath: "src/app/api/example/route.ts" });
  assert.equal(allowed.messages.some(m => m.ruleId === "no-restricted-imports"), false);
});
