# PM4 profile prep

This file is the spec and the test plan for [issue 374](https://github.com/bjljohnson2012/field-school/issues/374). Issue 374 and the CDM notes on that issue win over this table when they disagree.

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. No live Stripe. This prep does not deploy, does not run production scripts, and does not flip flags.

## Stream placement

| Field | Value | Evidence |
| --- | --- | --- |
| Stream | PM4 | `docs/rebuild-progress.md` streams YAML, issue 374 |
| Issue | [#374](https://github.com/bjljohnson2012/field-school/issues/374) | GitHub |
| Branch | `feat/profile-m4` | Issue 374 |
| Base | `feat/profile-m3` | Issue 374, Notion run order, `docs/rebuild-progress.md` |
| `depends_on` | PM3 only | `docs/rebuild-progress.md` (`depends_on: [PM3]`) |
| `gate` | `none` | `docs/rebuild-progress.md` |
| `walk_order` | after PM3, before GL3 | `docs/rebuild-progress.md` |
| PM3 status | `not_started` | `docs/rebuild-progress.md` |

Do not cut `feat/profile-m4` or ship product code until PM3 exists on its branch and its prep or draft PR is accepted. PM4 is spec-only here. Grok Build starts PM4 only after PM3 is buildable.

Notion [Field School Master Rebuild Run Order (Oct 8, 2026)](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d) matches the graph: `PM3 --> PM4`, base `feat/profile-m3`, gate `none`.

## Goal

Finish the reserved Profile set after PM3:

1. Resume ingest lands in **skills and projects** with the same dedupe rules as Profile M1 enrichment.
2. Signed-in **peer** profile views show more depth than the PM3 public cut.
3. **E4** closes: adult gate marks merge in one atomic JSONB write under concurrent finishes.

Issue acceptance (374):

- A resume adds skills without duplicates.
- Gate merges are atomic under concurrent submits.

## What PM3 must land first (do not rebuild in PM4)

From [issue 372](https://github.com/bjljohnson2012/field-school/issues/372):

- Profile panel on `/people/[membershipId]`.
- Wizard placements create suggested Outcomes and evidence nodes.
- Two-view adult profile (private, public) with a privacy cut.
- People in development never get a public view or photo.
- Profile reads as part of the brain, not a checklist.

PM4 extends that People profile and the owner profile import path. It does not replace PM3 routing, public slug behavior, or PM3 privacy tests.

## Already built on main (do not redo)

| Area | Where | Notes |
| --- | --- | --- |
| LinkedIn PDF review and accept | `app/src/lib/enrichment/*`, `app/src/app/api/profile/import/*`, `EnrichmentPanel` | PR 344, M2 tests in `app/scripts/assessment-wizard-m2.test.mjs` |
| Skill and project dedupe | `addSkill`, `addProject`, `acceptImport` in `app/src/lib/enrichment/store.ts` | `matchKey`, `findExact`, `onConflictDoNothing` |
| Gate seam | `recordAdultGate` in `app/src/lib/profile/store.ts`, `recordTrackGate` in `app/src/lib/assessments/gate-sink.ts` | E5 PASS; E4 still HELD in `docs/staff/ENGINEERING_GRAPH.md` |
| Audience model | `audienceCut` in `app/src/lib/assessments/model.ts` | `self` and `peer` see all placements; `public` is personality-only |
| Profile M1 locks | `app/scripts/profile-m1.test.mjs` | No public URL, resume, or LinkedIn on M1 surfaces until PM3 opens share |

## CDM notes (win over the tables below)

- No new **public** fields without a privacy review. Peer-only fields are not public, but anything on the anonymous public view still needs the PM3 privacy matrix plus review if extended.

## 1. Resume ingest into skills and projects

### Current behavior (baseline)

- User uploads a LinkedIn PDF export (or paste-derived text). `reviewImport` returns candidates. `acceptImport` writes:
  - `skill` candidates through catalog dedupe into `profile_skill_links` (no duplicate skills).
  - Non-skill candidates (`experience`, `education`, `certification`, `headline`) into `profile_entries` only.

Evidence: `acceptImport` in `app/src/lib/enrichment/store.ts` branches on `candidate.kind !== "skill"` for entries.

Issue 374 scope names **skills and projects**, not entries alone.

### Target behavior

Keep the LinkedIn PDF path and review UI. Do not fetch LinkedIn over the network. Keep the profile URL as a label only (`parseProfileUrl`).

On **accept**:

| Candidate kind | PM4 write target | Dedupe rule |
| --- | --- | --- |
| `skill` | `profile_skills` + `profile_skill_links` | Unchanged M1 path: `matchKey(title)`, `findExact` on catalog, link existing skill, never duplicate rows |
| `experience` | `profile_projects` + `profile_project_links` | Reuse `addProject` rules: project **name** is `organization` when non-empty, otherwise `title`; **role** is `title` when organization is set, otherwise empty; `matchKey` on the member's project link set; refuse duplicate with `already_in_system` semantics |
| `education`, `certification`, `headline` | `profile_entries` | Unchanged unless Ben chooses otherwise (see decisions) |

Skills accepted from a resume must not create a second link for the same `skill_id`. Re-importing the same export must land in `alreadyOnProfile` or `linkedExisting`, not duplicate links.

Experience accepted from a resume must not create a second project link for the same `match_key` on that member.

Optional UX (implementation detail, not locked here): default experience rows to **on** in the accept checklist, with per-row skip, same as today for skills.

### Out of scope unless Ben extends

- Parsing non-LinkedIn resume PDF layouts (only `candidatesFromText` / LinkedIn export layout is on main).
- Storing the PDF file (text is read in memory today via `pdfText`).

### pstack

Reuse the M1 dedupe path (`names.ts`, `store.ts`). No parallel dedupe tables.

## 2. Richer peer view depth

### Definitions

| Audience | Who | Placement cut | Profile enrichment |
| --- | --- | --- | --- |
| `self` | Owner on `/profile` | All tracks | Full enrichment panel |
| `peer` | Signed-in org member with access to `/people/[membershipId]` | `audienceCut("peer", …)` → all tracks | PM4 adds depth (below) |
| `public` | Anonymous or unauthenticated public share (PM3) | Personality only | PM3 public cut only |

Evidence for placement cut: `app/src/lib/assessments/model.ts` (`audienceCut`).

### PM4 peer depth (minimum)

On `/people/[membershipId]` when the viewer is a **peer** (not the subject, not a public token):

Show the same assessment placement summary the subject sees on their own profile (`AssessmentResults` rules: locked at ≥75%, best read copy for unsettled), for **Skills** and **Profile** tracks as well as Personality.

Show enrichment depth:

- Skills list with level when present.
- Projects list with role and link when present.
- Timeline entries (`profile_entries`) for experience, education, certification, and headline that are not duplicated as project rows.

Hide on peer view (same as PM3 private/public rules where applicable):

- Email and direct contact fields.
- Kid or person-in-development records (no peer profile surface for them).
- Anything PM3 marks public-off.

Peer view must not expose fields that the public view hides **unless** they are assessment placements already allowed for peers in `audienceCut`.

### Access control

Reuse PM3 and tenancy checks: `assertCanAccessMember` (or successor on `feat/profile-m3`) before rendering peer depth. No cross-org leakage. A User's import sources stay scoped to their `member_id` (existing enrichment store comments).

## 3. Atomic gate merge (E4)

### Problem

`recordAdultGate` today does read → `markGate` in memory → write `gates` JSONB. Two concurrent finishes can race and drop a gate mark.

Evidence: `recordAdultGate` in `app/src/lib/profile/store.ts` (read `row.gates`, then `update` full object).

`loadAdultProfile` also merges derived `G-personality` marks and may write gates; concurrent `recordAdultGate` and load can race. PM4 must at least fix the **gate-sink** path used by Tools and wizard finishes.

### Target

`recordAdultGate` performs **one** SQL `UPDATE` that merges the gate mark into `user_profiles.gates` atomically:

- If the gate id is absent: set `firstAt` and `lastAt` to the event time.
- If present: keep `firstAt`, set `lastAt` to the event time (retake behavior unchanged from `markGate` in `app/src/lib/profile/model.ts`).

Implement via a small SQL expression (`jsonb_set` / `||` with a merge function) or an idempotent SQL function applied lazily like `app/src/lib/gap-loop/sql.ts`. Do **not** claim a migration number in the prep PR. On the implementation branch, claim the next free migration in `docs/rebuild-progress.md` before adding `app/db/*.sql`, per rebuild dispatcher rules.

E4 node in `docs/staff/ENGINEERING_GRAPH.md` moves to PASS when this ships and tests prove concurrency.

### Sealed Profile M1

`docs/staff/ENGINEERING_GRAPH.md` assigns E4 to the Profile M1 owner. PM4 implementation may touch `app/src/lib/profile/store.ts` only for the atomic gate write and tests. Do not relax Profile M1 tests or kid privacy rules.

## What this prep does not change

`docs/rebuild-progress.md`. `app/src`. `app/db`. `app/marketing-site`. `AUTH_URL`. `CHECKOUT_GO_LIVE`. `COACHING_GO_LIVE`. Live Stripe. Production data deletes. `GROK_API_KEY`. Deploy scripts.

## Test plan

### Cases on this prep PR (docs only)

1. Diff adds only `docs/rebuild/pm4-profile-prep.md`.
2. No migration file and no `migrations_claimed` edit in this PR.

### Cases the PM4 implementation PR runs (after PM3)

Run from `app/` after `npm ci` on `feat/profile-m4` based on `feat/profile-m3`.

**Resume ingest**

1. Fixture LinkedIn export text (`assessment-wizard-m2.test.mjs` `EXPECTED_IMPORT`). Accept skill rows twice; second accept yields no duplicate `profile_skill_links` for the same skill.
2. Accept an experience row; assert a `profile_project_links` row exists with expected `match_key`. Accept the same experience again; assert no duplicate link and stable `alreadyOnProfile` / idempotent behavior.
3. `node --experimental-strip-types --test scripts/assessment-wizard-m2.test.mjs` still passes (enrichment contracts unchanged except new project mapping).

**Peer depth**

4. New test file (name TBD on implementation), e.g. `app/scripts/profile-m4-prep.test.mjs`: peer fixture on `/people/[membershipId]` includes skills, projects, entries, and non-personality placements when fixtures provide them; public fixture does not show Skills/Profile placements; person-in-development fixture has no public or peer profile URL.
5. Privacy: peer HTML or JSON fixtures exclude email and PM3-forbidden public fields.

**E4 atomic gates**

6. Concurrent test: two parallel `recordAdultGate` calls for **different** gate ids both appear in final `gates`.
7. Concurrent test: two parallel calls for the **same** gate id preserve `firstAt` and set `lastAt` to the later timestamp.
8. `node --experimental-strip-types --test scripts/tool-results.test.mjs` and gate-seam tests in `assessment-wizard-m2.test.mjs` still pass.

**Regression**

9. `node --experimental-strip-types --test scripts/profile-m1.test.mjs`.
10. `npm run typecheck` and `npm run build` in `app/` exit 0.

### Cases deferred until PM3 is merged into the PM4 base

Do not treat PM4 as green until PM3 People panel, public share, and PM3 privacy tests exist on `feat/profile-m3`.

## Ben decisions (not guessed)

| # | Decision | Why it is open | Evidence |
| --- | --- | --- | --- |
| 1 | Should imported **education** or **certification** rows also create **projects**, or stay `profile_entries` only? | Issue 374 names skills and projects; only experience maps cleanly to projects without new copy rules | Issue 374 scope table; `acceptImport` today writes non-skills to entries only |
| 2 | Exact **peer** field list beyond skills, projects, entries, and full placement tracks (e.g. photo, headline, adapted skills JSON on `user_profiles`) | Issue 374 says "richer peer view depth" without a field matrix; PM3 owns public cut | Issues 374 and 372 |
| 3 | Should **atomic gate merge** also cover `loadAdultProfile` personality-derived gate writes, or only `recordAdultGate` / gate-sink? | Personality merge is a second read-modify-write on `gates` | `loadAdultProfile` in `app/src/lib/profile/store.ts`; E4 text in `ENGINEERING_GRAPH.md` names `recordAdultGate` only |
| 4 | Support **non-LinkedIn** resume PDFs in PM4? | Only LinkedIn export parsing exists on main | `candidatesFromText` in `app/src/lib/enrichment/linkedin.ts`; issue title says "resume ingest" |

## Files on this prep branch

This document only. Implementation adds tests and code on `feat/profile-m4` later.
