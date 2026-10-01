import { it } from 'node:test';
import assert from 'node:assert/strict';
import { change, comparable, metricValue, quarterlyCalendar, reviewWindow, validDate, type ReviewSlip } from './quarterly';

const slip = (overrides: Partial<ReviewSlip> = {}): ReviewSlip => ({
  id: 'one', countryCode: 'IE', currency: 'EUR', employerName: 'Example', employerSlug: 'example',
  paymentDate: '2026-08-31', payPeriodStart: '2026-08-01', payPeriodEnd: '2026-08-31',
  payFrequency: 'monthly', reviewStatus: 'confirmed', netPay: 2400, grossPay: 3000,
  overtimePay: null, deductions: [], allowances: [], ...overrides,
} as ReviewSlip);
const next = () => slip({ id: 'two', paymentDate: '2026-09-30', payPeriodStart: '2026-09-01', payPeriodEnd: '2026-09-30', netPay: 2500 });
it('compares complete consecutive monthly periods with different month lengths', () => {
  assert.equal(comparable(slip(), next()), true);
  assert.equal(change(slip().netPay, next().netPay), 100);
});
it('refuses mixed currencies, countries, frequencies and unconfirmed amounts', () => {
  for (const overrides of [{ currency: 'GBP' }, { countryCode: 'GB' }, { payFrequency: 'weekly' }, { reviewStatus: 'needs_review' }, { payPeriodStart: null }, { payPeriodStart: '2026-09-20' }] as Partial<ReviewSlip>[]) {
    assert.equal(comparable(slip(), { ...next(), ...overrides }), false);
  }
  assert.equal(comparable(slip(), { ...next(), manualAmountAudit: {} as ReviewSlip['manualAmountAudit'] }), false);
});
it('does not connect missing periods or overlapping periods', () => {
  assert.equal(comparable(slip(), slip({ payPeriodStart: '2026-10-01', payPeriodEnd: '2026-10-31' })), false);
  assert.equal(comparable(slip(), slip()), false);
});
it('handles cents, zero and missing values without inventing amounts', () => {
  assert.equal(change(.1, .3), .2);
  assert.equal(change(null, 0), null);
  assert.equal(change(10, 0), -10);
  assert.equal(change(Infinity, 1), null);
  assert.equal(metricValue(slip(), 'deductions'), null);
  assert.equal(metricValue(slip({ netPay: 0 }), 'netPay'), 0);
});
it('filters by calendar months across years, excludes future and invalid dates and deduplicates', () => {
  const records = [slip({ id: 'a', paymentDate: '2025-11-01' }), slip({ id: 'b', paymentDate: '2025-12-31' }), slip({ id: 'c', paymentDate: '2026-01-31' }), slip({ id: 'd', paymentDate: '2026-01-16' }), slip({ id: 'bad', paymentDate: '2025-11-31' })];
  assert.deepEqual(reviewWindow([...records, records[0]], 3, '2026-01-16').map(s => s.id), ['a', 'b', 'd']);
  assert.equal(validDate('2026-02-30'), false);
});
it('calendar repeats every three months and includes no payroll information', () => {
  const ics = quarterlyCalendar('2026-11-30', true);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20270228'));
  assert.ok(ics.includes('RRULE:FREQ=MONTHLY;INTERVAL=3'));
  assert.ok(ics.includes('\r\nBEGIN:VALARM\r\n'));
  assert.ok(!ics.includes('2400'));
  assert.throws(() => quarterlyCalendar('2026-02-30', true));
});
