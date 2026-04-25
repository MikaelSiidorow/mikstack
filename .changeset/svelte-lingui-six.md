---
"@mikstack/svelte-lingui": minor
---

Support Lingui 6: widen `@lingui/message-utils` dependency range to `^5.0.0 || ^6.0.0`. Lingui 6 keeps the `generateMessageId` and `compileMessage` APIs we depend on, so no source changes were required. Tested against `@lingui/core@6.0.0`.
