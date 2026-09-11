# Grok Build prompt — Field School campus runtime

Copy everything under PROMPT into Grok Build. Do not add new product ideas. Execute Wave 1 first. Stop at the Wave 1 proof unless this chat explicitly opens the next wave.

Also read `docs/campus-runtime/IMPLEMENTATION_PLAN.md` and `docs/campus-runtime/README.md`.

---

PROMPT

You are building Field School campus runtime on the existing Hostinger VPS and the existing Next app. You are not starting a new product. You are not deploying GitHub main.

## Mission

Turn the live guest campus into a durable multi-tenant learning runtime so two tenants can run on one app:

1. Org 0 — Field School gym/team (public catalog, private progress).
2. A private household org (homeschool). Strict isolation.

Later waves add source-agnostic lessons, adaptive journey, admin-gated knowledge, and campus MCP. This run is Wave 1 only unless the human names another wave.

## Current state (treat as fact)

Live

- Public site: https://fieldschool.ai (static, marketing-site/)
- Campus app: https://portal.fieldschool.ai and https://university.benjohnson.ai (same Next guest campus; Grok Bot course; Continue as guest)
- AUTH_URL still points at https://university.benjohnson.ai
- Do not flip AUTH_URL. Do not 301 university. Portal Google/X OAuth callback rows are not complete.
- Capture: https://cap.fieldschool.ai
- Edit MCP: https://edit.fieldschool.ai (Bearer EDIT_MCP_TOKEN). Factory only.
- VPS: 2.24.70.248 (srv1643164). CNC vault 2.24.64.248 is a different product. Do not touch it.
- Deploy: Cursor Cloud Agent + /home/ubuntu/.ssh/vps_deploy only. No shared-box SSH. No Hostinger VPS MCP from the shared box.
- Video files: /opt/fieldschool-video
- Cap compose: /opt/cap
- Edit: /opt/field-school/edit
- Next app is what Caddy already serves to portal/university.

Notion factory SoT (do not add Member/Quiz/Personality databases)

- Dashboard: https://app.notion.com/p/3c8fe86f6dee8138b998f32c366651b3
- Courses: https://app.notion.com/p/e99cd7dde6144eb59dfed80d9fe2f2e5
- Modules / Lessons: https://app.notion.com/p/906a0b2d6561497a9404e269e3a5fd8c
- Assets / Videos: https://app.notion.com/p/401926803acc4a2ab815ffb074cd8940
- Stations / Teaching Catalog exist. Path 1–63 is the future skill graph. Do not sync Stations in Wave 1.

Repo

- github.com/bjljohnson2012/field-school
- README locks Next as the live ship path.
- GitHub main is TanStack Start + Vite + Better Auth + PGlite/pg with migrations 0001_auth, 0002_course, 0003_university. Those tables are a single-campus demo (course_progress by slug, faculty dean). Do not deploy main onto the VPS. Do not migrate the live app onto TanStack. You may read those SQL files for field ideas only.

Factory lock

- Asset Just (Cap id 27pn9xs0zk8a73g) is HLS Ready and locked. Do not re-render it. Do not write an Edit spec on it.
- Melt is single-flight. Refuses if MemAvailable < 3072 MiB. Uses 2 of 4 CPUs. Render lock: /opt/field-school/edit/render.lock
- Camera hold on new takes is a human/factory concern. Do not block Wave 1 on a new film.

## Hard rules

1. One Next app. One Postgres on this VPS. No third VPS. No second Cap.
2. Notion = authoring for Field School originals. Postgres = people, events, progress.
3. No new Notion databases.
4. Do not put Field School video or campus DB under /opt/cap or /opt/cnc-vault. Postgres and app runtime config go under /opt/field-school.
5. Do not expose Postgres. Do not put secrets in Notion, chat, or repo.
6. Guest catalog may stay. Authenticated progress writes Postgres. Guest progress may stay localStorage. Do not mix them.
7. Every query for learner data is scoped by org_id / membership_id.
8. Household org cannot read Org 0 staff data. Org 0 staff cannot read household members unless invited.
9. Child accounts (Wave 2+) cannot mint tokens. Wave 1: adults only.
10. Generated quizzes, web scrapes, MCP campus server, wildcard DNS, Cap tenant HLS, AUTH_URL flip: out of scope this run.
11. Keep existing Caddy sites for cap, edit, fieldschool.ai working.
12. Prefer small diffs on the live Next tree. Do not rewrite the player UI.

## Wave 1 scope (this run)

Build the runtime kernel and prove durable authenticated progress on the existing Grok Bot station 01.

### A. Postgres on the VPS

- Add Postgres 16 + volume to compose under /opt/field-school (or the existing Next app compose if that is how the box already runs).
- Enable pgvector now even if Wave 1 does not embed. Cheaper than a later rebuild.
- shared_buffers 256-512 MB.
- Nightly pg_dump to a directory on the box that already gets Hostinger backups.
- DATABASE_URL only in app env.

### B. Schema (Drizzle or the migration style the Next app already uses)

Create these tables. Snake_case. Do not use the TanStack 0002/0003 tables as the live schema.

organizations
- id, slug unique, name, type (gym|company|school|homeschool), visibility (private|unlisted|public_catalog|public_courses), isolation (strict|platform_plus), host nullable, custom_host nullable, features jsonb default '{}', created_at

members
- id, user_id (auth user id text), name, email nullable, kind default 'adult', created_at

memberships
- id, org_id, member_id, status default 'active', is_billing_contact bool, created_at
- unique (org_id, member_id)

groups
- id, org_id, kind (cohort|team|class|household|gym_saturday), name, pack_id nullable

group_memberships
- group_id, membership_id, primary_stance

assignments
- id, membership_id, stance (learner|teammate|teacher|trainer|coach|leader|guardian|admin), scope_type (org|group|course|member), scope_id text, status default 'active'

learning_events
- id, org_id, membership_id, group_id nullable, actor_membership_id, actor_stance, kind (watch|read|quiz|test|fieldwork|search|chat|coach_score|agent), object_type, object_id, skill_ids text[] default '{}', score numeric nullable, raw jsonb default '{}', created_at

Keep auth tables whatever Auth.js / the live Next app already uses. Do not replace the existing auth library with Better Auth unless the live Next app already uses Better Auth. Match the running app.

### C. Seed

1. Org 0: slug `field-school`, type gym, visibility public_catalog, isolation platform_plus. Group `Saturday gym` kind gym_saturday.
2. Household org: slug `household` (or a slug the human supplies), type homeschool, visibility private, isolation strict. Group `Household` kind household. features.cap = false.
3. On first authenticated login:
   - Upsert member from the auth user.
   - If email is on the staff allowlist already used by /admin, membership in Org 0 with assignments: learner @ Org 0, and admin @ Org 0 if they were already admin.
   - Invite-only for household. Do not auto-join every login to the household.
4. Provide a one-shot invite path (env INVITE_HOUSEHOLD_EMAILS or a staff-only script) so the human can join the household org without building a full invite UI this wave.

### D. Auth

- Do not flip AUTH_URL.
- Keep guest routes working (/c/grok-bot, Continue as guest).
- Wire authenticated sessions so a logged-in user is a member.
- Staff Google may stay allowlist-only as it is today.
- Email magic link or the app's existing free-beta signup is enough for a second test user.
- Anonymous /admin must remain 307 with no PII in HTML.

### E. Progress write path

On the existing Grok Bot station player, when the user is authenticated:

- Mark watched / equivalent inserts learning_events kind=watch, object_type=lesson, object_id=the station/module id already used in the UI.
- Quiz submit inserts kind=quiz with score in raw/score.
- Refresh loads progress from learning_events, not localStorage.
- Guest still uses the current guest behavior.

Do not build /today, search, autogen, uploads, or MCP.

### F. Minimal API used by the player

Internal functions, also exposed as simple Route Handlers if the Next app needs them:

- GET /api/me — member + memberships + assignments
- GET /api/progress?course=grok-bot — events for this membership
- POST /api/events — authenticated write only

All three filter by the session membership. Reject cross-org ids.

## Out of scope this run

Wildcard DNS, mcp.fieldschool.ai, inference router, BYOK, Notion publish worker, Stations sync, source providers, parent review queue, learner_models, resource_proposals, Cap add-on, custom domains, TanStack UI, melt/edit changes, social distribute, checkout, AUTH_URL / university 301.

## Proof (must pass before you stop)

1. postgres is up on the Field School VPS. Next app still serves portal/university.
2. cap.fieldschool.ai and edit.fieldschool.ai /health still work.
3. Staff can sign in as today. Anonymous /admin still 307.
4. Authenticated user A watches Grok Bot station 01, refreshes, watch event is still there (Postgres).
5. User B on another browser does not see user A events.
6. Guest window still plays Grok Bot and does not write those rows as user A.
7. Household membership (if seeded/invited) cannot read Org 0 staff lists.
8. Just Asset was not touched.
9. No secrets committed. DATABASE_URL in env only.
10. Deploy used the existing Next path + vps_deploy convention. GitHub main TanStack was not deployed.

Write a short WAVE1.md in the repo with commands, env vars, seed slugs, and the proof results.

## Implementation style

- Small PRs. One wave.
- Match existing Next + TypeScript + Tailwind conventions in the live app, not the TanStack main folder layout.
- If you cannot find the live Next tree vs marketing-site vs video-pipeline, stop and list the paths you found. Do not guess a third app.
- If RAM is tight, do not raise melt's CPU. Keep Postgres small.
- After deploy, curl /health-equivalent of the app plus https://edit.fieldschool.ai/health.

## If the human opens later waves

Only then follow this order: Wave 2 hosts/stances/children to Wave 3 Notion publish + pgvector units to Wave 4 sources + parent approve to Wave 5 learner_model + chooser to Wave 6 grounded autogen + resource proposals to Wave 7 campus MCP to Wave 8 AUTH_URL to Wave 9 Cap add-on.

Default: Wave 1 only.
