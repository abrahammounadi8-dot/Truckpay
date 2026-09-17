"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Access = {
  unlocked: boolean;
  have: number;
  required: number;
};

export function HomeAccessBanner({ access }: { access: Access }) {
  const { t } = useT();

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6">
          {access.unlocked
            ? t("access.unlocked")
            : t("access.locked", { have: access.have, need: access.required })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/welcome" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            {t("access.howItWorks")}
          </Link>
          <Link
            href={access.unlocked ? "/analysis" : "/payslips/new"}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            {access.unlocked ? t("access.openAnalysis") : t("access.addPayslip")}
          </Link>
        </div>
      </div>
    </div>
  );
}
