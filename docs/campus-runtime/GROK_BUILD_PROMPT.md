# Grok Build prompt — Field School campus runtime

This repo's official line is the campus runtime plan. TanStack under `src/` is frozen.

Read `AGENTS.md`, `docs/campus-runtime/README.md`, then execute the PROMPT. Wave 1 only unless the human names another wave.

---

PROMPT

You are implementing Field School campus runtime on github.com/bjljohnson2012/field-school `main` and the Hostinger VPS 2.24.70.248.

Official code lives in `app/` (Next). Do not extend `src/` TanStack Start. Do not deploy `vite.config.ts` or migrations 0001-0003. Those are frozen. See `archive/TANSTACK.md`.

## Mission

Two tenants on one Next app + Postgres:

1. Org 0 Field School gym/team (public catalog, private progress).
2. Private household org (homeschool). Strict isolation.

This run is Wave 1 only.

## Current state

- fieldschool.ai = marketing-site/
- portal.fieldschool.ai and university.benjohnson.ai = guest campus still running as Next on the VPS. AUTH_URL still university. Do not flip it.
- cap.fieldschool.ai / edit.fieldschool.ai = factory. Leave them running.
- This GitHub repo previously treated TanStack as main. That is over. Build Next in `app/`.
- If the VPS Next source is not already in this repo, scaffold `app/` as Next + TypeScript + Tailwind and port Grok Bot station 01 watch/quiz enough to persist events. Do not rebuild TanStack routes.

Factory: Just Asset 27pn9xs0zk8a73g is locked. Melt single-flight. CNC vault 2.24.64.248 off limits. Deploy only Cloud Agent + /home/ubuntu/.ssh/vps_deploy.

## Wave 1 in app/

Postgres 16 + pgvector under /opt/field-school. Schema: organizations, members, memberships, groups, group_memberships, assignments, learning_events. Seed org slugs `field-school` and `household`. Authenticated watch/quiz on Grok Bot station 01 writes learning_events. Guest may stay guest. APIs: GET /api/me, GET /api/progress?course=grok-bot, POST /api/events. Write docs/campus-runtime/WAVE1.md when proof passes.

Full table shapes and proof list: keep the Wave 1 section from the previous prompt in this folder and from 02-destination-and-schema.md / 03-waves.md.

Default: Wave 1 only.
