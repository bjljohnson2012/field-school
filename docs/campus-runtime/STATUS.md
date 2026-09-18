# Status — 2026-09-18

Wave 1 is live on the VPS and in `app/`. Wave 2 tenants + picker + Field Pattern is proven in [WAVE2.md](./WAVE2.md).

- Postgres `field-school-campus-db`, orgs `field-school` and `household`
- APIs: GET /api/me, GET /api/progress, POST /api/events
- Guest Grok Bot still works. AUTH_URL still university.benjohnson.ai
- Live docs: https://portal.fieldschool.ai/docs/api
- Proof: WAVE1.md

Grok Build was given two prompts tonight for the next run. Code for that run may still be in flight when you open this.

## Current run (not Wave 1)

Read in this order:

1. This file
2. TENANTS_AND_COURSES.md
3. ASSESSMENTS_AND_PICKER.md
4. FIELD_PATTERN.md
5. fp-50-v1.md (full item table + living profile)
6. CURRENT_RUN.md (the prompt Build should follow)

Gym wording is retired. First student orgs: household and sales.

## Done

Wave 1 identity + Grok Bot station 01 events. Factory (Cap / edit / melt) left running. Just locked.

## Landed this run

Wave 2 is proven. Household + sales orgs, `/o/:slug`, org picker, invites, fixture welcome lessons, child on household, Field Pattern correspondences + import override, org-scoped skill diagnostics. AUTH_URL not flipped. TanStack not deployed. Remotion and adaptive generation not started. Proof: [WAVE2.md](./WAVE2.md).

## In flight / next

Wave 3 waits on a human. Not started.

- Artifact STT nudges on the profile (Wave 5)
- Composer text / upload / book / link (Wave 3, not this run)

## Not this run

AUTH_URL flip, TanStack deploy, Remotion plates, adaptive generation, Notion publish, campus MCP, wildcard DNS.

## Tomorrow morning checklist

1. `git log -5 --oneline` on main. If Build committed, read WAVE2.md / new app/ files.
2. Signed-out: https://portal.fieldschool.ai/api/me should still be guest.
3. https://edit.fieldschool.ai/health and cap login.
4. If picker exists: one login, flip household / sales, confirm events do not cross.
5. If Pattern exists: take fp-50-v1, open the profile narrative.
6. If nothing new landed, paste CURRENT_RUN.md into Grok Build again.
