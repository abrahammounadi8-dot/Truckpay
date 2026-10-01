CREATE TABLE IF NOT EXISTS truckpay_opinions (
 id uuid PRIMARY KEY,
 user_id text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('company','platform')),
 company_slug text,
 company_name text,
 category text NOT NULL CHECK (category IN ('experience','idea','problem','other')),
 rating integer CHECK (rating BETWEEN 1 AND 5),
 body text NOT NULL CHECK (char_length(body) BETWEEN 20 AND 2000),
 status text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 consent_version text NOT NULL,
 revision uuid NOT NULL DEFAULT gen_random_uuid(),
 CHECK ((kind='company' AND company_slug IS NOT NULL AND company_name IS NOT NULL AND category='experience' AND rating IS NOT NULL AND status IN ('pending','approved','rejected'))
     OR (kind='platform' AND company_slug IS NULL AND company_name IS NULL AND category IN ('idea','problem','other') AND status IN ('received','reviewed')))
);
CREATE UNIQUE INDEX IF NOT EXISTS truckpay_opinions_company_owner ON truckpay_opinions(user_id,company_slug) WHERE kind='company';
CREATE INDEX IF NOT EXISTS truckpay_opinions_public ON truckpay_opinions(company_slug,updated_at DESC) WHERE kind='company' AND status='approved';
CREATE INDEX IF NOT EXISTS truckpay_opinions_owner ON truckpay_opinions(user_id,created_at DESC);
CREATE OR REPLACE FUNCTION truckpay_remove_account_opinions() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 DELETE FROM truckpay_opinions WHERE user_id=OLD.id::text;
 RETURN OLD;
END $$;
-- Authentication tables are installed separately on a fresh deployment.
DO $$ BEGIN
 IF to_regclass('public.user') IS NOT NULL THEN
   DROP TRIGGER IF EXISTS truckpay_account_opinions_cleanup ON "user";
   CREATE TRIGGER truckpay_account_opinions_cleanup AFTER DELETE ON "user"
     FOR EACH ROW EXECUTE FUNCTION truckpay_remove_account_opinions();
 END IF;
END $$;
