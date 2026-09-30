-- Extend operator-managed identity attestations with explicit review state and audit history.
ALTER TABLE truckpay_publication_identities
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS revocation_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE truckpay_publication_identities
  ALTER COLUMN person_key DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'truckpay_publication_identity_status_check'
  ) THEN
    ALTER TABLE truckpay_publication_identities
      ADD CONSTRAINT truckpay_publication_identity_status_check
      CHECK (review_status IN ('approved','conflict','unverified'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'truckpay_publication_identity_person_required_check'
  ) THEN
    ALTER TABLE truckpay_publication_identities
      ADD CONSTRAINT truckpay_publication_identity_person_required_check
      CHECK (review_status <> 'approved' OR person_key IS NOT NULL);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS truckpay_publication_identity_audit (
  event_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('approve','link','conflict','unverified','revoke')),
  person_key uuid,
  reviewer_reference text NOT NULL CHECK (length(btrim(reviewer_reference)) > 0),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS truckpay_publication_identity_audit_user
  ON truckpay_publication_identity_audit(user_id, created_at);

-- Keep legacy rows eligible, but all new operator writes must set an explicit state.
UPDATE truckpay_publication_identities
SET review_status = COALESCE(review_status, 'approved'),
    updated_at = COALESCE(updated_at, reviewed_at, now())
WHERE review_status IS NULL OR updated_at IS NULL;
