# Eivra Studio · Compose and Ark Native

| 平台 | 安装包 |
| --- | --- |
| Android · Kotlin / Jetpack Compose · v4.1 | [Eivra-Studio-v4.1-Ark-icon.apk](Eivra-Studio-v4.1-Ark-icon.apk) |
| HarmonyOS · Ark 原生 · 1.0.0 | [Eivra-Studio-Ark Native.hap](Eivra-Studio-Ark%20Native.hap) |

Android 的普通和圆形桌面入口都直接使用鸿蒙 `EntryAbility` 指向的同一张[透明盾牌 PNG](v4/app/src/main/res/mipmap-nodpi/ark_launcher.png)（256 × 256）。原图没有重绘、没有叠底；桌面添加的系统角标、遮罩或留白可能因平台而异。这次不改应用内标记、动效或账本逻辑。

HAP 按提供时的字节收录，未解包重打或重签；其清单标记 `debug=true`。此目录提供鸿蒙安装包，不包含独立的 Ark 源工程，也不代表已经在其他鸿蒙设备上验过签装。两包的 SHA-256 见 [SHA256SUMS](SHA256SUMS)。

## Source and earlier builds

- **[v4/](v4/)** — current Android project. Open in Android Studio; JDK 17 / SDK 36 / Node for the offline engine. The production Web app remains in `../eivra-studio/`.
- **[Previous v4.1 APK](archive/android-v4.1/Eivra-Studio-v4.1-7047c3b.apk)** — the original, unchanged light-icon build (`7047c3b`).
- **[archive/v1/](archive/v1/)** — unmodified first implementation; frozen tree `b35f09aea4178f9891d9051fb8d39306d89b4d58`.
- **[I03 milestone](https://github.com/hydeclanspi/eivra-studio/tree/6683081d22c9515cae660c1c0057eb5c4fb35714/Android迁移原生开发/v2)** — the complete previously verified UI and save→settle→history implementation. [Original device acceptance](https://github.com/hydeclanspi/eivra-studio/actions/runs/44422829655). No duplicate mutable copy of I03 is needed.

```sh
cd compose-and-ark-native/v4
bash lanes/platform/prepare.sh
bash gradlew :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest
```

Android CI lives in [`.github/workflows/compose-native.yml`](../.github/workflows/compose-native.yml). Codespaces uses the Android setup script in `devcontainer/`. Do not commit personal workspaces, session credentials or signing keys. Only the explicitly published packages above belong in the download directory.
