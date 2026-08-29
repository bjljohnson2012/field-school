export type FaceTrack = {
  x: number[];
  y: number[];
};

export const faceFocus = (track: FaceTrack | null, frame: number, fallback: string): string => {
  if (!track || track.x.length === 0 || track.y.length === 0) {
    return fallback;
  }
  const last = Math.min(track.x.length, track.y.length) - 1;
  const i = Math.max(0, Math.min(last, frame));
  return `${(track.x[i] * 100).toFixed(1)}% ${(track.y[i] * 100).toFixed(1)}%`;
};
