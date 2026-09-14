import { parsePayslipInput, toStoredPayslip } from "@/lib/payroll/parse";
import { getOrCreateUserId } from "@/lib/payroll/session";
import { listPayslipsForUser, savePayslip } from "@/lib/payroll/store";
import { toPublicPayslip } from "@/lib/payroll/format";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getOrCreateUserId();
  const payslips = await listPayslipsForUser(userId);
  return Response.json({ payslips: payslips.map(toPublicPayslip) });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }

  const parsed = parsePayslipInput(payload);
  if (parsed.error || !parsed.input) {
    return Response.json({ error: parsed.error ?? "Invalid payslip." }, { status: 400 });
  }

  const userId = await getOrCreateUserId();
  const payslip = await savePayslip(toStoredPayslip(userId, parsed.input));
  return Response.json({ payslip: toPublicPayslip(payslip) }, { status: 201 });
}
