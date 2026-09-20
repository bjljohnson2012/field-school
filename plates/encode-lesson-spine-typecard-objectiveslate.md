# LessonSpine re-encode with TypeCard + ObjectiveSlate polish

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

New dated dest only. Bundles PR 97 ObjectiveSlate last-word “beat”, PR 98 TypeCard claim last-word ticks, plus the locked slate stack (PR 85–96). Factory TypeCard + AudioBed + Letterbox + OverlayLock + Karaoke. LessonSpine objective beat stays DefinitionBoard. No Cap A-roll.

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
- Prior dest `/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4` (`eaf6f84a…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4` (`d0a09896…`)

```bash
mkdir -p /opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20
node scripts/render-plate.mjs \
  --comp LessonSpine \
  --dest /opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4 \
  --lock /tmp/absent.render.lock \
  --meminfo /proc/meminfo \
  --gl=swangle
```

Encoded 2026-09-20:

- dest: `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4`
- sha256: `3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5`
- ffprobe: h264 1920×1080 30/1 duration 41.000000 (video only; silent AudioBed muxes no audio stream)
- render-lock exit 0
- checklist exit 0 (`hold_cleaning: true`, `auto_flip: false`)
- `--flip` exit 2
- prior dest **files** untouched: slate `d0a09896…`, edu-s02 `eaf6f84a…`, edu-s01 `cab8bd91…`, typecard `27cc5bf3…`, karaoke / audiobed `9f89f9a9…`, letterbox `028d16e4…`, first `a5d08284…`, captions `ec88d257…`
- sting still: `LessonSpine-sting-f42.png` (Opener kicker “Lesson” + gold “Things” + claim “docked.” + ObjectiveSlate “beat”)
- slate still: `LessonSpine-slate-f345.png` (TalkingHead kicker “Slate” + gold “full-bleed” + claim “left.”)
- objective still: `LessonSpine-objective-f570.png` (DefinitionBoard gold “motion”)
- recap still: `LessonSpine-recap-f864.png` (Recap kicker “Recap” + gold “card” + claim ticks)
- next-up still: `LessonSpine-nextup-f1050.png` (kicker “Next up” + gold “draw?”)
