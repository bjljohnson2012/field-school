# Rebuild progress

Updated: 2026-10-13 7:52 PM ET
Main at: 9447e7ed63fb0d5035264be1bbee0a28cb5ac225 (PR 395)
Production: campus 2.24.70.248 at that tip. Smoke passed.
Active agents: none

`CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. `AUTH_URL` stays `https://portal.fieldschool.ai`. Launch stays CLOSED 0/8.

migrations on main:
- M5: `app/db/0022_tenancy.sql` (merged in #383)
- M6: `app/db/0023_content_model.sql` (merged in #391)
- M8: `app/db/0023_m8_identity_billing.sql` (merged in #386)
- M8 additive: `app/db/0024_m8_offer_tiers.sql` (merged in #394 at e3e10848ec410061a4e2232869ae1766bd71d904)
- M7: `app/db/0025_m7_progress.sql` (merged in #395). Applied on campus.

`app/deploy/deploy.sh` still applies only `0001_wave1.sql` through `0011_credits_byok.sql`. It does not apply `0005_coaching.sql` or `0012` through `0025`, including both `0023` files.

Tenancy backfill and test-row cleanup already ran at 2026-10-13 4:43 PM ET. Do not schedule them again. Post-apply counts: 4 orgs, 6 members, 10 memberships, 2 wards.

Next action: rebase and merge #381 only with `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` false and `AUTH_URL` unchanged. Fix `deploy.sh` so it applies every pending migration. M9 waits on the designer seal. Spec only. No UI ship. Do not deploy from this log. Do not merge #381 from this update.

```yaml
streams:
  - {id: S0,  issue: 362, branch: feat/marketing-site-rebuild,     depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 382, sha: "4354a40b99463180350623a1039f79026b961a5c", migration: none}
  - {id: M5,  issue: 364, branch: feat/portal-m5-tenancy,          depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 383, sha: "f0103e1d52910c4ca873c11930ed782b8d760495", migration: "0022"}
  - {id: M6,  issue: 365, branch: feat/portal-m6-content-model,    depends_on: [M5],           base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 391, sha: "4c06f1802da7711f3ae1778ec68b12c2255ff3a1", migration: "0023_content_model"}
  - {id: M7,  issue: 366, branch: feat/portal-m7-progress,         depends_on: [M6],           base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 395, sha: "9447e7ed63fb0d5035264be1bbee0a28cb5ac225", migration: "0025", migration_applied: true}
  - {id: M8,  issue: 367, branch: feat/portal-m8-identity-billing, depends_on: [M5, S0],       base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 386, sha: "d2c602be6ab458e49ec75405b57a441daf623546", migration: "0023_m8_identity_billing", additive_pr: 394, additive_sha: "e3e10848ec410061a4e2232869ae1766bd71d904", additive_migration: "0024"}
  - {id: M9,  issue: 368, branch: feat/portal-m9-shell,            depends_on: [M5, M7, M8],   base: main,                            merge_in: [],    needs_merge: false, gate: designer_seal, status: not_started, pr: null, migration: null, ship: spec_only}
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
  - {id: G,   issue: 379, branch: feat/portal-go-live,             depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: flags_stay_false, status: draft_pr, pr: 381, sha: "9e8526d7a89fa1dd5a64f58a75a3aa55d841e36b", migration: none}
walk_order: [S0, M5, G, M6, M7, M8, M9, M10, M11, M12, PM3, GL2, PM4, GL3, M13, M14, M15]
ben_merge_order: [S0, M5, M6, M7, M8, G, M9, M10, M11, M12, PM3, GL2, PM4, GL3, M15]
```

S0, M5, M6, M7, and M8 are merged and on the production tip. #381 is still an open draft (`mergeable_state: dirty`, head `9e8526d`, base recorded at `34798e5`). Rebase it onto current main before any merge. M13 is never merged. M14 stays not_started until #377 has a sealed brief posted after the M13 report. M15 is built when its depends_on are draft_pr. Ben merges M15 only after M9 to M11 are deployed and soaked.

## Stream 0 recommendation map

Issue #362, "The 15 recommendations". Offer keys are the M8 keys: `diy`, coaching `assess` / `model` / `build`, and `consulting`. Prices are $300, $600, and $1,500 a month. Consulting is Email Ben (`mailto:ben@fieldschool.ai?subject=Consulting`). Learn with Ben and the $100, $200, and $1,000 tiers are retired on `app/marketing-site`. `COACHING_GO_LIVE` stays `false`. Stripe stays in test mode. Launch stays CLOSED 0/8.

S0 is merged as #382 (`4354a40b99463180350623a1039f79026b961a5c`) and deployed. #389 (`fad3568`), #390, and #393 merged into `feat/marketing-site-rebuild` before that merge, and those commits are on main. The stale repo-root `marketing-site/pricing.html` still shows $100, $200, and $1,000. Issue #362 says not to edit that copy. Deploy uses `app/marketing-site/`.

A checked row is met by the page, commit, or test named.

| # | Recommendation | Met | Where |
| --- | --- | --- | --- |
| 1 | Lead with one category | [x] | `app/marketing-site/index.html` kicker "Knowledge brains", the definition in `#how`, and the "Who starts here" chips. Commit `0a39714`, on main through #382. Test `homepage has the thirteen sections, hero, and nav` in `app/scripts/marketing-site-rebuild.test.mjs`. |
| 2 | Rebuild the hero | [x] | #389 at `fad3568`, on main through #382. The phone hero is 4 lines at 32px. Desktop stays 3 lines at 64px. Portal WebP shots replaced the text cards on `index.html`. |
| 3 | Coaching, named by the result | [x] | Keys `diy`, `assess`, `model`, `build`, `consulting`. Cards Assess $300, Model $600, Build $1,500 with Email Ben on `index.html` `#coaching`, `pricing.html`, and `teams/services.html` (`data-offer` `diy` / `coaching` / `consulting`, `data-tier` on the three buttons). `app/marketing-site/js/checkout-switch.mjs` and `app/src/lib/billing/offer-names.ts`. Same keys and prices in the merged M8 work. Tests `coaching buttons on the site are the three tiers`, `portal pricing renders coaching prices and an empty individual slot`, and `services are linked only from teams and consulting has no dollar amount`. Dayton is on `/pricing` only. The Individual slot renders nothing. Consulting has no dollar amount. |
| 4 | Two rooms, one school | [x] | `index.html` `#rooms` uses the locked family and team sentences. `families.html` and `teams.html`. Commit `0a39714`, on main through #382. No child photos in `app/marketing-site/img/`. |
| 5 | Show the product | [x] | #389 at `fad3568`, on main through #382. Local demo portal WebPs at 1440 and 390: `portal-path`, `portal-lesson`, and `portal-brain`, each with alt text. |
| 6 | Thirteen homepage sections | [x] | The thirteen sections stay in `index.html` in order. #389 at `fad3568` measures homepage scrollHeight 6938px at 1440 and 8697px at 390. |
| 7 | New nav | [x] | Header links are How it works, Families, Teams, Pricing, Ben, Sign in, Start free. Homepage test. Brand pages use that chrome in `6144794` (`app/marketing-site/brand/index.html`, `brand/options/index.html`). `app/scripts/brand.test.mjs` on that commit. |
| 8 | One path | [x] | Start free goes to `https://portal.fieldschool.ai/signup?plan=course`. Test `signup for the free course names the same headline`. Saturday email is the one-field form on `index.html`. Paid buttons stay mailto while `COACHING_GO_LIVE` is `false` in `checkout-switch.mjs`. Test `go-live switch defaults to Email Ben and flips only coaching`. Consulting stays Email Ben either way. The flag stays off. Public pages do not open Stripe. #393 set `CHECKOUT_GO_LIVE` false in `app/src/lib/billing/checkout-destination.ts` and is on main through #382. `livePaymentLink` and `livePriceId` return null unless the caller passes true, so live Payment Links and live price ids stay unreachable while the flag is false. Tests `the go-live flag stays off and live Payment Links stay unreachable` and `live price ids stay unreachable while the go-live flag is off` in `app/scripts/checkout-destination.test.mjs`. |
| 9 | Proof stays honest | [x] | `index.html` `#credential` is a text strip (Euna, Ministry Brands) and `#voice` is one Ben quote. Commit `0a39714`, on main through #382. No logo strip and no carousel. |
| 10 | Ben on the homepage and at `/ben` | [x] | Homepage portrait and "Ben built Field School for the hours he cannot be there." `ben.html`. Commit `0a39714`, on main through #382. Prepared 301 `/founder` to `/ben` is in `app/deploy/caddy/fieldschool-301.caddy`. Test `prepared fieldschool.ai caddy map returns 301s and is not wired into deploy`. The map is not applied. |
| 11 | Type | [x] | `app/marketing-site/css/fonts.css` and `css/site.css` at `0a39714`, on main through #382. Fraunces 500 and 600, IBM Plex Sans, IBM Plex Mono for kickers. H1 40px / 64px, H2 30px / 40px, H3 22px, lede 19px, body 17px. Header image is `img/lockup-wide-cream.png`. The slogan is in the footer, not on the lockup. |
| 12 | Color | [x] | `site.css` tokens: cream `#F6F3EC`, ink `#1A1916`, UI blue `#1E4E8C`, stone `#7A746A`, muted `#5C5850`, hairline `#D8D2C6`. Brand blue `#1F5EFF` is only `.brand-card.blue`. Contrast measured 8.32 on white and 7.51 on cream in the marketing test pass. That contrast check is not its own committed test. |
| 13 | Layout and motion | [x] | #389 at `fad3568`, on main through #382. `site.css` sets `--grid-columns: 12` and `.grid`. Tracks span 12, 6, 4, and 3. `prefers-reduced-motion` sets `.reveal` animation to none. |
| 14 | Voice | [x] | Locked lines are on `index.html`, `principles.html` ("Reality over hope", "Read the room"), and the services page. Commit `0a39714`, on main through #382. The public-page test rejects an em dash. The homepage has no sentence that starts with "I". |
| 15 | Mobile first | [x] | #389 at `fad3568`, on main through #382. The hero is 4 lines on the phone. Homepage scrollHeight is 8697px at 390, under 9,000px. scrollWidth 390 equals clientWidth 390. |

All 15 rows are met. S0 is merged and deployed.

## Log

- 2026-10-08 4:47 PM ET dispatcher: Read the master plan, #363, and #362. Main is 34798e5 (PR 361). No rebuild PRs merged. Opened #379 for stream G. Claimed migration 0022 for M5. Started wave 1 (S0, M5, G).
- 2026-10-08 4:50 PM ET dispatcher: Progress log is draft PR #380. Rebuild progress comment on #363 is 6068778012. Wave 1 agents are in isolated worktrees.
- 2026-10-08 5:20 PM ET G: draft PR #381 at 9e8526d. Migration none. Flip test and local smoke passed. typecheck and build passed. npm test reported 420 pass and 36 fail on files this branch does not change. No new lane is ready. Ben merges G after M8.
- 2026-10-08 evening: S0 agent 01a11d48-02ef-7472-9a30-95ba3094e115 and M5 agent 01a11d48-02f1-7e73-895a-48288dded7ea failed with HTTP 402, usage balance exhausted. No status files were written. Working trees were later committed as WIP and pushed.
- 2026-10-13 2:20 PM ET dispatcher: Halt. No merge. No deploy. WIP draft PR #382 (S0, 0a39714) and #383 (M5, 54f3855). Both stay blocked so M6 and M8 are not spawned. G stays #381 and still merges only after M8.
- 2026-10-13 3:15 PM ET: Stream 0 recommendation map added on this branch. Ten met, five partial or deferred. Offer keys are diy, coaching assess/model/build, and consulting. Go-live stays off. No merge. No deploy.
- 2026-10-13 3:27 PM ET: Row 8 now matches draft #393 at 7312c44. Live Payment Links and live price ids stay unreachable while CHECKOUT_GO_LIVE is false. Rows 2, 5, 6, 13, and 15 stay open. No merge.
- 2026-10-13 3:34 PM ET: Rows 2, 5, 6, 13, and 15 are met from draft #389 at fad3568. S0 stays blocked. This map does not accept the stream. No merge.
- 2026-10-13 4:06 PM ET: #383 merged at f0103e1d52910c4ca873c11930ed782b8d760495. #382 merged at 4354a40b99463180350623a1039f79026b961a5c. #389, #390, and #393 were already on the S0 branch.
- 2026-10-13 4:25 PM ET: #386 merged at d2c602be6ab458e49ec75405b57a441daf623546.
- 2026-10-13 4:33 PM ET: #391 merged at 4c06f1802da7711f3ae1778ec68b12c2255ff3a1.
- 2026-10-13 4:34 PM ET: #394 merged at e3e10848ec410061a4e2232869ae1766bd71d904. Migration 0024.
- 2026-10-13 4:43 PM ET: Tenancy backfill and test-row cleanup applied. Post-apply counts: 4 orgs, 6 members, 10 memberships, 2 wards. Do not schedule either script again.
- 2026-10-13 4:56 PM ET: #395 merged at 9447e7ed63fb0d5035264be1bbee0a28cb5ac225. Migration 0025 is applied on campus.
- 2026-10-13 7:52 PM ET: Production tip is 9447e7ed63fb0d5035264be1bbee0a28cb5ac225 on campus 2.24.70.248. Smoke passed. S0, M5, M6, M7, M8, and #394 are merged and deployed. #381 stays an open draft. This update does not merge it, does not deploy, does not run tenancy-backfill or test-rows, and does not flip AUTH_URL.

## Handoff

S0 #382, M5 #383, M6 #391, M7 #395, M8 #386, and additive #394 are merged. The production tip is `9447e7ed63fb0d5035264be1bbee0a28cb5ac225` on campus `2.24.70.248`. Smoke passed. Migration `0025_m7_progress.sql` is applied.

Tenancy backfill and test-row cleanup already ran at 2026-10-13 4:43 PM ET. Counts after that apply: 4 orgs, 6 members, 10 memberships, 2 wards. Do not schedule them again.

#381 is still an open draft on `feat/portal-go-live` at `9e8526d7a89fa1dd5a64f58a75a3aa55d841e36b`. GitHub reports it dirty against main. This update does not merge it.

Next:

1. Rebase #381 onto main and merge it only while `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay false and `AUTH_URL` stays `https://portal.fieldschool.ai`.
2. Fix `app/deploy/deploy.sh` so the apply loop covers every pending migration, including both `0023` files, `0024`, and `0025`.
3. M9 (#368) waits on the designer seal. Spec only. No UI ship.

Do not deploy from this log. Do not flip AUTH_URL. Do not run a live Stripe key. Launch stays CLOSED 0/8.
