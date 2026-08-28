#!/bin/bash
set -euo pipefail
WAV=${1:-/opt/fieldschool-edit/remotion/public/vo.wav}
OUT=${2:-/opt/fieldschool-edit/remotion/public/whisperx}
mkdir -p "$OUT"
if ! command -v whisperx >/dev/null 2>&1; then
  echo "whisperx_missing" >&2
  exit 2
fi
whisperx "$WAV" --model small --language en --device cpu --compute_type int8 --output_dir "$OUT" --output_format json
echo "$OUT"
