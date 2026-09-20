# LessonSpine re-encode with Letterbox + soft-polish

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

New dated dest only. Every spine plate uses `Letterbox` + `OverlayLock` (30px / `0.02em` / `0.2em`) + `Karaoke` → `CaptionsBand`. Slate TalkingHead also uses `LowerThird` name/role.

Never write:

- Just `27pn9xs0zk8a73g`
- Aug 30 `/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4`
- Prior dest `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4` (`a5d08284…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4` (`ec88d257…`)

```bash
mkdir -p /opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20
node scripts/render-plate.mjs \
  --comp LessonSpine \
  --dest /opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4 \
  --lock /tmp/absent.render.lock \
  --meminfo /proc/meminfo \
  --gl=swangle
```

Clear lock + enough RAM → exit 0. Melt lock or MemAvailable < 3072 MiB → exit 75. Just / Aug 30 dest → exit 2.

Encoded 2026-09-20:

- dest: `/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4`
- sha256: `028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98`
- ffprobe: h264 1920×1080 30/1 duration 41.000000
- render-lock exit 0
- checklist exit 0 (`hold_cleaning: true`, `auto_flip: false`)
- `--flip` exit 2
- prior dests untouched: `a5d08284…`, `ec88d257…`

Score (no live flip):

```bash
node scripts/cleaning-checklist-lesson-spine.mjs \
  --dest /opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4 \
  --report plates/cleaning-checklist-lesson-spine-letterbox-encode.md
```
