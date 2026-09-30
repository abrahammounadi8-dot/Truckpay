import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readUserId } from "@/lib/payroll/session";
import { PageIntro } from "@/components/page-intro";
import { PayslipForm } from "@/components/payslip-form";

export const metadata: Metadata = {
  title: "Add a payslip",
  description:
    "Drop an Irish payslip PDF or photo, then check the figures. A payment may cover more than one week.",
};

export default async function NewPayslipPage() {
  if (!await readUserId()) redirect("/account?next=%2Fpayslips%2Fnew");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageIntro kicker="form.kicker" title="form.title" lead="form.lead" />
      <div className="mt-8">
        <PayslipForm />
      </div>
    </div>
  );
}
