# LessonSpine Cleaning checklist

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar.

**Checklist only. NO live Cleaning flip. NO Publish/Distribute.**

```
verdict: PASS
hold_cleaning: true
auto_flip: false
escalate: false
rendering: /opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4
sha256: 9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f
```

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up

## Future auto-flip hook

`node scripts/cleaning-checklist-lesson-spine.mjs --dest <dated-LessonSpine.mp4>`

- exit **0** = antagonist HARD gates PASS
- exit **1** = HARD_FAIL — hold Cleaning
- This script **refuses** `--flip`. A later factory caller may flip Cleaning only when exit 0 **and** ship 1–6 are green. Publish/Distribute stays held.

## Ship 1–6

| # | Status | Note |
|---|---|---|
| 1 | HOLD | no Cap take this fixture |
| 2 | PASS | spine beats cover 0…41s |
| 3 | PASS | overlay lock |
| 4 | PASS | cream/ink/Fraunces + head |
| 5 | PASS | duration + Just locked |
| 6 | HOLD | HLS Ready / Publish held |

Ship green: false. Fixture has no Cap take and no HLS Ready, so Cleaning stays held even on antagonist PASS.

## HARD gates

| ID | Status | Note |
|---|---|---|
| `VOX-H01` | PASS | 1920x1080 30/1 h264 41s |
| `VOX-H02` | PASS | seal lock 1576,24 80×64 + YCJDT title |
| `VOX-H03` | PASS | cream / ink / gold / Fraunces |
| `VOX-H04` | PASS | dock 38%, HeadDock, not full-bleed |
| `VOX-H05` | PASS | duration 41 vs 41s / 1230f |
| `VOX-H06` | PASS | dated dest /opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4 |
| `VOX-H07` | PASS | no CapCut / CSS timers |
| `VOX-H08` | PASS | karaoke + captions.json path |
| `VOX-H09` | PASS | Remotion dest exists via render-plate |
| `VOX-H10` | PASS | no campus Remotion package |
| `RM-H01` | PASS | R7 useCurrentFrame |
| `RM-H02` | PASS | LessonSpine calculateMetadata 1230 |
| `RM-H03` | PASS | Img + staticFile |
| `RM-H04` | PASS | Fraunces latin |
| `RM-H05` | PASS | no uncleared delayRender |
| `RM-H06` | PASS | deterministic frames |
| `RM-H07` | PASS | no Cap A-roll on fixture (clock is captions) |
| `RM-H08` | PASS | LessonSpine registered |
| `RM-H09` | PASS | encoded 9f89f9a9a896… |
| `RM-H10` | PASS | calculateMetadata once |
| `RM-H11` | PASS | karaoke/layout memo path present |
| `RM-H12` | PASS | font subsets latin |
| `EDU-H01` | PASS | one plate per beat |
| `EDU-H02` | PASS | type + docked head |
| `EDU-H03` | PASS | ink/cream |
| `EDU-H04` | PASS | captions.json path |
| `EDU-H05` | PASS | word clock on each beat |
| `EDU-H06` | PASS | beats 6–10s |
| `EDU-H07` | PASS | 41s < 6:00 |
| `EDU-H08` | PASS | 41s < 12:00 |
| `EDU-H09` | PASS | gold signal + glide/takeover |
| `EDU-H10` | PASS | head + Khan-style motion |

## Held

No Cap take. No Just remake. No melt. No live Cleaning flip. No Publish/Distribute. No campus Remotion package. No family chrome. No `bc-4765f2f0`.
