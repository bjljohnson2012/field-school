# Plate renders gate (0012)

Approve/reject gate only. **No live Cleaning flip. No Publish/Distribute.**

SQL: [`app/db/0012_plate_renders.sql`](../../app/db/0012_plate_renders.sql)

API (signed-in only; guest is 401):

- `GET /api/plates` — list, org-scoped. Rejected rows hidden from learners.
- `POST /api/plates` — teacher registers a dest (pending).
- `POST /api/plates/approve` — teacher approve.
- `POST /api/plates/reject` — teacher reject. Rejected plates never appear to learners.

No Cap media column. Dest must not be Just `27pn9xs0zk8a73g` or Aug 30 `vox/everything-made-up.mp4`.

## Checklist → future Cleaning auto-flip

1. Encode through `plates/scripts/render-plate.mjs` (render-lock).
2. Score with `plates/scripts/cleaning-checklist-lesson-spine.mjs` (exit 0 PASS).
3. Teacher approve here (`plate_renders.status=approved`).
4. **Later seal:** a factory caller may flip Cleaning only when checklist exit 0 **and** ship 1–6 are green. Ship 1 (Cap A-roll) and ship 6 (Publish/HLS) are still HOLD. This gate never flips Cap / Notion / Publish.

Bar: [`docs/remotion-vox-standards.md`](../remotion-vox-standards.md).

## Play-rail Cleaning auto-flip + Publish Ready/HLS

Narrow later seal. Caller [`plates/scripts/cleaning-auto-flip-play-rail.mjs`](../../plates/scripts/cleaning-auto-flip-play-rail.mjs) flips `hold_cleaning` for `/play/lesson-spine` only after checklist PASS on locked dest `af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4`. The 0012 gate and `cleaning-checklist-lesson-spine.mjs --flip` still never flip. `cleaningAutoFlipReady` stays false when shipGreen is false. Publish Ready/HLS is [`app/scripts/publish-lesson-spine-hls.mjs`](../../app/scripts/publish-lesson-spine-hls.mjs) from the campus archive copy. Operator polish evidence is `GET /api/media/lesson-spine/publish` plus `/operator/publish`. Distribute stays HELD.
