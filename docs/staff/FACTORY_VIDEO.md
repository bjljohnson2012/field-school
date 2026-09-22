# Factory video (simple)
Dated 21 Sep 2026. Serves BUILD_GRAPH N5 (video in) and N13 (make video).
Launch stays CLOSED. This is not 8/8. Remotion stays in `plates/`. No Remotion-in-Next.

The factory sucks because `plates/AGENTS.md` lists ~30 antagonist cards and a 34-layer order. Karaoke gold is a dest ritual. `plates/package.json` does not even depend on `@remotion/captions`. Agents wander the catalog instead of cutting one take.

## What you actually need

Three tools. One JSON. Four plates.

| Tool | Why | Install |
| --- | --- | --- |
| [WhisperX](https://github.com/m-bain/whisperX) | Word-level start/end (wav2vec2 align). Better karaoke than raw Whisper. Diarize later. | `pip install whisperx` + ffmpeg |
| [@remotion/captions](https://www.remotion.dev/docs/captions/caption) | Caption `{text, startMs, endMs}` + `createTikTokStyleCaptions()` | `cd plates && npx remotion add @remotion/captions` |
| [Remotion agent skills](https://www.remotion.dev/docs/ai/skills) | Agents render instead of inventing cards | `cd plates && npx skills add remotion-dev/skills` |
| [agent-plugin](https://github.com/remotion-dev/agent-plugin) | Cursor/Copilot plugin. Same as cursor-plugin, portable | Marketplace, or `git clone https://github.com/remotion-dev/cursor-plugin.git ~/.cursor/plugins/local/remotion` |

Do not install Remotion MCP. Do not add `word-by-word-captions` (ffmpeg burn). Do not add remotion-captioneer. Do not add a 31st antagonist card.

## One pipeline

```
take.mp4
  → ffmpeg -i take.mp4 -ar 16000 take.wav
  → whisperx take.wav --model large-v2 --language en --device cpu --compute_type int8
  → take.json          (WhisperX segments[].words[])
  → scripts/whisperx-to-captions.mjs
  → take.captions.json (@remotion/captions Caption[])
  → ReviewRail (edit words, approve chapters)
  → npx remotion render LessonSpine out/master.mp4 --props captions+src
  → cuts.json (9:16 later)
```

WhisperX Python (align is the point):

```python
# transcribe (no timestamps) → align (word start/end) → optional diarize
# result["segments"][i]["words"] = [{word, start, end}]
```

Map to Remotion (whitespace before each word, required):

```js
const captions = words.map((w) => ({
  text: ` ${w.word}`,
  startMs: Math.round(w.start * 1000),
  endMs: Math.round(w.end * 1000),
  timestampMs: null,
  confidence: null,
}));
```

Then `createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 1200 })` for pages. Karaoke highlights `tokens` on the current word. Cream / ink / Fraunces. Lower third only. Not a new plate type.

## Four plates. That is the catalog.

ORDER LOCK stays: Opener → TalkingHead → RecapCard → QuizBumper.
Captions are a **layer** on TalkingHead / LessonSpine, not a 35th sibling.
Layer order for a real take: bed → talking-head → captions → letterbox → audio.
Everything else in `plates/antagonist-*.md` is craft history. Do not render it on a live take.

Just `27pn9xs0zk8a73g` stays locked. `render.lock` still blocks a second melt. Celery (N12) replaces that lock when the worker exists.

## Agent skills (invoke these, not Wave 5)

```
/remotion-best-practices
/remotion-captions
/remotion-markup
/remotion-render
/remotion-studio
```

Render: `npx remotion render LessonSpine out/master.mp4 --concurrency=2`
Studio: `npx remotion studio` in `plates/`
Still refuse MemAvailable < 3072 MiB and Just.

## VPS truth

`2.24.70.248` is not a CUDA box. WhisperX `large-v2` on GPU wants CUDA 12.8. On this VPS:

- v1: `whisperx --model medium --device cpu --compute_type int8`
- Faster later: Groq/OpenAI for text, **still run WhisperX align** if you need karaoke, or accept `@remotion/install-whisper-cpp` `toCaptions()` (official, CPU, worse align than WhisperX)
- Diarization needs a Hugging Face token and pyannote agreement. Skip until two speakers are real. One talking head does not need it.

## What not to do

- Resume antagonist-full-set / karaoke-gold dest SHA as the job
- Package Remotion into Next
- Lambda
- New plate types for captions
- Whisper without align (segment times only — karaoke will suck)
- 9:16 pack this cycle (cuts.json is enough)

## Done when (N5 / N13)

One Cap take in, one `master.mp4` out, captions on the words Ben said, ReviewRail can fix a wrong word, four plates only, dest hash untouched, Just untouched.
