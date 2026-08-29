#!/usr/bin/env python3
"""Smooth face centers for Remotion object-position. Do not rewrite a_roll.mp4."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np

CASCADES = (
    str(Path(__file__).with_name("data") / "haarcascade_frontalface_alt2.xml"),
    "/usr/share/opencv4/haarcascades/haarcascade_frontalface_alt2.xml",
)


def cascade() -> cv2.CascadeClassifier:
    for path in CASCADES:
        if Path(path).exists():
            det = cv2.CascadeClassifier(path)
            if not det.empty():
                return det
    raise SystemExit("no haar face cascade on this box")


def detect(det: cv2.CascadeClassifier, frame: np.ndarray) -> tuple[float, float] | None:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = det.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=6, minSize=(80, 80))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda item: item[2] * item[3])
    return float(x + w / 2.0), float(y + h * 0.38)


def smooth(values: np.ndarray, window: int) -> np.ndarray:
    if values.size == 0:
        return values
    span = max(3, window | 1)
    kernel = np.hanning(span)
    kernel = kernel / kernel.sum()
    pad = span // 2
    held = np.pad(values, (pad, pad), mode="edge")
    return np.convolve(held, kernel, mode="valid")


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/fieldschool-edit/remotion/public/a_roll.mp4")
    dest = Path(sys.argv[2] if len(sys.argv) > 2 else "public/episodes/everything-made-up/face-track.json")
    seconds = float(sys.argv[3]) if len(sys.argv) > 3 else 72.0
    det = cascade()
    cap = cv2.VideoCapture(str(src))
    if not cap.isOpened():
        raise SystemExit(f"cannot read {src}")
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    limit = int(round(seconds * fps))
    xs: list[float] = []
    ys: list[float] = []
    last = (width * 0.5, height * 0.28)
    hits = 0
    for _ in range(limit):
        ok, frame = cap.read()
        if not ok:
            break
        found = detect(det, frame)
        if found:
            last = found
            hits += 1
        xs.append(last[0] / width)
        ys.append(last[1] / height)
    cap.release()
    if hits == 0:
        raise SystemExit("no faces found")
    x = smooth(np.array(xs, dtype=np.float64), 25)
    y = smooth(np.array(ys, dtype=np.float64), 25)
    y = np.clip(y - 0.04, 0.08, 0.55)
    x = np.clip(x, 0.2, 0.8)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(
        json.dumps(
            {
                "fps": round(fps, 4),
                "width": width,
                "height": height,
                "hits": hits,
                "frames": len(x),
                "x": [round(float(v), 4) for v in x],
                "y": [round(float(v), 4) for v in y],
            },
            separators=(",", ":"),
        )
        + "\n"
    )
    print(dest, "frames", len(x), "hits", hits, f"x={x.mean():.3f}", f"y={y.mean():.3f}")


if __name__ == "__main__":
    main()
