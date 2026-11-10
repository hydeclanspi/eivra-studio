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
# 320x640 smoke viewport: five equal bottom-navigation targets.
adb shell input tap 96 600 >/dev/null || true
sleep 3
adb exec-out screencap -p > Android迁移原生开发/app/build/outputs/native-screenshots/native-portfolio.png || true
adb shell input tap 224 600 >/dev/null || true
sleep 8
adb exec-out screencap -p > Android迁移原生开发/app/build/outputs/native-screenshots/native-dashboard.png || true
adb shell input tap 288 600 >/dev/null || true
sleep 1
adb shell input tap 288 320 >/dev/null || true
sleep 2
adb exec-out screencap -p > Android迁移原生开发/app/build/outputs/native-screenshots/native-history.png || true
ls -l Android迁移原生开发/app/build/outputs/native-screenshots || true
