#!/usr/bin/env python3
"""Paper rustle and pencil scratch timed to the cards."""
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
    n = int(SR * 0.58)
    out = [0.0] * n
    x = 0.0
    y = 0.0
    for i in range(n):
        x = 0.62 * x + 0.38 * noise(rng)
        y = 0.86 * y + 0.14 * noise(rng)
        t = i / n
        attack = math.sin(math.pi * min(1.0, t / 0.08))
        body = (1.0 - t) ** 1.15
        crease = 0.55 + 0.45 * math.sin(2 * math.pi * 16 * t)
        slap = math.exp(-((t - 0.07) ** 2) / 0.0018) * 0.22
        out[i] = attack * body * (0.28 * x * crease + 0.16 * y) + slap * x
    return out


def pencil_write() -> list[float]:
    rng = random.Random(41)
    n = int(SR * 1.35)
    out = [0.0] * n
    strokes = (0.02, 0.14, 0.26, 0.39, 0.52, 0.64, 0.76, 0.88, 1.02)
    for start in strokes:
        length = 0.08 + rng.random() * 0.05
        a = int(start * SR)
        b = min(n, a + int(length * SR))
        y = 0.0
        for i in range(a, b):
            y = 0.38 * y + 0.62 * noise(rng)
            local = (i - a) / max(1, b - a)
            env = math.sin(math.pi * local) ** 1.15
            grit = y + 0.3 * math.sin(2 * math.pi * (1200 + 1100 * local) * (i / SR))
            out[i] += 0.26 * env * grit
    return out


def pencil_tap() -> list[float]:
    rng = random.Random(7)
    n = int(SR * 0.11)
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 48)
        wood = math.sin(2 * math.pi * 620 * t) * math.exp(-t * 38)
        click = math.sin(2 * math.pi * 2400 * t) * math.exp(-t * 90)
        out[i] = env * (0.22 * noise(rng) + 0.2 * wood + 0.12 * click)
    return out


def paper_close() -> list[float]:
    rng = random.Random(23)
    n = int(SR * 0.38)
    out = [0.0] * n
    x = 0.0
    for i in range(n):
        x = 0.58 * x + 0.42 * noise(rng)
        t = i / n
        env = math.sin(math.pi * min(1.0, t / 0.07)) * (1.0 - t) ** 1.05
        fold = x * (0.5 + 0.5 * math.sin(2 * math.pi * 22 * t))
        slap = math.exp(-((t - 0.11) ** 2) / 0.0012) * 0.2
        out[i] = 0.28 * env * fold + slap * x
    return out


def page_turn() -> list[float]:
    rng = random.Random(31)
    n = int(SR * 0.36)
    out = [0.0] * n
    x = 0.0
    for i in range(n):
        x = 0.7 * x + 0.3 * noise(rng)
        t = i / n
        sweep = math.sin(math.pi * t) ** 1.3
        flutter = 0.6 + 0.4 * math.sin(2 * math.pi * 14 * t)
        out[i] = 0.3 * sweep * x * flutter
    return out


def stamp() -> list[float]:
    rng = random.Random(13)
    n = int(SR * 0.16)
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        thud = math.sin(2 * math.pi * 140 * t) * math.exp(-t * 28)
        rubber = noise(rng) * math.exp(-t * 42)
        out[i] = 0.34 * thud + 0.16 * rubber
    return out


def main() -> None:
    write_mono(DEST / "paper.wav", paper_open())
    write_mono(DEST / "pencil.wav", pencil_write())
    write_mono(DEST / "pencil-tap.wav", pencil_tap())
    write_mono(DEST / "paper-close.wav", paper_close())
    write_mono(DEST / "page.wav", page_turn())
    write_mono(DEST / "stamp.wav", stamp())
    print(DEST / "paper.wav")


if __name__ == "__main__":
    main()
