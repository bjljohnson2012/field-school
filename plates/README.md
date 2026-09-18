# Field School plates

Operator-only Remotion compositions. Cap + Remotion + Edit-spec. Not a campus AI builder.

Compositions: Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard.

Remotion is default long-form for the next real Cap take. Melt fallback only. Do not re-render Asset Just (`27pn9xs0zk8a73g`).

```bash
npm i
npx remotion compositions
npx remotion studio --no-open
node scripts/render-plate.mjs --comp RecapCard --dry-run
```

Render waits if melt `render.lock` exists or MemAvailable < 3072 MiB.
