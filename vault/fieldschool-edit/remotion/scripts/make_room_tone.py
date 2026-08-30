#!/usr/bin/env python3
"""Loop a take-room print so pauses never drop to digital zero."""
from __future__ import annotations

import math
import struct
import sys
import wave
from pathlib import Path


def read_mono(path: Path) -> tuple[int, list[float]]:
    with wave.open(str(path), "r") as src:
        sr = src.getframerate()
        ch = src.getnchannels()
        raw = src.readframes(src.getnframes())
    samples = list(struct.unpack("<" + "h" * (len(raw) // 2), raw))
    if ch == 2:
        samples = samples[0::2]
    return sr, [s / 32768.0 for s in samples]


def write_mono(path: Path, sr: int, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    packed = [max(-32767, min(32767, int(s * 32767))) for s in samples]
    with wave.open(str(path), "w") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(sr)
        out.writeframes(struct.pack("<" + "h" * len(packed), *packed))


def lowpass(samples: list[float], sr: int, cutoff: float) -> list[float]:
    dt = 1.0 / sr
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


def loop_crossfade(src: list[float], sr: int, seconds: float) -> list[float]:
    if len(src) < sr // 10:
        src = src * 8
    fade = min(len(src) // 4, int(sr * 0.08))
    body = src[:]
    for i in range(fade):
        t = i / fade
        body[i] = src[i] * t + src[-fade + i] * (1.0 - t)
    need = int(sr * seconds)
    out: list[float] = []
    while len(out) < need:
        out.extend(body[fade:] if len(out) else body)
    return out[:need]


def main() -> None:
    noise = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/fieldschool-edit/remotion/public/vo.noise.wav")
    dest = Path(sys.argv[2] if len(sys.argv) > 2 else "/opt/fieldschool-edit/remotion/public/room.wav")
    seconds = float(sys.argv[3] if len(sys.argv) > 3 else 64)
    sr, samples = read_mono(noise)
    room = lowpass(loop_crossfade(samples, sr, seconds), sr, 380)
    peak = max((abs(s) for s in room), default=1.0)
    gain = 0.045 / peak if peak > 0 else 0.0
    write_mono(dest, sr, [s * gain for s in room])
    print(dest, seconds)


if __name__ == "__main__":
    main()
