# MyTruckPay

Private payroll analysis for haulage drivers, with a public company directory. Public payroll-derived salary statistics are currently paused while disclosure protections are reviewed. Private analysis remains available to the signed-in account owner.

## Current application

- Next.js App Router on Node 24, React and TypeScript.
- Verified email sessions through Better Auth; production authentication fails closed when required configuration is missing.
- PostgreSQL document storage in production; isolated local stores for development and tests.
- PDF extraction, amount confirmation receipts, duplicate detection, employment-month history and private three-period analysis.
- Optional statistics-sharing preference with withdrawal. Enabling it does not override the publication pause.
- Public company directory uses a static catalogue, not private payroll-derived employer names.

The original files/images are processed rather than retained by the payroll store. New stored payslips omit free-text deduction and allowance labels. No credentials or runtime data should be committed.

## Development and verification

Use Node 24 and `npm ci`, then `npm run dev` (port 43217). Run:

```sh
npm test
npm run test:accounts
npm run test:flow
npm run lint
npm run build
```

The account and complete-flow harnesses use synthetic identities, capture test email locally and isolate their data. OCR tests may skip when Tesseract is unavailable. Production database and email credentials are not required for CI.

## Production and publication

Required production configuration is validated in `src/lib/auth/production.ts`. Supply secrets through the hosting provider, never source control. `vercel.json` runs database/authentication migrations before building: inspect the target environment before deploying. Do not point a preview at the production database.

See [source reconciliation and verification](docs/production-reconciliation.md) for the recovered deployment baseline and retained GitHub protections. Vercel was not Git-connected at reconciliation time; a GitHub merge alone does not publish.

See [public statistics review](docs/publication-review.md) and issue #7 before considering reactivation. The raw internal calculator is not a public release policy. Older design documents describe earlier prototypes and do not override the publication pause or current authentication behavior.

An internal disclosure-review prototype now prepares net-pay intervals by frequency and historical tenure, requires reviewed distinct people and a new consent notice, and records non-public reservations atomically. Run `node scripts/preview-publication-policy.cjs` for a synthetic demonstration. Its policy parameters are provisional; it cannot enable publication. The new journal migration is not wired into production deployment. See the review document for remaining identity, consent, integration and release-approval work.
