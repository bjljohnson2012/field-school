# Current Grok Build run

Read AGENTS.md, TENANTS_AND_COURSES.md, ASSESSMENTS_AND_PICKER.md, FIELD_PATTERN.md, and fp-50-v1.md.

Retire gym wording in the UI.

First student orgs: household and sales.
One Auth.js email must belong to both and flip with an org picker plus /o/:slug.
GET /api/me returns all memberships and activeOrg. Stop forcing every login onto field-school.

Invites into household and sales.
Child + guardian on household only. Trainer on sales.
Fixture text lessons: home:welcome and sales:welcome.
Do not inherit Grok Bot into household.

Field Pattern is the personality engine. Ship fp-50-v1 from fp-50-v1.md (50 Likert items + 20-item child subset). Score to eight Bearing dimensions. Emit correspondence probability distributions (Enneagram-like 1-9, 16 type-codes, four influence styles, our strength clusters). Do not copy official item banks. Do not name the product MBTI, Enneagram, StrengthsFinder, or DISC. Import of an official result overrides correspondence.

Save on the person: member_profiles with Bearing, correspondences, and narrative paragraphs (learn, approach, conflict, feedback, group) plus a working title in our language. Append-only member_profile_revisions.

Papers, verbal answers, and videos transcribe with Grok STT and nudge Bearing with a small step. A new Pattern run resets Bearing. Skills stay org-scoped and update from the same artifacts when a rubric exists. Parent can lock a child profile. Chooser reads the live profile. It does not rewrite the pack.

Also ship org-scoped skills + one household diagnostic (3 parent-editable skills) + one sales diagnostic (3 seeded sales skills).

AUTH_URL is portal.fieldschool.ai. Do not flip it back to university. Do not deploy TanStack. Do not start Remotion plates, chooser LLM, or adaptive generation this run.
