# Agents working in this repo

Single entry for Cursor: `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`.
Wave spec: `docs/campus-runtime/CURSOR_WAVES_1_5_SPEC.md`.
Status: `docs/campus-runtime/STATUS.md`.

Wave 1 is done. Proof: `docs/campus-runtime/WAVE1.md`. API: `docs/campus-runtime/API.md`.

## Do

- Build the campus runtime as a Next app in `app/`.
- Follow CURSOR_AGENT_PROMPT.md (household + sales, org picker, Field Pattern fp-50-v1, living profile, org-scoped skills, then composer, Cap, Remotion plates).
- Use `docs/campus-runtime/fp-50-v1.md` for the item bank. Do not invent a second bank.
- Keep guest Grok Bot working. Authenticated progress writes Postgres, scoped by org_id / membership_id.
- Keep marketing-site/ and video-pipeline/ working.
- One wave at a time. Write WAVE{N}.md proofs. Stop.

## Do not

- Extend the frozen TanStack tree in `src/`.
- Deploy `vite.config.ts` or `migrations/0001-0003`.
- Touch CNC vault 2.24.64.248.
- Flip AUTH_URL or 301 university through Wave 5.
- Re-render Asset Just (Cap id 27pn9xs0zk8a73g).
- Add Member / Quiz / Personality databases in Notion.
- Scrape the web into the knowledge pack.
- Copy official MBTI / Enneagram / Gallup / Wiley items.
- Install Remotion MCP. Use `npx remotion skills add` and `/remotion-docs`.

## Factory vs campus

- Factory: Cap, Notion Assets, edit.fieldschool.ai, melt, /opt/fieldschool-video.
- Campus: portal.fieldschool.ai, Postgres under /opt/field-school.
- Plates: plates/ Remotion, Wave 4 scaffold, Wave 5 compositions.
