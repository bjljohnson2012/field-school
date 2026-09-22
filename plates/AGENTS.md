# Field School plates (Remotion)

When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.

Operator-only. Cap plus Remotion plus edit spec. Not a campus or student product. Not the factory hour-master melt path except as fallback.

Launch stays CLOSED, 0/8.

Do not add campus UI. Do not add a student-facing AI builder. Do not campus-package Remotion into `app/`. Do not accept a cleaning flip or Publish from this package. Do not install Remotion MCP.

## Live catalog

Four plates, plus a captions layer:

1. Opener
2. TalkingHead (Remotion composition id `TalkingHeadCard`)
3. RecapCard
4. QuizBumper

Captions are a layer, not a fifth plate. On a live take the order is bed, talking-head, captions, letterbox, audio. Later sibling sits on top. No z-index.

1920x1080 at 30fps. Cream `#EFE7D6`, ink `#1A1A16`, gold `#C4A35A`, Fraunces. Dock the talking-head card to about 38% width (`dock-right` or `dock-left`). Never full-bleed over type.

Motion uses `useCurrentFrame` plus `interpolate` only. No CSS keyframes. No 9:16 pack. No Remotion Lambda.

Antagonist cards under `antagonist-*.md` are craft history. Do not render antagonist cards.

## WhisperX

Diarization off.

```
ffmpeg -i take.mp4 -ar 16000 take.wav
whisperx take.wav --model medium --device cpu --compute_type int8
```

`take.json` is WhisperX `segments[].words[]`. Map with `node scripts/whisperx-to-captions.mjs take.json`. Each Caption gets one space before the word. `start` and `end` are seconds. `startMs` and `endMs` are milliseconds. `timestampMs` and `confidence` stay null. Speaker labels are ignored.

## Locks

Just `27pn9xs0zk8a73g` stays locked. Do not render it. Also refuse Aug 30 `vox/everything-made-up.mp4`.

`node scripts/render-plate.mjs` waits if melt `render.lock` exists or MemAvailable is under 3072 MiB. CPU cap `--concurrency=2`.

This stream does not render.
