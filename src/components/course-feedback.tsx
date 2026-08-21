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
    <section id="feedback" className="rounded-xl border border-border bg-card px-5 py-6">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Student note
      </p>
      <h2 className="mt-1 font-display text-2xl tracking-tight">
        Send feedback to staff
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This lands on Admin → Notifications. Use it when a clip is too long, a
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
              className={`h-10 rounded-xl border px-3 text-sm ${
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
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Station (optional)
            </span>
            <select
              value={stationSlug}
              onChange={(e) => setStationSlug(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3"
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
          className="rounded-xl"
        />
        <Button className="h-11 rounded-xl px-5" type="submit" disabled={!body.trim()}>
          Submit to staff
        </Button>
        {sent ? (
          <p className="text-sm text-pass">
            Sent. Staff will see it under Admin → Notifications.
          </p>
        ) : null}
      </form>
    </section>
  );
}
