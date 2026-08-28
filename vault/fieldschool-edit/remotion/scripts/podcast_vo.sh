#!/bin/bash
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/a_roll.mp4}
WAV=${2:-/opt/fieldschool-edit/remotion/public/vo.wav}
SECS=${3:-27.975}
# Same start and length as the WhisperX file. Gate noise. Do not cut time.
ffmpeg -y -ss 0 -t "$SECS" -i "$SRC" -vn \
  -af "highpass=f=80,lowpass=f=10000,afftdn=nr=15:nf=-30,anlmdn=s=0.00025:p=0.002,agate=threshold=0.014:ratio=8:attack=5:release=100:makeup=1,equalizer=f=220:t=q:w=1.2:g=-4,equalizer=f=3200:t=q:w=1.1:g=2.4,equalizer=f=7000:t=q:w=1.4:g=-2,acompressor=threshold=-20dB:ratio=3.2:attack=6:release=110:makeup=5,alimiter=limit=0.94,loudnorm=I=-16:TP=-1.5:LRA=8" \
  -ar 48000 -ac 1 "$WAV"
echo "$WAV"
