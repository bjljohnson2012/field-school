# Prelaunch staff graph

Phase: build only. Launch is closed until `docs/prelaunch/LAUNCH_GATE.md` is 8/8.

Live roster SoT: Notion Org Chart https://app.notion.com/p/3dffe86f6dee8190b990cab34b0fc518
Do not invent seats. Do not hire Dean. Chief Decision Maker already owns the outer loop.

## Execution path (hub)

```
Ben
└── Chief Decision Maker
    ├── CTO
    │   ├── Cursor Gate  ─── only seat that talks to Field School PM
    │   ├── Audio Builder
    │   ├── Soul Break
    │   └── Share Desk
    ├── Project Manager
    ├── Product ── Portal, Designer
    ├── Marketer ── Video
    ├── Revenue ── Sales Plays
    ├── Researcher
    ├── Writer
    ├── Notion Ops
    ├── Budget
    ├── Inbox
    ├── Van Til
    ├── Theology Expert
    ├── Coach (held)
    └── New Bot (empty; delete later)
```

C-suite rule from the Org Chart: CTO, Marketer, Revenue, and Product do not message each other. Each raises input to Chief Decision Maker. CDM synthesizes and routes.

Hands rule: Cursor Gate alone contacts Field School PM / Cursor cloud agents. CTO briefs Cursor Gate. CDM briefs CTO.

## Launch nodes → owning seats

| Node | Raises input | Hands |
|---|---|---|
| Product | Product (Portal, Designer) | CTO → Cursor Gate → Field School PM campus workers |
| ICP | Researcher | Writer files `docs/prelaunch/ICP.md` via Gate if it is a repo PR |
| Brand | Marketer + Writer + Van Til / Theology Expert | Gate only if marketing-site or BRAND.md must change |
| Offer | Revenue | Writer + Marketer; Gate for pricing.html |
| Marketing | Marketer (Video) + Writer | Gate for marketing-site |
| Sales | Revenue (Sales Plays) | Writer drafts; humans send |
| Legal | CDM holds; Ben signs | Writer updates LEGAL.md + privacy/terms via Gate |
| Plan | Budget + Revenue | Writer files PLAN.md |

Project Manager tracks the eight scores. Does not talk to Cursor. Does not invent work.

Factory seats (Audio Builder, Soul Break, Share Desk) stay on tape and links. They are not launch-gate owners.

## Daily loop (unpause this)

Weekday 9:00 ET. Already named in the 2026-09-19 morning brief.

1. Notion Ops posts or refreshes the morning brief page.
2. Project Manager reads `docs/prelaunch/STATUS.md` and the morning brief. Sends CDM one score table.
3. CDM picks one launch node. Default while composer teach UI is unshipped: Product.
4. If the node needs code or a repo file: CDM → CTO → Cursor Gate → one Field School PM stream.
5. If the node is company prose only: CDM → Writer (and Marketer or Revenue as raisers). Gate only when a PR is required.
6. Max two Cursor streams. Second stream only if Gate has spare capacity and the files cannot conflict.
7. Stop. No third stream. No C-suite side channel.

Sunday: CDM scores all eight nodes. Twenty lines. Contradictions listed. Launch stays closed.

## Sealed brief (CDM writes, CTO forwards, Gate pastes)

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

## Locks on every brief

- One node per brief.
- Build in `app/`. Do not extend frozen TanStack `src/`.
- AUTH_URL / public portal flip stays held until Ben says so (PR 31).
- No Stripe live, no ads, no outbound, no LAUNCH until the gate is 8/8.
- FR-KB-3 schema may exist. Do not deploy metering UI or prices.
- Do not remessage Wave 2.
- Do not touch CNC vault `2.24.64.248`.
- Do not re-render Just (`27pn9xs0zk8a73g`).
- No second melt while `render.lock` exists.
- Publish / Distribute on VOX stays held until a ship packet.
- No second Field Pattern bank. No official psychometric item banks.
- Do not inherit Grok Bot into the household catalog.
- Quiz items need `source_unit_id`.
- Household and sales events never mix.
- Gym wording retired in new copy.
- No street or neighborhood in copy.

## After launch

Ben gets more involved: Saturday rooms, sales conversations, child lock, money.
CDM shrinks to ops routing. Coach may unhold. Do not unhold Coach before the gate.
