---
name: portal-deploy
description: Deploy portal.fieldschool.ai on the campus VPS with Caddy + deploy.sh. Use for portal TLS, reverse proxy, or /opt/field-school deploys — not AUTH_URL or university 301.
---
# Portal deploy

## Own

- Campus VPS `2.24.70.248`, app under `/opt/field-school`, `deploy/deploy.sh`
- `portal.fieldschool.ai` sibling Caddy vhost → same Next app as university
- Keep `university.benjohnson.ai` serving. Guest and `/docs/api` stay up
- Postgres campus DB under `/opt/field-school`. Apply `app/` migrations the script already runs

## Do not

- Flip `AUTH_URL` until cert + Google/X console URIs exist and Ben says
- 301 university or wipe Caddy apex
- SSH CNC vault `2.24.64.248` or edit Cap compose
- Deploy TanStack `src/` or `vite.config.ts`

SSH `/home/ubuntu/.ssh/vps_deploy` to `root@2.24.70.248` for the Next app only.
