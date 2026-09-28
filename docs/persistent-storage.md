# Persistent private payroll storage

Private payslips and employment profiles use PostgreSQL whenever DATABASE_URL is set.
Production refuses to use temporary JSON files. Database failures never switch to JSON.
Development without DATABASE_URL continues to use the existing local files.

## Activation
1. Create a dedicated PostgreSQL database for Truckpay, separate from Crypto.
2. Set DATABASE_URL in the application's server environment using the provider's connection URL. Never commit the URL or paste it into a client component.
3. Run npm run db:migrate once before starting the upgraded app. The migration is transactional and repeatable.
4. Deploy the app with the same DATABASE_URL. Use provider backups and a tested restore procedure.

The runtime table is truckpay_documents. Full domain records are stored as JSONB, preserving nullable fields, lines, and provenance. Owner and content-hash columns support scoped queries and atomic duplicate prevention. The older schema.sql is a future normalized reporting design and is not executed.

Existing JSON files are not imported automatically. Keep a protected backup and explicitly migrate existing records before switching a live installation. No personal data is included in the migration.

This change covers private payslips and employment profiles. Public community reports and listing requests still use their existing storage.

## Email accounts
Apply both migrations before enabling account access. Set `DATABASE_URL`, `APP_BASE_URL` (the exact public origin, e.g. `https://mytruckpay.com`), `RESEND_API_KEY`, `EMAIL_FROM` (a sender address on a verified domain), and a random `ANONYMOUS_COOKIE_SECRET` of at least 32 characters as server secrets. Keep that secret stable across deployments and server instances: changing it invalidates anonymous sessions. The email sender uses Resend's API. Account access is unavailable until these are configured; do not promise recovery in production before a real email delivery and second-browser test succeeds.

**Legacy-session deployment gate:** earlier releases used an unsigned `tp_uid` UUID. It cannot prove ownership and must never be accepted to claim payroll under an email account. The new code uses a separate signed `tp_uid_v2` cookie and leaves the old cookie untouched for a controlled migration or rollback. Existing anonymous payroll records will not be reachable from the new account without a separately verified migration. Before deploying to any installation with existing records, preserve the data, arrange an individually verified migration or an explicit reset decision, and communicate the impact to affected users. Do not deploy this change over live anonymous payroll records without that transition. The old cookie cannot be upgraded securely merely by signing it when presented.

For an authorized export of the old JSON store, run `node scripts/audit-legacy-payroll.mjs /secure/payslips.json /secure/profiles.json`. It prints only record and owner counts, changes no files, and fails if an export is missing. An absent local export says nothing about live production records. The payslips page shows an old-session notice when an unsigned browser cookie remains.

The first verified email claims the anonymous UUID and its saved payroll records. Existing emails sign back in to their original UUID on another device. Links expire after 15 minutes and are consumed once. Sessions are stored as SHA-256 token hashes for 30 days. After a UUID is claimed, the old anonymous cookie alone cannot read it. The app never sends payroll data to the email provider.

Anonymous records still depend on the original browser until the email is verified. Signing in from a second browser with other unsaved anonymous records does not merge the two histories. The initial account UI is in English and Spanish; other interface languages currently fall back to English for this screen.

## Checks
npm test includes real PostgreSQL SQL execution through PGlite: user isolation, preserved null/zero values, profile updates, duplicate races, scoped deletion, and repeatable migration. A deployed provider connection and restart test must also pass before production activation.

## Importing existing records

Keep the original files as a protected backup. With DATABASE_URL set in the server environment, run:

```sh
npm run db:migrate
npm run db:import -- /secure/path/payslips.json /secure/path/profiles.json
```

The importer only reads those two explicit paths. Use an empty `{"profiles":[]}` file if no profile data exists. It keeps user UUIDs, derives missing content hashes, skips byte-order-independent identical JSON records, and refuses to overwrite conflicting records. All inserts are in a single transaction. Source files are never modified or deleted. The command prints counts only.

Preserving UUIDs does not transfer anonymous browser cookies to a new hostname. Verify the email account on the original hostname before changing domains, then sign in on the new hostname.

## Render configuration

Prepared launch configuration: dedicated Truckpay web service and PostgreSQL in Frankfurt, 1 GB database storage with autoscaling disabled. Set DATABASE_URL as a server secret using the private database connection URL.

- Build: `npm ci && npm run db:migrate && npm run build`
- Start: `npm run start`
- PORT: `43217` (matches the existing start script)

Create the database before deploying the application. Database migration runs before the build because server-rendered pages may read payroll statistics during rendering. It is idempotent. This document does not provision paid services.
