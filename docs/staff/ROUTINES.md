# Field School clocks (CDM)

Create these routines on **Chief Decision Maker**. Not on Cursor Gate. Not on Project Manager. Not in Grok chat automations. Do not invent agents. Do not spawn new Product / Marketer / Revenue agents.

Schedule timezone: America/New_York. Daily.

**Every clock is a handoff.** After each run, CDM posts the brief in its thread and @CTO when a sealed brief must move. Wire: **CDM → CTO → Cursor Gate → Field School PM**. Cursor Gate pastes into Field School PM. CDM never messages Field School PM directly. No peer C-suite messaging.

Launch SoT: [../prelaunch/LAUNCH_GATE.md](../prelaunch/LAUNCH_GATE.md) — **CLOSED**, **0/8**. Do not invent **8/8**. Hub: [GRAPH.md](./GRAPH.md).

| Clock (ET) | Name | Job |
|---|---|---|
| 06:00 | FS 06 harvest | Overnight ship + one sealed brief |
| 09:00 | FS 09 weekday | Score table + one-node pick (weekday loop) |
| 15:00 | FS 15 mid-course | Keep, redirect, or stop that stream |
| 22:00 | FS 22 night | Score the day. Overnight brief for Gate |
| 02:00 | FS 02 verify | Ben-asleep check. First line 06 must verify |

---

## Routine 1 — FS 06 harvest

When: every day 06:00 ET. Handoff: CDM → CTO → Cursor Gate → Field School PM.

```
Write the 06:00 ET Field School prelaunch harvest.

Read github.com/bjljohnson2012/field-school (main, open PRs, commits since yesterday 22:00 ET), docs/staff/GRAPH.md, docs/staff/ROUTINES.md, docs/prelaunch/STATUS.md, docs/prelaunch/LAUNCH_GATE.md, the Notion Org Chart, the latest Field School brief page, guest https://portal.fieldschool.ai/api/me, https://edit.fieldschool.ai/health.

Title: 06:00 ET Cursor harvest — YYYY-MM-DD

Include:
1. What Field School PM shipped or left open overnight (PR numbers, branches, pass/fail).
2. Health: guest /api/me, edit/health.
3. Eight-node scores 0/1/2 with one-line evidence (Product ICP Brand Offer Marketing Sales Legal Plan). Do not invent 8/8. Launch stays CLOSED.
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

Locks: launch CLOSED 0/8; no Stripe live; no AUTH_URL flip; no Just re-render; no second melt; no FR-KB-3 metering UI; no Publish/Distribute; no Remotion-in-Next; no Wave3 cutover; no PR 65 merge; no new seats; no Coach unhold; max one primary Cursor stream; do not steal family LIVE bc-4765f2f0.

@CTO with the sealed brief. Stop. Quiet to Ben unless Human needed is legal or LAUNCH.
```

---

## Routine 2 — FS 09 weekday

When: every weekday 09:00 ET. Handoff: CDM → CTO → Cursor Gate → Field School PM. Already named in the 2026-09-19 morning brief / GRAPH daily loop.

```
Write the 09:00 ET Field School weekday score.

Read today's 06:00 harvest in this thread, docs/prelaunch/STATUS.md, docs/prelaunch/LAUNCH_GATE.md, docs/staff/GRAPH.md, the Notion Org Chart.

Title: 09:00 ET weekday — YYYY-MM-DD

Include:
1. Project Manager score table (eight nodes). Launch CLOSED. This readout 0/8 unless a node has explicit PASS evidence.
2. One launch node for today. Default Product.
3. If the node needs code: sealed brief CDM → CTO → Cursor Gate → one Field School PM stream.
4. If prose only: CDM → Writer (Marketer or Revenue as raisers). Gate only when a PR is required.
5. Max two Cursor streams. No third. No C-suite side channel.
6. Human needed.

Do not invent agents. Do not invent 8/8. Do not remessage Wave 2. @CTO only if a sealed brief must move. Stop.
```

---

## Routine 3 — FS 15 mid-course

When: every day 15:00 ET. Handoff: CDM → CTO → Cursor Gate → Field School PM.

```
Write the 15:00 ET Field School mid-course brief.

Read today's 06:00 harvest and 09:00 weekday in this thread, github.com/bjljohnson2012/field-school PRs and commits since 06:00 ET, docs/prelaunch/STATUS.md, edit/health, guest /api/me.

Title: 15:00 ET mid-course — YYYY-MM-DD

Include:
1. Did the morning sealed brief move? PR, CI, deploy, or stall.
2. What changed since 06:00 / 09:00. Name the seat.
3. Keep, redirect, or stop the current Cursor stream. One sentence.
4. If redirect: replacement sealed brief. Still one primary stream.
5. Blockers that will still be true at 22:00 if nobody acts.
6. Human needed.

Do not open a second product wave. Do not remessage Wave 2. Do not invent agents. @CTO only if keep/redirect/stop changed. Stop.
```

---

## Routine 4 — FS 22 night

When: every day 22:00 ET. Handoff: CDM → CTO → Cursor Gate → Field School PM.

```
Write the 22:00 ET Field School night handoff.

Read today's 06:00, 09:00, and 15:00 briefs, github.com/bjljohnson2012/field-school today's PRs and commits, docs/prelaunch/STATUS.md, docs/prelaunch/LAUNCH_GATE.md, guest /api/me, edit/health.

Title: 22:00 ET night — YYYY-MM-DD

Include:
1. Shipped today vs what 06:00 / 09:00 asked for.
2. Updated eight-node scores with evidence. Do not invent 8/8. Launch stays CLOSED.
3. Contradictions (gym copy vs retired gym, Join vs unfinished signup, 18 Sep unrestricted vs current holds).
4. Overnight sealed brief for Cursor Gate. One node. Safe with Ben asleep.
5. What waits for Ben in the morning.
6. First line tomorrow's 02:00 and 06:00 must verify.

Twenty to forty lines. @CTO with the overnight brief or say idle. Stop. Quiet unless a hold needs a signature tonight.
```

---

## Routine 5 — FS 02 verify

When: every day 02:00 ET. Handoff: CDM → CTO → Cursor Gate → Field School PM.

```
Write the 02:00 ET Field School overnight verify.

Read the 22:00 night brief, github.com/bjljohnson2012/field-school PRs and commits since 22:00 ET, guest https://portal.fieldschool.ai/api/me, https://edit.fieldschool.ai/health.

Title: 02:00 ET verify — YYYY-MM-DD

Include:
1. Did the overnight sealed brief move? PR, CI, or idle.
2. Health: guest /api/me, edit/health.
3. Family LIVE bc-4765f2f0 still not stolen. Factory Just 27pn9xs0zk8a73g still locked.
4. First line 06:00 must verify (pass this line forward).
5. Human needed. Default none.

Do not spawn agents. Do not invent 8/8. Do not start AUTH_URL, Stripe, Remotion-in-Next, Cleaning/Publish, Cap, Wave3 cutover, or PR 65. @CTO only if the overnight brief must move or health failed. Stop. Quiet to Ben.
```

---

## Sealed brief shape

```
Node: Product | ICP | Offer | Brand | Marketing | Sales | Legal | Plan
Raised by:
Target files:
Branch: cursor/wave-N-<slug> or cursor/prelaunch-<slug>
Project: Field School PM
Done when:
Proofs:
Do not:
Human needed: none | Cap take | legal sign | launch gate
```

## CTO standing order (not a routine, pin on CTO)

When CDM @ you with a sealed brief, send it to Cursor Gate in one message: paste the brief into Field School PM, spawn the fewest sub-agents that hit the proofs, open a PR, report back. Do not add a stream CDM did not name. Do not invent agents.

## Cursor Gate standing order (pin on Gate)

You are the only seat that talks to Field School PM. Paste CDM's brief. Do not rewrite product scope. Do not start AUTH_URL, Stripe, Just, Publish, Remotion-in-Next, Wave3 cutover, or metering UI unless the brief names that file and CDM named it.

## Notion Ops standing order

After each CDM brief, copy title + sealed brief + scores onto a Team Dashboard Tables page dated that day. Do not invent decisions.
