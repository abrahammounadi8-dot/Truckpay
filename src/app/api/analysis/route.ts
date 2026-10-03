import { payrollCountry } from "@/lib/payroll/country";
import { comparisonAccess } from "@/lib/payroll/access-state";
import { analyseLatestSet } from "@/lib/payroll/analysis";
import { compareLatestToRecent } from "@/lib/payroll/change";
import { companyPayStats } from "@/lib/payroll/company-stats";
import { publicStatisticsSource } from "@/lib/payroll/public-statistics-source";
import type { PayFactor } from "@/lib/payroll/explain";
import { toPublicPayslip } from "@/lib/payroll/format";
import { employmentStartFor, profileAtPayslip, payslipTenureDate, validateEmploymentStart } from "@/lib/payroll/employment-month";
import { getProfile } from "@/lib/payroll/profile-store";
import { privateApiIdentity, privateJson } from "@/lib/payroll/session";
import { listPayslipsForUser } from "@/lib/payroll/store";


export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;

  const asOf = new Date().toISOString().slice(0, 10);
  const employerFilter = new URL(request.url).searchParams.get("employer");
  const slips = (await listPayslipsForUser(userId)).filter(s => s.countryCode === payrollCountry(request) && !s.manualAmountAudit && (!employerFilter || s.employerSlug === employerFilter));
  const profileRaw = await getProfile(userId);
  const selected = analyseLatestSet(slips, null);
  const reference = selected.latest[0];
  const start = employmentStartFor(profileRaw, reference?.employerSlug);
  if (reference && (!start || validateEmploymentStart(start.startMonth, reference.employerSlug ?? "", slips, payslipTenureDate(reference)))) return privateJson({ employmentRequired: { employerName: reference.employerName ?? reference.employerSlug ?? "", asOf: payslipTenureDate(reference) } });
  const access = comparisonAccess(slips, profileRaw);
  if (!access.unlocked) return privateJson({ code: "PAYSLIPS_REQUIRED", ...access }, { status: 403 });
  const profile = reference ? profileAtPayslip(profileRaw, reference) : null;
  const analysis = analyseLatestSet(slips, profile);

  const employerSlug = reference?.employerSlug ?? analysis.latest.find((slip) => slip.employerSlug)?.employerSlug ?? null;
  const publicSource = await publicStatisticsSource();
  const company = employerSlug ? companyPayStats(employerSlug, publicSource.payslips.filter(slip => slip.countryCode === reference?.countryCode && slip.currency === reference?.currency), publicSource.profiles.filter(profile => profile.countryCode === reference?.countryCode), asOf) : null;
  const band = company && profile?.tenureBand ? company.bands.find((item) => item.band === profile.tenureBand) ?? null : null;

  const factors: PayFactor[] = analysis.status === "verified" && band != null ? analysis.ownNetByFrequency.flatMap(own => {
    const peer = band.netByFrequency.find(group => group.frequency === own.frequency && group.driverCount > 1);
    return peer ? [{ factor: "net" as const, epistemic: "fact" as const, yours: own.medianNet, peerMedian: peer.medianNet, summary: "Net pay medians compared at the same pay frequency and tenure band. Different tax circumstances and duties can affect take-home pay." }] : [];
  }) : [];

  const payChange = compareLatestToRecent(slips);

  return privateJson({
    analysis: {
      ...analysis,
      latest: analysis.latest.map(toPublicPayslip),
    },
    profile: profile ? stripUser(profile) : null,
    companyStats: company,
    factors,
    payChange,
  });
}

function stripUser<T extends { userId: string }>(value: T): Omit<T, "userId"> {
  const copy = { ...value };
  delete (copy as { userId?: string }).userId;
  return copy as Omit<T, "userId">;
}
