-- Tenancy: family and team kinds live in organizations.kind.
-- homeschool_mode and created_by are new. The seeded operator row is not updated.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS homeschool_mode boolean NOT NULL DEFAULT false;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES members(id);

UPDATE organizations
SET kind = 'family',
    homeschool_mode = true
WHERE kind = 'homeschool'
  AND (kind IS DISTINCT FROM 'family' OR homeschool_mode IS DISTINCT FROM true);
