# Agents working in this repo

Law for hire-path, parent/Child identity, locks, tickets, evaluators, and checkers: `FIELD-SCHOOL-ETHOS-MEMO.md`.
Read that file before a ticket, a PR, or a PASS claim. It does not grant Launch PASS.
If a wave doc and the ethos memo disagree on User vs Child, prices, AUTH_URL, or dest, the ethos memo wins.

User: `.cursor/USER.md` and `docs/campus-runtime/USER.md`.
Entry: `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`.
Worker names: `docs/campus-runtime/WORKER_RENAME.md`.
Role skills: `.cursor/skills/` and `docs/campus-runtime/ROLE_SKILLS.md`.

Wave 1 is done. Proof: `docs/campus-runtime/WAVE1.md`.

## Do

- Build campus in `app/`.
- One wave at a time. Wave 2 first: household + sales + fp-50-v1 from `docs/campus-runtime/fp-50-v1.md` and `app/db/0002`–`0004`.
- Scope learner queries by org_id / membership_id.
- Keep guest Grok Bot. Keep factory (Cap, edit, melt) healthy.

## Do not

- Extend frozen TanStack `src/` or deploy `vite.config.ts`.
- Touch CNC vault 2.24.64.248.
- Flip AUTH_URL back to university.benjohnson.ai. Canonical is portal.fieldschool.ai; university 301s there.
- Re-render Just (Cap id 27pn9xs0zk8a73g).
- Add Notion Member / Quiz / Personality databases.
- Invent a second Pattern item bank or official MBTI / Enneagram / Gallup / Wiley items.
- Install Remotion MCP.
