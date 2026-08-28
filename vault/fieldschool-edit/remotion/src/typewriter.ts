export const PLAYBOOK = /^playbook[,.]?$/i;
export const TYPE_MS = 1500;

export const typedCount = (nowMs: number, fromMs: number, letters: number, typeMs = TYPE_MS): number => {
  if (letters <= 0 || nowMs < fromMs) {
    return 0;
  }
  const t = (nowMs - fromMs) / typeMs;
  if (t >= 1) {
    return letters;
  }
  return Math.max(1, Math.min(letters, Math.ceil(t * letters)));
};

export const letterAtMs = (fromMs: number, index: number, letters: number, typeMs = TYPE_MS): number => {
  if (letters <= 0) {
    return fromMs;
  }
  return fromMs + (index / letters) * typeMs;
};
