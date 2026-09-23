# Launch gate

Dated 2026-09-21. Plan source of truth for public launch. Campus runtime SoT stays [../campus-runtime/STATUS.md](../campus-runtime/STATUS.md).

**Launch is CLOSED.** Do not claim launch. Do not invent **8/8**. Launch is never claimed until every node below is explicitly **PASS** with evidence. This file records **0/8**. Missing checks are **not invented**.

| Count | Value |
|---|---|
| Nodes | 8 (Product, ICP, Brand, Offer, Marketing, Sales, Legal, Plan) |
| PASS | **0** |
| Launch | **CLOSED** |

## Eight nodes

| Node | Status | Evidence (one line) | Hold |
|---|---|---|---|
| Product | HELD | Hire-path evidence rows landed (play rail, AUTH, Stripe `$100`/`$200`/`$1,000`, `/metering`, Play-rail Publish polish, webhook hire activation, Parent-supervised progress, Parent-owned intent, Parent-path assembly, Parent next-portion, Knowledge brain, Hire-path sync, Sources and notes, Brain confidence, Composer plates readiness). Living brain on Learn and People landed. Track B unattended path landed with `distribute` false. The campus play rail mounts a Remotion LessonSpine preview beside the HTML5 player. Factory dest `af374d95…`. Not a launch Product PASS. | Cap take; Distribute; Launch 8/8; PR 65 SUPERSEDED, unmerged |
| ICP | HELD | Household + sales orgs exist ([WAVE2.md](../campus-runtime/WAVE2.md)). No sealed ICP launch readout. | Do not invent ICP 8/8 |
| Brand | HELD | Factory cream / ink / Fraunces + seal lock in `plates/`. No sealed Brand launch readout. | Do not invent Brand 8/8 |
| Offer | HELD | Learn with Ben checkout + metering UI + webhook hire activation landed on campus hire path. Not a launch Offer PASS. | No new dollars; no launch SKU seal |
| Marketing | HELD | Marketing site ships separately (`deploy-site.sh`). No sealed Marketing launch readout. | No public launch flip |
| Sales | HELD | Sales org + trainer stance exist. No sealed Sales launch readout. | Do not invent Sales 8/8 |
| Legal | HELD | `/privacy` and `/terms` are listed on portal ([DEPLOY.md](../../app/DEPLOY.md)). No sealed Legal launch readout. | Do not invent Legal 8/8 |
| Plan | HELD | This file is the plan SoT. It records CLOSED, not a go. Staff hub: [../staff/GRAPH.md](../staff/GRAPH.md). Clocks: [../staff/ROUTINES.md](../staff/ROUTINES.md) (06 / 09 / 15 / 22 / 02 ET). | No outer loop / auto-next; do not invent agents |

## Hire-path evidence rows (not a launch PASS)

These rows track real readiness work for Learn with Ben hire. They do **not** flip any of the eight launch nodes to PASS. Launch stays **CLOSED**, **0/8**. Distribute stays HELD. Campus mirror: [`/operator/launch-gate`](https://portal.fieldschool.ai/operator/launch-gate) and `GET /api/media/lesson-spine/launch-gate`.

| Unlock | Landed | Launch node PASS | Cite |
|---|---|---|---|
| Ready HLS play rail | yes | no | `/play/lesson-spine` · PR 187 merge `b8ba687` |
| AUTH signed-in Parent | yes | no | `/api/me` `{authenticated:true}` · PR 188 merge `d136a73` |
| Stripe Learn with Ben `$100` / `$200` / `$1,000` | yes | no | `/checkout?plan=100\|200\|1000` · PR 189 merge `90df7d4` |
| FR-KB-3 metering UI | yes | no | `/metering` · PR 190 merge `38912ed` |
| Publish polish operator path | yes | no | `/operator/publish` published true · PR 191 merge `aa47d07` |
| Stripe webhook hire activation | yes | no | `/operator/hire` · PR 193 merge `ae8347d` |
| Parent-supervised progress FR-6 / FR-2 | yes | no | `/progress` · PR 194 merge `3322e52` |
| Parent-owned intent FR-3 | yes | no | `/intent` · PR 195 merge `d8f9d00` |
| Parent-path assembly FR-4 | yes | no | `/path` · PR 196 merge `7cb6686` |
| Parent next-portion FR-5 | yes | no | `/portion` · PR 197 merge `e09f2d1` |
| Knowledge brain FR-KB-1 | yes | no | `/brain` · PR 198 merge `95b966c` |
| Hire-path sync FR-KB-2 | yes | no | `/brain` · PR 199 merge `0a10678` |
| Sources and notes FR-KB-1 / FR-KB-2 | yes | no | `/brain` · PR 202 merge `ce32eef` |
| Brain confidence FR-6 / FR-KB | yes | no | `/brain` · PR 203 merge `9086cc8` |
| Composer plates readiness | yes | no | `/api/composer` + `/api/plates` · this seal (Wave3 LIVE not 404; plates guest 401 / signed-in 200) |

Master dest sha256 `af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4` **untouched**.

## Living brain and Track B (not a launch PASS)

Dated 2026-09-22. These rows cite LIVE proofs on tip `b1071aaca7e3a20abf3b0d288a5f8860417b7dcb`. They do not flip any of the eight launch nodes to PASS. Launch stays **CLOSED**, **0/8**. Distribute stays HELD.

| Proof | Landed | Launch node PASS | Cite |
|---|---|---|---|
| Living brain on Learn | yes | no | `/dashboard` shows what this family or team is aiming for, how that person is doing, and the next step. PR 250 merge `c208501`. Pack `learn-home-context-campus-pack-20260922T205533Z` sha256 `5b2ca542…`. |
| People | yes | no | `/people` shows how each person is doing and the next step. PR 251 merge `b1071aa`. Home child has no login. Sales desk shows no children. |
| Track B unattended path | yes | no | Fixture path through captions, four plates, one master timeline, export checklist, cleaning, and publish evidence. `distribute` stays false. PR 249 merge `f6dd522`. Pack `track-b-publish-campus-pack-20260922T205009Z` sha256 `1c1b7333…`. No Cap take. No GPU render. Dest untouched. Remotion stays in plates. |

## Product factory note (not a launch PASS)

Remotion Wave 5 factory **PASS** under Product: compositions, LessonSpine ORDER LOCK, TypeCard VOX-S04 PASS, AudioBed landed, karaoke gold, letterbox stack complete, encode dests, Cleaning checklist `hold_cleaning: true`, plates API guest 401. Current master dest is counterexample-encode sha256 `af374d95…`. That is factory evidence only.

Hire-path rows above landed on campus (HTML5 play rail, AUTH portal, Stripe three-plan, `/metering`, Publish polish, webhook hire activation, Parent-supervised progress, Parent-owned intent, Parent-path assembly, Parent next-portion, Knowledge brain, Hire-path sync, Sources and notes, Brain confidence, Composer plates readiness). They are **not** a launch Product PASS.

The campus play rail now packages `remotion` and `@remotion/player` so `/play/lesson-spine` can preview the LessonSpine composition. The HTML5 rail stays. A signed-in play on that rail writes the next LessonSpine step into the living brain for the person already on the desk. When the accountable person returns, the signed-in chrome shows that step. The Learn desk, the People desk, Insights, Teach, and Assign read that step back: “Continue LessonSpine at …” or “Finished LessonSpine”, for each person on the household desk and the sales desk. Aim and Confidence on those desks follow that LessonSpine progress: Not yet, Getting there, or Ready, and the next step when the org aim line is empty. AI suggestions, including the fallback when no key answers, include that LessonSpine progress in the context. History on Insights, Teach, and Assign lists the LessonSpine Continue and Finished steps from that living brain. The individual profile on Insights shows that person’s next LessonSpine step and trail. A signed-in play opens the HTML5 rail and the Remotion preview at that next step. Guests still play and do not write. The org brain lists one LessonSpine outcomes rollup across the people on that desk. A regression pack locks that play-to-desk LessonSpine path for both rooms. The Remotion preview names the current LessonSpine chapter and shows its caption. Leave and return on the play page restores that same chapter from the living brain. Leave mid-chapter and return restores that Remotion scrub and caption cue from the living brain. Finishing a Remotion chapter writes the next portion into the living brain, and leave and return opens that portion. Leave and return on the play page opens that next portion as Teach and Prove from the living brain. Finishing Prove for that portion writes the next chapter into the living brain, and leave and return opens that Remotion chapter. Finishing Prove on the final chapter writes the next lesson into the living brain, and leave and return opens that lesson on the play page. The first open of that next lesson starts at the chapter start, with no scrub or caption cue carried from the prior lesson. Prove on the final lesson in the path clears Continue, so leave and return does not open a next lesson. Guests do not write. Household child login stays none. The sales desk does not add a child. Factory render packages (`@remotion/cli`, `@remotion/renderer`, `@remotion/bundler`) stay out of Next. Dest render stays plates-only, so factory Remotion-in-Next is not this preview. Dest `af374d95…` stays untouched. `distribute` stays false.

Still **HELD** under Product: Cap take; Just remake `27pn9xs0zk8a73g`; Distribute; public marketing flip; Launch 8/8. Wave3 campus pack LIVE (composer/teach); PR 65 stays closed SUPERSEDED, unmerged.

## Rule

Launch never claimed until **8/8**. This readout is **0/8** and **CLOSED**.
