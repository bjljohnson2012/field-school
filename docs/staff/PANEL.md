# Panel
Dated 21 Sep 2026. Eval loop. Not a launch PASS. Not new C-suite.
Fixtures: [`panel.json`](./panel.json). Runner prompt: [`GROK_BOT_PANEL.md`](./GROK_BOT_PANEL.md).

## Why this exists

pick-next moves code. The panel tells us whether a human in a room can actually hire the job. Personality here is **how they walk**, not a second Field Pattern bank and not MBTI / Enneagram / Gallup / Wiley item text.

Nielsen: three to five independent evaluators catch most of the obvious breaks. We run **six stances** so household, team, maker, foundry, and nav are all covered. One HARD_FAIL from any stance is enough to redirect. Do not average.

## Seats (do not invent)

Locked roster stays. **New Bot** (empty) becomes the **Panel Runner**. CDM owns the clock. The six names in panel.json are scripts the runner plays, or six Grok Bot pins of the same prompt with `PERSONA_ID` set.

They do not message Field School PM. They do not write `app/`. They file a report. CDM reads the report at 15:00 and keeps, redirects, or stops.

| Bot | Persona | Room | Catches |
| --- | --- | --- | --- |
| FS Panel Guardian | P1 parent hirer | household | Child login, child tab, person-as-buyer |
| FS Panel Floor | P2 leader hirer | team | Child on sales, Insights-as-badge, rep owns path |
| FS Panel Rep | P3 salesperson | team | Library/People in their bar, no NextCard |
| FS Panel Maker | P4 create | team | Missing New doors, key in GET JSON |
| FS Panel Foundry | P5 tokens | both | Gym copy, neon, contrast, Fraunces missing |
| FS Panel Nav | P6 Nielsen | both | Header >5, banned words, org mix, Dashboard dump |

Credit-cheap default: **one runner, six stances in one 10:00 ET session**. Separate pins only if you want them overnight in parallel.

## What they score

| Layer | Pass |
| --- | --- |
| Job | Next is visible when the hirer leaves. Person in development is not the buyer. |
| Nav | Leader bar = Learn People Library Insights New. Learner bar = Learn Me. Org switch changes the whole chrome. |
| Mix | Sales desk zero children. Household desk zero sales diagnostics. |
| Foundry | Cream `#EFE7D6` / ink `#1A1A16` / gold `#C4A35A` / olive `#6B7F4F`. Display Fraunces. Body contrast ≥4.5:1. No gym, street, neighborhood. |
| Nielsen | H1–H10 as 0–4. HARD if H2 language is ticket names, H4 org mix, H6 recall of Intent/Path/Portion, H8 twelve-item bar. |
| Factory | Four plates + captions layer. WhisperX words. Just locked. |

## Walk (every persona, guest first)

1. Guest `https://portal.fieldschool.ai/api/me` is `{guest:true}`.
2. `https://edit.fieldschool.ai/health` is 200.
3. Sign in as that persona's role. Set Org. Do the `walks` list in panel.json.
4. Do **not** click family LIVE. Do **not** charge a card. Do **not** paste a real key in a screenshot.
5. File the block. Stop.

If the chrome is still the twelve-item bar, P6 HARD_FAIL N1 and the other stances still file (their evidence is the same bar). Do not skip the rest.

## Report block (one per persona)

```
PANEL
persona: P1-GUARDIAN|P2-FLOOR|P3-REP|P4-MAKER|P5-FOUNDRY|P6-NAV
room: household|team|both
url:
bar: <words seen, comma separated>
org:
child_on_sales: yes|no|n/a
next_visible: yes|no
hirer_absent_ok: yes|no
person_is_buyer: yes|no
foundry: PASS|SOFT|HARD
nav: PASS|SOFT|HARD
nielsen:
  H1: 0-4 ...
  H6: 0-4
  H8: 0-4
verdict: PASS|SOFT_FAIL|HARD_FAIL
redirect: N1|N2|N3|N9|N10|FACTORY|C2|none
quote: <one sentence in this stance's voice>
evidence:
  -
```

Write to `docs/staff/panel/YYYY-MM-DD-<id>.md` via Gate only if CDM asked for a repo file. Otherwise the CDM thread is the store. Notion Ops copies the six verdicts onto that day's page.

## How this moves the graph

| Panel result | CDM move |
| --- | --- |
| Any HARD on chrome / mix | Force pick N1. Do not pick N3, N6, N9 until N1 PASS. |
| HARD Insights-as-badge | After N1, pick N2. |
| HARD no New doors | After N1, pick N3. |
| HARD no NextCard | After N1, pick N9. |
| HARD foundry on portal | Redirect chrome tokens. Do not invent a new brand metaphor. |
| HARD factory karaoke | Factory-slim. Do not add a plate. |
| Six PASS on a surface | That surface may stay PASS in state.json. Still not Launch 8/8. |

Panel never flips Launch. Panel never authors the job. `eval-icp-job` is still the only skill that may propose a job sentence.

## Natural progress

1. 10:00 panel files six blocks.
2. 15:00 CDM reads them. Keep / redirect / stop.
3. Gate pastes the redirect into Field School PM if files must change.
4. Next 10:00 walks the same scripts on the new SHA.
5. Repeat until LOOP.md outcome is true.

That is the eval loop. It sits beside pick-next, not above ethos.

## Do not

- Hire six C-suite bots
- Official psychometric items
- Child login so a persona can "be the kid"
- Screenshot a live API key
- Treat a quote as ICP PASS by itself
- Average HARD_FAIL into a 3/5 and ship
