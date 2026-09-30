import "server-only";
import { unstable_cache } from "next/cache";
import type { Company } from "./types";
import { reviewedCompanyAddress, selectCompanyAddress } from "./company-address";

const lookup = unstable_cache(async (name: string) => {
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", name);
    url.searchParams.set("limit", "10");
    const response = await fetch(url, { signal: AbortSignal.timeout(3000), headers: { "User-Agent": "MyTruckPay/1.0 (https://mytruckpay.com)" }, cache: "no-store" });
    if (!response.ok) return null;
    return selectCompanyAddress(name, await response.json()) ?? null;
  } catch { return null; }
}, ["public-company-address-v1"], { revalidate: 86400 });

/** Only publicly listed company names cross this boundary; no profile or payslip fields. */
export async function addPublicAddresses(companies: Company[]): Promise<Company[]> {
  const result = [...companies];
  let index = 0;
  // Bound concurrency to avoid overwhelming the public geocoder on a cold cache.
  await Promise.all(Array.from({ length: Math.min(2, companies.length) }, async () => {
    while (index < companies.length) {
      const position = index++;
      const company = companies[position];
      // Address/cache availability must never prevent access to salary statistics.
      const publicAddress = reviewedCompanyAddress(company.name) ?? await lookup(company.name).catch(() => null);
      if (publicAddress) result[position] = { ...company, publicAddress };
    }
  }));
  return result;
}

