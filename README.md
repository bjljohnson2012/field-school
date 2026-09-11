# Field School

Public site: https://fieldschool.ai
App: https://portal.fieldschool.ai
Legacy campus (301 held): https://university.benjohnson.ai
Capture: https://cap.fieldschool.ai
Edit MCP: https://edit.fieldschool.ai

Official build path on this repo: **campus runtime** (multi-tenant Next app + Postgres).
Start here: [docs/campus-runtime/README.md](docs/campus-runtime/README.md).

Wave 1 is live in `app/` and on the VPS. How it works, schema, and APIs: [docs/campus-runtime/API.md](docs/campus-runtime/API.md). Live page: https://portal.fieldschool.ai/docs/api. Proof: [docs/campus-runtime/WAVE1.md](docs/campus-runtime/WAVE1.md).

The TanStack Start tree under `src/`, `vite.config.ts`, and `migrations/0001-0003` is frozen. Do not extend it. Do not deploy it to the VPS.

## What main is now

1. `docs/campus-runtime/` — plan, waves, [API](docs/campus-runtime/API.md), Wave 1 proof.
2. `app/` — live Next campus (identity + Grok Bot events).
3. `marketing-site/` — public fieldschool.ai HTML.
4. `video-pipeline/` — Cap / adapter / edit notes for the factory on 2.24.70.248.
5. Frozen TanStack demo — see [archive/TANSTACK.md](archive/TANSTACK.md).

## Wave 1 in one pass

Guest progress stays in the browser. A signed-in member is upserted onto org `field-school`. Watch / quiz / field work on [Grok Bot station 01](https://portal.fieldschool.ai/c/grok-bot/s/briefing) writes `learning_events`. `GET /api/me`, `GET /api/progress?course=grok-bot`, `POST /api/events`. Isolation is `org_id` + `membership_id`. Seed slugs: `field-school`, `household`. AUTH_URL still `university.benjohnson.ai`.

## Domains

- `fieldschool.ai` — marketing. Source: `marketing-site/`.
- `portal.fieldschool.ai` — campus app. Today a guest Next demo still runs on the VPS. AUTH_URL still points at university.benjohnson.ai. Do not flip AUTH_URL in Wave 1.
- `cap.fieldschool.ai` — capture only.
- `edit.fieldschool.ai` — factory MCP / melt. Not the learner MCP.

## SKUs

Gym $100 / $200 / $1,000. Foundry is off the cart. Invoice later. This runtime is the gym OS plus a private household tenant. Not a fourth SKU.

## Deploy

Cloud Agent + `/home/ubuntu/.ssh/vps_deploy` only. Target VPS `2.24.70.248`. CNC vault `2.24.64.248` is off limits.

Do not deploy the frozen TanStack tree.
Do not use the shared Grok box for SSH.

## Agents

Read [AGENTS.md](AGENTS.md) before writing code.
