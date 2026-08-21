# Field School University

The course portal for **Field School**.

Field School is the company. Field School University is where people walk courses, take assessments, and keep a portal. The cream-and-blue campus from [university.benjohnson.ai](https://university.benjohnson.ai) is the visual source; this repo continues that UI without the “Johnson” prefix.

## What you can do

- Walk the published **Grok Bot** ladder as a guest: clip, field work, quiz, exam
- Earn a **Field School University** certificate when every station and the exam clear
- Take live **skill** and **intelligence** assessments; results stay on the dashboard
- Leave reserved slots for a **tool checklist** and a **personality checklist**
- Share normal paths: `/c/grok-bot`, `/share/field-school`, `/share/hire-a-staff`, `/share/desk`
- **Admin** hub: student demo, users (edit + impersonate), feedback notifications, how to add tools

Progress is stored in this browser. Sign in on `/login` with Google as `bjljohnson2012@gmail.com` for the dean seat. Name the portal if you want certificates labeled.

## Run locally

```bash
npm install
npm run dev
```

App: [http://127.0.0.1:43141](http://127.0.0.1:43141)

## Deploy

Production: [https://university.benjohnson.ai](https://university.benjohnson.ai)

Deploy from this tree with `bash deploy/deploy.sh` (see [DEPLOY.md](DEPLOY.md)). Do not clone the older GitHub `field-school` repo into this workspace.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui. Course tape and stations come from Ray Fernando’s [Grok Bot walkthrough](https://www.youtube.com/watch?v=sAoTrUijP4g).
