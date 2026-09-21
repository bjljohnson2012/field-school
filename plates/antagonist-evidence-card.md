# Independent Antagonist v2 — EvidenceCard

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-21**. Evidence / warrant rows distinct from RubricCard scoring bands and SourceChip citation chip soft craft beat (`EVIDENCE_CARD_KICKER = "Evidence"`; `EVIDENCE_CARD_LINE = "Hold the warrant."`; `EVIDENCE_CARD_ONE = "The fact holds."`; `EVIDENCE_CARD_TWO = "The why shows."`; cream + gold 6px left rail; gold 8×8 square marks, not RubricCard 4×16 vertical ticks, not SourceChip citation chip; EDU-S02 gold tick on “warrant.” plus warrants “holds.” / “shows.”). Craft beat on `EvidenceCardDemo`. Sequenced after sting/objective path, after RubricCard, before PracticeCard. Wired on DefinitionBoard + RecapCard (after Recap before Quiz). Not on Opener, TalkingHead, or QuizBumper. Evidence path only. No Cap take. Plate-level stills only. No encode this round.

```
verdict: PASS
dated: 2026-09-21
gates: {
  VOX-H01: PASS, VOX-H02: PASS, VOX-H03: PASS, VOX-H04: PASS, VOX-H05: PASS,
  VOX-H06: PASS, VOX-H07: PASS, VOX-H08: PASS, VOX-H09: PASS, VOX-H10: PASS,
  VOX-S01: PASS, VOX-S04: PASS, VOX-S05: PASS,
  EDU-S01: PASS, EDU-S02: PASS, EDU-S03: SOFT, EDU-S04: PASS,
  RM-H01: PASS, RM-H02: PASS, RM-H03: PASS, RM-H04: PASS, RM-H05: PASS,
  RM-H06: PASS, RM-H07: PASS, RM-H08: PASS, RM-H09: PASS, RM-H10: PASS,
  RM-H11: PASS, RM-H12: PASS,
  EDU-H01: PASS, EDU-H02: PASS, EDU-H03: PASS, EDU-H04: PASS, EDU-H05: PASS,
  EDU-H06: PASS, EDU-H07: PASS, EDU-H08: PASS, EDU-H09: PASS, EDU-H10: PASS
}
hold_cleaning: true
auto_flip: false
escalate: false
stills: /opt/cursor/artifacts/remotion-evidence-card/2026-09-21/
sha256: 4aef4c713218247ebb4cad42b637f4b1331a02d6db4fcc13ac13e2bde156a337
```

ORDER LOCK intact: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up → EndCard. PracticeCard after Recap/Quiz path. SpectrumBar after sting/objective path, after SourceChip, before PracticeCard. ThresholdCard after sting/objective path, after SpectrumBar, before PracticeCard. RubricCard after sting/objective path, after ThresholdCard, before PracticeCard. EvidenceCard after sting/objective path, after RubricCard, before PracticeCard.

After PR 176 merge `9e92f64e8b79a0dfb81ead8c5152481d19e6bbd3` / tip `207db7b1112edd81ec56cb89ae06cc1afb229c1c`. Locked master dest `/opt/cursor/artifacts/lesson-spine-rubric-encode/2026-09-21/LessonSpine.mp4` sha256 `4aef4c713218247ebb4cad42b637f4b1331a02d6db4fcc13ac13e2bde156a337` **Current master dest.** **untouched** (plate-level stills only). Threshold dest `955f0256424fdc4ddb5ae5506a04a9ea877cb6a79ccb126ba1bb4884b9943a6f` **untouched**. Spectrum dest `496f506babd11a6e5247e87c3bbf926117b0de31feae5b6573fa891bdf6c68d0` **untouched**. Checklist `hold_cleaning: true`. `--flip` refused.

## SOFT notes only

- `EDU-S01` — **PASS** on the locked master
- `EDU-S02` — **PASS** karaoke gold ticks unchanged; EvidenceCard last-word “warrant.” gold-ticked plus warrants “holds.” / “shows.”
- `EDU-S03` — olive fixture head, not gesturing A-roll (Cap-blocked; no Cap take)
- `EDU-S04` — volume 0 silent fixture; no random SFX; no Cap A-roll audio
- `VOX-S05` — OverlayLock 30px lock crop is the pixel proof; 0.5 still downsample can smash title
- Ship 1 HOLD. Ship 6 HOLD. Cleaning stays held.

## Next node (propose only)

`remotion-lesson-spine-evidence-encode` — encode LessonSpine with EvidenceCard, then antagonist master dest reaudit. Notes-only until CDM GO. No auto-next from this builder.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. No encode this round. Launch stays CLOSED 0/8. Do not conflate EvidenceCard with RubricCard or SourceChip.
