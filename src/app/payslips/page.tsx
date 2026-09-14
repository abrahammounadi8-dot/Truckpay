import type { Metadata } from "next";
import Link from "next/link";
import { PayslipList } from "@/components/payslip-list";
import { WipeSession } from "@/components/wipe-session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My TruckPay",
  description: "Private Irish haulage payslips. One slip is not assumed to be one week.",
};

export default function PayslipsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        My TruckPay · private
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">My TruckPay</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Your personal payroll workspace. Check each new slip. Verified analysis needs three unique
            payslips. Nothing here is published as “the company salary”. Delete anytime.
          </p>
        </div>
        <Link href="/payslips/new" className={cn(buttonVariants(), "bg-accent text-accent-foreground hover:bg-accent/90")}>
          Add a payslip
        </Link>
      </div>
      <div className="mt-8">
        <PayslipList />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/analysis" className="underline">
          Open analysis
        </Link>
        {" · "}
        <Link href="/profile" className="underline">
          Employment profile
        </Link>
      </p>
      <div className="mt-10 border-t border-border pt-6">
        <WipeSession />
      </div>
    </div>
  );
}
