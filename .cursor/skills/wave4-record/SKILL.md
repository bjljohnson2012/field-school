---
name: wave4-record
description: Wave 4 text-only until that wave starts. Cap Studio record + plates/ scaffold. Not the Everything Is Made Up master. No Remotion compositions yet.
---

# Wave 4 record

Wave: 4. Text-only until Wave 4 starts. Write code only on branch `cursor/wave-4-record` after `WAVE3.md` proofs pass.

Attach:

- `docs/campus-runtime/CURSOR_WAVES_1_5_SPEC.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`
- `video-pipeline/AGENTS.md`
- `AGENTS.md`

Absorbed branches: none. `madeup-master` stays the existing Everything Is Made Up encode — not this wave.

## When Wave 4 starts

- Cap Studio cam or cam+screen. No titles in Cap. New take only — not Just (`27pn9xs0zk8a73g`)
- Review: STT + chapters + publish to melt to HLS in the player
- Scaffold `plates/` as a separate package:

```
npx create-video@latest --yes --blank plates
cd plates && npm install && npx remotion skills add
```

- Pin `remotion` and `@remotion/*` to the same version (no carets)
- Write `plates/AGENTS.md` layer order: bed, screen, talking-head card, lower third, captions, letterbox, audio
- Remotion MCP is deprecated. Do not install it. Use official Remotion Agent Skills and `/remotion-docs`

## Do not (now)

- Create `plates/`, install Remotion, or write compositions
- Re-render Just or start a second melt
- Encode the Made Up master from this skill
- Flip `AUTH_URL` or touch CNC vault `2.24.64.248`
