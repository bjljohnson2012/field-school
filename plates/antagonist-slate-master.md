# Independent Antagonist v2 — slate master dest

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

Dated **2026-09-20**. Soft re-score of the locked slate LessonSpine master plus Opener/TalkingHead/RecapCard slate + EDU plates. After PR 95 merge `99b706c294f40846d247d1175ce2ed9d08fb0bae`. No Cap take.

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
rendering: /opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4
sha256: d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5
stills: /opt/cursor/artifacts/remotion-antagonist-slate-master/2026-09-20/
```

ORDER LOCK: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

ffprobe: h264 1920×1080@30 duration 41.000s, video only. Sting gold-ticks “Things” + “You will be able to” + `draw one idea per beat`. Slate kicker “Slate” + gold “full-bleed”. Objective gold-ticks “motion”. Recap kicker “Recap” + gold “card” and returns the same objective. Next-up kicker “Next up” + gold “draw?”. TypeCard cream + gold 6px rail. OverlayLock 30px + seal `1576,24`. Karaoke gold `#C4A35A`. Letterbox. Head docked. Checklist exit 0. `--flip` refused. EDU-S02 dest **untouched** (`eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8`). Locked master dest **untouched** (`d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5`). Other priors untouched (`cab8bd91…` / `27cc5bf3…` / `9f89f9a9…` / `028d16e4…` / `a5d08284…` / `ec88d257…`).

Full-set pointer: [antagonist-full-set.md](./antagonist-full-set.md) `## LessonSpine slate master dest reaudit 2026-09-20`. Encode: [antagonist-lesson-spine-slate-encode.md](./antagonist-lesson-spine-slate-encode.md). Plates: [antagonist-opener-slate.md](./antagonist-opener-slate.md) + [antagonist-talkinghead-slate.md](./antagonist-talkinghead-slate.md) + [antagonist-recapcard-slate.md](./antagonist-recapcard-slate.md) + [antagonist-definitionboard-edu-s02.md](./antagonist-definitionboard-edu-s02.md) + [antagonist-quizbumper-next-up.md](./antagonist-quizbumper-next-up.md) + [antagonist-edu-s01-objective-slate.md](./antagonist-edu-s01-objective-slate.md).

## SOFT notes only

- `EDU-S01` — **PASS** on the locked master
- `EDU-S02` — **PASS** on Opener + TalkingHead + DefinitionBoard + RecapCard + QuizBumper
- `EDU-S03` — olive fixture head, not gesturing A-roll (Cap-blocked; no Cap take)
- `VOX-S05` — OverlayLock 30px lock crop is the pixel proof; 0.5 still downsample can smash title
- Ship 1 HOLD. Ship 6 HOLD. Cleaning stays held.

## Held

No Cap take. No Just remake. No second melt. No live Cleaning / Publish flip. No campus Remotion package. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
