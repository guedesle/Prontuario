#!/usr/bin/env bash
set -euo pipefail
missing=0
for tool in node mysqldump mysql; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "FALTA: $tool"
    missing=1
  else
    echo "OK: $tool -> $(command -v "$tool")"
  fi
done
exit "$missing"
