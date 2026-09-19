# Field School plates

Operator-only Remotion compositions. Wave 5 set is complete. Not a campus AI builder.

Antagonist bar (only bar): [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md).

PASS notes:

- [antagonist-opener-recap.md](./antagonist-opener-recap.md) — Opener + RecapCard
- [antagonist-definition-quiz-head.md](./antagonist-definition-quiz-head.md) — DefinitionBoard + QuizBumper + TalkingHeadCard
- [antagonist-full-set.md](./antagonist-full-set.md) — all five

1920×1080@30. `useCurrentFrame` only. Cream / ink / Fraunces. Isolated seal at `1576,24` / `80×64`.
`GLIDE_FRAMES=24` `TAKEOVER_HOLD_FRAMES=12` `TAKEOVER_EASE_FRAMES=18`.

Do not re-render Just `27pn9xs0zk8a73g`. Do not overwrite Aug 30 `vox/everything-made-up.mp4`. No Cap take. No second melt. No Publish/Distribute. No campus Remotion package.

## Catalog

| Composition | Length band | Frames @30 | Motion |
|---|---|---|---|
| **Opener** | 8–12s (default 10s) | 300 | takeover |
| **RecapCard** | 8–12s (default 10s) | 300 | glide |
| **DefinitionBoard** | still + 6s | 180 | still type; head docked |
| **QuizBumper** | 6–8s (default 7s) | 210 | glide |
| **TalkingHeadCard** | 8s docked, not full-bleed | 240 | takeover |

## Render lock

`node scripts/render-plate.mjs` is single-flight. It **refuses** when:

1. melt `render.lock` exists (`MELT_RENDER_LOCK` or `/opt/field-school/edit/render.lock`)
2. `MemAvailable` < 3072 MiB
3. dest or `--cap-id` is Just `27pn9xs0zk8a73g` or Aug 30 `vox/everything-made-up.mp4`

CPU cap `--concurrency=2` (2/4). Dry-run does not encode.

```bash
npm ci
npx remotion compositions
node scripts/render-plate.mjs --comp Opener --dry-run --lock /tmp/absent.render.lock --meminfo /proc/meminfo
node --test scripts/render-lock.test.mjs
```
