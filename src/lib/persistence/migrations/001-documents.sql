-- Runtime storage. schema.sql remains a future normalized reporting design.
CREATE TABLE IF NOT EXISTS truckpay_documents (
  kind text NOT NULL CHECK (kind IN ('payslip', 'profile')),
  id text NOT NULL,
  user_id uuid NOT NULL,
  content_hash text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, id),
  CHECK (kind <> 'payslip' OR content_hash IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS truckpay_documents_user ON truckpay_documents (user_id, kind);
CREATE UNIQUE INDEX IF NOT EXISTS truckpay_payslip_hash ON truckpay_documents (user_id, content_hash) WHERE kind = 'payslip';
