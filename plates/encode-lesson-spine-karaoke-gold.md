# LessonSpine re-encode with karaoke gold

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

New dated dest only. `CaptionsBand` drives word-level karaoke via `wordClock`. Active word gold `#C4A35A` plus gold tick. Fixture word times. No WhisperX. No Cap take.

Never write:

- Just `27pn9xs0zk8a73g`
- Aug 30 `/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4`
- Prior dest `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4` (`a5d08284…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4` (`ec88d257…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4` (`028d16e4…`)

```bash
mkdir -p /opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20
node scripts/render-plate.mjs \
  --comp LessonSpine \
  --dest /opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4 \
  --lock /tmp/absent.render.lock \
  --meminfo /proc/meminfo \
  --gl=swangle
```

Clear lock + enough RAM → exit 0. Melt lock or MemAvailable < 3072 MiB → exit 75. Just / Aug 30 dest → exit 2.

Encoded 2026-09-20:

- dest: `/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4`
- sha256: `9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f`
- ffprobe: h264 1920×1080 30/1 duration 41.000000
- render-lock exit 0
- checklist exit 0 (`hold_cleaning: true`, `auto_flip: false`)
- `--flip` exit 2
- prior dests untouched: `a5d08284…`, `ec88d257…`, `028d16e4…`

Score (no live flip):

```bash
node scripts/cleaning-checklist-lesson-spine.mjs \
  --dest /opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4 \
  --report plates/cleaning-checklist-lesson-spine-karaoke-gold.md
```
