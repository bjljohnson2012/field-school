# Field School

Public site: https://fieldschool.ai  
App: https://portal.fieldschool.ai  
Legacy campus (still live, 301 held): https://university.benjohnson.ai

Field School is a weekly Saturday hour. Directors come. So do people on the floor, founders building the first team, young men starting, and people switching in.

## Domains

- `fieldschool.ai` is the public multi-page site. Source in this repo: `marketing-site/` (the live VPS tree from `/workspace/field-school/site/`).
- `portal.fieldschool.ai` is the Next.js campus app. Same app as `university.benjohnson.ai` until the university 301 is lifted.
- `AUTH_URL` still points at university.benjohnson.ai. Do not flip it until the four portal Google/X OAuth callback rows exist. Do not 301 university until then.

## Public site

Pages: Home (Field School University), Newsletter, About, Pricing, Tools, 12 Presuppositions, Shop, Founder.  
Header: Join our Newsletter, Enroll.  
The newsletter, topic requests, and shop waitlist post to `https://portal.fieldschool.ai/api/forms` and show under Admin → Forms.  
Enroll goes to https://portal.fieldschool.ai/signup  
University: one course free, $10 up to three courses, $50 more than three, $1,059 certification.  
Coaching: $100 online / $200 in the room / $1,000 one-on-one. Invoice later.  
Privacy and terms stay at `/privacy` and `/terms`.

## App (Field School University)

Next.js campus: courses, assessments, dashboard, admin. Guest paths: `/c/grok-bot`, `/share/field-school`. Free beta on `/signup`. Staff admin is allowlist-only. See AUTH.md and DEPLOY.md.

## Run locally

```bash
npm install
npm run dev
```

App: http://127.0.0.1:43141

## Deploy

Ship via Cursor Cloud Agent to the Hostinger VPS (`2.24.70.248`). Apex static files go to the fieldschool.ai docroot. Next app is the portal. Do not merge to main as the live path. Do not use the shared Grok box for SSH.

## Stack

Public site: static HTML, IBM Plex + Fraunces.  
App: Next.js, TypeScript, Tailwind, shadcn/ui.
