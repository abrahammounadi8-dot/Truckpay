import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/payslips", "/profile", "/analysis", "/api/"],
    },
    sitemap: "https://mytruckpay.com/sitemap.xml",
    host: "https://mytruckpay.com",
  };
}
