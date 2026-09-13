# Truckpay

Compare trucking companies by **advertised pay** versus **driver-reported take-home**, miles, home time, and working conditions.

Recruiters quote a CPM. Truckpay puts that number next to what drivers say actually clears on the settlement.

## What you can do

- Browse carriers with advertised weekly vs reported weekly on every card
- Open a company file for detention, forced dispatch, orientation pay, and driver reports
- Rank the widest pay gaps
- Compare up to three companies side by side
- File a pay report (stored in this browser until you add a backend)

Seed data covers Swift, Werner, Prime, Schneider, C.R. England, Roehl, Western Express, Knight, J.B. Hunt, and Maverick. Figures are illustrative composites of common driver reports, not official company filings.

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
