#!/usr/bin/env bash
# Only build/test time uses npm. Runtime has neither a cloud client nor a network transport.
set -euo pipefail
lane=$(cd "$(dirname "$0")" && pwd)
cd "$lane"
npm ci --ignore-scripts --no-audit --no-fund --omit=optional
node kernel/build.cjs
if test -f checks/golden.cjs; then node checks/golden.cjs; fi
# Test-only host JNI. Never linked into the app; identical cashapp QuickJS release as Android.
mkdir -p .cache
jar=.cache/quickjs-jvm-0.9.2.jar
if ! test -f "$jar"; then curl -fsSL https://repo.maven.apache.org/maven2/app/cash/quickjs/quickjs-jvm/0.9.2/quickjs-jvm-0.9.2.jar -o "$jar"; fi
printf '%s  %s\n' 69dd85591cd54bc1c725d21814767e759fc9c438f972857f5224cc5d26d106ec "$jar" | sha256sum -c -
if test "$(uname -s)" = Linux; then
  unzip -p "$jar" libquickjs.so > .cache/libquickjs.so
  if ldd .cache/libquickjs.so | grep -q 'not found'; then
    # Ubuntu 24.04 JVM test runtime only, unpack under this lane without sudo/system installation.
    mkdir -p .cache/deb .cache/host
    (cd .cache/deb && apt-get download libc++1-18 libc++abi1-18 libunwind-18)
    for deb in .cache/deb/*.deb; do dpkg-deb -x "$deb" .cache/host; done
  fi
  export LD_LIBRARY_PATH="$PWD/.cache/host/usr/lib/x86_64-linux-gnu:$PWD/.cache/host/usr/lib/llvm-18/lib:${LD_LIBRARY_PATH:-}"
  ldd .cache/libquickjs.so
fi
# Fail here with the actual loader/parser error, not just a later Gradle assertion line.
printf '%s\n' '{"mode":"owner","op":"params.get","args":[]}' | java -cp "$jar" checks/KernelCli.java assets/platform-kernel.js checks/fixed-clock.js smoke >/dev/null

# Lane CI: test the bytes in the actual application APK, not just Rollup's output.
# Integration builds may invoke checks/verify-apk.sh after assembling their own APK.
if [[ ${GITHUB_ACTIONS:-} == true && ${GITHUB_REF:-} == refs/heads/android-v2/platform ]]; then
  (cd ../.. && bash gradlew :app:assembleDebug)
  bash checks/verify-apk.sh ../../app/build/outputs/apk/debug/app-debug.apk
  printf 'EIVRA_VERIFIED_KERNEL=%s/.cache/verified-apk-kernel.js\n' "$lane" >> "$GITHUB_ENV"
fi
