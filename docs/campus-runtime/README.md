# Campus runtime (official main line)

This folder is the source of truth for what gets built on `main`.

1. `IMPLEMENTATION_PLAN.md` — destination and rules.
2. `01-current-state.md`
3. `02-destination-and-schema.md`
4. `03-waves.md`
5. `GROK_BUILD_PROMPT.md` — Wave 1 execution brief.
6. `API.md` — how Wave 1 works, schema, endpoints, curl. Live: https://portal.fieldschool.ai/docs/api
7. `openapi-wave1.json` — machine-readable schema for the three APIs.
8. `WAVE1.md` — proof results.

## Builder default

Wave 1 is done. Do not start Wave 2 unless the human names it. Implement in `app/` (Next). Do not extend the frozen TanStack tree in `src/`.

Live hosts: fieldschool.ai, portal.fieldschool.ai, university.benjohnson.ai, cap.fieldschool.ai, edit.fieldschool.ai.
VPS: 2.24.70.248. CNC vault 2.24.64.248 is off limits.
