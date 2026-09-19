# SceneMotion: glide + takeover

Branch `cursor/prelaunch-scenemotion-glide-takeover`. FieldSchoolLesson under the Remotion edit stack. In-tree standards + Independent Antagonist bar: [remotion-vox-standards.md](./remotion-vox-standards.md).

Landed from Project store `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/docs/remotion-scenemotion-glide-takeover.md`. Constants must match live SceneMotion — do not invent a second bar.

## Words

- **glide** — card from left ~24f, soft opacity, no bounce
- **takeover** — card owns open ~12f, then head eases in from the right

Math (live `video-pipeline/remotion/src/sceneMotionMath.ts`):

```
export const GLIDE_FRAMES = 24;
export const TAKEOVER_HOLD_FRAMES = 12;
export const TAKEOVER_EASE_FRAMES = 18;
export const LUMA_SEC = 0.5;
```

`FieldSchoolLesson.tsx` calls `glideCard(frame)` and `takeoverHead(frame)` (defaults = those constants). Luma 0.5s on **exits** only (`VOX-S06`). Composition: 1920×1080@30 (`Root.tsx` `fps={30}` `width={1920}` `height={1080}`).

## Proof fixture

Non-Just. `src: "fixture"`, `introSec: 0`, 1920×1080@30, 8s. Scenes: takeover `0–4s`, glide `4–8s`. Head is an olive circle on charcoal — not Cap, not Just `27pn9xs0zk8a73g`.

## Proofs (PR 49)

- [PR 49](https://github.com/bjljohnson2012/field-school/pull/49) tip `278586e3a64bf3afd69889e5219d13c51a22a28e`
- Merge on `origin/main`: `ff8acc956659600004debcb81bf96ebbe4e0987f`
- `/opt/cursor/artifacts/scenemotion-fixture/` (`takeover-open.png`, `takeover-head-in.png`, `glide-enter.png`, `glide-settled.png`, `scenemotion-glide-takeover.mp4`)

| Frame | File | What |
|---|---|---|
| 0 | `takeover-open.png` | Card owns; no head |
| 30 | `takeover-head-in.png` | Head eased in right |
| 120 | `glide-enter.png` | Card still entering (opacity 0) |
| 144 | `glide-settled.png` | Type + docked head |
| 0–150 | `scenemotion-glide-takeover.mp4` | Short encode |

Compile proof from that PR: `npx remotion compositions` → `FieldSchoolLesson` 1920×1080@30, 240f / 8.00s. `node video-pipeline/scripts/scene-motion.test.mjs` PASS.

## Locks

No AUTH_URL. No Stripe. No family chrome. No Publish/Distribute. No second melt. No Cap take. No four-model cutover. Do not re-render Just `27pn9xs0zk8a73g`. Do not interfere with `run-d10cce7e`. Do not contact Marketer / Revenue / Product.
