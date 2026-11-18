#!/usr/bin/env bash
# From v2. A disposable emulator is required; never retarget an owner's phone.
set -euo pipefail
: "${ANDROID_SERIAL:?Set ANDROID_SERIAL to the disposable emulator id}"
[[ "$ANDROID_SERIAL" == emulator-* ]] && [[ "$(adb shell getprop ro.kernel.qemu | tr -d '\r')" == 1 ]] || { echo 'refusing non-emulator'; exit 2; }
out=${LEDGER_OUT:-app/build/ledger-evidence}; mkdir -p "$out"
bash gradlew --max-workers=2 :app:assembleDebug :app:assembleDebugAndroidTest
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell settings put secure show_ime_with_hard_keyboard 1
adb shell settings put system font_scale 1.0
adb shell input keyevent KEYCODE_WAKEUP; adb shell wm dismiss-keyguard
for wh in 390x844 1280x800; do
  dir="$out/$wh"; mkdir -p "$dir"; adb shell wm density 160; adb shell wm size "$wh"
  (adb shell wm size; adb shell wm density; adb shell settings get system font_scale; adb shell getprop ro.build.version.sdk) > "$dir/env.txt"
  adb shell am instrument -w -r -e class com.eivra.studio.v2.ledger.LedgerJourneyTest com.eivra.studio.v2.test/androidx.test.runner.AndroidJUnitRunner > "$dir/instrumentation.txt"
  # Keep any photos actually produced, including partial results on assertion failure.
  for name in new-empty i02-strategy i02-calibration i02-entries i02-actions-disabled i02-inline-remove pre-filled post-filled odds-ime settle-target; do
    f="files/ledger-evidence/$wh/$name.png"; if adb shell run-as com.eivra.studio.v2 test -s "$f"; then adb exec-out run-as com.eivra.studio.v2 cat "$f" > "$dir/$name.png"; fi
  done
done
for d in "$out"/{390x844,1280x800}; do grep -Eq 'OK \(2 tests\)' "$d/instrumentation.txt" || { echo "Tests did not both pass in $d"; exit 1; }; done
