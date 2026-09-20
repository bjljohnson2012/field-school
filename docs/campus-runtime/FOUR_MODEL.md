# Four-model farm — 2026-09-20

Standing gate: [four-model hotfix interrogate](/cursor/stores/bc-882e8bdf-82ed-46f3-ae8a-a9ee9b441133/docs/four-model-hotfix-interrogate.md). Old PASS on `7a68b01` / `e24b012` does not carry.

SHA interrogated: `50b776a1b4152af606c46e9664f54f8e50d98042` (`origin/main` after PR 73 karaoke gold). Branch `cursor/prelaunch-wave3-four-model-farm` records this farm. **No campus package. No extract. No deploy. No Wave3 cutover.**

Four independent lenses spawned and ran against that tip (not a docs-only supersede). PR 65 remains closed SUPERSEDED, unmerged.

| Lens | Agent | Verdict | Proof |
|---|---|---|---|
| Isolation | `bc-ee625085-64b3-5602-b9ef-24015e7cd179` | **PASS** | `/opt/cursor/artifacts/wave3-four-model-isolation-50b776a.json` |
| Item-bank | `bc-308e6103-75a5-595a-9f3a-26e1ef3887b8` | **PASS** | `/opt/cursor/artifacts/wave3-four-model-itembank-50b776a.json` |
| Factory | `bc-9fa1dffc-337b-5cd9-b762-0fde0f33b65a` | **PASS** | `/opt/cursor/artifacts/wave3-four-model-factory-50b776a.json` |
| Goal | `bc-bfa73716-dbed-5ee2-b1d5-3debe439615c` | **PASS** | `/opt/cursor/artifacts/wave3-four-model-goal-50b776a.json` |

## Verdict

| Gate | Result |
|---|---|
| Isolation | **PASS** |
| Item-bank | **PASS** |
| Factory | **PASS** |
| Goal | **PASS** |
| Four-model ship gate | **PASS** — all four green on `50b776a` |
| Wave3 campus cutover | **not done** — CDM seals cutover separately |

Do not deploy this SHA as a Wave3 cutover. Ship-gate PASS is not a package/extract. Live composer guest-401 is an observation, not a ship.

## Farm commands (ran)

Each lens used a detached worktree at `50b776a`. Builder packet / WAVE3.md / this file / official regex tests were not used as proof.

| Lens | What ran |
|---|---|
| Isolation | Imported this SHA `campus-runtime/rules.ts` + `composer/rules.ts` + family write rules. Live unsigned portal: `/api/me` 200 guest, Grok Bot 200, events 401, `/o/household` `/o/sales` `/teach` 401, forged `/admin` 307 login, composer/invites/children/intent/plates 401. Child invite/teach/admin false. |
| Item-bank | Imported this SHA `loadPinnedBank`. `slug=fp-50-v1` `loaded=50` `child=26`. Hide md / 0003 → `pinned_bank_missing`. No second bank. No official MBTI / Enneagram / Gallup / Wiley items. Blobs match `e24b012`. |
| Factory | AUTH / TanStack `src/` / `vite.config.ts` / `migrations/0001-0003` blobs match `e24b012`. Vault `2.24.64.248` absent from product. Just HLS Last-Modified still 26 Aug 2026. edit health 200. university 301 portal. Unsigned `/trigger` 401. `plates/` karaoke change observed — not a Factory FAIL. |
| Goal | Imported this SHA `rules.ts` / `units.ts` / `uploads.ts`. Draft hidden from child. `canTeach(child)` false. Quiz needs `source_unit_id`. Uploads 200MB/2GB. Sales hidden from household. AUTH/caddy diff vs `e24b012` empty. `cutover: not_done`. |

## Held

No Wave3 campus cutover. No AUTH_URL / university 301 change. No Remotion-in-Next. No Cleaning / Publish. No Cap take. No Just remake. No Stripe / metering UI. No family steal `bc-4765f2f0`. Launch stays CLOSED 0/8.

## Prior readout (2026-09-19)

Readiness-only on `58671a3` / later farm on `7a68b01`. Superseded as the standing SHA. PR 65 farm-target docs closed SUPERSEDED, unmerged.
