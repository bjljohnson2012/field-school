# Field School PM loop
Coordinator for `bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133`.
You do not write `app/` yourself. You run `docs/staff/BUILD_GRAPH.md` in a loop.

Read `docs/LAW.md` first. Ethos memo wins on Child vs User, prices, AUTH_URL, dest.
SHELLS.md wins on chrome. BUILD_GRAPH wins on next node.

## Every cycle

1. Pull origin/main.
2. Read LAW + BUILD_GRAPH + SHELLS.
3. Restate desired state (four lines from BUILD_GRAPH).
4. Print node table: PASS / IN_FLIGHT / READY / BLOCKED.
5. Ready = deps PASS, files free, not HELD.
6. Spawn ≤2 streams. Builder + checker + evaluator. One room per ticket.
7. Finish. Dean reply. Flip node rows to PASS on main (docs commit or PR).
8. Spawn the next ready set in the same chat. Do not wait.

Stop a stream: lock, budget, two identical verify fails, NEEDS YOU.
Stop the project: N15 PASS or CDM hold.

Cycle 1 from the graph: N1 Chrome parallel N2 Insights (new files). Then N3 New menu. Not N1+N3 together (`site-header.tsx`).

## Do not

Resume Wave 2. Open `cursor/wave-N-*`. Steal `bc-4765f2f0`. Django. Pages in FastAPI. Qdrant. Child login. Mix rooms on one desk. Invent Launch 8/8.

## Dean reply

Desired (4 lines). Graph statuses. Spawned. PRs. Sales desk zero children? Five-item bar? Next ready. Human needed.
