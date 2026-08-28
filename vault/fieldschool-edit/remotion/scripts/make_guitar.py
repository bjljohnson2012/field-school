#!/usr/bin/env python3
from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

SR = 48000
DEST = Path(__import__("os").environ.get("FS_REMOTION_PUBLIC", "/opt/fieldschool-edit/remotion/public"))

C3, D3, E3, F3, G3, A3, B3 = 130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94
G2, A2, B2 = 98.00, 110.00, 123.47
C4, E4 = 261.63, 329.63


def s16(sample: float) -> int:
    return max(-32767, min(32767, int(sample * 32767)))


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


def write_mono(path: Path, mono: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        raw = bytearray()
        for sample in mono:
            raw.extend(struct.pack("<h", s16(sample)))
        out.writeframes(raw)


def pluck(freq: float, dur: float, decay: float, seed: int) -> list[float]:
    rng = random.Random(seed)
    period = max(2, int(round(SR / freq)))
    buf = [rng.uniform(-1.0, 1.0) for _ in range(period)]
    out: list[float] = []
    n = int(SR * dur)
    prev = 0.0
    for _ in range(n):
        avg = 0.5 * (buf[0] + buf[1])
        buf.append(avg * decay)
        buf.pop(0)
        sample = avg - 0.18 * prev
        prev = avg
        out.append(sample)
    return out


def mix_at(dest: list[float], src: list[float], start: float, gain: float) -> None:
    i0 = int(start * SR)
    for i, sample in enumerate(src):
        idx = i0 + i
        if idx >= len(dest):
            break
        dest[idx] += sample * gain


def fade(samples: list[float], inn: float, out: float) -> None:
    n = len(samples)
    a = int(inn * SR)
    r = int(out * SR)
    for i in range(min(a, n)):
        samples[i] *= i / max(1, a)
    for i in range(r):
        idx = n - 1 - i
        if idx < 0:
            break
        samples[idx] *= i / max(1, r)


def guitar_track(seconds: float) -> tuple[list[float], list[float]]:
    n = int(SR * seconds)
    left = [0.0] * n
    right = [0.0] * n
    eighth = 60.0 / 74.0 / 2.0
    shapes = (
        (C3, E3, G3, C4, E4, C4, G3, E3),
        (G2, B2, D3, G3, B3, G3, D3, B2),
        (A2, C3, E3, A3, C4, A3, E3, C3),
        (F3, A3, C4, A3, F3, C3, A2, F3),
    )
    t = 0.0
    beat = 0
    seed = 11
    while t < seconds - 0.4:
        notes = shapes[(beat // 8) % len(shapes)]
        note = notes[beat % 8]
        intro = t < 6.2
        sparse = t >= 6.2 and beat % 2 == 1
        if not sparse:
            decay = 0.9974 if intro else 0.9968
            gain = 0.22 if intro else 0.11
            dur = 1.35 if intro else 1.1
            tone = pluck(note, dur, decay, seed)
            mix_at(left, tone, t, gain)
            mix_at(right, pluck(note * 1.0016, dur, decay, seed + 3), t + 0.007, gain * 0.92)
            seed += 1
        t += eighth
        beat += 1
    fade(left, 0.08, 2.2)
    fade(right, 0.08, 2.2)
    peak = max(1e-6, max(abs(s) for s in left + right))
    scale = 0.72 / peak
    return [s * scale for s in left], [s * scale for s in right]


def chord(notes: tuple[float, ...], dur: float, gain: float) -> list[float]:
    n = int(SR * dur)
    out = [0.0] * n
    for i, freq in enumerate(notes):
        mix_at(out, pluck(freq, dur, 0.997, 40 + i), 0.0, gain)
    fade(out, 0.004, 0.35)
    return out


def main() -> None:
    raise SystemExit("guitar.wav comes from fetch_guitar.sh. Do not overwrite the acoustic.")


if __name__ == "__main__":
    main()
