import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { assertLocalSpikeUrl } from "./db.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Same database, separate schema, table name `courses` which already exists in public.
 * Payload marks schemaName experimental when another schema has the same table name.
 */
export default buildConfig({
  admin: { importMap: { baseDir: path.resolve(dirname) } },
  collections: [
    {
      slug: "courses",
      dbName: "courses",
      fields: [{ name: "title", type: "text" }],
    },
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "collide-local",
  typescript: { outputFile: path.resolve(dirname, "payload-types.collide.ts") },
  db: postgresAdapter({
    pool: {
      connectionString: assertLocalSpikeUrl(
        process.env.SPIKE_DATABASE_URL || "",
        "fs_payload_spike",
      ),
    },
    schemaName: "payload",
    idType: "uuid",
    push: true,
    disableCreateDatabase: true,
  }),
  sharp,
});
