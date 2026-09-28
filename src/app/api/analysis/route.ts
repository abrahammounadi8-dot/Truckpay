import { comparisonDenied } from "@/lib/payroll/access";
import { analyseLatestSet } from "@/lib/payroll/analysis";
import { compareLatestToRecent } from "@/lib/payroll/change";
import { toPublicPayslip } from "@/lib/payroll/format";
import { refreshTenure } from "@/lib/payroll/profile";
import { getProfile } from "@/lib/payroll/profile-store";
import { getOrCreateUserId } from "@/lib/payroll/session";
import { listPayslipsForUser } from "@/lib/payroll/store";

export const runtime = "nodejs";

export async function GET() {
  const denied = await comparisonDenied();
  if (denied) return denied;
  const userId = await getOrCreateUserId();
  const asOf = new Date().toISOString().slice(0, 10);
  const slips = await listPayslipsForUser(userId);
  const profileRaw = await getProfile(userId);
  const profile = profileRaw ? refreshTenure(profileRaw, asOf) : null;
  const analysis = analyseLatestSet(slips, profile);

  const payChange = compareLatestToRecent(slips);

  return Response.json({
    analysis: {
      ...analysis,
      latest: analysis.latest.map(toPublicPayslip),
    },
    profile: profile ? stripUser(profile) : null,
    companyStats: null,
    factors: [],
    payChange,
  });
}

function stripUser<T extends { userId: string }>(value: T): Omit<T, "userId"> {
  const copy = { ...value };
  delete (copy as { userId?: string }).userId;
  return copy as Omit<T, "userId">;
}
