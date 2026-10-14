# M14 Evolution Engine prep

This file is spec only for [issue 377](https://github.com/bjljohnson2012/field-school/issues/377). It does not implement Evolution. It does not post or invent the sealed brief. It records what that brief must contain before M14 code may start, and what Ben must decide after the M13 report.

`docs/rebuild-progress.md` on `chore/rebuild-progress` wins over Notion and over this file when they disagree on stream status or gates. As of the prep cut, M14 is `not_started` with gate `sealed_brief_on_377`, `depends_on: [M13]`, `base: set_by_sealed_brief`, and branch `feat/portal-m14-evolution`. M13 is `not_started`, `never_merge_spike`. This prep branches from `origin/main` at `4eaf464cfa19c2c7a1e0b552490a31f5515e79ef`. It does not stack on M6, M11, or M13.

Launch stays CLOSED 0/8. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay false. Stripe stays in test mode. `AUTH_URL` stays unchanged. No production data scripts. No migration number is claimed here.

## Gate before any M14 code

All of the following must be true before an agent sets M14 to `in_progress` or opens an implementation draft PR.

1. **M13 is done as a spike, not a merge.** Branch `spike/payload-m13` stays throwaway. The report lives in `docs/spikes/payload-m13.md` and is posted on [#376](https://github.com/bjljohnson2012/field-school/issues/376). Acceptance per [#376](https://github.com/bjljohnson2012/field-school/issues/376) and the Notion master plan: the report answers every item under **Residual (for Evolution seal after spike)** in the platform reference packet ([#376 comment](https://github.com/bjljohnson2012/field-school/issues/376#issuecomment-6068407260)) with **yes or no and evidence**. The master plan lists four residuals (Drizzle long-term vs Payload runtime; same Postgres vs separate DB; next-auth coexistence; naming). Issue #376’s table text once said “three”; the packet and master plan say four. The packet wins.

2. **A sealed Evolution brief is posted on [#377](https://github.com/bjljohnson2012/field-school/issues/377) after that M13 report.** Not before. Not on another issue. `docs/rebuild-progress.md`: “M14 stays not_started until #377 has a sealed brief posted after the M13 report.”

3. **CDM owns the seal.** Per `docs/staff/ROUTINES.md`, sealed briefs move **CDM → CTO → Cursor Gate → Field School PM**. This prep does not fabricate Clock, MERGE, OPEN, CLOSE, Project, Do not, or Human needed lines. When the real brief lands, it should use the paste block shape in `docs/staff/GROK_BOT.md` (Sealed brief section) unless CDM posts a superseding format on #377.

4. **No MERGE GO, no implementation merge.** Issue #377: draft PR, no merge without CDM MERGE GO, no deploy from the build run.

Until the gate clears, treat M14 as blocked on `sealed_brief_on_377`, not as ready to build.

## What the sealed brief on #377 must contain

The sealed brief is the sole authority for M14 implementation scope. Issue #377 leaves **draft PR scope**, **branch** (`set at seal`), **acceptance**, and **migration** unset until seal. The brief must name each of the following explicitly. If any item is missing, agents hold M14 blocked and ask Ben or CDM; do not guess.

### Identity and routing

| Field | Requirement | Evidence if absent |
| --- | --- | --- |
| Stream id | `M14` | `docs/rebuild-progress.md` YAML |
| GitHub issue | `#377` | Issue #377 |
| Working branch | Name the branch (default name in progress YAML: `feat/portal-m14-evolution`) | Issue #377, progress YAML |
| `base` branch | Cut branch from here; progress YAML says `set_by_sealed_brief` | Master plan loop step 4 |
| `merge_in` | List branches to `git merge` into the M14 branch, or none | Progress YAML `merge_in: []` until brief overrides |
| pstack | Method URL or playbook path per every-stream rule | Issue #377, #363 |

### M13 carry-forward (mandatory inputs)

The sealed brief must **cite the M13 report on #376** (link and date) and **resolve** each Evolution residual from the platform packet with a committed decision, not a restatement of the spike questions:

1. **Runtime:** Keep Drizzle as the profile and evolution runtime, or migrate runtime to Payload (Ben lock until M13 report: Drizzle now; Payload spike before Evolution; not live Payload until after spike plus seal — [#363 section B](https://github.com/bjljohnson2012/field-school/issues/363), packet on #376).
2. **Database topology:** Same Postgres as campus, or separate database if Payload or another admin layer goes live.
3. **Auth:** How next-auth v5 and any Payload or admin auth coexist without breaking Google, X, and email sign-in (M8 identity direction in rebuild plan).
4. **Naming:** Student Profiles vs Field School **User / Child** language. Child ≠ User for accounts remains; the brief must say how collection labels map to product copy and desks.

If M13 answered no to adopting Payload at all, the brief still must say what “Evolution Engine” means in Drizzle-only terms (hooks, tables, admin surfaces).

### Scope (product and code)

The brief must define, in bounded bullets:

- **Goal:** Seal Evolution only after the spike ([#377](https://github.com/bjljohnson2012/field-school/issues/377) table).
- **In scope routes, APIs, jobs, and operator surfaces** that change learner or family-visible behavior vs admin-only tooling.
- **Out of scope** explicit list (for example: no live Payload traffic if brief keeps Drizzle runtime; no AUTH_URL flip; no live Stripe; no marketing-site edits unless named).
- **Relationship to Profile streams (PM3, PM4)** and Gap Loop: what M14 adds vs what stays frozen per Ben lock (“Profile M1, Wizard, and Gap Loop M1 tests pass untouched”).
- **Relationship to `app/src/lib/evolution/collections.ts`:** Already built, do not redo ([#377](https://github.com/bjljohnson2012/field-school/issues/377)). Brief must say whether implementation extends that module, moves persistence behind it, or replaces storage only while keeping the same collection slugs (`families`, `profiles`, `milestones`, `media`) and `traitsFromDrop` contract used by `/people` and the library wizard.
- **Sealed adult profile store:** Code comment in `collections.ts` says drops must not write the sealed adult profile store. Brief must define what is sealed, who can write, and how wizard or OnboardJS saves land in Payload-shaped collections.
- **Graphify-shaped edges:** If the brief includes knowledge-graph adjacency, it must say persist model and inspectability expectations per the platform packet, not chrome-only graph UI.
- **Tenancy:** Scope by `org_id` / `membership_id` per rebuild ethos. Two rooms: household (family) and sales (team). No default to household-only desk behavior unless brief says so.

### Data and migrations

- **Whether M14 needs new SQL** in `app/db/`. If yes, the brief orders claiming the next free migration number through the dispatcher **before** writing files ([#363 section B](https://github.com/bjljohnson2012/field-school/issues/363): idempotent SQL, lazy apply like `app/src/lib/gap-loop/sql.ts`, no drizzle-kit). This prep claims no number.
- **Backfill or production scripts:** If any, only Ben runs them after guards in #363 section D. Build runs must not apply production migrations or delete data.

### Acceptance

Issue #377: “Acceptance: Set at seal.” The sealed brief must list:

- Concrete test files or scenarios in `app/scripts/` (`node --experimental-strip-types --test`).
- `npm run typecheck` and `npm run build` in `app/` pass.
- Profile M1, Assessment Wizard, and Gap Loop M1 tests still pass untouched ([#363 section B](https://github.com/bjljohnson2012/field-school/issues/363)).
- Any designer seal requirement if the brief touches people-visible UI (screenshots 1440 and 390, “Awaiting Designer seal” in PR if required by master plan).
- Stop condition for the agent (draft PR title pattern, checkpoint comment on #377, what to post when blocked).

### Merge and deploy

- **CDM MERGE GO** required before merge ([#377](https://github.com/bjljohnson2012/field-school/issues/377)).
- **No deploy** from the Grok Build run that implements M14.
- **Ben locks** from [#363 section B](https://github.com/bjljohnson2012/field-school/issues/363) apply unless Ben updates #363: no child login; no photos for people in development; homeschool is a mode not a product; no em dashes in copy; Drizzle runtime unless brief explicitly commits to Payload runtime post-spike.

### Sealed brief envelope (CDM)

When posted on #377, the comment should be identifiable as the Evolution seal (title or label agreed by CDM). It should include the `docs/staff/GROK_BOT.md` fields at minimum:

- **Clock** and **MERGE** intent for M14 (or HOLD).
- **OPEN** / **CLOSE** PR policy for this stream.
- **Project:** Field School PM (or successor id CDM names).
- **Do not** list must include rebuild locks relevant to M14 (AUTH_URL, live Stripe, Wave 2, child login, and others CDM names).
- **Human needed:** Ben-only actions (production apply, live keys, legal, LAUNCH), or `none`.

This prep does not fill those fields.

## Already built (do not redo in prep or without brief)

| Asset | Location | Notes |
| --- | --- | --- |
| Payload-shaped evolution collections and `traitsFromDrop` | `app/src/lib/evolution/collections.ts` | Merged into M6 registry per #377; used by `app/src/app/people/page.tsx`, `app/src/app/library/wizard/wizard-client.tsx` |
| Payload-shaped gap-loop descriptors | `app/src/lib/gap-loop/collections.ts` | M13 “already built” per #376; not Evolution scope unless brief says |
| M6 content registry | M6 stream | Tables M13 copies for spike only |

## Ben decisions (not guessable before M13 report and seal)

List these in the sealed brief or in a Ben comment on #377. Until then, implementation agents stop and record the gap.

| Decision | Why it waits | Evidence |
| --- | --- | --- |
| Drizzle-only Evolution vs live Payload runtime | Locked as “spike before Evolution”; M13 report is the evidence pass | [#363 section B](https://github.com/bjljohnson2012/field-school/issues/363); platform packet **Residual** on [#376 comment](https://github.com/bjljohnson2012/field-school/issues/376#issuecomment-6068407260) |
| Same Postgres vs separate DB for any admin or Payload layer | Open in packet §6 Q2; M13 residual #2 | Same comment |
| next-auth coexistence model | M13 residual #3; M8 moves identity to Postgres | #376 comment; rebuild M8 plan |
| Student Profiles vs User/Child naming in UI and schema | M13 residual #4; packet §6 Q6; Child ≠ User | #376 comment; #363 Q5 |
| Payload admin: operator-only vs parent-visible | Packet open question #3; not answered in #363 decision log | #376 comment §6 |
| What “Evolution Engine” ships in v1 (wizard hooks only vs full milestone/media persistence vs operator admin) | Issue #377 defers scope to seal; no sealed comment on #377 yet | Issue #377 body; empty #377 comments |
| Whether Graphify-shaped edges are in M14 scope or a later stream | Architecture packet ties Graphify to persist model, not chrome-only | #376 comment §4 |
| `base` and `merge_in` for M14 branch | Progress YAML `set_by_sealed_brief`; depends on which portal branches are merged when M14 starts | `docs/rebuild-progress.md` M14 row |

After M13, **Ben and CDM** may additionally decide whether Drizzle stays runtime permanently (packet lock) regardless of spike enthusiasm; that decision must appear in the sealed brief if it changes the Oct 6 lock.

## Walk order and dependencies

- **Build order:** `walk_order` places M13 before M14 before M15 (`docs/rebuild-progress.md`).
- **M13 depends on M6 and M11** (`draft_pr` or `merged` before spike).
- **M14 depends on M13** only in the YAML; practically, M14 implementation also assumes M6 registry and brains stack exist if the brief wires evolution to content and library.
- **M15** is independent of M14 in `depends_on` but shares the post-M11 fan-out lane. M15 merge gate is deploy-and-soak, not Evolution seal.

Notion master plan: [Field School Master Rebuild Run Order (Oct 8, 2026)](https://app.notion.com/p/3f3fe86f6dee81a3bf43e426f4c6967d). Portal plan cross-link: [Ground-Up Review and Build Plan](https://app.notion.com/p/3f3fe86f6dee81e8ba63faca5c9c126c). If Notion and `docs/rebuild-progress.md` conflict, the progress doc wins.

## What this prep PR does

| Does | Does not |
| --- | --- |
| Adds `docs/rebuild/m14-evolution-prep.md` | Edit `docs/rebuild-progress.md` |
| Documents sealed-brief requirements for #377 | Post the sealed brief on #377 |
| Lists Ben decisions with evidence | Implement product code, SQL, or tests |
| | Deploy, flip AUTH_URL, or enable live checkout |
| | Claim a migration number |

## Agent checklist when the seal lands

1. Confirm M13 report on #376 is posted and answers all four residuals with yes/no and evidence.
2. Confirm sealed Evolution brief on #377 is dated **after** that report.
3. Read #377 with the new comment and #363 section B.
4. Set branch from brief `base`; merge brief `merge_in` branches; never rebase or force-push (master plan).
5. Claim migration number only if brief requires SQL and dispatcher approves.
6. Open draft PR for implementation; title and acceptance from brief; await CDM MERGE GO.
7. Patch `docs/staff/state.json` on the same PR as the node only when staff loop assigns that node (not this prep).

## References

- [#377 M14 Evolution Engine](https://github.com/bjljohnson2012/field-school/issues/377)
- [#376 M13 Payload spike](https://github.com/bjljohnson2012/field-school/issues/376) and [platform reference packet comment](https://github.com/bjljohnson2012/field-school/issues/376#issuecomment-6068407260)
- [#363 Portal rebuild](https://github.com/bjljohnson2012/field-school/issues/363) sections B, D, E
- `docs/staff/GROK_BOT.md` (sealed brief paste block)
- `docs/staff/ROUTINES.md` (CDM → CTO → Cursor Gate → Field School PM)
