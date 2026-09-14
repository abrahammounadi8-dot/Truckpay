import { detectPayslipAnomalies } from "@/lib/payroll/anomalies";
import { toPublicPayslip } from "@/lib/payroll/format";
import { publicError } from "@/lib/payroll/privacy";
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
    return Response.json(publicError("Payslip not found."), { status: 404 });
  }
  const prior = await listPayslipsForUser(userId);
  const findings = reconcilePayslip(payslip, prior);
  const anomalies = detectPayslipAnomalies(payslip, prior, null);
  return Response.json({ payslip: toPublicPayslip(payslip), findings, anomalies });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const userId = await getOrCreateUserId();
  const ok = await deletePayslip(userId, id);
  if (!ok) {
    return Response.json(publicError("Payslip not found."), { status: 404 });
  }
  return Response.json({ ok: true });
}
