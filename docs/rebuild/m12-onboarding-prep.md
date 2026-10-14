# M12 onboarding prep

This file is the spec and the test plan for [issue 371](https://github.com/bjljohnson2012/field-school/issues/371), Portal rebuild: M12 Onboarding with OnboardJS.

`docs/rebuild-progress.md` names stream M12 with `depends_on: [M5, M9]`, `base: feat/portal-m9-shell`, `gate: designer_seal`, and branch `feat/portal-m12-onboarding`. This prep assumes M5 tenancy and the M9 shell are deployed on the target environment before the M12 UI pull request ships. CDM sealed this flow on 2026-10-14, delegated by Ben. The UI stream follows that seal. It does not deploy.

| Decision | Seal |
| --- | --- |
| Step order | `brain-name`, `room`, `org-name`, `homeschool-mode`, `people`, `adult-gates`, `kid-intake`, `first-goal`, `home-lesson` |
| Kid intake form | Name is Kid profile. Href is `/onboarding/kid-profile`. Gate id stays `G-intake`. |
| `campus_ready` | Flips when `home-lesson` completes. |
| `profile_done` | Flips when the required gates are done. Kid intake counts when a child was added. |
| Learn | Not hard-gated between `campus_ready` and `profile_done`. |
| Chrome | M9 shell. The 240px Learn, Library, You rail stays visible. |
| Invite entry | `brain-name` or `people`, not `room`. Invitees do not create a second org. |
| First goal | Reuses the gap-loop aim store (`outcomes` through `createOutcome`). |
| Individual | Off in public. |
| Migration | `0027_m12_onboarding.sql` only. `0026` stays unclaimed. |

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` stays `false` in `app/src/lib/billing/checkout-destination.ts`. `COACHING_GO_LIVE` stays `false` in `app/marketing-site/js/checkout-switch.mjs`. No live Stripe. No production data scripts.

Main at the branch point is `4eaf464cfa19c2c7a1e0b552490a31f5515e79ef` (member rail default: Learn, Library, You). The M9 shell ships in `app/src/components/m9/shell.tsx` and `app/src/lib/shell/m9-shell.ts`. Members keep the 240px Learn, Library, You rail. Do not revert to Learn and Me unless `NEXT_PUBLIC_MEMBER_RAIL_VARIANT=shells`.

Sources, highest first: `docs/rebuild-progress.md` on `depends_on` and gates, the [Master Rebuild Run Order (Oct 8, 2026)](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d) M12 section, [issue 371](https://github.com/bjljohnson2012/field-school/issues/371) and its [OnboardJS reference packet comment](https://github.com/bjljohnson2012/field-school/issues/371#issuecomment-6068402516), then this file.

## Goal

One branched first-run flow from signup (or invite accept) through campus setup, optional people intake, adult profile gates via the existing Wizard, a first learning goal, and landing on Home with a starter lesson. The flow resumes at the same step after refresh or sign-in on another device. Creating the org brain is step one; its name appears in the switcher from then on.

Gap Loop M3 ([issue 375](https://github.com/bjljohnson2012/field-school/issues/375)) later exposes the hidden "learning for myself" branch. M12 builds that branch behind the Individual plan flag (off in production). With the flag off, no UI names Individual or its price.

## Engine and shape

Use OnboardJS in the hybrid form Ben locked in the packet (L-lib): `@onboardjs/core` plus `@onboardjs/react` for flow logic, with Field School step components, tokens, and motion. Do not ship the OnboardJS demo skin. Do not add PostHog, Mixpanel, or another analytics vendor in M12. Record step timing and drop-off in `learning_events` only, with a new `kind` and a stable `object_type` agreed in the UI pull request. The implementation rechecks the next free migration number in `app/db` and claims it through the dispatcher before writing SQL. This prep does not name a migration number and does not add a SQL file.

Persist flow state in Postgres (account scope), not browser-only storage. Follow the lazy apply pattern in `app/src/lib/gap-loop/sql.ts`. Store at least: current step id, branch context (family vs team, homeschool mode), `campus_ready`, and `profile_done` (or equivalent fields Ben seals below).

## One graph (scope lock)

The packet corrects older Notion drafts: first-run campus, adult profile gates, and parent-driven kid intake live in one graph, not separate wizards.

```
entry (signup, OAuth, or invite accept)
  ├─ brain name + org bootstrap (step 1; switcher shows name)
  ├─ room: family or team (Individual branch only when flag on; hidden in production)
  ├─ org display name
  ├─ family only: homeschool mode toggle
  ├─ people: add person in development (family) OR invite members (team); skippable only if sealed
  ├─ adult gates: G-personality, G-skills, G-other via existing Wizard/tools (checklist step)
  ├─ family branch: parent kid G-intake (no photo, no public URL; adult G-* do not apply to kid)
  ├─ first goal (outcome / aim; ties to Learn and later Gap Loop)
  └─ land Home (/dashboard) with starter lesson CTA (default course grok-bot on this main)
```

Invite accept (`/invite/[token]`, `app/src/app/invite/[token]/page.tsx`) joins the inviting org. That path skips room and org creation steps and enters the graph at the step the sealed brief names (likely brain rename or people, not a second org).

Resume: any signed-in return before `campus_ready` and before `profile_done` routes into `/onboarding` (or the sealed path) at the persisted step. Name menu **Finish setting up your profile** (`PROFILE_COPY.incomplete` in `app/src/lib/profile/model.ts`) opens the same graph at the adult gate segment when campus is ready but profile is not.

Learners may use Learn before `profile_done` unless Ben overrides (packet Q8). Do not hard-block the starter lesson behind all three adult gates unless the seal says otherwise.

## Proposed step list

CDM sealed this table on 2026-10-14, delegated by Ben. Builders follow these ids in this order.

| Order | Step id (proposed) | Leader / accountable | Member invitee | Required | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `brain-name` | yes | yes | yes | Creates or names the knowledge brain; switcher updates immediately. |
| 2 | `room` | yes | skip | yes | Family or Team. Hidden third branch `individual` when `INDIVIDUAL_PLAN_ENABLED` (name TBD in M8 config) is true locally only. |
| 3 | `org-name` | yes | skip | yes | Display name; uses M5 org row. |
| 4 | `homeschool-mode` | family only | skip | yes | Sets `homeschool_mode` on the org (M5). |
| 5 | `people` | yes | skip | proposed required | Family: add person in development (no login, no photo). Team: invite members or add existing flow. |
| 6 | `adult-gates` | yes | yes | yes | Checklist for G-personality, G-skills, G-other; launches existing Wizard/tools. Optional adult photo remains skippable if seal allows. |
| 7 | `kid-intake` | family only | skip | yes when child added | G-intake only; stub href until intake form is named (`KID_GATES` in `app/src/lib/profile/model.ts`). |
| 8 | `first-goal` | yes | yes | yes | Replaces legacy `/intent` merge target in M9 route table. Writes an aim compatible with `/learn/goals`. |
| 9 | `home-lesson` | yes | yes | yes | Sets `campus_ready`; lands on `/dashboard` with starter lesson (today signup pushes `grok-bot` in `app/src/app/signup/signup-form.tsx`). |

`profile_done` becomes true when all required adult gates (and kid G-intake when applicable) are satisfied, either inside this flow or later via View Profile. `campus_ready` becomes true at the end of step 9 (or earlier if the seal moves the flag).

## Shell and chrome during onboarding

Signed-in onboarding runs inside the M9 cream shell unless the seal chooses full-screen chrome. The left rail stays 240px. During onboarding, hide leader-only doors until `campus_ready` if the seal requires focus; members still see Learn, Library, You only. Do not show filled blue in the rail. One filled blue CTA per step in the canvas.

Mobile: bottom bar matches role (leader five words plus New, or member Learn, Library, You). The onboarding canvas may use a step progress pattern (step X of Y) from OnboardJS; motion follows M9 caps (240ms state, 300ms layout, reduced motion respected).

## Already built (do not redo)

| Area | Location |
| --- | --- |
| Adult profile gates API | `app/src/app/api/profile/gates/route.ts` |
| Gate definitions and copy | `app/src/lib/profile/model.ts` (`ADULT_GATES`, `KID_GATES`, `PROFILE_COPY`) |
| Assessment Wizard | `app/src/lib/assessments/*` (PR 344) |
| Signup | `app/src/app/signup/page.tsx`, `signup-form.tsx`, `/api/members/register` |
| Invites | `app/src/app/invite/[token]/page.tsx`, `/api/invites/accept` |
| Tenancy kinds and homeschool | M5 (`app/src/lib/tenancy/*`, `0022_tenancy.sql` on main) |
| M9 shell and member rail | `app/src/components/m9/shell.tsx`, `app/src/lib/shell/m9-shell.ts` |
| Starter course | `grok-bot` catalog and `/c/grok-bot` |

Profile M1, Wizard, and Gap Loop M1 tests must pass untouched except additive onboarding wiring.

## Hard rules (issue 371 and #363)

- No step collects a photo of a person in development.
- No kid public URL. Parent-only edit; kid read-only.
- No em dash in new copy. No sentence starts with "I".
- No Gym, Foundry, Retainer, or Learn with Ben in copy.
- Child-scope data does not leave the server for web research or external AI (Gap Loop rules carry into copy around goals).
- Do not flip `AUTH_URL`. Do not enable live checkout.

## What this prep leaves untouched

`docs/rebuild-progress.md`. `docs/staff/state.json`. `app/marketing-site` pricing behavior. Production database. `GROK_API_KEY` and other secrets. Dest hash and factory locks. M12 status in the dispatcher log stays `not_started` until the UI stream opens its draft PR.

## Test plan

Run the UI pull request cases from `app/` after `npm ci`. This spec pull request adds no tests.

### Cases the UI pull request runs

1. Add `app/scripts/m12-onboarding.test.mjs`. Cover: flow graph step ids, flag defaults, invite skip rules, resume after simulated refresh (persisted step), `campus_ready` and `profile_done` transitions, Individual branch absent when flag off, no kid photo step in the graph, analytics events written only to `learning_events`, and member rail default Learn, Library, You (`MEMBER_RAIL_DEFAULT` in `m9-shell.ts`).
2. Signup to first lesson station on a 390px fixture completes in under 10 minutes with test credentials (manual or scripted timing assertion with generous CI slack documented on the PR).
3. Leave mid-flow, sign out, sign in again: same step id.
4. Invite accept fixture: joins inviting org only; does not create a second org.
5. `profile-m1.test.mjs` and Wizard-related tests pass with no changes to their inputs.
6. `npm run typecheck`, `npm run build`, and `npm test` in `app/` exit 0.
7. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` remain `false`.
8. Diff scan: no em dash, no fourth SKU surfaced, no drizzle-kit, no live Stripe key.

### Cases deferred to Ben or later streams

1. Production migration apply and any backfill.
2. Designer seal screenshots at 1440 and 390 on the UI PR (required for `designer_seal` gate; does not block starting M12 build).
3. Individual plan flag on in staging (Gap Loop M3 acceptance).
4. PostHog or Mixpanel (only if Ben reverses the learning_events-only rule).

### What a reviewer checks on this spec pull request

The diff adds `docs/rebuild/m12-onboarding-prep.md` only. No `app/src` or `app/db` changes. No migration number is claimed.

---

## Designer seal checklist

CDM sealed every row on 2026-10-14, delegated by Ben.

| # | Item | Proposed | Seal status | Evidence when sealing |
| --- | --- | --- | --- | --- |
| 1 | Step list order and ids | Table in **Proposed step list** | Sealed | Ids in the seal table at the top of this file. |
| 2 | Required vs skippable for `people` and optional adult photo | People required; adult photo skippable | Sealed | Leaders must add a person. Invitees may skip people. Adult photo stays skippable. |
| 3 | Onboarding chrome | M9 shell with focused canvas; rail visible | Sealed | M9 shell. 240px rail stays visible. |
| 4 | Progress UI | Step X of Y plus percent; FS motion only | Sealed | Step X of Y and percent. 240ms and 300ms caps. Reduced motion respected. |
| 5 | `campus_ready` moment | Set completing step `home-lesson` | Sealed | Flag flips at `home-lesson`. |
| 6 | `profile_done` moment | All required gates (and kid G-intake if child added) | Sealed | Flag flips when the gates are done. |
| 7 | First goal copy and control | Single aim line feeding `/learn/goals` | Sealed | One aim line. Writes the gap-loop `outcomes` store. |
| 8 | Starter lesson CTA on Home | grok-bot next step | Sealed | Home CTA is `/c/grok-bot` after `home-lesson`. |
| 9 | Member rail during flow | 240px Learn, Library, You unchanged | Sealed | `m9-shell.ts` and Ben 9:34 PM ET Oct 14, 2026. |
| 10 | Kid intake UI | Parent-facing; no photo; G-intake stub label | Sealed | Form name Kid profile. Href `/onboarding/kid-profile`. No photo. No public URL. Gate id `G-intake`. |
| 11 | Analytics | `learning_events` only | Sealed | Kind `onboarding_step`. Object type `onboarding_flow`. No vendor. |
| 12 | Typography and color | FS tokens, UI blue `#1E4E8C`, cream bar | Sealed | One filled `#1E4E8C` button per step. Rail stays unfilled. |

---

## Design choices closed by the seal

CDM closed B1 through B10 on 2026-10-14, delegated by Ben. The seal table at the top of this file wins.

| # | Question | Evidence | Proposed default (not sealed) |
| --- | --- | --- | --- |
| B1 | Exact step list and which steps are skippable | Issue 371 table; packet residual "Exact first-run step list"; comment 6068402516 | Use the **Proposed step list** table above; `people` required for leaders. |
| B2 | When `campus_ready` vs `profile_done` may diverge | Packet Q9 and residual flags; Notion M12: "two flags, open Q9" | `campus_ready` at end of campus steps; `profile_done` when gates complete; Learn allowed between them per packet Q8. |
| B3 | Wizard-only vs à la carte gate completion for "done" | Packet residual; Profile PRD | Onboarding uses checklist step; finishing gates outside wizard still sets `profile_done` via existing `recordAdultGate`. |
| B4 | Onboarding chrome: full-screen vs shell-filling | Packet Q1; Designer checklist row 3 | Shell-filling with rail visible. |
| B5 | Name of kid intake form and route | `KID_GATES` feed string "Intake form not named yet"; `href: null` in `app/src/lib/profile/model.ts` | Block `kid-intake` UI on copy until Ben names the form; gate id stays `G-intake`. |
| B6 | Individual branch entry copy and step ids | Issue 371 CDM; issue 375 hidden plan; no `INDIVIDUAL` flag in repo yet | Feature flag off everywhere public; branch omitted from graph when off. |
| B7 | Invite entry step | `invite/[token]` creates membership in inviting org only (issue 371 already built) | Enter at `brain-name` or `people`, not `room`. |
| B8 | Analytics vendor | Packet Q10 still open; Notion run order M12: learning_events only | No vendor; extend `learning_events` schema in migration (number claimed at implementation). |
| B9 | First goal data model | M9 route table merges `/intent` to onboarding goal step; Gap Loop M1 owns goals | Reuse gap-loop outcome shape where possible; do not fork a second aim store without Ben. |
| B10 | Hard-gate Learn behind profile? | Packet Q8: learner can use Field School before profile done | Do not hard-gate starter lesson; nudge only. |

**Designer seal:** given 2026-10-14 by CDM, delegated by Ben. The UI stream may merge when its tests pass. This file does not deploy.
