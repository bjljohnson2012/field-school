const normWord = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "");
const FILLER = /^(um|uh|uhh)$/i;
const ENDS = /[.!?]$/;
const MAX_WORDS = 18;
const GAP_MS = 840;
const WEAK = /^(a|an|the|and|to|of|for|or)$/i;
const bare = (text) => text.trim();

const autoPages = (spoken, fromMs, toMs) => {
  const span = spoken.filter((word) => word.fromMs >= fromMs && word.fromMs < toMs && !FILLER.test(normWord(word.text)));
  const groups = [];
  let bucket = [];
  const flush = () => {
    if (bucket.length > 0) {
      groups.push(bucket);
      bucket = [];
    }
  };
  for (const word of span) {
    const prev = bucket[bucket.length - 1];
    const gap = prev ? word.fromMs - prev.toMs : 0;
    const punct = prev ? ENDS.test(bare(prev.text)) : false;
    const pause = prev ? gap >= GAP_MS && bucket.length >= 3 && !WEAK.test(normWord(prev.text)) : false;
    if (prev && (punct || pause || bucket.length >= MAX_WORDS)) {
      flush();
    }
    bucket.push({...word, text: bare(word.text)});
  }
  flush();
  return groups.map((group, i) => {
    const next = groups[i + 1];
    return {
      words: group,
      appearMs: group[0].fromMs,
      hideMs: next ? next[0].fromMs : Math.max(toMs, group[group.length - 1].toMs + 700),
    };
  });
};

const pageAt = (pages, nowMs) => pages.find((page) => nowMs >= page.appearMs && nowMs < page.hideMs) ?? null;

const spoken = [
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
  {text: "Somebody", fromMs: 24021, toMs: 24361},
  {text: "to", fromMs: 24381, toMs: 24421},
  {text: "walk", fromMs: 24481, toMs: 24681},
  {text: "in", fromMs: 24741, toMs: 24801},
  {text: "and", fromMs: 24841, toMs: 24921},
  {text: "say,", fromMs: 24961, toMs: 25182},
  {text: "hey,", fromMs: 25202, toMs: 25622},
  {text: "this", fromMs: 25662, toMs: 25782},
  {text: "is", fromMs: 25842, toMs: 25902},
  {text: "how", fromMs: 25942, toMs: 26062},
  {text: "we", fromMs: 26082, toMs: 26202},
  {text: "do", fromMs: 26222, toMs: 26382},
  {text: "it.", fromMs: 26462, toMs: 26542},
];

const pages = autoPages(spoken, 17400, 34700);
const mid = pageAt(pages, 20100);
const midText = mid ? mid.words.map((word) => word.text).join(" ") : "";
if (!mid || !/Somebody tell them that they can do something/.test(midText)) {
  throw new Error(`sentence must accumulate, got ${midText || "empty"}`);
}
if (!/meeting/.test(midText) || !/title/.test(midText)) {
  throw new Error(`sentence must keep going through meeting and title, got ${midText}`);
}
const next = pageAt(pages, 25000);
const nextText = next ? next.words.map((word) => word.text).join(" ") : "";
if (!next || !/walk in/.test(nextText)) {
  throw new Error(`next sentence should start after title., got ${nextText || "empty"}`);
}
console.log("PASS sentence pages", pages.length, midText);
