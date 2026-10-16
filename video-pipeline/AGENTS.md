# Field School Remotion course videos

Cap is capture. Remotion is editorial. Student deliverable is 16:9 lesson master. CapCut shorts later via cuts.json.

Lesson spine: sting, slate, objective card, hook, teach (A-roll + Vox), show (screen), do card, recap plates, next-up, sting tail.

TransitionSeries crossfades the camera and the full-screen cards, 12–18 frames. The face fills the camera scene. Audio sits on the same clock.

WhisperX align is the clock. Enhance VO first: highpass, denoise, de-ess, compression, loudnorm to -16 LUFS. Words fade in at fromMs. Active word is logo blue #1F5EFF on cream #F6F3EC. No tag pills. Silence 400ms = cut. 800ms = Vox enter.

Install: npx skills add remotion-dev/skills and @remotion/rounded-text-box @remotion/layout-utils @remotion/captions @remotion/google-fonts @remotion/media

CPU whisperx: --model small --device cpu --compute_type int8
Render: --concurrency=1 --frames=0-150 first.

Brand, from the Notion page "Field School Lesson Video: House Rules (Remotion)": primary navy #1E4E8C, brand indigo #1F3C88, deep navy #172E6B, logo blue #1F5EFF, light blue tint #D7E3FF, cream #F6F3EC, ink #1A1916, stone #7A746A, border #D8D2C6. Fraunces / IBM Plex Sans. Video background is deep navy. Caption chip is cream with a logo-blue active word.

Push-in: one interpolate from 1.00 to at most 1.04 with Easing.bezier(0.33, 0, 0.2, 1), driven by useCurrentFrame across the camera scene. The frame stays wide enough for the full head and shoulders.

Camera leaves through a 12–18 frame crossfade into a full-screen centered card. Cards have no captions. The white lockup sits small in the corner.

Music is Ben's Suno tracks: upbeat-marimba.mp3 under the lesson, marimba-intro-v3.mp3 for the sting, intro, and outro. No on-screen music credit. Duck the bed under speech, 150 ms attack, 400 ms release. Fade the music for 1 s at the end. Master −16 LUFS, true peak −1 dBTP max. Picture is bt709, denoised, sharpened, and cooled with colorCorrection.

See CURSOR_FOLLOWUP.md for the full punch list.
