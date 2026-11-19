#!/usr/bin/env bash
set -euo pipefail
n=compose-and-ark-native
old=com.eivra.studio.v2.v41
new=$(python3 -c 'import json; print(json.load(open("paired/facts.json"))["package"])')
case "$new" in "$old"|"$old.arkicon") ;; *) exit 2;; esac
adb install "$n/archive/android-v4.1/Eivra-Studio-v4.1-7047c3b.apk"
adb shell run-as "$old" mkdir -p files
adb shell run-as "$old" touch files/ark_pair_ci_marker
if [[ $new == "$old" ]]; then adb install -r paired/Eivra-Studio-v4.1-Ark-icon.apk; else adb install paired/Eivra-Studio-v4.1-Ark-icon.apk; fi
adb shell run-as "$old" ls files/ark_pair_ci_marker
if [[ $new != "$old" ]]; then
 if adb shell run-as "$new" ls files/ark_pair_ci_marker >/dev/null 2>&1; then exit 1; fi
fi
comp=$(adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p "$new" | tr -d '\r' | tail -1)
case "$comp" in "$new/"*) ;; *) echo "Unexpected launcher $comp"; exit 1;; esac
adb shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n "$comp" | tee /tmp/ark-start.txt
grep -F 'Status: ok' /tmp/ark-start.txt
sleep 2
adb shell pidof "$new" | tr -d '\r' | grep -E '[0-9]+'
remote=$(adb shell pm path "$new" | tr -d '\r' | sed -n 's/^package://p' | head -1); test -n "$remote"
adb pull "$remote" /tmp/ark-installed.apk
cmp -s /tmp/ark-installed.apk paired/Eivra-Studio-v4.1-Ark-icon.apk
printf 'API %s; launcher %s; installed APK byte-identical; prior package marker intact\n' "$(adb shell getprop ro.build.version.sdk | tr -d '\r')" "$comp" | tee -a "$GITHUB_STEP_SUMMARY"
