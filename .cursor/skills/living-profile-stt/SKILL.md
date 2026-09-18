---
name: living-profile-stt
description: Nudge Field Pattern living profiles from papers, verbal answers, and video transcripts via Grok STT. Use for member_profiles revisions, parent locks, or artifact nudges — not a new item bank.
---
# Living profile STT

Read `docs/campus-runtime/FIELD_PATTERN.md`, `fp-50-v1.md`, and `CURRENT_RUN.md`. Code lives under `app/src/lib/pattern/` (`stt.ts`, `profile.ts`).

## Own

- Transcribe papers / verbal / video with Grok STT
- Small-step Bearing nudges; a new Pattern run resets Bearing
- Append-only `member_profile_revisions`. Parent can lock a child profile
- Chooser reads the live profile and does not rewrite the pack
- Org-scoped skills update from the same artifacts when a rubric exists

## Do not

- Invent a second item bank or copy official MBTI / Enneagram / Gallup / Wiley items
- Name the product MBTI, Enneagram, StrengthsFinder, or DISC
- Start Remotion plates or adaptive generation
- Flip `AUTH_URL` or scrape the web into the knowledge pack

Import of an official result still overrides correspondence. Do not change fp-50-v1 items unless CURRENT_RUN says so.
