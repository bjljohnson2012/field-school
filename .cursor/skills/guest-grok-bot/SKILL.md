---
name: guest-grok-bot
description: Keep the unsigned Grok Bot station working on localStorage with no Postgres write. Use for /c/grok-bot, guest 401s, or Org 0 catalog isolation.
---
# Guest Grok Bot

## Own

- `/c/grok-bot` for signed-out users (Org 0). Guest POST `/api/events` is 401
- Do not inherit Grok Bot into household catalog
- Guest warning, share links, and campus chrome that guests see
- Knowledge pack stays hand-authored — no web scrape

## Do not

- Write guest progress to Postgres
- Copy official personality item banks into the bot
- Flip `AUTH_URL` or force guests onto `field-school` membership
- Start Remotion or adaptive generation

Prove signed-out `/api/me` is guest and `/c/grok-bot` still plays.
