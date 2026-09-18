---
name: Wave 3 composer
description: Wave 3 composer — text only until Wave 3
---

# Wave 3 composer

Wave: 3. Text only until Wave 3 starts. Code only on `cursor/wave-3-composer` after `WAVE2.md` proofs pass.

Attach:

- `docs/campus-runtime/CURSOR_WAVES_1_5_SPEC.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`
- `docs/campus-runtime/WAVE2.md`
- `docs/campus-runtime/WORKER_RENAME.md`

Absorbed branches (stop using separately):

- `cursor/portal-course-builder-a6ec`
- `cursor/course-authoring-embed-a6ec`
- `cursor/admin-courses-inbox-ux-a6ec`
- `cursor/ai-question-generation-a6ec`
- `cursor/certifications-and-signature-a6ec`

Do not revive `cursor/course-mcp-server-a6ec`. No campus MCP. No second Pattern bank. No `build-all-waves`.

## When Wave 3 starts

- `app/db/0005_composer.sql`: courses, lessons, sources, knowledge_units, quiz_items
- Teacher UI `/o/:slug/teach`. Drafts hidden from children
- Quiz items require `source_unit_id` or they do not persist

## Do not (now)

- Implement Wave 3 app code, SQL, or UI
- Start Remotion or Cap record
- Flip `AUTH_URL` or extend TanStack
