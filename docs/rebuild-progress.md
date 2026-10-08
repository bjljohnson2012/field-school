# Rebuild progress

Updated: 2026-10-08 5:20 PM ET by Grok Build
Main at: 34798e56529489424f7c1b067e166b10a8570578 (PR 361)
Active agents:
- S0: feat/marketing-site-rebuild
- M5: feat/portal-m5-tenancy

migrations_claimed:
- M5: 0022

Next action: G is draft_pr (#381). It unblocks no build lane. Spawn M6 when M5 is draft_pr. Spawn M8 when M5 and S0 are draft_pr.
Blockers: none

Checked before the 0022 claim: `app/db` on origin/main ends at `0021_knowledge_gap_loop.sql`. No `0022` or higher file on any remote branch. Open rebuild PRs: none yet. Claim recorded here before any SQL is written.

```yaml
streams:
  - {id: S0,  issue: 362, branch: feat/marketing-site-rebuild,     depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: in_progress, pr: null, migration: none}
  - {id: M5,  issue: 364, branch: feat/portal-m5-tenancy,          depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: in_progress, pr: null, migration: "0022"}
  - {id: M6,  issue: 365, branch: feat/portal-m6-content-model,    depends_on: [M5],           base: feat/portal-m5-tenancy,          merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M7,  issue: 366, branch: feat/portal-m7-progress,         depends_on: [M6],           base: feat/portal-m6-content-model,    merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M8,  issue: 367, branch: feat/portal-m8-identity-billing, depends_on: [M5, S0],       base: feat/portal-m5-tenancy,          merge_in: [S0],  needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M9,  issue: 368, branch: feat/portal-m9-shell,            depends_on: [M5, M7, M8],   base: feat/portal-m8-identity-billing, merge_in: [M7],  needs_merge: true,  gate: designer_seal, status: not_started, pr: null, migration: null}
  - {id: M10, issue: 369, branch: feat/portal-m10-library,         depends_on: [M6, M9],       base: feat/portal-m9-shell,            merge_in: [],    needs_merge: true,  gate: designer_seal, status: not_started, pr: null, migration: null}
  - {id: M11, issue: 370, branch: feat/portal-m11-brains,          depends_on: [M6, M10],      base: feat/portal-m10-library,         merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M12, issue: 371, branch: feat/portal-m12-onboarding,      depends_on: [M5, M9],       base: feat/portal-m9-shell,            merge_in: [],    needs_merge: true,  gate: designer_seal, status: not_started, pr: null, migration: null}
  - {id: PM3, issue: 372, branch: feat/profile-m3,                 depends_on: [M5, M9, M11],  base: feat/portal-m11-brains,          merge_in: [],    needs_merge: true,  gate: designer_seal, status: not_started, pr: null, migration: null}
  - {id: GL2, issue: 373, branch: feat/knowledge-gap-loop-m2,      depends_on: [M5, M11],      base: feat/portal-m11-brains,          merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: PM4, issue: 374, branch: feat/profile-m4,                 depends_on: [PM3],          base: feat/profile-m3,                 merge_in: [],    needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: GL3, issue: 375, branch: feat/knowledge-gap-loop-m3,      depends_on: [M8, M12, GL2], base: feat/knowledge-gap-loop-m2,      merge_in: [M12], needs_merge: true,  gate: none, status: not_started, pr: null, migration: null}
  - {id: M13, issue: 376, branch: spike/payload-m13,               depends_on: [M6, M11],      base: feat/portal-m11-brains,          merge_in: [],    needs_merge: false, gate: never_merge_spike, status: not_started, pr: null, migration: null}
  - {id: M14, issue: 377, branch: feat/portal-m14-evolution,       depends_on: [M13],          base: set_by_sealed_brief,             merge_in: [],    needs_merge: true,  gate: sealed_brief_on_377, status: not_started, pr: null, migration: null}
  - {id: M15, issue: 378, branch: feat/portal-m15-retire,          depends_on: [M9, M10, M11], base: feat/portal-m11-brains,          merge_in: [],    needs_merge: true,  gate: merge_after_m9_m11_deployed_and_soaked, status: not_started, pr: null, migration: null}
  - {id: G,   issue: 379, branch: feat/portal-go-live,             depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: draft_pr, pr: 381, migration: none}
walk_order: [S0, M5, G, M6, M7, M8, M9, M10, M11, M12, PM3, GL2, PM4, GL3, M13, M14, M15]
ben_merge_order: [S0, M5, M6, M7, M8, G, M9, M10, M11, M12, PM3, GL2, PM4, GL3, M15]
```

M13 is never merged. M14 stays not_started until #377 has a sealed brief posted after the M13 report. M15 is built when its depends_on are draft_pr. Ben merges M15 only after M9 to M11 are deployed and soaked.

## Log

- 2026-10-08 4:47 PM ET dispatcher: Read the master plan, #363, and #362. Main is 34798e5 (PR 361). No rebuild PRs merged. Opened #379 for stream G. Claimed migration 0022 for M5. Started wave 1 (S0, M5, G).
- 2026-10-08 4:50 PM ET dispatcher: Progress log is draft PR #380. Rebuild progress comment on #363 is 6068778012. Wave 1 agents are in isolated worktrees.
- 2026-10-08 5:20 PM ET G: draft PR #381 at 9e8526d. Migration none. Flip test and local smoke passed. typecheck and build passed. npm test reported 420 pass and 36 fail on files this branch does not change. No new lane is ready. Ben merges G after M8.

## Handoff

Not stopping. Wave 1 is in progress. If this dispatcher stops, restart with: continue the master rebuild from docs/rebuild-progress.md

Worktrees (do not delete while the agent is running):
- S0: /Users/Owner/field-school-worktrees/s0 on feat/marketing-site-rebuild. Agent 01a11d48-02ef-7472-9a30-95ba3094e115. Status file /tmp/rebuild-status-S0.md
- M5: /Users/Owner/field-school-worktrees/m5 on feat/portal-m5-tenancy. Agent 01a11d48-02f1-7e73-895a-48288dded7ea. Status file /tmp/rebuild-status-M5.md. Migration 0022 claimed.
- G: done. Draft PR #381, branch feat/portal-go-live, last commit 9e8526d. Status file /tmp/rebuild-status-G.md. Ben steps are on the PR checkpoint comment.

Do not push these branches to main. They have no upstream on purpose.
