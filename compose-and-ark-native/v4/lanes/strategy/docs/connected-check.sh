#!/usr/bin/env bash
# Only use a dedicated disposable emulator. No owner data, global checkout, or CI mutation.
set -euo pipefail
: "${ANDROID_SERIAL:?Set the serial of the disposable emulator}"
[[ "$ANDROID_SERIAL" == emulator-* ]] || { echo 'Emulator only.' >&2; exit 2; }
cd "$(dirname "$0")/../../.."
out="$PWD/app/build/strategy-evidence"; mkdir -p "$out"
oldsize=$(adb shell wm size | sed -n 's/Override size: //p' | tr -d '\r'); olddpi=$(adb shell wm density | sed -n 's/Override density: //p' | tr -d '\r')
trap 'adb shell wm size "${oldsize:-reset}"; adb shell wm density "${olddpi:-reset}"' EXIT
bash gradlew :app:assembleDebug :app:assembleDebugAndroidTest
adb install -r -t app/build/outputs/apk/debug/app-debug.apk >/dev/null
adb install -r -t app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk >/dev/null
for size in 390x844 1280x800; do
  adb shell wm size "$size"; adb shell wm density 160; d="$out/$size"; mkdir -p "$d"
  { adb shell wm size; adb shell wm density; adb shell settings get system font_scale; adb shell getprop ro.build.fingerprint; adb shell dumpsys window displays | grep -E 'mDisplayFrames|InsetsSource' || true; } > "$d/device.txt"
  adb shell am instrument -w -r -e class com.eivra.studio.v2.strategy.StrategyFlowTest -e strategyShots 1 com.eivra.studio.v2.test/androidx.test.runner.AndroidJUnitRunner | tee "$d/instrumentation.txt"
  grep -Eq 'OK \(2 tests\)' "$d/instrumentation.txt"
  for shot in portfolio-pool portfolio-infeasible portfolio-inspect quants-editor quants-insufficient; do
    adb exec-out run-as com.eivra.studio.v2 cat "files/strategy-evidence/$shot.png" > "$d/$shot.png"
    python3 -c 'import sys;assert open(sys.argv[1],"rb").read(8)==b"\x89PNG\r\n\x1a\n"' "$d/$shot.png"
  done
done
