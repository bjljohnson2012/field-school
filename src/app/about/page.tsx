import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_NAME, UNI_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "Field School helps normal people upskill for the future with AI, self-paced learning, and consistent tracking.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        About us
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        {COMPANY_NAME} is the company. {UNI_NAME} is the portal.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        Most people do not need another feed of videos. They need a way to get
        better at the work that is arriving — without quitting their job, buying
        every tool on day one, or losing the plot by Sunday. That is what we
        build.
      </p>

      <section className="mt-12 space-y-10">
        <Block
          kicker="01"
          title="AI as a teammate, not a tab"
          body="We teach people to hire and direct AI the way they would a staff. Clear jobs. Real tools. A human still on send and pay. The point is not a smarter chatbot. The point is a week that still moves when you close the laptop."
        />
        <Block
          kicker="02"
          title="Self-paced, bottom-up"
          body="Every course is a ladder: watch the minutes that teach the station, do the field work even if you do not have the paid seat yet, clear the quiz. You move when you are ready. Nobody is graded for scrolling."
        />
        <Block
          kicker="03"
          title="Consistent tracking"
          body="Progress, Field School University certificates, and assessment tools live on one portal. Skill and intelligence assessments you take today stay next to the courses you walk tomorrow. Checklists for tools and personality will plug into the same shelf."
        />
      </section>

      <section className="mt-14 rounded-xl border border-border bg-card px-5 py-6">
        <h2 className="font-display text-2xl tracking-tight">Who it is for</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Operators, coordinators, founders, and anyone who already texts a
          colleague the same three jobs every week. You do not need a computer
          science degree. You need a named outcome, a login map, and a place
          that remembers what you finished.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/c/grok-bot"
            className="inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Walk a course
          </Link>
          <Link
            href="/tools"
            className="inline-flex h-12 items-center rounded-xl border border-border px-5 text-sm"
          >
            Open the tools
          </Link>
        </div>
      </section>
    </main>
  );
}

function Block({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <article>
      <p className="font-mono text-xs text-muted-foreground">{kicker}</p>
      <h2 className="mt-2 font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}
