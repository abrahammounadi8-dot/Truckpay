import type { Metadata } from "next";
import { AnalysisBoard } from "@/components/analysis-board";

export const metadata: Metadata = {
  title: "Verified analysis",
  description: "TruckPay Verified Analysis after three unique Irish payslips. One slip is not one week.",
};

export default function AnalysisPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Latest three slips
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Payroll analysis</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Verified analysis needs three unique payslips for the current job, with pay date and period
        extracted. Missing periods are warned. Duplicates are rejected. This is not an accusation of
        the employer.
      </p>
      <div className="mt-8">
        <AnalysisBoard />
      </div>
    </div>
  );
}
