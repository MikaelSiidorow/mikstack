---
"create-mikstack": patch
"@mikstack/ui": patch
---

Fix follow-up issues in vendor-mode scaffolds:

- update the `Switch` component to use `clip-path` instead of deprecated `clip`
- disable SSR in the generated app template root layout
- initialize Lingui context before route rendering while keeping locale changes reactive
- extend `create-mikstack` CI to run `lint:css` and exercise a vendor-mode `/sign-in` smoke check
