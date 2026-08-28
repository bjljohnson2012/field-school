#!/bin/bash
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/a_roll_src.mp4}
WAV=${2:-/opt/fieldschool-edit/remotion/public/vo.wav}
docker exec fieldschool-edit ffmpeg -y -i "$SRC" -vn \
  -af "highpass=f=80,lowpass=f=12000,afftdn=nf=-25,acompressor=threshold=-18dB:ratio=3:attack=8:release=140,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 48000 -ac 1 "$WAV"
echo "$WAV"
