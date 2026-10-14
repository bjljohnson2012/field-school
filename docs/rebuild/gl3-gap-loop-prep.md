# GL3 knowledge-gap loop prep

This file is the spec and the test plan for [issue 375](https://github.com/bjljohnson2012/field-school/issues/375), Gap Loop M3: Individual self-learning plan (hidden).

Implementation update, 2026-10-14: M12 and GL2 are on `origin/main` at `0c0569165a1cad7de5aa7ec98164e4c8065d5972`. The hold below is satisfied. CDM sealed the credit numbers in the seal section, delegated by Ben. Numbers live in config and are read at runtime. The plan stays hidden. This change does not deploy.

Sources, in order when they disagree:

1. `docs/rebuild-progress.md` on `chore/rebuild-progress` for `depends_on`, `merge_in`, `gate`, and walk order.
2. [Notion Master Rebuild Run Order (Oct 8, 2026)](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d) for stream narrative.
3. [Notion PRD: Knowledge-Gap Loop + Individual Learning Plan](https://app.notion.com/p/3f2fe86f6dee8110970dd17d763dec4c), sections 9 and 11 M3, for product shape.
4. GitHub issue 375 and its Oct 9 changelog comment.

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. Stripe stays in test mode. No live card. No production backfill or data-deleting script. Do not read or print `GROK_API_KEY`.

## Stream record

| Field | Value |
| --- | --- |
| Stream | GL3 |
| Issue | [#375](https://github.com/bjljohnson2012/field-school/issues/375) |
| Implementation branch | `feat/knowledge-gap-loop-m3` |
| Base (implementation) | `feat/knowledge-gap-loop-m2` with M12 merged in (`merge_in: [M12]`) |
| `depends_on` | M8, M12, GL2 |
| `gate` | none |
| `needs_merge` | true |

**Do not implement GL3** until M12 and GL2 are accepted on the stack above. M8 is treated as satisfied on `origin/main` at `4eaf464cfa19c2c7a1e0b552490a31f5515e79ef` (see evidence below). M12 ([#371](https://github.com/bjljohnson2012/field-school/issues/371)) and GL2 ([#373](https://github.com/bjljohnson2012/field-school/issues/373)) are not started per `docs/rebuild-progress.md`.

The Oct 9 comment on #375 moves offer-rule rewording to M8 ([#367](https://github.com/bjljohnson2012/field-school/issues/367)). GL3 does not re-spec Coaching offers.

## Goal

Ship the hidden Individual self-learning plan: `learning_plans` and `plan_items` with versions, a plan builder UI, metering through existing credits tables, and the "learning for myself" onboarding branch from M12. Ben can turn the plan on in staging without exposing name or price in production.

## What is already on main (do not redo)

| Area | Evidence on `origin/main` |
| --- | --- |
| Gap Loop M1 | `app/src/lib/gap-loop/*`, `app/src/components/gap-loop/*`, `/knowledge/goals`, `app/db/0021_knowledge_gap_loop.sql`, scripts `app/scripts/gap-loop-*.test.mjs` |
| Credits and BYOK | `app/db/0011_credits_byok.sql`, `app/src/lib/credits/*`, `/metering`, `/settings/ai` |
| M8 Individual tier (hidden) | `coaching_plans` row `individual` with `published = false`, `monthly_usd = 10` in `app/db/0023_m8_identity_billing.sql`; `individualIsPublic(): false` and `individualOffer(): null` in billing prep / offer-names |
| Plan display names | `app/src/lib/billing/offer-names.ts` (Coaching tiers; Individual returns null) |

Gap Loop M1 does not write credits or usage. M3 adds burns and `capped` behavior on exhaustion.

## What upstream streams must land first

### M12 ([#371](https://github.com/bjljohnson2012/field-school/issues/371))

- OnboardJS (or hybrid) first-run flow: signup through first lesson under 10 minutes on a phone.
- Room step includes family or team. **"Learning for myself" is built hidden** behind the Individual plan flag (issue CDM note).
- Resume mid-flow after refresh.
- No step asks for a photo of a person in development.

GL3 owns the flag-gated branch behavior and wiring into Individual org/brain setup. M12 owns the step graph and persistence.

### GL2 ([#373](https://github.com/bjljohnson2012/field-school/issues/373))

- Graph view, approved web research, embeddings, cron runner, family / team / org scopes on M5 orgs and M11 nodes.
- Kid data never goes to web research. Approval before any web research call. M1 `LOOP_LIMITS` hold.

Individual mode uses the same loop engine with `owner_kind = person`. Web research is allowed with approval; child-scope rules do not apply to self-owned outcomes.

### M8 (dependency satisfied for prep)

Evidence that billing and hidden Individual tier exist on main:

- `app/src/lib/billing/m8-prep.ts` and `docs/rebuild/m8-identity-billing-prep.md`
- Migrations `app/db/0023_m8_identity_billing.sql`, `app/db/0024_m8_offer_tiers.sql`
- Issue #367 acceptance: with flags off, nothing names the Individual plan on public surfaces

Price ($10/month base plus credits) and the **plan name** are read from config (M8 / offer-names), not from marketing copy. GL3 must not hardcode price strings in UI or API JSON when the flag is on in staging.

## Product spec (Notion section 9 + issue 375)

### Onboarding path (flag on, staging only)

1. Sign up at `/signup` and choose **Learning for myself** (hidden until flag on).
2. Set one goal in plain words with a horizon (reuses Gap Loop outcome create).
3. Profile basics reuse Profile M1 gates unchanged.
4. Optional: Assessment Wizard tracks (Profile M2+) to shape teaching style.
5. Seed the brain: uploads, paste, or LinkedIn import (Profile M2+ enrichment).
6. First loop run: decompose, confirm, analyze, first CTA (M1 flow on `person` scope).
7. Plan builder shows the ordered plan; the loop reshapes it after each rescore.

Acceptance from issue 375: signup to first goal step (first CTA) in under 10 minutes with the flag on locally or in staging.

### How Individual differs from family / org

| Aspect | Individual | Family / org |
| --- | --- | --- |
| Owner | The signed-in adult | Parent for child; leader for team |
| Brain | One `person` brain | Child, family, team, or org brains |
| Ratings | Adult self-rating on own requirements (**[lean]** in PRD) | Parent rates child; no child self-rating |
| Web research | Allowed with approval (GL2) | Allowed with approval; child scope generic only |
| Plan store | `learning_plans`, `plan_items` | Child: `curriculum_paths` / `next_portions` (elsewhere) |
| Pricing | Fourth SKU: $10/month base + usage credits (rates TBD) | Existing Coaching offer unchanged |

### Upgrade path

Person may later create a family or join an org. Their `person` brain stays theirs. Sharing into a family or org brain is copy-with-consent per item, never a silent merge. Org leaders see only what the person shares.

### Data model (implementation adds SQL; no number claimed here)

Add idempotent tables in `app/db/` (next free filename at implementation time; recheck `app/db` on the implementation base branch). Lazy-apply pattern matches `app/src/lib/gap-loop/sql.ts`.

**`learning_plans`**

- Scoped by `org_id`, `growth_unit_id`, `owner_membership_id` (person).
- `kind` = `individual` (align with M8 `coaching_plans.tier` reserved row, not a duplicate SKU table).
- `version` integer, monotonic per plan row or per logical plan id (implementation chooses one versioning scheme; UI must show what changed after rescore).
- Status: draft / active / archived (exact enum in SQL).
- Links to the active `outcome_id` driving the loop.

**`plan_items`**

- Belongs to a `learning_plan_id`.
- Ordered rows: label, kind (knowledge / skill / demonstration aligned with requirements), link to `outcome_requirement_id` or derived node id where applicable.
- `version` or `supersedes` so the builder can highlight diffs after rescore.

No `learning_plans` or `plan_items` tables exist on main at `4eaf464` (repo search).

### Metering and loop burns

Reuse `credits`, `credit_ledger`, and `usage_events` from `0011`. Default credit mode for individuals is `platform` per PRD.

Proposed usage event names (PRD section 9): `loop_step`, `loop_research`. These are **not** in `USAGE_EVENT_NAMES` today (`app/src/lib/credits/rules.ts`). Implementation extends the allowlist and burns opaque units on decompose, analyze, research task, and plan rebuild.

When balance is exhausted, loop state moves to `capped` (already in `app/src/lib/gap-loop/machine.ts`). CTA explains; nothing runs until grant or top-up.

**BYOK** (`customer_api_keys` from 0011): optional for power users. PRD leaves open whether BYOK skips per-use burns while the $10 base still applies.

**FR-KB-3** `/metering` UI and public Coaching prices stay unchanged. Individual pricing copy is internal/staging only when the flag is on.

### Feature flag

Production: flag **off**. No page, menu, or API response names the Individual plan or its price (issue 375 acceptance).

Staging / local: flag **on** enables onboarding branch, plan builder, and metering visibility for the signed-in individual.

**Ben decision:** exact env var or org feature key name (not locked in #375 or Notion run order). Implementation must read flag from config, default off, never default on in production deploy templates.

### Copy and repo locks

When GL3 implementation merges, update:

- `README.md` line 24: replace "No fourth SKU" with language that the Individual plan exists but is hidden (Notion PRD Ben lock 2026-10-07; issue 375 scope).
- `docs/LAW.md` offer line (~56): same intent, keep "No live card. No public flip."

Do **not** change those lines in this prep PR. Implementation PR only.

Public marketing and portal Coaching surfaces stay on Assess / Model / Build. No public price for Individual anywhere.

### pstack

Follow [pstack skills](https://github.com/cursor/plugins/tree/main/pstack/skills). Tests in `app/scripts/` with `node --experimental-strip-types --test`. `npm run typecheck` and `npm run build` in `app/` must pass on the implementation branch. No em dashes in user-facing copy.

## Acceptance checklist (implementation)

1. Flag off: grep-style assurance. No route, nav label, JSON field, or error string exposes Individual plan name or $10 (or credit rate) on production config.
2. Flag on (staging): `/signup` through first CTA on a new Individual org in under 10 minutes (phone-width 390px path included).
3. `learning_plans` + `plan_items` persist versions; plan builder shows order; after rescore, UI shows what changed.
4. Metering: burns on loop steps (and research when GL2 is live) write `usage_events`; exhaustion hits `capped`.
5. BYOK path still wraps keys; key never in GET JSON (existing 0011 rules).
6. Upgrade path: create family or join org with copy-with-consent (can be staged behind separate flags if M12/M5 hooks are incomplete; document in PR if deferred).
7. README and LAW updates land in the same implementation PR as the feature.
8. Child rules unchanged: no child login, no kid data to web research (GL2 enforcement).

## Test plan

Run from `app/` after `npm ci`. Split into what this prep branch runs (none, docs only) and what the implementation branch runs after M12 and GL2 merge.

### Cases on the implementation branch only

**Unit and rules (no DB)**

1. Extend or add tests beside `app/scripts/gap-loop-*.test.mjs` for plan versioning helpers and flag gating helpers (pure functions).
2. Credit event allowlist: `loop_step` and `loop_research` validate through `asUsageEventName` (or successor) once added.
3. `individualIsPublic()` / `individualOffer()` stay false/null when production flag is off.

**Integration (test database, not production)**

4. Apply new SQL twice without error (idempotent migrations).
5. Create Individual plan rows tied to a `person` outcome; plan_items order matches requirements after decompose confirm.
6. Simulated burn drives ledger balance to zero; next `step` returns capped state and timeline event.

**API and leakage (flag off)**

7. Authenticated requests to onboarding and billing APIs: response bodies and OpenAPI-shaped JSON must not include Individual plan name, `individual` tier price, or `$10` when flag is off.
8. Signed-out `/pricing` and marketing portal pages unchanged (no fourth price card).

**API and happy path (flag on, staging config)**

9. End-to-end script or manual checklist: signup with learning-for-myself, goal create, decompose confirm, first CTA visible.
10. Plan builder page loads at 375px width; keyboard path reaches CTA; `aria-live` on loop updates (carry M1 bar).

**Regression**

11. Existing `gap-loop-*` tests pass unchanged.
12. Existing FR-KB-3 / credits tests pass unchanged.
13. `npm run typecheck` and `npm run build` pass.

**Explicitly out of scope for automated tests in GL3**

- Live Stripe charge or live key.
- Production deploy or `--apply` on campus Postgres.
- Web research cron (GL2); GL3 may stub burns for research until GL2 merges if branch order requires it (document in implementation PR).

### Cases this prep branch runs

1. Reviewer reads `docs/rebuild/gl3-gap-loop-prep.md` against issue 375 and Notion section 9. No npm commands required on this PR.

## Ben decisions (do not guess)

| # | Decision | Evidence |
| --- | --- | --- |
| 1 | Env var or feature flag name for Individual plan visibility | Issue 375 and Notion run order say "flag off in production" but do not name the variable. |
| 2 | Adult self-rating on own requirements | Notion PRD section 9 table marks **\[lean\]**, not sealed. |
| 3 | Whether $10/month base includes a `monthly_grant` of credits | Notion PRD section 9 pricing table: "Whether the base includes any credits (`monthly_grant`) is TBD." |
| 4 | Credit burn rates per `loop_step`, `loop_research`, plan rebuild | PRD: "credit rates TBD." |
| 5 | Caps: active outcomes at once, research tasks per month, upload size/count | PRD section 9: "Included vs limited ... TBD." |
| 6 | BYOK on Individual: skip per-use burns or not | PRD: "whether BYOK skips credit burns on the $10 plan is open." |
| 7 | Display name for Individual plan when flag is on | Issue 375 CDM: "Plan name comes from the plan-name config (M8)." Confirm string in `offer-names` vs new config key before implementation. |

## Seal (2026-10-14)

CDM sealed these credit numbers on 2026-10-14 as provisional config, delegated by Ben. The implementation reads them from `INDIVIDUAL_PLAN_CONFIG` at runtime. Loop and billing logic do not embed them.

| Decision | Seal |
| --- | --- |
| Flag name | `INDIVIDUAL_PLAN_ENABLED`, in the same config. Default off. Production deploy templates default it to false. |
| 1A monthly grant | 200 units |
| 2A burns | `loop_step` 1, `loop_research` 5, plan rebuild 10 |
| 3 caps | 3 active outcomes, 40 research tasks a month, 10 upload files, 10 MB each |
| 4A BYOK | Skips per-use credit burns. The hidden base still applies. `usage_events` are still written. Added dollars stay 0. |
| Display name | `m8PlanNames.individual` in the M8 plan-name config. `individualOffer()` stays null while the flag is off. `individualIsPublic()` stays false. No public price. |
| Adult self-rating | Allowed on the adult's own requirements. The PRD lean says the same. Child self-rating stays off. |
| Base branch | `origin/main` at `0c0569165a1cad7de5aa7ec98164e4c8065d5972` or later. M12 (`0027`) and GL2 (`0029`) are already there. Migration is `0032` only. |

`CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay false. `AUTH_URL` stays `https://portal.fieldschool.ai`. No live charge. Member rail stays the 240px Learn, Library, You rail.

## What this prep does not change

`docs/rebuild-progress.md`. `app/` product code. `app/db/`. `AUTH_URL`. `CHECKOUT_GO_LIVE` / `COACHING_GO_LIVE`. Marketing site. Deploy. README / LAW (implementation only).

## Files on this branch

- `docs/rebuild/gl3-gap-loop-prep.md` (this file)
