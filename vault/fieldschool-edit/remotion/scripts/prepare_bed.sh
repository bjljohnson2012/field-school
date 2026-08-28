#!/bin/bash
# Documentary bed. Scoop the voice band. Duck under the VO. Stay behind.
set -euo pipefail
SRC=${1:-/opt/fieldschool-edit/remotion/public/beds/marimba-intro.mp3}
DEST=${FS_REMOTION_PUBLIC:-/opt/fieldschool-edit/remotion/public}
VO=${3:-$DEST/vo.wav}
if [ ! -f "$SRC" ]; then
  echo "missing bed: $SRC" >&2
  exit 1
fi
mkdir -p "$DEST/sfx"
SCOOP="highpass=f=150,lowpass=f=3400,equalizer=f=220:t=q:w=1.2:g=-5,equalizer=f=1500:t=q:w=1.3:g=-6.5,equalizer=f=3000:t=q:w=1.1:g=-4,loudnorm=I=-26:TP=-2:LRA=8"
if [ -f "$VO" ]; then
  ffmpeg -y -hide_banner -loglevel error -stream_loop 2 -t 64 -i "$SRC" -i "$VO" \
    -filter_complex "[0:a]${SCOOP}[bed];[1:a]adelay=6000,apad=whole_dur=64,aformat=channel_layouts=stereo[sc];[bed][sc]sidechaincompress=threshold=0.055:ratio=2.6:attack=70:release=480:knee=6:level_sc=1:mix=0.8" \
    -ar 48000 -ac 2 "$DEST/bed.wav"
else
  ffmpeg -y -hide_banner -loglevel error -stream_loop 2 -t 64 -i "$SRC" \
    -af "$SCOOP" -ar 48000 -ac 2 "$DEST/bed.wav"
fi
ffmpeg -y -hide_banner -loglevel error -ss 2.4 -t 0.7 -i "$DEST/bed.wav" \
  -af "afade=t=in:st=0:d=0.006,afade=t=out:st=0.28:d=0.4,loudnorm=I=-20:TP=-2" \
  -ar 48000 -ac 1 "$DEST/sfx/drop-note.wav"
ffmpeg -y -hide_banner -loglevel error -t 8 -i "$DEST/bed.wav" -c copy "$DEST/intro.wav"
cp -f "$DEST/bed.wav" "$DEST/guitar.wav"
echo "$DEST/bed.wav"
