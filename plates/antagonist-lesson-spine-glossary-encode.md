# Independent Antagonist v2 — LessonSpine GlossaryChip encode

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-21**. New dated LessonSpine encode after PR 136 merge `71fb9fd3aa6b4709cee42b1515e06826cd435963`. Bundles GlossaryChip term / definition pop onto the locked SectionTitle master stack. No Cap take. PRs 85–136 harvested.

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
rendering: /opt/cursor/artifacts/lesson-spine-glossary-encode/2026-09-21/LessonSpine.mp4
sha256: 247890d0529b635d8ad39317825c760fe76fe134274e2149e4ccbe9bcb1af32c
stills: /opt/cursor/artifacts/remotion-lesson-spine-glossary-encode/2026-09-21/
```

ORDER LOCK: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up → EndCard. PracticeCard after Recap/Quiz path. KeyClaim after sting/objective path. ScriptureCard after sting/objective path, after KeyClaim. CompareBoard after sting/objective path, after ScriptureCard. SectionTitle after sting/objective path, after CompareBoard. GlossaryChip after sting/objective path, after SectionTitle.

ffprobe: h264 1920×1080@30 duration 41.000s, video only. Mid-wipe still f9 shows cream luma + gold 6px leading edge covering the left of sting. Sting still gold-ticks “Things” on the packed 6-word line + claim “docked.” + OverlayLock title + seal `1576,24` + LowerThird Teacher/OPENER + CalloutCard Tip “One idea per beat” + ProgressRail sting + ChapterChip “Sting” + KeyClaim kicker “Thesis” + gold tick on “claim.” + ScriptureCard kicker “Verse” + gold tick on “verse.” + CompareBoard kicker “Compare” + gold tick on “claims.” + columns “holds.” / “docks.” + SectionTitle kicker “Section” + gold tick on “section.” + GlossaryChip kicker “Glossary” + term “Type” + gold tick on “term.” (wipe already cleared). Slate still gold-ticks “full-bleed” with kicker “Slate” + OverlayLock + LowerThird Teacher/OPERATOR + CalloutCard Aside “Head stays docked” + ChapterChip “Slate”. Objective still gold-ticks “motion” (DefinitionBoard) + OverlayLock + LowerThird Teacher/DEFINITION + CalloutCard Tip “Type is the lesson” + ChapterChip “Objective” + KeyClaim kicker “Thesis” + gold “claim.” + ScriptureCard kicker “Verse” + gold “verse.” + CompareBoard kicker “Compare” + gold “claims.” + columns “holds.” / “docks.” + SectionTitle kicker “Section” + gold “section.” + GlossaryChip kicker “Glossary” + term “Type” + gold “term.”. Recap still gold-ticks “card” with kicker “Recap” + OverlayLock + LowerThird Teacher/RECAP + CalloutCard Aside “Return the same claim” + ChapterChip “Recap” + KeyClaim kicker “Thesis” + gold “claim.” + ScriptureCard kicker “Verse” + gold “verse.” + CompareBoard kicker “Compare” + gold “claims.” + columns “holds.” / “docks.” + SectionTitle kicker “Section” + gold “section.” + GlossaryChip kicker “Glossary” + term “Type” + gold “term.” + PracticeCard kicker “Try this” + gold tick on “now.”. Next-up still shows kicker “Next up” + gold “draw?” + OverlayLock + LowerThird Teacher/QUIZ + CalloutCard Tip “Next beat, not a dump” + ChapterChip “Next up” + PracticeCard kicker “Try this” + gold “now.” + EndCard kicker “Close” + gold tick on “holds.”. TypeCard cream + gold 6px rail. OverlayLock 30px + seal `1576,24`. Karaoke gold `#C4A35A` packed 6 words / line. Letterbox ink bars. AudioBed unmuted volume 0. Head docked. TransitionLuma `TRANSITION_LUMA_FRAMES = 18`. EndCard `END_CARD_KICKER = "Close"` / `END_CARD_LINE = "The lesson holds."`. PracticeCard `PRACTICE_CARD_KICKER = "Try this"` / `PRACTICE_CARD_LINE = "Apply one idea now."`. KeyClaim `KEY_CLAIM_KICKER = "Thesis"` / `KEY_CLAIM_LINE = "Lock one claim."`. ScriptureCard `SCRIPTURE_CARD_KICKER = "Verse"` / `SCRIPTURE_CARD_LINE = "Cite the verse."`. CompareBoard `COMPARE_BOARD_KICKER = "Compare"` / `COMPARE_BOARD_LINE = "Hold two claims."` / `COMPARE_BOARD_LEFT = "Type holds."` / `COMPARE_BOARD_RIGHT = "Head docks."`. SectionTitle `SECTION_TITLE_KICKER = "Section"` / `SECTION_TITLE_LINE = "Name the section."`. GlossaryChip `GLOSSARY_CHIP_KICKER = "Glossary"` / `GLOSSARY_CHIP_TERM = "Type"` / `GLOSSARY_CHIP_LINE = "Define the term."`. Checklist exit 0. `--flip` refused. Section dest **untouched** (`f4bf345d6c0ec8c51941b3bb2d08c71589bc822632d935dc26b6d18c07a631e7`). Other priors untouched (`917efdb18684f7307ec63dd576b26f15eea207194ea9a6804d121878ff3f3a5d` / `cb3a672da3871428548f2e6ec69da03b9c1d2e425058a1b4b856d928a6e43a79` / `16f516640c5cac4609862ae2436eb37dd118e56bc6633e3dd10d76290a588606` / `8c953707…` / `073e1e3b…` / `f631402a…` / `5b229fee…` / `68b8378a…` / `a11e31a3…` / `3f425456…` / `d0a09896…` / `eaf6f84a…` / `cab8bd91…` / `27cc5bf3…` / `9f89f9a9…` / `028d16e4…` / `a5d08284…` / `ec88d257…`).

## SOFT notes only

- `EDU-S01` — **PASS** on this dest
- `EDU-S02` — **PASS** on Opener + TalkingHead + DefinitionBoard + RecapCard + QuizBumper + TypeCard claims + ObjectiveSlate + EndCard “holds.” + PracticeCard “now.” + KeyClaim “claim.” + ScriptureCard “verse.” + CompareBoard “claims.” / “holds.” / “docks.” + SectionTitle “section.” + GlossaryChip “term.”
- `EDU-S03` — olive fixture head, not gesturing A-roll (Cap-blocked; no Cap take)
- `EDU-S04` — volume 0 silent fixture; no random SFX; no Cap A-roll audio
- `VOX-S05` — OverlayLock 30px lock crop is the pixel proof; 0.5 still downsample can smash title
- Ship 1 HOLD. Ship 6 HOLD. Cleaning stays held.

## Held

This dest is now an archived prior (file **untouched**). Current master dest is objection-encode.

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
