"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatEuroMaybe, payslipTitle } from "@/lib/payroll/format";
import { FREQUENCY_LABELS, REQUIRED_PAYSLIPS, type Payslip } from "@/lib/payroll/types";
import { cn } from "@/lib/utils";

type PublicPayslip = Omit<Payslip, "userId">;

export function PayslipList() {
  const [slips, setSlips] = useState<PublicPayslip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/payslips", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load"))))
        .then((data: { payslips?: PublicPayslip[] }) => setSlips(data.payslips ?? []))
        .catch(() => setError("Payslips could not be loaded."));
    }
    load();
    window.addEventListener("truckpay-payslips-changed", load);
    return () => window.removeEventListener("truckpay-payslips-changed", load);
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (slips == null) {
    return <p className="text-sm text-muted-foreground">Loading your slips…</p>;
  }
  if (slips.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold">No payslips on this device yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the first of three unique slips. It is not posted to the public board.
        </p>
        <Link href="/payslips/new" className={cn(buttonVariants(), "mt-5 inline-flex")}>
          Check a payslip
        </Link>
      </div>
    );
  }

  const towardVerified = Math.min(slips.length, REQUIRED_PAYSLIPS);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {towardVerified} of {REQUIRED_PAYSLIPS} unique slips toward TruckPay Verified Analysis. Duplicates
        are rejected. One slip is not one week.
      </p>
      <ul className="space-y-3">
      {slips.map((slip) => (
        <li key={slip.id}>
          <Link
            href={`/payslips/${slip.id}`}
            className="flex flex-col gap-1 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/10 hover:ring-foreground/20 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-heading text-xl font-semibold">{payslipTitle(slip)}</p>
              <p className="text-xs text-muted-foreground">
                {FREQUENCY_LABELS[slip.payFrequency]}
                {slip.employmentWeeks != null ? ` · ${slip.employmentWeeks} insurable week(s)` : ""}
                {slip.reviewStatus === "needs_review" ? " · needs review" : ""}
              </p>
            </div>
            <p className="font-heading text-2xl font-semibold tabular-nums">
              {formatEuroMaybe(slip.netPay ?? slip.grossPay ?? slip.basicPay)}
            </p>
          </Link>
        </li>
      ))}
      </ul>
    </div>
  );
}
