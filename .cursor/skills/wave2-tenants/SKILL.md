---
name: wave2-tenants
description: Ship household + sales, picker, invites, and fp-50-v1 from pinned origin/main files. Only worker allowed to build Wave 2.
---

# Wave 2 tenants

Git: `git fetch origin && git rev-parse origin/main`. Base on origin/main (written against a183f6fcf4ecea6e14507e2ec8f94c00d67770e1). Branch `cursor/wave-2-tenants`. If `cursor/wave-2-tenants-ca6e` exists, merge origin/main into it first.

## Must open before writing code

- docs/campus-runtime/fp-50-v1.md
- app/db/0002_field_pattern.sql
- app/db/0003_pattern_weights.sql
- app/db/0004_tenants.sql
- docs/campus-runtime/CURSOR_AGENT_PROMPT.md
- docs/campus-runtime/WAVE2.md

Those files are the item bank and tenant schema. Do not create another questionnaire.

## Own

- household + sales, picker, /o/:slug
- GET /api/me all memberships + activeOrg. Stop forcing every login onto field-school.
- invites. Child + ward on household only. Trainer on sales.
- fixtures home:welcome and sales:welcome. No Grok Bot in household catalog.
- Pattern run loads items from fp-50-v1.md and 0003_pattern_weights.sql
- apply 0002-0004 on field-school-campus-db / campus

## Do not

Flip AUTH_URL. Extend TanStack src/. Touch CNC vault 2.24.64.248. Re-render Just. Scaffold plates/. Composer. Stripe. Lyell. Official MBTI/Enneagram/Gallup/Wiley items. Scrape.

Proofs: docs/campus-runtime/WAVE2.md.
