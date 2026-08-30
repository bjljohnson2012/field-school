#!/bin/bash
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
exec "$HERE/prepare_bed.sh" "${1:-/opt/fieldschool-edit/remotion/public/suno.wav}"
