import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { COMPANY_NAME, UNI_NAME } from "@/lib/course/types";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: `About · ${COMPANY_NAME}` },
      {
        name: "description",
        content:
          "Field School helps normal people upskill for the future with AI, self-paced learning, and consistent tracking.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              About us
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              {COMPANY_NAME} exists so ordinary people can upskill for what comes
              next.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted sm:text-lg">
              Work is changing faster than most training programs can follow.
              {COMPANY_NAME} builds practical paths — not lectures about the
              future, but ladders you can climb this week.{" "}
              {UNI_NAME} is the portal: courses, certificates, and tools that
              stay with you.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
            <Pillar
              title="AI as a teammate"
              body="We teach people to hire and direct AI the way they would a staff — clear jobs, real tools, and a human still on send, pay, and approve."
            />
            <Pillar
              title="Self-paced learning"
              body="Every course is a bottom-up ladder: watch the clip, do the field work, clear the quiz. Move when you are ready, not when a cohort calendar says so."
            />
            <Pillar
              title="Consistent tracking"
              body="Progress, desks, certificates, and assessment tools live on your portal. You can see what you finished, what is open, and what to practice next."
            />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="font-display text-3xl tracking-tight">
            Company and campus
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            <strong className="font-medium text-fg">{COMPANY_NAME}</strong> is
            the company.{" "}
            <strong className="font-medium text-fg">{UNI_NAME}</strong> is the
            course portal — the place where people train, measure themselves, and
            keep a record of what they can do.
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            Long term, the portal will host intelligence and skill assessments,
            personality checklists, and tool inventories alongside courses. Same
            account. Same progress surface. Built so normal people can keep
            leveling up without waiting for a degree redesign.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex h-12 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-fg"
            >
              Open the catalog
            </Link>
            <Link
              to="/tools"
              className="inline-flex h-12 items-center rounded-md border border-border px-5 text-sm"
            >
              Browse tools
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <article>
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </article>
  );
}
