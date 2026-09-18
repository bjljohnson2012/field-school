---
name: admin-google-auth
description: Guard Field School admin Google sign-in, sign-out, and the dean seed. Use for Auth.js, /login, /admin gate, or staff allowlist — never to flip AUTH_URL.
---
# Admin Google auth

## Own

- Auth.js in `app/src/auth.ts` and `app/src/lib/auth/`
- Dean seed `bjljohnson2012@gmail.com`. Sign-out must stay signed out (no Maya bounce)
- Continue with Google on `/login` and staff pages. `/admin` anonymous 307, no PII
- `trustHost: true`. App code must not pin a public hostname

## Do not

- Flip `AUTH_URL` this run (stays `university.benjohnson.ai` until Ben says)
- 301 university → portal
- Broaden staff beyond the allowlist / dean
- Touch Stripe seats, Pattern items, or CNC vault

Prove: sign in → sign out → sign in as dean; anonymous `/admin` 307.
