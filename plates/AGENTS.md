# Field School plates

Operator Remotion package. Not campus UI. Not a student AI builder.

Wave 4 is the blank scaffold plus remotion skills. Wave 5 adds the five short plates (Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard).

The next **real** Cap take (not Just) uses Remotion as the default long-form engine. Melt is fallback only. See `video-pipeline/EDIT_SPEC.md`.

## Layer order

Later siblings sit on top. Do not invent z-index.

1. bed
2. screen
3. talking-head card
4. lower third
5. captions
6. letterbox
7. audio

Factory hour-spine law (bed, B-roll, Vox, head, karaoke) stays in `video-pipeline/AGENTS.md`.

## Locks

- Pin `remotion` and `@remotion/*` to the same version. No carets.
- Use `npx remotion skills add` and `/remotion-docs`. Do not install Remotion MCP.
- Do not re-render Asset Just (`27pn9xs0zk8a73g`).
- Cleaning-on-pass only: after ingest/STT, write the Edit spec, run the quality checklist, flip Status to Cleaning only on a full pass. Failures stop the take and escalate via `video-pipeline/CURSOR_GATE.md`.
- Do not accept YCJDT `proposed_chapters` or Publish/Distribute.
- Plate jobs wait if factory `render.lock` exists or MemAvailable < 3072 MiB.
