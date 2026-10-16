/**
 * First ~60s of the Cap take, ending on a sentence break.
 * Cut silence >= 400ms. Drop fillers, breaths, and false starts.
 * Yap is guidance only: protect adjacent phonemes, do not butt-cut room tone,
 * and do not treat a low-energy gap as safe until the word clock agrees.
 */
import {spawnSync} from "node:child_process";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {toCaptions, wordsFromWhisperx} from "./whisperx-to-captions.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const remotion = resolve(repo, "remotion");

const SILENCE_SEC = 0.4;
const VOX_ENTER_SEC = 0.8;
const PAD_BEFORE = 0.05;
const PAD_AFTER = 0.07;
const VO_OFFSET_SEC = 0.7;
const OUTRO_SEC = 2.5;
const FPS = 30;

const FILLERS = new Set(["um", "uh", "er", "erm", "ah", "hmm", "mm", "mhm", "uhh", "umm"]);
const BREATH = /^(breath|inhale|exhale|sigh|gasp|sniff)$/;

export function normToken(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function sentenceEndNear(words, targetSec) {
  const ends = words.filter((word) => /[.!?]["']?$/.test(word.word.trim()));
  const window = ends.filter((word) => word.end >= targetSec - 12 && word.end <= targetSec + 8);
  const pool = window.length ? window : ends;
  if (!pool.length) {
    throw new Error("no sentence break in the align");
  }
  return pool.reduce((best, word) =>
    Math.abs(word.end - targetSec) < Math.abs(best.end - targetSec) ? word : best,
  );
}

export function classifyDrops(words) {
  const drop = new Set();
  const reasons = [];
  words.forEach((word, index) => {
    const token = normToken(word.word);
    if (!token) {
      drop.add(index);
      reasons.push({index, reason: "empty"});
      return;
    }
    if (FILLERS.has(token) || BREATH.test(token) || /^\[.*\]$/.test(word.word.trim())) {
      drop.add(index);
      reasons.push({index, reason: FILLERS.has(token) ? "filler" : "breath"});
      return;
    }
    if (index === 0 && (token === "okay" || token === "ok")) {
      drop.add(index);
      reasons.push({index, reason: "filler"});
      return;
    }
    const next = words[index + 1];
    if (!next) {
      return;
    }
    const gap = next.start - word.end;
    const same = token === normToken(next.word) && token.length > 0;
    const clipped = word.end - word.start < 0.45 && gap < 0.35;
    if (same && clipped) {
      drop.add(index);
      reasons.push({index, reason: "false-start"});
    }
  });
  return {drop, reasons};
}

export function keepPieces(words) {
  const pieces = [];
  for (const word of words) {
    if (!pieces.length) {
      pieces.push({
        start: Math.max(0, word.start - PAD_BEFORE),
        end: word.end,
        words: [word],
      });
      continue;
    }
    const prev = pieces[pieces.length - 1];
    const gap = word.start - prev.end;
    if (gap < SILENCE_SEC) {
      prev.end = word.end;
      prev.words.push(word);
      continue;
    }
    prev.end += PAD_AFTER;
    pieces.push({
      start: Math.max(prev.end, word.start - PAD_BEFORE),
      end: word.end,
      words: [word],
    });
  }
  if (pieces.length) {
    pieces[pieces.length - 1].end += 0.1;
  }
  return pieces.filter((piece) => piece.end - piece.start > 0.04);
}

export function mapPieces(pieces) {
  let cursor = 0;
  return pieces.map((piece) => {
    const editedStart = cursor;
    const editedEnd = cursor + (piece.end - piece.start);
    cursor = editedEnd;
    return {...piece, editedStart, editedEnd};
  });
}

function mapTime(pieces, sourceSec) {
  for (const piece of pieces) {
    if (sourceSec >= piece.start - 0.02 && sourceSec <= piece.end + 0.02) {
      return piece.editedStart + (sourceSec - piece.start);
    }
  }
  return null;
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, {stdio: "inherit"});
  if (result.status !== 0) {
    throw new Error(`${cmd} failed (${result.status})`);
  }
}

function assemble({video, wav, pieces, aroll, bedIn, whoosh, ding, tick, publicDir}) {
  mkdirSync(publicDir, {recursive: true});
  const parts = [];
  const labels = [];
  pieces.forEach((piece, index) => {
    const dur = piece.end - piece.start;
    const fadeOut = Math.max(0, dur - 0.012).toFixed(3);
    parts.push(
      `[0:v]trim=start=${piece.start.toFixed(3)}:end=${piece.end.toFixed(3)},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v${index}]`,
      `[1:a]atrim=start=${piece.start.toFixed(3)}:end=${piece.end.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.008,afade=t=out:st=${fadeOut}:d=0.008[a${index}]`,
    );
    labels.push(`[v${index}][a${index}]`);
  });
  parts.push(`${labels.join("")}concat=n=${pieces.length}:v=1:a=1[vc][ac]`);
  parts.push(`[vc]tpad=stop_mode=clone:stop_duration=${OUTRO_SEC}[v]`);
  parts.push(`[ac]apad=pad_dur=${OUTRO_SEC}[a]`);
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    video,
    "-i",
    wav,
    "-filter_complex",
    parts.join(";"),
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-ac",
    "1",
    aroll,
  ]);
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    bedIn,
    "-t",
    "90",
    "-vn",
    "-af",
    "lowpass=f=140:poles=2,lowpass=f=140:poles=2",
    "-c:a",
    "libmp3lame",
    "-q:a",
    "4",
    resolve(publicDir, "bed.mp3"),
  ]);
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=392:duration=0.9",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=494:duration=0.9",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=587:duration=0.9",
    "-filter_complex",
    "amix=inputs=3:duration=longest,afade=t=in:d=0.02,afade=t=out:st=0.55:d=0.35,volume=0.45",
    resolve(publicDir, "sting.wav"),
  ]);
  for (const [src, name] of [
    [whoosh, "whoosh.wav"],
    [ding, "ding.wav"],
    [tick, "switch.wav"],
  ]) {
    run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", src, resolve(publicDir, name)]);
  }
}

function cue(id, text, fromMs, sfx, emphasis, vox) {
  return {id, text, fromMs: Math.round(fromMs), sfx, emphasis, vox};
}

function buildEpisode({pieces, kept, voxEnters, speechSec}) {
  const editedOf = (token) => {
    const word = kept.find((item) => normToken(item.word) === token);
    if (!word) {
      throw new Error(`missing anchor word ${token}`);
    }
    const edited = mapTime(pieces, word.start);
    if (edited == null) {
      throw new Error(`unmapped anchor ${token}`);
    }
    return VO_OFFSET_SEC + edited;
  };
  const allOf = (token) =>
    kept
      .filter((item) => normToken(item.word) === token)
      .map((item) => VO_OFFSET_SEC + mapTime(pieces, item.start));

  const tOne = editedOf("one");
  const tSelf = editedOf("selfgovernment");
  const tPhrase = editedOf("phrase");
  const rules = allOf("rule");
  const tRule = rules[0];
  const invests = allOf("invest");
  const tInvest = invests[0];
  const tInfluence = editedOf("influence");
  const leads = allOf("lead");
  const tLead = leads[leads.length - 1];
  const speechEnd = VO_OFFSET_SEC + speechSec;
  const durationSec = speechEnd + OUTRO_SEC;

  const anchors = [
    ["sting", 0],
    ["slate", VO_OFFSET_SEC],
    ["objective", tOne],
    ["hook", tPhrase],
    ["teach", tInvest],
    ["show", Math.max(tInvest + 0.8, tInfluence - 0.35)],
    ["do", Math.max(tInfluence + 0.8, tLead - 0.25)],
    ["next-up", speechEnd],
    ["sting-tail", speechEnd + 1.5],
  ];
  const hookAt = anchors.findIndex((anchor) => anchor[0] === "hook");
  if (hookAt >= 0 && anchors[hookAt + 1][1] > 18.4) {
    anchors.splice(hookAt + 1, 0, ["hook-b", 18]);
  }
  for (let i = 1; i < anchors.length; i += 1) {
    if (anchors[i][1] <= anchors[i - 1][1] + 0.35) {
      anchors[i][1] = anchors[i - 1][1] + 0.8;
    }
  }
  if (anchors[anchors.length - 1][1] >= durationSec - 0.4) {
    throw new Error(`sting tail collides with duration ${durationSec}`);
  }

  const copy = {
    sting: ["FIELD SCHOOL", "Self-government", "sting", "takeover", false, 0],
    slate: ["COURSE  ·  MODULE", "Rule yourself before leading others", "slate", "glide", true, 0],
    objective: ["YOU WILL BE ABLE TO", "State the rule of self-government.", "objective", "takeover", true, 0],
    hook: ["THE RULE", "Rule yourself before leading others.", "card", "glide", true, 0],
    "hook-b": ["THE RULE", "Rule yourself before leading others.", "card", "takeover", true, 0],
    teach: ["TEACH", "Invest in the people you lead.", "card", "takeover", true, 0],
    show: ["SHOW", "Your actions influence the people around you.", "show", "takeover", true, 0],
    do: ["DO", "Lead yourself and think for yourself.", "card", "glide", true, 0],
    "next-up": ["NEXT UP", "Seven statements that build the rule.", "next", "glide", true, 0],
    "sting-tail": ["FIELD SCHOOL", "Rule yourself first.", "sting", "takeover", false, 0],
  };

  const chapters = anchors.map((anchor, index) => {
    const [id, inSec] = anchor;
    const outSec = index + 1 < anchors.length ? anchors[index + 1][1] : durationSec;
    const [kicker, text, mode, motion, showHead, letterbox] = copy[id];
    return {
      id,
      kicker,
      text,
      inSec: round3(inSec),
      outSec: round3(outSec),
      motion,
      showHead,
      letterbox,
      mode,
    };
  });

  const at = (token, occurrence = 0) => {
    const hits = allOf(token);
    return hits[occurrence] * 1000;
  };

  const cues = [
    cue("one", "One rule", at("one"), "tick", true, true),
    cue("work", "Work", at("work"), "tick", false, true),
    cue("life", "Life", at("life"), "tick", false, true),
    cue("leadership", "Leadership", at("leadership"), "tick", true, true),
    cue("dominion", "Dominion", at("dominion"), "tick", false, true),
    cue("self", "Self-government", at("selfgovernment"), "tick", true, true),
    cue("rule", "Rule yourself", at("rule"), "tick", true, true),
    cue("invest", "Invest", at("invest"), "tick", true, true),
    cue("influence", "Influence", at("influence"), "tick", true, true),
    cue("lead", "Lead yourself", at("lead", leads.length - 1), "tick", true, true),
  ];

  const tail = chapters.find((chapter) => chapter.id === "sting-tail");
  const teach = chapters.find((chapter) => chapter.id === "teach");
  const next = chapters.find((chapter) => chapter.id === "next-up");

  return {
    id: "lesson-flow-60",
    fps: FPS,
    width: 1920,
    height: 1080,
    durationSec: round3(durationSec),
    durationFrames: Math.round(durationSec * FPS),
    voOffsetSec: VO_OFFSET_SEC,
    speechSec: round3(speechSec),
    course: "Field School",
    module: "Self-government",
    title: "Rule yourself before leading others",
    objective: "You will be able to state the rule of self-government.",
    lowerThird: {name: "Benjamin Johnson", org: "Field School"},
    music: {
      title: "Long Note Four",
      artist: "Kevin MacLeod (incompetech.com)",
      url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20Four.mp3",
      license: "Creative Commons Attribution 4.0 International (CC BY 4.0). Commercial use with attribution. Lowpassed at 140 Hz so the pad stays under the voice.",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      volume: 0.12,
    },
    silenceRuleMs: 400,
    lufsTarget: -16,
    dockWidth: 0.38,
    chapters,
    cues,
    voxEnterMs: voxEnters.map((ms) => Math.round(ms)),
    stingMs: [0, Math.round(tail.inSec * 1000)],
    whooshMs: chapters
      .filter((chapter) => chapter.motion === "takeover" && chapter.showHead)
      .map((chapter) => Math.round(chapter.inSec * 1000))
      .concat([Math.round(next.inSec * 1000)]),
    stills: [
      {id: "sting", frame: 8},
      {id: "slate", frame: Math.round(2.4 * FPS)},
      {id: "teach", frame: Math.round((teach.inSec + 0.6) * FPS)},
      {id: "next-up", frame: Math.min(Math.round(durationSec * FPS) - 2, Math.round((next.inSec + 0.4) * FPS))},
    ],
    anchors: {
      one: round3(tOne),
      self: round3(tSelf),
      phrase: round3(tPhrase),
      rule: round3(tRule),
      invest: round3(tInvest),
      influence: round3(tInfluence),
      lead: round3(tLead),
    },
  };
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function selfCheck() {
  const words = [
    {word: "Um,", start: 0.1, end: 0.3, score: 1},
    {word: "Hello", start: 0.45, end: 0.7, score: 1},
    {word: "there.", start: 1.4, end: 1.7, score: 1},
  ];
  const {drop} = classifyDrops(words);
  if (!drop.has(0)) {
    throw new Error("filler was kept");
  }
  const kept = words.filter((_, index) => !drop.has(index));
  const pieces = mapPieces(keepPieces(kept));
  const gap = pieces[1].start - pieces[0].end;
  if (gap < 0.05) {
    throw new Error("silence cut removed the phoneme pad");
  }
  const editedGap = pieces[1].editedStart - pieces[0].editedEnd;
  if (editedGap > 0.001) {
    throw new Error("edited timeline has a hole");
  }
  const between = kept[1].start - kept[0].end;
  if (between < SILENCE_SEC) {
    throw new Error("fixture gap should be a legal cut");
  }
  console.log("edit-lesson-60 checks PASS");
}

function main() {
  if (process.argv.includes("--check")) {
    selfCheck();
    return;
  }
  const whisperPath = process.argv[2] || "/tmp/lesson-flow/whisperx/vo-enhanced-16k.json";
  const video = process.argv[3] || "/tmp/lesson-flow/work/source-95s.mp4";
  const wav = process.argv[4] || "/tmp/lesson-flow/work/vo-enhanced.wav";
  const data = JSON.parse(readFileSync(whisperPath, "utf8"));
  const words = wordsFromWhisperx(data);
  const ending = sentenceEndNear(words, 60);
  const window = words.filter((word) => word.start < ending.end + 0.02);
  const {drop, reasons} = classifyDrops(window);
  const kept = window.filter((_, index) => !drop.has(index));
  const pieces = mapPieces(keepPieces(kept));
  const speechSec = pieces.length ? pieces[pieces.length - 1].editedEnd : 0;

  const removed = [];
  reasons.forEach((item) => {
    const word = window[item.index];
    removed.push({
      in: round3(word.start),
      out: round3(word.end),
      reason: item.reason,
      text: word.word.trim(),
    });
  });
  if (pieces.length && pieces[0].start > 0.05) {
    removed.push({in: 0, out: round3(pieces[0].start), reason: "leading-silence"});
  }
  for (let i = 0; i < pieces.length - 1; i += 1) {
    const gapIn = pieces[i].end;
    const gapOut = pieces[i + 1].start;
    if (gapOut - gapIn >= 0.04) {
      const prevWord = pieces[i].words[pieces[i].words.length - 1];
      const nextWord = pieces[i + 1].words[0];
      const rawGap = nextWord.start - prevWord.end;
      removed.push({
        in: round3(gapIn),
        out: round3(gapOut),
        reason: rawGap >= VOX_ENTER_SEC ? "silence-800-vox-enter" : "silence-400",
        rawGap: round3(rawGap),
      });
    }
  }
  removed.push({
    in: round3(ending.end),
    out: null,
    reason: "excerpt-end-sentence",
    text: ending.word.trim(),
  });

  const keptOut = pieces.map((piece) => ({
    in: round3(piece.start),
    out: round3(piece.end),
    editedIn: round3(piece.editedStart),
    editedOut: round3(piece.editedEnd),
  }));

  const editedWords = [];
  for (const piece of pieces) {
    for (const word of piece.words) {
      const start = mapTime(pieces, word.start);
      const end = mapTime(pieces, word.end);
      editedWords.push({
        word: word.word.trim(),
        start: VO_OFFSET_SEC + start,
        end: VO_OFFSET_SEC + end,
        score: word.score,
      });
    }
  }

  const voxEnters = [];
  for (let i = 0; i < pieces.length - 1; i += 1) {
    const prevWord = pieces[i].words[pieces[i].words.length - 1];
    const nextWord = pieces[i + 1].words[0];
    if (nextWord.start - prevWord.end >= VOX_ENTER_SEC) {
      voxEnters.push((VO_OFFSET_SEC + pieces[i + 1].editedStart) * 1000);
    }
  }

  const episode = buildEpisode({pieces, kept, voxEnters, speechSec});
  const captions = toCaptions(editedWords);
  const publicDir = resolve(remotion, "public/lesson60");
  const lessonDir = resolve(remotion, "src/lesson");
  mkdirSync(lessonDir, {recursive: true});

  const cuts = {
    sourceVideoId: "4wvyy9085kbf5he",
    silenceRuleMs: 400,
    voxEnterMs: 800,
    sentenceBreak: {text: ending.word.trim(), sourceSec: round3(ending.end)},
    excerptSec: round3(ending.end),
    speechSec: round3(speechSec),
    kept: keptOut,
    removed,
    notes: [
      "Pads of 50ms before and 70ms after each cut keep consonants. Yap: ASR times are candidates; do not zero the room tone.",
      "The repeated line 'rule yourself before leading others' is an intentional restatement, not a false start.",
      "No um/uh tokens in this window. Leading 'Okay' is the only filler cut. Breaths inside gaps >= 400ms leave with those gaps.",
    ],
  };

  writeFileSync(resolve(lessonDir, "episode.json"), JSON.stringify(episode, null, 2));
  writeFileSync(resolve(lessonDir, "captions.json"), JSON.stringify(captions, null, 2));
  writeFileSync(resolve(remotion, "cuts.json"), JSON.stringify(cuts, null, 2));
  writeFileSync(resolve(lessonDir, "whisperx-align.json"), JSON.stringify(data));

  assemble({
    video,
    wav,
    pieces,
    aroll: resolve(publicDir, "aroll.mp4"),
    bedIn: "/tmp/lesson-flow/work/bed.mp3",
    whoosh: "/tmp/lesson-flow/work/whoosh.wav",
    ding: "/tmp/lesson-flow/work/ding.wav",
    tick: "/tmp/lesson-flow/work/switch.wav",
    publicDir,
  });

  console.log(
    JSON.stringify(
      {
        sentence: ending.word,
        sentenceSec: round3(ending.end),
        speechSec: round3(speechSec),
        durationSec: episode.durationSec,
        durationFrames: episode.durationFrames,
        pieces: pieces.length,
        words: editedWords.length,
        removed: removed.length,
        anchors: episode.anchors,
        stills: episode.stills,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
