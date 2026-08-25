# Portal hostname cutover (plan only)

Do not apply this on the VPS. Do not add a `university.benjohnson.ai` 301.
Lyell says when to ship. This file is the ship brief for a later ticket.

Live ship tree: `cursor/admin-google-signin-b05f` on [bjljohnson2012/field-school](https://github.com/bjljohnson2012/field-school).
Public campus today: [https://university.benjohnson.ai](https://university.benjohnson.ai).
Intended app host: [https://portal.fieldschool.ai](https://portal.fieldschool.ai).

## What I verified (2026-08-25)

DNS (Hostinger zone read, no writes):

- `portal.fieldschool.ai` A `2.24.70.248` (TTL 300). Same VPS as university.
- `fieldschool.ai` apex A is `2.57.91.91`. That is the marketing site, not this Next app.
- Mail on `fieldschool.ai` is untouched: MX to Hostinger, SPF, DKIM CNAMEs, DMARC, autoconfig/autodiscover. Leave them alone.
- `university.benjohnson.ai` A `2.24.70.248`.

Public HTTP (no SSH):

- `https://university.benjohnson.ai/` → 200, `via: 1.1 Caddy`, Next.js.
- `https://university.benjohnson.ai/admin` → 307 `Location: /login?next=%2Fadmin`. Response body is that path only. No staff email, name, or session cookie.
- University TLS: Let's Encrypt, `CN=university.benjohnson.ai`, SAN is that name only. Expires 2026-11-18.
- `http://portal.fieldschool.ai/` → Caddy 308 to `https://portal.fieldschool.ai/`. The HTTP listener already sees the name.
- `https://portal.fieldschool.ai/` → TLS handshake fails (`tlsv1 alert internal error`). No site cert for that SNI yet.

Caddy is not in this repo. `DEPLOY.md` is the source: the VPS Caddy already sends `university.benjohnson.ai` to `field-school-app:3000` on Docker network `ae-coach_default`. Keep that container name.

## 1. Caddy

Add a **sibling** site block. Do not edit the university block. Do not `redir` university.

The university cert cannot cover portal. Its SAN is university only. Use the same Caddy ACME path that already issued university (Let's Encrypt, Caddy data store). That is a new cert for `portal.fieldschool.ai`, not a copy of the university file.

Inert example (not applied by `deploy/deploy.sh`): `deploy/caddy/portal.fieldschool.ai.caddy`.

Shape to add on the VPS Caddy that already serves university:

```
portal.fieldschool.ai {
	reverse_proxy field-school-app:3000
}
```

If that Caddy is a container on `ae-coach_default`, `field-school-app` resolves. If it is host Caddy, use whatever target the university block already uses (container name, `localhost:…`, or the compose published port). Copy the university `reverse_proxy` line. Change only the site address.

Caddy automatic HTTPS will mint the portal cert into the existing data volume (`/data` in the usual Caddy container, or the host Caddy data dir). No second TLS terminator. No certbot sidecar.

Reload Caddy after the edit. `deploy/deploy.sh` never writes Caddy. A normal campus deploy will not pick this up.

HTTP 308 on portal already happens because Caddy's HTTP listener upgrades unknown names to HTTPS. The missing piece is a TLS-enabled site block so ACME can finish.

## 2. Next host + OAuth (verified in code)

This app does not pin a public hostname.

| What people worry about | What the code actually does |
|---|---|
| Next allowed hosts | `next.config.ts` has none. No `allowedDevOrigins`, no `serverActions.allowedOrigins`. No `"use server"` actions. |
| Bind address | Compose `HOSTNAME: 0.0.0.0` is the listen address, not the public host. |
| Admin / login redirects | `src/proxy.ts` builds `/login?next=…` from `request.url`. The browser stays on whichever host Caddy sent. |
| Demo / share copy | `src/components/share-link.tsx` uses `window.location.origin`. A copy on portal is a portal URL. |
| Auth.js host | `src/lib/auth/config.ts` sets `trustHost: true`. Auth.js will trust `Host` / `X-Forwarded-Host` when `AUTH_URL` is unset. |
| OAuth button return | `src/components/oauth-sign-in-buttons.tsx` uses a relative `callbackUrl` (`/login/complete?next=…`). The **provider** redirect URI is still `{AUTH_URL}/api/auth/callback/{google\|twitter}`. |

`AUTH_URL` / `NEXTAUTH_URL` are not read in app source. Auth.js v5 reads them. If either is set, `createActionURL` uses that origin and ignores the request host. If both are unset, the request host wins.

`AUTH.md` already documents the provider URIs as `{AUTH_URL}/api/auth/callback/google` and `{AUTH_URL}/api/auth/callback/twitter`. The X provider id in code is `twitter`, not `x`.

### Env to change when Lyell ships portal OAuth

Durable file: `/opt/field-school.env` (outside the `/opt/field-school` wipe). Compose mounts it. Do not delete it.

| Variable | Action | Why |
|---|---|---|
| `AUTH_URL` | Set to `https://portal.fieldschool.ai` | Canonical Auth.js origin. Required if you want Google/X started on university to finish on portal, or if the live file already pins university. |
| `NEXTAUTH_URL` | Same value, or delete it | Legacy alias. If both exist and disagree, you will get the wrong callback. Prefer one. |
| `AUTH_TRUST_HOST` | Optional `true` | Redundant with `trustHost: true` in `src/lib/auth/config.ts`. Harmless. |

### Env to leave alone

| Variable | Why |
|---|---|
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Sessions and the derived demo token (`src/lib/demo-link.ts`). Changing it signs everyone out and rotates `/demo?token=` if `DEMO_LINK_TOKEN` is unset. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Same Google client. Add a redirect URI. Do not mint a second client unless Google forces it. |
| `AUTH_TWITTER_ID` / `AUTH_TWITTER_SECRET` or `X_CLIENT_ID` / `X_CLIENT_SECRET` (or `TWITTER_*`) | Same X app. `src/lib/auth/env.ts` accepts all three pairs. |
| `STAFF_ADMIN_EMAILS` | Allowlist, not a host. |
| `SMTP_*` / `ACCESS_REQUEST_NOTIFY_EMAIL` | Mail notify. Unrelated to the vhost. |
| `MEMBER_STORE_PATH` | Volume path `/app/data/campus-store.json`. |
| `DEMO_LINK_TOKEN` | Path-relative. Host comes from the browser. |
| `PORT` / `HOSTNAME` | Already `3000` / `0.0.0.0` in compose. |

I did not read `/opt/field-school.env` (no production SSH). Treat the current `AUTH_URL` as unknown until someone with the deploy key opens that file. Hypothesis: it is `https://university.benjohnson.ai` or unset. `AUTH.md` also shows a stale example `https://university.field.school`. Do not copy that.

### Dual-host OAuth (university still live)

Sessions are host-scoped. A cookie on university will not follow you to portal. That is fine. Do not set a cookie `Domain` that tries to span `benjohnson.ai` and `fieldschool.ai`.

Pick one OAuth origin for the ship, or register both and leave `AUTH_URL` unset:

1. **Safest overlap.** Add portal URIs in Google and X **before** flipping `AUTH_URL`. Keep the university URIs until the later 301 ticket. If `AUTH_URL` stays university, a Google click on portal still comes back to university. If you unset `AUTH_URL`, each host uses its own Host header and **both** console URIs must exist.
2. **Portal becomes the OAuth origin.** Set `AUTH_URL=https://portal.fieldschool.ai`. University HTML still serves. A Google click on university then returns to portal. Tell staff to finish login on portal.
3. **Do not** flip `AUTH_URL` to portal without the portal Caddy cert and the portal console URIs. The handshake will fail.

### Google Cloud console (same OAuth 2.0 client)

Add, do not replace, until the 301 ticket:

- Authorized JavaScript origin: `https://portal.fieldschool.ai`
- Authorized redirect URI: `https://portal.fieldschool.ai/api/auth/callback/google`

Keep:

- `https://university.benjohnson.ai`
- `https://university.benjohnson.ai/api/auth/callback/google`

Consent screen homepage / privacy / terms can stay on university for this ticket. Those pages stay public. A later copy pass can point them at portal.

### X developer portal (Twitter OAuth 2.0 app)

Add:

- Callback URI: `https://portal.fieldschool.ai/api/auth/callback/twitter`

Keep the university twitter callback. Website / terms / privacy fields, if X requires them, can stay university until the 301 ticket.

App code after the provider returns: `/login/complete` then `/admin` (staff) or `/dashboard` (member). Relative. No extra console URI.

## 3. What stays on university until the 301 ticket

- The Caddy site block for `university.benjohnson.ai`.
- The university Let's Encrypt cert.
- The Next container (`field-school-app`). Same process serves both names once portal has a vhost.
- `/opt/field-school.env` except the `AUTH_URL` flip when you choose it.
- Google and X university origins and callbacks.
- Hardcoded copy: `SITE_ORIGIN` in `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`, plus `AUTH.md` / `DEPLOY.md` / `README.md` production URLs. Changing those now and deploying would make live university pages claim they are portal. Leave them for a copy ticket.
- Mail DNS. Apex `fieldschool.ai` marketing host.
- Member volume `field-school-data`.

Do not add:

```
university.benjohnson.ai {
	redir https://portal.fieldschool.ai{uri} permanent
}
```

That is the later ticket.

## 4. How to tell the future ship worked

From a laptop, no staff session:

```bash
# Portal TLS + campus
curl -sSI https://portal.fieldschool.ai/
# expect: HTTP/2 200, via: 1.1 Caddy, valid cert SAN portal.fieldschool.ai

# Anonymous admin gate, no staff PII
curl -sSI https://portal.fieldschool.ai/admin
# expect: HTTP/2 307, Location: /login?next=%2Fadmin
curl -sS https://portal.fieldschool.ai/admin
# expect: /login?next=%2Fadmin only. No @gmail, no dean name, no Set-Cookie staff session.

# University still itself
curl -sSI https://university.benjohnson.ai/
# expect: HTTP/2 200. No Location: https://portal.fieldschool.ai/...
curl -sSI https://university.benjohnson.ai/admin
# expect: still 307 to /login?next=%2Fadmin
```

Optional after `AUTH_URL` flip: one Google and one X sign-in **on portal**, staff allowlist still lands on `/admin`, a non-staff account still cannot.

## Ship checklist (later ticket, not this PR)

- [ ] Confirm live Caddy university `reverse_proxy` target (same string for portal).
- [ ] Add `portal.fieldschool.ai` site block. No university `redir`.
- [ ] Reload Caddy. Wait for ACME. `openssl s_client -servername portal.fieldschool.ai` shows Let's Encrypt and SAN `portal.fieldschool.ai`.
- [ ] Google: add portal JS origin + `/api/auth/callback/google`. Keep university rows.
- [ ] X: add `/api/auth/callback/twitter`. Keep university row.
- [ ] Read `/opt/field-school.env`. Set `AUTH_URL=https://portal.fieldschool.ai` (and align or remove `NEXTAUTH_URL`). Do not rotate `AUTH_SECRET`.
- [ ] Recreate or restart `field-school-app` so it rereads env. Do not delete `/opt/field-school.env`. Do not wipe the data volume.
- [ ] Run the curl checks in section 4.
- [ ] Leave university serving. No 301.

## Out of scope here

Production SSH, Caddy reload, env edit, `deploy/deploy.sh`, Google/X console clicks, merge to a ship branch, university 301, mail DNS, TanStack `main`.
