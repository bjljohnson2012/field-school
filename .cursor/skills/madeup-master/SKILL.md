---
name: madeup-master
description: Factory encode for the existing Everything Is Made Up Remotion master only. Not Wave 4 plates scaffold and not Wave 5 compositions.
---

# Made Up master

Wave: factory (not Wave 4, not Wave 5). Existing Everything Is Made Up encode only.

Attach:

- `video-pipeline/AGENTS.md`
- `AGENTS.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`

Absorbed branches: none. Do not fold this into `wave4-record` or `wave5-plates`.

## Own

- `EverythingMadeUp` master at `vault/fieldschool-edit/remotion` and `/opt/fieldschool-edit/remotion`
- Face-centered `head.mp4` via `chase_face.py`; keep the 60s clip
- Publish HLS to `https://cap.fieldschool.ai/hls/j013r823wx9ecaf/vox/everything-made-up.mp4`
- SSH campus/edit VPS `2.24.70.248` with `/home/ubuntu/.ssh/vps_deploy`
- Load Remotion skills only for this existing show: `remotion-best-practices`, `remotion-render`, `remotion-markup`

## Do not

- Scaffold `plates/` or write Wave 5 compositions
- Touch CNC vault `2.24.64.248` or re-render Asset Just (`27pn9xs0zk8a73g`)
- Start a second melt if `render.lock` exists
- Flip `AUTH_URL`, change portal chrome, or edit Wave 2 tenants

Prove duration, LUFS, face lock, and that the 60s file still serves.
