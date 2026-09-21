# Independent Antagonist v2 — scripture encode master dest

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-21**. Soft re-score of the locked ScriptureCard LessonSpine master plus ScriptureCard plates. After PR 128 merge `94c848e53a5c4cfa07e735b3fc24869d5a31ffcb`. No Cap take.

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
rendering: /opt/cursor/artifacts/lesson-spine-scripture-encode/2026-09-21/LessonSpine.mp4
sha256: cb3a672da3871428548f2e6ec69da03b9c1d2e425058a1b4b856d928a6e43a79
stills: /opt/cursor/artifacts/remotion-antagonist-scripture-encode-master/2026-09-21/
```

ORDER LOCK: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up → EndCard. PracticeCard after Recap/Quiz path. KeyClaim after sting/objective path. ScriptureCard after sting/objective path, after KeyClaim.

ffprobe: h264 1920×1080@30 duration 41.000s, video only. Mid-wipe still f9 shows cream luma + gold 6px leading edge on sting. Sting gold-ticks “Things” on the packed 6-word line + claim “docked.” + OverlayLock title + seal `1576,24` + LowerThird Teacher/OPENER + CalloutCard Tip “One idea per beat” + ProgressRail sting + ChapterChip “Sting” + KeyClaim kicker “Thesis” + gold tick on “claim.” + ScriptureCard kicker “Verse” + gold tick on “verse.” (wipe already cleared). Slate kicker “Slate” + gold “full-bleed” + OverlayLock + LowerThird Teacher/OPERATOR + CalloutCard Aside “Head stays docked” + ChapterChip “Slate”. Objective gold-ticks “motion” (DefinitionBoard) + OverlayLock + LowerThird Teacher/DEFINITION + CalloutCard Tip “Type is the lesson” + ChapterChip “Objective” + KeyClaim kicker “Thesis” + gold “claim.” + ScriptureCard kicker “Verse” + gold “verse.”. Recap kicker “Recap” + gold “card” + OverlayLock + LowerThird Teacher/RECAP + CalloutCard Aside “Return the same claim” + ChapterChip “Recap” + KeyClaim kicker “Thesis” + gold “claim.” + ScriptureCard kicker “Verse” + gold “verse.” + PracticeCard kicker “Try this” + gold tick on “now.”. Next-up kicker “Next up” + gold “draw?” + OverlayLock + LowerThird Teacher/QUIZ + CalloutCard Tip “Next beat, not a dump” + ChapterChip “Next up” + PracticeCard kicker “Try this” + gold “now.” + EndCard kicker “Close” + gold tick on “holds.”. TypeCard cream + gold 6px rail. OverlayLock 30px + seal `1576,24`. Karaoke gold `#C4A35A` packed 6 words / line. Letterbox. AudioBed unmuted volume 0. Head docked. TransitionLuma `TRANSITION_LUMA_FRAMES = 18`. EndCard `END_CARD_KICKER = "Close"` / `END_CARD_LINE = "The lesson holds."`. PracticeCard `PRACTICE_CARD_KICKER = "Try this"` / `PRACTICE_CARD_LINE = "Apply one idea now."`. KeyClaim `KEY_CLAIM_KICKER = "Thesis"` / `KEY_CLAIM_LINE = "Lock one claim."`. ScriptureCard `SCRIPTURE_CARD_KICKER = "Verse"` / `SCRIPTURE_CARD_LINE = "Cite the verse."`. Checklist exit 0. `--flip` refused. Locked master dest **untouched** (`cb3a672da3871428548f2e6ec69da03b9c1d2e425058a1b4b856d928a6e43a79`). Key-claim dest **untouched** (`16f516640c5cac4609862ae2436eb37dd118e56bc6633e3dd10d76290a588606`). Other priors untouched (`8c953707…` / `073e1e3b…` / `f631402a…` / `5b229fee…` / `68b8378a…` / `a11e31a3…` / `3f425456…` / `d0a09896…` / `eaf6f84a…` / `cab8bd91…` / `27cc5bf3…` / `9f89f9a9…` / `028d16e4…` / `a5d08284…` / `ec88d257…`).

Full-set pointer: [antagonist-full-set.md](./antagonist-full-set.md) `## LessonSpine scripture encode master dest reaudit 2026-09-21`. Encode: [antagonist-lesson-spine-scripture-encode.md](./antagonist-lesson-spine-scripture-encode.md). Plates: [antagonist-scripture-card.md](./antagonist-scripture-card.md).

## SOFT notes only

- `EDU-S01` — **PASS** on the locked master
- `EDU-S02` — **PASS** on Opener + TalkingHead + DefinitionBoard + RecapCard + QuizBumper + TypeCard claims + ObjectiveSlate + EndCard “holds.” + PracticeCard “now.” + KeyClaim “claim.” + ScriptureCard “verse.”
- `EDU-S03` — olive fixture head, not gesturing A-roll (Cap-blocked; no Cap take)
- `EDU-S04` — volume 0 silent fixture; no random SFX; no Cap A-roll audio
- `VOX-S05` — OverlayLock 30px lock crop is the pixel proof; 0.5 still downsample can smash title
- Ship 1 HOLD. Ship 6 HOLD. Cleaning stays held.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
