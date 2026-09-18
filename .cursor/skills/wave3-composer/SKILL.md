---
name: wave3-composer
description: Wave 3 text-only until that wave starts. Composer, teach UI, uploads, quiz items with source_unit_id. Do not write app code before WAVE2.md proofs pass.
---

# Wave 3 composer

Wave: 3. Text-only until Wave 3 starts. Write code only on branch `cursor/wave-3-composer` after `WAVE2.md` proofs pass.

Attach:

- `docs/campus-runtime/CURSOR_WAVES_1_5_SPEC.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`
- `docs/campus-runtime/WAVE2.md`
- `AGENTS.md`

Absorbed branches (stop using separately):

- `cursor/portal-course-builder-a6ec`
- `cursor/course-authoring-embed-a6ec`
- `cursor/admin-courses-inbox-ux-a6ec`
- `cursor/ai-question-generation-a6ec`
- `cursor/certifications-and-signature-a6ec`

Do not revive `cursor/course-mcp-server-a6ec`. No campus MCP. No `course-mcp-server` skill.

## When Wave 3 starts

- `app/db/0005_composer.sql`: courses, lessons, sources, knowledge_units, quiz_items, publish_requests
- Teacher UI under `/o/:slug/teach`. Drafts hidden from children
- Uploads at `/opt/field-school/uploads/{org_id}/` (200MB file, 2GB org)
- Units from supplied text only. Quiz items require `source_unit_id` or they do not persist
- Household and sales catalogs stay isolated

## Do not (now)

- Implement Wave 3 app code, SQL, or UI
- Start Remotion or Cap record
- Flip `AUTH_URL`, extend TanStack, or touch the CNC vault
- Add Notion Member / Quiz / Personality databases
- Build a second Pattern bank
