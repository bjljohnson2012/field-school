# Grok Build prompt — Wave 2

Read `docs/campus-runtime/WAVE2.md` and `docs/campus-runtime/WAVE1.md`. Paste PROMPT below.

---

PROMPT

You are continuing Field School campus runtime on github.com/bjljohnson2012/field-school main and VPS 2.24.70.248.

Wave 1 is done. Read WAVE1.md, API.md, app/db/0001_wave1.sql, AGENTS.md, and WAVE2.md. Implement Wave 2 only.

A signed-in member can belong to more than one org. /o/:slug selects the org. Household is invite-only and private. Children exist under a guardian. Gym events and household events never mix.

Do not wait on wildcard DNS for Steps 1-5. Step 6 is optional.

Live: Next in app/ and /opt/field-school. Postgres field-school-campus-db / campus. Do not write to leftover field-school-db. AUTH_URL stays university. Guest /c/grok-bot stays. Guest POST /api/events stays 401. Do not touch Cap, edit, Just, CNC vault, TanStack.

Add app/db/0002_wave2.sql: members.kind, members.auth_user_id, organizations.host, organizations.features, invites, wards. Household features.cap=false. Do not rename Wave 1 assignments. Stances stay on memberships.stance (learner, admin, guardian).

Build: (1) org context from /o/:slug, /api/me lists all memberships + activeOrg, cross-org event POST 403. (2) invites + /invite/:token. (3) household shell, fixture lesson home:welcome, no inherited Grok Bot catalog. (4) child kind=child, ward, no admin/invite. (5) optional acme org. (6) wildcard only if DNS already points.

Proof: fill WAVE2.md A-J. Deploy via app/deploy/deploy.sh. Curl guest /api/me, edit /health. Wave 2 only.
