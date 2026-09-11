# Current state (verified 2026-09-11)

## Live and working

- Marketing site on fieldschool.ai (pricing $100/$200/$1000). Foundry off the cart.
- Next campus on university.benjohnson.ai. portal.fieldschool.ai serves the same guest campus (Grok Bot, Continue as guest, free beta).
- AUTH_URL still points at university.benjohnson.ai. University 301 is held. Portal Google/X OAuth callbacks are not complete.
- Guest learning works. Progress is not a durable multi-user graph.
- Cap on cap.fieldschool.ai. Adapter writes Notion Assets. Grok STT lands Review. POST edit.fieldschool.ai/trigger is live. Melt is single-flight.
- Asset Just (Cap id 27pn9xs0zk8a73g) proved HLS. Locked. Do not re-render it.
- Notion factory: Courses, Modules / Lessons, Assets / Videos. Stations Path 1-63 is the curriculum graph.
- Video files: /opt/fieldschool-video. Cap: /opt/cap. Edit: /opt/field-school/edit.
- Deploy: Cloud Agent + /home/ubuntu/.ssh/vps_deploy only.

## Repo trap

GitHub main is TanStack Start + Vite + Better Auth + pg/PGlite with migrations 0001_auth, 0002_course, 0003_university. That schema is a single-campus demo. No organizations, stances, events, sources, or learner model.

README locks Next as the live ship path. Do not deploy main onto the VPS. Land Wave 1 on the Next app Caddy already serves.

## Missing

Postgres learner plane, orgs/memberships/groups/assignments, household isolation, wildcard hosts, source-agnostic lessons, parent review, learner model, grounded generation, resource proposal inbox, campus MCP, signed tenant HLS, custom domains.
