"use client";

type ClientQuestion = {
  id: string;
  type: string;
  text: string;
  options: unknown;
};

type Choice = { value: string; label: string };

function choices(options: unknown): Choice[] {
  if (!Array.isArray(options)) return [];
  return options.map((opt, index) => {
    if (typeof opt === "string") return { value: opt, label: opt };
    if (opt && typeof opt === "object") {
      const row = opt as { value?: unknown; label?: unknown };
      const value = row.value == null ? String(index) : String(row.value);
      return { value, label: row.label == null ? value : String(row.label) };
    }
    return { value: String(index), label: String(opt) };
  });
}

export function WizardStep({
  question,
  value,
  onChange,
}: {
  question: ClientQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const type = question.type.toUpperCase();
  const current = (value ?? {}) as { text?: string; choice?: string; scale?: number };
  const opts = choices(question.options);

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium leading-snug">{question.text}</div>
      {type === "LONG_FORM" || (type !== "MULTIPLE_CHOICE" && type !== "LIKERT" && type !== "SLIDER") ? (
        <textarea
          className="input min-h-[120px]"
          placeholder="Take your time. There are no wrong answers."
          value={current.text ?? ""}
          onChange={(event) => onChange({ text: event.target.value })}
        />
      ) : null}
      {type === "MULTIPLE_CHOICE" ? (
        <div className="space-y-2">
          {opts.map((opt) => {
            const selected = current.choice === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ choice: opt.value, label: opt.label })}
                className={`w-full rounded-brand border px-4 py-3 text-left ${
                  selected ? "border-brand-orange bg-orange-50" : "border-gray-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {type === "LIKERT" ? (
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = current.scale === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ scale: n })}
                className={`flex-1 rounded-brand border py-3 font-medium ${
                  selected ? "border-brand-orange bg-orange-50" : "border-gray-200"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      ) : null}
      {type === "SLIDER" ? (
        <div>
          <input
            className="input"
            type="range"
            min={0}
            max={100}
            value={current.scale ?? 50}
            onChange={(event) => onChange({ scale: Number(event.target.value) })}
          />
          <div className="mt-1 text-center text-sm text-gray-500">{current.scale ?? 50}</div>
        </div>
      ) : null}
    </div>
  );
}
