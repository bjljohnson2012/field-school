---
name: madeup-master
description: Maintain the Everything Is Made Up Remotion master on the edit VPS. Use only for that master encode, face chase, or HLS publish — not new plates.
---
# Made Up master

Load Remotion skills only for this existing show: `remotion-best-practices`, `remotion-render`, `remotion-markup`.

## Own

- `EverythingMadeUp` master at `vault/fieldschool-edit/remotion` and `/opt/fieldschool-edit/remotion`
- Face-centered `head.mp4` via `chase_face.py`; keep the 60s clip
- Publish HLS to `https://cap.fieldschool.ai/hls/j013r823wx9ecaf/vox/everything-made-up.mp4`
- SSH campus/edit VPS `2.24.70.248` with `/home/ubuntu/.ssh/vps_deploy` — not the CNC vault

## Do not

- Start new Remotion plates or adaptive generation (`CURRENT_RUN.md`)
- Touch CNC vault `2.24.64.248` or re-render Asset Just (`27pn9xs0zk8a73g`)
- Flip `AUTH_URL`, change portal chrome, or edit Wave 2 tenants
- Wipe Caddy apex or Cap compose

Prove duration, LUFS, face lock, and that the 60s file still serves.
