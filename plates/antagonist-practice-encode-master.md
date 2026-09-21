# Independent Antagonist v2 — practice encode master dest

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-21**. Soft re-score of the locked PracticeCard LessonSpine master plus PracticeCard plates. After PR 122 merge `c4474d1789489b5bb18004fe70338ec8ccb92fd4`. No Cap take.

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
rendering: /opt/cursor/artifacts/lesson-spine-practice-encode/2026-09-21/LessonSpine.mp4
sha256: 8c953707401f835551ceec5d96c090b133cd619b41c4b7ff543b1637edc44dbf
stills: /opt/cursor/artifacts/remotion-antagonist-practice-encode-master/2026-09-21/
```

ORDER LOCK: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up → EndCard. PracticeCard after Recap/Quiz path.

ffprobe: h264 1920×1080@30 duration 41.000s, video only. Mid-wipe still f9 shows cream luma + gold 6px leading edge on sting. Sting gold-ticks “Things” on the packed 6-word line + claim “docked.” + OverlayLock title + seal `1576,24` + LowerThird Teacher/OPENER + CalloutCard Tip “One idea per beat” + ProgressRail sting + ChapterChip “Sting” (wipe already cleared). Slate kicker “Slate” + gold “full-bleed” + OverlayLock + LowerThird Teacher/OPERATOR + CalloutCard Aside “Head stays docked” + ChapterChip “Slate”. Objective gold-ticks “motion” (DefinitionBoard) + OverlayLock + LowerThird Teacher/DEFINITION + CalloutCard Tip “Type is the lesson” + ChapterChip “Objective”. Recap kicker “Recap” + gold “card” + OverlayLock + LowerThird Teacher/RECAP + CalloutCard Aside “Return the same claim” + ChapterChip “Recap” + PracticeCard kicker “Try this” + gold tick on “now.”. Next-up kicker “Next up” + gold “draw?” + OverlayLock + LowerThird Teacher/QUIZ + CalloutCard Tip “Next beat, not a dump” + ChapterChip “Next up” + PracticeCard kicker “Try this” + gold “now.” + EndCard kicker “Close” + gold tick on “holds.”. TypeCard cream + gold 6px rail. OverlayLock 30px + seal `1576,24`. Karaoke gold `#C4A35A` packed 6 words / line. Letterbox. AudioBed unmuted volume 0. Head docked. TransitionLuma `TRANSITION_LUMA_FRAMES = 18`. EndCard `END_CARD_KICKER = "Close"` / `END_CARD_LINE = "The lesson holds."`. PracticeCard `PRACTICE_CARD_KICKER = "Try this"` / `PRACTICE_CARD_LINE = "Apply one idea now."`. Checklist exit 0. `--flip` refused. Locked master dest **untouched** (`8c953707401f835551ceec5d96c090b133cd619b41c4b7ff543b1637edc44dbf`). End-card dest **untouched** (`073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693`). Other priors untouched (`f631402a…` / `5b229fee…` / `68b8378a…` / `a11e31a3…` / `3f425456…` / `d0a09896…` / `eaf6f84a…` / `cab8bd91…` / `27cc5bf3…` / `9f89f9a9…` / `028d16e4…` / `a5d08284…` / `ec88d257…`).

Full-set pointer: [antagonist-full-set.md](./antagonist-full-set.md) `## LessonSpine practice encode master dest reaudit 2026-09-21`. Encode: [antagonist-lesson-spine-practice-encode.md](./antagonist-lesson-spine-practice-encode.md). Plates: [antagonist-practice-card.md](./antagonist-practice-card.md).

## SOFT notes only

- `EDU-S01` — **PASS** on the locked master
- `EDU-S02` — **PASS** on Opener + TalkingHead + DefinitionBoard + RecapCard + QuizBumper + TypeCard claims + ObjectiveSlate + EndCard “holds.” + PracticeCard “now.”
- `EDU-S03` — olive fixture head, not gesturing A-roll (Cap-blocked; no Cap take)
- `EDU-S04` — volume 0 silent fixture; no random SFX; no Cap A-roll audio
- `VOX-S05` — OverlayLock 30px lock crop is the pixel proof; 0.5 still downsample can smash title
- Ship 1 HOLD. Ship 6 HOLD. Cleaning stays held.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
