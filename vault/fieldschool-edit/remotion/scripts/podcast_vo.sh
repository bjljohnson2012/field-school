#!/bin/bash
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/a_roll.mp4}
WAV=${2:-/opt/fieldschool-edit/remotion/public/vo.wav}
SECS=${3:-27.975}
DIR=$(dirname "$WAV")
RAW="$DIR/vo.raw.wav"
NOISE="$DIR/vo.noise.wav"
PROF="$DIR/vo.noise.prof"
CLEAN="$DIR/vo.clean.wav"
# Same start and length as the WhisperX file. Do not cut time.
ffmpeg -y -ss 0 -t "$SECS" -i "$SRC" -vn -ac 1 -ar 48000 "$RAW"
# Cafe print from the first spoken gap. Gate the rest.
ffmpeg -y -ss 5.75 -t 0.35 -i "$RAW" -vn -ac 1 -ar 48000 "$NOISE"
DENOISED="$RAW"
if command -v sox >/dev/null 2>&1; then
  sox "$NOISE" -n noiseprof "$PROF"
  sox "$RAW" "$CLEAN" noisered "$PROF" 0.22
  DENOISED="$CLEAN"
fi
ffmpeg -y -i "$DENOISED" \
  -af "highpass=f=110,lowpass=f=8500,afftdn=nr=24:nf=-36:tn=1,anlmdn=s=0.0004:p=0.002,agate=threshold=0.016:ratio=12:attack=4:release=80:makeup=1,equalizer=f=200:t=q:w=1.1:g=-5,equalizer=f=3200:t=q:w=1.1:g=2.2,equalizer=f=6500:t=q:w=1.3:g=-2.6,acompressor=threshold=-18dB:ratio=3:attack=8:release=120:makeup=3.2,alimiter=limit=0.94,loudnorm=I=-16:TP=-1.5:LRA=8,apad=pad_dur=${SECS},atrim=0:${SECS}" \
  -ar 48000 -ac 1 -t "$SECS" "$WAV"
rm -f "$RAW" "$NOISE" "$PROF" "$CLEAN"
echo "$WAV"
