# YCJDT pass-2 Remotion scenes

Operator-only. Cap `j013r823wx9ecaf` / Asset `3c9fe86f6dee81299337e318cfef6982`. Remotion default. Melt fallback only.

JSON: `video-pipeline/briefs/ycjdt-pass2-remotion-scenes.json`

## Spec delta (authorizes a new encode)

Pass-1 / existing vox master (`everything-made-up.mp4`, 664.6s) used spring|interpolate only. This pass extends `SceneMotion` with:

- **glide** — cream type card from the left over ~24 frames, soft opacity, no bounce
- **takeover** — cream card owns the open ~12 frames, then the head eases in from the right

Wire the ten Ernest cards. Overlay title **You Can Just Do Things** at `1576,24` (logo `80×64`). Luma 0.5s stands between scenes. No SFX / music. VO stays on the A-roll.

Do not overwrite `vox/everything-made-up.mp4`. Encode dest: `hls/j013r823wx9ecaf/remotion/pass2-scenes.mp4`. Just `27pn9xs0zk8a73g` stays locked. Publish/Distribute held.

## Motion map

| start | chapter | motion |
|---|---|---|
| 0 | The Waiting Trap | takeover |
| 25 | You Can Just Do Things | glide |
| 45 | Made Up Is Not Fake | takeover |
| 75 | Authored Rules Have Consequences | glide |
| 105 | Contrast With Natural Laws | takeover |
| 130 | That's How We've Always Done It | glide |
| 234 | Ask Five Questions | takeover |
| 370 | The 60 Days | glide |
| 503 | Two Sides | takeover |
| 595 | God's Law or a Memo | glide |

Last out `651.878`. `cuts` and `chapters[]` stay empty. Cards cream `#EFE7D6` / ink `#1A1A16` / Fraunces. Head docked right (~36% width), type left.

## Cleaning

Six-point checklist at `docs/auto-quality-checklist.md` still gates Cleaning. Fail any → stop and escalate. Do not soft-ship.
