#!/usr/bin/env node
import {readFileSync, writeFileSync} from "node:fs";

const wordsPath = process.argv[2];
const dest = process.argv[3];
const raw = JSON.parse(readFileSync(wordsPath, "utf8"));
const words = raw.segments
  ? raw.segments.flatMap((seg) => seg.words || [])
  : raw.words || [];

const stamps = [];
let prevEnd = 0;
for (const word of words) {
  const text = String(word.word || word.text || "").trim();
  if (!text) continue;
  const start = Number(word.start);
  const end = Number(word.end);
  const fromMs = Number.isFinite(start) ? Math.round(start * 1000) : prevEnd + 80;
  const toMs = Number.isFinite(end) ? Math.round(end * 1000) : fromMs + 180;
  stamps.push({text: text.replace(/^[-]/, ""), fromMs, toMs});
  prevEnd = toMs;
}

const pages = [];
let bucket = [];
const flush = () => {
  if (!bucket.length) return;
  pages.push({
    startMs: bucket[0].fromMs,
    endMs: bucket[bucket.length - 1].toMs + 80,
    words: bucket,
  });
  bucket = [];
};

for (const word of stamps) {
  if (bucket.length && word.fromMs - bucket[0].fromMs > 1400) flush();
  bucket.push(word);
}
flush();

writeFileSync(dest, JSON.stringify({pages, words: stamps}, null, 2));
console.log(dest, "pages", pages.length, "words", stamps.length);
