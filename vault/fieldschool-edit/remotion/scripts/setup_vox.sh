#!/bin/bash
set -euo pipefail
ROOT=/opt/fieldschool-edit/remotion
BRAND=/var/www/fieldschool.ai/branding/assets
JOB=/opt/fieldschool-video/edit/jobs/3c9fe86f6dee81299337e318cfef6982
PUB="$ROOT/public"
WORDS=/opt/fieldschool-video/edit/jobs/j013r823wx9ecaf/words.json

mkdir -p "$PUB/fonts" "$JOB"

cp -a "$BRAND/isolated-seal.png" "$PUB/isolated-seal.png"
cp -a "$BRAND/lockup-wide-cream-slogan.png" "$PUB/lockup-wide-cream-slogan.png"
cp -a "$BRAND/lockup-wide-cream.png" "$PUB/lockup-wide-cream.png"
cp -a "$BRAND/mark-transparent.png" "$PUB/mark-transparent.png"
cp -a "$BRAND/wordmark-transparent.png" "$PUB/wordmark-transparent.png"
cp -a "$BRAND/square-cream.png" "$PUB/square-cream.png"
cp -a "$BRAND/square-blue.png" "$PUB/square-blue.png"

if [ ! -f "$PUB/fonts/Fraunces-700.woff2" ]; then
  CSS=$(curl -fsSL -A 'Mozilla/5.0' 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&display=swap')
  URL=$(printf '%s\n' "$CSS" | grep -oE 'https://fonts.gstatic.com/[^)]+\.woff2' | head -n 1)
  curl -fsSL -A 'Mozilla/5.0' "$URL" -o "$PUB/fonts/Fraunces-700.woff2"
fi
if [ ! -f "$PUB/fonts/IBMPlexSans-400.woff2" ]; then
  CSS=$(curl -fsSL -A 'Mozilla/5.0' 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400&display=swap')
  URL=$(printf '%s\n' "$CSS" | grep -oE 'https://fonts.gstatic.com/[^)]+\.woff2' | head -n 1)
  curl -fsSL -A 'Mozilla/5.0' "$URL" -o "$PUB/fonts/IBMPlexSans-400.woff2"
fi

python3 "$ROOT/scripts/make_music.py"
python3 "$ROOT/scripts/group_phrases.py" "$WORDS" "$PUB/phrases.json"

if [ ! -f "$PUB/a_roll_src.mp4" ]; then
  cp -a "$PUB/a_roll.mp4" "$PUB/a_roll_src.mp4"
fi
docker exec fieldschool-edit ffmpeg -y -i /opt/fieldschool-edit/remotion/public/a_roll_src.mp4 \
  -af "highpass=f=80,lowpass=f=12000,acompressor=threshold=-18dB:ratio=3:attack=8:release=140,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -c:v copy -movflags +faststart /opt/fieldschool-edit/remotion/public/a_roll.mp4

python3 - << 'PY'
import json
from pathlib import Path
phrases = json.loads(Path("/opt/fieldschool-edit/remotion/public/phrases.json").read_text())
props = {
  "src": "a_roll.mp4",
  "cuts": [{"in": 0.0, "out": 651.878}],
  "overlay": {
    "logo": "isolated-seal.png",
    "x": 48,
    "y": 28,
    "w": 72,
    "h": 72,
    "title": "You Can Just Do Things",
  },
  "titleCards": [
    {"at": 0, "text": "Waiting on a playbook, a meeting, a title."},
    {"at": 25, "text": "Most of what blocks you was made up."},
    {"at": 45, "text": "A quota is real. A policy is real."},
    {"at": 75, "text": "A person wrote it. Do it wrong and the work stops."},
    {"at": 105, "text": "Gravity is a law. God made that."},
    {"at": 130, "text": "A person made it. A person can change it."},
    {"at": 234, "text": "Why they wrote it. What started it. What they left out. What is best now. What to keep."},
    {"at": 370, "text": "Name why it is 60. Then ask if 30 or five would do."},
    {"at": 503, "text": "Waiting is failure. Vandal is failure. Start, then ask."},
    {"at": 595, "text": "Look at the problem. Then take the next step."},
  ],
  "scenes": [
    {"id": "s1", "label": "The Waiting Trap", "in": 0, "out": 25, "x": 72, "y": 160, "scale": 1, "motion": "spring", "text": "Waiting on a playbook, a meeting, a title."},
    {"id": "s2", "label": "You Can Just Do Things", "in": 25, "out": 45, "x": 72, "y": 160, "scale": 1, "motion": "interpolate", "text": "Most of what blocks you was made up."},
    {"id": "s3", "label": "Made Up Is Not Fake", "in": 45, "out": 75, "x": 72, "y": 160, "scale": 1, "motion": "spring", "text": "A quota is real. A policy is real."},
    {"id": "s4", "label": "Authored Rules Have Consequences", "in": 75, "out": 105, "x": 72, "y": 160, "scale": 1, "motion": "interpolate", "text": "A person wrote it. Do it wrong and the work stops."},
    {"id": "s5", "label": "Contrast With Natural Laws", "in": 105, "out": 130, "x": 72, "y": 160, "scale": 1, "motion": "spring", "text": "Gravity is a law. God made that."},
    {"id": "s6", "label": "That's How We've Always Done It", "in": 130, "out": 234, "x": 72, "y": 160, "scale": 1, "motion": "interpolate", "text": "A person made it. A person can change it."},
    {"id": "s7", "label": "Ask Five Questions", "in": 234, "out": 370, "x": 72, "y": 160, "scale": 1, "motion": "spring", "text": "Why they wrote it. What started it. What they left out. What is best now. What to keep."},
    {"id": "s8", "label": "The 60 Days", "in": 370, "out": 503, "x": 72, "y": 160, "scale": 1, "motion": "interpolate", "text": "Name why it is 60. Then ask if 30 or five would do."},
    {"id": "s9", "label": "Two Sides", "in": 503, "out": 595, "x": 72, "y": 160, "scale": 1, "motion": "spring", "text": "Waiting is failure. Vandal is failure. Start, then ask."},
    {"id": "s10", "label": "God's Law or a Memo", "in": 595, "out": 651.878, "x": 72, "y": 160, "scale": 1, "motion": "interpolate", "text": "Look at the problem. Then take the next step."},
  ],
  "durationSec": 651.878,
  "phrases": phrases,
  "introSec": 7.5,
  "lessonTitle": "You Can Just Do Things",
}
Path("/opt/fieldschool-video/edit/jobs/3c9fe86f6dee81299337e318cfef6982/vox-props.json").write_text(json.dumps(props))
print("phrases", len(phrases), "props bytes", Path("/opt/fieldschool-video/edit/jobs/3c9fe86f6dee81299337e318cfef6982/vox-props.json").stat().st_size)
PY

echo setup_ok
