# LessonSpine re-encode with PracticeCard

Locked pedagogical order: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

New dated dest only. Bundles PR 121 PracticeCard application / try-this onto the EndCard master stack (PR 85–120). Factory TypeCard + AudioBed + Letterbox + OverlayLock + Karaoke packing + ProgressRail + ChapterChip + LowerThird + CalloutCard + TransitionLuma + EndCard + PracticeCard. LessonSpine objective beat stays DefinitionBoard. No Cap A-roll.

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
- Prior dest `/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4` (`3f425456…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4` (`a11e31a3…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-lower-callout-encode/2026-09-20/LessonSpine.mp4` (`68b8378a…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-caption-overlay-encode/2026-09-20/LessonSpine.mp4` (`5b229fee…`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-transition-luma-encode/2026-09-20/LessonSpine.mp4` (`f631402a6dfbb2ca2218ea9617c7b2af527eb7e88f8df5547dc6584c9ef5a96e`)
- Prior dest `/opt/cursor/artifacts/lesson-spine-end-card-encode/2026-09-20/LessonSpine.mp4` (`073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693`)

```bash
mkdir -p /opt/cursor/artifacts/lesson-spine-practice-encode/2026-09-21
node scripts/render-plate.mjs \
  --comp LessonSpine \
  --dest /opt/cursor/artifacts/lesson-spine-practice-encode/2026-09-21/LessonSpine.mp4 \
  --lock /tmp/absent.render.lock \
  --meminfo /proc/meminfo \
  --gl=swangle
```

Encoded 2026-09-21:

- dest: `/opt/cursor/artifacts/lesson-spine-practice-encode/2026-09-21/LessonSpine.mp4`
- sha256: `8c953707401f835551ceec5d96c090b133cd619b41c4b7ff543b1637edc44dbf`
- ffprobe: h264 1920×1080 30/1 duration 41.000000 (video only; silent AudioBed muxes no audio stream)
- render-lock exit 0
- checklist exit 0 (`hold_cleaning: true`, `auto_flip: false`)
- `--flip` exit 2
- prior dest **files** untouched: end-card `073e1e3b18f3c6f2bc1590991d5bee4059c33487a19ff083c55927480d7a7693` (mtime 2026-09-20 23:45:02Z), transition-luma `f631402a6dfbb2ca2218ea9617c7b2af527eb7e88f8df5547dc6584c9ef5a96e` (mtime 2026-09-20 23:23:11Z), caption-overlay `5b229fee…`, lower-callout `68b8378a…`, progress-chapter `a11e31a3…`, typecard-objectiveslate `3f425456…`, slate `d0a09896…`, edu-s02 `eaf6f84a…`, edu-s01 `cab8bd91…`, typecard `27cc5bf3…`, karaoke / audiobed `9f89f9a9…`, letterbox `028d16e4…`, first `a5d08284…`, captions `ec88d257…`
- sting still: `LessonSpine-sting-f42.png`
- sting wipe still: `LessonSpine-sting-wipe-f9.png`
- slate still: `LessonSpine-slate-f345.png`
- objective still: `LessonSpine-objective-f570.png`
- recap still: `LessonSpine-recap-f864.png`
- next-up still: `LessonSpine-nextup-f1050.png`
