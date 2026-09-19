# Status — 2026-09-19

Wave 1 is live. Wave 2 tenants + picker + Field Pattern is proven in [WAVE2.md](./WAVE2.md). Family v1 operator writes are LIVE on FamilyV1Home. Remotion Wave 5 plates + LessonSpine + checklist + `0012` are in `main` and `plate_renders` is on `field-school-campus-db`. Proof: [WAVE5.md](./WAVE5.md).

- Postgres `field-school-campus-db`, database `campus`. Do not write leftover `field-school-db`.
- Guest Grok Bot still works. `GET /api/me` guest `{ authenticated: false, guest: true }`. `POST /api/events` guest 401.
- AUTH_URL is `https://portal.fieldschool.ai`. `university.benjohnson.ai` 301s there. Do not flip AUTH_URL back.
- Factory (Cap / edit / melt) left running. Just `27pn9xs0zk8a73g` locked. `https://edit.fieldschool.ai/health` 200.

## Current

Read in this order:

1. This file
2. [WAVE5.md](./WAVE5.md)
3. [PLATE_RENDERS.md](./PLATE_RENDERS.md)
4. [../remotion-vox-standards.md](../remotion-vox-standards.md)

Gym wording is retired. Student orgs: household and sales.

## Done

- Wave 1 identity + Grok Bot station 01 events.
- Wave 2 household + sales, `/o/:slug`, picker, invites, fp-50-v1, org-scoped skills. [WAVE2.md](./WAVE2.md).
- Family v1 operator writes on FamilyV1Home (save intent version, accept path, lock next portion). Child ≠ User. No child login. Do not steal `bc-4765f2f0`.
- Wave 5 Remotion plates in `plates/` (not campus Next): Opener, RecapCard, DefinitionBoard, QuizBumper, TalkingHeadCard, LessonSpine. Order lock: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.
- LessonSpine encode + Cleaning checklist (exit 0 PASS, `hold_cleaning: true`, `--flip` refused). No live Cleaning / Publish flip.
- `app/db/0012_plate_renders.sql` applied on `field-school-campus-db` / `campus` (0012 only; 0001–0011 untouched). Table `plate_renders` exists.
- Plates API campus pack (routes only) overlay on `/opt/field-school`. No `deploy.sh` wipe. Family operator-writes chrome hashes unchanged. Live guest unsigned `GET`/`POST /api/plates` is **401** `sign_in_required` (was 404). `GET /api/me` `{guest:true}`. `POST /api/events` 401. Pack: `/opt/field-school-packs/plates-api-campus-pack-20260919T202200Z.tar.gz` sha256 `75ab10d322ae872cfb9aea0989bf2ff243a9b65178f17aa474cca7080a4ecfcb`.

## Held (not this readout)

- Cap take / Just remake / second melt
- Live Cleaning auto-flip and Publish/Distribute (future CDM seal when ship 1 and ship 6 can go green)
- Remotion packaged into Next player / player rail UI
- AUTH_URL flip, Stripe / metering prices
- Wave 3 four-model cutover (composer SQL + routes on tip; live guest `/api/composer` is 401; ship farm not run; no campus package this readout)
- CNC vault `2.24.64.248`

## Not a launch gate

Do not invent LAUNCH_GATE 8/8 from this refresh.
