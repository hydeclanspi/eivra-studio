#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname "$0")"
out=app/build/shell-evidence; mkdir -p "$out"
adb install -r app/build/outputs/apk/debug/app-debug.apk >/dev/null
for viewport in 390x844 1280x800; do
  adb shell wm size "$viewport"; adb shell wm density 160
  adb shell am force-stop com.eivra.studio.v2
  adb shell am start -W -n com.eivra.studio.v2/.MainActivity > "$out/start-$viewport.txt"
  for scan in {1..8}; do
    adb shell uiautomator dump /sdcard/studio-window.xml >/dev/null || true
    adb exec-out cat /sdcard/studio-window.xml > "$out/window-$viewport.xml" || true
    if grep -q 'Eivra Studio' "$out/window-$viewport.xml"; then break; fi
    sleep 1
  done
  grep -q 'Eivra Studio' "$out/window-$viewport.xml"
  adb exec-out screencap -p > "$out/host-$viewport.png"
  { adb shell wm size; adb shell wm density; adb shell settings get system font_scale; } > "$out/env-$viewport.txt"
  bash gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.eivra.studio.v2.NavigationSmoke
  cp -r app/build/outputs/androidTest-results "$out/tests-$viewport"
done
