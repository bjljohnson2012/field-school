# CTO / Cursor Gate — Cleaning-on-pass

Operator channel. Not campus UI.

## Pass

After ingest/STT, `writeEditSpec` + `runQualityChecklist`. If every check passes, flip Notion Asset Status to **Cleaning**. Stop there. Do not Publish / Distribute. Do not accept YCJDT `proposed_chapters`.

## Fail

Stop the take. Do not flip Status. Do not soft-ship.

Escalate to **Chief Decision Maker** through this gate. Include cap id, Asset id, and the failed checklist keys.

## Refuse

- Asset Just (`27pn9xs0zk8a73g` / `3c8fe86f6dee8199a716ceec774f0e72`)
- Any Asset already `HLS Ready`
- YCJDT `proposed_chapters` accept (`j013r823wx9ecaf`)
- CNC vault `2.24.64.248`
