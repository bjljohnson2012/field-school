# LessonSpine re-encode with EDU-S02 signaling

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

New dated dest only. Bundles PR 85 `ObjectiveSlate` (“You will be able to” / `draw one idea per beat`), PR 88 DefinitionBoard last-word gold tick, PR 89 QuizBumper “Next up” + last-word gold tick. Factory TypeCard + AudioBed + Letterbox + OverlayLock + Karaoke. No Cap A-roll.

Never write:

- Just `27pn9xs0zk8a73g`
- Aug 30 `/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4`
- Prior dest `/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4` (`a5d08284…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4` (`ec88d257…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4` (`028d16e4…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4` (`9f89f9a9…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-audiobed-encode/2026-09-20/LessonSpine.mp4` (`9f89f9a9…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4` (`27cc5bf3…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4` (`cab8bd91…`)

```bash
mkdir -p /opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20
node scripts/render-plate.mjs \
  --comp LessonSpine \
  --dest /opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4 \
  --lock /tmp/absent.render.lock \
  --meminfo /proc/meminfo \
  --gl=swangle
```

Encoded 2026-09-20:

- dest: `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4`
- sha256: `eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8`
- ffprobe: h264 1920×1080 30/1 duration 41.000000 (video only; silent AudioBed muxes no audio stream)
- render-lock exit 0
- checklist exit 0 (`hold_cleaning: true`, `auto_flip: false`)
- `--flip` exit 2
- prior dest **files** untouched: edu-s01 `cab8bd91…`, typecard `27cc5bf3…`, karaoke / audiobed `9f89f9a9…`, letterbox `028d16e4…`, first `a5d08284…`, captions `ec88d257…`
- sting still: `LessonSpine-sting-f30.png` (EDU-S01 “You will be able to”)
- objective still: `LessonSpine-objective-f570.png` (EDU-S02 gold “motion”)
- next-up still: `LessonSpine-nextup-f1050.png` (kicker “Next up” + gold “draw?”)
