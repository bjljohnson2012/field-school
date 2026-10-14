import type { CollectionBeforeChangeHook, CollectionAfterChangeHook } from "payload";

import { traitsFromDrop, type Trait } from "../../../../app/src/lib/evolution/collections.ts";

const HTML_TAG = /<\/?[a-z][^>]*>/i;

export const stripProfileHtml: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data;
  if (typeof data.note === "string" && HTML_TAG.test(data.note)) data.note = "";
  if (typeof data.fileName === "string" && HTML_TAG.test(data.fileName)) data.fileName = "";
  return data;
};

export const recordTraits: CollectionAfterChangeHook = async ({ doc, req, context }) => {
  if (context.skipTraitDryRun) return doc;
  const traits: Trait[] = traitsFromDrop({
    text: typeof doc.note === "string" ? doc.note : "",
    filename: typeof doc.fileName === "string" ? doc.fileName : "",
    kind: typeof doc.dropKind === "string" ? doc.dropKind : "text",
    orgName: typeof doc.orgName === "string" ? doc.orgName : "",
  });
  await req.payload.create({
    collection: "trait-dry-runs",
    req,
    overrideAccess: true,
    context: { skipTraitDryRun: true },
    data: {
      profileId: String(doc.id),
      subjectKind: doc.subjectKind === "tracked-child" ? "tracked-child" : "login-learner",
      traits,
    },
  });
  return doc;
};
