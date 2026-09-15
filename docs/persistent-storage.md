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

## Session limitations
Identity still uses the existing anonymous tp_uid cookie. Permanent server storage does not provide account recovery or access from another device. Clearing the cookie loses access to the prior anonymous records. Authentication is a separate requirement before presenting this as a recoverable account.

## Checks
npm test includes real PostgreSQL SQL execution through PGlite: user isolation, preserved null/zero values, profile updates, duplicate races, scoped deletion, and repeatable migration. A deployed provider connection and restart test must also pass before production activation.

## Importing existing records

Keep the original files as a protected backup. With DATABASE_URL set in the server environment, run:

```sh
npm run db:migrate
npm run db:import -- /secure/path/payslips.json /secure/path/profiles.json
```

The importer only reads those two explicit paths. Use an empty `{"profiles":[]}` file if no profile data exists. It keeps user UUIDs, derives missing content hashes, skips byte-order-independent identical JSON records, and refuses to overwrite conflicting records. All inserts are in a single transaction. Source files are never modified or deleted. The command prints counts only.

Preserving UUIDs does not transfer browser cookies to a new hostname. Plan account/session recovery before migrating real users to another origin.

## Render configuration

Prepared launch configuration: dedicated Truckpay web service and PostgreSQL in Frankfurt, 1 GB database storage with autoscaling disabled. Set DATABASE_URL as a server secret using the private database connection URL.

- Build: `npm ci && npm run db:migrate && npm run build`
- Start: `npm run start`
- PORT: `43217` (matches the existing start script)

Create the database before deploying the application. Database migration runs before the build because server-rendered pages may read payroll statistics during rendering. It is idempotent. This document does not provision paid services.
