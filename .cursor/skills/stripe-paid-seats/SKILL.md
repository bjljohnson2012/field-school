---
name: stripe-paid-seats
description: stripe-paid-seats — Stripe seats, not Wave 2
---

# Stripe paid seats

Wave: fenced. Stripe seats only. Does not block Wave 2.

Attach:

- `app/AUTH.md`
- Stripe skills: `stripe-best-practices`, `stripe-docs`
- Mail skills: `resend`, `email-best-practices`

Absorbed branches: none. Live work may already run from a non-main branch — do not merge to `main` unless asked.

## Own

- Checkout → webhook → seat on that email (`app/src/lib/billing/`)
- Plans and fulfillment stay org-aware; do not auto-join household or sales
- Mail as Field School `<note@fieldschool.ai>` via Resend
- Keep `/checkout` and `/checkout/success` working

## Do not

- Block or rewrite Wave 2 tenants / Field Pattern
- Flip `AUTH_URL` or 301 university
- Deploy TanStack or touch CNC vault
- Change guest Grok Bot or Pattern scoring
- Log raw card data or put secrets in the repo
- Invent a second Pattern bank or add `build-all-waves`
