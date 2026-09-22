# Finance units

Room: household. C1 Finance. Dated 22 Sep 2026.
Launch stays CLOSED, 0/8. This file is not a launch score.

## Job

When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.

The parent is the User. The parent pays and owns the hours. The child is the person in development: `kind:child`, `login:none`, `user:false`. The child is a progress record. The child does not buy and does not own the path. Homeschool is a mode on that parent User.

When the parent is absent, the next portion still runs. The hours are how the parent invests. The person in development is not the buyer.

## Three prices as hours

The household metric is parent-owned supervised hours on the parent User. Three amounts only. Each amount is the hour it already is.

| Amount | Hour this amount already is | Path |
| --- | --- | --- |
| $100 a month | weekly online hour | `/checkout?plan=100` |
| $200 a month | hour in the room | `/checkout?plan=200` |
| $1,000 a month | one-on-one hour | `/checkout?plan=1000` |

No fourth SKU. No team price. No live charge.

The team room keeps the same portal, `https://portal.fieldschool.ai`, and an org-scoped membership. This file names no dollar amount for that room.

## Credits versus BYOK

Metering adds $0. Credits are not a product and not a fourth price. The schema is `app/db/0011_credits_byok.sql`. The parent membership owns the row. A child membership on a ledger line is the progress record, not a payer.

Platform credits. `credits.mode` stays `platform`. Units are integers. There is no currency column. `credit_ledger` debits those units on extract, spec, embed, and render.

BYOK. The parent brings a key. `customer_api_keys` stores it wrapped with AES-256-GCM. The screen shows last4 only. The key does not return on a read. Revoke sets `revoked_at`. Per-use credit burns stop. Usage still lands on `usage_events`. The monthly amounts stay $100, $200, and $1,000. Added dollars are $0.

N7 may later show the wrap and the last4. That screen is not a new price.

## What N2 must chart

N2 Insights serves C1. Charts are org-scoped aggregates. A notice badge does not count. Empty stays honest: no events in this org yet. A point opens the person on that row. The parent stays the User.

N2 must chart movement: people who moved in the last 7 days, and people who stalled.

N2 must chart credit burn versus BYOK usage. Platform burn is `credit_ledger` debit units on extract, spec, embed, and render. BYOK usage is `usage_events` units while the wrapped key is the org default. The BYOK series adds $0. The chart does not sell units and does not draw a fourth amount.

## Holds

No live charge. No team price. No fourth SKU. Launch stays CLOSED, 0/8.
