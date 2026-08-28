import {loadFont as loadFraunces} from "@remotion/google-fonts/Fraunces";
import {loadFont as loadPlex} from "@remotion/google-fonts/IBMPlexSans";
import {loadFont as loadSerif} from "@remotion/google-fonts/SourceSerif4";

export const {fontFamily: displayFace, waitUntilDone: waitDisplay} = loadFraunces("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

export const {fontFamily: bodyFace, waitUntilDone: waitBody} = loadSerif("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export const {fontFamily: uiFace, waitUntilDone: waitUi} = loadPlex("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export const waitMadeUpFonts = (): Promise<void> =>
  Promise.all([waitDisplay(), waitBody(), waitUi()]).then(() => undefined);
