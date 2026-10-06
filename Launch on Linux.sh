#!/bin/bash
# Launches Drone Box in a clean, stand-alone window (no toolbar, address bar,
# tabs or bookmarks) using a Chromium-based browser's "app mode".
# The window is 1920x930, which leaves a 1920x900 page area under the title bar.
#
# Browser choice: your default browser if it's Chromium-based; otherwise the first
# Chromium-based browser found on PATH, then Flatpak, then Snap.
cd "$(dirname "$0")"
DIR="$(pwd)"
INDEX="file://$DIR/drone-box.html"
ARGS=(--app="$INDEX" --window-size=1920,930 --window-position=0,0 --no-first-run --no-default-browser-check)

echo "Drone Box launcher: looking for a Chromium-based browser..."

# 1. Your default browser, if it's Chromium-based.
DEFAULT_DESKTOP=$(xdg-settings get default-web-browser 2>/dev/null)
case "$DEFAULT_DESKTOP" in
  google-chrome*.desktop|chromium*.desktop|microsoft-edge*.desktop|brave-browser*.desktop|vivaldi*.desktop)
    bin="${DEFAULT_DESKTOP%.desktop}"
    if command -v "$bin" >/dev/null 2>&1; then
      echo "Using your default browser '$bin'."
      "$bin" "${ARGS[@]}" >/dev/null 2>&1 &
      exit 0
    fi ;;
  com.google.Chrome.desktop|org.chromium.Chromium.desktop|com.microsoft.Edge.desktop|com.brave.Browser.desktop|com.vivaldi.Vivaldi.desktop)
    if command -v flatpak >/dev/null 2>&1; then
      echo "Using your default browser (Flatpak '${DEFAULT_DESKTOP%.desktop}')."
      flatpak run "${DEFAULT_DESKTOP%.desktop}" "${ARGS[@]}" >/dev/null 2>&1 &
      exit 0
    fi ;;
  chromium_chromium.desktop)
    if command -v snap >/dev/null 2>&1; then
      echo "Using your default browser (Snap 'chromium')."
      snap run chromium "${ARGS[@]}" >/dev/null 2>&1 &
      exit 0
    fi ;;
esac

# 2. Common binary names on PATH
for browser in google-chrome google-chrome-stable chromium chromium-browser \
               microsoft-edge microsoft-edge-stable brave-browser brave \
               vivaldi vivaldi-stable; do
  if command -v "$browser" >/dev/null 2>&1; then
    echo "Found '$browser', launching."
    "$browser" "${ARGS[@]}" >/dev/null 2>&1 &
    exit 0
  fi
done

# 3. Flatpak installs
if command -v flatpak >/dev/null 2>&1; then
  for app_id in org.chromium.Chromium com.google.Chrome com.microsoft.Edge com.brave.Browser com.vivaldi.Vivaldi; do
    if flatpak list --app 2>/dev/null | grep -qi "$app_id"; then
      echo "Found Flatpak app '$app_id', launching."
      flatpak run "$app_id" "${ARGS[@]}" >/dev/null 2>&1 &
      exit 0
    fi
  done
fi

# 4. Snap installs
if command -v snap >/dev/null 2>&1; then
  if snap list 2>/dev/null | grep -qi "^chromium "; then
    echo "Found Snap package 'chromium', launching."
    snap run chromium "${ARGS[@]}" >/dev/null 2>&1 &
    exit 0
  fi
fi

# 5. Nothing Chromium-based: fall back to the default browser
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
