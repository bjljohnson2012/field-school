# Wave 2 proof — tenants, picker, Field Pattern

2026-09-18. Deployed `cursor/wave-2-tenants-ca6e` `ea09fd1` to VPS `2.24.70.248` with `app/deploy/deploy.sh` only. Wave 1 guest Grok Bot still works. AUTH_URL is still `https://university.benjohnson.ai`. No university 301. No vault `2.24.64.248`. No TanStack. No composer. No Remotion. Leftover `field-school-db` was not written.

Packaging note: first `deploy.sh` image 500'd on `/o/*` and signed-in `/api/me` with `pinned_bank_missing:docs/campus-runtime/fp-50-v1.md`. `deploy.sh` now stages that pinned bank into the Next context; Dockerfile copies `/app/docs` + `/app/db` into the runner. Redeployed. Proofs below are from the second ship.

Command log: `/opt/cursor/artifacts/wave2_deploy_proof.json`. Narrative: `/opt/cursor/artifacts/wave2-deploy-proof.md`.

## What shipped

- Orgs `household` (homeschool, strict) and `sales` (company, platform_plus). Operator org `field-school` stays.
- Staff email is joined to field-school (admin), household (guardian), and sales (trainer) so one login flips with the picker.
- Non-staff with no memberships still get field-school learner. Household/sales members are not force-joined to field-school.
- `GET /api/me` returns all memberships plus `activeOrg`.
- Org picker chrome and `/o/:slug`. Unknown slug 404. Signed-in uninvited `/o/:slug` 403. Guest `/o/household` 401, no roster.
- Invites at `/invite/:token`. Household stances: guardian, learner. Sales stances: trainer, learner. Child cannot invite or `/admin`.
- Child + ward on household only. Trainer on sales.
- Fixture lessons `home:welcome` and `sales:welcome`. Household catalog does not inherit Grok Bot.
- Field Pattern `fp-50-v1` from `fp-50-v1.md`: 50 Likert items, child subset from the table (26 `y` flags), eight Bearing dimensions, correspondence distributions, import override, `member_profiles` + append-only revisions, template narrative.
- Org-scoped skills: 3 parent-editable household skills, 3 seeded sales skills.
- SQL `0002`-`0004` applied by deploy.

## Manual cheat sheet A–L

Credentials fixture this ship (university host, AUTH_URL unchanged): gym `wave2.gym.20260918185627@example.com` (field-school learner only), parent granted household guardian in SQL then minted invite, home accepted as household guardian.

| # | Browser | Action | Expect | Result |
|---|---|---|---|---|
| A | Guest | `/c/grok-bot` | works, no Postgres write | **pass**. `GET https://portal.fieldschool.ai/c/grok-bot` 200. `learning_events` count 9 → 9. |
| B | Gym | `/api/me` | field-school only at first | **pass**. After credentials login: `activeOrg.slug=field-school`, memberships `[field-school:learner]` only. |
| C | Gym/parent | invite Home to household | pending invite | **pass**. `POST /api/invites` `{org:household,email:home,stance:guardian}` 200 `status` pending, token minted. (Gym-only learner cannot mint; parent SQL-granted household guardian minted.) |
| D | Home | accept invite | two orgs on `/api/me` | **pass**. `POST /api/invites/accept` 200 `{ok:true,org:household}`. `/api/me` lists `field-school:learner` + `household:guardian`. |
| E | Gym | watch briefing | household progress empty | **pass**. `POST /api/events` watch `grok-bot:briefing` 200 `org=field-school`. Household `grok-bot%` event count 0. |
| F | Home | `/o/household` watch welcome | gym progress unchanged | **pass**. `POST /api/events` `x-fs-org: household` watch `home:welcome` 200. Gym `field-school` `home:%` count 0. Household watch of `grok-bot` 403 `cross_org`. |
| G | Gym | `/o/household` | 403 unless that account was invited | **pass**. Gym (not invited) `GET /o/household` 403. |
| H | Home | create child | listed, no admin | **pass**. `POST /api/children` 200 `Wave2 Deploy Child`. SQL `kind=child` household learner `child.d872b0fa7bee@household.local`. Home `/admin` 307 `/request-access?from=admin`. |
| I | Guest | `/o/household` | no roster, no events | **pass**. Guest `GET /o/household` 401. Guest `POST /api/events` 401 `sign_in_required`. |
| J | any | `/admin` logged out | 307 | **pass**. Guest `GET /admin` 307 `Location: /login?next=%2Fadmin`. |
| K | any | `cap.fieldschool.ai/login` | 200 | **pass**. `GET https://cap.fieldschool.ai/login` 200. |
| L | any | `edit.fieldschool.ai/health` | ok | **pass**. `GET https://edit.fieldschool.ai/health` 200 `{"ok": true, "service": "fieldschool-edit"}`. |

## Live commands (this ship)

```text
AUTH_URL                   https://university.benjohnson.ai   (unchanged)
guest GET /api/me          200 {"authenticated":false,"guest":true}
guest /c/grok-bot          200; events 9→9
guest /o/household         401
guest /o/does-not-exist    404
guest /admin               307 /login?next=%2Fadmin
guest POST /api/events     401 sign_in_required
cap /login                 200
edit /health               200 {"ok": true, "service": "fieldschool-edit"}
pattern instrument         200 slug=fp-50-v1 count=50 child=26
orgs                       field-school gym public_catalog;
                           household homeschool strict {"cap": false};
                           sales company platform_plus {"cap": false}
skills                     household morning/chores/read;
                           sales discovery/qualification/next-step
gym /api/me                field-school learner only
gym /o/household           403
gym watch briefing         200 org=field-school
invite Home                200 pending household guardian
home accept                200 org=household; two memberships
home watch welcome         200 org=household
home watch grok-bot        403 cross_org
SQL events                 field-school gym grok-bot:briefing;
                           household home home:welcome
home create child          200 household learner child
```

## Reprobe 2026-09-18 19:59Z (live VPS, no redeploy)

Guest still matches A, I, J, K, L. Pattern instrument still `fp-50-v1` 50 / child 26. AUTH_URL still `https://university.benjohnson.ai` (credentials callback lands there).

Signed-in picker email still lists `household:guardian` + `sales:trainer` only (not forced onto field-school). `POST /api/org/active` flips household ↔ sales. `/o/household` 200, `/o/sales` 200, `/o/field-school` 403. Household watch `home:welcome` 200; household watch `grok-bot` or `sales:welcome` 403 `cross_org`. Skills: household `morning/chores/read`, sales `discovery/qualification/next-step`. Pattern profile still reads Bearing `drive`. Invites mint household learner and sales trainer 200.

Child kind account: `child_cannot_invite` 403, `/admin` 307 `/request-access?from=admin`, `/o/household` 403, `/o/sales` 403.

Logs: `/opt/cursor/artifacts/wave2_live_reprobe.log`, `/opt/cursor/artifacts/wave2_signedin_reprobe.json`.

## Chrome (local, not redeployed)

Chrome + parent lock live on `cursor/wave-2-tenants-ca6e` after `880278c`. Not shipped with `deploy.sh` after the A–L VPS proofs. Do not treat the A–L table as chrome proof.

Local Next on this worker:

- Guest `/` 200: Continue as guest, Join free beta, About. No Inbox. No Instant demo.
- Logged-in `/` 307 `/dashboard`.
- Guest `/c/grok-bot` 200. Feedback copy is Admin → Inbox.
- Household children list says Child, not Student. Parent notes + Pattern lock on `/o/household`.
- Admin Start here / Courses vs Assessments / Field Pattern under Assessments.
- Org switcher View all → `/people`.

`npm test` 46 pass. Live VPS still serves pre-chrome copy (`Admin → Notifications`, logged-in `/` is 200 marketing home, `/people` 404, GET `/api/children` 405). Ben’s recordings are still open. No deploy this pass.

## Stop

No composer. No Remotion. No AUTH_URL flip. Wave 3 waits on a human.
