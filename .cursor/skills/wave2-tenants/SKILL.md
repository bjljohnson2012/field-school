---
name: wave2-tenants
description: Wave 2 only. Ship household + sales, picker, invites, fixtures, and Field Pattern from fp-50-v1.md + 0003. Do not start composer or Remotion.
---

# Wave 2 tenants

Wave: 2. First build wave if Wave 1 still passes. Stop when `WAVE2.md` proofs pass.

Attach:

- `docs/campus-runtime/fp-50-v1.md`
- `app/db/0002_field_pattern.sql`
- `app/db/0003_pattern_weights.sql`
- `app/db/0004_tenants.sql`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`
- `docs/campus-runtime/WAVE2.md`
- `docs/campus-runtime/TENANTS_AND_COURSES.md`
- `docs/campus-runtime/FIELD_PATTERN.md`

Those files are the item bank and tenant schema. Do not create another questionnaire.

Absorbed branches: none. Work branch is `cursor/wave-2-tenants-ca6e` (merge `origin/main` first). Do not use this skill to own the role-skills PR.

## Own

- household + sales, org picker, `/o/:slug`
- `GET /api/me` all memberships + `activeOrg`. Stop forcing every login onto `field-school`
- Invites at `/invite/:token`. Child + ward on household only. Trainer on sales. Child cannot invite or `/admin`
- Fixtures `home:welcome` and `sales:welcome`. No Grok Bot in the household catalog
- Pattern run loads items from `fp-50-v1.md` and `0003_pattern_weights.sql` (50 Likert, 20-item child subset, eight Bearing dimensions)
- `member_profiles` + append-only `member_profile_revisions` + template narrative
- Org-scoped skill diagnostics (household + sales)
- Apply `0002`-`0004` on `field-school-campus-db` / `campus`

## Do not

- Flip `AUTH_URL` or 301 university
- Extend frozen TanStack `src/` or deploy `vite.config.ts`
- Touch CNC vault `2.24.64.248` or re-render Just
- Scaffold `plates/`, start composer, Stripe, or Lyell
- Invent a second Pattern bank or copy official MBTI / Enneagram / Gallup / Wiley items
- Scrape the web into the knowledge pack

Proofs: `docs/campus-runtime/WAVE2.md`. Guest Grok Bot and cap + edit health must still pass.
