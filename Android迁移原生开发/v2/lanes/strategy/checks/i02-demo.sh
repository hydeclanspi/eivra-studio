#!/usr/bin/env bash
# Host-JVM test only. No Android emulator, remote writes, synthetic matches or app data directory.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd); lane=$(cd "$here/.." && pwd); v2=$(cd "$lane/../.." && pwd)
tmp=$(mktemp -d); trap 'rm -rf -- "$tmp"' EXIT
pin=e02d8e90533eea1b12fdccb1777e4bfd6f8f90c5
curl --proto '=https' -fsSL --max-time 50 "https://codeload.github.com/hydeclanspi/eivra-studio/tar.gz/$pin" -o "$tmp/platform.tar.gz"
mkdir "$tmp/src"; tar -xzf "$tmp/platform.tar.gz" --strip-components=1 -C "$tmp/src"
p="$tmp/src/Android迁移原生开发/v2/lanes/platform"; store="$p/kotlin/com/eivra/studio/v2/platform/LocalPorts.kt"
printf '%s  %s\n' a79b05ef2fe90f0ffb91d0328ad6f41879ba2fc8f191c07e4b1d2dfb81148929 "$store" | sha256sum -c -
(cd "$p" && npm ci --ignore-scripts --no-audit --no-fund --omit=optional && node kernel/build.cjs)
kernel="$p/assets/platform-kernel.js"; printf '%s  %s\n' 65f64c55aa01abb855b56e758ec2307e569b6ce223fd20d6802197673dbf96d9 "$kernel" | sha256sum -c -
# Prefer the org.json jar that the running app's JUnit suite already resolved.
json=${1:-}; if [[ ! -f "$json" ]]; then json="$tmp/json.jar"; curl --proto '=https' -fsSL --max-time 40 https://repo.maven.apache.org/maven2/org/json/json/20240303/json-20240303.jar -o "$json"; fi
kc=$(readlink -f "$(command -v kotlinc)"); kh=$(dirname "$(dirname "$kc")"); cp="$json:$kh/lib/kotlinx-coroutines-core-jvm.jar"; test -s "$kh/lib/kotlinx-coroutines-core-jvm.jar"
ledger=59c13258620168f223e626840fc9d526af9bdeed
curl --proto '=https' -fsSL --max-time 50 "https://codeload.github.com/hydeclanspi/eivra-studio/tar.gz/$ledger" -o "$tmp/ledger.tar.gz"
mkdir "$tmp/new"; tar -xzf "$tmp/ledger.tar.gz" --strip-components=1 -C "$tmp/new"
l="$tmp/new/Android迁移原生开发/v2/lanes/ledger/kotlin/com/eivra/studio/v2/ledger"
"$kc" "$v2/app/src/main/java/com/eivra/studio/v2/api/Studio.kt" "$lane/kotlin/com/eivra/studio/v2/strategy/StrategyData.kt" "$l/Ticket.kt" "$l/LedgerGateway.kt" "$store" "$here/I02Demo.kt" -cp "$cp" -include-runtime -d "$tmp/check.jar"
java -cp "$tmp/check.jar:$cp" com.eivra.studio.v2.strategy.I02DemoKt "$kernel" "$tmp/demo-store"
