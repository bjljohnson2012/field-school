# Independent Antagonist v2 — LessonSpine letterbox + soft-polish encode

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

```
verdict: PASS
gates: {
  VOX-H01: PASS, VOX-H02: PASS, VOX-H03: PASS, VOX-H04: PASS, VOX-H05: PASS,
  VOX-H06: PASS, VOX-H07: PASS, VOX-H08: PASS, VOX-H09: PASS, VOX-H10: PASS,
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
```

ORDER LOCK: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

Slate uses `LowerThird` name/role + `CaptionsBand` (via `Karaoke`) + `Letterbox` + `OverlayLock` 30px. Encode via `render-plate.mjs` exit 0. ffprobe: h264 1920×1080@30 duration 41.000s. Checklist exit 0. Prior dests untouched (`a5d08284…`, `ec88d257…`). No Cap A-roll. No Just / Aug 30 overwrite.

## SOFT notes only

- `VOX-S04` — factory TypeCard-only PASS (cream + gold rail); no Ernest PNG. See [antagonist-typecard-vox-s04.md](./antagonist-typecard-vox-s04.md)
- `VOX-S05` — OverlayLock tracking 0.02em / 0.2em nowrap (full-res lock crop is the smash proof)
- `EDU-S03` — olive fixture head, not gesturing A-roll
- Ship 1 HOLD (no Cap take). Ship 6 HOLD (Publish/HLS). Cleaning stays held.

## Reaudit 2026-09-20

Full-set [antagonist-full-set.md](./antagonist-full-set.md) **PASS**. Dest sha256 `028d16e4…` confirmed. Prior `a5d08284…` / `ec88d257…` confirmed untouched. `hold_cleaning: true`. ORDER LOCK intact.

## TypeCard VOX-S04 2026-09-20

Factory TypeCard-only **PASS**. Cream paper + gold 6px rail. No Cap / Ernest PNG. Stills `/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`. Prior dests untouched. `hold_cleaning: true`.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`.
