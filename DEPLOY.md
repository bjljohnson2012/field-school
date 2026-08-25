# Deploy Field School University

Production campus: [https://university.benjohnson.ai](https://university.benjohnson.ai)

Portal hostname (`portal.fieldschool.ai`) is planned only. See [deploy/PORTAL_CUTOVER.md](PORTAL_CUTOVER.md). Do not add a university 301 from this tree.

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

OAuth secrets live at durable `/opt/field-school.env` **outside** that wipe. Compose mounts that file via `env_file`. Do not delete it. After a wipe, confirm the live compose still has `env_file: /opt/field-school.env` on the app service.

Member passwords and staff access requests live in a Docker named volume (`field-school-data` → `/app/data/campus-store.json`). That volume is **not** inside `/opt/field-school`, so the source wipe does not delete it. There is no `field-school-db` Postgres service on this compose file.

Optional notify email: set `ACCESS_REQUEST_NOTIFY_EMAIL` (defaults to the dean) and `SMTP_HOST` (plus `SMTP_USER` / `SMTP_PASS` if the relay needs auth) in `/opt/field-school.env`.

Optional shareable Jordan walk: set `DEMO_LINK_TOKEN` in `/opt/field-school.env`, then copy the full URL from `/admin/demo` (“Copy demo link”). The public path is `/demo?token=…`. Login never shows a Jordan button. If the env is unset, the campus still mints a token from `AUTH_SECRET` so staff can copy a working link. See [AUTH.md](AUTH.md).

## After it is up

Check:

- `https://university.benjohnson.ai` — kicker **Field School University**, cream/blue campus
- `/about` — company vs portal
- `/privacy` — public Privacy Policy (Google OAuth consent)
- `/terms` — public Terms of Service (Google OAuth consent)
- `/tools` — skill + intelligence live
- `/signup` — free beta join (Google, X, email + password)
- `/pricing` — display-only plans (invoice later, no checkout)
- `/admin` — demo, users, notifications, access requests, add tools
- `/admin/demo` — staff Jordan walk + Copy demo link
- `/demo?token=…` — shareable Jordan walk (token required; not linked from login)
- `/c/grok-bot` — ladder
- `/share/field-school` — normal share path

## Local

```bash
npm install
npm run dev
```

[http://127.0.0.1:43141](http://127.0.0.1:43141)
