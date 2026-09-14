import type { Metadata } from "next";
import { CompareTable } from "@/components/compare-table";

export const metadata: Metadata = {
  title: "Compare hauliers",
  description: "Side-by-side Irish haulage: public facts, and pay only where drivers have filed slips.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const list = ids ? ids.split(",").map((id) => id.trim()).filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Side by side
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Compare</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        HQ, equipment and lanes sit on one line. Driver-reported take-home appears only if drivers have
        filed public stubs. That is not payroll-verified company pay.
      </p>
      <div className="mt-8">
        <CompareTable ids={list} />
      </div>
    </div>
  );
}
