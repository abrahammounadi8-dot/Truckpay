import type { Metadata } from "next";
import Link from "next/link";
import { PayslipDetail } from "@/components/payslip-detail";
import { buttonVariants } from "@/components/ui/button";
import { toPublicPayslip } from "@/lib/payroll/format";
import { reconcilePayslip } from "@/lib/payroll/reconcile";
import { detectPayslipAnomalies } from "@/lib/payroll/anomalies";
import { readUserId } from "@/lib/payroll/session";
import { getPayslipForUser, listPayslipsForUser } from "@/lib/payroll/store";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payslip",
};

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await readUserId();
  if (!userId) {
    return (
      <MissingSlip message="This slip is not on this device. Open My payslips first so Truckpay can attach a private id." />
    );
  }

  const payslip = await getPayslipForUser(userId, id);
  if (!payslip) {
    return <MissingSlip message="This payslip is not on this device." />;
  }

  const prior = await listPayslipsForUser(userId);
  const findings = reconcilePayslip(payslip, prior);
  const anomalies = detectPayslipAnomalies(payslip, prior, null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PayslipDetail slip={toPublicPayslip(payslip)} findings={findings} anomalies={anomalies} />
    </div>
  );
}

function MissingSlip({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <p className="text-sm text-destructive">{message}</p>
      <Link href="/payslips" className={cn(buttonVariants({ variant: "outline" }))}>
        Back to my slips
      </Link>
    </div>
  );
}
