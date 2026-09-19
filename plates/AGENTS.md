# Field School plates (Remotion)

Operator-only. Cap + Remotion + Edit-spec. Not a campus or student product.
Not the factory hour-master melt path except as fallback.

This round owns **Opener** and **RecapCard** only. Remotion is default. Melt fallback only. Do not re-render Asset Just (`27pn9xs0zk8a73g`).

Do not add campus UI. Do not add a student-facing AI builder. Do not campus-package Remotion into `app/`. Do not accept Cleaning flip or Publish/Distribute from this package.

Independent Antagonist bar (only bar): [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md).

## Compositions

Opener 8–12s, RecapCard 8–12s. 1920×1080@30. Cream `#EFE7D6` / ink `#1A1A16` / gold `#C4A35A` / Fraunces. Isolated seal lock `80×64` at `x=1576 y=24`.
Motion: `useCurrentFrame` + `interpolate` / SceneMotion math only. No CSS keyframes. No 9:16 pack. No Remotion Lambda. No Remotion MCP.

SceneMotion constants (must match `video-pipeline/remotion/src/sceneMotionMath.ts`): `GLIDE_FRAMES=24`, `TAKEOVER_HOLD_FRAMES=12`, `TAKEOVER_EASE_FRAMES=18`.

## Layer order

Later sibling sits on top. No z-index.

1. bed
2. screen
3. talking-head card
4. lower third
5. captions
6. letterbox
7. audio

Dock the talking-head card to ~38% width (`dock-right` or `dock-left`). Never full-bleed over type.

## Render

Wait if melt `render.lock` exists or MemAvailable < 3072 MiB.
`--concurrency=1`. Refuse Asset Just `27pn9xs0zk8a73g`.

```
npx remotion compositions
npx remotion still Opener --frame=30
npx remotion still RecapCard --frame=144
```
