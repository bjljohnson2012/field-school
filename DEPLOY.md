# Deploy Field School University

Production campus: [https://university.benjohnson.ai](https://university.benjohnson.ai)

This Next.js portal **replaces** the older TanStack “Johnson Field School University” container. Caddy on the VPS already sends `university.benjohnson.ai` to `field-school-app:3000` on Docker network `ae-coach_default`. Keep that container name.

## Source of truth

| | |
|---|---|
| Remote | `https://origin.cursor.com/git/benjamin-johnson/tmp-9593eb749baaa7f3.git` |
| Branch | `main` |
| Company | Field School |
| Portal | Field School University |

Do not ship a hero or certificate that says “Johnson Field School University”.

## Deploy from this tree

Do not clone `bjljohnson2012/field-school` into this workspace. This Origin repo is the campus. From here:

```bash
export VPS_SSH_KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519_hostinger}"
export VPS_HOST="${VPS_HOST:-root@2.24.70.248}"
bash deploy/deploy.sh
```

`deploy/deploy.sh` packs this source (no `node_modules`, no `.next`), **wipes** `/opt/field-school` on the VPS, extracts, and runs `docker compose up -d --build` in `deploy/`. The wipe stops leftover Vite/TanStack files (`vite.config.ts`) from breaking `next build`. Keep container name `field-school-app` so Caddy keeps serving `university.benjohnson.ai`.

## After it is up

Check:

- `https://university.benjohnson.ai` — kicker **Field School University**, cream/blue campus
- `/about` — company vs portal
- `/privacy` — public Privacy Policy (Google OAuth consent)
- `/terms` — public Terms of Service (Google OAuth consent)
- `/tools` — skill + intelligence live
- `/admin` — demo, users, notifications, add tools
- `/c/grok-bot` — ladder
- `/share/field-school` — normal share path

## Local

```bash
npm install
npm run dev
```

[http://127.0.0.1:43141](http://127.0.0.1:43141)
