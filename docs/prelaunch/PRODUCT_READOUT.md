# Product readout

Both rooms. Not a launch PASS. Dated from tip `59d385a7`.

- Five-word leader bar: NOT PROVEN. Header lists Learn, People, Library, Insights, New (PR 206). Missing: a test that asserts those five words.
- Sales desk zero children: PROVEN. `/people` · PR 220 · `app/src/app/people/desk.test.mjs`
- Household desk zero sales diagnostics: PROVEN. `/insights` · PR 225 · `app/src/app/insights/aggregate.test.mjs`
- New three doors: NOT PROVEN. Menu links `/library/video`, `/library/wizard`, `/settings/ai` (PR 214). Missing: a test that New opens those three doors.
- LessonSpec: PROVEN. `/library/wizard` · PR 224 · `app/src/app/library/wizard/lesson-spec.test.mjs`
- NextCard for salesperson and tracked child: PROVEN. `/dashboard` · PR 250 · `app/src/lib/living-brain/model.test.mjs`
- Insights real aggregates + credit burn: PROVEN. `/insights` · PR 225 · `app/src/app/insights/aggregate.test.mjs`
- Teach live `/o/:slug/teach`: PROVEN. `/o/:slug/teach` · PR 30 · `app/scripts/wave3-composer.test.mjs`

Product stays HELD. Launch CLOSED 0/8.
