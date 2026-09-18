# Operator edit-spec — Cap + Remotion

Ben lock (18 Sep 2026). Operator-only. Not a campus product.

## Builder

Cap (capture) + Remotion (default long-form) + this edit-spec.

Melt is fallback only if Remotion cannot finish the take.

No new campus UI. No student-facing AI builder. No `/o/:slug/record`. No campus `/api/cap`.

## After ingest / STT

Write this edit-spec. Then run the **product-locked six-point** checklist. Auto-flip Notion Asset **Status** to **Cleaning** only when all six pass.

Fail any item → hold the take and escalate to Chief Decision Maker via CTO / Cursor Gate (`CURSOR_GATE.md`). Do not soft-ship.

## Quality checklist (six only)

Product lock. Do not add a seventh item.

1. Cap take + transcript / title / summary on Asset
2. Chapters cover full duration
3. Overlay logo + title match lock
4. Cards cream / ink / Fraunces; head clear zone
5. Remotion master duration matches; no propose leftovers; Just locked until Ready
6. HLS Ready, then raw may drop

Machine keys: `cap_take_copy`, `chapters_cover`, `overlay_lock`, `cards_head`, `remotion_just`, `hls_then_raw`.

Overlay lock: logo `/opt/field-school/edit/brand/logo.png`, `x=1576 y=24 w=80 h=64`, title matches Asset title. Cards `#EFE7D6` / `#1A1A16` / Fraunces. Head docked, width ≤ 0.38, not full-frame. Item 6 at Review: raw stays. After HLS Ready, raw may drop.

## Next real take

Record a **new** Cap Studio take (cam or cam+screen). No titles in Cap.

Do **not** re-render Asset Just (`27pn9xs0zk8a73g`). Do **not** write an Edit spec on Just. Do **not** flip Just.

Default encode: Remotion 16:9 lesson master in `plates/` / factory Remotion, following `video-pipeline/AGENTS.md` layer law.

Melt HLS only if the Remotion path fails. Single-flight `render.lock`. No second melt.

## Still not authorized

- YCJDT `proposed_chapters` accept
- Publish / Distribute
- Blind Cleaning flip without a six-item pass

## Locks

- CNC vault `2.24.64.248` off limits
- No AUTH_URL flip
- No Remotion MCP
- Made Up master is a different job
