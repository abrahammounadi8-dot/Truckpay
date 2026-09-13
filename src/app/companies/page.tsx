import type { Metadata } from "next";
import { CompanyDirectory } from "@/components/company-directory";

export const metadata: Metadata = {
  title: "Company directory",
  description: "Browse trucking companies by advertised pay, driver-reported take-home, and working conditions.",
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Company directory</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every card shows the recruiting number next to what drivers say they actually
        take home. Add up to three carriers to compare.
      </p>
      <div className="mt-8">
        <CompanyDirectory initialQuery={q ?? ""} />
      </div>
    </div>
  );
}
