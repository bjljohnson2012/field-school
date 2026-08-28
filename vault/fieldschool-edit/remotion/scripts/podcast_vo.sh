#!/bin/bash
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/a_roll.mp4}
WAV=${2:-/opt/fieldschool-edit/remotion/public/vo.wav}
SECS=${3:-58}
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
  sox "$RAW" "$CLEAN" noisered "$PROF" 0.1
  DENOISED="$CLEAN"
fi
ffmpeg -y -i "$DENOISED" \
  -af "highpass=f=80,lowpass=f=7200,afftdn=nr=12:nf=-30:tn=1,anlmdn=s=0.0003:p=0.002,agate=threshold=0.012:ratio=5:attack=10:release=140:makeup=1,equalizer=f=170:t=q:w=1.0:g=2.6,equalizer=f=280:t=q:w=0.9:g=1.4,equalizer=f=3000:t=q:w=1.2:g=-3.4,equalizer=f=5200:t=q:w=1.3:g=-4.2,acompressor=threshold=-18dB:ratio=2.4:attack=14:release=170:makeup=2.4,alimiter=limit=0.94,loudnorm=I=-16:TP=-1.5:LRA=9,apad=whole_dur=${SECS},atrim=0:${SECS}" \
  -ar 48000 -ac 1 -t "$SECS" "$WAV"
python3 "$HERE/gate_vo_gaps.py" "$WAV" "$EP"
ffmpeg -y -i "$WAV" -af "apad=whole_dur=${SECS}" -t "$SECS" -ar 48000 -ac 1 "$DIR/vo.clock.wav"
mv "$DIR/vo.clock.wav" "$WAV"
rm -f "$RAW" "$NOISE" "$PROF" "$CLEAN"
echo "$WAV"
