import type { Metadata } from "next";
import { ReportForm } from "@/components/report-form";

export const metadata: Metadata = {
  title: "File a pay report",
  description: "Report the CPM, weekly take-home, miles, and home time you actually ran.",
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
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">File a pay report</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Use a settlement, not memory of the recruiter call. Reports are stored on
        the server and show up on the company file. No account required.
      </p>
      <div className="mt-8">
        <ReportForm defaultCompany={company} />
      </div>
    </div>
  );
}
