import { redirect, notFound } from "next/navigation";
import { handleQuizSubmit, loadPublicQuizView, type PublicQuestion } from "@/lib/coaching/quiz-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Choice = { value: string; label: string };

function choices(options: unknown): Choice[] {
  if (!Array.isArray(options)) return [];
  return options.flatMap((opt, index) => {
    if (typeof opt === "string" && opt.trim()) return [{ value: opt, label: opt }];
    if (opt && typeof opt === "object") {
      const row = opt as { value?: unknown; label?: unknown };
      const value = row.value == null ? String(index) : String(row.value);
      const label = row.label == null ? value : String(row.label);
      return value ? [{ value, label }] : [];
    }
    return [];
  });
}

function answerFields(formData: FormData) {
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const answers = [];
  for (const id of ids) {
    const type = String(formData.get(`type:${id}`) ?? "LONG_FORM").toUpperCase();
    const raw = formData.get(`answer:${id}`);
    if (typeof raw !== "string") continue;
    if (type === "MULTIPLE_CHOICE") {
      if (!raw) continue;
      answers.push({ questionId: id, value: { choice: raw } });
      continue;
    }
    if (type === "LIKERT" || type === "SLIDER") {
      const scale = Number(raw);
      if (!Number.isFinite(scale)) continue;
      answers.push({ questionId: id, value: { scale } });
      continue;
    }
    if (raw.trim()) answers.push({ questionId: id, value: { text: raw } });
  }
  return answers;
}

async function submitFromForm(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const response = await handleQuizSubmit(token, { answers: answerFields(formData) });
  const next = `/quiz/${encodeURIComponent(token)}`;
  if (response.status === 403) redirect(`${next}?notice=writes_disabled`);
  if (response.status === 400) redirect(`${next}?notice=invalid`);
  redirect(next);
}

function QuestionField({ question }: { question: PublicQuestion }) {
  const type = question.questionType.toUpperCase();
  const name = `answer:${question.id}`;
  if (type === "MULTIPLE_CHOICE") {
    const opts = choices(question.options);
    return (
      <select className="input" name={name} defaultValue="">
        <option value="">Choose one</option>
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
  if (type === "LIKERT") {
    return (
      <select className="input" name={name} defaultValue="">
        <option value="">Choose 1–5</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    );
  }
  if (type === "SLIDER") {
    return <input className="input" type="range" min={0} max={100} defaultValue={50} name={name} />;
  }
  return <textarea className="input min-h-[120px]" name={name} placeholder="Type your answer…" />;
}

export default async function QuizTokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { token } = await params;
  const { notice } = await searchParams;
  const view = await loadPublicQuizView(token);
  if (!view) notFound();

  if ("refused" in view) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <section className="card p-8 text-center">
          <h1 className="h-page">Quiz unavailable</h1>
          <p className="mt-3 text-sm text-muted-foreground">This link is no longer open.</p>
        </section>
      </main>
    );
  }

  if (view.done) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <section className="card p-8 text-center">
          <h1 className="h-page">Thank you</h1>
          <p className="mt-3 text-lg">{view.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">Your responses are in. Your coach will review them.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="h-page">{view.title}</h1>
      <form action={submitFromForm} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="ids" value={view.questions.map((question) => question.id).join(",")} />
        {view.questions.map((question, index) => (
          <section key={question.id} className="card p-6">
            <p className="eyebrow">
              {question.category.replaceAll("_", " ")} · {index + 1} of {view.questions.length}
            </p>
            <p className="mt-2 text-lg font-medium">{question.text}</p>
            <input type="hidden" name={`type:${question.id}`} value={question.questionType} />
            <div className="mt-4">
              <QuestionField question={question} />
            </div>
          </section>
        ))}
        {notice === "writes_disabled" ? (
          <p className="text-sm text-muted-foreground">Quiz answers are not being saved right now.</p>
        ) : null}
        {notice === "invalid" ? <p className="text-sm text-muted-foreground">Answer at least one question.</p> : null}
        <button className="btn-primary" type="submit">
          Submit quiz
        </button>
      </form>
    </main>
  );
}
