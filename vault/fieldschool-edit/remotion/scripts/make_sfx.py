#!/usr/bin/env python3
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path


def write_wav(path: Path, sr: int, mono: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(sr)
        raw = bytearray()
        for sample in mono:
            raw.extend(struct.pack("<h", max(-32767, min(32767, int(sample * 32767)))))
        out.writeframes(raw)


def env(i: int, n: int, attack: float, release: float) -> float:
    a = int(n * attack)
    r = int(n * release)
    if i < a:
        return i / max(1, a)
    if i > n - r:
        return max(0.0, (n - i) / max(1, r))
    return 1.0


def main() -> None:
    sr = 48000
    dest = Path("/opt/fieldschool-edit/remotion/public/sfx")
    dest.mkdir(parents=True, exist_ok=True)

    sting = []
    n = int(sr * 0.55)
    for i in range(n):
        t = i / sr
        e = env(i, n, 0.04, 0.55)
        sting.append(
            e
            * (
                0.22 * math.sin(2 * math.pi * 196 * t)
                + 0.16 * math.sin(2 * math.pi * 294 * t)
                + 0.1 * math.sin(2 * math.pi * 392 * t)
            )
        )
    write_wav(dest / "sting.wav", sr, sting)

    bed = []
    n = int(sr * 16)
    for i in range(n):
        t = i / sr
        bed.append(
            0.08 * math.sin(2 * math.pi * 110 * t)
            + 0.05 * math.sin(2 * math.pi * 164.81 * t)
            + 0.04 * math.sin(2 * math.pi * 220 * t)
        )
    write_wav(dest / "bed.wav", sr, bed)

    whoosh = []
    n = int(sr * 0.32)
    x = 0.13
    for i in range(n):
        x = (1103515245 * int(x * 100000) + 12345) % 2**31 / 2**31 * 2 - 1
        e = env(i, n, 0.08, 0.4)
        whoosh.append(0.18 * e * x)
    write_wav(dest / "whoosh.wav", sr, whoosh)

    tick = []
    n = int(sr * 0.045)
    for i in range(n):
        t = i / sr
        e = env(i, n, 0.02, 0.7)
        tick.append(0.28 * e * math.sin(2 * math.pi * 2100 * t))
    write_wav(dest / "tick.wav", sr, tick)

    hit = []
    n = int(sr * 0.22)
    for i in range(n):
        t = i / sr
        e = env(i, n, 0.01, 0.8)
        hit.append(0.3 * e * math.sin(2 * math.pi * 72 * t))
    write_wav(dest / "hit.wav", sr, hit)
    print(dest)


if __name__ == "__main__":
    main()
