const faceFocus = (track, frame, fallback) => {
  if (!track || track.x.length === 0 || track.y.length === 0) {
    return fallback;
  }
  const last = Math.min(track.x.length, track.y.length) - 1;
  const i = Math.max(0, Math.min(last, frame));
  return `${(track.x[i] * 100).toFixed(1)}% ${(track.y[i] * 100).toFixed(1)}%`;
};

if (faceFocus({x: [0.4, 0.6], y: [0.2, 0.3]}, 1, "50% 20%") !== "60.0% 30.0%") {
  throw new Error("live sample");
}
if (faceFocus({x: [0.4], y: [0.2]}, 80, "50% 20%") !== "40.0% 20.0%") {
  throw new Error("hold last");
}
if (faceFocus(null, 0, "50% 20%") !== "50% 20%") {
  throw new Error("fallback");
}
console.log("PASS face focus");
