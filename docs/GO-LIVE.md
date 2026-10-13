# Go live

Ben runs every step that changes a server, DNS, Stripe, or mail. Grok Build shipped the flip script, the smoke command, and this checklist. Nothing in this file is a live key.

Confirm `stripe-setup.mjs`, `CHECKOUT_ENABLED`, and the Stream 0 button switch when those pull requests exist. The names below are the ones this checklist uses until then.

## 1. AUTH_URL

**Grok Build.** `app/deploy/flip-auth-url.sh` accepts `--dry-run` and `--apply`. No argument is the same as `--dry-run`. Dry-run prints the plan and does not open SSH. Apply uses `VPS_SSH_KEY` when that file exists. Otherwise it uses `~/.ssh/vps_deploy`, then `~/.ssh/field-school-agent`, then `~/.ssh/id_ed25519_hostinger`. A second apply sets the same `AUTH_URL` and leaves the university 301 in place. The Caddy snippet is `app/deploy/caddy/university-301.caddy`. `app/AUTH.md` already names `https://portal.fieldschool.ai`.

**Ben.**

1. Read the production value. Do not change it in this step. On the server, `grep '^AUTH_URL=' /opt/field-school.env`.
2. Register the portal redirect URIs in Google and in X. Keep the old university rows until those consoles no longer show them.
   - Google: `https://portal.fieldschool.ai/api/auth/callback/google`
   - X: `https://portal.fieldschool.ai/api/auth/callback/twitter`
3. From `app/`, run `bash deploy/flip-auth-url.sh --dry-run`. The plan must say it will not wipe `/opt/field-school`.
4. Run `bash deploy/flip-auth-url.sh --apply`.
5. Sign in at `https://portal.fieldschool.ai` with Google, with X, and with email.

## 2. Stripe

**Grok Build.** Documentation only. The server already reads `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` from the environment. See `app/src/lib/billing/checkout-destination.ts` and `app/src/app/api/stripe/webhook/route.ts`. `stripe-setup.mjs` is not in this pull request. M8 adds it. Do not commit a key.

**Ben.**

1. Test-mode checkout and webhooks pass in M8 before any live step.
2. Run `node scripts/stripe-setup.mjs --live`. That script is Ben-only. It must refuse an `sk_live` key unless `--live` is present. Grok Build does not run it.
3. Stage the live values in the server env, not in git. The names are `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
4. Set `CHECKOUT_ENABLED`. Coaching buttons then open Stripe checkout. Consulting stays Email Ben.
5. Ben makes the live-key switch. The first live transaction is Ben's.

Portal `/pricing` follows `CHECKOUT_ENABLED`. The marketing Coaching buttons stay Email Ben until step 6.

## 3. Webhooks

**Ben.** Grok Build named the endpoint and the events the current handler understands.

- The endpoint is `https://portal.fieldschool.ai/api/stripe/webhook`.
- The signing secret is `STRIPE_WEBHOOK_SECRET`.
- The handler acts on `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Any other signed event returns received and changes nothing.
- M8's `stripe-setup.mjs` is expected to subscribe `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Confirm that list on the M8 pull request before saving the live endpoint.
- Resend one test-mode event from the Stripe dashboard, or from the Stripe CLI, before the live switch. Grok Build does not run that check.
- Old price ids stay in `app/src/lib/billing/plans.ts`. A checkout the parser cannot map is skipped. It does not create a product and it does not create a charge.

## 4. DNS, TLS, and mail

**Grok Build.** Read-only `dig` and `curl` on Oct 8, 2026. No record was changed.

| Name | Address |
| --- | --- |
| `fieldschool.ai` | `2.24.70.248` |
| `www.fieldschool.ai` | `2.24.70.248` |
| `portal.fieldschool.ai` | `2.24.70.248` |
| `university.benjohnson.ai` | `2.24.70.248` |

TLS is Let's Encrypt and was valid that day. Recheck before launch. The certificates expire in November 2026.

| Name | notAfter |
| --- | --- |
| `fieldschool.ai` | Nov 23, 2026 |
| `www.fieldschool.ai` | Nov 23, 2026 |
| `portal.fieldschool.ai` | Nov 23, 2026 |
| `university.benjohnson.ai` | Nov 18, 2026 |

Plain HTTP returns 308 to HTTPS on all four names.

These HTTPS pages returned 200: `https://fieldschool.ai/`, `/about`, `/privacy`, `/terms`, and `/pricing`. `https://www.fieldschool.ai/` returned 200. It is not a redirect to the apex.

`https://university.benjohnson.ai/` returned 301 to `https://portal.fieldschool.ai/`. `https://university.benjohnson.ai/c/grok-bot` returned 301 to `https://portal.fieldschool.ai/c/grok-bot`.

Mail DNS for `ben@fieldschool.ai`:

- MX 5 `mx1.hostinger.com`. MX 10 `mx2.hostinger.com`.
- SPF on `fieldschool.ai` is `v=spf1 include:_spf.mail.hostinger.com ~all`.
- DKIM is the TXT record at `resend._domainkey.fieldschool.ai`.
- DMARC is the TXT record at `_dmarc.fieldschool.ai`, `v=DMARC1; p=none`.

**Ben.** Open the same names in a browser, confirm the certificates, and confirm a message to `ben@fieldschool.ai` arrives. Grok Build did not send mail.

## 5. Data

**Ben.** Run these after the named pull requests merge. If a script name changes, use the name in that pull request.

1. `pg_dump` the production database and keep the dump off the server.
2. P1. Dry-run `app/scripts/test-rows.mjs`, compare the counts, then apply in one transaction. M5 ships that script.
3. M5 backfill. Dry-run `app/scripts/tenancy-backfill.mjs`, then apply.
4. M8 identity import. Dry-run `app/scripts/identity-import.mjs`, then apply. The real export stays off the repo.
5. Take a fresh `pg_dump` after those steps.

## 6. Marketing buttons

**Ben.** Do this with the deploy. Stream 0 ships one switch. The default is Email Ben. Flip it so Coaching buttons link to `https://portal.fieldschool.ai/pricing`. Consulting stays Email Ben. Confirm the switch name when the Stream 0 pull request exists. Portal `/pricing` then follows `CHECKOUT_ENABLED` from step 2.

## 7. Smoke tests

**Grok Build.** `app/scripts/smoke-live.mjs` checks one origin. Against `https://portal.fieldschool.ai` it also checks the apex pages, `www`, the HTTP 308, and the university 301. Against a loopback origin it checks that origin, including the pages the app serves, and it checks university only when `--university` is set.

The command uses GET. The Google and X lines POST `/api/auth/signin/google` and `/api/auth/signin/twitter`, read the redirect, and do not follow it. That POST does not create a member and it does not call Stripe. Signup is not submitted.

**Ben.** After each deploy, from `app/`:

```bash
node scripts/smoke-live.mjs --origin https://portal.fieldschool.ai
```

Every line says ok. A fail line is the stop.

## 8. Rollback

**Ben.** Apply copies the files before it edits them.

- Env backup: `/opt/field-school.env.bak.auth-<stamp>`
- Caddy backup: `/opt/ae-coach/docker/Caddyfile.bak.auth-<stamp>`

To go back:

1. Copy the env backup onto `/opt/field-school.env` and run `chmod 600` on that file.
2. Copy the Caddy backup onto `/opt/ae-coach/docker/Caddyfile`.
3. Reload Caddy with `docker exec ae-coach-caddy-1 caddy reload --config /etc/caddy/Caddyfile`.
4. From `/opt/field-school/deploy`, recreate the app with `docker compose --env-file /opt/field-school.env up -d --no-build --no-deps --force-recreate app`.
5. Sign in again and run the smoke command.

Do not use `deploy/deploy.sh` as the rollback. That path wipes `/opt/field-school`.

## Who owns each step

| Step | Owner |
| --- | --- |
| Flip script, Caddy snippet, smoke command, this file | Grok Build, done in the pull request |
| Read production `AUTH_URL`, register redirect URIs, dry-run, apply, sign in | Ben |
| Test-mode Stripe, `stripe-setup.mjs --live`, live env, `CHECKOUT_ENABLED`, first live transaction | Ben |
| Webhook endpoint, secret, events, test-mode resend | Ben |
| DNS, TLS, and mailbox recheck | Ben. The Oct 8 read-only record is Grok Build |
| `pg_dump`, P1, M5 backfill, M8 identity import | Ben |
| Marketing Coaching button switch | Ben |
| `smoke-live.mjs` after each deploy | Ben |
| Restore the env backup and the Caddy backup | Ben |
