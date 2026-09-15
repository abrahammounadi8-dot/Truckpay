"use client";

import Link from "next/link";
import { useMemo } from "react";
import { XIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/language-provider";
import { fleet } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CompareDock() {
  const { t } = useT();
  const { compareSlugs, toggleCompare, clearCompare, ready } = useAppStore();
  const selected = useMemo(
    () => compareSlugs.map((slug) => fleet.find((company) => company.slug === slug)).filter(Boolean),
    [compareSlugs],
  );

  if (!ready || selected.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2 rounded-xl border border-border bg-primary p-3 text-primary-foreground shadow-lg sm:flex-row sm:items-center">
        <p className="flex-1 text-sm">
          {t("compare.comparing", {
            names: selected.map((company) => company!.shortName).join(" · "),
          })}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map((company) => (
            <Button
              key={company!.slug}
              size="xs"
              variant="secondary"
              onClick={() => toggleCompare(company!.slug)}
            >
              {company!.shortName}
              <XIcon />
            </Button>
          ))}
          <Button size="xs" variant="ghost" className="text-primary-foreground" onClick={clearCompare}>
            {t("compare.clear")}
          </Button>
          <Link
            href={`/compare?ids=${compareSlugs.join(",")}`}
            className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
          >
            {t("compare.open")}
          </Link>
        </div>
      </div>
    </div>
  );
}
