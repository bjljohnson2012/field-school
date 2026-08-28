#!/bin/bash
# Romance Anónimo (Jeux interdits). Jim Greeninger / Musopen. CC0.
# https://commons.wikimedia.org/wiki/File:Romance_An%C3%B3nimo_(Jeux_interdits).ogg
set -euo pipefail
DEST=${FS_REMOTION_PUBLIC:-/opt/fieldschool-edit/remotion/public}
SRC_URL=${GUITAR_URL:-"https://upload.wikimedia.org/wikipedia/commons/3/33/Romance_An%C3%B3nimo_%28Jeux_interdits%29.ogg"}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$DEST/sfx"
curl -fsSL "$SRC_URL" -o "$WORK/romance.ogg"
# Opening arpeggio is the class entry. Keep 32s so the 25s clip has bed under VO.
ffmpeg -y -ss 0.12 -t 32 -i "$WORK/romance.ogg" \
  -af "highpass=f=55,lowpass=f=12000,loudnorm=I=-18:TP=-1.5:LRA=11" \
  -ar 48000 -ac 2 "$DEST/guitar.wav"
# One plucked note for the waiting. drop. No cafe whoosh.
ffmpeg -y -ss 1.02 -t 0.72 -i "$DEST/guitar.wav" \
  -af "afade=t=in:st=0:d=0.008,afade=t=out:st=0.32:d=0.4,loudnorm=I=-16:TP=-2" \
  -ar 48000 -ac 1 "$DEST/sfx/drop-note.wav"
ffmpeg -y -t 8 -i "$DEST/guitar.wav" -c copy "$DEST/intro.wav"
echo "$DEST/guitar.wav" "$(wc -c < "$DEST/guitar.wav")"
