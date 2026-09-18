---
name: Wave 4 Cap record
description: Wave 4 operator Cap + Remotion. No campus video builder UI.
---

# Wave 4 Cap record

Wave: 4. Branch `cursor/wave-4-record` off `origin/main`.

Ben lock: Cap + Remotion + Edit-spec only. Operator-only. No new campus UI. No student-facing AI builder. Remotion is default long-form for the next real Cap take. Melt is fallback only.

Cleaning-on-pass is authorized. After ingest/STT, write the Edit spec, run the product-locked six-point checklist, auto-flip Status to Cleaning only when all six pass. Fail any → hold + escalate. Do not soft-ship. Do not invent a seventh item.

Attach:

- `docs/campus-runtime/CURSOR_WAVES_1_5_SPEC.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`
- `video-pipeline/AGENTS.md`
- `video-pipeline/EDIT_SPEC.md`
- `video-pipeline/CURSOR_GATE.md`
- `AGENTS.md`

Absorbed branches: none. Not the Everything Is Made Up master.

## Do

- Scaffold `plates/` blank + `npx remotion skills add`
- Pin remotion versions, no carets
- Next real Cap take (not Just) → Remotion first
- Cleaning-on-pass after checklist

## Do not

- Campus `/o/:slug/record` or student AI builder
- Re-render Just (`27pn9xs0zk8a73g`)
- YCJDT `proposed_chapters` accept, Publish/Distribute
- Blind Cleaning flip without a pass
- Flip `AUTH_URL` or touch CNC vault `2.24.64.248`
- Write Wave 5 plate compositions
