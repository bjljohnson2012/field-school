# Wave 3 proof — composer

2026-09-18. Branch `cursor/wave-3-composer` restacked onto live campus pack `62acfd0` ([children HeadersInit hotfix](https://github.com/bjljohnson2012/field-school/pull/36)). `/children` is live. AUTH_URL stays `https://portal.fieldschool.ai`. Guest Grok Bot still works. No Remotion plates. No second Pattern bank. No child User.

## What shipped

- `app/db/0005_composer.sql`: courses, lessons, sources, knowledge_units, quiz_items, publish_requests
- Teacher UI `/o/:slug/teach` and `/o/:slug/teach/:lessonId`
- Learner published catalog `/o/:slug/l` and `/o/:slug/l/:lessonId`
- Org home Lessons + Teach links (Teach only when `canTeach`). Live `/children` desk kept
- Source kinds: text, upload, book, link
- Units from supplied text only. Links are stored; text is not scraped
- Quiz items require `source_unit_id` or they do not persist
- Drafts hidden from children. Publish writes `publish_requests` and shows the lesson to the child in the same org
- Uploads at `/opt/field-school/uploads/{org_id}/` — 200MB file, 2GB org. Cross-org file GET is 403. Draft files 404 to non-teachers
- `app/deploy/deploy.sh` applies 0005 and keeps the uploads directory across deploys
- App container mounts `/opt/field-school/uploads` and runs as `nextjs` (uid 1001)
- Guest composer requests 401 before `0005` DDL

## Proofs

| # | Action | Expect | Result |
|---|---|---|---|
| A | Household draft as child | hidden / teach 403 `child_cannot_teach` or Teachers only | **pass** (imported `rules.ts` + catalog filter + teach UI) |
| B | Publish household lesson | visible to child in household catalog | **pass** (published + same org) |
| C | Sales published lesson | absent from household catalog | **pass** (`org_id` scope) |
| D | Quiz without `source_unit_id` | 400 `source_unit_id_required` | **pass** |
| E | PDF / file from other org | 403 `cross_org` | **pass** |
| F | Guest Grok Bot | `/c/grok-bot` still guest; POST `/api/events` 401 | **live** on `62acfd0` pack |

Four-model hotfix interrogate of the restacked tip is required before any deploy. Old PASS on `a175f02` does not carry. Live `/api/composer` is 404 because the `62acfd0` extract has no Wave 3 routes. Postgres still has `0005` tables. Do not fight another VPS race.

## Manual cheat sheet

| # | Actor | Action | Expect | Result |
|---|---|---|---|---|
| A | Household guardian | `POST /api/composer/lessons` text draft | 200 `status=draft` | local |
| B | Household child | `GET /api/composer/catalog` | draft absent | local |
| C | Household guardian | `POST /api/composer/publish` | 200 published | local |
| D | Household child | `GET /o/household/l/:id` | lesson body | local |
| E | Household member | sales lesson id | 404 / not in catalog | local |
| F | Teacher | quiz omit `source_unit_id` | 400 | local |
| G | Household | `GET /api/composer/files/:salesSource` | 403 | local |
| H | Guest | `/c/grok-bot` | 200, no Postgres write | live on `62acfd0` |

## Do not

- Flip AUTH_URL away from `https://portal.fieldschool.ai`
- Start plates / Remotion / Cap record
- Add a second Pattern bank
- Add a child User
- Revive course-mcp-server, portal-course-builder, or certification workers
- Deploy until four-model PASS on this restack
- Fight another VPS extract race

## 2026-09-19 four-model readiness (no deploy)

SHA `58671a3789a7270925765545d59703985c2e724b` (PR 63 on main). Suite: `cd app && node --experimental-strip-types --test scripts/wave3-composer.test.mjs` then `node scripts/wave3-four-model-readiness.mjs`.

| Gate | Result |
|---|---|
| Wave3 composer suite | **PASS** 6/6 |
| Live guest Isolation (`/api/me` guest, Grok Bot 200, events 401, composer 401, teach 401) | **PASS** |
| Four-model ship gate (independent Isolation / Item-bank / Factory / Goal) | **FAIL** — farm not spawned |
| Campus cutover | **not done** |

Dated table: [FOUR_MODEL.md](./FOUR_MODEL.md). Guest `/api/composer/*` is now 401 `sign_in_required` (18 Sep note of 404 is stale). Do not package or extract campus from this readout.

## 2026-09-19 four-model farm target (no farm run)

Coordinator-owned target only. SHA `e24b0127804cf387594ac38eb9cb6255efe98348` (PR 64 merge of `7a68b01`). Ship gate stays **FAIL**. Campus cutover **not done**. Do not spawn Isolation / Item-bank / Factory / Goal workers.
