import {gateRender} from "./render-lock.mjs";

const gated = gateRender();
if (!gated.ok) {
  console.error(`refuse: ${gated.error}`);
  process.exit(gated.error === "locked_dest" ? 2 : 3);
}
console.log("render lock clear");
