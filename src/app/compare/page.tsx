import type { Metadata } from "next";
import { CompareTable } from "@/components/compare-table";

export const metadata: Metadata = {
  title: "Compare carriers",
  description: "Side-by-side advertised pay, driver-reported take-home, and working conditions.",
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
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Compare</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Put advertised weekly next to reported weekly. Detention, forced dispatch,
        and home time sit on the same line so the recruiter pitch has nowhere to hide.
      </p>
      <div className="mt-8">
        <CompareTable ids={list} />
      </div>
    </div>
  );
}
