#!/usr/bin/env python3
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

SR = 48000
DEST = Path("/opt/fieldschool-edit/remotion/public/sfx")


def s16(sample: float) -> int:
    return max(-32767, min(32767, int(sample * 32767)))


def write_mono(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        raw = bytearray()
        for sample in samples:
            raw.extend(struct.pack("<h", s16(sample)))
        out.writeframes(raw)


def write_stereo(path: Path, left: list[float], right: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(SR)
        raw = bytearray()
        for l, r in zip(left, right):
            raw.extend(struct.pack("<hh", s16(l), s16(r)))
        out.writeframes(raw)


def env(i: int, n: int, attack: float, release: float) -> float:
    a = int(n * attack)
    r = int(n * release)
    if i < a:
        return i / max(1, a)
    if i > n - r:
        return max(0.0, (n - i) / max(1, r))
    return 1.0


def lowpass(samples: list[float], alpha: float) -> list[float]:
    y = 0.0
    out: list[float] = []
    for x in samples:
        y += alpha * (x - y)
        out.append(y)
    return out


def noise(n: int, seed: int = 17) -> list[float]:
    x = seed
    out: list[float] = []
    for _ in range(n):
        x = (1103515245 * x + 12345) % 2**31
        out.append(x / 2**30 - 1.0)
    return out


def sting() -> list[float]:
    n = int(SR * 0.48)
    out: list[float] = []
    for i in range(n):
        t = i / SR
        e = math.exp(-t * 7.2)
        out.append(e * (0.16 * math.sin(2 * math.pi * 130.81 * t) + 0.05 * math.sin(2 * math.pi * 196.0 * t)))
    return lowpass(out, 0.14)


def whoosh() -> list[float]:
    n = int(SR * 0.36)
    raw = noise(n, 91)
    out: list[float] = []
    for i, x in enumerate(raw):
        e = env(i, n, 0.14, 0.5)
        out.append(0.2 * e * x)
    return lowpass(out, 0.07)


def tick() -> list[float]:
    n = int(SR * 0.018)
    raw = noise(n, 4)
    out: list[float] = []
    for i, x in enumerate(raw):
        e = env(i, n, 0.05, 0.7)
        out.append(0.09 * e * x)
    return lowpass(out, 0.22)


def hit() -> list[float]:
    n = int(SR * 0.2)
    out: list[float] = []
    for i in range(n):
        t = i / SR
        e = math.exp(-t * 14)
        out.append(0.16 * e * math.sin(2 * math.pi * 58 * t))
    return lowpass(out, 0.18)


def bed() -> tuple[list[float], list[float]]:
    seconds = 32.0
    n = int(SR * seconds)
    left: list[float] = []
    right: list[float] = []
    hiss = noise(n, 3)
    for i in range(n):
        t = i / SR
        breath = math.sin(math.pi * ((t % 12.0) / 12.0)) ** 1.5 * 0.5 + 0.5
        if t < 2.2:
            breath *= t / 2.2
        if t > seconds - 2.6:
            breath *= max(0.0, (seconds - t) / 2.6)
        tone = (
            0.034 * math.sin(2 * math.pi * 98.0 * t)
            + 0.022 * math.sin(2 * math.pi * 146.83 * t)
            + 0.012 * math.sin(2 * math.pi * 196.0 * t)
        )
        air = 0.006 * hiss[i]
        left.append((tone + air) * breath)
        right.append((tone * 0.97 + air * 1.04) * breath)
    return lowpass(left, 0.045), lowpass(right, 0.045)


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    write_mono(DEST / "sting.wav", sting())
    write_mono(DEST / "whoosh.wav", whoosh())
    write_mono(DEST / "tick.wav", tick())
    write_mono(DEST / "hit.wav", hit())
    left, right = bed()
    write_stereo(DEST / "bed.wav", left, right)
    print(DEST, [p.name for p in sorted(DEST.iterdir())])


if __name__ == "__main__":
    main()
