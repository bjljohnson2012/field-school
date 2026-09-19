import {loadFont as loadFraunces} from "@remotion/google-fonts/Fraunces";
import {loadFont as loadPlex} from "@remotion/google-fonts/IBMPlexSans";
import {loadFont as loadSerif} from "@remotion/google-fonts/SourceSerif4";

const fraunces = loadFraunces("normal", {
  weights: ["700"],
  subsets: ["latin"],
});
const plex = loadPlex("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const serif = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export const displayFace = fraunces.fontFamily;
export const sansFace = plex.fontFamily;
export const bodyFace = serif.fontFamily;

export const cream = "#EFE7D6";
export const ink = "#1A1A16";
export const gold = "#C4A35A";
export const olive = "#6B7F4F";
export const charcoal = "#11140C";
export const stone = "#7a746a";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DOCK_PCT = 0.38;
export const MIN_PLATE_SEC = 8;
export const MAX_PLATE_SEC = 12;
export const DEFAULT_PLATE_SEC = 10;

export const LOCK = {
  x: 1576,
  y: 24,
  w: 80,
  h: 64,
  title: "You Can Just Do Things",
} as const;
