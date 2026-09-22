# GTM hire

C5. Sales and Offer. Dated 22 Sep 2026.
A human hires the next hirer at https://portal.fieldschool.ai. Assign is that motion. Ads are not.
Launch stays CLOSED, 0/8. This file is not a launch score.

## Job

When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.

## Parent motion

Room: household. Organization: the family. Hirer: the parent. Person in development: the Child (`kind:child`, `login:none`, `user:false`).

Motion: Assign.

A human at https://portal.fieldschool.ai hires the next parent by Assign. The parent is the User. The parent selects one Child. Assign places one spec on that Child. The Child is a progress record. The Child does not sign in, does not buy, and does not own the path.

The parent invests one household amount a month. Three amounts only. Each amount is the hour it already is.

| Amount | Hour this amount already is | Path |
| --- | --- | --- |
| $100 a month | weekly online hour | `/checkout?plan=100` |
| $200 a month | hour in the room | `/checkout?plan=200` |
| $1,000 a month | one-on-one hour | `/checkout?plan=1000` |

No other amount.

When the parent is absent, the assigned next portion still runs.

The human asks: Does this keep them moving when you are absent?

This motion does not copy an unstructured week, an extra tutor amount, a login for the Child, or "we sent the course."

## Leader motion

Room: team. Organization: the book of business. Hirer: the leader. Person in development: the teammate.

Motion: Assign.

A human at https://portal.fieldschool.ai hires the next leader by Assign. The leader is the User. The leader selects one teammate. Assign places one spec on that teammate. The teammate may sign in to do the work. The teammate does not buy and does not own the path.

This motion names no dollar amount. The offer is the same portal, https://portal.fieldschool.ai, and an org-scoped membership. No team price.

The sales desk lists login learners. A Child is not on that desk. A salesperson is not a Child.

When the leader is absent, the assigned next portion still runs.

The human asks: Does this keep them moving when you are absent?

## Assign

N8 Assign is the hire. One spec. One desk. Household Assign reaches a tracked Child. Leader Assign reaches a login teammate. The desks never share a screen.

The spec Assign sends has this shape. N4 owns the module. This file does not add that module.

```ts
export type LessonSpec = {
  id: string;
  org: string;
  title: string;
  outcome: string;
  units: { id: string; title: string; source_unit_id: string }[];
  mode: "teach" | "assign" | "video";
};
```

Hire mode is `assign`. Each unit carries `source_unit_id`.

## Stops

No ads. No fourth amount. No team price. No child login. No live card. The public site stays as it is. Counsel signs before any public claim.
