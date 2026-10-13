# Rebuild progress

Updated: 2026-10-13 2:20 PM ET by Grok Build
Main at: 34798e56529489424f7c1b067e166b10a8570578 (PR 361)
Active agents: none

migrations_claimed:
- M5: 0022

Next action: Halt. S0 and M5 are blocked, not acceptance-green. Do not spawn M6 or M8. Do not merge. Do not deploy. Ben restarts with: continue the master rebuild from docs/rebuild-progress.md
Blockers:
- S0: Grok Build usage balance exhausted (HTTP 402) before acceptance. WIP draft PR #382 at 0a39714. Hold M8 until a fresh agent finishes S0 and the status is draft_pr.
- M5: same 402 stop before acceptance. WIP draft PR #383 at 54f3855. Migration 0022 is in that branch. Hold M6 and M8 until a fresh agent finishes M5 and the status is draft_pr.

Checked before the 0022 claim: `app/db` on origin/main ends at `0021_knowledge_gap_loop.sql`. No `0022` or higher file on any remote branch. Open rebuild PRs: none yet. Claim recorded here before any SQL is written.

```yaml
streams:
  - {id: S0,  issue: 362, branch: feat/marketing-site-rebuild,     depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: blocked, pr: 382, migration: none}
  - {id: M5,  issue: 364, branch: feat/portal-m5-tenancy,          depends_on: [],             base: main,                            merge_in: [],    needs_merge: false, gate: none, status: blocked, pr: 383, migration: "0022"}
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
- 2026-10-08 evening: S0 agent 01a11d48-02ef-7472-9a30-95ba3094e115 and M5 agent 01a11d48-02f1-7e73-895a-48288dded7ea failed with HTTP 402, usage balance exhausted. No status files were written. Working trees were later committed as WIP and pushed.
- 2026-10-13 2:20 PM ET dispatcher: Halt. No merge. No deploy. WIP draft PR #382 (S0, 0a39714) and #383 (M5, 54f3855). Both stay blocked so M6 and M8 are not spawned. G stays #381 and still merges only after M8.

## Handoff

Context stopped because the stream agents hit HTTP 402 (Grok Build usage balance exhausted) before acceptance. Restart with: continue the master rebuild from docs/rebuild-progress.md

On restart: fetch, read this file, mark anything Ben has merged, and spawn a fresh agent for S0 and for M5 from the WIP commits below. Do not treat #382 or #383 as draft_pr until acceptance passes and the checkpoint comment is posted. Do not spawn M6 or M8 while those two are blocked. Do not merge. Do not deploy.

- S0: blocked. Draft PR #382. Branch feat/marketing-site-rebuild. Last commit 0a39714. Worktree /Users/Owner/field-school-worktrees/s0. Marketing pages, portal pricing and cart, checkout switch, and tests are in the commit. Acceptance (typecheck, build, npm test, Lighthouse, screenshots at 1440 and 390) was not recorded green. Next step: finish acceptance on this branch, fix failures, post the section 7 checkpoint, then set status to draft_pr.
- M5: blocked. Draft PR #383. Branch feat/portal-m5-tenancy. Last commit 54f3855. Worktree /Users/Owner/field-school-worktrees/m5. Migration 0022 is app/db/0022_tenancy.sql. This branch also edits app/db/0004_tenants.sql so the household seed does not flip a family row back to homeschool. Next step: finish access tests and acceptance on this branch, post the section 7 checkpoint, then set status to draft_pr. Do not run --apply against production.
- G: draft_pr. PR #381. Branch feat/portal-go-live. Last commit 9e8526d. Ben merges this after M8. Ben steps are on the PR checkpoint comment.

Ben runs now: nothing. Do not merge #380, #381, #382, or #383. Do not deploy. Do not flip AUTH_URL. Do not run a live Stripe key.
