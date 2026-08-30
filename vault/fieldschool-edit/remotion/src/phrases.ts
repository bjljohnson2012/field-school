import type {Phrase, Scene, TitleCard, WordStamp} from "./types";

const ENDERS = new Set([".", "?", "!", ",", ";", ":"]);

export function groupPhrases(words: WordStamp[]): Phrase[] {
  const out: Phrase[] = [];
  let bucket: WordStamp[] = [];

  const flush = () => {
    if (!bucket.length) {
      return;
    }
    out.push({
      start: bucket[0].start,
      end: bucket[bucket.length - 1].end,
      words: bucket,
    });
    bucket = [];
  };

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    bucket.push(word);
    const next = i + 1 < words.length ? words[i + 1] : null;
    const gap = next ? Math.max(0, next.start - word.end) : 1;
    const raw = word.text.trim();
    const last = raw.slice(-1);
    const long = bucket.length >= 8;
    const punct = ENDERS.has(last);
    const pause = gap >= 0.45;
    if (punct || long || pause || !next) {
      flush();
    }
  }
  return out;
}

export function scenesFromCards(cards: TitleCard[], durationSec: number): Scene[] {
  return (cards || [])
    .filter((card) => card.text || card.card)
    .map((card, i, all) => {
      const start = Number(card.at) || 0;
      const next = i + 1 < all.length ? Number(all[i + 1].at) || durationSec : durationSec;
      return {
        id: `s${i + 1}`,
        label: card.text,
        in: start,
        out: next > start ? next : start + 4,
        x: 48,
        y: 180,
        scale: 1,
        motion: i % 2 === 0 ? "spring" : "interpolate",
        text: card.text,
        card: card.card,
      };
    });
}

export function talkSeconds(cuts: {in: number; out: number}[], durationSec: number): number {
  const ranges = cuts && cuts.length ? cuts : [{in: 0, out: durationSec || 8}];
  let total = 0;
  for (const cut of ranges) {
    const start = Number(cut.in) || 0;
    const end = Number(cut.out) > start ? Number(cut.out) : start + (durationSec || 8);
    total += Math.max(0.1, end - start);
  }
  return total;
}
