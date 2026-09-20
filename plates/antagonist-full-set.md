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
| `/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4` | `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0` | **current master** (TypeCard VOX-S04) |

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

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. No Wave3. ORDER LOCK not revised. Launch stays CLOSED 0/8.
