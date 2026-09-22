import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-resolve.mjs", {
  parentURL: pathToFileURL(new URL("./ts-ext.mjs", import.meta.url).pathname),
});
