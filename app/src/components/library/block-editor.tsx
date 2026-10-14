"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useState } from "react";
import { parseBlocks } from "@/lib/collections/content-model";
import {
  NINE_BLOCK_SLOTS,
  nineBlockTemplate,
  publishLibraryLesson,
  readStoredLessons,
  rememberVersion,
  restoreVersion,
  setAssignmentSlot,
  setQuizSlot,
  setTextSlot,
  writeStoredLessons,
  type LessonVersion,
  type LibraryLesson,
} from "@/lib/library/m10";

function plainDocument(text: string): string {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (!safe) return "<p></p>";
  return safe
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");
}

function TextSlot({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: plainDocument(value),
    editorProps: { attributes: { class: "m10-editor", "data-editor": "tiptap", "aria-label": label } },
    onUpdate: ({ editor: current }) => {
      onChange(current.getText({ blockSeparator: "\n" }).replace(/\n+$/, ""));
    },
  });

  return (
    <div className="m10-slot" data-slot={label}>
      <p className="m10-slot-label">{label}</p>
      <EditorContent editor={editor} />
    </div>
  );
}

export function BlockEditor({ lessonId }: { lessonId: string }) {
  const fresh = useMemo(
    () => nineBlockTemplate({ orgId: "active", id: lessonId === "new" ? "lesson-draft" : lessonId, title: "Untitled lesson" }),
    [lessonId],
  );
  const [lesson, setLesson] = useState<LibraryLesson>(fresh);
  const [versions, setVersions] = useState<LessonVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLessons().find((item) => item.id === fresh.id);
    if (stored) setLesson(stored);
    setReady(true);
  }, [fresh.id]);

  function persist(next: LibraryLesson) {
    const parsed = parseBlocks(next.blocks);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setLesson({ ...next, blocks: parsed.blocks });
    const others = readStoredLessons().filter((item) => item.id !== next.id);
    writeStoredLessons([...others, { ...next, blocks: parsed.blocks }]);
  }

  function publish() {
    const result = publishLibraryLesson(lesson);
    if (!result.ok) {
      setError(result.error);
      setLesson(result.lesson);
      return;
    }
    setVersions((current) => rememberVersion(current, result.lesson));
    persist(result.lesson);
  }

  function restore(version: number) {
    const restored = restoreVersion(versions, version);
    if (!restored) return;
    persist(restored);
  }

  if (!ready) return <p className="m10-quiet-copy">Opening the lesson.</p>;

  return (
    <div data-block-editor="tiptap" data-storage="json">
      <label className="m10-slot-label" htmlFor="lesson-title">
        Title
      </label>
      <input
        id="lesson-title"
        className="m10-input"
        value={lesson.title}
        onChange={(event) => setLesson({ ...lesson, title: event.target.value })}
      />
      {NINE_BLOCK_SLOTS.map((slot, index) => {
        const block = lesson.blocks[index];
        if (!block) return null;
        if (block.kind === "text") {
          return (
            <TextSlot
              key={slot.id}
              label={slot.label}
              value={block.text}
              onChange={(text) => persist(setTextSlot(lesson, index, text))}
            />
          );
        }
        if (block.kind === "quiz") {
          const first = block.questions[0];
          return (
            <div key={slot.id} className="m10-slot" data-slot={slot.id}>
              <p className="m10-slot-label">{slot.label}</p>
              <input
                className="m10-input"
                aria-label={`${slot.label} prompt`}
                value={first?.prompt ?? ""}
                onChange={(event) =>
                  persist(
                    setQuizSlot(lesson, index, [
                      {
                        id: slot.id,
                        prompt: event.target.value,
                        choices: ["Yes", "No"],
                        answer: 0,
                        why: "Checked against the block.",
                        sourceUnitId: `unit-${slot.id}`,
                      },
                    ]),
                  )
                }
              />
            </div>
          );
        }
        if (block.kind !== "assignment") return null;
        return (
          <div key={slot.id} className="m10-slot" data-slot={slot.id}>
            <p className="m10-slot-label">{slot.label}</p>
            <input
              className="m10-input"
              aria-label={`${slot.label} title`}
              value={block.title}
              onChange={(event) =>
                persist(setAssignmentSlot(lesson, index, { title: event.target.value, brief: "Do the work.", item: "Write the step" }))
              }
            />
          </div>
        );
      })}
      <p className="m10-quiet-copy" data-status={lesson.status}>
        Status: {lesson.status}. Blocks stay JSON.
      </p>
      {error ? <p data-publish-error={error}>{error}</p> : null}
      <button type="button" className="m10-fill" onClick={publish}>
        Publish
      </button>
      {versions.length > 0 ? (
        <ul aria-label="Versions">
          {versions.map((version) => (
            <li key={version.version}>
              <button type="button" className="m10-quiet" onClick={() => restore(version.version)}>
                Restore version {version.version}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
