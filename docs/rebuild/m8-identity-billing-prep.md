# M8 identity and billing prep

This file is the spec and the test plan for [issue 367](https://github.com/bjljohnson2012/field-school/issues/367). The branch now implements that spec. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay false. Stripe setup does not call the network. Migration `0023` is not applied from this change.

M8 depends on M5 ([issue 364](https://github.com/bjljohnson2012/field-school/issues/364), draft PR 383, branch `feat/portal-m5-tenancy`) and S0 ([issue 362](https://github.com/bjljohnson2012/field-school/issues/362), draft PR 382, branch `feat/marketing-site-rebuild`). `docs/rebuild-progress.md` on `chore/rebuild-progress` marks both blocked as of 2026-10-13 2:20 PM ET. This branch is cut from `origin/main` at `34798e56529489424f7c1b067e166b10a8570578`. It does not merge those branches.

Launch stays CLOSED 0/8. Stripe stays in test mode. `AUTH_URL` stays `https://portal.fieldschool.ai`.

## Offers

Code keys are `diy`, `coaching` with tiers `assess`, `model`, and `build`, and `consulting`. Display names are Do It Yourself, Coaching, Assess, Model, Build, and Consulting. The phrase Learn with Ben is not a public name.

Prices are $300, $600, and $1,500 a month. Sessions per month are 1, 2, and 4. Those numbers live in `app/src/lib/billing/m8-prep.ts` until S0 merges. After S0 merges, the implementation moves the numbers into `app/src/lib/billing/offer-names.ts`. This prep does not add that file. S0 already adds it, and this branch must not edit it.

The Individual plan uses key `individual`. It stays unpublished. Nothing on a public page names it. The held price is $10 a month plus credits, read from config later, with no public price now.

Consulting has no public price. It is scoped work.

Do It Yourself starts at `/signup?plan=course`.

## Buttons

`CHECKOUT_ENABLED` is off unless the value is `1`, `true`, or `test`. Any other value, including `live` and an empty value, stays off. Only Ben turns the flag on. This prep does not set the flag in the environment.

While the flag is off, each Coaching tier button label is Email Ben and the link is `mailto:ben@fieldschool.ai?subject=Coaching`.

While the flag is test, the same button opens a Stripe Checkout session for that tier in test mode. The button label is no longer Email Ben.

Consulting always uses Email Ben and `mailto:ben@fieldschool.ai?subject=Consulting`. The flag does not change it.

## Stripe

One Coaching product. Three monthly prices. Lookup keys are `coaching_assess_monthly`, `coaching_model_monthly`, and `coaching_build_monthly`. Unit amounts are 30000, 60000, and 150000 cents.

`decideStripeKey` accepts `sk_test_` and `rk_test_` keys as test mode. It refuses `sk_live_` and `rk_live_` unless the caller passes `allowLive`. This module never calls Stripe and never reads a key from the environment. The implementation script `app/scripts/stripe-setup.mjs` is not in this prep. When it is written, it calls `decideStripeKey` and refuses a live key unless Ben passes `--live` himself.

Webhook effects:

- `customer.subscription.created` updates the seat.
- `customer.subscription.updated` updates the seat.
- `checkout.session.completed` updates the seat. `stripe-webhook.ts` already parses this type.
- `customer.subscription.deleted` clears the seat.
- `invoice.paid` records the payment.
- `invoice.payment_failed` records the failure.
- Any other type is ignored.

Existing Stripe price ids in `plans.ts` stay. `retiredPlanStillHasStripePrice` still resolves `10`, `50`, `1059`, `100`, `200`, and `1000`. Public cards do not show `$10`, `$50`, `$1,059`, `$100`, `$200`, or `$1,000`.

No live card charge. No real transaction. A 4242 checkout is a later test, after M5 and S0 are accepted, and only with a test key.

## Routes

`/pricing` stays. It is the Coaching pricing page.

`/cart` and `/checkout` redirect to `/pricing`, including a query string. `/checkout/success` stays.

New checkout starts from `/pricing`. This prep does not add the route handler.

## Coaching records

Record kinds are `recap`, `next_steps`, `model_update`, and `quarterly_review`.

A published recap is the record that shows in the brain. Published next steps show on Home. Drafts show on neither. A Model org has two session slots a month. Using zero of them leaves two. Using two leaves zero.

Writes of a recap into `brain_notes` (migration 0010) wait for the implementation. M11 later folds notes into nodes. This prep does not write SQL and does not insert notes.

## Identity

Today, `CampusStoreFile` in `app/src/lib/members/types.ts` holds `members`, `accessRequests`, `formSubmissions`, and `purchases`. Password hashes sit on `StoredMember.passwordHash` and in `member_credentials` (`app/db/0005_coaching.sql`). Auth.js providers are in `app/src/auth.ts`. The `jwt` callback reads the JSON store. This tree has no Auth.js database adapter.

The implementation moves members, password hashes, paid seats, and forms into Postgres and merges them with `members` and `member_credentials`. It dual-reads for one release, then reads Postgres only. The JSON export stays off the repo and off the box image. Sign-in for Google, X, and email must still work after the JSON file is renamed.

That move needs M5 org scope (`app/src/lib/tenancy` and migration `0022_tenancy.sql` on the M5 branch) and new SQL under `app/db`. This prep does not edit `app/db` and does not import tenancy. The server-side session table and revocation check from the 9 Oct 2026 comment on issue 367 are in the same gap. Active Sessions cannot revoke a JWT until that table exists.

## What this prep does not change

`AUTH_URL`. `offer-names.ts`. `app/db`. `app/src/lib/tenancy`. The marketing site. `docs/rebuild-progress.md`. The Stripe price ids in `plans.ts`. README line 24 and the offer line in `docs/LAW.md`. Those wording edits belong to the implementation of issue 367. They stay off this branch.

Stream G and M9 stay unstarted.

## Test plan

Run the cases below from `app/` after `npm ci`.

### Cases this branch runs

1. Run `node --experimental-strip-types --test scripts/m8-identity-billing-prep.test.mjs`. Pass when every assertion holds. The file checks the Model button with the flag off, the Model button in test mode, Consulting, Do It Yourself, the unpublished Individual key, public card text, retired price labels, live-key refusal, the three lookup keys, webhook effects, `/cart` and `/checkout` redirects, two Model slots, and a published recap versus a draft.
2. Run `npm run typecheck`. Pass when `tsc --noEmit` exits 0. If `main` already fails, pass only when no error names `m8-prep.ts`, and record the existing failures on the PR.
3. Confirm `app/src/lib/billing/m8-prep.ts` does not import `offer-names`, `lib/tenancy`, or `app/db`. The test file asserts that by reading the source.

### Cases deferred until M5 and S0 are accepted

Do not run these on this branch.

1. Rename `campus-store.json` and sign in with Google, X, and email.
2. Open `/pricing` and confirm the cards and the absence of the old prices. S0 owns that page copy.
3. With `CHECKOUT_ENABLED` off, follow Email Ben and confirm the mailto. With the flag on in test mode, complete a 4242 Checkout session and confirm the webhook updates the seat.
4. Confirm Consulting still reads Email Ben while the flag is on.
5. Publish a Model recap and confirm the brain note and the Home next steps.
6. Confirm credits and BYOK still work.
7. Run `stripe-setup.mjs` against Stripe test mode and confirm it is idempotent. Do not pass `--live`. Do not use a live key.
8. Apply migration SQL. Do not run a backfill or a test-row script against production.
9. Add the server-side session table and confirm revocation of an old JWT.
10. Replace README line 24 and the offer line in `docs/LAW.md` with the 9 Oct 2026 wording. Do that in the implementation PR, not here.

## Gaps left out of the prep module

These cannot compile on `main` without M5, S0, or a forbidden edit.

- `app/src/lib/billing/offer-names.ts` exists only on S0. Adding it here would edit a forbidden path and fork S0.
- `app/src/lib/tenancy` and `app/db/0022_tenancy.sql` exist only on M5. Seat updates need an org id from that module. `parseOrgId` only brands a non-empty string. It does not load an org.
- SQL for plans, sessions, and auth revocation would edit `app/db`. Left out.
- `app/scripts/stripe-setup.mjs` would call Stripe. Left out. The price spec and the key decision are pure functions instead.
- Portal page redirects and the pricing buttons would touch routes S0 is already editing. Left out. `pricingRedirect` and `coachingAction` are the pure rules.
- Dual-read of `campus-store.json` needs the Postgres write path. Left out.

## Files on this branch

`docs/rebuild/m8-identity-billing-prep.md` is this spec and test plan. `app/src/lib/billing/m8-prep.ts` is the pure module. `app/scripts/m8-identity-billing-prep.test.mjs` runs the cases this branch can run.
