# M13 Payload spike prep

This file is the spec and the test plan for [issue 376](https://github.com/bjljohnson2012/field-school/issues/376). It does not run the spike. It arms the throwaway implementation on `spike/payload-m13` after the dependencies below are met.

The reference packet on [#376 (comment)](https://github.com/bjljohnson2012/field-school/issues/376#issuecomment-6068407260) is `PLATFORM-REFERENCE-PACKET.md`. Where that comment, [#363](https://github.com/bjljohnson2012/field-school/issues/363), [#376](https://github.com/bjljohnson2012/field-school/issues/376), or `docs/rebuild-progress.md` disagree, `docs/rebuild-progress.md` wins for stream order and gates. CDM notes on the issue win for spike safety (copy only, no merge, Drizzle stays runtime until Ben and CDM decide after the report).

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. No live Stripe. This prep does not deploy, does not apply SQL on campus, and does not edit `docs/rebuild-progress.md`.

## Stream placement

| Field | Value |
| --- | --- |
| Stream | M13 |
| Issue | [#376](https://github.com/bjljohnson2012/field-school/issues/376) |
| Implementation branch | `spike/payload-m13` (throwaway, **never merge**) |
| Gate | `never_merge_spike` |
| Depends on | M6 (merged), M11 (not started) |
| Base at spike start | Tip of `feat/portal-m11-brains` when M11 is accepted, per `docs/rebuild-progress.md` |
| Downstream | [M14 / #377](https://github.com/bjljohnson2012/field-school/issues/377) stays `not_started` until this report exists and a **sealed brief** is posted on #377 |

Notion [Master Rebuild Run Order (Oct 8, 2026)](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d) matches GitHub: walk order places M13 after PM3, GL2, PM4, and GL3; M14 follows M13. M13 is not in `ben_merge_order`.

## Goal

Decide, with evidence, whether [Payload CMS](https://github.com/payloadcms/payload) can run the **admin and content layer** for Field School collections already modeled Payload-shaped on Drizzle, without putting learner traffic on Payload yet.

The spike answers architecture residuals from the reference packet. It does **not** seal Evolution, does **not** replace the campus runtime, and does **not** fork LearnHouse or AppFlowy code.

## Dependencies (read before arming)

### M6 (satisfied for spike planning)

M6 is **merged** on `origin/main` (`docs/rebuild-progress.md`, stream `status: merged`, PR 391, migration `app/db/0023_content_model.sql`). Content collections are described in `app/src/lib/collections/content-model.ts` as `CONTENT_COLLECTIONS` (courses, modules, lessons, practice, course_versions, lesson_versions). Tables and columns are defined in `app/db/0023_content_model.sql`.

Campus was at main tip `9447e7e` with smoke passed (same file). `app/deploy/deploy.sh` still omits several migrations including `0023`; that is a deploy gap, not a blocker for a **local copy** spike. Do not use production Postgres as the Payload target.

### M11 (not started; hard gate)

M11 ([#370](https://github.com/bjljohnson2012/field-school/issues/370), branch `feat/portal-m11-brains`) is **`not_started`** on `docs/rebuild-progress.md`. The spike **must not start** until M11 has a draft PR at `feat/portal-m11-brains` and the tables it touches exist on that branch tip.

Issue #376 draft scope: Payload pointed at a **copy** of the **M6 and M11** tables. M11 scope (issue #370) includes additive changes to Gap Loop tables from `app/db/0021_knowledge_gap_loop.sql` (`knowledge_nodes`, `knowledge_edges`), brain stores from `app/db/0010_knowledge_brains.sql`, and unified brain views. Descriptors already live in `app/src/lib/gap-loop/collections.ts`. Evolution-shaped collections are in `app/src/lib/evolution/collections.ts` via `app/src/lib/collections/registry.ts`.

**Do not** implement M11 inside the spike branch. **Do not** claim a migration number in this stream.

## Already built (do not redo)

| Asset | Location | Spike use |
| --- | --- | --- |
| Content Payload-shaped registry | `app/src/lib/collections/content-model.ts` | Map to Payload collections; do not redefine block kinds |
| Gap Loop Payload-shaped registry | `app/src/lib/gap-loop/collections.ts` | Map M11-touched tables; do not duplicate field lists |
| Evolution Payload-shaped registry | `app/src/lib/evolution/collections.ts` | Hook and naming experiments only |
| M6 SQL on main | `app/db/0023_content_model.sql` | Schema source for copy |
| Gap Loop SQL on main | `app/db/0021_knowledge_gap_loop.sql` | Schema source before M11 additive columns |
| Brains SQL on main | `app/db/0010_knowledge_brains.sql` | Context for M11 backfill targets |

Drizzle remains the **runtime** for campus until Ben and CDM decide after the report (CDM notes on #376).

## Safety locks (non-negotiable)

- **No merge to `main`.** Close or abandon the spike PR; keep the report on GitHub.
- **No live traffic** on Payload. No campus route serves Payload admin to parents or learners during the spike.
- **Copy only:** point Payload at a **disposable** Postgres database loaded from a schema/data subset. Ben or an operator supplies `pg_dump` from a non-production source, or seeds from fixtures. No data-deleting script against production.
- **No `AUTH_URL` flip.** No production deploy from this stream.
- **No live Stripe.** No `sk_live_` usage.
- **No new SQL file in `app/db/`** on the spike branch for campus merge. If the spike needs DDL for a local copy, keep it outside `app/db/` (for example `spike/payload-m13/local/`) and never apply it to campus.
- **Do not read or print `GROK_API_KEY`.**
- **Child ≠ User** and **no child login** remain ethos locks during experiments.

## What the spike measures

Each experiment produces a dated artifact (screenshot, log excerpt, config snippet without secrets, or short screen recording). Store artifacts under the spike PR branch (for example `spike/payload-m13/evidence/`) and list them in the report index.

### 1. Collection mapping fidelity

**Question:** Can Payload collections express M6 and M11 shapes with acceptable friction?

**Procedure:**

- Register Payload collections that mirror `CONTENT_COLLECTIONS` slugs and required fields (`org_id` relationships, `blocks` json on lessons, practice rows, version snapshots).
- After M11 lands, register collections for Gap Loop and brain tables M11 extends (`knowledge_nodes`, `knowledge_edges`, and related brain tables per M11 issue).
- Import a **small** copied dataset (one household org, one team org, grok-bot course, a handful of nodes/edges).

**Evidence:**

- Field-by-field mapping table (Payload field → Drizzle column).
- List of mismatches (json block union, `_status` vs `status`, `ref_table`/`ref_id` citations, versioning).
- Admin screenshots: edit one lesson block, one node with citation.

**Pass:** Admin can CRUD representative rows without hand-written SQL. **Fail:** Block union or org scoping cannot be modeled without abandoning Payload schema tools.

### 2. Database topology (same Postgres vs separate)

**Question:** For a **future** live Payload (not this spike), is same-instance Postgres viable?

**Procedure:**

- Run two configurations on the copy DB only:
  - **A:** Payload Postgres adapter on the **same** database as copied Drizzle tables (separate schema or prefixed tables per Payload docs).
  - **B:** Payload on a **second** database with logical replication or ETL from the copy.
- Document migration adapter behavior, table name collisions, and backup/restore story.

**Evidence:**

- Connection strings redacted; schema diagram for A and B.
- Notes on `payload` internal tables vs `courses`/`lessons`/`knowledge_nodes`.
- Any adapter errors when Drizzle migrations and Payload init run against the same copy.

**Pass:** Clear recommendation with reproducible steps. **Fail:** Adapter cannot coexist on copy without destructive DDL.

### 3. next-auth coexistence

**Question:** Can campus keep **next-auth v5** for learners while operators use Payload admin?

**Procedure:**

- Run campus `app/` with existing auth unchanged on the spike VM.
- Mount Payload admin on a separate path or port (spike choice documented).
- Test: signed-in dean session on campus does not require a second Payload login for read-only preview, **or** document why dual login is required.

**Evidence:**

- Sequence diagram or bullet flow for cookie/session boundaries.
- Screenshot of campus session + admin session side by side.
- List of shared identity fields (`users`, `memberships`) vs Payload `users` collection.

**Pass:** Documented coexistence path with no learner-facing Payload routes. **Fail:** Only viable path forces child or member login through Payload.

### 4. Hooks and Evolution-shaped writes

**Question:** Can Payload hooks emit shapes compatible with `traitsFromDrop` and OnboardJS-save intent?

**Procedure:**

- Implement one `afterChange` hook on a profile-shaped collection that writes a dry-run payload (console or local table), not the sealed adult profile store.
- Feed sample wizard step payloads (text, file metadata) through the hook.

**Evidence:**

- Hook source in spike branch only.
- JSON samples matching `Trait[]` from `app/src/lib/evolution/collections.ts`.

**Pass:** Hook output matches typed traits without HTML in profile fields. **Fail:** Hook cannot access org scope or violates Child ≠ User labeling.

### 5. Naming and copy (Student Profiles vs FS language)

**Question:** What admin labels match FS locks?

**Procedure:**

- Compare Payload admin labels for `student-profiles` / `profiles` slugs against `RECORD_COLLECTIONS` and `EVOLUTION_COLLECTIONS` in `app/src/lib/collections/registry.ts`.
- Record UI strings for household vs team rooms.

**Evidence:**

- Screenshot of collection list and one edit view.
- Explicit mapping table: Payload label → desk copy → SQL table.

**Pass:** Report can answer the naming residual with yes/no (see report section). **Fail:** Payload forces "Student" on child rows visible to parents.

### 6. Operator admin scope (blocked on Ben)

**Question:** Is Payload admin operator-only, parent-visible, or split?

**Status:** Open in reference packet section 6 item 3. **Do not guess.** Spike runs **operator-only** experiments first. If Ben chooses parent-visible before spike execution, repeat experiment 1 with role-based access.

### 7. Engineering smoke

**Procedure:** On spike branch only: `npm run typecheck` and `npm run build` in `app/` with Payload dependency added as documented in spike README. No requirement to merge.

**Evidence:** CI log or local command output in PR comment.

## Time box

Issue #376 pstack notes: Product proposes **one week**, no live traffic. Treat that as the default budget unless Ben posts a different limit on #376 or #363.

## Implementation branch mechanics

1. Branch `spike/payload-m13` from the tip of `feat/portal-m11-brains` when M11 is ready (not from `main` alone).
2. Open a **draft** pull request. Title pattern: `spike: M13 Payload (do not merge)`.
3. Label or body must state: **never merge**, gate `never_merge_spike`.
4. pstack method: [cursor/plugins pstack skills](https://github.com/cursor/plugins/tree/main/pstack/skills) for execution discipline; no autopilot merge.
5. No CDM MERGE GO applies; closing the PR without merge is success.

## Report for M14 (#377)

M14 ([#377](https://github.com/bjljohnson2012/field-school/issues/377)) **must not start** until:

1. The M13 report below is posted, and
2. A **sealed Evolution brief** is posted on #377 (`gate: sealed_brief_on_377` in `docs/rebuild-progress.md`).

The spike does not post the sealed brief. Ben/CDM seal Evolution after reading the report.

### Where to publish

Post the report as a **top-level GitHub comment** on [#376](https://github.com/bjljohnson2012/field-school/issues/376) with title line:

`M13 Payload spike report`

Link the throwaway PR head SHA in the first paragraph. Do not rely on merging markdown to `main`; the issue comment is the durable record.

Optional: attach the same markdown under `spike/payload-m13/M13-REPORT.md` in the closed PR for diff review.

### Report template (implementation agent fills this)

```markdown
## M13 Payload spike report

- Date (ET):
- Spike PR (closed or open):
- Head SHA:
- Postgres copy source (describe; no credentials):
- M11 PR SHA merged into spike base:

### Residual verdicts

Answer each with **Yes** or **No**, one paragraph of evidence, and links to artifacts.

Issue #376 acceptance cites **three** residuals in `PLATFORM-REFERENCE-PACKET.md`. The packet comment on #376 lists **four** bullets under "Residual (for Evolution seal after spike)". Use **four** rows unless Ben or CDM retitles #376.

| # | Residual question | Yes / No | Evidence |
| --- | --- | --- | --- |
| 1 | Keep **Drizzle** as the long-term runtime (Yes = stay on Drizzle; No = migrate runtime to Payload) | | |
| 2 | **Same Postgres instance** is acceptable when Payload goes live (Yes = same instance with separation; No = separate DB required) | | |
| 3 | **next-auth coexistence** is viable without forcing learners through Payload login (Yes = viable path documented; No = not viable) | | |
| 4 | Adopt Payload **naming** for profile collections in admin without breaking Child ≠ User (Yes = mapping accepted; No = rename or skip Payload admin for parents) | | |

### Experiment summary

| Experiment | Pass / Fail | Artifact links |
| --- | --- | --- |
| 1 Collection mapping | | |
| 2 Database topology | | |
| 3 next-auth coexistence | | |
| 4 Hooks / traits | | |
| 5 Naming | | |
| 7 Engineering smoke | | |

### Recommendation for the sealed brief on #377

Short paragraph: what M14 should assume for base branch, runtime (Drizzle vs Payload), admin surface, and migrations. Do not write the sealed brief here.

### Ben / CDM decisions still open

List only items that evidence did not settle.
```

### Sealed brief on #377 (after report)

Product/CDM posts the Evolution seal on [#377](https://github.com/bjljohnson2012/field-school/issues/377) per [#363 section B](https://github.com/bjljohnson2012/field-school/issues/363). That comment sets M14 `base`, acceptance, and migration stance (`base: set_by_sealed_brief` in progress YAML). PM updates `docs/rebuild-progress.md` on a separate chore branch when M14 is armed, not in the spike PR.

## Acceptance (spike implementation, not this prep PR)

- [ ] Dependencies: M11 draft PR exists; spike bases on `feat/portal-m11-brains` tip.
- [ ] Payload runs against a **copy** database only; no production writes.
- [ ] Report comment on #376 with four residual yes/no answers and artifact index.
- [ ] Throwaway PR marked do not merge; closed or left open without merge.
- [ ] `npm run typecheck` and `npm run build` pass in `app/` if the spike adds Payload beside campus.
- [ ] No new `app/db/` migration file; no `AUTH_URL` or go-live flag changes.
- [ ] Sealed brief on #377 is **out of scope** for the spike agent.

## Ben decisions (do not guess)

| Decision | Why it is open | Evidence |
| --- | --- | --- |
| Payload admin audience (operator-only vs parent-visible) | Reference packet section 6 item 3 is unanswered | [#376 comment](https://github.com/bjljohnson2012/field-school/issues/376#issuecomment-6068407260), "Payload admin: operator-only, or also parent-visible?" |
| Three vs four residual questions in acceptance | Issue body says "three residuals"; packet comment says answer **four** items under Residual | [#376 body](https://github.com/bjljohnson2012/field-school/issues/376) acceptance row vs same comment "Residual (for Evolution seal after spike)" bullets |
| Runtime after spike (Drizzle vs live Payload) | Explicitly deferred until after report | #376 CDM notes: "Drizzle stays the runtime unless Ben and CDM decide otherwise **after the report**" |
| Spike time-box if not one week | Only Product default stated | #376 pstack notes: "Time-box (Product proposes one week)" |
| M14 base branch and migrations | Set only at sealed brief | #377 body: "Branch: `set at seal`", "Draft PR scope: Set by the sealed Evolution brief" |

No other Ben choices are required to **arm** this prep. The spike agent stops and lists new decisions if experiments contradict ethos locks.

## Prep PR (this document)

Branch `cursor/m13-payload-spike-spec-da2d` from `origin/main` at or after `4eaf464cfa19c2c7a1e0b552490a31f5515e79ef`. This PR adds only `docs/rebuild/m13-payload-spike-prep.md`. It may merge to `main` as documentation. It does not change stream status in `docs/rebuild-progress.md`.
