---
name: Factory lock
description: Factory lock — Just 27pn9xs0zk8a73g, melt render.lock, cap + edit health
---

# Factory lock

Wave: 1 keep-alive (patch only if proofs fail).

Attach:

- `AGENTS.md`
- `docs/campus-runtime/WAVE1.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`
- `video-pipeline/AGENTS.md`

Absorbed branches (stop using separately):

- `cursor/deploy-cap-f146`

## Own

- Asset Just Cap id `27pn9xs0zk8a73g` is locked. Do not `/trigger` or re-render it
- Melt is single-flight: `/opt/field-school/edit/render.lock`. Refuse under 3072 MiB `MemAvailable`
- After deploy, curl cap login and `https://edit.fieldschool.ai/health`

## Do not

- Touch CNC vault `2.24.64.248`
- Start Wave 4/5 plates or a second melt from this skill
- Flip `AUTH_URL` or deploy TanStack
