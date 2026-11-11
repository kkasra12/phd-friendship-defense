#!/usr/bin/env bash
# Regenerate assets/photos.json from the image files in assets/photos/.
# Order: natural sort by filename (001.jpg, 002.jpg, 010.jpg, …).
# Usage: tools/update_photos_json.sh   (run from anywhere)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dir="$root/assets/photos"
out="$root/assets/photos.json"

find "$dir" -maxdepth 1 -type f \
  \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \
     -o -iname '*.gif' -o -iname '*.avif' -o -iname '*.svg' \) \
  -printf '%f\n' \
  | LC_ALL=C sort -V \
  | jq -R . | jq -s '{photos: .}' > "$out"

echo "Wrote $(jq '.photos | length' "$out") photos to ${out#"$root"/}"
