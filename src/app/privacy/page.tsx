import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How TruckPay treats driver payroll data in Ireland.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Data minimisation
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          TruckPay splits identity from payroll. You are identified by a random UUID on this device —
          not a PPSN, driving licence, or employee number.
        </p>
        <p>Five layers stay separate:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Account / identity — the random UUID only.</li>
          <li>Original documents — not uploaded; default retention is process-and-delete.</li>
          <li>Extracted payroll — figures you type, private to My TruckPay.</li>
          <li>Normalized payroll — categories and weekly equivalents for your analysis.</li>
          <li>
            Aggregated analytical data — medians and sample sizes for TruckPay Companies, with no
            driver identity. This is pseudonymised aggregation, not a claim that the dataset is anonymous.
          </li>
        </ol>
        <p>
          Deduction labels are stored as printed. Unknown lines are flagged for review. They are never
          classified as illegal or as proof an employer did something wrong.
        </p>
        <p>
          You can delete a single slip or wipe every payslip on this device. Driver-reported public stubs
          are an older, separate flow and are labelled as such. They are not payroll-verified.
        </p>
        <p>
          Company and recruiter accounts are a later phase. They must never gain access to an individual
          driver’s private payslips, payroll history or identity through the company intelligence layer.
        </p>
        <p>
          Contact details on “List your firm” are operator enquiries, not driver payroll, and are not
          mixed into the payslip ledger.
        </p>
      </div>
      <Link href="/payslips" className="mt-8 inline-block text-sm font-medium underline">
        Open My TruckPay
      </Link>
    </div>
  );
}
