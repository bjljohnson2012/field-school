import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { assertLocalSpikeUrl } from "./db.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** Push Payload onto public.courses on the clone only. Measures destructive DDL. */
export default buildConfig({
  admin: { importMap: { baseDir: path.resolve(dirname) } },
  collections: [
    {
      slug: "courses",
      dbName: "courses",
      fields: [{ name: "payloadProbe", type: "text" }],
    },
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "public-push-local",
  typescript: { outputFile: path.resolve(dirname, "payload-types.public.ts") },
  db: postgresAdapter({
    pool: {
      connectionString: assertLocalSpikeUrl(
        process.env.SPIKE_DATABASE_URL || "",
        "fs_payload_collide",
      ),
    },
    idType: "uuid",
    push: process.env.SPIKE_PUSH !== "false",
    disableCreateDatabase: true,
  }),
  sharp,
});
