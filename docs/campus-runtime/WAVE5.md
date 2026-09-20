# Wave 5 proof — Remotion plates + 0012 gate

2026-09-20 overnight close-sync. 2026-09-20 pre-0600 status sync. Operator Remotion in `plates/` only. No Remotion campus package. No player rail. No live Cleaning / Publish flip. No Cap take. AUTH_URL stays `https://portal.fieldschool.ai`. Family LIVE `bc-4765f2f0` not stolen. Just `27pn9xs0zk8a73g` locked.

Current master LessonSpine dest: `/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4` sha256 `9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f` (same as karaoke gold when AudioBed volume 0). AudioBed landed. Wave3 campus pack LIVE. Karaoke gold. Letterbox stack complete.

Bar: [remotion-vox-standards.md](../remotion-vox-standards.md). Independent Antagonist v2 is the only bar.

Plan SoT: [../prelaunch/LAUNCH_GATE.md](../prelaunch/LAUNCH_GATE.md) — **CLOSED**, **0/8**. Do not invent **8/8**. Hub: [../staff/GRAPH.md](../staff/GRAPH.md) (CDM → CTO → Cursor Gate → Field School PM). Clocks: [../staff/ROUTINES.md](../staff/ROUTINES.md) (06 / 09 / 15 / 22 / 02 ET). Campus SoT: [STATUS.md](./STATUS.md).

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
| WAVE5 / STATUS refresh | PR 59 `5abfa4a` / tip `f4e2ee2` |
| plates API campus pack | PR 60 `f140353` / tip `b7c5aaf` |
| CaptionsBand + LowerThird | PR 61 `0bcb0e1` / tip `0cba86a` |
| LessonSpine captions re-encode | PR 62 `63c2d0a` / tip `0ccc4ee` |
| Letterbox | PR 63 `58671a3` / tip `280bbe5` |
| VOX-S05 OverlayLock polish | PR 66 `c021d3b` / tip `ba2b708` |
| LAUNCH_GATE CLOSED 0/8 | PR 67 `b74c8e9` / tip `2ed8bda` |
| Staff GRAPH + ROUTINES | PR 68 `50f0ea9` / tip `0498456` |
| WAVE5 overnight status | PR 69 `fb01f7c` / tip `20960af` |
| LessonSpine letterbox encode | PR 70 `4f66e6d` / tip `1b279d2` |
| Antagonist full-set reaudit | PR 71 `da967d2` / tip `579737a` |
| WAVE5 overnight close-sync | PR 72 `9957486` / tip `f1c55bf` |
| Karaoke gold | PR 73 `50b776a` / tip `1c7d0cb` |
| Four-model farm PASS | PR 74 `5b05d33` / tip `0d3335e` |
| Wave3 campus pack LIVE | PR 75 `241808b` / tip `8e992e3` |
| AudioBed layer | PR 76 `87c6ed6` / tip `9edf763` |
| AudioBed LessonSpine encode | PR 77 `8992d0b` / tip `5bd6681` |

First encode dest: `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4` sha256 `a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a` (h264 1920×1080@30, 41.000s). Captions re-encode dest: `/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4` sha256 `ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211`. Both dests **untouched**.

Letterbox LessonSpine dest: `/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4` sha256 `028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98` (h264 1920×1080@30, 41.000s). Letterbox + CaptionsBand + LowerThird + OverlayLock 30px. **Untouched** by karaoke encode.

Karaoke LessonSpine dest: `/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4` sha256 `9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f` (h264 1920×1080@30, 41.000s). Word-level karaoke gold `#C4A35A`.

## Audio bed (silent fixture)

`AudioBed` on the last stack sibling after letterbox. Silent `public/audio-bed-silence.wav`, volume 0, muted. Demo `AudioBedDemo`. Wired on every LessonSpine plate. No Cap A-roll. Karaoke gold + letterbox stack + ORDER LOCK intact. Prior encode dests **untouched** (`9f89f9a9…` / `028d16e4…` / `a5d08284…` / `ec88d257…`). Soft note: [../../plates/antagonist-audio-bed-layer.md](../../plates/antagonist-audio-bed-layer.md).

AudioBed LessonSpine encode dest: `/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4` sha256 `9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f` (h264 1920×1080@30, 41.000s, video only — silent bed). Karaoke dest **file** untouched. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Soft note: [../../plates/antagonist-lesson-spine-audiobed-encode.md](../../plates/antagonist-lesson-spine-audiobed-encode.md).

## Letterbox stack (complete)

Layer order (later sibling on top): bed → screen → talking-head card → lower third → captions → letterbox → audio.

- CaptionsBand + LowerThird on every LessonSpine plate (PR 61).
- Letterbox ink bars `LETTERBOX_H=48`, gold inner rule, close-in over `TAKEOVER_EASE_FRAMES` (PR 63).
- Stack is factory-complete in `plates/`. No Remotion-in-Next. No player rail.

## VOX-S05 soft-polish (PASS)

PR 66. `OverlayLock` 30px / `0.02em` / `0.2em` nowrap. Seal `1576,24` / `80×64`. Antagonist `plates/antagonist-soft-polish-vox-s05.md` **PASS** (VOX-S04 SOFT). Factory evidence only — not a launch Product PASS.

## VOX-S04 TypeCard (PASS)

Factory TypeCard-only PASS without Cap / Ernest PNG. `TypeCard` is cream `#EFE7D6` paper + gold `#C4A35A` 6px left rail + padding (same factory card signal as LowerThird). OverlayLock stays 30px / `0.02em` / `0.2em` nowrap. Spec `cards/` unused. Soft re-score dated 2026-09-20. Evidence: `plates/antagonist-typecard-vox-s04.md`. Stills: `/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`. Prior encode dests **untouched** (`a5d08284…` / `ec88d257…` / `028d16e4…` / `9f89f9a9…`). Checklist `hold_cleaning: true`. `--flip` refused. Historical S05 line above keeps `(VOX-S04 SOFT)` as the PR 66 record. Factory evidence only — not a launch Product PASS.

## Antagonist full-set reaudit (PASS)

PR 71. Dated 2026-09-20. Independent Antagonist v2 against Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard, LessonSpine (current letterbox encode), plus Captions/LT/Letterbox demos. **PASS.** SOFT notes only (`VOX-S04`, `EDU-S03`). No HARD_FAIL. Evidence: `plates/antagonist-full-set.md`. Stills: `/opt/cursor/artifacts/remotion-antagonist-full-set-reaudit/2026-09-20/`.

## Karaoke gold (VOX-S01 PASS)

`CaptionsBand` drives word-level karaoke via `wordClock`. Active word gold `#C4A35A` plus gold tick (`EDU-S02`). Fixture times. No WhisperX. No Cap take. CaptionsDemo + LessonSpine stills: `/opt/cursor/artifacts/remotion-captions-karaoke-gold/2026-09-20/`. Soft re-score: `plates/antagonist-captions-karaoke-gold.md` **PASS**. No new HARD_FAIL.

## Checklist gate

`plates/scripts/cleaning-checklist-lesson-spine.mjs` against the current letterbox dest: exit **0**, `verdict: PASS`, `hold_cleaning: true`, `auto_flip: false`. `--flip` exit 2. Missing dest exit 1. Evidence: `plates/cleaning-checklist-lesson-spine-letterbox-encode.md`.

Karaoke dest checklist: exit **0**, `hold_cleaning: true`. Evidence: `plates/cleaning-checklist-lesson-spine-karaoke-gold.md`.

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
| Overlay PR tip | PR 60 `ccb3f1b1bb5e932575ffc3fb53214ed2a01f4418` |
| Guest GET/POST `/api/plates` | 401 `sign_in_required` |
| Signed teacher smoke | skipped (no safe cookie; do not steal family LIVE) |

## Held

No Remotion in Next. No player rail. No Cap take. No Just remake. No second melt. No Cleaning / Publish flip. No AUTH_URL / Stripe. No Wave 3 cutover (PR 65 closed SUPERSEDED, unmerged). No LAUNCH_GATE 8/8. Launch stays **CLOSED**, **0/8**.
