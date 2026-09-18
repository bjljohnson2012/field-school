---
name: hostinger-vps-access
description: Maintain Hostinger VPS SSH keys and mailbox access for Field School campus hosts. Use for key paths, Hostinger VPS/DNS/email MCP, or deploy SSH — never the CNC vault.
---
# Hostinger VPS access

Use Hostinger MCP (`hostinger-vps`, `hostinger-dns`, `hostinger-email`) when the task is inventory or DNS. Campus SSH key is `/home/ubuntu/.ssh/vps_deploy`.

## Own

- Key path and permissions for campus VPS `2.24.70.248`
- Hostinger order mailboxes and DNS for fieldschool.ai / portal — no surprise record deletes
- Document which key deploys campus vs which must never be copied into the repo

## Do not

- Touch CNC vault `2.24.64.248`
- Commit private keys
- Flip `AUTH_URL` or rewrite Caddy site blocks
- Rotate keys without leaving a working deploy path

Prove `ssh -i /home/ubuntu/.ssh/vps_deploy root@2.24.70.248` and that vault host is untouched.
