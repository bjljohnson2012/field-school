# Field School Remotion course videos

Cap is capture. Remotion is editorial. Student deliverable is 16:9 lesson master. CapCut shorts later via cuts.json.

Lesson spine: sting, slate, objective card, hook, teach (A-roll + Vox), show (screen), do card, recap plates, next-up, sting tail.

Layer order (later = on top): bed, B-roll, Vox, head, lower third, karaoke plate, letterbox, audio. No z-index. Dock head to 38% width.

WhisperX align is the clock. Enhance VO first. Words fade in at fromMs. Active word gold #C4A35A. Keyword cues snap Vox + SFX. Silence 400ms = cut. 800ms = Vox enter.

Install: npx skills add remotion-dev/skills and @remotion/rounded-text-box @remotion/layout-utils @remotion/captions @remotion/google-fonts @remotion/media

CPU whisperx: --model small --device cpu --compute_type int8
Render: --concurrency=1 --frames=0-150 first.

Brand: #11140C #EFE7D6 #1A1A16 #C4A35A #6B7F4F. Fraunces / Source Serif 4 / IBM Plex Sans.

Push-in: interpolate from 1.00 to 1.08 with Easing.bezier(0.33, 0, 0.2, 1), driven by useCurrentFrame. No snap-back. Reset to 1.00 only while a card takeover covers the head.

Plate: #6B7F4F at 100% opacity, max 520 px, at x120 y560. Omit it when that spot covers the headline or the pill.

CDM duck, overriding the no-duck line in CURSOR_FOLLOWUP.md: bed volume 0.12 on the sting, slate, and outro (about −14 dB under the voice). Duck another 6 dB under speech, 150 ms attack, 400 ms release. Master −16 LUFS, true peak −1 dBTP max.

See CURSOR_FOLLOWUP.md for the full punch list.
