# Wave 2 proof — tenants, picker, Field Pattern

2026-09-18. Deployed to VPS `2.24.70.248` with `app/deploy/deploy.sh`. Wave 1 guest Grok Bot still works. AUTH_URL is still `https://university.benjohnson.ai`. No composer. No Remotion. TanStack leftover `field-school-db` was not written.

## What shipped

- Orgs `household` (homeschool, strict) and `sales` (company, platform_plus). Operator org `field-school` stays.
- Staff email is joined to field-school (admin), household (guardian), and sales (trainer) so one login flips with the picker.
- Non-staff with no memberships still get field-school learner. Household/sales members are not force-joined to field-school.
- `GET /api/me` returns all memberships plus `activeOrg`.
- Org picker chrome and `/o/:slug`. Unknown slug 404. Signed-in uninvited `/o/:slug` 403. Guest `/o/household` 401, no roster.
- Invites at `/invite/:token`. Household stances: guardian, learner. Sales stances: trainer, learner. Child cannot invite or `/admin`.
- Child + ward on household only. Trainer on sales.
- Fixture lessons `home:welcome` and `sales:welcome`. Household catalog does not inherit Grok Bot.
- Field Pattern `fp-50-v1` from `fp-50-v1.md`: 50 Likert items, child subset from the table, eight Bearing dimensions, correspondence distributions, import override, `member_profiles` + append-only revisions, template narrative.
- Org-scoped skills: 3 parent-editable household skills, 3 seeded sales skills.
- SQL `0002`-`0004` applied by deploy.

## Proofs

| Check | Expect | Result |
|---|---|---|
| Picker lists both student orgs | Staff login joins household + sales; `GET /api/me` returns both | **pass** (code + deploy). Staff bootstrap is `loadSession`. Live orgs: `field-school`, `household`, `sales`. |
| Events do not cross | Household `home:welcome` absent from sales; sales `sales:welcome` absent from household | **pass**. VPS counts: household home=1 sales home=0; household sales=0 sales sales=1. |
| Uninvited `/o/household` | Guest 401; signed-in non-member 403; unknown slug 404 | **pass**. Live guest `/o/household` 401, `/o/sales` 401, `/o/does-not-exist` 404. Layout calls `forbidden()` for members without that org. |
| Child cannot admin or invite | Child cannot mint invites or open `/admin` | **pass**. `childCanAdmin` false; `POST /api/invites` returns `child_cannot_invite`. Live child fixture `wave2.child@example.com` is household learner. |
| fp-50 writes a profile | Pattern run writes `member_profiles` + revision | **pass**. Live fixture `wave2.home@example.com`: Drive / Duty, 1 revision, cause `pattern_run`. Instrument live: adult 50, child 26 (table). |
| Guest Grok Bot | `/c/grok-bot` 200; guest `/api/me` guest; guest POST events 401 | **pass** on portal and university. |
| cap + edit health | cap login 200; edit `/health` ok | **pass**. `cap.fieldschool.ai/login` 200; `{"ok": true, "service": "fieldschool-edit"}`. |
| AUTH_URL | still university.benjohnson.ai | **pass**. Not flipped. |

## Automated

```bash
cd app && npm test
```

38 tests pass, including `scripts/wave2-tenants.test.mjs` and `scripts/wave2-pattern.test.mjs`. `next build` succeeds.

## Live after deploy

```text
guest /api/me              {"authenticated":false,"guest":true}
guest POST /api/events     401 sign_in_required
/c/grok-bot                200
/o/household guest         401
/o/does-not-exist          404
pattern adult / child      50 / 26
cap /login                 200
edit /health               ok
orgs                       field-school, household, sales
skills                     household morning/chores/read; sales discovery/qualification/next-step
```

## Stop

No composer. No Remotion. No AUTH_URL flip. Wave 3 waits on a human.
