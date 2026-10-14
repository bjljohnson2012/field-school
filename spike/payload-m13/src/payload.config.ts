import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { buildCollections } from "./collections.ts";
import { assertLocalSpikeUrl } from "./db.ts";
import { Operators } from "./operators.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const prefix = process.env.SPIKE_TABLE_PREFIX ?? "m13_";
const schemaEnv = process.env.SPIKE_SCHEMA ?? "payload";
const schemaName = schemaEnv === "public" ? undefined : schemaEnv;
const push = process.env.SPIKE_PUSH !== "false";

export default buildConfig({
  admin: {
    user: Operators.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Operators, ...buildCollections(prefix)],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: assertLocalSpikeUrl(process.env.SPIKE_DATABASE_URL || ""),
    },
    ...(schemaName ? { schemaName } : {}),
    idType: "uuid",
    push,
    disableCreateDatabase: true,
    blocksAsJSON: true,
  }),
  sharp,
});
