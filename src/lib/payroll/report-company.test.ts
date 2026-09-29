import test from "node:test";
import assert from "node:assert/strict";
import { parseReportInput, toStoredReport } from "@/lib/report-input";
import { reportCompanies } from "@/lib/report-companies";
import { fleet } from "@/lib/data";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { POST, GET } from "@/app/api/reports/route";

// Synthetic inputs only: never saved to the application's public report store.
const base = { weeklyPay: 650, hoursPerWeek: 40, payType: "hourly", equipment: "curtain", operation: "domestic" };
function parse(companyName: string) {
  const result = parseReportInput({ ...base, companyName });
  assert.equal(result.error, undefined);
  assert.ok(result.report);
  return result.report;
}
test("an employer outside the directory is accepted and its name retained", () => {
  const report = parse("TEST Example Haulage");
  assert.equal(report.companyName, "TEST Example Haulage");
  assert.match(report.companySlug, /^reported-[a-f0-9]{64}$/);
});
test("known full names, aliases and legacy slugs remain linked to existing companies", () => {
  for (const name of ["Nolan Transport", "nolan", "NOLAN"]) assert.equal(parse(name).companySlug, "nolan");
  assert.equal(parseReportInput({ ...base, companySlug: "nolan" }).report?.companyName, "Nolan Transport");
});
test("case and spacing do not split the same employer", () => {
  assert.equal(parse("  TEST  Example Haulage  ").companySlug, parse("test example haulage").companySlug);
});
test("different alphabets and similar curated slugs cannot merge distinct employers", () => {
  assert.notEqual(parse("ТЕСТ Альфа").companySlug, parse("ТЕСТ Бета").companySlug);
  assert.notEqual(parse("Nolan!").companySlug, "nolan");
});
test("a forged curated slug cannot override an explicitly entered company", () => {
  const result = parseReportInput({ ...base, companyName: "TEST Different Company", companySlug: "nolan" });
  assert.notEqual(result.report?.companySlug, "nolan");
});
test("empty and overlong company names are rejected", () => {
  assert.ok(parseReportInput({ ...base, companyName: "   " }).error);
  assert.ok(parseReportInput({ ...base, companyName: "x".repeat(121) }).error);
  assert.ok(parseReportInput({ ...base, companySlug: "unknown" }).error);
});
test("new reports discard quoted pay and free-form notes", () => {
  const result = parseReportInput({ ...base, companyName: "TEST Example Haulage", quotedWeekly: 900, body: "Test-only note" });
  assert.ok(result.report);
  assert.equal(toStoredReport(result.report).quotedWeekly, undefined);
  assert.equal(result.report.body, "");
});
test("actual pay validation is preserved", () => {
  assert.ok(parseReportInput({ ...base, companyName: "TEST Example", weeklyPay: 0 }).error);
  assert.ok(parseReportInput({ ...base, companyName: "TEST Example", hoursPerWeek: 100 }).error);
});
test("unknown companies remain discoverable without fabricated or verified company facts", () => {
  const report = toStoredReport(parse("TEST Example Haulage"));
  const companies = reportCompanies([report, report]);
  assert.equal(companies.length, fleet.length + 1);
  const company = companies.find(item => item.slug === report.companySlug)!;
  assert.equal(company.name, report.companyName);
  assert.equal(company.driverReported, true);
  assert.equal(company.website, "");
  assert.equal(company.headquarters, "");
  assert.deepEqual(company.equipment, []);
});
test("driver reports do not overwrite curated company facts", () => {
  const report = toStoredReport(parse("nolan"));
  assert.deepEqual(reportCompanies([report]).find(company => company.slug === "nolan"), fleet.find(company => company.slug === "nolan"));
});

test("the report API saves and returns an unknown company using an isolated temporary store", async () => {
  const before = process.cwd();
  const vercel = process.env.VERCEL;
  const directory = await mkdtemp(path.join(tmpdir(), "truckpay-report-test-"));
  try {
    process.chdir(directory);
    delete process.env.VERCEL;
    const response = await POST(new Request("http://localhost/api/reports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...base, companyName: "TEST Isolated Transport", quotedWeekly: 900, body: "Should not persist" }),
    }));
    assert.equal(response.status, 201);
    const { report } = await response.json();
    const listed = await GET(new Request("http://localhost/api/reports?company=" + report.companySlug));
    assert.equal((await listed.json()).reports[0].companyName, "TEST Isolated Transport");
    const saved = JSON.parse(await readFile(path.join(directory, "data/reports.json"), "utf8"));
    assert.equal(saved[0].companySlug, report.companySlug);
    assert.equal(saved[0].quotedWeekly, undefined);
    assert.equal(saved[0].body, "");
    assert.ok(reportCompanies(saved).find(company => company.slug === report.companySlug));
  } finally {
    process.chdir(before);
    if (vercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = vercel;
    const relative = path.relative(tmpdir(), directory);
    if (relative.startsWith("truckpay-report-test-") && !relative.includes(path.sep)) {
      await rm(directory, { recursive: true, force: true });
    }
  }
});
