# Agents working in this repo

Product plan: `docs/staff/THREE_LOOPS.md`.
Job and locks: `FIELD-SCHOOL-ETHOS-MEMO.md`.
How Field School PM runs: `docs/staff/FIELD_SCHOOL_PM_LOOP.md`.
Read those three before a ticket, a PR, or a PASS claim. None of them grants Launch PASS.

Field School is three loops: Factory (Cap take to postable files), Composer (files to approved course), Portal (leader assigns; login salesperson or tracked child moves).
Week done-when lives in THREE_LOOPS. Tests and dest SHAs are not the week.

Two rooms: household and sales. They run together. Household is not the default.
One ticket names one room. Two streams only when files do not collide. Third waits.
If a wave doc or GRAPH.md disagrees with THREE_LOOPS on what to build this week, THREE_LOOPS wins.
If anything disagrees on User vs Child, prices, AUTH_URL, dest, or person-in-development-as-buyer, the ethos memo wins.

User: `.cursor/USER.md` and `docs/campus-runtime/USER.md`.
Entry: `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`.

Wave 1 is done. Proof: `docs/campus-runtime/WAVE1.md`.

## Do

- Build campus in `app/`. Remotion stays in `plates/`.
- Scope learner queries by org_id / membership_id.
- Keep guest Grok Bot. Keep factory (Cap, edit, melt) healthy.
- Quiz items need source_unit_id.
- Label login learners vs tracked children. Never mix them.

## Do not

- Extend frozen TanStack `src/` or deploy `vite.config.ts`.
- Touch CNC vault 2.24.64.248.
- Flip AUTH_URL back to university.benjohnson.ai. Canonical is portal.fieldschool.ai.
- Re-render Just (Cap id 27pn9xs0zk8a73g).
- Invent a second Pattern item bank or official MBTI / Enneagram / Gallup / Wiley items.
- Install Remotion MCP or package Remotion into Next.
- Add FastAPI, Celery, Qdrant, or a new plate type.
- Child login. Treat a salesperson as a child.
- Default to household and leave team for later.
- Put household and team in one ticket.
- Treat a dest SHA or hire-path test as the company end.
