#!/usr/bin/env python3
"""Original light intro bed. Not a commercial track."""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path


def write_wav(path: Path, sr: int, frames: list[tuple[float, float]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(sr)
        raw = bytearray()
        for left, right in frames:
            raw.extend(struct.pack("<hh", _s16(left), _s16(right)))
        out.writeframes(raw)


def _s16(sample: float) -> int:
    return max(-32767, min(32767, int(sample * 32767)))


def main() -> None:
    sr = 48000
    seconds = 16.0
    n = int(sr * seconds)
    chords = (
        (0.0, 4.0, (130.81, 196.00, 261.63)),
        (4.0, 8.0, (196.00, 246.94, 293.66)),
        (8.0, 12.0, (220.00, 261.63, 329.63)),
        (12.0, 16.0, (174.61, 220.00, 261.63)),
    )
    frames: list[tuple[float, float]] = []
    for i in range(n):
        t = i / sr
        left = 0.0
        right = 0.0
        for start, end, notes in chords:
            if t < start or t >= end:
                continue
            local = (t - start) / (end - start)
            env = math.sin(math.pi * local) ** 1.15
            for n_i, freq in enumerate(notes):
                left += 0.09 * env * math.sin(2 * math.pi * freq * t)
                right += 0.09 * env * math.sin(2 * math.pi * (freq * 1.003) * t + 0.15 * n_i)
                left += 0.025 * env * math.sin(2 * math.pi * freq * 2 * t)
        fade = 1.0
        if t < 0.35:
            fade = t / 0.35
        if t > seconds - 2.2:
            fade *= max(0.0, (seconds - t) / 2.2)
        frames.append((left * fade, right * fade))
    dest = Path("/opt/fieldschool-edit/remotion/public/intro.wav")
    write_wav(dest, sr, frames)
    print(dest, dest.stat().st_size)


if __name__ == "__main__":
    main()
