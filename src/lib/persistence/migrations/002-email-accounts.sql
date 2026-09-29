CREATE TABLE IF NOT EXISTS truckpay_accounts (
  user_id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS truckpay_login_links (
  token_hash text PRIMARY KEY,
  email text NOT NULL,
  proposed_user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS truckpay_login_links_email ON truckpay_login_links (email, created_at DESC);
CREATE TABLE IF NOT EXISTS truckpay_account_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES truckpay_accounts(user_id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS truckpay_account_sessions_user ON truckpay_account_sessions (user_id);
