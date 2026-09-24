"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShareLink } from "@/components/share-link";
import { useCoursePortal } from "@/hooks/use-portal";
import { getCourse } from "@/lib/course/catalog";
import { deskToMarkdown } from "@/lib/course/desk-md";
import type { StaffDesk } from "@/lib/course/types";
import { saveDesk } from "@/lib/portal";

const PLUGIN_OPTIONS = [
  "Gmail",
  "Calendar",
  "Slack",
  "Notion",
  "Luma",
  "Vercel",
  "GitHub",
  "Linear",
  "Withings / health MCP",
  "Custom MCP",
];

const emptyBot = () => ({ name: "", job: "", plugins: [] as string[], voice: "" });
const emptyRoutine = () => ({ name: "", when: "", does: "" });
const blankDesk = (): StaffDesk => ({
  operator: "",
  business: "",
  bots: [emptyBot(), emptyBot(), emptyBot()],
  routines: [emptyRoutine(), emptyRoutine()],
  overnightBrief: "",
});

export default function DeskPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const course = getCourse(courseSlug);
  const { course: state, session } = useCoursePortal(courseSlug);
  const [desk, setDesk] = useState<StaffDesk | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const current: StaffDesk = desk ?? {
    ...blankDesk(),
    ...(state?.desk ?? {}),
    operator:
      state?.desk?.operator ||
      (session?.name && session.name !== "Guest" ? session.name : ""),
    bots: state?.desk?.bots?.length ? state.desk.bots : blankDesk().bots,
    routines: state?.desk?.routines?.length
      ? state.desk.routines
      : blankDesk().routines,
  };
  const md = deskToMarkdown(current);

  if (!course) {
    return (
      <main className="mx-auto max-w-xl px-6 py-8">
        <p className="text-muted-foreground">Course not found.</p>
      </main>
    );
  }

  function updateBot(i: number, patch: Partial<StaffDesk["bots"][number]>) {
    setDesk({
      ...current,
      bots: current.bots.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    });
    setSaved(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Share desk</p>
        <h1 className="h-page mt-2">Build a brief you can send</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Same campus chrome as the rest of the training portal. When you
          are ready, copy the markdown or share the public template at{" "}
          <span className="text-foreground">/share/desk</span>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ShareLink path="/share/desk" label="Copy /share/desk" />
        </div>
      </div>

      <label className="block">
        <span className="eyebrow mb-2">Operator</span>
        <Input
          value={current.operator}
          onChange={(e) => {
            setDesk({ ...current, operator: e.target.value });
            setSaved(false);
          }}
        />
      </label>
      <label className="block">
        <span className="eyebrow mb-2">Business / context</span>
        <Input
          value={current.business}
          onChange={(e) => {
            setDesk({ ...current, business: e.target.value });
            setSaved(false);
          }}
        />
      </label>

      {current.bots.map((bot, i) => (
        <section key={i} className="rounded-card border border-border bg-card px-5 py-5 shadow-card">
          <h2 className="h-section">Seat {i + 1}</h2>
          <div className="mt-4 grid gap-3">
            <Input
              placeholder="Name"
              value={bot.name}
              onChange={(e) => updateBot(i, { name: e.target.value })}
            />
            <Input
              placeholder="One job"
              value={bot.job}
              onChange={(e) => updateBot(i, { job: e.target.value })}
            />
            <Input
              placeholder="Voice"
              value={bot.voice}
              onChange={(e) => updateBot(i, { voice: e.target.value })}
            />
            <div className="flex flex-wrap gap-2">
              {PLUGIN_OPTIONS.map((plugin) => {
                const on = bot.plugins.includes(plugin);
                return (
                  <button
                    key={plugin}
                    type="button"
                    onClick={() =>
                      updateBot(i, {
                        plugins: on
                          ? bot.plugins.filter((p) => p !== plugin)
                          : [...bot.plugins, plugin],
                      })
                    }
                    className={`rounded-brand border px-3 py-1 text-xs font-semibold transition-all duration-200 ease-brand ${
                      on
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {plugin}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {current.routines.map((routine, i) => (
        <section key={i} className="rounded-card border border-border bg-card px-5 py-5 shadow-card">
          <h2 className="h-section">Routine {i + 1}</h2>
          <div className="mt-4 grid gap-3">
            <Input
              placeholder="Name"
              value={routine.name}
              onChange={(e) => {
                setDesk({
                  ...current,
                  routines: current.routines.map((r, idx) =>
                    idx === i ? { ...r, name: e.target.value } : r,
                  ),
                });
                setSaved(false);
              }}
            />
            <Input
              placeholder="When"
              value={routine.when}
              onChange={(e) => {
                setDesk({
                  ...current,
                  routines: current.routines.map((r, idx) =>
                    idx === i ? { ...r, when: e.target.value } : r,
                  ),
                });
                setSaved(false);
              }}
            />
            <Input
              placeholder="Done looks like"
              value={routine.does}
              onChange={(e) => {
                setDesk({
                  ...current,
                  routines: current.routines.map((r, idx) =>
                    idx === i ? { ...r, does: e.target.value } : r,
                  ),
                });
                setSaved(false);
              }}
            />
          </div>
        </section>
      ))}

      <label className="block">
        <span className="eyebrow mb-2">Overnight brief</span>
        <Textarea
          value={current.overnightBrief}
          onChange={(e) => {
            setDesk({ ...current, overnightBrief: e.target.value });
            setSaved(false);
          }}
          rows={6}
          className="font-mono"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            saveDesk(course.slug, current);
            setSaved(true);
          }}
        >
          Save desk
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(md);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? "Markdown copied" : "Copy markdown"}
        </Button>
        {saved ? <span className="self-center text-sm text-pass">Saved</span> : null}
      </div>
      </div>
    </main>
  );
}
