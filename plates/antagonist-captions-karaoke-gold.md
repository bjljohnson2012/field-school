# Independent Antagonist v2 — CaptionsBand karaoke gold

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Soft re-score of **CaptionsBand / LessonSpine only**. Other comps stay on [antagonist-full-set.md](./antagonist-full-set.md).

```
verdict: pending stills
dated: 2026-09-20
hold_cleaning: true
auto_flip: false
escalate: false
rendering: /opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4
stills: /opt/cursor/artifacts/remotion-captions-karaoke-gold/2026-09-20/
```

## Craft

`wordClock` + `CaptionsBand`: one active word at fixture `startMs`/`endMs`. Active color gold `#C4A35A`. Gold 3px tick under the keyword (`EDU-S02`). Spoken ink. Unspoken stone `#7a746a`. `Karaoke` aliases `CaptionsBand`. Fixture times only — no WhisperX ingest, no Cap take.

LessonSpine letterbox stack unchanged: CaptionsBand + LowerThird + Letterbox + OverlayLock. ORDER LOCK unchanged: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

## VOX-S01

**PASS** (fixture word clock). Active word is gold `#C4A35A`. Align is fixture `startMs`, not WhisperX. Note only: live A-roll align is a later stream.

## SOFT notes only

- `VOX-S01` — PASS on fixture gold; WhisperX ingest not this stream
- `VOX-S04` — TypeCard live; spec `cards/` unused
- `EDU-S02` — gold active word + tick
- `EDU-S03` — olive fixture head, not gesturing A-roll (no Cap take)
- `EDU-S05` — karaoke/signaling, not a transcript dump
- No new HARD_FAIL

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No player rail. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
