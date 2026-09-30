"use client";

import Link from "next/link";
import Image from "next/image";
import { AccountLink } from "./account-link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { demoCopy, historyCopy } from "@/lib/entry-copy";

const links = [
  { href: "/payslips", key: "nav.myTruckPay" as const, match: ["/payslips", "/profile"] },
  { href: "/companies", key: "nav.companies" as const, match: ["/companies", "/rankings"] },
  { href: "/compare", key: "nav.compare" as const, match: ["/compare"] },
];

function isActive(pathname: string, match: string[]) {
  return match.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

const subscribeToHydration = () => () => {};
const getClientReady = () => true;
const getServerReady = () => false;

export function SiteHeader({ showTruck = true, demoView, hidePrimaryLinks = false, visitor = false }: { showTruck?: boolean; demoView?: string; hidePrimaryLinks?: boolean; visitor?: boolean }) {
  const pathname = usePathname();
  const navReady = useSyncExternalStore(subscribeToHydration, getClientReady, getServerReady);
  const [open, setOpen] = useState(false);
  const { t, locale } = useT();
  const demo = demoView !== undefined;
  const navigationLinks = visitor || hidePrimaryLinks ? [] : links;
  const destination = (href: string) => demo ? `/demo?view=${href.slice(1)}` : href;

  return (
    <header className="sticky top-0 z-50 overflow-visible bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          {showTruck && <Image src="/favicon.svg" width={40} height={40} alt="" className="size-10 shrink-0" unoptimized />}
          <span className="flex shrink-0 flex-col items-start gap-0.5">
            <span className="text-[0.6rem] leading-none font-bold tracking-wide text-[#e2b14a]">MTP</span>
            <span className="font-heading text-lg leading-none font-semibold tracking-tight sm:text-xl">MyTruckPay</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex">
          {navigationLinks.map((link) => {
            const active = navReady && (demo ? demoView === link.href.slice(1) : isActive(pathname, link.match));
            return (
              <Link
                key={link.href}
                href={destination(link.href)}
                aria-current={active ? "page" : undefined}
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
          {demo ? <Link href="/" className="rounded-md border border-current/20 px-3 py-1.5 text-sm">{demoCopy[locale][20]}</Link> : visitor ? <Link href="/account" className="rounded-md border border-current/20 px-4 py-2 text-sm font-medium">{locale === "es" ? "Entrar" : "Sign in"}</Link> : <AccountLink />}
          {!visitor && navigationLinks.length > 0 && <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 md:hidden"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <XIcon /> : <MenuIcon />}
          </Button>}
        </div>
      </div>
      {open && !visitor ? (
        <nav className="border-t border-primary-foreground/10 px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={destination(link.href)}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/85 hover:bg-primary-foreground/10"
              >
                {t(link.key)}
              </Link>
            ))}
            <Link
              href={demo ? "/demo?view=slips" : "/payslips/new"}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-accent"
            >
              {t("nav.addPayslip")}
            </Link>
          </div>
        </nav>
      ) : null}
      <LanguageSwitcher />
      {demo && <aside className="border-t border-amber-300 bg-amber-100 px-5 py-3 text-slate-900" aria-label={demoCopy[locale][0]}>
        <div className="mx-auto max-w-6xl"><strong className="block text-sm">{demoCopy[locale][0]}</strong><p className="mt-1 text-sm">{historyCopy[locale][11]}</p></div>
      </aside>}
    </header>
  );
}
