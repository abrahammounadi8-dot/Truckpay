# Truckpay

Ireland-first tool for haulage drivers: **check a payslip privately**, then (optionally) use the public haulier directory.

A payslip is **not** assumed to be one working week. It may cover several weeks, overtime, allowances, back pay or deductions from different periods.

Truckpay does **not** invent reviews, ratings or pay figures. Unknown deduction labels stay unknown and are flagged for review — never classified as illegal.

## Two layers

1. **Private ledger** (`/payslips`) — type figures from a slip. Verified analysis (`/analysis`) needs **three unique payslips** with pay date and period. Duplicates are rejected. One slip is never treated as one week. Identity is a random UUID, not a PPSN or licence.
2. **Employment profile** (`/profile`) — start date, tenure **months** (calculated), band, job/vehicle/shift. A date you type is labelled “not document-verified”.
3. **Public board** (`/companies`) — real Irish hauliers. Observed pay by tenure uses **medians** and sample size, only from verified three-slip sets. Never “the company salary”. Small samples are not published as medians.

## Deduction categories (Ireland)

PAYE, PRSI, USC, PENSION, ADVANCE, DAMAGE, EQUIPMENT, UNIFORM, ACCOMMODATION, TRAINING, LEGAL_ORDER, OTHER, UNKNOWN.

The `raw_label` is always kept.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43217](http://localhost:43217).

```bash
npm run build
npm start
```

Private payslips are stored in `data/payslips.json` locally (scoped to your session cookie). On Vercel that file lives in `/tmp`. A proper database is the next persistence step.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
