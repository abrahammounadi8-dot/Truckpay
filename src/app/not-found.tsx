"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("notFound.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("notFound.body")}</p>
      <Link href="/companies" className={cn(buttonVariants(), "mt-6")}>
        {t("notFound.browse")}
      </Link>
    </div>
  );
}
