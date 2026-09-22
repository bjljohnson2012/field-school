# N15 both rooms

Dated 22 Sep 2026. Proof only. This file reads four open drafts and leaves each branch as it is.

Launch stays CLOSED, 0/8.

When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.

Household prices stay $100 / $200 / $1,000 a month.

## Two rooms

The hirer is the User. The person in development is not the buyer.

| Room | Hirer | Person in development | Buyer |
| --- | --- | --- | --- |
| Household | Parent | Tracked child. Login none. | The child is not a buyer. |
| Sales | Leader | Login learner. The teammate may sign in to work. | The teammate does not buy. |

Household and sales stay on separate desks. Sales has zero children. Household has zero sales diagnostics.

## The person still moves when the hirer is away

The path is the LessonSpec and the open row, scoped to the active org. The leader can leave. The row remains. Insights on that org still shows who moved, and a point opens that person. Learn home still shows the next step for the active org. Teach live still walks the units, and each unit shows `source_unit_id`.

## Open drafts

These four drafts are open against `main` at `bf1f1ba898b11f341077360bf70149a783403461`. This proof cites them. It does not merge them.

### Insights

[N2 Insights](https://github.com/bjljohnson2012/field-school/pull/225) on `cursor/n2-insights` at `2bd38bfc8d3a6067663652b5fb93dc30588034cb`.

`/insights` reads the active org. Click a point and the chart opens a person. Sales has zero children (the child row is absent). Household opens a tracked child with login none, and shows zero sales diagnostics. An empty org has no chart values: the six charts show `no events in this org yet` and no invented numbers.

### Assign

[N8 Assign](https://github.com/bjljohnson2012/field-school/pull/223) on `cursor/n8-assign` at `c0563444976b4bd8e5ee64e3c2d49134c5e6d6bf`.

One LessonSpec. The open desk lists one room. Sales: a login learner, the teammate who may sign in to work. The teammate does not buy. Household: a tracked child. Login none. The child is not a buyer. Each unit carries `source_unit_id`. The assignment is scoped by org and membership. The open row remains when the leader leaves.

### Learn home

[N9 Learn home](https://github.com/bjljohnson2012/field-school/pull/217) on `cursor/n9-learn-home` at `bf51c55a1ce50a77ce788c2aa1997b5f940f56a6`.

Signed-in `/dashboard` is Learn for the active org only. The page reads `activeOrg.slug`. Sales home is the sales course and lists zero children. Household home is the household course and shows zero sales diagnostics. The card carries the course and the next step, so the path is on the desk after the hirer steps away.

### Teach live

[N11 Teach live](https://github.com/bjljohnson2012/field-school/pull/212) on `cursor/n11-teach-live` at `f1fb11b98ad76db855e6b193d2840bf6365c406e`.

The presenter walks the units of one LessonSpec for the sales org. Previous, next, the unit list, and arrow keys move the current unit. Each unit shows its `source_unit_id`: `src-who-now`, then `src-next-step`, then `src-after-you-leave`.
