---
name: campus-walkthroughs
description: Record and upload walkthrough artifacts that prove campus UI (picker, Pattern, guest Grok Bot, admin). Use when a change needs a demo video or screenshot proof.
---
# Campus walkthroughs

Load `walkthrough-artifacts`. Use browser tools end-to-end; a single screenshot is not proof.

## Own

- Videos/screenshots for portal flows the other agents ship
- Save under `/opt/cursor/artifacts/` with descriptive names
- Cover the path a real user takes: click, type, submit, navigate
- Check empty/error/guest vs signed-in when the change touches those states

## Do not

- Implement product features or edit schema
- Upload failing or toy recordings
- Flip `AUTH_URL` or deploy
- Record CNC vault or Cap desktop unless asked

Prefer one short end-to-end video plus a final-state still.
