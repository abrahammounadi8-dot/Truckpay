import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { CompareDock } from "@/components/compare-dock";
import { LanguageProvider } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PreviewNotice } from "@/components/preview-notice";
import { LOCALE_COOKIE, localeFromRequest, localeMeta } from "@/lib/i18n";
import { AppStoreProvider } from "@/lib/store";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans-family",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600"],
});

const heading = Barlow_Condensed({
  variable: "--font-heading-family",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-family",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mytruckpay.com"),
  title: {
    default: "My TruckPay — Irish haulage payslips",
    template: "%s · My TruckPay",
  },
  description:
    "My TruckPay is for drivers in Ireland: check haulage payslips in private. PAYE, PRSI and USC. A payment is not assumed to be one week. Not the US TruckPay job-board app.",
  applicationName: "My TruckPay",
  alternates: { canonical: "https://mytruckpay.com" },
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: "https://mytruckpay.com",
    siteName: "My TruckPay",
    title: "My TruckPay — Irish haulage payslips",
    description:
      "Private Irish haulage payslip checks. Ireland only. mytruckpay.com",
  },
  twitter: {
    card: "summary",
    title: "My TruckPay — Irish haulage payslips",
    description: "Check Irish haulage payslips in private. mytruckpay.com",
  },
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = localeFromRequest(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get("accept-language"),
  );

  return (
    <html
      lang={localeMeta[locale].htmlLang}
      suppressHydrationWarning
      className={`${sans.variable} ${heading.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LanguageProvider initialLocale={locale}>
          <AppStoreProvider>
            <SiteHeader />
            <PreviewNotice />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <CompareDock />
          </AppStoreProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
