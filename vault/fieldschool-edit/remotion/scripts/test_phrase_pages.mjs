import {authoredPages, autoPages, pageAt} from "../src/madeup/phrasePages.ts";

const spoken = [
  {text: "Somebody", fromMs: 18047, toMs: 18367},
  {text: "tell", fromMs: 18407, toMs: 18547},
  {text: "them", fromMs: 18567, toMs: 18687},
  {text: "a", fromMs: 19807, toMs: 19847},
  {text: "meeting,", fromMs: 19927, toMs: 20587},
  {text: "a", fromMs: 20607, toMs: 20627},
  {text: "title.", fromMs: 21308, toMs: 21868},
  {text: "um", fromMs: 29814, toMs: 29934},
  {text: "you", fromMs: 34701, toMs: 34781},
  {text: "can", fromMs: 34821, toMs: 34921},
  {text: "just", fromMs: 34941, toMs: 35101},
  {text: "do", fromMs: 35142, toMs: 35282},
  {text: "things", fromMs: 35362, toMs: 35622},
];

const authored = authoredPages(
  [
    {text: "they told you to wait", fromMs: 18047},
    {text: "for a meeting", fromMs: 19927},
    {text: "for a title", fromMs: 21308},
  ],
  spoken,
  34701,
);
const meeting = pageAt(authored, 20100);
if (!meeting || !meeting.words.some((word) => /meeting/i.test(word.text))) {
  throw new Error("0:18 field must show a meeting phrase, not a lone noun");
}
const auto = autoPages(spoken, 18000, 36000);
if (auto.some((page) => page.words.some((word) => word.text === "um"))) {
  throw new Error("filler leaked into phrase pages");
}
if (auto.some((page) => page.words.length > 8)) {
  throw new Error("page longer than 8 words");
}
console.log("PASS phrase pages", authored.length, auto.length);
