# Field School Remotion course videos

Cap is capture. Remotion is editorial. Student deliverable is 16:9 lesson master. CapCut shorts later via cuts.json.

Lesson spine: sting, slate, objective card, hook, teach (A-roll + Vox), show (screen), do card, recap plates, next-up, sting tail.

Layer order (later = on top): bed, B-roll, Vox, head, lower third, karaoke plate, letterbox, audio. No z-index. Dock head to 38% width.

WhisperX align is the clock. Enhance VO first. Words fade in at fromMs. Active word gold #C4A35A. Keyword cues snap Vox + SFX. Silence 400ms = cut. 800ms = Vox enter.

CPU whisperx: --model small --device cpu --compute_type int8
Render: --concurrency=1 --frames=0-150 first.

Brand: #11140C #EFE7D6 #1A1A16 #C4A35A #6B7F4F. Fraunces / Source Serif 4 / IBM Plex Sans.

See ../../../video-pipeline/CURSOR_FOLLOWUP.md for the punch list.
