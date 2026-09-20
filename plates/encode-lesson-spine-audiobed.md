# LessonSpine re-encode with AudioBed

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

New dated dest only. Every spine plate uses `AudioBed` + `Letterbox` + `OverlayLock` (30px / `0.02em` / `0.2em`) + `Karaoke` → `CaptionsBand` + `LowerThird`. Silent fixture bed. No Cap A-roll.

Never write:

- Just `27pn9xs0zk8a73g`
- Aug 30 `/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4`
- Prior dest `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4` (`a5d08284…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4` (`ec88d257…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4` (`028d16e4…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4` (`9f89f9a9…`)

```bash
mkdir -p /opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20
node scripts/render-plate.mjs \
  --comp LessonSpine \
  --dest /opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4 \
  --lock /tmp/absent.render.lock \
  --meminfo /proc/meminfo \
  --gl=swangle
```

Clear lock + enough RAM → exit 0. Melt lock or MemAvailable < 3072 MiB → exit 75. Just / Aug 30 dest → exit 2.

Encoded 2026-09-20:

- dest: `/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4`
- sha256: pending encode
- ffprobe: pending encode
- render-lock: pending encode
- checklist: pending encode
- `--flip` exit 2
- prior dests untouched: `9f89f9a9…`, `028d16e4…`, `a5d08284…`, `ec88d257…`

Score (no live flip):

```bash
node scripts/cleaning-checklist-lesson-spine.mjs \
  --dest /opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4 \
  --report plates/cleaning-checklist-lesson-spine-audiobed-encode.md
```
