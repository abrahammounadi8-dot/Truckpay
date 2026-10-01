import type { Payslip } from './types';

export type ReviewSlip = Omit<Payslip, 'userId'>;
export type ReviewMetric = 'netPay' | 'grossPay' | 'overtimePay' | 'deductions';
export function metricValue(s: ReviewSlip, metric: ReviewMetric) {
  if (metric !== 'deductions') return s[metric];
  // Empty extraction is unknown, not zero. This includes non-tax deductions.
  return s.deductions.length && s.deductions.every(d => Number.isFinite(d.amount))
    ? s.deductions.reduce((sum, d) => sum + Math.round(d.amount * 100), 0) / 100 : null;
}
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function reviewWindow(slips: readonly ReviewSlip[], months: number, today: string) {
  const end = new Date(today + 'T00:00:00Z');
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + 1, 1)).toISOString().slice(0, 10);
  const seen = new Set<string>();
  return slips.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return validDate(s.paymentDate) && s.paymentDate >= start && s.paymentDate <= today;
  }).sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
}
export function comparable(a: ReviewSlip, b: ReviewSlip) {
  if (a.countryCode !== b.countryCode || a.currency !== b.currency || a.payFrequency !== b.payFrequency || a.payFrequency === 'unknown') return false;
  if (a.reviewStatus !== 'confirmed' || b.reviewStatus !== 'confirmed' || a.manualAmountAudit || b.manualAmountAudit) return false;
  if (![a.payPeriodStart, a.payPeriodEnd, b.payPeriodStart, b.payPeriodEnd].every(d => d && validDate(d))) return false;
  const length = (s: ReviewSlip) => (Date.parse(s.payPeriodEnd!) - Date.parse(s.payPeriodStart!)) / 86400000 + 1;
  const al = length(a), bl = length(b);
  const expected = a.payFrequency === 'weekly' ? [7, 7] : a.payFrequency === 'fortnightly' ? [14, 14] : a.payFrequency === 'lunar' ? [28, 28] : [28, 31];
  return al >= expected[0] && al <= expected[1] && bl >= expected[0] && bl <= expected[1]
    && Date.parse(b.payPeriodStart!) - Date.parse(a.payPeriodEnd!) === 86400000;
}
export function change(a: number | null, b: number | null) {
  return a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b) ? null : (Math.round(b * 100) - Math.round(a * 100)) / 100;
}
export function quarterlyCalendar(today: string, es: boolean) {
  if (!validDate(today)) throw new Error('Invalid date');
  const d = new Date(today + 'T00:00:00Z');
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 3, 1));
  // Clamp month-end dates so every quarterly occurrence exists.
  next.setUTCDate(Math.min(d.getUTCDate(), 28));
  const date = next.toISOString().slice(0, 10).replaceAll('-', '');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MyTruckPay//Quarterly review//EN','BEGIN:VEVENT',
    'UID:quarterly-review-' + date + '@mytruckpay.com','DTSTAMP:' + today.replaceAll('-', '') + 'T000000Z','DTSTART;VALUE=DATE:' + date,
    'RRULE:FREQ=MONTHLY;INTERVAL=3', 'SUMMARY:' + (es ? 'MyTruckPay: revision trimestral' : 'MyTruckPay: quarterly review'),
    'DESCRIPTION:' + (es ? 'Completa las nominas pendientes y revisa tus cambios.' : 'Add missing payslips and review changes.'),
    'URL:https://mytruckpay.com/payslips','BEGIN:VALARM','TRIGGER:-PT9H','ACTION:DISPLAY','DESCRIPTION:MyTruckPay','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
