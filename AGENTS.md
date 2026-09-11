# Agents working in this repo

Canonical plan: `docs/campus-runtime/`.

Wave 1 prompt: `docs/campus-runtime/GROK_BUILD_PROMPT.md`.

## Do

- Build the campus runtime as a Next app in `app/`.
- Put Postgres schema for organizations, members, memberships, groups, assignments, learning_events under `app/` (Drizzle or SQL migrations owned by that app).
- Keep marketing-site/ and video-pipeline/ working.
- Keep guest Grok Bot routes working once ported. Authenticated progress writes Postgres.
- Scope every learner query by org_id / membership_id.
- Stop at the current wave proof unless the human names the next wave. Default wave: 1.

## Do not

- Extend `src/routes`, `src/router.tsx`, or TanStack Start.
- Run or deploy `vite.config.ts` as the campus app.
- Treat `migrations/0001_auth.sql`, `0002_course.sql`, `0003_university.sql` as the live schema. Those belong to the frozen demo.
- Deploy GitHub TanStack files onto 2.24.70.248.
- Touch CNC vault 2.24.64.248.
- Flip AUTH_URL or 301 university in Wave 1.
- Re-render Asset Just (Cap id 27pn9xs0zk8a73g).
- Add Member / Quiz / Personality databases in Notion.
- Scrape the web into the knowledge pack.

## Factory vs campus

- Factory: Cap, Notion Assets, edit.fieldschool.ai, melt, /opt/fieldschool-video.
- Campus: portal.fieldschool.ai, Postgres under /opt/field-school, later mcp.fieldschool.ai.
