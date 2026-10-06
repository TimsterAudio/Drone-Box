#!/bin/bash
# Launches Drone Box in a clean, stand-alone window (no toolbar, address bar,
# tabs or bookmarks) using a Chromium-based browser's "app mode".
# The window is 1920x930, which leaves a 1920x900 page area under the title bar.
cd "$(dirname "$0")"
DIR="$(pwd)"
INDEX="file://$DIR/drone-box.html"
ARGS=(--app="$INDEX" --window-size=1920,930 --window-position=0,0)

echo "Drone Box launcher: looking for a Chromium-based browser..."

# 1. Common binary names on PATH
for browser in google-chrome google-chrome-stable chromium chromium-browser \
               microsoft-edge microsoft-edge-stable brave-browser brave \
               vivaldi vivaldi-stable; do
  if command -v "$browser" >/dev/null 2>&1; then
    echo "Found '$browser', launching."
    "$browser" "${ARGS[@]}" >/dev/null 2>&1 &
    exit 0
  fi
done

# 2. Flatpak installs
if command -v flatpak >/dev/null 2>&1; then
  for app_id in org.chromium.Chromium com.google.Chrome com.microsoft.Edge com.brave.Browser com.vivaldi.Vivaldi; do
    if flatpak list --app 2>/dev/null | grep -qi "$app_id"; then
      echo "Found Flatpak app '$app_id', launching."
      flatpak run "$app_id" "${ARGS[@]}" >/dev/null 2>&1 &
      exit 0
    fi
  done
fi

# 3. Snap installs
if command -v snap >/dev/null 2>&1; then
  if snap list 2>/dev/null | grep -qi "^chromium "; then
    echo "Found Snap package 'chromium', launching."
    chromium "${ARGS[@]}" >/dev/null 2>&1 &
    exit 0
  fi
fi

# 4. Nothing Chromium-based: fall back to the default browser
echo ""
echo "No Chromium-based browser (Chrome, Chromium, Edge, Brave, Vivaldi) was found"
echo "on PATH, Flatpak or Snap. Opening in your default browser instead. It will show"
echo "normal browser controls, because only Chromium-based browsers have 'app mode'."
echo ""
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$INDEX"
elif command -v firefox >/dev/null 2>&1; then
  firefox "$INDEX"
else
  echo "Could not find xdg-open or firefox either. Open this file in any browser:"
  echo "  $DIR/drone-box.html"
fi
echo ""
read -p "Press Enter to close this window..."
