# Field School three loops
Dated 21 Sep 2026 (library revision). Project owner: Field School PM (`bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133`).
Product plan. Launch stays CLOSED. This file is not 8/8.
Ethos memo still wins on Child vs User, prices, AUTH_URL, dest, person-in-development-as-buyer.
This file wins on what to build.

## End

A leader or parent invests at https://portal.fieldschool.ai.
Anyone accountable for people's development can put knowledge into a Library, turn it into a lesson a live person can teach or a learner can take, optionally cut a video from that lesson, then assign a path that still moves when they are not in the room.

## The three loops

Library is the kitchen. Cap is one stove. Composer plates the meal. Portal serves it.

| Loop | Job | Done when |
| --- | --- | --- |
| Library | Ingest any source. Turn it into a LessonSpec. | A leader can drop a file, a link, pasted text, or a Cap take, review it, and get one lesson they can teach live, assign, or send to video. |
| Composer | Order LessonSpecs into a course. Approve. | Units exist. Quiz items cite source_unit_id. Draft until approve. HLS or interactive player works. |
| Portal | Assign. People move. | Login salesperson or tracked child sees course / why / next. Leader sees eval. Brain retrieves this org's units and notes. |

Wave 3 already has a seed: `sources` kinds text / upload / book / link, `/o/:slug/teach`, `/o/:slug/l`, uploads on disk. Links are stored, not scraped. That is the Library spine. Finish it. Do not invent a parallel app.

## Library intakes (all first class)

1. Record (Cap cam or cam+screen)
2. Upload (PDF, slides, video, audio)
3. Link (YouTube, Vimeo, Loom, URL)
4. Text / paper / book paste

Each intake becomes the same object: a **LessonSpec**.

A LessonSpec is JSON. It is the only lesson source of truth. It drives four views:

- Learn (self-serve player)
- Teach live (presenter deck for a human in the room)
- Make video (Remotion job from the spec, existing plates only)
- Brain (embed units for retrieval)

If a feature cannot be expressed as a field on LessonSpec, it is not a lesson feature yet.

Minimum LessonSpec:

```
id, org_id, title, why
sources[]          kind, uri, transcript, chapters
units[]            title, body, t_start, t_end, source_unit_id
checks[]           quiz or checkpoint, source_unit_id required
teach[]            presenter notes, pause points
media              hls_url, master_mp4, cuts.json
outputs            learn | teach | video
status             draft | approved
```

Cap-first and upload-first are the same pipeline after extract.

## Stack call (considered, not cargo-culted)

Keep the live product: Next.js `app/`, Auth.js, Postgres, pgvector, Caddy, VPS, Remotion in `plates/`.

| Piece | Decision | Why |
| --- | --- | --- |
| Next.js | Keep. Product UI and BFF. | Teach, catalog, identity already live here. |
| Django | No. | Rewrite of a working Next campus. Django admin is not the portal. |
| FastAPI | Yes, as a Library worker only. | Docling, Whisper, yt-dlp, embeddings, structured extract are Python. Pages do not live here. |
| Celery + Redis | Yes, with the Library. | PDF parse, STT, Remotion, embed are minutes-long. `render.lock` is the current fake queue. |
| pgvector | Keep as the vector store. | Already in `0001`. Org-filtered chunks. |
| Qdrant | Not now. | Second database for a chunk count you do not have. Revisit when latency forces it. |
| LangChain | No framework-as-app. | Pydantic models for LessonSpec. Direct LLM calls. |
| Ollama on VPS | No. | External LLM APIs. Keep the box for Postgres, Next, Redis, Remotion. |
| ClickHouse | No. | `learning_events` in Postgres is enough. |

Worker API (FastAPI) does four jobs. Nothing else.

1. `extract` source to transcript + chapters + text chunks
2. `spec` chunks to LessonSpec (units + checks with source_unit_id)
3. `embed` units + notes into pgvector
4. `render` LessonSpec to 16:9 master + cuts.json via Remotion CLI in Docker

Next enqueues. Celery runs. Next reads job status. UI never waits on a 10-minute encode.

Do not stand up FastAPI until the first extract job is real (PDF or Cap STT to units). Until then, Wave 3 units from supplied text still ships lessons.

## UI / UX that can scale

Do not generate rainbow dashboards from Python theme JSON. That is fake scale. Real scale is one design system, three shells, one spec.

### Three shells (this is the IA)

| Shell | Who | Phone | Desktop |
| --- | --- | --- | --- |
| Library | Maker (leader / parent / Ben) | capture + status | ingest, review, spec editor |
| Lead | Hirer | assign, eval, next | people table, teach live |
| Learn | Login salesperson, or parent acting for a tracked child | course / why / next / play | same, plus profile |

Primary nav is those three words. Not /intent /path /portion /brain /metering /launch-gate.
Fold Wave 3 `/o/:slug/teach` and `/o/:slug/l` into Library and Learn. Hire-path routes become panels, not the product.

### Design system

Foundry tokens only: charcoal, cream, olive, ink, Fraunces, IBM Plex.
Components, reused in every shell:

- SourceTile (record, upload, link, text)
- ReviewRail (transcript, chapters, proposed units)
- LessonPlayer (learn)
- TeachDeck (live presenter)
- NextCard (what / why / next)
- PersonRow (login learner vs tracked child, labeled)
- EvalSheet (progress, checks, notes)
- JobChip (queued / running / ready / failed)

If a screen cannot be built from those, the screen is too special.

### Library UX (one screen, four intakes)

Left: drop zone. Record | Upload | Paste link | Paste text.
Center: ReviewRail. Leader edits units and checks.
Right: outputs. Teach live. Assign. Make video. Save draft.

A live person teaching uses TeachDeck: big current unit, next check, presenter notes, pause. Learners in the room or on the portal follow the same spec.
Make video queues a render job. It does not open Premiere. Existing plates only: opener, talking-head, recap, quiz bumper.

### Learn UX (three screens, forever)

1. Home: this course, why it exists for you, what is next
2. Play / teach-along
3. Profile: skills, Field Pattern summary, progress, notes they do not edit

If the flow is /intent then /path then /portion then /brain, it failed.

### Lead UX

1. People (login vs tracked, labeled, never mixed)
2. Assign a course or a LessonSpec
3. EvalSheet
4. Brain search over this org only

### Why this scales

- New source kind = new extractor in FastAPI, same ReviewRail
- New plate = new Remotion composition mapped from LessonSpec, not a new portal route
- New org = same shells, scoped by org_id
- New person type is forbidden. There are only three roles.
- Thousand lessons do not mean thousand page types. They mean more LessonSpec rows.

## Identity

| Role | Login | Org | Owns the path |
| --- | --- | --- | --- |
| Leader / parent | yes | household or sales | yes |
| Login learner (salesperson) | yes | sales | no |
| Tracked person (child) | no | household | no |

Reject: salesperson as child, child login, fourth SKU, official psychometric banks, Remotion-in-Next, dest SHA as done-when, Launch 8/8, Django rewrite.

## Locks

AUTH_URL https://portal.fieldschool.ai. Dest hash untouched. Family LIVE `bc-4765f2f0` untouched. Just `27pn9xs0zk8a73g` locked. Guest Grok Bot stays. Quiz items need source_unit_id. Household and sales events never mix. Personality routes load, not curriculum.

## This week done-when

A leader ingests **one non-Cap source** (upload or pasted text) and **one Cap take** into Library. Each becomes an approved LessonSpec. One is assigned to a salesperson (login). One is assigned to a tracked child (no login). Each person has a visible next step. Teach live opens for the leader on that spec. Make video may still be queued, not posted.

If that sentence is false, the week is not done.

## Build order

Cycle 1 (now, two streams):
- A: Library spine on Wave 3 teach. One ReviewRail over existing source kinds (text, upload, book, link). Save LessonSpec into current courses/lessons/units/quiz tables. No FastAPI yet if the source already has text.
- B: Learn home. NextCard for a selected person. One room per ticket. Both rooms allowed this week.

Cycle 2:
- FastAPI + Redis + Celery worker: extract PDF and Cap STT to units. JobChip in Library.
- Lead people + assign + EvalSheet.

Cycle 3:
- Make video from LessonSpec (existing plates).
- Embed units in pgvector. Brain query this org only.
- Prove week done-when on one salesperson and one child.

## Do not

- Replace Next with Django
- Put pages in FastAPI
- Add Qdrant or ClickHouse this week
- New Remotion plate types
- Auto-colored JSON themes
- Notion Kanban inside the portal
- GitHub PAT curriculum sync
- Child login
- Treat a salesperson as a child
- Flip the public site
- Invent Launch PASS
- Extend frozen TanStack `src/`

## Dean reply

Week done-when restated. Library / Composer / Portal moved or blocked. Whether FastAPI was actually needed this cycle. Agents spawned. PR links. Proof a person has a visible next step. Next two streams queued. Human needed (Cap take and one upload are expected).
