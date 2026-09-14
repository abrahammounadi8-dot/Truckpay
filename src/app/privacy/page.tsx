import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Truckpay treats driver payroll data in Ireland.",
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
          Truckpay splits identity from payroll. You are identified by a random UUID on this device —
          not a PPSN, driving licence, or employee number.
        </p>
        <p>
          Payslips you check stay on your session. They are not written to the public haulier board.
          Original documents are not uploaded; there is nothing to retain by default.
        </p>
        <p>
          Deduction labels are stored as printed. Unknown lines are flagged for review. They are never
          classified as illegal or as proof an employer did something wrong.
        </p>
        <p>
          You can delete a single slip or wipe every payslip on this device. The public directory only
          shows facts firms publish about themselves, plus optional community reports that are a
          separate, older flow.
        </p>
        <p>
          Contact details on “List your firm” are operator enquiries, not driver payroll, and are not
          mixed into the payslip ledger.
        </p>
      </div>
      <Link href="/payslips" className="mt-8 inline-block text-sm font-medium underline">
        Open my payslips
      </Link>
    </div>
  );
}
