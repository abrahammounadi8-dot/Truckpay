import { detectPayslipAnomalies } from "@/lib/payroll/anomalies";
import { toPublicPayslip } from "@/lib/payroll/format";
import { publicError } from "@/lib/payroll/privacy";
import { reconcilePayslip } from "@/lib/payroll/reconcile";
import { privateApiIdentity, privateJson } from "@/lib/payroll/session";
import { deletePayslip, getPayslipForUser, listPayslipsForUser } from "@/lib/payroll/store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  const { id } = await context.params;
  const payslip = await getPayslipForUser(userId, id);
  if (!payslip) {
    return privateJson(publicError("Payslip not found."), { status: 404 });
  }
  const prior = await listPayslipsForUser(userId);
  const findings = reconcilePayslip(payslip, prior);
  const anomalies = detectPayslipAnomalies(payslip, prior, null);
  return privateJson({ payslip: toPublicPayslip(payslip), findings, anomalies });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  const { id } = await context.params;
  const ok = await deletePayslip(userId, id);
  if (!ok) {
    return privateJson(publicError("Payslip not found."), { status: 404 });
  }
  return privateJson({ ok: true });
}
