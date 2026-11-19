#!/usr/bin/env bash
set -euo pipefail
root=$PWD; n=compose-and-ark-native; prev="$root/$n/archive/android-v4.1/Eivra-Studio-v4.1-7047c3b.apk"
bt=$(find "$ANDROID_HOME/build-tools" -maxdepth 2 -name apksigner | sort -V | tail -1); test -x "$bt"
mkdir -p "$root/paired"
cd "$n/v4"
bash lanes/platform/prepare.sh
bash gradlew --stacktrace :app:testDebugUnitTest :app:assembleDebug
apk=app/build/outputs/apk/debug/app-debug.apk
cert() { "$bt" verify --print-certs "$1" | sed -n 's/^Signer #1 certificate SHA-256 digest: //p'; }
old=$(cert "$prev"); new=$(cert "$apk"); [[ $old =~ ^[0-9a-f]{64}$ && $new =~ ^[0-9a-f]{64}$ ]]; test "$old" = 16ba3605227dbaccb46424a928cab267b8aec5b0ea7d9bc1ef43d94c008af922
if [[ $old != "$new" ]]; then
  bash gradlew -PeivraArkSideBySide=true --stacktrace :app:assembleDebug
fi
cp "$apk" "$root/paired/Eivra-Studio-v4.1-Ark-icon.apk"
cd "$root"
python3 .github/ark-pair/verify.py "$(dirname "$bt")"
