# Wave 5 proof — Remotion plates + 0012 gate

2026-09-20 overnight close-sync. 2026-09-20 pre-0600 status sync. Operator Remotion in `plates/` only. No Remotion campus package. No player rail. No live Cleaning / Publish flip. No Cap take. AUTH_URL stays `https://portal.fieldschool.ai`. Family LIVE `bc-4765f2f0` not stolen. Just `27pn9xs0zk8a73g` locked.

Current master LessonSpine dest: `/opt/cursor/artifacts/lesson-spine-lower-callout-encode/2026-09-20/LessonSpine.mp4` sha256 `68b8378a47d9eb57ed4b41f35bc2bf4ed6fd01a0694fca28c0a5ea90101fee92`. LowerThird+CalloutCard encode. ProgressRail+ChapterChip encode. Archived prior progress-chapter-encode `/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4` sha256 `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7`. TypeCard+ObjectiveSlate encode. Opener+TalkingHead+RecapCard slate polish. EDU-S01 objective slate. DefinitionBoard EDU-S02. QuizBumper next-up. TypeCard VOX-S04 polish. AudioBed landed. Wave3 campus pack LIVE. Karaoke gold. Letterbox stack complete. Archived prior typecard-objectiveslate-encode `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5`. Archived prior slate-encode `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5`. Archived prior edu-s02-encode `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8`. Archived prior edu-s01-encode `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf`. Archived prior typecard-encode `/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4` sha256 `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0`. Archived prior audiobed-encode `/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4` sha256 `9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f` (same as karaoke gold when AudioBed volume 0). Karaoke dest file archived, not deleted.

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
| pre-0600 status sync | PR 78 `856b8c0` / tip `658ee36` |
| TypeCard VOX-S04 | PR 79 `482d3eb` / tip `cf4021f` |
| GRAPH Wave3 LIVE sync | PR 80 `1206457` / tip `378d588` |
| TypeCard LessonSpine encode | PR 81 `85b30cd` / tip `35569a4` |
| Wave3 teach live smoke | PR 82 `0be697c` / tip `5be8fd7` |
| Master dest TypeCard | PR 83 `e2d3cf6` / tip `96455a0` |
| TypeCard master dest reaudit | PR 84 `f3d0918` / tip `7074f21` |
| EDU-S01 objective slate | PR 85 `a97167a` / tip `1a47d48` |
| EDU-S01 LessonSpine encode | PR 86 `2bfafed` / tip `0c35205` |
| EDU-S01 master dest reaudit | PR 87 `c2e9dad` / tip `b4b96c3` |
| EDU-S02 DefinitionBoard | PR 88 `253a638` / tip `4859ca4` |
| QuizBumper next-up | PR 89 `a29231f` / tip `7da8be2` |
| EDU-S02 LessonSpine encode | PR 90 `b4aeb1e` / tip `f62e0cb` |
| EDU-S02 master dest reaudit | PR 91 `73f5401` / tip `552b2c4` |
| TalkingHead slate | PR 92 `b40ea28` / tip `2ef015c` |
| RecapCard slate | PR 93 `809ac5e` / tip `d415e42` |
| Opener slate | PR 94 `90f22b8` / tip `b073c145` |
| LessonSpine slate encode | PR 95 `99b706c` / tip `d7a05e1` |
| Slate master dest reaudit | PR 96 `c4aa0a4` / tip `78d3f55` |
| ObjectiveSlate slate | PR 97 `2581d9d` / tip `2c8ddd0` |
| TypeCard slate | PR 98 `9e29744` / tip `e897db1` |
| TypeCard+ObjectiveSlate encode | PR 99 `7186244` / tip `88b892c` |
| TypeCard+ObjectiveSlate master dest reaudit | PR 100 `f8000e0` / tip `494d520` |
| DefinitionBoard slate | PR 101 `707a2d5` / tip `6295647` |
| AudioBed unmute | PR 102 `684a98a` / tip `63882ac` |
| ProgressRail | PR 103 `a0cc86d` / tip `8d1cfed` |
| ChapterChip | PR 104 `0dab60b` / tip `c83962c` |
| ProgressRail+ChapterChip encode | PR 105 `9052d6a` / tip `5825052` |
| Progress-chapter master dest reaudit | PR 106 `815a35c` / tip `3915694` |
| LowerThird speaker/context | PR 107 `a8585c2` / tip `be42c80` |
| CalloutCard tip/aside | PR 108 `f15642f` / tip `e2b3181` |

First encode dest: `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4` sha256 `a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a` (h264 1920×1080@30, 41.000s). Captions re-encode dest: `/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4` sha256 `ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211`. Both dests **untouched**.

Letterbox LessonSpine dest: `/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4` sha256 `028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98` (h264 1920×1080@30, 41.000s). Letterbox + CaptionsBand + LowerThird + OverlayLock 30px. **Untouched** by karaoke encode.

Karaoke LessonSpine dest: `/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4` sha256 `9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f` (h264 1920×1080@30, 41.000s). Word-level karaoke gold `#C4A35A`.

## Audio bed (silent fixture)

`AudioBed` on the last stack sibling after letterbox. Silent `public/audio-bed-silence.wav`, volume 0, muted. Demo `AudioBedDemo`. Wired on every LessonSpine plate. No Cap A-roll. Karaoke gold + letterbox stack + ORDER LOCK intact. Prior encode dests **untouched** (`9f89f9a9…` / `028d16e4…` / `a5d08284…` / `ec88d257…`). Soft note: [../../plates/antagonist-audio-bed-layer.md](../../plates/antagonist-audio-bed-layer.md).

AudioBed LessonSpine encode dest: `/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4` sha256 `9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f` (h264 1920×1080@30, 41.000s, video only — silent bed). Karaoke dest **file** untouched. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Soft note: [../../plates/antagonist-lesson-spine-audiobed-encode.md](../../plates/antagonist-lesson-spine-audiobed-encode.md).

TypeCard LessonSpine encode dest: `/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4` sha256 `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0` (h264 1920×1080@30, 41.000s). TypeCard VOX-S04 polish on DefinitionBoard/objective + full stack. Prior dests **untouched**. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Soft note: [../../plates/antagonist-lesson-spine-typecard-encode.md](../../plates/antagonist-lesson-spine-typecard-encode.md). Archived prior typecard-encode (not deleted). Audiobed / karaoke dests remain archived priors (not deleted).

EDU-S01 LessonSpine encode dest: `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` (h264 1920×1080@30, 41.000s). PR 85 objective slate on sting + recap. Typecard dest **untouched**. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Soft note: [../../plates/antagonist-lesson-spine-edu-s01-encode.md](../../plates/antagonist-lesson-spine-edu-s01-encode.md). Archived prior edu-s01-encode (file **untouched**). New master dest is edu-s02-encode.

EDU-S02 LessonSpine encode dest: `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` (h264 1920×1080@30, 41.000s). PRs 85–89. EDU-S01 slate + DefinitionBoard EDU-S02 + QuizBumper next-up. EDU-S01 dest **untouched**. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Soft note: [../../plates/antagonist-lesson-spine-edu-s02-encode.md](../../plates/antagonist-lesson-spine-edu-s02-encode.md). Archived prior dest (file **untouched**).

Slate LessonSpine encode dest: `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` (h264 1920×1080@30, 41.000s). PRs 85–94. Opener+TalkingHead+RecapCard slate polish + EDU-S01/S02 + QuizBumper. EDU-S02 dest **untouched**. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Soft note: [../../plates/antagonist-lesson-spine-slate-encode.md](../../plates/antagonist-lesson-spine-slate-encode.md). Archived prior slate-encode (file **untouched**).

TypeCard+ObjectiveSlate LessonSpine encode dest: `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` (h264 1920×1080@30, 41.000s). PRs 85–98. TypeCard claim last-word ticks + ObjectiveSlate last-word “beat” + DefinitionBoard objective path. Slate dest **untouched**. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Soft note: [../../plates/antagonist-lesson-spine-typecard-objectiveslate-encode.md](../../plates/antagonist-lesson-spine-typecard-objectiveslate-encode.md). Archived prior dest (file **untouched**). PR 99 merge `7186244` / tip `88b892c` harvested. Independent Antagonist v2 reaudit **PASS.** SOFT only (`EDU-S03`). Evidence: `plates/antagonist-typecard-objectiveslate-master.md`.

ProgressRail+ChapterChip LessonSpine encode dest: `/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4` sha256 `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7` (h264 1920×1080@30, 41.000s). PRs 85–104. ProgressRail ticks + ChapterChip labels + DefinitionBoard slate + AudioBed unmute on the slate stack. Typecard-objectiveslate dest **untouched**. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Soft note: [../../plates/antagonist-lesson-spine-progress-chapter-encode.md](../../plates/antagonist-lesson-spine-progress-chapter-encode.md). Archived prior dest (file **untouched**). PR 104 merge `0dab60b` / tip `c83962c` harvested.

LowerThird+CalloutCard LessonSpine encode dest: `/opt/cursor/artifacts/lesson-spine-lower-callout-encode/2026-09-20/LessonSpine.mp4` sha256 `68b8378a47d9eb57ed4b41f35bc2bf4ed6fd01a0694fca28c0a5ea90101fee92` (h264 1920×1080@30, 41.000s). PRs 85–108. LowerThird speaker/context + CalloutCard tip/aside on the progress-chapter stack. Progress-chapter dest **untouched**. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Soft note: [../../plates/antagonist-lesson-spine-lower-callout-encode.md](../../plates/antagonist-lesson-spine-lower-callout-encode.md). **Current master dest.** PR 108 merge `f15642f` / tip `e2b3181` harvested.

## Letterbox stack (complete)

Layer order (later sibling on top): bed → screen → talking-head card → lower third → captions → letterbox → audio.

- CaptionsBand + LowerThird on every LessonSpine plate (PR 61).
- Letterbox ink bars `LETTERBOX_H=48`, gold inner rule, close-in over `TAKEOVER_EASE_FRAMES` (PR 63).
- Stack is factory-complete in `plates/`. No Remotion-in-Next. No player rail.

## VOX-S05 soft-polish (PASS)

PR 66. `OverlayLock` 30px / `0.02em` / `0.2em` nowrap. Seal `1576,24` / `80×64`. Antagonist `plates/antagonist-soft-polish-vox-s05.md` **PASS** (VOX-S04 SOFT). Factory evidence only — not a launch Product PASS.

## VOX-S04 TypeCard (PASS)

PR 79 merge `482d3eb`. Factory TypeCard-only PASS without Cap / Ernest PNG. `TypeCard` is cream `#EFE7D6` paper + gold `#C4A35A` 6px left rail + padding (same factory card signal as LowerThird). OverlayLock stays 30px / `0.02em` / `0.2em` nowrap. Spec `cards/` unused. Soft re-score dated 2026-09-20. Evidence: `plates/antagonist-typecard-vox-s04.md`. Stills: `/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`. Prior encode dests **untouched** (`a5d08284…` / `ec88d257…` / `028d16e4…` / `9f89f9a9…`). Checklist `hold_cleaning: true`. `--flip` refused. Historical S05 line above keeps `(VOX-S04 SOFT)` as the PR 66 record. Factory evidence only — not a launch Product PASS.

## Antagonist full-set reaudit (PASS)

PR 71. Dated 2026-09-20. Independent Antagonist v2 against Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard, LessonSpine (current letterbox encode), plus Captions/LT/Letterbox demos. **PASS.** SOFT notes only (`VOX-S04`, `EDU-S03`). No HARD_FAIL. Evidence: `plates/antagonist-full-set.md`. Stills: `/opt/cursor/artifacts/remotion-antagonist-full-set-reaudit/2026-09-20/`.

## TypeCard master dest reaudit (PASS)

Dated 2026-09-20. Independent Antagonist v2 against locked master dest `/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4` sha256 `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0` plus TypeCard VOX-S04 plates. **PASS.** SOFT notes only (`EDU-S03`). `VOX-S04` factory TypeCard-only PASS on this dest. `hold_cleaning: true`. `--flip` refused. Prior dests untouched. Evidence: `plates/antagonist-full-set.md` + `plates/antagonist-typecard-master.md`. Stills: `/opt/cursor/artifacts/remotion-antagonist-typecard-master/2026-09-20/`.

## EDU-S01 objective slate (PASS)

PRs 79–84 harvested. PR 85 merged tip `a97167a`. Opener sting carries Mayer pre-training “You will be able to” + `draw one idea per beat`. RecapCard returns that same objective as signaling, not a new claim. ORDER LOCK unchanged. Typecard dest sha256 `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0` archived prior (**untouched**). New master dest is edu-s01-encode. Evidence: `plates/antagonist-edu-s01-objective-slate.md` + `plates/antagonist-lesson-spine-edu-s01-encode.md`. Stills: `/opt/cursor/artifacts/remotion-edu-s01-objective-slate/2026-09-20/` + `/opt/cursor/artifacts/remotion-edu-s01-spine-encode/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS.

## EDU-S01 LessonSpine encode (PASS)

PR 86 merge `2bfafed` / tip `0c35205` (PR 85 slate `a97167a`). New dated dest `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf`. Archived prior edu-s01-encode (file **untouched**). Typecard `27cc5bf3…` archived, not overwritten. Soft re-score **PASS.** SOFT only (`EDU-S03`). Evidence: `plates/antagonist-lesson-spine-edu-s01-encode.md`. Stills: `/opt/cursor/artifacts/remotion-edu-s01-spine-encode/2026-09-20/`. `hold_cleaning: true`. `--flip` refused.

## EDU-S01 master dest reaudit (PASS)

Dated 2026-09-20. Independent Antagonist v2 against locked master dest `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` plus EDU-S01 plates. PR 86 merge `2bfafed`. PR 87 merge `c2e9dad` / tip `b4b96c3`. **PASS.** SOFT notes only (`EDU-S03` Cap-blocked). `EDU-S01` PASS on this dest. `hold_cleaning: true`. `--flip` refused. Typecard dest untouched. Evidence: `plates/antagonist-full-set.md` + `plates/antagonist-edu-s01-master.md`. Stills: `/opt/cursor/artifacts/remotion-antagonist-edu-s01-master/2026-09-20/`.

## EDU-S02 DefinitionBoard (PASS)

PR 87 merge `c2e9dad` / tip `b4b96c3` harvested. PR 88 merge `253a638` / tip `4859ca4`. DefinitionBoard Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “Explanatory motion”. Karaoke already gold-ticks “motion” 900–1600ms (plate f30 / spine f570). ORDER LOCK unchanged. Current master dest edu-s01-encode sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` **untouched** (plate-level stills only). Evidence: `plates/antagonist-definitionboard-edu-s02.md`. Stills: `/opt/cursor/artifacts/remotion-definitionboard-edu-s02/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## QuizBumper next-up (PASS)

PR 88 merge `253a638` / tip `4859ca4` harvested. PR 89 merge `a29231f` / tip `7da8be2`. QuizBumper kicker “Next up” plus Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “What did the card draw?”. Karaoke already gold-ticks “draw?” 1500–2200ms (plate f54 / spine f1074). ORDER LOCK unchanged. Current master dest edu-s01-encode sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` **untouched** (plate-level stills only). Evidence: `plates/antagonist-quizbumper-next-up.md`. Stills: `/opt/cursor/artifacts/remotion-quizbumper-next-up/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## EDU-S02 LessonSpine encode (PASS)

PRs 85–89 harvested. PR 89 merge `a29231f` / tip `7da8be2`. New dated dest `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8`. Archived prior dest (file **untouched**). EDU-S01 dest `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` archived, not overwritten. Soft re-score **PASS.** SOFT only (`EDU-S03`). Evidence: `plates/antagonist-lesson-spine-edu-s02-encode.md`. Stills: `/opt/cursor/artifacts/remotion-edu-s02-spine-encode/2026-09-20/`. `hold_cleaning: true`. `--flip` refused.

## EDU-S02 master dest reaudit (PASS)

Dated 2026-09-20. Independent Antagonist v2 against locked master dest `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` plus EDU-S01/S02 + QuizBumper plates. PR 90 merge `b4aeb1e` / tip `f62e0cb`. PR 91 merge `73f5401` / tip `552b2c4`. **PASS.** SOFT notes only (`EDU-S03` Cap-blocked). `EDU-S01` PASS. `EDU-S02` PASS. `hold_cleaning: true`. `--flip` refused. EDU-S01 dest untouched. Evidence: `plates/antagonist-full-set.md` + `plates/antagonist-edu-s02-master.md`. Stills: `/opt/cursor/artifacts/remotion-antagonist-edu-s02-master/2026-09-20/`.

## TalkingHead slate (PASS)

PR 91 merge `73f5401` / tip `552b2c4` harvested. PR 92 merge `b40ea28` / tip `2ef015c`. TalkingHeadCard kicker “Slate” plus Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “Docked, not full-bleed”. Karaoke already gold-ticks “full-bleed” 1100–1800ms (plate f45 / spine f345). ORDER LOCK unchanged. Current master dest edu-s02-encode sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` **untouched** (plate-level stills only). Evidence: `plates/antagonist-talkinghead-slate.md`. Stills: `/opt/cursor/artifacts/remotion-talkinghead-slate/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## RecapCard slate (PASS)

PR 92 merge `b40ea28` / tip `2ef015c` harvested. PR 93 merge `809ac5e` / tip `d415e42`. RecapCard kicker “Recap” plus Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “What stays on the card”. ObjectiveSlate still returns `draw one idea per beat`. ORDER LOCK unchanged. Current master dest edu-s02-encode sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` **untouched** (plate-level stills only). Evidence: `plates/antagonist-recapcard-slate.md`. Stills: `/opt/cursor/artifacts/remotion-recapcard-slate/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## Opener slate (PASS)

PR 93 merge `809ac5e` / tip `d415e42` harvested. PR 94 merge `90f22b8` / tip `b073c145`. Opener kicker “Lesson” plus Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “You Can Just Do Things”. Karaoke already gold-ticks “Things” 1100–1700ms (plate f42 / spine f42). ObjectiveSlate still carries `draw one idea per beat`. ORDER LOCK unchanged. Current master dest edu-s02-encode sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` **untouched** (plate-level stills only). Evidence: `plates/antagonist-opener-slate.md`. Stills: `/opt/cursor/artifacts/remotion-opener-slate/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## LessonSpine slate encode (PASS)

PRs 85–94 harvested. PR 94 merge `90f22b8` / tip `b073c145`. PR 95 merge `99b706c` / tip `d7a05e1`. New dated dest `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5`. Archived prior dest (file **untouched**). EDU-S02 dest `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` archived, not overwritten. Soft re-score **PASS.** SOFT only (`EDU-S03`). Evidence: `plates/antagonist-lesson-spine-slate-encode.md`. Stills: `/opt/cursor/artifacts/remotion-lesson-spine-slate-encode/2026-09-20/`. `hold_cleaning: true`. `--flip` refused.

## LessonSpine slate master dest reaudit (PASS)

Dated 2026-09-20. Independent Antagonist v2 against locked master dest `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` plus Opener/TalkingHead/RecapCard slate + EDU plates. PR 95 merge `99b706c` / tip `d7a05e1`. PR 96 merge `c4aa0a4` / tip `78d3f55`. **PASS.** SOFT notes only (`EDU-S03` Cap-blocked). `EDU-S01` PASS. `EDU-S02` PASS. `hold_cleaning: true`. `--flip` refused. EDU-S02 dest untouched. Evidence: `plates/antagonist-full-set.md` + `plates/antagonist-slate-master.md`. Stills: `/opt/cursor/artifacts/remotion-antagonist-slate-master/2026-09-20/`.

## ObjectiveSlate slate (PASS)

PR 96 merge `c4aa0a4` / tip `78d3f55` harvested. ObjectiveSlate keeps “You will be able to” plus Title-style last-word gold `#C4A35A` tick (`Keyword`) on fixture `draw one idea per beat` (“beat”). LessonSpine objective beat stays DefinitionBoard. ORDER LOCK unchanged. Current master dest slate-encode sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` **untouched** (plate-level stills only). Evidence: `plates/antagonist-objectiveslate-slate.md`. Stills: `/opt/cursor/artifacts/remotion-objectiveslate-slate/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## TypeCard slate (PASS)

PR 97 merge `2581d9d` / tip `2c8ddd0` harvested. TypeCard stays cream + gold 6px rail. EDU-S02 last-word gold `#C4A35A` tick (`Keyword`) now on TypeCard claim copy: Opener “docked.”, TalkingHead “left.”, Recap points “beat” / “type” / “Fraunces”. ORDER LOCK unchanged. Current master dest slate-encode sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` **untouched** (plate-level stills only). Evidence: `plates/antagonist-typecard-slate.md`. Stills: `/opt/cursor/artifacts/remotion-typecard-slate/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## LessonSpine typecard-objectiveslate encode (PASS)

PRs 85–98 harvested. PR 98 merge `9e29744` / tip `e897db1`. New dated dest `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5`. Archived prior dest (file **untouched**). Slate dest `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` archived, not overwritten. Soft re-score **PASS.** SOFT only (`EDU-S03`). Evidence: `plates/antagonist-lesson-spine-typecard-objectiveslate-encode.md`. Stills: `/opt/cursor/artifacts/remotion-lesson-spine-typecard-objectiveslate-encode/2026-09-20/`. `hold_cleaning: true`. `--flip` refused.

## LessonSpine typecard-objectiveslate master dest reaudit (PASS)

Dated 2026-09-20. Independent Antagonist v2 against locked master dest `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` plus TypeCard/ObjectiveSlate plates. PR 99 merge `7186244` / tip `88b892c`. PR 100 merge `f8000e0` / tip `494d520`. **PASS.** SOFT notes only (`EDU-S03` Cap-blocked). `EDU-S01` PASS. `EDU-S02` PASS. `hold_cleaning: true`. `--flip` refused. Slate dest untouched. Evidence: `plates/antagonist-full-set.md` + `plates/antagonist-typecard-objectiveslate-master.md`. Stills: `/opt/cursor/artifacts/remotion-antagonist-typecard-objectiveslate-master/2026-09-20/`.

## DefinitionBoard slate (PASS)

PR 100 merge `f8000e0` / tip `494d520` harvested. DefinitionBoard kicker stays “Definition”. EDU-S02 last-word gold `#C4A35A` tick (`Keyword`) now on Claim last word (“dump.”) plus Title last word (“motion”). Karaoke already gold-ticks “motion” 900–1600ms (plate f30 / spine f570). ORDER LOCK unchanged. Current master dest typecard-objectiveslate-encode sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` **untouched** (plate-level stills only). Evidence: `plates/antagonist-definitionboard-slate.md`. Stills: `/opt/cursor/artifacts/remotion-definitionboard-slate/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## AudioBed unmute (PASS)

PR 101 merge `707a2d5` / tip `6295647` harvested. Soft unmute of the silent fixture bed: `AUDIO_BED_MUTED=false`, `AUDIO_BED_VOLUME=0`, still `public/audio-bed-silence.wav`. Craft beat on `AudioBedDemo`. No Cap take. No real Cap A-roll audio. ORDER LOCK unchanged. Current master dest typecard-objectiveslate-encode sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` **untouched** (plate-level stills only). Evidence: `plates/antagonist-audio-bed-unmute.md`. Stills: `/opt/cursor/artifacts/remotion-audio-bed-unmute/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked. `EDU-S04` volume 0.

## ProgressRail (PASS)

PR 102 merge `684a98a` / tip `63882ac` harvested. ProgressRail soft craft beat: five ORDER LOCK ticks (`sting` / `slate` / `objective` / `recap` / `next-up`) after letterbox, before audio. Active gold `#C4A35A`; inactive ink opacity `0.18`. Craft beat on `ProgressRailDemo`. Wired on the five spine plates only. No Cap take. ORDER LOCK unchanged. Current master dest typecard-objectiveslate-encode sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` **untouched** (plate-level stills only). Evidence: `plates/antagonist-progress-rail.md`. Stills: `/opt/cursor/artifacts/remotion-progress-rail/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## ChapterChip (PASS)

PR 103 merge `a0cc86d` / tip `8d1cfed` harvested. ChapterChip soft craft beat: beat label signal (`Sting` / `Slate` / `Objective` / `Recap` / `Next up`) after progress, before audio. Cream chip + gold 4px left rail. Craft beat on `ChapterChipDemo`. Wired on the five spine plates only. No Cap take. ORDER LOCK unchanged. Current master dest typecard-objectiveslate-encode sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` **untouched** (plate-level stills only). Evidence: `plates/antagonist-chapter-chip.md`. Stills: `/opt/cursor/artifacts/remotion-chapter-chip/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## LessonSpine progress-chapter encode (PASS)

PRs 85–104 harvested. PR 104 merge `0dab60b` / tip `c83962c`. New dated dest `/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4` sha256 `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7`. Archived prior dest (file **untouched**). Typecard-objectiveslate dest `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` archived, not overwritten. Soft re-score **PASS.** SOFT only (`EDU-S03`). Evidence: `plates/antagonist-lesson-spine-progress-chapter-encode.md`. Stills: `/opt/cursor/artifacts/remotion-lesson-spine-progress-chapter-encode/2026-09-20/`. `hold_cleaning: true`. `--flip` refused.

## LessonSpine progress-chapter master dest reaudit (PASS)

Dated 2026-09-20. Independent Antagonist v2 against locked master dest `/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4` sha256 `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7` plus ProgressRail/ChapterChip plates. PR 105 merge `9052d6a` / tip `5825052`. **PASS.** SOFT notes only (`EDU-S03` Cap-blocked). `EDU-S01` PASS. `EDU-S02` PASS. `hold_cleaning: true`. `--flip` refused. Typecard-objectiveslate dest untouched. Evidence: `plates/antagonist-full-set.md` + `plates/antagonist-progress-chapter-master.md`. Stills: `/opt/cursor/artifacts/remotion-antagonist-progress-chapter-master/2026-09-20/`.

## LowerThird (PASS)

PR 106 merge `815a35c` / tip `3915694` harvested. LowerThird soft craft beat: speaker / context label after talking-head, before captions. Speaker Fraunces title; gold uppercase context (`role` or `label`; default speaker `Teacher` when only a context label). Craft beat on `LowerThirdDemo`. Wired on the five spine plates in the existing `lower third` layer. No Cap take. ORDER LOCK unchanged. Current master dest progress-chapter-encode sha256 `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7` **untouched** (plate-level stills only). Evidence: `plates/antagonist-lower-third.md`. Stills: `/opt/cursor/artifacts/remotion-lower-third/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## CalloutCard (PASS)

PR 107 merge `a8585c` / tip `be42c80` harvested. CalloutCard soft craft beat: tip / aside signal after chapter, before audio. Cream card + gold 4px left rail. `Tip` / `Aside` kickers on the five ORDER LOCK beats. Craft beat on `CalloutCardDemo`. Wired on the five spine plates only. No Cap take. ORDER LOCK unchanged. Current master dest progress-chapter-encode sha256 `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7` **untouched** (plate-level stills only). Evidence: `plates/antagonist-callout-card.md`. Stills: `/opt/cursor/artifacts/remotion-callout-card/2026-09-20/`. `hold_cleaning: true`. `--flip` refused. Factory evidence only — not a launch Product PASS. `EDU-S03` Cap-blocked.

## LessonSpine lower-callout encode (PASS)

PRs 85–108 harvested. PR 108 merge `f15642f` / tip `e2b3181`. New dated dest `/opt/cursor/artifacts/lesson-spine-lower-callout-encode/2026-09-20/LessonSpine.mp4` sha256 `68b8378a47d9eb57ed4b41f35bc2bf4ed6fd01a0694fca28c0a5ea90101fee92`. **Current master dest.** Progress-chapter dest `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7` archived, not overwritten. Soft re-score **PASS.** SOFT only (`EDU-S03`). Evidence: `plates/antagonist-lesson-spine-lower-callout-encode.md`. Stills: `/opt/cursor/artifacts/remotion-lesson-spine-lower-callout-encode/2026-09-20/`. `hold_cleaning: true`. `--flip` refused.

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
