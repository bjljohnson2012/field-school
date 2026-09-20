# Independent Antagonist v2 — Audio bed

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar. Soft notes accepted.

```
verdict: PASS
gates: {
  VOX-H01: PASS, VOX-H02: PASS, VOX-H03: PASS, VOX-H04: PASS, VOX-H05: PASS,
  VOX-H06: PASS, VOX-H07: PASS, VOX-H08: PASS, VOX-H09: PASS, VOX-H10: PASS,
  RM-H01: PASS, RM-H02: PASS, RM-H03: PASS, RM-H04: PASS, RM-H05: PASS,
  RM-H06: PASS, RM-H07: PASS, RM-H08: PASS, RM-H09: PASS, RM-H10: PASS,
  RM-H11: PASS, RM-H12: PASS,
  EDU-H01: PASS, EDU-H02: PASS, EDU-H03: PASS, EDU-H04: PASS, EDU-H05: PASS,
  EDU-H06: PASS, EDU-H07: PASS, EDU-H08: PASS, EDU-H09: PASS, EDU-H10: PASS
}
hold_cleaning: true
escalate: false
rendering: stills /opt/cursor/artifacts/remotion-audio-bed-layer/2026-09-20 (no Cap take; Just untouched)
```

## Craft

Reusable `AudioBed` — silent fixture `public/audio-bed-silence.wav`, `AUDIO_BED_VOLUME=0`, muted, looped `<Audio>` from `remotion`. Last sibling after letterbox. Later sibling on top. No z-index. No Cap A-roll. OverlayLock stays after the Stack (seal lock `1576,24`). Karaoke gold `#C4A35A` + 3px tick unchanged. Letterbox ink bars `LETTERBOX_H=48` unchanged.

Layer order: bed → screen → talking-head card → lower third → captions → letterbox → audio.

Demo composition `AudioBedDemo` (8s / 240f). Wired on every spine plate (LessonSpine inherits). ORDER LOCK unchanged: Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up.

Prior encode dests **untouched**: karaoke `9f89f9a9…`, letterbox `028d16e4…`, first `a5d08284…`, captions `ec88d257…`.

## SOFT notes only

- `VOX-S02` / `EDU-S01` — craft layer + short demo, not a new spine
- `VOX-S04` — no Ernest PNG
- `EDU-S03` — olive fixture head, not gesturing A-roll (no Cap take)
- `RM-H07` — silent fixture `<Audio>`, not A-roll / VO
- `EDU-S04` — volume 0; no random SFX (YCJDT `sfx: false`)
- `VOX-S08` — letterbox 48px foundry bars stay; audio has no picture

Stills: `AudioBedDemo-f0.png`, `AudioBedDemo-f60.png`, `LessonSpine-slate-f330.png`. Compositions: AudioBedDemo 240f @30 plus existing LessonSpine 1230f.

## Held

No Cap take. No Just. No melt. No campus Remotion package. No player rail. No Cleaning / Publish flip. No AUTH_URL / Stripe. No family chrome. No `bc-4765f2f0`. Launch stays CLOSED 0/8.
