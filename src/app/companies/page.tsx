import type { Metadata } from "next";
import { CompanyDirectory } from "@/components/company-directory";

export const metadata: Metadata = {
  title: "Irish haulier directory",
  description:
    "Browse Irish haulage firms. Driver-reported stubs and payroll-verified medians are labelled separately. No invented company salary.",
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        TruckPay Companies · Ireland
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Haulier directory</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Public facts from the operator’s own site. Pay intelligence is split: driver-reported stubs are not
        the same as payroll-verified medians from My TruckPay. TruckPay will not invent a company salary.
      </p>
      <div className="mt-8">
        <CompanyDirectory initialQuery={q ?? ""} />
      </div>
    </div>
  );
}
