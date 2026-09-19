# Deploy the Field School training portal

Production campus: [https://portal.fieldschool.ai](https://portal.fieldschool.ai)

`university.benjohnson.ai` 301s to portal. AUTH_URL is `https://portal.fieldschool.ai`. Apply that flip with [deploy/flip-auth-url.sh](deploy/flip-auth-url.sh). Do not wipe the live Next tree from a `main`-only branch.

This Next.js portal **replaces** the older TanStack container. Caddy sends `portal.fieldschool.ai` to `field-school-app:3000` on Docker network `ae-coach_default`. Keep that container name.

## Source of truth

| | |
|---|---|
| Remote | `https://origin.cursor.com/git/benjamin-johnson/tmp-9593eb749baaa7f3.git` |
| Branch | `main` |
| Company | Field School |
| Portal | Field School training portal |

Do not ship a hero or certificate that uses the old school name.

## Deploy from this tree

Do not clone `bjljohnson2012/field-school` into this workspace. This Origin repo is the campus. From here:

```bash
export VPS_SSH_KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519_hostinger}"
export VPS_HOST="${VPS_HOST:-root@2.24.70.248}"
bash deploy/deploy.sh
```

`deploy/deploy.sh` packs this source (no `node_modules`, no `.next`), **wipes** `/opt/field-school` on the VPS, extracts, and runs `docker compose up -d --build` in `deploy/`. The wipe stops leftover Vite/TanStack files (`vite.config.ts`) from breaking `next build`. Keep container name `field-school-app` so Caddy keeps serving `portal.fieldschool.ai`. The AUTH_URL + university 301 ship uses `flip-auth-url.sh` instead of this wipe.

OAuth secrets live at durable `/opt/field-school.env` **outside** that wipe. Compose mounts that file via `env_file`. Do not delete it. After a wipe, confirm the live compose still has `env_file: /opt/field-school.env` on the app service.

Member passwords, staff access requests, and public form submissions live in a Docker named volume (`field-school-data` → `/app/data/campus-store.json`). That volume is **not** inside `/opt/field-school`, so the source wipe does not delete it. There is no `field-school-db` Postgres service on this compose file.

Ship the public site with `bash deploy/deploy-site.sh`. That writes `marketing-site/` to `/var/www/fieldschool.ai` and keeps Caddy `try_files` so `/about` serves `about.html`. Staff read those forms at `/admin/forms`.

Optional notify email: set `RESEND_API_KEY` in `/opt/field-school.env` (preferred). `RESEND_FROM` defaults to `Field School <note@fieldschool.ai>`. SMTP still works as a fallback. Set `STRIPE_WEBHOOK_SECRET` there too so `/api/stripe/webhook` can grant seats after Stripe Checkout. `STRIPE_SECRET_KEY` is optional: when present, `/checkout?plan=` can mint a Checkout Session; when absent, the live Payment Links stay the path.

Optional shareable Jordan walk: set `DEMO_LINK_TOKEN` in `/opt/field-school.env`, then copy the full URL from `/admin/demo` (“Copy demo link”). The public path is `/demo?token=…`. Login never shows a Jordan button. If the env is unset, the campus still mints a token from `AUTH_SECRET` so staff can copy a working link. See [AUTH.md](AUTH.md).

## After it is up

Check:

- `https://portal.fieldschool.ai` — kicker **Field School training portal**, cream/blue campus
- `https://university.benjohnson.ai` — 301 to portal
- `/about` — training portal
- `/privacy` — public Privacy Policy (Google OAuth consent)
- `/terms` — public Terms of Service (Google OAuth consent)
- `/tools` — skill + intelligence live
- `/signup` — free beta join (Google, X, email + password)
- `/pricing` — plans. Learn with Ben enrolls via `/checkout?plan=`. Portal seats review on `/cart` then the same checkout path.
- `/admin` — demo, users, notifications, access requests, forms, add tools
- `/admin/forms` — Saturday list, topic requests, shop waitlist
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
