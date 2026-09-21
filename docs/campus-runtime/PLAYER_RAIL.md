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

## Overlay

`app/deploy/overlay-player-rail.sh` — family hash abort, `--no-deps app`, no `deploy.sh` wipe, no org home, no family chrome. Overlay does not rewrite AUTH_URL.
