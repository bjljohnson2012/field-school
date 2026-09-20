# Independent Antagonist v2 — EDU-S01 objective slate

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-20**. Opener sting carries Mayer pre-training “You will be able to” + shared objective `draw one idea per beat`. RecapCard returns the same objective as signaling, not a fourth numbered claim. No Cap take.

```
verdict: PASS
dated: 2026-09-20
gates: {
  VOX-H01: PASS, VOX-H02: PASS, VOX-H03: PASS, VOX-H04: PASS, VOX-H05: PASS,
  VOX-H06: PASS, VOX-H07: PASS, VOX-H08: PASS, VOX-H09: PASS, VOX-H10: PASS,
  VOX-S04: PASS, VOX-S05: PASS,
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT,
  RM-H01: PASS, RM-H02: PASS, RM-H03: PASS, RM-H04: PASS, RM-H05: PASS,
  RM-H06: PASS, RM-H07: PASS, RM-H08: PASS, RM-H09: PASS, RM-H10: PASS,
  RM-H11: PASS, RM-H12: PASS,
  EDU-H01: PASS, EDU-H02: PASS, EDU-H03: PASS, EDU-H04: PASS, EDU-H05: PASS,
  EDU-H06: PASS, EDU-H07: PASS, EDU-H08: PASS, EDU-H09: PASS, EDU-H10: PASS
}
hold_cleaning: true
auto_flip: false
escalate: false
rendering: stills only (locked master dest untouched)
sha256: 27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0
stills: /opt/cursor/artifacts/remotion-edu-s01-objective-slate/2026-09-20/
```

ORDER LOCK unchanged: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

Shared fixture: `plates/src/objectiveSlate.ts` `EDU_S01_PREFIX` + `EDU_S01_OBJECTIVE`. `ObjectiveSlate` on Opener (from f30) and RecapCard (from f24). Gold tick on the returned verb phrase (`EDU-S02`). DefinitionBoard stays the term/definition beat — not a second pre-training slate.

Locked master dest `/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4` sha256 `27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0` **untouched**. No new encode this round. Checklist exit 0, `hold_cleaning: true`, `--flip` refused.

## SOFT notes only

- `EDU-S01` — **PASS** explicit “You will be able to” slate on Opener; Recap returns the same string
- `EDU-S03` — olive fixture head, not gesturing A-roll (no Cap take)
- `VOX-S05` — OverlayLock 30px lock crop is the pixel proof; 0.5 still downsample can smash title
- Ship 1 HOLD. Ship 6 HOLD. Cleaning stays held.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
