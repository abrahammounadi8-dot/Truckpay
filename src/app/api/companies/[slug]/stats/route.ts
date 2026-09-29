import { listDirectoryCompanies } from "@/lib/directory-store";
import { resolveEmployer } from "@/lib/payroll/employer";

import { companyPayStats } from "@/lib/payroll/company-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const company = (await listDirectoryCompanies()).find(company => company.slug === slug || resolveEmployer(company.name).employerSlug === slug);
  if (!company) {
    return Response.json({ error: "Unknown haulier." }, { status: 404 });
  }
  const asOf = new Date().toISOString().slice(0, 10);
  const stats = companyPayStats(resolveEmployer(company.name).employerSlug ?? slug, [], [], asOf);
  return Response.json({ stats }, { headers: { "Cache-Control": "no-store" } });
}
