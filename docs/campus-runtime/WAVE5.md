# Wave 5 proof — Remotion plates + 0012 gate

2026-09-19. Operator Remotion in `plates/` only. No Remotion campus package. No player rail. No live Cleaning / Publish flip. No Cap take. AUTH_URL stays `https://portal.fieldschool.ai`. Family LIVE `bc-4765f2f0` not stolen. Just `27pn9xs0zk8a73g` locked.

Bar: [remotion-vox-standards.md](../remotion-vox-standards.md). Independent Antagonist v2 is the only bar.

## Order lock (CDM ACCEPT)

Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

Do not revise to a different literal list.

## Compositions (`npx remotion compositions`)

| id | fps | size | frames | sec | motion |
|---|---|---|---|---|---|
| Opener | 30 | 1920×1080 | 300 | 10.00 | takeover |
| TalkingHeadCard | 30 | 1920×1080 | 240 | 8.00 | takeover |
| DefinitionBoard | 30 | 1920×1080 | 180 | 6.00 | glide |
| RecapCard | 30 | 1920×1080 | 300 | 10.00 | glide |
| QuizBumper | 30 | 1920×1080 | 210 | 7.00 | glide |
| LessonSpine | 30 | 1920×1080 | 1230 | 41.00 | sequence above |

Constants: `GLIDE_FRAMES=24` `TAKEOVER_HOLD_FRAMES=12` `TAKEOVER_EASE_FRAMES=18`. Cream `#EFE7D6` / ink `#1A1A16` / gold `#C4A35A` / Fraunces. Seal `80×64` at `1576,24`. `useCurrentFrame` only.

## Landed on `main` (git)

| Piece | Merge / tip |
|---|---|
| VOX standards in-tree | PR 51 `0feeb94` |
| Opener + RecapCard | PR 52 `fa7ad69` |
| DefinitionBoard + QuizBumper + TalkingHeadCard | PR 53 `7ef2694` |
| Render-lock | PR 54 `7786ef8` / tip `bc7096a` |
| LessonSpine | PR 55 `48801d1` / tip `418ecb5` |
| LessonSpine encode | PR 56 `f35c77c` / tip `5722104` |
| Cleaning checklist | PR 57 `43821f3` / tip `2132cee` |
| plate_renders 0012 | PR 58 `79334ab` / tip `0695396` |

Encode dest: `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4` sha256 `a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a` (h264 1920×1080@30, 41.000s).

## Checklist gate

`plates/scripts/cleaning-checklist-lesson-spine.mjs` against that dest: exit **0**, `verdict: PASS`, `hold_cleaning: true`, `auto_flip: false`. `--flip` exit 2. Missing dest exit 1. Evidence: `plates/cleaning-checklist-lesson-spine.md`.

Ship 1 HOLD (no Cap take). Ship 6 HOLD (Publish/HLS). First live Cleaning auto-flip is a later CDM seal.

## 0012 campus apply (SQL only)

2026-09-19. Applied `app/db/0012_plate_renders.sql` on VPS `2.24.70.248` container `field-school-campus-db`, database `campus`, user `campus`. **0012 only.** No `deploy.sh` wipe. No new Next pack. `field-school-app` stayed up.

`\d plate_renders` shows org_id, membership_id, composition, dest, status default `pending`, `hold_cleaning` default true. Log: `/opt/cursor/artifacts/plate-renders-0012-apply/describe-plate-renders.log`.

Live `GET https://portal.fieldschool.ai/api/plates` is **401** `sign_in_required` after the routes-only overlay (was 404). Guest unsigned stay: `GET /api/me` 200 `{guest:true}`; `POST /api/events` 401 `{guest:true}`. `/c/grok-bot` 200. `https://edit.fieldschool.ai/health` 200.

## Plates API campus pack (routes only)

2026-09-19. Safer overlay than `deploy.sh` wipe. Script: `app/deploy/overlay-plates-api.sh`. Rebuild `field-school-app` only. `plate_renders` already present — skip migrate. Family chrome hashes unchanged (`family-v1-home` `e352f5ad…`, `FAMILY_V1_SHA` `71b3245b…`). Did not steal `bc-4765f2f0`.

| | |
|---|---|
| Pack | `/opt/field-school-packs/plates-api-campus-pack-20260919T202200Z.tar.gz` |
| sha256 | `75ab10d322ae872cfb9aea0989bf2ff243a9b65178f17aa474cca7080a4ecfcb` |
| Main merge under pack | `5abfa4ab356e65c60defb63062e5c5a1e1fca47c` (PR 59) |
| Overlay PR tip | see PR 60 |
| Guest GET/POST `/api/plates` | 401 `sign_in_required` |
| Signed teacher smoke | skipped (no safe cookie; do not steal family LIVE) |

## Held

No Remotion in Next. No player rail. No Cap take. No Just remake. No second melt. No Cleaning / Publish flip. No AUTH_URL / Stripe. No four-model Wave 3 cutover. No LAUNCH_GATE 8/8.
