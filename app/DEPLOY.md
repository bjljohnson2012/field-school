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

## Coaching import

Run this on the VPS, where campus Postgres and the AE Coach database are both on the Docker network. Do not run it from a laptop. Do not put either connection string in git. `COACHING_IMPORT` is a process environment variable for this script only. Do not flip `COACHING_SHELL` or `COACHING_WRITES` from this step. Do not flip `AUTH_URL`. Do not edit Caddy.

`app/scripts/aecoach-org-map.json` ships as `[]`. The import creates one organization per source org. A later edit may add `{ "from": "<source slug>", "to": "sales" }` to attach that source org to the existing sales org. `to` may not be `household` or `field-school`. Household, sales, and `field-school` rows are not deleted. A source slug that is already `sales`, `household`, or `field-school` is stored as `{slug}-aecoach`, and `features.sourceSlug` keeps the original slug.

The script reads `DATABASE_URL` for campus and `AECOACH_DATABASE_URL` for the source database. It refuses to start unless `COACHING_IMPORT=1`. It refuses a destination database named `aecoach`. It does not spawn Prisma. The AE boot command `npx prisma db push --accept-data-loss` is hostile to any database other than `aecoach`. Do not point that command at campus.

Dry-run wraps the campus writes in a transaction and rolls back:

```bash
COACHING_IMPORT=1 node scripts/import-aecoach.mjs --dry-run
```

Stdout is counts only (`coaching.import table=… source=… dest=… skipped=…`). It does not print full emails, password hashes, invite URLs, or secrets. The import inserts `member_credentials` with `source=aecoach` when the source hash is present. It does not write or delete JSON-store passwords.

A real run uses the same command without `--dry-run`, still with `COACHING_IMPORT=1` on that process only.

## Coaching rollback

Before cutover, rollback is flag off. Imported rows can sit unread.

After cutover, before people rely on Field School for coaching, point Caddy back at the AE service, turn off the AE write-freeze, set `COACHING_WRITES=0`, and restart the AE cron sidecar. Then discard only campus rows created in Field School after the freeze that were not part of the import. Rows with a `legacy_ids` entry stay. The predicate is no `legacy_ids` row, and `created_at` after the recorded freeze instant.

Do not run the deletes unless `COACHING_ROLLBACK_CONFIRM=1` is set in that process. Print counts. `:freeze_at` is the instant `AE_WRITES_FROZEN` was turned on, stored with the operator notes for that freeze. Do not guess it.

```sql
-- COACHING_ROLLBACK_CONFIRM=1 required. Repeat for each coaching table that has created_at.
DELETE FROM work_items AS w
WHERE w.created_at > :freeze_at
  AND NOT EXISTS (
    SELECT 1 FROM legacy_ids AS l
    WHERE l.source = 'aecoach'
      AND l.table_name = 'work_items'
      AND l.new_id = w.id
  );
```

Tables in that delete: `work_items`, `coaching_notes`, `coaching_plans`, `one_on_one_preps`, `recommendations`, `reviews`, `review_answers`, `answer_sets`, `answers`, `ad_hoc_quizzes`, `quiz_schedules`, `retake_requests`, `drill_attempts`, `performance_snapshots`, `coaching_sources`, `source_mappings`, `coaching_knowledge_units`, `knowledge_repos`, `products`, `questions` that have no legacy id, `coaching_profiles` created after the freeze with no legacy id, `audit_logs` in that window with no legacy id. Do not delete `organizations`, `members`, `memberships`, `member_profiles`, `instrument_runs`, or `wards`.

`learning_events`: delete only rows with `created_at > :freeze_at`, no `raw.imported = true`, and `kind` in (`skill_override`, `monthly_review`, `drill`) or (`diagnostic` and `raw.scale = '0-100'`). Leave `watch`, `quiz`, `assignment`, and household 1–4 diagnostics. Do not revert imported `skill_states` with this delete. If a 0–100 score was written after the freeze onto a slug that has a legacy observation, restore `skill_states.score` from the latest `skill_observations` row with `raw.imported = true` for that membership and skill, and print that count too. Do not touch 1–4 desk slugs.

If Field School has been the write path long enough that discarding those rows loses real coaching notes, rollback is a forward fix. Do not "fix" campus schema drift with `prisma db push`.

## Coaching cron sidecar

`deploy/docker-compose.yml` defines service `coaching-cron` behind compose profile `coaching-cron`. The profile is off. `docker compose up` without `--profile coaching-cron` does not create that container. `deploy/deploy.sh` runs `docker compose up -d --build` with no profile, so a normal deploy does not start it. Merging this note does not enable the profile and does not set `CRON_SECRET`.

When an operator later starts it with `--profile coaching-cron`, the sidecar POSTs `http://field-school-app:3000/api/cron/coaching` once an hour. That hostname is the app container on the campus network. The request sends `Authorization: Bearer` from `CRON_SECRET`. An empty body is job `all`. The route returns 401 when the secret is missing or does not match. Do not copy the AE fail-open. Put `CRON_SECRET` in `/opt/field-school.env` only at that operator step. Do not export `COMPOSE_PROFILES`. Do not start the sidecar from this change.

## Coaching cutover checklist

Docs only. Merging does not flip production. Do not enable the compose profile. Do not set `CRON_SECRET`. Do not set `AE_WRITES_FROZEN`. Do not stop the AE sidecar from this change. Do not flip `AUTH_URL`. Do not edit live Caddy. Do not flip `COACHING_SHELL`, `COACHING_WRITES`, or `COACHING_IMPORT`. Do not run an import.

1. **Snapshot counts.** Record source and campus row counts before the freeze. A mismatch stops the cutover. Not executed here.
2. **Freeze plus AE sidecar stop.** In the same operator step, set `AE_WRITES_FROZEN=1` and stop the AE cron sidecar. Not executed here.
3. **Delta import.** After the freeze, import the delta. Counts must match the snapshot. Not executed here.
4. **Caddy.** Working assumption: `portal.benjohnson.ai` 301s to `https://portal.fieldschool.ai`. Do not flip `AUTH_URL`. Do not install `field-school/deploy/caddy.university.conf`. Do not replace the live Caddy file with the short AE repo file. Not executed here.
5. **Rollback SQL.** The deletes in [Coaching rollback](#coaching-rollback) run only when that process has `COACHING_ROLLBACK_CONFIRM=1`. `:freeze_at` is the recorded freeze instant. Not executed here.
6. **30-day retention of the `aecoach` volume.** After the AE app container is stopped, keep that volume for 30 days. Do not delete it here.
7. `/c/grok-bot` is expected to go away and is not a dependency. This PR does not delete that course.
