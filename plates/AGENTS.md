# Field School plates (Remotion)

Operator-only. Cap + Remotion + Edit-spec. Not a campus or student product.
Not the factory hour-master melt path except as fallback.

Wave 5 owns the five compositions. Remotion is default long-form for the next real Cap take. Melt fallback only. Do not re-render Asset Just (`27pn9xs0zk8a73g`).

Do not add campus UI. Do not add a student-facing AI builder. Do not accept YCJDT `proposed_chapters`, Cleaning flip, or Publish/Distribute from this package.

## Compositions

Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard.
1920×1080, 30fps. Cream `#EFE7D6` / ink `#1A1A16`. Field School lockup on every plate.
No generic-AI cards, gold pills, or cinema letterbox. No 9:16 pack. No Remotion Lambda.
Cleaning auto-flips only when the sibling checklist passes. Publish/Distribute stay held.

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

`node scripts/render-plate.mjs` waits if melt `render.lock` exists or MemAvailable < 3072 MiB.
CPU cap `--concurrency=2` (2/4). Refuse Asset Just `27pn9xs0zk8a73g`.

```
npx remotion compositions
npx remotion render RecapCard --concurrency=2 --frames=0-30
```

Do not install Remotion MCP. Skills: `/remotion-best-practices` `/remotion-markup` `/remotion-studio` `/remotion-render` `/remotion-docs` `/remotion-captions`.
