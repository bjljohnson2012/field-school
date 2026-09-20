# Independent Antagonist v2 — DefinitionBoard + QuizBumper + TalkingHeadCard

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
rendering: idle (stills only; no Cap take; Just untouched)
```

## Length bands

| id | fps | size | frames | sec | band |
|---|---|---|---|---|---|
| DefinitionBoard | 30 | 1920×1080 | 180 | 6.00 | still + 6s |
| QuizBumper | 30 | 1920×1080 | 210 | 7.00 | 6–8s |
| TalkingHeadCard | 30 | 1920×1080 | 240 | 8.00 | docked, not full-bleed |

Opener + RecapCard unchanged from PR 52.

## SOFT notes only

- `VOX-S02` / `EDU-S01` — plates, not a full lesson spine
- `VOX-S04` — factory TypeCard-only PASS (cream + gold rail); no Ernest PNG. See [antagonist-typecard-vox-s04.md](./antagonist-typecard-vox-s04.md)
- `EDU-S02` — **PASS** gold keyword tick on DefinitionBoard Title last word. See [antagonist-definitionboard-edu-s02.md](./antagonist-definitionboard-edu-s02.md). QuizBumper next-up also ticks Title last word. See [antagonist-quizbumper-next-up.md](./antagonist-quizbumper-next-up.md)
- `EDU-S03` — olive fixture, not gesturing A-roll (no Cap take)
- Quiz `sourceUnitId` is operator copy (`lesson-opener`), not a second Pattern bank

## Reaudit 2026-09-20

Full-set [antagonist-full-set.md](./antagonist-full-set.md) **PASS**. Stills `DefinitionBoard-f30.png` / `QuizBumper-f30.png` / `TalkingHeadCard-f90.png` under `/opt/cursor/artifacts/remotion-antagonist-full-set-reaudit/2026-09-20/`. HARD gates unchanged. `hold_cleaning: true`. ORDER LOCK intact.

## TypeCard VOX-S04 2026-09-20

Factory TypeCard-only **PASS**. Cream paper + gold 6px rail. No Cap / Ernest PNG. Stills `/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`. Prior dests untouched. `hold_cleaning: true`.

## EDU-S02 DefinitionBoard 2026-09-20

DefinitionBoard Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “motion”. Karaoke already gold-ticks the same word 900–1600ms. Evidence: [antagonist-definitionboard-edu-s02.md](./antagonist-definitionboard-edu-s02.md). Stills `/opt/cursor/artifacts/remotion-definitionboard-edu-s02/2026-09-20/`. Locked master dest `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` **untouched**. `hold_cleaning: true`. ORDER LOCK intact.

## QuizBumper next-up 2026-09-20

QuizBumper kicker “Next up” plus Title last-word gold `#C4A35A` tick (`Keyword`) on fixture “draw?”. Karaoke already gold-ticks the same word 1500–2200ms (plate f54 / spine f1074). Evidence: [antagonist-quizbumper-next-up.md](./antagonist-quizbumper-next-up.md). Stills `/opt/cursor/artifacts/remotion-quizbumper-next-up/2026-09-20/`. Locked master dest `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf` **untouched**. `hold_cleaning: true`. ORDER LOCK intact.

## Held

No Cap take. No Just. No melt. No campus Remotion package. No Publish/Distribute. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`.
