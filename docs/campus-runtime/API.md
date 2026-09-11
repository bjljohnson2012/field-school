# Wave 1 campus API

Live page: https://portal.fieldschool.ai/docs/api  
Same origin as the campus: https://university.benjohnson.ai/docs/api  
OpenAPI: [`openapi-wave1.json`](./openapi-wave1.json)  
SQL: [`app/db/0001_wave1.sql`](../../app/db/0001_wave1.sql)  
Proof: [`WAVE1.md`](./WAVE1.md)

This is the learner plane shipped in Wave 1. It is not the factory (Cap / edit MCP). It is not the frozen TanStack schema in `migrations/0001-0003`.

## How it works

1. Guest walks Grok Bot. Progress stays in browser `localStorage`. `POST /api/events` returns 401.
2. A signed-in Auth.js member (Google, X, or email+password) is upserted into Postgres `members` and given a `memberships` row on org `field-school`.
3. Watch, quiz, and field-work saves on station 01 (`/c/grok-bot/s/briefing`) `POST /api/events`.
4. `GET /api/progress?course=grok-bot` rebuilds that membership’s station map from `learning_events`. Queries are always scoped by `org_id` + `membership_id`.
5. Org `household` exists and is empty of Field School events. Tenant A cannot read tenant B.

Auth cookies are Auth.js session cookies on the portal origin. `AUTH_URL` is still `https://university.benjohnson.ai`. Do not flip it in Wave 1.

Base URL: `https://portal.fieldschool.ai` (also served at `https://university.benjohnson.ai`).

## Seed

| slug | name | kind | isolation | group |
|---|---|---|---|---|
| `field-school` | Field School | gym | `public_catalog` | `cohort-0` |
| `household` | Household | homeschool | `strict` | `family` |

Default stance for a new membership: `learner`. Staff emails get `admin`.

## Schema

Postgres 16 + pgvector. Database `campus`. Data directory `/opt/field-school/postgres`. Container `field-school-campus-db`.

Extensions: `pgcrypto`, `vector` (embeddings unused until a later wave).

### organizations

| column | type | notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| slug | text unique | `field-school`, `household` |
| name | text | |
| kind | text | `gym`, `homeschool` |
| isolation | text | `public_catalog`, `strict` |
| created_at | timestamptz | |

### members

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| email | text unique | lowercased |
| name | text | |
| created_at | timestamptz | |

Separate from the JSON member store (`campus-store.json`) used for passwords, seats, and forms.

### memberships

| column | type | notes |
|---|---|---|
| id | uuid PK | learner identity for events |
| org_id | uuid FK organizations | |
| member_id | uuid FK members | |
| stance | text | `learner`, `admin`, later `guardian` / `teammate` / … |
| created_at | timestamptz | |
| UNIQUE | (org_id, member_id) | |

### groups / group_memberships

`groups`: id, org_id, slug, name, created_at. Unique (org_id, slug).  
`group_memberships`: (group_id, membership_id) PK.

### assignments

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK | |
| membership_id | uuid FK | |
| object_type | text | |
| object_id | text | |
| status | text | default `open` |
| raw | jsonb | |
| created_at / updated_at | timestamptz | |

Table exists in Wave 1. Station field work currently lands as `learning_events` kind `assignment`, not this table.

### learning_events (spine)

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK | isolation key |
| membership_id | uuid FK | whose progress |
| actor_membership_id | uuid FK | who wrote it (same as membership in Wave 1) |
| actor_stance | text | copied from membership |
| kind | text | `watch`, `quiz`, `assignment` |
| object_type | text | default `station` |
| object_id | text | `{course}:{station}` e.g. `grok-bot:briefing` |
| skill_ids | text[] | empty in Wave 1 |
| score | numeric | quiz score |
| raw | jsonb | answers, passed, notes, assignment checkboxes |
| created_at | timestamptz | |

Indexes: `(org_id, membership_id, created_at DESC)`, `(org_id, membership_id, object_type, object_id)`.

## Endpoints

All three are `force-dynamic`. Send Auth.js cookies for signed-in calls (`credentials: "same-origin"` from the portal, or a browser session).

### GET /api/me

Who is this browser.

Guest:

```json
{ "authenticated": false, "guest": true }
```

Signed in:

```json
{
  "authenticated": true,
  "member": { "id": "uuid", "email": "a@example.com", "name": "Ada" },
  "org": { "slug": "field-school", "isolation": "public_catalog" },
  "memberships": [
    { "id": "uuid", "stance": "learner", "org": "field-school", "isolation": "public_catalog" }
  ]
}
```

`503` `{ "authenticated": false, "error": "database_unavailable" }` if `DATABASE_URL` is missing.

### GET /api/progress?course=grok-bot

`course` defaults to `grok-bot`.

Guest:

```json
{
  "authenticated": false,
  "guest": true,
  "course": "grok-bot",
  "modules": {}
}
```

Signed in: events for **this membership only**, reduced to a station map.

```json
{
  "authenticated": true,
  "course": "grok-bot",
  "org": "field-school",
  "membershipId": "uuid",
  "modules": {
    "briefing": {
      "watched": true,
      "assignment": { "list8": true },
      "notes": "…",
      "quizScore": 4,
      "quizPassed": true,
      "passed": true
    }
  }
}
```

Reduction: events in time order. `watch` sets `watched`. `quiz` sets `quizScore` / `quizPassed` from `raw.passed`. `assignment` copies `raw.assignment` and `raw.notes`. `passed` is `watched && quizPassed` in the reducer (station UI also requires field work via `computePassed`).

### POST /api/events

Guest: `401`

```json
{ "ok": false, "error": "sign_in_required", "guest": true }
```

Signed-in body:

```json
{
  "kind": "watch",
  "course": "grok-bot",
  "station": "briefing",
  "object_type": "station",
  "object_id": "grok-bot:briefing",
  "score": 4,
  "raw": { "passed": true, "answers": { "q1": 1 } }
}
```

| field | required | notes |
|---|---|---|
| kind | yes | `watch`, `quiz`, or `assignment` |
| course | no | default `grok-bot` |
| station | no | used to build `object_id` |
| object_type | no | default `station` |
| object_id | no | default `{course}:{station}` |
| score | no | number, quiz |
| raw | no | object |

Success `200`:

```json
{ "ok": true, "id": "uuid", "org": "field-school", "membershipId": "uuid" }
```

Errors: `400` `invalid_json` / `invalid_kind`, `401` guest, `503` database down.

Station 01 posts:

- Mark clip watched → `{ kind: "watch", course, station }`
- Save field work → `{ kind: "assignment", course, station, raw: { assignment, notes } }`
- Submit quiz → `{ kind: "quiz", course, station, score, raw: { answers, passed } }`

## Isolation rules

- Every select/insert on events uses the session membership’s `org_id` and `membership_id`.
- User B’s `GET /api/progress` does not include user A’s rows.
- Guest POST never writes.
- Household org has no Field School gym events.

## Env (names only)

Set in `/opt/field-school.env`. Compose injects `DATABASE_URL`.

| name | used for |
|---|---|
| `CAMPUS_POSTGRES_PASSWORD` | campus-db + `DATABASE_URL` |
| `DATABASE_URL` | `postgres://campus:…@campus-db:5432/campus` |
| `AUTH_SECRET` / `AUTH_URL` | Auth.js. `AUTH_URL` stays university |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `AUTH_TWITTER_ID` / `AUTH_TWITTER_SECRET` | X sign-in |
| `MEMBER_STORE_PATH` | JSON member store, not Wave 1 tables |

Do not put secrets in this page or in git.

## What this is not

- Not Cap (`cap.fieldschool.ai`) or edit MCP (`edit.fieldschool.ai`).
- Not campus MCP (`mcp.fieldschool.ai` — Wave 7).
- Not wildcard hosts / `/o/:slug` (Wave 2).
- Not Better Auth / PGlite / `migrations/0001-0003`.
- Leftover container `field-school-db` is the frozen TanStack database. Do not write Wave 1 rows there.

## curl

```bash
curl -sS https://portal.fieldschool.ai/api/me
curl -sS "https://portal.fieldschool.ai/api/progress?course=grok-bot"
curl -sS -X POST https://portal.fieldschool.ai/api/events \
  -H "content-type: application/json" \
  -d '{"kind":"watch","course":"grok-bot","station":"briefing"}'
```

The POST is `401` without a session cookie. Sign in on `/login` or `/signup`, then call from the same browser.
