# Track B quality path

One Cap take goes to WhisperX words, then four plates, then `master.mp4`.

The four plates, in order, are Opener, TalkingHead, RecapCard, and QuizBumper. Captions are a layer on that take. They are not a fifth plate.

Fixture audio `plates/fixtures/track-b-fixture.wav` stands in for a Cap take. `mapTrackBCaptions` turns the paired WhisperX words into captions: one space before each word, times in milliseconds, speaker labels dropped. Opener, TalkingHead, RecapCard, and QuizBumper use that same clock. `TrackBMaster` places those four plates on one timeline, in that order, for 1050 frames at 30fps. A dry-run export checklist prints the manifest, the duration, and that plate order. It does not render. The Independent Antagonist bar checks it.

This clock does not render. Asset Just `27pn9xs0zk8a73g` stays locked. The Aug 30 master stays locked. The planned master path is not written. Remotion stays in `plates/`. It is not added to the Next app, and it does not enter the Next player rail.

Independent Antagonist bar on the fixture: PASS. The Track B cleaning checklist reads that dry-run. It flips Cleaning only when the checklist passes. Publish evidence can then pass. `distribute` stays false. It does not flip dest. Launch stays CLOSED 0/8.

Proof: `node --test scripts/track-b-publish.test.mjs scripts/track-b-cleaning.test.mjs scripts/track-b-export-ready.test.mjs scripts/track-b-quality-path.test.mjs` from `plates/`.
