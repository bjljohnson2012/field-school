---
name: VPS keys (campus only)
description: VPS keys (campus only) — 2.24.70.248 SSH/DNS, not vault 2.24.64.248
---

# VPS keys (campus only)

Wave: infra / fenced. Does not block Wave 2.

Attach:

- `app/DEPLOY.md`
- `AGENTS.md`

Absorbed branches: none.

## Own

- SSH/DNS for campus VPS `2.24.70.248`
- Key `/home/ubuntu/.ssh/vps_deploy`
- Hostinger MCP for inventory or DNS on fieldschool.ai / portal
- Document which key deploys campus vs which must never enter the repo

## Do not

- Touch CNC vault `2.24.64.248`
- Commit private keys
- Flip `AUTH_URL` or rewrite Caddy site blocks
- Block Wave 2
