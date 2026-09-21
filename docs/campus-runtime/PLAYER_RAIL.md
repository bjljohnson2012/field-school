# LessonSpine Next player rail

2026-09-21. Parent plays the locked LessonSpine master in campus Next. HTML5 `<video>` + chapter rail. No `@remotion/*` in campus. No Distribute. Launch stays **CLOSED**, **0/8**.

## Route

- Page: [`/play/lesson-spine`](https://portal.fieldschool.ai/play/lesson-spine)
- Stream: [`GET /api/media/lesson-spine`](https://portal.fieldschool.ai/api/media/lesson-spine)
- Static archive copy: [`/lessons/LessonSpine.mp4`](https://portal.fieldschool.ai/lessons/LessonSpine.mp4)

Guest unsigned `GET /api/me` stays `{authenticated:false,guest:true}`. Guest `GET /api/plates` stays 401.

## Master source (untouched)

`/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4` sha256 `af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4`.

Campus archive copy: `/opt/cursor/artifacts/campus-lesson-spine-master/2026-09-21/LessonSpine.mp4` (same sha256). Public copy: `app/public/lessons/LessonSpine.mp4`.

Priors untouched: analogy `a556a0b5…`, evidence `5d0499f6…`, rubric `4aef4c71…`, threshold `955f0256…`, spectrum `496f506b…`.

## Rail

ORDER LOCK ticks only: Sting 0–10s → Slate 10–18s → Objective 18–24s → Recap 24–34s → Next up 34–41s. 1230 frames @ 30 fps.

## Overlay

`app/deploy/overlay-player-rail.sh` — family hash abort, `--no-deps app`, no `deploy.sh` wipe, no org home, no family chrome.
