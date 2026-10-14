# Profile M3 prep

## CDM seal (2026-10-14)

CDM sealed these choices on 2026-10-14, delegated by Ben. This note is the merge go. Designer seal and CDM MERGE GO are recorded here. The build run does not deploy.

| Decision | Sealed choice |
| --- | --- |
| D1 Public allowlist | Display name, photo, headline, bio, public skills, public projects, LinkedIn URL. Never email, phone, org or family members, children, assessments, personality results, coaching records, or progress. |
| D2 Share slug | Opaque random slug, at least 10 characters, URL-safe. Never the membership id. Sharing is off by default and opted in per person. Revoking kills the slug immediately. Re-enabling mints a new slug. Adults only. Never children. No person in development appears in a public URL or photo upload UI. |
| D3 Outcomes | Personality placements are outcomes. Skills and Profile are evidence-only until a later refinement. |
| D4 Home | Home shows a first-course CTA that links to an existing enrollment or catalog slug. |
| D5 Label | Keep the label "Person in development". |
| D6 Wizard finish | Plain heading. Not Flip Text. |

PM3 is the profile and share surface. It does not own the GL2 cron, embeddings, or web-research client. Migration is `app/db/0030_pm3_profile.sql` only. 0029 stays free for GL2. 0028 is not edited.

This file is the spec and the test plan for [issue 372](https://github.com/bjljohnson2012/field-school/issues/372). The implementation lands on a branch cut from current `origin/main` after M11.

**Build assumption (PM directive, Oct 14, 2026):** M5 tenancy and M9 shell are deployed. M11 brains unified is not started. The dispatcher log on `chore/rebuild-progress` may still list earlier streams as blocked or `not_started`; this prep follows the PM directive for dependency readiness, not that halt state.

**Gate:** `designer_seal` (see [Designer seal checklist](#designer-seal-checklist)). There is no sealed visual packet for Profile M3 like M9 received on Oct 14, 2026. Designer review happens on the implementation draft PR.

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. No live Stripe. No deploy from a build run. CDM MERGE GO before merge. This prep does not claim a migration number and does not add SQL.

Sources, in order when they conflict: Ben locks in [#363 section B](https://github.com/bjljohnson2012/field-school/issues/363), CDM notes on [#372](https://github.com/bjljohnson2012/field-school/issues/372), `docs/rebuild-progress.md` for `depends_on` and `gate`, [Notion run order](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d), then this file.

## Depends on

| Stream | Issue | Role for PM3 |
| --- | --- | --- |
| M5 | [#364](https://github.com/bjljohnson2012/field-school/issues/364) | Family and team org scope, `membership_id` on desks, homeschool as a mode. Deployed per PM directive. |
| M9 | [#368](https://github.com/bjljohnson2012/field-school/issues/368) | Shell, People in the rail, `/dashboard` Home, brand tokens on campus. Deployed per PM directive. Wizard meter and neural finish repaint in `#1E4E8C` are M9 scope when behavior and tests stay unchanged ([#368 CDM notes](https://github.com/bjljohnson2012/field-school/issues/368)). |
| M11 | [#370](https://github.com/bjljohnson2012/field-school/issues/370) | Unified brain, `knowledge_nodes` / `knowledge_edges` with citations, `/library/brain`, redirects from `/knowledge` and `/brain`. Not started. PM3 writes suggested Outcomes and evidence nodes through the M11 graph, not parallel brain tables. |

`depends_on` in `docs/rebuild-progress.md`: `[M5, M9, M11]`. Walk order places PM3 after M11 and M12 in the epic table; the YAML dependency list is what blocks the build.

## Goal

From [#372](https://github.com/bjljohnson2012/field-school/issues/372) and [#363 Rec 11](https://github.com/bjljohnson2012/field-school/issues/363):

- The adult profile becomes part of **People** and **Learn**, not an isolated checklist under You only.
- **Wizard placements** create **suggested Outcomes** and **evidence nodes** on the person's brain (M11).
- Finishing the Wizard **suggests a first course on Home** (`/dashboard`).
- **Two-view adult profile:** private (self and permitted peers) and **public** with a **privacy cut**.
- **People in development** never get a public view or a photo ([#363 section B](https://github.com/bjljohnson2012/field-school/issues/363), [#372 CDM notes](https://github.com/bjljohnson2012/field-school/issues/372)).
- Profile **reads as part of the brain**, not a gate checklist (Designer finding #10, [#363 comment](https://github.com/bjljohnson2012/field-school/issues/363#issuecomment-6068081005)).

Profile M1 **behavior** and Assessment Wizard **behavior** stay as built ([#363 section B](https://github.com/bjljohnson2012/field-school/issues/363)). PM3 adds views, wiring, and brain links. It does not change gate math, retake rules, ceilings, or the 75% lock threshold ([`app/scripts/assessment-wizard-m2.test.mjs`](../../app/scripts/assessment-wizard-m2.test.mjs)).

## Scope

### In scope (implementation PR on `feat/profile-m3`)

| Area | Spec |
| --- | --- |
| People profile panel | On `/people/[membershipId]`, for **login adults** in the active org, show the Profile M1 + M2 surface: display name, campus photo (upload or https source stored as media), projects, skills, assessment summary, and brain edges where M11 provides them. Reuse [`app/src/app/profile/page.tsx`](../../app/src/app/profile/page.tsx) panels and APIs where possible. The person page today is coaching-card heavy ([`app/src/app/people/[membershipId]/page.tsx`](../../app/src/app/people/[membershipId]/page.tsx)); PM3 adds the profile brain strip without removing authorized coaching fields. |
| You > Profile | Keep `/profile` as the signed-in editor for the accountable person's own row. People is the **read-mostly** org view for adults the actor may see. |
| Wizard → Outcomes | When a run finishes (`complete` or `ceiling_unsettled`), derive **suggested** Outcome(s) and **evidence** knowledge nodes from **locked or unsettled** rows in `assessment_placements` ([`app/db/0019_assessments.sql`](../../app/db/0019_assessments.sql)). Each node keeps `ref_table` / `ref_id` to the placement row (M11 additive rule, [#370](https://github.com/bjljohnson2012/field-school/issues/370)). Rejecting an inferred edge in M11 hides it everywhere. |
| Wizard → Home | After a finish event, Home (`/dashboard`) shows a **next step** sourced from outcomes (`data-next-from="outcomes"` pattern already on [`app/src/app/learn/page.tsx`](../../app/src/app/learn/page.tsx)). Acceptance: finishing the Wizard suggests a **first course** on Home ([#372 acceptance](https://github.com/bjljohnson2012/field-school/issues/372)). |
| Public adult profile | A **public** view for login adults only. Route table: `/share/[slug]` **Keep**, adult shares only, never a person in development ([#363 route table](https://github.com/bjljohnson2012/field-school/issues/363#issuecomment-6068076420)). Today [`app/src/app/share/[slug]/page.tsx`](../../app/src/app/share/[slug]/page.tsx) serves static marketing share pages from [`app/src/lib/share`](../../app/src/lib/share); PM3 adds **member-bound** share resolution without exposing kid rows. |
| Privacy cut | **Placements:** `audienceCut("public", …)` returns **Personality track only** ([`app/src/lib/assessments/model.ts`](../../app/src/lib/assessments/model.ts), tested in `assessment-wizard-m2.test.mjs`). **Profile fields:** public view hides **email** and **any person in development** ([#372 acceptance](https://github.com/bjljohnson2012/field-school/issues/372)). **pstack:** privacy tests for **every field** on the public view ([#372](https://github.com/bjljohnson2012/field-school/issues/372)). |
| Kid profiles | [`kid_profiles`](../../app/db/0017_profiles.sql): no photo column, parent-edited only, [`/profile/kids/[membershipId]`](../../app/src/app/profile/kids/[membershipId]/page.tsx) moves to `/people/[membershipId]` per route table (redirect). No public route, no share slug, no photo upload. |
| Copy | Accountable person / person in development / family / team language. No em dashes ([#363 section B](https://github.com/bjljohnson2012/field-school/issues/363)). No Gym, Foundry, Retainer. |

### Out of scope (other streams or PM4)

| Item | Owner |
| --- | --- |
| Resume ingest, atomic gate merge (E4), richer peer depth | [#374 Profile M4](https://github.com/bjljohnson2012/field-school/issues/374) |
| Shell, rail, global redirects not tied to profile | M9 (deployed) |
| Unified brain backfill, `/library/brain` UI | M11 |
| Onboarding flow | M12 |
| New public fields without privacy review | PM4 CDM note ([#374](https://github.com/bjljohnson2012/field-school/issues/374)) |
| Flip Text on the Wizard finish heading | Optional M9 piece ([#363 ObsidianUI comment](https://github.com/bjljohnson2012/field-school/issues/363#issuecomment-6086683124)); PM3 does not require it |
| Deploy, `AUTH_URL`, live Stripe, production data scripts | Ben / stream G |

## Already built (do not redo)

| Piece | Evidence |
| --- | --- |
| Profile M1 schema and gates | [`app/db/0017_profiles.sql`](../../app/db/0017_profiles.sql), [`app/src/lib/profile/model.ts`](../../app/src/lib/profile/model.ts), PR 341 |
| Photo, LinkedIn, projects, skills enrichment | [`app/db/0020_profile_enrichment.sql`](../../app/db/0020_profile_enrichment.sql), [`app/src/lib/enrichment/*`](../../app/src/lib/enrichment/), PR 344 |
| Assessment Wizard | PR 344, [`app/src/components/profile-m2/assessment-wizard.tsx`](../../app/src/components/profile-m2/assessment-wizard.tsx), [`app/db/0019_assessments.sql`](../../app/db/0019_assessments.sql) |
| Gate retake `lastAt` refresh | PR 343 item 9 |
| Placement → gap-loop input | [`app/src/lib/gap-loop/inputs.ts`](../../app/src/lib/gap-loop/inputs.ts) cites `assessment_placements` |
| Public placement cut (Personality only) | [`audienceCut`](../../app/src/lib/assessments/model.ts) + wizard tests |

[`app/src/lib/profile/model.ts`](../../app/src/lib/profile/model.ts) still documents "M1 has no public share URL". PM3 implementation **replaces** that comment when share ships; behavior elsewhere in M1 stays locked.

## Routes

| Route | Action | PM3 behavior |
| --- | --- | --- |
| `/people/[membershipId]` | Keep | Add profile + brain panel for adults; kid subject stays parent-edited, no photo |
| `/profile` | Keep | Own-profile editor (You) |
| `/profile/assessments` | Keep | Wizard |
| `/profile/kids/[membershipId]` | Move | 301 to `/people/[membershipId]` (accountable person only) |
| `/share/[slug]` | Keep | Static pages remain; add resolver for adult profile slugs when enabled |
| `/pattern` | Merge (M9) | Assessments track; not PM3 |

No new route is required beyond optional `/share/[slug]` extension for member profiles. Do not invent alternate public paths.

## Privacy and audiences

Audiences for assessments: `self`, `peer`, `public` ([`Audience`](../../app/src/lib/assessments/model.ts)).

| Audience | Placements | Profile body |
| --- | --- | --- |
| `self` | All tracks | Full `user_profiles` + enrichment the owner sees on `/profile` |
| `peer` | All tracks | Same as self for signed-in org peers allowed by coaching access rules |
| `public` | Personality placements only (`audienceCut`) | **Allowlist pending Ben** (see [Decisions for Ben](#decisions-for-ben)). Must exclude email, internal ids, kid rows, Skills and Profile track placements, and coaching-only fields from [`coaching_profiles`](../../app/src/lib/db/schema.ts) on the person page |

**Hard rules (locked):**

- No route renders a public view for a person in development ([#372 acceptance](https://github.com/bjljohnson2012/field-school/issues/372)).
- Kid profiles: no photo, no public URL ([#363 section B](https://github.com/bjljohnson2012/field-school/issues/363)).
- Public adult profile hides email ([#372 acceptance](https://github.com/bjljohnson2012/field-school/issues/372)).

## Wizard finish → Outcomes → Home (behavioral contract)

1. **Trigger:** `assessment_runs.status` becomes `complete` or `ceiling_unsettled` and placements are persisted ([`app/src/lib/assessments/store.ts`](../../app/src/lib/assessments/store.ts)).
2. **Suggest Outcomes:** For each qualifying placement row, create or update a **suggested** Outcome on the member's brain (M11 node kinds and `scope` per [#370](https://github.com/bjljohnson2012/field-school/issues/370)). "Suggested" means visible to the accountable person and editable; not a published catalog assignment until accepted.
3. **Evidence nodes:** Append evidence nodes pointing at `assessment_placements.id` (and run id). Gap Loop M1 tests must keep passing; changes are additive on 0021 tables.
4. **Home:** `/dashboard` reads the top suggested Outcome (or enrollment target Ben locks) and renders the next step with `from: "outcomes"` so Learn/Home tests can assert the link. Example in Rec 11 ("Discovery call (Module 1)") is illustrative, not a locked course slug.

PM3 does **not** implement M11 backfill. It only writes forward on finish events once M11 graph APIs exist.

## Visual / Designer intent

Designer finding #10: profile reads as a checklist ([#363](https://github.com/bjljohnson2012/field-school/issues/363#issuecomment-6068081005)). PM3 should show assessments, skills, and brain evidence as **one narrative column** on People, not a "0 of 3" gate list as the hero. Gates may remain in setup state for M1 completeness but are not the page headline.

Rec 11 Designer note: meter and neural finish in `#1E4E8C` when M9 has not already repainted them on the deployed shell.

## Decisions for Ben

Do not guess. Implementation stops at an open row until CDM or Ben locks it.

| # | Decision | Evidence | Default if silent |
| --- | --- | --- | --- |
| D1 | **Public profile field allowlist** (display name, photo, projects, skills, which placement labels, LinkedIn-derived lines, etc.) | [#372](https://github.com/bjljohnson2012/field-school/issues/372) pstack: "privacy tests for every field on the public view"; only Personality placements are locked via `audienceCut`; profile body allowlist is not written in the issue | Block public share UI until allowlist is posted in the implementation PR |
| D2 | **Share slug issuance** (opaque slug vs membership id, opt-in toggle, revocation) | `/share/[slug]` today is static ([`sharePages`](../../app/src/lib/share)); `0017_profiles.sql` has no share column | Block DB migration design in implementation until Ben picks shape; prep claims no migration number |
| D3 | **Which placements become Outcomes vs evidence-only** | [#372](https://github.com/bjljohnson2012/field-school/issues/372) says "suggested Outcomes and evidence nodes" without taxonomy mapping | Implementation may use all locked Personality placements as outcomes and Skills/Profile as evidence-only until Ben refines |
| D4 | **First course on Home** (enrollment create vs CTA text vs link to `/learn`) | [#372 acceptance](https://github.com/bjljohnson2012/field-school/issues/372): "suggests a first course on Home" | Show CTA text + link to existing enrollment or catalog slug named in Outcome node |
| D5 | **Shorter label for person in development** | [M9 prep](m9-shell-prep.md) copy table: use "Person in development" until Ben supplies a shorter label | Keep "Person in development" in UI copy |
| D6 | **Flip Text on Wizard finish** | [#363 ObsidianUI](https://github.com/bjljohnson2012/field-school/issues/363#issuecomment-6086683124) optional, M9 restyle pass | Plain heading unless Ben approves install |

## What this prep leaves untouched

`docs/rebuild-progress.md`. `app/marketing-site`. `AUTH_URL`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE`. Production data and test-row scripts. `GROK_API_KEY` and other secrets. Frozen TanStack `src/`. Guest Grok Bot. Quiz `source_unit_id`. M11 and M12 product code on this branch.

This spec PR adds only `docs/rebuild/pm3-profile-prep.md`.

## Test plan

Run from `app/` after `npm ci` on the **implementation** branch stacked on M11. This spec PR does not run UI tests.

### Automated (`app/scripts/`)

Add `app/scripts/profile-m3.test.mjs` (name may match repo convention) in the implementation PR. Suggested cases:

1. **`audienceCut` regression:** Personality-only public placements (existing test stays; PM3 imports must not widen public cut).
2. **Public profile serializer:** For each field the allowlist (D1) names, assert public JSON omits private fields and omits Skills/Profile placements. Assert email is never present.
3. **Kid guard:** Requesting a public view for a kid `membership_id` returns 404 or 403 for every route helper; no share slug is minted.
4. **Wizard finish hook:** Fixture finish writes suggested Outcome + evidence nodes with `ref_table` / `ref_id` pointing at `assessment_placements` (mock or test DB). Idempotent on duplicate finish.
5. **Home next step:** After finish fixture, `/dashboard` payload or loader includes `from: "outcomes"` and a course or lesson title matching the suggested Outcome (per D4 once locked).
6. **People page:** Adult fixture includes profile photo and skills block; kid fixture has no photo control and no public link.
7. **Redirect:** `GET /profile/kids/:id` → `/people/:id` with 301/308 per M9 redirect style.
8. **Profile M1 + Wizard regression:** `node --experimental-strip-types --test scripts/assessment-wizard-m2.test.mjs` and existing profile tests pass unchanged except allowed color/copy from M9.
9. **`npm run typecheck` and `npm run build`** exit 0.

### Manual / Designer (implementation PR)

1. Screenshots at **1440** and **390** for: People adult profile panel, `/profile` editor, Wizard finish, public share view (logged out), and Home after Wizard finish.
2. PR body notes **Awaiting Designer seal** until Designer approves (see checklist below).
3. Confirm no person in development appears in a public URL or photo upload UI.

### Deferred until M11 branch is merged into `feat/profile-m3`

Brain graph assertions, `/library/brain` deep links, and M11 redirect tests.

### Reviewer checks on **this** spec PR

- Diff adds only `docs/rebuild/pm3-profile-prep.md`.
- No `app/db` files, no migration number claimed.
- No `app/src` product changes.
- Go-live flags unchanged.

## Designer seal checklist

From [Notion: Field School Master Rebuild Run Order](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d) global rules and [#363](https://github.com/bjljohnson2012/field-school/issues/363) (Designer seal for M9, M10, M12, Profile M3). **Do not invent extra seal steps.**

On the **implementation** draft PR for Profile M3:

1. Attach screenshots at **1440px** and **390px** width for every new or materially changed people-facing surface (People profile panel, public share view, Home after Wizard finish, and `/profile` if layout changes).
2. Note **Awaiting Designer seal** in the PR description until Designer approves.
3. Designer seal **does not block** starting the next stream in the walk order (Notion global rules).
4. **CDM MERGE GO** is still required before merge; Designer seal is not a substitute.
5. Profile M3 addresses Designer finding **#10** (profile reads as checklist, not brain) per [#363 Designer appendix](https://github.com/bjljohnson2012/field-school/issues/363#issuecomment-6068081005).
6. No deploy from the build run; Ben merges and deploys.

This spec PR is docs only. It does not satisfy items 1–2; the future `feat/profile-m3` UI PR does.
