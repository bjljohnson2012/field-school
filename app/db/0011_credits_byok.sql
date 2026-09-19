-- FR-KB-3 credits ledger + encrypted BYOK key store.
-- Parent writes. Child ≠ User. Not seats. Not composer. Not Pattern.
-- Units are opaque integers. Revenue fills amounts later. No currency columns.
-- Envelope-at-rest on campus Postgres. Not leftover TanStack db.
-- Do not alter 0001-0010.

CREATE TABLE IF NOT EXISTS credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  growth_unit_id uuid REFERENCES growth_units(id),
  child_membership_id uuid REFERENCES memberships(id),
  mode text NOT NULL DEFAULT 'platform',
  status text NOT NULL DEFAULT 'current',
  units integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS credits_org_current_unique
  ON credits (org_id)
  WHERE status = 'current';

CREATE INDEX IF NOT EXISTS credits_parent_idx
  ON credits (org_id, parent_membership_id, mode);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  credit_id uuid NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  growth_unit_id uuid REFERENCES growth_units(id),
  child_membership_id uuid REFERENCES memberships(id),
  event_name text NOT NULL,
  direction text NOT NULL,
  units integer NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_ledger_account_idx
  ON credit_ledger (org_id, credit_id, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_ledger_event_idx
  ON credit_ledger (org_id, event_name, created_at DESC);

CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  credit_id uuid NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  growth_unit_id uuid REFERENCES growth_units(id),
  child_membership_id uuid REFERENCES memberships(id),
  event_name text NOT NULL,
  units integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_account_idx
  ON usage_events (org_id, credit_id, created_at DESC);

CREATE INDEX IF NOT EXISTS usage_events_name_idx
  ON usage_events (org_id, event_name, created_at DESC);

CREATE TABLE IF NOT EXISTS customer_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  credit_id uuid REFERENCES credits(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  last4 text NOT NULL DEFAULT '',
  fingerprint text NOT NULL DEFAULT '',
  wrap_alg text NOT NULL DEFAULT 'aes-256-gcm',
  wrap_kid text NOT NULL DEFAULT 'v1',
  wrap_iv text NOT NULL DEFAULT '',
  wrap_tag text NOT NULL DEFAULT '',
  wrapped_ciphertext text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_api_keys_org_active_unique
  ON customer_api_keys (org_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS customer_api_keys_parent_idx
  ON customer_api_keys (org_id, parent_membership_id, status);
