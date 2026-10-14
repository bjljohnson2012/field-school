/**
 * xAI embeddings on the same host as GROK_API_KEY: POST /v1/embeddings, model v1.
 * N is 1024, the dimension xAI's client sends for that model. Swap N here only.
 * Callers pass `dimensions` so the stored vector matches this config.
 */

export const EMBEDDING_CONFIG = {
  provider: "xai" as const,
  model: "v1",
  dimensions: 1024,
};

export function parseVector(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    const numbers = value.map((item) => Number(item));
    if (numbers.length && numbers.every((item) => Number.isFinite(item))) return numbers;
    return null;
  }
  if (typeof value !== "string" || !value.startsWith("[")) return null;
  const numbers = value
    .slice(1, value.endsWith("]") ? -1 : undefined)
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
  return numbers.length ? numbers : null;
}

export function vectorLiteral(values: readonly number[]) {
  if (values.length !== EMBEDDING_CONFIG.dimensions) return null;
  if (values.some((value) => !Number.isFinite(value))) return null;
  return `[${values.join(",")}]`;
}

export function cosineSimilarity(left: readonly number[], right: readonly number[]) {
  if (!left.length || left.length !== right.length) return null;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }
  if (leftNorm === 0 || rightNorm === 0) return 0;
  const raw = dot / Math.sqrt(leftNorm * rightNorm);
  return Math.min(1, Math.max(0, raw));
}
