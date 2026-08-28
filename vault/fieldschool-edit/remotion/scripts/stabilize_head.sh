#!/bin/bash
# Deshake the take, then lock the crop on the face. Do not touch a_roll.mp4.
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/a_roll.mp4}
DEST=${2:-/opt/fieldschool-edit/remotion/public/head.mp4}
SECS=${3:-58}
HERE=$(cd "$(dirname "$0")" && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
if ! python3 -c "import cv2" >/dev/null 2>&1; then
  apt-get install -y python3-opencv >/dev/null
fi
# Same start as the WhisperX file. Teach reads this with the same startFrom.
ffmpeg -y -hide_banner -loglevel error -ss 0 -t "$SECS" -i "$SRC" -an -c:v libx264 -crf 16 "$WORK/cut.mp4"
ffmpeg -y -hide_banner -loglevel error -i "$WORK/cut.mp4" \
  -vf "vidstabdetect=shakiness=8:accuracy=15:stepsize=6:mincontrast=0.12:result=$WORK/head.trf" \
  -f null -
ffmpeg -y -hide_banner -loglevel error -i "$WORK/cut.mp4" \
  -vf "vidstabtransform=input=$WORK/head.trf:smoothing=60:optzoom=1:interpol=bicubic:crop=black" \
  -an -c:v libx264 -crf 16 "$WORK/stab.mp4"
python3 "$HERE/lock_face.py" "$WORK/stab.mp4" "$DEST"
echo "$DEST"
