# Field School

Public site: https://fieldschool.ai  
App: https://portal.fieldschool.ai  
Legacy campus (still live, 301 held): https://university.benjohnson.ai

Field School is a weekly Saturday hour. Directors come. So do people on the floor, founders building the first team, young men starting, and people switching in.

## Domains

Site and portal belong on the Field School VPS `2.24.70.248`. Cap, edit, and HLS belong there too. `2.24.64.248` is CNC vault, a different product. Do not put Field School video on it. Full map and the take-to-HLS walk: [VIDEO.md](VIDEO.md).

- `fieldschool.ai` is the public multi-page site. Source in this repo: `marketing-site/` (the live VPS tree from `/workspace/field-school/site/`).
- `portal.fieldschool.ai` is the Next.js training portal. Same app as the legacy host `university.benjohnson.ai` until that 301 is lifted.
- `AUTH_URL` still points at that legacy host. Do not flip it until the four portal Google/X OAuth callback rows exist. Do not 301 that host until then.
- `cap.fieldschool.ai`, `edit.fieldschool.ai`, and `s3.cap.fieldschool.ai` should resolve to `2.24.70.248`. Today they still resolve to CNC vault `2.24.64.248`. That is wrong. Move the work, then move the DNS.

## Public site

Pages: Home (organization umbrella), Portal, Newsletter, Community, Coaching, About, Pricing, Tools, 12 Presuppositions, Shop, Founder.  
Header: Join our Newsletter, Enroll.  
The newsletter, topic requests, and shop waitlist post to `https://portal.fieldschool.ai/api/forms` and show under Admin → Forms.  
Enroll (free) goes to https://portal.fieldschool.ai/signup  
Paid seats go to https://portal.fieldschool.ai/checkout?plan=… and open Stripe.  
Training portal: one course free, $10 up to three courses, $50 more than three, $1,059 certification.  
Coaching: $100 online / $200 in the room / $1,000 one-on-one.  
Privacy and terms stay at `/privacy` and `/terms`.

## App (Field School training portal)

Next.js campus: courses, assessments, dashboard, admin. Guest paths: `/c/grok-bot`, `/share/field-school`. Free beta on `/signup`. Staff admin is allowlist-only. See AUTH.md and DEPLOY.md.

## Run locally

```bash
npm install
npm run dev
```

App: http://127.0.0.1:43141

## Deploy

Ship via Cursor Cloud Agent to the Hostinger Field School VPS (`2.24.70.248`). Apex static files go to the fieldschool.ai docroot. Next app is the portal. Video production (Cap, adapter, edit, HLS) also belongs on that box. Do not deploy any of this to CNC vault `2.24.64.248`. Do not merge to main as the live path. Do not use the shared Grok box for SSH.

## Stack

Public site: static HTML, IBM Plex + Fraunces.  
App: Next.js, TypeScript, Tailwind, shadcn/ui.
