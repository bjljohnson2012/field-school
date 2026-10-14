import type { CollectionConfig, Field } from "payload";

import { operatorOnly } from "./access.ts";
import { recordTraits, stripProfileHtml } from "./hooks/traits.ts";

const status = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
] as const;

function table(prefix: string, slug: string): string {
  return `${prefix}${slug.replace(/-/g, "_")}`;
}

function locked(prefix: string): Pick<CollectionConfig, "access"> & { dbName: string } {
  return {
    dbName: "",
    access: {
      read: operatorOnly,
      create: operatorOnly,
      update: operatorOnly,
      delete: operatorOnly,
    },
  };
}

export function buildCollections(prefix: string): CollectionConfig[] {
  const orgRel: Field = {
    name: "org",
    type: "relationship",
    relationTo: "organizations",
    required: true,
    admin: { description: "Drizzle column org_id. Copied org, not the live campus row." },
  };

  const organizations: CollectionConfig = {
    slug: "organizations",
    dbName: table(prefix, "organizations"),
    labels: { singular: "Organization", plural: "Organizations" },
    admin: { useAsTitle: "name", group: "Content" },
    access: locked(prefix).access,
    fields: [
      { name: "slug", type: "text", required: true },
      { name: "name", type: "text", required: true },
      {
        name: "kind",
        type: "select",
        required: true,
        options: ["family", "team", "gym", "company"],
      },
      {
        name: "room",
        type: "select",
        required: true,
        options: [
          { label: "Household", value: "household" },
          { label: "Team", value: "team" },
        ],
        admin: { description: "Desk room. Household and team stay separate." },
      },
    ],
  };

  const courses: CollectionConfig = {
    slug: "courses",
    dbName: table(prefix, "courses"),
    labels: { singular: "Course", plural: "Courses" },
    admin: { useAsTitle: "title", group: "Content" },
    access: locked(prefix).access,
    fields: [
      orgRel,
      { name: "slug", type: "text", required: true },
      { name: "title", type: "text", required: true },
      { name: "_status", type: "select", required: true, options: [...status] },
      { name: "example", type: "checkbox" },
    ],
  };

  const modules: CollectionConfig = {
    slug: "modules",
    dbName: table(prefix, "modules"),
    labels: { singular: "Module", plural: "Modules" },
    admin: { useAsTitle: "title", group: "Content" },
    access: locked(prefix).access,
    fields: [
      orgRel,
      { name: "course", type: "relationship", relationTo: "courses", required: true },
      { name: "slug", type: "text", required: true },
      { name: "title", type: "text", required: true },
      { name: "order", type: "number", required: true },
      { name: "_status", type: "select", required: true, options: [...status] },
    ],
  };

  const lessons: CollectionConfig = {
    slug: "lessons",
    dbName: table(prefix, "lessons"),
    labels: { singular: "Lesson", plural: "Lessons" },
    admin: { useAsTitle: "title", group: "Content" },
    access: locked(prefix).access,
    fields: [
      orgRel,
      { name: "course", type: "relationship", relationTo: "courses", required: true },
      { name: "module", type: "relationship", relationTo: "modules", required: true },
      { name: "slug", type: "text", required: true },
      { name: "title", type: "text", required: true },
      { name: "order", type: "number", required: true },
      { name: "_status", type: "select", required: true, options: [...status] },
      {
        name: "blocks",
        type: "json",
        required: true,
        admin: {
          description:
            "Drizzle jsonb union keyed by kind. Payload blocks would rename kind to blockType, so this spike keeps json.",
        },
      },
      { name: "outcomeIds", type: "json", required: true },
    ],
  };

  const practice: CollectionConfig = {
    slug: "practice",
    dbName: table(prefix, "practice"),
    labels: { singular: "Practice", plural: "Practice" },
    admin: { group: "Content" },
    access: locked(prefix).access,
    fields: [
      orgRel,
      { name: "lesson", type: "relationship", relationTo: "lessons", required: true },
      {
        name: "kind",
        type: "select",
        required: true,
        options: ["watch", "practice", "check", "exam"],
      },
      { name: "order", type: "number", required: true },
      { name: "blockIndex", type: "number", required: true },
    ],
  };

  const courseVersions: CollectionConfig = {
    slug: "course-versions",
    dbName: table(prefix, "course_versions"),
    labels: { singular: "Course version", plural: "Course versions" },
    admin: { group: "Content" },
    access: locked(prefix).access,
    fields: [
      orgRel,
      { name: "parent", type: "relationship", relationTo: "courses", required: true },
      { name: "version", type: "number", required: true },
      { name: "snapshot", type: "json", required: true },
    ],
  };

  const lessonVersions: CollectionConfig = {
    slug: "lesson-versions",
    dbName: table(prefix, "lesson_versions"),
    labels: { singular: "Lesson version", plural: "Lesson versions" },
    admin: { group: "Content" },
    access: locked(prefix).access,
    fields: [
      orgRel,
      { name: "parent", type: "relationship", relationTo: "lessons", required: true },
      { name: "version", type: "number", required: true },
      { name: "snapshot", type: "json", required: true },
    ],
  };

  const growthUnits: CollectionConfig = {
    slug: "growth-units",
    dbName: table(prefix, "growth_units"),
    labels: { singular: "Growth unit", plural: "Growth units" },
    admin: { useAsTitle: "title", group: "Gap loop" },
    access: locked(prefix).access,
    fields: [
      orgRel,
      { name: "kind", type: "select", required: true, options: ["family", "team", "child"] },
      { name: "title", type: "text", required: true },
      { name: "ownerMembershipId", type: "text", required: true },
      { name: "childMembershipId", type: "text" },
    ],
  };

  const knowledgeNodes: CollectionConfig = {
    slug: "knowledge-nodes",
    dbName: table(prefix, "knowledge_nodes"),
    labels: { singular: "Knowledge node", plural: "Knowledge nodes" },
    admin: { useAsTitle: "label", group: "Gap loop" },
    access: locked(prefix).access,
    fields: [
      orgRel,
      { name: "growthUnit", type: "relationship", relationTo: "growth-units", required: true },
      {
        name: "ownerKind",
        type: "select",
        required: true,
        options: ["person", "child", "family", "team", "org"],
      },
      { name: "ownerMembershipId", type: "text", required: true },
      { name: "childMembershipId", type: "text" },
      {
        name: "kind",
        type: "select",
        required: true,
        options: [
          "goal",
          "requirement",
          "concept",
          "cluster",
          "evidence",
          "lesson",
          "brain_page",
          "reflection",
          "skill",
          "project",
        ],
      },
      { name: "label", type: "text", required: true },
      { name: "body", type: "textarea" },
      { name: "sha256", type: "text" },
      { name: "filename", type: "text" },
      { name: "refTable", type: "text" },
      { name: "refId", type: "text" },
      { name: "evidence", type: "json", required: true },
      { name: "status", type: "select", required: true, options: ["active", "rejected"] },
    ],
  };

  const knowledgeEdges: CollectionConfig = {
    slug: "knowledge-edges",
    dbName: table(prefix, "knowledge_edges"),
    labels: { singular: "Knowledge edge", plural: "Knowledge edges" },
    admin: {
      group: "Gap loop",
      description: "No edge scope column. Scope is the shared owner fields, copied from the endpoints.",
    },
    access: locked(prefix).access,
    hooks: {
      beforeChange: [
        async ({ data, req }) => {
          if (!data) return data;
          const fromId = typeof data.fromNode === "string" ? data.fromNode : "";
          const toId = typeof data.toNode === "string" ? data.toNode : "";
          if (!fromId || !toId) return data;
          const from = await req.payload.findByID({
            collection: "knowledge-nodes",
            id: fromId,
            depth: 0,
            req,
            overrideAccess: true,
          });
          const to = await req.payload.findByID({
            collection: "knowledge-nodes",
            id: toId,
            depth: 0,
            req,
            overrideAccess: true,
          });
          const keys = ["org", "growthUnit", "ownerKind", "ownerMembershipId", "childMembershipId"] as const;
          for (const key of keys) {
            const left = from[key] ?? null;
            const right = to[key] ?? null;
            if (left !== right) throw new Error("edge_scope_mismatch");
          }
          data.org = from.org;
          data.growthUnit = from.growthUnit;
          data.ownerKind = from.ownerKind;
          data.ownerMembershipId = from.ownerMembershipId;
          data.childMembershipId = from.childMembershipId ?? null;
          return data;
        },
      ],
    },
    fields: [
      orgRel,
      { name: "growthUnit", type: "relationship", relationTo: "growth-units", required: true },
      {
        name: "ownerKind",
        type: "select",
        required: true,
        options: ["person", "child", "family", "team", "org"],
      },
      { name: "ownerMembershipId", type: "text", required: true },
      { name: "childMembershipId", type: "text" },
      { name: "fromNode", type: "relationship", relationTo: "knowledge-nodes", required: true },
      { name: "toNode", type: "relationship", relationTo: "knowledge-nodes", required: true },
      {
        name: "rel",
        type: "select",
        required: true,
        options: ["supports", "requires", "part_of", "contradicts"],
      },
      { name: "because", type: "textarea", required: true },
      { name: "evidence", type: "json", required: true },
      { name: "weight", type: "number", required: true },
      {
        name: "status",
        type: "select",
        required: true,
        options: ["proposed", "accepted", "rejected"],
      },
      {
        name: "origin",
        type: "select",
        required: true,
        options: ["system", "derived", "user", "ai"],
      },
    ],
  };

  const families: CollectionConfig = {
    slug: "families",
    dbName: table(prefix, "families"),
    labels: { singular: "Family", plural: "Families" },
    admin: {
      useAsTitle: "name",
      group: "Evolution",
      description: "The home this person belongs to.",
    },
    access: locked(prefix).access,
    fields: [
      { name: "name", type: "text", required: true },
      {
        name: "room",
        type: "select",
        required: true,
        options: [
          { label: "Household", value: "household" },
          { label: "Team", value: "team" },
        ],
      },
    ],
  };

  const profiles: CollectionConfig = {
    slug: "profiles",
    dbName: table(prefix, "profiles"),
    labels: { singular: "Profile", plural: "Profiles" },
    admin: {
      useAsTitle: "note",
      group: "Evolution",
      description: "Traits of one person. Login learner or tracked child. Not a student account.",
    },
    access: locked(prefix).access,
    hooks: {
      beforeChange: [stripProfileHtml],
      afterChange: [recordTraits],
    },
    fields: [
      { name: "family", type: "relationship", relationTo: "families" },
      { name: "orgName", type: "text" },
      {
        name: "subjectKind",
        type: "select",
        required: true,
        options: [
          { label: "Login learner", value: "login-learner" },
          { label: "Tracked child", value: "tracked-child" },
        ],
      },
      { name: "note", type: "textarea" },
      {
        name: "dropKind",
        type: "select",
        options: ["text", "file", "audio"],
      },
      { name: "fileName", type: "text" },
    ],
  };

  const milestones: CollectionConfig = {
    slug: "milestones",
    dbName: table(prefix, "milestones"),
    labels: { singular: "Milestone", plural: "Milestones" },
    admin: {
      useAsTitle: "next",
      group: "Evolution",
      description: "The next thing they can do.",
    },
    access: locked(prefix).access,
    fields: [
      { name: "profile", type: "relationship", relationTo: "profiles" },
      { name: "next", type: "text", required: true },
    ],
  };

  const mediaFiles: CollectionConfig = {
    slug: "media-files",
    dbName: table(prefix, "media_files"),
    labels: { singular: "Media", plural: "Media" },
    admin: {
      group: "Evolution",
      description: "Files, audio, and documents. Slug is media-files so it does not collide with public.media.",
    },
    access: locked(prefix).access,
    fields: [
      { name: "profile", type: "relationship", relationTo: "profiles" },
      { name: "file", type: "text", required: true },
    ],
  };

  const traitDryRuns: CollectionConfig = {
    slug: "trait-dry-runs",
    dbName: table(prefix, "trait_dry_runs"),
    labels: { singular: "Trait dry run", plural: "Trait dry runs" },
    admin: {
      group: "Evolution",
      description: "Hook output only. Does not write the sealed adult profile store.",
    },
    access: locked(prefix).access,
    fields: [
      { name: "profileId", type: "text", required: true },
      {
        name: "subjectKind",
        type: "select",
        required: true,
        options: [
          { label: "Login learner", value: "login-learner" },
          { label: "Tracked child", value: "tracked-child" },
        ],
      },
      { name: "traits", type: "json", required: true },
    ],
  };

  return [
    organizations,
    courses,
    modules,
    lessons,
    practice,
    courseVersions,
    lessonVersions,
    growthUnits,
    knowledgeNodes,
    knowledgeEdges,
    families,
    profiles,
    milestones,
    mediaFiles,
    traitDryRuns,
  ];
}
