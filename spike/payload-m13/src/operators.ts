import type { CollectionConfig } from "payload";

import { operatorOnly } from "./access.ts";

const prefix = process.env.SPIKE_TABLE_PREFIX ?? "m13_";

export const Operators: CollectionConfig = {
  slug: "operators",
  dbName: `${prefix}operators`,
  auth: true,
  admin: {
    useAsTitle: "email",
    group: "Operators",
    description: "Operator login for this spike. Not a learner, parent, or child account.",
  },
  access: {
    read: operatorOnly,
    create: operatorOnly,
    update: operatorOnly,
    delete: operatorOnly,
  },
  fields: [{ name: "name", type: "text" }],
};
