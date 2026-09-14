# Truckpay

Compare trucking companies by **advertised pay** versus **driver-reported take-home**, miles, home time, and working conditions.

Recruiters quote a CPM. Truckpay puts that number next to what drivers say actually clears on the settlement.

## What you can do

- Browse carriers with advertised weekly vs reported weekly on every card
- Open a company file for detention, forced dispatch, orientation pay, and driver reports
- Rank the widest pay gaps
- Compare up to three companies side by side
- File a pay report (`POST /api/reports`) so it shows on the company file

Seed data covers Swift, Werner, Prime, Schneider, C.R. England, Roehl, Western Express, Knight, J.B. Hunt, and Maverick. Figures are illustrative composites of common driver reports, not official company filings.

Community reports are stored on the server (`data/reports.json` locally). On Vercel the file lives in `/tmp`, so it survives as long as that deployment’s instance does. A database is the next step if you want reports to last across deploys.

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
