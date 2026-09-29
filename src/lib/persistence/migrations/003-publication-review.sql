-- Internal review reservations only. No table is a public read endpoint.
CREATE TABLE IF NOT EXISTS truckpay_publication_reviews (
  id text PRIMARY KEY,
  employer_slug text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL CHECK (period_end >= period_start),
  fingerprint text NOT NULL,
  proposal jsonb NOT NULL,
  reviewer_reference text NOT NULL,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  invalidated_at timestamptz,
  UNIQUE (employer_slug, period_start, period_end)
);
CREATE TABLE IF NOT EXISTS truckpay_publication_review_people (
  person_key text PRIMARY KEY,
  review_id text NOT NULL REFERENCES truckpay_publication_reviews(id)
);
