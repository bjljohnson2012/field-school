# Rebuild progress

Updated: 2026-10-14 (GL3 merged; campus deploy in flight)
Main at: a47777a80985bc9205f8f5c4995d8e6a5b1ed370 (PR 432 GL3 individual plan)
Production: campus 2.24.70.248 at `66e4aef53290862f6f33a1a5fc8883bf145caa34` (M14 #428) until the GL3 ship lands — not live at `a47777a` yet.
Active agents: none

`CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. `AUTH_URL` stays `https://portal.fieldschool.ai`. Launch stays CLOSED 0/8.

`GROK_API_KEY` is set on production. Coaching health is ok. Do not read or print the key in agent logs.

Member rail (Ben, 9:34 PM ET on 2026-10-14): members use the 240px Learn / Library / You rail. `NEXT_PUBLIC_MEMBER_RAIL_VARIANT=issue-368` is the production build env. `docs/LAW.md` and `docs/staff/SHELLS.md` record that override. Learn and Me is only when that variable is `shells`.

migrations on main:
- M5: `app/db/0022_tenancy.sql` (merged in #383)
- M6: `app/db/0023_content_model.sql` (merged in #391)
- M8: `app/db/0023_m8_identity_billing.sql` (merged in #386)
- M8 additive: `app/db/0024_m8_offer_tiers.sql` (merged in #394 at e3e10848ec410061a4e2232869ae1766bd71d904)
- M7: `app/db/0025_m7_progress.sql` (merged in #395)
- M12: `app/db/0027_m12_onboarding.sql` (merged in #412, deployed with M10 ship)
- M11: `app/db/0028_m11_brains.sql` (merged in #415, deployed)
- GL2: `app/db/0029_gl2_gap_loop.sql` (merged in #417, deployed)
- PM3: `app/db/0030_pm3_profile.sql` (merged in #418, deployed on campus ship 1)
- PM4: `app/db/0031_pm4_profile.sql` (merged in #423, deployed)
- GL3: `app/db/0032_gl3_individual_plan.sql` (merged in #432; not applied on campus until GL3 deploy completes)

Migration runner merged in #398 at 6a38436fadbdad670026e76e42c1e4c98b8790ff and deployed. Campus ledger after the M14 ship: `schema_migrations` has 32 rows (`0026` still absent). M14 deploy applied 0 / skipped 32. `0032` is on main via GL3 #432; campus has not applied it yet. PM3 ship 1 applied `0030`; PM4 ship applied `0031`. Do not claim a new migration number from this log.

Campus GL2 notes: gap-loop embeddings use xAI model v1, N=1024. Cron sidecar `field-school-knowledge-loop-cron` runs a one-line POST then `sleep 900`. Cron command fix (#421) deployed on campus ship 2 at `9b478c6`.

M13 spike report (#426, docs only): recommendation is Drizzle stays the runtime; Payload is not mounted in campus Next. Spike runtime PR #424 stays open and must not be merged.

GL3 (#432): merged on main at `a47777a`. Individual plan config in `app/src/lib/individual/config.ts`; `INDIVIDUAL_PLAN_ENABLED` defaults off. Campus deploy in progress — not `deployed`. M14 (#428) stays the campus tip until this ship completes.

M14 (#428, Drizzle-only slice): deployed on campus at `66e4aef`. Payload stays off campus Next.

M15 (#431, draft at `c85360a73d18b6a78c47d5cd1b70309908c12795`): retire plan targets `living_brains` 1, `living_profiles` 0, homeschool orgs 0. Not merged; retire delete is not on campus.

Tenancy backfill and test-row cleanup already ran at 2026-10-13 4:43 PM ET. Do not schedule them again.

Read-only check against `campus-20261014T002029Z.dump` (pre-ship) matched production. Post M10/M12 dump: `/var/backups/field-school/campus-20261014T125024Z.dump`. Post M11 dump: `/var/backups/field-school/campus-20261014T132931Z.dump`. Post GL2 dump: `/var/backups/field-school/campus-20261014T140056Z.dump`. PM3 ship 1 dump: `/var/backups/field-school/campus-20261014T141006Z.dump`. PM3 ship 2 dump: `/var/backups/field-school/campus-20261014T141405Z.dump`. Post PM4 dump: `/var/backups/field-school/campus-20261014T144145Z.dump`. Post M14 dump: `/var/backups/field-school/campus-20261014T150211Z.dump`.

| table | count |
| --- | ---: |
| organizations | 4 |
| members | 6 |
| memberships | 10 |
| wards | 2 |
| learning_events | 2 |
| enrollments | 0 |

Next action: GL3 (#375) is merged (#432); campus deploy is in progress — not `deployed`. M15 (#378) draft #431 is open — not merged, not on campus. `sealed_brief_on_377` still applies for any follow-on M14 work. Do not merge spike runtime PR #424. Do not deploy from this log. Do not flip `AUTH_URL`. No live Stripe.

```yaml
streams:
  - {id: S0,  issue: 362, branch: feat/marketing-site-rebuild,     depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 382, sha: "4354a40b99463180350623a1039f79026b961a5c", migration: none}
  - {id: M5,  issue: 364, branch: feat/portal-m5-tenancy,          depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 383, sha: "f0103e1d52910c4ca873c11930ed782b8d760495", migration: "0022"}
  - {id: M6,  issue: 365, branch: feat/portal-m6-content-model,    depends_on: [M5],           base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 391, sha: "4c06f1802da7711f3ae1778ec68b12c2255ff3a1", migration: "0023_content_model"}
  - {id: M7,  issue: 366, branch: feat/portal-m7-progress,         depends_on: [M6],           base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 395, sha: "9447e7ed63fb0d5035264be1bbee0a28cb5ac225", migration: "0025", migration_applied: true}
  - {id: M8,  issue: 367, branch: feat/portal-m8-identity-billing, depends_on: [M5, S0],       base: main,                            merge_in: [],    needs_merge: false, gate: none, status: merged, pr: 386, sha: "d2c602be6ab458e49ec75405b57a441daf623546", migration: "0023_m8_identity_billing", additive_pr: 394, additive_sha: "e3e10848ec410061a4e2232869ae1766bd71d904", additive_migration: "0024"}
  - {id: G,   issue: 379, branch: feat/portal-go-live,             depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: flags_stay_false, status: merged, pr: 381, sha: "bb37accdd727800604d62b32d27af652f0a83ef5", migration: none}
  - {id: M9,  issue: 368, branch: feat/portal-m9-shell,            depends_on: [M5, M7, M8],   base: main,                            merge_in: [],    needs_merge: false, gate: designer_seal, status: merged, pr: 397, sha: "d1aca02f433f20b7681d3dde3887983c570e0045", migration: null, member_rail_pr: 399, member_rail_sha: "4eaf464cfa19c2c7a1e0b552490a31f5515e79ef"}
  - {id: M10, issue: 369, branch: feat/portal-m10-library,         depends_on: [M6, M9],       base: feat/portal-m9-shell,            merge_in: [],    needs_merge: false, gate: designer_seal, status: deployed, pr: 413, sha: "51a4e448bcb45540a01b93d996909d32b4b5bad4", spec_pr: 407, spec_doc: docs/rebuild/m10-library-prep.md, spec_sha: "4c6710f7663ccd9a31306ed70ef7cdc72d0a4809", migration: null, deploy_ship_with: [M12]}
  - {id: M11, issue: 370, branch: feat/portal-m11-brains,          depends_on: [M6, M10],      base: feat/portal-m10-library,         merge_in: [],    needs_merge: false, gate: none, status: deployed, pr: 415, sha: "78d10b933e5d0a9b8bebfd22f870eec5e16f3d75", spec_pr: 404, spec_doc: docs/rebuild/m11-brains-prep.md, spec_sha: "009475056dc86cc0ca10f8eac2fa14234a5dbf81", migration: "0028"}
  - {id: M12, issue: 371, branch: feat/portal-m12-onboarding,      depends_on: [M5, M9],       base: feat/portal-m9-shell,            merge_in: [],    needs_merge: false, gate: designer_seal, status: deployed, pr: 412, sha: "c9ea1e8f654ab15f4c84dfb42e33eb7ae17d1521", deploy_sha: "51a4e448bcb45540a01b93d996909d32b4b5bad4", spec_pr: 405, spec_doc: docs/rebuild/m12-onboarding-prep.md, spec_sha: "c6bd7007f2ee8afa5dfe64971bcfe5ce835c78b6", migration: "0027", deploy_ship_with: [M10]}
  - {id: PM3, issue: 372, branch: feat/profile-m3,                 depends_on: [M5, M9, M11],  base: feat/portal-m11-brains,          merge_in: [],    needs_merge: false, gate: designer_seal, status: deployed, pr: 418, sha: "cce07b3a00f61015fd9aa9e7a3973192d12dd57a", deploy_sha: "9b478c6b97fb5c43ff3edf1469e433e2a3ef460b", spec_pr: 408, spec_doc: docs/rebuild/pm3-profile-prep.md, spec_sha: "71665149c98c84ca05eb529226dc19134d1e9761", migration: "0030", deploy_ship_1_sha: "81049f9465e07d43d52f09cb2d87b4758f3c4f54", deploy_ship_2_sha: "9b478c6b97fb5c43ff3edf1469e433e2a3ef460b", cron_fix_pr: 421}
  - {id: GL2, issue: 373, branch: feat/knowledge-gap-loop-m2,      depends_on: [M5, M11],      base: feat/portal-m11-brains,          merge_in: [],    needs_merge: false, gate: none, status: deployed, pr: 417, sha: "338ddbc6ad2462c412161acd56bf6414d598f8de", spec_pr: 409, spec_doc: docs/rebuild/gl2-gap-loop-prep.md, spec_sha: "d0e71dc68979accd17a207572706282bfcb0f447", migration: "0029", embeddings: "xai-v1-1024", cron_sidecar: "field-school-knowledge-loop-cron", cron_command: "POST then sleep 900", cron_fix_pr: 421, cron_fix_deploy_sha: "9b478c6b97fb5c43ff3edf1469e433e2a3ef460b"}
  - {id: PM4, issue: 374, branch: feat/profile-m4,                 depends_on: [PM3],          base: feat/profile-m3,                 merge_in: [],    needs_merge: false, gate: none, status: deployed, pr: 423, sha: "0c0569165a1cad7de5aa7ec98164e4c8065d5972", spec_pr: 403, spec_doc: docs/rebuild/pm4-profile-prep.md, spec_sha: "0c83da3f240535b7296fbabd85ea03a6e755c2de", migration: "0031"}
  - {id: GL3, issue: 375, branch: feat/knowledge-gap-loop-m3,      depends_on: [M8, M12, GL2], base: feat/knowledge-gap-loop-m2,      merge_in: [M12], needs_merge: false, gate: none, status: merged, pr: 432, sha: "a47777a80985bc9205f8f5c4995d8e6a5b1ed370", spec_pr: 410, spec_doc: docs/rebuild/gl3-gap-loop-prep.md, spec_sha: "c8fad4cf9adf0ff940a16a0f353620216a61edde", migration: "0032", individual_plan_config: true, flag: INDIVIDUAL_PLAN_ENABLED, flag_default: off, deploy: in_progress, deps_met: true}
  - {id: M13, issue: 376, branch: spike/payload-m13,               depends_on: [M6, M11],      base: feat/portal-m11-brains,          merge_in: [],    needs_merge: false, gate: never_merge_spike, status: spike_report_merged, pr: null, spec_pr: 401, spec_doc: docs/rebuild/m13-payload-spike-prep.md, spec_sha: "e99850da4566abbd3846b202f6198a9f2c7f617c", report_pr: 426, report_sha: "a9e3aada05a78a78eab2245f4a1f3b79901a4b0f", report_doc: docs/rebuild/m13-payload-spike-report.md, spike_runtime_pr: 424, spike_runtime: open_do_not_merge, recommendation: "Drizzle runtime; Payload not mounted on campus Next", migration: null}
  - {id: M14, issue: 377, branch: feat/portal-m14-evolution,       depends_on: [M13],          base: set_by_sealed_brief,             merge_in: [],    needs_merge: false, gate: sealed_brief_on_377, status: deployed, pr: 428, sha: "66e4aef53290862f6f33a1a5fc8883bf145caa34", spec_pr: 402, spec_doc: docs/rebuild/m14-evolution-prep.md, spec_sha: "946b33516a02e95f14cc1086a08b51e303bc75f2", drizzle_slice: true, migration: none, payload_on_campus: false, m13_report_pr: 426, build_waits_on: [sealed_brief_on_377], cron_recreated: false}
  - {id: M15, issue: 378, branch: feat/portal-m15-retire,          depends_on: [M9, M10, M11], base: feat/portal-m11-brains,          merge_in: [],    needs_merge: true,  gate: merge_after_m10_m11_deployed_and_soaked, status: spec_merged, pr: 431, sha: "c85360a73d18b6a78c47d5cd1b70309908c12795", draft: true, spec_pr: 406, spec_doc: docs/rebuild/m15-retire-prep.md, spec_sha: "5fea0b6da998369d17bef480573be30afae1693a", migration: none, build: in_progress, retire_plan: {living_brains: 1, living_profiles: 0, homeschool_orgs: 0}, retire_delete_on_campus: false}
walk_order: [S0, M5, G, M6, M7, M8, M9, M10, M11, M12, PM3, GL2, PM4, GL3, M13, M14, M15]
ben_merge_order: [S0, M5, M6, M7, M8, G, M9, M10, M11, M12, PM3, GL2, PM4, GL3, M15]
```

S0, M5, M6, M7, M8, G, M9, M10, M11, M12, GL2, PM3, PM4, and M14 are merged and deployed on the campus tip (`66e4aef53290862f6f33a1a5fc8883bf145caa34`, #428 Drizzle slice) until the in-flight GL3 ship lands. GL3 is merged (#432, `a47777a`) with campus deploy in progress — not `deployed`; `INDIVIDUAL_PLAN_ENABLED` stays off by default. GL2 merge remains `338ddbc` (#417). M13 spike report is on main (#426); runtime PR #424 stays open. M14 Payload stays off campus. Sealed brief on #377 still required for follow-on work. M15 draft #431 (`c85360a73d18b6a78c47d5cd1b70309908c12795`) is not merged; retire delete is not on campus. M15 has no migration in its spec; Ben merges M15 code only after M10 and M11 are deployed and soaked (`merge_after_m10_m11_deployed_and_soaked`).

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
- 2026-10-14: #381 merged at bb37accdd727800604d62b32d27af652f0a83ef5 (stream G, flags stay false). #398 merged at 6a38436fadbdad670026e76e42c1e4c98b8790ff. Migration runner deployed. `schema_migrations` has 27 rows.
- 2026-10-14: #397 merged at d1aca02f433f20b7681d3dde3887983c570e0045 (M9 shell). #399 merged at 4eaf464cfa19c2c7a1e0b552490a31f5515e79ef (member rail default). Production tip matches main.
- 2026-10-14 9:34 PM ET: Ben chose the issue-368 member rail for production. `NEXT_PUBLIC_MEMBER_RAIL_VARIANT=issue-368` on the prod build. Dump `campus-20261014T002029Z` counts verified read-only.
- 2026-10-15: Spec prep wave merged on main: #401 M13, #402 M14, #403 PM4, #404 M11, #405 M12, #406 M15, #407 M10, #408 PM3, #409 GL2, #410 GL3. Dispatcher marks each stream `spec_merged` only. Production tip unchanged.
- 2026-10-14: #412 M12 merged at c9ea1e8f654ab15f4c84dfb42e33eb7ae17d1521. #413 M10 merged at 51a4e448bcb45540a01b93d996909d32b4b5bad4. One campus ship. Migration `0027` applied; `0026` absent; `schema_migrations` 28 rows. Dump `campus-20261014T125024Z`. Smoke passed. Rollback not used.
- 2026-10-14: #415 M11 merged and deployed at 78d10b933e5d0a9b8bebfd22f870eec5e16f3d75. Migration `0028` applied; `schema_migrations` 29 rows. Dump `campus-20261014T132931Z`. Smoke passed. Rollback not used. Living-brain tables not dropped.
- 2026-10-14: #417 GL2 merged and deployed at 338ddbc6ad2462c412161acd56bf6414d598f8de. Migration `0029` applied; `schema_migrations` 30 rows. Dump `campus-20261014T140056Z`. Embeddings xAI v1 N=1024; cron sidecar running. Folded-`curl` server hotfix only — git fix not deployed.
- 2026-10-14: #418 PM3 merged at cce07b3a00f61015fd9aa9e7a3973192d12dd57a. Campus deploy in flight; smoke not run yet. GL2 campus tip unchanged at `338ddbc`.
- 2026-10-14: PM3 campus ship 1 at `81049f9`, dump `campus-20261014T141006Z`, migration `0030` applied. Ship 2 at `9b478c6` (#421 cron fix), dump `campus-20261014T141405Z`, migrations applied 0 / skipped 31; ledger 31. Smoke passed.
- 2026-10-14: #423 PM4 deployed at `0c0569165a1cad7de5aa7ec98164e4c8065d5972`. Dump `campus-20261014T144145Z`. Migration `0031` applied; ledger 32. Smoke passed. Cron unchanged (POST then sleep 900).
- 2026-10-14: #426 M13 spike report merged at `a9e3aada05a78a78eab2245f4a1f3b79901a4b0f` (`docs/rebuild/m13-payload-spike-report.md`, docs only). Drizzle runtime; Payload not on campus Next. #424 spike runtime stays open — do not merge.
- 2026-10-14: #428 M14 Drizzle-only slice merged at `66e4aef53290862f6f33a1a5fc8883bf145caa34`. Tests passed. Campus deploy in progress; no migration; Payload off. Not marked `deployed`.
- 2026-10-14: #428 M14 deployed on campus at `66e4aef53290862f6f33a1a5fc8883bf145caa34`. Dump `campus-20261014T150211Z`. Migrations applied 0 / skipped 32; ledger 32; no `0032` file. Smoke passed. Cron one-line command unchanged (not recreated). Rollback not used.
- 2026-10-14: #432 GL3 merged at `a47777a80985bc9205f8f5c4995d8e6a5b1ed370`. Migration `0032` on main. Individual plan config; `INDIVIDUAL_PLAN_ENABLED` default off. Campus deploy in progress — not marked `deployed`. Campus tip remains `66e4aef` until ship completes.
- 2026-10-14: M15 draft PR #431 at `c85360a73d18b6a78c47d5cd1b70309908c12795`. Retire plan: `living_brains` 1, `living_profiles` 0, homeschool orgs 0. Not merged; not on campus.

## Handoff

S0 #382, M5 #383, M6 #391, M7 #395, M8 #386, additive #394, G #381, M9 #397, migration runner #398, member rail #399, M10 #413, M12 #412, M11 #415, GL2 #417, PM3 #418, PM4 #423, and M14 #428 are merged and deployed on campus at `66e4aef53290862f6f33a1a5fc8883bf145caa34` on `2.24.70.248` until the GL3 ship completes.

`CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay false. `AUTH_URL` stays `https://portal.fieldschool.ai`. `NEXT_PUBLIC_MEMBER_RAIL_VARIANT=issue-368` on the prod build. Coaching health is ok. Do not print `GROK_API_KEY`.

GL3 (#375): merged #432, deploy in progress — not `deployed`; flag default off. M13 (#376): report #426 on main; do not merge runtime #424. M14 (#377): `deployed` #428 on campus; Payload off; sealed brief on #377 still open for follow-on. M15: draft #431, not merged; retire delete not on campus.

Next: finish GL3 campus deploy and smoke (then mark `deployed` in a later note); M15 draft #431 waits on soak gate. Do not deploy from this log. Do not flip `AUTH_URL`. Do not run live Stripe. Launch stays CLOSED 0/8.
