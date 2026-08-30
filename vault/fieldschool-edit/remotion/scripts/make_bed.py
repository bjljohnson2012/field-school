#!/usr/bin/env python3
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path


def s16(sample: float) -> int:
    return max(-32767, min(32767, int(sample * 32767)))


def lowpass(samples: list[float], alpha: float) -> list[float]:
    y = 0.0
    out: list[float] = []
    for x in samples:
        y += alpha * (x - y)
        out.append(y)
    return out


def breath(t: float, period: float) -> float:
    phase = (t % period) / period
    return math.sin(math.pi * phase) ** 1.4


def main() -> None:
    sr = 48000
    seconds = 32.0
    n = int(sr * seconds)
    left: list[float] = []
    right: list[float] = []
    for i in range(n):
        t = i / sr
        env = breath(t, 10.0) * 0.55 + 0.45
        if t < 2.0:
            env *= t / 2.0
        if t > seconds - 2.4:
            env *= max(0.0, (seconds - t) / 2.4)
        a = (
            0.045 * math.sin(2 * math.pi * 130.81 * t)
            + 0.032 * math.sin(2 * math.pi * 196.00 * t)
            + 0.018 * math.sin(2 * math.pi * 261.63 * t)
        )
        b = (
            0.045 * math.sin(2 * math.pi * 130.81 * 1.002 * t + 0.2)
            + 0.032 * math.sin(2 * math.pi * 196.00 * 1.001 * t + 0.1)
            + 0.018 * math.sin(2 * math.pi * 261.63 * 0.999 * t)
        )
        left.append(a * env)
        right.append(b * env)

    left = lowpass(left, 0.06)
    right = lowpass(right, 0.06)
    dest = Path("/opt/fieldschool-edit/remotion/public/sfx/bed.wav")
    dest.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(dest), "w") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(sr)
        raw = bytearray()
        for l, r in zip(left, right):
            raw.extend(struct.pack("<hh", s16(l), s16(r)))
        out.writeframes(raw)
    print(dest, dest.stat().st_size)


if __name__ == "__main__":
    main()
