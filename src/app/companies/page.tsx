import type { Metadata } from "next";
import { CompanyDirectory } from "@/components/company-directory";

export const metadata: Metadata = {
  title: "Irish haulier directory",
  description:
    "Browse Irish haulage firms by county, equipment and lanes. Pay figures appear only from driver-filed wage slips.",
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
        Ireland · the board
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Haulier directory</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Public facts from the operator’s own site. Take-home is blank until a driver files a wage slip. Add up to three firms to compare.
      </p>
      <div className="mt-8">
        <CompanyDirectory initialQuery={q ?? ""} />
      </div>
    </div>
  );
}
