"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/components/language-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/payslips", key: "nav.myTruckPay" as const, match: ["/payslips", "/profile"] },
  { href: "/companies", key: "nav.companies" as const, match: ["/companies", "/rankings"] },
  { href: "/analysis", key: "nav.analysis" as const, match: ["/analysis"] },
  { href: "/compare", key: "nav.compare" as const, match: ["/compare"] },
];

function isActive(pathname: string, match: string[]) {
  return match.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useT();

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex size-8 items-center justify-center rounded-md bg-accent text-[0.7rem] font-bold tracking-wide text-accent-foreground">
            TP
          </span>
          <span className="font-heading text-xl font-semibold tracking-wide">TruckPay</span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.match);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-foreground/12 text-primary-foreground"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/8 hover:text-primary-foreground",
                )}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher compact />
          </div>
          <Link
            href="/payslips/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden bg-accent text-accent-foreground hover:bg-accent/90 sm:inline-flex",
            )}
          >
            {t("nav.addPayslip")}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 md:hidden"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <XIcon /> : <MenuIcon />}
          </Button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-primary-foreground/10 px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/85 hover:bg-primary-foreground/10"
              >
                {t(link.key)}
              </Link>
            ))}
            <Link
              href="/payslips/new"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-accent"
            >
              {t("nav.addPayslip")}
            </Link>
            <div className="px-3 py-2 sm:hidden">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
