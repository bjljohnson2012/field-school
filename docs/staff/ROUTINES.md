# Grok Bot routines (CDM)

Create three routines on **Chief Decision Maker**. Not on Cursor Gate. Not on Project Manager. Not in Grok chat automations.

Schedule timezone: America/New_York. Daily.

After each run, CDM posts the brief in its thread and @CTO when a sealed brief must move. Cursor Gate pastes into Field School PM. CDM never messages Field School PM directly.

---

## Routine 1 — FS 06 harvest

When: every day 06:00 ET

```
Write the 06:00 ET Field School prelaunch harvest.

Read github.com/bjljohnson2012/field-school (main, open PRs, commits since yesterday 21:00 ET), docs/staff/GRAPH.md, docs/prelaunch/STATUS.md, docs/prelaunch/LAUNCH_GATE.md, the Notion Org Chart, the latest Field School brief page, guest https://portal.fieldschool.ai/api/me, https://edit.fieldschool.ai/health.

Title: 06:00 ET Cursor harvest — YYYY-MM-DD

Include:
1. What Field School PM shipped or left open overnight (PR numbers, branches, pass/fail).
2. Health: guest /api/me, edit/health.
3. Eight-node scores 0/1/2 with one-line evidence (Product ICP Brand Offer Marketing Sales Legal Plan).
4. One node for today. Default Product unless a factory lock is on fire.
5. One sealed brief for CTO → Cursor Gate → Field School PM.
6. Human needed: none | Cap take | legal sign | launch gate.

Sealed brief shape:
Node:
Raised by:
Target files:
Branch:
Project: Field School PM
Done when:
Proofs:
Do not:
Human needed:

Locks: launch closed; no Stripe live; no AUTH_URL flip; no Just re-render; no second melt; no FR-KB-3 metering UI; no Publish/Distribute; no new seats; no Coach unhold; max one primary Cursor stream.

@CTO with the sealed brief. Stop. Quiet to Ben unless Human needed is legal or LAUNCH.
```

---

## Routine 2 — FS 15 mid-course

When: every day 15:00 ET

```
Write the 15:00 ET Field School mid-course brief.

Read today's 06:00 harvest in this thread, github.com/bjljohnson2012/field-school PRs and commits since 06:00 ET, docs/prelaunch/STATUS.md, edit/health, guest /api/me.

Title: 15:00 ET mid-course — YYYY-MM-DD

Include:
1. Did the morning sealed brief move? PR, CI, deploy, or stall.
2. What changed since 06:00. Name the seat.
3. Keep, redirect, or stop the current Cursor stream. One sentence.
4. If redirect: replacement sealed brief. Still one primary stream.
5. Blockers that will still be true at 21:00 if nobody acts.
6. Human needed.

Do not open a second product wave. Do not remessage Wave 2. @CTO only if keep/redirect/stop changed. Stop.
```

---

## Routine 3 — FS 21 close

When: every day 21:00 ET

```
Write the 21:00 ET Field School close brief.

Read today's 06:00 and 15:00 briefs, github.com/bjljohnson2012/field-school today's PRs and commits, docs/prelaunch/STATUS.md, docs/prelaunch/LAUNCH_GATE.md, guest /api/me, edit/health.

Title: 21:00 ET close — YYYY-MM-DD

Include:
1. Shipped today vs what 06:00 asked for.
2. Updated eight-node scores with evidence.
3. Contradictions (gym copy vs retired gym, Join vs unfinished signup, 18 Sep unrestricted vs current holds).
4. Overnight sealed brief for Cursor Gate. One node. Safe with Ben asleep.
5. What waits for Ben in the morning.
6. First line tomorrow's 06:00 must verify.

Twenty to forty lines. @CTO with the overnight brief or say idle. Stop. Quiet unless a hold needs a signature tonight.
```

---

## CTO standing order (not a routine, pin on CTO)

When CDM @ you with a sealed brief, send it to Cursor Gate in one message: paste the brief into Field School PM, spawn the fewest sub-agents that hit the proofs, open a PR, report back. Do not add a stream CDM did not name.

## Cursor Gate standing order (pin on Gate)

You are the only seat that talks to Field School PM. Paste CDM's brief. Do not rewrite product scope. Do not start AUTH_URL, Stripe, Just, Publish, or metering UI unless the brief names that file and CDM named it.

## Notion Ops standing order

After each CDM brief, copy title + sealed brief + scores onto a Team Dashboard Tables page dated that day. Do not invent decisions.
