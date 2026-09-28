import { getCompany } from "@/lib/data";
import { listProfiles } from "@/lib/payroll/profile-store";
import { listAllPayslips } from "@/lib/payroll/store";
import { publicCompanyStats, publicCompanyStatsEnabled } from "@/lib/payroll/public-company-stats";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!getCompany(slug)) {
    return Response.json({ error: "Unknown haulier." }, { status: 404 });
  }
  if (!publicCompanyStatsEnabled()) {
    return Response.json({ stats: null }, { headers: { "Cache-Control": "no-store" } });
  }
  const [payslips, profiles] = await Promise.all([listAllPayslips(), listProfiles()]);
  return Response.json(
    { stats: publicCompanyStats(slug, payslips, profiles) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
