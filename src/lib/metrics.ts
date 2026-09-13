import type { Company, DriverReport, DriverReview } from "@/lib/types";

export function advertisedWeekly(company: Company): number {
  const { advertised, payType } = company;
  if (payType === "salary" && advertised.salary) {
    return Math.round(advertised.salary / 52);
  }
  if (payType === "hourly" && advertised.hourly) {
    return Math.round(advertised.hourly * 50);
  }
  if (advertised.cpm && advertised.milesPerWeek) {
    return Math.round(advertised.cpm * advertised.milesPerWeek);
  }
  return 0;
}

export function reportedWeekly(company: Company): number {
  return company.reported.weeklyPay;
}

export function payGapDollars(company: Company): number {
  return advertisedWeekly(company) - reportedWeekly(company);
}

export function payGapPercent(company: Company): number {
  const advertised = advertisedWeekly(company);
  if (!advertised) return 0;
  return Math.round(((advertised - reportedWeekly(company)) / advertised) * 100);
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCpm(value?: number): string {
  if (value == null) return "—";
  return `$${value.toFixed(2)}/mi`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export const equipmentLabels: Record<Company["equipment"][number], string> = {
  "dry-van": "Dry van",
  reefer: "Reefer",
  flatbed: "Flatbed",
  tanker: "Tanker",
  specialized: "Specialized",
};

export const operationLabels: Record<Company["operations"][number], string> = {
  otr: "OTR",
  regional: "Regional",
  local: "Local",
  dedicated: "Dedicated",
};

export const payTypeLabels: Record<Company["payType"], string> = {
  cpm: "Per mile",
  salary: "Salary",
  percentage: "Percentage",
  hourly: "Hourly",
};

export function homeTimeLabel(daysOut: number): string {
  if (daysOut <= 1) return "Home daily";
  if (daysOut <= 4) return "Home weekly";
  if (daysOut <= 10) return `~${daysOut} days out`;
  if (daysOut <= 21) return `${daysOut} days out`;
  return "Home time rare";
}

export function mergeReviews(
  seeded: DriverReview[],
  reports: DriverReport[],
  slug: string,
): DriverReview[] {
  const extra: DriverReview[] = reports
    .filter((report) => report.companySlug === slug)
    .map((report) => ({
      ...report,
      pros: [],
      cons: [],
    }));
  return [...extra, ...seeded.filter((review) => review.companySlug === slug)];
}
