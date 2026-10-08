# LessonSpine Next player rail

2026-09-21. Parent plays the locked LessonSpine master in campus Next. HTML5 `<video>` + chapter rail. Ready / HLS after play-rail Cleaning PASS. No `@remotion/*` in campus. No Distribute. Launch stays **CLOSED**, **0/8**.

## Route

- Page: [`/play/lesson-spine`](https://portal.fieldschool.ai/play/lesson-spine)
- Stream: [`GET /api/media/lesson-spine`](https://portal.fieldschool.ai/api/media/lesson-spine)
- Ready: [`GET /api/media/lesson-spine/ready`](https://portal.fieldschool.ai/api/media/lesson-spine/ready)
- HLS: [`/lessons/hls/LessonSpine.m3u8`](https://portal.fieldschool.ai/lessons/hls/LessonSpine.m3u8)
- Static archive copy: [`/lessons/LessonSpine.mp4`](https://portal.fieldschool.ai/lessons/LessonSpine.mp4)

Guest unsigned `GET /api/me` stays `{authenticated:false,guest:true}`. Signed-in Parent `/api/me` is `{authenticated:true}` (`guest` absent / false). Guest `GET /api/plates` stays 401. Sign-in return path: `/login?next=/play/lesson-spine`. AUTH_URL is `https://portal.fieldschool.ai`. `university.benjohnson.ai` 301s there.

## Master source (untouched)

`/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4` sha256 `af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4`.

Campus archive copy: `/opt/cursor/artifacts/campus-lesson-spine-master/2026-09-21/LessonSpine.mp4` (same sha256). Public copy: `app/public/lessons/LessonSpine.mp4`.

Priors untouched: analogy `a556a0b5…`, evidence `5d0499f6…`, rubric `4aef4c71…`, threshold `955f0256…`, spectrum `496f506b…`.

## Rail

ORDER LOCK ticks only: Sting 0–10s → Slate 10–18s → Objective 18–24s → Recap 24–34s → Next up 34–41s. 1230 frames @ 30 fps.

## Cleaning auto-flip (play rail only)

`plates/scripts/cleaning-auto-flip-play-rail.mjs` flips `hold_cleaning` for this rail only after checklist PASS on dest sha256 `af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4`. Global `cleaning-checklist-lesson-spine.mjs --flip` stays refused. `cleaningAutoFlipReady` stays false when `shipGreen` is false. Evidence: `plates/cleaning-auto-flip-play-rail.md`.

## Publish Ready / HLS

`app/scripts/publish-lesson-spine-hls.mjs` ffmpeg HLS from the campus archive copy (not the source dest). Artifact `/opt/cursor/artifacts/lesson-spine-play-rail-hls/2026-09-21/`. Public `/lessons/hls/`. Ready manifest `public/lessons/hls/ready.json`. Distribute HELD.

## AUTH_URL signed-in Parent

Live `AUTH_URL=https://portal.fieldschool.ai`. Providers: Google, X, credentials. Parent signs in and returns to `/play/lesson-spine`. Guest play stays open. Distribute HELD. Launch **CLOSED**, **0/8**.

## Stripe live Learn with Ben

Hire Learn with Ben on the play rail. Unlocked amounts only: `$100` `/checkout?plan=100`, `$200` `/checkout?plan=200`, `$1,000` `/checkout?plan=1000`. Live Payment Links on the fieldschool.ai Stripe account. `STRIPE_WEBHOOK_SECRET` is set; `STRIPE_SECRET_KEY` stays optional (Payment Link path). No new dollars. Guest play and AUTH signed-in stay. FR-KB-3 metering UI at [`/metering`](https://portal.fieldschool.ai/metering). Price source: locked Learn with Ben market-research unlock. Distribute HELD. Launch **CLOSED**, **0/8**.

## Publish polish operator path

Operator evidence on the Ready HLS rail. File `public/lessons/hls/publish-polish.json`. Unsigned `GET /api/media/lesson-spine/publish` returns `published:true`, `polish:true`, `distribute:false`, `launch:"CLOSED 0/8"`, and rows. Staff `POST` appends a row for dest sha256 `af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4` only; `distribute:true` is refused. Page [`/operator/publish`](https://portal.fieldschool.ai/operator/publish). Ready JSON keeps `published:true` `publish:"polished"`. Distribute HELD. Launch **CLOSED**, **0/8**.

## Launch-gate evidence rows

Honest hire-path rows only. Page [`/operator/launch-gate`](https://portal.fieldschool.ai/operator/launch-gate). Unsigned `GET /api/media/lesson-spine/launch-gate` plus `public/lessons/hls/launch-gate.json`. Rows: play rail, AUTH signed-in, Stripe `$100`/`$200`/`$1,000`, `/metering` fr-kb-3, Publish polish. Each row `landed:true` and `launch_pass:false`. Eight nodes stay HELD. Product stays HELD. Distribute HELD. Launch **CLOSED**, **0/8**.

## Stripe webhook hire activation

After Parent pays Learn with Ben, `POST /api/stripe/webhook` activates the hire for `$100` / `$200` / `$1,000` only (`10000` / `20000` / `100000` cents). File evidence `public/lessons/hls/hire-activation.json` plus `/app/data/hire-activation.json`. Unsigned `GET /api/billing/hire`. Operator page [`/operator/hire`](https://portal.fieldschool.ai/operator/hire). Checkout status sets `hireActivated` and `next:"/metering"`. Success copy returns Parent to `/metering` and `/play/lesson-spine`. Credit ledger stays family-mode. No new dollars. Live card charge not run this round; signed-fixture dry-run is the proof. Distribute HELD. Launch **CLOSED**, **0/8**.

## Parent-supervised progress (FR-6 / FR-2)

Parent sees Now / Confidence / Next under the selected Child after hire and play. Page [`/progress`](https://portal.fieldschool.ai/progress). Unsigned `GET /api/progress/supervised`. File `public/lessons/hls/supervised-progress.json`. Child ≠ User. No child login. Does not edit FamilyV1Home or children-database. Family LIVE `bc-4765f2f0` not stolen. Distribute HELD. Launch **CLOSED**, **0/8**.

## Parent-owned intent (FR-3 / FR-2)

Parent captures and owns intent under the selected Child so path planning starts from parent intent, not child login. Page [`/intent`](https://portal.fieldschool.ai/intent). Unsigned `GET /api/progress/intent`. Parent `POST /api/progress/intent` writes the tracked child `play-child` only. File `public/lessons/hls/supervised-intent.json`. Child ≠ User. No child login. Does not call family `/api/intent` or write `learning_intents`. Does not edit FamilyV1Home or children-database. Family LIVE `bc-4765f2f0` not stolen. Distribute HELD. Launch **CLOSED**, **0/8**.

## Parent-path assembly (FR-4 / FR-3)

Parent gets a path assembled under the selected Child from parent-owned intent. Page [`/path`](https://portal.fieldschool.ai/path). Unsigned `GET /api/progress/path`. Parent `POST /api/progress/path` assembles the tracked child `play-child` from FR-3 intent. File `public/lessons/hls/supervised-path.json`. Child ≠ User. No child login. Does not call family `/api/curriculum` or write `curriculum_paths`. Does not edit FamilyV1Home or children-database. Family LIVE `bc-4765f2f0` not stolen. Distribute HELD. Launch **CLOSED**, **0/8**.

## Parent next-portion (FR-5)

Parent sees the next slice of the assembled path under the selected Child, bound to parent-owned intent. Page [`/portion`](https://portal.fieldschool.ai/portion). Unsigned `GET /api/progress/portion`. Parent `POST /api/progress/portion` locks or overrides the tracked child `play-child` only. File `public/lessons/hls/supervised-portion.json`. Child ≠ User. No child login. Does not call family `/api/curriculum`, `/api/intent`, or `/api/portion`. Does not write `curriculum_paths`, `learning_intents`, `next_portions`, or `next_portion_items`. Does not edit FamilyV1Home or children-database. Family LIVE `bc-4765f2f0` not stolen. Distribute HELD. Launch **CLOSED**, **0/8**.

## Knowledge brain (FR-KB-1)

Parent starts and sees a durable knowledge brain under the selected Child so curriculum and confidence attach to that brain, not a one-off page. Page [`/brain`](https://portal.fieldschool.ai/brain). Unsigned `GET /api/progress/brain`. Parent `POST /api/progress/brain` starts or updates the tracked child `play-child` only. File `public/lessons/hls/supervised-brain.json`. Child ≠ User. No child login. Does not call family `/api/brain` or `/api/portion`. Does not write `knowledge_brains`, `growth_units`, or `next_portions`. Does not edit FamilyV1Home or children-database. Family LIVE `bc-4765f2f0` not stolen. Distribute HELD. Launch **CLOSED**, **0/8**.

## Hire-path sync (FR-KB-2)

Parent hire path writes into and reads from the knowledge brain under the selected Child so private curriculum and confidence stay on that brain. Page [`/brain`](https://portal.fieldschool.ai/brain). Unsigned `GET /api/progress/brain` reflects intent / path / portion after hire-path use. Parent `POST`/`PUT /api/progress/brain` with action `sync` persists those snapshots for the tracked child `play-child` only. Intent, path, and portion POSTs also sync. File `public/lessons/hls/supervised-brain.json`. Child ≠ User. No child login. Does not call family campus object sync. Does not write `knowledge_brains` or `growth_units`. Does not edit FamilyV1Home or children-database. Family LIVE `bc-4765f2f0` not stolen. Distribute HELD. Launch **CLOSED**, **0/8**.


## Sources and notes (FR-KB-1 / FR-KB-2)

Parent writes sources and notes into the hire-path knowledge brain under the selected Child so private curriculum and confidence stay on that brain. Page [`/brain`](https://portal.fieldschool.ai/brain). Unsigned `GET /api/progress/brain` shows `sources>=1` and `notes>=1` after Parent `POST`. The tracked child `play-child` only. A salesperson is a login user, not a second child. File `public/lessons/hls/supervised-brain.json`. Child ≠ User. No child login. Does not call family `/api/brain`. Does not write `knowledge_brains` or `growth_units`. Does not edit FamilyV1Home or children-database. Family LIVE `bc-4765f2f0` not stolen. Distribute HELD. Launch **CLOSED**, **0/8**.


## Brain confidence (FR-6 on FR-KB)

Parent sees and updates FR-6 confidence on the hire-path knowledge brain under the selected Child so traceable confidence stays on that brain. Page [`/brain`](https://portal.fieldschool.ai/brain). Unsigned `GET /api/progress/brain` returns parent-owned confidence. Parent `POST /api/progress/brain` action `confidence` sets Not yet / Getting there / Ready for the tracked child `play-child` only. File `public/lessons/hls/supervised-brain.json`. Child ≠ User. No child login. Does not call family `/api/brain`. Does not write `knowledge_brains` or `growth_units`. Does not edit FamilyV1Home or children-database. Family LIVE `bc-4765f2f0` not stolen. Distribute HELD. Launch **CLOSED**, **0/8**.


## Composer plates readiness

Campus edit tools on the Wave3 LIVE hire path. Unsigned `GET /api/composer` returns 200 Wave3 readiness (`composer:ready`, `launch:"CLOSED 0/8"`, `distribute:false`). Guest `/api/composer/catalog` and `/api/plates` stay `401 sign_in_required`. Signed-in Play Parent `/api/composer/catalog` and `/api/plates` return 200 (`ready:true` on plates). Does not edit FamilyV1Home or children-database. Family LIVE `bc-4765f2f0` not stolen. Distribute HELD. Launch **CLOSED**, **0/8**.

## Overlay

`app/deploy/overlay-player-rail.sh` — family hash abort, `--no-deps app`, no `deploy.sh` wipe, no org home, no family chrome. Overlay does not rewrite AUTH_URL. Live pack `/opt/field-school-packs/player-rail-campus-pack-20260921T202700Z.tar.gz` sha256 `6f91b296e2dac3055850068b9839fce9c1e38b7f13cef2d48ba7c696fcfef430`.
