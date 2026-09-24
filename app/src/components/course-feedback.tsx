"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getCourse } from "@/lib/course/catalog";
import { submitCourseNote } from "@/lib/portal";

export function CourseFeedback({
  courseSlug,
  defaultStation,
}: {
  courseSlug: string;
  defaultStation?: string;
}) {
  const course = getCourse(courseSlug);
  const [kind, setKind] = useState<"feedback" | "message">("feedback");
  const [stationSlug, setStationSlug] = useState(defaultStation ?? "");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section id="feedback" className="rounded-card border border-border bg-card px-5 py-6 shadow-card">
      <p className="eyebrow">Student note</p>
      <h2 className="h-section mt-2">
        Send feedback to staff
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This lands on Admin → Inbox. Use it when a clip is too long, a
        station is stuck, or you want a human reply.
      </p>
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const item = submitCourseNote({
            courseSlug,
            stationSlug: stationSlug || undefined,
            kind,
            body,
          });
          if (item) {
            setBody("");
            setSent(true);
          }
        }}
      >
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["feedback", "Course feedback"],
              ["message", "Message staff"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={`rounded-brand border px-3 py-2 text-sm font-semibold ${
                kind === value
                  ? "border-primary bg-primary/10"
                  : "border-border text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {course ? (
          <label className="block text-sm">
            <span className="eyebrow mb-2">Station (optional)</span>
            <select
              value={stationSlug}
              onChange={(e) => setStationSlug(e.target.value)}
              className="w-full rounded-brand border border-input bg-card px-4 py-2.5 text-sm shadow-sm"
            >
              <option value="">Whole course</option>
              {course.modules.map((m) => (
                <option key={m.slug} value={m.slug}>
                  Station {m.station} · {m.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Textarea
          value={body}
          onChange={(e) => {
            setSent(false);
            setBody(e.target.value);
          }}
          rows={5}
          required
          placeholder="What should staff know?"
        />
        <Button type="submit" variant="outline" disabled={!body.trim()}>
          Submit to staff
        </Button>
        {sent ? (
          <p className="text-sm text-pass">
            Sent. Staff will see it under Admin → Inbox.
          </p>
        ) : null}
      </form>
    </section>
  );
}
