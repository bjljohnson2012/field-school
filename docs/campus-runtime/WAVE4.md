# Wave 4 proof — operator Cap + Remotion + Cleaning-on-pass

2026-09-18

Branch `cursor/wave-4-record` off `origin/main`.

Ben lock: AI video builder = Cap + Remotion + Edit-spec only. Operator-only. No new campus UI. No student-facing AI builder. Remotion is default long-form. Melt is fallback only.

Cleaning-on-pass is authorized. After ingest/STT, write the Edit spec, run the product-locked six-point checklist, auto-flip Status to Cleaning only when all six pass. Fail any → hold + escalate to Chief Decision Maker via CTO/Cursor Gate. Do not soft-ship.

## Do not

- Add `/o/:slug/record`, `/o/:slug/watch`, or campus `/api/cap`
- Re-render Asset Just (`27pn9xs0zk8a73g`)
- Accept YCJDT `proposed_chapters`
- Flip Cleaning without a six-item pass
- Invent a seventh checklist item
- Publish / Distribute
- Flip `AUTH_URL` or 301 university
- Touch CNC vault `2.24.64.248`
- Install Remotion MCP
- Encode Everything Is Made Up

## Ship

- `plates/` blank Remotion package, remotion `4.0.526` pinned (no carets), `MyComp` 1920×1080
- `npx remotion skills add` → `plates/.agents/skills/`
- `plates/AGENTS.md` layer order
- `video-pipeline/EDIT_SPEC.md` + `video-pipeline/CURSOR_GATE.md` + `video-pipeline/next-take.mjs`

## Proof

| Check | Result |
|---|---|
| No campus record/watch/cap API | pass — paths absent |
| Guest `/api/me` still guest | pass — live `{"authenticated":false,"guest":true}` |
| Guest POST `/api/events` 401 | pass — live 401 |
| Just not re-rendered | pass — Just Status still `HLS Ready`; no `/trigger` |
| Cleaning-on-pass | pass — fixture flip to Cleaning only when all six locked checks pass |
| Checklist fail | pass — hold + escalate CDM; Status unchanged |
| Just refuse | pass — skip_just; no Status write |
| Propose leftovers | pass — remotion_just fails; no Cleaning |
| YCJDT `proposed_chapters` | pass — still not authorized |
| Publish / Distribute | pass — still not authorized |
| Remotion compositions list | pass — `MyComp` 1920×1080 |
| cap.fieldschool.ai/login | pass — HTTP 200 |
| edit.fieldschool.ai/health | pass — HTTP 200 |
| AUTH_URL not flipped | pass |

No new Cap take at Review this run. Assets on the board: Just and You Can Just Do Things, both `HLS Ready`. Neither was flipped.

No campus deploy for this SHA.
