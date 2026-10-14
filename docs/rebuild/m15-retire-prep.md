# M15 retire and clean prep

This file is the spec and the test plan for [issue 378](https://github.com/bjljohnson2012/field-school/issues/378). The sealed packet in this section wins over earlier sentences further down.

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. No live Stripe. This prep does not deploy, does not run a migration, does not flip `AUTH_URL`, and does not retire org kind `homeschool` in the tree. The implementation stream on `feat/portal-m15-retire` does that work after the gate below.

Parent rebuild: [issue 363](https://github.com/bjljohnson2012/field-school/issues/363). Master run order: [Notion rebuild run order](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d) (Oct 8, 2026). Dispatcher YAML in `docs/rebuild-progress.md` wins on stream status when it disagrees with this sentence.

## Sealed packet

| Item | Rule | Evidence |
| --- | --- | --- |
| Branch | `feat/portal-m15-retire` | Issue 378 body; `docs/rebuild-progress.md` stream M15 |
| Depends on | M9, M10, M11 accepted on main and deployed | Issue 378; Notion stream table "M9 to M11 soak" |
| Base | Tip of `feat/portal-m11-brains` after M11 merges | `docs/rebuild-progress.md` M15 row |
| Ben merge gate | Merge and deploy M15 only after M9 through M11 are deployed and Ben posts "Soak done" on issue 378 | Issue 378; `docs/rebuild-progress.md` line 40 |
| Build timing | Open the implementation draft PR when M9, M10, and M11 are `draft_pr` or merged per dispatcher | `docs/rebuild-progress.md` line 40 |
| AUTH_URL | Flip stays in stream G ([issue 379](https://github.com/bjljohnson2012/field-school/issues/379)). M15 fixes deploy and auth **doc text** only | Issue 378 CDM P2 |
| `gym` to `platform` | Idempotent SQL on `organizations.kind` for the operator org, plus reader updates | Issue 378 CDM P3 |
| Brain table drops | One fresh `pg_dump` immediately before the deploy that runs M15, then stop all reads and writes to `living_brains` and the superseded brain item tables, then `DROP TABLE IF EXISTS` in the same idempotent migration | Issue 378 CDM P4 (4:35 PM ET Oct 8 changelog) |
| No staging rename | No `_retired_` rename, no 30-day wait, no M15b | Issue 378 changelog Oct 8 4:45 PM ET |
| Homeschool org kind | Retiring kind `homeschool` belongs to M15 (CDM). Product mode is `homeschool_mode` on family orgs ([Q15](https://app.notion.com/p/3f3fe86f6dee81e8ba63faca5c9c126c)). UI never treats homeschool as a product, nav item, or org kind | M9 prep: "Retiring org kind `homeschool` is M15"; Notion Q15; issue 378 scope |
| Superseded PRs | List PRs 333 and 335 through 340 for Ben to close. The build does not close them | Issue 378 |
| pstack | One deletion per commit. Idempotent SQL in `app/db/`, applied lazily like `app/src/lib/gap-loop/sql.ts` | Issue 378 body |

**Notion vs GitHub:** The Notion M15 table still says "Each drop has a backup table for one release." Issue 378 P4 and the 4:45 PM ET changelog forbid rename staging and waiting. **Issue 378 and CDM notes win.**

## Gate and dependency state (Oct 14, 2026)

Read `docs/rebuild-progress.md` on `chore/rebuild-progress` before arming the implementation PR.

| Stream | Issue | Dispatcher status (progress doc) | Notes for M15 |
| --- | --- | --- | --- |
| M9 | 368 | `not_started` in YAML on Oct 13 | PM assignment: M9 **deployed**. If production matches M9 shell prep, treat redirects and route stubs as live for soak. Reconcile YAML with Ben. |
| M10 | 369 | `not_started` | Not started. Not soaked. |
| M11 | 370 | `not_started` | Not started. Not soaked. |

Do not merge or deploy M15 until M9, M10, and M11 are deployed and soaked. M10 and M11 are not soaked as of this prep.

## Goal

Remove what the new portal model replaced: dead routes after redirects soak, superseded Postgres tables after backfill checks, fixture lessons, duplicate registries, stale deploy and auth docs, leftover Team practice naming, and org kind cleanups (`gym`, `homeschool`). Leave redirects that M9 defined. Leave stream G to port PR 31 and flip `AUTH_URL`.

## Implementation scope (feat/portal-m15-retire)

### 1. Routes and target sitemap

**Contract:** [M9 shell prep](m9-shell-prep.md) redirect table. M10 and M11 own merge targets for Library, lesson URLs, and `/library/brain`. M15 runs only after those streams ship and redirects have soaked.

**Actions:**

- **Retire** (drop `page.tsx` after redirect or export; keep redirect in middleware or `next.config`): `/o/[slug]/welcome`, `/demo`, `/about`, `/operator/hire` (M9 table).
- **Move / merge** sources: drop each superseded `page.tsx` only after the M9 test snapshot and production logs show the redirect or merge target stable. Examples: `/pattern` to `/profile/assessments`, `/account` to `/settings`, `/knowledge` to `/library/brain`, `/brain` to `/library/brain`, `/networks` to `/library/brain?view=graph`, `/coaching/*` pages to Team practice or Library targets, `/cart` and `/checkout` to `/pricing` (M8/M9), legacy `/o/[slug]/*` lesson paths to `/library/*` (M10).
- **Keep** every row marked Keep or Staff in the M9 table, plus routes M10 and M11 add under `/library`, `/teams/practice`, `/learn/goals`, and lesson slug URLs.

**Acceptance (issue 378):** `find app/src/app -name page.tsx | sort` matches a checked-in manifest on the implementation branch.

**Manifest rule:** At implementation time, base the manifest on:

1. Sorted list from the M9 redirect table (Keep rows plus new M10/M11 pages).
2. Minus every Retire row whose redirect has soaked.
3. Minus every Move/Merge source whose redirect has soaked.

Commit the manifest as `app/scripts/fixtures/m15-target-sitemap.txt` (or equivalent) and assert equality in `app/scripts/m15-retire.test.mjs`. Do not guess the final count in this prep. On `origin/main` at `4eaf464` the tree has **87** `page.tsx` files (M9 prep note).

**Already built, do not redo:** Redirect patterns for `/networks` and `/dashboard` (issue 378).

### 2. Postgres: operator kind, homeschool kind, brain tables

**Do not claim a migration number in this prep.** The implementation adds the next free file under `app/db/`.

| Change | Detail |
| --- | --- |
| `gym` to `platform` | Update `organizations.kind` for the Field School operator org from `gym` to `platform`. Idempotent `UPDATE` plus reader and test updates. Evidence today: `app/scripts/tenancy-migration.test.mjs` still seeds `kind: "gym"`. |
| Retire kind `homeschool` | After M5 tenancy is on main: every row with kind `homeschool` becomes `family` with `homeschool_mode = true`. Remove kind `homeschool` from enums, seeds, API docs, and normalization shims (`app/src/lib/tenancy/kind.ts`). **This prep PR does not run that migration.** |
| Drop `living_brains` | Table from `app/db/0013_living_brain.sql` and `app/src/lib/db/schema.ts`. |
| Drop superseded brain item storage | After M11 backfill checks: stop reads and writes, then drop tables replaced by the unified brain model. Candidates on main before M11: `growth_units`, `knowledge_brains`, `brain_sources`, `brain_notes`, `brain_artifacts` (`app/db/0010_knowledge_brains.sql`), and `living_brains` (`0013`). **The implementation PR must list the exact drop set in the migration header after M11 documents the backfill.** Do not drop until M11 proves parity. |
| `coaching_*` tables | Q14: UI rename in M9 to M11; code and DB cleanup in M15. Rename tables and code paths to Team practice naming unless the migration is risky; if risky, keep table names and document in the PR (issue 378 body). |

**Ben runs before deploy (issue 378 P4):** On the VPS, immediately before the deploy that applies the M15 migration, take one fresh `pg_dump` of the `campus` database. The implementation PR must copy the exact command from `app/DEPLOY.md` and campus runbooks. Do not commit connection strings. Do not run a data-deleting production script from this prep.

**Out of scope for M15 code:** Production test-record cleanup (L3 / Q12). Approved procedure ships in M5; Ben runs after one `pg_dump` (issue 378 comment Oct 9; issue 363).

### 3. Fixture lessons and registries

| Item | Detail |
| --- | --- |
| Fixture lessons | Remove seeded fixture lesson flows such as `home:welcome` from product paths once M12 onboarding replaces them. Evidence on main: `app/src/app/api/children/route.ts` still writes `objectId: "home:welcome"`. `app/scripts/wave2-tenants.test.mjs` asserts fixture lessons stay until removed. |
| Old registries | Retire duplicate collection registries after M6 merges into `app/src/lib/collections/`: `app/src/lib/evolution/collections.ts` and split `app/src/lib/records/model.ts` usage per M6 prep. Keep `app/src/lib/tools/registry.ts` for public `/tools`; do not delete assessment tools without M9 Keep rows for `/tools` and `/tools/[slug]`. |

### 4. Docs and deploy skill text

Fix stale lines that imply university is the live app or that Postgres is absent.

| File | Problem on main (`4eaf464`) | M15 fix |
| --- | --- | --- |
| `app/DEPLOY.md` | Says compose has no `field-school-db` Postgres; wipe-focused deploy | Align with campus Postgres service, GitHub as deploy source after Q16, and stream G for `AUTH_URL` flip |
| `app/AUTH.md` | Says `deploy/docker-compose.yml` does not include Postgres; JSON volume only | Describe Postgres members path after M8 |
| Deploy skill doc | Issue 378 names deploy skill text; AUTH_URL change stays in G | Text only |
| `app/README.md` | Legacy university URL and flip script | Portal-first wording |

Issue 378 names `app/deploy/DEPLOY.md`. The repo path is `app/DEPLOY.md`. Use the real path.

**Q16 (Ben / CTO):** Name GitHub or Origin as the deploy source of truth in `app/DEPLOY.md`. Product leans GitHub because merges land through PR 361 on GitHub. Status: decided in Notion Q16, confirmation still required in the implementation PR.

### 5. Team practice rename

Rename leftover `coaching` code paths to Team practice where they are not HTTP `/api/coaching` (M9: `/api/coaching` not in the redirect map). Table renames follow the risky-migration rule above.

### 6. Acceptance checklist (implementation PR)

- [ ] `find app/src/app -name page.tsx | sort` equals the committed manifest.
- [ ] No doc says university is the live portal or that campus has no Postgres service.
- [ ] `npm run typecheck` and `npm run build` in `app/` pass.
- [ ] `node --experimental-strip-types --test` includes `app/scripts/m15-retire.test.mjs` (redirect soak list, manifest, no `homeschool` org kind in seeds, `platform` operator kind).
- [ ] Migration SQL is idempotent and safe to apply twice on a test database.
- [ ] PR description lists superseded PRs 333, 335, 336, 337, 338, 339, 340 for Ben to close.
- [ ] Checkpoint comment on issue 378 with deploy SHA and "Soak done" reference only after Ben confirms soak.

## What this prep leaves untouched

`app/src`. `app/db`. `app/marketing-site`. `docs/rebuild-progress.md`. `docs/staff/state.json`. `AUTH_URL`. Go-live flags. Guest Grok Bot. Production data. Migration files. Deploy scripts execution.

## Test plan

### This spec PR (docs only)

A reviewer checks:

1. The diff adds only `docs/rebuild/m15-retire-prep.md`.
2. The doc cites issue 378, the M9 redirect contract, the M9 to M11 gate, and CDM P2 to P4.
3. The doc does not assign a migration number, flip flags, or instruct homeschool retirement in this branch.

### Implementation PR (`feat/portal-m15-retire`)

Run from `app/` after `npm ci`:

1. **Manifest:** `node --experimental-strip-types --test scripts/m15-retire.test.mjs` compares `find` output to `scripts/fixtures/m15-target-sitemap.txt` and fails on unexpected `page.tsx` paths.
2. **Redirects:** Reuse or extend `scripts/m9-shell.test.mjs` so every soaked Retire/Merge source still returns the M9 status code and target.
3. **Kinds:** Tests prove no seed or API surface exposes org kind `homeschool`; operator org kind is `platform`; `homeschool_mode` remains the family flag.
4. **Schema:** After migration apply on a test DB, `living_brains` and the listed drop tables are gone; idempotent re-apply exits 0.
5. **Docs:** A small script or test greps `app/DEPLOY.md`, `app/AUTH.md`, and `app/README.md` for forbidden phrases (`no field-school-db`, `university` as live primary, and similar per issue acceptance).
6. **Regression:** `npm run typecheck`, `npm run build`, and the existing tenancy and shell tests still pass.
7. **Flags:** `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` remain `false` in source.

### Out of scope for automated tests

Deploy, `AUTH_URL` flip, live Stripe, production `pg_dump`, production row deletion, and soak timing. Ben owns those on issue 378.

## Ben decisions (do not guess)

| # | Decision | Evidence | Needed before |
| --- | --- | --- | --- |
| 1 | Post "Soak done" on issue 378 after M9 to M11 deploy soak | Issue 378 depends_on; progress doc gate | Merge or deploy M15 |
| 2 | Confirm deploy source of truth (GitHub vs Origin) in `app/DEPLOY.md` | Notion Q16; issue 378 scope | M15 doc section in implementation PR |
| 3 | If `coaching_*` table renames are too risky, keep table names and document | Issue 378 body; Q14 | M15 migration |
| 4 | Exact brain table drop list after M11 backfill | Issue 378 P4; `0010` / `0013` on main | M15 migration header |
| 5 | Reconcile `docs/rebuild-progress.md` M9 status with deployed reality | YAML `not_started` vs PM note M9 deployed | Dispatcher and gate |

## References

- GitHub [issue 378](https://github.com/bjljohnson2012/field-school/issues/378)
- Notion [Portal build plan M15](https://app.notion.com/p/3f3fe86f6dee81e8ba63faca5c9c126c) and [run order](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d)
- `docs/rebuild-progress.md` stream M15 and `ben_merge_order`
- `docs/rebuild/m9-shell-prep.md` redirect table
- CDM stream G for AUTH_URL and PR 31 port ([issue 379](https://github.com/bjljohnson2012/field-school/issues/379))
