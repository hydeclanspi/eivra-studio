# Eivra Studio · Compose Native

The native Android application, built in Kotlin with Jetpack Compose, not a web wrapper. The Web application and its Vercel deployment stay in `../eivra-studio/`.

- **[v4/](v4/)** — current project; open this directory in Android Studio. JDK 17 / SDK 36 / Node for the offline engine build.
- **[archive/v1/](archive/v1/)** — unmodified first implementation; frozen tree `b35f09aea4178f9891d9051fb8d39306d89b4d58`.
- **[I03 milestone](https://github.com/hydeclanspi/eivra-studio/tree/6683081d22c9515cae660c1c0057eb5c4fb35714/Android迁移原生开发/v2)** — the complete previously verified UI and save→settle→history implementation. [Original device acceptance](https://github.com/hydeclanspi/eivra-studio/actions/runs/44422829655). No duplicate mutable copy of I03 is needed.

```sh
cd compose-native/v4
bash lanes/platform/prepare.sh
bash gradlew :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest
```

Native CI lives under `.github/workflows/compose-native.yml` (GitHub's required discovery location). Codespaces discovery stays under `.devcontainer/`; its Android setup script lives in this folder. Do not include personal workspaces, session credentials, generated assets, debug keys or APKs in commits.
