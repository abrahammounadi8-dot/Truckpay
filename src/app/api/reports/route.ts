import { parseReportInput, toStoredReport } from "@/lib/report-input";
import { listReports, saveReport } from "@/lib/report-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get("company") ?? undefined;
  const reports = await listReports(company || undefined);
  return Response.json({ reports });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }

  const parsed = parseReportInput(payload);
  if (parsed.error || !parsed.report) {
    return Response.json({ error: parsed.error ?? "Invalid report." }, { status: 400 });
  }

  const report = await saveReport(toStoredReport(parsed.report));
  return Response.json({ report }, { status: 201 });
}
