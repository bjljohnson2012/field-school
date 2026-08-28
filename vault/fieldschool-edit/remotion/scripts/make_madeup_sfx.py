#!/usr/bin/env python3
from __future__ import annotations

import math
import os
import random
import struct
import wave
from pathlib import Path

SR = 48000
DEST = Path(os.environ.get("FS_REMOTION_PUBLIC", str(Path(__file__).resolve().parents[1] / "public"))) / "sfx"


def write_mono(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    packed = [max(-32767, min(32767, int(s * 32767))) for s in samples]
    with wave.open(str(path), "w") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes(struct.pack("<" + "h" * len(packed), *packed))


def tick() -> list[float]:
    n = int(SR * 0.07)
    return [math.sin(2 * math.pi * 880 * i / SR) * math.exp(-i / SR * 40) * 0.28 for i in range(n)]


def hit() -> list[float]:
    n = int(SR * 0.22)
    return [
        (0.4 * math.sin(2 * math.pi * 110 * i / SR) + 0.18 * math.sin(2 * math.pi * 220 * i / SR))
        * math.exp(-i / SR * 14)
        for i in range(n)
    ]


def whoosh() -> list[float]:
    rng = random.Random(3)
    n = int(SR * 0.28)
    x = 0.0
    out = []
    for i in range(n):
        x = 0.86 * x + 0.14 * rng.uniform(-1, 1)
        env = math.sin(math.pi * i / n)
        out.append(0.16 * env * x)
    return out


def sting() -> list[float]:
    n = int(SR * 0.6)
    return [
        (0.3 * math.sin(2 * math.pi * 196 * i / SR) + 0.16 * math.sin(2 * math.pi * 247 * i / SR))
        * math.sin(math.pi * i / n)
        for i in range(n)
    ]


def main() -> None:
    write_mono(DEST / "tick.wav", tick())
    write_mono(DEST / "hit.wav", hit())
    write_mono(DEST / "whoosh.wav", whoosh())
    write_mono(DEST / "sting.wav", sting())
    print(DEST / "tick.wav")


if __name__ == "__main__":
    main()
