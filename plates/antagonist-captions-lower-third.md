# Independent Antagonist v2 — CaptionsBand + LowerThird

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
hold_cleaning: false
escalate: false
rendering: stills /opt/cursor/artifacts/remotion-captions-lower-third/2026-09-19 (no Cap take; Just untouched)
```

## Craft

Reusable `LowerThird` (name / role, cream field, gold tick, Fraunces + Plex, glide 24f) and `CaptionsBand` (words at `startMs`, active gold, unspoken stone). Layer order: bed → screen → talking-head card → lower third → captions → letterbox → audio. Later sibling on top. No z-index. `Karaoke` aliases `CaptionsBand`.

Demo compositions `LowerThirdDemo` + `CaptionsDemo` (8s / 240f). Wired on `TalkingHeadCard` (`name` / `role`). LessonSpine ORDER LOCK unchanged: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

## SOFT notes only

- `VOX-S02` / `EDU-S01` — craft layers + short demos, not a new spine
- `VOX-S04` — no Ernest PNG
- `VOX-S05` — OverlayLock title at 22px can read tight at 0.5 still scale; wordSpacing 0.12em stays
- `EDU-S03` — olive fixture head, not gesturing A-roll (no Cap take)
- `EDU-S05` — band is karaoke/signaling, not a transcript dump
- `RM-H07` — no A-roll media; fixture stills only

Stills: `LowerThirdDemo-f60.png`, `CaptionsDemo-f90.png`, `TalkingHeadCard-f90.png`. Compositions: LowerThirdDemo + CaptionsDemo 240f @30 plus existing LessonSpine 1230f.

## Reaudit 2026-09-20

Full-set [antagonist-full-set.md](./antagonist-full-set.md) **PASS**. Stills `LowerThirdDemo-f60.png` / `CaptionsDemo-f90.png` under `/opt/cursor/artifacts/remotion-antagonist-full-set-reaudit/2026-09-20/`. OverlayLock now 30px (VOX-S05 22px note superseded). `hold_cleaning: true`. ORDER LOCK intact.

## Held

No Cap take. No Just. No melt. No campus Remotion package. No player rail. No Cleaning / Publish flip. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`.
