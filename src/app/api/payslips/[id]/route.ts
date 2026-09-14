import { toPublicPayslip } from "@/lib/payroll/format";
import { reconcilePayslip } from "@/lib/payroll/reconcile";
import { getOrCreateUserId } from "@/lib/payroll/session";
import { deletePayslip, getPayslipForUser, listPayslipsForUser } from "@/lib/payroll/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const userId = await getOrCreateUserId();
  const payslip = await getPayslipForUser(userId, id);
  if (!payslip) {
    return Response.json({ error: "Payslip not found." }, { status: 404 });
  }
  const prior = await listPayslipsForUser(userId);
  const findings = reconcilePayslip(payslip, prior);
  return Response.json({ payslip: toPublicPayslip(payslip), findings });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const userId = await getOrCreateUserId();
  const ok = await deletePayslip(userId, id);
  if (!ok) {
    return Response.json({ error: "Payslip not found." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
