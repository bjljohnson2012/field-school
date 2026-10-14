-- Disposable fixture for the M13 spike. Apply only to fs_payload_spike.
-- No production connection. Idempotent. Does not delete rows.

INSERT INTO members (email, name, kind)
VALUES
  ('parent.spike@example.test', 'Spike Parent', 'adult'),
  ('lead.spike@example.test', 'Spike Team Lead', 'adult'),
  ('tracked-child.spike@example.test', 'Tracked Child', 'child')
ON CONFLICT (email) DO NOTHING;

INSERT INTO organizations (slug, name, kind, isolation, homeschool_mode)
VALUES ('spike-team', 'Spike Team', 'team', 'strict', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO memberships (org_id, member_id, stance)
SELECT o.id, m.id, 'guardian'
FROM organizations o
JOIN members m ON m.email = 'parent.spike@example.test'
WHERE o.slug = 'household'
ON CONFLICT (org_id, member_id) DO NOTHING;

INSERT INTO memberships (org_id, member_id, stance)
SELECT o.id, m.id, 'child'
FROM organizations o
JOIN members m ON m.email = 'tracked-child.spike@example.test'
WHERE o.slug = 'household'
ON CONFLICT (org_id, member_id) DO NOTHING;

INSERT INTO memberships (org_id, member_id, stance)
SELECT o.id, m.id, 'owner'
FROM organizations o
JOIN members m ON m.email = 'lead.spike@example.test'
WHERE o.slug = 'spike-team'
ON CONFLICT (org_id, member_id) DO NOTHING;

INSERT INTO wards (org_id, guardian_membership_id, child_membership_id)
SELECT o.id, guardian.id, child.id
FROM organizations o
JOIN memberships guardian ON guardian.org_id = o.id
JOIN members guardian_member ON guardian_member.id = guardian.member_id
  AND guardian_member.email = 'parent.spike@example.test'
JOIN memberships child ON child.org_id = o.id
JOIN members child_member ON child_member.id = child.member_id
  AND child_member.email = 'tracked-child.spike@example.test'
WHERE o.slug = 'household'
ON CONFLICT (org_id, guardian_membership_id, child_membership_id) DO NOTHING;

INSERT INTO growth_units (org_id, parent_membership_id, kind, title, status)
SELECT o.id, guardian.id, 'family', 'Spike household', 'current'
FROM organizations o
JOIN memberships guardian ON guardian.org_id = o.id
JOIN members guardian_member ON guardian_member.id = guardian.member_id
  AND guardian_member.email = 'parent.spike@example.test'
WHERE o.slug = 'household'
  AND NOT EXISTS (
    SELECT 1 FROM growth_units g
    WHERE g.org_id = o.id AND g.kind = 'family' AND g.parent_membership_id = guardian.id
  );

INSERT INTO growth_units (org_id, parent_membership_id, kind, title, status)
SELECT o.id, lead.id, 'team', 'Spike team', 'current'
FROM organizations o
JOIN memberships lead ON lead.org_id = o.id
JOIN members lead_member ON lead_member.id = lead.member_id
  AND lead_member.email = 'lead.spike@example.test'
WHERE o.slug = 'spike-team'
  AND NOT EXISTS (
    SELECT 1 FROM growth_units g
    WHERE g.org_id = o.id AND g.kind = 'team' AND g.parent_membership_id = lead.id
  );

INSERT INTO courses (org_id, slug, title, kind, status, _status, example, blocks, outcome_ids)
SELECT o.id, 'grok-bot', 'Grok Bot', 'text', 'draft', 'draft', false, '[]'::jsonb, '[]'::jsonb
FROM organizations o
WHERE o.slug = 'household'
ON CONFLICT (org_id, slug) DO NOTHING;

INSERT INTO modules (org_id, course_id, slug, title, "order", _status)
SELECT c.org_id, c.id, 'start', 'Start', 0, 'draft'
FROM courses c
JOIN organizations o ON o.id = c.org_id
WHERE o.slug = 'household' AND c.slug = 'grok-bot'
  AND NOT EXISTS (
    SELECT 1 FROM modules m WHERE m.course_id = c.id AND m.slug = 'start'
  );

INSERT INTO lessons (
  org_id, course_id, module_id, slug, title, body, status, _status, "order", blocks, outcome_ids
)
SELECT
  c.org_id,
  c.id,
  m.id,
  'briefing',
  'Briefing',
  '',
  'draft',
  'draft',
  0,
  jsonb_build_array(
    jsonb_build_object('kind', 'text', 'text', 'Grok Bot starts with a briefing.'),
    jsonb_build_object(
      'kind', 'quiz',
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'q1',
          'prompt', 'What is a knowledge brain?',
          'choices', jsonb_build_array('A list', 'A map of what you know'),
          'answer', 1,
          'why', 'It is the map.',
          'sourceUnitId', 'unit-briefing'
        )
      )
    )
  ),
  '[]'::jsonb
FROM courses c
JOIN organizations o ON o.id = c.org_id AND o.slug = 'household' AND c.slug = 'grok-bot'
JOIN modules m ON m.course_id = c.id AND m.slug = 'start'
WHERE NOT EXISTS (
  SELECT 1 FROM lessons l WHERE l.course_id = c.id AND l.slug = 'briefing'
);

INSERT INTO practice (org_id, lesson_id, kind, "order", block_index)
SELECT l.org_id, l.id, 'check', 0, 1
FROM lessons l
JOIN courses c ON c.id = l.course_id AND c.slug = 'grok-bot'
JOIN organizations o ON o.id = c.org_id AND o.slug = 'household'
WHERE l.slug = 'briefing'
  AND NOT EXISTS (
    SELECT 1 FROM practice p WHERE p.lesson_id = l.id AND p.kind = 'check' AND p.block_index = 1
  );

INSERT INTO course_versions (org_id, parent_id, version, snapshot)
SELECT c.org_id, c.id, 1, jsonb_build_object('slug', c.slug, 'title', c.title)
FROM courses c
JOIN organizations o ON o.id = c.org_id AND o.slug = 'household' AND c.slug = 'grok-bot'
WHERE NOT EXISTS (
  SELECT 1 FROM course_versions v WHERE v.parent_id = c.id AND v.version = 1
);

INSERT INTO lesson_versions (org_id, parent_id, version, snapshot)
SELECT l.org_id, l.id, 1, jsonb_build_object('slug', l.slug, 'blocks', l.blocks)
FROM lessons l
JOIN courses c ON c.id = l.course_id AND c.slug = 'grok-bot'
JOIN organizations o ON o.id = c.org_id AND o.slug = 'household'
WHERE l.slug = 'briefing'
  AND NOT EXISTS (
    SELECT 1 FROM lesson_versions v WHERE v.parent_id = l.id AND v.version = 1
  );

INSERT INTO knowledge_nodes (
  org_id, growth_unit_id, owner_kind, owner_membership_id, kind, label, body,
  ref_table, ref_id, evidence, status
)
SELECT
  o.id,
  g.id,
  'family',
  guardian.id,
  'concept',
  'Briefing concept',
  'The briefing is the first map.',
  'lessons',
  l.id::text,
  jsonb_build_array(jsonb_build_object('ref_table', 'lessons', 'ref_id', l.id::text)),
  'active'
FROM organizations o
JOIN memberships guardian ON guardian.org_id = o.id
JOIN members guardian_member ON guardian_member.id = guardian.member_id
  AND guardian_member.email = 'parent.spike@example.test'
JOIN growth_units g ON g.org_id = o.id AND g.kind = 'family' AND g.parent_membership_id = guardian.id
JOIN courses c ON c.org_id = o.id AND c.slug = 'grok-bot'
JOIN lessons l ON l.course_id = c.id AND l.slug = 'briefing'
WHERE o.slug = 'household'
  AND NOT EXISTS (
    SELECT 1 FROM knowledge_nodes n WHERE n.org_id = o.id AND n.label = 'Briefing concept'
  );

INSERT INTO knowledge_nodes (
  org_id, growth_unit_id, owner_kind, owner_membership_id, kind, label, body,
  ref_table, ref_id, evidence, status
)
SELECT
  o.id,
  g.id,
  'family',
  guardian.id,
  'lesson',
  'Briefing lesson',
  'Lesson row cited from the course.',
  'lessons',
  l.id::text,
  jsonb_build_array(jsonb_build_object('ref_table', 'lessons', 'ref_id', l.id::text)),
  'active'
FROM organizations o
JOIN memberships guardian ON guardian.org_id = o.id
JOIN members guardian_member ON guardian_member.id = guardian.member_id
  AND guardian_member.email = 'parent.spike@example.test'
JOIN growth_units g ON g.org_id = o.id AND g.kind = 'family' AND g.parent_membership_id = guardian.id
JOIN courses c ON c.org_id = o.id AND c.slug = 'grok-bot'
JOIN lessons l ON l.course_id = c.id AND l.slug = 'briefing'
WHERE o.slug = 'household'
  AND NOT EXISTS (
    SELECT 1 FROM knowledge_nodes n WHERE n.org_id = o.id AND n.label = 'Briefing lesson'
  );

INSERT INTO knowledge_edges (
  org_id, growth_unit_id, owner_kind, owner_membership_id,
  from_node, to_node, rel, because, evidence, weight, status, origin
)
SELECT
  src.org_id,
  src.growth_unit_id,
  src.owner_kind,
  src.owner_membership_id,
  src.id,
  dst.id,
  'supports',
  'The concept supports the lesson.',
  jsonb_build_array(jsonb_build_object('ref_table', 'lessons', 'ref_id', src.ref_id)),
  1,
  'accepted',
  'user'
FROM knowledge_nodes src
JOIN knowledge_nodes dst ON dst.org_id = src.org_id AND dst.label = 'Briefing lesson'
WHERE src.label = 'Briefing concept'
  AND NOT EXISTS (
    SELECT 1 FROM knowledge_edges e WHERE e.from_node = src.id AND e.to_node = dst.id
  );

INSERT INTO knowledge_nodes (
  org_id, growth_unit_id, owner_kind, owner_membership_id, kind, label, body, evidence, status
)
SELECT
  o.id,
  g.id,
  'team',
  lead.id,
  'concept',
  'Team pipeline',
  'A team room node, separate from the household.',
  jsonb_build_array(jsonb_build_object('ref_table', 'organizations', 'ref_id', o.id::text)),
  'active'
FROM organizations o
JOIN memberships lead ON lead.org_id = o.id
JOIN members lead_member ON lead_member.id = lead.member_id
  AND lead_member.email = 'lead.spike@example.test'
JOIN growth_units g ON g.org_id = o.id AND g.kind = 'team' AND g.parent_membership_id = lead.id
WHERE o.slug = 'spike-team'
  AND NOT EXISTS (
    SELECT 1 FROM knowledge_nodes n WHERE n.org_id = o.id AND n.label = 'Team pipeline'
  );
