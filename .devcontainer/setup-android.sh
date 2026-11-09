#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
sudo mkdir -p /opt/android-sdk/cmdline-tools
sudo chown -R "$(id -u):$(id -g)" /opt/android-sdk
if [ ! -x /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager ]; then
  curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/android-commandline.zip
  python3 -c "import zipfile;zipfile.ZipFile('/tmp/android-commandline.zip').extractall('/opt/android-sdk/cmdline-tools/latest')"
  chmod -R u+rx /opt/android-sdk/cmdline-tools/latest/bin
fi
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
yes | /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses >/dev/null || true
/opt/android-sdk/cmdline-tools/latest/bin/sdkmanager 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0' 'build-tools;35.0.0'
mkdir -p /workspaces/.gradle
printf 'sdk.dir=/opt/android-sdk
' > Android迁移原生开发/local.properties
