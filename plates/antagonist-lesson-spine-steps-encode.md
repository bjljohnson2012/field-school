# Independent Antagonist v2 — LessonSpine StepsCard encode

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-21**. New dated LessonSpine encode after PR 153 merge `c292ff37b31e7aaeae131d6a9a30ef5aa7192254` / tip `b5851aba9c573ce8975384e9575976ab4c38c2c9`. Bundles StepsCard numbered procedure / do-this-in-order onto the locked QuoteCard master stack. No Cap take. PRs 85–153 harvested.

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
rendering: /opt/cursor/artifacts/lesson-spine-steps-encode/2026-09-21/LessonSpine.mp4
sha256: e0ead459d9505cd612403e8601ab1bfd9ef1acbfc3eba59d3640e19ce621935b
stills: /opt/cursor/artifacts/remotion-lesson-spine-steps-encode/2026-09-21/
```

ORDER LOCK: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up → EndCard. PracticeCard after Recap/Quiz path. KeyClaim after sting/objective path. ScriptureCard after sting/objective path, after KeyClaim. CompareBoard after sting/objective path, after ScriptureCard. SectionTitle after sting/objective path, after CompareBoard. GlossaryChip after sting/objective path, after SectionTitle. ObjectionCard after sting/objective path, after GlossaryChip. StingColdOpen on Opener/sting only (ORDER LOCK first beat). CheckpointCard after sting/objective path, after ObjectionCard, before PracticeCard. ExampleCard after sting/objective path, after CheckpointCard, before PracticeCard. QuoteCard after sting/objective path, after ExampleCard, before PracticeCard. StepsCard after sting/objective path, after QuoteCard, before PracticeCard.

ffprobe: h264 1920×1080@30 duration 41.000s, video only. Mid-wipe still f9 shows cream luma + gold 6px leading edge covering the left of sting. Sting still gold-ticks “Things” on the packed 6-word line + claim “docked.” + OverlayLock title + seal `1576,24` + LowerThird Teacher/OPENER + CalloutCard Tip “One idea per beat” + ProgressRail sting + ChapterChip “Sting” + KeyClaim kicker “Thesis” + gold tick on “claim.” + ScriptureCard kicker “Verse” + gold tick on “verse.” + CompareBoard kicker “Compare” + gold tick on “claims.” + columns “holds.” / “docks.” + SectionTitle kicker “Section” + gold tick on “section.” + GlossaryChip kicker “Glossary” + term “Type” + gold tick on “term.” + ObjectionCard kicker “Objection” + gold tick on “reply.” + StingColdOpen kicker “Cold open” + gold tick on “hook.” (wipe already cleared). Slate still gold-ticks “full-bleed” with kicker “Slate” + OverlayLock + LowerThird Teacher/OPERATOR + CalloutCard Aside “Head stays docked” + ChapterChip “Slate”. Objective still gold-ticks “motion” (DefinitionBoard) + OverlayLock + LowerThird Teacher/DEFINITION + CalloutCard Tip “Type is the lesson” + ChapterChip “Objective” + KeyClaim kicker “Thesis” + gold “claim.” + ScriptureCard kicker “Verse” + gold “verse.” + CompareBoard kicker “Compare” + gold “claims.” + columns “holds.” / “docks.” + SectionTitle kicker “Section” + gold “section.” + GlossaryChip kicker “Glossary” + term “Type” + gold “term.” + ObjectionCard kicker “Objection” + gold “reply.” + CheckpointCard kicker “Check” + gold “idea.” + ExampleCard kicker “Example” + gold “work.” + QuoteCard kicker “Quote” + gold “quote.” + StepsCard kicker “Steps” + gold “order.” / “beat.” / “work.”. Recap still gold-ticks “card” with kicker “Recap” + OverlayLock + LowerThird Teacher/RECAP + CalloutCard Aside “Return the same claim” + ChapterChip “Recap” + KeyClaim kicker “Thesis” + gold “claim.” + ScriptureCard kicker “Verse” + gold “verse.” + CompareBoard kicker “Compare” + gold “claims.” + columns “holds.” / “docks.” + SectionTitle kicker “Section” + gold “section.” + GlossaryChip kicker “Glossary” + term “Type” + gold “term.” + ObjectionCard kicker “Objection” + gold “reply.” + CheckpointCard kicker “Check” + gold “idea.” + ExampleCard kicker “Example” + gold “work.” + QuoteCard kicker “Quote” + gold “quote.” + StepsCard kicker “Steps” + gold “order.” / “beat.” / “work.” + PracticeCard kicker “Try this” + gold tick on “now.”. Next-up still shows kicker “Next up” + gold “draw?” + OverlayLock + LowerThird Teacher/QUIZ + CalloutCard Tip “Next beat, not a dump” + ChapterChip “Next up” + PracticeCard kicker “Try this” + gold “now.” + EndCard kicker “Close” + gold tick on “holds.”. TypeCard cream + gold 6px rail. OverlayLock 30px + seal `1576,24`. Karaoke gold `#C4A35A` packed 6 words / line. Letterbox ink bars. AudioBed unmuted volume 0. Head docked. TransitionLuma `TRANSITION_LUMA_FRAMES = 18`. EndCard `END_CARD_KICKER = "Close"` / `END_CARD_LINE = "The lesson holds."`. PracticeCard `PRACTICE_CARD_KICKER = "Try this"` / `PRACTICE_CARD_LINE = "Apply one idea now."`. KeyClaim `KEY_CLAIM_KICKER = "Thesis"` / `KEY_CLAIM_LINE = "Lock one claim."`. ScriptureCard `SCRIPTURE_CARD_KICKER = "Verse"` / `SCRIPTURE_CARD_LINE = "Cite the verse."`. CompareBoard `COMPARE_BOARD_KICKER = "Compare"` / `COMPARE_BOARD_LINE = "Hold two claims."` / `COMPARE_BOARD_LEFT = "Type holds."` / `COMPARE_BOARD_RIGHT = "Head docks."`. SectionTitle `SECTION_TITLE_KICKER = "Section"` / `SECTION_TITLE_LINE = "Name the section."`. GlossaryChip `GLOSSARY_CHIP_KICKER = "Glossary"` / `GLOSSARY_CHIP_TERM = "Type"` / `GLOSSARY_CHIP_LINE = "Define the term."`. ObjectionCard `OBJECTION_CARD_KICKER = "Objection"` / `OBJECTION_CARD_LINE = "Steelman the reply."`. StingColdOpen `STING_COLD_OPEN_KICKER = "Cold open"` / `STING_COLD_OPEN_LINE = "Start on the hook."`. CheckpointCard `CHECKPOINT_CARD_KICKER = "Check"` / `CHECKPOINT_CARD_LINE = "Confirm the idea."`. ExampleCard `EXAMPLE_CARD_KICKER = "Example"` / `EXAMPLE_CARD_LINE = "Show the work."`. QuoteCard `QUOTE_CARD_KICKER = "Quote"` / `QUOTE_CARD_LINE = "Hold the quote."`. StepsCard `STEPS_CARD_KICKER = "Steps"` / `STEPS_CARD_LINE = "Do this in order."` / `STEPS_CARD_ONE = "1. Name the beat."` / `STEPS_CARD_TWO = "2. Do the work."`. Checklist exit 0. `--flip` refused. Quote dest **untouched** (`244c485bbfd83e2138c4e499fc07a00f566be3d1ede1c5a3f03dfd57b04feb2d`). Example dest **untouched** (`f52ae59972fb4c0945febfa8b3166a217822548f8db6eff3468062fe07c0c33b`). Other priors untouched (`19e5a19c47f72197bbf726707b839bdf287fd3f0111d105b2161fd694584246a` / `325a41e775821c8576e14038d2076ee639d48a0fc29b3f84b223f4af9390f204` / `4a1317e0e6daf440958a81a7fb6dcda042751c9fda3ab44f1df1153d8fd66aee` / `247890d0529b635d8ad39317825c760fe76fe134274e2149e4ccbe9bcb1af32c` / `f4bf345d6c0ec8c51941b3bb2d08c71589bc822632d935dc26b6d18c07a631e7` / `917efdb18684f7307ec63dd576b26f15eea207194ea9a6804d121878ff3f3a5d` / `cb3a672da3871428548f2e6ec69da03b9c1d2e425058a1b4b856d928a6e43a79` / `16f516640c5cac4609862ae2436eb37dd118e56bc6633e3dd10d76290a588606` / `8c953707…` / `073e1e3b…` / `f631402a…` / `5b229fee…` / `68b8378a…` / `a11e31a3…` / `3f425456…` / `d0a09896…` / `eaf6f84a…` / `cab8bd91…` / `27cc5bf3…` / `9f89f9a9…` / `028d16e4…` / `a5d08284…` / `ec88d257…`).

## SOFT notes only

- `EDU-S01` — **PASS** on this dest
- `EDU-S02` — **PASS** on Opener + TalkingHead + DefinitionBoard + RecapCard + QuizBumper + TypeCard claims + ObjectiveSlate + EndCard “holds.” + PracticeCard “now.” + KeyClaim “claim.” + ScriptureCard “verse.” + CompareBoard “claims.” / “holds.” / “docks.” + SectionTitle “section.” + GlossaryChip “term.” + ObjectionCard “reply.” + StingColdOpen “hook.” + CheckpointCard “idea.” + ExampleCard “work.” + QuoteCard “quote.” + StepsCard “order.” / “beat.” / “work.”
- `EDU-S03` — olive fixture head, not gesturing A-roll (Cap-blocked; no Cap take)
- `EDU-S04` — volume 0 silent fixture; no random SFX; no Cap A-roll audio
- `VOX-S05` — OverlayLock 30px lock crop is the pixel proof; 0.5 still downsample can smash title
- Ship 1 HOLD. Ship 6 HOLD. Cleaning stays held.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
