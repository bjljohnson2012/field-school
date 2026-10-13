# Rebuild progress

Updated: 2026-10-13 3:27 PM ET by Grok Build
Main at: 34798e56529489424f7c1b067e166b10a8570578 (PR 361)
Active agents: none

migrations_claimed:
- M5: 0022

Next action: Halt. S0 and M5 are blocked, not acceptance-green. Do not spawn M6 or M8. Do not merge. Do not deploy. Ben restarts with: continue the master rebuild from docs/rebuild-progress.md
Blockers:
- S0: Grok Build usage balance exhausted (HTTP 402) before acceptance. WIP draft PR #382 at 0a39714. Hold M8 until a fresh agent finishes S0 and the status is draft_pr.
- M5: same 402 stop before acceptance. WIP draft PR #383 at 54f3855. Migration 0022 is in that branch. Hold M6 and M8 until a fresh agent finishes M5 and the status is draft_pr.

Checked before the 0022 claim: `app/db` on origin/main ends at `0021_knowledge_gap_loop.sql`. No `0022` or higher file on any remote branch. Open rebuild PRs: none yet. Claim recorded here before any SQL is written.

```yaml
streams:
  - {id: S0,  issue: 362, branch: feat/marketing-site-rebuild,     depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: blocked, pr: 382, migration: none}
  - {id: M5,  issue: 364, branch: feat/portal-m5-tenancy,          depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: blocked, pr: 383, migration: "0022"}
  - {id: M6,  issue: 365, branch: feat/portal-m6-content-model,    depends_on: [M5],           base: feat/portal-m5-tenancy,          merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M7,  issue: 366, branch: feat/portal-m7-progress,         depends_on: [M6],           base: feat/portal-m6-content-model,    merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M8,  issue: 367, branch: feat/portal-m8-identity-billing, depends_on: [M5, S0],       base: feat/portal-m5-tenancy,          merge_in: [S0],  needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M9,  issue: 368, branch: feat/portal-m9-shell,            depends_on: [M5, M7, M8],   base: feat/portal-m8-identity-billing, merge_in: [M7],  needs_merge: true,  gate: designer_seal, status: not_started, pr: null, migration: null}
  - {id: M10, issue: 369, branch: feat/portal-m10-library,         depends_on: [M6, M9],       base: feat/portal-m9-shell,            merge_in: [],    needs_merge: true,  gate: designer_seal, status: not_started, pr: null, migration: null}
  - {id: M11, issue: 370, branch: feat/portal-m11-brains,          depends_on: [M6, M10],      base: feat/portal-m10-library,         merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M12, issue: 371, branch: feat/portal-m12-onboarding,      depends_on: [M5, M9],       base: feat/portal-m9-shell,            merge_in: [],    needs_merge: true,  gate: designer_seal, status: not_started, pr: null, migration: null}
  - {id: PM3, issue: 372, branch: feat/profile-m3,                 depends_on: [M5, M9, M11],  base: feat/portal-m11-brains,          merge_in: [],    needs_merge: true,  gate: designer_seal, status: not_started, pr: null, migration: null}
  - {id: GL2, issue: 373, branch: feat/knowledge-gap-loop-m2,      depends_on: [M5, M11],      base: feat/portal-m11-brains,          merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: PM4, issue: 374, branch: feat/profile-m4,                 depends_on: [PM3],          base: feat/profile-m3,                 merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: GL3, issue: 375, branch: feat/knowledge-gap-loop-m3,      depends_on: [M8, M12, GL2], base: feat/knowledge-gap-loop-m2,      merge_in: [M12], needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M13, issue: 376, branch: spike/payload-m13,               depends_on: [M6, M11],      base: feat/portal-m11-brains,          merge_in: [],    needs_merge: false, gate: never_merge_spike, status: not_started, pr: null, migration: null}
  - {id: M14, issue: 377, branch: feat/portal-m14-evolution,       depends_on: [M13],          base: set_by_sealed_brief,             merge_in: [],    needs_merge: true,  gate: sealed_brief_on_377, status: not_started, pr: null, migration: null}
  - {id: M15, issue: 378, branch: feat/portal-m15-retire,          depends_on: [M9, M10, M11], base: feat/portal-m11-brains,          merge_in: [],    needs_merge: true,  gate: merge_after_m9_m11_deployed_and_soaked, status: not_started, pr: null, migration: null}
  - {id: G,   issue: 379, branch: feat/portal-go-live,             depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: draft_pr, pr: 381, migration: none}
walk_order: [S0, M5, G, M6, M7, M8, M9, M10, M11, M12, PM3, GL2, PM4, GL3, M13, M14, M15]
ben_merge_order: [S0, M5, M6, M7, M8, G, M9, M10, M11, M12, PM3, GL2, PM4, GL3, M15]
```

M13 is never merged. M14 stays not_started until #377 has a sealed brief posted after the M13 report. M15 is built when its depends_on are draft_pr. Ben merges M15 only after M9 to M11 are deployed and soaked.

## Stream 0 recommendation map

Issue #362, "The 15 recommendations". Offer keys are the M8 prep keys in `app/src/lib/billing/m8-prep.ts` (`47d7178`, draft PR #386): `diy`, coaching `assess` / `model` / `build`, and `consulting`. Prices are $300, $600, and $1,500 a month. Consulting is Email Ben (`mailto:ben@fieldschool.ai?subject=Consulting`). Learn with Ben and the $100, $200, and $1,000 tiers are retired on `app/marketing-site`. `COACHING_GO_LIVE` stays `false`. Stripe stays in test mode. Launch stays CLOSED 0/8.

The page and test rows are on `feat/marketing-site-rebuild` (draft PR #382) unless a later slice is named. The branch tip is `6144794` on top of the WIP `0a39714`. Page polish `0236574` is draft PR #389 and is not in #382. Portal cart commits `3a058c9` and `627212a` are draft PR #390 and are not in #382. The stale repo-root `marketing-site/pricing.html` still shows $100, $200, and $1,000. Issue #362 says not to edit that copy. Deploy uses `app/marketing-site/`.

A checked row is met by the page, commit, or test named. An unchecked row is partial or deferred, and the cell says why.

| # | Recommendation | Met | Where |
| --- | --- | --- | --- |
| 1 | Lead with one category | [x] | `app/marketing-site/index.html` kicker "Knowledge brains", the definition in `#how`, and the "Who starts here" chips. Commit `0a39714`. Test `homepage has the thirteen sections, hero, and nav` in `app/scripts/marketing-site-rebuild.test.mjs`. |
| 2 | Rebuild the hero | [ ] | Partial. Headline, subhead, Start free, See pricing, the risk line, the Family and Org toggle, and the seal are in `index.html` at `0a39714`. One filled blue in the first view was checked on `feat/s0-marketing-pages` at `0236574`. Deferred: the right side is a text card (Hale household / Hale team), not a captured portal screenshot. |
| 3 | Coaching, named by the result | [x] | Keys `diy`, `assess`, `model`, `build`, `consulting`. Cards Assess $300, Model $600, Build $1,500 with Email Ben on `index.html` `#coaching`, `pricing.html`, and `teams/services.html` (`data-offer` `diy` / `coaching` / `consulting`, `data-tier` on the three buttons). `app/marketing-site/js/checkout-switch.mjs` and `app/src/lib/billing/offer-names.ts` at `0a39714`. Same keys and prices in M8 prep `47d7178`. Tests `coaching buttons on the site are the three tiers`, `portal pricing renders coaching prices and an empty individual slot`, and `services are linked only from teams and consulting has no dollar amount`. Dayton is on `/pricing` only. The Individual slot renders nothing. Consulting has no dollar amount. |
| 4 | Two rooms, one school | [x] | `index.html` `#rooms` uses the locked family and team sentences. `families.html` and `teams.html`. Commit `0a39714`. No child photos in `app/marketing-site/img/`. |
| 5 | Show the product | [ ] | Deferred. `app/marketing-site/img/` has the seal, the lockup, Ben, and `og.png`. Hero, problem, and lesson areas are text cards. No 2x portal captures. Pages check on PR #389 recorded this as fail. |
| 6 | Thirteen homepage sections | [ ] | Partial. The thirteen sections are in `index.html` in the specified order, and the homepage test asserts that order. Commit `0a39714`. The twelve-rules block is not a homepage section. Deferred: height is still over target. PR #389 measured 8241px at 1440 and 10385px at 390, against about 6,500px desktop and under about 9,000px mobile. |
| 7 | New nav | [x] | Header links are How it works, Families, Teams, Pricing, Ben, Sign in, Start free. Homepage test. Brand pages use that chrome in `6144794` (`app/marketing-site/brand/index.html`, `brand/options/index.html`). `app/scripts/brand.test.mjs` on that commit. |
| 8 | One path | [x] | Start free goes to `https://portal.fieldschool.ai/signup?plan=course`. Test `signup for the free course names the same headline`. Saturday email is the one-field form on `index.html`. Paid buttons stay mailto while `COACHING_GO_LIVE` is `false` in `checkout-switch.mjs`. Test `go-live switch defaults to Email Ben and flips only coaching`. Consulting stays Email Ben either way. The flag stays off. Public pages do not open Stripe. Draft #393 at `7312c44` sets `CHECKOUT_GO_LIVE` false in `app/src/lib/billing/checkout-destination.ts`. `livePaymentLink` and `livePriceId` return null unless the caller passes true, so live Payment Links and live price ids stay unreachable while the flag is false. Tests `the go-live flag stays off and live Payment Links stay unreachable` and `live price ids stay unreachable while the go-live flag is off` in `app/scripts/checkout-destination.test.mjs`. |
| 9 | Proof stays honest | [x] | `index.html` `#credential` is a text strip (Euna, Ministry Brands) and `#voice` is one Ben quote. Commit `0a39714`. No logo strip and no carousel. |
| 10 | Ben on the homepage and at `/ben` | [x] | Homepage portrait and "Ben built Field School for the hours he cannot be there." `ben.html`. Commit `0a39714`. Prepared 301 `/founder` to `/ben` is in `app/deploy/caddy/fieldschool-301.caddy`. Test `prepared fieldschool.ai caddy map returns 301s and is not wired into deploy`. The map is not applied. This log does not deploy. |
| 11 | Type | [x] | `app/marketing-site/css/fonts.css` and `css/site.css` at `0a39714`. Fraunces 500 and 600, IBM Plex Sans, IBM Plex Mono for kickers. H1 40px / 64px, H2 30px / 40px, H3 22px, lede 19px, body 17px. Header image is `img/lockup-wide-cream.png`. The slogan is in the footer, not on the lockup. |
| 12 | Color | [x] | `site.css` tokens: cream `#F6F3EC`, ink `#1A1916`, UI blue `#1E4E8C`, stone `#7A746A`, muted `#5C5850`, hairline `#D8D2C6`. Brand blue `#1F5EFF` is only `.brand-card.blue`. Contrast measured 8.32 on white and 7.51 on cream in the marketing test pass. That contrast check is not its own committed test. |
| 13 | Layout and motion | [ ] | Partial. `site.css` has a 72rem wrap, 24px gutters, a 672px measure, 72px / 120px section padding, 12px corners, fade-up 8px over 200ms, reduced motion, and a darker hover on the primary button. Open on draft #389: a 12-column grid is being added there. Tracks today are 1fr, two, three, and four columns. |
| 14 | Voice | [x] | Locked lines are on `index.html`, `principles.html` ("Reality over hope", "Read the room"), and the services page. Commit `0a39714`. The public-page test rejects an em dash. The homepage has no sentence that starts with "I". |
| 15 | Mobile first | [ ] | Partial. `index.html` has the slim sticky Start free bar. On PR #389 the first 844px screen holds the headline, the subhead, Start free, and the top of the product card. Deferred: the hero headline is 5 lines at 40px on a 390px screen, and the locked sentence does not wrap to 3. The homepage is 10385px tall at 390, over the about 9,000px target. |

Ten rows are met. Five stay open: 2, 5, 6, 13, and 15. Rows 2, 5, 6, and 15 close when #389 lands. Row 13 is the 12-column grid being added on #389. S0 stays blocked. This map does not accept the stream.

## Log

- 2026-10-08 4:47 PM ET dispatcher: Read the master plan, #363, and #362. Main is 34798e5 (PR 361). No rebuild PRs merged. Opened #379 for stream G. Claimed migration 0022 for M5. Started wave 1 (S0, M5, G).
- 2026-10-08 4:50 PM ET dispatcher: Progress log is draft PR #380. Rebuild progress comment on #363 is 6068778012. Wave 1 agents are in isolated worktrees.
- 2026-10-08 5:20 PM ET G: draft PR #381 at 9e8526d. Migration none. Flip test and local smoke passed. typecheck and build passed. npm test reported 420 pass and 36 fail on files this branch does not change. No new lane is ready. Ben merges G after M8.
- 2026-10-08 evening: S0 agent 01a11d48-02ef-7472-9a30-95ba3094e115 and M5 agent 01a11d48-02f1-7e73-895a-48288dded7ea failed with HTTP 402, usage balance exhausted. No status files were written. Working trees were later committed as WIP and pushed.
- 2026-10-13 2:20 PM ET dispatcher: Halt. No merge. No deploy. WIP draft PR #382 (S0, 0a39714) and #383 (M5, 54f3855). Both stay blocked so M6 and M8 are not spawned. G stays #381 and still merges only after M8.
- 2026-10-13 3:15 PM ET: Stream 0 recommendation map added on this branch. Ten met, five partial or deferred. Offer keys are diy, coaching assess/model/build, and consulting. Go-live stays off. No merge. No deploy.
- 2026-10-13 3:27 PM ET: Row 8 now matches draft #393 at 7312c44. Live Payment Links and live price ids stay unreachable while CHECKOUT_GO_LIVE is false. Rows 2, 5, 6, 13, and 15 stay open. No merge.

## Handoff

Context stopped because the stream agents hit HTTP 402 (Grok Build usage balance exhausted) before acceptance. Restart with: continue the master rebuild from docs/rebuild-progress.md

On restart: fetch, read this file, mark anything Ben has merged, and spawn a fresh agent for S0 and for M5 from the WIP commits below. Do not treat #382 or #383 as draft_pr until acceptance passes and the checkpoint comment is posted. Do not spawn M6 or M8 while those two are blocked. Do not merge. Do not deploy.

- S0: blocked. Draft PR #382. Branch feat/marketing-site-rebuild. Last commit 0a39714. Worktree /Users/Owner/field-school-worktrees/s0. Marketing pages, portal pricing and cart, checkout switch, and tests are in the commit. Acceptance (typecheck, build, npm test, Lighthouse, screenshots at 1440 and 390) was not recorded green. Next step: finish acceptance on this branch, fix failures, post the section 7 checkpoint, then set status to draft_pr.
- M5: blocked. Draft PR #383. Branch feat/portal-m5-tenancy. Last commit 54f3855. Worktree /Users/Owner/field-school-worktrees/m5. Migration 0022 is app/db/0022_tenancy.sql. This branch also edits app/db/0004_tenants.sql so the household seed does not flip a family row back to homeschool. Next step: finish access tests and acceptance on this branch, post the section 7 checkpoint, then set status to draft_pr. Do not run --apply against production.
- G: draft_pr. PR #381. Branch feat/portal-go-live. Last commit 9e8526d. Ben merges this after M8. Ben steps are on the PR checkpoint comment.

Ben runs now: nothing. Do not merge #380, #381, #382, or #383. Do not deploy. Do not flip AUTH_URL. Do not run a live Stripe key.
