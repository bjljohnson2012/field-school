import type { Metadata } from "next";
import Link from "next/link";
import { isValidDemoLinkToken } from "@/lib/demo-link";
import { StartJordanWalk } from "./start-jordan-walk";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campus walk",
  robots: { index: false, follow: false },
};

type DemoSearch = {
  token?: string | string[];
};

function firstToken(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DemoWalkPage({
  searchParams,
}: {
  searchParams: Promise<DemoSearch>;
}) {
  const params = await searchParams;
  const token = firstToken(params.token);
  if (!isValidDemoLinkToken(token)) {
    return <DemoLinkClosed />;
  }
  return <StartJordanWalk />;
}

function DemoLinkClosed() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Campus walk
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        This walk is not on the public catalog
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Ask staff for a campus demo link, join the free beta, or continue as a
        guest. Login never shows a Jordan button.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Join the free beta
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
        >
          Sign in
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
        >
          Back to campus
        </Link>
      </div>
    </main>
  );
}
