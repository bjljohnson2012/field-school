import {loadFont as loadFraunces} from "@remotion/google-fonts/Fraunces";
import {loadFont as loadPlex} from "@remotion/google-fonts/IBMPlexSans";

const fraunces = loadFraunces("normal", {
  weights: ["700"],
  subsets: ["latin"],
});
const plex = loadPlex("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const displayFace = fraunces.fontFamily;
export const sansFace = plex.fontFamily;

export const cream = "#EFE7D6";
export const ink = "#1A1A16";
export const gold = "#C4A35A";
export const olive = "#6B7F4F";
export const charcoal = "#11140C";
export const stone = "#7a746a";
export const INTRO_SEC = 0;
