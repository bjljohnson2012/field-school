---
name: wave5-plates
description: Wave 5 text-only until that wave starts. Five Remotion plate compositions only. Not hour-long masters and not the Made Up encode.
---

# Wave 5 plates

Wave: 5. Text-only until Wave 5 starts. Write code only on branch `cursor/wave-5-plates` after `WAVE4.md` proofs pass.

Attach:

- `docs/campus-runtime/CURSOR_WAVES_1_5_SPEC.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`
- `plates/AGENTS.md` (written in Wave 4)
- Remotion docs: https://www.remotion.dev/docs/ai/ https://www.remotion.dev/docs/ai/skills https://www.remotion.dev/docs/ai/cursor-plugin

Absorbed branches: none. `madeup-master` is not Wave 5.

## When Wave 5 starts

- Invoke `/remotion-best-practices` `/remotion-markup` `/remotion-studio` `/remotion-render` `/remotion-docs` `/remotion-captions`
- Compositions only: Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard
- 1920x1080 30fps. 6-12s or a still. No hour-long master. No 9:16 social pack
- `0006_plates.sql` `plate_renders`. Teacher approve/reject. Rejected plates never appear
- Player: plate rail + chapter markers + check-yourself quiz citing `source_unit_id`
- VPS render waits on melt `render.lock` or `MemAvailable` < 3072 MiB. CPU cap 2/4
- Papers/voice/video STT nudge Bearing with step 0.15. A new Pattern run resets. Parent can lock a child profile

## Do not (now)

- Write plate compositions or `0006_plates.sql`
- Install Remotion MCP
- Encode hour-long masters or the Made Up show
- Flip `AUTH_URL` or touch CNC vault `2.24.64.248`
