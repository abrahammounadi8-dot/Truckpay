-- TruckPay target schema (not wired yet).
-- Current runtime: JSON files in data/ (Vercel: /tmp).
-- Ireland-first; country_code / currency keep this extensible.
-- Never store PPSN, driving licence, or employee number as user id.

-- 1. Account / identity (random UUID only)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  country_code TEXT NOT NULL DEFAULT 'IE'
);

-- 2. Original documents (not stored by default; process-and-delete)
CREATE TABLE source_documents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id),
  kind TEXT NOT NULL,
  retention TEXT NOT NULL,
  retain_until DATE,
  purged_at TIMESTAMPTZ,
  stored BOOLEAN NOT NULL DEFAULT FALSE,
  bytes BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Extracted payroll (private; never exposed as company intelligence rows)
CREATE TABLE payslips (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id),
  country_code TEXT NOT NULL,
  currency TEXT NOT NULL,
  employer_slug TEXT,
  payment_date DATE NOT NULL,
  pay_period_start DATE,
  pay_period_end DATE,
  pay_frequency TEXT NOT NULL,
  employment_weeks NUMERIC,
  basic_hours NUMERIC,
  basic_rate NUMERIC,
  basic_pay NUMERIC,
  overtime_hours NUMERIC,
  overtime_rate NUMERIC,
  overtime_pay NUMERIC,
  gross_pay NUMERIC,
  net_pay NUMERIC,
  content_hash TEXT NOT NULL,
  extraction_confidence NUMERIC NOT NULL,
  review_status TEXT NOT NULL,
  source_document_id UUID REFERENCES source_documents (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payslips_user_hash ON payslips (user_id, content_hash);

-- 4. Normalized lines (raw_label always kept)
CREATE TABLE payslip_lines (
  id UUID PRIMARY KEY,
  payslip_id UUID NOT NULL REFERENCES payslips (id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- allowance | deduction
  raw_label TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  normalized_category TEXT NOT NULL,
  statutory_class TEXT,
  needs_review BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE employment_profiles (
  user_id UUID PRIMARY KEY REFERENCES users (id),
  employer_slug TEXT,
  employment_start_date DATE,
  tenure_source TEXT,
  job_type TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  time_fraction TEXT NOT NULL,
  shift_type TEXT NOT NULL,
  pay_type TEXT NOT NULL,
  agreed_base_rate NUMERIC,
  country_code TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- 5. Aggregated analytical data (no user_id, no raw labels, no documents)
-- Populated only from TruckPay Verified Analysis. Companies/recruiters may
-- later read this layer only — never payslips or users.
CREATE TABLE company_pay_aggregates (
  employer_slug TEXT NOT NULL,
  tenure_band TEXT NOT NULL,
  job_type TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  shift_type TEXT NOT NULL,
  time_fraction TEXT NOT NULL,
  country_code TEXT NOT NULL,
  evidence_level TEXT NOT NULL DEFAULT 'payroll_verified',
  driver_count INTEGER NOT NULL,
  verified_payslip_count INTEGER NOT NULL,
  distinct_period_count INTEGER NOT NULL,
  median_gross_weekly NUMERIC,
  median_base_hourly_rate NUMERIC,
  median_paid_hours_weekly NUMERIC,
  confidence TEXT NOT NULL,
  published BOOLEAN NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (
    employer_slug, tenure_band, job_type, vehicle_type, shift_type, time_fraction, country_code
  )
);
