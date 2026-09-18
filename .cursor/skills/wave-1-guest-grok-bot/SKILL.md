---
name: Wave 1 guest Grok Bot
description: Wave 1 guest Grok Bot — unsigned /c/grok-bot, 401 events, no scrape
---

# Wave 1 guest Grok Bot

Wave: 1 keep-alive (patch only if proofs fail).

Attach:

- `AGENTS.md`
- `docs/campus-runtime/WAVE1.md`
- `docs/campus-runtime/API.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`

Absorbed branches (stop using separately):

- `cursor/share-guest-material-1374`
- `cursor/hide-public-student-demo-ed6a`

## Own

- Unsigned `/c/grok-bot` (Org 0). Guest `POST /api/events` is 401
- Guest progress stays in `localStorage`. No Postgres write
- Guest warning, share links, hide public student demo from login
- Knowledge pack stays hand-authored — no web scrape
- Do not inherit Grok Bot into the household catalog

## Do not

- Write guest progress to Postgres
- Invent a second Field Pattern bank
- Flip `AUTH_URL` or start Wave 2+ product work from this skill

Prove signed-out `/api/me` is guest and `/c/grok-bot` still plays.
