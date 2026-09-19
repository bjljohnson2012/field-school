# Prelaunch staff graph

Phase: build only. Launch is closed until `docs/prelaunch/LAUNCH_GATE.md` is 8/8.

Grok Bots decide. Cursor Project **Field School PM** runs the sub-agents. Ben records Cap, signs legal, and types LAUNCH.

## Topology

```
Ben (Cap / legal / launch gate)
  |
Dean (Grok Bot, outer loop)
  |-- reads STATUS + health
  |-- writes one sealed brief per day
  |
  +--> Field School PM (Cursor Project coordinator)
          |-- campus workers (wave-N)
          |-- prelaunch workers (docs + marketing-site)
          +--> Judge notes back to Dean via PR + WAVE/STATUS files
```

Do not hire twelve Bots. Dean is the only Grok Bot required. Optional later: Factory watch Bot.

## Nodes (launch AND-gate)

1. Product
2. ICP
3. Brand
4. Offer
5. Marketing
6. Sales
7. Legal
8. Plan

Each node scores 0, 1, or 2 in `docs/prelaunch/STATUS.md`. Launch needs 16/16.

## Who writes what

| Hands | Path |
|---|---|
| Field School PM / campus workers | `app/`, `docs/campus-runtime/WAVE{N}.md`, later `plates/` |
| Field School PM / prelaunch workers | `docs/prelaunch/*`, `marketing-site/` |
| Dean | sealed briefs, daily score, Sunday note |
| Ben | Cap takes, legal sign, Stripe, child lock, the word LAUNCH |

## Daily loop (Dean, 07:00 ET)

1. Guest `https://portal.fieldschool.ai/api/me`
2. Cap login and `https://edit.fieldschool.ai/health`
3. Last five commits on `bjljohnson2012/field-school`
4. Read `docs/campus-runtime/STATUS.md` and `docs/prelaunch/STATUS.md`
5. Pick one node. Default: Product while Wave 3 is incomplete.
6. Hand Field School PM one sealed brief.
7. Stop. No second wave the same day.

## Sealed brief

```
Node: Product | ICP | Offer | Brand | Marketing | Sales | Legal | Plan
Target files:
Branch: cursor/wave-N-<slug> or cursor/prelaunch-<slug>
Project: Field School PM
Done when:
Proofs:
Do not:
Human needed: none | Cap take | legal sign | launch gate
```

## Locks (copy onto every brief)

- One wave or one prelaunch file-set per brief.
- Build in `app/`. Do not extend frozen TanStack `src/`.
- AUTH_URL stays `https://portal.fieldschool.ai`.
- Do not touch CNC vault `2.24.64.248`.
- Do not re-render Just (`27pn9xs0zk8a73g`).
- No second melt while `render.lock` exists.
- No second Field Pattern bank. No official MBTI / Enneagram / Gallup / Wiley items.
- Do not inherit Grok Bot into the household catalog.
- Quiz items need `source_unit_id` or they do not persist.
- Household and sales events never mix.
- No Stripe, no outbound email, no ads, no LAUNCH until the gate is 8/8.
- Gym wording is retired. Voice: foundry, stations, field work. Charcoal / cream / olive.
- Do not put Ben's street or neighborhood in copy.

## After launch

This graph retires. Dean becomes ops. Ben runs Saturday rooms and sales conversations. Do not invent live-mode Bots before the gate.
