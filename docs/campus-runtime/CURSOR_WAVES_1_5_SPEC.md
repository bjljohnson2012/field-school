# Field School Cursor spec (Waves 1-5)

Repo: github.com/bjljohnson2012/field-school
Live app: app/ on VPS 2.24.70.248
Factory: Cap + Notion Assets + edit.fieldschool.ai + melt
Plates: Remotion package plates/
As of 2026-09-18: Wave 1 live. SQL 0002-0004 in repo. Treat tenants/Pattern as incomplete until proofs pass on the VPS.

One Cursor Project per wave. Do not start N+1 until WAVE{N}.md proofs pass.

## Context files

AGENTS.md, docs/campus-runtime/START.md, CURSOR_AGENT_PROMPT.md, STATUS.md, CURRENT_RUN.md, TENANTS_AND_COURSES.md, ASSESSMENTS_AND_PICKER.md, FIELD_PATTERN.md, fp-50-v1.md, API.md, WAVE1.md, app/db/0001_wave1.sql, 0002_field_pattern.sql, 0003_pattern_weights.sql, 0004_tenants.sql, app/DEPLOY.md, app/AUTH.md, video-pipeline/AGENTS.md, this spec.

Remotion docs: https://www.remotion.dev/docs/ai.md https://www.remotion.dev/docs/ai/skills.md https://www.remotion.dev/docs/ai/cursor-plugin.md https://github.com/remotion-dev/skills

## Connections

- GitHub field-school. Work in app/, plates/, docs/. Do not extend frozen TanStack src/.
- VPS 2.24.70.248 via app/deploy/deploy.sh. No CNC vault 2.24.64.248.
- Postgres field-school-campus-db / campus. Not leftover field-school-db.
- Auth.js. AUTH_URL stays https://university.benjohnson.ai through Wave 5.
- Notion Courses/Modules/Assets only. No Member/Quiz/Personality DBs.
- Cap cap.fieldschool.ai Studio Mode. No titles in Cap.
- Edit MCP edit.fieldschool.ai. Just 27pn9xs0zk8a73g locked.
- Grok STT. Remotion Studio local + VPS render. No Remotion MCP.

## Remotion skills

Install in plates/ at Wave 4: `npx remotion skills add` or `npx skills add remotion-dev/skills`.
Cursor plugin: remotion.dev/docs/ai/cursor-plugin
Invoke: /remotion-best-practices /remotion-create /remotion-markup /remotion-studio /remotion-render /remotion-docs /remotion-captions
Local: cap-remotion-pipeline, remotion-box-style.
Do not install Remotion MCP.

## Locks

Next in app/. Remotion in plates/. Melt owns hour masters. Remotion owns 8-20s plates. Melt single-flight render.lock. Remotion waits if lock exists or MemAvailable < 3072 MiB. No AUTH_URL flip, no TanStack deploy, no Just re-render. Quiz items need source_unit_id. Household and sales events never mix. Product name Field Pattern.

Git: branch cursor/wave-N-<slug>, PR to main, deploy.sh, fill WAVE{N}.md. One wave per PR.

## Wave 1 verify (done)

Confirm: guest /api/me guest:true; guest POST /api/events 401; /c/grok-bot 200; cap login 200; edit /health ok; AUTH_URL university; signed-in watch survives refresh.

## Wave 2 tenants + Pattern

Branch cursor/wave-2-tenants. SQL 0002-0004.
Ship: household + sales, picker, /o/:slug, /api/me all memberships + activeOrg, invites, child on household, trainer on sales, home:welcome + sales:welcome, fp-50-v1 profiles + revisions + narrative, org skill diagnostics. Apply SQL on VPS. Deploy.
Proofs: picker both orgs; events isolated; uninvited household 403; child no admin; Pattern writes profile; guest Grok Bot works; cap + edit health.
Stop. No composer. No Remotion.

## Wave 3 composer

Branch cursor/wave-3-composer. 0005_composer.sql: courses, lessons, sources, knowledge_units, quiz_items, publish_requests.
UI /o/:slug/teach. Drafts hidden from children. Uploads /opt/field-school/uploads/{org_id}/ 200MB file, 2GB org.
Proofs: household draft hidden; publish visible to child; sales lesson not in household; missing source_unit_id rejected; PDF 403 across orgs; Grok Bot guest works.

## Wave 4 Cap + plates scaffold

Branch cursor/wave-4-record.
Cap Studio cam or cam+screen. Review STT + chapters + publish. Melt HLS in player. New take, not Just.
Push 4.0 first:
```
npx create-video@latest --yes --blank plates
cd plates && npm install && npx remotion skills add
```
Pin remotion versions, no carets. plates/AGENTS.md layer order: bed, screen, talking-head card, lower third, captions, letterbox, audio. Later siblings on top.
Proofs: new take at Review; dropped chapter skipped; HLS 200; Just trigger refused; no second melt; remotion compositions lists; cap + edit health.

## Wave 5 plates

Branch cursor/wave-5-plates.
Compositions only: Opener 8-12s, RecapCard 8-12s, DefinitionBoard still+6s, QuizBumper 6-8s, TalkingHeadCard. 1920x1080 30fps. No 9:16 pack. No hour master.
0006_plates.sql plate_renders. Approve/reject. Player rail + chapter markers + quiz cue with source_unit_id.
Render script waits on render.lock and RAM. CPU cap 2/4.
STT nudge Bearing step 0.15. Pattern run resets. Parent can lock child profile.
Proofs: rejected plate absent; approved Recap in player; quiz without unit rejected; melt lock blocks plate job; face docked not full-bleed; 10s mumble does not jump Bearing 70 points; sales cannot open household profile; cap + edit health.

## Out until after Wave 5

Wildcard DNS, campus MCP, AUTH_URL flip, chooser LLM, Stations Notion sync, vertical social pack, Remotion Lambda, second VPS.
