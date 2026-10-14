import {continueRender, delayRender} from "remotion";
import {loadFont as loadFraunces} from "@remotion/google-fonts/Fraunces";
import {loadFont as loadPlex} from "@remotion/google-fonts/IBMPlexSans";
import {loadFont as loadSerif} from "@remotion/google-fonts/SourceSerif4";
import {
  bg,
  captionActive,
  captionBg,
  captionFg,
  card,
  charcoal,
  cream,
  gold,
  indigo,
  indigoDeep,
  ink,
  muted,
  navy,
  olive,
  orange,
  paper,
  primary,
  primaryFg,
  stone,
} from "./brand/tokens";

const fraunces = loadFraunces("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
const plex = loadPlex("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const serif = loadSerif("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

const fontHandle = delayRender("Fraunces 600, Source Serif 4, IBM Plex Sans 600");
Promise.all([fraunces.waitUntilDone(), plex.waitUntilDone(), serif.waitUntilDone()])
  .then(() => continueRender(fontHandle))
  .catch((error) => {
    console.error(error);
  });

export const displayFace = fraunces.fontFamily;
export const sansFace = plex.fontFamily;
export const serifFace = serif.fontFamily;

export {
  bg,
  captionActive,
  captionBg,
  captionFg,
  card,
  charcoal,
  cream,
  gold,
  indigo,
  indigoDeep,
  ink,
  muted,
  navy,
  olive,
  orange,
  paper,
  primary,
  primaryFg,
  stone,
};
export const INTRO_SEC = 0;
