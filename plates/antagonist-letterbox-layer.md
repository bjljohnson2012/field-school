# Independent Antagonist v2 — Letterbox

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
rendering: stills /opt/cursor/artifacts/remotion-letterbox-layer/2026-09-19 (no Cap take; Just untouched)
```

## Craft

Reusable `Letterbox` — ink `#1A1A16` bars `LETTERBOX_H=48`, gold `#C4A35A` inner rule, close-in over `TAKEOVER_EASE_FRAMES` (18) via `useCurrentFrame` + `interpolate`. Later sibling on top. No z-index. Lower third and captions lift above the bar (`LETTERBOX_H + 16` / `+ 140`) so type is not cropped. OverlayLock stays after the Stack (seal lock `1576,24`).

Layer order: bed → screen → talking-head card → lower third → captions → letterbox → audio.

Demo composition `LetterboxDemo` (8s / 240f). Wired on every spine plate. LessonSpine ORDER LOCK unchanged: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

## SOFT notes only

- `VOX-S02` / `EDU-S01` — craft layer + short demo, not a new spine
- `VOX-S04` — factory TypeCard-only PASS (cream + gold rail); no Ernest PNG. See [antagonist-typecard-vox-s04.md](./antagonist-typecard-vox-s04.md)
- `VOX-S05` — OverlayLock title at 22px can read tight at 0.5 still scale; wordSpacing 0.12em stays
- `EDU-S03` — olive fixture head, not gesturing A-roll (no Cap take)
- `RM-H07` — no A-roll media; fixture stills only
- `VOX-S08` — 48px foundry bars, not 2.39:1 cinema crop

Stills: `LetterboxDemo-f0.png`, `LetterboxDemo-f60.png`, `LessonSpine-slate-f330.png`. Compositions: LetterboxDemo 240f @30 plus existing LessonSpine 1230f.

## Reaudit 2026-09-20

Full-set [antagonist-full-set.md](./antagonist-full-set.md) **PASS**. Still `LetterboxDemo-f60.png` under `/opt/cursor/artifacts/remotion-antagonist-full-set-reaudit/2026-09-20/`. OverlayLock now 30px (VOX-S05 22px note superseded). `hold_cleaning: true`. ORDER LOCK intact.

## TypeCard VOX-S04 2026-09-20

Factory TypeCard-only **PASS**. Cream paper + gold 6px rail. No Cap / Ernest PNG. Stills `/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`. Prior dests untouched. `hold_cleaning: true`.

## Held

No Cap take. No Just. No melt. No campus Remotion package. No player rail. No Cleaning / Publish flip. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. No Wave3.
