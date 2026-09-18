---
name: stripe-paid-seats
description: Grant Field School paid seats after Stripe checkout and mail the matching seat. Use for Checkout, webhooks, seat fulfillment, pricing, or Resend seat mail.
---
# Stripe paid seats

Load Stripe skills: `stripe-best-practices`, `stripe-docs`. For mail, load `resend` and `email-best-practices`.

## Own

- Checkout → webhook → seat on that email (`app/src/lib/billing/`)
- Plans and fulfillment stay org-aware; do not auto-join household or sales
- Mail as Field School `<note@fieldschool.ai>` via Resend
- Keep `/checkout` and `/checkout/success` working

## Do not

- Flip `AUTH_URL` or 301 university
- Deploy TanStack or touch CNC vault
- Change guest Grok Bot or Field Pattern scoring
- Log raw card data or put secrets in the repo

Verify webhook fulfill + login on the granted seat. Live deploys may already run from a non-main branch — do not merge to `main` unless asked.
