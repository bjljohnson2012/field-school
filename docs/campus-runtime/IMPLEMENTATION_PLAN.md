# Field School implementation plan
From current state to multi-tenant adaptive campus
2026-09-11

Public site: https://fieldschool.ai
App (live): https://portal.fieldschool.ai and https://university.benjohnson.ai
Capture: https://cap.fieldschool.ai
Edit MCP: https://edit.fieldschool.ai
Repo: github.com/bjljohnson2012/field-school
VPS: Hostinger 2.24.70.248 (srv1643164)

Grok Build: read this file, then `01-current-state.md`, `02-destination-and-schema.md`, `03-waves.md`, and `GROK_BUILD_PROMPT.md`. Do Wave 1 only unless the human names another wave. Do not deploy GitHub main (TanStack) onto the VPS.

## Hard rules

1. Two planes. Notion = factory authoring. Postgres = people, events, search, keys.
2. Next is the live app. TanStack main stays parked as a reference.
3. One VPS. Melt stays single-flight. Embed and generate wait when melt is running.
4. No new Notion databases for members, quizzes, or personality.
5. CNC vault 2.24.64.248 stays out.
6. Generated work cites approved knowledge_units. Empty citations = refuse and open a resource proposal.
7. The engine does not scrape the web into the pack. Admins accept resources.
8. Child accounts cannot mint MCP tokens. Guardian approves child assignments.
9. Tenant A cannot read tenant B.
10. Cap is a paid add-on, not the default lesson type.
11. Deploy only via Cloud Agent + vps_deploy.
12. Do not flip AUTH_URL or 301 university until portal OAuth callback rows exist.
