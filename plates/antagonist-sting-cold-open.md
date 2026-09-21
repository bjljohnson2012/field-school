# Independent Antagonist v2 — Sting cold open

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-21**. Sting / Opener cold-open soft craft beat. Hook on the ORDER LOCK first beat (`STING_COLD_OPEN_KICKER = "Cold open"`; `STING_COLD_OPEN_LINE = "Start on the hook."`; cream + gold 6px left rail; EDU-S02 gold tick on “hook.”). Craft beat on `StingColdOpenDemo`. Sequenced on Opener/sting only. Downstream craft unchanged. Sting path only. No Cap take. Plate-level stills only.

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
stills: /opt/cursor/artifacts/remotion-sting-cold-open/2026-09-21/
sha256: 4a1317e0e6daf440958a81a7fb6dcda042751c9fda3ab44f1df1153d8fd66aee
```

ORDER LOCK intact: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up → EndCard. PracticeCard after Recap/Quiz path. KeyClaim after sting/objective path. ScriptureCard after sting/objective path, after KeyClaim. CompareBoard after sting/objective path, after ScriptureCard. SectionTitle after sting/objective path, after CompareBoard. GlossaryChip after sting/objective path, after SectionTitle. ObjectionCard after sting/objective path, after GlossaryChip. StingColdOpen on Opener/sting only (ORDER LOCK first beat).

After PR 140 merge `357ea04125a9dc15df606d041280f0afbc2d4a85` / tip `14e85a8faa63a4205e4bcb0a327bd1d82fd902de`. Locked master dest `/opt/cursor/artifacts/lesson-spine-objection-encode/2026-09-21/LessonSpine.mp4` sha256 `4a1317e0e6daf440958a81a7fb6dcda042751c9fda3ab44f1df1153d8fd66aee` **untouched** (plate-level stills only). Checklist `hold_cleaning: true`. `--flip` refused.

## SOFT notes only

- `EDU-S01` — **PASS** on the locked master
- `EDU-S02` — **PASS** karaoke gold ticks unchanged; StingColdOpen last-word “hook.” gold-ticked
- `EDU-S03` — olive fixture head, not gesturing A-roll (Cap-blocked; no Cap take)
- `EDU-S04` — volume 0 silent fixture; no random SFX; no Cap A-roll audio
- `VOX-S05` — OverlayLock 30px lock crop is the pixel proof; 0.5 still downsample can smash title
- Ship 1 HOLD. Ship 6 HOLD. Cleaning stays held.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. No encode this round. Launch stays CLOSED 0/8.
