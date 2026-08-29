export {bodyFace, displayFace, uiFace} from "./fonts";

export const night = "#11140C";
export const paper = "#EFE7D6";
export const bg = paper;
export const ink = "#1A1A16";
export const gold = "#C4A35A";
export const wine = "#8B3A2A";
export const olive = "#6B7F4F";

export const FPS = 30;
export const HEAD_DOCK = 0.38;
export const HEAD_RIGHT_GAP = 56;
export const HEAD_PIP = 380;
export const HEAD_PIP_GAP = 56;
export const HEAD_MAT_PX = 18;
export const HEAD_RULE_PX = 3;
export const INSET = 80;
export const CAPTION_BOTTOM = 140;
export const TYPE_BESIDE = 76;
export const TYPE_SOLO = 120;
export const TYPE_PLAYBOOK = 132;
export const TYPE_HEAD_GAP = 160;
export const WORD_FADE_FRAMES = 1;
export const MIN_HOLD_MS = 3000;
export const DROP_RETURN_LEAD_FRAMES = 28;
export const TYPE_COL = 980;
export const HOOK_FULL = 1760;
export const MASTER_FRAMES = 19936;
export const HOOK_FRAMES = 540;
export const BED_FRAMES = 1834;

export const paperGrain = [
  "repeating-linear-gradient(0deg, rgba(26,26,22,0.035) 0 1px, transparent 1px 4px)",
  "repeating-linear-gradient(90deg, rgba(196,163,90,0.045) 0 1px, transparent 1px 7px)",
].join(", ");

export const darkGrain = [
  "repeating-linear-gradient(0deg, rgba(239,231,214,0.03) 0 1px, transparent 1px 5px)",
  "repeating-linear-gradient(90deg, rgba(196,163,90,0.04) 0 1px, transparent 1px 9px)",
].join(", ");

export const headReservedPx = (): number => Math.round(1920 * HEAD_DOCK) + HEAD_RIGHT_GAP;
