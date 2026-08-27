#!/usr/bin/env bash
set -u
set -o pipefail

root="http://127.0.0.1:4178"
out="/home/ubuntu/frontend-first-view/qa-run-2026-08-25/reports/mobile-launch-qa-2026-08-27"
mkdir -p "$out"

routes=(
  "home|/"
  "faq|/faq"
  "about|/about"
  "quick-smoke|/learn/quick-smoke-testing"
  "staging|/staging-environment-testing"
)

for item in "${routes[@]}"; do
  name="${item%%|*}"
  path="${item#*|}"
  url="$root$path"
  chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --window-size=390,844 --run-all-compositor-stages-before-draw \
    --virtual-time-budget=2500 --screenshot="$out/$name.png" "$url" \
    >"$out/$name-screenshot.log" 2>&1 || true
  chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --window-size=390,844 --virtual-time-budget=2500 --dump-dom "$url" \
    >"$out/$name.html" 2>"$out/$name-dom.log" || true
  if grep -qi 'preview' "$out/$name.html"; then
    echo "$name: FAIL visible Preview token"
  else
    echo "$name: PASS no Preview token"
  fi
  if grep -q 'Product path' "$out/$name.html"; then
    echo "$name: Product path present"
  fi
done

printf '%s\n' '--- captured files'
find "$out" -maxdepth 1 -type f -printf '%f\n' | sort
