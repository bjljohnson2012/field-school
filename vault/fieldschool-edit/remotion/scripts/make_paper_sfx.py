#!/usr/bin/env python3
"""Low, warm card sounds. No wispy grit."""
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


def lowpass(samples: list[float], cutoff: float) -> list[float]:
    dt = 1.0 / SR
    rc = 1.0 / (2.0 * math.pi * cutoff)
    a = dt / (rc + dt)
    y = 0.0
    out: list[float] = []
    for x in samples:
        y += a * (x - y)
        out.append(y)
    y = 0.0
    twice: list[float] = []
    for x in out:
        y += a * (x - y)
        twice.append(y)
    return twice


def pop() -> list[float]:
    n = int(SR * 0.22)
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 22)
        body = (
            0.42 * math.sin(2 * math.pi * 92 * t)
            + 0.22 * math.sin(2 * math.pi * 148 * t)
            + 0.1 * math.sin(2 * math.pi * 220 * t)
        )
        out[i] = env * body
    return lowpass(out, 420)


def paper_open() -> list[float]:
    rng = random.Random(19)
    n = int(SR * 0.5)
    out = [0.0] * n
    x = 0.0
    for i in range(n):
        x = 0.82 * x + 0.18 * noise(rng)
        t = i / n
        env = math.sin(math.pi * min(1.0, t / 0.1)) * (1.0 - t) ** 1.3
        out[i] = 0.22 * env * x
    return lowpass(out, 520)


def paper_close() -> list[float]:
    rng = random.Random(23)
    n = int(SR * 0.32)
    out = [0.0] * n
    x = 0.0
    for i in range(n):
        x = 0.8 * x + 0.2 * noise(rng)
        t = i / n
        env = math.sin(math.pi * min(1.0, t / 0.08)) * (1.0 - t) ** 1.2
        thump = math.exp(-((t - 0.08) ** 2) / 0.002) * 0.18 * math.sin(2 * math.pi * 110 * t)
        out[i] = 0.18 * env * x + thump
    return lowpass(out, 480)


def page_turn() -> list[float]:
    rng = random.Random(31)
    n = int(SR * 0.34)
    out = [0.0] * n
    x = 0.0
    for i in range(n):
        x = 0.84 * x + 0.16 * noise(rng)
        t = i / n
        sweep = math.sin(math.pi * t) ** 1.4
        out[i] = 0.2 * sweep * x
    return lowpass(out, 500)


def stamp() -> list[float]:
    n = int(SR * 0.18)
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        thud = math.sin(2 * math.pi * 86 * t) * math.exp(-t * 20)
        pad = math.sin(2 * math.pi * 54 * t) * math.exp(-t * 14)
        out[i] = 0.32 * thud + 0.18 * pad
    return lowpass(out, 360)


def shoe_tap() -> list[float]:
    rng = random.Random(7)
    n = int(SR * 0.1)
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 36)
        wood = math.sin(2 * math.pi * 180 * t) * math.exp(-t * 24)
        out[i] = env * (0.12 * noise(rng) + 0.22 * wood)
    return lowpass(out, 400)


def type_key(seed: int, tone: float) -> list[float]:
    rng = random.Random(seed)
    n = int(SR * 0.09)
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 42)
        body = math.sin(2 * math.pi * tone * t) * math.exp(-t * 28)
        pad = math.sin(2 * math.pi * (tone * 0.52) * t) * math.exp(-t * 18)
        felt = 0.08 * noise(rng) * math.exp(-t * 80)
        out[i] = env * (0.28 * body + 0.16 * pad + felt)
    return lowpass(out, 720)


def swell() -> list[float]:
    n = int(SR * 0.7)
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        env = math.sin(math.pi * min(1.0, t / 0.7))
        body = 0.34 * math.sin(2 * math.pi * 68 * t) + 0.16 * math.sin(2 * math.pi * 102 * t)
        out[i] = env * body
    return lowpass(out, 160)


def main() -> None:
    write_mono(DEST / "pop.wav", pop())
    write_mono(DEST / "paper.wav", paper_open())
    write_mono(DEST / "paper-close.wav", paper_close())
    write_mono(DEST / "page.wav", page_turn())
    write_mono(DEST / "stamp.wav", stamp())
    write_mono(DEST / "pencil-tap.wav", shoe_tap())
    write_mono(DEST / "key-a.wav", type_key(11, 196))
    write_mono(DEST / "key-b.wav", type_key(17, 164))
    write_mono(DEST / "swell.wav", swell())
    print(DEST / "key-a.wav")


if __name__ == "__main__":
    main()
