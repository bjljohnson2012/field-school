#!/usr/bin/env python3
"""Paper open and pencil scratch. Not a whoosh."""
from __future__ import annotations

import math
import os
import random
import struct
import wave
from pathlib import Path

SR = 48000
DEST = Path(os.environ.get("FS_REMOTION_PUBLIC", "/opt/fieldschool-edit/remotion/public")) / "sfx"


def s16(sample: float) -> int:
    return max(-32767, min(32767, int(sample * 32767)))


def write_mono(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes(struct.pack("<" + "h" * len(samples), *(s16(s) for s in samples)))


def noise(rng: random.Random) -> float:
    return rng.uniform(-1.0, 1.0)


def paper_open() -> list[float]:
    rng = random.Random(19)
    n = int(SR * 0.42)
    out = [0.0] * n
    x = 0.0
    for i in range(n):
        x = 0.65 * x + 0.35 * noise(rng)
        t = i / n
        env = math.sin(math.pi * min(1.0, t / 0.12)) * (1.0 - t) ** 1.4
        rustle = x * (0.7 + 0.3 * math.sin(2 * math.pi * 18 * t))
        out[i] = 0.34 * env * rustle
    return out


def pencil_write() -> list[float]:
    rng = random.Random(41)
    n = int(SR * 0.7)
    out = [0.0] * n
    strokes = (0.02, 0.11, 0.22, 0.34, 0.46, 0.55)
    for start in strokes:
        length = 0.07 + rng.random() * 0.05
        a = int(start * SR)
        b = min(n, a + int(length * SR))
        y = 0.0
        for i in range(a, b):
            y = 0.4 * y + 0.6 * noise(rng)
            local = (i - a) / max(1, b - a)
            env = math.sin(math.pi * local) ** 1.2
            grit = y + 0.25 * math.sin(2 * math.pi * (1400 + 900 * local) * (i / SR))
            out[i] += 0.22 * env * grit
    return out


def pencil_tap() -> list[float]:
    rng = random.Random(7)
    n = int(SR * 0.09)
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 55)
        out[i] = env * (0.28 * noise(rng) + 0.18 * math.sin(2 * math.pi * 2100 * t))
    return out


def paper_close() -> list[float]:
    rng = random.Random(23)
    n = int(SR * 0.32)
    out = [0.0] * n
    x = 0.0
    for i in range(n):
        x = 0.6 * x + 0.4 * noise(rng)
        t = i / n
        env = math.sin(math.pi * min(1.0, t / 0.08)) * (1.0 - t) ** 1.1
        fold = x * (0.55 + 0.45 * math.sin(2 * math.pi * 26 * t))
        out[i] = 0.3 * env * fold
    return out


def main() -> None:
    write_mono(DEST / "paper.wav", paper_open())
    write_mono(DEST / "pencil.wav", pencil_write())
    write_mono(DEST / "pencil-tap.wav", pencil_tap())
    write_mono(DEST / "paper-close.wav", paper_close())
    print(DEST / "paper.wav")


if __name__ == "__main__":
    main()
