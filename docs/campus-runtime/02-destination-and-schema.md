# Destination and schema

One Next app. One Postgres. Two MCP doors (edit = factory, mcp.fieldschool.ai = campus). Notion authors Field School originals. Tenants author in the app.

First tenants: Org 0 Field School (gym/team, public_catalog, platform_plus) and a household org (homeschool, private, strict).

Stances: learner, teammate, teacher, trainer, coach, leader, guardian, admin.

## Stack to add on 2.24.70.248

Postgres 16 + pgvector under /opt/field-school. Nightly pg_dump. Drizzle in the Next app. Auth.js as the live app already uses it. Inference router later. Uploads at /opt/field-school/uploads/{org_id}/. Campus MCP later. Wildcard DNS later.

RAM: melt refuses under 3072 MiB MemAvailable. Postgres shared_buffers 256-512 MB.

## Wave 1 tables only

organizations, members, memberships, groups, group_memberships, assignments, learning_events.

Later waves add wards, packs, skills, runtime_courses, tenant courses/lessons, sources, knowledge_units, learner_models, work_items, artifacts, resource_proposals, agent_credentials.

Event row is the spine: org_id, membership_id, actor_membership_id, actor_stance, kind, object_type, object_id, skill_ids, score, raw jsonb.
