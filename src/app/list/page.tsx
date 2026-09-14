import { ListingForm } from "@/components/listing-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "List your firm",
  description:
    "Irish haulage operators can request a Truckpay directory listing. Public facts only — no invented pay or reviews.",
};

export default function ListPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Haulage firms
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight md:text-5xl">
        List your firm
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Truckpay is a public ledger of Irish haulage. Drivers file wage slips. Operators can request a directory entry so the file shows real HQ, lanes and equipment — not invented pay or fake reviews.
      </p>
      <div className="mt-8">
        <ListingForm />
      </div>
    </div>
  );
}
