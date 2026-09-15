# TruckPay

Ireland-first payroll control and salary intelligence for haulage drivers.

**TruckPay understands your payslip, so you don’t have to.**

A payslip is **not** assumed to be one working week. It may cover several weeks, overtime, allowances, back pay or deductions from different periods.

Work/pay week is assigned only from a printed week number or from period dates that sit inside a single Irish tax week (1 January week-numbering, not ISO week). Payment date alone is never used. If the week cannot be determined reliably, it is marked for review — never guessed.

TruckPay does **not** invent reviews, ratings or pay figures. Missing payroll fields are stored as null. Derived figures (including expected pay) are labelled derived and are never shown as if they were printed on the slip. Unknown deduction labels stay unknown and are flagged for review — never classified as illegal.

## Three layers

1. **My TruckPay** (`/payslips`, `/analysis`, `/profile`) — private workspace. Drop a payslip PDF or photo at **Add a payslip**, then check the figures. The file is read and discarded (not stored). Photos are shown on the form (in the browser only) and labelled fields are read when Tesseract is installed; otherwise type the printed figures. **TruckPay Verified Analysis** needs **three unique payslips** with pay date and period. Duplicates are rejected. Identity is a random UUID, not a PPSN or licence. Employment start dates you type are labelled “not document-verified”.
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

Photo reading uses `tesseract` when it is on the PATH (`sudo apt-get install tesseract-ocr` on Debian/Ubuntu). Without it, you can still attach a photo, see it on the form, and type the printed figures. The file is never stored.

Covers multi-week equivalents, duplicates, Irish deduction classification, sequence gaps, tenure bands, three-slip verification, personal pay-change remainder, the three-driver median publish rule, **weekly classification** (printed vs derived vs needs review), **no-guess / null storage**, expected-pay gating, and the anomaly-status foundation.

Synthetic payroll fixtures exist only in `src/lib/payroll/*.test.ts` and are labelled as test data.

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

## Languages

The site ships in **English (Ireland)**, **Spanish**, **Polish** and **Portuguese** — the languages most used on Irish haulage sites. English is the default. A language control sits in the header. The choice is stored in the `tp_lang` cookie (and local storage) so it survives reloads. On a first visit, TruckPay follows the browser `Accept-Language` header.

Payroll figures, statutory labels (PAYE, PRSI, USC), employer names and printed deduction text are **not** translated.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
