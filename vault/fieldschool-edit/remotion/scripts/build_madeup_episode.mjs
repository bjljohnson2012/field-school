import {readFileSync, writeFileSync} from "node:fs";

const capsPath = process.argv[2] || "public/episodes/everything-made-up/captions.json";
const dest = process.argv[3] || "public/episodes/everything-made-up/episode.json";
const FPS = 30;
const MASTER = 19936;

const caps = JSON.parse(readFileSync(capsPath, "utf8"));
const words = caps.words || [];
const norm = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "");
const frameOf = (ms) => Math.round((ms / 1000) * FPS);
const first = (needle, afterMs = 0) =>
  words.find((word) => word.fromMs >= afterMs && (norm(word.text) === needle || norm(word.text).includes(needle)));

const people = first("people");
const waiting = first("waiting");
const playbook = first("playbook");
const youJust = first("you", 34000);
const thingsHook = first("things", 35000);
const gravity = first("gravity");
const door = first("door", 250000);
const five = first("five", 250000);
const whyFive = first("why", 260000);
const sixty = first("60", 380000) || first("sixty", 380000);
const intim = first("intimidated");
const refuse = first("refuse");
const wreck = first("wreck");
const ask = first("ask", 610000);
const act = first("act", 630000);
const thingsReal = first("things", 636000);
const reasonCta = first("reason", 643000);

const ms = (word, fallback) => (word ? word.fromMs : fallback);

const shots = [];
const push = (shot) => {
  shots.push(shot);
};

const fillAroll = (fromFrame, toFrame, startSide, extra = {}) => {
  const layouts = startSide === "left" ? ["dock-left", "letterbox", "dock-right"] : ["dock-right", "letterbox", "dock-left"];
  let at = fromFrame;
  let i = 0;
  while (at < toFrame) {
    const remain = toFrame - at;
    if (remain < 240 && i > 0) {
      shots[shots.length - 1].durationInFrames += remain;
      break;
    }
    const chunk = remain <= 540 ? remain : Math.min(540, Math.max(360, remain > 900 ? 480 : remain));
    push({
      id: extra.id ? `${extra.id}${i === 0 ? "" : `-${i}`}` : `a${fromFrame}-${i}`,
      type: "a-roll",
      fromFrame: at,
      durationInFrames: chunk,
      layout: layouts[i % layouts.length],
      ...extra.shot,
    });
    at += chunk;
    i += 1;
  }
};

push({id: "s00", type: "sting", fromFrame: 0, durationInFrames: frameOf(ms(people, 5124)), layout: "off", sfx: ["sting"]});

const hookFrom = frameOf(ms(people, 5124));
const waitFrom = frameOf(ms(waiting, 11126));
push({
  id: "s01",
  type: "hook",
  fromFrame: hookFrom,
  durationInFrames: frameOf(ms(playbook, 15026)) - hookFrom,
  layout: "off",
  text: "PEOPLE CANNOT GET THINGS DONE",
  sfx: ["hit"],
});

const bookFrom = frameOf(ms(playbook, 15026));
const justFrom = frameOf(ms(youJust, 34701));
push({
  id: "s03",
  type: "a-roll",
  fromFrame: bookFrom,
  durationInFrames: justFrom - bookFrom,
  layout: "dock-right",
  lowerThird: {name: "Ben Johnson", title: ""},
  phrases: [
    {text: "they told you to wait", fromMs: 18047},
    {text: "for a meeting", fromMs: 19927},
    {text: "for a title", fromMs: 21308},
  ],
});

const justEnd = Math.max(justFrom + 74, frameOf((thingsHook?.toMs || 35622) + 700));
push({
  id: "s02",
  type: "hook",
  fromFrame: justFrom,
  durationInFrames: justEnd - justFrom,
  layout: "off",
  text: "YOU CAN JUST DO THINGS",
  sfx: ["tick"],
});

const gravFrom = frameOf(ms(gravity, 113740));
fillAroll(justEnd, gravFrom, "left", {id: "s02b"});

push({
  id: "s04",
  type: "vox",
  fromFrame: gravFrom,
  durationInFrames: 227,
  layout: "off",
  text: "NOT GRAVITY",
  assets: ["stills/quota.png", "stills/policy.png", "stills/ice.png"],
  sfx: ["tick"],
  annotation: "A PERSON CHOSE THIS",
});

const doorFrom = frameOf(ms(door, 251829));
const fiveFrom = frameOf(ms(five, 255594));
fillAroll(gravFrom + 227, doorFrom, "right", {id: "s06"});

push({
  id: "s08",
  type: "vox",
  fromFrame: doorFrom,
  durationInFrames: Math.max(36, fiveFrom - doorFrom),
  layout: "off",
  text: "THE DOOR",
  assets: ["stills/fence.png"],
  annotation: "FIND THE REASON FIRST",
  sfx: ["tick"],
});

const whyFrom = frameOf(ms(whyFive, 262924));
push({
  id: "s10",
  type: "vox",
  fromFrame: fiveFrom,
  durationInFrames: Math.max(90, whyFrom - fiveFrom),
  layout: "off",
  text: "FIVE QUESTIONS",
  sfx: ["tick"],
});

const sixtyFrom = frameOf(ms(sixty, 382378));
fillAroll(whyFrom, sixtyFrom, "left", {id: "s10b"});

push({
  id: "s12",
  type: "vox",
  fromFrame: sixtyFrom,
  durationInFrames: 220,
  layout: "off",
  text: "60 DAYS",
  sfx: ["hit"],
});

const collageFrom = 13932;
fillAroll(sixtyFrom + 220, collageFrom, "right", {id: "s12b"});

push({
  id: "s13",
  type: "b-roll",
  fromFrame: collageFrom,
  durationInFrames: 980,
  layout: "pip-tr",
  text: "DOES IT HAVE TO BE",
  assets: ["stills/proof.png", "stills/template.png"],
  sfx: ["whoosh"],
});

const intimFrom = frameOf(ms(intim, 522325));
fillAroll(collageFrom + 980, intimFrom, "left", {id: "s14"});

push({
  id: "s15",
  type: "vox",
  fromFrame: intimFrom,
  durationInFrames: Math.max(90, frameOf(ms(refuse, 536130)) - intimFrom),
  layout: "off",
  text: "INTIMIDATED",
  sfx: ["tick"],
});

const refuseFrom = frameOf(ms(refuse, 536130));
const wreckFrom = frameOf(ms(wreck, 538171));
push({
  id: "s15b",
  type: "vox",
  fromFrame: refuseFrom,
  durationInFrames: Math.max(72, wreckFrom - refuseFrom),
  layout: "off",
  text: "REFUSE",
});

push({
  id: "s15c",
  type: "vox",
  fromFrame: wreckFrom,
  durationInFrames: 220,
  layout: "off",
  text: "WRECK",
});

const askFrom = frameOf(ms(ask, 617594));
fillAroll(wreckFrom + 220, askFrom, "right", {id: "s16"});

const actFrom = frameOf(ms(act, 634649));
push({
  id: "s17",
  type: "vox",
  fromFrame: askFrom,
  durationInFrames: Math.max(180, actFrom - askFrom),
  layout: "off",
  text: "ASK",
  list: ["WHY", "STARTED", "LEFT OUT", "BEST", "CUT"],
  sfx: ["tick"],
});

const thingsFrom = frameOf(ms(thingsReal, 637372));
push({
  id: "s18",
  type: "vox",
  fromFrame: actFrom,
  durationInFrames: Math.max(48, thingsFrom - actFrom),
  layout: "off",
  text: "ACT",
  sfx: ["hit"],
});

const ctaFrom = frameOf(ms(reasonCta, 644517));
push({
  id: "s18b",
  type: "vox",
  fromFrame: thingsFrom,
  durationInFrames: Math.max(72, ctaFrom - thingsFrom),
  layout: "off",
  text: "THINGS ARE REAL.",
});

push({
  id: "s19",
  type: "cta",
  fromFrame: ctaFrom,
  durationInFrames: 180,
  layout: "off",
  text: "CHANGE IT WITH THE REASON IN HAND",
  sfx: ["sting"],
});

const tailFrom = ctaFrom + 180;
push({
  id: "s20",
  type: "a-roll",
  fromFrame: tailFrom,
  durationInFrames: Math.max(90, MASTER - 120 - tailFrom),
  layout: "letterbox",
});

push({
  id: "s21",
  type: "cta",
  fromFrame: MASTER - 120,
  durationInFrames: 120,
  layout: "off",
  text: "CHANGE IT WITH THE REASON IN HAND",
});

for (let i = 1; i < shots.length; i += 1) {
  const prev = shots[i - 1];
  const end = prev.fromFrame + prev.durationInFrames;
  if (shots[i].fromFrame !== end) {
    shots[i].fromFrame = end;
  }
}
const last = shots[shots.length - 1];
last.durationInFrames = MASTER - last.fromFrame;

const episode = {
  slug: "everything-made-up",
  title: "Everything Is Made Up",
  brandKit: "custom",
  fps: 30,
  width: 1920,
  height: 1080,
  hook: "People cannot get things done. You can just do things because the blockers were made up.",
  thesis: "Made up does not mean fake. Made up means authored, and authored things can be changed with the reason in hand.",
  cam: "a_roll.mp4",
  vo: "episodes/everything-made-up/vo.wav",
  captions: "episodes/everything-made-up/captions.json",
  shots,
};

writeFileSync(dest, JSON.stringify(episode, null, 2));
console.log(dest, "shots", shots.length, "wait", waitFrom, "five", fiveFrom, "ask", askFrom, "act", actFrom);
