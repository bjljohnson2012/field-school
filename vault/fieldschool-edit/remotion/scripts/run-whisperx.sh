#!/bin/bash
set -euo pipefail
WAV=${1:-/opt/fieldschool-edit/remotion/public/vo.wav}
OUT=${2:-/opt/fieldschool-edit/remotion/public/whisperx}
mkdir -p "$OUT"
WX=${WHISPERX_BIN:-/opt/fieldschool-edit/whisperx-venv/bin/whisperx}
if [ ! -x "$WX" ]; then
  echo "whisperx_missing" >&2
  exit 2
fi
"$WX" "$WAV" --model small --language en --device cpu --compute_type int8 --output_dir "$OUT" --output_format json
echo "$OUT"
