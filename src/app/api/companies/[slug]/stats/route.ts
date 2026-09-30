import { listDirectoryWithPayStats } from "@/lib/directory-store";
import { resolveEmployer } from "@/lib/payroll/employer";



export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const { companies, payStats } = await listDirectoryWithPayStats();
  const company = companies.find(company => company.slug === slug || resolveEmployer(company.name).employerSlug === slug);
  if (!company) {
    return Response.json({ error: "Unknown haulier." }, { status: 404 });
  }
  const stats = payStats[company.slug];
  return Response.json({ stats }, { headers: { "Cache-Control": "no-store" } });
}
