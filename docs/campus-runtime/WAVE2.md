# Wave 2 proof — tenants, picker, Field Pattern

2026-09-18. Deployed to VPS `2.24.70.248` with `app/deploy/deploy.sh`. Wave 1 guest Grok Bot still works. AUTH_URL is still `https://university.benjohnson.ai`. No composer. No Remotion. TanStack leftover `field-school-db` was not written.

Live session proof file: `/opt/cursor/artifacts/wave2_session_live_proof.json`.

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

## Proofs

Checked live this session on `university.benjohnson.ai` / `portal.fieldschool.ai` and campus Postgres.

| Check | Expect | Result |
|---|---|---|
| Picker lists both student orgs | One login on household + sales; `GET /api/me` returns both; `/o/:slug` flips | **pass**. Dual-org fixture: `sales:trainer`, `household:guardian`. `fieldSchoolForced=false`. `activeOrg` household by default; `x-fs-org: sales` → `sales`. `/o/household` 200, `/o/sales` 200, `/o/field-school` 403 (not a member). Operator email in Postgres: field-school/admin, household/guardian, sales/trainer. |
| Events do not cross | Household `home:welcome` absent from sales; sales `sales:welcome` absent from household | **pass**. Household watch `home:welcome` 200. Household watch `sales:welcome` 403 `cross_org`. Sales watch `sales:welcome` 200. Sales watch `home:welcome` 403 `cross_org`. Progress: household home has welcome; household grok-bot and sales empty; sales home empty; sales sales has welcome. |
| Uninvited `/o/household` | Guest 401; signed-in non-member 403; unknown slug 404 | **pass**. Guest `/o/household` 401, `/o/sales` 401, `/o/does-not-exist` 404. Signed-in field-school-only member `/o/household` 403 and `/o/sales` 403. |
| Child cannot admin or invite | Child cannot mint invites or open `/admin` | **pass**. Live child fixture: `kind=child`, orgs `field-school:learner`. `POST /api/invites` 403 `child_cannot_invite`. `/admin` 307 `/request-access?from=admin`. `POST /api/children` 403 `child_cannot_create`. |
| fp-50 writes a profile | Pattern run writes `member_profiles` + revision; import overrides correspondence only | **pass**. `POST /api/pattern/run` 200 `reset=true`, primary Drive, title `Drive / Duty`, narratives learn/approach/conflict/feedback/group present. `POST /api/pattern/import` 200 `imported=true`, `leading_type_code=INTJ`, Bearing unchanged. Instrument live: adult 50, child 26 (table). Product name Field Pattern; page does not say MBTI. |
| Guest Grok Bot | `/c/grok-bot` 200; guest `/api/me` guest; guest POST events 401 | **pass** on portal and university. |
| cap + edit health | cap login 200; edit `/health` ok | **pass**. `cap.fieldschool.ai/login` 200; `{"ok": true, "service": "fieldschool-edit"}`. |
| AUTH_URL | still university.benjohnson.ai | **pass**. Not flipped. Credentials callback still that host. |
| Skills stay org-scoped | household 3 parent-editable; sales 3 seeded | **pass**. Live `GET /api/skills`: household morning/chores/read; sales discovery/qualification/next-step. |
| Invite accept | Household learner invite lands the invitee on `/o/household` | **pass**. Guardian mint household learner 200; sales trainer mint 200. Prior invitee now `field-school:learner` + `household:learner`; `/o/household` 200. |

## Walkthrough artifacts

Copied into the parent store media folder:

- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_guest_campus_walkthrough.mp4`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_guest_grok_bot.webp`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_guest_household_blocked.webp`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_field_pattern.webp`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_guest_api_me.webp`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_edit_health.webp`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_cap_login.webp`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_picker_both_orgs.webp`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_sales_org_home.webp`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/media/wave2_household_org_home.webp`

## Automated

```bash
cd app && npm test
```

38 tests pass, including `scripts/wave2-tenants.test.mjs` and `scripts/wave2-pattern.test.mjs`.

## Live after deploy

```text
guest /api/me              {"authenticated":false,"guest":true}
guest POST /api/events     401 sign_in_required
/c/grok-bot                200
/o/household guest         401
/o/sales guest             401
/o/does-not-exist          404
pattern adult / child      50 / 26
cap /login                 200
edit /health               ok
orgs                       field-school (gym), household (homeschool/strict), sales (company/platform_plus)
skills                     household morning/chores/read; sales discovery/qualification/next-step
operator email             field-school/admin, household/guardian, sales/trainer
picker /api/me             sales:trainer + household:guardian; fieldSchoolForced false
pattern run                200 reset Drive / Duty
pattern import             200 imported INTJ; Bearing unchanged
household watch            home:welcome 200
cross-org watch            403 cross_org both directions
child invite / admin       403 child_cannot_invite; 307 /request-access
invite accept              invitee /o/household 200
```

## Stop

No composer. No Remotion. No AUTH_URL flip. Wave 3 waits on a human.
