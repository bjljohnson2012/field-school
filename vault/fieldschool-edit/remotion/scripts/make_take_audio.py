#!/usr/bin/env python3
from __future__ import annotations

import subprocess
from pathlib import Path

A_ROLL = Path("/opt/fieldschool-edit/remotion/public/a_roll.mp4")
VO = Path("/opt/fieldschool-edit/remotion/public/vo.wav")
DEST = Path("/opt/fieldschool-edit/remotion/public/sfx")
TMP = Path("/tmp/fs-take-audio")

# Quiet stretches we already measured. Do not pull Cap demo music.
CHUNKS = (
    (VO, 1.38, 1.00),
    (VO, 5.70, 1.04),
    (VO, 9.53, 0.55),
    (A_ROLL, 650.35, 1.28),
)


def run(args: list[str]) -> None:
    subprocess.check_call(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def extract(src: Path, start: float, dur: float, dest: Path) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{start:.3f}",
            "-t",
            f"{dur:.3f}",
            "-i",
            str(src),
            "-vn",
            "-ac",
            "2",
            "-ar",
            "48000",
            str(dest),
        ]
    )


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    if TMP.exists():
        for old in TMP.glob("*"):
            old.unlink()
    TMP.mkdir(parents=True, exist_ok=True)

    pieces: list[Path] = []
    for i, (src, start, dur) in enumerate(CHUNKS):
        if not src.is_file():
            raise SystemExit(f"missing {src}")
        dest = TMP / f"chunk{i}.wav"
        extract(src, start, dur, dest)
        pieces.append(dest)

    room = TMP / "room.wav"
    cmd = ["ffmpeg", "-y"]
    for piece in pieces:
        cmd.extend(["-i", str(piece)])
    fades = []
    last = "[0:a]"
    for i in range(1, len(pieces)):
        label = f"[a{i}]"
        fades.append(f"{last}[{i}:a]acrossfade=d=0.1{label}")
        last = label
    cmd.extend(["-filter_complex", ";".join(fades), "-map", last, str(room)])
    run(cmd)

    bed = DEST / "bed.wav"
    run(
        [
            "ffmpeg",
            "-y",
            "-stream_loop",
            "-1",
            "-i",
            str(room),
            "-t",
            "32",
            "-af",
            "afade=t=in:d=2.0,afade=t=out:st=29.4:d=2.6,highpass=f=80,lowpass=f=240,volume=0.85",
            str(bed),
        ]
    )

    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(room),
            "-t",
            "0.72",
            "-af",
            "highpass=f=90,lowpass=f=320,volume=2.1,afade=t=in:d=0.12,afade=t=out:st=0.28:d=0.42",
            str(DEST / "sting.wav"),
        ]
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(room),
            "-t",
            "0.42",
            "-af",
            "asetrate=32000,aresample=48000,highpass=f=180,lowpass=f=1600,volume=1.5,afade=t=in:d=0.06,afade=t=out:st=0.22:d=0.16",
            str(DEST / "whoosh.wav"),
        ]
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(room),
            "-t",
            "0.2",
            "-af",
            "highpass=f=35,lowpass=f=90,volume=3.4,afade=t=in:d=0.004,afade=t=out:st=0.05:d=0.13",
            str(DEST / "hit.wav"),
        ]
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(room),
            "-t",
            "0.03",
            "-af",
            "highpass=f=400,lowpass=f=2400,volume=1.1,afade=t=in:d=0.002,afade=t=out:st=0.008:d=0.018",
            str(DEST / "tick.wav"),
        ]
    )
    print(DEST, [p.name for p in sorted(DEST.iterdir())])


if __name__ == "__main__":
    main()
