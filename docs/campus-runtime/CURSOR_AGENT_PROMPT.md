# Cursor agent prompt — Field School campus

Paste everything under PROMPT into a new Cursor Agent chat on github.com/bjljohnson2012/field-school. Work on main live tree (app/). Do not extend frozen TanStack src/ at repo root.

---

PROMPT

You are building Field School campus runtime in this repo.

Read first, in order: AGENTS.md, docs/campus-runtime/STATUS.md, CURRENT_RUN.md, CURSOR_WAVES_1_5_SPEC.md, TENANTS_AND_COURSES.md, ASSESSMENTS_AND_PICKER.md, FIELD_PATTERN.md, fp-50-v1.md, API.md, WAVE1.md, app/DEPLOY.md, app/AUTH.md, app/db/0001_wave1.sql through 0004_tenants.sql, video-pipeline/AGENTS.md.

Two student orgs on one Next app + Postgres: household and sales team. Field School is the operator. One Auth.js email can belong to both and flip with an org picker and /o/:slug. Field Pattern fp-50-v1 is the personality engine. Skills stay org-scoped. Melt owns hour-long masters. Remotion owns short plates in plates/ starting Wave 4.

Live: app/ on 2.24.70.248. Postgres field-school-campus-db / campus. Wave 1 APIs live. AUTH_URL stays university.benjohnson.ai. Just Asset 27pn9xs0zk8a73g locked. CNC vault 2.24.64.248 off limits. Do not write leftover field-school-db. Deploy via app/deploy/deploy.sh. After deploy curl guest /api/me, cap login, edit.fieldschool.ai/health.

Rules: implement in app/. Do not extend TanStack src/. No Notion Member/Quiz/Personality DBs. No web scrape into the pack. No official MBTI/RHETI/Gallup/Wiley items. Quiz items need source_unit_id. Scope every learner query by org_id + membership_id. Melt single-flight. Remotion MCP deprecated — use npx remotion skills add and /remotion-docs. One wave at a time.

Wave 1 verify only. Wave 2 (default start if Wave 1 passes): household + sales, picker, /o/:slug, invites, child on household, trainer on sales, fixtures home:welcome and sales:welcome, fp-50-v1 profiles + revisions, org skill diagnostics, apply 0002-0004. No composer, no Remotion.
Wave 3: composer text/upload/book/link, 0005_composer.sql.
Wave 4: Cap Studio → Review STT/chapters → melt → HLS. Scaffold plates/ with create-video --blank and remotion skills add.
Wave 5: compositions Opener RecapCard DefinitionBoard QuizBumper TalkingHeadCard only. Approve/reject. Player rail. STT nudges Bearing 0.15. Render waits on melt lock.

Inspect the repo, name the incomplete wave, branch cursor/wave-N-<slug>, implement only that wave, deploy if needed, write WAVE{N}.md proofs, stop. Default: finish Wave 2.
