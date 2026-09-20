# Independent Antagonist v2 — TypeCard VOX-S04 factory polish

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-20**. Factory TypeCard-only seal. No Cap take. No Ernest live cards / PNGs. Spec `cards/` unused.

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
rendering: stills /opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20 (no Cap take; Just untouched)
```

## Craft

`TypeCard` is the factory paper card. Cream `#EFE7D6` field + gold `#C4A35A` 6px left rail + padding `24px 32px 28px` (same factory card signal as `LowerThird`). Not Ernest PNG. Not spec `cards/`. Not mark-blue Zoom chrome (`VOX-S03` / `VOX-H07`).

`OverlayLock` stays VOX-S05: Fraunces 30px, `letterSpacing: 0.02em`, `wordSpacing: 0.2em`, `whiteSpace: nowrap`, 508px rail left of seal. Seal lock `80×64` at `1576,24`. No `-0.03em`.

`Title` / `Claim` / `Kicker` keep open tracking. LessonSpine ORDER LOCK unchanged: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

Stills only. No new LessonSpine encode. Prior dests **untouched**: first `a5d08284…`, captions `ec88d257…`, letterbox `028d16e4…`, karaoke / audiobed `9f89f9a9…`.

## Stills (2026-09-20)

`/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`

| Comp / beat | File |
|---|---|
| Opener 30 | `Opener-f30.png` |
| Recap 144 | `RecapCard-f144.png` |
| TalkingHead 90 | `TalkingHeadCard-f90.png` |
| Spine sting 30 | `LessonSpine-f30.png` |
| Spine slate 330 | `LessonSpine-f330.png` |

## SOFT notes only

- `VOX-S04` — **PASS** factory TypeCard-only (cream + gold rail). No Cap / Ernest PNG required.
- `VOX-S05` — OverlayLock 30px / `0.02em` / `0.2em` nowrap stays PASS
- `EDU-S03` — olive fixture head, not gesturing A-roll
- `RM-H07` — no A-roll media; fixture stills only
- Historical PR 66 / full-set gates still record `VOX-S04: SOFT` as that round's note. This stream seals the factory card.

Checklist on current AudioBed dest: exit **0**, `hold_cleaning: true`, `auto_flip: false`. `--flip` refused (exit 2).

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No player rail. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. No invent LAUNCH 8/8. Launch stays CLOSED 0/8.
