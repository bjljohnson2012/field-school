#!/bin/bash
# Documentary VO. Clean the floor first. Keep breaths. Do not zero gaps.
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
PASS1="$DIR/vo.pass1.wav"
PASS2="$DIR/vo.pass2.wav"
ROOM="$DIR/room.wav"
# Same start and length as the word clock. Do not cut time.
ffmpeg -y -hide_banner -loglevel error -ss 0 -t "$SECS" -i "$SRC" -vn -ac 1 -ar 48000 "$RAW"
# Print from the gap after "people" before "cannot".
ffmpeg -y -hide_banner -loglevel error -ss 5.65 -t 0.9 -i "$RAW" -vn -ac 1 -ar 48000 "$NOISE"
DENOISED="$RAW"
if command -v sox >/dev/null 2>&1; then
  sox "$NOISE" -n noiseprof "$PROF"
  sox "$RAW" "$PASS1" noisered "$PROF" 0.055
  sox "$PASS1" "$PASS2" noisered "$PROF" 0.055
  DENOISED="$PASS2"
fi
DEESS="equalizer=f=5500:t=q:w=1.5:g=-3.2"
if ffmpeg -hide_banner -h filter=deesser 2>&1 | grep -q "deesser AVOptions"; then
  DEESS="deesser=i=0.18:m=0.45:f=5500:s=0.2"
fi
# 24 dB/oct HPF, two 6 dB denoise passes, downward expander, body back,
# no air hype, slow optical glue then a fast peak catch.
ffmpeg -y -hide_banner -loglevel error -i "$DENOISED" \
  -af "highpass=f=85:poles=2,highpass=f=85:poles=2,afftdn=nr=6:nf=-34:tn=1,afftdn=nr=6:nf=-34:tn=1,agate=threshold=0.007:ratio=2.2:attack=22:release=260:knee=8:makeup=1,compand=attacks=0.25:decays=0.9:points=-90/-90|-50/-42|-24/-20|-12/-11|-6/-6:soft-knee=6,equalizer=f=200:t=q:w=1.1:g=1.2,equalizer=f=3000:t=q:w=1.3:g=-2.2,${DEESS},lowpass=f=9800,acompressor=threshold=-24dB:ratio=1.7:attack=35:release=300:knee=8:makeup=1.3,acompressor=threshold=-9dB:ratio=3.2:attack=3:release=48:knee=3:makeup=1,alimiter=limit=0.95,loudnorm=I=-18:TP=-1.8:LRA=11,apad=whole_dur=${SECS},atrim=0:${SECS}" \
  -ar 48000 -ac 1 -t "$SECS" "$WAV"
python3 "$HERE/make_room_tone.py" "$NOISE" "$ROOM" 64
ffmpeg -y -hide_banner -loglevel error -i "$WAV" -i "$ROOM" \
  -filter_complex "[1:a]atrim=0:${SECS},apad=whole_dur=${SECS}[rt];[0:a][rt]amix=inputs=2:duration=first:dropout_transition=3:normalize=0,volume=1.05,alimiter=limit=0.95,apad=whole_dur=${SECS},atrim=0:${SECS}" \
  -ar 48000 -ac 1 -t "$SECS" "$DIR/vo.clock.wav"
mv "$DIR/vo.clock.wav" "$WAV"
rm -f "$RAW" "$PROF" "$PASS1" "$PASS2"
echo "$WAV"
