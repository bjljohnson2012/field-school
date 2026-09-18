---
name: lyell-holding-site
description: Own the LyellX holding-company site in lyell-site/ for lyellx.com. Use for that static site, its Hostinger addon, or Squarespace DNS A records.
---
# Lyell holding site

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

Verify with `python3 -m http.server 4173 --directory lyell-site`.
