# Field School Remotion course videos

Cap is capture. Remotion is editorial. Student deliverable is 16:9 lesson master. CapCut shorts later via `cuts.json`.

This file is law for every episode chat. Paste it as the first message. Cursor invents website layouts until this file is in the tree.

## Why prompts fail

Cursor treats Remotion like a React website. It invents CSS keyframes, z-index, full-frame talking heads, and guessed shot times. Education video needs the opposite: frame-driven motion, a fixed layer stack, and type that appears on the spoken word.

WhisperX sitting on the machine does nothing until alignment output becomes `captions.json` and that file drives plates, cuts, Vox snaps, and SFX.

## Packages

Pin every Remotion package to the same exact version. No carets. Current pin: `4.0.518`.

```
remotion
@remotion/cli
@remotion/media
@remotion/captions
@remotion/rounded-text-box
@remotion/layout-utils
@remotion/google-fonts
@remotion/transitions
@remotion/shapes
@remotion/paths
@remotion/effects
```

| Package | Use |
| --- | --- |
| `@remotion/media` or `OffthreadVideo` | Cam and screen. Never raw HTML `video`. |
| `@remotion/captions` | `createTikTokStyleCaptions` from WhisperX words. |
| `@remotion/rounded-text-box` + `@remotion/layout-utils` | Measured karaoke plates. A `div` with `borderRadius` is not the same thing. |
| `@remotion/google-fonts` | Load Fraunces / Source Serif 4 / IBM Plex Sans before measuring text. |
| `@remotion/transitions` | Fade through brand color. Slide into B-roll. `TransitionSeries`, not CSS fades. |
| `@remotion/shapes` + `@remotion/paths` | Arrows, underlines, annotation strokes on Vox beats. |
| `@remotion/effects` | `paper()` on Vox walls. Grain and fold, not a CSS background image. |

Skills live in `.agents/skills`. Install with `npx skills add remotion-dev/skills`. Use `remotion-best-practices` when unsure, `remotion-markup` for type and timing, `remotion-studio` for preview, `remotion-render` for mp4.

## Forbidden motion

No CSS `@keyframes`. No `transition:`. No `requestAnimationFrame`. Motion only through `useCurrentFrame()`, `interpolate()`, `spring()`, and `Sequence`.

Allowed cuts:

- hard cut on a WhisperX silence >= 400ms
- 8-frame fade through brand color
- 10-frame head-dock slide into screen cover
- 16-frame letterbox close-in into a Vox beat

Hostinger box: `--concurrency=1`. Proof render before a master:

```
npx remotion render src/index.ts FieldSchoolPreview out/preview.mp4 --frames=0-150 --concurrency=1
```

## WhisperX is the clock

`transcribe()` has no usable word times. `align()` does.

1. Enhance VO with `scripts/enhance-vo.sh`.
2. Run `scripts/run-whisperx.sh` on that same wav. CPU: `small`, `int8`.
3. Convert `segments[].words[]` with `scripts/whisperx-to-captions.mjs` to `public/episodes/{slug}/captions.json`.
4. Feed that file to `createTikTokStyleCaptions`.
5. Drive Vox snaps and SFX from keyword hits on the same timestamps.

Same enhanced file for Remotion audio and for WhisperX. Two different files make words drift off the mouth.

Silence: >= 400ms is a legal hard cut or B-roll swap. >= 800ms is a legal Vox enter.

Karaoke: words appear at `fromMs`. Active word gold `#C4A35A` and slightly scaled. Plate path once per page. Captions render after the talking head in the JSX tree.

If `captions.json` is missing, Cursor will time cards by vibes. That is the usual failure.

## The edit file

`public/episodes/{slug}/episode.json` is the edit. Components are dumb players of that file.

Shot types: `sting` | `hook` | `a-roll` | `b-roll` | `vox` | `cta`

Course lesson spine:

1. sting
2. course / module / lesson slate
3. objective card
4. hook
5. teach (docked A-roll + karaoke)
6. show (screen full-bleed, head to PiP or off)
7. Vox beat
8. do card
9. recap plates
10. next-up slate
11. sting tail

Explainer / Vox film (Everything Is Made Up) is not a lesson. Spine: sting, hook, teach/vox loop, cta. No module slate, do-card, or next-up.

Each shot needs `fromFrame`, `durationInFrames`, `layout`, `text`, `assets[]`, `sfx[]`. Keyword cues belong in the same JSON.

## Frozen kit

Reuse these. Do not redesign them.

- `src/components/layers/Stack.tsx`
- `src/components/head/TalkingHead.tsx` (`dock-left` | `dock-right` | `pip-tl` | `pip-tr` | `off`)
- `src/components/vox/CollageBeat.tsx`
- `src/components/boxes/CaptionPlate.tsx`
- `src/components/boxes/KaraokePlate.tsx`
- `src/components/boxes/LowerThird.tsx`
- `src/components/boxes/Letterbox.tsx`
- `src/components/audio/Beds.tsx`
- `src/brand/tokens.ts`
- `src/brand/audio.ts`
- `src/schema/episode.ts`

Layer order is DOM order. Later sibling sits on top. No z-index.

Required stack, back to front: brand bed / paper wall, B-roll or screen, Vox collage, talking head, lower third, caption / karaoke plate, letterbox and chrome, audio tags.

Dock the head to ~38% width. Full-frame head after the hook is a failure.

Everything Is Made Up lives in `src/madeup/`. Do not overwrite `FieldSchoolClip`. Do not start an hour master. Do not flip AUTH_URL. Stay 16:9.

## Brand

Field School: night `#11140C`, paper `#EFE7D6`, ink `#1A1A16`, gold `#C4A35A`, olive `#6B7F4F`. Fraunces 700 / Source Serif 4 500 / IBM Plex Sans 600.

`FieldSchoolClip` wheat look-dev stays cream `#f6f3ec` / blue `#1f5eff`. Do not overwrite it.

VO stays the hero. Bed around 0.12 on a lesson teach. Never duck the Cap track.

Audio on disk: `public/bed.wav`, `public/sfx/sting.wav`, `public/sfx/whoosh.wav`, `public/sfx/tick.wav`, `public/sfx/hit.wav`. Paths are in `src/brand/audio.ts`.

## How to run a new episode

1. Paste this file first.
2. Read `episode.json` and `captions.json`. Do not touch components until the shot list matches the WhisperX clock.
3. One composition at a time. Preview in Studio.
4. Five-second proof render before a full master.
5. Paste a Studio screenshot when type is covered or a transition is wrong.

Stop after `out/{slug}/master-16x9.mp4` plus `cuts.json`. CapCut owns the 9:16 punch-ins.

See `../../../video-pipeline/CURSOR_FOLLOWUP.md` for the punch list.
