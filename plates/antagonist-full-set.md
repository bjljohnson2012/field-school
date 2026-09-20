# Independent Antagonist v2 — Wave 5 full set

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md) (v2 Independent Antagonist section is the only in-tree bar; store `remotion-vox-antagonist-bar.md` was ingested there). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-20** reaudit after PR 70 merge `4f66e6ddda0a5d64765c7f2d40c3720dfe2ff0b6`. ORDER LOCK unchanged: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

Cites:

- [antagonist-opener-recap.md](./antagonist-opener-recap.md) — Opener + RecapCard
- [antagonist-definition-quiz-head.md](./antagonist-definition-quiz-head.md) — DefinitionBoard + QuizBumper + TalkingHeadCard
- [antagonist-lesson-spine.md](./antagonist-lesson-spine.md) — LessonSpine fixture
- [antagonist-captions-lower-third.md](./antagonist-captions-lower-third.md) — CaptionsBand + LowerThird
- [antagonist-letterbox-layer.md](./antagonist-letterbox-layer.md) — Letterbox
- [antagonist-soft-polish-vox-s05.md](./antagonist-soft-polish-vox-s05.md) — OverlayLock VOX-S05
- [antagonist-lesson-spine-letterbox-encode.md](./antagonist-lesson-spine-letterbox-encode.md) — letterbox LessonSpine encode (archived prior)
- [antagonist-typecard-vox-s04.md](./antagonist-typecard-vox-s04.md) — TypeCard factory VOX-S04
- [antagonist-lesson-spine-typecard-encode.md](./antagonist-lesson-spine-typecard-encode.md) — locked LessonSpine master (TypeCard)
- [antagonist-edu-s01-objective-slate.md](./antagonist-edu-s01-objective-slate.md) — EDU-S01 Opener / Recap objective slate
- [antagonist-lesson-spine-edu-s01-encode.md](./antagonist-lesson-spine-edu-s01-encode.md) — EDU-S01 LessonSpine encode (archived prior)
- [antagonist-lesson-spine-edu-s02-encode.md](./antagonist-lesson-spine-edu-s02-encode.md) — EDU-S02 LessonSpine encode (archived prior)
- [antagonist-lesson-spine-slate-encode.md](./antagonist-lesson-spine-slate-encode.md) — LessonSpine slate encode (archived prior)
- [antagonist-lesson-spine-typecard-objectiveslate-encode.md](./antagonist-lesson-spine-typecard-objectiveslate-encode.md) — LessonSpine TypeCard + ObjectiveSlate encode (archived prior)
- [antagonist-lesson-spine-progress-chapter-encode.md](./antagonist-lesson-spine-progress-chapter-encode.md) — LessonSpine ProgressRail + ChapterChip encode (current master)
- [antagonist-edu-s01-master.md](./antagonist-edu-s01-master.md) — EDU-S01 master dest reaudit
- [antagonist-definitionboard-edu-s02.md](./antagonist-definitionboard-edu-s02.md) — EDU-S02 DefinitionBoard keyword tick
- [antagonist-quizbumper-next-up.md](./antagonist-quizbumper-next-up.md) — QuizBumper next-up signaling
- [antagonist-edu-s02-master.md](./antagonist-edu-s02-master.md) — EDU-S02 master dest reaudit
- [antagonist-slate-master.md](./antagonist-slate-master.md) — LessonSpine slate master dest reaudit
- [antagonist-typecard-objectiveslate-master.md](./antagonist-typecard-objectiveslate-master.md) — LessonSpine typecard-objectiveslate master dest reaudit
- [antagonist-progress-chapter-master.md](./antagonist-progress-chapter-master.md) — LessonSpine progress-chapter master dest reaudit
- [antagonist-talkinghead-slate.md](./antagonist-talkinghead-slate.md) — TalkingHead slate signaling
- [antagonist-recapcard-slate.md](./antagonist-recapcard-slate.md) — RecapCard slate signaling
- [antagonist-opener-slate.md](./antagonist-opener-slate.md) — Opener slate signaling
- [antagonist-objectiveslate-slate.md](./antagonist-objectiveslate-slate.md) — ObjectiveSlate slate signaling
- [antagonist-typecard-slate.md](./antagonist-typecard-slate.md) — TypeCard slate signaling
- [antagonist-definitionboard-slate.md](./antagonist-definitionboard-slate.md) — DefinitionBoard slate signaling
- [antagonist-audio-bed-unmute.md](./antagonist-audio-bed-unmute.md) — AudioBed soft unmute craft beat
- [antagonist-progress-rail.md](./antagonist-progress-rail.md) — ProgressRail lesson position signal
- [antagonist-chapter-chip.md](./antagonist-chapter-chip.md) — ChapterChip beat label signal
- [antagonist-lower-third.md](./antagonist-lower-third.md) — LowerThird speaker / context label

```
verdict: PASS
dated: 2026-09-20
plates: {
  Opener: PASS, RecapCard: PASS, DefinitionBoard: PASS, QuizBumper: PASS,
  TalkingHeadCard: PASS, LessonSpine: PASS,
  LowerThirdDemo: PASS, CaptionsDemo: PASS, LetterboxDemo: PASS
}
gates: {
  VOX-H01: PASS, VOX-H02: PASS, VOX-H03: PASS, VOX-H04: PASS, VOX-H05: PASS,
  VOX-H06: PASS, VOX-H07: PASS, VOX-H08: PASS, VOX-H09: PASS, VOX-H10: PASS,
  VOX-S04: SOFT, VOX-S05: PASS,
  RM-H01: PASS, RM-H02: PASS, RM-H03: PASS, RM-H04: PASS, RM-H05: PASS,
  RM-H06: PASS, RM-H07: PASS, RM-H08: PASS, RM-H09: PASS, RM-H10: PASS,
  RM-H11: PASS, RM-H12: PASS,
  EDU-H01: PASS, EDU-H02: PASS, EDU-H03: PASS, EDU-H04: PASS, EDU-H05: PASS,
  EDU-H06: PASS, EDU-H07: PASS, EDU-H08: PASS, EDU-H09: PASS, EDU-H10: PASS
}
hold_cleaning: true
auto_flip: false
escalate: false
rendering: /opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4
sha256: 028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98
stills: /opt/cursor/artifacts/remotion-antagonist-full-set-reaudit/2026-09-20/
```

## Compositions (`npx remotion compositions` 2026-09-20)

| id | fps | size | frames | sec |
|---|---|---|---|---|
| Opener | 30 | 1920×1080 | 300 | 10.00 |
| RecapCard | 30 | 1920×1080 | 300 | 10.00 |
| DefinitionBoard | 30 | 1920×1080 | 180 | 6.00 |
| QuizBumper | 30 | 1920×1080 | 210 | 7.00 |
| TalkingHeadCard | 30 | 1920×1080 | 240 | 8.00 |
| LowerThirdDemo | 30 | 1920×1080 | 240 | 8.00 |
| CaptionsDemo | 30 | 1920×1080 | 240 | 8.00 |
| LetterboxDemo | 30 | 1920×1080 | 240 | 8.00 |
| LessonSpine | 30 | 1920×1080 | 1230 | 41.00 |

## Encodes (untouched where required)

| Dest | sha256 | Role |
|---|---|---|
| `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4` | `a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a` | first encode — **untouched** |
| `/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4` | `ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211` | captions/LT — **untouched** |
| `/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4` | `028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98` | letterbox + soft-polish — archived prior |
| `/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4` | `9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f` | karaoke gold — archived prior |
| `/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4` | `9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f` | AudioBed silent — archived prior |
| `/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4` | `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0` | TypeCard VOX-S04 — archived prior |
| `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` | `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` | EDU-S01 slate — archived prior |
| `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` | `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` | EDU-S02 signaling — archived prior |
| `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` | `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` | slate polish — archived prior |
| `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` | `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` | TypeCard + ObjectiveSlate — archived prior |
| `/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4` | `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7` | **current master** (ProgressRail + ChapterChip) |

Just `27pn9xs0zk8a73g` and Aug 30 `vox/everything-made-up.mp4` not written. No Cap A-roll.

Checklist on current dest: exit **0**, `verdict: PASS`, `hold_cleaning: true`, `auto_flip: false`. `--flip` refused.

## Stills (2026-09-20)

`/opt/cursor/artifacts/remotion-antagonist-full-set-reaudit/2026-09-20/`

| Comp / beat | File | Score |
|---|---|---|
| Opener 30 | `Opener-f30.png` | Takeover head-in; type left; letterbox + OverlayLock |
| Recap 144 | `RecapCard-f144.png` | Glide settled; three beats; docked head |
| Definition 30 | `DefinitionBoard-f30.png` | One claim; head docked |
| Quiz 30 | `QuizBumper-f30.png` | Prompt; `sourceUnitId` lesson-opener |
| TalkingHead 90 | `TalkingHeadCard-f90.png` | Docked not full-bleed; LT + captions |
| LowerThird 60 | `LowerThirdDemo-f60.png` | Name/role cream + gold tick |
| Captions 90 | `CaptionsDemo-f90.png` | Gold active word |
| Letterbox 60 | `LetterboxDemo-f60.png` | Ink bars 48 + gold rule |
| Spine sting 30 | `LessonSpine-sting-f30.png` | ORDER LOCK beat 1 |
| Spine slate 330 | `LessonSpine-slate-f330.png` | TalkingHead + LT + captions |
| Spine objective 570 | `LessonSpine-objective-f570.png` | DefinitionBoard |
| Spine recap 864 | `LessonSpine-recap-f864.png` | RecapCard |
| Spine next-up 1050 | `LessonSpine-nextup-f1050.png` | QuizBumper |

## SOFT notes only

- `VOX-S04` — factory TypeCard-only PASS (cream + gold rail); no Ernest PNG. See [antagonist-typecard-vox-s04.md](./antagonist-typecard-vox-s04.md). Historical gates block above keeps `VOX-S04: SOFT` as the PR 71 record.
- `VOX-S05` — OverlayLock 30px / `0.02em` / `0.2em` nowrap PASS at lock; 0.5 still downsample can look smashed
- `EDU-S03` — olive fixture head, not gesturing A-roll (no Cap take)
- Ship 1 HOLD (no Cap take). Ship 6 HOLD (Publish/HLS). Cleaning stays held.

## TypeCard VOX-S04 2026-09-20

Factory TypeCard-only **PASS**. Cream paper + gold 6px rail. No Cap / Ernest PNG. Stills `/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`. Prior dests untouched. `hold_cleaning: true`.

## TypeCard master dest reaudit 2026-09-20

Dated **2026-09-20** Independent Antagonist v2 against the locked master dest `/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4` sha256 `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0` plus TypeCard VOX-S04 plates. ffprobe: h264 1920×1080@30, 41.000s. ORDER LOCK intact. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Prior dests **untouched** (`9f89f9a9…` / `028d16e4…` / `a5d08284…` / `ec88d257…`).

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4
sha256: 27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0
stills: /opt/cursor/artifacts/remotion-antagonist-typecard-master/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  VOX-H01: PASS, VOX-H02: PASS, VOX-H03: PASS, VOX-H04: PASS, VOX-H05: PASS,
  VOX-H06: PASS, VOX-H07: PASS, VOX-H08: PASS, VOX-H09: PASS, VOX-H10: PASS,
  VOX-S04: PASS, VOX-S05: PASS,
  EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (no Cap take); `VOX-S05` OverlayLock can look smashed at 0.5 still downsample — lock crop is the pixel proof. Historical PR 71 gates block above keeps `VOX-S04: SOFT`. This dest seals factory TypeCard-only **PASS**. No new HARD gate fail. Launch stays CLOSED 0/8.

Stills from the locked master: `LessonSpine-sting-f30.png`, `LessonSpine-slate-f330.png`, `LessonSpine-objective-f570.png`, `LessonSpine-recap-f864.png`, `LessonSpine-nextup-f1050.png`. Plate stills: `/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`.

## EDU-S01 objective slate 2026-09-20

Dated **2026-09-20**. Opener sting carries Mayer pre-training “You will be able to” + `draw one idea per beat`. RecapCard returns that same objective as signaling, not a new claim. ORDER LOCK unchanged. Locked master dest `27cc5bf3…` **untouched**. Stills `/opt/cursor/artifacts/remotion-edu-s01-objective-slate/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-edu-s01-objective-slate/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture (no Cap take). Historical opener-recap note keeps `VOX-S02` / `EDU-S01` as the plate-not-spine record. This dest seals EDU-S01 **PASS**. Launch stays CLOSED 0/8.

## EDU-S01 LessonSpine encode 2026-09-20

Dated **2026-09-20**. New dated dest `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf`. Archived prior (file **untouched**). Typecard `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0` archived prior, **untouched**. Stills `/opt/cursor/artifacts/remotion-edu-s01-spine-encode/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4
sha256: cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf
stills: /opt/cursor/artifacts/remotion-edu-s01-spine-encode/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S03: SOFT
}
```

## EDU-S01 master dest reaudit 2026-09-20

Dated **2026-09-20** Independent Antagonist v2 against the locked master dest `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` plus EDU-S01 plates. After PR 86 merge `2bfafed7b332fe5eba6bc364ba7bc404faa3c912`. ffprobe: h264 1920×1080@30, 41.000s. ORDER LOCK intact. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Typecard dest **untouched** (`27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0`).

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4
sha256: cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf
stills: /opt/cursor/artifacts/remotion-antagonist-edu-s01-master/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S01` factory PASS on this dest. Launch stays CLOSED 0/8.

Stills: `LessonSpine-sting-f30.png`, `LessonSpine-slate-f330.png`, `LessonSpine-objective-f570.png`, `LessonSpine-recap-f864.png`, `LessonSpine-nextup-f1050.png`, `Opener-f30.png`, `RecapCard-f144.png`.

## EDU-S02 DefinitionBoard 2026-09-20

Dated **2026-09-20**. DefinitionBoard Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “Explanatory motion”. Karaoke already gold-ticks “motion” 900–1600ms (plate f30 / spine f570). After PR 87 merge `c2e9dad0d395eb6d3ca5a0cf7166a92c57dff109`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-definitionboard-edu-s02/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-definitionboard-edu-s02/2026-09-20/
sha256: cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S02` factory PASS on DefinitionBoard. Launch stays CLOSED 0/8.

## QuizBumper next-up 2026-09-20

Dated **2026-09-20**. QuizBumper kicker “Next up” plus Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “What did the card draw?”. Karaoke already gold-ticks “draw?” 1500–2200ms (plate f54 / spine f1074). After PR 88 merge `253a638bb5d89847b2255b42e8d02ab8859f97ed`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` sha256 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-quizbumper-next-up/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-quizbumper-next-up/2026-09-20/
sha256: cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). QuizBumper next-up factory PASS. Launch stays CLOSED 0/8.

## EDU-S02 LessonSpine encode 2026-09-20

Dated **2026-09-20**. New dated dest `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8`. Archived prior dest (file **untouched**). EDU-S01 `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` archived prior, **untouched**. PRs 85–89. Stills `/opt/cursor/artifacts/remotion-edu-s02-spine-encode/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4
sha256: eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8
stills: /opt/cursor/artifacts/remotion-edu-s02-spine-encode/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

## EDU-S02 master dest reaudit 2026-09-20

Dated **2026-09-20** Independent Antagonist v2 against the locked master dest `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` plus EDU-S01/S02 + QuizBumper plates. After PR 90 merge `b4aeb1e102143863b3390de4b60ed64a81080b62`. ffprobe: h264 1920×1080@30, 41.000s, video only. ORDER LOCK intact. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. EDU-S01 dest **untouched** (`cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf`). Typecard dest **untouched** (`27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0`).

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4
sha256: eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8
stills: /opt/cursor/artifacts/remotion-antagonist-edu-s02-master/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S01` and `EDU-S02` factory PASS on this dest. Launch stays CLOSED 0/8.

Stills: `LessonSpine-sting-f30.png`, `LessonSpine-slate-f330.png`, `LessonSpine-objective-f570.png`, `LessonSpine-recap-f864.png`, `LessonSpine-nextup-f1050.png`, `Opener-f30.png`, `RecapCard-f144.png`.

## TalkingHead slate 2026-09-20

Dated **2026-09-20**. TalkingHeadCard kicker “Slate” plus Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “Docked, not full-bleed”. Karaoke already gold-ticks “full-bleed” 1100–1800ms (plate f45 / spine f345). After PR 91 merge `73f540186ab6a444c5d69e026c69025412406a88`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-talkinghead-slate/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-talkinghead-slate/2026-09-20/
sha256: eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). TalkingHead slate factory PASS. Launch stays CLOSED 0/8.

## RecapCard slate 2026-09-20

Dated **2026-09-20**. RecapCard kicker “Recap” plus Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “What stays on the card”. ObjectiveSlate still returns `draw one idea per beat`. After PR 92 merge `b40ea28331b16d3eacb1443c08b7b90f60564a87`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-recapcard-slate/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-recapcard-slate/2026-09-20/
sha256: eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). RecapCard slate factory PASS. Launch stays CLOSED 0/8.

## Opener slate 2026-09-20

Dated **2026-09-20**. Opener kicker “Lesson” plus Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “You Can Just Do Things”. Karaoke already gold-ticks “Things” 1100–1700ms (plate f42 / spine f42). ObjectiveSlate still carries `draw one idea per beat`. After PR 93 merge `809ac5e54665959bfaa8c43cbacf79de29d52b6f`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` sha256 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-opener-slate/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-opener-slate/2026-09-20/
sha256: eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). Opener slate factory PASS. Launch stays CLOSED 0/8.

## LessonSpine typecard-objectiveslate encode 2026-09-20

Dated **2026-09-20**. New dated dest `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5`. Archived prior dest (file **untouched**). Slate `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` archived prior, **untouched**. PRs 85–98. Stills `/opt/cursor/artifacts/remotion-lesson-spine-typecard-objectiveslate-encode/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4
sha256: 3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5
stills: /opt/cursor/artifacts/remotion-lesson-spine-typecard-objectiveslate-encode/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S01` and `EDU-S02` factory PASS on this dest. Launch stays CLOSED 0/8.

Stills: `LessonSpine-sting-f42.png`, `LessonSpine-slate-f345.png`, `LessonSpine-objective-f570.png`, `LessonSpine-recap-f864.png`, `LessonSpine-nextup-f1050.png`.

## TypeCard slate 2026-09-20

Dated **2026-09-20**. TypeCard stays cream + gold 6px rail. EDU-S02 last-word gold `#C4A35A` tick (`Keyword`) on TypeCard claim copy: Opener “docked.”, TalkingHead “left.”, Recap points “beat” / “type” / “Fraunces”. After PR 97 merge `2581d9d1cdbcf0078d0013a34258daad90da2d42`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-typecard-slate/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-typecard-slate/2026-09-20/
sha256: d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). TypeCard slate factory PASS. Launch stays CLOSED 0/8.

## ObjectiveSlate slate 2026-09-20

Dated **2026-09-20**. ObjectiveSlate keeps “You will be able to” plus last-word gold `#C4A35A` tick (`Keyword`) on fixture `draw one idea per beat` (“beat”). LessonSpine objective beat stays DefinitionBoard. After PR 96 merge `c4aa0a44d82602f47d64d8b28b0bf1bf07ff2780`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-objectiveslate-slate/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-objectiveslate-slate/2026-09-20/
sha256: d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). ObjectiveSlate slate factory PASS. Launch stays CLOSED 0/8.

## LessonSpine slate encode 2026-09-20

Dated **2026-09-20**. New dated dest `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5`. Archived prior dest (file **untouched**). EDU-S02 `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8` archived prior, **untouched**. PRs 85–94. Stills `/opt/cursor/artifacts/remotion-lesson-spine-slate-encode/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4
sha256: d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5
stills: /opt/cursor/artifacts/remotion-lesson-spine-slate-encode/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S01` and `EDU-S02` factory PASS on this dest. Launch stays CLOSED 0/8.

Stills: `LessonSpine-sting-f42.png`, `LessonSpine-slate-f345.png`, `LessonSpine-objective-f570.png`, `LessonSpine-recap-f864.png`, `LessonSpine-nextup-f1050.png`.

## LessonSpine slate master dest reaudit 2026-09-20

Dated **2026-09-20** Independent Antagonist v2 against the locked master dest `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` sha256 `d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5` plus Opener/TalkingHead/RecapCard slate + EDU plates. After PR 95 merge `99b706c294f40846d247d1175ce2ed9d08fb0bae`. ffprobe: h264 1920×1080@30, 41.000s, video only. ORDER LOCK intact. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. EDU-S02 dest **untouched** (`eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8`). Locked master dest **untouched**.

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4
sha256: d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5
stills: /opt/cursor/artifacts/remotion-antagonist-slate-master/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S01` and `EDU-S02` factory PASS on this dest. Launch stays CLOSED 0/8.

Stills: `LessonSpine-sting-f30.png`, `LessonSpine-slate-f330.png`, `LessonSpine-objective-f570.png`, `LessonSpine-recap-f864.png`, `LessonSpine-nextup-f1050.png`, `Opener-f30.png`, `RecapCard-f144.png`.

## LessonSpine typecard-objectiveslate master dest reaudit 2026-09-20

Dated **2026-09-20** Independent Antagonist v2 against the locked master dest `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` plus TypeCard/ObjectiveSlate plates. After PR 99 merge `7186244f76d15f6c3fdeb4e91ed7b889ac0228fb`. ffprobe: h264 1920×1080@30, 41.000s, video only. ORDER LOCK intact. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Slate dest **untouched** (`d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5`). Locked master dest **untouched**.

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4
sha256: 3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5
stills: /opt/cursor/artifacts/remotion-antagonist-typecard-objectiveslate-master/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S01` and `EDU-S02` factory PASS on this dest. Launch stays CLOSED 0/8.

Stills: `LessonSpine-sting-f30.png`, `LessonSpine-slate-f330.png`, `LessonSpine-objective-f570.png`, `LessonSpine-recap-f864.png`, `LessonSpine-nextup-f1050.png`, `Opener-f30.png`, `RecapCard-f144.png`.

## DefinitionBoard slate 2026-09-20

Dated **2026-09-20**. DefinitionBoard kicker stays “Definition”. EDU-S02 last-word gold `#C4A35A` tick (`Keyword`) on Title “motion” plus Claim “dump.”. After PR 100 merge `f8000e0e402fe5c4f71438dc82ef8d626d663118`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-definitionboard-slate/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-definitionboard-slate/2026-09-20/
sha256: 3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). DefinitionBoard slate factory PASS. Launch stays CLOSED 0/8.

## AudioBed unmute 2026-09-20

Dated **2026-09-20**. Soft unmute of the silent fixture bed. `AUDIO_BED_MUTED=false`, `AUDIO_BED_VOLUME=0`, still `public/audio-bed-silence.wav`. Craft beat on `AudioBedDemo`. After PR 101 merge `707a2d5af7276a3a4ec5cba272053914c23680cd`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-audio-bed-unmute/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused. No Cap A-roll audio.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-audio-bed-unmute/2026-09-20/
sha256: 3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT, EDU-S04: PASS
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S04` volume 0 silent fixture. AudioBed unmute factory PASS. Launch stays CLOSED 0/8.

## ProgressRail 2026-09-20

Dated **2026-09-20**. ProgressRail soft craft beat. Five ORDER LOCK ticks (`sting` / `slate` / `objective` / `recap` / `next-up`) after letterbox, before audio. Active gold `#C4A35A`; inactive ink opacity `0.18`. Craft beat on `ProgressRailDemo`. After PR 102 merge `684a98a2dd595591bf775f1cccb04ba3de20f82d`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-progress-rail/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-progress-rail/2026-09-20/
sha256: 3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT, EDU-S04: PASS
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). ProgressRail factory PASS. Launch stays CLOSED 0/8.

## ChapterChip 2026-09-20

Dated **2026-09-20**. ChapterChip soft craft beat. Beat label signal (`Sting` / `Slate` / `Objective` / `Recap` / `Next up`) after progress, before audio. Cream chip + gold 4px left rail. Craft beat on `ChapterChipDemo`. After PR 103 merge `a0cc86d13f6b5b85004e74a6ae84251b47a9d1ae`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` sha256 `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-chapter-chip/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-chapter-chip/2026-09-20/
sha256: 3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT, EDU-S04: PASS
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). ChapterChip factory PASS. Launch stays CLOSED 0/8.

## LessonSpine progress-chapter encode 2026-09-20

Dated **2026-09-20**. New dated dest `/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4` sha256 `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7`. **Current master dest.** Typecard-objectiveslate dest `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5` archived prior, **untouched**. PRs 85–104. After PR 104 merge `0dab60b9e62ff24e093cea43d8d2ce3a31488fc5`. Stills `/opt/cursor/artifacts/remotion-lesson-spine-progress-chapter-encode/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4
sha256: a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7
stills: /opt/cursor/artifacts/remotion-lesson-spine-progress-chapter-encode/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT, EDU-S04: PASS
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S01` and `EDU-S02` factory PASS on this dest. Launch stays CLOSED 0/8.

Stills: `LessonSpine-sting-f42.png`, `LessonSpine-slate-f345.png`, `LessonSpine-objective-f570.png`, `LessonSpine-recap-f864.png`, `LessonSpine-nextup-f1050.png`.

## LessonSpine progress-chapter master dest reaudit 2026-09-20

Dated **2026-09-20** Independent Antagonist v2 against the locked master dest `/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4` sha256 `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7` plus ProgressRail/ChapterChip plates. After PR 105 merge `9052d6a8346525a854d556d31fccb70ed52c6716`. ffprobe: h264 1920×1080@30, 41.000s, video only. ORDER LOCK intact. Checklist exit 0, `hold_cleaning: true`, `--flip` refused. Typecard-objectiveslate dest **untouched** (`3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5`). Locked master dest **untouched**.

```
verdict: PASS
dated: 2026-09-20
rendering: /opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4
sha256: a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7
stills: /opt/cursor/artifacts/remotion-antagonist-progress-chapter-master/2026-09-20/
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). `EDU-S01` and `EDU-S02` factory PASS on this dest. Launch stays CLOSED 0/8.

Stills: `LessonSpine-sting-f30.png`, `LessonSpine-slate-f330.png`, `LessonSpine-objective-f570.png`, `LessonSpine-recap-f864.png`, `LessonSpine-nextup-f1050.png`, `Opener-f30.png`, `RecapCard-f144.png`, `ProgressRailDemo-f60.png`, `ChapterChipDemo-f60.png`.

## LowerThird 2026-09-20

Dated **2026-09-20**. LowerThird soft craft beat. Speaker / context label after talking-head, before captions. Speaker Fraunces title; gold uppercase context (`role` or `label`; default speaker `Teacher` when only a context label). Craft beat on `LowerThirdDemo`. After PR 106 merge `815a35c7fad81473bce0c74e09f106fe45872308`. ORDER LOCK intact. Locked master dest `/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4` sha256 `a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7` **untouched** (plate-level stills only). Stills `/opt/cursor/artifacts/remotion-lower-third/2026-09-20/`. Checklist `hold_cleaning: true`. `--flip` refused.

```
verdict: PASS
dated: 2026-09-20
stills: /opt/cursor/artifacts/remotion-lower-third/2026-09-20/
sha256: a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7
hold_cleaning: true
auto_flip: false
escalate: false
gates: {
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT, EDU-S04: PASS
}
```

SOFT notes only: `EDU-S03` olive fixture head (Cap-blocked; no Cap take). LowerThird factory PASS. Launch stays CLOSED 0/8.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. No Wave3. ORDER LOCK not revised. Launch stays CLOSED 0/8.
