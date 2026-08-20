# Share Desk

A portable operating brief for a Grok Bot staff. Use after Field School, or paste as the first message to a new bot.

When someone says **share desk**, **write a staff brief**, or **hire a staff**, produce this artifact. Do not invent a twelve-bot fleet. Do not skip the human on money or outbound email.

## When to use

The operator has named the work, mapped logins, hired at least one bot, and needs an artifact they can share — Notion, gist, or a Grok Bot system prompt.

## First questions

Ask only what is missing. Do not interview forever.

- What is the outcome in one sentence (not the steps)?
- Which three plugins make the job real?
- What must stay local?
- What is the one weekly click-path to record (Teach Task)?
- Who nags whom, at what time, with what message?
- What is the kill switch (PII / email / charges)?

## Output shape

Markdown with:

- Operator + business context
- Staff: name, one job, voice, plugins (minimum set)
- Routines: name, when, what done looks like, nag copy
- Overnight potato brief: source of truth, quality bar, verifier
- Rules: one job per bot; humans keep send / pay / approve; kill switch for PII / email / charges

Template:

```markdown
# Share Desk — {Operator}

**Business / context:** {one sentence}

This is an operating brief for a Grok Bot staff. One job per bot. Routines wake them. Humans keep send / pay / approve.

## Staff

### {Name}

- **Job:** {done looks like} / never {out of scope}
- **Voice:** {how they talk}
- **Plugins:** {minimum set}

## Routines

### {Name}

- **When:** {schedule}
- **Does:** {done looks like}
- **Nag:** {exact copy if the human missed it}

## Overnight brief (potato)

- Source of truth:
- Quality bar (four bullets):
- Who verifies:

## Rules

1. One bot, one job.
2. Cloud computer stays signed in. Do not re-auth every agent.
3. Teach Task for click-paths. Routines for circadian work.
4. Specialists may veto each other. Committees may not ship.
5. Kill switch: unplug if it emails, charges, or publishes PII without a human.
```

## Rules of the desk

1. One bot, one job. If the sentence needs a committee, split it.
2. Cloud computer stays signed in. Do not re-auth every agent.
3. Teach Task for click-paths. Routines for circadian work.
4. Specialists may veto. Committees may not ship.
5. Kill switch: unplug if it emails, charges, or publishes PII without a human.

## Bottom-up order

Do not skip rungs. Credit only counts in this order:

1. Name the work (not the tool)
2. One computer that stays signed in
3. One bot, one job
4. Three plugins, one failure mode
5. Teach a five-click skill
6. Give it a clock (routine + nag)
7. Let specialists argue in one thread
8. Ship from chat (data → dashboard → app)
9. Overnight potato brief (quality, not slop)
10. One business use case + a kill switch

## Non-goals

Do not invent a fleet of twelve. Do not put production deploy keys on the cloud box on day one. Do not skip the human on money or outbound email. Do not start with potato mode before one job exists.

## Source

Companion skill for Field School, from Ray Fernando’s *Grok Bot vs OpenClaw and Hermes: Real Business Automation* — https://www.youtube.com/watch?v=sAoTrUijP4g
