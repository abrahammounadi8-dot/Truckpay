import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
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
      <PageIntro kicker="compare.kicker" title="compare.title" lead="compare.lead" />
      <div className="mt-8">
        <CompareTable ids={list} />
      </div>
    </div>
  );
}
