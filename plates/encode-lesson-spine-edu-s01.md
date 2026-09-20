# LessonSpine re-encode with EDU-S01 objective slate

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

New dated dest only. Includes PR 85 `ObjectiveSlate` (“You will be able to” / `draw one idea per beat`) on Opener sting and RecapCard return. Factory TypeCard + AudioBed + Letterbox + OverlayLock + Karaoke. No Cap A-roll.

Never write:

- Just `27pn9xs0zk8a73g`
- Aug 30 `/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4`
- Prior dest `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4` (`a5d08284…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4` (`ec88d257…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4` (`028d16e4…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4` (`9f89f9a9…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4` (`9f89f9a9…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4` (`27cc5bf3…`)

```bash
mkdir -p /opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20
node scripts/render-plate.mjs \
  --comp LessonSpine \
  --dest /opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4 \
  --lock /tmp/absent.render.lock \
  --meminfo /proc/meminfo \
  --gl=swangle
```

Encoded 2026-09-20:

- dest: `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4`
- sha256: `cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf`
- ffprobe: h264 1920×1080 30/1 duration 41.000000 (video only; silent AudioBed muxes no audio stream)
- render-lock exit 0
- checklist exit 0 (`hold_cleaning: true`, `auto_flip: false`)
- `--flip` exit 2
- prior dest **files** untouched: typecard `27cc5bf3…`, karaoke / audiobed `9f89f9a9…`, letterbox `028d16e4…`, first `a5d08284…`, captions `ec88d257…`
- sting still: `LessonSpine-sting-f30.png` (EDU-S01 “You will be able to”)
- recap still: `LessonSpine-recap-f864.png` (same objective returned)
