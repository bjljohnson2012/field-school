---
name: lyell-holding-site
description: Fenced. LyellX holding-company site on cursor/lyell-holding-site-646c only. Does not block Wave 2.
---

# Lyell holding site

Wave: fenced. Does not block Wave 2.

Attach:

- `lyell-site/` (when present on this branch)
- `AGENTS.md`

Absorbed branches: none. Own branch is `cursor/lyell-holding-site-646c` only. Do not open a second Lyell branch.

## Own

- Static Material 3 site in `lyell-site/`
- Home states the work (consulting, training, speaking, RevOps, GTM). Companies lists Field School. Contact `ben@lyellx.com`
- Hostinger addon for `lyellx.com`. DNS: A `@` → `145.79.4.8`, CNAME `www` → `lyellx.com`
- Keep MX/TXT (Google mail) untouched

## Do not

- Point Lyell at university or flip Field School `AUTH_URL`
- Add an open-seat placeholder
- Edit campus `app/` tenants, Pattern, or portal Caddy
- Touch CNC vault or Cap
- Block Wave 2

Verify with `python3 -m http.server 4173 --directory lyell-site`.
