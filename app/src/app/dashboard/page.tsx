"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { lessonForOrg } from "@/lib/campus-runtime/lessons";
import { COURSE_NAME, COURSE_TAGLINE } from "@/lib/course/content";
import { storedPortionForRoom } from "@/app/assign/next-portion";
import { learnHomeContext, type LivingBrain } from "@/lib/living-brain/model";

type NextStep = {
  href: string;
  title: string;
  portion?: boolean;
  login?: "none" | "member";
  from?: "outcomes" | "profile" | "stored";
};

type LearnHome = {
  org: string;
  orgLabel: string;
  course: string;
  about: string;
  willDo: string;
  aim: string;
  confidence: string;
  personId: string;
  nextHref: string;
  nextTitle: string;
};

function learnHomeFor(
  slug: string,
  orgName: string,
  next: NextStep | null,
  context: { aim: string; confidence: string; personId: string } | null,
): LearnHome {
  if (slug === "household") {
    const lesson = lessonForOrg("household");
    return {
      org: "household",
      orgLabel: orgName || "Household",
      course: lesson?.title || "Household welcome",
      about:
        lesson?.body ||
        "This is a household lesson. It is not the Grok Bot catalog. Watch is a text station. Progress stays in this org.",
      willDo:
        "A tracked child keeps a progress record in this org and does not sign in. The parent is the user. The next step stays here when the parent is away.",
      aim: context?.aim || "",
      confidence: context?.confidence || "",
      personId: context?.personId || "",
      nextHref: next?.href || "/o/household/welcome",
      nextTitle: next?.title || lesson?.title || "Household welcome",
    };
  }
  if (slug === "sales") {
    const lesson = lessonForOrg("sales");
    return {
      org: "sales",
      orgLabel: orgName || "Sales team",
      course: lesson?.title || "Welcome to the desk",
      about: "This is a sales-team lesson. Discovery, next step, hygiene.",
      willDo:
        "A login learner runs discovery and leaves a dated next step. The step stays on this desk when the leader is away.",
      aim: context?.aim || "",
      confidence: context?.confidence || "",
      personId: context?.personId || "",
      nextHref: next?.href || "/o/sales/welcome",
      nextTitle: next?.title || lesson?.title || "Welcome to the desk",
    };
  }
  return {
    org: slug || "grok-bot",
    orgLabel: orgName || "Field School",
    course: COURSE_NAME,
    about: COURSE_TAGLINE,
    willDo:
      "The learner takes the next open station and can direct a staff that keeps working when they step away.",
    aim: "",
    confidence: "",
    personId: "",
    nextHref: next?.href || "/c/grok-bot",
    nextTitle: next?.title || "Open the course",
  };
}

export default function LearnPage() {
  const { data: authSession, status } = useSession();
  const email = authSession?.user?.email || "";
  const signedIn = Boolean(email);
  const [orgSlug, setOrgSlug] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loadedFor, setLoadedFor] = useState("");
  const [nextStep, setNextStep] = useState<NextStep | null>(null);
  const [brainContext, setBrainContext] = useState({ aim: "", confidence: "", personId: "" });

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    void fetch("/api/me")
      .then((response) => response.json())
      .then(async (data) => {
        const slug = typeof data.activeOrg?.slug === "string" ? data.activeOrg.slug : "";
        const name = typeof data.activeOrg?.name === "string" ? data.activeOrg.name : "";
        const course = slug === "household" ? "home" : slug === "sales" ? "sales" : "grok-bot";
        let next: NextStep | null = null;
        if (slug === "household" || slug === "sales") {
          try {
            const deskResponse = await fetch("/assign/desk", { headers: { "x-fs-org": slug } });
            const desk = await deskResponse.json();
            const rows = Array.isArray(desk?.assignments) ? desk.assignments : [];
            const open = storedPortionForRoom(slug, rows);
            let brain: LivingBrain | null = null;
            try {
              const brainResponse = await fetch("/api/living-brain");
              if (brainResponse.ok) {
                const brainData = (await brainResponse.json()) as { brain?: LivingBrain };
                brain = brainData.brain || null;
              }
            } catch {
              brain = null;
            }
            const home = learnHomeContext({
              room: slug,
              brain,
              storedTitle: open?.nextUnit,
              membershipId: open?.membershipId,
            });
            if (home.nextStep && (home.login === "none" || home.login === "member")) {
              next = {
                href: "/teach-live",
                title: home.nextStep,
                portion: true,
                login: home.login,
                from: home.from || "stored",
              };
            }
            if (!cancelled) {
              setBrainContext({ aim: home.aim, confidence: home.confidence, personId: home.membershipId });
            }
          } catch {
            next = null;
          }
        }
        if (!next) {
          try {
            const nextResponse = await fetch(`/api/chooser?course=${course}`);
            const nextData = await nextResponse.json();
            if (nextData?.next?.href) {
              next = { href: nextData.next.href, title: nextData.next.title || "Next step" };
            }
          } catch {
            next = null;
          }
        }
        if (cancelled) return;
        setOrgSlug(slug);
        setOrgName(name);
        setNextStep(next);
        if (slug !== "household" && slug !== "sales") {
          setBrainContext({ aim: "", confidence: "", personId: "" });
        }
        setLoadedFor(email);
      })
      .catch(() => {
        if (!cancelled) setLoadedFor(email);
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  const waiting = status === "loading" || (signedIn && loadedFor !== email);
  const card = learnHomeFor(signedIn ? orgSlug : "", signedIn ? orgName : "", nextStep, signedIn ? brainContext : null);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {signedIn && loadedFor === email ? card.orgLabel : "Learn"}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Learn</h1>
      {!signedIn && !waiting ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Join free beta
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
          >
            Sign in
          </Link>
        </div>
      ) : null}

      {waiting ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading this org.</p>
      ) : (
        <section
          className="mt-8 max-w-2xl rounded-xl border border-border bg-card px-5 py-6"
          data-learn-org={card.org}
          data-sales-children={card.org === "sales" ? "0" : undefined}
          data-login={nextStep?.login}
        >
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Course</p>
          <h2 className="mt-1 font-display text-3xl tracking-tight">{card.course}</h2>
          <h3 className="mt-6 text-sm font-medium">What it is about</h3>
          <p className="mt-2 text-sm text-muted-foreground">{card.about}</p>
          <h3 className="mt-6 text-sm font-medium">What it will do</h3>
          <p className="mt-2 text-sm text-muted-foreground">{card.willDo}</p>
          {card.org === "household" || card.org === "sales" ? (
            <>
              {signedIn && card.aim ? (
                <p className="mt-6 text-xs font-medium uppercase tracking-[0.12em]" data-aim-label="Aim">
                  Aim
                </p>
              ) : null}
              <h3 className={signedIn && card.aim ? "mt-1 text-sm font-medium" : "mt-6 text-sm font-medium"}>
                {card.org === "sales" ? "What this team is aiming for" : "What this family is aiming for"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground" data-org-aim={card.aim ? "yes" : "no"}>
                {card.aim ||
                  (card.org === "sales"
                    ? "No line for what this team is aiming for yet."
                    : "No line for what this family is aiming for yet.")}
              </p>
              {signedIn && card.confidence ? (
                <p className="mt-6 text-xs font-medium uppercase tracking-[0.12em]" data-confidence-label="Confidence">
                  Confidence
                </p>
              ) : null}
              <h3 className={signedIn && card.confidence ? "mt-1 text-sm font-medium" : "mt-6 text-sm font-medium"}>
                How they are doing
              </h3>
              <p className="mt-2 text-sm text-muted-foreground" data-confidence={card.personId}>
                {card.confidence || "No note on how they are doing yet."}
              </p>
            </>
          ) : null}
          <h3 className="mt-6 text-sm font-medium">{nextStep?.portion ? "Next portion" : "Next step"}</h3>
          {nextStep?.portion ? (
            <p
              className="mt-2 text-sm text-muted-foreground"
              data-next-portion={card.nextTitle}
              data-next-step={card.nextTitle}
              data-next-from={nextStep.from || "stored"}
            >
              {nextStep.login === "member"
                ? "This next step stays when the leader leaves and comes back. The team member may sign in. The leader owns the path."
                : "This next step stays when the parent leaves and comes back. The child has no login."}
            </p>
          ) : null}
          <Link
            href={card.nextHref}
            className="mt-3 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            {card.nextTitle}
          </Link>
        </section>
      )}
    </main>
  );
}
