# State

Machine file: [`state.json`](./state.json). Pick engine: [`pick-next.mjs`](./pick-next.mjs).
Loop: [`LOOP.md`](./LOOP.md). Grok Bot: [`GROK_BOT.md`](./GROK_BOT.md).

Field School PM patches `state.json` on the same PR that ships a node. CDM does not edit the repo.

```
node docs/staff/pick-next.mjs
```

Expected on untouched main: `PICK N1 C2`.

Outcome is false until LOOP.md outcome is true. Launch stays CLOSED 0/8.
