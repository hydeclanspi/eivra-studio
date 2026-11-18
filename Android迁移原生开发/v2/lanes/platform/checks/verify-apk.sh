#!/usr/bin/env bash
# Pass the APPLICATION APK (not the androidTest APK); never modify it.
set -euo pipefail
apk=$(realpath "${1:?usage: verify-apk.sh app-debug.apk}")
cd "$(dirname "$0")/.."
mkdir -p .cache
unzip -p "$apk" assets/platform-kernel.js > .cache/verified-apk-kernel.js
cmp assets/platform-kernel.js .cache/verified-apk-kernel.js
sha256sum "$apk" assets/platform-kernel.js .cache/verified-apk-kernel.js
node checks/packed-probe.cjs .cache/verified-apk-kernel.js
