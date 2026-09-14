# Truckpay

Ireland-first tool for haulage drivers: **check a payslip privately**, then (optionally) use the public haulier directory.

A payslip is **not** assumed to be one working week. It may cover several weeks, overtime, allowances, back pay or deductions from different periods.

Truckpay does **not** invent reviews, ratings or pay figures. Unknown deduction labels stay unknown and are flagged for review — never classified as illegal.

## Two layers

1. **Private ledger** (`/payslips`) — you type figures from your slip. Identity is a random UUID cookie, not a PPSN, licence or employee number. Documents are not uploaded. Findings are labelled Fact / Inference / Unknown and do not accuse an employer.
2. **Public board** (`/companies`) — real Irish hauliers with public facts only. Optional community “file a slip” remains a separate legacy flow (`/report`).

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
