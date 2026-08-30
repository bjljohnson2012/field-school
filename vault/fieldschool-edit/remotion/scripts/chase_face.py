#!/usr/bin/env python3
"""Write a face-centered head take. Do not touch a_roll.mp4."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

CASCADES = (
    str(Path(__file__).with_name("data") / "haarcascade_frontalface_alt2.xml"),
    "/usr/share/opencv4/haarcascades/haarcascade_frontalface_alt2.xml",
)
OUT_W = 730
OUT_H = 640
CROP_H = 400
CROP_W = int(round(CROP_H * OUT_W / OUT_H))
# Haar box sits right of the nose. Shift the lock left so the face lands in the middle.
FACE_X_NUDGE = 0.02


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
    return float(x + w / 2.0), float(y + h / 2.0)


def smooth(values: np.ndarray, window: int) -> np.ndarray:
    span = max(3, window | 1)
    kernel = np.hanning(span)
    kernel = kernel / kernel.sum()
    pad = span // 2
    held = np.pad(values, (pad, pad), mode="edge")
    return np.convolve(held, kernel, mode="valid")


def crop_box(cx: float, cy: float, src_w: int, src_h: int) -> tuple[int, int, int, int]:
    x0 = int(round(cx - CROP_W / 2.0))
    y0 = int(round(cy - CROP_H / 2.0))
    x0 = max(0, min(src_w - CROP_W, x0))
    y0 = max(0, min(src_h - CROP_H, y0))
    return x0, y0, CROP_W, CROP_H


def collect(src: Path, det: cv2.CascadeClassifier, limit: int) -> tuple[np.ndarray, np.ndarray, int, int, float]:
    cap = cv2.VideoCapture(str(src))
    if not cap.isOpened():
        raise SystemExit(f"cannot read {src}")
    src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
    src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    xs: list[float] = []
    ys: list[float] = []
    last = (src_w * 0.5, src_h * 0.4)
    hits = 0
    frames = 0
    while frames < limit:
        ok, frame = cap.read()
        if not ok:
            break
        found = detect(det, frame)
        if found:
            last = found
            hits += 1
        xs.append(last[0] - src_w * FACE_X_NUDGE)
        ys.append(last[1])
        frames += 1
    cap.release()
    if hits == 0:
        raise SystemExit("no faces found")
    return smooth(np.array(xs, dtype=np.float64), 7), smooth(np.array(ys, dtype=np.float64), 7), src_w, src_h, fps


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/fieldschool-edit/remotion/public/a_roll.mp4")
    dest = Path(sys.argv[2] if len(sys.argv) > 2 else "/opt/fieldschool-edit/remotion/public/head.mp4")
    seconds = float(sys.argv[3]) if len(sys.argv) > 3 else 72.0
    det = cascade()
    sx, sy, src_w, src_h, fps = collect(src, det, int(round(seconds * 30.0)))
    dest.parent.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(src))
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
    for i in range(len(sx)):
        ok, frame = cap.read()
        if not ok:
            break
        x0, y0, win_w, win_h = crop_box(float(sx[i]), float(sy[i]), src_w, src_h)
        cut = frame[y0 : y0 + win_h, x0 : x0 + win_w]
        out = cv2.resize(cut, (OUT_W, OUT_H), interpolation=cv2.INTER_CUBIC)
        ff.stdin.write(out.tobytes())
    cap.release()
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg encode failed")
    print(dest, "frames", len(sx), f"crop={CROP_W}x{CROP_H}")


if __name__ == "__main__":
    main()
