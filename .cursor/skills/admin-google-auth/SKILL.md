---
name: admin-google-auth
description: Wave 1 keep-alive for Auth.js Google staff login, dean allowlist, and /admin gate. Never flip AUTH_URL or 301 university.
---

# Admin Google auth

Wave: 1 keep-alive (patch only if proofs fail). No `AUTH_URL` flip through Wave 5.

Attach:

- `AGENTS.md`
- `app/AUTH.md`
- `docs/campus-runtime/WAVE1.md`
- `docs/campus-runtime/CURSOR_AGENT_PROMPT.md`

Absorbed branches (stop using separately):

- `cursor/login-force-dynamic-68c2`
- `cursor/emergency-admin-auth-4e0c`
- `cursor/admin-google-signin-b05f`

## Own

- Auth.js in `app/src/auth.ts` and `app/src/lib/auth/`
- Dean seed `bjljohnson2012@gmail.com`. Sign-out must stay signed out
- Continue with Google on `/login` and staff pages. `/admin` anonymous 307, no PII
- `trustHost: true`. App code must not pin a public hostname
- `/login` stays dynamic so Auth.js cookies survive deploy

## Do not

- Flip `AUTH_URL` (stays `https://university.benjohnson.ai`) or 301 university → portal
- Broaden staff beyond the allowlist / dean
- Touch Stripe seats, Pattern items, or CNC vault

Prove: sign in → sign out → sign in as dean; anonymous `/admin` 307.
