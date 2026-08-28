#!/usr/bin/env python3
"""Pin one crop on the median face. Wider frame. No chase."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

OUT_W = 720
OUT_H = 800
# Full take height. Lock X on the face. Do not punch in.
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


def detect(det: cv2.CascadeClassifier, frame: np.ndarray) -> tuple[float, float, float] | None:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = det.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=6, minSize=(90, 90))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return float(x + w / 2.0), float(y + h / 2.0), float(h)


def crop_box(cx: float, src_w: int, src_h: int) -> tuple[int, int, int, int]:
    win_h = src_h
    win_w = min(src_w, int(win_h * OUT_W / OUT_H))
    x0 = int(round(cx - win_w / 2.0))
    x0 = max(0, min(src_w - win_w, x0))
    return x0, 0, win_w, win_h


def collect(src: Path, det: cv2.CascadeClassifier) -> tuple[float, float, float, int, int]:
    cap = cv2.VideoCapture(str(src))
    xs: list[float] = []
    ys: list[float] = []
    hs: list[float] = []
    frames = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        found = detect(det, frame)
        if found:
            xs.append(found[0])
            ys.append(found[1])
            hs.append(found[2])
        frames += 1
    cap.release()
    if not xs:
        raise SystemExit("no faces found")
    return float(np.median(xs)), float(np.median(ys)), float(np.median(hs)), len(xs), frames


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/head.stab.mp4")
    dest = Path(sys.argv[2] if len(sys.argv) > 2 else "/opt/fieldschool-edit/remotion/public/head.mp4")
    det = cascade()
    mx, my, mh, hits, frames = collect(src, det)
    cap = cv2.VideoCapture(str(src))
    if not cap.isOpened():
        raise SystemExit(f"cannot read {src}")
    src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    x0, y0, win_w, win_h = crop_box(mx, src_w, src_h)
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
            "-vf",
            "hqdn3d=1.5:1.5:3:3,unsharp=5:5:0.45:3:3:0.15,eq=contrast=1.06:saturation=1.04:gamma=1.02",
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
    )
    assert ff.stdin is not None
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        cut = frame[y0 : y0 + win_h, x0 : x0 + win_w]
        out = cv2.resize(cut, (OUT_W, OUT_H), interpolation=cv2.INTER_CUBIC)
        ff.stdin.write(out.tobytes())
    cap.release()
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg encode failed")
    print(dest, frames, "frames", hits, "faces", f"lock={mx:.0f},{my:.0f},{mh:.0f}")


if __name__ == "__main__":
    main()
