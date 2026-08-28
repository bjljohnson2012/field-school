#!/bin/bash
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/a_roll.mp4}
WAV=${2:-/opt/fieldschool-edit/remotion/public/vo.wav}
SECS=${3:-27.975}
EP=${4:-/opt/fieldschool-edit/remotion/public/episode.json}
HERE=$(cd "$(dirname "$0")" && pwd)
DIR=$(dirname "$WAV")
RAW="$DIR/vo.raw.wav"
NOISE="$DIR/vo.noise.wav"
PROF="$DIR/vo.noise.prof"
CLEAN="$DIR/vo.clean.wav"
# Same start and length as the WhisperX file. Do not cut time.
ffmpeg -y -ss 0 -t "$SECS" -i "$SRC" -vn -ac 1 -ar 48000 "$RAW"
# Print from the gap after "people" (5.51s) before "cannot" (6.79s).
ffmpeg -y -ss 5.65 -t 0.9 -i "$RAW" -vn -ac 1 -ar 48000 "$NOISE"
DENOISED="$RAW"
if command -v sox >/dev/null 2>&1; then
  sox "$NOISE" -n noiseprof "$PROF"
  sox "$RAW" "$CLEAN" noisered "$PROF" 0.18
  DENOISED="$CLEAN"
fi
ffmpeg -y -i "$DENOISED" \
  -af "highpass=f=110,lowpass=f=8500,afftdn=nr=24:nf=-36:tn=1,anlmdn=s=0.0004:p=0.002,agate=threshold=0.02:ratio=14:attack=3:release=70:makeup=1,equalizer=f=200:t=q:w=1.1:g=-5,equalizer=f=3200:t=q:w=1.1:g=2.2,equalizer=f=6500:t=q:w=1.3:g=-2.6,acompressor=threshold=-18dB:ratio=3:attack=8:release=120:makeup=3.2,alimiter=limit=0.94,loudnorm=I=-16:TP=-1.5:LRA=8,apad=whole_dur=${SECS},atrim=0:${SECS}" \
  -ar 48000 -ac 1 -t "$SECS" "$WAV"
python3 "$HERE/gate_vo_gaps.py" "$WAV" "$EP"
ffmpeg -y -i "$WAV" -af "apad=whole_dur=${SECS}" -t "$SECS" -ar 48000 -ac 1 "$DIR/vo.clock.wav"
mv "$DIR/vo.clock.wav" "$WAV"
rm -f "$RAW" "$NOISE" "$PROF" "$CLEAN"
echo "$WAV"
