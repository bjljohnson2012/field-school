# Independent Antagonist v2 — LessonSpine TypeCard encode

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-20**. Factory TypeCard VOX-S04 polish on the LessonSpine encode. No Cap take. No Ernest PNG.

```
verdict: PASS
dated: 2026-09-20
gates: {
  VOX-H01: PASS, VOX-H02: PASS, VOX-H03: PASS, VOX-H04: PASS, VOX-H05: PASS,
  VOX-H06: PASS, VOX-H07: PASS, VOX-H08: PASS, VOX-H09: PASS, VOX-H10: PASS,
  VOX-S04: PASS, VOX-S05: PASS,
  RM-H01: PASS, RM-H02: PASS, RM-H03: PASS, RM-H04: PASS, RM-H05: PASS,
  RM-H06: PASS, RM-H07: PASS, RM-H08: PASS, RM-H09: PASS, RM-H10: PASS,
  RM-H11: PASS, RM-H12: PASS,
  EDU-H01: PASS, EDU-H02: PASS, EDU-H03: PASS, EDU-H04: PASS, EDU-H05: PASS,
  EDU-H06: PASS, EDU-H07: PASS, EDU-H08: PASS, EDU-H09: PASS, EDU-H10: PASS
}
hold_cleaning: true
auto_flip: false
escalate: false
rendering: /opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4
sha256: 27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0
```

ORDER LOCK: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

Every plate uses factory `TypeCard` (cream `#EFE7D6` + gold `#C4A35A` 6px left rail) + `AudioBed` (silent, volume 0) after `Letterbox` + `CaptionsBand` karaoke gold + `LowerThird` + `OverlayLock` 30px. Encode via `render-plate.mjs` exit 0. ffprobe: h264 1920×1080@30 duration 41.000s, video only. Objective beat still `LessonSpine-objective-f570.png` shows the gold rail. Checklist exit 0. Prior dest **files** untouched (`9f89f9a9…` karaoke / audiobed, `028d16e4…`, `a5d08284…`, `ec88d257…`). New dest sha256 `27cc5bf3…` is distinct. No Cap A-roll. No Just / Aug 30 overwrite.

## SOFT notes only

- `VOX-S04` — **PASS** factory TypeCard-only on the encode (cream + gold rail). No Cap / Ernest PNG.
- `VOX-S05` — OverlayLock tracking 0.02em / 0.2em nowrap
- `EDU-S03` — olive fixture head, not gesturing A-roll
- `RM-H07` — silent fixture `<Audio>`, not A-roll / VO
- Ship 1 HOLD (no Cap take). Ship 6 HOLD (Publish/HLS). Cleaning stays held.

Checklist on this dest: exit **0**, `verdict: PASS`, `hold_cleaning: true`, `auto_flip: false`. `--flip` refused (exit 2).

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
