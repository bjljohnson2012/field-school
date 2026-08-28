#!/usr/bin/env python3
"""Zero WhisperX gaps. Same duration. Same word clock."""
from __future__ import annotations

import json
import struct
import sys
import wave
from pathlib import Path

EDGE_MS = 60
FADE_MS = 20
MIN_GAP_MS = 250


def read_wav(path: Path) -> tuple[int, list[int]]:
    with wave.open(str(path), "r") as src:
        if src.getsampwidth() != 2 or src.getnchannels() != 1:
            raise SystemExit("vo.wav must be 16-bit mono")
        sr = src.getframerate()
        raw = src.readframes(src.getnframes())
    samples = list(struct.unpack("<" + "h" * (len(raw) // 2), raw))
    return sr, samples


def write_wav(path: Path, sr: int, samples: list[int]) -> None:
    with wave.open(str(path), "w") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(sr)
        out.writeframes(struct.pack("<" + "h" * len(samples), *samples))


def words_from(episode: Path) -> list[tuple[float, float]]:
    data = json.loads(episode.read_text())
    return [(float(w["fromMs"]), float(w["toMs"])) for w in data.get("words") or []]


def fade_zero(samples: list[int], sr: int, start_ms: float, end_ms: float) -> None:
    fade = int(sr * FADE_MS / 1000)
    a = max(0, int(sr * start_ms / 1000))
    b = min(len(samples), int(sr * end_ms / 1000))
    if b - a < fade * 2 + 8:
        return
    for i in range(fade):
        samples[a + i] = int(samples[a + i] * (1 - i / fade))
        samples[b - 1 - i] = int(samples[b - 1 - i] * (1 - i / fade))
    for i in range(a + fade, b - fade):
        samples[i] = 0


def main() -> None:
    wav = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/fieldschool-edit/remotion/public/vo.wav")
    episode = Path(sys.argv[2] if len(sys.argv) > 2 else "/opt/fieldschool-edit/remotion/public/episode.json")
    sr, samples = read_wav(wav)
    words = words_from(episode)
    prev = 0.0
    n = 0
    for start, end in words:
        if start - prev >= MIN_GAP_MS:
            fade_zero(samples, sr, prev + EDGE_MS, start - EDGE_MS)
            n += 1
        prev = end
    fade_zero(samples, sr, prev + EDGE_MS, (len(samples) / sr) * 1000)
    write_wav(wav, sr, samples)
    print(wav, n, "gaps", len(samples) / sr)


if __name__ == "__main__":
    main()
