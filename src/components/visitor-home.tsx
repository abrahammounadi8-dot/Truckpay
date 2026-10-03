"use client";
import Link from "next/link";
import { SiteHeader } from "./site-header";
import { HomeCompanyIntro } from "./home-company-intro";
import { useT } from "./language-provider";

export function VisitorHome() {
  const { locale } = useT();
  return <div className="min-h-screen bg-background text-foreground">
    <SiteHeader visitor />
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-8 sm:pt-10">
      <HomeCompanyIntro />
    </main>
    <footer className="px-4 pb-6 text-center text-xs text-muted-foreground">
      <Link href="/privacy" className="inline-flex min-h-11 items-center underline underline-offset-4">{locale === "es" ? "Privacidad y datos" : "Privacy and data"}</Link>
    </footer>
  </div>;
}
