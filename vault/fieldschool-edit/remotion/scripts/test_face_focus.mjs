const faceSample = (track, frame) => {
  if (!track || track.x.length === 0 || track.y.length === 0) {
    return {x: 0.5, y: 0.32};
  }
  const last = Math.min(track.x.length, track.y.length) - 1;
  const i = Math.max(0, Math.min(last, frame));
  return {x: track.x[i], y: track.y[i]};
};

const faceWindow = ({boxW, boxH, srcW, srcH, zoom, faceX, faceY}) => {
  const cover = Math.max(boxW / srcW, boxH / srcH);
  const width = srcW * cover * zoom;
  const height = srcH * cover * zoom;
  const left = Math.min(0, Math.max(boxW - width, boxW / 2 - faceX * width));
  const top = Math.min(0, Math.max(boxH - height, boxH / 2 - faceY * height));
  return {width, height, left, top};
};

const sample = faceSample({x: [0.4, 0.6], y: [0.2, 0.3]}, 1);
if (sample.x !== 0.6 || sample.y !== 0.3) {
  throw new Error(`sample ${sample.x},${sample.y}`);
}
if (faceSample({x: [0.4], y: [0.2]}, 80).x !== 0.4) {
  throw new Error("hold last");
}

const win = faceWindow({
  boxW: 700,
  boxH: 600,
  srcW: 1280,
  srcH: 720,
  zoom: 2,
  faceX: 0.5,
  faceY: 0.3,
});
const faceInBoxX = 0.5 * win.width + win.left;
const faceInBoxY = 0.3 * win.height + win.top;
if (Math.abs(faceInBoxX - 350) > 0.6 || Math.abs(faceInBoxY - 300) > 0.6) {
  throw new Error(`face not centered, got ${faceInBoxX},${faceInBoxY}`);
}
console.log("PASS face window centers the face");
