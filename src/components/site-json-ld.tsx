export function SiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://mytruckpay.com/#website",
        url: "https://mytruckpay.com/",
        name: "MyTruckPay",
        alternateName: ["mytruckpay"],
        description:
          "Private payslip checks and available salary data for transport drivers.",
        inLanguage: ["en-IE", "es", "pl", "pt", "lt", "ro", "ru"],
        publisher: { "@id": "https://mytruckpay.com/#org" },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://mytruckpay.com/companies?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://mytruckpay.com/#org",
        name: "MyTruckPay",
        url: "https://mytruckpay.com/",
        logo: "https://mytruckpay.com/favicon.svg",
        knowsAbout: [
          "Irish haulage payslips",
          "PAYE",
          "PRSI",
          "USC",
          "Irish tax week",
        ],
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
