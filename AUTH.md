# Authentication (Field School University portal)

This campus uses [Auth.js / NextAuth v5](https://authjs.dev) for **staff** Google and X (Twitter) sign-in. Student and guest flows stay local (name label or guest walk) and **never** grant admin.

## Required environment variables

Set these in your host environment or `.env.local` (never commit secrets).

| Variable | Required for | Notes |
|----------|--------------|-------|
| `AUTH_SECRET` | Any OAuth | Random string; `openssl rand -base64 32`. Also accepts legacy `NEXTAUTH_SECRET`. |
| `AUTH_URL` | Production OAuth callbacks | Public site origin, e.g. `https://university.field.school`. Also accepts `NEXTAUTH_URL`. |
| `GOOGLE_CLIENT_ID` | Google staff sign-in | OAuth 2.0 client from Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Google staff sign-in | Paired secret for the Google client. |
| `AUTH_TWITTER_ID` or `X_CLIENT_ID` | X staff sign-in | X developer app OAuth 2.0 client ID. |
| `AUTH_TWITTER_SECRET` or `X_CLIENT_SECRET` | X staff sign-in | Paired client secret. |
| `STAFF_ADMIN_EMAILS` | Optional | Comma-separated allowlist. Defaults to the dean email baked into `src/lib/campus.ts`. |

## Inert without configuration

If `AUTH_SECRET` or provider credentials are missing:

- OAuth API routes respond but **no provider is registered**.
- Login shows an honest message; Google/X buttons are hidden or note missing vars.
- **No one is elevated to admin** via OAuth or localStorage shortcuts.
- `/admin*` remains hard-gated (middleware proxy redirects unsigned browsers to `/login`).

## Staff sign-in flow

1. User chooses **Continue with Google** or **Continue with X** on `/login` (only when configured).
2. Auth.js completes the OAuth dance and checks the email against `STAFF_ADMIN_EMAILS` / dean allowlist.
3. `/login/complete` reads the server session and syncs the portal dean seat in localStorage (UI only).
4. The admin proxy allows `/admin*` only when a valid Auth.js staff session exists (when OAuth is configured).

Local **Keep a dashboard** and **Continue as guest** paths are unchanged and cannot attach the dean seat.

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
```

Run `npm run dev` and open `/login`. Without real client IDs, staff buttons stay disabled with an explanatory note.

## What we deliberately removed

There is **no** fake “Continue with Google” button that writes the dean seat to `localStorage` without a server OAuth session. Admin access requires configured OAuth plus an allowlisted email.
