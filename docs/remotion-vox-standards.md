# Field School Remotion VOX standards

Operator content supply only. Cap + Remotion + Edit-spec. No campus UI. No student AI builder. Do not touch FR-4 or Track A.

Landed in-tree from Project store sources (do not invent a second bar):

- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/docs/remotion-vox-standards.md`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/docs/remotion-vox-antagonist-bar.md`

**Independent Antagonist bar v2 is the only bar.** Criteria are copy-pasteable in this file (PASS / HARD_FAIL / SOFT_FAIL + gate IDs). v2 replaces v1. HARD_FAIL holds Cleaning and escalates the hub — including Remotion official hard CHECKs (`RM-H*`, `useCurrentFrame` only) and edu-craft hard CHECKs (`EDU-H*`, Guo ~6 min / Lagerstrom 12–20), not only brand. SOFT_FAIL is notes only.

Ship checklist (PRs 34/35) still stands (six items; not replaced):

1. Cap take + transcript / title / summary on Asset
2. Chapters cover full duration
3. Overlay logo + title match lock
4. Cards cream / ink / Fraunces; head clear zone
5. Remotion master duration matches; no propose leftovers; Just locked until Ready
6. HLS Ready, then raw may drop

VOX audit is additional. SceneMotion composition: [remotion-scenemotion-glide-takeover.md](./remotion-scenemotion-glide-takeover.md).

Ingested (paths may still be missing on a given checkout; cite the papers, do not invent items): `specs/2026-09-18-independent-antagonist-remotion-bar-v2.md`, `indiana-remotion-ed-audit-2026-09-18.md`. Guo et al. 2014 L@S [doi:10.1145/2556325.2566239](https://doi.org/10.1145/2556325.2566239); Lagerstrom et al. 2015 ASEE / [UCSD](https://multimedia.ucsd.edu/best-practices/video-length.html); Mayer 2021 JARMAC [doi:10.1016/j.jarmac.2021.03.007](https://doi.org/10.1016/j.jarmac.2021.03.007); Brame 2016 CBE-LSE [doi:10.1187/cbe.16-03-0125](https://doi.org/10.1187/cbe.16-03-0125); remotion.dev flickering / delayRender / calculateMetadata / performance / Img / staticFile.

## What VOX looks like

Explanatory motion graphics over a foundry cream field. Not a talking-head-plus-card restyle. Not CapCut spam. Not generic-AI (neon gradients, bounce type, sticker packs, random SFX).

Must have:

- **Explanatory motion graphics** — each beat draws the idea (glide / takeover / keyword snap / Vox collage). Type is the lesson, not a caption dump.
- **Clear VO / beat sync** — WhisperX word times are the clock. Words appear at `fromMs`. Active word gold `#C4A35A`. Silence ≥400ms is a legal cut. Silence ≥800ms is a legal Vox enter.
- **Kinetic cards** — words walk on. No paragraph dump for a whole chapter.
- **Strong A-roll / head zone** — head docked ~36–38% width, right or left. Face never sits on type. Takeover: card owns ~12f, then head eases in. Glide: type from the left ~24f, no bounce.
- **Cream / ink / Fraunces** — paper `#EFE7D6` (cards), bed `#11140C` when a bed is used, ink `#1A1A16`, gold `#C4A35A`, olive `#6B7F4F`. Display face Fraunces. UI/kicker IBM Plex Sans. Source Serif 4 allowed for long body.
- **Field School mark lock** — isolated seal + lesson title. YCJDT lock: title **You Can Just Do Things**, seal `80×64` at `x=1576 y=24`. Do not invent a second mark.
- **1920×1080 30fps** Remotion long-form master. Full-duration pedagogical chapters. Melt only after `RemotionFailed`.

The Aug 30 `EverythingMadeUp` intro (seal, Fraunces wordmark, gold rule, cream) is the look reference. `FieldSchoolLesson` pass-2 (`pass2-scenes.mp4`) is the current encode under audit — it is **not** the VOX bar.

## Field School brand tokens

Live `video-pipeline/remotion/src/brand.ts` matches these hexes.

| Token | Hex | Use |
|---|---|---|
| cream / paper | `#EFE7D6` | card field, lesson bed |
| marketing cream | `#f6f3ec` | site / intro slate only; do not mix on one card |
| ink | `#1A1A16` | type |
| charcoal bed | `#11140C` | under A-roll when a bed exists |
| gold | `#C4A35A` | active word, tick, rule |
| olive | `#6B7F4F` | foundry accent |
| mark blue | `#1f5eff` | seal / 18px rail only — not a 6px Zoom-card border |
| stone | `#7a746a` | unspoken kinetic words only |

Motion: `useCurrentFrame` + `interpolate` / `spring` / `Sequence` only. No CSS keyframes.

## Composition path (Cursor recipe)

Teach this path. Do not ship campus chrome.

1. **Ingest the pack** — Project store [remotion-vox-edit-practice.md](/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/docs/remotion-vox-edit-practice.md) + [remotion-vox-edit-practice.json](/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/docs/remotion-vox-edit-practice.json). Do not invent a second pack.
2. **Read the Edit-spec** — `engine: remotion`, `fallback: melt`, `composition`, `overlay`, `proposed_chapters`, `remotion.scenes[]`, `cards`, `do_not_overwrite`.
3. **Read the cards** — PNG Ernest plates at `cards` (YCJDT: `/opt/fieldschool-video/edit/cards/ycjdt/`). Type on cream/ink/Fraunces. Head stays off the plate.
4. **Map chapters → `Scene[]`** — `in`/`out` cover `0 … duration`. `motion` is `glide` or `takeover` (pass-2). `spring` / `interpolate` are legacy only.
5. **Build Remotion props** for `FieldSchoolLesson`:
   - `src` = Cap A-roll (`j013r823wx9ecaf/master.mp4` or `staticFile("a_roll.mp4")`)
   - `cuts` empty until accepted; duration from `durationSec`
   - `scenes` from the spec; `titleCards` aligned
   - `overlay` exact lock
   - `phrases` from WhisperX `captions.json` (required for VOX). Empty phrases → static chapter text = antagonist HARD_FAIL `VOX-H08`.
   - `introSec` = `0` for a take-only master; `7.5` only when the Intro slate is part of the lesson.
6. **Register** `FieldSchoolLesson` in `Root.tsx` (`calculateMetadata` → `durationFrames`).
7. **Preview** `npx remotion render FieldSchoolLesson --frames=0-150 --concurrency=1 --gl=swangle` before a full master.
8. **Encode** to a **new dated path**. Never overwrite:
   - `/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4` (Aug 30)
   - Just `27pn9xs0zk8a73g`
   - Prefer `/opt/fieldschool-video/hls/j013r823wx9ecaf/remotion/vox-practice/YYYY-MM-DD/<name>.mp4`
9. **Antagonist audit** against the Independent Antagonist section below. Write the report under `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/internal/vox-antagonist/`.
10. **Cleaning** — ship checklist 1–6 **and** no VOX HARD_FAIL. Publish/Distribute still held.

Live factory Remotion: `/opt/fieldschool-edit/remotion` (not Wave 5 `plates/`). Repo mirror: `video-pipeline/remotion/src/FieldSchoolLesson.tsx`, `sceneMotionMath.ts`, `phrases.ts`, `types.ts`, `Root.tsx`.

`SceneMotion`: `spring | interpolate | glide | takeover`. Math (must match live `sceneMotionMath.ts` + `FieldSchoolLesson.tsx`): `GLIDE_FRAMES=24`, `TAKEOVER_HOLD_FRAMES=12`, `TAKEOVER_EASE_FRAMES=18`, luma 0.5s on **exits** only. Composition is 1920×1080@30.

### Motion words landed (`cursor/prelaunch-scenemotion-glide-takeover`, PR 49)

Two words only. Composition doc: [remotion-scenemotion-glide-takeover.md](./remotion-scenemotion-glide-takeover.md).

| Word | Frames | Behavior |
|---|---|---|
| **glide** | ~24f (`GLIDE_FRAMES`) | Cream type card from the left. Soft opacity. Smoothstep — no bounce. Head already docked. |
| **takeover** | hold ~12f (`TAKEOVER_HOLD_FRAMES`), ease 18f | Card owns the open. Then the head eases in from the right. No pop. |

Proof is a non-Just fixture (`src: "fixture"`). Just `27pn9xs0zk8a73g` locked. No second melt. No Cap take.

Layer stack (later sibling on top; no z-index): bed → B-roll → Vox → head → lower third → karaoke plate → letterbox → audio. Head too late in the tree = type under the face = `VOX-H04`.

## Pack pointer

Expected teach pack (may be missing on a given checkout / VPS):

- `/workspace/field-school/edit/briefs/remotion-vox-edit-practice.md`
- `/workspace/field-school/edit/briefs/remotion-vox-edit-practice.json`
- `video-pipeline/briefs/remotion-vox-edit-practice.md`
- `video-pipeline/briefs/remotion-vox-edit-practice.json`

**Ingested copies** (Project store; do not invent a second pack):

- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/docs/remotion-vox-edit-practice.md`
- `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/docs/remotion-vox-edit-practice.json`

YCJDT pass-2 briefs (wired scenes; still the live encode input):

- Repo: `video-pipeline/briefs/ycjdt-pass2-remotion-scenes.json` + `.md` (when present)
- VPS: `/opt/fieldschool-video/edit/briefs/ycjdt-pass2-remotion-scenes.json` + `.md`
- Cards: `/opt/fieldschool-video/edit/cards/ycjdt/`

Known dests (do not overwrite Aug 30):

| File | Role |
|---|---|
| `…/j013r823wx9ecaf/remotion/pass2-scenes.mp4` | 18 Sep pass-2 mux, 651.925s |
| `…/j013r823wx9ecaf/remotion/master.mp4` | 27 Aug pass-1 |
| `…/j013r823wx9ecaf/vox/everything-made-up.mp4` | 30 Aug VOX master, 664.60s — **locked** |
| `…/27pn9xs0zk8a73g/` | Asset Just — **locked** |

Typo dest `j013r723wx9ecaf` is wrong. Cap id is `j013r823wx9ecaf`.

## Remotion official (R7 `useCurrentFrame` only)

Installed skills: `remotion-markup`, `remotion-render`, `remotion-captions`, `remotion-docs` v4.0.512. Docs: append `.md` to remotion.dev URLs.

Drive visible motion with `useCurrentFrame()` + `interpolate()` / `spring()`. CSS `transition` / `animation` and Tailwind `animate-*` will not render correctly ([flickering](https://www.remotion.dev/docs/flickering.md)).

Masters that violate these are antagonist `RM-H*` HARD_FAIL (Indiana audit + remotion.dev flicker/perf):

- **`useCurrentFrame` only** — `interpolate` / `spring`. No CSS/Tailwind animation, no `setTimeout` / `setInterval` motion. `RM-H01` `RM-H06`.
- **`delayRender`** inside the component; always `continueRender` or `cancelRender`. `RM-H05`.
- **Remotion `<Img>` / `<Video>` / `<Audio>`** + `staticFile()`. No raw `<img>` / CSS `background-image`. `RM-H03`.
- **`calculateMetadata` once** — duration/props from A-roll computed there, not per frame. Never `durationInFrames < 1`. `RM-H02` `RM-H10`.
- **Memoize** expensive measure/parse (`useMemo` / `useCallback`). `RM-H11`.
- **Font subsets** — Fraunces / Plex via `@remotion/google-fonts` with needed weights + `latin` only. `RM-H04` `RM-H12`.
- Same frame → same image. `--concurrency=1` is not a correctness fix.
- VO/A-roll on sequenced media matching the Edit-spec clock. `RM-H07`.
- Preview `--frames=0-150` then `npx remotion still` at takeover / glide / exit. Captions JSON as `@remotion/captions` `Caption`.

## Educational craft (Guo / Lagerstrom length bands)

Cite Mayer 2021 JARMAC [doi:10.1016/j.jarmac.2021.03.007](https://doi.org/10.1016/j.jarmac.2021.03.007), Mayer 2020 *Multimedia Learning*, CTML 2024 review, WCAG 2.2 1.4.3 / 1.2.2, Guo et al. 2014 L@S [doi:10.1145/2556325.2566239](https://doi.org/10.1145/2556325.2566239), Lagerstrom et al. 2015 ASEE / [UCSD video length](https://multimedia.ucsd.edu/best-practices/video-length.html), Brame 2016 CBE-LSE [doi:10.1187/cbe.16-03-0125](https://doi.org/10.1187/cbe.16-03-0125), Indiana `indiana-remotion-ed-audit-2026-09-18.md`. Encoded as `EDU-H*` / `EDU-S*` on the Independent Antagonist bar below.

| Craft | HARD rule |
|---|---|
| One objective per beat | One claim per scene/card. Five questions = five segments, not one plate (`EDU-H01`). |
| Cognitive load | One idea on screen. Type *or* a collage beat, plus a docked head — not a paragraph dump (`EDU-H02`). |
| Accessibility | Cream/ink ≥4.5:1 at the spoken card. Luma must not wash the beat unread (`EDU-H03`). Captions **path** required (`EDU-H04`); karaoke/signaling, not a redundant transcript dump (`EDU-S05`). |
| Temporal contiguity | Graphic lands with the spoken claim (`EDU-H05` / `VOX-H08`). |
| Pacing / segmenting | New graphic when the VO changes claim; do not hold one card across a 100s multi-claim chapter (`EDU-H06`). |
| Guo ~6 min | Snack / MOOC / `cuts.json` clip over 6:00 is `EDU-H07`. Long-form mux may run longer only if chapters segment on screen. |
| Lagerstrom 12–20 | For-credit sit-down over 20:00 with no new slate, or past 12:00 with no chapter structure = `EDU-H08`. |
| Mayer / Brame | Signaling, weeding, matching modality, segmenting — fail any = `EDU-H09`. |
| Talking-head / Khan | Head at opportune times + Khan-style / explanatory motion. Slides-only or Zoom-card + static type = `EDU-H10`. |

---

# Independent Antagonist bar (v2)

**v2 replaces v1.** Extends v1 brand/`VOX-*` gates. Adds Indiana Remotion + edu-craft HARD rules. Overnight audits use **v2 now**. Copy the verdict + gate tables as-is. Canonical in-tree path is this section. No `independent-antagonist-remotion-bar.md` alias. Do not invent a second bar.

Overnight **must** HARD_FAIL a master that breaks `VOX-H*`, `RM-H*` (including useCurrentFrame-only, delayRender, Remotion media tags, calculateMetadata once, memoize, font subsets, no CSS timers), or `EDU-H*` (Guo ~6 min, Lagerstrom/UCSD 12–20, Mayer/Brame signaling–weeding–modality–segmenting, talking-head/Khan-style). Not brand-only.

## Verdicts

| Verdict | Meaning | Cleaning | Hub |
|---|---|---|---|
| **PASS** | Every HARD gate green (`VOX-H*`, `RM-H*`, `EDU-H*`). SOFT notes optional. | May flip **only if** ship checklist 1–6 is also green. | No escalate. |
| **SOFT_FAIL** | One or more `VOX-S*` / `RM-S*` / `EDU-S*` only. | Notes only. Cleaning may still flip if ship checklist is green. | No escalate. |
| **HARD_FAIL** | Any `VOX-H*` / `RM-H*` / `EDU-H*` red. | **Hold.** Do not flip. Do not soft-ship. | Escalate hub / CDM. |

One HARD_FAIL wins. Do not average. Do not “ship with nits” on a HARD gate.

Publish/Distribute stays held either way. No campus UI. No FR-4. No Track A.

## How to emit an audit

Write `/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/internal/vox-antagonist/<run>-<take>.md` with:

```
verdict: PASS | SOFT_FAIL | HARD_FAIL
gates: { VOX-H01: PASS, RM-H01: PASS, EDU-H01: HARD_FAIL, … }
hold_cleaning: true|false
escalate: true|false
rendering: <path or idle>
```

Score stills at takeover open, takeover head-in, glide enter, mid-hold, luma exit. Probe `ffprobe`. Confirm Just + Aug 30 mtimes. Also score `RM-H*` against composition/render evidence and `EDU-H*` against beats (one objective, load, contrast, captions path, pacing).

---

## Brand / factory HARD (`VOX-H*`)

Fail any → HARD_FAIL.

| ID | Gate | Fail when |
|---|---|---|
| `VOX-H01` | 1920×1080 30fps h264 master | Wrong size, 9:16 pack, still-only sold as a master |
| `VOX-H02` | Field School mark lock | Missing seal, wrong title, lock not at spec (`1576,24` / `80×64` on YCJDT) |
| `VOX-H03` | Cream / ink / Fraunces | Neon, Inter/Poppins default, dark-mode SaaS, mixed marketing cream + paper on one card |
| `VOX-H04` | Head / A-roll zone | Type under the face; full-frame head over type; head >~40% width |
| `VOX-H05` | Full-duration chapters | Chapters do not cover `0 … last-out`; master duration off spec by >0.5s |
| `VOX-H06` | Locked assets | Just `27pn9xs0zk8a73g` rewritten; Aug 30 `vox/everything-made-up.mp4` overwritten |
| `VOX-H07` | No CapCut / generic-AI | Bounce type, sticker pack, random SFX, electric Zoom-card chrome, talking-head-plus-card with no explanatory motion |
| `VOX-H08` | VO / beat sync + kinetic cards | Static chapter paragraph for the whole scene; no word clock; phrases empty on a VOX take |
| `VOX-H09` | Remotion default | Melt ran without a real `RemotionFailed` |
| `VOX-H10` | Operator-only | Campus / student builder UI, family chrome mutation, CNC vault `2.24.64.248` |

## Brand / factory SOFT (`VOX-S*`)

Notes only.

| ID | Gate | Note when |
|---|---|---|
| `VOX-S01` | Karaoke / WhisperX | Align missing; active word not gold `#C4A35A` |
| `VOX-S02` | Lesson spine | Missing sting / slate / objective / recap / next-up |
| `VOX-S03` | Accent discipline | Mark blue used as a 6px head border or full-height shout; gold/olive unused |
| `VOX-S04` | Ernest / card PNGs | Spec `cards/` unused; live TypeCard only |
| `VOX-S05` | Type tracking | Overlay title or kicker reads smashed; `-0.03em` eats spaces |
| `VOX-S06` | Luma | 0.5s veil on a glide/takeover **entrance** (exit-only) |
| `VOX-S07` | Motion | Glide bounces; takeover head pops with no hold |
| `VOX-S08` | Overlay readability | Title present at lock but hard to read |
| `VOX-S09` | AAC / mux pad | Duration +0.05s class pad vs last-out |
| `VOX-S10` | Propose leftovers | `edit.propose` still queued; `cuts[]` / `chapters[]` empty (ship item 5 also sees this) |

---

## Remotion official CHECK — HARD (`RM-H*`)

Sources: remotion.dev (`.md` pages) + installed skills under `~/.cursor/plugins/.../remotion-*` v4.0.512 (`remotion-markup`, `remotion-render`, `remotion-captions`, `remotion-docs`).

Fail any → HARD_FAIL. These produce wrong frames, loading-state frames, or a master that is not the composition.

| ID | CHECK | Fail when | Cite |
|---|---|---|---|
| `RM-H01` | Frame-driven motion only | CSS `transition` / `animation`, Tailwind `animate-*`, or wall-clock timers drive visible motion. Tabs do not share state; order-independent frames will flicker or drift. | [Flickering](https://www.remotion.dev/docs/flickering.md); remotion-markup SKILL |
| `RM-H02` | Composition duration / metadata | `durationInFrames < 1`; duration depends on media/props but `calculateMetadata` is missing or returns 0; Intro Sequence mounted at 0 frames. | [calculateMetadata](https://www.remotion.dev/docs/calculate-metadata.md); remotion-markup `calculate-metadata.md` |
| `RM-H03` | Assets wait for load | `<img>` / CSS `background-image` / `mask-image` / raw `/file.png` strings instead of `<Img>` / `<Video>` / `<Audio>` + `staticFile()` (or labeled remote URL). Renderer screenshots a loading state. | [staticFile](https://www.remotion.dev/docs/staticfile.md); [Img](https://www.remotion.dev/docs/img.md); [Flickering](https://www.remotion.dev/docs/flickering.md) |
| `RM-H04` | Fonts block render | Fraunces / Plex not loaded via `@remotion/google-fonts` or `@remotion/fonts` + `staticFile`; `measureText` / `fitText` before font ready; fallback Arial sold as the lock. | remotion-markup `google-fonts.md`, `local-fonts.md`; [Flickering](https://www.remotion.dev/docs/flickering.md) |
| `RM-H05` | delayRender cleared | `delayRender()` never `continueRender` / `cancelRender`; top-level handle blocks other comps; timeout with no labeled handle. | [delayRender](https://www.remotion.dev/docs/delay-render.md); [Timeout](https://www.remotion.dev/docs/timeout.md) |
| `RM-H06` | Deterministic frames | `Math.random()`, unseeded noise, or “frames must run in order” animations. Same frame must paint the same. `--concurrency=1` is not a fix. | [Flickering](https://www.remotion.dev/docs/flickering.md); `random()` exception |
| `RM-H07` | Audio / media sync | A-roll or VO not on `<Audio>`/`<Video>` with `Sequence` `from` + `trimBefore`/`startFrom` matching the Edit-spec clock. Pitch/speed used so VO leaves the word clock. | remotion-markup `audio.md`, `embedding-videos.md`, `sequencing.md` |
| `RM-H08` | Registered composition | `FieldSchoolLesson` (or named spec id) missing from `Root`; claimed 1920×1080@30 does not match `<Composition>`. | remotion-markup `compositions.md` |
| `RM-H09` | Render actually finished | CLI timeout, cancelled mux, dest missing, or stills show empty/loading frames sold as the master. | [Timeout](https://www.remotion.dev/docs/timeout.md); remotion-render SKILL |
| `RM-H10` | `calculateMetadata` once | Duration/props fetched or `delayRender` data load **per frame** / per concurrency tab instead of once in `calculateMetadata`. | [calculateMetadata](https://www.remotion.dev/docs/calculate-metadata.md); [delayRender](https://www.remotion.dev/docs/delay-render.md) (“runs only once”) |
| `RM-H11` | Memoize | Expensive layout / `measureText` / JSON parse / image decode re-runs every frame with no `useMemo` / `useCallback`. | [Performance](https://www.remotion.dev/docs/performance.md); Indiana audit |
| `RM-H12` | Font subsets | `@remotion/google-fonts` loads the full family (all weights/scripts) instead of needed weights + `latin` (or explicit subset). | remotion-markup `google-fonts.md`; Indiana audit |

## Remotion official CHECK — SOFT (`RM-S*`)

Notes only.

| ID | CHECK | Note when | Cite |
|---|---|---|---|
| `RM-S01` | Concurrency workaround | `--concurrency=1` used to hide flicker instead of frame-driven refactor. Factory VPS may still set 1 for RAM. | [Flickering](https://www.remotion.dev/docs/flickering.md); [Performance](https://www.remotion.dev/docs/performance.md) |
| `RM-S02` | Studio defaultProps | `defaultProps` imported/spread instead of an inline object. | remotion-markup `compositions.md` |
| `RM-S03` | Premount | Sequences with media lack `premountFor`. | remotion-markup `sequencing.md` |
| `RM-S04` | Benchmark | No `npx remotion benchmark` / verbose slow-frame log on a long master. | [Performance](https://www.remotion.dev/docs/performance.md) |
| `RM-S05` | Interpolate clamp | `interpolate` without `extrapolateLeft/Right: "clamp"` leaks opacity/x. | remotion-markup `timing.md` |
| `RM-S06` | Transform shorthands | `transform: scale()` string instead of `scale` / `translate` / `rotate`. | remotion-markup SKILL |
| `RM-S07` | Media package | Legacy `OffthreadVideo` / `Html5Audio` instead of `@remotion/media`. | remotion-markup SKILL; [Flickering](https://www.remotion.dev/docs/flickering.md) |
| `RM-S08` | Still / unit test | No `npx remotion still` at keyframes; no `Thumbnail`/`noSuspense` frame assert. | remotion-render SKILL; [Testing](https://www.remotion.dev/docs/testing.md) |
| `RM-S09` | Encode quality | CRF/jpeg-quality so low type rings; not bt709. | [Quality](https://www.remotion.dev/docs/quality.md) |
| `RM-S10` | Caption JSON type | Word times exist but not `@remotion/captions` `Caption` `{text,startMs,endMs}`. | remotion-captions SKILL |

---

## Educational video craft — HARD (`EDU-H*`)

Shortlist (cite these, not blog spam):

1. Mayer, R. E. (2021). Evidence-based principles for how to design effective instructional videos. *Journal of Applied Research in Memory and Cognition*. [doi:10.1016/j.jarmac.2021.03.007](https://doi.org/10.1016/j.jarmac.2021.03.007) — multimedia, coherence, signaling, temporal/spatial contiguity, segmenting, modality, embodiment.
2. Mayer, R. E. (2020). *Multimedia Learning* (3rd ed.). Cambridge — same principle set; dual-channel + limited capacity.
3. Mayer / CTML review (2024). *Educational Psychology Review*. [doi:10.1007/s10648-023-09842-1](https://doi.org/10.1007/s10648-023-09842-1) — essential vs extraneous processing.
4. Sweller, cognitive load (via CTML): one idea in working memory; extraneous chrome is load.
5. [WCAG 2.2 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) — 4.5:1 normal text, 3:1 large (18pt+ / 14pt bold).
6. [WCAG 2.2 1.2.2 Captions (Prerecorded)](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded) — captions path required. Mayer *redundancy* forbids a full transcript dump *on top of* VO + graphics; karaoke/signaling of the beat is the Field School resolution, not “no captions.”
7. Guo, Kim, & Rubin (2014). How video production affects student engagement: An empirical study of MOOC videos. *L@S 2014*. [doi:10.1145/2556325.2566239](https://doi.org/10.1145/2556325.2566239) — plan segments under 6 min; talking head at opportune times; Khan-style motion beats slides.
8. Lagerstrom, Johanes, & Ponsoskul (2015). The myth of the six-minute rule. *ASEE*. [peer.asee.org](https://peer.asee.org/the-myth-of-the-six-minute-rule-student-engagement-with-online-videos) — for-credit sit-down median ~12–13 min; guideline under 12 ideal, 20 max. UCSD summary: [multimedia.ucsd.edu/best-practices/video-length](https://multimedia.ucsd.edu/best-practices/video-length.html).
9. Brame (2016). Effective educational videos. *CBE—Life Sciences Education* 15(4). [doi:10.1187/cbe.16-03-0125](https://doi.org/10.1187/cbe.16-03-0125) — **signaling, weeding, matching modality, segmenting**.
10. Indiana Remotion ed-audit `indiana-remotion-ed-audit-2026-09-18.md` (ingest; file may be missing) — folds 7–9 + Remotion flicker/perf into HARD CHECKs.

| ID | CHECK | Fail when |
|---|---|---|
| `EDU-H01` | One learning objective per beat | A beat’s card states two or more distinct claims with no segment (e.g. five questions as one static plate). |
| `EDU-H02` | Cognitive load — one idea on screen | Paragraph dump + head + unrelated chrome with no signaling; or two competing graphics. Coherence / limited capacity. |
| `EDU-H03` | Contrast | Ink/cream not ≥4.5:1 on the spoken card; stone/gray or luma veil makes the beat unreadable at the word clock. |
| `EDU-H04` | Captions path | No WhisperX/`captions.json`/`@remotion/captions` path on a pedagogical VOX master. Karaoke may *be* the path. Absence is HARD. |
| `EDU-H05` | Temporal contiguity | Graphic appears after the spoken idea is gone, or one static card holds while VO has moved to the next claim. |
| `EDU-H06` | Instructional pacing / segmenting | A scene < ~3s for a claim, **or** one card holds >~40s across multiple spoken claims with no new graphic/segment. |
| `EDU-H07` | Guo ~6 min (MOOC / snack) | A snack, `cuts.json` clip, or unsegmented MOOC file longer than 6:00. Long-form mux may exceed 6:00 only if on-screen chapters actually segment the sit-down. |
| `EDU-H08` | Lagerstrom / UCSD 12–20 | For-credit intentional sitting longer than 20:00 with no new slate/objective/segment; or a claimed sit-down with **no** chapter structure past 12:00. 12–20 is the allowed band, not a target to pad. |
| `EDU-H09` | Mayer / Brame four | Missing **signaling** (no gold/keyword cue), **weeding** (CapCut chrome, random SFX, busy bed), **modality** (paragraph text + VO + graphics on one channel), or **segmenting** (no chunks). |
| `EDU-H10` | Talking-head / Khan-style | Slides-only with no head at opportune times; **or** Zoom-card talking-head + static slide with no Khan-style / explanatory motion. Guo: head + hand-drawn motion beat slides. |

`EDU-H04` / `EDU-H05` often trip with `VOX-H08`. `EDU-H09` / `EDU-H10` often trip with `VOX-H07`. Still emit all IDs.

## Educational video craft — SOFT (`EDU-S*`)

| ID | CHECK | Note when |
|---|---|---|
| `EDU-S01` | Pre-training / objective | No “you will be able to” slate (Mayer pre-training; lesson spine). |
| `EDU-S02` | Signaling | No gold `#C4A35A` active word / tick on the keyword. |
| `EDU-S03` | Embodiment vs image | Frozen still of the instructor (Mayer *image* — skip static face) instead of gesturing A-roll (*embodiment*). |
| `EDU-S04` | Coherence / SFX | Extraneous bed or random ticks. YCJDT spec `sfx: false` is correct unless a keyword snap is in the Edit-spec. |
| `EDU-S05` | Redundancy | Full-sentence caption burn that repeats VO *and* the kinetic card. Prefer word-level karaoke. |
| `EDU-S06` | Personalization / voice | Card copy in brochure voice; VO not the enhanced A-roll. |
| `EDU-S07` | Spatial contiguity | Label far from the graphic it names (kicker 200px from the claim). |

---

## Relationship to ship checklist

| Ship # | Overlap | Cleaning |
|---|---|---|
| 1 Cap + transcript | `EDU-H04` needs a captions **path**, not just Asset STT | ship + VOX |
| 2 Chapters cover duration | `VOX-H05` | both |
| 3 Overlay lock | `VOX-H02` | both |
| 4 Cream/ink/Fraunces + head | `VOX-H03` `VOX-H04` `EDU-H03` | both |
| 5 Duration + leftovers + Just | `VOX-H05` `VOX-H06` `RM-H02` `RM-H09` `VOX-S10` | leftovers alone are SOFT here |
| 6 HLS Ready / raw drop | none — Publish held | ship HOLD |

HARD_FAIL on this bar (including any `RM-H*` or `EDU-H*`) holds Cleaning even if factory marked ship 1–5 PASS.

## Locks

- No CNC vault `2.24.64.248`
- Do not re-render Just `27pn9xs0zk8a73g`
- Remotion default; melt only after `RemotionFailed`
- No AUTH_URL flip, no campus deploy, no family/chrome mutation
- `render.lock` single-flight; refuse under 3072 MiB `MemAvailable`
- Do not touch `app/src/components/family*` or `children-database`
- Do not steal family-v1-operator-writes `bc-4765f2f0`
- Do not campus-package Remotion
- Do not Cap / Just / melt / Publish / Distribute from this standards land
- No Stripe / metering / prices
- Do not interfere with `run-d10cce7e`
- Do not contact Marketer / Revenue / Product
