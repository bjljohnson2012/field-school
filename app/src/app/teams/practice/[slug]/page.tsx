import type { ReactNode } from "react";

type PracticeView = (props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) => Promise<ReactNode> | ReactNode;

const loaders: Record<string, () => Promise<{ default: PracticeView }>> = {
  reviews: () => import("@/app/coaching/reviews/page") as Promise<{ default: PracticeView }>,
  compare: () => import("@/app/coaching/compare/page") as Promise<{ default: PracticeView }>,
  knowledge: () => import("@/app/coaching/knowledge/page") as Promise<{ default: PracticeView }>,
  files: () => import("@/app/coaching/files/page") as Promise<{ default: PracticeView }>,
  products: () => import("@/app/coaching/products/page") as Promise<{ default: PracticeView }>,
  questions: () => import("@/app/coaching/questions/page") as Promise<{ default: PracticeView }>,
};

export default async function TeamPracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const load = loaders[slug];
  if (!load) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl tracking-tight">Team practice</h1>
        <p className="mt-4 text-sm text-muted-foreground">This page is part of Team practice.</p>
      </main>
    );
  }
  const View = (await load()).default;
  return (
    <div data-team-practice={slug}>
      <p className="mx-auto max-w-3xl px-4 pt-6 text-sm">Team practice</p>
      <View searchParams={searchParams} />
    </div>
  );
}
