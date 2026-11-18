# Eivra Android build log

## 2026-11-10 · CI 42851118176 / 2905ccc4

- Web lint / Vitest / production build: PASS (job receipt).
- Native engine package and golden tests: PASS.
- Kotlin unit and boundary tests: PASS.
- assembleDebug: PASS.
- Four real Android emulator tests: PASS.
  - New → Portfolio → Dashboard → back history.
  - unrated Conf rejected rather than replaced with 0.5.
  - Activity recreation preserves draft and route.
  - History lazy list exposes Entries, Conf, honest legacy forecast state and settlement timestamps.
- This is a core native UI gate, not full feature, visual, performance or device acceptance.
