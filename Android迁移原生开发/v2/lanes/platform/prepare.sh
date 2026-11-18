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
