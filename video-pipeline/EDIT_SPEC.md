# Operator edit-spec — Cap + Remotion

Ben lock (18 Sep 2026). Operator-only. Not a campus product.

## Builder

Cap (capture) + Remotion (default long-form) + this edit-spec.

Melt is fallback only if Remotion cannot finish the take.

No new campus UI. No student-facing AI builder. No `/o/:slug/record`. No campus `/api/cap`.

## After ingest / STT

Write this edit-spec. Then run the quality checklist. Auto-flip Notion Asset **Status** to **Cleaning** only on a full pass.

Failures stop the take. Escalate to Chief Decision Maker via CTO / Cursor Gate (`CURSOR_GATE.md`). Do not soft-ship a partial pass.

## Quality checklist

All must pass:

1. `1920x1080`
2. Field School mark (logo overlay, mark text)
3. Full-duration pedagogical chapters (cover 0 → duration, real titles)
4. Cream / ink (`#EFE7D6` / `#1A1A16`)
5. Remotion default
6. Melt fallback only
7. No generic-AI look

## Next real take

Record a **new** Cap Studio take (cam or cam+screen). No titles in Cap.

Do **not** re-render Asset Just (`27pn9xs0zk8a73g`). Do **not** write an Edit spec on Just. Do **not** flip Just.

Do **not** flip an Asset that is already `HLS Ready` back to Cleaning.

Default encode: Remotion 16:9 lesson master in `plates/` / factory Remotion, following `video-pipeline/AGENTS.md` layer law.

Melt HLS only if the Remotion path fails. Single-flight `render.lock`. No second melt.

## Still not authorized

- YCJDT `proposed_chapters` accept
- Publish / Distribute
- Blind Cleaning flip without a checklist pass

## Locks

- CNC vault `2.24.64.248` off limits
- No AUTH_URL flip
- No Remotion MCP
- Made Up master is a different job
