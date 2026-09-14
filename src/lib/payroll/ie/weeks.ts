/**
 * Irish PAYE / PRSI tax week.
 * Week 1 starts on 1 January of the calendar year. This is not an ISO week.
 * Other countries must not import this module for their own week rules.
 */

export type IrishTaxWeek = {
  year: number;
  week: number;
};

export function irishTaxWeek(isoDate: string): IrishTaxWeek | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  const utc = Date.UTC(year, month - 1, day);
  const asDate = new Date(utc);
  if (
    asDate.getUTCFullYear() !== year ||
    asDate.getUTCMonth() !== month - 1 ||
    asDate.getUTCDate() !== day
  ) {
    return null;
  }
  const dayOfYear = Math.floor((utc - Date.UTC(year, 0, 1)) / 86_400_000) + 1;
  const week = Math.floor((dayOfYear - 1) / 7) + 1;
  if (week < 1 || week > 53) return null;
  return { year, week };
}

export function inclusivePeriodDays(start: string, end: string): number | null {
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}
