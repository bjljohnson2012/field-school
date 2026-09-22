import {destLocked, justRefused, LOCKED_JUST_ID} from "./render-lock.mjs";
import {collectWhisperxWords, whisperxWordsToCaptions} from "./whisperx-to-captions.mjs";

/** Live catalog. Captions are a layer, not a fifth plate. */
export const FOUR_PLATES = ["Opener", "TalkingHead", "RecapCard", "QuizBumper"];

export const TRACK_B_STAGES = ["cap", "whisperx", "plates", "master"];

const HARD_GATES = ["VOX-H01", "VOX-H05", "VOX-H06", "VOX-H08", "VOX-H10"];

function samePlates(plates) {
  return Array.isArray(plates) && plates.length === FOUR_PLATES.length && plates.every((name, index) => name === FOUR_PLATES[index]);
}

function inNext(dest) {
  const value = String(dest || "");
  return value.includes("/app/") || value.includes("player-rail") || value.includes("node_modules/remotion");
}

/**
 * Plan one factory take. Does not render. Does not write a file.
 * Cap take → WhisperX words → four plates → master.mp4.
 */
export function planQualityPath(input) {
  const capId = String(input?.capId || "").trim();
  const dest = String(input?.dest || "").trim();
  const plates = input?.plates;
  if (!capId) return {ok: false, error: "cap_required"};
  if (justRefused(capId) || destLocked(dest)) return {ok: false, error: "locked_dest"};
  if (inNext(dest) || input?.target === "next") return {ok: false, error: "remotion_stays_in_plates"};
  if (!samePlates(plates)) return {ok: false, error: "four_plates"};
  if (!dest.endsWith("master.mp4")) return {ok: false, error: "master_mp4"};
  let captions;
  try {
    captions = whisperxWordsToCaptions(collectWhisperxWords(input.words));
  } catch {
    return {ok: false, error: "whisperx_words"};
  }
  if (!captions.length) return {ok: false, error: "whisperx_words"};
  return {
    ok: true,
    stages: TRACK_B_STAGES,
    capId,
    captions,
    plates: FOUR_PLATES,
    dest,
    width: 1920,
    height: 1080,
    fps: 30,
    gold: "#C4A35A",
    target: "plates",
    renders: false,
    justId: LOCKED_JUST_ID,
  };
}

/** Independent Antagonist bar v2. One HARD_FAIL wins. This clock does not render. */
export function auditQualityPath(plan) {
  const gates = {
    "VOX-H01":
      plan?.width === 1920 && plan?.height === 1080 && plan?.fps === 30 && String(plan?.dest || "").endsWith("master.mp4")
        ? "PASS"
        : "HARD_FAIL",
    "VOX-H05": samePlates(plan?.plates) ? "PASS" : "HARD_FAIL",
    "VOX-H06": plan && !justRefused(plan.capId) && !destLocked(plan.dest) ? "PASS" : "HARD_FAIL",
    "VOX-H08":
      Array.isArray(plan?.captions) &&
      plan.captions.length > 0 &&
      plan.captions.every((caption) => typeof caption.text === "string" && caption.text.startsWith(" ") && Number.isFinite(caption.startMs))
        ? "PASS"
        : "HARD_FAIL",
    "VOX-H10": plan?.target === "plates" && plan?.renders === false && !inNext(plan?.dest) ? "PASS" : "HARD_FAIL",
  };
  const hard = HARD_GATES.some((id) => gates[id] === "HARD_FAIL");
  return {
    verdict: hard ? "HARD_FAIL" : "PASS",
    gates,
    hold_cleaning: true,
    escalate: hard,
    rendering: "idle",
  };
}
