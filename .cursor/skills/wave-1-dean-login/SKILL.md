---
name: Wave 1 dean login
description: Wave 1 dean login — dean allowlist, no AUTH_URL flip
---

# Wave 1 dean login

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

- Auth.js dean allowlist. Seed `bjljohnson2012@gmail.com`
- Continue with Google on `/login`. `/admin` anonymous 307, no PII
- Sign-out must stay signed out. `/login` stays dynamic
- `trustHost: true`. App code must not pin a public hostname

## Do not

- Flip `AUTH_URL` (stays `https://university.benjohnson.ai`) or 301 university → portal
- Broaden staff beyond the allowlist / dean
- Touch Stripe seats, Pattern items, or CNC vault
