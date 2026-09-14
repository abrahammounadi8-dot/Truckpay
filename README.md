# TruckPay

Ireland-first payroll control and salary intelligence for haulage drivers.

**TruckPay understands your payslip, so you don’t have to.**

A payslip is **not** assumed to be one working week. It may cover several weeks, overtime, allowances, back pay or deductions from different periods.

TruckPay does **not** invent reviews, ratings or pay figures. Unknown deduction labels stay unknown and are flagged for review — never classified as illegal.

## Three layers

1. **My TruckPay** (`/payslips`, `/analysis`, `/profile`) — private workspace. Type figures from each new slip. **TruckPay Verified Analysis** needs **three unique payslips** with pay date and period. Duplicates are rejected. Identity is a random UUID, not a PPSN or licence. Employment start dates you type are labelled “not document-verified”.
2. **TruckPay Companies** (`/companies`) — public haulier directory plus salary intelligence. **Driver reported** stubs and **payroll verified** medians are labelled separately and are not equivalent evidence. Medians need sample size (3+ drivers in a cell). Confidence is Low / Medium / High from published rules — not an arbitrary score. Never “Company X pays €1,000/week”.
3. **Companies & recruiters** — not built. Architecture leaves room for company/recruiter accounts later. They must never see an individual driver’s private slips or identity.

The two live layers grow together: private payroll value produces aggregated intelligence; better company context attracts the next driver.

## Deduction categories (Ireland)

PAYE, PRSI, USC, PENSION, ADVANCE, DAMAGE, EQUIPMENT, UNIFORM, ACCOMMODATION, TRAINING, LEGAL_ORDER, OTHER, UNKNOWN.

The `raw_label` is always kept.

## Persistence

Private payslips are stored in `data/payslips.json` locally (scoped to your session cookie). On Vercel that file lives in `/tmp`. That is a stand-in.

The intended schema is in `src/lib/persistence/schema.sql` (users, documents, extracted payslips, normalized lines, aggregated company stats with **no user id**). JSON is not being deleted until a database cutover is approved.

## Tests

```bash
npm test
```

Covers multi-week equivalents, duplicates, Irish deduction classification, sequence gaps, tenure bands, three-slip verification, personal pay-change remainder, and the three-driver median publish rule.

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

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
