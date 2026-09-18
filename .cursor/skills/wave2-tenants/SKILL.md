---
name: wave2-tenants
description: Ship household + sales tenants, org picker, /o/:slug, invites, and fixture lessons on the Next campus in app/. Use when work touches orgs, memberships, invites, wards, or org-scoped events.
---
# Wave 2 tenants

Read `docs/campus-runtime/CURRENT_RUN.md`, `TENANTS_AND_COURSES.md`, `WAVE2.md`, and `AGENTS.md` before editing.

## Own

- One Auth.js email on household (guardian) and sales (trainer); org picker + `/o/:slug`
- `GET /api/me` returns all memberships + `activeOrg`. Do not force every login onto `field-school`
- Invites. Child + ward on household only. Child cannot invite or `/admin`
- Fixtures `home:welcome` and `sales:welcome`. Household catalog does not inherit Grok Bot
- Authenticated events/progress scoped by `org_id` / `membership_id`

## Do not

- Flip `AUTH_URL` or 301 university
- Extend frozen TanStack `src/` or deploy `vite.config.ts`
- Touch CNC vault `2.24.64.248` or re-render Asset Just
- Start Remotion plates, chooser LLM, or adaptive generation
- Copy official MBTI / Enneagram / Gallup / Wiley items

Proofs live in `docs/campus-runtime/WAVE2.md`. Guest `/c/grok-bot` stays Org 0 and must keep working.
