---
name: guest-grok-bot
description: Wave 1 keep-alive for unsigned Grok Bot on localStorage. Use for /c/grok-bot, guest 401s, share links, or hiding the public student demo — patch only if WAVE1 proofs fail.
---

# Guest Grok Bot

Wave: 1 keep-alive (patch only if proofs fail). No new features.

Attach:

- `AGENTS.md`
- `docs/campus-runtime/WAVE1.md`
- `docs/campus-runtime/API.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`

Absorbed branches (stop using separately):

- `cursor/share-guest-material-1374`
- `cursor/hide-public-student-demo-ed6a`

## Own

- `/c/grok-bot` for signed-out users (Org 0). Guest `POST /api/events` is 401
- Guest progress stays in `localStorage`. No Postgres write
- Guest warning, share links, and campus chrome guests see
- Hide the public student demo from login; staff keep a token share link
- Knowledge pack stays hand-authored — no web scrape
- Do not inherit Grok Bot into the household catalog

## Do not

- Write guest progress to Postgres
- Invent a second Field Pattern bank or copy official personality items
- Flip `AUTH_URL` or 301 university
- Start Wave 2+ product work from this skill

Prove signed-out `/api/me` is guest and `/c/grok-bot` still plays (`WAVE1.md`).
