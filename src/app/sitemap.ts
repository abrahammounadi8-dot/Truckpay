import type { MetadataRoute } from "next";
import { fleet } from "@/lib/data";

const site = "https://mytruckpay.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicPages = [
    "",
    "/companies",
    "/rankings",
    "/compare",
    "/welcome",
    "/privacy",
    "/faq",
    "/report",
    "/list",
  ].map((path) => ({
    url: `${site}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const companies = fleet.map((company) => ({
    url: `${site}/companies/${company.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...publicPages, ...companies];
}
