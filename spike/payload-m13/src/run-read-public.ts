import { pathToFileURL } from "url";
import { getPayload } from "payload";

const loaded = await import(pathToFileURL("src/payload.public-push.config.ts").href);
const payload = await getPayload({ config: loaded.default });
try {
  const found = await payload.find({ collection: "courses", limit: 1 });
  console.log(JSON.stringify({ ok: true, total: found.totalDocs }));
} catch (error) {
  const message = error instanceof Error ? error.message : "read failed";
  console.log(JSON.stringify({ ok: false, message: message.split("\n")[0] }));
}
await payload.destroy();
process.exit(0);
