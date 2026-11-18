#!/usr/bin/env bash
# Only build/test time uses npm. Runtime has neither a cloud client nor a network transport.
set -euo pipefail
lane=$(cd "$(dirname "$0")" && pwd)
cd "$lane"
npm ci --ignore-scripts --no-audit --no-fund --omit=optional
node kernel/build.cjs
if test -f checks/golden.cjs; then node checks/golden.cjs; fi
