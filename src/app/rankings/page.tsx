import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { RankingsBoard } from "@/components/rankings-board";

export const metadata: Metadata = {
  title: "Pay gap rankings",
  description:
    "Irish hauliers ranked by quoted weekly versus driver-filed take-home. Empty until real slips land.",
};

export default async function RankingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageIntro kicker="rankings.kicker" title="rankings.title" lead="rankings.lead" />
      <div className="mt-10">
        <RankingsBoard />
      </div>
    </div>
  );
}
