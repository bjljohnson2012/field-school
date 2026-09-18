# Wave 3 proof — composer

2026-09-18. Branch `cursor/wave-3-composer` rebased onto reviewed live Wave 2 chrome `7618b2d`. Not onto unreviewed `700f4f9`. Preferred PR base is `main`. AUTH_URL stays `https://university.benjohnson.ai`. Guest Grok Bot still works. No Remotion plates. No second Pattern bank.

## What shipped

- `app/db/0005_composer.sql`: courses, lessons, sources, knowledge_units, quiz_items, publish_requests
- Teacher UI `/o/:slug/teach` and `/o/:slug/teach/:lessonId`
- Learner published catalog `/o/:slug/l` and `/o/:slug/l/:lessonId`
- Org home Lessons + Teach links (Teach only when `canTeach`)
- Source kinds: text, upload, book, link
- Units from supplied text only. Links are stored; text is not scraped
- Quiz items require `source_unit_id` or they do not persist
- Drafts hidden from children. Publish writes `publish_requests` and shows the lesson to the child in the same org
- Uploads at `/opt/field-school/uploads/{org_id}/` — 200MB file, 2GB org. Cross-org file GET is 403. Draft files 404 to non-teachers
- `app/deploy/deploy.sh` applies 0005 and keeps the uploads directory across deploys
- Guest composer requests 401 before `0005` DDL

## Proofs

| # | Action | Expect | Result |
|---|---|---|---|
| A | Household draft as child | hidden / teach 403 `child_cannot_teach` or Teachers only | **pass** (imported `rules.ts` + catalog filter + teach UI) |
| B | Publish household lesson | visible to child in household catalog | **pass** (published + same org) |
| C | Sales published lesson | absent from household catalog | **pass** (`org_id` scope) |
| D | Quiz without `source_unit_id` | 400 `source_unit_id_required` | **pass** |
| E | PDF / file from other org | 403 `cross_org` | **pass** |
| F | Guest Grok Bot | `/c/grok-bot` still guest; POST `/api/events` 401 | **live** on chrome tip; Wave 3 routes not deployed yet |

Live VPS publish / apply 0005 / browser walkthrough stay **pending** until four-model hotfix interrogate PASSes this SHA.

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
| H | Guest | `/c/grok-bot` | 200, no Postgres write | Wave 2 live still holds |

## Do not

- Flip AUTH_URL or 301 university
- Start plates / Remotion / Cap record
- Add a second Pattern bank
- Revive course-mcp-server, portal-course-builder, or certification workers
- Rebase onto `700f4f9` unless `/children` is the reviewed live tip
