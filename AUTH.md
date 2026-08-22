# Authentication (Field School University portal)

This campus uses [Auth.js / NextAuth v5](https://authjs.dev) for Google, X (Twitter), and optional email + password. **Staff admin is invite-only.** Everyone else who signs in is a **free beta member**.

## Roles

| Who | How they get in | What they get |
|-----|-----------------|---------------|
| Staff / admin | Google or X, and the email must be on `STAFF_ADMIN_EMAILS` (dean email by default) | `/admin*` |
| Student / member | Google, X, or email + password (any email) | Dashboard and campus. Forever-free beta. No paywall. |
| Guest / Jordan demo | Local browser paths on `/login` and `/signup` | Walk the catalog. Never admin. |

Random Google or X users are **never** auto-elevated to admin. A staff email used with email + password is still a member. Credentials cannot open `/admin`.

If someone expected staff access and is not on the allowlist, they see **Request Access** (not a dead error). Submitting it stores the request for `/admin/access-requests` and emails the dean when SMTP is configured.

## Required environment variables

Set these in your host environment or `.env.local` (never commit secrets).

| Variable | Required for | Notes |
|----------|--------------|-------|
| `AUTH_SECRET` | Any Auth.js session | Random string; `openssl rand -base64 32`. Also accepts legacy `NEXTAUTH_SECRET`. |
| `AUTH_URL` | Production OAuth callbacks | Public site origin, e.g. `https://university.field.school`. Also accepts `NEXTAUTH_URL`. |
| `GOOGLE_CLIENT_ID` | Google sign-in | OAuth 2.0 client from Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Google sign-in | Paired secret for the Google client. |
| `AUTH_TWITTER_ID` or `X_CLIENT_ID` | X sign-in | X developer app OAuth 2.0 client ID. |
| `AUTH_TWITTER_SECRET` or `X_CLIENT_SECRET` | X sign-in | Paired client secret. |
| `STAFF_ADMIN_EMAILS` | Optional | Comma-separated staff allowlist. Defaults to the dean email baked into `src/lib/campus.ts`. |
| `MEMBER_STORE_PATH` | Optional | JSON file for member password hashes and access requests. Defaults to `.data/campus-store.json` in development and `/app/data/campus-store.json` in production. |
| `ACCESS_REQUEST_NOTIFY_EMAIL` | Optional | Where staff-access requests are emailed. Defaults to `bjljohnson2012@gmail.com`. |
| `SMTP_HOST` | Optional email notify | If unset, requests are still stored; email is skipped. |
| `SMTP_PORT` | Optional | Defaults to `587`. |
| `SMTP_SECURE` | Optional | Set `true` for implicit TLS. |
| `SMTP_USER` / `SMTP_PASS` | Optional | SMTP auth. |
| `SMTP_FROM` | Optional | Defaults to the notify address. |

`/login` and `/signup` are `force-dynamic` so production reads host OAuth env on each request (static prerender would hide Google/X).

## Member store (survives deploy wipe)

`deploy/docker-compose.yml` does **not** include a `field-school-db` Postgres service. Members and access requests persist in a JSON file on a Docker named volume:

- Compose volume: `field-school-data` mounted at `/app/data`
- File: `/app/data/campus-store.json` (`MEMBER_STORE_PATH`)
- Local dev: `.data/campus-store.json` (gitignored)

The `/opt/field-school` source wipe in `deploy/deploy.sh` does **not** remove Docker named volumes. Password hashes use bcryptjs. Passwords never go in `localStorage`.

## Inert without configuration

If `AUTH_SECRET` is missing:

- Auth.js stays inactive. Email/password and OAuth do not mint sessions.
- Login and signup still offer guest / Jordan / local name labels.
- **No one is elevated to admin** via OAuth or localStorage shortcuts.
- `/admin*` remains hard-gated (middleware proxy redirects unsigned browsers to `/login`).

If OAuth credentials are missing but `AUTH_SECRET` is set, email + password still works.

## Sign-in flow

1. **Members** choose Google, X, or email + password on `/signup` (primary) or `/login`.
2. Auth.js mints a session. Role is `admin` only when the provider is Google or X **and** the email is allowlisted. Otherwise the role is `member`.
3. `/login/complete` syncs the browser portal. Staff land on `/admin`. Members land on `/dashboard`.
4. A member who aimed at `/admin` is sent to `/request-access`.
5. The admin proxy allows `/admin*` only when a valid Auth.js **staff** session exists (when OAuth is configured). Members are redirected to Request Access.

Local **Keep a dashboard** and **Continue as guest** paths are unchanged and cannot attach the dean seat.

Failed OAuth or Auth.js errors use `pages.error` → `/signup?error=…` (never a bare Auth.js error page).

## Google Cloud consent screen

Public policy URLs (must stay reachable without a login):

- Privacy Policy: `https://university.benjohnson.ai/privacy`
- Terms of Service: `https://university.benjohnson.ai/terms`

## Callback URLs

Register these redirect URIs with each provider (replace origin with yours):

- Google: `{AUTH_URL}/api/auth/callback/google`
- X: `{AUTH_URL}/api/auth/callback/twitter`

## Local development

```bash
# .env.local (example — use your own values)
AUTH_SECRET=dev-only-change-me
AUTH_URL=http://localhost:43141
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_TWITTER_ID=
AUTH_TWITTER_SECRET=
MEMBER_STORE_PATH=.data/campus-store.json
ACCESS_REQUEST_NOTIFY_EMAIL=bjljohnson2012@gmail.com
# SMTP_HOST=
```

Run `npm run dev` and open `/signup`. Without real client IDs, Google/X stay disabled with an explanatory note. Email + password works when `AUTH_SECRET` is set.

## Pricing

`/pricing` is display-only. No Stripe and no card form. Invoice-based paid plans later:

- Cohort meetings online: $100/month
- Cohort meetings in person: $200/month
- One-on-one AI + business coaching: $1,000/month

## What we deliberately removed

There is **no** fake “Continue with Google” button that writes the dean seat to `localStorage` without a server OAuth session. Admin access requires configured OAuth plus an allowlisted email on Google or X.
