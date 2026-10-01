import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { LanguageProvider } from "@/components/language-provider";
import { SiteJsonLd } from "@/components/site-json-ld";
import { LOCALE_COOKIE, localeFromRequest, localeMeta } from "@/lib/i18n";
import "./globals.css";
import "./entry.css";
import { ApplicationFrame } from "@/components/application-frame";

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
    default: "MyTruckPay — Driver payslips",
    template: "%s · MyTruckPay",
  },
  description:
    "Understand your pay, keep your payslip history together and explore available salary data from transport companies with MyTruckPay.",
  applicationName: "MyTruckPay",
  alternates: { canonical: "https://mytruckpay.com" },
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: "https://mytruckpay.com",
    siteName: "MyTruckPay",
    title: "MyTruckPay — Driver payslips",
    description:
      "Understand your pay and keep your payslip history together. mytruckpay.com",
  },
  twitter: {
    card: "summary",
    title: "MyTruckPay — Driver payslips",
    description: "Check your payslips in private. mytruckpay.com",
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
        <SiteJsonLd />
        <LanguageProvider initialLocale={locale}>
          <ApplicationFrame>{children}</ApplicationFrame>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
