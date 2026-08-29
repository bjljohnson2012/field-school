#!/bin/bash
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/a_roll.mp4}
WAV=${2:-/opt/fieldschool-edit/remotion/public/episodes/everything-made-up/vo.wav}
# Clock-safe polish. Do not cut time. Same file for Remotion and WhisperX.
if [[ "$SRC" == *.wav ]]; then
  IN="$SRC"
else
  RAW="$(dirname "$WAV")/vo.raw.wav"
  ffmpeg -y -hide_banner -loglevel error -i "$SRC" -vn -ac 1 -ar 48000 "$RAW"
  IN="$RAW"
fi
ffmpeg -y -hide_banner -i "$IN" \
  -af "highpass=f=80,lowpass=f=12000,afftdn=nr=12:nf=-25,acompressor=threshold=-18dB:ratio=3:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 48000 -ac 1 "$WAV"
echo "$WAV"
