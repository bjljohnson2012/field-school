# M13 Payload spike report

- Date (ET): 2026-10-14
- Spike PR (draft, do not merge): https://github.com/bjljohnson2012/field-school/pull/424
- Experiment SHA: `ba36579222f54545fe9a2f31cca906f3aee25745`
- Base SHA: `933f3ce21701a3d507a69ecd673cd1d77aacea04` (`origin/main`, after `9b478c6`)
- Postgres copy source: local disposable Postgres 16. Schema loaded by `app/deploy/apply-migrations.sh` from `app/db/*.sql` into database `fs_payload_spike`. Fixture rows from `spike/payload-m13/local/seed.sql` (household `grok-bot` briefing, team org `spike-team`, three knowledge nodes, one edge, a tracked child membership with no credentials). Not a production dump. No production connection. Peer auth on a local socket. No database password in git.
- M11 on this base: merged in #415 at `78d10b933e5d0a9b8bebfd22f870eec5e16f3d75`, migration `0028`. The spike did not implement M11 and did not add an edge scope column.

Payload 3.90.2 runs as its own Next 16.3.8 process in `spike/payload-m13/` on port 4321. Campus `app/` was not given a Payload dependency. The git branch is `cursor/m13-payload-spike-cd97` because this agent must use that branch prefix. The spec name `spike/payload-m13` is the directory. Do not merge the spike.

Launch stays CLOSED 0/8. `AUTH_URL` source is unchanged. The campus dev process used `AUTH_URL=https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay false in source. No live Stripe.

## Residual verdicts

| # | Residual question | Yes / No | Evidence |
| --- | --- | --- | --- |
| 1 | Keep **Drizzle** as the long-term runtime (Yes = stay on Drizzle; No = migrate runtime to Payload) | Yes | Drizzle stays the campus runtime. Payload CRUD wrote `payload.m13_*` tables, not `public.courses`. A read of the Drizzle `courses` table failed because Payload selected `payload_probe`, a column that table does not have (`evidence/public-read.txt`). `@payloadcms/next@3.90.2` refuses campus Next 16.3.2 (`evidence/peer-next.txt`). Learners stayed on the campus app. |
| 2 | **Same Postgres instance** is acceptable when Payload goes live (Yes = same instance with separation; No = separate DB required) | Yes | Same instance, schema `payload`, prefix `m13_`: create, update, and delete succeeded, and `public.courses` kept its Drizzle columns. Sharing `public` table names is not acceptable: push onto `public.courses` errored, and creating unprefixed `payload.courses` offered to rename `payload.m13_courses`. A second database also worked (ETL below). |
| 3 | **next-auth coexistence** is viable without forcing learners through Payload login (Yes = viable path documented; No = not viable) | Yes | Campus Next 16.3.2 on port 43141 served `Field School` and `/login`. `GET /api/me` with a `payload-token` cookie returned `{"authenticated":false,"guest":true}`. Payload login set `payload-token` (HttpOnly). Campus `app/src/lib/auth/config.ts` sets no `cookies` block, so Auth.js keeps `authjs.session-token`. Operators use a second login. Learners and tracked children do not. |
| 4 | Adopt Payload **naming** for profile collections in admin without breaking Child ≠ User (Yes = mapping accepted; No = rename or skip Payload admin for parents) | Yes | Admin labels follow `EVOLUTION_COLLECTIONS`: Families, Profiles, Milestones, Media. `RECORD_COLLECTIONS` label "Student Profiles" is not used. Subject kind is "Login learner" or "Tracked child". Creating those profiles left the operator count at 1. The admin is operator-only, so parents do not see it. |

### 1. Drizzle stays

The locked decision holds, and the spike agrees with it. Campus pages still come from `app/` on Drizzle. Payload's tables are a copy with different types (`_status` is a Postgres enum in schema `payload`, text on `public.lessons`; `order` is numeric in Payload and integer in Drizzle). Putting learner traffic on Payload would mean a second schema, a Next bump from 16.3.2 to at least 16.3.3, and a different user table from `members`. None of that replaces the runtime.

### 2. Same instance, with separation

Configuration A used one database, schema `payload`, table prefix `m13_`. Local API CRUD edited a lesson block and a cited node. `public.courses` on `fs_payload_spike` still has `id, org_id, slug, title, kind, status, created_by_membership_id, created_at, updated_at, example, _status, blocks, outcome_ids`.

Creating a collection whose table name is `courses` inside schema `payload` stopped in Drizzle's push prompt: "Is payload.courses table created or renamed from another table?" The prompt offered to rename `payload.m13_courses` and the other `m13_` tables. The process was killed at 35 seconds (exit 124 in `evidence/collide.exit`). The prompt was not accepted. `schemaName` is marked experimental in `@payloadcms/db-postgres` when another schema already has the same table name. Here the dangerous offer was a rename inside schema `payload`.

Push against `public.courses` on clone `fs_payload_collide` (Payload not applied yet):

- `push: false` initialized and then `find()` failed: `select "id", "payload_probe", "updated_at", "created_at" from "courses"`.
- `push: true` failed inside drizzle-kit with `42P02 there is no parameter $1` (`evidence/public-push-true.txt`).
- `courses-after.txt` matches `courses-before.txt`. No column was added or dropped.

Configuration B used empty database `fs_payload_b`. Payload created a natural `courses` table there and an ETL step copied the fixture `grok-bot` row (`evidence/etl.json`, `targetCount` 1). `wal_level` is `replica`, so logical replication was not started. Payload's column types do not match the Drizzle table, so a subscription of `public.courses` onto Payload's `courses` is the wrong tool. ETL between the two shapes is the path that ran.

Backup story: `pg_dump` of schema `public` is the campus copy. `pg_dump` of schema `payload` is the admin copy. Restoring one schema does not have to restore the other. Do not run Payload push against `public`.

### 3. next-auth coexistence

```text
campus learner/dean                operator
Next 16.3.2 :43141                 Payload Next 16.3.8 :4321
cookie authjs.session-token        cookie payload-token
table members / memberships        table payload.m13_operators
no Payload routes                  no campus routes
```

A tracked child fixture (`kind` child, ward row, no credential row) cannot pass `loginAllowed` in `app/src/lib/tenancy/access.ts`. The hook did not insert an operator for that child. Dual login is the path for a human who is both a campus member and an operator. It is not a path for learners.

### 4. Naming

| Payload admin label | Desk copy | SQL |
| --- | --- | --- |
| Families | Household room, or team room on the `room` field | not `public` families; spike table `payload.m13_families` |
| Profiles | Login learner or tracked child | not "Student Profiles"; `payload.m13_profiles` |
| Milestones | The next thing they can do | `payload.m13_milestones` |
| Media (slug `media-files`) | Files, audio, and documents | avoids `public.media`; `payload.m13_media_files` |
| Knowledge nodes / edges | Gap loop, owner fields carry scope | `public.knowledge_nodes` / `public.knowledge_edges` stay Drizzle |

`evidence/crud.json` `naming.studentLabelPresent` is false.

## Experiment summary

| Experiment | Pass / Fail | Artifact links |
| --- | --- | --- |
| 1 Collection mapping | Pass | `spike/payload-m13/evidence/crud.json`, `evidence/m13-lessons.txt`. Admin `GET /admin` returned 200. Local API updated the briefing text block and stored `kind: quiz` with `sourceUnitId`. |
| 2 Database topology | Pass | `evidence/collide.txt`, `evidence/public-read.txt`, `evidence/public-push-true.txt`, `evidence/courses-before.txt`, `evidence/courses-after.txt`, `evidence/etl.json`, `evidence/wal-level.txt` |
| 3 next-auth coexistence | Pass | `evidence/coexistence.txt`, `evidence/auth-login.txt`. Campus `:43141` and Payload `:4321` ran at the same time. |
| 4 Hooks / traits | Pass | `src/hooks/traits.ts`. `traitsFromDrop` output matched the dry-run row. HTML in `note` was stored as empty. Subject kind `tracked-child` did not create an operator. |
| 5 Naming | Pass | Labels in `evidence/crud.json`. No "Student" label. |
| 7 Engineering smoke | Fail | `evidence/peer-next.txt`. `npm install @payloadcms/next@3.90.2` against Next 16.3.2 exits 1, `ERESOLVE`. Campus `package.json` was not changed, so `npm run typecheck` and `npm run build` in `app/` were not run with Payload installed. Spike `tsc --noEmit` passed. |

### Collection mapping mismatches

Payload can store the shapes. It does not adopt the Drizzle tables in place.

| Drizzle | Payload spike | Friction |
| --- | --- | --- |
| `lessons.blocks` jsonb, discriminator `kind` | `json` field `blocks` | Payload `blocks` would rename `kind` to `blockType`. Json keeps the union, including quiz `sourceUnitId`. |
| `lessons._status` text, plus `status` text | select `_status` stored as enum `payload.enum_m13_lessons_status` | Registry field is `_status`. The extra `status` column is not in the Payload collection. Drafts were left off so Payload would not take over `_status`. |
| `course_versions` / `lesson_versions` snapshot rows | separate collections, `versions` off | Not Payload's `_lessons_v` draft rows. |
| `knowledge_nodes.ref_table`, `ref_id` | text fields | Not a polymorphic relationship. |
| `owner_membership_id` uuid FK to `memberships` | text | Memberships stay campus logins. They are not Payload users. |
| `knowledge_nodes.embedding vector(1024)` | omitted | Admin copy does not carry the vector column. |
| `knowledge_edges` owner columns, trigger `knowledge_edges_scope_check` | `beforeChange` copies owner fields from the endpoints and throws `edge_scope_mismatch` | No `scope` column. The public trigger is not installed on `payload.m13_knowledge_edges`. |
| `lessons.course_id` ON DELETE CASCADE | Payload FK ON DELETE SET NULL | Different delete behavior. |
| `order` integer | `order` numeric | Type mismatch. |

CRUD that succeeded without hand-written SQL: course, module, lesson (edit one text block), practice (create and delete), both version collections, two nodes with `refTable: lessons`, one edge whose owner fields were overwritten from the endpoints, and a cross-room edge that threw `edge_scope_mismatch`.

## Recommendation for the sealed brief on #377

M14 stays blocked until Ben or CDM posts the sealed Evolution brief on issue 377. This report does not write that brief and does not set `base`.

What the brief should assume: runtime stays Drizzle on `public`, migrations stay idempotent SQL in `app/db`, and the implementation branch is not `cursor/m13-payload-spike-cd97`. If an operator admin is in scope, run it as a separate process with cookie `payload-token`, operator accounts only, labels Families / Profiles / Milestones / Media, and subject kind Login learner or Tracked child. Point that admin at its own database, or at schema `payload` with a table prefix, and never at `public` with Payload push. Do not mount it inside campus Next 16.3.2. Do not add an edge scope column. A `traitsFromDrop` hook may dry-run traits and must strip HTML, must not write the sealed adult profile store, and must not create a login for a tracked child. Campus next-auth stays the learner and dean session.

## Ben / CDM decisions still open

- Whether a live operator admin is wanted at all. The spike shows a separate admin can run. It does not promote it to the campus runtime.
- For that admin, separate database versus same instance with schema `payload` and a prefix. Both worked. The separate database avoids Drizzle's rename prompt. Same-schema `public` tables did not work.
- Parent-visible Payload admin. Experiments stayed operator-only.
- Whether campus Next moves from 16.3.2 to a release `@payloadcms/next@3.90.2` accepts (`>=16.3.3 <17`). This spike did not bump Next.
- The sealed brief on #377: branch, acceptance, and whether M14 adds SQL. Still unset here.
