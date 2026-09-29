CREATE TABLE IF NOT EXISTS truckpay_retention (
 user_id text PRIMARY KEY,
 last_active_at timestamptz NOT NULL DEFAULT now(),
 checked_at timestamptz,
 notice_id text,
 notice_started_at timestamptz,
 provider_id text,
 delivered_at timestamptz,
 state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','sending','sent','delivered','blocked'))
);
CREATE INDEX IF NOT EXISTS truckpay_retention_due ON truckpay_retention(last_active_at);
-- No email, payroll or document contents in the deletion ledger.
CREATE TABLE IF NOT EXISTS truckpay_retention_deletions (
 user_id text PRIMARY KEY, deleted_at timestamptz NOT NULL DEFAULT now()
);
