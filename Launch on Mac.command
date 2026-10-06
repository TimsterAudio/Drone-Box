#!/bin/bash
# Launches Drone Box in a clean, stand-alone window (no toolbar, address bar,
# tabs or bookmarks) using a Chromium-based browser's "app mode".
# The window is 1920x930, which leaves a 1920x900 page area under the title bar.
#
# Browser choice: your default browser if it's Chromium-based (Chrome, Edge,
# Brave, Vivaldi, Chromium); otherwise the first of Chrome, Edge or Brave installed.
cd "$(dirname "$0")"
DIR="$(pwd)"
INDEX="file://$DIR/drone-box.html"
ARGS=(--app="$INDEX" --window-size=1920,930 --window-position=0,0 --no-first-run --no-default-browser-check)

# 1. Your default browser (the app registered for https links), by bundle id.
DEFAULT_ID=$(defaults read com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers 2>/dev/null \
  | awk '/LSHandlerRoleAll/ { v = $3; gsub(/[";]/, "", v) } /LSHandlerURLScheme = https;/ { print v; exit }')
case "$(printf '%s' "$DEFAULT_ID" | tr '[:upper:]' '[:lower:]')" in
  com.google.chrome|com.microsoft.edgemac|com.brave.browser|com.vivaldi.vivaldi|org.chromium.chromium)
    open -nb "$DEFAULT_ID" --args "${ARGS[@]}" && exit 0 ;;
esac

# 2. Otherwise the first Chromium-based browser installed.
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
