# M11 brains prep

This file is the spec and the test plan for [issue 370](https://github.com/bjljohnson2012/field-school/issues/370). It does not implement product code. The implementation pull request stays draft until CDM MERGE GO. No deploy from this stream.

## CDM seal (2026-10-14)

CDM sealed B1-B6 on 2026-10-14, delegated by Ben. The implementation uses migration `0028` only. It does not add `0026` and it does not edit `0027`.

| # | Sealed decision |
| --- | --- |
| B1 | `knowledge_nodes.kind` adds `lesson`, `brain_page`, `reflection`, `skill`, `project`. The existing five stay: `goal`, `requirement`, `concept`, `cluster`, `evidence`. |
| B2 | No edge scope column. An edge takes its scope from its endpoints, and both endpoints must share a scope. `ensureEdge` enforces that, and `knowledge_edges_scope_check` checks it in the database. |
| B3 | `knowledge_edges.origin` is `system`, `derived`, `user` (manual link), and `ai` (suggested, shown as pending until a leader confirms). |
| B4 | One brain per `knowledge_brains` row, defaulting to one per org. Growth units and desk children are filtered views inside that brain, not separate brains. |
| B5 | Reflection block is `{kind:'reflection', prompt:string, response?:string, tags?:string[]}`. Reflection block to reflection node, quiz and assignment to evidence, text, bullets, quote, and clip to concept on the lesson, station to requirement, course to cluster. Each lesson also gets a lesson node. |
| B6 | M7 `enrollments` and `progress_latest` are the source of truth. Living-brain next-step reads enrollments starting in M11. Dual-read the old living-brain tables only as a fallback through M14, and retire them in M15. Learn and You read enrollments. The Library brain reads nodes and edges. |

Backfill kinds that follow B1: `brain_sources`, `brain_notes`, and `brain_artifacts` become `brain_page`. Composer `knowledge_units` become `skill`. `coaching_knowledge_units` become `project`. Derived edges use `origin = 'derived'`. Living-brain tables stay. `kind` homeschool stays.

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. No live Stripe. This prep does not edit `docs/rebuild-progress.md`, does not add SQL, and does not claim a migration number.

## Dependencies and build gate

`docs/rebuild-progress.md` on `chore/rebuild-progress` is the authority for `depends_on`, `gate`, and `walk_order`. For M11 that YAML says:

| Field | Value | Evidence |
| --- | --- | --- |
| `depends_on` | M6, M10 | `docs/rebuild-progress.md` stream row for M11 |
| `base` | `feat/portal-m10-library` | same |
| `gate` | `none` | same |
| `walk_order` | … M10, **M11**, … | same |

Operator context for this prep (Oct 14, 2026): **M6 is deployed**. **M10 is not started**. The gate does not block writing this spec, but **no implementation branch or product code for M11 starts until M10 has a draft pull request** (dependency satisfied in the rebuild graph). Wave 6 in the [Notion master run order](https://app.notion.com/p/3f3fe86f-6dee-81a3-bf43-e426f4c6967d) matches: M11 starts when M10 reaches `draft_pr`.

Implementation branch name: `feat/portal-m11-brains`. Cut from `feat/portal-m10-library` (or `origin/main` for any dependency already merged). Merge with merge commits, never rebase or force-push.

Downstream streams that wait on M11: PM3 (#372), GL2 (#373), M13 spike (#376), M15 retire (#378).

## Member rail and shell (do not revert)

[Issue 368](https://github.com/bjljohnson2012/field-school/issues/368) and `docs/rebuild/m9-shell-prep.md` on `origin/main` lock the **member rail default**: **240px**, **Learn**, **Library**, **You**. Unset `NEXT_PUBLIC_MEMBER_RAIL_VARIANT` and `issue-368` both select that rail. Learn / Me (`shells`) is opt-in only.

M11 brain UI at `/library/brain` renders inside the signed-in shell. It does not change rail width, labels, or role split. Leaders still see Learn, People, Library, Insights, New, then You.

## Goal

One knowledge brain per scope, backed by a single node and edge store. Every legacy knowledge surface folds into `knowledge_nodes` and `knowledge_edges` with citations. The accountable person sees graph and list views under **Library → Brain** at `/library/brain`. Gap Loop M1 behavior and tests stay untouched; changes to 0021 tables are **additive only** ([issue 370 CDM notes](https://github.com/bjljohnson2012/field-school/issues/370)).

Graphify is an idea reference only. No code copy.

## Already built (reuse, do not redo)

| Area | Where | Notes |
| --- | --- | --- |
| Gap Loop node and edge tables | `app/db/0021_knowledge_gap_loop.sql`, `app/src/lib/db/schema-gap-loop.ts` | `knowledge_nodes`, `knowledge_edges`, evidence arrays, `ref_table` / `ref_id` on nodes |
| Edge `origin` column | `0021` lines 95–96, `schema-gap-loop.ts` | Default `system`. M11 adds `derived` (and any other CDM values) without breaking existing rows |
| Hire-path brain store | `app/db/0010_knowledge_brains.sql`, `app/src/lib/brain/*` | `knowledge_brains`, `brain_sources`, `brain_notes`, `brain_artifacts` |
| In-memory lesson graph | `app/src/lib/knowledge/graph.ts`, `app/src/lib/knowledge/load.ts` | Builds `draws-on` / `reached` edges from brain items with composer unit links |
| Knowledge UI pieces | `app/src/components/knowledge/*` | `EdgeList`, repository list, PRs 351–358 |
| Networks entry | `app/src/app/networks/page.tsx` | Today redirects to `/knowledge` |
| Living brain desk | `app/db/0013_living_brain.sql`, `app/src/lib/living-brain/*`, `/api/living-brain` | Org facts and per-person `outcomes` text for “next step” on Home and Learn |
| Gap Loop M1 tests | `app/scripts/gap-loop-*.test.mjs` | Must pass with **no edits** to their inputs |
| FR-KB brain tests | `app/scripts/fr-kb-*.test.mjs` | Hire-path rules; M11 redirects and unified read must not break Child ≠ User guards |

M10 ([issue 369](https://github.com/bjljohnson2012/field-school/issues/369)) owns the Library chrome: sidebar tree (Brain, Courses, Sessions, Media), moving `/knowledge` and `/brain` into Library, and lesson block editing. M11 owns **unified brain data and `/library/brain` views**, not the nine-block editor choice (Q8).

## Implementation spec (for the build PR, not this prep)

### Schema (additive only)

At implementation start, claim the **next free** migration number using the global rule (`ls app/db` on base branch and `origin/main`, open rebuild branches, and `migrations_claimed` in `docs/rebuild-progress.md`). This prep does not record that number.

Additive changes described in issue 370 and Notion section 5:

1. **Widen `knowledge_nodes.kind`** so backfilled rows from brain items, composer units, coaching units, and reflection submissions have distinct kinds. Existing Gap Loop kinds (`goal`, `requirement`, `concept`, `cluster`, `evidence`) stay valid.
2. **`knowledge_edges`**: ensure `origin` supports at least `system`, `derived`, and any user-action values CDM names. Add an edge **`scope`** column only if CDM defines it separately from the existing scoped columns (`org_id`, `growth_unit_id`, `owner_kind`, …) on each row. Today `origin` already exists in `0021`; do not drop or rewrite it.
3. **No DROP**, no DELETE on production tables (except future M15 retire). Idempotent `IF NOT EXISTS` / guarded `UPDATE` only.
4. Lazy apply helper beside the feature, same pattern as `app/src/lib/gap-loop/sql.ts`.

### Backfill

Idempotent backfill (migration and/or `app/scripts/*` defaulting to `--dry-run`):

| Source store | Target | Citation rule |
| --- | --- | --- |
| `brain_sources` | `knowledge_nodes` | `ref_table` + `ref_id` point at source row; evidence cites the row |
| `brain_notes` | `knowledge_nodes` | same |
| `brain_artifacts` | `knowledge_nodes` | same |
| `knowledge_units` (composer) | nodes (and edges as needed) | cite unit and lesson |
| `coaching_knowledge_units` | nodes | cite coaching unit row |
| Existing Gap Loop nodes | unchanged | count must match before and after |

Derived edges written during backfill or graph inference use **`origin = 'derived'`**. Every backfilled node keeps a citation to its old row.

**Ben runs after deploy** (Notion section 3): run the count check script; compare per-store counts printed on dry run vs apply; post counts on the implementation PR.

### Runtime behavior

1. **One brain view per org scope** (issue acceptance): the active org (and desk scope: family child vs team member) sees one consolidated brain. Reads go through tenancy-aware helpers (`canRead` / brain rules), not cross-org.
2. **Every node shows its source** in list and graph UI: label, `ref_table` / `ref_id`, and evidence lines (same spirit as `EdgeList` evidence list).
3. **Reject inferred edge**: when an edge with `status = 'rejected'` (or equivalent CDM action), it is omitted from graph, list, Insights knowledge section, and Gap Loop graph reads. Acceptance: “hides it everywhere.”
4. **Redirects**: `/knowledge` and `/brain` redirect to `/library/brain` (or to M10’s Library entry that forwards there). `/networks` should end at the same target. Coordinate with M10 so redirect tests are not duplicated conflicting.
5. **Reflection blocks write nodes**: when a learner submits a reflection block on a lesson (block type from M6/M10 template), create or update a `knowledge_nodes` row with evidence citing the lesson block version. Exact block shape is a **Ben decision** (see below).
6. **`living_brains` next step**: move the product meaning of “next step” off `living_profiles.outcomes` / org `outcome` strings onto **enrollments and outcomes** (M7). M11 wires Home, Learn, and `/library/brain` to read next-step from M7 when present; living brain API may dual-read for one release if M7 is not on the branch yet.
7. **Redaction**: any prompt or external model call that includes child-scope content uses `redactChildForPrompt` (`app/src/lib/gap-loop/rules.ts`). No kid-identifying text leaves the server for web research (Gap Loop M2 builds on this later).

### Files the implementation likely touches

- `app/src/lib/knowledge/*` (unify DB graph with today’s `graph.ts` shapes where useful)
- `app/src/lib/gap-loop/store.ts` (edge list queries respect `rejected`)
- `app/src/app/library/brain/*` (new; graph + list views)
- `app/scripts/m11-brains.test.mjs` (new)
- Optional: `app/scripts/brains-backfill.mjs` with `--dry-run` / `--apply`
- Do **not** extend frozen TanStack `src/`. Do **not** flip `AUTH_URL`. Do **not** run production backfill from CI.

## Global acceptance (every rebuild stream)

From issue 370 and Notion section 5, plus M11-specific checks:

- `npm run typecheck`, `npm run build`, and `npm test` pass in `app/`.
- All `app/scripts/gap-loop-*.test.mjs` pass **without modifying those test files**.
- Profile M1 and Wizard tests pass untouched.
- Diff contains no em dash (U+2014), no “Learn with Ben”, no Gym / Foundry / Retainer in new copy.
- No drizzle-kit. No live Stripe. No production DB access from Grok Build.

## Test plan

### Unit and contract tests (`app/scripts/m11-brains.test.mjs`)

Run: `cd app && node --experimental-strip-types --test scripts/m11-brains.test.mjs`.

| # | Behavior | Evidence |
| --- | --- | --- |
| U1 | Migration SQL is additive: no `DROP TABLE` on Gap Loop or brain tables; `knowledge_nodes` / `knowledge_edges` remain | Read migration file in test |
| U2 | Backfill dry-run prints per-store counts for `brain_sources`, `brain_notes`, `brain_artifacts`, composer `knowledge_units`, `coaching_knowledge_units`, and existing `knowledge_nodes` | Parse stdout fixture or stub DB |
| U3 | Second dry-run after apply changes nothing (idempotent) | Counts unchanged |
| U4 | Every backfilled node has non-empty `ref_table`, `ref_id`, and evidence array length ≥ 1 | Query fixture |
| U5 | Derived edge has `origin = 'derived'` | Row assertion |
| U6 | Rejected edge excluded from `loadBrainGraph` (or successor) and from Gap Loop edge listing | Status `rejected` in fixture |
| U7 | `redactChildForPrompt` applied in any new prompt builder for child scope | Static read of module or spy in test |
| U8 | Redirect map includes `/brain` → `/library/brain` and `/knowledge` → `/library/brain` | Route table test alongside M10 |
| U9 | Member rail unchanged: default variant lists Learn, Library, You at 240px | Reuse or extend `m9-shell.test.mjs` assertions; do not default to `shells` |

### Regression (unchanged inputs)

| Command | Pass criterion |
| --- | --- |
| `node --experimental-strip-types --test scripts/gap-loop-citations.test.mjs` | Unchanged |
| `node --experimental-strip-types --test scripts/gap-loop-rules.test.mjs` | Unchanged |
| `node --experimental-strip-types --test scripts/gap-loop-idempotency.test.mjs` | Unchanged |
| `node --experimental-strip-types --test scripts/gap-loop-machine.test.mjs` | Unchanged |
| `node --experimental-strip-types --test scripts/gap-loop-score.test.mjs` | Unchanged |
| `node --experimental-strip-types --test scripts/fr-kb-1-brain.test.mjs` | Unchanged |
| `node --experimental-strip-types --test scripts/fr-kb-2-sync.test.mjs` | Unchanged |

### Integration (local DB or test harness)

| # | Scenario | Pass |
| --- | --- | --- |
| I1 | Org A and org B each see only their nodes at `/library/brain` | Cross-org request returns empty or 403 |
| I2 | Family desk: person in development has no login; brain items for that child scope visible to accountable person only | Matches `canReadBrain` / intent rules |
| I3 | Team desk: no child rows on brain view | `sales_has_no_children` invariant |
| I4 | Publish brain note via hire-path API still works; unified view shows the node with source link | FR-KB-2 sync path |
| I5 | Gap Loop goal page still creates goals; M1 loop still runs | Smoke on `/knowledge/goals` |

### Live lanes (implementation PR head, after M10 is on branch)

Ten lanes on a cloud VM at implementation head, browser via control-ui, per rebuild section 7. Screenshots at **1440** and **390**. M11 is not a `designer_seal` stream; screenshots are evidence, not a merge gate.

| Lane | Steps | Pass |
| --- | --- | --- |
| L1 | Leader opens `/library/brain` from Library tree | Graph or list renders; brain switcher unchanged |
| L2 | Member opens `/library/brain` | Same URL allowed if Library visible; rail still Learn / Library / You only |
| L3 | Open node detail | Source table and id visible |
| L4 | Reject a proposed edge in UI | Edge disappears from list and graph after refresh |
| L5 | Visit `/brain` and `/knowledge` | 308/301 to `/library/brain` |
| L6 | Visit `/networks` | Lands on unified brain view |
| L7 | Household child on desk: no PII in network tab for brain export | No child name in analytics payloads |
| L8 | Insights knowledge section matches `/library/brain` edge set | No rejected edge |
| L9 | `/c/grok-bot` guest path still public | Unaffected |
| L10 | Run backfill `--dry-run` on fixture | Printed counts match seeded rows |

### Perf (lightweight)

| Metric | Rule |
| --- | --- |
| Brain graph query for ≤ 500 nodes | p95 &lt; 300ms on local Postgres fixture |
| Backfill apply on fixture | Second run 0 inserts |

## Coordination with M10

| Topic | Owner |
| --- | --- |
| Library sidebar includes “Brain” | M10 |
| Redirects from legacy `/brain`, `/knowledge` | M10 sets routes; M11 provides target content and agrees on final path `/library/brain` |
| Block editor and nine-block template | M10 |
| Reflection block type definition in lesson JSON | M6/M10 schema; M11 writes nodes on submit |
| Sessions list and recaps | M10; recap rows may already write `brain_notes` (M8); M11 folds into nodes |

Do not start M11 implementation until M10’s draft PR exists so `/library` shell and redirects are real.

## Ben decisions (do not guess)

| # | Decision | Why open | Evidence |
| --- | --- | --- | --- |
| B1 | Exact set of new `knowledge_nodes.kind` values for each backfill source | Issue 370 says “widen” but does not enumerate kinds | [Issue 370](https://github.com/bjljohnson2012/field-school/issues/370) scope table; `0021` CHECK currently `goal`, `requirement`, `concept`, `cluster`, `evidence` |
| B2 | Meaning of edge **`scope`** column if added | `knowledge_edges` already has scoped ownership columns and `origin` in `0021` | Issue 370 text vs `app/db/0021_knowledge_gap_loop.sql:81-97` |
| B3 | Allowed values for `knowledge_edges.origin` beyond `system` and `derived` | Needed for user-accepted edges vs inferred | Issue 370; `ensureEdge` in `gap-loop/store.ts` inserts `'system'` today |
| B4 | Definition of **“one brain per scope”** (per org, per `growth_unit`, per `knowledge_brains` row, or per desk child) | Acceptance wording; multiple growth units per org exist in `0010` | `growth_units` / `knowledge_brains` in `0010_knowledge_brains.sql` |
| B5 | **Reflection block** JSON shape and which block kinds create which node kinds | No `reflection` block in `content-model.ts` on main today | Issue 370; `app/src/lib/collections/content-model.ts` on `origin/main` lists text, bullets, quote, clip, assignment, quiz, station, course only |
| B6 | Cutover for **living_brains next step** vs M7 enrollments (dual-read duration, which UI reads which) | Issue 370 + Notion M11 bullet; M7 may not be on branch | Notion M11; `living_brains` / `living_profiles` in `0013_living_brain.sql`; M7 issue 366 |

B1-B6 were sealed by CDM on 2026-10-14, delegated by Ben. The seal table at the top of this file is the record. The implementation follows that table.

## What this prep does not change

- `docs/rebuild-progress.md`
- `app/db/*` (no migration file in this prep PR)
- `AUTH_URL`, Stripe, `CHECKOUT_GO_LIVE`, `COACHING_GO_LIVE`
- Member rail default (240px Learn / Library / You)
- `app/deploy/*` and production scripts
- Frozen TanStack `src/`

## Prep PR acceptance (this document only)

- [x] `docs/rebuild/m11-brains-prep.md` exists on a branch cut from `origin/main` at or after `4eaf464cfa19c2c7a1e0b552490a31f5515e79ef`
- [x] Spec and test plan only; no product code
- [x] Dependencies and M10 build gate documented with pointer to `docs/rebuild-progress.md`
- [x] Ben decisions listed with evidence, not invented enums
