import type { Metadata } from "next";
import { ReportForm } from "@/components/report-form";

export const metadata: Metadata = {
  title: "File a wage slip",
  description:
    "Report weekly take-home in euro for an Irish haulier. Optional quoted weekly — only if they named a figure.",
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        From the settlement
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">File a wage slip</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Use a real settlement. Weekly take-home is required. Quoted weekly is optional — leave it blank if they never named a figure. No star ratings. No invented reviews.
      </p>
      <div className="mt-8">
        <ReportForm defaultCompany={company} />
      </div>
    </div>
  );
}
