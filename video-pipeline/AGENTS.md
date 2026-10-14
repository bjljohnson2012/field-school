# Field School Remotion course videos

Cap is capture. Remotion is editorial. Student deliverable is 16:9 lesson master. CapCut shorts later via cuts.json.

Lesson spine: sting, slate, objective card, hook, teach (A-roll + Vox), show (screen), do card, recap plates, next-up, sting tail.

TransitionSeries crossfades the camera and the full-screen cards, 12–18 frames. The face fills the camera scene. Audio sits on the same clock.

WhisperX align is the clock. Enhance VO first: highpass, denoise, de-ess, compression, loudnorm to -16 LUFS. Words fade in at fromMs. Active word is navy #0b1f3a on paper #f6f3ec. Keyword cues are one pill at a time. Silence 400ms = cut. 800ms = Vox enter.

Install: npx skills add remotion-dev/skills and @remotion/rounded-text-box @remotion/layout-utils @remotion/captions @remotion/google-fonts @remotion/media

CPU whisperx: --model small --device cpu --compute_type int8
Render: --concurrency=1 --frames=0-150 first.

Brand, from live fieldschool.ai CSS and app/src/app/globals.css: navy #0b1f3a, indigo #1f3c88, indigo deep #172e6b, primary #1e4e8c, orange #ff6a1a, paper #f6f3ec, ink #1a1916, card #ffffff, muted #5c5850, primary foreground #f7f4ee. Fraunces / IBM Plex Sans. Caption chip is paper with navy active type.

Push-in: one interpolate from 1.00 to 1.12 with Easing.bezier(0.33, 0, 0.2, 1), driven by useCurrentFrame across the camera scene. No snap-back.

Camera leaves through a 12–18 frame crossfade into a full-screen navy card. Pills are one Sequence each.

Music is Ben's Suno tracks: upbeat-marimba.mp3 under the lesson, marimba-intro-v3.mp3 for the sting, intro, and outro. No on-screen music credit. Duck the bed under speech, 150 ms attack, 400 ms release. Fade the music for 1 s at the end. Master −16 LUFS, true peak −1 dBTP max. Picture is bt709, denoised, sharpened, and cooled with colorCorrection.

See CURSOR_FOLLOWUP.md for the full punch list.
