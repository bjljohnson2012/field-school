import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareLink } from "@/components/share-link";
import { getSharePage, sharePages } from "@/lib/share";
import { UNI_NAME } from "@/lib/brand";

export function generateStaticParams() {
  return sharePages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getSharePage(slug);
  if (!page) return { title: "Share" };
  return {
    title: page.title,
    description: page.lede,
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getSharePage(slug);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {UNI_NAME} · {page.kicker}
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        {page.title}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        {page.lede}
      </p>
      <div className="mt-6">
        <ShareLink path={`/share/${page.slug}`} label="Copy this link" />
      </div>

      <div className="mt-10 space-y-6">
        {page.sections.map((section) => (
          <article
            key={section.heading}
            className="rounded-xl border border-border bg-card px-5 py-5"
          >
            <h2 className="font-display text-2xl tracking-tight">
              {section.heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </article>
        ))}
      </div>

      {page.next ? (
        <Link
          href={page.next.href}
          className="mt-10 inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          {page.next.label}
        </Link>
      ) : null}
    </main>
  );
}
