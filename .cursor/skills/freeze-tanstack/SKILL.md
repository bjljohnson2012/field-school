---
name: freeze-tanstack
description: freeze-tanstack — refuse TanStack PRs / repo-root src/
---

# Freeze TanStack

Wave: fenced. Refuse TanStack PRs. Does not block Wave 2.

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
- Invent a second Pattern bank or add `build-all-waves`
