# Field School Ethos Memo
For agents. Read this before writing a ticket, a store file, a PR, a score, or a PASS claim.
Date locked: 21 Sep 2026
Status: Ethos only. This file does not grant Launch PASS. Score stays 0/8.
Staff wire: CDM → CTO → Cursor Gate → Field School PM
Restart rule: a new session resumes from this memo plus the current ticket. Standing hashes live in `docs/prelaunch/LAUNCH_GATE.md`. Do not copy gate files into prose.

---

## 0. How to use this file

| You are | You do | You do not |
| --- | --- | --- |
| Grok / CDM | Translate the job into one ticket. Score leave-behind. | Edit the repo. Write PASS. |
| Cursor Gate | Accept or reject the ticket against §2 and §8. | Invent product. Soften a forbid. |
| Builder (Cursor) | One verb. One branch. Stop on verify or budget. | Read eight seats and “improve” them. |
| Evaluator | Grade the artefact against the job sentence and the seat’s done-when. | Rewrite the work. Grant Launch. |
| Checker | Run the verify command or the yes/no list. Binary only. | Interpret. Coach. Expand scope. |
| Notion / ops seat | Update company state when a SHA, contradiction, or `NEEDS YOU` lands. | Open a second code stream. |

If two documents disagree, this order wins: standing locks (§2) → job sentence (§1) → this memo → the week’s ExecPlan → the ticket. A ticket cannot override a lock.

---

## 1. The job (frozen)

Jobs-to-be-Done is the company language. Every seat is a translation of one sentence.

**When the week has no next portion, the parent hires Learn with Ben so a selected Child keeps moving.**

North Star you can count:

A paying parent, signed in at https://portal.fieldschool.ai, selects one Child, and that Child moves through play → hire record → progress → intent → assembled path → next portion.

People in the job:

- The parent is the User. The parent owns the hire, the intent, the path, and the lock or override of the next portion.
- The Child is a progress record: `kind:child`, `login:none`, `user:false`. No child login. No child seat.
- Household org is not the sales org.

Four forces. Do not rename them.

| Force | Company fact | Agent move |
| --- | --- | --- |
| Push | The week has no next portion | Open on this moment only |
| Pull | Parent-owned path. Child keeps moving | Build and sell that progress |
| Anxiety | Child login, extra SKU, live card, public claim before 8/8 | Stop. Do not soothe with a new feature |
| Habit | Unstructured week, extra tutor, another worksheet | Name these as alternatives. Do not copy them |

Job story form every file must be able to repeat:

`When [situation], I want [progress], so I can [outcome].`

Illegal synonyms for Child: student, kid account, learner login, user seat, child user. If a draft uses one of those, the draft has two jobs. Fail it.

---

## 2. Standing locks

These do not move in a ticket, a store file, or a “small exception.”

- Prices: $100 / $200 / $1,000 per month. Homeschool is a mode on the existing parent User. No new SKU. No child seat. No live card charge.
- AUTH_URL: https://portal.fieldschool.ai
- Public site stays as it is. Distribute stays HELD.
- Family LIVE stays on `bc-4765f2f0` (PR 50). Family files are a different lane.
- Master dest sha256 `af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4` stays untouched.
- Launch stays CLOSED. Count stays 0/8 until each of the eight nodes has an explicit PASS written by CDM against the gate file. This memo is not that PASS.
- One code stream while hire-path is open: `bc-2ed44fed`. No second coder on that branch.
- Hire-path `/intent` and `/progress` do not write `learning_intents`. Path assembly does not write `curriculum_paths`.
- Guest `/api/me` stays `{guest:true}`. `edit/health` stays 200.

A hold keeps the public claim closed. A hold does not stop the week’s work.

---

## 3. Countable inputs

Score these. Do not invent a seventh.

1. Hired parent signed in at AUTH_URL
2. Child selected (progress record, not a seat)
3. Play completed on the locked LessonSpine
4. Intent recorded as parent-owned
5. Path assembled for that Child
6. Next portion shown, then locked or overridden by the parent

Product done-when for the current node: one signed-in parent session emits all six. Tests that were unfilled on PR 196/197 get filled. Dest hash unchanged.

---

## 4. Seat translations

Each seat owns one artefact. Each artefact must still say the job sentence. None of these artefacts is a Launch PASS.

### Product
Artefact: working loop in the portal, plus the ticket leave-behind.
Done-when: the six events fire in one session. Child stays `kind:child`. Guest stays guest.
Forbidden help: Remotion-in-Next, Cap take, Distribute, Launch 8/8, family files.

### ICP
Artefact: `docs/icp-parent.md`
Headings only: Buyer, Job, Anti-job, Trigger, Quote, Household org ≠ sales org.
Buyer = paying parent. Anti-job = child login, extra SKU, school-district buyer. Trigger = week has no next portion. No market count. No second audience.

### Brand
Artefact: `docs/brand-parent-hire.md`
Must use: foundry, stations, field work; charcoal / cream / olive; Fraunces where plates already lock it; “child” as a child.
Must never use: gym wording, street, neighborhood, student login, kid account.
Brand is distinctive assets for the job. Not a new metaphor.

### Offer
Artefact: `docs/offer-learn-with-ben.md`
Value metric: parent-owned supervised hours on the parent User. Not seats.
Three amounts only. Each row names the hour that amount already is. Homeschool = mode. Metering = credits or BYOK, $0 added. No live card proof required in copy because no live card is taken.

### Marketing
Artefact: `docs/marketing-parent-hire.md`
Category entry point: the child is waiting on the next portion.
Five blocks in this order: the job, three prices, portal URL, Child as progress record, what the parent does next.
Public site unflipped. Pack must be sendable by a human.

### Sales
Artefact: `docs/sales-learn-with-ben.md`
Help the parent buy. Do not help a seat sell.
Path: interest → `/checkout?plan=100|200|1000` → portal sign-in → select Child.
Name the alternatives: unstructured week, extra tutor SKU, child-login app.
Two questions before close: “Does this keep the Child moving the way you described?” and “What would need to be true for you to hire this week?”
Stop rules: another price, a child login, a request to take the card, a request to flip the public site. No ads.

### Legal
Artefact: `docs/legal-parent-child.md`
Spine: FTC COPPA six-step. 2025 Rule amendments already in force (22 Apr 2026).
Yes/no lines: User is the parent; Child has no login; a name on a progress record can still be personal information; parent can review and delete; no third-party disclosure without separate consent; written retention stance; written security stance; counsel has not signed; `/privacy` and `/terms` stay until Ben signs a Gate brief.
Do not load Legal Twitter. Do not rewrite policy.

### Plan
Artefact: the week’s ExecPlan and Sunday’s twenty lines.
One code stream. Eight owners. Three lanes. Decision log. Surprises. One next action.
Green node: one line. Red node: contradiction + owner. Store docs are evidence of work, not PASS.

---

## 5. How the company runs the job

These are not new audiences. They are how the job survives a session change.

### Intelligent ops
Keep work moving without the chair in every loop.
Three stream types only: Outcomes, Loops, Left Open.
The state that pages a human is `NEEDS YOU`. Everything else runs.
CDM is called for taste or a lock. Not for status.

Autonomy levels (assign one per task):

| Level | Where it applies |
| --- | --- |
| High | Prose drafts inside a store file, given the heading list |
| Gated | Hire-path builder on an approved ticket |
| Human-as-a-must | Dest, AUTH_URL, prices, family LIVE, Launch PASS, `/privacy` `/terms`, live card |

### Notion
Company map. Context windows die. Notion does not.
Live here: ExecPlan, eight store files, ticket, leave-behind, Sunday score, `NEEDS YOU`.
Agents update the map when a merge SHA, a failed verify, or a contradiction lands.
Cursor does not own Notion state.

### Scalability
Add completed household loops. Do not add seats, SKUs, login types, or parallel builders on the same branch.
Scale unit: one ticket, one branch, ≤8 files, ≤12 rounds, stop on 2 identical verify failures.
A long single run that re-proves standing hashes is not scale.

### Data
The six inputs are the schema. Two lanes stay two datasets.
Hire-path does not write `learning_intents`. Path assembly does not write `curriculum_paths`.
Guest and health checks are binary. Dashboards are not a substitute for those two.

### Mathematics
Frozen arithmetic. If the formula changes, the job changed.

- Three prices. No fourth.
- Metric = parent-owned hours, not child seats.
- Metering = credits or BYOK. Adds $0.
- Ticket budget = 1 / 8 / 12 / 2 as above.
- Launch score = k/8 with k explicit. Today k = 0.

### Engineering
Implement the next slice of the hired path.
Acceptance test language: “parent can lock or override the next portion for the selected Child.”
Not: “add path assembly polish.”
One verb per ticket. Misses go into `AGENTS.md` or a skill. Do not silently patch and move on.
Production paths that touch auth, money, or child records take a higher bar than throwaway code.

### AI
Runs inner loops. Does not author the job.
Three altitudes only:

1. Grok writes the ticket from §1
2. Cursor runs the inner loop against verify
3. Notion / ops updates the map

No fourth model “helps Brand.” No self-PASS. The builder does not grade its own homework.

---

## 6. File lanes

| Lane | Who writes | Leaves alone |
| --- | --- | --- |
| Hire path | `bc-2ed44fed` only | Family files, dest, AUTH_URL, public site, company store files, new prices |
| Family | `bc-4765f2f0` on PR 50 | Hire-path branch, dest, Launch PASS lines, store files |
| Eight functions + ops | Named seats, store files and this memo | `app/`, `plates/`, hire-path branch, family files, `deploy-site.sh`, `LAUNCH_GATE.md` |

Campus family-store (PR 42 and kin) stays undeployed and four-model held. It is not next-portion storage. It is not a second coder.

---

## 7. Evaluator and checker contract

Assign these as separate roles. Do not collapse them into the builder.

### Evaluator (skilled judgment)
Input: artefact + this memo + the seat row in §4.
Output: PASS / FAIL / BLOCKED for that artefact only. Never for Launch.
A PASS here means “this file or diff keeps the job.” It does not move 0/8.

Score against:

1. Job sentence present and unmutated
2. Child still a progress record
3. No illegal synonym
4. Seat headings or done-when met
5. No lock from §2 touched
6. One artefact, one job

Return format:

```
EVALUATOR
seat:
artefact:
job-sentence-ok: yes|no
child-record-ok: yes|no
lock-ok: yes|no
score: PASS|FAIL|BLOCKED
evidence:
- 
contradiction:
next:
```

BLOCKED means a missing fact, not a taste dispute. Send `NEEDS YOU`.

### Checker (binary)
Input: the ticket’s `verify` command, or a yes/no list from Legal / Offer / Brand.
Output: exit 0 or exit 1. Paste the command output. No narrative.

Required checks when the artefact is code:

- Guest `/api/me` returns `{guest:true}`
- `edit/health` returns 200
- Named tests exist and pass
- Dest sha256 unchanged
- Forbid paths unlisted in the diff

Required checks when the artefact is prose:

- Job sentence appears
- Prices only $100 / $200 / $1,000
- No child login
- Brand must-never list clean
- No PASS language

Stagnation rule: two identical checker failures end the session. New ticket. No third try in the same context.

### Builder stop rules
Stop and leave a leave-behind when any of these fire:

1. Checker exit 0
2. Forbid path touched
3. Budget hit (12 rounds or 8 files)
4. Two identical failures
5. A lock would have to move to continue

Leave-behind shape:

```
LEAVE-BEHIND
ticket:
files:
verify:
result: done|stopped|blocked
next-action: <one verb, one line>
```

The builder may propose the next-action line. Grok accepts or throws it away. The builder does not name a company milestone.

---

## 8. Ticket shape Grok writes

One verb. If the sentence contains “and then,” split it.

```
id:
stream: bc-2ed44fed
opens:
goal: <one verb>
done-when:
  -
forbid:
  - family-v1-home.tsx
  - children-database.tsx
  - family /api/curriculum
  - curriculum_paths
  - dest file
  - AUTH_URL
  - public site
  - company store files
  - new price, new SKU, child login
budget:
  - max 1 branch
  - max 8 files
  - max 12 rounds
  - stop on 2 identical verify failures
verify: <exact command>
stop-if: forbid touched | dest changed | AUTH_URL changed | tests still missing after 12
leave-behind: files, verify output, next-action one line
evaluator: <seat skill>
checker: <binary skill>
```

Gate rejects a ticket that lacks `verify`, `forbid`, or `budget`.

---

## 9. Language lock

Write like the foundry. Short sentences. Concrete nouns. Verbs that name the action: hire, select, lock, override, stop, reject, score.

Banned in company prose and in agent output:

- student login, kid account, learner user, child seat
- gym, street, neighborhood (parent-facing copy)
- fourth price, live card charge, flip the public site
- Launch PASS, 8/8, “ready to announce”
- market count, second audience
- em dashes in original prose
- sentences that start with “I”

Foundry words that stay: foundry, stations, field work, charcoal, cream, olive, Fraunces, parent, Child, hire, portion, path, intent.

---

## 10. Canon (one URL per file, optional)

Agents do not need these to score. Humans may load one.

| Seat | URL |
| --- | --- |
| Product / Eng loop | https://x.com/addyosmani/article/2064127981161959567 |
| Plan / outer loop | https://x.com/addyosmani/article/2074927530482835916 |
| Autonomy levels | https://x.com/addyosmani/article/2072885435312042327 |
| ICP | https://x.com/paulsyng/status/2044747665620312218 |
| Brand recognition | https://x.com/web3righteous/status/1944709506727895428 |
| Offer / credits | https://x.com/i/article/2092974442486116352 |
| Marketing CEP | https://x.com/semrush/status/2100216388853866869 |
| Sales mechanism | https://x.com/heyblake/status/2099966234842505439 |
| Ops map | https://x.com/danpeguine/status/2099586010828923247 |
| Notion agents | https://x.com/NotionDevs/status/2054600524423733307 |
| Cadence | https://x.com/Austen/status/1595285676378902528 |
| Constraints | https://x.com/addyosmani/status/2085618113199133067 |
| Eng bar | https://x.com/addyosmani/status/2098662421644853433 |
| Legal | FTC COPPA six-step only. No X. |

---

## 11. Current open node (facts, not a PASS)

Path assembly PR 196 merged. Next portion PR 197 merged. Tests on that work were still unfilled as of 21 Sep 2026.
Open product verb: seal those tests, confirm guest and health, then run one household-loop session against the six inputs.
Open prose verb: write the store file for the seat, to the headings in §4.
Launch remains CLOSED. Score remains 0/8.

---

## 12. Fail phrases

Reject work that says any of the following:

- “Also add a child login while we are here”
- “A fourth tier for homeschool”
- “Flip the public site so parents can find us”
- “Write learning_intents from hire-path”
- “Family store can hold next portion”
- “This store doc is a node PASS”
- “Launch is close enough”

Accept work that keeps one hire, one parent User, one Child record, three prices, and the next portion under parent lock.
