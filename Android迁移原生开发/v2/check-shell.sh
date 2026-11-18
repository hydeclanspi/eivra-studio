#!/usr/bin/env bash
# Run only on the disposable CI emulator; never clear a person's installed workspace.
set -Eeuo pipefail
cd -- "$(dirname "$0")"
out=app/build/shell-evidence; mkdir -p "$out"
pkg=com.eivra.studio.v2; component="$pkg/.MainActivity"
for view in 390x844 1280x800; do
  dir="$out/$view"; mkdir -p "$dir"
  adb shell wm size "$view"; adb shell wm density 160; adb shell settings put system font_scale 1.0
  # connectedAndroidTest/UTP may uninstall the target after a test. Install and verify both packages per viewport.
  adb install -r app/build/outputs/apk/debug/app-debug.apk
  adb install -r app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
  adb shell pm path "$pkg" | grep -q '^package:'
  adb shell wm dismiss-keyguard
  { adb shell wm size; adb shell wm density; adb shell settings get system font_scale; adb shell getprop ro.product.model; adb shell getprop ro.build.version.sdk; } > "$dir/environment.txt"
  for n in 1 2 3; do
    adb shell am start -S -W -n "$component" > "$dir/start-$n.txt"; grep -q 'Status: ok' "$dir/start-$n.txt"; sleep .6
  done
  # Readiness is an actual foreground app node (not the package name in an arbitrary log line).
  ready=false
  for n in {1..8}; do
    adb shell uiautomator dump /sdcard/eivra-host-window.xml >/dev/null || true
    adb exec-out cat /sdcard/eivra-host-window.xml > "$dir/window.xml" || true
    if grep -q 'package="com.eivra.studio.v2"' "$dir/window.xml" && grep -q 'Eivra Studio' "$dir/window.xml"; then
      if ! test -f lanes/platform/assets/platform-kernel.js || { grep -q 'Quick Input' "$dir/window.xml" && grep -q '新建投资' "$dir/window.xml"; }; then ready=true; break; fi
    fi
    sleep 1
  done
  "$ready" || { echo "Foreground window not ready at $view"; exit 1; }
  adb exec-out screencap -p > "$dir/new-native.png"
  python3 - "$dir/new-native.png" "$view" <<'PY'
import struct,sys
p=sys.argv[1];b=open(p,'rb').read(24);assert b[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',b[16:24])==tuple(map(int,sys.argv[2].split('x'))),p
PY
  adb shell am instrument -w -r -e class com.eivra.studio.v2.NavigationSmoke -e studioViewport "$view" "$pkg.test/androidx.test.runner.AndroidJUnitRunner" | tee "$dir/host-instrumentation.txt"
  grep -Eq 'OK \([1-9][0-9]* tests?\)' "$dir/host-instrumentation.txt"
  adb logcat -d -s EivraHostStats:I '*:S' | grep "viewport=$view " > "$dir/frame-sample.txt" || true
  adb shell am instrument -w -r -e class com.eivra.studio.v2.PolishViews -e studioViewport "$view" "$pkg.test/androidx.test.runner.AndroidJUnitRunner" | tee "$dir/polish-tests.txt"
  # Keep diagnostic frames even if a later assertion failed.
  for key in new-controls combo-loaded overview records console; do
    if adb shell run-as "$pkg" test -s "files/polish-$view/$key.png"; then
      adb exec-out run-as "$pkg" cat "files/polish-$view/$key.png" > "$dir/$key-native.png"
      adb exec-out run-as "$pkg" cat "files/polish-$view/$key.txt" > "$dir/$key-tree.txt"
    fi
  done
  grep -Eq 'OK \(1 test\)' "$dir/polish-tests.txt"
  test -s "$dir/combo-loaded-native.png" # real demo candidate, not just a route landmark
  if test -f lanes/platform/assets/platform-kernel.js; then
    # Only the disposable runner gets this argument. A skip or a missing assertion cannot count as a pass.
    adb shell am instrument -w -r -e class com.eivra.studio.v2.IntegratedLedgerJourney -e eivraDisposableDemo true -e studioViewport "$view" "$pkg.test/androidx.test.runner.AndroidJUnitRunner" | tee "$dir/ledger-instrumentation.txt"
    grep -Eq 'OK \(1 test\)' "$dir/ledger-instrumentation.txt"
    adb logcat -d -s EivraJourney:I '*:S' | grep -F "viewport=$view demo-only" | grep -F 'score=2-1 revenue=20 frozen=true' | tail -n 1 > "$dir/ledger-result.txt"
    test -s "$dir/ledger-result.txt"
  fi
done
