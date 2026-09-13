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
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">File a pay report</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Use a settlement, not memory of the recruiter call. Reports in this build
        stay in your browser so you can try the flow without an account.
      </p>
      <div className="mt-8">
        <ReportForm defaultCompany={company} />
      </div>
    </div>
  );
}
