# Household + sales team, one engine

Gym language is retired. First two tenants are a household and a sales team. Field School the company can still publish an optional pack those orgs subscribe to. It is not a third student product.

## Two tenants

- Household: kind homeschool, isolation strict. Parent is teacher + guardian + admin. Children are learners. Catalog empty until the parent adds sources. Cap off until you turn it on.
- Sales team: kind company, isolation platform_plus (may subscribe to a Field School pack later). Lead/trainer teaches. Reps are learner + teammate. Skills are sales + product knowledge you load.

Same tables, player, events, chooser. Different packs, stances, approval flags. One Auth.js user can be guardian at /o/household and trainer at /o/sales. Events never cross.

Org slug field-school stays the operator. Student-facing first orgs are household and sales. Stop saying gym in the UI.

## Course kinds (one composer)

A. Text / paper / book / upload. Units from supplied text. Three quiz items the teacher edits. No video job. Household default.
B. Link: YouTube, Vimeo, Loom, URL. Notes become units. No scrape into the pack.
C. Long-form record: Cap Studio cam or cam+screen. Cap is capture. Adapter + Grok STT + chapters + Review + melt + HLS. Teacher never opens Premiere. Hour-long masters stay melt. Remotion does not render the long take.
D. Graphic companions from the same take: short Remotion plates (opener, definition board, recap card, quiz bumper, talking-head card). Interactive cues live in the player (chapter markers, check-yourself pause). Teacher approves plates and quiz items before publish. Melt running = plates wait.

Review screen is transcript, chapters, proposed plates, proposed quiz, publish.

## Intelligent layer (same for child and rep)

Published lessons become knowledge_units. Chooser: holds, spaced review, recovery, next green prereq, stretch if fluent, else holding task + resource_proposals. No scrape. Generation must cite source_unit_id. Household requires parent approve. Sales team may auto-assign inside an approved pack. Learner model stores yesterday, gaps, style. Personality routes load, not curriculum.

## Next build order

1. /o/:slug, invites into household and sales, fixture text lessons home:welcome and sales:welcome, child+guardian on household only, trainer on sales. No gym copy.
2. Course composer v1: kinds A-B only.
3. Record path v1: existing Cap take to tenant lesson, Review, HLS in player.
4. Plates v1: one Remotion opener + recap from approved chapters.
5. Chooser + learner_model after both tenants have events on two lessons.
6. Adaptive generation last, still citation-gated.

## Tests

H1 invite household, no Grok Bot list. H2 draft hidden from child. H3 child watch is household org. S1 invite sales welcome only. S2 sales watch does not hit household. S3 household watch does not hit sales. X1 sales user /o/household is 403. X2 guest Grok Bot works, POST 401. R1 Cap take reaches Review with chapters. R2 rejected plate never in player. R3 quiz item without source_unit_id never persists.
