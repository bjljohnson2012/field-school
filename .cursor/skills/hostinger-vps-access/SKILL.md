---
name: hostinger-vps-access
description: Fenced. Campus Hostinger VPS SSH/DNS/mail keys. Never the CNC vault 2.24.64.248. Does not block Wave 2.
---

# Hostinger VPS access

Wave: fenced. Does not block Wave 2.

Attach:

- `app/DEPLOY.md`
- `AGENTS.md`

Absorbed branches: none.

## Own

- Key path and permissions for campus VPS `2.24.70.248`
- Campus SSH key `/home/ubuntu/.ssh/vps_deploy`
- Hostinger MCP (`hostinger-vps`, `hostinger-dns`, `hostinger-email`) for inventory or DNS
- Hostinger order mailboxes and DNS for fieldschool.ai / portal — no surprise record deletes
- Document which key deploys campus vs which must never be copied into the repo

## Do not

- Touch CNC vault `2.24.64.248`
- Commit private keys
- Flip `AUTH_URL` or rewrite Caddy site blocks
- Rotate keys without leaving a working deploy path
- Block Wave 2

Prove `ssh -i /home/ubuntu/.ssh/vps_deploy root@2.24.70.248` and that the vault host is untouched.
