# Follow-up for Cursor agent bc-ba3bc6fe-1558-4d0e-8f7d-ecd2bd8ce69d

The current Remotion cut is closer but still incomplete. Do not restyle the same talking-head-plus-card. Implement the missing production layer.

Read `video-pipeline/AGENTS.md` in this repo if present. If this workspace is the Remotion project on the VPS, treat AGENTS.md as law.

## Must ship in this pass

1. Layer order. Later sibling is on top. z-index is ignored. Stack back to front: bed, B-roll, Vox, talking head, lower third, karaoke plate, letterbox, audio. If type sits behind the face, the head is too late in the tree. Dock the head to ~38% width (`dock-right` or `dock-left`). Never full-frame over type.

2. WhisperX is the clock. https://github.com/m-bain/whisperX
   - Enhance VO with ffmpeg: highpass 80, lowpass 12k, afftdn, compressor, loudnorm I=-16.
   - Run whisperx **align** on the enhanced wav. `transcribe()` has no usable word times.
   - CPU VPS: `whisperx vo.wav --model small --language en --device cpu --compute_type int8 --output_dir whisperx --output_format json`
   - Write `captions.json` from `segments[].words[]`. Words missing start/end inherit previous end + 80ms.

3. KaraokePlate. Words fade in at fromMs (3 frames). Active word is gold #C4A35A at 1.06 scale. Inactive at 70%. Plate path from createRoundedTextBox, measured once per page via createTikTokStyleCaptions (combineTokensWithinMilliseconds 1400). Words walk onto the page as they are spoken. No paragraph dump.

4. Speech-driven motion. Keyword cues in episode.json snap Vox cutouts + tick SFX on that word's fromMs. Silence >= 400ms is a legal cut. Silence >= 800ms is a legal Vox enter and letterbox close-in.

5. Lesson spine, Field School brand. Sting, slate (COURSE / MODULE / TITLE), objective card (You will be able to), hook, teach (A-roll + Vox per point), show (screen cover), do card, recap three plates, next-up slate, sting tail. Tokens: bg #11140C, paper #EFE7D6, ink #1A1A16, gold #C4A35A, olive #6B7F4F. Fraunces / Source Serif 4 / IBM Plex Sans.

6. Audio. Sting at 0:00 and CTA. Bed under speech at volume 0.12. Whoosh on B-roll enter. Tick on Vox snap. Hit on numbers. Never duck VO.

7. Motion only via useCurrentFrame, interpolate, spring, Sequence. No CSS keyframes.

8. Preview `npx remotion render ... --frames=0-150 --concurrency=1` before a full master. Write cuts.json for a later CapCut pass. Do not build a CapCut clone.

## Files to add if missing

src/components/layers/Stack.tsx
src/components/head/TalkingHead.tsx
src/components/boxes/KaraokePlate.tsx
src/components/vox/CollageBeat.tsx
src/components/boxes/LowerThird.tsx
src/brand/tokens.ts
src/schema/episode.ts
scripts/enhance-vo.sh
scripts/run-whisperx.sh
scripts/whisperx-to-captions.mjs

Stop when a 5-second preview shows: docked head, words appearing on time, sting, one Vox snap. Then say what is still missing.
