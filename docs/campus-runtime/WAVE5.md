# Wave 5 — Remotion plates

2026-09-18

Operator-only. Five compositions in `plates/`. No campus UI. No student-facing AI builder.

Rebased onto live reviewed chrome `7618b2daea4f7a2cf1892e51c2740d6e3cae37b0` so the pinned Pattern loader (`app/src/lib/pattern/load-bank.ts`) ships. Do not rebase this tip back onto `origin/main` (hardcoded `FP50_ITEMS`). Do not rebase onto `24b6749` until that SHA is live.

Ben lock: Cap + Remotion + Edit-spec only. Remotion is default long-form for the next real Cap take. Melt fallback only. Do not re-render Asset Just (`27pn9xs0zk8a73g`). Not authorized: YCJDT `proposed_chapters` accept, Cleaning flip, Publish/Distribute.

## Ship

| Piece | Where |
|---|---|
| Compositions | `plates/src/Root.tsx` — Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard at 1920×1080 30fps |
| Layer law | `plates/AGENTS.md` — bed, screen, talking-head card, lower third, captions, letterbox, audio |
| Render gate | `plates/scripts/render-plate.mjs` — melt `render.lock`, MemAvailable < 3072, Just refused |

## Not this wave

Campus `/o/:slug/teach/plates`, welcome player rail, `/api/plates`, `0006_plates.sql`. Those were stripped after the lock.

## Proofs

| Check | Result |
|---|---|
| `npx remotion compositions` lists the five IDs | PASS locally — 1920×1080 30fps |
| No campus plate UI | PASS — no `plate-rail`, no `teach/plates`, no `/api/plates` |
| Melt lock blocks plate job | PASS — `{"error":"melt_lock"}` exit 75 |
| Just id refused | PASS — exit 2 |
| Face docked not full-bleed | PASS still — TalkingHeadCard dock-right ~38% |
| Cream/ink + Field School mark | PASS — lockup on cream `#EFE7D6`, ink `#1A1A16`, no generic card |
| Guest Grok Bot + guest POST `/api/events` 401 | PASS source |
| Item-bank loader | `load-bank.ts` present; `items.ts` calls `loadPinnedBank()`; no hardcoded `FP50_ITEMS` |
| AUTH_URL still university | PASS — this SHA does not flip AUTH_URL |
| cap + edit health | Not hit this turn (no deploy) |

## Commands

```bash
cd plates && npm test && npx remotion compositions
cd app && npm test -- scripts/plates.test.mjs
node plates/scripts/render-plate.mjs --dry-run --comp RecapCard --lock /tmp/render.lock
```

Deploy only after four-model hotfix PASS on this SHA. Do not flip AUTH_URL.
