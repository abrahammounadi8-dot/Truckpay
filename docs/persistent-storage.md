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
