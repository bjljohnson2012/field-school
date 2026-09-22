# Track B full-path antagonist audit

verdict: SOFT_FAIL
bar: v2
hold_cleaning: false
escalate: false
rendering: idle

The clock asked for bar v2.1. `docs/remotion-vox-standards.md` says Independent Antagonist bar v2 is the only bar. This audit scores v2. It does not invent a second bar.

This is a fixture dry run. It does not write master.mp4. It does not take a Cap. It does not render on the GPU. Remotion stays in `plates/`. `distribute` stays false.

Every hard gate is PASS. Soft notes remain, so the verdict is SOFT_FAIL. Those notes do not block cleaning. Dest is not flipped. This is not a public ship.

## Path

| Node | Result | Evidence |
|---|---|---|
| plan | PASS | Fixture audio, four plates, dest name ends `master.mp4`, target `plates`, renders false. |
| captions | PASS | Three fixture words. One leading space. Times in milliseconds. Speaker dropped. |
| plates | PASS | Opener, TalkingHead, RecapCard, and QuizBumper share that clock. |
| master | PASS | `TrackBMaster` is 1050 frames at 30fps, 1920×1080. Order is Opener, TalkingHead, RecapCard, QuizBumper. |
| export-ready | PASS | Dry-run checklist matches manifest, duration, and plate order. Nothing is written. |
| cleaning | PASS | The four hard gates are clear, so they do not escalate-block cleaning. The checklist can auto-flip. Dest is not flipped. |
| publish | PASS | Publish evidence keeps `distribute` false, `public` false, and `dest_flipped` false. That lock holds. It is not a ship. |

The five-gate fixture audit (`VOX-H01`, `VOX-H05`, `VOX-H06`, `VOX-H08`, `VOX-H10`) is still PASS. That narrower pass is not this verdict.

## Hard gates

| ID | Result | Evidence |
|---|---|---|
| VOX-H01 | PASS | Spec is 1920×1080 at 30fps. Dest name ends `master.mp4`. No file is sold as the master. |
| VOX-H02 | PASS | Title “You Can Just Do Things”. Seal `80×64` at `1576,24`. Seal is `Img` plus `staticFile`. |
| VOX-H03 | PASS | Cream `#EFE7D6`, ink `#1A1A16`, Fraunces from `@remotion/google-fonts`. Marketing cream is absent. |
| VOX-H04 | PASS | Head dock is 700px, 36.46% of 1920. Type card ends at x=1112. Dock-right starts at x=1160. |
| VOX-H05 | PASS | Plates cover frame 0 through 1050 with no gap. Duration is 35s. |
| VOX-H06 | PASS | Just `27pn9xs0zk8a73g` is not the cap id. Planned dest is absent. Dest is not flipped. |
| VOX-H07 | PASS | Plates use takeover or glide. Motion is smoothstep, with no bounce. |
| VOX-H08 | PASS | Fixture word clock is on all four plates through `Karaoke`. Phrases are not empty. |
| VOX-H09 | PASS | No melt is claimed. `renders` is false. |
| VOX-H10 | PASS | Target is `plates`. Remotion is not a Next dependency. |
| RM-H01 | PASS | The four plates call `useCurrentFrame`. No CSS `transition`, `animation`, or `animate-` in the scored sources. |
| RM-H02 | PASS | `TrackBMaster` is registered at 1050 frames, 30fps, 1920×1080. Duration is fixed, not a zero metadata result. |
| RM-H03 | PASS | Seal and bed use `Img` / `Audio` and `staticFile`. No raw `<img>`. |
| RM-H04 | PASS | Fraunces, IBM Plex Sans, and Source Serif 4 load through `@remotion/google-fonts`. |
| RM-H05 | PASS | No `delayRender` on this path. |
| RM-H06 | PASS | No `Math.random()`. |
| RM-H07 | PASS | `TrackBMaster` mounts `track-b-fixture.wav` on `<Audio>` with `trimBefore={0}` inside a sequence from frame 0. |
| RM-H08 | PASS | Root registers `id="TrackBMaster"`. |
| RM-H09 | PASS | Dest is missing and `written` is false. The dry run does not sell a finished master. |
| RM-H10 | PASS | No per-frame `fetch` or `delayRender`. |
| RM-H11 | PASS | No `measureText`. The caption clock is wrapped in `useMemo`. |
| RM-H12 | PASS | Three `latin` subsets. Weights are 700, 400/500, and 400. |
| EDU-H01 | PASS | Opener, RecapCard, and QuizBumper each keep one beat: the type card. Catalog claim cards are not mounted on those plates. |
| EDU-H02 | PASS | The type card and the head dock are the plate. Extra catalog cards are not on that beat. |
| EDU-H03 | PASS | Ink on cream contrast is 14.19, above 4.5:1. |
| EDU-H04 | PASS | Fixture captions are the captions path. |
| EDU-H05 | PASS | The three words start inside the first seconds of each plate, while the type card is on screen. |
| EDU-H06 | PASS | Plate lengths are 10s, 8s, 10s, and 7s. Each is between 3s and 40s, in four segments. |
| EDU-H07 | PASS | The master is 35s, under 6 minutes. |
| EDU-H08 | PASS | The master is under 12 minutes and has four on-screen segments. |
| EDU-H09 | PASS | Gold signaling stays. The extra catalog claims are off Opener, RecapCard, and QuizBumper. |
| EDU-H10 | PASS | TalkingHead uses HeadDock takeover plus a type card. It is not slides-only. |

## Soft notes

These notes are why the verdict is SOFT_FAIL. They do not restore a hard fail.

| ID | Result | Note |
|---|---|---|
| VOX-S04 | SOFT_FAIL | Live type cards. No Ernest plate PNG. |
| RM-S03 | SOFT_FAIL | Sequences have no `premountFor`. |
| RM-S04 | SOFT_FAIL | No Remotion benchmark on this dry run. |
| RM-S08 | SOFT_FAIL | No `remotion still` frame. The clock prefers a fixture dry run over a GPU render. |
| EDU-S03 | SOFT_FAIL | The head is a dock fixture, not gesturing A-roll. No Cap take on this clock. |

QuizBumper is 7s. The plate constant `MIN_PLATE_SEC` is 8. `EDU-H06` fails under about 3s, so 7s is not a hard gate.

## Locks

Launch stays CLOSED 0/8. Dest stays untouched. Just stays locked. Distribute stays HELD. Cleaning is not escalate-blocked by RM-H07, EDU-H01, EDU-H02, or EDU-H09.
