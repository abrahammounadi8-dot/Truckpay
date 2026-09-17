import { requireComparisonAccess } from "@/lib/payroll/access";
import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { AnalysisBoard } from "@/components/analysis-board";

export const metadata: Metadata = {
  title: "Verified analysis",
  description: "TruckPay Verified Analysis after three unique Irish payslips. One slip is not one week.",
};

export default async function AnalysisPage() {
  await requireComparisonAccess();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageIntro kicker="analysis.kicker" title="analysis.title" lead="analysis.lead" />
      <div className="mt-8">
        <AnalysisBoard />
      </div>
    </div>
  );
}
