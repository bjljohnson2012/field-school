# Around-the-clock briefs

Timezone: America/New_York. Daily. Launch stays closed.

These Grok automations write the brief. CDM routes. Cursor Gate pastes the sealed brief into Field School PM.

| Clock | Name | Job |
|---|---|---|
| 06:00 | Cursor harvest | What PM shipped overnight. Today's one stream. |
| 15:00 | Mid-course | Keep, redirect, or stop that stream. |
| 21:00 | Close | Score the day. Overnight potato brief. |

Replaces the paused 9 AM PM-CTO check-in and the 10 PM nightly brief. Notion Ops may copy each run onto a Team Dashboard Tables page. The automation output is the source.

## 06:00 — Cursor harvest

Owner of the text: automation `Field School 6am Cursor brief`.
Owner of the decision: CDM.
Hands: CTO → Cursor Gate → Field School PM.

Must include: overnight PRs, health curls, eight-node scores, one sealed brief, Human needed.

## 15:00 — Mid-course

Did the 06:00 brief move. Keep / redirect / stop. No second wave.

## 21:00 — Close

Shipped vs asked. Updated scores. Overnight brief safe to run while Ben sleeps. First line for tomorrow 06:00.

## Matching Grok Bot routines (optional twin)

If CDM should also wake in-app:
- 06:15 ET: read the harvest brief, send the sealed brief to CTO.
- 15:15 ET: read mid-course, keep or redirect Gate.
- 21:15 ET: read close, authorize overnight stream or idle.

Offset 15 minutes so the automation finishes first.
