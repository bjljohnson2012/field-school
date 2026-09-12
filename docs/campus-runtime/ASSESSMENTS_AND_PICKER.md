# Foundations: org picker, personality, skills

Before the chooser gets clever: (1) one email flips between household and sales team, (2) each membership has a personality snapshot plus a skill baseline against that org's success definition.

## Org picker

One Auth.js login. Many memberships. Switcher when memberships.length > 1. Sets activeOrg via cookie or /o/:slug. Child never sees sales in the menu. GET /api/me returns all memberships plus activeOrg. Wave 1 force-join to field-school is removed for users who have household or sales.

## Personality

Do not copy Enneagram Institute, MBTI Form M, or Gallup CliftonStrengths items. v1 is import + confirm: enneagram type+wing, MBTI four letters, Clifton top 5 names pasted from Gallup. Optional first-party work_style_short (pace, abstraction, social load, feedback) that we author. Tables: assessment_instruments, assessment_runs, profile_snapshots. Child imports need guardian confirm. Snapshots route format and load. They do not pick curriculum.

## Skills diagnostic

Org-scoped skills + skill_items + skill_states. Household skills defined by the parent. Sales skills defined from sales steps (discovery, qualification, next-step, forecast hygiene). Same runner. Diagnostic writes learning_events kind=diagnostic and upserts skill_states. No global sales IQ. Skip allowed for adults.

## Next run order

A picker + /o/:slug + /api/me. B invites household and sales. C import forms. D work_style_short. E one household diagnostic (3 editable skills) + one sales diagnostic (3 seeded skills). F child+guardian on household. Stop before Remotion, chooser LLM, AUTH_URL flip.
