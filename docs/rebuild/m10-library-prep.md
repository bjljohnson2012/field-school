# M10 Library prep

This file is the spec and the test plan for [issue 369](https://github.com/bjljohnson2012/field-school/issues/369). It is spec only. No product code ships in the pull request that adds this document.

**Depends on (deployed).** M6 content model ([issue 365](https://github.com/bjljohnson2012/field-school/issues/365)) and M9 shell ([issue 368](https://github.com/bjljohnson2012/field-school/issues/368)) are live on production as of the Oct 13 to Oct 14 rebuild brief. M10 implementation stacks on `feat/portal-m9-shell` (or `origin/main` after that branch merges). This prep is cut from `origin/main` at `4eaf464cfa19c2c7a1e0b552490a31f5515e79ef` or later.

**Gate.** `designer_seal` is required before Ben treats the implementation stream as acceptance-green. CDM sealed M10 on 2026-10-14, delegated by Ben. The sealed choices are recorded in this file. M9 shell seal (Ben, 9:34 PM ET on Oct 14, 2026) does not substitute for this M10 seal.

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay `false`. No live Stripe. This prep does not deploy and does not run production scripts.

`docs/rebuild-progress.md` on `chore/rebuild-progress` is the dispatcher log. This spec pull request does not edit it.

## Member rail (do not revert)

Ben decided at 9:34 PM ET on Oct 14, 2026 ([Notion brief Oct 13 to 14, 2026](https://app.notion.com/p/3f9fe86f6dee817f9143fe9d831b0edd); live commit `4eaf464`). The **default** member rail is **240px** with **Learn, Library, You**. Unset and `NEXT_PUBLIC_MEMBER_RAIL_VARIANT=issue-368` both select that layout. The older Learn, Me layout is only `NEXT_PUBLIC_MEMBER_RAIL_VARIANT=shells`.

M10 work happens inside the M9 shell. Library pages use the same cream bar and left rail. Members who open Library still see Learn, Library, and You in the rail, not the leader five words. Do not change that default in M10.

## Goal

Library is the brain's workspace. An accountable person creates and edits lessons as typed JSON blocks, publishes them, and members see published lessons in Learn. The lesson player shows **one step at a time**, with no page taller than two screens at 1440px width. A person in development never sees drafts or Coaching recap text.

AppFlowy and LearnHouse are idea references only. No code is copied from those products.

## Library workspace

`/library` is the signed-in workspace root for the active brain (org). Today main ships a stub page at `app/src/app/library/page.tsx` ("The workspace for this brain opens here."). M10 replaces it with a two-pane workspace.

### Sidebar tree

Fixed top-level sections, in this order:

| Section | Holds | Notes |
| --- | --- | --- |
| **Brain** | Brain pages and knowledge entry points that are not yet unified under M11 | List and simple page editor. Full graph and backfill are M11. |
| **Courses** | Course, then module, then lesson hierarchy from M6 | Expand and collapse. Selecting a lesson opens edit or preview per role. |
| **Sessions** | Coaching session records and published recaps (M8 tables) | Row layout may borrow ObsidianUI Active Sessions **layout only** ([issue 369 comment](https://github.com/bjljohnson2012/field-school/issues/369#issuecomment-6086685586), [#363 ObsidianUI note](https://github.com/bjljohnson2012/field-school/issues/363#issuecomment-6086683124)). Not the Settings security component. |
| **Media** | Files and uploads used by lessons | Merges coaching files surface (`/coaching/files` to `/library/media` per route table). |

Quiet plus actions inside Library create a page, lesson, or import in context (Rec 8, [#363 section 5](https://github.com/bjljohnson2012/field-school/issues/363)). They are never filled blue. The rail **New** row stays M9; its menu contents are **decision 2** (open, see seal questions).

### Access

- **Accountable people and leaders** see the full tree, drafts, editor, publish, and version history for their org.
- **Members** see published courses and lessons in Learn, not draft rows in Library. Library may show published catalog items read-only where the product allows members to browse; drafts never appear to members.
- **A person in development** has no login. They never see Library, drafts, or recap text ([issue 369 CDM notes](https://github.com/bjljohnson2012/field-school/issues/369), [#363 Q21](https://github.com/bjljohnson2012/field-school/issues/363)).

Scope every query by `org_id` and membership role using M5 `canRead` / `canWrite` and M9 shell desk rules. One room per desk. Never mix household people in development with team members on one desk.

## Nine-block lesson template

Every new lesson starts from the template in [#363 section 7](https://github.com/bjljohnson2012/field-school/issues/363). Blocks are typed JSON validated by the M6 schema. **Never raw HTML.**

| # | Block | Required | Learner step |
| --- | --- | --- | --- |
| 1 | Objective and outcome | Yes | Overview (with block 2) |
| 2 | Why it matters | Yes | Overview |
| 3 | Core idea | Yes | Core idea |
| 4 | Worked example | Yes | Worked example (video uses player slot) |
| 5 | Practice | Yes | Practice |
| 6 | Field work | Yes | Field work |
| 7 | Check for understanding | Yes | Check (pass at 75%, 3 of 4) |
| 8 | Reflection | Yes | Reflection (writes brain evidence) |
| 9 | Next step and gap capture | Yes | Next step |

**Publish rule.** Publishing fails until every required block has content (M6 acceptance). **Versions.** Draft, publish with `_status`, and `lesson_versions` (or equivalent from M6). Restore an older version and confirm the published lesson changes for members.

**Editor (Q8).** Use an MIT-licensed typed-JSON block editor (Tiptap or similar). The choice is recorded in the implementation pull request. Storage stays JSON in Postgres, not editor HTML.

## Lesson page (one activity at a time)

Built from existing pieces per Rec 9 and [#363 section 7](https://github.com/bjljohnson2012/field-school/issues/363):

| Piece | Role in M10 |
| --- | --- |
| `CourseFrame` | Outline rail on desktop; **drawer** on mobile 390 |
| Thin meter | `#1E4E8C`, shows step progress |
| `YoutubeClip` | One player, one button, no overlap |
| Thesis / core copy | Core idea step |
| `AssignmentPanel` | Field work step; save is the one filled blue on that step |
| `QuizPanel` | Practice and Check steps; pass rule visible at top |
| `CourseSubnav` | Desk and Exam links at foot of rail |
| Sticky footer | Previous and next between the eight learner steps |
| `LessonSpinePlayer` | Player slot inside Worked example when the lesson has film |
| `GuestContinuity` | **Guests only**, muted `#5C5850` |

**Routes.** Learn renders published lessons at `/c/[courseSlug]/[lessonSlug]` (and related paths per M9 route table). Library edits at `/library/lessons/[lessonId]` and `/library/lessons/[lessonId]/edit`. Legacy org paths redirect:

| Legacy | Target |
| --- | --- |
| `/o/[slug]/l` | `/library` |
| `/o/[slug]/l/[lessonId]` | `/library/lessons/[lessonId]` |
| `/o/[slug]/teach` | `/library` (editor context) |
| `/o/[slug]/teach/[lessonId]` | `/library/lessons/[lessonId]/edit` |
| `/library/wizard` | Under Library / New (exact path follows decision 2) |
| `/library/video` | Under Library / New import video |
| `/play/lesson-spine` | Lesson with video block (merge into course player) |
| `/coaching/files` | `/library/media` |
| `/coaching/questions` | Practice items in Library |
| `/knowledge` | `/library/brain` (see M11 boundary below) |
| `/brain` | `/library/brain` (sign-in required) |
| `/operator/publish` | Library publish flow |

Redirects are permanent where safe, tested in `app/scripts/` like M9.

**Height rule.** No lesson player step body may exceed **two viewport heights** at 1440px width (acceptance in issue 369). Test with a fixture lesson that includes video, quiz, and field work.

**Pass rule copy.** Show **Pass at 75%** (and exam 8 of 10 where applicable) at the top of the lesson page ([#363 Q6](https://github.com/bjljohnson2012/field-school/issues/363)).

## Sessions (Coaching)

**Library, Sessions** lists held sessions and **published** recaps from M8 session tables. Visibility ([#363 Q21](https://github.com/bjljohnson2012/field-school/issues/363)):

| Viewer | Sees |
| --- | --- |
| Accountable person or leader | Full recap and next steps for the org |
| Member | Next steps assigned to them, not full recap body if policy hides it |
| Person in development | **Never** recap text |

Draft recaps stay invisible to members and to people in development.

## Create flow from New

Acceptance: an accountable person creates a lesson from **New**, fills nine blocks, publishes, and a member sees it in Learn.

Until decision 2 is sealed, the implementation pull request may propose a menu map (Lesson, Course, Brain page, Import video, and wizard) labeled **Proposed, needs Designer seal**, matching [#363 section 5 New row](https://github.com/bjljohnson2012/field-school/issues/363) and the route table rows for `/library/wizard` and `/library/video`.

## M11 boundary

M10 owns the workspace shell, block editor, lesson player refactor, media list, sessions list, and redirects above. **M11** ([#370](https://github.com/bjljohnson2012/field-school/issues/370)) owns widening `knowledge_nodes`, backfill from legacy brain stores, graph and list at `/library/brain`, and derived edges. M10 may ship `/library/brain` as a thin sign-in-required placeholder that lists existing knowledge components until M11 lands, but must not duplicate M11 backfill logic.

Do not break Gap Loop M1 tests. Quiz items keep `source_unit_id`.

## Already built (reuse, do not redo)

| Area | Location | PRs |
| --- | --- | --- |
| Knowledge list and document UI | `app/src/components/knowledge/*` | 351 to 358 |
| Library wizard and generation | `app/src/lib/library/submit-knowledge.ts`, `app/library/wizard/*` | 349 |
| Drop handling | (PR 350) | 350 |
| Course frame and panels | `app/src/components/course/*`, station pages | 356, 358 |
| Lesson spine player | `app/src/components/lesson-spine-player.tsx`, `app/src/app/play/lesson-spine/page.tsx` | existing |
| Teach from knowledge | `app/src/lib/library/teach-from-knowledge.ts` | existing |
| M6 blocks and versions | M6 registry and tables on main after deploy | M6 |
| M9 shell and `/library` 200 | M9 | `d1aca02`, `4eaf464` |

## Migrations

Do **not** add a SQL file in this prep pull request. Do **not** claim a migration number here. At implementation start, compare M6 `lesson_versions` / `course_versions` to the version-restore acceptance. Add idempotent SQL in `app/db/` only if M6 left a gap, following [#363 section B](https://github.com/bjljohnson2012/field-school/issues/363) and the dispatcher `migrations_claimed` list on `chore/rebuild-progress`.

## What this prep leaves untouched

`docs/rebuild-progress.md`. `AUTH_URL`. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE`. Live Stripe. Production data and production apply scripts. Guest Grok Bot at `/c/grok-bot`. Profile M1, Wizard, and Gap Loop M1 behavior and tests. Frozen TanStack `src/`. `app/deploy/`. Marketing site. Child login.

## Test plan

Run from `app/` after `npm ci` on the **implementation** branch at its draft pull request head. This spec pull request only adds this file; these cases are not run here.

### Unit and snapshot (`app/scripts/m10-library.test.mjs`, name may vary)

1. **Redirects.** Every legacy path in the table above returns the expected status and `Location` (or Next.js equivalent) for a signed-in fixture org.
2. **Tree keys.** Library sidebar exposes Brain, Courses, Sessions, and Media in order for a leader fixture.
3. **Draft visibility.** A draft lesson id is absent from member Learn API or page HTML; present for an accountable fixture in Library.
4. **Publish guard.** Publishing with an empty required block returns failure and leaves `_status` draft (uses M6 `publishLesson` or successor).
5. **HTML refusal.** Block JSON containing HTML tags is rejected (M6 rule).
6. **Version restore.** After publish, save version A, edit to version B, publish, restore A, member sees A content.
7. **Nine blocks.** New lesson template inserts nine block slots in order; schema validates each type.
8. **Lesson height.** Rendered step at 1440px fixture: `scrollHeight` of the main canvas is at most `2 * innerHeight` (playwright or control-ui measure).
9. **Guest continuity.** Signed-in lesson page HTML does not contain guest-only continuity copy; guest fixture still may.
10. **Recap filter.** Sessions list for a child-scoped fixture never includes recap body text.
11. **Keyboard tree.** Tree items are focusable; arrow keys move between siblings (assert roles or tab order in test).
12. **Member rail.** Default variant at 390px still shows Learn, Library, You (regression on `4eaf464` behavior).
13. **Flags.** `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` remain false in source.
14. **Copy lock.** Diff and rendered strings: no em dash, no Learn with Ben, no Gym, Foundry, or Retainer.
15. **Regression.** `npm run typecheck`, `npm run build`, and `npm test` pass. Profile M1, Wizard, and Gap Loop M1 tests unchanged.

### Manual / designer evidence (implementation PR)

| Check | Evidence |
| --- | --- |
| Create, edit, publish flow | Screen recording: New to published lesson, member sees Learn |
| Lesson player | 1440 and 390 screenshots per step; drawer on mobile |
| Library workspace | 1440 and 390 screenshots of tree plus canvas |
| Sessions list | Screenshot with row layout; no recap for child context |
| Version restore | Short recording or before and after screenshots |
| Designer seal | CDM on 2026-10-14, delegated by Ben. Recorded in this file. |

### Out of scope for M10 tests

Deploy, `AUTH_URL` flip, live Stripe, production backfill, M11 brain backfill counts, Yap-cut video pipeline (Ben added Yap Oct 13; no agent-visible cut yet per Notion brief).

## Designer seal checklist

Sealed on 2026-10-14 by CDM, delegated by Ben. The six choices below are the seal. Implementation follows them.

| # | Item | Spec source | Evidence required | Status |
| --- | --- | --- | --- | --- |
| 1 | Library workspace layout: tree plus canvas, quiet pluses, no filled blue in tree | Rec 8, issue 369 | 1440 and 390 screenshots | Sealed 2026-10-14 |
| 2 | Sidebar sections Brain, Courses, Sessions, Media | Issue 369, route table | Screenshot with all four | Sealed 2026-10-14 |
| 3 | Lesson player one step at a time, eight steps from nine blocks | #363 section 7 | 1440 and 390 per step | Sealed 2026-10-14 |
| 4 | Outline rail desktop; drawer on mobile | #363 section 7, Designer finding 8 | 390 screenshot with drawer | Sealed 2026-10-14 |
| 5 | Thin `#1E4E8C` meter; pass rule at top | Rec 9, Q6 | Screenshot | Sealed 2026-10-14 |
| 6 | One filled blue per step on main action only | #363 section 5 | Screenshot per step type | Sealed 2026-10-14 |
| 7 | Video: one player, one button, no overlap | Designer finding 3, L6 | Screenshot Worked example | Sealed 2026-10-14 |
| 8 | Sessions list row layout (ObsidianUI borrow) | Issue 369 comment, #363 ObsidianUI | Screenshot Sessions | Sealed 2026-10-14 |
| 9 | Member rail unchanged: 240px Learn, Library, You | Ben Oct 14 9:34 PM ET, `4eaf464` | 390 member screenshot | Sealed 2026-10-14 |
| 10 | Typography and tokens match M9 shell | M9 prep sealed packet | Side by side with Home | Sealed 2026-10-14 |
| 11 | Block editor UX (typed JSON, not HTML) | Q8, M6 | Screenshot editor plus PR names library | Sealed 2026-10-14 |
| 12 | No draft or recap text for person in development | CDM notes, Q21 | Test log plus screenshot | Sealed 2026-10-14 |

## Sealed design choices

CDM sealed these on 2026-10-14, delegated by Ben.

| # | Choice | Seal |
| --- | --- | --- |
| 1 | **Q8: block editor library** | Tiptap. Headless, ProseMirror-based. The dependency is in `app/package.json`. Storage stays JSON in Postgres, not editor HTML. |
| 2 | **New menu contents** | Lesson, Course, Brain page, Video, Wizard. Five items, in that order. Leaders only. Quiet ghost. Never blue. |
| 3 | **Sessions row layout detail** | Session rows borrow the Active Sessions layout and Field School tokens. |
| 4 | **Member visibility of Library catalog** | Members see published lessons in Learn. Drafts stay off the member Learn catalog. |
| 5 | **Film / Yap workflow in Worked example** | No Yap-cut lesson until one exists. |
| 6 | **M10 vs M11 split for `/library/brain` depth** | `/library/brain` in M10 is a list and a simple page. The graph is M11. |
| 7 | **Member rail** | The member rail stays the 240px Learn, Library, You rail (`NEXT_PUBLIC_MEMBER_RAIL_VARIANT=issue-368`). |

## Acceptance summary (issue 369)

- Accountable person: New, nine blocks, publish, member sees lesson in Learn.
- Lesson page: one step at a time; max two screens tall at 1440.
- Version restore works.
- Tree: keyboard and screen reader checks pass.
- Person in development: never drafts or recap text.
- Screenshots at 1440 and 390 on implementation PR. Designer seal: CDM on 2026-10-14, delegated by Ben.

Implementation branch name per epic: `feat/portal-m10-library`. Base: latest `feat/portal-m9-shell` with M6 on main. Part of #363. Closes #369 when the implementation merges, not when this prep merges.
