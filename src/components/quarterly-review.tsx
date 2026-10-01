"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useT } from './language-provider';
import { groupPayslipsByEmployer } from '@/lib/payroll/history';
import { change, comparable, metricValue, quarterlyCalendar, reviewWindow, type ReviewMetric, type ReviewSlip } from '@/lib/payroll/quarterly';
import { frequencyMessageKey } from '@/lib/i18n';

export function QuarterlyReview({ slips, profileEmployers = [] }: { slips: ReviewSlip[]; profileEmployers?: {slug:string;name:string}[] }) {
  const { locale, t } = useT();
  const es = locale === 'es';
  const copy = (a: string, b: string) => es ? a : b;
  const [months, setMonths] = useState(3);
  const [selection, setSelection] = useState('');
  const [metric, setMetric] = useState<ReviewMetric>('netPay');
  const [selectedId, setSelectedId] = useState('');
  const [calendarDownloaded, setCalendarDownloaded] = useState(false);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const groups = groupPayslipsByEmployer(slips).flatMap(group => {
    const partitions = new Map<string, ReviewSlip[]>();
    for (const s of group.slips) {
      const key = JSON.stringify([s.countryCode, s.currency, s.payFrequency]);
      partitions.set(key, [...(partitions.get(key) ?? []), s]);
    }
    return [...partitions].map(([key, records]) => ({ key: group.key + key, label: `${group.label ?? t('detail.employerMissing')} · ${records[0].countryCode} · ${records[0].currency} · ${t(frequencyMessageKey(records[0].payFrequency))}`, records }));
  });
  for (const employer of profileEmployers) {
    if (!slips.some(s => s.employerSlug === employer.slug || (!s.employerSlug && s.employerName?.trim().toLowerCase() === employer.name.trim().toLowerCase()))) {
      groups.push({ key: 'profile:' + employer.slug, label: employer.name, records: [] });
    }
  }
  const selector = (key: string) => <label className="block min-w-0 text-sm font-medium">{copy('Empresa y tipo de cobro', 'Employer and pay frequency')}<select className="mt-1 min-h-12 w-full rounded-lg border bg-background p-2" value={key} onChange={e => { setSelection(e.target.value); setSelectedId(''); }}>{groups.map(g => <option key={g.key} value={g.key}>{g.label}{g.records.length ? '' : copy(' · Sin nóminas', ' · No payslips')}</option>)}</select></label>;
  const group = groups.find(g => g.key === selection) ?? groups[0];
  if (!group) return null;
  if (!group.records.length) return <section aria-labelledby="quarterly-title" className="overflow-hidden rounded-2xl border bg-card shadow-md">
    <div className="border-b-4 border-accent bg-primary p-5 text-primary-foreground"><h2 id="quarterly-title" className="font-heading text-3xl font-semibold">{copy('Tu revisión trimestral', 'Your quarterly review')}</h2></div>
    <div className="space-y-4 p-5">{selector(group.key)}<h3 className="font-semibold">{copy('Sin nóminas para revisar', 'No payslips to review')}</h3><p className="text-sm">{copy('Esta empresa está en tu perfil laboral. Añade sus nóminas para ver la evolución de tus cobros.', 'This employer is in your employment profile. Add their payslips to see your pay history.')}</p><Link href="/payslips/new" className="inline-flex min-h-12 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">{copy('Añadir nóminas', 'Add payslips')}</Link></div>
  </section>;
  const records = reviewWindow(group.records, months, today);
  const latest = records.at(-1);
  const previous = records.at(-2);
  const selected = records.find(s => s.id === selectedId) ?? latest;
  const money = (n: number | null | undefined) => n == null || !Number.isFinite(n) ? '—' : new Intl.NumberFormat(locale, { style: 'currency', currency: group.records[0].currency }).format(n);
  const labels = { netPay: copy('Neto recibido', 'Net received'), grossPay: copy('Bruto', 'Gross pay'), overtimePay: copy('Horas extra · importe', 'Overtime pay'), deductions: copy('Descuentos registrados', 'Recorded deductions') };
  const points = records.map(s => ({ slip: s, value: metricValue(s, metric) }));
  const values = points.flatMap(p => p.value != null && Number.isFinite(p.value) ? [p.value] : []);
  const min = Math.min(0, ...values), max = Math.max(1, ...values);
  const x = (i: number) => records.length === 1 ? 320 : 48 + i / Math.max(1, records.length - 1) * 550;
  const y = (v: number) => 185 - (v - min) / (max - min) * 155;
  const delta = latest && previous && comparable(previous, latest) ? change(previous.netPay, latest.netPay) : null;
  const uncertain = records.filter(s => s.reviewStatus !== 'confirmed' || s.manualAmountAudit || s.deductions.some(d => d.needsReview));
  const start = new Date(today + 'T00:00:00Z');
  const monthsInWindow = Array.from({ length: months }, (_, i) => new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - months + 1 + i, 1)).toISOString().slice(0, 7));
  const missingMonths = monthsInWindow.filter(m => !records.some(s => s.paymentDate.startsWith(m)));
  function downloadCalendar() {
    const url = URL.createObjectURL(new Blob([quarterlyCalendar(today, es)], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'mytruckpay-trimestral.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setCalendarDownloaded(true);
  }
  return <section aria-labelledby="quarterly-title" className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
    <div className="border-b-4 border-accent bg-primary p-5 text-primary-foreground sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{copy('Entiende tus cobros', 'Understand your pay')}</p>
      <h2 id="quarterly-title" className="mt-2 font-heading text-3xl font-semibold">{copy('Tu revisión trimestral', 'Your quarterly review')}</h2>
      <p className="mt-2 text-sm">{copy('Descubre qué ha cambiado y qué conviene revisar.', 'See what changed and what is worth checking.')}</p>
    </div>
    <div className="space-y-5 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {selector(group.key)}
        <label className="text-sm font-medium">{copy('Período', 'Period')}<select className="mt-1 min-h-12 w-full rounded-lg border bg-background p-2" value={months} onChange={e => setMonths(Number(e.target.value))}>{[3, 6, 12].map(n => <option key={n} value={n}>{n} {copy('meses', 'months')}</option>)}</select></label>
        <label className="text-sm font-medium">{copy('Qué quieres ver', 'What to view')}<select className="mt-1 min-h-12 w-full rounded-lg border bg-background p-2" value={metric} onChange={e => setMetric(e.target.value as ReviewMetric)}>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </div>
      <p className="text-xs text-muted-foreground">{monthsInWindow[0]} — {today} · {copy('Según fecha de cobro. Solo incluye tus nóminas guardadas; el mes actual puede estar incompleto.', 'By payment date. Includes saved payslips only; the current month may be incomplete.')}</p>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-accent/15 p-4"><dt className="text-sm">{copy('Último neto del período', 'Latest net in this period')}</dt><dd className="mt-2 text-2xl font-semibold">{money(latest?.netPay)}</dd></div>
        <div className="rounded-xl bg-muted p-4"><dt className="text-sm">{copy('Cambio frente al cobro anterior', 'Change from previous payment')}</dt><dd className="mt-2 text-2xl font-semibold">{delta != null && delta > 0 ? '+' : ''}{money(delta)}</dd><p className="mt-1 text-xs">{delta == null ? copy('Necesitamos dos períodos completos comparables y datos confirmados.', 'Two comparable full periods and confirmed data are needed.') : copy('Cambio observado; no implica un error.', 'Observed change; this does not establish an error.')}</p></div>
        <div className="rounded-xl bg-muted p-4"><dt className="text-sm">{copy('Nóminas en este período', 'Payslips in this period')}</dt><dd className="mt-2 text-2xl font-semibold">{records.length}</dd></div>
      </dl>
      {latest && previous && delta != null && <details className="rounded-xl border p-4"><summary className="min-h-11 cursor-pointer font-semibold">{copy('Qué cambió entre los dos últimos cobros', 'What changed between the last two payments')}</summary><p className="mb-3 text-xs">{previous.paymentDate} → {latest.paymentDate}. {copy('Diferencias de conceptos disponibles; no atribuyen por sí solas la causa del cambio de neto.', 'Differences in available items; these alone do not establish why net pay changed.')}</p><dl className="grid grid-cols-2 gap-3 text-sm">{(['grossPay', 'overtimePay', 'deductions'] as const).map(key => { const difference = change(metricValue(previous, key), metricValue(latest, key)); return <div key={key} className="contents"><dt>{labels[key]}</dt><dd>{difference != null && difference > 0 ? '+' : ''}{money(difference)}</dd></div>; })}</dl></details>}
      {values.length > 0 ? <div>
        <svg viewBox="0 0 640 230" className="w-full" role="group" aria-label={`${labels[metric]}. ${copy('Detalle accesible en la tabla inferior.', 'Accessible details in the table below.')}`}>
          {[0, .5, 1].map(p => <g key={p}><line x1="48" x2="598" y1={30 + p * 155} y2={30 + p * 155} stroke="currentColor" opacity=".15" /><text x="48" y={22 + p * 155} fontSize="10" fill="currentColor">{money(max - p * (max - min))}</text></g>)}
          {points.map((p, i) => {
            if (p.value == null || !Number.isFinite(p.value)) return null;
            const before = points[i - 1];
            const joined = before && before.value != null && Number.isFinite(before.value) && comparable(before.slip, p.slip);
            return <g key={p.slip.id}>{joined && <line x1={x(i - 1)} y1={y(before.value!)} x2={x(i)} y2={y(p.value)} stroke="currentColor" strokeWidth="2" className="text-primary" />}<a href="#quarterly-payment-details" onClick={() => setSelectedId(p.slip.id)} aria-label={`${p.slip.paymentDate}: ${money(p.value)}`}><circle cx={x(i)} cy={y(p.value)} r="18" fill="transparent"/><circle cx={x(i)} cy={y(p.value)} r="5" fill="currentColor" className="text-primary"><title>{`${p.slip.paymentDate}: ${money(p.value)}`}</title></circle></a></g>;
          })}
          <text x="48" y="219" fontSize="11" fill="currentColor">{records[0]?.paymentDate}</text><text x="598" y="219" textAnchor="end" fontSize="11" fill="currentColor">{latest?.paymentDate}</text>
        </svg>
        <p className="text-xs text-muted-foreground">{copy('Cada punto es una nómina. Los datos ausentes no se convierten en cero. La línea une solo períodos comparables confirmados.', 'Each point is a payslip. Missing values are not treated as zero. Lines connect only confirmed comparable periods.')}</p>
      </div> : <p className="rounded-xl border border-dashed p-6">{copy('Aún no hay importes disponibles para esta gráfica. Añade tus nóminas o revisa sus datos.', 'No amounts are available for this chart yet. Add payslips or review their data.')}</p>}
      {records.length > 0 && <details><summary className="min-h-11 cursor-pointer font-semibold">{copy('Ver cobros y desglose', 'View payments and breakdown')}</summary><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">{labels[metric]}</caption><thead><tr><th className="p-2">{copy('Fecha', 'Date')}</th><th className="p-2">{labels[metric]}</th><th className="p-2">{copy('Detalle', 'Details')}</th></tr></thead><tbody>{records.map(s => <tr key={s.id} className="border-t"><td className="p-2">{s.paymentDate}</td><td className="p-2">{money(metricValue(s, metric))}{s.reviewStatus !== 'confirmed' || s.manualAmountAudit ? ' *' : ''}</td><td><button className="min-h-11 px-2 underline" onClick={() => setSelectedId(s.id)}>{copy('Desglosar', 'Breakdown')}</button></td></tr>)}</tbody></table></div></details>}
      {selected && <div id="quarterly-payment-details" className="scroll-mt-24 rounded-xl border p-4"><h3 className="font-semibold">{copy('Detalle del cobro', 'Payment details')} · {selected.paymentDate}</h3><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><dt>{copy('Bruto', 'Gross')}</dt><dd>{money(selected.grossPay)}</dd><dt>{copy('Neto', 'Net')}</dt><dd>{money(selected.netPay)}</dd><dt>{copy('Horas extra', 'Overtime')}</dt><dd>{money(selected.overtimePay)}</dd></dl><p className="mt-4 font-semibold">{copy('Dietas y complementos registrados', 'Recorded allowances')}</p>{selected.allowances.length ? selected.allowances.map((d, i) => <p key={i} className="mt-1 flex justify-between gap-3 text-sm"><span>{d.rawLabel}{d.needsReview ? ' *' : ''}</span><span>{money(d.amount)}</span></p>) : <p className="text-sm text-muted-foreground">{copy('Sin desglose disponible.', 'No breakdown available.')}</p>}<p className="mt-4 font-semibold">{copy('Retenciones y descuentos registrados', 'Recorded deductions')}</p>{selected.deductions.length ? selected.deductions.map((d, i) => <p key={i} className="mt-1 flex justify-between gap-3 text-sm"><span>{d.rawLabel}{d.needsReview ? ' *' : ''}</span><span>{money(d.amount)}</span></p>) : <p className="text-sm text-muted-foreground">{copy('Sin desglose disponible; no significa que no haya descuentos.', 'No breakdown available; this does not mean there were no deductions.')}</p>}<Link className="mt-4 inline-flex min-h-11 items-center font-semibold underline" href={`/payslips/${selected.id}`}>{copy('Abrir y revisar nómina', 'Open and review payslip')}</Link></div>}
      <div className="rounded-xl bg-accent/10 p-4"><h3 className="font-semibold">{copy('Qué conviene revisar', 'What to check')}</h3><ul className="mt-2 space-y-2 text-sm">
        {uncertain.length > 0 && <li>{uncertain.length} {copy('nómina(s) con datos sin confirmar o pendientes de revisión (*).', 'payslip(s) with unconfirmed details or data needing review (*).')}</li>}
        {missingMonths.length > 0 && <li>{copy('Meses sin cobros guardados', 'Months without saved payments')}: {missingMonths.join(', ')}. {copy('Comprueba si falta alguna nómina; puede que no trabajaras o aún no hayas cobrado.', 'Check for missing payslips; you may not have worked or been paid yet.')}</li>}
        <li>{copy('Para entender una variación, revisa las horas, complementos y cada descuento de ambos documentos. Una diferencia no confirma una incidencia.', 'To understand a change, check hours, allowances and each deduction on both documents. A difference does not confirm an issue.')}</li>
      </ul><Link href="/payslips/new" className="mt-3 inline-flex min-h-12 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">{copy('Completar mis nóminas', 'Complete my payslips')}</Link><p className="mt-2 text-xs">{copy('Añade solo las pendientes. Si cobras semanal o quincenalmente, incluye los cobros de esos tres meses.', 'Add only missing records. For weekly or fortnightly pay, include payments for those three months.')}</p></div>
      <details className="rounded-xl border p-4"><summary className="min-h-11 cursor-pointer font-semibold">{copy('Entender mis retenciones', 'Understand my deductions')}</summary><p className="text-sm">{copy('La diferencia entre bruto y neto no es necesariamente todo impuesto. Consulta los conceptos de tu documento; aquí no calculamos tu declaración ni una devolución.', 'The gap between gross and net is not necessarily all tax. Check the items in your document; this review does not calculate a tax return or refund.')}</p>
        {group.records[0].countryCode === 'IE' ? <p className="mt-3 text-sm">{copy('En Irlanda puedes encontrar Income Tax (PAYE), USC y PRSI, además de otros descuentos como pensiones. Comprueba tus datos y créditos fiscales en Revenue.', 'In Ireland you may see Income Tax (PAYE), USC and PRSI, plus other deductions such as pensions. Check your details and tax credits with Revenue.')} <a className="underline" href="https://www.revenue.ie/en/jobs-and-pensions/starting-your-first-job/how-your-tax-is-calculated.aspx" target="_blank" rel="noreferrer">Revenue · {copy('Guía oficial', 'Official guide')}</a></p> : group.records[0].countryCode === 'GB' ? <p className="mt-3 text-sm">{copy('En Reino Unido, revisa Income Tax, National Insurance y las aportaciones a pensiones en tu nómina.', 'In the UK, check Income Tax, National Insurance and pension contributions on your payslip.')} <a href="https://www.gov.uk/payslips" target="_blank" rel="noreferrer" className="underline">GOV.UK · {copy('Guía oficial', 'Official guide')}</a></p> : <p className="mt-3 text-sm">{copy('La guía fiscal específica de este país todavía no está disponible. Consulta la administración tributaria correspondiente.', 'Country-specific tax guidance is not available yet. Consult the relevant tax authority.')}</p>}
      </details>
      <div className="rounded-xl border p-4"><h3 className="font-semibold">{copy('Vuelve a revisar dentro de tres meses', 'Review again in three months')}</h3><p className="mt-2 text-sm">{copy('Guarda un recordatorio trimestral en tu calendario. Podrás modificarlo o eliminarlo allí cuando quieras.', 'Save a quarterly reminder in your calendar. You can change or delete it there whenever you wish.')}</p><button onClick={downloadCalendar} className="mt-3 min-h-12 rounded-lg border border-primary px-4 font-semibold">{copy('Añadir recordatorio al calendario', 'Add calendar reminder')}</button>{calendarDownloaded && <p role="status" className="mt-2 text-sm">{copy('Abre el archivo descargado y acepta el evento en tu calendario para activar el recordatorio.', 'Open the downloaded file and accept the calendar event to activate the reminder.')}</p>}</div>
    </div>
  </section>;
}
