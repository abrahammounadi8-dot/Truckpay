import type { Metadata } from "next";
import { FaqBoard } from "@/components/faq-board";
import { faqCopy } from "@/lib/seo/faq-copy";

export const metadata: Metadata = {
  title: "How to find MyTruckPay",
  description:
    "MyTruckPay is the Irish haulage payslip site at mytruckpay.com. It is not the US truckpay.com job-board app. Search mytruckpay or MyTruckPay Ireland.",
  alternates: { canonical: "https://mytruckpay.com/faq" },
};

export default function FaqPage() {
  const items = faqCopy("en").items;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqBoard />
    </>
  );
}
