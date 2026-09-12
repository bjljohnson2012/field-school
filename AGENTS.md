# Agents working in this repo

Canonical plan: `docs/campus-runtime/`.
Current run: `docs/campus-runtime/CURRENT_RUN.md` and `docs/campus-runtime/STATUS.md`.

Wave 1 is done. Proof: `docs/campus-runtime/WAVE1.md`. API: `docs/campus-runtime/API.md`. Live: `/docs/api`.

## Do

- Build the campus runtime as a Next app in `app/`.
- Follow CURRENT_RUN.md (household + sales, org picker, Field Pattern fp-50-v1, living profile, org-scoped skills).
- Use the item table in `docs/campus-runtime/fp-50-v1.md`. Do not invent a second bank.
- Keep guest Grok Bot working. Authenticated progress writes Postgres, scoped by org_id / membership_id.
- Keep marketing-site/ and video-pipeline/ working.

## Do not

- Extend the frozen TanStack tree in `src/`.
- Deploy `vite.config.ts` or `migrations/0001-0003`.
- Touch CNC vault 2.24.64.248.
- Flip AUTH_URL or 301 university this run.
- Re-render Asset Just (Cap id 27pn9xs0zk8a73g).
- Add Member / Quiz / Personality databases in Notion.
- Scrape the web into the knowledge pack.
- Copy official MBTI / Enneagram / Gallup / Wiley items.
- Start Remotion plates or adaptive generation unless CURRENT_RUN.md says so.

## Factory vs campus

- Factory: Cap, Notion Assets, edit.fieldschool.ai, melt, /opt/fieldschool-video.
- Campus: portal.fieldschool.ai, Postgres under /opt/field-school, later mcp.fieldschool.ai.
