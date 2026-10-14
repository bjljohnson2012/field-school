import { pathToFileURL } from "url";
import { getPayload } from "payload";

const configPath = process.argv[2];
if (!configPath) {
  console.error("usage: run-init.ts <config.ts>");
  process.exit(2);
}

const loaded = await import(pathToFileURL(configPath).href);
const payload = await getPayload({ config: loaded.default });
const collections = payload.config.collections.map((collection) => collection.slug);
console.log(JSON.stringify({ ok: true, collections }));
await payload.destroy();
process.exit(0);
