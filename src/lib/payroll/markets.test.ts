import { addRegisteredEmployers } from "../directory-companies";
import { test } from "node:test";
import assert from "node:assert/strict";
import { belongsToMarket, marketFrom } from "../markets";
import { parseReportInput, toStoredReport } from "../report-input";
import { reportCompanies } from "../report-companies";
const input = { companyName: "Same Transport", weeklyPay: 600, hoursPerWeek: 40 };
test("legacy country-less data remains Irish; foreign/invalid codes do not leak into either market", () => {
  assert.equal(belongsToMarket({}, "IE"), true);
  assert.equal(belongsToMarket({}, "ES"), false);
  assert.equal(belongsToMarket({ countryCode: "GB" }, "ES"), false);
  assert.equal(marketFrom("unknown"), "IE");
});
test("same company name in Spain and Ireland has separate report identities", () => {
  const ie = parseReportInput(input).report!;
  const es = parseReportInput({ ...input, countryCode: "ES" }).report!;
  assert.notEqual(ie.companySlug, es.companySlug);
  assert.equal(es.countryCode, "ES");
  const reports = [toStoredReport(ie), toStoredReport(es)];
  assert.ok(reportCompanies(reports, "ES").some(c => c.slug === es.companySlug));
  assert.ok(!reportCompanies(reports, "ES").some(c => c.slug === ie.companySlug));
  assert.ok(!reportCompanies(reports, "IE").some(c => c.slug === es.companySlug));
});
test("Spanish catalogue matching cannot resolve an Irish company and rejects unsupported countries", () => {
  assert.equal(parseReportInput({ ...input, companyName: "Primafrio", countryCode: "ES" }).report?.companySlug, "es-primafrio");
  assert.notEqual(parseReportInput({ ...input, companyName: "Nolan", countryCode: "ES" }).report?.companySlug, "nolan");
  assert.ok(parseReportInput({ ...input, countryCode: "GB" }).error);
});

test("registered employers have distinct public identities in each market", () => {
  const employers = [{ employerName: "Same Transport" }];
  assert.notEqual(addRegisteredEmployers([], employers, "IE")[0].slug, addRegisteredEmployers([], employers, "ES")[0].slug);
});
