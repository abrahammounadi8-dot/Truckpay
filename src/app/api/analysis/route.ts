import { analyseLatestSet } from "@/lib/payroll/analysis";
import { compareLatestToRecent } from "@/lib/payroll/change";
import { companyPayStats } from "@/lib/payroll/company-stats";
import { explainPayDifferences } from "@/lib/payroll/explain";
import { toPublicPayslip } from "@/lib/payroll/format";
import { refreshTenure } from "@/lib/payroll/profile";
import { getProfile, listProfiles } from "@/lib/payroll/profile-store";
import { getOrCreateUserId } from "@/lib/payroll/session";
import { listAllPayslips, listPayslipsForUser } from "@/lib/payroll/store";
import { JOB_TYPE_LABELS, VEHICLE_TYPE_LABELS, SHIFT_TYPE_LABELS } from "@/lib/payroll/types";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getOrCreateUserId();
  const asOf = new Date().toISOString().slice(0, 10);
  const slips = await listPayslipsForUser(userId);
  const profileRaw = await getProfile(userId);
  const profile = profileRaw ? refreshTenure(profileRaw, asOf) : null;
  const analysis = analyseLatestSet(slips, profile);

  const employerSlug = profile?.employerSlug ?? analysis.latest.find((slip) => slip.employerSlug)?.employerSlug ?? null;
  const allSlips = await listAllPayslips();
  const profiles = await listProfiles();
  const company = employerSlug ? companyPayStats(employerSlug, allSlips, profiles, asOf) : null;
  const band = company && profile?.tenureBand ? company.bands.find((item) => item.band === profile.tenureBand) ?? null : null;

  const jobNote = profile
    ? `${JOB_TYPE_LABELS[profile.jobType]}, ${VEHICLE_TYPE_LABELS[profile.vehicleType]}, ${SHIFT_TYPE_LABELS[profile.shiftType]}, ${profile.timeFraction.replaceAll("_", "-")}`
    : "job, vehicle and shift not on file";

  const factors =
    analysis.status === "verified"
      ? explainPayDifferences({
          ownRate: analysis.ownMedianBaseRate,
          ownWeeklyHours: analysis.ownMedianWeeklyHours,
          ownWeeklyGross: analysis.ownMedianWeeklyGross,
          band: band ?? null,
          jobNote,
        })
      : [];

  const payChange = compareLatestToRecent(slips);

  return Response.json({
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
