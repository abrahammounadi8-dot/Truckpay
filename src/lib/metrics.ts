import type { Company, DriverReport, PayType } from "@/lib/types";

export type CompanyStats = {
  count: number;
  avgWeekly: number | null;
  avgQuoted: number | null;
  avgKm: number | null;
  avgHours: number | null;
  gapEuro: number | null;
  gapPercent: number | null;
};

export function companyStats(slug: string, reports: DriverReport[]): CompanyStats {
  const list = reports.filter((report) => report.companySlug === slug);
  if (list.length === 0) {
    return {
      count: 0,
      avgWeekly: null,
      avgQuoted: null,
      avgKm: null,
      avgHours: null,
      gapEuro: null,
      gapPercent: null,
    };
  }
  const avg = (values: number[]) =>
    Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const weeklies = list.map((report) => report.weeklyPay);
  const quoted = list
    .map((report) => report.quotedWeekly)
    .filter((value): value is number => typeof value === "number");
  const kms = list
    .map((report) => report.kmPerWeek)
    .filter((value): value is number => typeof value === "number");
  const avgWeekly = avg(weeklies);
  const avgQuoted = quoted.length ? avg(quoted) : null;
  const gapEuro = avgQuoted != null ? avgQuoted - avgWeekly : null;
  const gapPercent =
    avgQuoted && avgQuoted > 0 && gapEuro != null
      ? Math.round((gapEuro / avgQuoted) * 100)
      : null;

  return {
    count: list.length,
    avgWeekly,
    avgQuoted,
    avgKm: kms.length ? avg(kms) : null,
    avgHours: avg(list.map((report) => report.hoursPerWeek)),
    gapEuro,
    gapPercent,
  };
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IE").format(value);
}

export const equipmentLabels: Record<Company["equipment"][number], string> = {
  curtain: "Curtain / box",
  reefer: "Reefer",
  flatbed: "Flatbed",
  tanker: "Tanker",
  specialized: "Specialized",
};

export const operationLabels: Record<Company["operations"][number], string> = {
  domestic: "Island of Ireland",
  uk: "UK",
  europe: "Europe",
};

export const payTypeLabels: Record<PayType, string> = {
  hourly: "Hourly",
  day: "Day rate",
  salary: "Salary",
  percentage: "Percentage",
};

export function reportsFor(reports: DriverReport[], slug: string): DriverReport[] {
  return reports
    .filter((report) => report.companySlug === slug)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt) || b.id.localeCompare(a.id));
}

export function boardTotals(reports: DriverReport[]) {
  const withQuote = reports.filter((report) => report.quotedWeekly != null);
  const gapPercents = withQuote
    .map((report) => {
      const quoted = report.quotedWeekly!;
      if (quoted <= 0) return null;
      return Math.round(((quoted - report.weeklyPay) / quoted) * 100);
    })
    .filter((value): value is number => value != null);

  return {
    slipCount: reports.length,
    avgGapPercent: gapPercents.length
      ? Math.round(gapPercents.reduce((sum, value) => sum + value, 0) / gapPercents.length)
      : null,
  };
}
