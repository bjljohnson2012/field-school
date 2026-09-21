# Field School Ethos Memo
For agents. Read this before writing a ticket, a store file, a PR, a score, or a PASS claim.
Revision: 21 Sep 2026 mid-build tandem. Household and team run together. Locks did not move.
Status: Ethos only. This file does not grant Launch PASS. Score stays 0/8.
Staff wire: CDM → CTO → Cursor Gate → Field School PM
Project: Field School PM (`bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133`)
Restart rule: a new session resumes from this memo plus the current ticket. Do not restart campus waves or merged hire-path work to match new wording.
Standing hashes live in `docs/prelaunch/LAUNCH_GATE.md`. Do not copy gate files into prose.

---

## 0. How to use this file

Mid-build rule: this revision names the job more accurately. It does not open a new product. Merged PRs 196 and 197 stay. Wave proofs stay. Family LIVE stays on its lane. Seal what is already built. Do not rebuild to fit the sentence.

Rooms run in tandem. Household is not the default. Team is not "after household." A ticket still names one room. Field School PM may run two streams at once only when the files cannot collide. A third stream is forbidden.

| You are | You do | You do not |
| --- | --- | --- |
| Grok / CDM | Translate the job into one ticket. Score leave-behind. | Edit the repo. Write PASS. |
| Field School PM | Plan, isolate, fan three roles, merge proofs, stop. | Write `app/` yourself. Invent the next wave. |
| Cursor Gate | Accept or reject the ticket against §2 and §8. | Invent product. Soften a forbid. |
| Builder | One verb. One room. One branch. Stop on verify or budget. | Rewrite the job. Read eight seats and “improve” them. |
| Evaluator | Grade the artefact against §1 and the seat’s done-when. | Rewrite the work. Grant Launch. |
| Checker | Run verify or the yes/no list. Binary only. | Interpret. Coach. Expand scope. |
| Notion / ops | Update company state when a SHA, contradiction, or `NEEDS YOU` lands. | Open a third stream. Put two rooms on one branch. |

If two documents disagree, this order wins: standing locks (§2) → job + room in the ticket (§1) → this memo → campus wave docs → the ticket. A ticket cannot override a lock. A wider job cannot authorize a child login or a fourth price.

---

## 1. The job

Jobs-to-be-Done is the company language. Development is the company noun. Formation is a shade, not the ticket word.

**When I am accountable for people’s development and for the organization’s success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.**

That is the working job. ICP may sharpen it. Builder may not.

### Pattern (every room)

| Role | Meaning |
| --- | --- |
| Hirer | User. Pays. Owns intent, path, lock or override. Accountable for people and for the org. |
| Organization | The body that must get better. A household is an organization. A sales team is an organization. |
| Person in development | Not the buyer. Moves on a path fit to personality, skill, and current state. |
| When the hirer is absent | The next portion still runs. If nothing happens when nobody is talking, the job failed. |

### Two rooms. One job. Do not merge the files.

| Room | Organization | Hirer | Person in development | Offer in force |
| --- | --- | --- | --- | --- |
| Household | The family | Parent | Child: `kind:child`, `login:none`, `user:false` | Learn with Ben at $100 / $200 / $1,000 |
| Team | The book of business / the shop | Leader | Teammate. May sign in to work. Does not buy. Does not own the path. | Same portal, org-scoped membership |

A ticket names one room. Household work does not invent teammate checkout. Team work does not rewrite Child identity. Both rooms may be in flight the same week.

Learn with Ben is the household offer. It is not the whole company. Team uses the same portal and org-scoped membership. Do not invent a team price this week.

### Trigger now in force

The next step is missing or untrustworthy, and development stalls when the hirer leaves the room.

"No next portion" is the household mechanism for that trigger. It is not the job.

### Personalization (allowed meaning)

Path and next portion use current state already in hand: intent, progress, existing Field Pattern / living profile, skill, what they just did.

Not allowed unless Gate names it: a second item bank; official MBTI / Enneagram / Gallup / Wiley text; child login so they can "personalize themselves"; the person in development owning the path because a quiz said so.

### Four forces

| Force | Company fact | Agent move |
| --- | --- | --- |
| Push | They are not getting better when I am not in the room. The org feels it. | Open on the stalled next step. |
| Pull | Each person moves on a path fit to current state. They get better. The org gets better. | Build that path. Sell that progress. |
| Anxiety | Platform becomes the parent. Generic LMS. Quiz-as-product. Fourth SKU. Live card. Public claim. | Stop. Do not soothe with a new feature. |
| Habit | Worksheets, hope, standup theater, another deck | Name these as alternatives. Do not copy them. |

### Who we get after (inside a room)

1. Same hirer, same org, higher intensity
2. Same hirer, second person in development
3. Another hirer whose org already looks like this room
4. An operator of many orgs — new ICP file, only after that room has loops that take when the hirer is absent

Team is not step 4 of household. Team is the other room, already on campus. Grow both. Do not skip either room to chase operators.

### Illegal

- Treating the person in development as the customer
- Household: student, kid account, learner login, user seat, child user
- "True personalized L&D" as a ticket goal
- A new SKU so the team room can have its own price this week

Job story form: `When [situation], I want [progress], so I can [outcome].`

---

## 2. Standing locks

These do not move because the job got bigger.

- Learn with Ben prices: $100 / $200 / $1,000 per month. Homeschool is a mode on the existing parent User. No new household SKU. No child seat. No live card charge.
- AUTH_URL: https://portal.fieldschool.ai
- Public site stays as it is. Distribute stays HELD.
- Family LIVE stays on `bc-4765f2f0` (PR 50). Family files are a different lane.
- Master dest sha256 `af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4` stays untouched.
- Launch stays CLOSED. Count stays 0/8. This memo is not that PASS.
- Hire-path household stream while that work is open: `bc-2ed44fed`. No second coder on that branch. A team stream may run in parallel only on files that do not overlap hire-path or family LIVE.
- Hire-path `/intent` and `/progress` do not write `learning_intents`. Path assembly does not write `curriculum_paths`.
- Guest `/api/me` stays `{guest:true}`. `edit/health` stays 200.
- No second Field Pattern bank. No official psychometric item text.

A hold keeps the public claim closed. A hold does not stop the week’s work. A wider job does not stop the seal.

---

## 3. Countable inputs

Two rooms. Two scoreboards. Do not invent a seventh on either. Do not mix rooms in one ticket.

### Household

1. Hired parent signed in at AUTH_URL
2. Child selected (progress record, not a seat)
3. Play completed on the locked LessonSpine
4. Intent recorded as parent-owned
5. Path assembled for that Child
6. Next portion shown, then locked or overridden by the parent

### Team

1. Hired leader signed in at AUTH_URL
2. Teammate selected (membership, not the buyer)
3. Work / play completed on the locked LessonSpine
4. Intent recorded as leader-owned
5. Path assembled for that teammate
6. Next portion shown, then locked or overridden by the leader

The sixth event in both rooms is "development continues when the hirer is not talking." If 1–5 work and 6 does not, that room is still open.

Household product seal: tests unfilled on PR 196/197 get filled. Dest hash unchanged.
Team product seal: the same six in a leader session, on files that do not overlap the hire-path branch or family LIVE.

---

## 4. Seat translations

Each seat owns one artefact. Name the room. None of these artefacts is a Launch PASS.

### Product
Artefact: working loop in the named room, plus the ticket leave-behind.
Household done-when: household six fire in one parent session. Child stays `kind:child`. Guest stays guest.
Team done-when: team six fire in one leader session. Teammate is not the buyer. Teammate does not own the path.
Both: next portion runs without a new conversation.
Forbidden help: Remotion-in-Next, Cap take, Distribute, Launch 8/8, family files, FR-KB-1 unless Gate names it, a second Pattern bank, two rooms in one diff.

### ICP
Artefact: `docs/icp-parent.md` and `docs/icp-leader.md`. Both may exist this week. Separate files.
Headings: Hirer, Org, Person in development, Job, Anti-job, Trigger in force, Who we get after, Current-state fit, Quote.
Anti-job: person-in-development as buyer, district/HR seat dump, quiz-as-product, fourth SKU, public-site-first.
Do not write two ICPs in one file. Do not wait for one room before starting the other file.

### Brand
Artefact: `docs/brand-parent-hire.md` for household.
Must use: foundry, stations, field work; charcoal / cream / olive; Fraunces where plates already lock it; "child" as a child; "development" as the job noun.
Must never use: gym wording, street, neighborhood, student login, kid account, "formation" in parent-facing or sales-facing copy.
Brand is distinctive assets. Not a new metaphor for the wider job.

### Offer
Artefact: `docs/offer-learn-with-ben.md`
Household value metric: parent-owned supervised hours on the parent User. Not seats.
Three amounts only. Each row names the hour that amount already is. Homeschool = mode. Metering = credits or BYOK, $0 added.
Do not invent a team price in this file.

### Marketing
Artefact: `docs/marketing-parent-hire.md`
Household CEP: development stalls when the parent leaves the room / the child is waiting on the next portion.
Five blocks: the job, three prices, portal URL, Child as progress record, what the parent does next.
Public site unflipped.

### Sales
Artefact: `docs/sales-learn-with-ben.md`
Help the hirer invest. Household path: interest → `/checkout?plan=100|200|1000` → portal sign-in → select Child.
Name alternatives: unstructured week, extra tutor SKU, child-login app, "we sent the course."
Questions: "Does this keep them moving when you are not in the room?" and "What would need to be true for you to invest this week?"
Stop: another household price, a child login, take the card, flip the public site. No ads.

### Legal
Artefact: `docs/legal-parent-child.md`
Household spine: FTC COPPA six-step. 2025 Rule amendments in force (22 Apr 2026).
Yes/no: User is the parent; Child has no login; a name on a progress record can still be personal information; parent can review and delete; no third-party disclosure without separate consent; written retention; written security; counsel has not signed; `/privacy` and `/terms` stay until Ben signs a Gate brief.
Team-room legal is a different file, later. Do not rewrite policy to "cover both" in one pass.

### Plan
Artefact: the week’s ExecPlan and Sunday’s twenty lines.
Sunday scores both rooms. For each: did a person move when the hirer was absent; did anyone treat the person in development as the customer. Do not declare household "ahead" so team can wait.
Store docs are evidence of work, not PASS.

---

## 5. How the company runs the job

### Intelligent ops
Keep work moving without the chair in every loop. That is the company version of the product clause "even when I am not talking to them."
Three stream types: Outcomes, Loops, Left Open. State that pages a human: `NEEDS YOU`.
CDM is called for taste or a lock.

Autonomy: High = prose in a store file. Gated = hire-path builder on an approved ticket. Human-as-a-must = dest, AUTH_URL, prices, family LIVE, Launch PASS, `/privacy` `/terms`, live card, new item bank.

### Notion
Company map: ExecPlan, store files, ticket, leave-behind, Sunday score, `NEEDS YOU`.
Cursor does not own Notion state.

### Scalability
Add completed loops in both rooms that take when the hirer is absent. Do not add seats, SKUs, login types, or two builders on the same branch.
Scale unit: one ticket, one room, one branch, ≤8 files, ≤12 rounds, stop on 2 identical verify failures.
Tandem unit: two tickets, two rooms, two branches, files must not overlap. Third ticket waits.

### Data
Household six and team six are both live schemas. Do not write household events into team rows or the reverse.
Two lanes stay two datasets. Hire-path does not write `learning_intents`. Path assembly does not write `curriculum_paths`.

### Mathematics
- Three household prices. No fourth.
- Household metric = parent-owned hours, not child seats.
- Metering = credits or BYOK. Adds $0.
- Ticket budget = 1 / 8 / 12 / 2.
- Launch score = k/8. Today k = 0.

### Engineering
Implement the next slice in the named room.
Household acceptance: parent can lock or override the next portion for the selected Child, and that portion is available without a new conversation.
Team acceptance: leader can lock or override the next portion for the selected teammate, and that portion is available without a new conversation.
One verb per ticket. Misses go into `AGENTS.md` or a skill.

### AI
Runs inner loops. Does not author the job.
1. Grok / Gate writes the ticket from §1
2. Builder runs the inner loop against verify
3. Checker then evaluator
4. Notion / ops updates the map

No fourth model "helps Brand." No self-PASS.

---

## 6. File lanes

| Lane | Who writes | Leaves alone |
| --- | --- | --- |
| Hire path (household) | `bc-2ed44fed` only | Family files, dest, AUTH_URL, public site, team-only files, company store files, new prices |
| Team loop | Second Field School PM stream. Files that are not hire-path and not family LIVE. | Hire-path branch, family LIVE, dest, AUTH_URL, Child identity, new prices |
| Family | `bc-4765f2f0` on PR 50 | Hire-path branch, team loop files, dest, Launch PASS lines, store files |
| Eight functions + ops | Named seats, store files and this memo | `app/`, `plates/`, hire-path branch, team loop files, family files, `deploy-site.sh`, `LAUNCH_GATE.md` |

Campus family-store (PR 42 and kin) stays undeployed and four-model held. It is not next-portion storage. It is not a second coder.
PR 198 (FR-KB-1 knowledge brain) stays held until Gate names it. Knowledge brain is not the seal.

---

## 7. Evaluator and checker contract

Three isolated roles. Field School PM assigns all three. Do not collapse them into the builder.

### Evaluator
Input: artefact + this memo + the seat row in §4 + the room named in the ticket.
Output: PASS / FAIL / BLOCKED for that artefact only. Never for Launch.

Score against:

1. Working job present. Room named.
2. Hirer is the User. Person in development is not the buyer.
3. Household: Child still a progress record with no login.
4. Seat headings or done-when met.
5. No lock from §2 touched.
6. Personalization = current-state fit, not a new bank.
7. One artefact, one room, one job.

```
EVALUATOR
seat:
room: household|team
artefact:
job-sentence-ok: yes|no
hirer-is-user-ok: yes|no
person-not-buyer-ok: yes|no
child-record-ok: yes|n/a|no
lock-ok: yes|no
absent-hirer-ok: yes|no
score: PASS|FAIL|BLOCKED
evidence:
-
contradiction:
next:
```

`eval-icp-job` is the only skill that may propose a new job sentence. Proposal must name hirer, org, person in development, room, trigger, who after, what current-state means this week, what happens when the hirer is absent, which lock would move. Lock-move → BLOCKED, `NEEDS YOU`.

### Checker
Exit 0 or 1. Raw output. No story.

Code: guest `/api/me` is `{guest:true}`; `edit/health` is 200; named tests pass; dest unchanged; forbid paths absent.

Prose: job sentence present; household prices only $100 / $200 / $1,000; no child login; brand must-never list clean; no PASS language; no "true personalized L&D" as a feature name.

Two identical failures end the stream.

### Builder stop
Stop on checker exit 0, forbid touched, budget hit, two identical failures, or a lock that would have to move.

```
LEAVE-BEHIND
ticket:
room:
files:
verify:
result: done|stopped|blocked
next-action: <one verb, one line>
```

---

## 8. Ticket shape

One verb. One room. If the sentence contains "and then," split it.

```
id:
stream: bc-2ed44fed | team-stream
room: household|team
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
  - second Pattern bank
budget:
  - max 1 branch
  - max 8 files
  - max 12 rounds
  - stop on 2 identical verify failures
verify: <exact command>
stop-if: forbid touched | dest changed | AUTH_URL changed | tests still missing after 12
leave-behind: files, verify output, next-action one line
evaluator: <seat skill>
checker: check-binary
```

Gate rejects a ticket that lacks `room`, `verify`, `forbid`, or `budget`.
Household tickets use `bc-2ed44fed`. Team tickets use a different stream. A ticket that names both rooms is rejected.

---

## 9. Language lock

Company noun: development.
Foundry words: foundry, stations, field work, charcoal, cream, olive, Fraunces, parent, Child, hire, invest, portion, path, intent, current state.

Banned:

- student login, kid account, learner user, child seat
- gym, street, neighborhood (parent-facing copy)
- formation (parent-facing or sales-facing)
- "true personalized L&D" as a ticket or feature name
- fourth household price, live card charge, flip the public site
- Launch PASS, 8/8, "ready to announce"
- market count
- em dashes in original prose
- sentences that start with "I" in company prose

---

## 10. Canon (optional)

Agents score from this memo. Humans may load one URL.

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
| Constraints | https://x.com/addyosmani/status/2085618113199133067 |
| Legal | FTC COPPA six-step only. No X. |

---

## 11. Current open nodes (facts, not a PASS)

Mid-build tandem. Do not restart. Do not wait for one room.

Household product: path assembly PR 196 merged. Next portion PR 197 merged. Tests still unfilled as of 21 Sep 2026. Seal those tests. Confirm guest and health. One parent session against the household six.

Team product: same six in a leader session. Use campus household + sales org work already on campus. Do not steal `bc-2ed44fed` or `bc-4765f2f0`. Do not invent a team price.

PR 198 FR-KB-1 stays held until Gate names it. Knowledge brain is not the seal of either room.

Open prose: `docs/icp-parent.md` and `docs/icp-leader.md` may both be written this week.

Launch remains CLOSED. Score remains 0/8.

---

## 12. Fail phrases

Reject work that says any of the following:

- "Also add a child login while we are here"
- "A fourth tier for homeschool"
- "Flip the public site so parents can find us"
- "Write learning_intents from hire-path"
- "Family store can hold next portion"
- "This store doc is a node PASS"
- "Launch is close enough"
- "Rebuild hire-path to match the new job sentence"
- "Add a second Pattern bank for personalization"
- "The teammate should own the path"
- "The child should personalize themselves"
- "Default to household and do team later"
- "Put household and team in one ticket"

Accept work that keeps one hirer, one named room per ticket, both rooms allowed the same week, one person in development who is not the buyer, three household prices when the room is household, and a next step that still runs when the hirer leaves the room.
