# Field School campus app (Next)

This directory is the official campus runtime.

Wave 1 creates the Next + Postgres kernel here if the tree is still empty:

- Auth matching whatever the VPS Next app already uses (do not invent Better Auth unless that is what is live).
- Schema: organizations, members, memberships, groups, group_memberships, assignments, learning_events.
- Seed Org 0 `field-school` and household org `household`.
- Authenticated watch/quiz on Grok Bot station 01 writes `learning_events`.
- Guest may keep current guest behavior.

See `docs/campus-runtime/GROK_BUILD_PROMPT.md`.
