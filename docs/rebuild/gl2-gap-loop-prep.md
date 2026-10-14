# GL2 Gap Loop M2 prep

This file is the spec and the test plan for [issue 373](https://github.com/bjljohnson2012/field-school/issues/373) (stream **GL2**, branch `feat/knowledge-gap-loop-m2`). It is spec only. No product code ships in the prep pull request.

Authority order:

1. [Issue 363](https://github.com/bjljohnson2012/field-school/issues/363) section B (Ben locks) and CDM notes on issue 373.
2. `docs/rebuild-progress.md` on `chore/rebuild-progress` for `depends_on`, `gate`, `base`, and walk order (overrides issue 373 base text that still says `main`).
3. Notion [Master Rebuild Run Order (Oct 8, 2026)](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d) for parallel lanes (same GL2 row as the progress file).
4. Notion [Knowledge-Gap Loop PRD](https://app.notion.com/p/3f2fe86f-6dee-8110-970d-d17d763dec4c) sections 4 to 8, 10, and 11 (M2 acceptance). Product PRD is draft, not sealed. Where 363 or issue 373 CDM notes disagree, they win.

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. No live Stripe. No deploy from this stream until Ben issues CDM MERGE GO on the implementation draft PR. Kid data never goes to web research.

## Stream placement

| Field | Value | Evidence |
| --- | --- | --- |
| Stream id | GL2 | `docs/rebuild-progress.md` streams YAML |
| Issue | 373 | GitHub |
| Implementation branch | `feat/knowledge-gap-loop-m2` | Issue 373, progress YAML |
| `depends_on` | M5, M11 | Progress YAML; issue 373 |
| `gate` | none | Progress YAML |
| `needs_merge` | true | Progress YAML |
| `base` (implementation) | `feat/portal-m11-brains` | Progress YAML (not `main` on the issue body) |
| Walk order index | After M11, M12, PM3; before PM4, GL3 | `walk_order` in progress file |
| Ben merge order | After PM3, before PM4 | `ben_merge_order` in progress file |

**Do not start Grok Build on GL2 until M11 exists** (merged implementation branch `feat/portal-m11-brains` is on the stack base). M5 tenancy is required on the deployed campus. On `origin/main` at `4eaf464cfa19c2c7a1e0b552490a31f5515e79ef`, `app/db/0022_tenancy.sql` is present (M5 SQL landed on main). M11 is `not_started` in the progress file as of 2026-10-13. The chore progress log still lists M5 as blocked on draft PR 383; treat **deployed main** as the M5 dependency for this prep per coordinator assignment, and treat **M11 not started** as the hard build gate.

Issue 373 acceptance (one line): a **team-scope** outcome runs a loop and lists gaps **with citations**; **caps hold**.

## Goal (M2)

Ship Gap Loop **M2** from the PRD: **graph view**, **owner-approved web research**, **pgvector embeddings**, a **cron runner** for long steps, and **family, team, and org** owner scopes on top of **M5 org tenancy** and **M11 unified brain nodes**. Keep **LOOP_LIMITS** and M1 behavior for `person` and `child` scopes. Do not reopen Gap Loop M1 (PR 354, migration `0021_knowledge_gap_loop.sql`).

## Already built (M1, do not redo)

| Area | Location |
| --- | --- |
| Tables | `app/db/0021_knowledge_gap_loop.sql` |
| Lazy apply | `app/src/lib/gap-loop/sql.ts` |
| State machine and caps | `app/src/lib/gap-loop/machine.ts` (`LOOP_LIMITS`: 12 steps per run, 40 per owner per day, stall after 3 cycles, gap below 60, met at 80) |
| Scoring and gaps | `app/src/lib/gap-loop/score.ts`, `signals.ts` |
| Access rules (M1 scopes) | `app/src/lib/gap-loop/rules.ts` (`person`, `child`; sales room cannot create child goals; `redactChildForPrompt`) |
| Store, lease, idempotency | `app/src/lib/gap-loop/store.ts` (`web` channel throws `web_research_not_in_m1`) |
| APIs under `/api/knowledge/*` | outcomes, step, events, gaps, tasks respond, nodes delete |
| UI | `/knowledge/goals`, workspace components in `app/src/components/gap-loop/*` |
| Tests | `app/scripts/gap-loop-*.test.mjs` (five files) |

M1 explicitly excluded: web research, `vector` column, cron route, `researching` state, family or team or org write paths.

## M11 handoff (required before implementation)

M11 ([issue 370](https://github.com/bjljohnson2012/field-school/issues/370)) widens the brain graph that M2 reads:

- Additive changes to `knowledge_nodes` / `knowledge_edges` from 0021 (new `kind` values, `origin`, `scope` on edges).
- Backfill from brain items, composer knowledge, coaching units, with citations (`ref_table`, `ref_id`).
- Brain list and graph at `/library/brain`; `/knowledge` and `/brain` redirects per M11 acceptance.
- M11 CDM: Gap Loop 0021 tests pass unchanged after additive SQL only.

GL2 implementation branches from `feat/portal-m11-brains`, not from bare `main`, so decomposition and analyze steps can use M11 nodes and edges as evidence. Do not duplicate M11 backfill in GL2.

## M5 handoff (tenancy)

M5 org `kind` values **family** and **team** (with **homeschool** as a mode on family orgs, not a product) scope every query. Household and sales rooms never mix on one desk ([`docs/LAW.md`](../LAW.md), issue 363 Q2). Gap Loop rows already carry `org_id`, `growth_unit_id`, and `owner_kind` including `family`, `team`, and `org` in 0021 CHECK constraints; M1 code paths only exercise `person` and `child`. M2 opens the wider kinds in `rules.ts`, `inputs.ts`, and UI pickers without crossing rooms.

## Scope to implement (M2)

### 1. Owner scopes

Open **family**, **team**, and **org** outcomes in addition to M1 **person** and **child**.

| Scope | Room | Who writes | Who reads | PRD |
| --- | --- | --- | --- | --- |
| `family` | Family org (household alias until M15) | Household guardians | Guardians | PRD section 6 |
| `team` | Team org (sales room) | Leader | Leader; members see assigned outcomes only | PRD section 6; issue 373 acceptance names team |
| `org` | Org growth unit | Leader | Leader and scoped members | PRD section 6 |
| `person`, `child` | Unchanged | M1 rules | M1 rules | 363 section B: Gap Loop M1 stays as built |

Team-scope acceptance: create or select a team org, set a team outcome, run at least one loop cycle, see gap rows each with at least one citation in the workspace (checklist or graph list mode).

### 2. Graph view

| Piece | Spec |
| --- | --- |
| Route | `/knowledge/goals/[outcomeId]/graph` under door `knowledge` in `app/src/lib/shell/routes.ts` |
| Component | `app/src/components/gap-loop/gap-graph.tsx` (new): goal node, requirement nodes, clusters with cited summaries, dashed edges for open gaps |
| List equivalent | Same data as the graph; reuse or extend patterns from `finding-row` / checklist; graph is not the only path (WCAG, reduced motion) |
| Motion | Static layout when `prefers-reduced-motion`; no animated graph layout |
| API | `GET /api/knowledge/outcomes/[outcomeId]/graph` returns nodes, edges, clusters, gap highlights |
| Clustering | Deterministic label propagation over `knowledge_edges` in TypeScript; short cited summary per cluster (PRD section 5 step 4) |

Graph rendering library vs hand-rolled SVG is an open Ben decision (PRD section 13 item 16). Default lean: SVG in-repo, no new npm dependency, unless Ben chooses a library.

### 3. Approved web research

| Piece | Spec |
| --- | --- |
| Channel | `research_tasks.channel = 'web'` (column exists in 0021; M1 blocks in store and respond) |
| Flow | `formulate` creates task with `query_text` shown verbatim on the CTA; owner approves or declines |
| Approve route | `POST /api/knowledge/tasks/[taskId]/approve` with body that includes the same query text the UI showed (reject mismatch) |
| Run | After approve, run moves through **`researching`** (new loop state or equivalent; PRD section 4), executes search, writes **cited** `knowledge_nodes` with URL and retrieved date in `evidence` |
| Integrate | Existing `integrate` / `rescore` path; no silent outbound actions |
| Child scope | Queries built only from requirement label and generic level words; **no** child name, age, profile fields, brain text, or upload text. Deny check against `kid_profiles.display_name` and identifiers; blocked attempts log a `loop_events` row |
| Prompts | Child-scope LLM input still uses `redactChildForPrompt` and `modelUserPayload` |

Provider choice and per-task cost cap are Ben decisions (PRD section 13 items 4 and 5). Implementation must not call web research without an approved row and must not send kid data.

### 4. Embeddings (pgvector)

| Piece | Spec |
| --- | --- |
| Extension | `vector` already enabled in `app/db/0001_wave1.sql` |
| Column | Add `embedding` on `knowledge_nodes` in a **new** idempotent migration file under `app/db/` (implementation claims the **next free serial** on its base branch at Grok Build time; this prep does not assign a number) |
| Index | HNSW (or equivalent) on `embedding` once dimension **N** is chosen |
| Scoring | `judgeCoverage` / analyze uses similarity plus cited judgment (PRD section 5 step 3); M1 keyword-only match remains the fallback when embedding is null |
| Provider | Ben picks provider and **N** (PRD section 13 item 4; xAI embedding availability unverified in PRD) |

Repo rule: no Qdrant this week ([`AGENTS.md`](../../AGENTS.md)). Stay on Postgres pgvector.

### 5. Cron runner

| Piece | Spec |
| --- | --- |
| Route | `POST /api/cron/knowledge-loop` |
| Auth | Same bearer pattern as `app/src/app/api/cron/coaching/route.ts` (`CRON_SECRET`, timing-safe compare) |
| Work | Drain runs in `researching` and long-running `analyze` / `integrate` steps that exceeded request-time budget |
| Deploy | Sidecar schedule is a **deploy change**; Ben approves before production cron (PRD section 7; mirror `app/deploy/docker-compose.yml` coaching-cron profile pattern) |
| M1 behavior | Client-driven `/step` remains for interactive states; cron supplements, does not replace leases |

### 6. UI updates

- `cta-card.tsx`: approve / decline web research; show verbatim `query_text`.
- Workspace link to graph route; graph tab or nav on the outcome page.
- Scope picker on `/knowledge/goals` for family, team, org where actor role allows (leaders on team orgs).
- Copy: plain words, no em dashes (363 section B).

### 7. Credits and billing

M2 does **not** write `credits`, `usage_events`, or `customer_api_keys`. Metering for loop research is **GL3 / M3** (PRD section 9). No new dollar strings. No Stripe.

## State machine delta

Add **`researching`** (PRD) between approve and integrate:

- Events: approve research, research complete, research failed (terminal or rescore per implementation plan).
- Preserve M1 terminals: `done`, `capped`, `stalled`, `cancelled`.
- Caps: same `LOOP_LIMITS`; web research steps count toward per-run and per-day step limits unless Ben decides otherwise (no decision recorded; treat as counted steps).

Extend `app/scripts/gap-loop-machine.test.mjs` for the new transitions.

## Data model (implementation branch only)

This prep does not add SQL files or migration numbers.

Expected **additive** changes:

- `knowledge_nodes.embedding` (+ optional `embedded_at`, `embedding_model` if needed for rotation).
- Possibly widen `knowledge_nodes.kind` if M11 and M2 share new kinds (coordinate with M11 migration on the base branch).
- No drops. No changes that break M1 tests without updating tests in the same implementation PR.

Apply pattern: extend `applyGapLoopSql()` chain after M11 SQL apply, same as today after profile M2.

## API summary (new or extended)

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/knowledge/tasks/[taskId]/approve` | POST | Approve web research |
| `/api/knowledge/outcomes/[outcomeId]/graph` | GET | Graph payload |
| `/api/cron/knowledge-loop` | POST | Bearer cron runner |

Existing routes keep idempotency (`Idempotency-Key` on `/step`) and `{ ok, error }` shape.

## Privacy and safety (CDM)

- Kid data never goes to web research (issue 373, 363 section B, PRD section 10).
- Approval before any web research call.
- Every new node and edge keeps `jsonb_array_length(evidence) >= 1`.
- No raw model blobs in `loop_events.detail`; structured citations only.
- No autonomous email, share, or post.

## Out of scope (GL2)

- Gap Loop M3 / GL3: individual plan, `learning_plans`, metering, fourth SKU copy in README or LAW (issue 375).
- AUTH_URL, deploy scripts, docker-compose cron enablement in the implementation PR without Ben (spec may document the hook only).
- Child login, child self-rating, photos, streaks.
- Python LangGraph / GPT-Researcher services, new npm dependencies unless Ben picks a graph library.
- Changes to frozen TanStack `src/`.
- Production backfill, test-row deletion, `--apply` on production.

## Ben decisions (do not guess)

List these in the implementation PR if still open at build time.

| # | Topic | Lean / notes | Evidence |
| --- | --- | --- | --- |
| 1 | Embedding provider and dimension **N** | Required before HNSW index | PRD section 6 pgvector; PRD section 13 item 4 |
| 2 | Web research provider, API, and per-task cost cap | Required before `researching` production use | PRD section 13 item 5 |
| 3 | Child-scope web research | Lean: allow **generic** parent-approved queries; block kid identifiers | PRD section 4 approvals; issue 373 CDM |
| 4 | Cron sidecar on campus | Ben approves deploy profile and `CRON_SECRET` wiring | PRD section 7; `app/DEPLOY.md` coaching cron pattern |
| 5 | Graph rendering | Lean: hand-rolled SVG, no new dependency | PRD section 13 item 16 |
| 6 | Proposed edges in scoring | Lean: half weight until owner accepts | PRD section 13 item 17 |
| 7 | Whether web research steps count toward `stepsPerRun` / `stepsPerOwnerPerDay` | This prep assumes yes (same as other system steps) | No explicit Ben lock; flag in PR if different |

Resolved elsewhere (do not relitigate in GL2):

- Thresholds 60 / 80 / 3 cycles / 12 / 40: implemented in `LOOP_LIMITS` (PRD section 13 item 10).
- In-app TypeScript machine on Postgres: shipped in M1 (PRD section 13 item 2).
- M1 scopes person + child; family / team / org in M2: PRD section 13 item 1.

## Test plan

Run from `app/` after `npm ci`. Implementation PR must not merge without CDM MERGE GO; tests still run on every push.

### A. Regression (required on every GL2 PR)

1. `node --experimental-strip-types --test scripts/gap-loop-machine.test.mjs`
2. `node --experimental-strip-types --test scripts/gap-loop-score.test.mjs`
3. `node --experimental-strip-types --test scripts/gap-loop-rules.test.mjs`
4. `node --experimental-strip-types --test scripts/gap-loop-idempotency.test.mjs`
5. `node --experimental-strip-types --test scripts/gap-loop-citations.test.mjs`
6. `npm run typecheck`
7. `npm run build`
8. `npm test` (full suite; record pass/fail counts in PR body if unrelated failures exist on base)

### B. New unit tests (implementation adds files under `app/scripts/`)

| Test file (proposed) | Asserts |
| --- | --- |
| `gap-loop-web-research.test.mjs` | Approve with wrong query text fails; approve then run creates cited node with URL; decline skips web call; child-scope query with display name blocked and event logged |
| `gap-loop-graph.test.mjs` | Cluster builder deterministic on fixture edges; list payload matches graph payload |
| `gap-loop-scopes.test.mjs` | Family guardian can write family outcome; team member cannot write team outcome unless leader; sales desk never loads household org rows in one query |
| `gap-loop-embedding.test.mjs` | Coverage uses similarity when embedding present; null embedding falls back to M1 behavior |
| `gap-loop-cron.test.mjs` | `bearerMatches` parity with coaching cron; route returns 401 without secret; drains `researching` run with lease |

Use injected deps or source reads for pure functions, matching `coaching-cron.test.mjs` and existing gap-loop tests.

### C. Integration / manual (staging, after M11 branch is base)

1. **Team acceptance (issue 373):** Sign in as team leader, create team-scope outcome, confirm requirements, run steps until analyze shows gaps; each gap shows citations; pause and resume; hit step cap and see `capped` with timeline event.
2. **Web research:** Formulate produces web task; CTA shows exact query; approve; after runner (manual `/step` or cron in dev with secret), new evidence nodes appear with URL citations; reject path unchanged for findings.
3. **Child guard:** Child-scope outcome; attempt approve with query containing learner name from `kid_profiles`; expect block and timeline entry, no outbound call (mock provider in test env).
4. **Graph:** Open `/knowledge/goals/[id]/graph`; list tab matches; reduced motion does not animate layout.
5. **Room mix:** User in both family and team orgs; outcomes list and graph never show cross-room rows on one desk.

Do not run production cron, live web keys, or live Stripe. Do not read or print `GROK_API_KEY`.

### D. Deferred until dependencies land

| Case | Blocked by |
| --- | --- |
| Evidence from M11 backfilled brain nodes in analyze | M11 merged into stack base |
| `/library/brain` node as citation source in graph | M11 |
| Tenancy alias `household` vs `family` in UI copy | M5 on campus; M15 rename |

## Implementation PR checklist (for Grok Build, not this prep)

- Branch `feat/knowledge-gap-loop-m2` from `feat/portal-m11-brains` after M11 draft PR exists.
- Draft PR to the stacked base; **no merge** without CDM MERGE GO; **no deploy**.
- pstack method: [cursor/plugins pstack skills](https://github.com/cursor/plugins/tree/main/pstack/skills).
- PR body: plan, file list, migration serial claimed at build time, test output, screenshots of graph and web approval at desktop and 390px, self-review against this prep and issue 373.
- Patch `docs/staff/state.json` on the same PR as the node when staff loop requires it (implementation only).

## What this prep PR contains

Only `docs/rebuild/gl2-gap-loop-prep.md`. No edits to `docs/rebuild-progress.md`, `app/`, or deploy assets.
