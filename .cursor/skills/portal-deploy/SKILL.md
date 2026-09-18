---
name: portal-deploy
description: Wave 1 keep-alive for portal.fieldschool.ai Caddy + deploy.sh. Use for campus TLS, reverse proxy, or /opt/field-school deploys — not AUTH_URL or university 301.
---

# Portal deploy

Wave: 1 keep-alive (patch only if proofs fail). This skill does not ship Wave 2 app code.

Attach:

- `AGENTS.md`
- `app/DEPLOY.md`
- `app/deploy/deploy.sh`
- `docs/campus-runtime/WAVE1.md`

Absorbed branches (stop using separately):

- `cursor/portal-fieldschool-plan-07a8`

## Own

- Campus VPS `2.24.70.248`, app under `/opt/field-school`, `deploy/deploy.sh`
- `portal.fieldschool.ai` sibling Caddy vhost → same Next app as university
- Keep `university.benjohnson.ai` serving. Guest and `/docs/api` stay up
- Postgres campus DB under `/opt/field-school`. Apply `app/` migrations the script already runs
- After every deploy: curl portal guest `/api/me`, cap login, `edit.fieldschool.ai/health`

## Do not

- Flip `AUTH_URL` (stays `https://university.benjohnson.ai`) or 301 university
- Wipe Caddy apex
- SSH CNC vault `2.24.64.248` or edit Cap compose
- Deploy TanStack `src/` or `vite.config.ts`

SSH `/home/ubuntu/.ssh/vps_deploy` to `root@2.24.70.248` for the Next app only.
