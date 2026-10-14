#!/bin/sh
# Enhance VO before WhisperX align.
# Chain from CURSOR_FOLLOWUP.md: highpass 80, lowpass 12k, afftdn, compressor, loudnorm I=-16.
# 48 kHz keeps the 12 kHz lowpass under Nyquist.
set -eu
in="${1:?input audio or video}"
out="${2:?output wav}"
ffmpeg -y -i "$in" -vn -ac 1 -ar 48000 \
  -af "highpass=f=80,lowpass=f=12000,afftdn=nr=12:nf=-25,acompressor=threshold=-18dB:ratio=3:attack=5:release=80:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=11" \
  "$out"
