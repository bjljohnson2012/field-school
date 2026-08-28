#!/bin/bash
# Drop a Suno (or any) intro here. Writes guitar.wav. Keeps the drop note.
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/suno.wav}
DEST=${FS_REMOTION_PUBLIC:-/opt/fieldschool-edit/remotion/public}
if [ ! -f "$SRC" ]; then
  echo "put the Suno file at $SRC or pass a path" >&2
  exit 1
fi
ffmpeg -y -hide_banner -loglevel error -t 32 -i "$SRC" \
  -af "highpass=f=55,loudnorm=I=-18:TP=-1.5:LRA=11" \
  -ar 48000 -ac 2 "$DEST/guitar.wav"
ffmpeg -y -hide_banner -loglevel error -t 8 -i "$DEST/guitar.wav" -c copy "$DEST/intro.wav"
echo "$DEST/guitar.wav"
