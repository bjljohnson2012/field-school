#!/bin/bash
# Turn a Suno bed into the 60s mix. Loop the 32s intro once.
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/beds/marimba-intro.mp3}
DEST=${FS_REMOTION_PUBLIC:-/opt/fieldschool-edit/remotion/public}
if [ ! -f "$SRC" ]; then
  echo "missing bed: $SRC" >&2
  exit 1
fi
mkdir -p "$DEST/sfx"
ffmpeg -y -hide_banner -loglevel error -stream_loop 2 -t 64 -i "$SRC" \
  -af "highpass=f=50,lowpass=f=7800,equalizer=f=3200:t=q:w=1.1:g=-2.8,loudnorm=I=-20:TP=-1.5:LRA=11" \
  -ar 48000 -ac 2 "$DEST/bed.wav"
# One marimba hit for the waiting. drop.
ffmpeg -y -hide_banner -loglevel error -ss 2.4 -t 0.7 -i "$DEST/bed.wav" \
  -af "afade=t=in:st=0:d=0.006,afade=t=out:st=0.28:d=0.4,loudnorm=I=-16:TP=-2" \
  -ar 48000 -ac 1 "$DEST/sfx/drop-note.wav"
ffmpeg -y -hide_banner -loglevel error -t 8 -i "$DEST/bed.wav" -c copy "$DEST/intro.wav"
# Keep guitar.wav as an alias so older renders do not break if something still points there.
cp -f "$DEST/bed.wav" "$DEST/guitar.wav"
echo "$DEST/bed.wav"
