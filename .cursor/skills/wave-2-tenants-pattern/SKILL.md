---
name: Wave 2 tenants + Pattern
description: Wave 2 tenants + Pattern — only campus builder; household + sales, picker, invites, fp-50-v1 from the four pinned files
---

# Wave 2 tenants + Pattern

Wave: 2. Only campus builder. Stop when `WAVE2.md` proofs pass.

Attach (pinned — do not replace or invent a second bank):

- `docs/campus-runtime/fp-50-v1.md`
- `app/db/0002_field_pattern.sql`
- `app/db/0003_pattern_weights.sql`
- `app/db/0004_tenants.sql`

Also attach: `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`, `docs/campus-runtime/WAVE2.md`, `docs/campus-runtime/WORKER_RENAME.md`.

Absorbed branches: none. Work branch is `cursor/wave-2-tenants-ca6e` (merge `origin/main` first). Do not own the role-skills PR from this skill.

## Own

- household + sales, org picker, `/o/:slug`
- `GET /api/me` all memberships + `activeOrg`. Stop forcing every login onto `field-school`
- Invites at `/invite/:token`. Child + ward on household only. Trainer on sales
- Fixtures `home:welcome` and `sales:welcome`. No Grok Bot in the household catalog
- Pattern run loads items from `fp-50-v1.md` and `0003_pattern_weights.sql`
- `member_profiles` + append-only `member_profile_revisions` + org-scoped skill diagnostics
- Apply `0002`-`0004` on `field-school-campus-db` / `campus`
- Refuse TanStack PRs (`src/`, `vite.config.ts`, `migrations/0001-0003`)

## Do not

- Flip `AUTH_URL` or 301 university
- Start composer, Remotion, Stripe, or Lyell
- Invent a second Pattern bank or copy official MBTI / Enneagram / Gallup / Wiley items
- Touch CNC vault `2.24.64.248` or re-render Just

Proofs: `docs/campus-runtime/WAVE2.md`.
