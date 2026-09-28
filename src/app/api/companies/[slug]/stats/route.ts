import { getCompany } from "@/lib/data";

export const runtime = "nodejs";

/** Payroll-derived public statistics are disabled during the private pilot. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!getCompany(slug)) {
    return Response.json({ error: "Unknown haulier." }, { status: 404 });
  }
  return Response.json(
    { error: "Company payroll statistics are not available." },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}
