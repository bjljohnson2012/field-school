#!/usr/bin/env python3
"""Keep the crop on the face. Heavy smooth so the card does not chase every nod."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

OUT_W = 720
OUT_H = 800
# Face sits in the upper third of the card, same place a lockup camera would put it.
FACE_Y = 0.34
FOLLOW = 0.05
CASCADES = (
    "/usr/share/opencv4/haarcascades/haarcascade_frontalface_alt2.xml",
    "/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml",
    "/usr/share/opencv/haarcascades/haarcascade_frontalface_alt2.xml",
)


def cascade() -> cv2.CascadeClassifier:
    for path in CASCADES:
        if Path(path).exists():
            det = cv2.CascadeClassifier(path)
            if not det.empty():
                return det
    raise SystemExit("no haar face cascade on this box")


def detect(det: cv2.CascadeClassifier, frame: np.ndarray) -> tuple[float, float, float] | None:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = det.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=6, minSize=(90, 90))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return float(x + w / 2.0), float(y + h / 2.0), float(h)


def smooth(prev: float | None, value: float) -> float:
    if prev is None:
        return value
    return prev * (1.0 - FOLLOW) + value * FOLLOW


def crop_box(cx: float, cy: float, face_h: float, src_w: int, src_h: int) -> tuple[int, int, int, int]:
    win_h = min(src_h, max(int(face_h * 3.15), int(src_h * 0.86)))
    win_w = int(win_h * OUT_W / OUT_H)
    if win_w > src_w:
        win_w = src_w
        win_h = int(win_w * OUT_H / OUT_W)
    x0 = int(round(cx - win_w / 2.0))
    y0 = int(round(cy - win_h * FACE_Y))
    x0 = max(0, min(src_w - win_w, x0))
    y0 = max(0, min(src_h - win_h, y0))
    return x0, y0, win_w, win_h


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/head.stab.mp4")
    dest = Path(sys.argv[2] if len(sys.argv) > 2 else "/opt/fieldschool-edit/remotion/public/head.mp4")
    cap = cv2.VideoCapture(str(src))
    if not cap.isOpened():
        raise SystemExit(f"cannot read {src}")
    src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    det = cascade()
    cx = cy = face_h = None
    hits = 0
    frames = 0
    ff = subprocess.Popen(
        [
            "ffmpeg",
            "-y",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "bgr24",
            "-s",
            f"{OUT_W}x{OUT_H}",
            "-r",
            f"{fps:.4f}",
            "-i",
            "-",
            "-an",
            "-c:v",
            "libx264",
            "-crf",
            "16",
            "-pix_fmt",
            "yuv420p",
            str(dest),
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    assert ff.stdin is not None
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        found = detect(det, frame)
        if found:
            fx, fy, fh = found
            cx = smooth(cx, fx)
            cy = smooth(cy, fy)
            face_h = smooth(face_h, fh)
            hits += 1
        if cx is None or cy is None or face_h is None:
            cx, cy, face_h = src_w / 2.0, src_h * 0.38, src_h * 0.28
        x0, y0, win_w, win_h = crop_box(cx, cy, face_h, src_w, src_h)
        cut = frame[y0 : y0 + win_h, x0 : x0 + win_w]
        out = cv2.resize(cut, (OUT_W, OUT_H), interpolation=cv2.INTER_CUBIC)
        ff.stdin.write(out.tobytes())
        frames += 1
    cap.release()
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg encode failed")
    print(dest, frames, "frames", hits, "faces")


if __name__ == "__main__":
    main()
