import type { Metadata } from "next";
import { RankingsBoard } from "@/components/rankings-board";

export const metadata: Metadata = {
  title: "Pay gap rankings",
  description:
    "Irish hauliers ranked by quoted weekly versus driver-filed take-home. Empty until real slips land.",
};

export default function RankingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Worst first · Ireland
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Pay gap rankings</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Ranked only when a driver filed both take-home and the weekly figure they were quoted. Truckpay does not invent either number.
      </p>
      <div className="mt-10">
        <RankingsBoard />
      </div>
    </div>
  );
}
