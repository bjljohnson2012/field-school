# Tonight

Paste the block below into Field School PM (`bc-882e8bdf`). It is the only prompt. Law and graphs on main are the rest.

---

```
Pull origin/main. Do not ask. Do not resume Wave 2. Do not open cursor/wave-N-*. Launch stays CLOSED 0/8.

You run Field School. Coordinator first. Tonight you may also be builder on one stream if spawning a sub-agent would delay the first commit. Checker is still commands. Evaluator is still a written EVALUATOR block. Do not self-PASS Launch.

READ (stop after these):
1. docs/LAW.md
2. FIELD-SCHOOL-ETHOS-MEMO.md §1 §2
3. docs/staff/COMPANY_GRAPH.md
4. docs/staff/BUILD_GRAPH.md
5. docs/staff/SHELLS.md
6. docs/staff/FACTORY_VIDEO.md
7. docs/staff/FIELD_SCHOOL_PM_LOOP.md

Inspect, do not crawl docs/campus-runtime.

JOB (frozen):
When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.
Hirer = User. Person in development is not the buyer. Two rooms: household (child login none) and team (salesperson login, not buyer). Household is not the default.

LOCKS (stop the stream if any would move):
AUTH_URL https://portal.fieldschool.ai
Dest sha256 af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4
Family LIVE bc-4765f2f0
Just 27pn9xs0zk8a73g
No child login. No fourth SKU. No live card. No public flip. No Remotion-in-Next. No Django. No Remotion MCP. No official psychometric banks. Guest /api/me stays {guest:true}. CNC vault 2.24.64.248 off. Frozen TanStack src/ off.

LOOP (automatic, this chat, until STOP):
1. Print C1-C7 and N0-N15 as PASS | READY | BLOCKED | IN_FLIGHT | HELD.
   Infer from the repo, not from memory:
   - N1 READY unless site-header.tsx already is Learn People Library Insights New and dashboard does not fetch children unless activeOrg===household.
   - C2 READY unless docs/icp-parent.md and docs/icp-leader.md both exist with ethos §4 headings.
   - Factory-slim READY unless plates/package.json has @remotion/captions AND plates/scripts/whisperx-to-captions.mjs exists AND plates/AGENTS.md says four plates only for live takes.
   - N3 BLOCKED while N1 is in flight (same file site-header.tsx).
2. Ready = deps PASS, files free, not HELD.
3. AUTO-PICK exactly two streams by this score, skip a pick if files collide:
   S1 = N1 Chrome if READY (app/src/components/site-header.tsx, app/src/app/dashboard/page.tsx)
   S2 = C2 ICP if READY (docs/icp-parent.md, docs/icp-leader.md)
   else Factory-slim if READY (plates/ only: add @remotion/captions, whisperx-to-captions.mjs, rewrite plates/AGENTS.md live catalog to Opener TalkingHead RecapCard QuizBumper + captions layer; do not render antagonist-* on a live take)
   else N2 Insights if N1 PASS (app/src/app/insights/ new files only)
   If S1 files collide with S2, drop S2, take the next disjoint pick.
   Never N1+N3. Never app/ + plates/ collision (there is none). Never three streams.
4. Each stream: one room named (household|team) OR company-prose (ICP may be two files, still one stream). One verb.
5. Implement. Budget: 1 branch per stream, ≤8 files, ≤12 rounds, stop on 2 identical verify fails.
6. CHECKER (binary):
   Code: guest GET /api/me is {guest:true} (or skip live curl if no deploy). dest file untouched. Just string still locked. grep site-header for Intent|Path|Portion|Brain|Children must be empty after N1. grep dashboard for orgs.includes("household") must be empty after N1. Sales path must not render a child card.
   Prose: job sentence present; prices only $100/$200/$1000; no child login; no Launch PASS; no em dash in new prose; no gym/street/neighborhood.
   Factory-slim: captions mapper unit-tested on a fixture word JSON; plates/package.json lists @remotion/captions; AGENTS.md live catalog is four plates.
7. EVALUATOR block per artefact (ethos §7). score PASS|FAIL|BLOCKED. Never Launch.
8. Commit or PR on cursor/n1-chrome and/or cursor/c2-icp and/or cursor/factory-slim. Update the status row in docs/staff/BUILD_GRAPH.md and COMPANY_GRAPH.md on the same branch.
9. Dean reply, then GOTO 1 immediately. Do not wait for a new chat. Do not ask whether to continue.

STOP only if: a lock would move, budget hit, two identical verify fails, NEEDS YOU (Cap take, BYOK paste, counsel), or tonight's seal is true:
Tonight seal = (N1 PASS) AND (C2 PASS OR Factory-slim PASS).
Chrome PASS alone is not enough if C2 was READY and skipped for no reason.

N1 DONE-WHEN:
Leader bar: Learn, People, Library, Insights, New. Learner bar: Learn, Me.
Banned from the bar: Lesson Tools Cart Children Progress Intent Path Portion Brain Training portal full email.
Org picker + Credits + Avatar stay.
Dashboard uses activeOrg only. Kill orgs.includes("household"). Sales desk shows zero children. Word Dashboard retired in UI if cheap; else leave the route, change the chrome.

C2 DONE-WHEN:
docs/icp-parent.md and docs/icp-leader.md. Headings: Hirer, Org, Person in development, Job, Anti-job, Trigger in force, Who we get after, Current-state fit, Quote.
Anti-job includes person-in-development as buyer, child login, fourth SKU, public-site-first.

FACTORY-SLIM DONE-WHEN:
@remotion/captions in plates. scripts/whisperx-to-captions.mjs maps WhisperX words[] to Caption[] (space before each word, ms). Fixture test. plates/AGENTS.md live take = four plates + captions layer. No new antagonist card. No remotion MCP. WhisperX CLI documented as: ffmpeg -ar 16000 then whisperx --model medium --device cpu --compute_type int8. Diarization off. Just locked. render.lock still respected.

FIRST MESSAGE IN THIS CHAT after the read:
Desired (4 lines)
Table: C# and N# statuses from inspect
Picked streams and why (score + files)
Then work. Then Dean. Then loop.
```
