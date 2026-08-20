import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { deskToMarkdown } from "@/lib/course/desk-md";
import { loadDesk, saveDesk } from "@/lib/course/progress";
import { usePublishedCourse } from "@/lib/course/use-course";
import { useCourseProgress } from "@/lib/course/use-progress";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { StaffDesk } from "@/lib/course/types";

export const Route = createFileRoute("/c/$courseSlug/desk")({
  component: DeskPage,
});

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

function DeskPage() {
  const { courseSlug } = Route.useParams();
  const course = usePublishedCourse(courseSlug);
  const { passedCount, total } = useCourseProgress(course ?? null);
  const { user, isPending } = useCurrentUserState();
  const [desk, setDesk] = useState<StaffDesk>(blankDesk);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const md = useMemo(() => deskToMarkdown(desk), [desk]);

  useEffect(() => {
    if (isPending || !user || !course) return;
    loadDesk({ data: { courseSlug: course.slug } })
      .then((d) => {
        if (d)
          setDesk({
            ...blankDesk(),
            ...d,
            bots: d.bots?.length ? d.bots : blankDesk().bots,
            routines: d.routines?.length ? d.routines : blankDesk().routines,
          });
      })
      .catch(() => {
        /* local only */
      });
  }, [user, isPending, course]);

  function updateBot(i: number, patch: Partial<StaffDesk["bots"][number]>) {
    setDesk((d) => ({
      ...d,
      bots: d.bots.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));
    setSaved(false);
  }

  function togglePlugin(i: number, plugin: string) {
    setDesk((d) => ({
      ...d,
      bots: d.bots.map((b, idx) => {
        if (idx !== i) return b;
        const has = b.plugins.includes(plugin);
        return {
          ...b,
          plugins: has ? b.plugins.filter((p) => p !== plugin) : [...b.plugins, plugin],
        };
      }),
    }));
    setSaved(false);
  }

  async function copyMd() {
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function persist() {
    if (!course) return;
    if (!user) {
      setSaved(true);
      return;
    }
    await saveDesk({ data: { courseSlug: course.slug, data: desk } });
    setSaved(true);
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader course={course ?? undefined} passed={passedCount} total={total} />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Share-desk skill
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Your staff, as a brief
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Portable operating desk for this course. Paste into Notion, a gist, or
          a bot’s first message. One job per bot. Humans keep send / pay /
          approve.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <form
            className="space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              void persist();
            }}
          >
            <fieldset className="space-y-3">
              <label className="block text-xs uppercase tracking-[0.16em] text-muted">
                Operator
                <input
                  className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
                  value={desk.operator}
                  onChange={(e) => {
                    setDesk((d) => ({ ...d, operator: e.target.value }));
                    setSaved(false);
                  }}
                  placeholder="Your name"
                />
              </label>
              <label className="block text-xs uppercase tracking-[0.16em] text-muted">
                Business / context
                <input
                  className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
                  value={desk.business}
                  onChange={(e) => {
                    setDesk((d) => ({ ...d, business: e.target.value }));
                    setSaved(false);
                  }}
                  placeholder="Events studio, solo founder, ops team…"
                />
              </label>
            </fieldset>

            {desk.bots.map((bot, i) => (
              <fieldset
                key={i}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <legend className="px-1 text-xs uppercase tracking-[0.16em] text-muted">
                  Bot {i + 1}
                </legend>
                <input
                  className="mt-2 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
                  placeholder="Name (coworker, not Assistant)"
                  value={bot.name}
                  onChange={(e) => updateBot(i, { name: e.target.value })}
                />
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
                  placeholder="One job. What done looks like. What they never do."
                  value={bot.job}
                  onChange={(e) => updateBot(i, { job: e.target.value })}
                />
                <input
                  className="mt-2 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
                  placeholder="Voice"
                  value={bot.voice}
                  onChange={(e) => updateBot(i, { voice: e.target.value })}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {PLUGIN_OPTIONS.map((p) => {
                    const on = bot.plugins.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => togglePlugin(i, p)}
                        className={
                          on
                            ? "h-9 rounded-sm bg-accent px-3 text-xs font-medium text-accent-fg"
                            : "h-9 rounded-sm border border-border px-3 text-xs text-muted"
                        }
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            {desk.routines.map((r, i) => (
              <fieldset
                key={`r-${i}`}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <legend className="px-1 text-xs uppercase tracking-[0.16em] text-muted">
                  Routine {i + 1}
                </legend>
                <input
                  className="mt-2 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
                  placeholder="Name"
                  value={r.name}
                  onChange={(e) => {
                    setDesk((d) => ({
                      ...d,
                      routines: d.routines.map((x, idx) =>
                        idx === i ? { ...x, name: e.target.value } : x,
                      ),
                    }));
                    setSaved(false);
                  }}
                />
                <input
                  className="mt-2 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
                  placeholder="When"
                  value={r.when}
                  onChange={(e) => {
                    setDesk((d) => ({
                      ...d,
                      routines: d.routines.map((x, idx) =>
                        idx === i ? { ...x, when: e.target.value } : x,
                      ),
                    }));
                    setSaved(false);
                  }}
                />
                <textarea
                  className="mt-2 min-h-20 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
                  placeholder="Does / done / nag message"
                  value={r.does}
                  onChange={(e) => {
                    setDesk((d) => ({
                      ...d,
                      routines: d.routines.map((x, idx) =>
                        idx === i ? { ...x, does: e.target.value } : x,
                      ),
                    }));
                    setSaved(false);
                  }}
                />
              </fieldset>
            ))}

            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Overnight potato brief
              </span>
              <textarea
                className="mt-2 min-h-32 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                placeholder="I'm going to bed. Follow this desk. Quality bar."
                value={desk.overnightBrief}
                onChange={(e) => {
                  setDesk((d) => ({ ...d, overnightBrief: e.target.value }));
                  setSaved(false);
                }}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">{saved ? "Saved" : "Save desk"}</Button>
              <Button type="button" variant="secondary" onClick={() => void copyMd()}>
                {copied ? "Copied" : "Copy markdown"}
              </Button>
            </div>
          </form>

          <aside>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Preview</p>
            <pre className="mt-3 max-h-[70vh] overflow-auto rounded-xl border border-border bg-raised p-4 font-mono text-xs leading-relaxed text-fg whitespace-pre-wrap">
              {md}
            </pre>
          </aside>
        </div>
      </main>
    </div>
  );
}
