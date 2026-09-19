# FieldSchoolLesson SceneMotion

Operator Remotion edit stack. `SceneMotion` words:

- **glide** — cream type card from the left ~24f (`GLIDE_FRAMES`), soft opacity, no bounce
- **takeover** — card owns the open ~12f (`TAKEOVER_HOLD_FRAMES`), then the head eases in from the right (`TAKEOVER_EASE_FRAMES=18`)

Legacy: `spring` | `interpolate`. Luma 0.5s on scene **exits** only.

Proof composition is a non-Just fixture (`src: "fixture"`, `introSec: 0`). Do not re-render Just `27pn9xs0zk8a73g`.

In-tree operator docs (copy/align; do not invent a second bar):

- [Remotion VOX standards + Independent Antagonist bar](../../docs/remotion-vox-standards.md)
- [SceneMotion glide / takeover constants + PR 49 fixture proofs](../../docs/remotion-scenemotion-glide-takeover.md)
