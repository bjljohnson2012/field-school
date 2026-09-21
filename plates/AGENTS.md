# Field School plates (Remotion)

Operator-only. Cap + Remotion + Edit-spec. Not a campus or student product.
Not the factory hour-master melt path except as fallback.

Wave 5 compositions: Opener, RecapCard, **DefinitionBoard**, **QuizBumper**, **TalkingHeadCard**, **LessonSpine**, plus craft demos **LowerThirdDemo** / **CaptionsDemo** / **CaptionDensityDemo** / **OverlayLockDemo** / **LetterboxDemo** / **AudioBedDemo** / **ProgressRailDemo** / **ChapterChipDemo** / **CalloutCardDemo** / **TransitionLumaDemo** / **EndCardDemo** / **PracticeCardDemo** / **KeyClaimDemo** / **ScriptureCardDemo** / **CompareBoardDemo** / **SectionTitleDemo** / **GlossaryChipDemo** / **ObjectionCardDemo** / **StingColdOpenDemo** / **CheckpointCardDemo** / **ExampleCardDemo** / **QuoteCardDemo** / **StepsCardDemo** / **CaveatCardDemo**. Remotion is default. Melt fallback only. Do not re-render Asset Just (`27pn9xs0zk8a73g`).

Do not add campus UI. Do not add a student-facing AI builder. Do not campus-package Remotion into `app/`. Do not accept Cleaning flip or Publish/Distribute from this package.

Independent Antagonist bar (only bar): [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md).

## Compositions

Opener 8–12s, RecapCard 8–12s, DefinitionBoard still+6s, QuizBumper 6–8s, TalkingHeadCard docked (not full-bleed). LessonSpine 41s fixture: sting / slate / objective / recap / next-up. 1920×1080@30. Cream `#EFE7D6` / ink `#1A1A16` / gold `#C4A35A` / Fraunces. Isolated seal lock `80×64` at `x=1576 y=24`.
Motion: `useCurrentFrame` + `interpolate` / SceneMotion math only. No CSS keyframes. No 9:16 pack. No Remotion Lambda. No Remotion MCP.

SceneMotion constants (must match `video-pipeline/remotion/src/sceneMotionMath.ts`): `GLIDE_FRAMES=24`, `TAKEOVER_HOLD_FRAMES=12`, `TAKEOVER_EASE_FRAMES=18`.

## Layer order

Later sibling sits on top. No z-index.

1. bed
2. screen
3. talking-head card
4. lower third
5. captions
6. letterbox
7. progress
8. chapter
9. callout
10. transition
11. claim
12. scripture
13. compare
14. section
15. glossary
16. objection
17. cold-open
18. checkpoint
19. example
20. quote
21. steps
22. caveat
23. practice
24. end
25. audio

Dock the talking-head card to ~38% width (`dock-right` or `dock-left`). Never full-bleed over type.

## Render

`node scripts/render-plate.mjs` waits (refuses) if melt `render.lock` exists or MemAvailable < 3072 MiB.
CPU cap `--concurrency=2` (2/4). Refuse Just `27pn9xs0zk8a73g` and Aug 30 `vox/everything-made-up.mp4`.

Cleaning checklist: `node scripts/cleaning-checklist-lesson-spine.mjs`. Exit 0 PASS / 1 FAIL. `--flip` refused. Never flip live Cap / Notion / Publish.

```
npx remotion compositions
npx remotion still Opener --frame=30
npx remotion still RecapCard --frame=144
npx remotion still DefinitionBoard --frame=30
npx remotion still QuizBumper --frame=30
npx remotion still TalkingHeadCard --frame=30
npx remotion still LessonSpine --frame=30
npx remotion still LessonSpine --frame=330
npx remotion still LessonSpine --frame=570
npx remotion still LessonSpine --frame=864
npx remotion still LessonSpine --frame=1050
npx remotion still LowerThirdDemo --frame=60
npx remotion still CaptionsDemo --frame=18
npx remotion still CaptionsDemo --frame=90
npx remotion still CaptionDensityDemo --frame=0
npx remotion still CaptionDensityDemo --frame=60
npx remotion still OverlayLockDemo --frame=0
npx remotion still OverlayLockDemo --frame=60
npx remotion still LetterboxDemo --frame=0
npx remotion still LetterboxDemo --frame=60
npx remotion still AudioBedDemo --frame=0
npx remotion still AudioBedDemo --frame=60
npx remotion still ProgressRailDemo --frame=0
npx remotion still ProgressRailDemo --frame=60
npx remotion still ChapterChipDemo --frame=0
npx remotion still ChapterChipDemo --frame=60
npx remotion still CalloutCardDemo --frame=0
npx remotion still CalloutCardDemo --frame=60
npx remotion still TransitionLumaDemo --frame=0
npx remotion still TransitionLumaDemo --frame=60
npx remotion still EndCardDemo --frame=0
npx remotion still EndCardDemo --frame=60
npx remotion still PracticeCardDemo --frame=0
npx remotion still PracticeCardDemo --frame=60
npx remotion still KeyClaimDemo --frame=0
npx remotion still KeyClaimDemo --frame=60
npx remotion still ScriptureCardDemo --frame=0
npx remotion still ScriptureCardDemo --frame=60
npx remotion still CompareBoardDemo --frame=0
npx remotion still CompareBoardDemo --frame=60
npx remotion still SectionTitleDemo --frame=0
npx remotion still SectionTitleDemo --frame=60
npx remotion still GlossaryChipDemo --frame=0
npx remotion still GlossaryChipDemo --frame=60
npx remotion still ObjectionCardDemo --frame=0
npx remotion still ObjectionCardDemo --frame=60
npx remotion still StingColdOpenDemo --frame=0
npx remotion still StingColdOpenDemo --frame=60
npx remotion still CheckpointCardDemo --frame=0
npx remotion still CheckpointCardDemo --frame=60
npx remotion still ExampleCardDemo --frame=0
npx remotion still ExampleCardDemo --frame=60
npx remotion still QuoteCardDemo --frame=0
npx remotion still QuoteCardDemo --frame=60
npx remotion still StepsCardDemo --frame=0
npx remotion still StepsCardDemo --frame=60
npx remotion still CaveatCardDemo --frame=0
npx remotion still CaveatCardDemo --frame=60
npx remotion still TalkingHeadCard --frame=90
npx remotion still LessonSpine --frame=330
```

TypeCard VOX-S04 stills dest (do not overwrite prior LessonSpine encodes): `/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`.
