# Land the M6 content model

M6 gives every lesson one Payload-shaped block model on Drizzle. Learners on `/c/grok-bot` keep the same 10 lessons and the same quiz answers. Teachers see a composer lesson as a draft lesson with blocks. This prep does not implement that cutover. It records the spec, the test plan, and a pure scaffold that typechecks on main. Implementation waits until M5 is accepted. The prep pull request stays draft.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `pstack/skills/poteto-mode/playbooks/autopilot-stack.md`. Ben lands M6 after CDM MERGE GO. No owner merges. This prep stops before that program is armed. Issue 365 also requires a draft pull request, so the implementation pull request stays draft until that go, which overrides the playbook line that opens a pull request ready.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] Read these from trunk at program start. Re-read them at every tick.
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `git show origin/main:pstack/skills/swarm/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/control-ui/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `git show origin/main:docs/LAW.md`
- [ ] On the operator's go, arm the audit tick as `/loop 1h` with the tick prompt below. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim.

```text
Re-read the execution playbook from trunk. Audit the operation against it and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then post a short status message to the operator in chat only when the audit found a tracked change that no earlier status message reported, such as a PR opened, a code-ready head, a round launched or closed, a verdict, a merge, a stuck agent and the action taken, a blocker added or cleared, or a decision only the operator can make. Name every such change and nothing else. Do not repeat a table, the merged list, or an unchanged blocker. If the audit found none, end the turn with no reply text. Either way, log this tick's row in your decision trail. The row names the items reported, or none.
```

- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.
- [ ] Do not arm this program while M5 is blocked. `docs/rebuild-progress.md` on `chore/rebuild-progress` says M5 is blocked on draft pull request 383.

### Spawn owners

- [ ] Spawn one owner for M6 with the full lifecycle in `playbooks/autopilot-stack.md`.
- [ ] Follow this dependency graph. Start M6 only after M5 is accepted on main, or base the implementation branch on `feat/portal-m5-tenancy` only when the operator explicitly asks for that stack. This prep branches from `origin/main` and does not stack on M5.
  - [ ] M6 after M5. M7 is out of this program.
- [ ] Hold the file boundaries. M6 may add `app/src/lib/collections/` and the next free file in `app/db/`. M6 does not edit `app/src/lib/tenancy`, `marketing-site`, or `docs/rebuild-progress.md` from this prep branch.
- [ ] Hold the review gate. M6 changes `/c/grok-bot`. It waits for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Resolve the forge once. Default to `gh`. If `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation. Record any fallback to `gh`. Never require `gt`.
- [ ] Open the implementation pull request as a draft into main. Issue 365 forbids merge without CDM MERGE GO. Use the run's built-in PR tool. Do not push `main`, `feat/portal-m5-tenancy`, or `feat/portal-m6-content-model` from this prep.
- [ ] Run `npm run typecheck` in `app/` before the pull-request push. Push with hooks on.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every Bugbot and security-reviewer comment per `pstack/skills/poteto-mode/references/bugbot-triage.md`.
- [ ] Rebase onto current trunk before the code-ready report. Keep that merge base in fix rounds.

### Verdict and merge, for every PR

- [ ] At the code-ready head SHA, run the swarm per `pstack/skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the M6 **Verify, live** block. The perf lane from its **Verify, perf** block. Two or more audit lanes that read the diff and distrust the pull request body.
- [ ] Clean only when every lane is `PASS`. A new head gets a fresh swarm.
- [ ] Ben lands the pull request after CDM MERGE GO. Apply the patch-id rule in `playbooks/shipping.md`. No owner merges, deploys, flips `AUTH_URL`, or runs a backfill against production.

### Boot recipe, for every live lane

Each live lane runs on its own cloud VM at the implementation pull request head. Drive the browser through `control-ui` from `cursor-team-kit`. Drive the node test through `control-cli`.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] In `app/`, run `npm ci`, then `npm run dev`, and wait until `/c/grok-bot` returns HTML.
- [ ] Deliver clicks and navigation only through the control skill. Read test output with the node test command in the unit block.
- [ ] Save every screenshot to `/tmp/swarm-m6/worker-<n>/<slug>.png` and return the paths with the report.

## Add the content model (M6)

**Depends on.** M5, issue 364, draft pull request 383. This prep does not import M5 modules.

**Files.**

- [ ] Create `app/src/lib/collections/content-model.ts` with the block union, `parseBlocks`, `publishLesson`, `lessonFromStation`, `lessonFromComposer`, and `upsertLessons`.
- [ ] Create `app/scripts/content-model-blocks.test.mjs`.
- [ ] Create `docs/rebuild/m6-content-model-prep.md`.
- [ ] Leave `app/db/` unchanged in this prep. The implementation adds the next free SQL file after M5 `0022_tenancy.sql` lands.
- [ ] Leave `app/src/lib/records/model.ts` and `app/src/lib/evolution/collections.ts` unchanged until the implementation merge, because those files already exist on main.

**Build.**

- [ ] Add `publishLesson` so a lesson with an empty text block returns `required_text_block_empty` and stays a draft.
- [ ] Add `parseBlocks` so a text block that contains an HTML tag returns `html_not_allowed`.
- [ ] Add `lessonFromComposer` so a composer body becomes a draft text block and a quiz item without `sourceUnitId` returns `source_unit_id_required`.
- [ ] Add `upsertLessons` so a second import of the same slug does not add a row.

**You see.**

- [ ] `publishLesson` on a blank text block returns `{ ok: false, error: "required_text_block_empty" }` and the input status stays `draft`.
- [ ] The briefing station fixture keeps quiz `answer` equal to `1` after `parseBlocks`.
- [ ] `collectionField("lessons", "blocks")` returns `{ type: "json", required: true }`.
- [ ] `collectionField("courses", "org_id")` returns `{ type: "relationship", required: true }`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `app/scripts/content-model-blocks.test.mjs` asserts the briefing answer index, the HTML refusal, the empty text refusal, the missing org refusal, the empty quiz refusal, the composer draft body, the missing `sourceUnitId` refusal, and the slug upsert length. Run `node --experimental-strip-types --test scripts/content-model-blocks.test.mjs` from `app/`.
- [ ] `npm run typecheck` in `app/` exits 0. The scaffold imports no file under `app/src/lib/tenancy`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.7-xhigh-fast` at the PR head, per the boot recipe. These lanes run on the implementation head after M5 is accepted. They are not run for this prep.

- [ ] Lane 1. Regression lane against trunk. Open `/c/grok-bot` at trunk and at head. Trunk renders the static catalog. Head renders the same titles from the database. Save `grok-bot-ladder.png`. Pass when both pages list briefing, two-computers, hire-one, plugins, teach-task, routines, staff-chat, ship-from-chat, potato, and business-fleet in that order.
- [ ] Lane 2. Briefing quiz. Open `/c/grok-bot/s/briefing`. Save `briefing-quiz.png`. Pass when the first question still marks choice index 1, matching `app/src/lib/course/content.ts`.
- [ ] Lane 3. Empty required block. Publish a lesson whose text block is blank. Save `publish-refused.png`. Pass when the result is `required_text_block_empty` and the stored status stays `draft`.
- [ ] Lane 4. Composer draft. Save a composer lesson whose body is `Lesson body` and whose quiz item has `sourceUnitId` `unit-1`. Save `composer-draft.png`. Pass when the lesson status is `draft`, the first block text is `Lesson body`, and the quiz answer is `0`.
- [ ] Lane 5. Course org. Read every course row after import. Save `course-org.png`. Pass when every row has a non-empty `org_id`.
- [ ] Lane 6. Cross-org read. Sign in as org A and request a lesson owned by org B. Save `cross-org.png`. Pass when the response has no lesson body. This lane uses M5 `canRead` after M5 is on main.
- [ ] Lane 7. Idempotent import. Run the static import twice. Save `import-counts.png`. Pass when the second run does not increase the lesson count and the 10 slugs are still present.
- [ ] Lane 8. HTML refusal. Submit a text block whose text is `<p>hi</p>`. Save `html-rejected.png`. Pass when `parseBlocks` returns `html_not_allowed` and no lesson row is inserted.
- [ ] Lane 9. Guest grok-bot. Open `/c/grok-bot` signed out. Save `guest-grok-bot.png`. Pass when the page renders the 10 lessons and the guest path does not create a child login.
- [ ] Lane 10. One room per course row. Load the household org and the sales org. Save `rooms-split.png`. Pass when those two orgs do not share one course row and the page does not mix both rooms on one desk.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Milliseconds to run `parseBlocks` and `publishLesson` on the 10-station fixture. Trunk has no `parseBlocks`, so trunk records the symbol as absent. The end state the user waits for is `/c/grok-bot` listing 10 lesson titles.
- [ ] Probe. Time that fixture at trunk and at head, interleaved. Both sides must produce the metric. Trunk produces `symbol_absent`.
- [ ] Baseline. Record the trunk result first.
- [ ] Rule. The head fixture must finish in under 50 milliseconds. Do not report a ratio against `symbol_absent`. Fail the page end state when the title count is not 10.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 screenshots into `media/m6-review-briefing-quiz.png`.
- [ ] Record a 30 to 60 second video of `/c/grok-bot` on a lane VM. Save it as `media/m6-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA of the implementation pull request.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] Ben squash-merges after CDM MERGE GO. This prep pull request is not that merge.

## Close the program

- [ ] Every box above is checked with its evidence. The boxes in **Add the content model (M6)** stay open until the implementation pull request exists.
- [ ] Reply to the operator with the autopilot-stack report. This prep replies with the acceptance packet and then stops.

## Appendix A. Prototype evidence

The block schema spike is the prep scaffold, not a second branch. Issue 365 asks for that spike before the migration.

- Question. Can the block union, the publish refusal, and the collection descriptors typecheck on main with no M5 import?
- Branch. `prep/m6-content-model`, cut from `origin/main` at `34798e56529489424f7c1b067e166b10a8570578`.
- Proof command. From `app/`, `node --experimental-strip-types --test scripts/content-model-blocks.test.mjs` and `npm run typecheck`.
- The SHA and the command output belong in the prep acceptance packet after those commands run.
- Unproven. Database render of `/c/grok-bot`, cross-org `canRead`, the SQL migration, and the static import row counts. Those need M5 on main and a migration file, which this prep does not add.

## Appendix B. Alternatives rejected

- Stacking this prep on `feat/portal-m5-tenancy`. The operator asked for a scaffold that typechecks on main and does not import unmerged M5 modules.
- Editing `app/db/` to claim migration `0022`. M5 already claimed `0022_tenancy.sql` on its branch. Main still ends at `0021_knowledge_gap_loop.sql`. This prep writes no SQL.
- Merging `app/src/lib/records/model.ts` and `app/src/lib/evolution/collections.ts` into the new registry now. Those files exist on main, and this prep may only add files that do not exist yet.
- Treating today's `Module` in `app/src/lib/course/types.ts` as the new modules table. That type is one station. In M6 the station is a lesson. The grok-bot outline has one module, the ladder, and 10 lessons.
- Branding `orgId` in the scaffold. Main stores org ids as uuid strings on `courses.org_id`. A second id brand would not assign from those rows without a cast.
- Putting practice only inside `blocks` and skipping the `practice` table. Issue 365 names a `practice` table.
- Publishing the static course quiz before a `source_unit_id` exists. `lessonFromStation` keeps the answer index and sets `sourceUnitId` to an empty string, and `publishLesson` then returns `source_unit_id_required`. The imported lesson stays `draft`.

## Appendix C. Risks

- M5 stays blocked. M6 implementation must not start. The pure scaffold can still land on main because it does not call `canRead` or `canWrite`.
- The next agent copies `0022` into M6. Recheck `app/db/` on main and on open `feat/*` branches before adding SQL. If `0022_tenancy.sql` has merged, use the next free number and say so in the implementation pull request.
- `lessonFromStation` does not invent knowledge units. A later import that publishes those 10 quizzes without `source_unit_id` violates the quiz rule in `docs/LAW.md`.
- `records` and `evolution` both export `COLLECTIONS` and `CollectionSlug` with different slug unions. The implementation merge has to pick one module boundary so those names do not collide. This prep does not export a second `COLLECTIONS` binding. It exports `CONTENT_COLLECTIONS`.
- Lane 6 is meaningless until M5 `canRead` is on main. Do not stub that helper in the content model.
- Launch stays CLOSED 0/8. This prep does not flip `AUTH_URL`, deploy, or run a backfill.

## Appendix D. Links and reading list

- Issue 365, Portal rebuild M6.
- Issue 364, M5 tenancy. Read it before the implementation. Do not comment on issue 363 from this prep.
- `docs/rebuild-progress.md` on branch `chore/rebuild-progress`. Do not edit that file here.
- `app/src/lib/gap-loop/collections.ts` for the descriptor shape.
- `app/src/lib/course/content.ts` for the 10 stations and quiz answer indexes.
- `app/src/lib/composer/schema.ts` for `courses` and `lessons`, which already have `org_id` and `status`.
- `app/db/0005_composer.sql` through `app/db/0021_knowledge_gap_loop.sql` on main.
- The implementation pull request reads `pstack/skills/how/SKILL.md` before changing the grok-bot page, and `pstack/skills/interrogate/SKILL.md` before the registry merge. The trail for that pull request follows `pstack/skills/show-me-your-work/SKILL.md`. This prep does not start that trail.

## Appendix E. Content model spec

Reference for the scaffold in `app/src/lib/collections/content-model.ts`. The implementation keeps these names unless a box above changes them.

### Hierarchy

A course has modules. A module has lessons. A lesson has blocks and practice rows. Practice is authored work, not a progress attempt. Progress stays in M7.

Grok-bot on main is one static course, slug `grok-bot`, with 10 stations in `app/src/lib/course/content.ts`. The page `/c/grok-bot` calls `getCourse` and does not read Postgres. Composer lessons live in `courses` and `lessons` from `app/db/0005_composer.sql`. Those rows already require `org_id`. Composer is one course for one lesson today, and `lessons` stores `body` text rather than `blocks`.

The implementation maps one grok-bot module, slug `the-ladder`, and one lesson per station slug. It maps a composer lesson to status `draft` with a text block equal to `body` and one quiz block for its quiz items.

### Block union

`Block` is a discriminated union on `kind`. The kinds are `text`, `bullets`, `quote`, `clip`, `assignment`, and `quiz`. A quiz question carries `answer` as a zero-based index and `sourceUnitId` as a string. `parseBlocks` accepts `unknown` and returns `{ ok: true, blocks }` or `{ ok: false, error }`.

`parseBlocks` returns `html_not_allowed` when a string contains an HTML tag. It returns `unknown_block_kind` for any other `kind`. It returns `clip_range` when `endSec` is less than or equal to `startSec`. It returns `quiz_answer_out_of_range` when `answer` is not an integer inside `choices`. Empty text is allowed at parse time so a draft can round-trip. It is not allowed at publish time.

### Publish and org

`publishLesson` returns `{ ok: false, error: "course_org_required" }` when `orgId` is blank. It returns `required_text_block_empty` when no text block has non-blank text. It returns `required_quiz_block_empty` when a quiz block has no questions or a question has fewer than two choices. It returns `source_unit_id_required` when a quiz question has a blank `sourceUnitId`. It returns `required_assignment_block_empty` when the assignment title is blank or a required item has a blank label. On success it returns a copy whose `status` is `published`. It does not write SQL.

`courseOrgRefusal` is the same org check for a course row. A non-empty `orgId` returns null. A blank `orgId` returns `course_org_required`.

`lessonFromStation` builds the blocks for one static station, sets `sourceUnitId` to an empty string, sets status to `draft`, and runs `parseBlocks`. `lessonFromComposer` refuses a missing `sourceUnitId` before it builds the draft. `upsertLessons` replaces by `slug` and keeps the first-seen slug order, so a second import does not increase the length.

### Collections

`CONTENT_COLLECTIONS` copies the unexported descriptor shape in `app/src/lib/gap-loop/collections.ts`. Slugs are `courses`, `modules`, `lessons`, `practice`, `course_versions`, and `lesson_versions`. `lessons.blocks` is required json. `lessons.org_id` and `courses.org_id` are required relationships. `practice.kind` is a required select. `course_versions` and `lesson_versions` hold `parent_id`, `version`, and `snapshot`. `collectionField(slug, name)` returns `{ type, required }` or null.

Access strings say membership in this org. They do not import `canRead` or `canWrite`. Those functions exist only on `origin/feat/portal-m5-tenancy` in `app/src/lib/tenancy/access.ts`. Wiring them is deferred until that branch is accepted.

### Deferred until M5 is accepted

- SQL for `modules`, `practice`, `lesson_versions`, and `course_versions`, and the widened `courses` and `lessons` columns `_status`, `order`, `blocks`, and `outcome_ids`. Do not reuse M5 migration number `0022` unless that number is still free.
- Replacing `/c/grok-bot` static reads with database reads.
- Calling `canRead`, `canWrite`, `scopeSurface`, or `roomOf`.
- Merging the records catalog and the evolution catalog into one registry.
- An import script that writes the static course with `example` true, compares row counts, and runs only as a dry run. It must not run against production.
- Backfill and `app/scripts/test-rows.mjs`. Those belong to M5, and Ben runs them after a `pg_dump`.
