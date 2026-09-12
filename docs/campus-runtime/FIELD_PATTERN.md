# Field Pattern + living profile

Instrument `fp-50-v1`: 50 first-party Likert items (20-item child subset). Score to eight Bearing dimensions. Correspondence probabilities are estimates, not official MBTI/Enneagram/Gallup/Wiley results.

Item table: [fp-50-v1.md](./fp-50-v1.md).

Profile lives on the member (`member_profiles` + append-only revisions). Skills stay on the membership. Papers, verbal answers, and videos transcribe via Grok STT and nudge Bearing with a small step (0.15). A fresh Pattern run resets Bearing. Parent can lock a child profile. Chooser reads the live narrative. It does not rewrite the pack.

## Shipped on the Next campus

UI: https://portal.fieldschool.ai/pattern  
`GET /api/pattern/instrument?subset=adult|child`  
`POST /api/pattern/run` resets Bearing  
`POST /api/pattern/ingest` nudges via paper or Grok STT  
`GET /api/chooser` returns the next station with `wrotePack: false`
