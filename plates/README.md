# Field School plates

Operator-only Remotion compositions. Wave 5 this round: **Opener** + **RecapCard**.

Antagonist bar (only bar): [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md).

1920×1080@30. Length band 8–12s. `useCurrentFrame` only. Cream / ink / Fraunces. Isolated seal at `1576,24` / `80×64`.

Not a campus AI builder. Do not re-render Just `27pn9xs0zk8a73g`. No Cap take. No second melt. No Publish/Distribute.

```bash
npm ci
npx remotion compositions
npx remotion still Opener --frame=30 --gl=swangle
npx remotion still RecapCard --frame=144 --gl=swangle
```

Render waits if melt `render.lock` exists or MemAvailable < 3072 MiB.
