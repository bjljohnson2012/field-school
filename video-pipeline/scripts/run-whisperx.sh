#!/bin/sh
# WhisperX align. transcribe() word times are not the clock; this CLI aligns.
# CPU: small / int8. Silero VAD avoids a Hugging Face token (pyannote).
set -eu
audio="${1:?enhanced wav}"
outdir="${2:?output dir}"
whisperx "$audio" \
  --model small \
  --language en \
  --device cpu \
  --compute_type int8 \
  --vad_method silero \
  --output_dir "$outdir" \
  --output_format json
