# Independent Antagonist v2 — Opener + RecapCard

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar.

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
hold_cleaning: false
escalate: false
rendering: idle (stills only; no Cap take; Just untouched)
```

In-round REVISE: `letterSpacing: -0.03em` smashed lock + titles (`VOX-S05`). Fixed to `0em` + `wordSpacing: 0.12em`. Re-still.

## Compositions

| id | fps | size | frames | sec |
|---|---|---|---|---|
| Opener | 30 | 1920×1080 | 300 | 10.00 |
| RecapCard | 30 | 1920×1080 | 300 | 10.00 |

`npx remotion compositions` lists only those two.

## Stills

`/opt/cursor/artifacts/wave5-opener-recap/`

| Frame | File | Score |
|---|---|---|
| Opener 0 | `opener-takeover-open.png` | Card owns; no head (`TAKEOVER_HOLD=12`) |
| Opener 30 | `opener-takeover-head-in.png` | Head eased in right; type left; gold active karaoke |
| Recap 12 | `recap-glide-enter.png` | Type entering; head already docked |
| Recap 144 | `recap-glide-settled.png` | Three recap beats + docked head |

## SOFT notes only

- `VOX-S02` / `EDU-S01` — plate, not a full lesson spine
- `VOX-S04` — factory TypeCard-only PASS (cream + gold rail); no Ernest PNG. See [antagonist-typecard-vox-s04.md](./antagonist-typecard-vox-s04.md)
- `EDU-S03` — olive fixture, not gesturing A-roll (no Cap take this round)
- `RM-S01` — `--concurrency=1` for RAM, not a flicker hide
- `RM-S08` — stills at keyframes; no full master encode

## Reaudit 2026-09-20

Full-set [antagonist-full-set.md](./antagonist-full-set.md) **PASS**. Stills `Opener-f30.png` / `RecapCard-f144.png` under `/opt/cursor/artifacts/remotion-antagonist-full-set-reaudit/2026-09-20/`. HARD gates unchanged. `hold_cleaning: true`. ORDER LOCK intact.

## TypeCard VOX-S04 2026-09-20

Factory TypeCard-only **PASS**. Cream paper + gold 6px rail. No Cap / Ernest PNG. Stills `/opt/cursor/artifacts/remotion-typecard-vox-s04/2026-09-20/`. Prior dests untouched. `hold_cleaning: true`.

## EDU-S01 objective slate 2026-09-20

Opener sting now carries explicit “You will be able to” + `draw one idea per beat`. RecapCard returns the same objective (signaling, not a fourth numbered claim). Historical SOFT line above keeps `VOX-S02` / `EDU-S01` as the plate-not-spine record. This note seals EDU-S01 **PASS**. Evidence: [antagonist-edu-s01-objective-slate.md](./antagonist-edu-s01-objective-slate.md). Stills `/opt/cursor/artifacts/remotion-edu-s01-objective-slate/2026-09-20/`. `hold_cleaning: true`. ORDER LOCK intact.

## Held

No Cap take. No Just `27pn9xs0zk8a73g`. No melt. No campus Remotion package. No Publish/Distribute. No AUTH_URL / Stripe. No family chrome. No `run-91af199b`.
