export const dash = (length: number, drawn: number): {strokeDasharray: string; strokeDashoffset: number} => {
  const amount = Math.max(0, Math.min(1, drawn));
  return {
    strokeDasharray: `${length}`,
    strokeDashoffset: length * (1 - amount),
  };
};

export const along = (drawn: number, stops: readonly number[]): number => {
  if (stops.length === 0) {
    return 0;
  }
  if (stops.length === 1) {
    return stops[0];
  }
  const t = Math.max(0, Math.min(1, drawn)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(t));
  const local = t - i;
  return stops[i] + (stops[i + 1] - stops[i]) * local;
};
