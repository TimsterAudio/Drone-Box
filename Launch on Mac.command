#!/bin/bash
# Launches Drone Box in a clean, stand-alone window (no toolbar, address bar,
# tabs or bookmarks) using a Chromium-based browser's "app mode".
# The window is 1920x930, which leaves a 1920x900 page area under the title bar.
cd "$(dirname "$0")"
DIR="$(pwd)"
INDEX="file://$DIR/drone-box.html"
ARGS=(--app="$INDEX" --window-size=1920,930 --window-position=0,0)

if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args "${ARGS[@]}"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args "${ARGS[@]}"
elif [ -d "/Applications/Brave Browser.app" ]; then
  open -na "Brave Browser" --args "${ARGS[@]}"
else
  echo "No Chrome, Edge or Brave found in /Applications."
  echo "Opening in your default browser instead. It will show normal browser controls."
  sleep 2
  open "$INDEX"
fi
