# Field School three loops
Dated 21 Sep 2026. Project owner: Field School PM (`bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133`).
This file is the product operating plan. Launch stays CLOSED. This file is not 8/8.
Read with `FIELD-SCHOOL-ETHOS-MEMO.md` (job, locks, identity). This file wins on what to build this week.

## End

A workable, growing company.
A leader or parent invests at https://portal.fieldschool.ai.
A person in development keeps moving when that hirer is not in the room.
You can finish a Cap take and get a postable video.
That video becomes a course in the portal without Premiere.
A leader can assign a plan to a login salesperson or a tracked child.
Launch stays CLOSED until CDM writes 8/8.

## Three loops. One engine.

| Loop | Job | Done when |
| --- | --- | --- |
| Factory | Finish a Cap take. Get files you can post. | 16:9 master + 9:16 cuts.json on disk. Download works. |
| Composer | Those files become a course. | Chapters are knowledge_units. Quiz items cite source_unit_id. Draft until the leader approves. HLS plays in the portal. |
| Portal | A leader assigns. People move. | Login learner or tracked child sees: this course, why, next. Leader sees eval. Brain retrieves this org only. |

Same Next app (`app/`). Same Postgres. Same VPS. Remotion stays in `plates/`. Do not add FastAPI, Celery, Qdrant, Django, or a new plate type.

## Identity (never collapse)

| Role | Login | Org | Owns the path |
| --- | --- | --- | --- |
| Leader / parent | yes | household or sales | yes |
| Login learner (salesperson) | yes | sales | no |
| Tracked person (child) | no | household | no |

Reject: salesperson as a child record. Child login. Fourth SKU. Official psychometric banks. Remotion-in-Next. Dest SHA as done-when. Launch 8/8.

## Stack you keep

- `app/` Next campus. Postgres + pgvector. Auth.js.
- Orgs: `field-school` (operator), `household`, `sales`.
- Composer tables: courses, lessons, sources, knowledge_units, quiz_items, publish_requests.
- Field Pattern `fp-50-v1` on member_profiles. Personality routes load and question shape. It does not invent curriculum.
- Cap + edit factory. Existing plates only: opener, talking-head, recap, quiz bumper.
- AUTH_URL https://portal.fieldschool.ai. Dest hash untouched. Family LIVE `bc-4765f2f0` untouched. Just `27pn9xs0zk8a73g` locked.

## This week done-when

One real Cap take becomes a published lesson, assigned to one salesperson (login) and one tracked child (no login). Each has a visible next step on a phone-sized home screen.

If that sentence is false, the week is not done. Tests on PR 196/197, dest reaudits, and store files are not the week.

## Build order (do not skip)

### 1. Factory: finish to files
Operator screen, one take:
1. Cap take is done.
2. STT + chapters from existing factory.
3. Review: chapters plus the four existing plates only.
4. Render 16:9 master. Write cuts.json for 9:16.
5. Store files. Buttons: download, send to portal as draft lesson.

Social post can be a manual upload in v1. YouTube API later.
No new antagonist card. No dest SHA ritual.

### 2. Composer: files to course
On send to portal:
- One course + one lesson in the leader's org.
- Each chapter becomes a knowledge_unit.
- Three quiz items, each with source_unit_id.
- Status draft until approve.
- Player is HLS, not Remotion inside Next.
Household: parent must approve. Sales: trainer may auto-assign inside an approved pack.

### 3. Portal: three learner screens, one leader screen
Learner (or parent acting for a child):
1. Home: this course, why, next.
2. Play the unit.
3. Profile: skills, Field Pattern summary, progress, notes they should not edit.

Leader:
1. People list. Login users vs tracked children, labeled.
2. Assign course or plan.
3. Eval: progress, quiz, notes, how they are doing.
4. Brain: retrieve and generate from this org's units and notes only. Embed knowledge_units + brain_notes in pgvector.

`/metering`, `/checkout`, `/operator/launch-gate` stay off the main path.

## Streams for Field School PM

You do not write `app/` yourself. Spawn builder + checker + evaluator. Two streams max. Files must not collide. Third waits.

Cycle 1 (now):
- Stream A: Composer ingest. Cap/HLS draft lesson in the leader org. Quiz items with source_unit_id. Approve path. Do not steal `bc-4765f2f0`. Do not package Remotion into Next.
- Stream B: Portal home. One screen that names the course, why, and next for a selected person (salesperson login or tracked child). Two rooms allowed the same week. One room per ticket.

Cycle 2 (after A lands):
- Factory finish-to-files operator path using existing plates only.
- Leader people + assign + eval.

Cycle 3:
- Brain embeddings on knowledge_units.
- Assign the same published lesson to one salesperson and one child. Prove the week done-when.

## Easy test

Sales manager on a phone: sees the team, assigns Discovery week 1, rep knows what to watch, manager sees they are stuck.
Parent on a phone: selects a child (no child account), assigns the new lesson from Cap, sees next portion without a new conversation, writes one note the brain uses next time.
If the flow is /intent then /path then /portion then /brain, it failed.

## Do not

- FastAPI, Django, Celery, Qdrant, ClickHouse, Ollama, LangChain-as-the-app
- New plate types
- Notion-replacement Kanban in the portal
- GitHub PAT curriculum sync
- Official MBTI / Enneagram / Gallup / Wiley items
- Child login
- Treat a salesperson as a child
- Flip the public site
- Invent Launch PASS
- Restart campus waves to match wording
- Extend frozen TanStack `src/`

## Dean reply

End restated. Which loop moved. Agents spawned. PR links. Proof that a person has a visible next step. What still blocks the week done-when. Next two streams queued. Human needed (Cap take is allowed and expected).
