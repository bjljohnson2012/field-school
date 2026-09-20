# Independent Antagonist v2 — EDU-S02 master dest

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-20**. Soft re-score of the locked EDU-S02 LessonSpine master plus EDU-S01/S02 + QuizBumper plates. After PR 90 merge `b4aeb1e102143863b3390de4b60ed64a81080b62`. No Cap take.

```
verdict: PASS
dated: 2026-09-20
gates: {
  VOX-H01: PASS, VOX-H02: PASS, VOX-H03: PASS, VOX-H04: PASS, VOX-H05: PASS,
  VOX-H06: PASS, VOX-H07: PASS, VOX-H08: PASS, VOX-H09: PASS, VOX-H10: PASS,
  VOX-S01: PASS, VOX-S04: PASS, VOX-S05: PASS,
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
rendering: /opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4
sha256: eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8
stills: /opt/cursor/artifacts/remotion-antagonist-edu-s02-master/2026-09-20/
```

ORDER LOCK: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

ffprobe: h264 1920×1080@30 duration 41.000s, video only. Sting carries “You will be able to” + `draw one idea per beat`. Recap returns the same objective (signaling, not a new claim). Objective gold-ticks “motion”. Next-up kicker “Next up” + gold “draw?”. TypeCard cream + gold 6px rail. OverlayLock 30px + seal `1576,24`. Karaoke gold `#C4A35A`. Letterbox. Head docked. Checklist exit 0. `--flip` refused. EDU-S01 dest **untouched** (`cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf`). Typecard dest **untouched** (`27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0`). Other priors untouched (`9f89f9a9…` / `028d16e4…` / `a5d08284…` / `ec88d257…`).

Full-set pointer: [antagonist-full-set.md](./antagonist-full-set.md) `## EDU-S02 master dest reaudit 2026-09-20`. Encode: [antagonist-lesson-spine-edu-s02-encode.md](./antagonist-lesson-spine-edu-s02-encode.md). Plates: [antagonist-definitionboard-edu-s02.md](./antagonist-definitionboard-edu-s02.md) + [antagonist-quizbumper-next-up.md](./antagonist-quizbumper-next-up.md) + [antagonist-edu-s01-objective-slate.md](./antagonist-edu-s01-objective-slate.md).

## SOFT notes only

- `EDU-S01` — **PASS** on the locked master
- `EDU-S02` — **PASS** on DefinitionBoard + QuizBumper (gold `#C4A35A` keyword tick)
- `EDU-S03` — olive fixture head, not gesturing A-roll (Cap-blocked; no Cap take)
- `VOX-S05` — OverlayLock 30px lock crop is the pixel proof; 0.5 still downsample can smash title
- Ship 1 HOLD. Ship 6 HOLD. Cleaning stays held.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
