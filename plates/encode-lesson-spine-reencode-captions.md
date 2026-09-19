# LessonSpine re-encode with CaptionsBand + LowerThird

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

New dated dest only. TalkingHead/slate uses `LowerThird` (name/role) + `Karaoke` → `CaptionsBand`.

Never write:

- Just `27pn9xs0zk8a73g`
- Aug 30 `/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4`
- Prior dest `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4`

```bash
mkdir -p /opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19
node scripts/render-plate.mjs \
  --comp LessonSpine \
  --dest /opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4 \
  --lock /tmp/absent.render.lock \
  --meminfo /proc/meminfo \
  --gl=swangle
```

Clear lock + enough RAM → exit 0. Melt lock or MemAvailable < 3072 MiB → exit 75. Just / Aug 30 dest → exit 2.

Encoded 2026-09-19:

- dest: `/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4`
- sha256: `ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211`
- ffprobe: h264 1920×1080 30/1 duration 41.000000
- render-lock exit 0
- checklist exit 0 (`hold_cleaning: true`, `auto_flip: false`)

Score (no live flip):

```bash
node scripts/cleaning-checklist-lesson-spine.mjs \
  --dest /opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4 \
  --report plates/cleaning-checklist-lesson-spine-reencode-captions.md
```
