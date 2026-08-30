#!/usr/bin/env bash
set -euo pipefail
ROOT="${FS_REMOTION:-/opt/fieldschool-edit/remotion}"
EP="$ROOT/public/episodes/everything-made-up"
JOB_WORDS="/opt/fieldschool-video/edit/jobs/j013r823wx9ecaf/words.json"
mkdir -p "$EP/stills" "$EP/whisperx" "$ROOT/out/everything-made-up" "$ROOT/public/sfx" "$ROOT/public/brand"

if [[ ! -e "$EP/cam.mp4" ]]; then
  ln -sfn "$ROOT/public/a_roll.mp4" "$EP/cam.mp4"
fi

if [[ ! -f "$EP/vo.wav" ]]; then
  ffmpeg -y -i "$EP/cam.mp4" -vn -af "highpass=f=80,afftdn,acompressor=threshold=-18dB:ratio=3:attack=5:release=50,loudnorm=I=-16:TP=-1.5:LRA=11" "$EP/vo.wav"
fi

if [[ ! -f "$EP/whisperx/vo.json" ]]; then
  if [[ -x /opt/fieldschool-edit/whisperx-venv/bin/whisperx ]]; then
    /opt/fieldschool-edit/whisperx-venv/bin/whisperx "$EP/vo.wav" --model small --language en --device cpu --compute_type int8 --output_dir "$EP/whisperx" --output_format json
  elif [[ -f "$JOB_WORDS" ]]; then
    echo "whisperx missing, using job words.json"
  fi
fi

python3 "$ROOT/scripts/make_madeup_sfx.py"
python3 "$ROOT/scripts/snap_madeup.py"
echo INGEST_OK
