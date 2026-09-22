# Shells, header, Insights, Library create
Dated 21 Sep 2026. Field School PM (`bc-882e8bdf`).
Read with `THREE_LOOPS.md`. This file is the chrome spec. Launch stays CLOSED.

The live header in `app/src/components/site-header.tsx` lists Dashboard, Lesson, Tools, Cart, Children, Progress, Intent, Path, Portion, Brain, Admin. That is a ticket log, not navigation.
The live dashboard in `app/src/app/dashboard/page.tsx` fetches `/api/children` if the user has **any** household membership, even when Org is Sales team. That is why a child named Test appears on the sales desk.

## Header (best practice)

Five destinations. One primary action. One org control. One user menu. Nothing else in the bar.

Nielsen: recognition over recall, stay under 7, current location marked. Linear/Stripe: product nouns, not ticket names. Role and active org filter the bar. If an item does not change for this org and this stance, it is not in the bar.

### Leader / parent (guardian, trainer, admin)

```
[seal] Field School     Learn    People    Library    Insights     [New]
                                                                  Org ▾  Credits  Avatar ▾
```

| Item | Goes to | Notes |
| --- | --- | --- |
| Learn | Learn home (NextCard) | What / why / next for the selected person |
| People | Lead people | Household: tracked children only. Sales: login learners only. Never both. |
| Library | Library | Create and review LessonSpecs |
| Insights | Admin intelligence | Charts, not a notice badge pretending to be a product |
| New | Create menu | Long-form video, Wizard, Connect AI |
| Org | picker | Switches the whole chrome. Sales never shows Children. |
| Credits | popover | Platform credits remaining, or BYOK on |
| Avatar | Settings, API keys, theme, sign out | Email does not sit in the bar |

### Login learner (salesperson)

```
[seal] Field School     Learn    Me     Org ▾  Avatar ▾
```

No Library. No People. No Insights unless stance is trainer/admin.

### Parent acting in household

Same as leader, People is children (login none). Insights is household progress, not sales funnel.

### Banned from the bar

Lesson, Tools, Cart, Children, Progress, Intent, Path, Portion, Brain, Training portal label, full email, Sign out as a top-level text button.
Those become: player chrome, Learn panels, Avatar menu, or Insights.
Cart is checkout only, not a standing tab.

Mobile: seal, current shell, New, Avatar. The rest in a sheet.

## Desk (replaces the current Dashboard dump)

The word Dashboard is retired in the UI. The signed-in home **is** the current shell.

Leader home = Insights + NextCard for the org, not a page titled Dashboard with Children + Courses + Assessments stacked.

Org law:
- `activeOrg === sales` → zero children chrome. Zero Field Pattern household copy. People = reps.
- `activeOrg === household` → zero sales diagnostic. People = tracked children.
- Membership in the other org is not a reason to mix the desk. The bug is `orgs.includes("household")` on the sales view. Kill it.

## Insights (admin intelligence)

This is the admin. Not `/admin` as a notice counter.

Data already exists: `learning_events`, `skill_states`, `assignments`, `credit_ledger`, `usage_events`, quiz rows.
Charts must be queryable, not screenshots. Click a bar, see the people, open EvalSheet.

Minimum six views, org-scoped:

1. Movement — people who moved in the last 7 days vs stalled
2. Next-step — who has no next portion / next unit
3. Checks — quiz pass rate by unit, click into the unit
4. Skills — skill_states heatmap for the org's skills
5. Credits — burn vs BYOK usage, not a currency fantasy
6. Assignments — open vs completed

Use shadcn charts (already in the stack) on Postgres aggregates. No ClickHouse. No fake demo numbers. Empty state is honest: "no events in this org yet."

Interactive: every series point drills to PersonRow. Insights is useless if it cannot open a person.

## Library create (New menu)

Three ways in. Same LessonSpec out.

### 1. Long-form video
Cap record or upload mp4. Extract chapters. ReviewRail. Outputs: Teach live, Assign, Make video.

### 2. Wizard
Interactive. Questions, not a form dump:
- What is this (file, link, text, idea in your head)
- Who is it for (this org's people)
- What should they be able to do after
- Teach live, self-serve, or both
- Need a video cut or not
Then the wizard fills LessonSpec. Leader still approves units and checks (source_unit_id).

### 3. Connect AI
Two modes on the org, already in `app/db/0011_credits_byok.sql`:
- **Ours:** platform credits. Debit `credit_ledger` on extract/spec/embed/render.
- **Yours:** BYOK. Key goes into `customer_api_keys` wrapped AES-256-GCM (`wrap_alg`, `wrap_kid`, `wrap_iv`, `wrap_tag`, `wrapped_ciphertext`). UI shows last4 only. Key never returns in GET JSON. Revoke sets `revoked_at`.

Settings → API keys is the only place a secret is pasted. Not the header. Not a lesson field.

If BYOK is on, Library jobs use that provider. If not, platform credits. Mixing per-job is allowed later. v1 is org default.

## Cycle 1 implication

Stream chrome (files: `site-header.tsx`, `dashboard/page.tsx`, Insights route):
- Collapse header to the five items.
- Desk respects activeOrg. Children never render on sales.
- Insights page with the six views, empty-honest if no events.
- New menu stubs the three create modes. Wizard and video can land on Wave 3 teach until Library ReviewRail exists.

Do not add more header links while doing this.
