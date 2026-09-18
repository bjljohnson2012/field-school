---
name: living-profile-stt
description: Wave 2 companion. Nudge Field Pattern profiles from Grok STT only after a member_profiles row exists. Read-only item bank. No new questions.
---

# Living profile STT

Wave: 2 companion. Nudge only after Wave 2 has written a `member_profiles` row from `fp-50-v1`.

Attach (read-only — do not edit):

- `docs/campus-runtime/fp-50-v1.md`
- `app/db/0002_field_pattern.sql`
- `app/db/0003_pattern_weights.sql`
- `docs/campus-runtime/FIELD_PATTERN.md`

Absorbed branches: none.

## Own

- Grok STT on papers / voice / video
- Bearing step 0.15 (0.05 quiz). A new Pattern run resets Bearing
- Append-only `member_profile_revisions`. Parent can lock a child profile
- Chooser reads the live profile and does not rewrite the pack

## Do not

- Edit the item bank or invent a second questionnaire
- Name the product MBTI, Enneagram, StrengthsFinder, or DISC
- Copy official MBTI / Enneagram / Gallup / Wiley items
- Start Remotion plates, composer, or adaptive generation
- Flip `AUTH_URL` or scrape the web into the knowledge pack

Wait if no `member_profiles` row exists yet. Import of an official result still overrides correspondence.
