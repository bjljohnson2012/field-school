# Field School three loops
Dated 21 Sep 2026 (library + chrome). Project owner: Field School PM (`bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133`).
Product plan. Launch stays CLOSED. This file is not 8/8.
Ethos memo still wins on Child vs User, prices, AUTH_URL, dest, person-in-development-as-buyer.
This file wins on what to build. Chrome spec: `docs/staff/SHELLS.md`.

## End

A leader or parent invests at https://portal.fieldschool.ai.
Anyone accountable for people's development can put knowledge into a Library, turn it into a lesson a live person can teach or a learner can take, optionally cut a video from that lesson, then assign a path that still moves when they are not in the room.
The bar has five words, not twelve tickets. Sales never shows a child. Admin is Insights with real charts.

## The three loops

Library is the kitchen. Cap is one stove. Composer plates the meal. Portal serves it.

| Loop | Job | Done when |
| --- | --- | --- |
| Library | Ingest any source. Turn it into a LessonSpec. | A leader can start from long-form video, a wizard, or their own/our AI, review it, and get one lesson they can teach live, assign, or send to video. |
| Composer | Order LessonSpecs into a course. Approve. | Units exist. Quiz items cite source_unit_id. Draft until approve. |
| Portal | Assign. People move. | Login salesperson or tracked child sees course / why / next. Leader sees Insights and Eval. |

Wave 3 seed: `sources` kinds text / upload / book / link, `/o/:slug/teach`, `/o/:slug/l`. Credits + wrapped BYOK already in `app/db/0011_credits_byok.sql`.

## Library create modes

Same LessonSpec. Three doors (New menu, see SHELLS.md):

1. Long-form video (Cap or upload)
2. Interactive wizard (what it is, who it is for, teach vs assign vs video)
3. Connect AI: BYOK (AES-GCM wrapped, last4 only) or platform credits

## Stack

Next stays the product. FastAPI is a Library worker in Cycle 2. Celery+Redis with that worker. pgvector stays. No Django, no Qdrant this week.

## Chrome

Header for a leader: Learn, People, Library, Insights, New. Org picker. Credits. Avatar.
Header for a salesperson: Learn, Me.
Banned from the bar: Lesson, Tools, Cart, Children, Progress, Intent, Path, Portion, Brain, Training portal, full email.
Desk respects `activeOrg`. The live bug `orgs.includes("household")` on the sales dashboard is forbidden.
Insights: six org-scoped charts from `learning_events` / skills / credits. Click a bar, open a person. Empty is honest.

Foundry tokens. Components in SHELLS.md and the three-shell table below.

| Shell | Who |
| --- | --- |
| Library | Maker |
| Lead / Insights | Hirer |
| Learn | Login learner, or parent acting for a tracked child |

## Identity

Leader/parent login, owns path. Salesperson login, does not own path. Child login none.
Reject: salesperson as child, child login, Remotion-in-Next, Launch 8/8.

## Locks

AUTH_URL, dest hash, family LIVE `bc-4765f2f0`, Just, guest Grok Bot, source_unit_id, events never mix orgs.

## This week done-when

Header is the five-item bar. Sales desk shows no children. Insights has real aggregates or an honest empty state.
A leader creates via long-form video **or** wizard. AI mode is selectable (credits or BYOK). One LessonSpec assigned to a salesperson and one to a tracked child. Each has a visible next step.

## Build order

Cycle 1 (now, two streams):
- A: Chrome per SHELLS.md. `site-header.tsx` collapse. `dashboard/page.tsx` org-aware (kill household fetch on sales). Insights route with six views. New menu: Video, Wizard, Connect AI.
- B: Library create on Wave 3 teach. Video door and wizard door write units + checks. BYOK/credits UI uses 0011, key never in GET JSON.

Cycle 2: FastAPI extract worker + Celery. Lead EvalSheet.
Cycle 3: Make video from spec. Embed. Prove assignments.

## Do not

Django rewrite. Pages in FastAPI. Qdrant. New plates. More header links. Child login. Mix rooms in one desk. Launch PASS.
