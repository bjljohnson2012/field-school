export type FaceTrack = {
  x: number[];
  y: number[];
  width?: number;
  height?: number;
};

export const faceSample = (track: FaceTrack | null, frame: number): {x: number; y: number} => {
  if (!track || track.x.length === 0 || track.y.length === 0) {
    return {x: 0.5, y: 0.32};
  }
  const last = Math.min(track.x.length, track.y.length) - 1;
  const i = Math.max(0, Math.min(last, frame));
  return {x: track.x[i], y: track.y[i]};
};

export const faceWindow = ({
  boxW,
  boxH,
  srcW,
  srcH,
  zoom,
  faceX,
  faceY,
}: {
  boxW: number;
  boxH: number;
  srcW: number;
  srcH: number;
  zoom: number;
  faceX: number;
  faceY: number;
}): {width: number; height: number; left: number; top: number} => {
  const cover = Math.max(boxW / srcW, boxH / srcH);
  const width = srcW * cover * zoom;
  const height = srcH * cover * zoom;
  const left = Math.min(0, Math.max(boxW - width, boxW / 2 - faceX * width));
  const top = Math.min(0, Math.max(boxH - height, boxH / 2 - faceY * height));
  return {width, height, left, top};
};
