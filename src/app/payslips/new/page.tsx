import type { Metadata } from "next";
import { PayslipForm } from "@/components/payslip-form";

export const metadata: Metadata = {
  title: "Add a payslip",
  description:
    "Drop an Irish payslip PDF or photo, then check the figures. A payment may cover more than one week.",
};

export default function NewPayslipPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        From the slip · not from memory of the week
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Add a payslip</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Drop the PDF or photo at the top of the form. Then check the figures. Do not type a PPSN, licence
        or employee number. Truckpay does not assume one slip is one working week.
      </p>
      <div className="mt-8">
        <PayslipForm />
      </div>
    </div>
  );
}
