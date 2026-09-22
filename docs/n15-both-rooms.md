# N15 both rooms

Dated 22 Sep 2026. Proof only. This file cites landed merges on `main`. It does not add product code.

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

The path is the LessonSpec and the open row, scoped to the active org. The leader can leave. The row remains. Insights on that org still shows who moved, and a point opens that person. Learn home still shows the next step for the active org. Teach live still walks the units, and each unit shows `source_unit_id`. Chrome keeps the leader bar to Learn, People, Library, Insights, New.

## Landed deps on main

Main tip at this proof: `9da52fad67a682cbfdd6db8a8a188158a6a512eb`.

### N1 Chrome

[N1 Chrome](https://github.com/bjljohnson2012/field-school/pull/206) merged on main (merge `ea9f024`). Leader bar: Learn, People, Library, Insights, New. Learner bar: Learn, Me. Sales desk does not fetch `/api/children`. Guest `/api/me` stays `{guest:true}`.

### N2 Insights

[N2 Insights](https://github.com/bjljohnson2012/field-school/pull/225) landed tip `f9ce2b6a954fa10e8c17e1ed723c21b90fa7c6ff`.

`/insights` reads the active org. Click a point and the chart opens a person. Sales has zero children. Household opens a tracked child with login none, and shows zero sales diagnostics. An empty org has no chart values: the six charts show `no events in this org yet` and no invented numbers.

### N8 Assign

[N8 Assign](https://github.com/bjljohnson2012/field-school/pull/223) MERGED SHA `1abaa93ffb813202dce23052b5666b368c943128` tip `43a18c06b499523d183d46e34bb97a4f23b4511c`.

One LessonSpec. The open desk lists one room. Sales: a login learner. The teammate does not buy. Household: a tracked child. Login none. The child is not a buyer. Each unit carries `source_unit_id`. The open row remains when the leader leaves.

### N9 Learn home

[N9 Learn home](https://github.com/bjljohnson2012/field-school/pull/217) landed tip `14e26f3cd5cf48689c31e0f60a3792a9531132c7`.

Signed-in `/dashboard` is Learn for the active org only. The page reads `activeOrg.slug`. Sales home is the sales course and lists zero children. Household home is the household course and shows zero sales diagnostics. The card carries the course and the next step, so the path is on the desk after the hirer steps away.

### N11 Teach live

[N11 Teach live](https://github.com/bjljohnson2012/field-school/pull/212) MERGED SHA `9da52fad67a682cbfdd6db8a8a188158a6a512eb` tip `9a351de87e25ab3d5b86ef97ba37bb54c6a543ab`.

The presenter walks the units of one LessonSpec for the sales org. Previous, next, the unit list, and arrow keys move the current unit. Each unit shows its `source_unit_id`: `src-who-now`, then `src-next-step`, then `src-after-you-leave`.

## Score

N1 N2 N8 N9 N11 are PASS on main. This proof is PASS. Do not treat it as Launch open. Count stays 0/8. PR 218 stays HELD. Launch stays CLOSED, 0/8.
