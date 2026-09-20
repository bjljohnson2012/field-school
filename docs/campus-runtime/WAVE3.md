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

## 2026-09-20 four-model farm (no cutover)

SHA `50b776a1b4152af606c46e9664f54f8e50d98042` (PR 73 on main). Four independent lenses spawned and ran. Old PASS on `7a68b01` does not carry. PR 65 closed SUPERSEDED, unmerged.

| Gate | Result |
|---|---|
| Isolation | **PASS** |
| Item-bank | **PASS** |
| Factory | **PASS** |
| Goal | **PASS** |
| Four-model ship gate | **PASS** — all four green |
| Campus cutover | **not done** |

Dated table: [FOUR_MODEL.md](./FOUR_MODEL.md). Guest `/api/composer/*` is 401 `sign_in_required`. Farm-time readout only. CDM sealed the campus pack separately below.

## 2026-09-20 campus pack LIVE

Separate CDM seal after four-model ship gate **PASS** on `50b776a`. Overlay of `/api/composer`, `/o/:slug/teach`, `/o/:slug/l` onto live campus Next. No `deploy.sh` wipe. `0005` skipped (`lessons` already present). Family operator-writes chrome hashes unchanged. Launch stays **CLOSED**, **0/8**.

| Item | Value |
|---|---|
| Pack | `/opt/field-school-packs/wave3-composer-campus-pack-20260920T063800Z.tar.gz` |
| sha256 | `baec863d121b67e2fdd59f097fcbfffc432af68703d679a9289c7a11bfcb7163` |
| Main tip | `5b05d33595f66b3164e4f6b8e46c2eef8be94dad` (PR 74 on main) |
| Script | `app/deploy/overlay-wave3-composer.sh` |
| Scope | composer / teach / learner catalog only |
| Four-model ship gate | **PASS** on `50b776a` (PR 74) |
| Launch | **CLOSED**, **0/8** |
| PR 65 | closed SUPERSEDED, unmerged |

### Smoke

| Check | Expect | Result |
|---|---|---|
| `GET /api/me` | 200 `{authenticated:false,guest:true}` | **pass** |
| unsigned `GET /api/composer/catalog` | 401 `sign_in_required` | **pass** |
| unsigned `GET /api/composer/lessons` | 401 `sign_in_required` | **pass** |
| unsigned `GET /api/composer/files/x` | 401 `sign_in_required` | **pass** |
| unsigned `POST /api/composer/lessons` | 401 `sign_in_required` | **pass** |
| unsigned `POST /api/composer/sources` | 401 `sign_in_required` | **pass** |
| unsigned `POST /api/composer/publish` | 401 `sign_in_required` | **pass** |
| unsigned `POST /api/composer/quiz` | 401 `sign_in_required` | **pass** |
| unsigned `GET /o/household/teach` `/l` | 401 | **pass** |
| `GET /c/grok-bot` | 200 | **pass** |
| `POST /api/events` | 401 `sign_in_required` guest | **pass** |
| `GET https://edit.fieldschool.ai/health` | 200 `fieldschool-edit` | **pass** |
| unsigned `GET`/`POST /api/plates` | 401 `sign_in_required` | **pass** |
| `plate_renders` + `lessons` | present on `campus` | **pass** |
| family-v1-home | `e352f5ad…` unchanged | **pass** |
| FAMILY_V1_SHA | `71b3245b…` unchanged | **pass** |
| AUTH_URL | `https://portal.fieldschool.ai` | **pass** |
| university | 301 to portal | **pass** |

Farm section above stays **Campus cutover | not done** as the farm-time readout.

## 2026-09-19 four-model readiness (superseded SHA)

SHA `58671a3789a7270925765545d59703985c2e724b` (PR 63 on main). Suite then readiness runner. Ship gate was **FAIL** — farm not spawned on that readout. Do not use as the standing SHA.
