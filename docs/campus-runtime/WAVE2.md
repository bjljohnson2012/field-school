# Wave 2 — Tenants, invites, household

2026-09-11

Wave 1 is live: two orgs in Postgres, Grok Bot station 01 events, guest still localStorage. `GET /api/me` always attaches a signed-in user to `field-school`. Household exists and is empty.

Wave 2 makes household a real campus without flipping AUTH_URL and without requiring `*.fieldschool.ai` on day one.

## Goal

A member can belong to more than one org. Path `/o/:slug` picks the org. Invites add people to household. Children exist under a guardian. Gym events stay out of household. Household events stay out of gym.

Wildcard hosts are a later step in this wave, after `/o/:slug` proves isolation. Ben owns DNS. The app must work on `portal.fieldschool.ai/o/household` before any new host exists.

## Do not

- Flip AUTH_URL or 301 university
- Deploy TanStack `src/`
- Touch CNC vault, Just, melt, Cap compose
- Start Wave 3 Notion publish
- Build `/today`, MCP, autogen, Cap add-on
- Auto-join every login to household
- Let a child mint tokens or open `/admin`

## Schema add (`app/db/0002_wave2.sql`)

Keep Wave 1 tables. Add columns / tables. Do not rename `assignments` (that table is field-work). Stances stay on `memberships.stance`.

```
members.kind            text not null default 'adult'   -- adult | child
members.auth_user_id    text                            -- Auth.js id when present
organizations.host      text unique                     -- later: acme.fieldschool.ai
organizations.features  jsonb default '{}'

invites
  id, org_id, email, stance, token unique, invited_by_membership_id,
  status (pending|accepted|revoked|expired), expires_at, created_at

wards
  guardian_membership_id, child_membership_id
  unique pair, both memberships must share org_id
```

Seed: household `features.cap = false`. Optional test org `acme` (strict). Delete after proof if not wanted.

## Steps

### Step 1 — Org context on the existing host

`/o/:slug` is the active org. Otherwise default `field-school`. Guest `/c/grok-bot` stays Org 0.

`GET /api/me` returns all memberships plus `activeOrg`. Unknown slug 404. Cross-org POST /api/events is 403.

Tests:
1. Signed in `/api/me` — field-school. No household until invited.
2. `/o/does-not-exist` — 404, no emails in HTML.
3. `/o/field-school/c/grok-bot` — same course as `/c/grok-bot`.
4. `/o/household` while gym-only — 403, not the roster.

### Step 2 — Invite into household

Admin/guardian `POST /api/invites`. Accept at `/invite/:token` after sign-in. Gym membership stays.

Tests:
1. Invite second email to household as learner.
2. Incognito token — login then accept.
3. `/api/me` lists field-school and household.
4. Expired/reused token — no second row.
5. Random token — 404, no user enumeration.

### Step 3 — Household campus is private

No inherited Grok Bot catalog. Fixture lesson `home:welcome` so household can write one watch.

Tests:
1. Household `GET /api/progress?course=grok-bot` empty.
2. Gym watch briefing — household progress still empty.
3. Household watch `home:welcome` — gym progress unchanged.
4. Gym-only second browser cannot see `home:welcome`.

### Step 4 — Child + guardian

Adult creates child `kind=child`. Ward row. Child cannot `/admin` or `POST /api/invites`.

Tests:
1. Child + ward in household.
2. Child `/admin` 403/307.
3. Child cannot invite.
4. Child `/api/me` household only, stance learner.
5. Gym admin cannot list household children.

### Step 5 — Dummy org acme

`/o/acme` forbidden to household parent. Acme progress has neither briefing nor welcome.

### Step 6 — Wildcard (Ben DNS first)

Skip if `*.fieldschool.ai` is not pointed. Host maps to org slug. Child cookie host-only. Cap/edit unchanged.

## Proof

1. One user, two memberships, `/api/me` lists both.
2. Gym watch absent from household progress.
3. Household welcome absent from gym progress.
4. Uninvited user cannot open `/o/household`.
5. Child cannot admin or invite.
6. Guest Grok Bot works. Guest POST 401.
7. Anonymous `/admin` 307, no PII.
8. cap + edit health up.
9. AUTH_URL still university.
10. This file updated with A–J pass/fail.

## Manual cheat sheet

Two Chrome profiles: Gym (staff Google) and Home (second email). One incognito guest.

| # | Browser | Action | Expect | Result |
|---|---|---|---|---|
| A | Guest | `/c/grok-bot` | works, no Postgres write | |
| B | Gym | `/api/me` | field-school only at first | |
| C | Gym | invite Home to household | pending invite | |
| D | Home | accept invite | two orgs on `/api/me` | |
| E | Gym | watch briefing | household progress empty | |
| F | Home | `/o/household` watch welcome | gym progress unchanged | |
| G | Gym | `/o/household` | 403 unless that account was invited | |
| H | Home | create child | listed, no admin | |
| I | Guest | `/o/household` | no roster, no events | |
| J | any | `/admin` logged out | 307 | |
