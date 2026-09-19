-- Plate renders gate. Idempotent.
-- Teacher approve/reject only. No Cap media required.
-- Do not alter 0001-0011. Do not flip live Cleaning / Publish.
-- Rejected plates never appear to learners.

CREATE TABLE IF NOT EXISTS plate_renders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  composition text NOT NULL,
  dest text NOT NULL,
  sha256 text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  checklist_verdict text NOT NULL DEFAULT '',
  hold_cleaning boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

CREATE INDEX IF NOT EXISTS plate_renders_org_status_idx
  ON plate_renders (org_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS plate_renders_org_member_idx
  ON plate_renders (org_id, membership_id, created_at DESC);
