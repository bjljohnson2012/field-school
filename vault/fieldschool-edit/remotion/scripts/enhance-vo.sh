#!/bin/bash
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/a_roll_src.mp4}
WAV=${2:-/opt/fieldschool-edit/remotion/public/vo.wav}
START=${3:-0}
SECS=${4:-20}
# Clock-safe polish. Do not cut time.
ffmpeg -y -ss "$START" -t "$SECS" -i "$SRC" -vn \
  -af "highpass=f=110,lowpass=f=8500,afftdn=nr=24:nf=-36:tn=1,anlmdn=s=0.0004:p=0.002:r=0.0007,agate=threshold=0.016:ratio=12:attack=4:release=80:makeup=0,equalizer=f=200:t=q:w=1.1:g=-5,equalizer=f=3200:t=q:w=1.1:g=2.2,equalizer=f=6500:t=q:w=1.3:g=-2.6,acompressor=threshold=-18dB:ratio=3:attack=8:release=120:makeup=3.2,alimiter=limit=0.94,loudnorm=I=-16:TP=-1.5:LRA=8" \
  -ar 48000 -ac 1 "$WAV"
echo "$WAV"
