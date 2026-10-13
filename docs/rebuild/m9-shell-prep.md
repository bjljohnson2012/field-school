# M9 shell prep

This file is the spec and the test plan for [issue 368](https://github.com/bjljohnson2012/field-school/issues/368), Portal rebuild: M9 Shell, nav, Home, and brand. `docs/rebuild-progress.md` names the same shell: stream M9, gate `designer_seal`, branch name `feat/portal-m9-shell` for the later UI work.

The designer seal is not given. This pull request is the spec. It leaves the M9 UI unbuilt. It does not merge. It does not deploy.

Launch stays CLOSED 0/8. `AUTH_URL` stays `https://portal.fieldschool.ai`. `CHECKOUT_GO_LIVE` stays `false` in `app/src/lib/billing/checkout-destination.ts`. `COACHING_GO_LIVE` stays `false` in `app/marketing-site/js/checkout-switch.mjs`. This prep does not run tenancy-backfill or test-rows.

Main at the branch point is `9447e7ed63fb0d5035264be1bbee0a28cb5ac225` (PR 395). That tree already has `app/db/0022_tenancy.sql`, `0023_content_model.sql`, `0023_m8_identity_billing.sql`, `0024_m8_offer_tiers.sql`, and `0025_m7_progress.sql`. `docs/rebuild-progress.md` on the same commit still lists M5, M6, M7, and M8 as unaccepted. This prep follows the tree and branches from this main. It does not stack on `feat/portal-m8-identity-billing`.

## Decisions that still need Ben

The UI pull request waits on these. This spec records the issue 368 shell and names each place the sources disagree.

1. **Designer seal.** Not given. Issue 368 and `docs/rebuild-progress.md` set `gate: designer_seal`. The proposed measures in the 9 Oct 2026 ObsidianUI comment ride with that seal: buttons at 12px radius, cards at 16px, state changes at 240ms, layout moves at 300ms, Discover Button at 48px tall with a 240ms fill, nav rows at 36px. Until the seal, those numbers stay proposed.
2. **Which chrome law the UI builds.** `docs/staff/SHELLS.md` (21 Sep 2026) and issue 368 (8 Oct 2026) both use the five words Learn, People, Library, Insights, New. They disagree on four points. `docs/LAW.md` says SHELLS wins on chrome. The M9 ticket names the issue 368 shell. Ben picks one side for each row.

| Point | SHELLS.md | Issue 368 |
| --- | --- | --- |
| Member rail | Learn and Me. No Library. No People. No Insights unless the stance is trainer or admin. | Learn, Library, and You. Leaders and accountable people also see People, Insights, and New. |
| New menu | Long-form video, Wizard, Connect AI. | Lesson, Course, Brain page, Goal, Person in development, Member invite, Import video. |
| Credits | A credits control in the bar. | Billing, credits, and AI keys inside Settings. |
| Mobile | Seal, current shell, New, and avatar. The rest in a sheet. | Bottom bar with the five words. New is a plus. A drawer holds the brain switcher and You. |

3. **Guest home sentences (hero C).** Issue 368 says the portal home echoes hero C. This checkout has no hero C source file. The signed guest home on main is the campus ladder in `app/src/app/campus-home.tsx` ("Lead yourself. Learn yourself. Do the Work." and "Start Grok Bot" in `#1F5EFF`). The marketing homepage on this main is the knowledge-brains hero in `app/marketing-site/index.html`. The 9 Oct comment places a Discover Button on "marketing hero option C, below the two brains and the seal." Ben supplies the sentences, or the file that holds them, before the UI pull request writes guest-home copy.
4. **Flip Text.** The 9 Oct comment marks Flip Text optional, and only on the Assessment Wizard finish heading. Ben says install or skip. Wizard behavior and Wizard tests stay as they are either way.
5. **Team practice paths.** The 9 Oct changelog renames the team coaching room to "Team practice" in UI and routes, in this stream. Portal pages under `app/src/app/coaching/` still exist (`reviews`, `compare`, and the team-room routes the 8 Oct table keeps). The marketing site maps `/coaching` to `/teams` (`app/scripts/marketing-site-rebuild.test.mjs`). `coaching_*` table names stay until M15. Ben says whether the UI pull request renames portal paths or changes the visible label only.
6. **UI branch base.** `docs/rebuild-progress.md` bases M9 on `feat/portal-m8-identity-billing` and merges M7 in. Issue 368 says the base is latest main. This prep uses main at `9447e7e`, which already contains the tenancy, content-model, M8, and M7 SQL named above. Ben confirms the UI pull request builds on this main.

## The shell issue 368 names

Replace the flat top row with a cream top bar and a left rail. The rail opens with the brain switcher. Under it sit the sealed five words. Under those, You holds Profile, Assessments, and Settings. Billing sits inside Settings. Knowledge folds into Library. New is a quiet row. Home is `/dashboard`. The brain name and the logo open Home. Home is not a sixth word.

```
DESKTOP 1440
+--------------------------------------------------------------------+
| (seal 28) Field School                 [ Cmd-K search ]   ?   (B)   |  cream bar, Fraunces wordmark
+--------------------+-----------------------------------------------+
| [ Johnson family v]|                                               |
|   (name opens Home)|   canvas: 72rem max                           |
|                    |   one filled blue CTA per view                |
|  Learn             |                                               |
|  People            |                                               |
|  Library           |                                               |
|  Insights          |                                               |
|  + New   (quiet)   |                                               |
|                    |                                               |
|  YOU               |                                               |
|  Profile           |                                               |
|  Assessments       |                                               |
|  Settings          |   (Billing, credits, AI keys inside)          |
+--------------------+-----------------------------------------------+

MOBILE 390
+--------------------------------------+
| [=] (seal) Field School  Johnson v   |  wordmark stays
+--------------------------------------+
| canvas, full width                   |
| one filled blue CTA                  |
+--------------------------------------+
| Learn  People  Library  Insights  +  |  bottom bar
+--------------------------------------+
[=] opens a drawer: brain switcher, then You (Profile, Assessments, Settings).
```

| Part | Spec |
| --- | --- |
| Top bar | Cream `#F6F3EC`, 28px seal, Fraunces wordmark, Cmd-K, help, avatar. No filled blue. The wordmark stays visible at 390. |
| Brain switcher | Top of the rail. One click switches the brain. The name always shows. Kinds in copy are Family or Team. Homeschool is a small tag on a family brain, never a nav item. Clicking the name opens `/dashboard`. |
| Rail, leader or accountable person | Switcher, then exactly Learn, People, Library, Insights, New. Then You. |
| Rail, member | Learn, Library, You, once Ben resolves decision 2. Until then the spec records the issue 368 row. |
| New | Quiet row. No filled blue. The menu contents wait on decision 2. Contextual quiet pluses inside Library are M10. |
| You | Profile (`/profile`), Assessments (`/profile/assessments`), Settings (`/settings`). Billing is a Settings section. |
| Filled blue | One filled `#1E4E8C` action per view. None in the bar or the rail. Active nav is a muted pill, blue text, or a 2px blue left bar. |
| Rooms | A family brain lists people in development, login none. A team brain lists members who may sign in. The two lists never render on one desk. A membership in the other org is not a reason to mix them. |

The word Dashboard is retired in the UI. The path `/dashboard` stays, and the visible home is the brain name.

## Home

`/dashboard` is the home of the current brain. It stops redirecting to Insights.

An accountable person or leader sees, for the active brain only:

- The next lesson for the person on the desk, with one action.
- Who stalled, and who has no next step, each with one action.
- Open gaps, each with one action.
- The latest Coaching next-step plan. A person in development never sees recap text. Members see the next steps assigned to them.

A member sees their own next lesson, course progress, open practice, and one assessment nudge.

Empty data renders an honest empty line. This prep does not invent progress rows. M7 owns progress. M8 owns Coaching records. When those are absent, Home still answers "what is next" with the empty line.

Insights stays the deeper report. Its charts use plain words. The rendered hint `skill_states for this org.` in `app/src/app/insights/charts.tsx` leaves the page.

## Guest portal home

`/` for a guest echoes hero C once Ben supplies it (decision 3). The guest home offers sign in, the free course, and the free assessment. It does not offer People, Insights, Library, or brain pages.

A signed-in visit to `/` redirects to `/dashboard`.

`GuestContinuity` (`app/src/components/guest-continuity.tsx`) renders for guests only. Signed-in pages, including the station page, do not show "What a guest keeps". The guest line uses muted `#5C5850`.

The campus-home button "Start Grok Bot" and the email button drop `#1F5EFF`. UI buttons use `#1E4E8C`. `#1F5EFF` stays on brand fields only. Guest Grok Bot at `/c/grok-bot` stays public.

## Brand tokens and type

Delete these custom properties from `app/src/app/globals.css` and repaint every use with `#1E4E8C`:

- `--color-brand-orange` (`#ff6a1a`)
- `--color-brand-orange-deep`
- `--color-brand-navy`
- `--shadow-orange-glow`

Known paint sites on this main: `app/src/components/profile-m2/neural-web.tsx`, `app/src/components/skill-card.tsx`, `app/src/components/synthesis-status-banner.tsx`, `app/src/components/wizard-step.tsx`, `app/src/components/tasks-nav-badge.tsx`, `app/src/app/intake/intake-wizard.tsx`, `app/src/app/improve/drill-runner.tsx`. The Wizard meter becomes blue. Wizard behavior and Wizard tests stay unchanged. Profile M1 behavior and tests stay unchanged. Color and copy are the only edits on those surfaces.

Drop the `Inter` and `Space_Grotesk` imports from `app/src/app/layout.tsx`. Display is Fraunces. UI is IBM Plex Sans. Kickers are IBM Plex Mono.

Stone `#7A746A` is for text at 24px and up. Smaller text uses muted `#5C5850`.

Remove the dark mode toggle (`app/src/components/theme-toggle.tsx` and its mount in `app/src/components/site-header.tsx`). The portal stays light until a dark theme is signed. Navy stays out until a sourced token exists.

`/settings` (the move of `/account`) sits on the type scale. The account page stops repeating a block off that scale.

Buttons use 12px radius and cards use 16px once the seal locks those numbers. Until then they stay proposed.

## ObsidianUI parts

ObsidianUI is a parts bin. Install from `app/` with the shadcn CLI so the code lands in this repo. When the CLI offers to overwrite `lib/utils.ts`, the answer is no. Pin the upstream commit. Do not re-run `shadcn add` over the edited copy.

Restyle every piece to cream `#F6F3EC`, ink text, white cards, `#1E4E8C`, Fraunces, IBM Plex Sans, and IBM Plex Mono. Delete each piece's `.dark` block. No orange, glass, glow, or gradient.

The 9 Oct update on issue 368 wins on primitives:

- Port the Dashboard Shell dropdown, popover, and tabs onto the Base UI primitives already in the app. Do not add Radix.
- The motion library is allowed only for the Dashboard Shell and Active Sessions. Flip Text, if Ben installs it, uses CSS keyframes only.
- Icons are lucide. `@duo-icons/react` stays out.
- Every animation respects `prefers-reduced-motion`.

| Piece | Where | This prep |
| --- | --- | --- |
| Dashboard Shell, pin `e19d14f` | The signed-in shell. It wraps AppShell, Cmd-K, and New. It does not replace them. | Spec only. UI pull request installs it. |
| Discover Button | The one filled blue on Home's next step. The default label "Discover Components" never ships. | Spec only. The marketing hero button is S0, not M9. |
| Active Sessions | Settings, Security. It lists devices. It is not the Coaching sessions list. | Hidden. Main has `auth_session_revocations` (a jti list) and no per-device session row with place, IP, and last active. This prep does not add that table and does not show the component. |
| Flip Text | Wizard finish heading only, if Ben says install. | Decision 4. |

Reject frosted glass, blur-in springs, the infinite ping ring, and a second filled blue in the toolbar.

## Copy

One copy module per page, read by the language-lock test. Product words:

- Accountable person, for the adult who answers for someone's growth.
- Person in development, for the person growing. Login none. No photo. No public URL.
- Family and Team, for the two rooms.
- Team practice, for the team room that used to read as team coaching.

Visible copy drops these:

- Gym, Foundry, Retainer.
- Learn with Ben, as a product name.
- Parent-only or child-only framing on titles. Code ids such as `hire-child` may stay until M15. Visible strings change.
- `skill_states` in rendered copy. The table name in `app/src/lib/db/schema.ts` may stay.
- Operator, as a product word.
- An em dash.

Seed labels on this main that the UI pull request renames in copy, without writing production rows:

| Today | Where | Replacement |
| --- | --- | --- |
| Play Child | `app/src/lib/progress/supervised-portion.ts`, `supervised-path.ts`, `supervised-brain.ts` | A person-in-development label Ben's language lock accepts. The UI pull request uses "Person in development" until Ben supplies a shorter label. |
| Hire Child | Same files | Same rule. |
| Child subset | `app/src/app/pattern/page.tsx` | The assessments track. `/pattern` merges into `/profile/assessments`. |
| Children database | `app/src/app/admin/page.tsx`, `app/src/app/o/[slug]/page.tsx` | People in development. |

`/brain` requires sign-in. The public seed copy closes with that redirect. The brain workspace itself is M11, reached at `/library/brain`.

This prep does not rename production people, does not run a test-row reset, and does not run a tenancy backfill.

## Redirect snapshot

The UI pull request snapshots every row below in `app/scripts/m9-shell.test.mjs`. This prep does not add the routes.

Four rows from the 8 Oct route table are superseded by the 8 Oct 4:50 PM comment on issue 363 and by the M8 spec. M9 leaves them to M8:

| Route | Superseded rule |
| --- | --- |
| `/pricing` | Stays. It is the Coaching pricing page. |
| `/cart` | Redirects to `/pricing`. |
| `/checkout` | Redirects to `/pricing`. Webhook code stays. |
| `/checkout/success` | Stays. |

`CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay false, so those pages do not open a live charge.

The remaining rows are the M9 contract. A move keeps the old path as a redirect. A merge folds the old page into the target. A retire leaves a redirect or an export, then drops the page. Targets owned by a later stream render the shell and an honest empty state at 200. They do not build that stream's product.

| Group | Today's route | Action | Target | Later stream, if any |
| --- | --- | --- | --- | --- |
| Home | `/` | Keep | Guest: hero C, sign in, free course, free assessment. Signed in: `/dashboard` | Hero C waits on decision 3 |
| Home | `/dashboard` | Keep | Real Home | |
| Home | `/o/[slug]` | Merge | `/dashboard` with the switcher | |
| Home | `/o/[slug]/welcome` | Retire | Onboarding starter lesson | M12 owns the flow |
| Home | `/demo` | Retire | `/admin/demo` | |
| Learn | `/learn` | Keep | My courses and enrollments | |
| Learn | `/c/[courseSlug]` | Keep | Course outline | |
| Learn | `/c/[courseSlug]/s/[slug]` | Move | `/c/[courseSlug]/[lessonSlug]` | Lesson page body is M10 |
| Learn | `/c/[courseSlug]/exam` | Keep | Practice type exam | |
| Learn | `/c/[courseSlug]/desk` | Merge | Practice type desk_brief inside the last lesson | M10 |
| Learn | `/c/[courseSlug]/certificate` | Keep | Reads server progress | |
| Learn | `/play/lesson-spine` | Merge | Lesson with a video block | M10 |
| Learn | `/knowledge/goals` | Move | `/learn/goals` | |
| Learn | `/knowledge/goals/[outcomeId]` | Move | `/learn/goals/[outcomeId]` | |
| Learn | `/path` | Merge | `/learn/goals` (homeschool mode) | |
| Learn | `/portion` | Merge | Home next step | |
| Learn | `/intent` | Merge | Onboarding goal step | M12 |
| Learn | `/progress` | Merge | People person page, Progress tab | |
| Learn | `/quiz/[token]` | Keep | Shared practice link | |
| People | `/people` | Keep | Members and people in development of the active org | |
| People | `/people/[membershipId]` | Keep | Person page | |
| People | `/people/[membershipId]/notes` | Keep | Tab | |
| People | `/people/[membershipId]/plan` | Keep | Tab | |
| People | `/people/[membershipId]/prep` | Keep | Tab (team room) | |
| People | `/profile/kids/[membershipId]` | Move | `/people/[membershipId]`, edited by an accountable person only | |
| People | `/children` | Merge | `/people` filtered to people in development | |
| People | `/roster` | Merge | `/people` | |
| People | `/assign` | Merge | Assign action on a lesson and on a person page | |
| People | `/teach-live` | Merge | Lesson "Teach live" mode | M10 |
| People | `/skills` | Merge | Person page skills (team room) | |
| People | `/coaching/reviews` | Keep | Team practice room | Path rename is decision 5 |
| People | `/coaching/compare` | Keep | Team practice room | Decision 5 |
| People | `/tasks` | Keep | Team practice room | |
| People | `/card` | Keep | Team practice room | |
| People | `/improve` | Keep | Team practice room | |
| People | `/inbox` | Keep | Team practice room | |
| People | `/intake` | Keep | Team practice intake | |
| Library | `/library` | Keep | Workspace root returns 200 | Tree, graph, and editor are M10 |
| Library | `/o/[slug]/l` | Move | `/library` | |
| Library | `/o/[slug]/l/[lessonId]` | Move | `/library/lessons/[lessonId]` | M10 |
| Library | `/o/[slug]/teach` | Merge | `/library` editor | M10 |
| Library | `/o/[slug]/teach/[lessonId]` | Move | `/library/lessons/[lessonId]/edit` | M10 |
| Library | `/knowledge` | Move | `/library/brain` | M11 |
| Library | `/brain` | Merge | `/library/brain`, sign-in required | M11 |
| Library | `/networks` | Merge | `/library/brain?view=graph` | M11 |
| Library | `/library/wizard` | Move | New, Brain page | Menu contents are decision 2 |
| Library | `/library/video` | Move | New, Import video | Decision 2 |
| Library | `/coaching/knowledge` | Merge | `/library/brain` | M11 |
| Library | `/coaching/files` | Merge | `/library/media` | M10 |
| Library | `/coaching/products` | Merge | `/library/brain` pages | M11 |
| Library | `/coaching/questions` | Merge | Practice items in Library | M10 |
| Insights | `/insights` | Keep | Leader report, plain wording | |
| You | `/profile` | Keep | Profile M1 | |
| You | `/profile/assessments` | Keep | Assessment Wizard | |
| You | `/pattern` | Merge | `/profile/assessments` | |
| You | `/tools` | Keep | Public free assessments | |
| You | `/tools/[slug]` | Keep | Signed-in results route into the Wizard | |
| You | `/account` | Move | `/settings` | |
| You | `/settings/ai` | Keep | Settings tab | |
| You | `/metering` | Move | `/settings/billing` | Billing records are M8 |
| Public | `/share/[slug]` | Keep | Adult shares only | |
| Public | `/about` | Retire | Link to fieldschool.ai | |
| Public | `/help` | Keep | | |
| Public | `/docs/api` | Keep | Under help | |
| Public | `/privacy` | Keep | | |
| Public | `/terms` | Keep | | |
| Auth | `/login` | Keep | No form flash when signed in | |
| Auth | `/login/claim` | Keep | | |
| Auth | `/login/complete` | Keep | | |
| Auth | `/signup` | Keep | Hands off to onboarding | M12 owns the flow |
| Auth | `/request-access` | Keep | | |
| Auth | `/invite/[token]` | Keep | Joins the inviting org | |
| Staff | `/admin` | Keep | Retitle | |
| Staff | `/admin/users` | Keep | | |
| Staff | `/admin/users/[id]` | Keep | | |
| Staff | `/admin/access-requests` | Keep | | |
| Staff | `/admin/catalog` | Keep | | |
| Staff | `/admin/demo` | Keep | | |
| Staff | `/admin/forms` | Keep | Reads Postgres after M8 | |
| Staff | `/admin/notifications` | Keep | | |
| Staff | `/admin/tools` | Keep | | |
| Staff | `/operator/hire` | Retire | Staff launch tool, superseded | |
| Staff | `/operator/launch-gate` | Merge | `/admin` | |
| Staff | `/operator/publish` | Merge | Library publish | M10 |

`/library` returns 200 in the M9 UI pull request. The count in the 8 Oct comment is 87 existing routes. `/library` is the new page at the empty path.

## Already built

Leave these in place. The shell wraps them.

- AppShell, Cmd-K, and NewMenu: `app/src/components/app-shell.tsx`, `app/src/components/site-header.tsx`, `app/src/components/command-palette.tsx`. PRs 343 and 355.
- Desk: `app/src/components/desk/desk.tsx`.
- Shell route matching: `app/src/lib/shell/routes.ts`, `app/src/lib/shell/model.ts`. The UI pull request changes the door list. It keeps one room per desk.
- Shared public layout, PR 347.

## What this prep leaves untouched

`app/src`. `app/db`. `app/marketing-site`. `docs/rebuild-progress.md`. `docs/staff/state.json`. `AUTH_URL`. The two go-live flags. Profile M1 behavior. Wizard behavior. Guest Grok Bot. Quiz `source_unit_id`. The dest hash. Family LIVE `bc-4765f2f0`. Just `27pn9xs0zk8a73g`. Production data.

M9 in `docs/rebuild-progress.md` stays `not_started`. That file is the dispatcher log. This spec pull request is not the UI stream and is not a `draft_pr` acceptance.

## Test plan

Run the UI pull request's cases from `app/` after `npm ci`. This spec pull request has no UI, so those cases are not run here. A reviewer of this pull request checks the diff: the only added file is this document.

### Cases the UI pull request runs

1. `node --experimental-strip-types --test scripts/m9-shell.test.mjs`. The file snapshots every redirect in the table above, including the four superseded money rows that M9 must leave alone. It fails if a signed-in fixture still contains "What a guest keeps", if rendered copy contains `skill_states`, or if a copy module contains an em dash, Gym, Foundry, Retainer, or Learn with Ben.
2. One copy module per page. The test imports each module and checks the language lock. Parent-only titles and the seed labels in the copy table are absent from rendered strings.
3. Rail fixture, leader: the switcher plus exactly Learn, People, Library, Insights, New, then You. Member rail matches Ben's choice in decision 2.
4. Switching brain is one click and changes the desk. A family fixture shows people in development and no team members. A team fixture shows members and no people in development.
5. No filled blue in the bar or the rail. One filled blue on Home.
6. `/dashboard` renders the next-step empty state when progress rows are absent, and renders the next lesson when a fixture provides one.
7. `/library` returns 200 inside the shell.
8. `rg` over `app/src` finds no `ff6a1a`, `brand-orange`, or `brand-navy`, and `app/src/app/layout.tsx` imports neither `Inter` nor `Space_Grotesk`.
9. The wordmark is present at a 390px fixture.
10. `npm run typecheck` and `npm run build` in `app/` exit 0.
11. Profile M1 tests and Wizard tests still pass. The diff on those trees is color and copy only.
12. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` are still `false`. The test reads the two source files and asserts the export.

### Cases that stay out of the UI pull request

1. Deploy, `AUTH_URL`, live Stripe keys, and a live card.
2. Tenancy backfill and test-row reset. Ben runs those after M5, with a `pg_dump` first.
3. Active Sessions against real devices. `auth_session_revocations` is a jti list, not a device list.
4. The Library tree, the lesson block editor, and the unified brain. M10 and M11 own those. M9's stubs return 200 and stop.
5. Designer seal screenshots. Those land when the seal is given, on the UI pull request, at 1440 and 390.

### What a reviewer can check on this pull request

The diff adds `docs/rebuild/m9-shell-prep.md` and no other file. `app/src` is unchanged. The two go-live flags are unchanged. No migration is added. No deploy script runs.
