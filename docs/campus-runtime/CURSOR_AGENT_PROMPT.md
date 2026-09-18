# Cursor agent prompt — Field School campus

Paste this into Cursor if you want, or send only the three-line message in START.md. This file is the brief.

---

PROMPT

You are building Field School campus runtime in this repo.

Read first, in order:
- AGENTS.md
- docs/campus-runtime/START.md
- docs/campus-runtime/STATUS.md
- docs/campus-runtime/CURRENT_RUN.md
- docs/campus-runtime/CURSOR_WAVES_1_5_SPEC.md
- docs/campus-runtime/TENANTS_AND_COURSES.md
- docs/campus-runtime/ASSESSMENTS_AND_PICKER.md
- docs/campus-runtime/FIELD_PATTERN.md
- docs/campus-runtime/fp-50-v1.md
- docs/campus-runtime/API.md
- docs/campus-runtime/WAVE1.md
- app/DEPLOY.md
- app/AUTH.md
- app/db/0001_wave1.sql through 0004_tenants.sql
- video-pipeline/AGENTS.md

## What this product is

Two student orgs on one Next app + Postgres: household (homeschool) and sales team. Field School is the operator, not a gym OS. One Auth.js email can belong to both and flip with an org picker and /o/:slug.

Learners have a living Field Pattern profile (fp-50-v1) saved on the person. Skills stay org-scoped. Teachers create lessons (text first, Cap record later). Remotion renders short graphic plates only. Melt renders hour-long masters.

## Live facts

- Next app: app/ on VPS 2.24.70.248. Hosts: fieldschool.ai, portal.fieldschool.ai, university.benjohnson.ai, cap.fieldschool.ai, edit.fieldschool.ai
- Postgres: container field-school-campus-db, database campus. Do not write to leftover field-school-db (frozen TanStack).
- Wave 1 is live: GET /api/me, GET /api/progress, POST /api/events. Guest Grok Bot works. Guest POST /api/events is 401.
- AUTH_URL is https://university.benjohnson.ai. Do not flip it. Do not 301 university.
- SQL 0002-0004 is in the repo (Field Pattern + tenants). Verify it is applied on the VPS before building UI on top.
- Factory: Cap capture, Notion Assets, edit.fieldschool.ai, melt. Asset Just (Cap id 27pn9xs0zk8a73g) is locked. Do not re-render it.
- CNC vault 2.24.64.248 is off limits.
- Deploy: cd app && use existing deploy/deploy.sh + vps_deploy key. After every deploy curl portal guest /api/me, cap login, edit.fieldschool.ai/health.

## Hard rules

- Implement in app/ (Next). Remotion lives in plates/ only, starting Wave 4.
- Do not extend repo-root src/ TanStack, vite.config.ts, or migrations/0001-0003.
- Do not add Notion Member / Quiz / Personality databases.
- Do not scrape the web into the knowledge pack.
- Do not copy official MBTI, Enneagram Institute, Gallup, or Wiley item text. Product name is Field Pattern.
- Quiz items require source_unit_id or they do not persist.
- Every learner query is scoped by org_id + membership_id. Household and sales never mix.
- Melt is single-flight (render.lock). Remotion plate renders wait if that lock exists or MemAvailable < 3072 MiB.
- Remotion MCP is deprecated. Do not install it. Use official Remotion Agent Skills and /remotion-docs.
- One wave at a time. Do not start N+1 until that wave proof table is written to docs/campus-runtime/WAVE{N}.md.

## Wave order

### Wave 1 — verify only
Confirm live proofs in WAVE1.md. Patch only if something is broken. No new features.

### Wave 2 — tenants + picker + Field Pattern
First build wave if Wave 1 still passes.

Ship:
- Orgs household and sales. Stop forcing every login onto field-school.
- GET /api/me returns all memberships + activeOrg.
- Org picker chrome + /o/:slug.
- Invites at /invite/:token. Child + guardian on household only. Trainer on sales.
- Fixture text lessons home:welcome and sales:welcome. Do not inherit Grok Bot into household.
- Field Pattern fp-50-v1 from fp-50-v1.md / SQL: 50 Likert items, 20-item child subset, eight Bearing dimensions, correspondence probability distributions, import override.
- member_profiles + append-only member_profile_revisions + template narrative (learn, approach, conflict, feedback, group).
- Org-scoped skills + one household diagnostic (3 parent-editable skills) + one sales diagnostic (3 seeded sales skills).
- Apply 0002-0004 on the VPS if missing.

Stop. No composer. No Remotion. No AUTH_URL flip.

Proofs in WAVE2.md: picker lists both orgs; events do not cross; uninvited /o/household is 403; child cannot admin or invite; fp-50 writes a profile; guest Grok Bot still works; cap + edit health ok.

### Wave 3 — composer (text / upload / book / link)
app/db/0005_composer.sql: courses, lessons, sources, knowledge_units, quiz_items.
Teacher UI under /o/:slug/teach. Drafts hidden from children. Uploads at /opt/field-school/uploads/{org_id}/. Units from supplied text only.

### Wave 4 — Cap record + plates scaffold
Cap Studio cam or cam+screen. No titles in Cap. Review: STT + chapters + publish to melt to HLS in the player. New take only. Not Just.

Scaffold plates/ as a separate package:
  npx create-video@latest --yes --blank plates
  cd plates && npm install && npx remotion skills add
Pin remotion and @remotion/* to the same version (no carets).
Write plates/AGENTS.md: layer order bed, screen, talking-head card, lower third, captions, letterbox, audio. Later siblings sit on top.

### Wave 5 — Remotion plates
Use Remotion Cursor plugin and skills: /remotion-best-practices /remotion-markup /remotion-studio /remotion-render /remotion-docs /remotion-captions
Docs: https://www.remotion.dev/docs/ai/ https://www.remotion.dev/docs/ai/skills https://www.remotion.dev/docs/ai/cursor-plugin

Compositions only: Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard. 1920x1080 30fps. 6-12s or a still. No hour-long master. No 9:16 social pack.

Teacher approves or rejects each plate. Rejected plates never appear. Player: plate rail + chapter markers + check-yourself quiz citing source_unit_id.
VPS render waits on melt lock. Papers/voice/video STT nudge Bearing with step 0.15. A new Pattern run resets Bearing. Parent can lock a child profile.

## How to work

1. Inspect the repo and say which wave is actually incomplete.
2. Open a branch cursor/wave-N-<slug>.
3. Implement only that wave.
4. Deploy with the existing app deploy script if the wave touches the live app.
5. Write docs/campus-runtime/WAVE{N}.md with pass/fail.
6. Stop and wait for the human before the next wave.

Default if unsure: finish Wave 2.
