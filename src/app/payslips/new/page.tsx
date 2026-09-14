import type { Metadata } from "next";
import { PayslipForm } from "@/components/payslip-form";

export const metadata: Metadata = {
  title: "Check a payslip",
  description:
    "Enter Irish payslip figures. A payment may cover more than one week. Unknown deductions stay unknown.",
};

export default function NewPayslipPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        From the slip · not from memory of the week
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Check a payslip</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Copy payment date, period, hours, rates, gross, net and each deduction line. Do not type a
        PPSN, licence or employee number. Truckpay does not assume one slip is one working week.
      </p>
      <div className="mt-8">
        <PayslipForm />
      </div>
    </div>
  );
}
