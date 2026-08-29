const normWord = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "");

const matchAuthored = (line, spoken, fromMs, untilMs) => {
  const tokens = line.split(/\s+/).filter(Boolean);
  const pool = spoken.filter((word) => word.fromMs >= fromMs - 80 && word.fromMs < untilMs);
  const used = new Set();
  const hits = [];
  let cursor = 0;
  for (const token of tokens) {
    const needle = normWord(token);
    let found;
    for (let i = cursor; i < pool.length; i += 1) {
      if (used.has(i)) {
        continue;
      }
      const have = normWord(pool[i].text);
      if (have === needle || have.includes(needle) || needle.includes(have)) {
        found = pool[i];
        used.add(i);
        cursor = i + 1;
        break;
      }
    }
    hits.push(found ? {...found, text: token} : {text: token, fromMs, toMs: fromMs});
  }
  return hits;
};

const authoredPages = (phrases, spoken, untilMs) =>
  phrases.map((phrase, i) => {
    const next = phrases[i + 1];
    const hideMs = next ? next.fromMs : Math.max(untilMs, phrase.fromMs + 900);
    return {
      words: matchAuthored(phrase.text, spoken, phrase.fromMs, hideMs),
      appearMs: phrase.fromMs,
      hideMs,
      authored: true,
    };
  });

const pageAt = (pages, nowMs) => pages.find((page) => nowMs >= page.appearMs && nowMs < page.hideMs) ?? null;

const spoken = [
  {text: "playbook.", fromMs: 15035, toMs: 16776},
  {text: "Somebody", fromMs: 18037, toMs: 18377},
  {text: "tell", fromMs: 18417, toMs: 18557},
  {text: "them", fromMs: 18597, toMs: 18697},
  {text: "that", fromMs: 18717, toMs: 18798},
  {text: "they", fromMs: 18838, toMs: 18938},
  {text: "can", fromMs: 18958, toMs: 19078},
  {text: "do", fromMs: 19118, toMs: 19258},
  {text: "something,", fromMs: 19338, toMs: 19798},
  {text: "a", fromMs: 19818, toMs: 19858},
  {text: "meeting,", fromMs: 19938, toMs: 20599},
  {text: "a", fromMs: 20619, toMs: 20639},
  {text: "title.", fromMs: 21319, toMs: 21859},
  {text: "um", fromMs: 29814, toMs: 29934},
  {text: "you", fromMs: 34701, toMs: 34781},
  {text: "can", fromMs: 34821, toMs: 34921},
  {text: "just", fromMs: 34941, toMs: 35101},
  {text: "do", fromMs: 35142, toMs: 35282},
  {text: "things", fromMs: 35362, toMs: 35622},
];

const authored = authoredPages(
  [
    {text: "they told you to wait", fromMs: 17400},
    {text: "for a meeting", fromMs: 19927},
    {text: "for a title", fromMs: 21308},
  ],
  spoken,
  34701,
);

const open = pageAt(authored, 18000);
const openText = open ? open.words.map((word) => word.text).join(" ") : "";
if (!open || !/they told you to wait/i.test(openText)) {
  throw new Error(`0:18 field must show they told you to wait, got ${openText || "empty"}`);
}
const you = open.words.find((word) => /^you$/i.test(word.text));
if (you && you.fromMs > 22000 && you.toMs > you.fromMs) {
  throw new Error("you bound to a later utterance");
}

const meeting = pageAt(authored, 20100);
if (!meeting || !meeting.words.some((word) => /meeting/i.test(word.text))) {
  throw new Error("meeting page must print the meeting phrase, not a lone noun");
}

if (authored.some((page) => page.words.some((word) => word.text === "um"))) {
  throw new Error("filler leaked into authored pages");
}
console.log("PASS phrase pages", authored.length, openText);
