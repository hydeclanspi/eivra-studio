#!/usr/bin/env bash
set -euo pipefail
cd "$GITHUB_WORKSPACE"
mkdir -p Android迁移原生开发/app/build/outputs/native-screenshots
adb install -r Android迁移原生开发/app/build/outputs/apk/debug/app-debug.apk
adb shell monkey -p com.eivra.studio 1
for i in $(seq 1 30); do
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  if adb shell cat /sdcard/window.xml 2>/dev/null | grep -q 'workspace-ready'; then break; fi
  sleep 1
done
adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp' || true
adb exec-out screencap -p > Android迁移原生开发/app/build/outputs/native-screenshots/native-new.png || true
# Use the actual viewport, not fixed 320x640 coordinates. Every capture is nonempty.
capture() { adb exec-out screencap -p > "Android迁移原生开发/app/build/outputs/native-screenshots/$1.png"; test -s "Android迁移原生开发/app/build/outputs/native-screenshots/$1.png"; }
tap() { adb shell input tap "$1" "$2" >/dev/null; }
read -r WIDTH HEIGHT <<< "$(adb shell wm size | tail -1 | sed -E 's/.*: ([0-9]+)x([0-9]+).*/\1 \2/')"
CENTER=$((WIDTH / 2)); BOTTOM=$((HEIGHT - 40))
capture native-new
tap $((WIDTH * 3 / 10)) "$BOTTOM"
sleep 3
capture native-portfolio
tap $((WIDTH * 7 / 10)) "$BOTTOM"
sleep 8
capture native-dashboard
tap $((WIDTH * 9 / 10)) "$BOTTOM"
sleep 1
tap "$CENTER" $((HEIGHT / 2))
sleep 2
capture native-history
ls -l Android迁移原生开发/app/build/outputs/native-screenshots
