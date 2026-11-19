#!/usr/bin/env bash
# Run only in a disposable emulator. Never clear/uninstall an existing user's app or use an owner's workspace.
set -Eeuo pipefail
cd -- "$(dirname "$0")"
[[ "$(adb get-serialno)" == emulator-* ]] && [[ "$(adb shell getprop ro.kernel.qemu | tr -d '\r')" == 1 ]] || { echo 'Disposable emulator required' >&2; exit 1; }
out=app/build/shell-evidence; mkdir -p "$out"
pkg=com.eivra.studio.v2.v41; component="$pkg/com.eivra.studio.v2.MainActivity"; suite=com.eivra.studio.v2
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell pm path "$pkg" | grep -q '^package:'
instrument(){
  local class="$1" file="$2"; shift 2
  adb shell am instrument -w -r -e class "$class" -e studioViewport "$view" "$@" "$pkg.test/androidx.test.runner.AndroidJUnitRunner" | tee "$dir/$file.txt"
  grep -Eq 'OK \([1-9][0-9]* tests?\)' "$dir/$file.txt" && ! grep -Eq 'FAILURES!!!|INSTRUMENTATION_FAILED|shortMsg=' "$dir/$file.txt"
}
pull_app(){ local f="$1" name="$2"; if adb shell run-as "$pkg" test -s "files/$f"; then adb exec-out run-as "$pkg" cat "files/$f" > "$dir/$name"; fi; }
ready(){
  for n in {1..10}; do
    adb shell uiautomator dump /sdcard/eivra-ready.xml >/dev/null || true
    adb exec-out cat /sdcard/eivra-ready.xml > "$dir/window.xml" || true
    if grep -Fq "package=\"$pkg\"" "$dir/window.xml" && grep -q 'Quick Input' "$dir/window.xml" && grep -q '新建投资' "$dir/window.xml"; then return 0; fi
    sleep 1
  done
  return 1
}
viewport(){
  dir="$out/$view";mkdir -p "$dir";adb shell wm size "$view";adb shell wm density 160;adb shell settings put system font_scale 1.0;adb shell wm dismiss-keyguard
  { adb shell wm size;adb shell wm density;adb shell settings get system font_scale;adb shell getprop ro.build.version.sdk; } > "$dir/environment.txt"
  for n in 1 2 3;do adb shell am start -S -W -n "$component" > "$dir/start-$n.txt";grep -q 'Status: ok' "$dir/start-$n.txt";sleep .6;done
  ready;adb exec-out screencap -p > "$dir/new-native.png"
  python3 - "$dir/new-native.png" "$view" <<'PY'
import struct,sys
b=open(sys.argv[1],'rb').read(24);assert b[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',b[16:24])==tuple(map(int,sys.argv[2].split('x')))
PY
  local ledger=0 others=0
  instrument "$suite.IntegratedLedgerJourney" ledger-instrumentation -e eivraDisposableDemo true || ledger=1
  adb logcat -d -s EivraGate:I '*:S' > "$dir/gate-log.txt" || true
  for f in i03-gate.txt i03-gate.png; do pull_app "$f" "$f";done
  if [[ $ledger == 0 ]];then
    adb logcat -d -s EivraJourney:I '*:S' | grep -F "viewport=$view demo-only" | grep -F 'score=2-1 revenue=20 frozen=true' | tail -n 1 > "$dir/ledger-result.txt"
    test -s "$dir/ledger-result.txt";pull_app "history-$view.png" history-settled.png;test -s "$dir/history-settled.png"
    adb shell am force-stop "$pkg"
    instrument "$suite.ColdLedgerRead" cold-read -e eivraDisposableDemo true || ledger=1
    adb logcat -d -s EivraCold:I '*:S' | grep -F "viewport=$view new-process=true" | tail -1 > "$dir/cold-result.txt" || ledger=1
  fi
  instrument "$suite.NavigationSmoke" host-instrumentation || others=1
  adb logcat -d -s EivraHostStats:I '*:S' | grep "viewport=$view " > "$dir/frame-sample.txt" || true
  instrument "$suite.PolishViews" polish-tests || others=1
  for k in new-controls combo-loaded combo-expanded quants-lab quants-research quants-library quants-forward quants-data overview seasons records console console-git-demo;do pull_app "polish-$view/$k.png" "$k-native.png";pull_app "polish-$view/$k.txt" "$k-tree.txt";done
  test -s "$dir/combo-loaded-native.png" || others=1
  instrument "$suite.platform.V4ReadTiming" ports-timing || others=1;pull_app "v4-perf-$view.json" v4-read-timing.json
  if [[ $view == 390x844 ]];then instrument "$suite.platform.PackedPortfolioTest" portfolio-draft || others=1;fi
  instrument "$suite.V41Acceptance#quickOptics" quick-optics -e eivraDisposableDemo true || others=1
  adb shell settings put global animator_duration_scale 1
  instrument "$suite.V41Acceptance#actualSolveShowsMovingPrismAndRail" solve-motion -e eivraDisposableDemo true || others=1
  adb shell settings put global animator_duration_scale 0
  instrument "$suite.V41Acceptance#newSeasonAndCancel" season-write -e eivraDisposableDemo true || others=1
  adb shell am force-stop "$pkg"
  instrument "$suite.V41Acceptance#coldSeason" season-cold -e eivraDisposableDemo true || others=1
  mkdir -p "$dir/v41";adb exec-out run-as "$pkg" tar -C "files/v41-$view" -cf - . | tar -C "$dir/v41" -xf - || others=1
  python3 tools/v41-motion-proof.py "$dir/v41" || others=1
  [[ $ledger == 0 && $others == 0 ]]
}
fail=0
for view in 390x844 1280x800; do
  set +e
  (set -Eeuo pipefail; viewport)
  rc=$?;set -e; if [[ $rc != 0 ]];then fail=1;fi
done
exit "$fail"
