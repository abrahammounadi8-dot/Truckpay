import { companyPayStats } from "@/lib/payroll/company-stats";
import { getCompany } from "@/lib/data";
import { listProfiles } from "@/lib/payroll/profile-store";
import { listAllPayslips } from "@/lib/payroll/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!getCompany(slug)) {
    return Response.json({ error: "Unknown haulier." }, { status: 404 });
  }
  const asOf = new Date().toISOString().slice(0, 10);
  const stats = companyPayStats(slug, await listAllPayslips(), await listProfiles(), asOf);
  return Response.json({ stats });
}
