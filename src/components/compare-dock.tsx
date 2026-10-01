"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { XIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/language-provider";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CompareDock() {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { companies, compareSlugs, toggleCompare, clearCompare, ready } = useAppStore();
  const selected = useMemo(
    () => compareSlugs.map((slug) => companies.find((company) => company.slug === slug)).filter(Boolean),
    [compareSlugs, companies],
  );

  if (!ready || selected.length === 0) return null;

  function remove(slug: string) {
    toggleCompare(slug);
    if (pathname === "/compare") router.replace(`/compare?ids=${compareSlugs.filter(item => item !== slug).join(",")}`);
  }
  function clear() {
    clearCompare();
    if (pathname === "/compare") router.replace("/compare?ids=");
  }

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
              className="min-h-11"
              onClick={() => remove(company!.slug)}
            >
              {company!.shortName}
              <XIcon />
            </Button>
          ))}
          <Button size="xs" variant="ghost" className="min-h-11 text-primary-foreground" onClick={clear}>
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
