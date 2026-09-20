# Status — 2026-09-20

Wave 1 is live. Wave 2 tenants + picker + Field Pattern is proven in [WAVE2.md](./WAVE2.md). Family v1 operator writes are LIVE on FamilyV1Home. Remotion Wave 5 plates + LessonSpine + checklist + `0012` + letterbox stack + VOX-S05 + antagonist full-set reaudit + AudioBed are in `main` and `plate_renders` is on `field-school-campus-db`. Proof: [WAVE5.md](./WAVE5.md).

2026-09-20 pre-0600 status sync. Current master LessonSpine dest is typecard-objectiveslate-encode `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5`. TypeCard VOX-S04 **PASS**. EDU-S01 encode **PASS**. EDU-S02 encode **PASS**. EDU-S02 master dest reaudit **PASS**. TalkingHead slate **PASS**. RecapCard slate **PASS**. Opener slate **PASS**. LessonSpine slate encode **PASS**. LessonSpine slate master dest reaudit **PASS**. ObjectiveSlate slate **PASS**. TypeCard slate **PASS**. LessonSpine typecard-objectiveslate encode **PASS**. LessonSpine typecard-objectiveslate master dest reaudit **PASS**. DefinitionBoard slate **PASS**. AudioBed unmute **PASS**. ProgressRail **PASS**. ChapterChip **PASS**. PR 90 merge `b4aeb1e`. PR 99 merge `7186244`. PR 100 merge `f8000e0`. PR 101 merge `707a2d5`. PR 102 merge `684a98a`. PR 103 merge `a0cc86d`. PR 91 merge `73f5401`. PR 92 merge `b40ea28`. PR 93 merge `809ac5e`. PR 94 merge `90f22b8`. PR 95 merge `99b706c`. PR 96 merge `c4aa0a4`. PR 97 merge `2581d9d`. PR 98 merge `9e29744`. PRs 85–94. Wave3 campus pack **LIVE**. Karaoke gold. Letterbox stack complete. Launch **CLOSED**, **0/8**. Archived prior slate-encode sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5`. Archived prior edu-s02-encode sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8`. Archived prior edu-s01-encode sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf`. Archived prior typecard-encode sha256 `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0`. Archived prior audiobed-encode sha256 `9f89f9a9…` (same as karaoke gold when AudioBed volume 0).

- Postgres `field-school-campus-db`, database `campus`. Do not write leftover `field-school-db`.
- Guest Grok Bot still works. `GET /api/me` guest `{ authenticated: false, guest: true }`. `POST /api/events` guest 401.
- AUTH_URL is `https://portal.fieldschool.ai`. `university.benjohnson.ai` 301s there. Do not flip AUTH_URL back.
- Factory (Cap / edit / melt) left running. Just `27pn9xs0zk8a73g` locked. `https://edit.fieldschool.ai/health` 200.

## Current

Read in this order:

1. This file
2. [WAVE5.md](./WAVE5.md)
3. [PLATE_RENDERS.md](./PLATE_RENDERS.md)
4. [../remotion-vox-standards.md](../remotion-vox-standards.md)
5. Plan SoT [../prelaunch/LAUNCH_GATE.md](../prelaunch/LAUNCH_GATE.md) — **CLOSED**, **0/8**. Stub [../prelaunch/STATUS.md](../prelaunch/STATUS.md). Hub [../staff/GRAPH.md](../staff/GRAPH.md) + clocks [../staff/ROUTINES.md](../staff/ROUTINES.md).

Gym wording is retired. Student orgs: household and sales.

## Done

- Wave 1 identity + Grok Bot station 01 events.
- Wave 2 household + sales, `/o/:slug`, picker, invites, fp-50-v1, org-scoped skills. [WAVE2.md](./WAVE2.md).
- Family v1 operator writes on FamilyV1Home (save intent version, accept path, lock next portion). Child ≠ User. No child login. Do not steal `bc-4765f2f0`.
- Wave 5 Remotion plates in `plates/` (not campus Next): Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard, LessonSpine. Order lock: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up. PR 87 merge `c2e9dad`. PR 88 merge `253a638`. PR 91 merge `73f5401`. PR 92 merge `b40ea28`. PR 93 merge `809ac5e`. PR 94 merge `90f22b8`. PR 95 merge `99b706c`. PR 96 merge `c4aa0a4`. EDU-S02 DefinitionBoard **PASS** (gold `#C4A35A` keyword tick on Title last word). QuizBumper next-up **PASS** (kicker “Next up” + gold tick on “draw?”). TalkingHead slate **PASS** (kicker “Slate” + gold tick on “full-bleed”). RecapCard slate **PASS** (kicker “Recap” + gold tick on “card”). Opener slate **PASS** (kicker “Lesson” + gold tick on “Things”). LessonSpine slate encode **PASS**. LessonSpine slate master dest reaudit **PASS**. ObjectiveSlate slate **PASS**. TypeCard slate **PASS**. LessonSpine typecard-objectiveslate encode **PASS**. LessonSpine typecard-objectiveslate master dest reaudit **PASS**. DefinitionBoard slate **PASS**. AudioBed unmute **PASS**. ProgressRail **PASS**. ChapterChip **PASS**.
- Letterbox stack complete (CaptionsBand + LowerThird + Letterbox). AudioBed silent fixture after letterbox (`AudioBedDemo`). VOX-S05 OverlayLock polish **PASS** in `plates/` (PR 66). TypeCard VOX-S04 **PASS** (PR 79 merge `482d3eb`; factory TypeCard-only, no Cap / Ernest PNG). PRs 79–84 harvested. PR 85 merged tip `a97167a`. PR 86 merge `2bfafed`. PR 87 merge `c2e9dad`. PR 88 merge `253a638`. PRs 85–89 harvested. PR 90 merge `b4aeb1e`. PR 91 merge `73f5401`. PR 92 merge `b40ea28`. PR 93 merge `809ac5e`. PR 94 merge `90f22b8`. PR 95 merge `99b706c`. PR 96 merge `c4aa0a4`. PR 97 merge `2581d9d`. PR 98 merge `9e29744`. PR 99 merge `7186244`. PR 100 merge `f8000e0`. PR 101 merge `707a2d5`. PR 102 merge `684a98a`. PR 103 merge `a0cc86d`. PRs 85–94 harvested. EDU-S01 objective slate **PASS** (Opener “You will be able to”; Recap returns the same objective). EDU-S01 master dest reaudit **PASS** (SOFT `EDU-S03` Cap-blocked). EDU-S02 LessonSpine encode **PASS**. EDU-S02 master dest reaudit **PASS**. TalkingHead slate **PASS**. RecapCard slate **PASS**. Opener slate **PASS**. LessonSpine slate encode **PASS**. LessonSpine slate master dest reaudit **PASS**. ObjectiveSlate slate **PASS**. TypeCard slate **PASS**. LessonSpine typecard-objectiveslate encode **PASS**. LessonSpine typecard-objectiveslate master dest reaudit **PASS**. DefinitionBoard slate **PASS**. AudioBed unmute **PASS**. ProgressRail **PASS**. ChapterChip **PASS**. Factory evidence only.
- Current LessonSpine letterbox encode dest sha256 `028d16e4…` (PR 70). Antagonist full-set reaudit **PASS** (SOFT only, PR 71). Karaoke gold dest sha256 `9f89f9a9…` — CaptionsBand word-level karaoke gold `#C4A35A` (`VOX-S01` PASS fixture). AudioBed LessonSpine encode dest `/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4` sha256 `9f89f9a9…` (silent bed; karaoke dest file untouched). Archived prior typecard-encode sha256 `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0`. Archived prior edu-s01-encode sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf`. Archived prior edu-s02-encode sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8`. Archived prior slate-encode sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5`. Current master dest is typecard-objectiveslate-encode sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5`. Cleaning checklist exit 0 PASS, `hold_cleaning: true`, `--flip` refused. No live Cleaning / Publish flip.
- `app/db/0012_plate_renders.sql` applied on `field-school-campus-db` / `campus` (0012 only; 0001–0011 untouched). Table `plate_renders` exists.
- Plates API campus pack (routes only) overlay on `/opt/field-school`. No `deploy.sh` wipe. Family operator-writes chrome hashes unchanged. Live guest unsigned `GET`/`POST /api/plates` is **401** `sign_in_required` (was 404). `GET /api/me` `{guest:true}`. `POST /api/events` 401. Pack: `/opt/field-school-packs/plates-api-campus-pack-20260919T202200Z.tar.gz` sha256 `75ab10d322ae872cfb9aea0989bf2ff243a9b65178f17aa474cca7080a4ecfcb`.
- Wave 3 campus pack **LIVE** (composer/teach/l overlay on `/opt/field-school`; main tip `5b05d33`; four-model farm **PASS** on `50b776a` 2026-09-20; guest `/api/composer` 401 `sign_in_required`; PR 65 closed SUPERSEDED, unmerged). Pack: `/opt/field-school-packs/wave3-composer-campus-pack-20260920T063800Z.tar.gz` sha256 `baec863d121b67e2fdd59f097fcbfffc432af68703d679a9289c7a11bfcb7163`. No `deploy.sh` wipe. Family hashes unchanged. 2026-09-20 teach live smoke: guest/unsigned composer 401; signed-path without cookie 401/405 (not 404); teacher 200 skipped (no safe cookie). Remotion-in-Next held. Launch stays **CLOSED**, **0/8**. Proof: [WAVE3.md](./WAVE3.md).

## Held (not this readout)

- Cap take / Just remake / second melt
- Live Cleaning auto-flip and Publish/Distribute (future CDM seal when ship 1 and ship 6 can go green)
- Remotion packaged into Next player / player rail UI
- AUTH_URL flip, Stripe / metering prices
- CNC vault `2.24.64.248`

## Not a launch gate

Do not invent LAUNCH_GATE 8/8 from this refresh. Plan SoT: [../prelaunch/LAUNCH_GATE.md](../prelaunch/LAUNCH_GATE.md) — **CLOSED**, **0/8**. Staff hub: [../staff/GRAPH.md](../staff/GRAPH.md). Clocks: [../staff/ROUTINES.md](../staff/ROUTINES.md). Do not invent agents.
