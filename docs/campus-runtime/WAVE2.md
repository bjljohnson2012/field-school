# Wave 2 proof — tenants, picker, Field Pattern

Wave 1 remains live: guest Grok Bot, `GET /api/me` guest, guest `POST /api/events` 401. AUTH_URL stays `https://university.benjohnson.ai`. This wave does not flip it, does not deploy TanStack, and does not start composer or Remotion.

## What shipped

- Orgs `household` (homeschool, strict) and `sales` (company, platform_plus). Operator org `field-school` stays.
- Staff email is joined to field-school (admin), household (guardian), and sales (trainer) so one login flips with the picker.
- Non-staff with no memberships still get field-school learner. Household/sales members are not force-joined to field-school.
- `GET /api/me` returns all memberships plus `activeOrg`.
- Org picker chrome and `/o/:slug`. Unknown slug 404. Signed-in uninvited `/o/household` 403. Guest `/o/household` 401, no roster.
- Invites at `/invite/:token`. Household stances: guardian, learner. Sales stances: trainer, learner. Child cannot invite or `/admin`.
- Child + ward on household only. Trainer on sales.
- Fixture lessons `home:welcome` and `sales:welcome`. Household catalog does not inherit Grok Bot.
- Field Pattern `fp-50-v1`: 50 Likert items, 20-item child subset, eight Bearing dimensions, correspondence distributions, import override, `member_profiles` + append-only revisions, template narrative.
- Org-scoped skills: 3 parent-editable household skills, 3 seeded sales skills.
- SQL `0002`-`0004` applied by `app/deploy/deploy.sh`.

## Proofs

| Check | Expect | Result |
|---|---|---|
| Picker lists both student orgs | Staff `/api/me` includes household and sales | |
| Events do not cross | Household watch `home:welcome` absent from sales/field-school progress; sales watch absent from household | |
| Uninvited `/o/household` | Signed-in field-school-only user gets 403 | |
| Child cannot admin or invite | `childCanAdmin` false; `POST /api/invites` 403 `child_cannot_invite` | |
| fp-50 writes a profile | `POST /api/pattern/run` resets Bearing, writes `member_profiles` + revision | |
| Guest Grok Bot | `/c/grok-bot` 200; guest `GET /api/me` `{guest:true}`; guest `POST /api/events` 401 | |
| cap + edit health | `cap.fieldschool.ai/login` 200; `edit.fieldschool.ai/health` ok | |
| AUTH_URL | still `university.benjohnson.ai` | |

## Automated

```bash
cd app && npm test
```

`scripts/wave2-tenants.test.mjs` and `scripts/wave2-pattern.test.mjs` cover isolation, invite stances, the fp-50-v1 table, and narrative keys.

## Stop

No composer. No Remotion. No AUTH_URL flip. Wave 3 waits on this file.
