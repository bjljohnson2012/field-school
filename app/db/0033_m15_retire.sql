-- M15 retire. Idempotent. A second run changes nothing.
-- Retire organizations.kind homeschool to family and set homeschool_mode.
-- Do not delete organization rows.
-- Drop living_profiles and living_brains only.
-- Do not drop growth_units, knowledge_brains, brain_sources, brain_notes, or brain_artifacts.
-- Expected dry-run counts live in app/scripts/m15-retire-counts.json.

UPDATE organizations
SET kind = 'family',
    homeschool_mode = true
WHERE lower(trim(kind)) = 'homeschool'
  AND (kind IS DISTINCT FROM 'family' OR homeschool_mode IS DISTINCT FROM true);

DROP TABLE IF EXISTS living_profiles;
DROP TABLE IF EXISTS living_brains;
