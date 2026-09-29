-- Operator-managed attestations. A login/email or request payload never creates one.
CREATE TABLE IF NOT EXISTS truckpay_publication_identities (
  user_id uuid PRIMARY KEY,
  person_key uuid NOT NULL,
  reviewer_reference text NOT NULL CHECK (length(btrim(reviewer_reference)) > 0),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS truckpay_publication_identity_person ON truckpay_publication_identities(person_key);

-- Run inside the document mutation's transaction: all writes, imports and deletes
-- take this path, including account deletion and retention. No recalculation occurs.
CREATE OR REPLACE FUNCTION truckpay_invalidate_document_reviews() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE affected_user uuid; previous_user uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.payload IS NOT DISTINCT FROM NEW.payload AND OLD.user_id IS NOT DISTINCT FROM NEW.user_id THEN RETURN NULL; END IF;
    previous_user := OLD.user_id;
  END IF;
  IF TG_OP = 'DELETE' THEN affected_user := OLD.user_id; ELSE affected_user := NEW.user_id; END IF;
  UPDATE truckpay_publication_reviews SET invalidated_at = COALESCE(invalidated_at, now())
    WHERE id IN (
      SELECT p.review_id FROM truckpay_publication_review_people p
      JOIN truckpay_publication_identities i ON i.person_key::text = p.person_key
      WHERE i.user_id = affected_user OR i.user_id = previous_user
    );
  IF TG_OP = 'DELETE' THEN
    IF OLD.kind = 'profile' THEN DELETE FROM truckpay_publication_identities WHERE user_id = OLD.user_id; END IF;
  END IF;
  RETURN NULL;
END; $$;
CREATE OR REPLACE TRIGGER truckpay_documents_invalidate_reviews
  AFTER INSERT OR UPDATE OR DELETE ON truckpay_documents
  FOR EACH ROW EXECUTE FUNCTION truckpay_invalidate_document_reviews();

CREATE OR REPLACE FUNCTION truckpay_invalidate_identity_reviews() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE new_key text; old_key text;
BEGIN
  IF TG_OP <> 'DELETE' THEN new_key := NEW.person_key::text; END IF;
  IF TG_OP <> 'INSERT' THEN old_key := OLD.person_key::text; END IF;
  UPDATE truckpay_publication_reviews SET invalidated_at = COALESCE(invalidated_at, now())
    WHERE id IN (SELECT review_id FROM truckpay_publication_review_people
      WHERE person_key = old_key OR person_key = new_key);
  RETURN NULL;
END; $$;
CREATE OR REPLACE TRIGGER truckpay_identity_invalidate_reviews
  AFTER INSERT OR UPDATE OR DELETE ON truckpay_publication_identities
  FOR EACH ROW EXECUTE FUNCTION truckpay_invalidate_identity_reviews();
