import type { Block, ReflectionBlock } from "../collections/content-model.ts";
import type { Citation } from "./backfill.ts";
import type { NodeKind } from "./kinds.ts";

export type LessonNodeDraft = {
  key: string;
  kind: NodeKind;
  label: string;
  body: string;
  refTable: string;
  refId: string;
  evidence: Citation[];
};

export type LessonEdgeDraft = {
  fromKey: string;
  toKey: string;
  rel: "part_of" | "supports";
  origin: "derived";
  because: string;
  evidence: Citation[];
};

type LessonInput = { id: string; title: string; blocks: readonly Block[] };

function cite(table: string, id: string, label: string): Citation[] {
  return [{ table, id, label: label || table }];
}

/** Reflection to reflection. Quiz and assignment to evidence. Prose to concept on the lesson. */
export function nodeKindForBlock(kind: Block["kind"]): NodeKind | null {
  if (kind === "reflection") return "reflection";
  if (kind === "quiz" || kind === "assignment") return "evidence";
  if (kind === "text" || kind === "bullets" || kind === "quote" || kind === "clip") return "concept";
  if (kind === "station") return "requirement";
  if (kind === "course") return "cluster";
  return null;
}

function blockLabel(block: Block, lessonTitle: string) {
  if (block.kind === "reflection") return block.prompt || lessonTitle;
  if (block.kind === "text") return block.text.slice(0, 80) || lessonTitle;
  if (block.kind === "bullets") return block.items[0] || lessonTitle;
  if (block.kind === "quote") return block.text.slice(0, 80) || lessonTitle;
  if (block.kind === "clip") return block.label || lessonTitle;
  if (block.kind === "assignment") return block.title || lessonTitle;
  if (block.kind === "quiz") return block.questions[0]?.prompt || lessonTitle;
  if (block.kind === "station") return block.station || lessonTitle;
  return block.tagline || lessonTitle;
}

function blockBody(block: Block) {
  if (block.kind === "reflection") return block.response || "";
  if (block.kind === "text") return block.text;
  if (block.kind === "quote") return block.text;
  if (block.kind === "assignment") return block.brief;
  if (block.kind === "station") return block.summary;
  if (block.kind === "course") return block.tagline;
  return "";
}

export function nodesForLesson(lesson: LessonInput): { nodes: LessonNodeDraft[]; edges: LessonEdgeDraft[] } {
  const lessonKey = `lesson:${lesson.id}`;
  const label = lesson.title || "Lesson";
  const nodes: LessonNodeDraft[] = [
    {
      key: lessonKey,
      kind: "lesson",
      label,
      body: "",
      refTable: "lessons",
      refId: lesson.id,
      evidence: cite("lessons", lesson.id, label),
    },
  ];
  const edges: LessonEdgeDraft[] = [];
  lesson.blocks.forEach((block, index) => {
    const kind = nodeKindForBlock(block.kind);
    if (!kind) return;
    const refId = `${lesson.id}:${index}`;
    const blockLabelText = blockLabel(block, label);
    const key = `${kind}:${refId}`;
    nodes.push({
      key,
      kind,
      label: blockLabelText,
      body: blockBody(block),
      refTable: "lesson_blocks",
      refId,
      evidence: cite("lesson_blocks", refId, blockLabelText),
    });
    edges.push({
      fromKey: key,
      toKey: lessonKey,
      rel: kind === "evidence" ? "supports" : "part_of",
      origin: "derived",
      because: kind === "concept" ? "This concept sits on the lesson." : "This block belongs to the lesson.",
      evidence: cite("lesson_blocks", refId, blockLabelText),
    });
  });
  return { nodes, edges };
}

export function isReflectionBlock(block: Block): block is ReflectionBlock {
  return block.kind === "reflection";
}

/** A submitted reflection updates the reflection node for that block. */
export function reflectionSubmission(lessonId: string, index: number, block: ReflectionBlock): LessonNodeDraft {
  const refId = `${lessonId}:${index}`;
  const label = block.prompt;
  return {
    key: `reflection:${refId}`,
    kind: "reflection",
    label,
    body: block.response || "",
    refTable: "lesson_blocks",
    refId,
    evidence: cite("lesson_blocks", refId, label),
  };
}
