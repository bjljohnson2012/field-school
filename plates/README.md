# Field School plates

Operator-only Remotion compositions. Wave 5 set is complete. Not a campus AI builder.

Antagonist bar (only bar): [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md).

PASS notes:

- [antagonist-opener-recap.md](./antagonist-opener-recap.md) — Opener + RecapCard
- [antagonist-definition-quiz-head.md](./antagonist-definition-quiz-head.md) — DefinitionBoard + QuizBumper + TalkingHeadCard
- [antagonist-full-set.md](./antagonist-full-set.md) — all five
- [antagonist-lesson-spine.md](./antagonist-lesson-spine.md) — LessonSpine (sting / slate / objective / recap / next-up)
- [antagonist-captions-lower-third.md](./antagonist-captions-lower-third.md) — CaptionsBand + LowerThird
- [antagonist-lesson-spine-reencode-captions.md](./antagonist-lesson-spine-reencode-captions.md) — LessonSpine re-encode with captions/LT
- [antagonist-letterbox-layer.md](./antagonist-letterbox-layer.md) — Letterbox (after captions, before audio)
- [antagonist-soft-polish-vox-s05.md](./antagonist-soft-polish-vox-s05.md) — OverlayLock + TypeCard VOX-S05 polish

1920×1080@30. `useCurrentFrame` only. Cream / ink / Fraunces. Isolated seal at `1576,24` / `80×64`.
`GLIDE_FRAMES=24` `TAKEOVER_HOLD_FRAMES=12` `TAKEOVER_EASE_FRAMES=18`.

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

Do not re-render Just `27pn9xs0zk8a73g`. Do not overwrite Aug 30 `vox/everything-made-up.mp4`. No Cap take. No second melt. No Publish/Distribute. No campus Remotion package. Encode only to a new dated dest (see [encode-lesson-spine.md](./encode-lesson-spine.md)). Captions/lower-third re-encode: [encode-lesson-spine-reencode-captions.md](./encode-lesson-spine-reencode-captions.md).

## Catalog

| Composition | Length band | Frames @30 | Motion |
|---|---|---|---|
| **Opener** | 8–12s (default 10s) | 300 | takeover |
| **RecapCard** | 8–12s (default 10s) | 300 | glide |
| **DefinitionBoard** | still + 6s | 180 | still type; head docked |
| **QuizBumper** | 6–8s (default 7s) | 210 | glide |
| **TalkingHeadCard** | 8s docked, not full-bleed | 240 | takeover |
| **LessonSpine** | 41s fixture (10+8+6+10+7) | 1230 | Opener → TalkingHeadCard → DefinitionBoard → RecapCard → QuizBumper |
| **LowerThirdDemo** | 8s craft | 240 | takeover head + lower third |
| **CaptionsDemo** | 8s craft | 240 | lower third then captions band |
| **LetterboxDemo** | 8s craft | 240 | captions then letterbox close-in |

## Render lock

`node scripts/render-plate.mjs` is single-flight. It **refuses** when:

1. melt `render.lock` exists (`MELT_RENDER_LOCK` or `/opt/field-school/edit/render.lock`)
2. `MemAvailable` < 3072 MiB
3. dest or `--cap-id` is Just `27pn9xs0zk8a73g` or Aug 30 `vox/everything-made-up.mp4`

CPU cap `--concurrency=2` (2/4). Dry-run does not encode.

```bash
npm ci
npx remotion compositions
node scripts/render-plate.mjs --comp LessonSpine --dry-run --lock /tmp/absent.render.lock --meminfo /proc/meminfo
node --test scripts/render-lock.test.mjs scripts/plates-bar.test.mjs scripts/lesson-spine.test.mjs scripts/captions-lower-third.test.mjs scripts/letterbox-layer.test.mjs scripts/soft-polish-vox-s05.test.mjs
node scripts/cleaning-checklist-lesson-spine.mjs --dest /opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4
```

## Cleaning checklist (no live flip)

`node scripts/cleaning-checklist-lesson-spine.mjs` scores the dated LessonSpine dest against [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md) + ship 1–6.

- exit **0** = antagonist HARD gates PASS
- exit **1** = HARD_FAIL — hold Cleaning
- `--flip` is refused (exit 2)

Evidence: [cleaning-checklist-lesson-spine.md](./cleaning-checklist-lesson-spine.md).

Future Cleaning auto-flip **must** call this script first. Flip only when exit 0 **and** ship 1–6 are green. This package **never flips** Cap / Notion / Publish / Distribute.

Campus gate (approve/reject only, no player rail): [`app/db/0012_plate_renders.sql`](../app/db/0012_plate_renders.sql) + [`docs/campus-runtime/PLATE_RENDERS.md`](../docs/campus-runtime/PLATE_RENDERS.md). Teacher `GET/POST /api/plates` after checklist PASS. First live Cleaning auto-flip is a later seal when ship 1 and ship 6 can go green.
