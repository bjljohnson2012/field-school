---
name: Wave 1-5 deploy
description: Wave 1-5 deploy — app/deploy/deploy.sh + Caddy, proofs after every ship
---

# Wave 1-5 deploy

Wave: 1–5 gate. Deploy only. No campus feature work from this skill.

Attach:

- `app/DEPLOY.md`
- `app/deploy/deploy.sh`
- `docs/campus-runtime/WAVE1.md`
- `AGENTS.md`

Absorbed branches (stop using separately):

- `cursor/portal-fieldschool-plan-07a8`

## Own

- Campus VPS `2.24.70.248`, `/opt/field-school`, `app/deploy/deploy.sh`
- `portal.fieldschool.ai` Caddy vhost → same Next app as university
- Keep `university.benjohnson.ai` serving
- After every ship: guest `/api/me`, cap login, `https://edit.fieldschool.ai/health`
- Do not deploy TanStack `src/` or `vite.config.ts`

## Do not

- Flip `AUTH_URL` or 301 university
- Wipe Caddy apex
- SSH CNC vault `2.24.64.248`
- Implement Wave 2 tenants or Pattern
