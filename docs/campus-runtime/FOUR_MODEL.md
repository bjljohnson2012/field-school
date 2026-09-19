# Four-model readiness — 2026-09-19

Standing gate: [four-model hotfix interrogate](/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/docs/four-model-hotfix-interrogate.md). Default FAIL for deploy until four independent lenses (Isolation / Item-bank / Factory / Goal) mark PASS on this SHA. Old PASS does not carry.

This file is Product verify/docs only. **No campus package. No extract. No deploy.** Isolation / Item-bank / Factory / Goal workers were not spawned (CDM). Cap take not needed.

SHA interrogated: `58671a3789a7270925765545d59703985c2e724b` (`origin/main` after PR 63). Branch `cursor/prelaunch-wave3-four-model-readiness` adds only this readout.

## Suite command

```bash
cd app
node --experimental-strip-types --test scripts/wave3-composer.test.mjs
node scripts/wave3-four-model-readiness.mjs
```

Log: `/opt/cursor/artifacts/wave3-four-model-readiness-2026-09-19.json`

## Verdict

| Gate | Result |
|---|---|
| Repo Wave3 suite (`wave3-composer.test.mjs`) | **PASS** 6/6 |
| Product readiness (composer + teach on tip + live guest proofs) | **PASS** |
| Four-model ship gate (independent Isolation / Item-bank / Factory / Goal) | **FAIL** — farm not run |
| Wave3 campus cutover | **not done** |

Do not deploy this SHA as a Wave3 cutover. Live composer guest-401 is an observation, not a ship.

## Proof table (commands that ran)

| ID | Lens | Command / check | Expect | Result |
|---|---|---|---|---|
| W3-SUITE | Goal | `node --experimental-strip-types --test scripts/wave3-composer.test.mjs` | exit 0 | **PASS** |
| ISO-ME | Isolation | `GET https://portal.fieldschool.ai/api/me` | 200 `guest:true` | **PASS** |
| ISO-GROK | Isolation | `GET /c/grok-bot` | 200 | **PASS** |
| ISO-EVENTS | Isolation | `POST /api/events` | 401 `sign_in_required` | **PASS** |
| ISO-COMPOSER | Isolation | `GET /api/composer/catalog` + `/lessons` | 401 `sign_in_required` (not unsigned write) | **PASS** |
| ISO-TEACH | Isolation | `GET /o/household/teach` | 401 guest | **PASS** |
| ISO-HOUSEHOLD | Isolation | `GET /o/household` | 401 guest | **PASS** |
| ITEM-BANK | Item-bank | loader still `fp-50-v1.md` + `0003`; `INSTRUMENT_SLUG = "fp-50-v1"`; no second bank in `load-bank.ts` | pinned bank only | **PASS** (repo) |
| FAC-UNIVERSITY | Factory | `GET https://university.benjohnson.ai/` | 301 to `https://portal.fieldschool.ai/` | **PASS** |
| FAC-EDIT | Factory | `GET https://edit.fieldschool.ai/health` | 200 `fieldschool-edit` | **PASS** |
| FAC-CAP | Factory | `GET https://cap.fieldschool.ai/login` | 200 | **PASS** |
| FAC-LOCKS | Factory | this branch does not flip AUTH_URL, touch TanStack `src/`, `vite.config.ts`, vault `2.24.64.248`, or remake Just `27pn9xs0zk8a73g` | unchanged | **PASS** |
| GOAL-ROUTES | Goal | tip contains `/o/:slug/teach` + `/api/composer/*` | present | **PASS** |
| GOAL-NO-CUTOVER | Goal | no `deploy.sh` / overlay / `flip-auth-url.sh` this round | not run | **PASS** |
| SHIP-FARM | Goal | four independent models | required for deploy | **FAIL** |

## Live vs 2026-09-18 note

WAVE3.md (18 Sep) said live `/api/composer` was 404 on pack `62acfd0`. Guest probes on 19 Sep return **401** `sign_in_required` for `/api/composer/catalog` and `/api/composer/lessons`, and 401 for `/o/household/teach`. That does not authorize a wipe/extract. Family LIVE `bc-4765f2f0` was not used beyond guest smoke.

## Held

No Wave3 campus cutover. No AUTH_URL / university 301 change. No Isolation / Item-bank / Factory / Goal farm. No Remotion-in-Next. No Cleaning / Publish. No Cap take. No Just remake. No Stripe / metering UI. No family steal.
