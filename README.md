# Johnson Field School University

Multi-course campus at [university.benjohnson.ai](https://university.benjohnson.ai).

Each course is the same ladder: source tape, stations with timestamped clips, field work, quiz, exam, share desk.

The first published course is **Field School — Grok Bot vs OpenClaw and Hermes**, from [Ray Fernando’s walkthrough](https://www.youtube.com/watch?v=sAoTrUijP4g).

## For students

Anyone can open the catalog and walk a course. Sign up with email + password if you want progress, the desk, and a certificate saved.

## For the dean

Sign in as `bjljohnson2012@gmail.com`. Open **Office** → **New course from a tape**. Paste a YouTube URL and transcript/notes. Review stations, then publish.

## Run locally (Cursor)

```bash
git clone https://github.com/bjljohnson2012/field-school.git
cd field-school
npm install
npm run dev
```

App: http://localhost:8080

Optional env (VPS already has these):

```
DATABASE_URL=postgres://…
BETTER_AUTH_URL=https://university.benjohnson.ai
BETTER_AUTH_SECRET=…
DEAN_EMAILS=bjljohnson2012@gmail.com
XAI_API_KEY=…   # needed to generate a course from a tape
```

Without `DATABASE_URL` the app uses embedded PGLite (fine for local work).

## Deploy

See `deploy/`. Production host is the Hostinger VPS behind Caddy at `university.benjohnson.ai`.
