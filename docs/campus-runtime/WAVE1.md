# Wave 1 proof — 2026-09-11

Identity plane on the live Next campus. GitHub TanStack `src/` was not deployed.

How it works (schema + endpoints): [API.md](./API.md). Live page: https://portal.fieldschool.ai/docs/api. OpenAPI: [openapi-wave1.json](./openapi-wave1.json).

## Where it lives

| Piece | Value |
|---|---|
| App source | `/opt/field-school` on VPS `2.24.70.248` (also `app/` in this repo) |
| Postgres | `field-school-campus-db` (`pgvector/pgvector:pg16`), data `/opt/field-school/postgres` |
| Database | `campus` / user `campus` |
| Env | `/opt/field-school.env` — `CAMPUS_POSTGRES_PASSWORD`, `DATABASE_URL` injected by compose |
| Leftover | `field-school-db` (TanStack `postgres:16-alpine`, schema 0001–0003) left running, unused |
| AUTH_URL | still `university.benjohnson.ai` (not flipped) |

## Seed slugs

- `field-school` — Org 0 gym, `public_catalog`
- `household` — homeschool, `strict`

Tables: `organizations`, `members`, `memberships`, `groups`, `group_memberships`, `assignments`, `learning_events`.

## APIs

- `GET /api/me` — guest `{ authenticated: false, guest: true }`; signed-in member + org `field-school`
- `GET /api/progress?course=grok-bot` — guest empty modules; signed-in rows for that membership only
- `POST /api/events` — 401 for guest; authenticated watch/quiz/assignment writes `learning_events`

Grok Bot station 01 (`/c/grok-bot/s/briefing`) posts watch/quiz/assignment when Auth.js has an email. Guest still uses localStorage.

## Deploy (Next tree only)

```bash
cd app
VPS_SSH_KEY=$HOME/.ssh/field-school-agent bash deploy/deploy.sh
```

Refuses to run if `vite.config.ts` or `src/routes` are present (TanStack). Wipe keeps `/opt/field-school/postgres`. Schema apply: `db/0001_wave1.sql`.

## Proof results

| Check | Result |
|---|---|
| Seed orgs | `field-school,household` |
| User A watch+quiz in Postgres | 2 rows for `grok-bot:briefing` |
| User A after re-query (survives refresh) | still 2 rows |
| User B same object | 0 rows |
| Household org events | 0 |
| Guest `GET /api/me` | `{"authenticated":false,"guest":true}` |
| Guest `GET /api/progress?course=grok-bot` | `modules: {}` |
| Guest `POST /api/events` | `401` `sign_in_required` |
| `/c/grok-bot` and `/c/grok-bot/s/briefing` | 200 |
| `cap.fieldschool.ai/login` | 200 |
| `edit.fieldschool.ai/` | 404 JSON (edit MCP process up; GET / is not a route) |
| AUTH_URL | `university.benjohnson.ai` |

## Commands used

```bash
# schema (deploy.sh)
docker exec -i field-school-campus-db psql -U campus -d campus < /opt/field-school/db/0001_wave1.sql

# isolation
# insert members wave1.a@example.com / wave1.b@example.com into org field-school
# insert watch+quiz events for A on grok-bot:briefing
# count A=2, B=0, household=0
```

Wave 1 closed. Do not start Wave 2 until asked.
