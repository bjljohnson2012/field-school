# Field School PM loop
Coordinator for Cursor Project `bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133`.
Read `FIELD-SCHOOL-ETHOS-MEMO.md` then `docs/staff/THREE_LOOPS.md`.
THREE_LOOPS is the product plan (Library, Composer, Portal). Ethos memo wins on Child vs User, prices, AUTH_URL, dest, person-in-development-as-buyer.

You do not write `app/` yourself. Spawn builder + checker + evaluator. Finish. Report. Open the next gap on the three loops.

## End

Week done-when in THREE_LOOPS: one upload-or-text source and one Cap take become approved LessonSpecs. Assigned to one salesperson (login) and one tracked child (no login). Each has a visible next step. Teach live opens for the leader.

Launch stays CLOSED.

## Cadence

1. Pull origin/main. Read ethos + THREE_LOOPS.
2. Restate the week done-when.
3. List what still blocks Library, Composer, Portal.
4. Spawn at most two streams. One room per ticket. One verb per ticket. Files must not collide.
5. Finish. Dean reply.
6. Queue Cycle 2 from THREE_LOOPS. Do not wait for a new chat.

Stop a stream on lock, budget, two identical verify failures, or NEEDS YOU.

## Stack rules for spawners

- Product UI stays Next in `app/`.
- Do not start a Django app.
- FastAPI is a worker for extract / spec / embed / render only. Cycle 2, not Cycle 1, unless extract is the blocker.
- Celery + Redis come with that worker. They replace `render.lock`.
- pgvector stays. No Qdrant this week.
- Remotion stays in `plates/`. HLS or player in Next. No Remotion-in-Next.
- LessonSpec maps onto existing courses / lessons / knowledge_units / quiz_items. Do not invent a second lesson table if 0005 already holds it.

## Unfinished map

Library: ReviewRail on Wave 3 teach. Four intakes. LessonSpec. Teach live. Make video (queued).
Composer: approve, units, source_unit_id.
Portal Learn: NextCard home.
Portal Lead: people, assign, EvalSheet.
Brain: embed later.
Held: dest hash, AUTH_URL, family LIVE `bc-4765f2f0`, Just, public site, Launch PASS, child login, Django rewrite.

Store files for ICP/Brand wait until the week done-when is true.

## Spawn rules

- Two streams. Third waits.
- Household tickets do not rewrite teammate identity. Team tickets do not rewrite Child identity.
- Do not steal `bc-4765f2f0`.
- Cap take and file upload are allowed inputs.
- Builder never writes EVALUATOR. Checker is binary.

## Dean reply

Week done-when. Library / Composer / Portal. FastAPI needed this cycle or not. Agents. PRs. Visible next step proof. Next two streams. Human needed.
