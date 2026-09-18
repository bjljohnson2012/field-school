---
name: freeze-tanstack
description: Wave 1 keep-alive that refuses TanStack PRs and any work on repo-root src/, vite.config.ts, or migrations/0001-0003.
---

# Freeze TanStack

Wave: 1 keep-alive (patch only if proofs fail). Campus is `app/`.

Attach:

- `AGENTS.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`
- `docs/campus-runtime/CURSOR_WAVES_1_5_SPEC.md`

Absorbed branches: none.

## Own

- Refuse TanStack PRs. Do not review, implement, merge, or deploy work that extends the frozen tree
- Frozen: repo-root `src/`, `vite.config.ts`, `migrations/0001-0003`
- Leftover Postgres `field-school-db` is unused. Do not write to it
- New campus work stays in `app/` (Next) and, from Wave 4, `plates/`

## Do not

- Extend `src/routes` or deploy `vite.config.ts` onto the VPS
- Treat a TanStack PR as a campus wave
- Touch CNC vault `2.24.64.248`
